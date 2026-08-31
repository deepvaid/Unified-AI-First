<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpWizardShell from '@/components/MpWizardShell.vue'
import MpWizardStepCard from '@/components/MpWizardStepCard.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useWizardSteps } from '@/composables/useWizardSteps'
import { useSmsStore } from '@/stores/useSms'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const store = useSmsStore()

const accountId = computed(() => route.params.accountId as string)
const backTo = computed(() => ({ name: 'TransactionalSms', params: { accountId: accountId.value } }))

const editId = ref<number | null>(null)

const name = ref('')
const message = ref('')
const senderId = ref('MAROPOST')
const template = ref<string | null>(null)
const optOutConfirmed = ref(false)
const toast = useToast()

const tokenExample = '{{ first_name }}'
const TEMPLATES = [
  { title: 'Order Confirmation', value: 'Your order {{order_no}} is confirmed! 🎉 Track it here: {{link}}' },
  { title: 'Shipping Update', value: 'Good news! Your order has shipped 📦 Follow along: {{link}}' },
  { title: 'Verification Code (OTP)', value: 'Your verification code is {{code}}. It expires in 10 minutes.' },
  { title: 'Abandoned Cart', value: 'You left something behind! Complete your checkout: {{link}}' },
]
const INSERT_CHIPS: { key: string; label: string; icon: string; token: string }[] = [
  { key: 'tags', label: 'Contact Tags', icon: 'tag', token: '{{contact.tag}}' },
  { key: 'keywords', label: 'Keywords', icon: 'hash', token: '{{keyword}}' },
  { key: 'tracking', label: 'Click Tracking', icon: 'link', token: '{{link}}' },
]

function insertHelper(chip: typeof INSERT_CHIPS[number]) {
  message.value = `${message.value}${message.value && !message.value.endsWith(' ') ? ' ' : ''}${chip.token}`
}

// GSM-7 segmentation: 160 chars for a single SMS, 153 per part once concatenated.
const MAX_SINGLE = 160
const PER_MULTI = 153
const charCount = computed(() => message.value.length)
const segments = computed(() => {
  const n = charCount.value
  if (n === 0) return 0
  return n <= MAX_SINGLE ? 1 : Math.ceil(n / PER_MULTI)
})
const segmentCap = computed(() => (charCount.value <= MAX_SINGLE ? MAX_SINGLE : segments.value * PER_MULTI))

function applyTemplate(val: string | null) {
  if (val) message.value = val
}

const messageValid = computed(() => name.value.trim() !== '' && message.value.trim() !== '')
const canSave = computed(() => messageValid.value && optOutConfirmed.value)

// This was a gated v-tabs pair — a wizard wearing tabs. Same gating, honest steps.
const STEPS = ['Message', 'Compliance']
const { step, maxStep, goTo, next, prev, unlockAll } = useWizardSteps(STEPS.length, {
  canAdvance: () => messageValid.value,
})
const stepHint = computed(() => {
  if (step.value === 1 && !messageValid.value) return 'Name the event and write the message to continue'
  if (step.value === 2 && !optOutConfirmed.value) return 'Confirm compliance to save'
  return undefined
})

// ── Unsaved-changes guard ─────────────────────────────────────────────────────
function serializeForm() {
  return JSON.stringify([name.value, message.value, senderId.value, optOutConfirmed.value])
}
const savedSnapshot = ref(serializeForm())
const isDirty = computed(() => serializeForm() !== savedSnapshot.value)
const {
  confirmLeave,
  allowNextLeave,
  discardAndLeave,
  leaveTitle,
  leaveMessage,
  leaveConfirmLabel,
} = useDirtyLeaveGuard(isDirty, {
  title: 'Leave transactional SMS?',
  message: 'You have unsaved changes. Leaving now will discard them.',
})

function save() {
  if (!canSave.value) return
  const input = {
    name: name.value.trim(),
    messagePreview: message.value.trim(),
    message: message.value.trim(),
    senderId: senderId.value,
    audience: 'All contacts',
    optOutConfirmed: optOutConfirmed.value,
  }
  if (editId.value != null) {
    store.updateTransactionalSms(editId.value, input)
  } else {
    store.createTransactionalSms(input)
  }
  savedSnapshot.value = serializeForm()
  toast.success(editId.value != null ? 'Transactional SMS updated' : 'Transactional SMS saved')
  allowNextLeave()
  setTimeout(() => router.push(backTo.value), 700)
}

onMounted(() => {
  const idParam = route.query.id
  if (!idParam) return
  const existing = store.getTransactionalSms(Number(idParam))
  if (!existing) return
  editId.value = existing.id
  name.value = existing.name
  message.value = existing.message ?? existing.messagePreview
  senderId.value = existing.senderId
  optOutConfirmed.value = existing.optOutConfirmed ?? false
  unlockAll()
  savedSnapshot.value = serializeForm()
})

const pageTitle = computed(() => (editId.value != null ? 'Edit Transactional SMS' : 'New Transactional SMS'))
</script>

<template>
  <MpWizardShell
    :title="pageTitle"
    :steps="STEPS"
    :current="step"
    :max-step="maxStep"
    :back-to="backTo"
    measure="lg"
    :hint="stepHint"
    @select="goTo"
    @back="prev"
  >
    <div class="cts-grid">
      <!-- Step 1 · Message -->
      <MpWizardStepCard
        v-if="step === 1"
        title="Message"
        description="Triggered text messages like order confirmations, OTPs, and shipping updates."
      >
        <MpFormGrid>
              <v-text-field
                v-model="name"
                label="Transactional event name"
                placeholder="e.g. Order Confirmation"
                :rules="[v => !!v || 'Name is required']"
              />
              <v-text-field
                v-model="senderId"
                label="Sender ID"
                :counter="11"
                :maxlength="11"
                hint="Up to 11 alphanumeric characters shown as the sender"
                persistent-hint
              />
              <v-select
                v-model="template"
                label="Start from a template (optional)"
                :items="TEMPLATES"
                placeholder="Choose a starting point"
                clearable
                @update:model-value="applyTemplate"
              />
              <v-textarea
                v-model="message"
                label="Message body *"
                placeholder="Type your SMS. Add personalization tokens for a tailored message."
                rows="4"
                auto-grow
              />
              <div class="d-flex align-center justify-space-between">
                <span class="text-caption text-medium-emphasis">
                  Personalize with tokens like <code>{{ tokenExample }}</code>
                </span>
                <span class="text-caption sms-count" :class="segments > 1 ? 'text-warning' : 'text-medium-emphasis'">
                  {{ charCount }} / {{ segmentCap }} · {{ segments }} segment{{ segments === 1 ? '' : 's' }}
                </span>
              </div>
              <div class="d-flex flex-wrap gap-2">
                <v-chip v-for="chip in INSERT_CHIPS" :key="chip.key" size="small" variant="outlined" :prepend-icon="chip.icon" class="text-none" @click="insertHelper(chip)">
                  {{ chip.label }}
                </v-chip>
              </div>
            </MpFormGrid>
      </MpWizardStepCard>

      <!-- Step 2 · Compliance -->
      <MpWizardStepCard
        v-else
        title="Compliance"
        description="Confirm the message meets SMS marketing requirements before saving."
      >
        <v-checkbox v-model="optOutConfirmed">
          <template #label>
            <span class="text-body-2">This message includes a clear opt-out and complies with local SMS marketing regulations.</span>
          </template>
        </v-checkbox>
      </MpWizardStepCard>

      <!-- Live phone preview -->
        <aside class="cts-preview">
          <div class="cts-preview__sticky">
            <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-3">Message preview</div>
            <div class="phone">
              <div class="phone__notch" />
              <div class="phone__sender">{{ senderId.trim() || 'SENDER' }}</div>
              <div class="phone__thread">
                <div class="phone__bubble">{{ message.trim() || 'Your message preview appears here as the customer will see it.' }}</div>
                <div class="phone__stamp">Delivered · now</div>
              </div>
            </div>
            <div class="cts-preview__meta">
              <span :class="segments > 1 ? 'text-warning' : 'text-medium-emphasis'">
                {{ charCount }} / {{ segmentCap }} · {{ segments }} segment{{ segments === 1 ? '' : 's' }}
              </span>
            </div>
          </div>
        </aside>
    </div>

    <template #footer>
      <v-btn variant="text" class="text-none" :to="backTo">Cancel</v-btn>
      <v-btn v-if="step === 1" color="primary" variant="flat" class="text-none" append-icon="arrow-right" :disabled="!messageValid" @click="next">
        Continue
      </v-btn>
      <v-btn v-else color="primary" variant="flat" class="text-none" :disabled="!canSave" prepend-icon="check" @click="save">
        {{ editId != null ? 'Save changes' : 'Save' }}
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
/* The shell's lg measure caps the width; this grid only splits it. */
.cts-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: var(--mp-space-24);
  align-items: start;
}
@media (max-width: 900px) {
  .cts-grid { grid-template-columns: 1fr; }
  .cts-preview { display: none; }
}
.cts-preview__sticky { position: sticky; top: 0; }
.sms-count { font-variant-numeric: tabular-nums; }
code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  background: rgba(var(--v-theme-on-surface), 0.06);
  padding: 1px 5px;
  border-radius: 4px;
}

/* Phone SMS preview */
.phone {
  background: linear-gradient(180deg, rgba(var(--v-theme-on-surface), 0.04), rgba(var(--v-theme-on-surface), 0.02));
  border: 1px solid var(--mp-border-subtle);
  border-radius: 22px;
  padding: 18px 14px 20px;
}
.phone__notch {
  width: 42px;
  height: 5px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.18);
  margin: 0 auto 14px;
}
.phone__sender {
  text-align: center;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: rgba(var(--v-theme-on-surface), 0.55);
  margin-bottom: 12px;
}
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
.phone__stamp {
  font-size: 0.625rem;
  color: rgba(var(--v-theme-on-surface), 0.45);
  margin-top: 4px;
  padding-left: 4px;
}
.cts-preview__meta {
  text-align: right;
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
  margin-top: 8px;
}
</style>
