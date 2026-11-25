import { computed, type Ref } from 'vue'
import { parseDecimal, type Money } from '@/maropay/money'
import { hasPriceRange, lowestPrice, type CatalogProduct } from '@/storefront/catalog'
import { gridSettings } from '@/storefront/listing'
import { formatStorePrice } from '@/storefront/price'
import { canSearch } from '@/storefront/storeSearch'
import { cheapestSelection } from '@/storefront/variants'
import { optionLayout, purchaseOptions, roundForDisplay, type PurchaseOption, type SubscriptionPlan } from '@/subscriptions/plans'
import { purchaseOptionsSettings, type StoreTheme, type ThemeBlock } from '@/stores/themeBuilderData'
import { useCommerceStore } from '@/stores/useCommerce'
import { useStorefrontStore } from '@/stores/useStorefront'
import { useSubscriptionsStore } from '@/stores/useSubscriptions'
import type { SalesChannel } from '@/stores/useSalesChannels'
import { inStock, previewProducts, storefrontProducts } from '@/views/Storefront/storefrontCatalog'

/** One purchase option as the canvas shows it: its name, price per delivery and saving. */
export interface PurchaseRow { id: string; name: string; price: string; saving: string; first: boolean }

/**
 * The purchase options of one product, for a product template's purchase options block:
 * its plans of one fixed delivery and buying once (`single`), then each plan sold by
 * delivery options under its label (`groups`).
 */
export interface PurchasePreview {
  product: string
  price: string
  /** Its variants differ in price: until a choice is made its page reads "From" before `price`, the lowest. */
  from?: boolean
  single: PurchaseRow[]
  groups: { label: string; saving: string; options: PurchaseRow[] }[]
}

/** The option the page opens on: the subscription's default when the block asks for it, else a preselected plan, else buying once. */
export function purchaseChosenId(block: ThemeBlock, shown: PurchasePreview): string {
  const grouped = shown.groups.flatMap((group) => group.options)
  if (block.settings.defaultSelection === 'Subscription' && grouped.length) return (grouped.find((row) => row.first) ?? grouped[0]!).id
  return (shown.single.find((row) => row.first) ?? shown.single[shown.single.length - 1])?.id ?? ''
}

/** A product's purchase options on the plans it is offered, priced in whole units of the store's currency as its pages show them; none when it is on no plan. */
export function purchasePreviewFor(product: CatalogProduct & { name: string }, plans: SubscriptionPlan[], store: { currency: string; locale?: string }): PurchasePreview | undefined {
  const unit = plans.length ? parseDecimal(lowestPrice(product), store.currency) : null
  if (!unit) return undefined
  const shownAs = (amount: Money) => formatStorePrice(roundForDisplay(amount), store.locale)
  const row = (option: PurchaseOption): PurchaseRow => ({
    id: option.id,
    name: option.name,
    price: shownAs(option.price),
    saving: option.plan?.discountPct ? `Save ${option.plan.discountPct}%` : '',
    first: !!option.plan?.isDefault,
  })
  const layout = optionLayout(purchaseOptions(unit, plans))
  return {
    product: product.name,
    price: shownAs(unit),
    from: hasPriceRange(product),
    single: layout.single.map(row),
    groups: layout.groups.map((group) => ({
      label: group.label,
      saving: group.maxDiscountPct ? `Save up to ${group.maxDiscountPct}%` : '',
      options: group.options.map(row),
    })),
  }
}

/**
 * What StorefrontPreview needs to draw a store as its storefront draws it, for the
 * theme builder, the store page and the Themes page alike: the header's wordmark, menu,
 * search and tools, and whether shoppers can search the store yet (`searchable`, the
 * storefront's own rule: until then the store page and Themes page draw no search); the
 * collection template's card and quick add, which every product row uses; the store's
 * own products with their choices and badges; and the purchase options of its first
 * product on a plan. A store on the shared catalogue keeps the drawn stand-ins, and a
 * store without a crawled header the sample one.
 */
export function useStorefrontPreviewProps(channel: Ref<SalesChannel | undefined>, theme: Ref<StoreTheme | undefined>) {
  const storefronts = useStorefrontStore()
  const commerce = useCommerceStore()
  const subscriptions = useSubscriptionsStore()

  const header = computed(() => ({ ...storefronts.previewHeaderFor(channel.value), ...storefronts.previewChromeFor(channel.value) }))

  /**
   * Each product as its card shows it (previewProducts: its part number or what it comes
   * in, its choices, its struck price), plus the choice it opens on when the theme opens
   * on the lowest-priced one, and its card's badge: Sale, then "Subscribe available" when
   * the theme's purchase options block asks for it and the product is on a plan, then New.
   */
  const products = computed(() => {
    const store = channel.value
    if (!store) return undefined
    const items = previewProducts(commerce.products, store)
    if (!items) return undefined
    const byId = new Map(storefrontProducts(commerce.products, store.id).filter(inStock).map((product) => [product.id, product]))
    const subscribeBadge = purchaseOptionsSettings(theme.value)?.cardBadge === true
    return items.map((item) => {
      const product = byId.get(item.id)
      if (!product) return item
      const onPlan = subscribeBadge && subscriptions.offeredFor(store.id, product.id).length > 0
      return {
        ...item,
        start: cheapestSelection(product),
        badge: item.badge === 'Sale' ? 'Sale' as const : onPlan ? 'Subscribe' as const : item.badge,
      }
    })
  })

  /** The first product a shopper is offered a plan for, with its real prices; none when no product is on an active plan (the canvas then draws an example). */
  const purchase = computed((): PurchasePreview | undefined => {
    const store = channel.value
    const currency = store?.webStore?.currency
    if (!store || !currency) return undefined
    for (const product of storefrontProducts(commerce.products, store.id)) {
      const shown = purchasePreviewFor(product, subscriptions.offeredFor(store.id, product.id), { currency, locale: store.webStore?.locale })
      if (shown) return shown
    }
    return undefined
  })

  return computed(() => {
    const grid = gridSettings(theme.value?.templates.collection)
    return {
      ...header.value,
      searchable: canSearch(channel.value, commerce.products),
      cardStyle: grid.cardStyle,
      quickAdd: grid.quickAdd,
      products: products.value,
      purchase: purchase.value,
    }
  })
}
