<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'

const route = useRoute()
const router = useRouter()

const accountId = computed(() => route.params.accountId as string)
const backTo = computed(() => ({ name: 'TransactionalSms', params: { accountId: accountId.value } }))

const name = ref('')
const message = ref('')
const senderId = ref('MAROPOST')
const audience = ref<string | null>('SMS Opted-In')
const template = ref<string | null>(null)
const saved = ref(false)

const tokenExample = '{{ first_name }}'
const AUDIENCES = ['SMS Opted-In', 'SMS Marketing List', 'All contacts']
const TEMPLATES = [
  { title: 'Order Confirmation', value: 'Your order {{order_no}} is confirmed! 🎉 Track it here: {{link}}' },
  { title: 'Shipping Update', value: 'Good news! Your order has shipped 📦 Follow along: {{link}}' },
  { title: 'Verification Code (OTP)', value: 'Your verification code is {{code}}. It expires in 10 minutes.' },
  { title: 'Abandoned Cart', value: 'You left something behind! Complete your checkout: {{link}}' },
]

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

const canCreate = computed(() => name.value.trim() !== '' && message.value.trim() !== '' && !!audience.value)

function create() {
  if (!canCreate.value) return
  saved.value = true
  setTimeout(() => router.push(backTo.value), 700)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="New Transactional SMS"
      subtitle="Triggered text messages like order confirmations, OTPs, and shipping updates"
      :back-to="backTo"
    />

    <div class="flex-grow-1 overflow-y-auto">
      <div class="cts-form mx-auto d-flex flex-column gap-5">
        <v-card flat border rounded="lg" class="pa-6">
          <div class="text-subtitle-2 font-weight-bold mb-4">Message</div>
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
            label="Message body"
            placeholder="Type your SMS. Add personalization tokens for a tailored message."
            variant="outlined"
            density="comfortable"
            rounded="lg"
            rows="4"
            auto-grow
            counter
            hide-details="auto"
          />
          <div class="d-flex align-center justify-space-between mt-2">
            <span class="text-caption text-medium-emphasis">
              Personalize with tokens like <code>{{ tokenExample }}</code>
            </span>
            <span class="text-caption sms-count" :class="segments > 1 ? 'text-warning' : 'text-medium-emphasis'">
              {{ charCount }} / {{ segmentCap }} · {{ segments }} segment{{ segments === 1 ? '' : 's' }}
            </span>
          </div>
        </v-card>

        <v-card flat border rounded="lg" class="pa-6">
          <div class="text-subtitle-2 font-weight-bold mb-4">Sender &amp; audience</div>
          <v-row dense>
            <v-col cols="12" md="6">
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
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="audience"
                label="Target audience"
                :items="AUDIENCES"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                hide-details
              />
            </v-col>
          </v-row>
        </v-card>
      </div>
    </div>

    <div class="cts-footer d-flex justify-end ga-3 pt-3">
      <v-btn variant="text" class="text-none" :to="backTo">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" :disabled="!canCreate" prepend-icon="check" @click="create">
        Create transactional SMS
      </v-btn>
    </div>

    <v-snackbar v-model="saved" color="success" timeout="700" location="bottom right">
      Transactional SMS created
    </v-snackbar>
  </div>
</template>

<style scoped>
.cts-form {
  width: 100%;
  max-width: 720px;
}
.cts-footer {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.sms-count {
  font-variant-numeric: tabular-nums;
}
code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  background: rgba(var(--v-theme-on-surface), 0.06);
  padding: 1px 5px;
  border-radius: 4px;
}
</style>
