import type { NodeCategory } from '@/stores/journeyFlowData'

// Single source of truth for the journey-flow category visual language.
// Consumed by JourneyBuilder, JourneyFlowColumn, JourneyAddStepMenu, and
// JourneyMiniPreview — keep any category → color/label change here only.
// Values are Vuetify theme color keys (rendered via rgb(var(--v-theme-<key>))).
export const categoryColor: Record<NodeCategory, string> = {
  trigger: 'primary',
  action: 'success',
  filter: 'flow-logic',
  delay: 'warning',
  end: 'grey-darken-1',
}

export const categoryLabel: Record<NodeCategory, string> = {
  trigger: 'Trigger',
  action: 'Action',
  filter: 'Filter',
  delay: 'Delay',
  end: 'End',
}

/** Branch rail chips: YES/NO carry outcome semantics; everything else (CASE n, A/B/%, OTHER) reads as logic. */
export function branchChipColor(label: string): string {
  return label.startsWith('YES') ? 'success' : label.startsWith('NO') ? 'error' : 'flow-logic'
}
