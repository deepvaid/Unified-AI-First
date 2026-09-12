<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import MpFormField from '@/components/MpFormField.vue'
import { formatAgo } from '@/composables/useRelativeTime'
import { validateWorkEmail } from '@/stores/trialLabData'
import type { ChallengeState, CodeResult } from '@/stores/useTrialLab'

/**
 * TrialVerifyForm — the one email-verification surface. Used full-size on the
 * verify screen and inside the gated-action dialog, so both places accept the
 * same code, offer the same resend / change-email recovery and speak the same
 * error copy.
 */
const props = withDefaults(defineProps<{
  email: string
  /** Lifecycle of the live challenge, from the store. */
  challengeState: ChallengeState
  /** Result of the last code submission; null until the user submits. */
  lastResult: CodeResult | null
  /** ISO time of the last send — drives the "Sent just now" caption and the resend cooldown. */
  sentAt: string | null
  /** Ticks so the caption re-renders. */
  now: number
  submitting?: boolean
}>(), { submitting: false })

const emit = defineEmits<{
  submit: [code: string]
  resend: []
  changeEmail: [email: string]
  openInbox: []
}>()

const code = ref('')
const editingEmail = ref(false)
const newEmail = ref('')
const emailError = ref('')
const otp = ref<{ focus?: () => void } | null>(null)

const RESEND_COOLDOWN_MS = 5_000
const canResend = computed(() => !props.sentAt || props.now - new Date(props.sentAt).getTime() > RESEND_COOLDOWN_MS)

const errorText = computed(() => {
  switch (props.lastResult) {
    case 'wrong': return 'That code isn’t right. Check the latest email and try again.'
    case 'expired': return 'That code has expired — send a new email to get a fresh one.'
    case 'used': return 'That code has already been used.'
    case 'none': return 'No verification email is active — send a new one.'
    default: return ''
  }
})

const hintText = computed(() => {
  if (props.lastResult && props.lastResult !== 'ok') return ''
  switch (props.challengeState) {
    case 'delayed': return 'Your email is on its way — it can take a moment to arrive.'
    case 'expired': return 'The code in your last email has expired. Send a new one when you’re ready.'
    default: return 'Paste or type the code from the email. The link in the email works too.'
  }
})

const sentCaption = computed(() => {
  if (!props.sentAt) return ''
  void props.now
  return `Sent ${formatAgo(props.sentAt)}`
})

// Auto-submit once six digits are present; the guard keeps a paste from firing twice.
let lastSubmitted = ''
watch(code, (value) => {
  if (value.length === 6 && value !== lastSubmitted && !props.submitting) {
    lastSubmitted = value
    emit('submit', value)
  }
})

// A fresh email invalidates whatever was typed for the previous one.
watch(() => props.sentAt, () => {
  code.value = ''
  lastSubmitted = ''
})

// A rejected code clears the boxes so the next attempt starts clean — a full
// OTP field does not overwrite on typing, and the error line already says why.
watch(() => props.lastResult, (result) => {
  if (result && result !== 'ok') {
    code.value = ''
    lastSubmitted = ''
    nextTick(() => otp.value?.focus?.())
  }
})

function startEditEmail() {
  newEmail.value = props.email
  emailError.value = ''
  editingEmail.value = true
}

function saveEmail() {
  const error = validateWorkEmail(newEmail.value)
  emailError.value = error
  if (error) return
  editingEmail.value = false
  if (newEmail.value.trim() !== props.email) emit('changeEmail', newEmail.value.trim())
}

function resend() {
  if (!canResend.value) return
  emit('resend')
  nextTick(() => otp.value?.focus?.())
}
</script>

<template>
  <div class="tl-verify">
    <p class="tl-verify__lede">
      We sent a verification link and a 6-digit code to
      <strong class="tl-verify__email">{{ email }}</strong>. Use either one.
    </p>

    <MpFormField label="6-digit code" :hint="hintText" :error="errorText">
      <v-otp-input
        ref="otp"
        v-model="code"
        length="6"
        type="number"
        :disabled="submitting"
        :loading="submitting"
        autofocus
      />
    </MpFormField>

    <div class="tl-verify__row">
      <div class="tl-verify__resend">
        <v-btn variant="text" class="text-none" prepend-icon="refresh-cw" :disabled="!canResend" @click="resend">
          Resend email
        </v-btn>
        <span v-if="sentCaption" class="tl-verify__caption">{{ sentCaption }}</span>
      </div>
      <v-btn v-if="!editingEmail" variant="text" class="text-none" @click="startEditEmail">Change email</v-btn>
    </div>

    <div v-if="editingEmail" class="tl-verify__edit">
      <v-text-field
        v-model="newEmail"
        label="Work email"
        type="email"
        autocomplete="email"
        :error-messages="emailError ? [emailError] : []"
        @keydown.enter.prevent="saveEmail"
      />
      <div class="tl-verify__edit-actions">
        <v-btn variant="text" class="text-none" @click="editingEmail = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" @click="saveEmail">Send to this address</v-btn>
      </div>
    </div>

    <p class="tl-verify__sim">
      Simulated — <button type="button" class="tl-verify__link" @click="emit('openInbox')">open the inbox</button>
      in Reviewer controls to find the code.
    </p>
  </div>
</template>

<style scoped>
.tl-verify {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-field-groupGap);
}

.tl-verify__lede {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.5;
}

.tl-verify__email {
  color: var(--text-primary);
  word-break: break-all;
}

.tl-verify__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-8);
}

.tl-verify__resend {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
}

.tl-verify__caption {
  font-size: var(--mp-fontSize-12);
  color: var(--text-secondary);
}

.tl-verify__edit {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-field-groupGap);
}

.tl-verify__edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--mp-space-8);
}

.tl-verify__sim {
  margin: 0;
  font-size: var(--mp-fontSize-12);
  color: var(--text-muted);
}

.tl-verify__link {
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
  cursor: pointer;
}
</style>
