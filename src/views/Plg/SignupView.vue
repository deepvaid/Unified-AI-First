<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MpWizardSteps from '@/components/MpWizardSteps.vue'
import { usePlgStore, type TrialSignupPayload } from '@/stores/usePlg'
import { useAccountsStore } from '@/stores/useAccounts'
import { useUserProfile } from '@/stores/useUserProfile'
import { useDaVinciOnboardingStore } from '@/stores/useDaVinciOnboarding'
import { useOnboardingStore } from '@/stores/useOnboarding'

const router = useRouter()
const plg = usePlgStore()
const accounts = useAccountsStore()
const profile = useUserProfile()
const daVinciOnboarding = useDaVinciOnboardingStore()
const setupOnboarding = useOnboardingStore()

type Stage = 'details' | 'verify' | 'provisioning' | 'success'

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'outlook.com',
  'hotmail.com', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'aol.com',
  'proton.me', 'protonmail.com', 'gmx.com', 'mail.com', 'zoho.com',
])

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const PROVISIONING_STEPS = [
  'Creating your workspace',
  'Provisioning Marketing Cloud',
  'Provisioning Commerce Cloud',
  'Provisioning Service Cloud',
  'Applying trial limits',
]

const wizardSteps = ['Your details', 'Verify email', 'Workspace ready']

const stage = ref<Stage>('details')

// ── Step 1 — Details ────────────────────────────────────────────────────
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const companyName = ref('')
const companyUrl = ref('')
const submitted = ref(false)

const emailDomain = computed(() => email.value.split('@')[1]?.toLowerCase().trim() ?? '')
const isFreeEmailDomain = computed(() => FREE_EMAIL_DOMAINS.has(emailDomain.value))
const emailFormatValid = computed(() => EMAIL_RE.test(email.value.trim()))

const firstNameValid = computed(() => firstName.value.trim().length > 0)
const lastNameValid = computed(() => lastName.value.trim().length > 0)
const emailValid = computed(() => email.value.trim().length > 0 && emailFormatValid.value && !isFreeEmailDomain.value)
const companyNameValid = computed(() => companyName.value.trim().length > 0)
const companyUrlValid = computed(() => companyUrl.value.trim().length > 0)

const formValid = computed(() =>
  firstNameValid.value && lastNameValid.value && emailValid.value
  && companyNameValid.value && companyUrlValid.value,
)

const emailErrorMessage = computed(() => {
  if (!submitted.value) return ''
  if (!email.value.trim()) return 'Work email is required'
  if (!emailFormatValid.value) return 'Enter a valid email address'
  if (isFreeEmailDomain.value) return 'Use your work email to start a trial'
  return ''
})

function submitDetails() {
  submitted.value = true
  if (!formValid.value) return
  stage.value = 'verify'
}

function useDifferentEmail() {
  stage.value = 'details'
}

// ── Step 2/3 — Verify + provisioning ───────────────────────────────────
const checklist = ref(PROVISIONING_STEPS.map(label => ({ label, done: false })))
const newAccountId = ref('')
let timers: ReturnType<typeof setTimeout>[] = []

function clearTimers() {
  timers.forEach(t => clearTimeout(t))
  timers = []
}

function startProvisioning() {
  stage.value = 'provisioning'
  checklist.value = PROVISIONING_STEPS.map(label => ({ label, done: false }))

  const payload: TrialSignupPayload = {
    firstName: firstName.value.trim(),
    lastName: lastName.value.trim(),
    email: email.value.trim(),
    companyName: companyName.value.trim(),
    companyUrl: companyUrl.value.trim(),
  }
  newAccountId.value = plg.createTrialAccount(payload)

  clearTimers()
  PROVISIONING_STEPS.forEach((_, i) => {
    timers.push(setTimeout(() => {
      checklist.value[i]!.done = true
      if (i === PROVISIONING_STEPS.length - 1) {
        timers.push(setTimeout(() => { stage.value = 'success' }, 400))
      }
    }, (i + 1) * 700))
  })
}

onUnmounted(clearTimers)

// ── Step 4 — Success ────────────────────────────────────────────────────
function enterMaropost() {
  accounts.switchTo(newAccountId.value)
  profile.setName(`${firstName.value} ${lastName.value}`)
  setupOnboarding.activateAccount(newAccountId.value, { fresh: true })
  daVinciOnboarding.reset(newAccountId.value)
  daVinciOnboarding.begin(newAccountId.value, { restart: true })
  router.push({
    name: 'DaVinciExperience',
    params: { accountId: newAccountId.value },
    query: { onboarding: 'setup' },
  })
}

function goBackToDemo() {
  router.back()
}

const wizardCurrent = computed(() => {
  if (stage.value === 'details') return 1
  if (stage.value === 'verify') return 2
  return 3
})
</script>

<template>
  <div class="plg-signup d-flex flex-column">
    <div class="d-flex align-center justify-space-between px-6 px-sm-10 py-6">
      <div>
        <div class="plg-signup__wordmark">MAROPOST</div>
        <div class="text-caption text-medium-emphasis">Free trial</div>
      </div>
      <v-btn
        variant="text"
        size="small"
        class="text-none text-medium-emphasis"
        prepend-icon="arrow-left"
        @click="goBackToDemo"
      >
        Back to demo
      </v-btn>
    </div>

    <div class="flex-grow-1 d-flex align-center justify-center px-4 pb-10">
      <div class="plg-signup__content">
        <div class="d-flex justify-center mb-6">
          <MpWizardSteps :steps="wizardSteps" :current="wizardCurrent" />
        </div>

        <v-card flat border rounded="xl" class="pa-8">
          <transition name="plg-fade" mode="out-in">
            <!-- Stage 1 — Details -->
            <div v-if="stage === 'details'" key="details">
              <div class="text-h5 font-weight-bold mb-2">Start your 14-day free trial</div>
              <div class="text-body-2 text-medium-emphasis mb-6">
                Marketing, Commerce &amp; Service Cloud — no credit card required.
              </div>

              <v-form @submit.prevent="submitDetails">
                <v-row dense>
                  <v-col cols="6">
                    <v-text-field
                      v-model="firstName"
                      label="First name"
                      variant="outlined"
                      density="comfortable"
                      autocomplete="given-name"
                      :error="submitted && !firstNameValid"
                      :error-messages="submitted && !firstNameValid ? ['First name is required'] : []"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      v-model="lastName"
                      label="Last name"
                      variant="outlined"
                      density="comfortable"
                      autocomplete="family-name"
                      :error="submitted && !lastNameValid"
                      :error-messages="submitted && !lastNameValid ? ['Last name is required'] : []"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="email"
                      label="Work email"
                      type="email"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mail"
                      autocomplete="email"
                      :error="submitted && !emailValid"
                      :error-messages="emailErrorMessage ? [emailErrorMessage] : []"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="companyName"
                      label="Company name"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="building-2"
                      autocomplete="organization"
                      :error="submitted && !companyNameValid"
                      :error-messages="submitted && !companyNameValid ? ['Company name is required'] : []"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="companyUrl"
                      label="Company URL"
                      placeholder="https://yourcompany.com"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="link"
                      :error="submitted && !companyUrlValid"
                      :error-messages="submitted && !companyUrlValid ? ['Company URL is required'] : []"
                    />
                  </v-col>
                </v-row>

                <v-btn
                  type="submit"
                  block
                  color="primary"
                  variant="flat"
                  size="large"
                  class="text-none mt-2"
                  append-icon="arrow-right"
                >
                  Start free trial
                </v-btn>
              </v-form>

              <div class="text-caption text-medium-emphasis text-center mt-4">
                By continuing you agree to the Terms of Service.
              </div>
            </div>

            <!-- Stage 2 — Verify email -->
            <div v-else-if="stage === 'verify'" key="verify" class="d-flex flex-column align-center text-center">
              <div class="plg-signup__icon-circle mb-5">
                <v-icon size="28" color="primary">mail</v-icon>
              </div>
              <div class="text-h5 font-weight-bold mb-2">Check your inbox</div>
              <div class="text-body-2 text-medium-emphasis mb-6">
                We sent a verification link to <strong class="text-high-emphasis">{{ email }}</strong>.
              </div>

              <v-btn
                block
                color="primary"
                variant="flat"
                size="large"
                class="text-none mb-3"
                prepend-icon="mouse-pointer-click"
                @click="startProvisioning"
              >
                Simulate clicking the verification link
              </v-btn>
              <v-btn variant="text" class="text-none mb-4" @click="useDifferentEmail">
                Use a different email
              </v-btn>

              <div class="text-caption text-medium-emphasis">
                Demo shortcut — in production this arrives by email.
              </div>
            </div>

            <!-- Stage 3 — Provisioning -->
            <div v-else-if="stage === 'provisioning'" key="provisioning">
              <div class="text-h5 font-weight-bold mb-1 text-center">Setting up your workspace</div>
              <div class="text-body-2 text-medium-emphasis mb-6 text-center">
                This takes just a few seconds.
              </div>

              <div class="plg-signup__checklist">
                <div v-for="(item, i) in checklist" :key="i" class="plg-signup__checklist-row">
                  <span class="plg-signup__checklist-status">
                    <v-progress-circular v-if="!item.done" indeterminate size="16" width="2" color="primary" />
                    <v-icon v-else size="18" color="success">check</v-icon>
                  </span>
                  <span :class="item.done ? 'text-high-emphasis' : 'text-medium-emphasis'">{{ item.label }}</span>
                </div>
              </div>
            </div>

            <!-- Stage 4 — Success -->
            <div v-else key="success" class="d-flex flex-column align-center text-center">
              <div class="plg-signup__icon-circle plg-signup__icon-circle--success mb-5">
                <v-icon size="28" color="success">check</v-icon>
              </div>
              <div class="text-h5 font-weight-bold mb-2">You're in, {{ firstName }}!</div>
              <div class="text-body-2 text-medium-emphasis mb-6">
                Your 14-day trial of all three clouds is ready.
              </div>

              <v-btn
                block
                color="primary"
                variant="flat"
                size="large"
                class="text-none"
                append-icon="arrow-right"
                @click="enterMaropost"
              >
                Enter Maropost
              </v-btn>
            </div>
          </transition>
        </v-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plg-signup {
  min-height: 100vh;
  width: 100%;
  background:
    radial-gradient(circle at 12% 18%, rgba(var(--v-theme-primary), 0.14), transparent 55%),
    radial-gradient(circle at 88% 82%, rgba(var(--v-theme-secondary), 0.12), transparent 55%),
    rgb(var(--v-theme-background));
}

.plg-signup__wordmark {
  font-weight: 800;
  font-size: 1.125rem;
  letter-spacing: 0.08em;
}

.plg-signup__content {
  width: 100%;
  max-width: 520px;
}

.plg-signup__icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.12);
}

.plg-signup__icon-circle--success {
  background: rgba(var(--v-theme-success), 0.12);
}

.plg-signup__checklist {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 4px;
}

.plg-signup__checklist-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.875rem;
}

.plg-signup__checklist-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  flex-shrink: 0;
}

.plg-fade-enter-active,
.plg-fade-leave-active {
  transition: opacity 0.15s ease;
}
.plg-fade-enter-from,
.plg-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .plg-fade-enter-active,
  .plg-fade-leave-active {
    transition: none;
  }
}
</style>
