<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import MpAlert from '@/components/MpAlert.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MaropayMethodMark from './MaropayMethodMark.vue'
import type { MaropayCardAction, MaropayCardModel } from '@/maropay/providerCard'
import type { MaropayTarget } from '@/maropay/readiness'

// The Maropay card at the top of a store's Payments page — where Maropay is sold
// (the Shopify Payments card, in our clothes) and, once live, managed from. It is
// presentational: `deriveMaropayCard` (src/maropay/providerCard.ts) decides the
// state, the words and the actions; the page resolves routes and handles the
// emits that need the store (activate, link, stop, scroll to the other providers).

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
  'see-providers': []
}>()

const headingTag = computed(() => `h${props.headingLevel}`)

function act(action: MaropayCardAction): void {
  if (action.kind === 'activate') emit('activate')
  else if (action.kind === 'link') emit('link')
  else if (action.kind === 'see_providers') emit('see-providers')
}

function routeOf(action: MaropayCardAction): RouteLocationRaw | undefined {
  return action.kind === 'route' && action.target ? props.routeFor(action.target) : undefined
}
</script>

<template>
  <v-card flat border rounded="lg" class="maropay-card mp-card-inset" :class="`maropay-card--${model.state}`">
    <div class="maropay-card__header">
      <MaropayMethodMark mark="maropay" size="lg" decorative />
      <div class="maropay-card__titles">
        <span v-if="model.recommended" class="mp-meta-label maropay-card__eyebrow">Recommended · Maropost’s own payments</span>
        <component :is="headingTag" class="mp-section-title maropay-card__headline">{{ model.headline }}</component>
        <p v-if="model.detail" class="maropay-card__detail">{{ model.detail }}</p>
      </div>
      <div v-if="model.chip || model.menu.length" class="maropay-card__status">
        <MpStatusChip v-if="model.chip" :status="model.chip" type="readiness" show-icon />
        <MpRowActionsMenu v-if="model.menu.length" ariaLabel="More Maropay actions">
          <MpMenuItem v-if="model.menu.includes('open_in_maropay') && model.openInMaropay" icon="wallet" title="Open in Maropay" :to="routeFor(model.openInMaropay)" />
          <template v-if="model.menu.includes('stop')">
            <v-divider v-if="model.menu.includes('open_in_maropay')" class="my-1" />
            <MpMenuItem icon="power" title="Stop using Maropay on this store" danger @click="emit('stop')" />
          </template>
        </MpRowActionsMenu>
      </div>
    </div>

    <p v-if="model.facts" class="maropay-card__facts">{{ model.facts }}</p>

    <MpAlert v-if="model.nag" :tone="model.nag.tone" live="off" :title="model.nag.title">
      {{ model.nag.body }}
      <template v-if="model.nag.action" #actions>
        <v-btn size="small" variant="outlined" class="text-none" :to="routeFor(model.nag.action.target)">{{ model.nag.action.label }}</v-btn>
      </template>
    </MpAlert>

    <div v-if="model.benefits.length" role="list" class="maropay-card__benefits">
      <MpListRow v-for="benefit in model.benefits" :key="benefit.title" variant="plain" density="compact" role="listitem" :title="benefit.title" :subtitle="benefit.desc">
        <template #lead><v-icon size="16" class="maropay-card__icon">{{ benefit.icon }}</v-icon></template>
      </MpListRow>
    </div>

    <dl v-if="model.live" class="mp-label-value mp-label-value--inline">
      <div><dt>Takes</dt><dd>{{ model.live.takes }}</dd></div>
      <div><dt>Rates</dt><dd>{{ model.live.rates }}</dd></div>
      <div><dt>Payouts</dt><dd>{{ model.live.payouts }}</dd></div>
    </dl>

    <p v-if="model.progress" class="maropay-card__progress">{{ model.progress.done }} of {{ model.progress.total }} steps done</p>

    <ul v-if="model.marks.length" class="maropay-card__marks" aria-label="Payment methods">
      <li v-for="mark in model.marks" :key="mark"><MaropayMethodMark :mark="mark" size="sm" /></li>
      <li v-if="model.moreCount" class="maropay-card__more">+{{ model.moreCount }} more</li>
    </ul>

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
        :href="model.secondary.kind === 'href' ? model.secondary.href : undefined"
        :target="model.secondary.kind === 'href' ? '_blank' : undefined"
        :rel="model.secondary.kind === 'href' ? 'noopener' : undefined"
        :append-icon="model.secondary.kind === 'href' ? 'external-link' : undefined"
      >
        {{ model.secondary.label }}
      </v-btn>
      <v-btn v-if="model.quiet" variant="text" size="small" class="text-none maropay-card__quiet" @click="act(model.quiet)">
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
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--mp-space-12);
  align-items: start;
}

.maropay-card__eyebrow {
  display: block;
  margin-bottom: var(--mp-space-4);
  color: var(--text-muted);
}

.maropay-card__headline {
  margin: 0;
}

.maropay-card__detail {
  margin: var(--mp-space-4) 0 0;
  font-size: var(--mp-fontSize-14);
  line-height: var(--mp-lineHeight-normal);
  color: var(--text-secondary);
}

.maropay-card__status {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
}

.maropay-card__facts,
.maropay-card__progress {
  margin: 0;
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--on-surface-muted);
}

.maropay-card__benefits {
  display: flex;
  flex-direction: column;
}

.maropay-card__icon {
  color: var(--icon-secondary);
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

/* Narrow: the status moves under the title block instead of squeezing it. */
@media (max-width: #{$mp-layout-breakpointCompact}) {
  .maropay-card__header {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .maropay-card__status {
    grid-column: 1 / -1;
  }
}
</style>
