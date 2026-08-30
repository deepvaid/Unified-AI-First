import { ref, computed, toValue, type MaybeRefOrGetter } from 'vue'

export interface UseWizardStepsOptions {
  /** Start step (1-based). Edit-hydration flows start at 1 and call `unlockAll()`. */
  initial?: number
  /**
   * Gate for leaving `from` in the forward direction — return false to stay put.
   * Backward jumps are always allowed; jumps past `maxStep` are already blocked
   * by `MpWizardSteps`' own `max-step` gating.
   */
  canAdvance?: (from: number) => boolean
  /** Side effect on every successful transition (auto-save, per-step prefill). */
  onNavigate?: (from: number, to: number) => void
}

/**
 * Step state for a full-page wizard: the current step, the high-water mark of
 * visited steps (what `MpWizardSteps` `:max-step` wants — never bind that prop
 * to the current step, or forward jumps die the moment the user steps back),
 * and gated navigation.
 *
 * Extracted from CreateCampaign's `step`/`maxStepReached`/`goToStep`, which
 * every wizard had reimplemented with drift.
 */
export function useWizardSteps(total: MaybeRefOrGetter<number>, options: UseWizardStepsOptions = {}) {
  const step = ref(options.initial ?? 1)
  const maxStep = ref(step.value)
  const count = computed(() => toValue(total))
  const isFirst = computed(() => step.value === 1)
  const isLast = computed(() => step.value === count.value)

  function goTo(target: number) {
    const to = Math.min(Math.max(target, 1), count.value)
    if (to === step.value) return
    if (to > step.value && options.canAdvance && !options.canAdvance(step.value)) return
    const from = step.value
    step.value = to
    maxStep.value = Math.max(maxStep.value, to)
    options.onNavigate?.(from, to)
  }
  function next() { goTo(step.value + 1) }
  function prev() { goTo(step.value - 1) }
  /** Edit-mode hydration: mark every step as already visited, so all are jumpable. */
  function unlockAll() { maxStep.value = count.value }

  return { step, maxStep, isFirst, isLast, goTo, next, prev, unlockAll }
}
