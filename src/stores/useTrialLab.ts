import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import {
  VARIANTS,
  isTrialVariant,
  variantConfig,
  type TrialGoal,
  type TrialStage,
  type TrialVariant,
  type VariantConfig,
} from './trialLabData'

/**
 * Trial Lab — isolated state for the four free-trial onboarding prototypes at
 * `/trial-lab`. One simulated run per variant (a–d), persisted under its own
 * key so reviewers can refresh, resume and open a second tab.
 *
 * Deliberately separate from `useAccounts` / `useUserProfile` / `usePlg` /
 * `useOnboarding`: those hold the demo identity every other page shows, and a
 * prototype signup must never leak a fake account into them. Nothing here is
 * read by the rest of the app.
 *
 * Passwords are never part of this state — the signup view keeps them in a
 * local ref and clears them after the simulated submit.
 */

export type { TrialGoal, TrialStage, TrialVariant }

export interface VerificationChallenge {
  id: string
  /** Link token. Simulation data — shown in the simulated inbox, never logged. */
  token: string
  /** Six-digit code. Simulation data — shown in the simulated inbox, never logged. */
  code: string
  sentAt: string
  /** When the simulated inbox shows the email (later than sentAt in the delayed-email scenario). */
  deliverAt: string
  expiresAt: string
  usedAt: string | null
  wrongAttempts: number
}

export interface SentEmail {
  id: string
  challengeId: string
  to: string
  subject: string
  sentAt: string
  deliverAt: string
}

export type ProvisioningStatus = 'idle' | 'preparing' | 'ready' | 'failed'

export interface Workspace {
  /** Stable — shown beneath the fallback label so two unnamed workspaces stay distinguishable. */
  id: string
  /** User-supplied label. null = unnamed; the display falls back to "Trial workspace". */
  name: string | null
  createdAt: string
  provisioning: { status: ProvisioningStatus; startedAt: string | null; readyAt: string | null; attempts: number }
  trialStartedAt: string | null
  trialEndsAt: string | null
}

export interface SampleDrafts {
  marketing: { templateId: string | null; subject: string; body: string; savedAt: string | null }
  commerce: { heading: string; accentKey: string; savedAt: string | null }
  service: { reply: string; savedAt: string | null }
}

export type TrialEventName =
  | 'signup_completed'
  | 'verification_prompted'
  | 'verification_succeeded'
  | 'preview_entered'
  | 'workspace_ready'
  | 'workspace_failed'
  | 'trial_activated'
  | 'goal_selected'
  | 'sample_task_completed'
  | 'name_prompt_shown'
  | 'name_saved'
  | 'gated_action_blocked'
  | 'upgrade_step_viewed'
  | 'upgrade_step_completed'

/** Closed value type: no free strings, so an email, name, code or draft can't land in the log. */
export type TrialEventValue = TrialVariant | TrialGoal | number | boolean | 'person' | 'workspace' | 'code' | 'link' | 'resend' | 'initial' | 'change-email'

export interface TrialEvent {
  name: TrialEventName
  at: string
  /** Milliseconds since the run was created. */
  elapsedMs: number
  properties: Record<string, TrialEventValue>
}

export interface TrialScenarios {
  delayedEmail: boolean
  expireNext: boolean
  existingAccount: boolean
  provisioningFails: boolean
}

export interface TrialRun {
  variant: TrialVariant
  createdAt: string
  stage: TrialStage
  account: {
    email: string | null
    personName: string | null
    signedUpAt: string | null
    verifiedAt: string | null
    previewEnteredAt: string | null
  }
  /** The single live challenge; resend replaces it and the previous link/code become superseded. */
  challenge: VerificationChallenge | null
  inbox: SentEmail[]
  workspaces: Workspace[]
  activeWorkspaceId: string
  goal: TrialGoal | null
  drafts: SampleDrafts
  events: TrialEvent[]
  scenarios: TrialScenarios
}

export type CodeResult = 'ok' | 'wrong' | 'expired' | 'used' | 'none'
export type LinkResult = 'ok' | 'expired' | 'used' | 'superseded'
export type ChallengeState = 'none' | 'delayed' | 'pending' | 'expired' | 'used'

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'mp.trial-lab.v1'
const TRIAL_DAYS = 14
const DAY_MS = 86_400_000
const CODE_TTL_MS = 10 * 60_000
const DELAYED_EMAIL_MS = 8_000
const PROVISIONING_MS = 2_400
const MAX_EVENTS = 200

function nowIso(): string {
  return new Date().toISOString()
}

function isoAfter(ms: number): string {
  return new Date(Date.now() + ms).toISOString()
}

function ms(iso: string): number {
  return new Date(iso).getTime()
}

let idCounter = 0
function makeId(prefix: string): string {
  idCounter += 1
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}`
}

function makeToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '')
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
}

function makeCode(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000))
}

function freshWorkspace(): Workspace {
  return {
    id: makeId('ws'),
    name: null,
    createdAt: nowIso(),
    provisioning: { status: 'idle', startedAt: null, readyAt: null, attempts: 0 },
    trialStartedAt: null,
    trialEndsAt: null,
  }
}

function freshDrafts(): SampleDrafts {
  return {
    marketing: { templateId: null, subject: '', body: '', savedAt: null },
    commerce: { heading: '', accentKey: 'blue', savedAt: null },
    service: { reply: '', savedAt: null },
  }
}

function freshRun(variant: TrialVariant): TrialRun {
  const ws = freshWorkspace()
  return {
    variant,
    createdAt: nowIso(),
    stage: 'signup',
    account: { email: null, personName: null, signedUpAt: null, verifiedAt: null, previewEnteredAt: null },
    challenge: null,
    inbox: [],
    workspaces: [ws],
    activeWorkspaceId: ws.id,
    goal: null,
    drafts: freshDrafts(),
    events: [],
    scenarios: { delayedEmail: false, expireNext: false, existingAccount: false, provisioningFails: false },
  }
}

type Runs = Partial<Record<TrialVariant, TrialRun>>

function isRun(x: unknown): x is TrialRun {
  if (!x || typeof x !== 'object') return false
  const r = x as Record<string, unknown>
  return isTrialVariant(r.variant) && typeof r.createdAt === 'string' && Array.isArray(r.workspaces) && typeof r.account === 'object'
}

function parseRuns(raw: string | null): Runs {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    const out: Runs = {}
    for (const v of VARIANTS) {
      const candidate = (parsed as Record<string, unknown>)[v.key]
      if (isRun(candidate)) out[v.key] = candidate
    }
    return out
  } catch {
    return {}
  }
}

function readStored(): Runs {
  if (typeof window === 'undefined') return {}
  try {
    return parseRuns(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return {}
  }
}

const STAGE_ROUTE: Record<TrialStage, string> = {
  signup: 'TrialSignup',
  verify: 'TrialVerify',
  preparing: 'TrialPreparing',
  names: 'TrialNames',
  goal: 'TrialGoal',
  task: 'TrialTask',
  home: 'TrialHome',
  upgrade: 'TrialUpgrade',
}

// Module-level so HMR re-running the store setup neither doubles the listener
// nor loses the echo guard.
let lastWritten = ''
let storageListenerInstalled = false

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useTrialLabStore = defineStore('trialLab', () => {
  const runs = ref<Runs>(readStored())

  /** Coarse clock for time-derived UI (provisioning progress, delayed inbox). Never persisted. */
  const tick = ref(Date.now())

  // Transient UI state shared by the lab layout, header and views — not persisted.
  const ui = ref<{
    reviewerOpen: boolean
    nameDrawer: 'person' | 'workspace' | null
    verifyDialog: { reason: string } | null
  }>({
    reviewerOpen: readReviewerPref(),
    nameDrawer: null,
    verifyDialog: null,
  })

  function readReviewerPref(): boolean {
    try {
      return localStorage.getItem(`${STORAGE_KEY}.reviewer`) === 'open'
    } catch {
      return false
    }
  }
  watch(() => ui.value.reviewerOpen, (open) => {
    try {
      localStorage.setItem(`${STORAGE_KEY}.reviewer`, open ? 'open' : 'closed')
    } catch {
      /* private browsing — the toggle still works for this session */
    }
  })

  // ── Persistence + cross-tab sync ───────────────────────────────────────────
  watch(runs, (next) => {
    if (typeof window === 'undefined') return
    const json = JSON.stringify(next)
    if (json === lastWritten) return
    lastWritten = json
    try {
      window.localStorage.setItem(STORAGE_KEY, json)
    } catch {
      /* ignore storage quota / disabled errors */
    }
  }, { deep: true })

  if (typeof window !== 'undefined' && !storageListenerInstalled) {
    storageListenerInstalled = true
    window.addEventListener('storage', (e) => {
      if (e.key !== STORAGE_KEY || e.newValue == null || e.newValue === lastWritten) return
      lastWritten = e.newValue
      runs.value = parseRuns(e.newValue)
    })
  }

  // ── Clock: runs only while something is time-dependent ─────────────────────
  const hasPending = computed(() => Object.values(runs.value).some((run) => {
    if (!run) return false
    const now = tick.value
    if (run.workspaces.some(w => w.provisioning.status === 'preparing')) return true
    if (run.inbox.some(m => ms(m.deliverAt) > now)) return true
    const c = run.challenge
    if (c && !c.usedAt && ms(c.expiresAt) > now && !run.account.verifiedAt) return true
    return false
  }))

  let interval: ReturnType<typeof setInterval> | null = null
  watch(hasPending, (pending) => {
    if (pending && !interval) {
      interval = setInterval(() => { tick.value = Date.now() }, 500)
    } else if (!pending && interval) {
      clearInterval(interval)
      interval = null
    }
  }, { immediate: true })

  // Provisioning completes from elapsed time, so refresh / back / a second tab
  // all agree; this watch commits the status change once.
  watch(tick, (now) => {
    for (const run of Object.values(runs.value)) {
      if (!run) continue
      for (const ws of run.workspaces) {
        const p = ws.provisioning
        if (p.status !== 'preparing' || !p.startedAt) continue
        if (now - ms(p.startedAt) < PROVISIONING_MS) continue
        if (run.scenarios.provisioningFails && p.attempts === 1) {
          p.status = 'failed'
          recordEvent(run.variant, 'workspace_failed', { attempt: p.attempts })
        } else {
          p.status = 'ready'
          p.readyAt = nowIso()
          recordEvent(run.variant, 'workspace_ready', { attempt: p.attempts })
          activateTrialIfReady(run.variant)
        }
      }
    }
  })

  // ── Reads ──────────────────────────────────────────────────────────────────
  function run(variant: TrialVariant): TrialRun | undefined {
    return runs.value[variant]
  }

  function config(variant: TrialVariant): VariantConfig {
    return variantConfig(variant)
  }

  function activeWorkspace(variant: TrialVariant): Workspace | undefined {
    const r = run(variant)
    return r?.workspaces.find(w => w.id === r.activeWorkspaceId) ?? r?.workspaces[0]
  }

  function isVerified(variant: TrialVariant): boolean {
    return !!run(variant)?.account.verifiedAt
  }

  /** Signed up, not verified, and already past the verify screen (C/D "explore while you wait"). */
  function inPreview(variant: TrialVariant): boolean {
    const r = run(variant)
    return !!r && !r.account.verifiedAt && !!r.account.previewEnteredAt
  }

  function workspaceReady(variant: TrialVariant): boolean {
    return activeWorkspace(variant)?.provisioning.status === 'ready'
  }

  function daysLeft(variant: TrialVariant): number {
    const ws = activeWorkspace(variant)
    if (!ws?.trialEndsAt) return 0
    return Math.max(0, Math.ceil((ms(ws.trialEndsAt) - Date.now()) / DAY_MS))
  }

  function trialStarted(variant: TrialVariant): boolean {
    return !!activeWorkspace(variant)?.trialStartedAt
  }

  function trialLabel(variant: TrialVariant): string {
    if (!trialStarted(variant)) return 'Preview · Trial not started'
    const d = daysLeft(variant)
    return d === 1 ? 'Trial · 1 day left' : `Trial · ${d} days left`
  }

  function workspaceLabel(ws: Workspace | undefined): string {
    return ws?.name?.trim() || 'Trial workspace'
  }

  /** The stable ID, shown only while the workspace has no name of its own. */
  function workspaceCaption(ws: Workspace | undefined): string | undefined {
    return ws && !ws.name?.trim() ? ws.id : undefined
  }

  function hasPersonName(variant: TrialVariant): boolean {
    return !!run(variant)?.account.personName?.trim()
  }

  function hasWorkspaceName(variant: TrialVariant): boolean {
    return !!activeWorkspace(variant)?.name?.trim()
  }

  function greeting(variant: TrialVariant): string {
    const name = run(variant)?.account.personName?.trim()
    return name ? `Welcome, ${name}` : 'Welcome to Maropost'
  }

  /** Emails whose simulated delivery time has passed, newest first. */
  function visibleInbox(variant: TrialVariant): SentEmail[] {
    const now = tick.value
    return (run(variant)?.inbox ?? []).filter(m => ms(m.deliverAt) <= now).slice().reverse()
  }

  function challengeState(variant: TrialVariant): ChallengeState {
    const c = run(variant)?.challenge
    if (!c) return 'none'
    if (c.usedAt) return 'used'
    const now = tick.value
    if (ms(c.expiresAt) <= now) return 'expired'
    if (ms(c.deliverAt) > now) return 'delayed'
    return 'pending'
  }

  function nextStageAfter(variant: TrialVariant, stage: TrialStage): TrialStage {
    const cfg = config(variant)
    switch (stage) {
      case 'signup': return 'verify'
      case 'verify': return 'preparing'
      case 'preparing': return cfg.askNamesEarly ? 'names' : 'goal'
      case 'names': return 'goal'
      case 'goal': return 'task'
      case 'task': return 'home'
      default: return 'home'
    }
  }

  function routeFor(variant: TrialVariant, stage: TrialStage): RouteLocationRaw {
    const r = run(variant)
    if (stage === 'task') {
      return { name: 'TrialTask', params: { variant, goal: r?.goal ?? 'marketing' } }
    }
    return { name: STAGE_ROUTE[stage], params: { variant } }
  }

  /** Where a direct entry to `/trial-lab/:variant` should land. Pure read — never creates a run. */
  function entryRouteFor(variant: TrialVariant): RouteLocationRaw {
    const r = run(variant)
    if (!r || !r.account.signedUpAt) return { name: 'TrialSignup', params: { variant } }
    return routeFor(variant, r.stage)
  }

  // ── Writes ─────────────────────────────────────────────────────────────────
  function ensureRun(variant: TrialVariant): TrialRun {
    if (!runs.value[variant]) runs.value[variant] = freshRun(variant)
    return runs.value[variant]!
  }

  function recordEvent(variant: TrialVariant, name: TrialEventName, properties: Record<string, TrialEventValue> = {}) {
    const r = run(variant)
    if (!r) return
    const at = nowIso()
    r.events = [...r.events, { name, at, elapsedMs: ms(at) - ms(r.createdAt), properties }].slice(-MAX_EVENTS)
  }

  function setStage(variant: TrialVariant, stage: TrialStage) {
    const r = run(variant)
    if (r && r.stage !== stage) r.stage = stage
  }

  function issueChallenge(variant: TrialVariant, method: 'initial' | 'resend' | 'change-email') {
    const r = ensureRun(variant)
    const sentAt = nowIso()
    const delayed = r.scenarios.delayedEmail
    const expireNow = r.scenarios.expireNext
    r.challenge = {
      id: makeId('ch'),
      token: makeToken(),
      code: makeCode(),
      sentAt,
      deliverAt: delayed ? isoAfter(DELAYED_EMAIL_MS) : sentAt,
      expiresAt: expireNow ? isoAfter(-1_000) : isoAfter(CODE_TTL_MS),
      usedAt: null,
      wrongAttempts: 0,
    }
    if (expireNow) r.scenarios.expireNext = false
    r.inbox = [...r.inbox, {
      id: makeId('em'),
      challengeId: r.challenge.id,
      to: r.account.email ?? '',
      subject: 'Verify your email for Maropost',
      sentAt,
      deliverAt: r.challenge.deliverAt,
    }]
    recordEvent(variant, 'verification_prompted', { method })
    tick.value = Date.now()
  }

  /** Returns 'existing' when the existing-account scenario is on — the view shows sign-in guidance instead. */
  function completeSignup(variant: TrialVariant, email: string): 'ok' | 'existing' {
    const r = ensureRun(variant)
    if (r.scenarios.existingAccount) return 'existing'
    r.account.email = email.trim()
    r.account.signedUpAt = nowIso()
    recordEvent(variant, 'signup_completed', { variant })
    issueChallenge(variant, 'initial')
    r.stage = 'verify'
    return 'ok'
  }

  function resend(variant: TrialVariant) {
    issueChallenge(variant, 'resend')
  }

  function changeEmail(variant: TrialVariant, email: string) {
    const r = run(variant)
    if (!r) return
    r.account.email = email.trim()
    issueChallenge(variant, 'change-email')
  }

  function markVerified(variant: TrialVariant, method: 'code' | 'link') {
    const r = run(variant)
    if (!r || r.account.verifiedAt) return
    const at = nowIso()
    r.account.verifiedAt = at
    if (r.challenge) r.challenge.usedAt = at
    recordEvent(variant, 'verification_succeeded', { method })
    activateTrialIfReady(variant)
  }

  function submitCode(variant: TrialVariant, code: string): CodeResult {
    const r = run(variant)
    const c = r?.challenge
    if (!r || !c) return 'none'
    if (r.account.verifiedAt || c.usedAt) return 'used'
    if (ms(c.expiresAt) <= Date.now()) return 'expired'
    if (code.trim() !== c.code) {
      c.wrongAttempts += 1
      return 'wrong'
    }
    markVerified(variant, 'code')
    return 'ok'
  }

  function consumeLink(variant: TrialVariant, token: string): LinkResult {
    const r = run(variant)
    const c = r?.challenge
    if (!r || !c) return 'superseded'
    if (c.token !== token) return r.account.verifiedAt ? 'used' : 'superseded'
    if (r.account.verifiedAt || c.usedAt) return 'used'
    if (ms(c.expiresAt) <= Date.now()) return 'expired'
    markVerified(variant, 'link')
    return 'ok'
  }

  function enterPreview(variant: TrialVariant) {
    const r = run(variant)
    if (!r) return
    if (!r.account.previewEnteredAt) {
      r.account.previewEnteredAt = nowIso()
      recordEvent(variant, 'preview_entered', { variant })
    }
    r.stage = 'preparing'
  }

  function startProvisioning(variant: TrialVariant) {
    const ws = activeWorkspace(variant)
    if (!ws || ws.provisioning.status === 'ready' || ws.provisioning.status === 'preparing') return
    ws.provisioning = { status: 'preparing', startedAt: nowIso(), readyAt: null, attempts: ws.provisioning.attempts + 1 }
    tick.value = Date.now()
  }

  function retryProvisioning(variant: TrialVariant) {
    const ws = activeWorkspace(variant)
    if (!ws || ws.provisioning.status !== 'failed') return
    ws.provisioning = { ...ws.provisioning, status: 'idle' }
    startProvisioning(variant)
  }

  /** The 14-day clock starts once, and only when the email is verified AND the workspace is ready. */
  function activateTrialIfReady(variant: TrialVariant) {
    const r = run(variant)
    const ws = activeWorkspace(variant)
    if (!r || !ws || ws.trialStartedAt) return
    if (!r.account.verifiedAt || ws.provisioning.status !== 'ready') return
    ws.trialStartedAt = nowIso()
    ws.trialEndsAt = isoAfter(TRIAL_DAYS * DAY_MS)
    recordEvent(variant, 'trial_activated', { variant })
  }

  function setGoal(variant: TrialVariant, goal: TrialGoal) {
    const r = run(variant)
    if (!r) return
    if (r.goal !== goal) {
      r.goal = goal
      recordEvent(variant, 'goal_selected', { goal })
    }
  }

  function saveDraft<G extends TrialGoal>(variant: TrialVariant, goal: G, draft: Omit<SampleDrafts[G], 'savedAt'>) {
    const r = run(variant)
    if (!r) return
    const first = !r.drafts[goal].savedAt
    r.drafts[goal] = { ...draft, savedAt: nowIso() } as SampleDrafts[G]
    recordEvent(variant, 'sample_task_completed', { goal, first })
  }

  function setPersonName(variant: TrialVariant, name: string | null) {
    const r = run(variant)
    if (!r) return
    r.account.personName = name?.trim() || null
    recordEvent(variant, 'name_saved', { field: 'person', supplied: !!r.account.personName })
  }

  function renameWorkspace(variant: TrialVariant, id: string, name: string | null) {
    const ws = run(variant)?.workspaces.find(w => w.id === id)
    if (!ws) return
    ws.name = name?.trim() || null
    recordEvent(variant, 'name_saved', { field: 'workspace', supplied: !!ws.name })
  }

  function addWorkspace(variant: TrialVariant): Workspace | undefined {
    const r = run(variant)
    if (!r) return
    const ws = freshWorkspace()
    // A second workspace in the same run starts ready — the scenario is about naming, not provisioning.
    ws.provisioning = { status: 'ready', startedAt: ws.createdAt, readyAt: ws.createdAt, attempts: 1 }
    r.workspaces = [...r.workspaces, ws]
    return ws
  }

  function switchWorkspace(variant: TrialVariant, id: string) {
    const r = run(variant)
    if (r && r.workspaces.some(w => w.id === id)) r.activeWorkspaceId = id
  }

  function setScenario<K extends keyof TrialScenarios>(variant: TrialVariant, key: K, value: TrialScenarios[K]) {
    const r = run(variant)
    if (r) r.scenarios[key] = value
  }

  /** Reviewer helper: expire the live challenge right now. */
  function expireCurrentChallenge(variant: TrialVariant) {
    const c = run(variant)?.challenge
    if (c) c.expiresAt = isoAfter(-1_000)
    tick.value = Date.now()
  }

  /**
   * A live action attempted from the UI. Verified → the caller simulates it.
   * Unverified → opens the verify dialog with the reason and records the block.
   */
  function requestGated(variant: TrialVariant, reason: string): boolean {
    if (isVerified(variant)) return true
    recordEvent(variant, 'gated_action_blocked', { variant })
    ui.value.verifyDialog = { reason }
    return false
  }

  function resetRun(variant: TrialVariant) {
    const next = { ...runs.value }
    delete next[variant]
    runs.value = next
  }

  function resetAll() {
    runs.value = {}
  }

  return {
    runs,
    tick,
    ui,
    run,
    config,
    activeWorkspace,
    isVerified,
    inPreview,
    workspaceReady,
    daysLeft,
    trialStarted,
    trialLabel,
    workspaceLabel,
    workspaceCaption,
    hasPersonName,
    hasWorkspaceName,
    greeting,
    visibleInbox,
    challengeState,
    nextStageAfter,
    routeFor,
    entryRouteFor,
    ensureRun,
    recordEvent,
    setStage,
    completeSignup,
    resend,
    changeEmail,
    submitCode,
    consumeLink,
    enterPreview,
    startProvisioning,
    retryProvisioning,
    setGoal,
    saveDraft,
    setPersonName,
    renameWorkspace,
    addWorkspace,
    switchWorkspace,
    setScenario,
    expireCurrentChallenge,
    requestGated,
    resetRun,
    resetAll,
  }
})
