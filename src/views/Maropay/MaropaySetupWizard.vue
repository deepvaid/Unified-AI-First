<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpAlert from '@/components/MpAlert.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpWizardShell from '@/components/MpWizardShell.vue'
import MpWizardStepCard from '@/components/MpWizardStepCard.vue'
import MaropayDemoPanel from '@/components/maropay/MaropayDemoPanel.vue'
import MaropayRatesTable from '@/components/maropay/MaropayRatesTable.vue'
import MaropaySetupTimeline from '@/components/maropay/MaropaySetupTimeline.vue'
import MaropaySupportAlert from '@/components/maropay/MaropaySupportAlert.vue'
import { useToast } from '@/composables/useToast'
import { useWizardSteps } from '@/composables/useWizardSteps'
import { useMaropayStore } from '@/stores/useMaropay'
import { formatMoney, money } from '@/maropay/money'
import { BUSINESS_TYPE_LABELS, COUNTRY_LABELS, DEFAULT_PAYOUT_SCHEDULE, DIAL_CODES, ONBOARDING_STEPS, ROLE_LABELS, localDateKey, personName } from '@/maropay/model'
import { requirementForm, rulesFor } from '@/maropay/requirements'
import type { MaropayError, MockDocument, OnboardingDraft, OnboardingStepKey } from '@/maropay/model'
import { EDITABLE_DRAFT_FIELDS, bankAccountErrors, bankCodeFor, blockingIssues, countryLabel, submissionIssues } from '@/maropay/onboarding'
import { websiteIssue } from '@/maropay/validation'
import type { EditableDraftField, OnboardingPatch, SetupField, SetupIssue } from '@/maropay/onboarding'
import { STEP_LABELS, formatDay, isSupportedCountry, payoutScheduleLabel, storePaymentsTarget } from '@/maropay/readiness'
import type { PartnerDecision } from '@/maropay/readiness'
import { setupTimeline } from '@/maropay/setupTimeline'

// Maropay → Setup: the flow that turns a Maropost account into a verified
// Maropay business (plan §3C). Maropost owns the journey; our payments partner
// owns verification. Four states share the route:
//   wizard      — six steps, saved as the merchant types, resumable
//   requirement — a submitted setup the partner needs more from (?task=)
//   outcome     — submitted: under review, verified or declined, never "approved"
//   locked      — store operations users, who can't edit setup
// The wizard autosaves, so it has no leave guard (MpWizardShell's contract).

const route = useRoute()
const router = useRouter()
const maropay = useMaropayStore()
const toast = useToast()

const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? '2000290'
})
const overviewRoute = computed(() => ({ name: 'MaropayOverview', params: { accountId: accountId.value } }))

// ── Mode ───────────────────────────────────────────────────────────

const isOwner = computed(() => maropay.actingRole === 'owner')
const submitted = computed(() => maropay.account?.setup === 'submitted')

/** The verification request being answered: the one in ?task=, else the oldest open one. */
const requirement = computed(() => {
  if (!submitted.value) return null
  const open = maropay.openTasks.filter((t) => t.kind === 'verification' && t.status === 'open')
  return open.find((t) => t.id === route.query.task) ?? open[0] ?? null
})

const mode = computed<'locked' | 'wizard' | 'requirement' | 'outcome'>(() => {
  if (!maropay.can('edit_onboarding')) return 'locked'
  if (!submitted.value) return 'wizard'
  return requirement.value ? 'requirement' : 'outcome'
})

// ── Draft form ─────────────────────────────────────────────────────
// A local copy of the editable draft, saved back through the store on every
// change. Authority is saved on its own: only an owner may change it.

type FormField = Exclude<EditableDraftField, 'authorityConfirmed'>
const FORM_FIELDS = EDITABLE_DRAFT_FIELDS.filter((f): f is FormField => f !== 'authorityConfirmed')

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function draftForm(): Pick<OnboardingDraft, FormField> {
  const draft = maropay.onboarding
  return clone(Object.fromEntries(FORM_FIELDS.map((f) => [f, draft[f]])) as Pick<OnboardingDraft, FormField>)
}

const form = reactive(draftForm())

const STEP_KEYS = ONBOARDING_STEPS
const stepLabels = STEP_KEYS.map((key) => STEP_LABELS[key])
/** Steps the merchant tried to leave with gaps — only these show field errors. */
const attempted = reactive(new Set<OnboardingStepKey>())

const { step, maxStep, goTo, next, prev } = useWizardSteps(STEP_KEYS.length, {
  canAdvance: (from) => leave(STEP_KEYS[from - 1]!),
  onNavigate: (from, to) => {
    save({ complete: to > from, next: STEP_KEYS[to - 1]! }, STEP_KEYS[from - 1]!)
    void focusRegion()
  },
})
const currentKey = computed(() => STEP_KEYS[step.value - 1]!)

/** Saves what changed; with `options` it also records progress, changed or not. */
function save(options?: { complete?: boolean; next?: OnboardingStepKey }, from: OnboardingStepKey = currentKey.value): void {
  if (mode.value !== 'wizard') return
  const patch: OnboardingPatch = clone(form)
  const draft = maropay.onboarding
  const changed = FORM_FIELDS.some((f) => JSON.stringify(draft[f]) !== JSON.stringify(patch[f]))
  if (changed || options) maropay.saveStep(from, patch, options)
}

watch(() => form.country, (country) => {
  form.business.address.country = country
  form.representative.address.country = country
})
watch(form, () => save(), { deep: true })

const authority = computed({
  get: () => maropay.onboarding.authorityConfirmed,
  set: (value: boolean) => { maropay.saveStep(currentKey.value, { authorityConfirmed: !!value }) },
})

// ── Rules ──────────────────────────────────────────────────────────

const termsVersion = computed(() => maropay.terms.version)

function blocking(key: OnboardingStepKey): SetupIssue[] {
  return blockingIssues(maropay.onboarding, key, termsVersion.value, maropay.actingRole)
}

/** A field's message once the merchant has tried to move on from its step. */
function errorFor(field: SetupField): string | undefined {
  if (!attempted.has(currentKey.value)) return undefined
  return blocking(currentKey.value).find((issue) => issue.field === field)?.message
}

const allIssues = computed(() => submissionIssues(maropay.onboarding, termsVersion.value))
/** What the acting role can fix themselves; owner-only items are the owner's. */
const myIssues = computed(() => allIssues.value.filter((i) => isOwner.value || !i.ownerOnly))

/** Gate for moving forward. Leaving terms with the box ticked is the acceptance; leaving payout saves an open form. */
function leave(key: OnboardingStepKey): boolean {
  if (key === 'terms' && termsChecked.value && !termsAccepted.value) maropay.acceptTerms()
  if (key === 'payout' && isOwner.value && payoutFormOpen.value) {
    if (maropay.onboarding.payout && !payoutDirty.value) payoutEditing.value = false
    else if (!savePayoutForm()) return false
  }
  if (!blocking(key).length) return true
  attempted.add(key)
  void focusFirstError()
  return false
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

const unsupported = computed(() => !isSupportedCountry(form.country))

const hint = computed(() => {
  if (mode.value !== 'wizard') return undefined
  if (currentKey.value === 'business' && unsupported.value) return `Maropay isn’t available in ${countryLabel(form.country)} yet`
  if (currentKey.value === 'review') {
    if (myIssues.value.length) return `${plural(myIssues.value.length, 'item', 'items')} to finish`
    return !isOwner.value && ownerReviewAt.value ? `Owner review requested ${formatDay(ownerReviewAt.value)}` : undefined
  }
  const open = attempted.has(currentKey.value) ? blocking(currentKey.value).length : 0
  return open ? `${plural(open, 'field needs', 'fields need')} attention` : undefined
})

// ── Step 1: business and eligibility ───────────────────────────────

const countryItems = Object.entries(COUNTRY_LABELS)
  .map(([value, title]) => ({ value, title }))
  .sort((a, b) => a.title.localeCompare(b.title))
const businessTypeItems = Object.entries(BUSINESS_TYPE_LABELS).map(([value, title]) => ({ value, title }))

/** What our payments partner asks of this country and business type — drives the fields on steps 1, 3 and 4. */
const rules = computed(() => rulesFor(form.country, form.businessType, form.business.structure))
const isCompany = computed(() => form.businessType === 'company')
const structureItems = computed(() => rules.value.structures.map((s) => ({ value: s.value, title: s.label })))
const industryItems = computed(() => rules.value.industries)
/** US setups may describe their products instead of giving a website. */
const websiteAlternative = computed(() => rules.value.alternatives.some((a) => a.original === 'business_profile.url'))
const dialCode = computed(() => DIAL_CODES[form.country])

/**
 * "Reachable" — a simulated check: the prototype has no network, so a website that passes
 * validation reads as reachable 600ms after the merchant stops typing. In production this is a
 * real request; the field's success state is the same either way (settings-form.scss).
 */
const websiteReachable = ref(false)
let reachTimer: ReturnType<typeof setTimeout> | null = null
watch(() => form.business.website, (value) => {
  websiteReachable.value = false
  if (reachTimer) clearTimeout(reachTimer)
  if (!value.trim() || websiteIssue(value)) return
  reachTimer = setTimeout(() => { websiteReachable.value = true }, 600)
}, { immediate: true })
/** The field shows the host; the "https://" is its prefix. The draft keeps whatever was typed (validation normalises). */
const websiteHost = computed(() => form.business.website.replace(/^https?:\/\//i, ''))
/** The phone field shows the local number; the dial code is its prefix and travels with the saved value. */
const phoneLocal = computed(() => (dialCode.value ? form.business.phone.replace(new RegExp(`^\\${dialCode.value}\\s*`), '') : form.business.phone))
function setPhone(local: string): void {
  const trimmed = local.replace(/^\+\d+\s*/, '')
  form.business.phone = dialCode.value && trimmed ? `${dialCode.value} ${trimmed}` : trimmed
}
const websiteFieldAttrs = computed(() => {
  const locked = lockedAttrs.value as { readonly?: boolean; class?: string }
  const ok = websiteReachable.value && !errorFor('website')
  return {
    ...locked,
    class: [locked.class, 'mp-form-grid__full', ok ? 'mp-field-success' : ''].filter(Boolean).join(' '),
    appendInnerIcon: ok ? 'circle-check' : undefined,
    messages: ok ? ['Reachable'] : undefined,
  }
})

/** The shell's header carries the step: "Step 1 of 6" · the step's title · its one-line description. */
const STEP_COPY: Record<OnboardingStepKey, { title: string; description: string }> = {
  business: { title: 'Tell us about your business', description: 'Our payments partner uses this to verify the business that will take payments. Your answers are saved as you go.' },
  terms: { title: 'Rates and terms', description: 'What Maropay costs, when you’re paid and the agreements you accept.' },
  verify: { title: 'Verify your business', description: 'Our payments partner checks these details against official records, so they need to match exactly.' },
  payout: { title: 'Payout account', description: 'Where Maropay sends your money. Once it’s saved, only the last four digits are kept.' },
  public: { title: 'Public details', description: 'What shoppers see on card statements and receipts.' },
  review: { title: 'Review and submit', description: 'Check your answers. Our payments partner reviews them after you submit.' },
}
/** "to rates and terms" — the destination, shown beside Continue where there's room (hidden on phones). */
const nextStepLabel = computed(() => {
  const next = STEP_KEYS[step.value]
  return next ? `to ${STEP_LABELS[next].toLowerCase()}` : ''
})
/** When the draft last went to the store — the autosave caption in the footer. */
const savedLabel = computed(() => {
  const at = Date.parse(maropay.state.updatedAt)
  if (Number.isNaN(at)) return null
  const minutes = Math.round((maropay.now - at) / 60_000)
  return minutes < 1 ? 'Saved a moment ago' : minutes < 60 ? `Saved ${minutes} min ago` : `Saved ${formatDay(maropay.state.updatedAt)}`
})
const askDescription = computed(() => rules.value.fields.has('business_profile.product_description') || (websiteAlternative.value && form.business.noWebsite))
const today = localDateKey(Date.now())

watch(() => form.businessType, (type) => {
  if (type === 'individual') {
    form.business.structure = null
    form.persons = []
    form.attestations = { owners: false, directors: false, executives: false }
  }
})
watch(() => rules.value.structures, (structures) => {
  if (form.business.structure && !structures.some((s) => s.value === form.business.structure)) form.business.structure = null
})

function choose(choice: 'new' | 'existing'): void {
  form.businessChoice = choice
  form.reuseVerifiedDetails = choice === 'existing'
}

function attestationLabel(role: 'owner' | 'director' | 'executive'): string {
  const name = form.business.legalName.trim() || 'the business'
  if (role === 'owner') return `I’ve added everyone who owns 25% or more of ${name}`
  if (role === 'director') return `I’ve added every director of ${name}`
  return `I’ve added every executive who runs ${name}`
}

function keepCurrentProvider(): void {
  toast.info('Your stores keep their current payment setup.')
  void router.push(overviewRoute.value)
}

// ── Step 2: rates and terms ────────────────────────────────────────

const termsAccepted = computed(() => maropay.onboarding.termsAcceptedVersion === maropay.terms.version)
/** Ticking is not accepting: acceptance is recorded when the owner continues. */
const termsChecked = ref(false)
const currency = computed(() => maropay.account?.currency ?? 'USD')
const payoutSchedule = computed(() => payoutScheduleLabel(maropay.account?.payoutSchedule ?? DEFAULT_PAYOUT_SCHEDULE))
const legalName = computed(() => form.business.legalName.trim() || 'the business')

// ── Step 3: verification ───────────────────────────────────────────

/** Reused details come from the verified account — changes go through our payments partner. */
const lockedAttrs = computed(() => (form.reuseVerifiedDetails ? { readonly: true, class: 'mp-field-readonly' } : {}))

function sizeLabel(bytes: number): string {
  return bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1_000))} KB`
}

/** Only the file's name and size are kept — never its contents. */
function documentFor(file: File): MockDocument {
  return { name: file.name, sizeLabel: sizeLabel(file.size), status: 'received' }
}

// ── Step 4: payout account ─────────────────────────────────────────

const bankCode = computed(() => bankCodeFor(form.country))

/** Held only until saved: the store keeps the last four digits, and the bank code is never stored. */
const payoutForm = reactive({ holderName: '', bankName: '', bankCode: '', accountNumber: '', confirmAccountNumber: '' })
type PayoutFormField = keyof typeof payoutForm
const payoutEditing = ref(false)
const payoutFormOpen = computed(() => !maropay.onboarding.payout || payoutEditing.value)
const payoutDirty = computed(() => Boolean(payoutForm.bankName || payoutForm.bankCode || payoutForm.accountNumber || payoutForm.confirmAccountNumber))

const payoutErrors = computed(() => bankAccountErrors(payoutForm, form.country))

function payoutError(field: PayoutFormField): string | undefined {
  return attempted.has('payout') ? payoutErrors.value[field] : undefined
}

function resetPayoutForm(): void {
  Object.assign(payoutForm, { holderName: form.business.legalName, bankName: '', bankCode: '', accountNumber: '', confirmAccountNumber: '' })
}

function savePayoutForm(): boolean {
  if (Object.keys(payoutErrors.value).length) {
    attempted.add('payout')
    void focusFirstError()
    return false
  }
  const result = maropay.savePayoutDetails({ ...payoutForm })
  if (!result.ok) {
    toast.error(result.error.message)
    return false
  }
  resetPayoutForm()
  payoutEditing.value = false
  attempted.delete('payout')
  toast.success('Bank account saved. Only the last four digits are kept.')
  return true
}

function changePayout(): void {
  resetPayoutForm()
  payoutEditing.value = true
}

function cancelPayoutChange(): void {
  resetPayoutForm()
  payoutEditing.value = false
  attempted.delete('payout')
}

// ── Step 5: public details ─────────────────────────────────────────

const descriptorMax = (value: string) => value.length <= 22 || 'Use 22 characters or fewer.'
/** The counter rule reports length as the merchant types; the step check adds everything else once. */
const descriptorError = computed(() => {
  const message = errorFor('statementDescriptor')
  return message && descriptorMax(form.publicDetails.statementDescriptor) === true ? message : undefined
})
const statementPreview = computed(() => form.publicDetails.statementDescriptor.trim().toUpperCase() || 'YOUR STORE')
const sampleAmount = computed(() => formatMoney(money(12900, currency.value)))

// ── Step 6: review and submit ──────────────────────────────────────

const ownerReviewAt = computed(() => maropay.onboarding.ownerReviewRequestedAt)
const ownerReviewTask = computed(() => maropay.openTasks.find((t) => t.kind === 'owner_review') ?? null)
/** Steps where owner-only items live — where a teammate needs to know why controls are off. */
const OWNER_STEPS: OnboardingStepKey[] = ['business', 'terms', 'payout', 'review']

const reviewRows = computed(() => {
  const draft = maropay.onboarding
  const stores = maropay.eligibleChannels.filter((c) => draft.channelIds.includes(c.id)).map((c) => c.name)
  const payout = draft.payout
  const rows: Array<{ key: OnboardingStepKey; title: string; detail: string }> = [
    {
      key: 'business',
      title: `${draft.businessType ? BUSINESS_TYPE_LABELS[draft.businessType] : 'Business type not chosen'} registered in ${countryLabel(draft.country)}`,
      detail: [
        draft.reuseVerifiedDetails ? 'Reusing verified details' : 'New business details',
        stores.length ? `Stores: ${stores.join(', ')}` : 'No stores chosen yet',
      ].join(' · '),
    },
    {
      key: 'terms',
      title: termsAccepted.value && maropay.terms.acceptedAt ? `Accepted ${formatDay(maropay.terms.acceptedAt)}` : 'Not accepted yet',
      detail: `Terms version ${maropay.terms.version}`,
    },
    {
      key: 'verify',
      title: draft.business.legalName || 'Legal business name missing',
      detail: [
        personName(draft.representative) || 'Representative missing',
        draft.reuseVerifiedDetails ? 'Verified details reused' : `${draft.persons.length} ${draft.persons.length === 1 ? 'other person' : 'other people'} listed`,
      ].join(' · '),
    },
    {
      key: 'payout',
      title: payout ? `${payout.bankName} •••• ${payout.last4}` : 'No bank account yet',
      detail: payout ? `${payout.holderName} · ${payout.currency}` : 'Payouts need a bank account',
    },
    {
      key: 'public',
      title: draft.publicDetails.statementDescriptor || 'Statement descriptor missing',
      detail: draft.publicDetails.supportEmail || 'Support email missing',
    },
  ]
  return rows.map((row) => {
    const issues = allIssues.value.filter((i) => i.step === row.key)
    const mine = issues.filter((i) => isOwner.value || !i.ownerOnly)
    return { ...row, label: STEP_LABELS[row.key], status: mine.length ? 'Incomplete' : issues.length ? 'Needs the owner' : null }
  })
})

const submitting = ref(false)
const submitError = ref<MaropayError | null>(null)

function delay(ms = 600): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function submit(): Promise<void> {
  if (submitting.value) return
  submitting.value = true
  submitError.value = null
  await delay()
  const result = maropay.submitSetup()
  submitting.value = false
  if (!result.ok) {
    submitError.value = result.error
    return
  }
  void focusRegion()
}

function askOwner(): void {
  const result = maropay.requestOwnerReview()
  if (!result.ok) {
    toast.error(result.error.message)
    return
  }
  toast.success('We’ve asked the business owner to review and submit setup.')
}

function saveAndExit(): void {
  save({ next: currentKey.value })
  toast.success('Progress saved. Pick up where you left off from Maropay.')
  void router.push(overviewRoute.value)
}

// ── Requirement ────────────────────────────────────────────────────

/** What the request needs: a document, a keyed value or a confirmation (requirements.ts decides from the partner key). */
const requirementSpec = computed(() => (requirement.value ? requirementForm(requirement.value.requirement, maropay.rules) : null))
const requirementFile = ref<File | File[] | null>(null)
const requirementBackFile = ref<File | File[] | null>(null)
function firstFile(value: File | File[] | null): MockDocument | null {
  const file = Array.isArray(value) ? value[0] : value
  return file ? documentFor(file) : null
}
const requirementDocument = computed(() => firstFile(requirementFile.value))
const requirementBackDocument = computed(() => firstFile(requirementBackFile.value))
const twoSided = computed(() => requirementSpec.value?.kind === 'documents' && requirementSpec.value.sides === 'front_back')
/** "Photo ID" → "photo ID" mid-sentence, keeping acronyms. */
const documentNoun = computed(() => (requirementSpec.value?.kind === 'documents' ? requirementSpec.value.label.charAt(0).toLowerCase() + requirementSpec.value.label.slice(1) : ''))
const requirementValue = ref('')
/** What waiting costs, from the request's own dates: before verification nothing is on yet; after it, payouts pause at the deadline and payments at the pause date. */
const requirementImpact = computed(() => {
  const task = requirement.value
  if (!task?.dueAt || maropay.account?.verification !== 'verified') {
    return 'Payments and payouts stay off until our payments partner has this. Your stores keep their current payment setup meanwhile.'
  }
  const pauseAt = task.paymentsPauseAt ?? task.dueAt
  if (maropay.now >= Date.parse(pauseAt)) {
    const checkout = maropay.dimensions.liveStores > 0 ? ' Checkout on your live stores refuses new payments meanwhile.' : ''
    return `Payments and payouts are paused until our payments partner has this.${checkout}`
  }
  if (maropay.now >= Date.parse(task.dueAt)) return `Payouts are paused. Provide this by ${formatDay(pauseAt)} or payments pause too.`
  return pauseAt === task.dueAt
    ? `Provide this by ${formatDay(task.dueAt)} to keep payments and payouts running.`
    : `Provide this by ${formatDay(task.dueAt)} to keep payouts running — payments pause on ${formatDay(pauseAt)} if it’s still missing.`
})
const canSendRequirement = computed(() => {
  const spec = requirementSpec.value
  if (!spec || !isOwner.value) return false
  if (spec.kind === 'documents') return requirementDocument.value !== null
  if (spec.kind === 'value') return requirementValue.value.trim().length > 0
  return true
})
const sending = ref(false)

async function sendRequirement(): Promise<void> {
  const task = requirement.value
  const spec = requirementSpec.value
  if (!task || !spec || !canSendRequirement.value || sending.value) return
  sending.value = true
  await delay()
  const result = maropay.resolveTask(task.id, spec.kind === 'documents'
    ? { documents: { front: requirementDocument.value!, back: twoSided.value ? requirementBackDocument.value : null } }
    : spec.kind === 'value' ? { value: requirementValue.value } : { confirmed: true })
  sending.value = false
  if (!result.ok) {
    toast.error(result.error.message)
    return
  }
  requirementFile.value = null
  requirementBackFile.value = null
  requirementValue.value = ''
  toast.success('Sent. Our payments partner will review it and we’ll let you know.')
  void router.replace({ query: {} })
  void focusRegion()
}

// ── Outcome ────────────────────────────────────────────────────────
// The status page is a timeline (src/maropay/setupTimeline.ts): submitted → verified → payments →
// payouts → stores, with the headline and the store rows read from the same derivation.

const timeline = computed(() => setupTimeline(maropay.state, maropay.now, maropay.channelFacts))

function storeTo(channelId: string) {
  return maropay.routeFor(storePaymentsTarget(channelId))
}

const supportReferences = computed(() => [
  { label: 'Maropost account', value: accountId.value },
  { label: 'Maropay account', value: maropay.account?.processorAccountRef ?? '—' },
  { label: 'Business', value: maropay.business?.legalName ?? form.business.legalName },
])

const DECISION_TOASTS = {
  verified: 'Simulated: the business is verified.',
  more_info: 'Simulated: our payments partner asked for more information.',
  rejected: 'Simulated: verification was declined.',
} as const
const DECISION_LABELS: Record<PartnerDecision, string> = { verified: 'Approved', more_info: 'Needs information', rejected: 'Declined' }

function simulate(decision: PartnerDecision): void {
  const result = maropay.simulateReviewOutcome(decision)
  if (result.ok) toast.info(DECISION_TOASTS[decision])
  else toast.error(result.error.message)
}

/** The partner's standing decision, as the segmented control shows it; picking another simulates it. */
const DECISION_BY_VERIFICATION: Partial<Record<string, PartnerDecision>> = { verified: 'verified', action_required: 'more_info', rejected: 'rejected' }
const decision = computed<PartnerDecision | null>(() => DECISION_BY_VERIFICATION[maropay.account?.verification ?? ''] ?? null)
const decisionItems = computed(() => (['verified', 'more_info', 'rejected'] as const).map((value) => ({
  value,
  label: DECISION_LABELS[value],
  disabled: value !== decision.value && !maropay.partnerDecisions.includes(value),
})))

function onDecision(value: string | null): void {
  if (value && value !== decision.value) simulate(value as PartnerDecision)
}

// ── Shell ──────────────────────────────────────────────────────────

const TITLES = { wizard: 'Set up Maropay', requirement: 'Provide information', outcome: 'Maropay setup', locked: 'Maropay setup' }
const title = computed(() => {
  if (mode.value === 'outcome' && timeline.value) return timeline.value.headline
  if (mode.value === 'wizard') return STEP_COPY[currentKey.value].title
  return TITLES[mode.value]
})
const eyebrow = computed(() => {
  if (mode.value === 'outcome' && maropay.account?.submittedAt) return `Maropay setup · submitted ${formatDay(maropay.account.submittedAt)}`
  if (mode.value === 'wizard') return `Step ${step.value} of ${STEP_KEYS.length}`
  return 'Maropay'
})

const subtitle = computed(() => {
  switch (mode.value) {
    case 'requirement':
      return requirement.value?.dueAt ? `Requested by our payments partner · due ${formatDay(requirement.value.dueAt)}` : 'Requested by our payments partner'
    case 'outcome':
      return timeline.value?.detail
    case 'wizard':
      return STEP_COPY[currentKey.value].description
    default:
      return undefined
  }
})

const regionLabel = computed(() =>
  mode.value === 'wizard' ? `Step ${step.value} of ${STEP_KEYS.length}: ${STEP_LABELS[currentKey.value]}` : title.value,
)

// ── Focus ──────────────────────────────────────────────────────────

const region = ref<HTMLElement | null>(null)

function scrollParent(el: HTMLElement | null): HTMLElement | null {
  for (let node = el?.parentElement ?? null; node; node = node.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(node).overflowY)) return node
  }
  return null
}

/** A new step starts at the top, with focus on it so screen readers announce it. */
async function focusRegion(): Promise<void> {
  await nextTick()
  scrollParent(region.value)?.scrollTo({ top: 0 })
  region.value?.focus({ preventScroll: true })
}

/** Brings the first invalid field and its message into view, then focuses it. */
async function focusFirstError(): Promise<void> {
  await nextTick()
  const field = region.value?.querySelector<HTMLElement>('.v-input--error')
  field?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  field?.querySelector<HTMLElement>('input, textarea')?.focus({ preventScroll: true })
}

// ── Enter and resume ───────────────────────────────────────────────

/** Opens the step the merchant stopped at; every step up to the furthest one reached stays jumpable. */
function resume(): void {
  const draft = maropay.onboarding
  const at = STEP_KEYS.indexOf(draft.lastStep) + 1 || 1
  const reached = Math.max(at, ...draft.completedSteps.map((key) => STEP_KEYS.indexOf(key) + 2))
  step.value = at
  maxStep.value = Math.min(reached, STEP_KEYS.length)
}

/** Starts setup on first visit, then loads the saved draft — again whenever the demo swaps the state or role. */
function enter(): void {
  if (maropay.can('edit_onboarding') && !maropay.account) maropay.startSetup()
  Object.assign(form, draftForm())
  termsChecked.value = termsAccepted.value
  attempted.clear()
  payoutEditing.value = false
  resetPayoutForm()
  requirementFile.value = null
  requirementBackFile.value = null
  requirementValue.value = ''
  submitError.value = null
  if (mode.value === 'wizard') resume()
}

enter()
if (mode.value === 'wizard' && step.value > 1) toast.info('Picked up where you left off.')

watch(() => [maropay.state, maropay.actingRole], enter)
</script>

<template>
  <MpWizardShell
    :eyebrow="eyebrow"
    :title="title"
    :subtitle="subtitle"
    :steps="mode === 'wizard' ? stepLabels : undefined"
    :current="mode === 'wizard' ? step : undefined"
    :max-step="maxStep"
    measure="md"
    :hint="hint"
    :back-to="overviewRoute"
    @select="goTo"
    @back="prev"
  >
    <div ref="region" class="maropay-setup" tabindex="-1" role="group" :aria-label="regionLabel">
      <!-- ── Locked ─────────────────────────────────────────── -->
      <v-card v-if="mode === 'locked'" flat border rounded="lg">
        <MpEmptyState
          icon="lock"
          title="Setup is managed by the business owner"
          description="Store operations users can see payments for their stores. The owner and finance team look after Maropay setup."
          :heading-level="2"
        />
      </v-card>

      <!-- ── Requirement ────────────────────────────────────── -->
      <MpWizardStepCard v-else-if="mode === 'requirement' && requirement && requirementSpec" :title="requirement.title" :description="requirement.description">
        <div class="maropay-setup__form">
          <MpAlert tone="warning" live="off" :title="requirement.dueAt ? `Due ${formatDay(requirement.dueAt)}` : 'Needed to turn on payments'">
            {{ requirement.errorReason ? `${requirement.errorReason} ` : '' }}{{ requirementImpact }}
          </MpAlert>
          <template v-if="isOwner">
            <template v-if="requirementSpec.kind === 'documents'">
              <v-file-input
                v-model="requirementFile"
                :label="twoSided ? `Front of ${documentNoun} *` : `${requirementSpec.label} *`"
                :accept="requirementSpec.accept"
                prepend-icon=""
                prepend-inner-icon="id-card"
                :hint="`${requirementSpec.hint} Only the file name is kept in this prototype.`"
                persistent-hint
              />
              <v-file-input
                v-if="twoSided"
                v-model="requirementBackFile"
                :label="`Back of ${documentNoun}`"
                :accept="requirementSpec.accept"
                prepend-icon=""
                prepend-inner-icon="id-card"
                hint="Skip this for a passport."
                persistent-hint
              />
            </template>
            <v-textarea
              v-else-if="requirementSpec.kind === 'value' && requirementSpec.inputType === 'textarea'"
              v-model="requirementValue"
              :label="`${requirementSpec.label} *`"
              rows="3"
              :hint="requirementSpec.hint ?? undefined"
              persistent-hint
            />
            <v-text-field
              v-else-if="requirementSpec.kind === 'value'"
              v-model="requirementValue"
              :label="`${requirementSpec.label} *`"
              :type="requirementSpec.inputType === 'url' ? 'url' : 'text'"
              :hint="requirementSpec.hint ?? undefined"
              persistent-hint
            />
          </template>
          <MpAlert v-else tone="info" live="off" title="The business owner sends this">
            Verification information can only be provided by the business owner.
          </MpAlert>
        </div>
      </MpWizardStepCard>

      <!-- ── Outcome ────────────────────────────────────────── -->
      <template v-else-if="mode === 'outcome' && timeline">
        <MaropaySetupTimeline :timeline="timeline" :store-to="storeTo" />

        <MaropaySupportAlert
          v-if="maropay.account?.verification === 'rejected'"
          title="Ask for this decision to be reviewed"
          emphasis="prominent"
          :references="supportReferences"
        />

        <MaropayDemoPanel v-if="maropay.partnerDecisions.length" title="Simulate our partner’s decision" description="Demo controls — not part of the product." :open="true">
          <div class="maropay-setup__decision">
            <MpSegmentedControl :model-value="decision" :items="decisionItems" ariaLabel="Simulated partner decision" size="sm" @update:model-value="onDecision" />
          </div>
        </MaropayDemoPanel>
      </template>

      <!-- ── Wizard ─────────────────────────────────────────── -->
      <template v-else-if="mode === 'wizard'">
        <template v-if="OWNER_STEPS.includes(currentKey)">
          <MpAlert v-if="!isOwner && ownerReviewAt" tone="success" live="off" title="Owner review requested">
            We asked the business owner on {{ formatDay(ownerReviewAt) }}. They confirm their authority, accept the terms, add the payout account and submit.
          </MpAlert>
          <MpAlert v-else-if="!isOwner" tone="info" live="off" title="The business owner finishes this setup">
            You can fill in the business details. The owner confirms their authority, accepts the terms, adds the payout account and submits.
          </MpAlert>
          <MpAlert v-else-if="ownerReviewTask" tone="info" live="off" title="A teammate asked you to review this setup">
            They filled in what they could. Confirm your authority, accept the terms and add the payout account, then submit.
          </MpAlert>
        </template>

        <!-- 1 · Business and eligibility -->
        <MpWizardStepCard headless v-if="currentKey === 'business'" title="Your business" description="Tell us about the business that will take payments. Your answers are saved as you go.">
          <div class="maropay-setup__form">
            <MpFormSection title="How to set up">
              <div class="maropay-setup__choices" role="group" aria-label="How to set up the business">
                <MpOptionCard
                  :selected="form.businessChoice !== 'existing'"
                  icon="building-2"
                  title="Add my business"
                  description="Enter your details and our payments partner verifies them."
                  @click="choose('new')"
                />
                <MpOptionCard
                  :selected="form.businessChoice === 'existing'"
                  icon="badge-check"
                  title="Use details already verified"
                  description="Already verified with our payments partner? Reuse those details and skip most checks."
                  @click="choose('existing')"
                />
              </div>
            </MpFormSection>

            <MpFormSection title="Registration">
              <MpFormGrid :cols="2">
                <v-select
                  v-model="form.country"
                  :items="countryItems"
                  label="Registration country *"
                  hint="Where the business is legally registered, not where you sell."
                  persistent-hint
                  :error-messages="errorFor('country')"
                >
                  <template #prepend-inner><span class="maropay-setup__iso" aria-hidden="true">{{ form.country }}</span></template>
                </v-select>
                <v-select
                  v-model="form.businessType"
                  :items="businessTypeItems"
                  label="Business type *"
                  placeholder="Choose one"
                  :error-messages="errorFor('businessType')"
                />
                <v-select
                  v-if="isCompany && structureItems.length"
                  v-model="form.business.structure"
                  :items="structureItems"
                  label="Business structure *"
                  placeholder="Choose one"
                  hint="If you’re not sure, check your registration documents."
                  class="mp-form-grid__full"
                  :error-messages="errorFor('structure')"
                />
              </MpFormGrid>
            </MpFormSection>

            <MpFormSection v-if="!unsupported" title="What you sell" description="Our payments partner uses this to understand your business.">
              <MpFormGrid :cols="2">
                <v-select
                  v-model="form.business.mcc"
                  :items="industryItems"
                  label="Industry *"
                  placeholder="Choose the closest match"
                  class="mp-form-grid__full"
                  :error-messages="errorFor('industry')"
                />
                <v-text-field
                  v-if="!form.business.noWebsite"
                  :model-value="websiteHost"
                  v-bind="websiteFieldAttrs"
                  @update:model-value="form.business.website = $event"
                  label="Website *"
                  type="url"
                  prefix="https://"
                  placeholder="example.com"
                  hint="The site shoppers buy from."
                  :error-messages="errorFor('website')"
                />
                <v-textarea
                  v-if="askDescription"
                  v-model="form.business.productDescription"
                  label="What you sell *"
                  rows="3"
                  :hint="form.business.noWebsite ? 'At least 10 characters. Our payments partner uses this instead of a website.' : 'At least 10 characters.'"
                  class="mp-form-grid__full"
                  :error-messages="errorFor('productDescription') ?? (form.business.noWebsite ? errorFor('website') : undefined)"
                />
                <v-checkbox
                  v-if="websiteAlternative"
                  v-model="form.business.noWebsite"
                  label="I don’t have a website — I’ll describe what I sell instead"
                  class="mp-form-grid__full"
                />
                <v-text-field
                  v-if="isCompany"
                  :model-value="phoneLocal"
                  label="Business phone *"
                  type="tel"
                  autocomplete="tel-national"
                  :prefix="dialCode"
                  placeholder="(415) 555-0199"
                  @update:model-value="setPhone"
                  :error-messages="errorFor('phone')"
                />
              </MpFormGrid>
            </MpFormSection>

            <MpAlert v-if="unsupported" tone="warning" live="polite" :title="`Maropay isn’t available in ${countryLabel(form.country)} yet`">
              Businesses registered there can’t use Maropay today. Your stores keep their current payment setup, and nothing has changed at checkout.
              <template #actions>
                <v-btn size="small" variant="outlined" class="text-none" @click="keepCurrentProvider">Keep my current provider</v-btn>
              </template>
            </MpAlert>

            <MpFormSection title="Stores" description="Choose the stores that will use Maropay. Each keeps its current payment setup until you activate Maropay on it.">
              <template v-if="maropay.eligibleChannels.length">
                <v-checkbox
                  v-for="channel in maropay.eligibleChannels"
                  :key="channel.id"
                  v-model="form.channelIds"
                  :value="channel.id"
                  :label="channel.name"
                />
              </template>
              <p v-else class="maropay-setup__note">No Maropost web stores yet. You can link one after setup.</p>
            </MpFormSection>

            <MpFormSection title="Authority">
              <v-checkbox
                v-model="authority"
                :disabled="!isOwner"
                label="I own this business or I’m authorised to act for it"
                :hint="isOwner ? undefined : 'Only the business owner or an authorised representative can confirm this.'"
                persistent-hint
                :error-messages="errorFor('authority')"
              />
            </MpFormSection>
          </div>
        </MpWizardStepCard>

        <!-- 2 · Rates and terms -->
        <MpWizardStepCard headless v-else-if="currentKey === 'terms'" title="Rates and terms" description="What Maropay costs, when you’re paid and the agreements you accept.">
          <div class="maropay-setup__form">
            <MpFormSection title="Rates">
              <MaropayRatesTable :methods="maropay.methods" hide-unavailable />
            </MpFormSection>

            <dl class="mp-label-value">
              <div><dt>Monthly fee</dt><dd>None</dd></div>
              <div><dt>Dispute fee</dt><dd>{{ formatMoney(maropay.terms.disputeFee) }} per dispute</dd></div>
              <div><dt>Payouts</dt><dd>{{ payoutSchedule }}</dd></div>
              <div><dt>Settlement currency</dt><dd>{{ currency }}</dd></div>
            </dl>

            <MpFormSection title="Agreements">
              <MpListRow variant="boxed">
                <template #lead><v-icon size="18" class="maropay-setup__icon">file-text</v-icon></template>
                <span class="maropay-setup__row-title">Maropay Terms of Service</span>
                <span class="maropay-setup__row-sub">Maropost’s terms for pricing, payouts, disputes and support.</span>
              </MpListRow>
              <!-- The one place the processor is named (decision D1). -->
              <MpListRow variant="boxed">
                <template #lead><v-icon size="18" class="maropay-setup__icon">file-text</v-icon></template>
                <span class="maropay-setup__row-title">{{ maropay.terms.processorAgreementName }}</span>
                <span class="maropay-setup__row-sub">Our payments partner, {{ maropay.terms.processorName }}, processes your payments and holds your balance.</span>
              </MpListRow>
              <v-checkbox
                v-model="termsChecked"
                :disabled="termsAccepted || !isOwner"
                :label="`I accept the Maropay Terms of Service and the ${maropay.terms.processorAgreementName} for ${legalName}`"
                :hint="termsAccepted && maropay.terms.acceptedAt
                  ? `Accepted ${formatDay(maropay.terms.acceptedAt)} by the ${ROLE_LABELS[maropay.terms.acceptedBy ?? 'owner'].toLowerCase()} · version ${maropay.terms.version}`
                  : isOwner ? 'Your acceptance is recorded when you continue.' : 'Only the business owner can accept the terms.'"
                persistent-hint
                :error-messages="errorFor('terms')"
              />
            </MpFormSection>
          </div>
        </MpWizardStepCard>

        <!-- 3 · Verification -->
        <MpWizardStepCard headless v-else-if="currentKey === 'verify'" title="Verify your business" description="Our payments partner checks these details against official records, so they need to match exactly.">
          <div class="maropay-setup__form">
            <MpAlert v-if="form.reuseVerifiedDetails" tone="success" live="off" title="Using details already verified">
              These come from your verified account with our payments partner. To change them, update them there first.
            </MpAlert>
            <MpAlert v-else tone="info" live="off">
              We’ve filled in what Maropost already knows. Check each detail against your official records — a mismatch is the most common reason setup is held up.
            </MpAlert>

            <MpFormSection v-if="isCompany" title="Business">
              <MpFormGrid :cols="2">
                <v-text-field v-model="form.business.legalName" v-bind="lockedAttrs" label="Legal business name *" class="mp-form-grid__full" autocomplete="organization" :error-messages="errorFor('legalName')" />
                <v-text-field v-model="form.business.tradingName" v-bind="lockedAttrs" label="Trading name" hint="Only if shoppers know you by another name." />
                <v-text-field
                  v-model="form.business.taxId"
                  v-bind="lockedAttrs"
                  :label="`${rules.labels.taxId.label}${rules.fields.has('company.tax_id') ? ' *' : ''}`"
                  :hint="rules.fields.has('company.tax_id') ? rules.labels.taxId.hint : `Asked for later — ${rules.labels.taxId.hint.charAt(0).toLowerCase()}${rules.labels.taxId.hint.slice(1)}`"
                  :error-messages="errorFor('taxId')"
                />
                <v-text-field
                  v-if="rules.labels.registrationNumber"
                  v-model="form.business.registrationNumber"
                  v-bind="lockedAttrs"
                  :label="`${rules.labels.registrationNumber.label} *`"
                  :hint="rules.labels.registrationNumber.hint"
                  :error-messages="errorFor('registrationNumber')"
                />
              </MpFormGrid>
            </MpFormSection>

            <MpFormSection v-if="isCompany" title="Registered address">
              <MpFormGrid :cols="2">
                <v-text-field v-model="form.business.address.line1" v-bind="lockedAttrs" label="Street address *" class="mp-form-grid__full" autocomplete="street-address" :error-messages="errorFor('addressLine1')" />
                <v-text-field v-model="form.business.address.city" v-bind="lockedAttrs" label="City *" autocomplete="address-level2" :error-messages="errorFor('city')" />
                <v-text-field v-if="rules.usesRegion" v-model="form.business.address.region" v-bind="lockedAttrs" :label="`${rules.labels.region} *`" autocomplete="address-level1" :error-messages="errorFor('region')" />
                <v-text-field v-model="form.business.address.postalCode" v-bind="lockedAttrs" :label="`${rules.labels.postal} *`" autocomplete="postal-code" :error-messages="errorFor('postalCode')" />
                <v-text-field :model-value="countryLabel(form.country)" label="Country" readonly class="mp-field-readonly" hint="Set by the registration country." />
              </MpFormGrid>
            </MpFormSection>

            <MpFormSection :title="isCompany ? 'Representative' : 'About you'" :description="isCompany ? 'The person who owns or runs the business. Our payments partner may contact them.' : 'Our payments partner checks these details against official records.'">
              <MpFormGrid :cols="2">
                <v-text-field v-model="form.representative.firstName" v-bind="lockedAttrs" label="First name *" autocomplete="given-name" :error-messages="errorFor('repFirstName')" />
                <v-text-field v-model="form.representative.lastName" v-bind="lockedAttrs" label="Last name *" autocomplete="family-name" :error-messages="errorFor('repLastName')" />
                <v-text-field v-if="isCompany" v-model="form.representative.title" v-bind="lockedAttrs" label="Job title *" autocomplete="organization-title" :error-messages="errorFor('repTitle')" />
                <v-text-field
                  v-model="form.representative.dob"
                  v-bind="lockedAttrs"
                  label="Date of birth *"
                  type="date"
                  :max="today"
                  autocomplete="bday"
                  :error-messages="errorFor('repDob')"
                />
                <v-text-field v-model="form.representative.email" v-bind="lockedAttrs" label="Email *" type="email" autocomplete="email" :error-messages="errorFor('repEmail')" />
                <v-text-field v-model="form.representative.phone" v-bind="lockedAttrs" label="Phone *" type="tel" autocomplete="tel" :error-messages="errorFor('repPhone')" />
                <v-text-field
                  v-if="rules.fields.has(`${rules.identityPrefix}.ssn_last_4`)"
                  v-model="form.representative.ssnLast4"
                  label="Last 4 digits of SSN *"
                  inputmode="numeric"
                  maxlength="4"
                  autocomplete="off"
                  hint="Used to check identity. The full number is never asked for."
                  persistent-hint
                  :error-messages="errorFor('repSsnLast4')"
                />
              </MpFormGrid>
            </MpFormSection>

            <MpFormSection :title="isCompany ? 'Representative’s home address' : 'Your address'">
              <MpFormGrid :cols="2">
                <v-text-field v-model="form.representative.address.line1" v-bind="lockedAttrs" label="Street address *" class="mp-form-grid__full" autocomplete="section-home street-address" :error-messages="errorFor('repAddressLine1')" />
                <v-text-field v-model="form.representative.address.city" v-bind="lockedAttrs" label="City *" autocomplete="section-home address-level2" :error-messages="errorFor('repCity')" />
                <v-text-field v-if="rules.usesRegion" v-model="form.representative.address.region" v-bind="lockedAttrs" :label="`${rules.labels.region} *`" autocomplete="section-home address-level1" :error-messages="errorFor('repRegion')" />
                <v-text-field v-model="form.representative.address.postalCode" v-bind="lockedAttrs" :label="`${rules.labels.postal} *`" autocomplete="section-home postal-code" :error-messages="errorFor('repPostalCode')" />
                <v-text-field :model-value="countryLabel(form.country)" label="Country" readonly class="mp-field-readonly" hint="Set by the registration country." />
              </MpFormGrid>
            </MpFormSection>

            <MpFormSection v-if="isCompany && rules.personRoles.length" title="Owners, directors and executives" description="Confirm who our payments partner needs to know about. If that’s only you, confirm below.">
              <v-checkbox
                v-for="role in rules.personRoles"
                :key="role.role"
                v-model="form.attestations[`${role.role}s`]"
                :disabled="!isOwner"
                :label="attestationLabel(role.role)"
                :hint="isOwner ? undefined : 'Only the business owner can confirm this.'"
                persistent-hint
                :error-messages="errorFor(`${role.role}sProvided`)"
              />
            </MpFormSection>

          </div>
        </MpWizardStepCard>

        <!-- 4 · Payout account -->
        <MpWizardStepCard headless v-else-if="currentKey === 'payout'" title="Payout account" description="Where Maropay sends your money. Once it’s saved, only the last four digits are kept.">
          <div class="maropay-setup__form">
            <MpListRow v-if="maropay.onboarding.payout && !payoutEditing" variant="boxed">
              <template #lead><v-icon size="18" class="maropay-setup__icon">landmark</v-icon></template>
              <span class="mp-meta-label">Payouts go to</span>
              <span class="maropay-setup__row-title">{{ maropay.onboarding.payout.bankName }} •••• {{ maropay.onboarding.payout.last4 }}</span>
              <span class="maropay-setup__row-sub">{{ maropay.onboarding.payout.holderName }} · {{ maropay.onboarding.payout.currency }}</span>
              <template v-if="isOwner" #trailing>
                <v-btn variant="text" size="small" class="text-none" @click="changePayout">Change</v-btn>
              </template>
            </MpListRow>

            <template v-else-if="isOwner">
              <MpFormGrid :cols="2">
                <v-text-field v-model="payoutForm.holderName" label="Account holder name *" class="mp-form-grid__full" autocomplete="off" :error-messages="payoutError('holderName')" />
                <v-text-field v-model="payoutForm.bankName" label="Bank name *" placeholder="e.g. Mercury Bank" autocomplete="off" :error-messages="payoutError('bankName')" />
                <v-text-field v-model="payoutForm.bankCode" :label="`${bankCode.label} *`" inputmode="numeric" autocomplete="off" :error-messages="payoutError('bankCode')" />
                <v-text-field v-model="payoutForm.accountNumber" label="Account number *" inputmode="numeric" autocomplete="off" :error-messages="payoutError('accountNumber')" />
                <v-text-field v-model="payoutForm.confirmAccountNumber" label="Confirm account number *" inputmode="numeric" autocomplete="off" :error-messages="payoutError('confirmAccountNumber')" />
              </MpFormGrid>
              <div class="d-flex ga-2">
                <v-btn color="primary" variant="flat" class="text-none" @click="savePayoutForm">Save bank account</v-btn>
                <v-btn v-if="maropay.onboarding.payout" variant="text" class="text-none" @click="cancelPayoutChange">Cancel</v-btn>
              </div>
            </template>

            <MpAlert v-else tone="info" live="off" title="The business owner adds the payout account">
              Payouts only go to an account the owner adds and confirms.
            </MpAlert>

            <dl class="mp-label-value">
              <div><dt>Schedule</dt><dd>{{ payoutSchedule }}</dd></div>
              <div><dt>Currency</dt><dd>{{ currency }}</dd></div>
            </dl>
          </div>
        </MpWizardStepCard>

        <!-- 5 · Public details -->
        <MpWizardStepCard headless v-else-if="currentKey === 'public'" title="Public details" description="What shoppers see on card statements and receipts.">
          <MpFormGrid :cols="2">
            <v-text-field
              v-model="form.publicDetails.statementDescriptor"
              label="Statement descriptor *"
              class="mp-form-grid__full"
              counter="22"
              :rules="[descriptorMax]"
              hint="Use a name shoppers will recognise, usually your store name."
              :error-messages="descriptorError"
            />
            <MpListRow variant="boxed" class="mp-form-grid__full">
              <template #lead><v-icon size="18" class="maropay-setup__icon">credit-card</v-icon></template>
              <span class="mp-meta-label">On a shopper’s card statement</span>
              <span class="maropay-setup__statement">{{ statementPreview }}</span>
              <template #trailing><span class="maropay-setup__statement">{{ sampleAmount }}</span></template>
            </MpListRow>
            <v-text-field v-model="form.publicDetails.supportEmail" label="Support email *" type="email" autocomplete="email" :error-messages="errorFor('supportEmail')" />
            <v-text-field v-model="form.publicDetails.supportPhone" label="Support phone" type="tel" autocomplete="tel" />
          </MpFormGrid>
        </MpWizardStepCard>

        <!-- 6 · Review and submit -->
        <MpWizardStepCard headless v-else title="Review and submit" description="Check your answers. Our payments partner reviews them after you submit.">
          <div class="maropay-setup__form">
            <v-card flat border rounded="lg" class="maropay-setup__summary">
              <MpListRow v-for="row in reviewRows" :key="row.key" variant="divided">
                <span class="mp-meta-label">{{ row.label }}</span>
                <span class="maropay-setup__row-title">{{ row.title }}</span>
                <span class="maropay-setup__row-sub">{{ row.detail }}</span>
                <template #trailing>
                  <MpStatusChip v-if="row.status" :status="row.status" size="sm" />
                  <v-btn variant="text" size="small" class="text-none" :aria-label="`Edit ${row.label}`" @click="goTo(STEP_KEYS.indexOf(row.key) + 1)">Edit</v-btn>
                </template>
              </MpListRow>
            </v-card>

            <MpAlert v-if="submitError" tone="error" title="Setup wasn’t submitted">
              {{ submitError.message }}
            </MpAlert>
            <MpAlert v-else-if="myIssues.length" tone="warning" live="off" :title="`${plural(myIssues.length, 'thing', 'things')} to finish before ${isOwner ? 'you submit' : 'you ask the owner'}`">
              <ul class="maropay-setup__issues">
                <li v-for="issue in myIssues" :key="issue.field">{{ issue.message }}</li>
              </ul>
            </MpAlert>

            <MpAlert tone="info" live="off" icon="shield-check" title="Submitting isn’t approval">
              Our payments partner reviews your details — usually in minutes, sometimes up to 2 business days. Nothing changes at checkout until you activate Maropay on a store.
            </MpAlert>
          </div>
        </MpWizardStepCard>
      </template>
    </div>

    <!-- The wizard uses the shell's own Back (from step 2); the header's back link covers step 1. -->
    <template v-if="mode === 'requirement'" #footerStart>
      <v-btn variant="text" class="text-none" prepend-icon="arrow-left" :to="overviewRoute">Back to overview</v-btn>
    </template>

    <!-- Wizard mode owns the footer's start: Back from step 2, and when the draft last saved. -->
    <template v-if="mode === 'wizard'" #footerStart>
      <div class="maropay-setup__foot-start">
        <v-btn v-if="step > 1" variant="text" class="text-none" prepend-icon="arrow-left" @click="prev">Back</v-btn>
        <span v-if="savedLabel" class="maropay-setup__saved d-none d-sm-inline" aria-live="off">{{ savedLabel }}</span>
      </div>
    </template>

    <template #footer>
      <template v-if="mode === 'wizard'">
        <v-btn variant="text" class="text-none" @click="saveAndExit">Save<span class="d-none d-sm-inline">&nbsp;and exit</span></v-btn>
        <template v-if="currentKey === 'review'">
          <v-btn
            v-if="isOwner"
            color="primary"
            variant="flat"
            class="text-none"
            prepend-icon="send"
            :loading="submitting"
            :disabled="myIssues.length > 0"
            @click="submit"
          >
            Submit for review
          </v-btn>
          <v-btn
            v-else
            color="primary"
            variant="flat"
            class="text-none"
            prepend-icon="user-check"
            :disabled="myIssues.length > 0 || !!ownerReviewAt"
            @click="askOwner"
          >
            Ask the owner to submit
          </v-btn>
        </template>
        <v-btn
          v-else
          color="primary"
          variant="flat"
          class="text-none"
          append-icon="arrow-right"
          :disabled="currentKey === 'business' && unsupported"
          @click="next"
        >
          Continue<span v-if="nextStepLabel" class="d-none d-sm-inline">&nbsp;{{ nextStepLabel }}</span>
        </v-btn>
      </template>
      <v-btn
        v-else-if="mode === 'requirement'"
        color="primary"
        variant="flat"
        class="text-none"
        prepend-icon="send"
        :loading="sending"
        :disabled="!canSendRequirement"
        @click="sendRequirement"
      >
        Send for review
      </v-btn>
      <v-btn v-else variant="outlined" class="text-none" :to="overviewRoute">Go to overview</v-btn>
    </template>
  </MpWizardShell>
</template>

<style scoped lang="scss">
.maropay-setup {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-20);
}

/* Focus lands here on every step change so screen readers hear the new step; it is not a control. */
.maropay-setup:focus {
  outline: none;
}

/* The field rhythm: MpFormSection adds the extra section air on top of this gap. */
.maropay-setup__form {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-field-groupGap);
}

/* The country's ISO code as a quiet tag inside the select — a flag without artwork. */
.maropay-setup__iso {
  display: inline-flex;
  align-items: center;
  height: var(--mp-space-20);
  padding-inline: var(--mp-space-6);
  margin-inline-end: var(--mp-space-4);
  border-radius: var(--mp-radius-4);
  background: var(--surface-secondary);
  color: var(--on-surface-muted);
  font-family: var(--mp-fontFamily-mono);
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-semibold);
}

.maropay-setup__foot-start {
  display: flex;
  align-items: center;
  gap: var(--mp-space-12);
}

.maropay-setup__saved {
  font-size: var(--mp-fontSize-13);
  color: var(--text-muted);
}

/* The demo's segmented control scrolls on a phone rather than widening the strip. */
.maropay-setup__decision {
  max-width: 100%;
  overflow-x: auto;
}

.maropay-setup__card {
  padding: var(--mp-component-card-padding);
}

/* Divided rows carry no inline padding of their own. */
.maropay-setup__summary {
  padding: 0 var(--mp-component-card-paddingCompact);
}

.maropay-setup__choices {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--mp-space-12);
}

@media (max-width: ($mp-layout-breakpointCompact - 0.02px)) {
  .maropay-setup__choices {
    grid-template-columns: minmax(0, 1fr);
  }
}

.maropay-setup__icon {
  color: var(--icon-secondary);
}

.maropay-setup__row-title {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  line-height: var(--mp-lineHeight-snug);
  color: var(--text-primary);
}

.maropay-setup__row-sub {
  margin-top: var(--mp-space-2);
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--text-secondary);
}

.maropay-setup__note {
  margin: 0;
  font-size: var(--mp-fontSize-13);
  color: var(--text-secondary);
}

.maropay-setup__statement {
  font-family: var(--mp-fontFamily-mono);
  font-size: var(--mp-fontSize-13);
  letter-spacing: var(--mp-letterSpacing-eyebrow);
  color: var(--text-primary);
}

.maropay-setup__issues {
  margin: var(--mp-space-4) 0 0;
  padding-inline-start: var(--mp-space-20);
}

.maropay-setup__num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-component-chip-height-md);
  height: var(--mp-component-chip-height-md);
  border-radius: var(--mp-radius-full);
  background: var(--accent-container);
  color: var(--accent-on-container);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-semibold);
}
</style>
