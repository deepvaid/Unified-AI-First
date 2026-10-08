<script setup lang="ts">
import { computed, useId } from 'vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import { useMaropayStore } from '@/stores/useMaropay'
import { useStoreThemesStore } from '@/stores/useStoreThemes'
import { storefrontThemeVars } from '@/stores/themeBuilderData'
import { formatMoney, money } from '@/maropay/money'
import { joinList } from '@/maropay/readiness'
import { payButtonText, storefrontOffer } from '@/maropay/storefront'
import StorefrontPaymentPreview from '@/views/Storefront/StorefrontPaymentPreview.vue'

// "What shoppers see": the payment part of this store's checkout, live as the
// merchant changes methods, order, the default, express buttons and the pay
// button's words. A store that isn't live yet previews what it will offer once
// it is. The preview is a picture, not a form — it's inert, and a sentence tells
// screen readers what it shows.

const props = withDefaults(defineProps<{
  channelId: string
  live: boolean
  /** The Activate dialog's choice, previewed: who takes cards once the store is live. */
  cardsVia?: 'maropay' | 'existing'
  /** The store's domain, when it has one. */
  domain?: string
  /** A product page of the store, to try the real thing. */
  storefrontHref: string
}>(), {
  cardsVia: 'maropay',
})

const maropay = useMaropayStore()
const themes = useStoreThemesStore()
const idPrefix = `sf-pv-${useId()}`

/** The sample order the checkout options use for the pay button's words. */
const sample = computed(() => money(4999, maropay.account?.currency ?? 'USD'))
const offer = computed(() => storefrontOffer(maropay.state, props.channelId, sample.value, { asIfLive: true, cardsVia: props.cardsVia }))
const themeVars = computed(() => storefrontThemeVars(themes.themeForChannel(props.channelId)?.styles))
const pending = computed(() => maropay.methodsForStore(props.channelId).filter((m) => m.status === 'pending_approval').map((m) => m.label))
const otherProviders = computed(() => offer.value.providers.some((p) => p.id !== 'maropay'))

const description = computed(() => {
  if (!props.live) return otherProviders.value ? 'How checkout looks once Maropay is live — your other providers stay as they are.' : 'How checkout looks once Maropay is live.'
  return props.domain ? `Live on ${props.domain}.` : 'Live at checkout now.'
})

const summary = computed(() => {
  const o = offer.value
  const chosen = o.methods.find((m) => m.id === o.defaultMethodId) ?? null
  const parts = [`Shoppers can pay with ${joinList(o.methods.map((m) => m.label))}.`]
  if (o.cardsVia && o.cardsVia !== 'maropay') parts.push(`Cards go through ${o.providerLabel}.`)
  if (o.express.length) parts.push(`${joinList(o.express.map((m) => m.label))} also show as express buttons at the top.`)
  if (chosen) parts.push(`${chosen.label} is selected to start with, and the button reads “${payButtonText(chosen, o.payButton, sample.value)}”.`)
  return parts.join(' ')
})
</script>

<template>
  <v-card flat border rounded="lg" class="store-preview mp-card-inset">
    <MpSectionHeader icon="eye" title="What shoppers see" :description="description" :heading-level="2" />

    <template v-if="offer.methods.length">
      <p class="d-sr-only">{{ summary }}</p>
      <div class="store-preview__frame" role="region" aria-label="Checkout preview" tabindex="0">
        <div inert>
          <StorefrontPaymentPreview :offer="offer" :total="sample" :theme-vars="themeVars" :id-prefix="idPrefix" />
        </div>
      </div>
      <p class="store-preview__note">
        A sample {{ formatMoney(sample) }} order.
        <template v-if="pending.length">{{ joinList(pending) }} {{ pending.length === 1 ? 'shows' : 'show' }} up once approved.</template>
        {{ ' ' }}<a class="mp-link" :href="storefrontHref" target="_blank" rel="noopener">Try it in your store<v-icon size="14" class="store-preview__external" aria-label="(opens in a new tab)">external-link</v-icon></a>
      </p>
    </template>
    <MpEmptyState
      v-else
      icon="eye-off"
      title="Nothing to show shoppers yet"
      description="Turn on a payment method to preview checkout."
      :heading-level="3"
    />
  </v-card>
</template>

<style scoped>
/* A flex column that can shrink, so a sticky, height-capped parent scrolls the frame, not the page. */
.store-preview {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.store-preview__frame {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-12);
}

.store-preview__frame:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.store-preview__external {
  margin-inline-start: var(--mp-space-4);
  vertical-align: text-bottom;
}

.store-preview__note {
  margin: var(--mp-space-12) 0 0;
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--on-surface-muted);
}
</style>
