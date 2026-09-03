<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpWizardShell from '@/components/MpWizardShell.vue'
import MpWizardStepCard from '@/components/MpWizardStepCard.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormField from '@/components/MpFormField.vue'
import SmsPhonePreview from '@/components/marketing/SmsPhonePreview.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useWizardSteps } from '@/composables/useWizardSteps'
import { useSmsStore, type SmsCampaign } from '@/stores/useSms'
import { usePlgStore } from '@/stores/usePlg'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const store = useSmsStore()
const plg = usePlgStore()

const accountId = computed(() => route.params.accountId as string)
const backTo = computed(() => ({ name: 'SmsCampaigns', params: { accountId: accountId.value } }))
const hasSmsAccess = computed(() => plg.entitlements.sms)
function viewPlans() { router.push({ name: 'Billing', params: { accountId: accountId.value } }) }

const stepTitles = ['Message', 'Compliance']
const draftId = ref<number | null>(null)

// ── Message ───────────────────────────────────────────────────────────────────
const name = ref('')
const fromNumber = ref('+61481074914')
const FROM_NUMBERS = ['+61481074914', '+61481074915', '+61481074916']
const message = ref('')
const testPhone = ref('')
const clickTrackingEnabled = ref(false)
const toast = useToast()

const INSERT_CHIPS: { key: string; label: string; icon: string; token: string }[] = [
  { key: 'image', label: 'Image (MMS)', icon: 'image', token: '' },
  { key: 'tags', label: 'Contact Tags', icon: 'tag', token: '{{contact.tag}}' },
  { key: 'keywords', label: 'Keywords', icon: 'hash', token: '{{keyword}}' },
  { key: 'tracking', label: 'Click Tracking', icon: 'link', token: '{{link}}' },
]

function insertHelper(chip: typeof INSERT_CHIPS[number]) {
  if (chip.key === 'tracking') clickTrackingEnabled.value = true
  if (chip.token) message.value = `${message.value}${message.value && !message.value.endsWith(' ') ? ' ' : ''}${chip.token}`
}

function sendTest() {
  if (!testPhone.value.trim()) return
  toast.success(`Test message sent to ${testPhone.value}`)
}

// GSM-7 segmentation: 160 chars single, 153 per part once concatenated.
const MAX_SINGLE = 160
const PER_MULTI = 153
const charCount = computed(() => message.value.length)
const segments = computed(() => {
  const n = charCount.value
  if (n === 0) return 0
  return n <= MAX_SINGLE ? 1 : Math.ceil(n / PER_MULTI)
})
const segmentCap = computed(() => (charCount.value <= MAX_SINGLE ? MAX_SINGLE : segments.value * PER_MULTI))

const previewText = computed(() => {
  const parts = [`Testing UAT 116000: ${message.value.trim() || 'Your message preview appears here.'}`]
  if (clickTrackingEnabled.value) parts.push('0.mpt1.co/x7Fh2')
  parts.push('Text STOP to opt-out')
  return parts.join(' ')
})

// ── Compliance ────────────────────────────────────────────────────────────────
const optOutConfirmed = ref(false)
const audience = ref('SMS Opted-In')
const AUDIENCES = ['SMS Opted-In', 'SMS Marketing List', 'All contacts']
const scheduleType = ref<'now' | 'scheduled'>('now')
const scheduleDate = ref('')
const scheduleTime = ref('09:00')

// ── Validity ──────────────────────────────────────────────────────────────────
const messageValid = computed(() => name.value.trim().length > 0 && message.value.trim().length > 0)
const complianceValid = computed(() => optOutConfirmed.value && !!audience.value && (scheduleType.value === 'now' || scheduleDate.value.length > 0))
const stepValid = computed(() => (step.value === 1 ? messageValid.value : complianceValid.value))
const stepHint = computed(() => {
  if (step.value === 1) return 'Add a campaign name and message to continue.'
  if (!optOutConfirmed.value) return 'Confirm the opt-out disclosure to continue.'
  if (!audience.value) return 'Choose an audience to continue.'
  return 'Pick a send date to continue.'
})

// ── Persistence ───────────────────────────────────────────────────────────────
function buildInput(): Omit<SmsCampaign, 'id' | 'status' | 'sent' | 'delivered' | 'clicks'> {
  return {
    name: name.value,
    messagePreview: message.value,
    message: message.value,
    audience: audience.value,
    sentDate: null,
    fromNumber: fromNumber.value,
    optOutConfirmed: optOutConfirmed.value,
    scheduleType: scheduleType.value,
    scheduleDate: scheduleDate.value || null,
    scheduleTime: scheduleTime.value || null,
  }
}

// ── Unsaved-changes guard ─────────────────────────────────────────────────────
const savedSnapshot = ref(JSON.stringify(buildInput()))
const isDirty = computed(() => JSON.stringify(buildInput()) !== savedSnapshot.value)
const {
  confirmLeave,
  allowNextLeave,
  discardAndLeave,
  leaveTitle,
  leaveMessage,
  leaveConfirmLabel,
} = useDirtyLeaveGuard(isDirty, {
  title: 'Leave SMS campaign?',
  message: 'You have unsaved changes. Leaving now will discard them.',
})

function saveProgress(finalize = false) {
  if (!messageValid.value) return
  const input = buildInput()
  if (draftId.value == null) {
    draftId.value = store.createSmsCampaign(input, finalize)
  } else {
    store.updateSmsCampaign(draftId.value, input, finalize)
  }
  savedSnapshot.value = JSON.stringify(buildInput())
}

const { step, maxStep, goTo: goToStep, next: nextStep, prev: prevStep, unlockAll } = useWizardSteps(stepTitles.length, {
  canAdvance: () => stepValid.value,
  onNavigate: () => saveProgress(),
})

function exitWizard() {
  saveProgress(false)
  allowNextLeave()
  router.push(backTo.value)
}

function finalizeCampaign() {
  if (!complianceValid.value) return
  saveProgress(true)
  allowNextLeave()
  router.push(backTo.value)
}

// ── Edit hydration ────────────────────────────────────────────────────────────
onMounted(() => {
  const idParam = route.query.id ?? route.params.id
  if (!idParam) return
  const existing = store.getSmsCampaign(Number(idParam))
  if (!existing) return
  draftId.value = existing.id
  name.value = existing.name
  message.value = existing.message ?? existing.messagePreview
  fromNumber.value = existing.fromNumber ?? '+61481074914'
  audience.value = existing.audience
  optOutConfirmed.value = existing.optOutConfirmed ?? false
  scheduleType.value = existing.scheduleType ?? 'now'
  scheduleDate.value = existing.scheduleDate ?? ''
  scheduleTime.value = existing.scheduleTime ?? '09:00'
  unlockAll()
  savedSnapshot.value = JSON.stringify(buildInput())
})

const pageTitle = computed(() => (draftId.value != null ? 'Edit SMS Campaign' : 'New SMS Campaign'))
</script>

<template>
  <MpWizardShell
    :title="hasSmsAccess ? pageTitle : 'New SMS Campaign'"
    :steps="hasSmsAccess ? stepTitles : undefined"
    :current="hasSmsAccess ? step : undefined"
    :max-step="maxStep"
    :clickable="maxStep > 1"
    :back-to="backTo"
    :subtitle="hasSmsAccess ? undefined : 'SMS is not included in your current plan.'"
    measure="lg"
    :hint="hasSmsAccess && !stepValid ? stepHint : undefined"
    @select="goToStep"
    @back="prevStep"
  >
    <!-- Entitlement-gated state: same shell, no steps -->
    <template v-if="!hasSmsAccess">
      <v-card variant="flat" border rounded="lg">
        <MpEmptyState
          icon="message-square"
          title="Not included in your plan"
          description="SMS campaigns aren't part of your current plan. Upgrade to reach customers by text."
          action-label="View plans"
          action-icon="arrow-right"
          class="py-10"
          @action="viewPlans"
        />
        <div class="d-flex justify-center pb-8">
          <v-btn variant="text" class="text-none" href="mailto:sales@maropost.com?subject=SMS%20Campaigns%20%E2%80%94%20plan%20upgrade">Talk to sales</v-btn>
        </div>
      </v-card>
    </template>

    <template v-else>
      <div class="cs-grid">
        <!-- Step 1: Message -->
        <MpWizardStepCard v-if="step === 1" title="Message" description="Write the SMS your audience will receive.">
          <MpFormGrid>
            <v-text-field v-model="name" label="Text Campaign Name *" placeholder="e.g. Weekend Flash Sale"></v-text-field>
            <v-select v-model="fromNumber" label="From Number" :items="FROM_NUMBERS"></v-select>

            <v-textarea v-model="message" label="Message *" placeholder="Type your SMS. Keep it short and add a clear call to action." rows="4" auto-grow></v-textarea>
            <div class="d-flex justify-end">
              <span class="text-caption sms-count" :class="segments > 1 ? 'text-warning' : 'text-medium-emphasis'">
                {{ segments || 1 }} SMS {{ charCount }}/{{ segmentCap }}
              </span>
            </div>

            <div class="d-flex flex-wrap gap-2">
              <v-chip v-for="chip in INSERT_CHIPS" :key="chip.key" size="small" variant="outlined" :prepend-icon="chip.icon" class="text-none" @click="insertHelper(chip)">
                {{ chip.label }}
              </v-chip>
            </div>

            <v-divider></v-divider>
            <MpFormSection title="Send a test" />
            <div class="d-flex gap-3 align-center flex-wrap">
              <v-text-field v-model="testPhone" label="Test phone number" placeholder="+61…" class="flex-grow-1"></v-text-field>
              <v-btn variant="outlined" class="text-none" prepend-icon="send" :disabled="!testPhone.trim()" @click="sendTest">Send test</v-btn>
            </div>
          </MpFormGrid>
        </MpWizardStepCard>

        <!-- Step 2: Compliance -->
        <MpWizardStepCard v-if="step === 2" title="Compliance" description="Confirm consent handling and choose your audience and send time.">
          <MpFormGrid :cols="2">
            <v-checkbox v-model="optOutConfirmed" class="mp-form-grid__full">
              <template #label>
                <span class="text-body-2">This message includes a clear opt-out ("Text STOP to opt-out") and complies with local SMS marketing regulations.</span>
              </template>
            </v-checkbox>

            <v-select v-model="audience" label="Audience list *" :items="AUDIENCES"></v-select>

            <MpFormField label="When to send" class="mp-form-grid__full">
              <template #default="{ labelId }">
                <v-radio-group v-model="scheduleType" :aria-labelledby="labelId" class="cs-schedule-options">
                  <v-card variant="outlined" rounded="lg" class="pa-4 cursor-pointer" :color="scheduleType === 'now' ? 'primary' : ''" @click="scheduleType = 'now'">
                    <v-radio value="now">
                      <template #label>
                        <div class="ml-2">
                          <div class="font-weight-bold">Send Immediately</div>
                          <div class="text-caption text-medium-emphasis">Sends as soon as you click "Send campaign now"</div>
                        </div>
                      </template>
                    </v-radio>
                  </v-card>
                  <v-card variant="outlined" rounded="lg" class="pa-4 cursor-pointer" @click="scheduleType = 'scheduled'">
                    <v-radio value="scheduled">
                      <template #label>
                        <div class="ml-2">
                          <div class="font-weight-bold">Schedule for Later</div>
                          <div class="text-caption text-medium-emphasis">Pick a specific date and time for delivery</div>
                        </div>
                      </template>
                    </v-radio>
                  </v-card>
                </v-radio-group>
              </template>
            </MpFormField>

            <v-expand-transition>
              <MpFormGrid v-if="scheduleType === 'scheduled'" :cols="2" class="mp-form-grid__full">
                <v-text-field v-model="scheduleDate" label="Date" type="date"></v-text-field>
                <v-text-field v-model="scheduleTime" label="Time" type="time"></v-text-field>
              </MpFormGrid>
            </v-expand-transition>
          </MpFormGrid>
        </MpWizardStepCard>

        <!-- Live phone preview -->
        <aside class="cs-preview">
          <div class="cs-preview__sticky">
            <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-3">Message preview</div>
            <SmsPhonePreview :sender="fromNumber" :message="previewText" />
          </div>
        </aside>
      </div>
    </template>

    <template v-if="hasSmsAccess" #actions>
      <v-btn variant="text" class="text-none text-medium-emphasis" @click="exitWizard">Save &amp; exit</v-btn>
    </template>
    <template v-if="hasSmsAccess" #footer>
      <v-btn v-if="step === 1" color="primary" variant="flat" class="text-none" append-icon="arrow-right" :disabled="!stepValid" @click="nextStep">Continue</v-btn>
      <v-btn v-else color="primary" variant="flat" class="text-none" prepend-icon="rocket" :disabled="!stepValid" @click="finalizeCampaign">
        {{ scheduleType === 'now' ? 'Send campaign now' : 'Schedule campaign' }}
      </v-btn>
    </template>
  </MpWizardShell>

  <MpConfirmDialog
    v-model="confirmLeave"
    danger
    :title="leaveTitle"
    :message="leaveMessage"
    :confirm-label="leaveConfirmLabel"
    @confirm="discardAndLeave"
  />
</template>

<style scoped>
.sms-count { font-variant-numeric: tabular-nums; }
/* The radio group owns the rhythm between its schedule option tiles. */
.cs-schedule-options :deep(.v-selection-control-group) { gap: var(--mp-component-field-groupGap); }

/* The shell's lg measure caps the width; this grid only splits it. */
.cs-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: var(--mp-space-24);
  align-items: start;
}
@media (max-width: 900px) {
  .cs-grid { grid-template-columns: 1fr; }
  .cs-preview { display: none; }
}
.cs-preview__sticky { position: sticky; top: 0; }
</style>
