<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useSmsStore } from '@/stores/useSms'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const store = useSmsStore()

const accountId = computed(() => route.params.accountId as string)
const backTo = computed(() => ({ name: 'TransactionalSms', params: { accountId: accountId.value } }))

const editId = ref<number | null>(null)
const tab = ref<'message' | 'compliance'>('message')

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

function goToCompliance() {
  if (messageValid.value) tab.value = 'compliance'
}

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
  savedSnapshot.value = serializeForm()
})

const pageTitle = computed(() => (editId.value != null ? 'Edit Transactional SMS' : 'New Transactional SMS'))
</script>

<template>
  <div class="mp-frame-fill d-flex flex-column">
    <div class="px-8 pt-6 pb-4 bg-surface page-head">
      <MpPageHeader
        :title="pageTitle"
        subtitle="Triggered text messages like order confirmations, OTPs, and shipping updates"
        :back-to="backTo"
      >
        <template #tabs>
          <v-tabs v-model="tab" density="comfortable" color="primary" class="mt-3">
            <v-tab value="message" class="text-none">Message</v-tab>
            <v-tab value="compliance" class="text-none" :disabled="!messageValid">Compliance</v-tab>
          </v-tabs>
        </template>
      </MpPageHeader>
    </div>

    <div class="flex-grow-1 overflow-y-auto px-8 py-6 bg-background">
      <div class="cts-grid mx-auto">
        <!-- Message tab -->
        <div v-if="tab === 'message'" class="d-flex flex-column gap-5">
          <v-card flat border rounded="lg" class="pa-6">
            <div class="d-flex align-center ga-2 mb-4">
              <v-icon size="18" class="text-medium-emphasis">message-square</v-icon>
              <span class="text-subtitle-2 font-weight-bold">Message</span>
            </div>
            <v-text-field
              v-model="name"
              label="Transactional event name"
              placeholder="e.g. Order Confirmation"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              class="mb-4"
              :rules="[v => !!v || 'Name is required']"
            />
            <v-text-field
              v-model="senderId"
              label="Sender ID"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              :counter="11"
              :maxlength="11"
              hint="Up to 11 alphanumeric characters shown as the sender"
              persistent-hint
              class="mb-4"
            />
            <v-select
              v-model="template"
              label="Start from a template (optional)"
              :items="TEMPLATES"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              placeholder="Choose a starting point"
              clearable
              class="mb-4"
              @update:model-value="applyTemplate"
            />
            <v-textarea
              v-model="message"
              label="Message body *"
              placeholder="Type your SMS. Add personalization tokens for a tailored message."
              variant="outlined"
              density="comfortable"
              rounded="lg"
              rows="4"
              auto-grow
              hide-details
            />
            <div class="d-flex align-center justify-space-between mt-2 mb-4">
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
          </v-card>
        </div>

        <!-- Compliance tab -->
        <div v-else class="d-flex flex-column gap-5">
          <v-card flat border rounded="lg" class="pa-6">
            <div class="d-flex align-center ga-2 mb-4">
              <v-icon size="18" class="text-medium-emphasis">shield-check</v-icon>
              <span class="text-subtitle-2 font-weight-bold">Compliance</span>
            </div>
            <v-checkbox v-model="optOutConfirmed" color="primary" hide-details>
              <template #label>
                <span class="text-body-2">This message includes a clear opt-out and complies with local SMS marketing regulations.</span>
              </template>
            </v-checkbox>
          </v-card>
        </div>

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
    </div>

    <div class="px-8 py-4 bg-surface page-foot d-flex justify-space-between ga-3">
      <v-btn v-if="tab === 'compliance'" variant="text" class="text-none" prepend-icon="arrow-left" @click="tab = 'message'">Back</v-btn>
      <div v-else></div>
      <div class="d-flex ga-3">
        <v-btn variant="text" class="text-none" :to="backTo">Cancel</v-btn>
        <v-btn v-if="tab === 'message'" color="primary" variant="flat" class="text-none" append-icon="arrow-right" :disabled="!messageValid" @click="goToCompliance">
          Continue
        </v-btn>
        <v-btn v-else color="primary" variant="flat" class="text-none" :disabled="!canSave" prepend-icon="check" @click="save">
          {{ editId != null ? 'Save changes' : 'Save' }}
        </v-btn>
      </div>
    </div>

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
.cts-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 24px;
  max-width: 1040px;
  align-items: start;
}
@media (max-width: 900px) {
  .cts-grid { grid-template-columns: 1fr; }
  .cts-preview { display: none; }
}
.cts-preview__sticky { position: sticky; top: 0; }
.page-head { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.page-head :deep(.mp-page-header) { margin-bottom: 0; }
.page-foot { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
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
