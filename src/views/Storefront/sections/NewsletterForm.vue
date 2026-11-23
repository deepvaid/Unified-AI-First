<script setup lang="ts">
import { computed, inject, nextTick, ref, useId } from 'vue'
import StorefrontAnchor from '../StorefrontAnchor.vue'
import { STOREFRONT } from '../storefrontContext'

// The store's newsletter sign-up on the sections drawing: an email field, the
// consent box and a button, in the footer and in a home page's newsletter section.
// The button is never disabled: what is missing is said under the field it belongs
// to, and focus goes there. Nothing is sent anywhere: the form gives way to the
// store's thank-you line, which takes focus so a screen reader reads it.

const props = withDefaults(defineProps<{
  /** The button's label; the store's own when absent. */
  buttonLabel?: string
  /** Wider layout: the field and the button side by side. */
  inline?: boolean
}>(), {
  buttonLabel: '',
  inline: false,
})

const storefront = inject(STOREFRONT)!
const newsletter = computed(() => storefront.chrome.value.newsletter)
const id = useId()

const email = ref('')
const consent = ref(false)
const busy = ref(false)
const done = ref(false)
const emailError = ref('')
const consentError = ref('')
const emailInput = ref<HTMLInputElement | null>(null)
const consentInput = ref<HTMLInputElement | null>(null)
const doneLine = ref<HTMLElement | null>(null)

const label = computed(() => props.buttonLabel || newsletter.value?.button || 'Sign up')

async function submit(): Promise<void> {
  if (busy.value) return
  emailError.value = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) ? '' : 'Enter an email address, like name@example.com.'
  consentError.value = newsletter.value?.consent.length && !consent.value ? 'Tick the box to agree before you sign up.' : ''
  if (emailError.value || consentError.value) {
    await nextTick()
    ;(emailError.value ? emailInput.value : consentInput.value)?.focus()
    return
  }
  busy.value = true
  window.setTimeout(async () => {
    busy.value = false
    done.value = true
    email.value = ''
    consent.value = false
    await nextTick()
    doneLine.value?.focus()
  }, 600)
}
</script>

<template>
  <form v-if="newsletter" class="sfn" :class="{ 'sfn--inline': inline }" novalidate @submit.prevent="submit">
    <p v-if="done" ref="doneLine" class="sfn__done" tabindex="-1">
      <v-icon size="20" aria-hidden="true">circle-check</v-icon>
      {{ newsletter.success || 'Thanks for signing up.' }}
    </p>
    <template v-else>
      <div class="sfn__row">
        <div class="sfn__field">
          <label :for="`${id}-email`" class="sfn__label">{{ newsletter.placeholder }}</label>
          <input
            :id="`${id}-email`"
            ref="emailInput"
            v-model="email"
            type="email"
            autocomplete="email"
            class="sfn__input"
            :placeholder="newsletter.placeholder"
            :aria-invalid="emailError ? 'true' : undefined"
            :aria-describedby="emailError ? `${id}-email-error` : undefined"
            @input="emailError = ''"
          >
          <p v-if="emailError" :id="`${id}-email-error`" class="sfn__error">{{ emailError }}</p>
        </div>
        <button type="submit" class="sf-button sfn__button" :aria-busy="busy ? 'true' : undefined">
          {{ busy ? newsletter.busy : label }}
        </button>
      </div>
      <div v-if="newsletter.consent.length">
        <label class="sfn__consent">
          <input
            ref="consentInput"
            v-model="consent"
            type="checkbox"
            :aria-invalid="consentError ? 'true' : undefined"
            :aria-describedby="consentError ? `${id}-consent-error` : undefined"
            @change="consentError = ''"
          >
          <span>
            <template v-for="(part, index) in newsletter.consent" :key="index">
              <template v-if="typeof part === 'string'">{{ part }}</template>
              <StorefrontAnchor v-else :href="part.href">{{ part.label }}</StorefrontAnchor>
            </template>
          </span>
        </label>
        <p v-if="consentError" :id="`${id}-consent-error`" class="sfn__error">{{ consentError }}</p>
      </div>
    </template>
  </form>
</template>

<style scoped src="../storefront-controls.css"></style>
<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sfn {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  max-width: 440px;
}

.sfn--inline {
  max-width: 520px;
}

.sfn__row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sfn--inline .sfn__row {
  flex-direction: row;
  align-items: flex-start;
}

.sfn__field {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

/* The placeholder names the field for sighted shoppers; the label is there for everyone else. */
.sfn__label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.sfn__input {
  box-sizing: border-box;
  width: 100%;
  height: 50px;
  padding: 0 16px;
  border: 1px solid color-mix(in srgb, currentColor 45%, transparent);
  border-radius: var(--sf-radius, 4px);
  background: var(--sf-bg, #ffffff);
  color: var(--sf-text, #121011);
  font: inherit;
  font-size: 15px;
}

.sfn__input::placeholder {
  color: var(--sf-muted, #5f5f5f);
}

.sfn__input:focus-visible {
  outline: 2px solid var(--sf-accent, #2563eb);
  outline-offset: 2px;
}

.sfn__input[aria-invalid='true'] {
  border-color: var(--sf-error, #b3261e);
}

.sfn__button {
  flex-shrink: 0;
}

.sfn__consent {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  line-height: 20px;
  cursor: pointer;
}

.sfn__consent input {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin: 1px 0 0;
  accent-color: var(--sf-text, #121011);
}

.sfn__consent input:focus-visible {
  outline: 2px solid var(--sf-accent, #2563eb);
  outline-offset: 2px;
}

.sfn__consent a {
  color: inherit;
  text-decoration: underline;
}

.sfn__error {
  margin: 6px 0 0;
  color: var(--sf-error, #b3261e);
  font-size: 13px;
  line-height: 18px;
}

.sfn__done {
  outline: none;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 15px;
  line-height: 22px;
}

@media (max-width: 600px) {
  .sfn--inline .sfn__row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
