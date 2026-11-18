import { computed, inject, ref } from 'vue'
import { subtract } from '@/maropay/money'
import type { Money } from '@/maropay/money'
import { useCommerceStore } from '@/stores/useCommerce'
import { useStoreCampaignsStore } from '@/stores/useStoreCampaigns'
import { useStorefrontCartStore } from '@/stores/useStorefrontCart'
import { codeProblem, discountFor, findByCode, takesCodes } from '@/storefront/campaigns'
import { STOREFRONT } from './storefrontContext'

// The shopper's discount code, for the cart and the checkout: whether the store
// takes one, the code applied, what it takes off the lines on screen, and the
// message when a code can't be used. The code lives with the cart; the rules are
// in src/storefront/campaigns.ts.

interface Line {
  sku: string
  price: string
  qty: number
}

export function useStorefrontDiscount(lines: () => Line[], total: () => Money) {
  const storefront = inject(STOREFRONT)!
  const commerce = useCommerceStore()
  const campaigns = useStoreCampaignsStore()
  const cart = useStorefrontCartStore()
  const channelId = computed(() => storefront.channel.value.id)

  /** The store has a code a shopper could use today: only then is one asked for. */
  const offered = computed(() => takesCodes(campaigns.campaigns, channelId.value))
  const applied = computed(() => cart.codeFor(channelId.value))

  /** What the applied code takes off, or null: no code, a code that has ended since, or nothing it covers. */
  const discount = computed(() => {
    const code = applied.value
    if (!code || codeProblem(campaigns.campaigns, channelId.value, code)) return null
    const covered = lines().map((line) => ({
      price: line.price,
      qty: line.qty,
      collections: commerce.products.find((p) => p.sku === line.sku)?.collections ?? [],
    }))
    return discountFor(covered, findByCode(campaigns.campaigns, channelId.value, code), storefront.currency.value)
  })

  /** What is left to pay. */
  const payable = computed(() => (discount.value ? subtract(total(), discount.value.amount) : total()))

  const typed = ref('')
  const problem = ref<string | null>(null)

  function apply(): void {
    const code = typed.value
    problem.value = codeProblem(campaigns.campaigns, channelId.value, code)
    if (problem.value) return
    cart.setCode(channelId.value, code)
    // A real code that covers nothing in this cart is said, not silently ignored.
    if (!discount.value) {
      problem.value = 'That code doesn’t apply to anything in your cart.'
      cart.setCode(channelId.value, '')
      return
    }
    typed.value = ''
  }

  function remove(): void {
    cart.setCode(channelId.value, '')
    problem.value = null
  }

  return { offered, applied, discount, payable, typed, problem, apply, remove }
}
