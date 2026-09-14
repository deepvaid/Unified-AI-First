import type { RouteLocationNormalized, RouteLocationRaw, RouteMeta, RouteParamsGeneric, RouteRecordRaw } from 'vue-router'
import { labBaseFor, useTrialLabStore, type TrialStage } from '@/stores/useTrialLab'
import { isTrialVariant, type TrialVariant } from '@/stores/trialLabData'

/**
 * Trial Lab routes — spread into `src/router/index.ts`.
 *
 * One screen set, three URL families:
 *  - `/trial-lab/:variant`  — the comparison lab (variant in the path).
 *  - `/signup`              — the real journey: classic form (variant E) → verify → prepare → goal → app.
 *  - `/signup/minimal`      — the real journey with the minimal form (variant B).
 * Screens navigate by path under `meta.trialBase`; each child declares its
 * `meta.trialStage` so the guard never depends on route names. `fullPage`
 * hides the app chrome; `trialLab` keeps the copilot drawer out. No
 * `:accountId` and no `requires`, so the global guard is a no-op here.
 */

export type TrialFamily = 'lab' | 'signup'
type GuardStage = TrialStage | 'link'

const META = { fullPage: true, trialLab: true } as const

export function variantFrom(to: { params: RouteParamsGeneric; meta: RouteMeta }): TrialVariant | null {
  const raw = Array.isArray(to.params.variant) ? to.params.variant[0] : to.params.variant
  if (isTrialVariant(raw)) return raw
  return isTrialVariant(to.meta.trialVariant) ? to.meta.trialVariant : null
}

export function baseFrom(to: RouteLocationNormalized, variant: TrialVariant): string {
  return to.meta.trialBase ?? labBaseFor(variant)
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
  const base = baseFrom(to, variant)
  const stage = to.meta.trialStage as GuardStage | undefined
  const go = (s: TrialStage) => store.routeFor(variant, s, base)

  if (stage === 'signup') {
    return run?.account.signedUpAt ? store.entryRouteFor(variant, base) : true
  }
  if (!run?.account.signedUpAt) return go('signup')
  if (stage === 'verify') return true

  const cfg = store.config(variant)
  const verified = !!run.account.verifiedAt
  const previewing = !!run.account.previewEnteredAt
  if (!verified && (cfg.verifyBeforeEntry || !previewing)) return go('verify')
  if (stage === 'preparing') return true
  if (!store.workspaceReady(variant)) return go('preparing')
  if (stage === 'names' && !cfg.askNamesEarly) return go('goal')
  if (stage === 'upgrade' && !verified) {
    // Upgrading is a live action: send the user home with the verify dialog open.
    store.requestGated(variant, 'Upgrading starts real billing, so we confirm it’s you first.')
    return go('home')
  }
  return true
}

function view(name: string) {
  return () => import(`./${name}.vue`)
}

function stageRecord(path: string, stage: GuardStage, component: string, name?: string): RouteRecordRaw {
  const rec: RouteRecordRaw = { path, component: view(component), meta: { trialStage: stage } }
  if (name) rec.name = name
  // The second-tab landing consumes the token and reports — it is never guarded.
  if (stage !== 'link') rec.beforeEnter = guardStage
  return rec
}

/** Child records shared by every family. The lab keeps its names; the real journeys go by path. */
function journeyChildren(family: TrialFamily, formName?: string): RouteRecordRaw[] {
  const lab = family === 'lab'
  const n = (name: string) => (lab ? name : undefined)
  const children: RouteRecordRaw[] = lab
    ? [
        {
          path: '',
          name: 'TrialLabEntry',
          // Pure read: opening a link must never create a run.
          redirect: (to) => {
            const variant = variantFrom(to)
            return variant ? useTrialLabStore().entryRouteFor(variant) : { name: 'TrialLabIndex' }
          },
        },
        stageRecord('signup', 'signup', 'TrialSignupView', 'TrialSignup'),
      ]
    : [stageRecord('', 'signup', 'TrialSignupView', formName)]
  children.push(
    stageRecord('verify', 'verify', 'TrialVerifyView', n('TrialVerify')),
    stageRecord('verify-link/:token', 'link', 'TrialVerifyLinkView', n('TrialVerifyLink')),
    stageRecord('preparing', 'preparing', 'TrialPreparingView', n('TrialPreparing')),
    stageRecord('names', 'names', 'TrialNamesView', n('TrialNames')),
    stageRecord('goal', 'goal', 'TrialGoalView', n('TrialGoal')),
    stageRecord('task/:goal(marketing|commerce|service)', 'task', 'TrialTaskView', n('TrialTask')),
    stageRecord('home', 'home', 'TrialHomeView', n('TrialHome')),
    stageRecord('upgrade', 'upgrade', 'TrialUpgradeView', n('TrialUpgrade')),
  )
  return children
}

export const trialLabRoutes: RouteRecordRaw[] = [
  {
    path: '/trial-lab',
    name: 'TrialLabIndex',
    component: view('TrialLabIndex'),
    meta: META,
  },
  {
    path: '/trial-lab/:variant(a|b|c|d|e)',
    component: view('TrialLabLayout'),
    meta: { ...META, trialFamily: 'lab' },
    children: journeyChildren('lab'),
  },
  // The real journey — the app's own signup. Classic one-page form (variant E).
  {
    path: '/signup',
    component: view('TrialLabLayout'),
    meta: { ...META, trialFamily: 'signup', trialBase: '/signup', trialVariant: 'e' },
    children: journeyChildren('signup', 'Signup'),
  },
  // The real journey with the minimal form (variant B).
  {
    path: '/signup/minimal',
    component: view('TrialLabLayout'),
    meta: { ...META, trialFamily: 'signup', trialBase: '/signup/minimal', trialVariant: 'b' },
    children: journeyChildren('signup', 'SignupMinimal'),
  },
]
