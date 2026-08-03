<script setup lang="ts">
import { computed, defineAsyncComponent, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpWizardSteps from '@/components/MpWizardSteps.vue'
import { usePlgStore, type TrialSignupPayload } from '@/stores/usePlg'
import { useAccountsStore } from '@/stores/useAccounts'
import { useUserProfile } from '@/stores/useUserProfile'
import { useDaVinciOnboardingStore } from '@/stores/useDaVinciOnboarding'

const router = useRouter()
const route = useRoute()
const plg = usePlgStore()

// Same three.js particle orb the landing/login pages mount — loaded lazily so
// the signup chunk stays light. Has its own CSS fallback while loading.
const DvOrbCanvas = defineAsyncComponent(() => import('@/components/copilot/voice/DvOrbCanvas.vue'))
const accounts = useAccountsStore()
const profile = useUserProfile()
const daVinciOnboarding = useDaVinciOnboardingStore()

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
// Prefilled when arriving from the landing login page (/main-landing/login.html#signup)
const email = ref(typeof route.query.email === 'string' ? route.query.email : '')
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
  daVinciOnboarding.reset(newAccountId.value)
  daVinciOnboarding.begin(newAccountId.value, { restart: true, freshAccount: true })
  router.push({
    name: 'DaVinciExperience',
    params: { accountId: newAccountId.value },
    query: { onboarding: 'campaign' },
  })
}

const wizardCurrent = computed(() => {
  if (stage.value === 'details') return 1
  if (stage.value === 'verify') return 2
  return 3
})
</script>

<template>
  <div class="plg-signup">
    <a class="plg-signup__wordmark" href="/main-landing/">MAROPOST</a>
    <a class="plg-signup__back" href="/main-landing/">← Back to site</a>

    <div class="plg-signup__backdrop" aria-hidden="true">
      <DvOrbCanvas state="idle" />
    </div>

    <div class="plg-signup__center">
      <div class="plg-signup__card">
        <div class="d-flex justify-center mb-8">
          <MpWizardSteps :steps="wizardSteps" :current="wizardCurrent" />
        </div>

        <transition name="plg-fade" mode="out-in">
            <!-- Stage 1 — Details -->
            <div v-if="stage === 'details'" key="details">
              <h1 class="plg-signup__title">Create your account</h1>
              <div class="plg-signup__sub">Start your free trial — no card required.</div>

              <v-form @submit.prevent="submitDetails">
                <v-row dense>
                  <v-col cols="6">
                    <v-text-field
                      v-model="firstName"
                      placeholder="First name"
                      aria-label="First name"
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
                      placeholder="Last name"
                      aria-label="Last name"
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
                      placeholder="Work email"
                      aria-label="Work email"
                      type="email"
                      variant="outlined"
                      density="comfortable"
                      autocomplete="email"
                      :error="submitted && !emailValid"
                      :error-messages="emailErrorMessage ? [emailErrorMessage] : []"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="companyName"
                      placeholder="Company name"
                      aria-label="Company name"
                      variant="outlined"
                      density="comfortable"
                      autocomplete="organization"
                      :error="submitted && !companyNameValid"
                      :error-messages="submitted && !companyNameValid ? ['Company name is required'] : []"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="companyUrl"
                      placeholder="Company URL — https://yourcompany.com"
                      aria-label="Company URL"
                      variant="outlined"
                      density="comfortable"
                      :error="submitted && !companyUrlValid"
                      :error-messages="submitted && !companyUrlValid ? ['Company URL is required'] : []"
                    />
                  </v-col>
                </v-row>

                <v-btn
                  type="submit"
                  block
                  variant="flat"
                  size="large"
                  class="text-none mt-1 plg-signup__primary"
                >
                  Create account
                </v-btn>
              </v-form>

              <div class="plg-signup__switch">
                Already have an account? <a href="/main-landing/login.html">Log in</a>
              </div>
            </div>

            <!-- Stage 2 — Verify email -->
            <div v-else-if="stage === 'verify'" key="verify" class="d-flex flex-column align-center text-center">
              <div class="plg-signup__icon-circle mb-5">
                <v-icon size="28">mail</v-icon>
              </div>
              <h1 class="plg-signup__title">Check your inbox</h1>
              <div class="plg-signup__sub">
                We sent a verification link to <strong class="text-high-emphasis">{{ email }}</strong>.
              </div>

              <v-btn
                block
                variant="flat"
                size="large"
                class="text-none mb-3 plg-signup__primary"
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
            <div v-else-if="stage === 'provisioning'" key="provisioning" class="text-center">
              <h1 class="plg-signup__title">Setting up your workspace</h1>
              <div class="plg-signup__sub">This takes just a few seconds.</div>

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
              <h1 class="plg-signup__title">You're in, {{ firstName }}!</h1>
              <div class="plg-signup__sub">
                Your 14-day trial of all three clouds is ready.
              </div>

              <v-btn
                block
                variant="flat"
                size="large"
                class="text-none plg-signup__primary"
                @click="enterMaropost"
              >
                Enter Maropost
              </v-btn>
            </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Visual language mirrors public/main-landing/login.html — the page users
   arrive from — so landing → signup → onboarding reads as one surface. */
.plg-signup {
  position: fixed;
  inset: 0;
  overflow-y: auto;
  background: var(--plg-bg);
  --plg-bg: #ffffff;
  --plg-ink: #1c1f24;
  --plg-ink-contrast: #ffffff;
  --plg-ink-hover: #000000;
  --plg-dim: #8b929c;
  --plg-line: rgba(24, 27, 33, 0.14);
  --plg-field: #fcfcfd;
  --plg-accent: #1877f2;
}

.v-theme--dark .plg-signup {
  --plg-bg: rgb(var(--v-theme-background));
  --plg-ink: #eef1f5;
  --plg-ink-contrast: #14161a;
  --plg-ink-hover: #ffffff;
  --plg-line: rgba(255, 255, 255, 0.18);
  --plg-field: rgba(255, 255, 255, 0.05);
}

/* Fixed chrome — wordmark top-left, back link top-right, as on login.html */
.plg-signup__wordmark {
  position: fixed;
  top: 27px;
  left: clamp(22px, 4vw, 48px);
  z-index: 6;
  font-weight: 800;
  font-size: 22px;
  line-height: 1;
  letter-spacing: 0.01em;
  color: var(--plg-ink);
  text-decoration: none;
}

.plg-signup__back {
  position: fixed;
  top: 30px;
  right: clamp(22px, 4vw, 48px);
  z-index: 6;
  color: var(--plg-dim);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.18s;
}
.plg-signup__back:hover {
  color: var(--plg-ink);
}

/* Orb backdrop — same engine the landing/login pages mount */
.plg-signup__backdrop {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.plg-signup__center {
  position: relative;
  z-index: 1;
  min-height: 100%;
  display: grid;
  place-items: center;
  padding: 88px 24px 48px;
}

.plg-signup__card {
  width: min(420px, 90vw);
  display: flex;
  flex-direction: column;
}

.plg-signup__title {
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin-bottom: 6px;
}

.plg-signup__sub {
  font-size: 14px;
  color: var(--plg-dim);
  margin-bottom: 18px;
}

/* Fields — hairline border, 7px radius, quiet fill, accent focus ring */
.plg-signup :deep(.v-field) {
  border-radius: 7px;
  background: var(--plg-field);
  font-size: 15px;
}
.plg-signup :deep(.v-field__outline) {
  --v-field-border-opacity: 1;
  color: var(--plg-line);
}
.plg-signup :deep(.v-field--focused) {
  box-shadow: 0 0 0 3px rgba(24, 118, 242, 0.14);
}
.plg-signup :deep(.v-field--focused .v-field__outline) {
  color: var(--plg-accent);
}
.plg-signup :deep(.v-field--error .v-field__outline) {
  color: rgb(var(--v-theme-error));
}
.plg-signup :deep(.v-field input::placeholder) {
  color: var(--plg-dim);
  opacity: 1;
}

/* Primary CTA — near-black ink, matching login.html's .primary */
.plg-signup__primary {
  background: var(--plg-ink) !important;
  color: var(--plg-ink-contrast) !important;
  /* !important: the global button skin pill-rounds v-btn */
  border-radius: 7px !important;
  font-weight: 600;
  letter-spacing: 0;
}
.plg-signup__primary:hover {
  background: var(--plg-ink-hover) !important;
}

.plg-signup__switch {
  text-align: center;
  margin-top: 20px;
  font-size: 13.5px;
  color: var(--plg-dim);
}
.plg-signup__switch a {
  color: var(--plg-accent);
  text-decoration: none;
  font-weight: 600;
}
.plg-signup__switch a:hover {
  text-decoration: underline;
}

/* Wizard steps — quieted to sit directly on the orb */
.plg-signup :deep(.mp-wizard-step) {
  color: var(--plg-dim);
}
.plg-signup :deep(.mp-wizard-step--active) {
  color: var(--plg-ink);
}
.plg-signup :deep(.mp-wizard-step--active .mp-wizard-step__num) {
  background: var(--plg-ink);
  border-color: var(--plg-ink);
  color: var(--plg-ink-contrast);
}
.plg-signup :deep(.mp-wizard-step--done .mp-wizard-step__num) {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: var(--plg-ink);
}

.plg-signup__icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: var(--plg-ink);
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
