import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import router from '@/router'
import { useAccountsStore } from './useAccounts'
import { usePlgStore } from './usePlg'
import { useRbacStore } from './useRbac'
import { useCommerceStore } from './useCommerce'
import { useProductExtrasStore } from './useProductExtras'
import {
  useCopilotStore,
  type CatalogDraftProps,
  type CatalogDraftStatus,
  type ChatComponent,
  type IntentCardsProps,
} from './useCopilot'
import {
  generateCreateDraft,
  generateEnrichDraft,
  mergeBrief,
  type CatalogDraft,
  type CatalogFieldKey,
  type CatalogGenOutcome,
  type CatalogVocab,
  type ProductSnapshot,
} from '@/composables/useCatalogGenerator'
import {
  CATALOG_PRESETS,
  CREDITS_PER_ACTION,
  STARTER_PACK_CREDITS,
  TRIAL_CREDITS,
  isCatalogPreset,
  isCatalogScenario,
  remainingActions as actionsLeftIn,
  remainingCredits as creditsLeftIn,
  type CatalogCtaAction,
  type CatalogField,
  type CatalogGateReason,
  type CatalogMode,
  type CatalogPreset,
  type CatalogScenario,
  type CatalogSurface,
  type CatalogTarget,
  type CatalogWallet,
} from '@/composables/catalogCopilotConfig'
import {
  trackCatalogEvent,
  type CatalogEntitlement,
  type CatalogEventName,
  type CatalogEventProperties,
  type CatalogUserProperties,
} from '@/composables/useCatalogCopilotAnalytics'

/**
 * Da Vinci Catalog Co-Pilot — the Unified Co-Pilot's catalog context inside the
 * Products module (PRD: Da Vinci Catalog Management).
 *
 * Owns four things: the drawer's catalog context (create / enrich / field), the
 * entitlement gate (flag, kill switch, role, Commerce Cloud, credits), the
 * per-account credit ledger, and the Apply bridge. Apply never writes the catalog:
 * it hands the draft to the create stepper or edit page as a pending payload, the
 * form hydrates its in-memory state, and the merchant's own Save / Publish persists.
 * Credits move when the form confirms the hydrate — never on Publish or Discard.
 */

export interface CatalogContext {
  mode: CatalogMode
  field?: CatalogField
  surface: CatalogSurface
  productId?: number
  productName?: string
  /** The open form's values when the drawer opened (unsaved edits included). */
  snapshot?: ProductSnapshot
  /** Where Apply lands. */
  target: CatalogTarget
  /** Create mode: the brief so far, so a follow-up refines it instead of starting over. */
  brief?: string
}

export interface CatalogApplyPayload {
  id: string
  draftId: string
  mode: CatalogMode
  field?: CatalogField
  productId?: number
  target: CatalogTarget
  fields: CatalogDraft
  keys: CatalogFieldKey[]
  appliedAt: number
}

export type CatalogApplyResult = { ok: true } | { ok: false; reason: CatalogGateReason | 'navigation' }

interface LedgerEntry {
  at: string
  action: CatalogCtaAction
  credits: number
  wallet: 'trial' | 'pack'
  productId?: number
}

interface PersistedCatalogState {
  scenario: CatalogScenario
  trialCreditsUsed: number
  packCreditsUsed: number
  ledger: LedgerEntry[]
  updatedAt: string
}

const STORAGE_PREFIX = 'mp.davinci.catalog.v1'
const MAX_LEDGER = 50
/** Create mode stays live across the list → stepper hop that Apply makes. */
const CREATE_ROUTES = new Set(['Products', 'ProductNew'])

function storageKey(accountId: string) {
  return `${STORAGE_PREFIX}:${accountId}`
}

function readAccountState(accountId: string): PersistedCatalogState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey(accountId))
    return raw ? (JSON.parse(raw) as PersistedCatalogState) : null
  } catch {
    return null
  }
}

const EMPTY_SNAPSHOT: ProductSnapshot = {
  name: '', subtitle: '', sku: '', description: '', brand: '', tag: '', categories: [], collection: '', options: [],
}

export const useCatalogCopilotStore = defineStore('catalogCopilot', () => {
  const accounts = useAccountsStore()
  const plg = usePlgStore()
  const rbac = useRbacStore()
  const copilot = useCopilotStore()

  const activeAccountId = ref<string | null>(null)
  const scenario = ref<CatalogScenario>('auto')
  const trialCreditsUsed = ref(0)
  const packCreditsUsed = ref(0)
  const ledger = ref<LedgerEntry[]>([])

  const context = ref<CatalogContext | null>(null)
  const pendingApply = ref<CatalogApplyPayload | null>(null)

  // ── Entitlement ────────────────────────────────────────────────────────────

  /** Feature flag `davinci.catalog_management`. */
  const flagOn = computed(() => scenario.value !== 'flag_off')
  const killSwitch = computed(() => scenario.value === 'kill_switch')
  const hasCommerce = computed(() => accounts.hasSubscription('commerce'))
  /** Build tier: Da Vinci is excluded, so the CTA isn't offered at all. */
  const isBuild = computed(() => plg.active.mode === 'paid' && plg.active.tiers.commerce === 'build')
  /** Role, not entitlement: only people who can create or edit products may invoke it. */
  const canInvoke = computed(() => {
    if (scenario.value === 'view_only') return false
    const granted = rbac.effectivePermissions(rbac.currentUserId)
    return granted.has('commerce.products.create') || granted.has('commerce.products.edit')
  })

  const wallet = computed<CatalogWallet>(() => {
    const trial = (used: number, expired = false): CatalogWallet => ({ kind: 'trial', limit: TRIAL_CREDITS, used, expired })
    const pack = (used: number): CatalogWallet => ({ kind: 'pack', limit: STARTER_PACK_CREDITS, used, expired: false })
    const none: CatalogWallet = { kind: 'none', limit: 0, used: 0, expired: false }
    switch (scenario.value) {
      case 'trial': return trial(trialCreditsUsed.value)
      case 'trial_exhausted': return trial(TRIAL_CREDITS)
      case 'no_pack': return none
      case 'pack_exhausted': return pack(STARTER_PACK_CREDITS)
      default: break
    }
    // Live: a trial gets the catalog allowance (expiring with the trial); a paid
    // account needs the Da Vinci add-on or a Da Vinci subscription.
    if (plg.isTrial) return plg.isExpired ? trial(TRIAL_CREDITS, true) : trial(trialCreditsUsed.value)
    if (plg.active.addOns.includes('davinci_tokens') || accounts.hasSubscription('davinci')) return pack(packCreditsUsed.value)
    return none
  })

  const remainingCredits = computed(() => creditsLeftIn(wallet.value))
  const remainingActions = computed(() => actionsLeftIn(wallet.value))
  const entitlement = computed<CatalogEntitlement>(() =>
    wallet.value.kind === 'trial' ? 'trial' : wallet.value.kind === 'pack' ? 'copilot_pack' : 'none',
  )

  /** The CTA shows whenever the flag is on and the plan isn't Build — gated or not. */
  const ctaVisible = computed(() => flagOn.value && !isBuild.value)

  const gateReason = computed<CatalogGateReason | null>(() => {
    if (killSwitch.value) return 'kill_switch'
    if (!canInvoke.value) return 'role'
    if (!hasCommerce.value) return 'no_commerce'
    if (wallet.value.kind === 'none') return 'no_credits'
    if (remainingActions.value < 1) return wallet.value.kind === 'trial' ? 'trial_exhausted' : 'no_credits'
    return null
  })

  const isActive = computed(() => context.value !== null)
  const hasDemoState = computed(() => scenario.value !== 'auto' || ledger.value.length > 0)

  // ── Persistence (per account) ──────────────────────────────────────────────

  function persist() {
    if (typeof window === 'undefined' || !activeAccountId.value) return
    try {
      const state: PersistedCatalogState = {
        scenario: scenario.value,
        trialCreditsUsed: trialCreditsUsed.value,
        packCreditsUsed: packCreditsUsed.value,
        ledger: ledger.value.slice(-MAX_LEDGER),
        updatedAt: new Date().toISOString(),
      }
      window.localStorage.setItem(storageKey(activeAccountId.value), JSON.stringify(state))
    } catch {
      /* private mode etc. */
    }
  }

  function activateAccount(accountId: string) {
    if (!accountId || activeAccountId.value === accountId) return
    activeAccountId.value = accountId
    const stored = readAccountState(accountId)
    scenario.value = isCatalogScenario(stored?.scenario) ? stored.scenario : 'auto'
    trialCreditsUsed.value = stored?.trialCreditsUsed ?? 0
    packCreditsUsed.value = stored?.packCreditsUsed ?? 0
    ledger.value = stored?.ledger ?? []
    pendingApply.value = null
    exit()
  }

  // ── Analytics ──────────────────────────────────────────────────────────────

  const userProperties = computed<CatalogUserProperties>(() => {
    const tier = plg.active.tiers.commerce
    return {
      mcc_plan: plg.isTrial ? 'trial' : tier === 'essential' ? 'essentials' : tier ?? 'none',
      davinci_entitlement: entitlement.value,
      davinci_copilot_pack: wallet.value.kind === 'pack' ? 'starter' : 'none',
      davinci_catalog_flag: flagOn.value ? 'on' : 'off',
      trial_catalog_actions_remaining: wallet.value.kind === 'trial' ? remainingActions.value : null,
      user_role: canInvoke.value ? 'admin' : 'view',
    }
  })

  function track(name: CatalogEventName, properties: CatalogEventProperties = {}) {
    // Flag off: no merchant-facing Catalog events. Product Created / Published still fire.
    if (!flagOn.value && name.startsWith('MCC - Da Vinci Catalog')) return
    trackCatalogEvent(name, accounts.activeId, properties, userProperties.value)
  }

  function ctaViewed(surface: Exclude<CatalogSurface, 'chat'>) {
    track('MCC - Da Vinci Catalog - CTA Viewed', {
      surface,
      entitlement: entitlement.value,
      is_trial: wallet.value.kind === 'trial',
    })
  }

  function ctaClicked(surface: Exclude<CatalogSurface, 'chat'>, action: CatalogCtaAction, productId?: number) {
    track('MCC - Da Vinci Catalog - CTA Clicked', { surface, action, product_id: productId ?? null })
  }

  // ── Thread helpers ─────────────────────────────────────────────────────────

  let seq = 0
  function makeId(prefix: string) {
    seq += 1
    return `${prefix}_${Date.now().toString(36)}_${seq.toString(36)}`
  }

  function pushAssistant(text: string, componentData?: ChatComponent[]) {
    copilot.messages.push({ id: makeId('a'), role: 'assistant', text, componentData })
    copilot.chatMode = true
  }

  function eachDraft(visit: (props: CatalogDraftProps) => void) {
    for (const message of copilot.messages) {
      for (const component of message.componentData ?? []) {
        if (component.type === 'catalogDraft') visit(component.props as CatalogDraftProps)
      }
    }
  }

  /** Retire the starting points of a session that ended — picking one would send it outside that session. */
  function retireStartingPoints() {
    for (const message of copilot.messages) {
      for (const component of message.componentData ?? []) {
        if (component.type !== 'intentCards') continue
        const props = component.props as IntentCardsProps
        if (props.layout === 'list') props.retired = true
      }
    }
  }

  /** Retire drafts nobody acted on — a newer draft replaced them, or the context ended. */
  function closeOpenDrafts(status: Extract<CatalogDraftStatus, 'superseded' | 'inactive'>) {
    eachDraft((props) => {
      if (props.status === 'draft') props.status = status
    })
  }

  function markDraft(draftId: string, status: CatalogDraftStatus, appliedKeys?: CatalogFieldKey[]) {
    eachDraft((props) => {
      if (props.draftId !== draftId) return
      props.status = status
      if (appliedKeys) props.appliedKeys = appliedKeys
    })
  }

  function pushGate() {
    const reason = gateReason.value
    if (!reason) return
    pushAssistant('', [{ type: 'catalogGate', props: { reason, wallet: { ...wallet.value } } }])
    track('MCC - Da Vinci Catalog - Gate Viewed', { gate_reason: reason })
  }

  function presetsFor(ctx: CatalogContext): CatalogPreset[] {
    return ctx.mode === 'field' ? CATALOG_PRESETS[ctx.field ?? 'description'] : CATALOG_PRESETS[ctx.mode]
  }

  function greetingFor(ctx: CatalogContext): string {
    const name = ctx.productName?.trim() || 'this product'
    if (ctx.mode === 'enrich') {
      return `I can suggest a better description, categories, SEO listing and tags for ${name}, or file it where you say — “put it in Home & Kitchen”. Nothing changes until you click Save.`
    }
    return 'Tell me about the product you want to add, or pick a starting point. I’ll draft it for you to review — nothing is saved until you apply the draft and click Save as Draft or Publish.'
  }

  // ── Context ────────────────────────────────────────────────────────────────

  function routeTarget(): CatalogTarget {
    const route = router.currentRoute.value
    const params: Record<string, string> = {}
    for (const [key, value] of Object.entries(route.params)) {
      params[key] = String(Array.isArray(value) ? (value[0] ?? '') : value)
    }
    return { name: String(route.name ?? ''), params }
  }

  function isOnTarget(target: CatalogTarget): boolean {
    const route = router.currentRoute.value
    if (route.name !== target.name) return false
    return Object.entries(target.params).every(([key, expected]) => {
      const value = route.params[key]
      return String(Array.isArray(value) ? (value[0] ?? '') : (value ?? '')) === expected
    })
  }

  function sameContext(a: CatalogContext, b: CatalogContext) {
    return a.mode === b.mode && a.field === b.field && a.productId === b.productId && a.target.name === b.target.name
  }

  let opening = false

  /** Enters catalog context and opens the drawer. Returns false when the flag is off. */
  function begin(next: CatalogContext, greet: boolean): boolean {
    if (!flagOn.value) return false
    const current = context.value
    const already = !!current && sameContext(current, next)
    if (already && current) {
      // Same context again: refresh what the form holds now.
      current.snapshot = next.snapshot
      current.productName = next.productName
    } else {
      closeOpenDrafts('inactive')
      retireStartingPoints()
      context.value = next
    }
    const wasOpen = copilot.isOpen
    if (copilot.widthMode === 'full') copilot.setWidthMode('panel')
    opening = true
    copilot.open()
    opening = false
    if (!already || !wasOpen) {
      track('MCC - Da Vinci Catalog - Drawer Opened', {
        mode: next.mode,
        route_name: String(router.currentRoute.value.name ?? ''),
        entitlement: entitlement.value,
      })
    }
    if (gateReason.value) {
      if (greet && !already) pushGate()
      return true
    }
    if (next.mode === 'field') {
      // A field-level "Generate" is one click: run the default ask straight away.
      copilot.openWithPrompt(presetsFor(next)[0]!.prompt)
    } else if (greet && !already) {
      pushAssistant(greetingFor(next), [{
        type: 'intentCards',
        props: {
          cards: [],
          quickReplies: presetsFor(next).map((p) => ({ label: p.label, value: p.prompt, icon: p.icon, hint: p.hint })),
          layout: 'list',
        },
      }])
    }
    return true
  }

  function openCreate(surface: CatalogSurface, options: { greet?: boolean } = {}) {
    return begin(
      { mode: 'create', surface, target: { name: 'ProductNew', params: { accountId: accounts.activeId } } },
      options.greet ?? true,
    )
  }

  function openEnrich(input: { productId: number; productName: string; snapshot: ProductSnapshot }) {
    return begin({ mode: 'enrich', surface: 'edit', ...input, target: routeTarget() }, true)
  }

  function openField(input: { field: CatalogField; snapshot: ProductSnapshot; productId?: number; productName?: string }) {
    return begin({ mode: 'field', surface: 'field', ...input, target: routeTarget() }, true)
  }

  /** Ends the catalog context. A merchant leaving it ("start over") counts as Discarded. */
  function exit(by: 'user' | 'system' = 'system') {
    const ctx = context.value
    if (!ctx) return
    if (by === 'user') {
      let open = 0
      eachDraft((props) => { if (props.status === 'draft') open += 1 })
      track('MCC - Da Vinci Catalog - Discarded', { mode: ctx.mode, had_draft: open > 0 })
    }
    closeOpenDrafts('inactive')
    retireStartingPoints()
    context.value = null
  }

  // ── Generation ─────────────────────────────────────────────────────────────

  function vocab(): CatalogVocab {
    const commerce = useCommerceStore()
    const extras = useProductExtrasStore()
    return {
      categories: [...new Set(commerce.products.map((p) => p.category))],
      collections: extras.collections.filter((c) => c.status === 'Active').map((c) => c.title),
      brands: [...new Set(commerce.products.map((p) => p.vendor))],
    }
  }

  /** Runs the generator for the current context. A create brief accumulates refinements. */
  function generate(prompt: string): CatalogGenOutcome {
    const ctx = context.value
    if (!ctx) {
      return { ok: false, code: 'unclear', message: 'Open Catalog Co-Pilot from Products to draft a product.', steps: [] }
    }
    if (ctx.mode === 'create') {
      const brief = mergeBrief(ctx.brief, prompt)
      const outcome = generateCreateDraft(brief, vocab())
      if (outcome.ok) ctx.brief = brief
      return outcome
    }
    const ask = ctx.mode === 'field' ? (ctx.field ?? 'description') : 'all'
    return generateEnrichDraft(ctx.snapshot ?? EMPTY_SNAPSHOT, ask, prompt, vocab())
  }

  // ── Apply bridge ───────────────────────────────────────────────────────────

  /**
   * Hands a draft to its form. Nothing is written to the catalog: the payload waits
   * until the create stepper or edit page takes it (`takePendingApply`) and hydrates
   * its in-memory state. If a leave guard cancels the navigation, nothing happens.
   */
  async function apply(input: Omit<CatalogApplyPayload, 'id' | 'appliedAt'>): Promise<CatalogApplyResult> {
    const reason = gateReason.value
    if (reason) {
      pushGate()
      return { ok: false, reason }
    }
    const payload: CatalogApplyPayload = { ...input, id: makeId('apply'), appliedAt: Date.now() }
    pendingApply.value = payload
    if (!isOnTarget(input.target)) {
      const failure = await router.push({ name: input.target.name, params: input.target.params })
      if (failure) {
        if (pendingApply.value?.id === payload.id) pendingApply.value = null
        return { ok: false, reason: 'navigation' }
      }
    }
    return { ok: true }
  }

  /** The form on screen takes the payload meant for it (and only that one). */
  function takePendingApply(): CatalogApplyPayload | null {
    const payload = pendingApply.value
    if (!payload || !isOnTarget(payload.target)) return null
    pendingApply.value = null
    return payload
  }

  function actionOf(payload: CatalogApplyPayload): CatalogCtaAction {
    if (payload.mode === 'create') return 'create'
    if (payload.mode === 'enrich') return 'enrich'
    return payload.field ?? 'description'
  }

  /** The form hydrated: bill one AI Action (10 credits) and record Apply Completed. */
  function confirmApplied(payload: CatalogApplyPayload) {
    const current = wallet.value
    const action = actionOf(payload)
    if (current.kind !== 'none') {
      if (current.kind === 'trial') trialCreditsUsed.value += CREDITS_PER_ACTION
      else packCreditsUsed.value += CREDITS_PER_ACTION
      ledger.value = [
        ...ledger.value,
        { at: new Date().toISOString(), action, credits: CREDITS_PER_ACTION, wallet: current.kind, productId: payload.productId },
      ].slice(-MAX_LEDGER)
      persist()
      track('MCC - Da Vinci Catalog - Credit Consumed', {
        credits: CREDITS_PER_ACTION,
        action,
        pack_type: current.kind === 'trial' ? 'trial' : 'starter',
      })
    }
    track('MCC - Da Vinci Catalog - Apply Completed', {
      mode: payload.mode,
      product_id: payload.productId ?? null,
      fields_applied: payload.keys,
    })
  }

  // ── Demo controls ──────────────────────────────────────────────────────────

  function setScenario(next: CatalogScenario) {
    if (scenario.value === next) return
    scenario.value = next
    // A fresh trial starts with its whole allowance.
    if (next === 'trial') trialCreditsUsed.value = 0
    persist()
    if (!flagOn.value) exit()
  }

  function reset() {
    scenario.value = 'auto'
    trialCreditsUsed.value = 0
    packCreditsUsed.value = 0
    ledger.value = []
    persist()
  }

  // ── Watchers ───────────────────────────────────────────────────────────────

  // Sync flush: callers switch account and act in the same tick.
  watch(() => accounts.activeId, (id) => activateAccount(id), { immediate: true, flush: 'sync' })

  // The context belongs to the page it was opened for; leaving it ends the context.
  watch(() => router.currentRoute.value.fullPath, () => {
    const ctx = context.value
    if (!ctx) return
    const name = String(router.currentRoute.value.name ?? '')
    const keep = ctx.mode === 'create' ? CREATE_ROUTES.has(name) || isOnTarget(ctx.target) : isOnTarget(ctx.target)
    if (!keep) exit()
  })

  // Re-opening the drawer (header icon) while a catalog context is live.
  watch(() => copilot.isOpen, (open) => {
    if (!open || opening || !context.value) return
    track('MCC - Da Vinci Catalog - Drawer Opened', {
      mode: context.value.mode,
      route_name: String(router.currentRoute.value.name ?? ''),
      entitlement: entitlement.value,
    })
  }, { flush: 'sync' })

  return {
    scenario,
    context,
    pendingApply,
    ledger,
    flagOn,
    killSwitch,
    hasCommerce,
    isBuild,
    canInvoke,
    wallet,
    remainingCredits,
    remainingActions,
    entitlement,
    ctaVisible,
    gateReason,
    isActive,
    hasDemoState,
    track,
    ctaViewed,
    ctaClicked,
    isPreset: isCatalogPreset,
    openCreate,
    openEnrich,
    openField,
    exit,
    generate,
    pushGate,
    closeOpenDrafts,
    markDraft,
    apply,
    takePendingApply,
    confirmApplied,
    setScenario,
    reset,
  }
})
