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

/**
 * The paired ink for each category fill (P5.5 semantic pairing).
 *
 * Every fill above has an `on-*` counterpart in the Vuetify theme, so an icon
 * sitting on a category avatar names its pair instead of a literal "white" —
 * which was wrong on any theme whose fill is light.
 */
export const categoryOnColor: Record<NodeCategory, string> = {
  trigger: 'on-primary',
  action: 'on-success',
  filter: 'on-flow-logic',
  delay: 'on-warning',
  end: 'white',
}

export const categoryLabel: Record<NodeCategory, string> = {
  trigger: 'Trigger',
  action: 'Action',
  filter: 'Filter',
  delay: 'Delay',
  end: 'End',
}

/** Branch rail chips: Yes/No carry outcome semantics; everything else (Case n, A/B, %, Other) reads as logic. */
export function branchChipColor(label: string): string {
  const l = label.toUpperCase()
  return l.startsWith('YES') ? 'success' : l.startsWith('NO') ? 'error' : 'flow-logic'
}
