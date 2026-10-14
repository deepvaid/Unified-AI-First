<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import MpAlert from '@/components/MpAlert.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MaropayMethodMark from './MaropayMethodMark.vue'
import type { MaropayCardAction, MaropayCardModel } from '@/maropay/providerCard'
import type { MaropayTarget } from '@/maropay/readiness'

// The Maropay card at the top of a store's Payments page — where Maropay is sold
// (the Shopify Payments card, in our clothes) and, once live, managed from. One
// compact shape in every state: the wordmark row, a line of copy, three facts,
// the accepted marks, the actions. It is presentational: `deriveMaropayCard`
// (src/maropay/providerCard.ts) decides the state, the words and the actions; the
// page resolves routes and handles the emits that need the store (activate, link,
// stop).

const props = withDefaults(defineProps<{
  model: MaropayCardModel
  /** Resolves a Maropay target to a route — the page adds the active account. */
  routeFor: (target: MaropayTarget) => RouteLocationRaw
  headingLevel?: 2 | 3
}>(), {
  headingLevel: 2,
})

const emit = defineEmits<{
  activate: []
  link: []
  stop: []
}>()

const headingTag = computed(() => `h${props.headingLevel}`)

function act(action: MaropayCardAction): void {
  if (action.kind === 'activate') emit('activate')
  else if (action.kind === 'link') emit('link')
}

function routeOf(action: MaropayCardAction): RouteLocationRaw | undefined {
  return action.kind === 'route' && action.target ? props.routeFor(action.target) : undefined
}

function hrefAttrs(action: MaropayCardAction) {
  return action.kind === 'href'
    ? { href: action.href, target: '_blank', rel: 'noopener', appendIcon: 'external-link' }
    : {}
}
</script>

<template>
  <v-card flat border rounded="lg" class="maropay-card mp-card-inset" :class="`maropay-card--${model.state}`">
    <div class="maropay-card__header">
      <div class="maropay-card__brand">
        <MaropayMethodMark mark="maropay" size="md" decorative />
        <component :is="headingTag" class="maropay-card__name">Maropay</component>
        <v-chip v-if="model.recommended" size="small" color="primary" variant="tonal">Recommended</v-chip>
      </div>
      <div v-if="model.chip || model.menu.length" class="maropay-card__status">
        <MpStatusChip v-if="model.chip" :status="model.chip" type="readiness" size="sm" show-icon />
        <MpRowActionsMenu v-if="model.menu.length" ariaLabel="More Maropay actions">
          <MpMenuItem v-if="model.menu.includes('open_in_maropay') && model.openInMaropay" icon="wallet" title="Open in Maropay" :to="routeFor(model.openInMaropay)" />
          <template v-if="model.menu.includes('stop')">
            <v-divider v-if="model.menu.includes('open_in_maropay')" class="my-1" />
            <MpMenuItem icon="power" title="Stop using Maropay on this store" danger @click="emit('stop')" />
          </template>
        </MpRowActionsMenu>
      </div>
    </div>

    <div class="maropay-card__copy">
      <p class="maropay-card__headline">{{ model.headline }}</p>
      <p v-if="model.detail" class="maropay-card__detail">{{ model.detail }}</p>
    </div>

    <MpAlert v-if="model.nag" :tone="model.nag.tone" live="off" :title="model.nag.title">
      {{ model.nag.body }}
      <template v-if="model.nag.action" #actions>
        <v-btn size="small" variant="outlined" class="text-none" :to="routeFor(model.nag.action.target)">{{ model.nag.action.label }}</v-btn>
      </template>
    </MpAlert>

    <dl v-if="model.factStrip.length" class="maropay-card__facts">
      <div v-for="fact in model.factStrip" :key="fact.label" class="maropay-card__fact">
        <dt>{{ fact.label }}</dt>
        <dd>{{ fact.value }}</dd>
      </div>
    </dl>

    <p v-if="model.progress" class="maropay-card__progress">{{ model.progress.done }} of {{ model.progress.total }} steps done</p>

    <div v-if="model.marks.length" class="maropay-card__accepted">
      <span class="maropay-card__accepted-label" id="maropay-card-accepted">Accepted payments</span>
      <ul class="maropay-card__marks" aria-labelledby="maropay-card-accepted">
        <li v-for="mark in model.marks" :key="mark"><MaropayMethodMark :mark="mark" size="sm" /></li>
        <li v-if="model.moreCount" class="maropay-card__more">+{{ model.moreCount }} more</li>
      </ul>
    </div>

    <div v-if="model.primary || model.secondary || model.quiet" class="maropay-card__footer">
      <v-tooltip v-if="model.primary" :disabled="!model.primary.disabledReason" :text="model.primary.disabledReason ?? ''" location="bottom">
        <template #activator="{ props: tip }">
          <span v-bind="tip">
            <v-btn
              color="primary"
              variant="flat"
              class="text-none"
              :disabled="!!model.primary.disabledReason"
              :to="routeOf(model.primary)"
              @click="act(model.primary)"
            >
              {{ model.primary.label }}
            </v-btn>
          </span>
        </template>
      </v-tooltip>
      <v-btn
        v-if="model.secondary"
        :variant="model.primary ? 'outlined' : 'text'"
        class="text-none"
        :to="routeOf(model.secondary)"
        v-bind="hrefAttrs(model.secondary)"
        @click="act(model.secondary)"
      >
        {{ model.secondary.label }}
      </v-btn>
      <v-btn
        v-if="model.quiet"
        variant="text"
        class="text-none"
        :to="routeOf(model.quiet)"
        v-bind="hrefAttrs(model.quiet)"
        @click="act(model.quiet)"
      >
        {{ model.quiet.label }}
      </v-btn>
    </div>

    <p v-if="model.footnote" class="maropay-card__footnote">{{ model.footnote }}</p>
  </v-card>
</template>

<style scoped lang="scss">
.maropay-card {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-card-gap);
}

.maropay-card__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-12);
}

.maropay-card__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-10);
  min-width: 0;
}

.maropay-card__name {
  margin: 0;
  font-size: var(--mp-text-sectionTitle-fontSize);
  font-weight: var(--mp-text-sectionTitle-fontWeight);
  letter-spacing: var(--mp-text-sectionTitle-letterSpacing);
  color: var(--text-primary);
}

.maropay-card__status {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
}

.maropay-card__copy {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-2);
  max-width: 64em;
}

.maropay-card__headline {
  margin: 0;
  font-size: var(--mp-fontSize-15);
  font-weight: var(--mp-fontWeight-semibold);
  line-height: var(--mp-lineHeight-tight);
  color: var(--text-primary);
}

.maropay-card__detail {
  margin: 0;
  font-size: var(--mp-fontSize-14);
  line-height: var(--mp-lineHeight-normal);
  color: var(--text-secondary);
}

/* Three facts in a row, Shopify's "Credit card rate · Transaction fee · Payout bank account". */
.maropay-card__facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, max-content));
  gap: var(--mp-space-8) var(--mp-space-40);
  margin: 0;
}

.maropay-card__fact {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-2);
}

.maropay-card__fact dt {
  font-size: var(--mp-text-label-fontSize);
  font-weight: var(--mp-text-label-fontWeight);
  color: var(--text-secondary);
}

.maropay-card__fact dd {
  margin: 0;
  font-size: var(--mp-fontSize-14);
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.maropay-card__progress {
  margin: 0;
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--on-surface-muted);
}

.maropay-card__accepted {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-6);
}

.maropay-card__accepted-label {
  font-size: var(--mp-text-label-fontSize);
  font-weight: var(--mp-text-label-fontWeight);
  color: var(--text-secondary);
}

.maropay-card__marks {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-space-8);
  margin: 0;
  padding: 0;
  list-style: none;
}

.maropay-card__more {
  font-size: var(--mp-fontSize-12);
  color: var(--on-surface-muted);
}

.maropay-card__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-space-8);
}

.maropay-card__footnote {
  margin: 0;
  font-size: var(--mp-fontSize-12);
  line-height: var(--mp-lineHeight-normal);
  color: var(--on-surface-muted);
}
</style>
