<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import MpAlert from '@/components/MpAlert.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpWizardSteps from '@/components/MpWizardSteps.vue'
import { validatePassword, validateWorkEmail } from '@/stores/trialLabData'
import { useTrialRun } from './useTrialRun'
import { stepLabelsFor } from './trialLabSteps'

/**
 * Signup — work email + password only. The password never leaves this
 * component: it lives in a local ref and is cleared after the simulated
 * submit, so it cannot reach the store, the URL or the event log.
 */
const { store, variant, config, arrive, advanceFrom } = useTrialRun()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const submitted = ref(false)
const submitting = ref(false)
const existing = ref(false)

const emailError = computed(() => (submitted.value ? validateWorkEmail(email.value) : ''))
const passwordError = computed(() => (submitted.value ? validatePassword(password.value) : ''))
const steps = computed(() => stepLabelsFor(config.value))

onMounted(() => {
  store.ensureRun(variant.value)
  arrive('signup')
})

async function submit() {
  submitted.value = true
  if (emailError.value || passwordError.value) return
  submitting.value = true
  try {
    await new Promise(r => setTimeout(r, 500))
    const result = store.completeSignup(variant.value, email.value)
    if (result === 'existing') {
      existing.value = true
      return
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

    <v-card flat border rounded="lg" class="tl-stage__card">
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
        <MpFormGrid :cols="1">
          <v-text-field
            v-model="email"
            label="Work email"
            type="email"
            autocomplete="email"
            placeholder="you@company.com"
            :error-messages="emailError ? [emailError] : []"
            autofocus
          />
          <v-text-field
            v-model="password"
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
