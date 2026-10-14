<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MaropayMethodMark from '@/components/maropay/MaropayMethodMark.vue'
import { useToast } from '@/composables/useToast'
import { useMaropayStore } from '@/stores/useMaropay'
import { markFor } from '@/maropay/methodMarks'
import type { MethodMarkId } from '@/maropay/methodMarks'
import { formatMoney, money } from '@/maropay/money'
import { PAY_BUTTON_LABELS } from '@/maropay/model'
import type { PayButtonLabel, PaymentMethodCatalogEntry } from '@/maropay/model'
import { EXPRESS_IDS, MAROPAY_SHOPPER_LABEL, orderedCheckoutMethods } from '@/maropay/storefront'
import type { CheckoutOptionsPatch } from '@/services/maropay/mockAdapter'

// How a store's methods appear to shoppers — express buttons, the pay button's
// words, the default and the order — on its product pages, cart and checkout.
// The "What shoppers see" preview beside it follows every change.

const props = defineProps<{
  channelId: string
  canManage: boolean
}>()

const maropay = useMaropayStore()
const toast = useToast()

const binding = computed(() => maropay.bindingFor(props.channelId))
const orderedMethods = computed(() => (binding.value ? orderedCheckoutMethods(maropay.state, binding.value) : []))
const hasExpressMethod = computed(() => orderedMethods.value.some((m) => EXPRESS_IDS.includes(m.id)))

function shopperName(method: PaymentMethodCatalogEntry): string {
  return method.id === 'card' ? `${MAROPAY_SHOPPER_LABEL} (cards)` : method.label
}

/** As shoppers see it: cards are offered as Maropay. */
function shopperMark(method: PaymentMethodCatalogEntry): MethodMarkId {
  return method.id === 'card' ? 'maropay' : markFor(method.id)
}

const payButtonItems = computed(() => {
  const sample = formatMoney(money(4999, maropay.account?.currency ?? 'USD'))
  return (Object.keys(PAY_BUTTON_LABELS) as PayButtonLabel[]).map((value) => ({ value, title: PAY_BUTTON_LABELS[value].replace('{amount}', sample) }))
})
const defaultItems = computed(() => [
  { value: '', title: 'The first method in the list' },
  ...orderedMethods.value.map((m) => ({ value: m.id, title: shopperName(m) })),
])
const defaultMethod = computed(() => {
  const id = binding.value?.defaultMethodId
  return id && orderedMethods.value.some((m) => m.id === id) ? id : ''
})

function update(patch: CheckoutOptionsPatch): void {
  const result = maropay.updateCheckoutOptions(props.channelId, patch)
  if (!result.ok) toast.error(result.error.message)
}

// ── Order ────────────────────────────────────────────────────────────

const card = ref<ComponentPublicInstance | null>(null)

/** Moving to either end disables the button just pressed, so focus goes to the arrow that's left. */
async function move(index: number, by: -1 | 1): Promise<void> {
  const ids = orderedMethods.value.map((m) => m.id)
  const target = index + by
  if (target < 0 || target >= ids.length) return
  const id = ids[index]!
  ;[ids[index], ids[target]] = [ids[target]!, ids[index]!]
  update({ methodOrder: ids })
  await nextTick()
  const atEnd = target === 0 || target === ids.length - 1
  const direction = atEnd ? (by === -1 ? 'down' : 'up') : (by === -1 ? 'up' : 'down')
  ;(card.value?.$el as HTMLElement | undefined)?.querySelector<HTMLElement>(`[data-move="${id}-${direction}"]`)?.focus()
}
</script>

<template>
  <v-card v-if="binding && orderedMethods.length" ref="card" flat border rounded="lg" class="mp-card-inset">
    <MpSectionHeader icon="shopping-cart" title="Checkout options" description="How your methods appear to shoppers on product pages, the cart and checkout." :heading-level="2" />

    <MpListRow
      variant="divided"
      title="Express checkout buttons"
      :subtitle="hasExpressMethod
        ? 'Apple Pay, Google Pay and PayPal as one-tap buttons on product pages, the cart and the top of checkout.'
        : 'Turn on Apple Pay, Google Pay or PayPal to offer one-tap express buttons.'"
    >
      <template #trailing>
        <v-switch
          :model-value="binding.checkout.expressWallets"
          :disabled="!canManage || !hasExpressMethod"
          aria-label="Show express checkout buttons"
          @update:model-value="update({ expressWallets: Boolean($event) })"
        />
      </template>
    </MpListRow>

    <MpFormGrid :cols="2" class="store-checkout__fields">
      <v-select
        label="Pay button"
        :model-value="binding.checkout.payButtonLabel"
        :items="payButtonItems"
        :disabled="!canManage"
        hint="PayPal and buy now, pay later always say where the shopper goes next."
        persistent-hint
        @update:model-value="update({ payButtonLabel: $event })"
      />
      <v-select
        label="Selected at checkout"
        :model-value="defaultMethod"
        :items="defaultItems"
        :disabled="!canManage"
        @update:model-value="update({ defaultMethodId: $event || null })"
      />
    </MpFormGrid>

    <template v-if="orderedMethods.length > 1">
      <h3 class="store-checkout__subhead">Order at checkout</h3>
      <div role="list" aria-label="Order at checkout">
        <MpListRow v-for="(m, index) in orderedMethods" :key="m.id" variant="divided" role="listitem" :title="shopperName(m)">
          <template #lead>
            <MaropayMethodMark :mark="shopperMark(m)" size="sm" decorative />
          </template>
          <template #trailing>
            <v-tooltip text="Move up" location="top">
              <template #activator="{ props: tip }">
                <v-btn
                  v-bind="tip"
                  icon="arrow-up"
                  variant="text"
                  size="small"
                  :data-move="`${m.id}-up`"
                  :disabled="!canManage || index === 0"
                  :aria-label="`Move ${shopperName(m)} up`"
                  @click="move(index, -1)"
                />
              </template>
            </v-tooltip>
            <v-tooltip text="Move down" location="top">
              <template #activator="{ props: tip }">
                <v-btn
                  v-bind="tip"
                  icon="arrow-down"
                  variant="text"
                  size="small"
                  :data-move="`${m.id}-down`"
                  :disabled="!canManage || index === orderedMethods.length - 1"
                  :aria-label="`Move ${shopperName(m)} down`"
                  @click="move(index, 1)"
                />
              </template>
            </v-tooltip>
          </template>
        </MpListRow>
      </div>
    </template>
    <p v-if="!canManage" class="store-checkout__note">Only the business owner can change this.</p>
  </v-card>
</template>

<style scoped>
.store-checkout__fields {
  margin-top: var(--mp-space-16);
}

.store-checkout__subhead {
  margin: var(--mp-space-24) 0 var(--mp-space-4);
  font-size: var(--mp-text-label-fontSize);
  font-weight: var(--mp-fontWeight-semibold);
  line-height: var(--mp-lineHeight-snug);
  color: var(--on-surface);
}

.store-checkout__note {
  margin: var(--mp-space-12) 0 0;
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--on-surface-muted);
}
</style>
