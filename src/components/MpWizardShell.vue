<script setup lang="ts">
import { computed, useSlots } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpWizardSteps from '@/components/MpWizardSteps.vue'

/**
 * MpWizardShell — the one full-page wizard chrome.
 *
 * Owns the anatomy every stepped create flow shares: the surface header band
 * (MpPageHeader with MpWizardSteps in its tabs row), the scrollable body with
 * a centred measure, and the surface footer band (Back · hint · "N / M"
 * counter · primary actions). Before this shell, thirteen wizards copy-pasted
 * the bands with drifting borders, six different measure widths and two
 * subtitle separators; composing this component makes that drift unwritable.
 *
 * The shell composes the `Step N of M — <label>` subtitle itself. Pass
 * `subtitle` only to override it (entitlement banners, single-step flows).
 *
 * Step state belongs to the page — pair with `useWizardSteps` and feed its
 * `step`/`maxStep` straight into `current`/`max-step`. The leave guard also
 * stays with the page (it owns the dirty state): wizards with explicit
 * persistence wire `useDirtyLeaveGuard` + `MpConfirmDialog`; autosaving flows
 * don't block. That is a deliberate non-feature of the shell.
 */
const props = withDefaults(defineProps<{
  title: string
  /** Ordered step labels. Omit for single-step action flows — no steps row, no composed subtitle. */
  steps?: string[]
  /** 1-based current step. Required when `steps` is set. */
  current?: number
  /** High-water mark of visited steps (useWizardSteps' maxStep). Defaults to `current` (nothing jumpable). */
  maxStep?: number
  /** Visited steps clickable. MpWizardSteps already gates jumps on maxStep. */
  clickable?: boolean
  backTo?: string | Record<string, unknown>
  eyebrow?: string
  /** Overrides the composed `Step N of M — <label>` subtitle. */
  subtitle?: string
  /** Content column width → component.wizard.measure.{sm,md,lg}. sm (780) is the canonical form measure. */
  measure?: 'sm' | 'md' | 'lg'
  /** Show the tabular "N / M" footer counter (only renders when `steps` is set). */
  counter?: boolean
  /** Disabled-reason caption before the counter (why the primary action is inert). */
  hint?: string
  /** Fill the parent instead of the app frame — nested shells and Storybook. Same contract as MpBuilderShell. */
  standalone?: boolean
}>(), {
  clickable: true,
  counter: true,
  measure: 'sm',
  standalone: false,
})

const emit = defineEmits<{
  /** A visited step was clicked in the header. */
  select: [step: number]
  /** The fallback footer Back button was clicked (only when #footerStart is not overridden). */
  back: []
}>()

const slots = useSlots()

const composedSubtitle = computed(() => {
  if (props.subtitle) return props.subtitle
  if (props.steps?.length && props.current) {
    return `Step ${props.current} of ${props.steps.length} — ${props.steps[props.current - 1]}`
  }
  return undefined
})
</script>

<template>
  <div
    class="mp-wizard-shell d-flex flex-column"
    :class="standalone ? 'mp-wizard-shell--contain' : 'mp-frame-fill'"
  >
    <div class="mp-wizard-shell__head bg-surface">
      <MpPageHeader
        :title="title"
        :subtitle="composedSubtitle"
        :back-to="backTo"
        :eyebrow="eyebrow"
      >
        <template v-if="slots.actions" #actions>
          <slot name="actions" />
        </template>
        <template v-if="steps?.length" #tabs>
          <MpWizardSteps
            :steps="steps"
            :current="current ?? 1"
            :clickable="clickable"
            :max-step="maxStep ?? current"
            class="mt-3"
            @select="emit('select', $event)"
          />
        </template>
      </MpPageHeader>
    </div>

    <div class="mp-wizard-shell__body flex-grow-1 overflow-y-auto bg-background">
      <div class="mp-wizard-shell__measure" :class="`mp-wizard-shell__measure--${measure}`">
        <slot />
      </div>
    </div>

    <div class="mp-wizard-shell__foot bg-surface d-flex justify-space-between align-center">
      <slot name="footerStart">
        <v-btn
          v-if="current && current > 1"
          variant="text"
          class="text-none"
          prepend-icon="arrow-left"
          @click="emit('back')"
        >
          Back
        </v-btn>
        <div v-else></div>
      </slot>
      <div class="d-flex align-center ga-3">
        <span v-if="hint" class="text-caption text-medium-emphasis">{{ hint }}</span>
        <span
          v-if="counter && steps?.length && current"
          class="text-caption text-medium-emphasis mp-wizard-shell__counter"
        >{{ current }} / {{ steps.length }}</span>
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.mp-wizard-shell--contain {
  height: 100%;
}
.mp-wizard-shell__head {
  padding: var(--mp-space-24) var(--mp-space-32) var(--mp-space-16);
  border-bottom: 1px solid var(--mp-border-subtle);
}
/* The header band owns the vertical rhythm; the header's own bottom margin would double it. */
.mp-wizard-shell__head :deep(.mp-page-header) {
  margin-bottom: 0;
}
.mp-wizard-shell__body {
  padding: var(--mp-space-32);
}
.mp-wizard-shell__measure {
  margin-inline: auto;
}
.mp-wizard-shell__measure--sm { max-width: var(--mp-component-wizard-measure-sm); }
.mp-wizard-shell__measure--md { max-width: var(--mp-component-wizard-measure-md); }
.mp-wizard-shell__measure--lg { max-width: var(--mp-component-wizard-measure-lg); }
.mp-wizard-shell__foot {
  padding: var(--mp-space-16) var(--mp-space-32);
  border-top: 1px solid var(--mp-border-subtle);
}
.mp-wizard-shell__counter {
  font-variant-numeric: tabular-nums;
}
</style>
