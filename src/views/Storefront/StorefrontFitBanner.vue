<script setup lang="ts">
import { computed, inject } from 'vue'
import { fitLabel } from '@/storefront/fitment'
import type { FitState, Vehicle } from '@/storefront/fitment'
import { STOREFRONT } from './storefrontContext'

// How a part stands against the shopper's vehicle, on an auto-parts store: the
// product page's banner under the title and, `compact`, the line in quick add.
// The words are `fitLabel`'s, the same on every card, page and line ("Fits your
// 2019 Ford F-150", "Doesn’t fit your 2019 Ford F-150", "Universal fit", "Check
// fit"), and an icon always goes with them, so the state is never told by colour
// alone. Fits is green, doesn't fit amber, universal and check fit neutral.
//
// The full banner adds one line under the words: what the fitting rows say (fits:
// "Driver 22 in, passenger 22 in", so the shopper knows which length to pick; a
// choice that doesn't fit: "Your vehicle takes: Driver 22 in, passenger 22 in"),
// where to look (doesn't fit), what a universal part means, that a part lists no
// vehicles yet (a vehicle chosen, the part without rows), and a button to choose or
// change the vehicle (the layout's vehicle drawer, `chooseVehicle`). Compact keeps
// the words, the `detail` line, and, while no vehicle is chosen, the Select vehicle
// button.

const props = withDefaults(defineProps<{
  state: FitState
  vehicle: Vehicle | null
  /**
   * The line under the words, from the fitting rows (`fitDetail`): "Front", "Driver 22 in,
   * passenger 22 in" when it fits; "Your vehicle takes: …" when the choice made doesn't.
   */
  detail?: string
  /** One line, no hint: quick add, a narrow panel. The detail stays, as a second line. */
  compact?: boolean
}>(), { compact: false, detail: '' })

const storefront = inject(STOREFRONT, null)

const ICONS: Record<FitState, string> = {
  fits: 'circle-check',
  'no-fit': 'triangle-alert',
  universal: 'badge-check',
  unknown: 'car-front',
}

const label = computed(() => fitLabel(props.state, props.vehicle))
const icon = computed(() => ICONS[props.state])

/** A vehicle is chosen but the part can't be checked against it: it lists no vehicles yet. */
const unlisted = computed(() => props.state === 'unknown' && props.vehicle !== null)

const hint = computed(() => {
  switch (props.state) {
    case 'fits': return props.detail
    case 'no-fit': return props.detail || 'See Vehicle fit below for the vehicles it fits.'
    case 'universal': return 'Works with any vehicle.'
    case 'unknown': return unlisted.value
      ? 'This part lists no vehicles yet. Match the part number on your old part, or ask us.'
      : 'Choose your vehicle to see whether this part fits.'
    default: return ''
  }
})

/** Choosing a vehicle: always while none is chosen; on the full banner, changing it too. */
const action = computed(() => {
  if (!storefront || props.state === 'universal') return ''
  if (props.state === 'unknown' && !unlisted.value) return 'Select vehicle'
  return props.compact ? '' : 'Change vehicle'
})
</script>

<template>
  <div class="sf-fit" :class="[`sf-fit--${state}`, { 'sf-fit--compact': compact }]">
    <v-icon class="sf-fit__icon" :size="compact ? 18 : 22" aria-hidden="true">{{ icon }}</v-icon>
    <div class="sf-fit__text">
      <p class="sf-fit__label">{{ label }}</p>
      <p v-if="hint && (!compact || detail)" class="sf-fit__hint">{{ hint }}</p>
    </div>
    <button v-if="action" type="button" class="sf-fit__action" aria-haspopup="dialog" @click="storefront?.chooseVehicle()">
      {{ action }}
    </button>
  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────────
 * P4-8 — out of system on purpose: see StorefrontLayout.vue.
 * The four states are fixed colour pairs, not the theme's: a fit has to read the
 * same on any store. Each pair paints its own fill and sets its own ink, and each
 * ink also passes 4.5:1 on white and on a #f2f3f5 surface, so the banner reads on
 * any page panel it sits on:
 *   fits      #146c2e on #e6f4ea (5.75:1; 6.53 white, 5.88 #f2f3f5)
 *   no-fit    #8a4b00 on #fdf0d5 (6.03:1; 6.80 white, 6.13 #f2f3f5)
 *   universal #3d434a on #eceef1 (8.60:1; 10.0 white, 9.01 #f2f3f5)
 *   unknown   #17191c on #ffffff (17.6:1; 15.9 #f2f3f5), with a #6b7280 outline
 * ───────────────────────────────────────────────────────────────────────────── */
.sf-fit {
  --sf-fit-ink: #17191c;
  --sf-fit-fill: #ffffff;
  --sf-fit-edge: #6b7280;
  display: flex;
  align-items: center;
  gap: 12px;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid var(--sf-fit-edge);
  border-radius: var(--sf-radius, 4px);
  background: var(--sf-fit-fill);
  color: var(--sf-fit-ink);
  font-size: 15px;
  line-height: 20px;
}

.sf-fit--fits {
  --sf-fit-ink: #146c2e;
  --sf-fit-fill: #e6f4ea;
  --sf-fit-edge: #b7dcc2;
}

.sf-fit--no-fit {
  --sf-fit-ink: #8a4b00;
  --sf-fit-fill: #fdf0d5;
  --sf-fit-edge: #f0c56b;
}

.sf-fit--universal {
  --sf-fit-ink: #3d434a;
  --sf-fit-fill: #eceef1;
  --sf-fit-edge: #d3d7dd;
}

.sf-fit__icon {
  flex: none;
  color: var(--sf-fit-ink);
}

.sf-fit__text {
  flex: 1 1 auto;
  min-width: 0;
}

.sf-fit__label,
.sf-fit__hint {
  margin: 0;
  color: var(--sf-fit-ink);
}

.sf-fit__label {
  font-weight: 600;
}

.sf-fit__hint {
  margin-top: 2px;
  font-size: 14px;
}

/* Underlined like a link; 44px of hit area around its 24px line. */
.sf-fit__action {
  position: relative;
  flex: none;
  min-height: 24px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--sf-fit-ink);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  white-space: nowrap;
  cursor: pointer;
}

.sf-fit__action::after {
  content: '';
  position: absolute;
  inset: -10px -6px;
}

.sf-fit__action:focus-visible {
  outline: 2px solid var(--sf-fit-ink);
  outline-offset: 3px;
}

.sf-fit--compact {
  gap: 8px;
  padding: 8px 12px;
  font-size: 14px;
}

/* A narrow banner puts its button under the words. */
@media (max-width: 420px) {
  .sf-fit:not(.sf-fit--compact) {
    flex-wrap: wrap;
  }

  .sf-fit:not(.sf-fit--compact) .sf-fit__action {
    margin-left: 34px;
  }
}
</style>
