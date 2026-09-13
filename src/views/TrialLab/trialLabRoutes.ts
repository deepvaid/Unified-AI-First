import type { RouteLocationNormalized, RouteLocationRaw, RouteParamsGeneric, RouteRecordRaw } from 'vue-router'
import { useTrialLabStore } from '@/stores/useTrialLab'
import { isTrialVariant, type TrialVariant } from '@/stores/trialLabData'

/**
 * Trial Lab routes — spread into `src/router/index.ts`.
 *
 * The variant lives in the path so every variant has a direct entry link,
 * refresh and Back follow the URL, and two tabs on different variants never
 * fight over a "current variant" field. `fullPage` hides the app chrome;
 * `trialLab` keeps the copilot drawer out (see App.vue `copilotAvailable`).
 * No `:accountId` and no `requires`, so the global guard is a no-op here.
 */

const META = { fullPage: true, trialLab: true } as const

export function variantFrom(to: { params: RouteParamsGeneric }): TrialVariant | null {
  const raw = Array.isArray(to.params.variant) ? to.params.variant[0] : to.params.variant
  return isTrialVariant(raw) ? raw : null
}

/**
 * Enforces only *illegal forward* states — going back to an earlier screen is
 * always allowed so the browser Back button keeps working.
 */
function guardStage(to: RouteLocationNormalized): RouteLocationRaw | true {
  const variant = variantFrom(to)
  if (!variant) return { name: 'TrialLabIndex' }
  const store = useTrialLabStore()
  const run = store.run(variant)
  const params = { variant }

  if (to.name === 'TrialSignup') {
    return run?.account.signedUpAt ? store.entryRouteFor(variant) : true
  }
  if (!run?.account.signedUpAt) return { name: 'TrialSignup', params }
  if (to.name === 'TrialVerify') return true

  const cfg = store.config(variant)
  const verified = !!run.account.verifiedAt
  const previewing = !!run.account.previewEnteredAt
  if (!verified && (cfg.verifyBeforeEntry || !previewing)) return { name: 'TrialVerify', params }
  if (to.name === 'TrialPreparing') return true
  if (!store.workspaceReady(variant)) return { name: 'TrialPreparing', params }
  if (to.name === 'TrialNames' && !cfg.askNamesEarly) return { name: 'TrialGoal', params }
  if (to.name === 'TrialUpgrade' && !verified) {
    // Upgrading is a live action: send the user home with the verify dialog open.
    store.requestGated(variant, 'Upgrading starts real billing, so we confirm it’s you first.')
    return { name: 'TrialHome', params }
  }
  return true
}

function view(name: string) {
  return () => import(`./${name}.vue`)
}

export const trialLabRoutes: RouteRecordRaw[] = [
  {
    path: '/trial-lab',
    name: 'TrialLabIndex',
    component: view('TrialLabIndex'),
    meta: META,
  },
  {
    path: '/trial-lab/:variant(a|b|c|d)',
    component: view('TrialLabLayout'),
    meta: META,
    children: [
      {
        path: '',
        name: 'TrialLabEntry',
        // Pure read: opening a link must never create a run.
        redirect: (to) => {
          const variant = variantFrom(to)
          return variant ? useTrialLabStore().entryRouteFor(variant) : { name: 'TrialLabIndex' }
        },
      },
      { path: 'signup', name: 'TrialSignup', component: view('TrialSignupView'), beforeEnter: guardStage },
      { path: 'verify', name: 'TrialVerify', component: view('TrialVerifyView'), beforeEnter: guardStage },
      // The second-tab landing — no guard, it consumes the token and reports.
      { path: 'verify-link/:token', name: 'TrialVerifyLink', component: view('TrialVerifyLinkView') },
      { path: 'preparing', name: 'TrialPreparing', component: view('TrialPreparingView'), beforeEnter: guardStage },
      { path: 'names', name: 'TrialNames', component: view('TrialNamesView'), beforeEnter: guardStage },
      { path: 'goal', name: 'TrialGoal', component: view('TrialGoalView'), beforeEnter: guardStage },
      { path: 'task/:goal(marketing|commerce|service)', name: 'TrialTask', component: view('TrialTaskView'), beforeEnter: guardStage },
      { path: 'home', name: 'TrialHome', component: view('TrialHomeView'), beforeEnter: guardStage },
      { path: 'upgrade', name: 'TrialUpgrade', component: view('TrialUpgradeView'), beforeEnter: guardStage },
    ],
  },
]
