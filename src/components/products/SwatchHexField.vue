<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import MpFormField from '@/components/MpFormField.vue'
import { contrastRatio, isValidHex } from '@/utils/brandContrast'
import { NEUTRAL_SWATCH } from './swatchGuess'

// The swatch colour of one option value ("Sand"), as the product page shows it:
// a well that previews the swatch on the store's page colour and opens a hex
// picker, beside the hex typed. It copies the swatch + v-menu + v-color-picker
// markup of ChatbotBuilder and LandingBlockSettings until a shared MpColorPicker
// exists. Only a valid colour is emitted, always as lowercase #rrggbb, so the
// product never saves a broken swatch; while the text is not a colour the field
// says so and the last good colour stays.

const props = withDefaults(defineProps<{
  /** The value's colour, `#rrggbb`. */
  modelValue: string
  /** The option value the swatch is for ("Sand"). */
  label: string
  /** The store's page colour, which the swatch sits on in the preview. */
  background?: string
}>(), { background: '#ffffff' })

const emit = defineEmits<{
  'update:modelValue': [value: string]
  /** True while the text typed is not a colour, so the form can refuse to save over it. */
  'update:invalid': [invalid: boolean]
}>()

/** Below this contrast with the page, a swatch is hard to see without its outline. */
const LOW_CONTRAST = 1.5

/** "c8b89a", "#C8B89A" or "#cba" as "#c8b89a"; null when it is not a hex colour. */
function normalizeHex(text: string): string | null {
  const raw = text.trim()
  const hex = raw.startsWith('#') ? raw : `#${raw}`
  if (!isValidHex(hex)) return null
  const digits = hex.slice(1).toLowerCase()
  return `#${digits.length === 3 ? [...digits].map((d) => d + d).join('') : digits}`
}

const text = ref(props.modelValue)
watch(() => props.modelValue, (value) => {
  if (normalizeHex(text.value) !== value) text.value = value
})

const error = computed(() => {
  if (!text.value.trim()) return 'Enter a colour, like #C8B89A'
  return normalizeHex(text.value) ? undefined : 'Use a hex colour, like #C8B89A'
})
watch(() => !!error.value, (invalid) => emit('update:invalid', invalid), { immediate: true })
// A field that goes away (its value removed, or the option shown as buttons) no longer holds the form back.
onBeforeUnmount(() => emit('update:invalid', false))

const lowContrast = computed(() => {
  const ratio = contrastRatio(props.modelValue, props.background)
  return ratio !== null && ratio < LOW_CONTRAST
})
const hint = computed(() => (lowContrast.value ? 'Close to the page colour, so shoppers see it with an outline' : undefined))

function onType(value: string | null) {
  text.value = value ?? ''
  const hex = normalizeHex(text.value)
  if (hex && hex !== props.modelValue) emit('update:modelValue', hex)
}

/** Tidies what was typed once the field is left: "C8B89A" reads "#c8b89a". */
function onBlur() {
  const hex = normalizeHex(text.value)
  if (hex) text.value = hex
}

function onPick(value: unknown) {
  const hex = typeof value === 'string' ? normalizeHex(value.slice(0, 7)) : null
  if (!hex) return
  text.value = hex
  if (hex !== props.modelValue) emit('update:modelValue', hex)
}

const pickerOpen = ref(false)
const wellStyle = computed(() => ({ '--shf-page': props.background, '--shf-swatch': normalizeHex(props.modelValue) ?? 'transparent' }))
</script>

<template>
  <MpFormField :label="label">
    <div class="shf" :data-invalid="error ? '' : undefined">
      <v-menu v-model="pickerOpen" :close-on-content-click="false" location="bottom start">
        <template #activator="{ props: menu }">
          <button
            v-bind="menu"
            type="button"
            class="shf__well"
            :class="{ 'shf__well--low': lowContrast }"
            :style="wellStyle"
            :aria-label="`Pick the colour for ${label}`"
          >
            <span class="shf__dot" aria-hidden="true" />
          </button>
        </template>
        <v-card flat border rounded="lg">
          <v-color-picker
            :model-value="normalizeHex(modelValue) ?? NEUTRAL_SWATCH"
            mode="hex"
            :modes="['hex']"
            elevation="0"
            @update:model-value="onPick"
          />
        </v-card>
      </v-menu>
      <v-text-field
        :model-value="text"
        class="shf__hex"
        :aria-label="`${label} colour, as a hex value`"
        placeholder="#C8B89A"
        spellcheck="false"
        autocomplete="off"
        maxlength="7"
        :error-messages="error ? [error] : []"
        :hint="hint"
        :persistent-hint="!!hint"
        @update:model-value="onType"
        @blur="onBlur"
      />
    </div>
  </MpFormField>
</template>

<style scoped>
.shf {
  display: flex;
  align-items: flex-start;
  gap: var(--mp-space-8);
}

.shf__hex {
  flex: 1 1 auto;
  min-width: 0;
}

.shf__hex :deep(input) {
  font-family: var(--mp-fontFamily-mono);
}

/* The well shows the swatch as the product page draws it: a round dot on the store's page colour. */
.shf__well {
  flex-shrink: 0;
  width: var(--mp-component-control-height);
  height: var(--mp-component-control-height);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-default);
  border-radius: var(--mp-component-input-radius);
  background: var(--shf-page);
  cursor: pointer;
}

.shf__well:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.shf__dot {
  width: var(--mp-space-24);
  height: var(--mp-space-24);
  border-radius: var(--mp-radius-full);
  background: var(--shf-swatch);
}

/* A swatch close to the page colour gets the outline the storefront gives it. */
.shf__well--low .shf__dot {
  box-shadow: inset 0 0 0 1px var(--border-strong);
}
</style>
