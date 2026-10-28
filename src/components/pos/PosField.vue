<script setup lang="ts">
/**
 * A labelled register input: price, discount, note, email, buyer. The hint
 * and the error share one line under the box, so typing never shifts the sheet.
 *
 * Extra attributes (`type`, `inputmode`, `min`, `step`, `autocomplete`,
 * `placeholder`) go straight to the input.
 */
import { computed, useAttrs, type StyleValue } from 'vue'

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[]

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  id: string
  label: string
  /** Keeps the label for screen readers only, when the sheet already says it. */
  hideLabel?: boolean
  hint?: string
  error?: string
  /** Rows for a multi-line note; omit for a single-line input. */
  rows?: number
}>(), {
  hideLabel: false,
  hint: undefined,
  error: undefined,
  rows: undefined,
})

const model = defineModel<string | number | null>({ default: '' })
const attrs = useAttrs()

const messageId = computed(() => `${props.id}-msg`)
const message = computed(() => props.error || props.hint)
const describedBy = computed(() =>
  [message.value ? messageId.value : null, attrs['aria-describedby'] as string | undefined].filter(Boolean).join(' ') || undefined,
)
/** Layout attributes stay on the wrapper; everything else describes the input. */
const wrapperAttrs = computed(() => ({ class: attrs.class as ClassValue, style: attrs.style as StyleValue }))
const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})
</script>

<template>
  <div class="pos-field" v-bind="wrapperAttrs">
    <label class="pos-field__label" :class="{ 'd-sr-only': hideLabel }" :for="id">{{ label }}</label>
    <textarea
      v-if="rows"
      :id="id"
      v-model="model"
      v-bind="inputAttrs"
      class="pos-field__input pos-field__input--multiline"
      :rows="rows"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy"
    />
    <input
      v-else
      :id="id"
      v-model="model"
      v-bind="inputAttrs"
      class="pos-field__input"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy"
    >
    <div
      v-if="message"
      :id="messageId"
      class="pos-field__message"
      :class="{ 'pos-field__message--error': error }"
    >
      {{ message }}
    </div>
  </div>
</template>

<style scoped>
.pos-field {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-6);
}

.pos-field__label {
  color: var(--mp-color-light-pos-muted);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-bold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.pos-field__input {
  width: 100%;
  min-height: var(--mp-component-pos-touchTarget);
  padding: var(--mp-space-8) var(--mp-space-12);
  border: 1px solid var(--mp-color-light-pos-hairline);
  border-radius: var(--mp-component-pos-radius-control);
  outline: none;
  background: var(--mp-color-light-pos-surface);
  color: var(--mp-color-light-pos-ink);
  font-family: inherit;
  font-size: var(--mp-fontSize-15);
}

.pos-field__input::placeholder { color: var(--mp-color-light-pos-muted); }

/* Focus is the ink border plus a soft ring — visible at arm's length */
.pos-field__input:focus {
  border-color: var(--mp-color-light-pos-ink);
  box-shadow: 0 0 0 3px rgba(var(--mp-rgb-color-light-pos-ink), 0.08);
}

.pos-field__input[aria-invalid='true'] { border-color: var(--mp-color-light-pos-dangerInk); }

.pos-field__input--multiline { resize: none; }

.pos-field__message {
  color: var(--mp-color-light-pos-muted);
  font-size: var(--mp-fontSize-12);
}

.pos-field__message--error {
  color: var(--mp-color-light-pos-dangerInk);
  font-weight: var(--mp-fontWeight-semibold);
}
</style>
