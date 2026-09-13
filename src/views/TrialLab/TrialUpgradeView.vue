<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import MpAlert from '@/components/MpAlert.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import MpWizardShell from '@/components/MpWizardShell.vue'
import MpWizardStepCard from '@/components/MpWizardStepCard.vue'
import { useToast } from '@/composables/useToast'
import { useWizardSteps } from '@/composables/useWizardSteps'
import { PLAN_CATALOG, planPrice, type BillingCycle, type PlanTier } from '@/stores/usePlg'
import type { UpgradeStepKey } from '@/stores/useTrialLab'
import { useTrialRun } from './useTrialRun'

/**
 * Upgrade — where every variant converges. Choose plan → complete only the
 * missing names → secure the account (authenticator mock) → recovery codes →
 * review → simulated success. The step list is frozen on entry: a step that
 * is already satisfied (both names present, MFA enabled earlier) is omitted
 * rather than repeated, and leaving preserves the selected plan and step.
 */
const toast = useToast()
const { store, variant, run, workspace, arrive, goTo: goToStage } = useTrialRun()

interface StepDef { key: UpgradeStepKey; label: string }

function buildSteps(): StepDef[] {
  const steps: StepDef[] = [{ key: 'plan', label: 'Choose plan' }]
  if (!store.hasPersonName(variant.value) || !store.hasWorkspaceName(variant.value)) steps.push({ key: 'details', label: 'Your details' })
  const sec = run.value?.security
  if (!sec?.mfaEnabledAt) steps.push({ key: 'security', label: 'Secure account' })
  if (!sec?.recoveryAcknowledgedAt) steps.push({ key: 'recovery', label: 'Recovery codes' })
  steps.push({ key: 'review', label: 'Review' })
  return steps
}

// Frozen for this visit so filling a name mid-flow does not shift the steps row.
const steps = ref<StepDef[]>([])
const stepLabels = computed(() => steps.value.map(s => s.label))

const needPerson = ref(false)
const needWorkspace = ref(false)
const personName = ref('')
const workspaceName = ref('')
const mfaCode = ref('')
const mfaConfirming = ref(false)
const codesSaved = ref(false)
// Once acknowledged in an earlier visit the box stays ticked and locked.
const acknowledged = computed({
  get: () => codesSaved.value || !!run.value?.security.recoveryAcknowledgedAt,
  set: (v: boolean) => { codesSaved.value = v },
})
const confirming = ref(false)
const done = ref(false)

const { step, maxStep, goTo, next, prev, isFirst } = useWizardSteps(() => steps.value.length, {
  canAdvance: (from) => canLeave(steps.value[from - 1]?.key),
  onNavigate: (from, to) => {
    const fromKey = steps.value[from - 1]?.key
    const toKey = steps.value[to - 1]?.key
    if (fromKey && to > from) commit(fromKey)
    if (toKey) store.setUpgradeStep(variant.value, toKey)
  },
})

const currentKey = computed<UpgradeStepKey | undefined>(() => steps.value[step.value - 1]?.key)

onMounted(() => {
  store.startUpgrade(variant.value)
  if (run.value?.upgrade?.completedAt) {
    done.value = true
    return
  }
  arrive('upgrade')
  steps.value = buildSteps()
  needPerson.value = !store.hasPersonName(variant.value)
  needWorkspace.value = !store.hasWorkspaceName(variant.value)
  const resume = steps.value.findIndex(s => s.key === run.value?.upgrade?.stepKey)
  if (resume > 0) {
    step.value = resume + 1
    maxStep.value = resume + 1
  }
  if (currentKey.value) store.setUpgradeStep(variant.value, currentKey.value)
})

// ── Plan ────────────────────────────────────────────────────────────────────
const catalog = computed(() => PLAN_CATALOG.find(c => c.cloud === run.value?.upgrade?.cloud) ?? PLAN_CATALOG[0]!)
const cycle = computed<BillingCycle>(() => run.value?.upgrade?.cycle ?? 'monthly')
const tier = computed<PlanTier | null>(() => run.value?.upgrade?.tier ?? null)
const selectedPlan = computed(() => catalog.value.plans.find(p => p.tier === tier.value) ?? null)

const CYCLE_ITEMS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual · save 10%' },
]

function money(n: number) {
  return `$${n.toLocaleString('en-US')}`
}

function priceLabel(monthly: number, tierKey: PlanTier) {
  const def = catalog.value.plans.find(p => p.tier === tierKey)!
  return cycle.value === 'annual' ? `${money(planPrice(def, 'annual'))} / year` : `${money(monthly)} / month`
}

// ── Gates ───────────────────────────────────────────────────────────────────
function canLeave(key: UpgradeStepKey | undefined): boolean {
  switch (key) {
    case 'plan': return !!tier.value
    case 'details': return (!needPerson.value || !!personName.value.trim()) && (!needWorkspace.value || !!workspaceName.value.trim())
    case 'security': return !!run.value?.security.mfaEnabledAt
    case 'recovery': return codesSaved.value || !!run.value?.security.recoveryAcknowledgedAt
    default: return true
  }
}

function commit(key: UpgradeStepKey) {
  if (key === 'details') {
    if (needPerson.value && personName.value.trim()) store.setPersonName(variant.value, personName.value)
    if (needWorkspace.value && workspaceName.value.trim() && workspace.value) store.renameWorkspace(variant.value, workspace.value.id, workspaceName.value)
  }
  if (key === 'recovery') store.acknowledgeRecovery(variant.value)
  store.completeUpgradeStep(variant.value, key)
}

const hint = computed(() => {
  if (canLeave(currentKey.value)) return undefined
  switch (currentKey.value) {
    case 'plan': return 'Pick a plan to continue'
    case 'details': return 'Both fields are needed before upgrading'
    case 'security': return 'Confirm the code from your authenticator'
    case 'recovery': return 'Confirm you have saved the codes'
    default: return undefined
  }
})

// ── Security (simulated) ────────────────────────────────────────────────────
const secret = 'MRPT-4K7Q-9ZX2-HB6N'
async function confirmMfa() {
  if (mfaCode.value.length !== 6 || mfaConfirming.value) return
  mfaConfirming.value = true
  await new Promise(r => setTimeout(r, 700))
  store.enableMfa(variant.value)
  mfaConfirming.value = false
  toast.success('Authenticator connected')
}

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${what} copied`)
  } catch {
    toast.error('Couldn’t copy — select the text instead')
  }
}

function downloadCodes() {
  const codes = run.value?.security.recoveryCodes ?? []
  const body = `Maropost recovery codes — ${store.workspaceLabel(workspace.value)}\nEach code works once. Keep them somewhere safe.\n\n${codes.join('\n')}\n`
  const blob = new Blob([body], { type: 'text/plain;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'maropost-recovery-codes.txt'
  link.click()
  URL.revokeObjectURL(url)
}

// ── Review ──────────────────────────────────────────────────────────────────
async function confirmUpgrade() {
  if (!selectedPlan.value || confirming.value) return
  confirming.value = true
  await new Promise(r => setTimeout(r, 1200))
  store.completeUpgrade(variant.value)
  confirming.value = false
  done.value = true
}

function leave() {
  void goToStage('home')
}
</script>

<template>
  <MpWizardShell
    standalone
    eyebrow="Upgrade"
    :title="done ? 'Welcome aboard' : `Upgrade ${catalog.name}`"
    :steps="done ? undefined : stepLabels"
    :current="step"
    :max-step="maxStep"
    :subtitle="done ? 'Simulated — no payment was taken.' : undefined"
    measure="md"
    :hint="done ? undefined : hint"
    :back-to="{ name: 'TrialHome', params: { variant } }"
    @select="goTo"
  >
    <template v-if="done">
      <MpEmptyState
        icon="badge-check"
        emphasis="prominent"
        :title="`You’re on ${selectedPlan?.name ?? 'the paid'} plan`"
        :description="`${catalog.name}, billed ${cycle === 'annual' ? 'annually' : 'monthly'}. Everything you built during the trial is still here.`"
        action-label="Back to workspace"
        action-icon="arrow-right"
        :heading-level="2"
        @action="leave"
      />
    </template>

    <template v-else-if="currentKey === 'plan'">
      <MpWizardStepCard title="Choose a plan" :description="`${catalog.tagline} Prices are simulated.`">
        <div class="tl-upgrade__cycle">
          <MpSegmentedControl
            :model-value="cycle"
            :items="CYCLE_ITEMS"
            ariaLabel="Billing cycle"
            @update:model-value="store.setUpgradePlan(variant, { cycle: ($event as BillingCycle) ?? 'monthly' })"
          />
        </div>
        <div class="tl-upgrade__plans" role="group" aria-label="Plans">
          <MpOptionCard
            v-for="p in catalog.plans"
            :key="p.tier"
            :selected="tier === p.tier"
            :title="p.name"
            :description="priceLabel(p.monthly, p.tier)"
            :heading-level="3"
            class="h-100"
            @click="store.setUpgradePlan(variant, { tier: p.tier })"
          >
            <template #title-append>
              <v-chip size="x-small" variant="tonal" label>{{ p.badge }}</v-chip>
            </template>
            <ul class="tl-upgrade__features">
              <li v-for="f in p.features.slice(0, 4)" :key="f.label" :class="{ 'tl-upgrade__feature--off': !f.included }">
                <v-icon size="14">{{ f.included ? 'check' : 'minus' }}</v-icon>
                <span>{{ f.label }}</span>
              </li>
            </ul>
          </MpOptionCard>
        </div>
      </MpWizardStepCard>
    </template>

    <template v-else-if="currentKey === 'details'">
      <MpWizardStepCard title="Your details" description="A paid account needs a name on it and a label for the workspace. Only what’s missing is asked.">
        <MpFormGrid :cols="1">
          <v-text-field
            v-if="needPerson"
            v-model="personName"
            label="Your name *"
            placeholder="What should we call you?"
            autocomplete="name"
            autofocus
          />
          <v-text-field
            v-if="needWorkspace"
            v-model="workspaceName"
            label="Workspace name *"
            placeholder="e.g. Northwind Trading"
            autocomplete="organization"
            hint="A label to help you recognise this account — not a legal company name."
          />
        </MpFormGrid>
      </MpWizardStepCard>
    </template>

    <template v-else-if="currentKey === 'security'">
      <MpWizardStepCard title="Secure your account" description="Paid accounts hold real customer data, so two-step sign-in becomes required from here on. Simulated — no authenticator is really enrolled.">
        <MpAlert v-if="run?.security.mfaEnabledAt" tone="success" title="Authenticator connected">
          Two-step sign-in is on for this account. Continue to save your recovery codes.
        </MpAlert>
        <div v-else class="tl-upgrade__mfa">
          <div class="tl-upgrade__qr" aria-label="QR code placeholder">
            <v-icon size="64">qr-code</v-icon>
            <span class="tl-upgrade__qr-caption">Scan with your authenticator app</span>
          </div>
          <div class="tl-upgrade__mfa-body">
            <div class="tl-upgrade__secret-row">
              <div>
                <div class="tl-upgrade__secret-label">Or enter this key manually</div>
                <code class="tl-upgrade__secret">{{ secret }}</code>
              </div>
              <v-btn icon="copy" variant="text" size="small" aria-label="Copy setup key" @click="copy(secret, 'Setup key')" />
            </div>
            <MpFormField label="Enter the 6-digit code from your app" hint="Prototype: any six digits confirm.">
              <v-otp-input v-model="mfaCode" length="6" type="number" :disabled="mfaConfirming" />
            </MpFormField>
            <div>
              <v-btn color="primary" variant="flat" class="text-none" :disabled="mfaCode.length !== 6" :loading="mfaConfirming" @click="confirmMfa">Confirm code</v-btn>
            </div>
          </div>
        </div>
      </MpWizardStepCard>
    </template>

    <template v-else-if="currentKey === 'recovery'">
      <MpWizardStepCard title="Save your recovery codes" description="If you lose your phone, one of these signs you in. Each code works once.">
        <div class="tl-upgrade__codes" aria-label="Recovery codes">
          <code v-for="c in run?.security.recoveryCodes ?? []" :key="c" class="tl-upgrade__code">{{ c }}</code>
        </div>
        <div class="tl-upgrade__code-actions">
          <v-btn variant="outlined" class="text-none" prepend-icon="copy" @click="copy((run?.security.recoveryCodes ?? []).join('\n'), 'Recovery codes')">Copy</v-btn>
          <v-btn variant="outlined" class="text-none" prepend-icon="download" @click="downloadCodes">Download .txt</v-btn>
        </div>
        <v-checkbox
          v-model="acknowledged"
          label="I’ve saved these codes somewhere safe"
          :disabled="!!run?.security.recoveryAcknowledgedAt"
        />
      </MpWizardStepCard>
    </template>

    <template v-else-if="currentKey === 'review'">
      <MpWizardStepCard title="Review and confirm" description="Nothing is charged in this prototype.">
        <v-card flat border rounded="lg" class="tl-upgrade__summary">
          <MpListRow variant="divided" eyebrow="Plan" :title="`${catalog.name} · ${selectedPlan?.name ?? '—'}`" />
          <MpListRow variant="divided" eyebrow="Billing" :title="cycle === 'annual' ? `Annual · ${selectedPlan ? money(planPrice(selectedPlan, 'annual')) : '—'} / year` : `Monthly · ${selectedPlan ? money(selectedPlan.monthly) : '—'} / month`" />
          <MpListRow variant="divided" eyebrow="Workspace" :title="store.workspaceLabel(workspace)" />
          <MpListRow variant="divided" eyebrow="Account holder" :title="run?.account.personName ?? '—'" :meta="run?.account.email ?? ''" />
          <MpListRow variant="divided" eyebrow="Security" title="Two-step sign-in on · recovery codes saved" />
        </v-card>
      </MpWizardStepCard>
    </template>

    <template #footerStart>
      <v-btn v-if="done" variant="text" class="text-none" @click="leave">Back to workspace</v-btn>
      <v-btn v-else-if="isFirst" variant="text" class="text-none" prepend-icon="arrow-left" @click="leave">Back to workspace</v-btn>
      <v-btn v-else variant="text" class="text-none" prepend-icon="arrow-left" @click="prev">Back</v-btn>
    </template>
    <template #footer>
      <template v-if="!done">
        <v-btn
          v-if="currentKey === 'review'"
          color="primary"
          variant="flat"
          class="text-none"
          prepend-icon="badge-check"
          :loading="confirming"
          :disabled="!selectedPlan"
          @click="confirmUpgrade"
        >
          Confirm upgrade
        </v-btn>
        <v-btn v-else color="primary" variant="flat" class="text-none" append-icon="arrow-right" :disabled="!canLeave(currentKey)" @click="next">Continue</v-btn>
      </template>
    </template>
  </MpWizardShell>
</template>

<style scoped>
.tl-upgrade__cycle {
  display: flex;
  justify-content: flex-start;
  margin-bottom: var(--mp-space-20);
}

.tl-upgrade__plans {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--mp-component-card-gap);
}

.tl-upgrade__features {
  list-style: none;
  margin: var(--mp-space-12) 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-6);
  font-size: var(--mp-fontSize-12);
  color: var(--text-secondary);
}

.tl-upgrade__features li {
  display: flex;
  align-items: center;
  gap: var(--mp-space-6);
}

.tl-upgrade__feature--off {
  color: var(--text-muted);
}

.tl-upgrade__mfa {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--mp-space-24);
  align-items: start;
}

.tl-upgrade__qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--mp-space-8);
  width: 180px;
  aspect-ratio: 1;
  padding: var(--mp-space-16);
  border: 1px dashed var(--border-default);
  border-radius: var(--mp-radius-12);
  background: var(--surface-secondary);
  color: var(--on-surface-muted);
}

.tl-upgrade__qr-caption {
  font-size: var(--mp-fontSize-11);
  text-align: center;
  color: var(--text-secondary);
}

.tl-upgrade__mfa-body {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-field-groupGap);
  min-width: 0;
}

.tl-upgrade__secret-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-8);
}

.tl-upgrade__secret-label {
  font-size: var(--mp-fontSize-12);
  color: var(--text-secondary);
}

.tl-upgrade__secret,
.tl-upgrade__code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--mp-fontSize-14);
  letter-spacing: 0.06em;
  color: var(--text-primary);
}

.tl-upgrade__codes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--mp-space-8) var(--mp-space-24);
  padding: var(--mp-component-card-padding);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-12);
  background: var(--surface-secondary);
  color: var(--on-surface);
}

.tl-upgrade__code-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-space-8);
  margin-top: var(--mp-space-16);
}

.tl-upgrade__summary {
  padding: 0 var(--mp-component-card-paddingCompact);
}

@media (max-width: 640px) {
  .tl-upgrade__mfa {
    grid-template-columns: minmax(0, 1fr);
  }

  .tl-upgrade__qr {
    width: 100%;
    max-width: 220px;
  }
}
</style>
