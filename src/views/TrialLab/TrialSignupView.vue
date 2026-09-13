<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import MpAlert from '@/components/MpAlert.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpWizardSteps from '@/components/MpWizardSteps.vue'
import { validatePassword, validateWorkEmail } from '@/stores/trialLabData'
import { useTrialRun } from './useTrialRun'
import { stepLabelsFor } from './trialLabSteps'

/**
 * Signup. Minimal (A–D): work email + password only. Classic (E, the control):
 * the conventional one-page form — first/last name, work email, company,
 * website, password — matching today's public baseline. The password never
 * leaves this component: it lives in a local ref and is cleared after the
 * simulated submit, so it cannot reach the store, the URL or the event log.
 */
const { store, variant, config, workspace, arrive, advanceFrom } = useTrialRun()

const classic = computed(() => config.value.signupForm === 'classic')
const firstName = ref('')
const lastName = ref('')
const company = ref('')
const website = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const submitted = ref(false)
const submitting = ref(false)
const existing = ref(false)

const emailError = computed(() => (submitted.value ? validateWorkEmail(email.value) : ''))
const passwordError = computed(() => (submitted.value ? validatePassword(password.value) : ''))
const firstNameError = computed(() => (submitted.value && classic.value && !firstName.value.trim() ? 'First name is required' : ''))
const lastNameError = computed(() => (submitted.value && classic.value && !lastName.value.trim() ? 'Last name is required' : ''))
const companyError = computed(() => (submitted.value && classic.value && !company.value.trim() ? 'Company name is required' : ''))
const steps = computed(() => stepLabelsFor(config.value))

onMounted(() => {
  store.ensureRun(variant.value)
  arrive('signup')
})

async function submit() {
  submitted.value = true
  if (emailError.value || passwordError.value || firstNameError.value || lastNameError.value || companyError.value) return
  submitting.value = true
  try {
    await new Promise(r => setTimeout(r, 500))
    const result = store.completeSignup(variant.value, email.value)
    if (result === 'existing') {
      existing.value = true
      return
    }
    if (classic.value) {
      // The classic form collects these up front, so they are real supplied values, not fallbacks.
      store.setPersonName(variant.value, `${firstName.value.trim()} ${lastName.value.trim()}`)
      if (workspace.value) store.renameWorkspace(variant.value, workspace.value.id, company.value)
    }
    await advanceFrom('signup', true)
  } finally {
    password.value = ''
    submitting.value = false
  }
}

function resumeExisting() {
  // Existing-account guidance: resume rather than create a second workspace.
  store.setScenario(variant.value, 'existingAccount', false)
  existing.value = false
}
</script>

<template>
  <div class="tl-stage">
    <MpWizardSteps :steps="steps" :current="1" class="tl-stage__steps" />

    <v-card flat border rounded="lg" class="tl-stage__card" :class="{ 'tl-stage__card--wide': classic }">
      <h1 class="tl-stage__title">Start your free trial</h1>
      <p class="tl-stage__lede">14 days · Marketing, Commerce and Service Cloud · no credit card.</p>

      <MpAlert v-if="existing" tone="info" title="An account already exists for this email" class="mb-4">
        Sign in to pick up where you left off — we won’t create a second workspace.
        <template #actions>
          <v-btn size="small" variant="text" class="text-none" @click="resumeExisting">Sign in</v-btn>
          <v-btn size="small" variant="text" class="text-none" @click="resumeExisting">Resume trial</v-btn>
        </template>
      </MpAlert>

      <form novalidate @submit.prevent="submit">
        <MpFormGrid :cols="classic ? 2 : 1">
          <template v-if="classic">
            <v-text-field
              v-model="firstName"
              label="First name *"
              autocomplete="given-name"
              :error-messages="firstNameError ? [firstNameError] : []"
              autofocus
            />
            <v-text-field
              v-model="lastName"
              label="Last name *"
              autocomplete="family-name"
              :error-messages="lastNameError ? [lastNameError] : []"
            />
            <v-text-field
              v-model="company"
              label="Company name *"
              autocomplete="organization"
              :error-messages="companyError ? [companyError] : []"
            />
            <v-text-field
              v-model="website"
              label="Website"
              type="url"
              autocomplete="url"
              placeholder="https://"
            />
          </template>
          <v-text-field
            v-model="email"
            :class="{ 'mp-form-grid__full': classic }"
            label="Work email"
            type="email"
            autocomplete="email"
            placeholder="you@company.com"
            :error-messages="emailError ? [emailError] : []"
            :autofocus="!classic"
          />
          <v-text-field
            v-model="password"
            :class="{ 'mp-form-grid__full': classic }"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            :hint="passwordError ? undefined : 'At least 8 characters.'"
            :error-messages="passwordError ? [passwordError] : []"
            :append-inner-icon="showPassword ? 'eye-off' : 'eye'"
            @click:append-inner="showPassword = !showPassword"
          />
        </MpFormGrid>

        <v-btn
          type="submit"
          color="primary"
          variant="flat"
          size="large"
          block
          class="text-none mt-6"
          :loading="submitting"
        >
          Create account
        </v-btn>
      </form>

      <p class="tl-stage__fine">
        Next: we’ll send a verification email. You can change the address later.
      </p>
      <p class="tl-stage__switch">Already have an account? <a href="#" @click.prevent>Sign in</a></p>
    </v-card>
  </div>
</template>

<style scoped src="./trialStage.css"></style>
<style scoped>
/* The classic control form is two columns wide; the minimal form keeps the narrow measure. */
.tl-stage:has(.tl-stage__card--wide) {
  max-width: 680px;
}
</style>
