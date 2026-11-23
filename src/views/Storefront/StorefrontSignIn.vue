<script setup lang="ts">
import { computed, inject, nextTick, ref } from 'vue'
import { isEmail } from '@/maropay/onboarding'
import { useStorefrontShopperStore } from '@/stores/useStorefrontShopper'
import { STOREFRONT } from './storefrontContext'

// The shopper's sign-in, on the account page and on an order's page: an email, then a
// code, and any six digits are accepted (mocked). Signing in is remembered for the
// browser tab (useStorefrontShopper); a checkout signs its shopper in on its own.

withDefaults(defineProps<{
  /** The page's heading. */
  title?: string
  /** What the email step says first. */
  lead?: string
}>(), {
  title: 'Your account',
  lead: 'Enter the email you ordered with. We’ll send you a 6-digit code to sign in, so there is no password to remember.',
})

const emit = defineEmits<{ 'signed-in': [email: string] }>()

const storefront = inject(STOREFRONT)!
const shopper = useStorefrontShopperStore()

const step = ref<'email' | 'code'>('email')
const typedEmail = ref('')
const code = ref('')
const tried = ref(false)
const emailError = computed(() => (tried.value && !isEmail(typedEmail.value) ? 'Enter an email address like name@example.com.' : null))
const codeError = computed(() => (tried.value && !/^\d{6}$/.test(code.value.trim()) ? 'Enter the 6-digit code.' : null))
const codeField = ref<HTMLInputElement | null>(null)
const emailField = ref<HTMLInputElement | null>(null)

async function sendCode(): Promise<void> {
  tried.value = true
  if (emailError.value) return void emailField.value?.focus()
  tried.value = false
  step.value = 'code'
  await nextTick()
  codeField.value?.focus()
}

function signIn(): void {
  tried.value = true
  if (codeError.value) return void codeField.value?.focus()
  shopper.signIn(storefront.channel.value.id, typedEmail.value)
  const email = typedEmail.value.trim().toLowerCase()
  resetSignIn()
  emit('signed-in', email)
}

function resetSignIn(): void {
  step.value = 'email'
  code.value = ''
  tried.value = false
}

/** Puts the keyboard on the field the form is asking for, for a page that just showed it. */
defineExpose({ focus: () => (step.value === 'email' ? emailField.value : codeField.value)?.focus() })
</script>

<template>
  <section class="sf-signin" aria-labelledby="sf-acct-title">
    <h1 id="sf-acct-title" class="sf-page-title">{{ title }}</h1>

    <form v-if="step === 'email'" class="sf-signin__form" novalidate @submit.prevent="sendCode">
      <p class="sf-muted">{{ lead }}</p>
      <div class="sf-field">
        <label for="sf-acct-email">Email</label>
        <input
          id="sf-acct-email"
          ref="emailField"
          v-model="typedEmail"
          class="sf-input"
          type="email"
          autocomplete="email"
          :aria-invalid="!!emailError"
          :aria-describedby="emailError ? 'sf-acct-email-err' : undefined"
        >
        <span v-if="emailError" id="sf-acct-email-err" class="sf-field__error">{{ emailError }}</span>
      </div>
      <button type="submit" class="sf-button sf-button--block">Email me a code</button>
    </form>

    <form v-else class="sf-signin__form" novalidate @submit.prevent="signIn">
      <p class="sf-muted">
        We sent a 6-digit code to <strong>{{ typedEmail.trim() }}</strong>.
        {{ storefront.demo.value ? 'This is a demo store, so any 6 digits work.' : 'In this prototype any 6 digits work.' }}
      </p>
      <div class="sf-field">
        <label for="sf-acct-code">Code</label>
        <input
          id="sf-acct-code"
          ref="codeField"
          v-model="code"
          class="sf-input"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="6"
          :aria-invalid="!!codeError"
          :aria-describedby="codeError ? 'sf-acct-code-err' : undefined"
        >
        <span v-if="codeError" id="sf-acct-code-err" class="sf-field__error">{{ codeError }}</span>
      </div>
      <button type="submit" class="sf-button sf-button--block">Sign in</button>
      <button type="button" class="sf-signin__link" @click="resetSignIn">Use another email</button>
    </form>
  </section>
</template>

<style scoped src="./storefront-controls.css"></style>
<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sf-signin {
  max-width: 420px;
  margin: 0 auto;
}

/* A theme on the sections drawing sets its headings' weight and case (a serif at its
   own weight); every other theme keeps the bold title it always had. */
.sf-page-title {
  font-weight: var(--sf-heading-weight, 700);
  text-transform: var(--sf-heading-case, none);
}

.sf-signin__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
}

.sf-signin__form p {
  margin: 0;
}

.sf-signin__link {
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.sf-signin__link:focus-visible {
  outline: 2px solid var(--sf-accent, #2563eb);
  outline-offset: 2px;
}
</style>
