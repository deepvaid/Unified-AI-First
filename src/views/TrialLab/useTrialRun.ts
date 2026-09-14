import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { labBaseFor, useTrialLabStore, type TrialStage } from '@/stores/useTrialLab'
import { isTrialVariant, type TrialVariant } from '@/stores/trialLabData'
import type { TrialFamily } from './trialLabRoutes'

/**
 * Binds the Trial Lab store to the variant of the current route — from the
 * `:variant` param in the lab, or from route meta under `/signup` — so each
 * screen reads `run`, `config` and the derived labels without repeating the
 * narrowing. Also owns navigation, which goes by path under `base` so the
 * same screens serve `/trial-lab/e/...` and `/signup/...`.
 */
export function useTrialRun() {
  const route = useRoute()
  const router = useRouter()
  const store = useTrialLabStore()

  const variant = computed<TrialVariant>(() => {
    const raw = Array.isArray(route.params.variant) ? route.params.variant[0] : route.params.variant
    if (isTrialVariant(raw)) return raw
    return isTrialVariant(route.meta.trialVariant) ? route.meta.trialVariant : 'b'
  })
  const family = computed<TrialFamily>(() => (route.meta.trialFamily === 'signup' ? 'signup' : 'lab'))
  const base = computed(() => route.meta.trialBase ?? labBaseFor(variant.value))

  const run = computed(() => store.run(variant.value))
  const config = computed(() => store.config(variant.value))
  const workspace = computed(() => store.activeWorkspace(variant.value))
  const isVerified = computed(() => store.isVerified(variant.value))
  const inPreview = computed(() => store.inPreview(variant.value))
  const trialLabel = computed(() => store.trialLabel(variant.value))
  const trialStarted = computed(() => store.trialStarted(variant.value))

  /** Path of a stage under this family's base. */
  function pathFor(stage: TrialStage) {
    return store.routeFor(variant.value, stage, base.value)
  }

  /** Record the stage (so entry resumes here) — call from a view's onMounted. */
  function arrive(stage: TrialStage) {
    store.setStage(variant.value, stage)
  }

  /** Move to the stage that follows `from` for this variant. */
  function advanceFrom(from: TrialStage, replace = false) {
    const next = store.nextStageAfter(variant.value, from)
    store.setStage(variant.value, next)
    const target = pathFor(next)
    return replace ? router.replace(target) : router.push(target)
  }

  function goTo(stage: TrialStage, replace = false) {
    store.setStage(variant.value, stage)
    const target = pathFor(stage)
    return replace ? router.replace(target) : router.push(target)
  }

  return { store, variant, family, base, run, config, workspace, isVerified, inPreview, trialLabel, trialStarted, pathFor, arrive, advanceFrom, goTo }
}
