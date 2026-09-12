import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTrialLabStore, type TrialStage } from '@/stores/useTrialLab'
import { isTrialVariant, type TrialVariant } from '@/stores/trialLabData'

/**
 * Binds the Trial Lab store to the variant in the current route so each
 * screen reads `run`, `config` and the derived labels without repeating the
 * param narrowing. Also owns the two navigation moves every screen makes.
 */
export function useTrialRun() {
  const route = useRoute()
  const router = useRouter()
  const store = useTrialLabStore()

  const variant = computed<TrialVariant>(() => {
    const raw = Array.isArray(route.params.variant) ? route.params.variant[0] : route.params.variant
    return isTrialVariant(raw) ? raw : 'b'
  })

  const run = computed(() => store.run(variant.value))
  const config = computed(() => store.config(variant.value))
  const workspace = computed(() => store.activeWorkspace(variant.value))
  const isVerified = computed(() => store.isVerified(variant.value))
  const inPreview = computed(() => store.inPreview(variant.value))
  const trialLabel = computed(() => store.trialLabel(variant.value))
  const trialStarted = computed(() => store.trialStarted(variant.value))

  /** Record the stage (so entry resumes here) — call from a view's onMounted. */
  function arrive(stage: TrialStage) {
    store.setStage(variant.value, stage)
  }

  /** Move to the stage that follows `from` for this variant. */
  function advanceFrom(from: TrialStage, replace = false) {
    const next = store.nextStageAfter(variant.value, from)
    store.setStage(variant.value, next)
    const target = store.routeFor(variant.value, next)
    return replace ? router.replace(target) : router.push(target)
  }

  function goTo(stage: TrialStage, replace = false) {
    store.setStage(variant.value, stage)
    const target = store.routeFor(variant.value, stage)
    return replace ? router.replace(target) : router.push(target)
  }

  return { store, variant, run, config, workspace, isVerified, inPreview, trialLabel, trialStarted, arrive, advanceFrom, goTo }
}
