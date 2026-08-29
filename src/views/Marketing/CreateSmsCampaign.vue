<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpWizardSteps from '@/components/MpWizardSteps.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormField from '@/components/MpFormField.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
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
const step = ref(1)
const maxStepReached = ref(1)
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

function goToStep(target: number) {
  if (target === step.value) return
  if (target > step.value && !stepValid.value) return
  saveProgress()
  step.value = target
  maxStepReached.value = Math.max(maxStepReached.value, target)
}
function nextStep() { goToStep(Math.min(step.value + 1, 2)) }
function prevStep() { goToStep(Math.max(step.value - 1, 1)) }

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
  maxStepReached.value = 2
  savedSnapshot.value = JSON.stringify(buildInput())
})

const pageTitle = computed(() => (draftId.value != null ? 'Edit SMS Campaign' : 'New SMS Campaign'))
</script>

<template>
  <div class="mp-frame-fill d-flex flex-column">
    <template v-if="!hasSmsAccess">
      <div class="cs-head px-8 pt-6 pb-4 bg-surface border-b">
        <MpPageHeader title="New SMS Campaign" :back-to="backTo" />
      </div>
      <div class="flex-grow-1 d-flex flex-column pa-8 bg-background">
        <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column justify-center">
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
      </div>
    </template>

    <template v-else>
    <div class="cs-head px-8 pt-6 pb-4 bg-surface border-b">
      <MpPageHeader :title="pageTitle" :subtitle="`Step ${step} of 2 — ${stepTitles[step - 1]}`" :back-to="backTo">
        <template #actions>
          <v-btn variant="text" class="text-none text-medium-emphasis" @click="exitWizard">Save &amp; exit</v-btn>
        </template>
        <template #tabs>
          <MpWizardSteps :steps="stepTitles" :current="step" :clickable="maxStepReached > 1" :max-step="maxStepReached" class="mt-3" @select="goToStep" />
        </template>
      </MpPageHeader>
    </div>

    <div class="flex-grow-1 overflow-y-auto pa-8 bg-background">
      <div class="cs-grid mx-auto">
        <!-- Step 1: Message -->
        <v-card v-if="step === 1" flat border rounded="lg" class="pa-8">
          <div class="text-h6 font-weight-bold mb-1">Message</div>
          <div class="text-body-2 text-medium-emphasis mb-6">Write the SMS your audience will receive.</div>
          <v-divider class="mb-6"></v-divider>

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
              <v-text-field v-model="testPhone" label="Test phone number" placeholder="+61…" style="max-width: 260px;"></v-text-field>
              <v-btn variant="outlined" class="text-none" prepend-icon="send" :disabled="!testPhone.trim()" @click="sendTest">Send test</v-btn>
            </div>
          </MpFormGrid>
        </v-card>

        <!-- Step 2: Compliance -->
        <v-card v-if="step === 2" flat border rounded="lg" class="pa-8">
          <div class="text-h6 font-weight-bold mb-1">Compliance</div>
          <div class="text-body-2 text-medium-emphasis mb-6">Confirm consent handling and choose your audience and send time.</div>
          <v-divider class="mb-6"></v-divider>

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
        </v-card>

        <!-- Live phone preview -->
        <aside class="cs-preview">
          <div class="cs-preview__sticky">
            <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-3">Message preview</div>
            <div class="phone">
              <div class="phone__notch"></div>
              <div class="phone__sender">{{ fromNumber }}</div>
              <div class="phone__thread">
                <div class="phone__bubble">{{ previewText }}</div>
                <div class="phone__stamp">Delivered · now</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <div class="px-8 py-4 border-t bg-surface d-flex justify-space-between align-center">
      <v-btn v-if="step > 1" variant="text" class="text-none" prepend-icon="arrow-left" @click="prevStep">Back</v-btn>
      <div v-else></div>
      <div class="d-flex align-center gap-3">
        <span v-if="!stepValid" class="text-caption text-medium-emphasis">{{ stepHint }}</span>
        <v-btn v-if="step === 1" color="primary" variant="flat" class="text-none" append-icon="arrow-right" :disabled="!stepValid" @click="nextStep">Continue</v-btn>
        <v-btn v-else color="primary" variant="flat" class="text-none" prepend-icon="rocket" :disabled="!stepValid" @click="finalizeCampaign">
          {{ scheduleType === 'now' ? 'Send campaign now' : 'Schedule campaign' }}
        </v-btn>
      </div>
    </div>

    </template>
    <MpConfirmDialog
      v-model="confirmLeave"
      danger
      :title="leaveTitle"
      :message="leaveMessage"
      :confirm-label="leaveConfirmLabel"
      @confirm="discardAndLeave"
    />
  </div>
</template>

<style scoped>
.cs-head .mp-page-header { margin-bottom: 0; }
.border-b { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.border-t { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.sms-count { font-variant-numeric: tabular-nums; }
/* The radio group owns the rhythm between its schedule option tiles. */
.cs-schedule-options :deep(.v-selection-control-group) { gap: var(--mp-component-field-groupGap); }

.cs-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 24px;
  max-width: 1040px;
  align-items: start;
}
@media (max-width: 900px) {
  .cs-grid { grid-template-columns: 1fr; }
  .cs-preview { display: none; }
}
.cs-preview__sticky { position: sticky; top: 0; }

.phone {
  background: linear-gradient(180deg, rgba(var(--v-theme-on-surface), 0.04), rgba(var(--v-theme-on-surface), 0.02));
  border: 1px solid var(--mp-border-subtle);
  border-radius: 22px;
  padding: 18px 14px 20px;
}
.phone__notch { width: 42px; height: 5px; border-radius: 999px; background: rgba(var(--v-theme-on-surface), 0.18); margin: 0 auto 14px; }
.phone__sender { text-align: center; font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.03em; color: rgba(var(--v-theme-on-surface), 0.55); margin-bottom: 12px; }
.phone__thread { display: flex; flex-direction: column; align-items: flex-start; }
.phone__bubble {
  max-width: 100%;
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--mp-border-subtle);
  border-radius: 16px 16px 16px 4px;
  padding: 10px 13px;
  font-size: 0.8125rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}
.phone__stamp { font-size: 0.625rem; color: rgba(var(--v-theme-on-surface), 0.45); margin-top: 4px; padding-left: 4px; }
</style>
