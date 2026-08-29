<script setup lang="ts">
import { useId } from 'vue'

// Label, hint and error for a control that is NOT a Vuetify input (P6-10).
//
// Read this before reaching for it: a plain `v-text-field` / `v-select` /
// `v-textarea` / `v-autocomplete` / `v-combobox` must NOT be wrapped. Those own
// their own label, hint, error and aria wiring via the `label` prop, which the
// global baseline renders as a static top label (settings-form.scss) — visually
// identical to this wrapper's label, both resolve the shared `text.label` spec.
// The locked architecture decision stands: polish Vuetify's primitives rather
// than wrap them.
//
// This exists for the composite controls that have no label of their own: a row of
// preset chips, a grid of image tiles, a radio or checkbox group. Those were each
// hand-rolling a `<div class="text-caption ...">` above the control, at four
// different type sizes and with no programmatic association at all.
//
// The hint/error line renders only when there is something to say. It never
// reserves empty height — that reservation is what produced the large, uneven
// vertical gaps this phase set out to remove.

const props = withDefaults(defineProps<{
  label: string
  /**
   * Adds the required mark, and says "required" in the group's accessible name.
   * `aria-required` is deliberately NOT set: ARIA does not allow it on
   * `role="group"`, and setting it there is a WCAG 4.1.2 failure. Required-ness
   * on the control itself stays the control's own business.
   */
  required?: boolean
  /** Supporting text under the control. */
  hint?: string
  /** Replaces the hint, in the error colour, and marks the group invalid. */
  error?: string
}>(), { required: false })

defineSlots<{
  /**
   * The composite control. The slot exposes the ids so a control that takes aria
   * attributes directly (`v-radio-group`, `v-chip-group`) can point at them
   * instead of relying on the wrapper's `role="group"`.
   */
  default(props: { labelId: string; descriptionId: string | undefined }): unknown
}>()

const labelId = useId()
const rawDescriptionId = useId()
// Only claim a description when one is rendered: aria-describedby pointing at a
// missing node is worse than no aria-describedby.
const describedBy = () => (props.error || props.hint ? rawDescriptionId : undefined)
</script>

<template>
  <div
    class="mp-form-field"
    :class="{ 'mp-form-field--error': !!error }"
    role="group"
    :aria-labelledby="labelId"
    :aria-describedby="describedBy()"
    :aria-invalid="!!error || undefined"
  >
    <span :id="labelId" class="mp-form-field__label">
      {{ label }}<span v-if="required" class="mp-form-field__required" aria-hidden="true">*</span>
      <span v-if="required" class="d-sr-only"> (required)</span>
    </span>

    <slot :label-id="labelId" :description-id="describedBy()" />

    <p v-if="error || hint" :id="rawDescriptionId" class="mp-form-field__description">
      {{ error || hint }}
    </p>
  </div>
</template>

<style scoped>
/* Zero external margin: the form container owns the space between fields. */
.mp-form-field {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-field-labelGap);
  margin: 0;
  min-width: 0;
}

/* The one label spec (text.label + field.labelHeight) — the same values the
   global baseline gives a field's own top label, so a wrapped chip group and a
   plain text field are labelled pixel-identically. */
.mp-form-field__label {
  font-size: var(--mp-text-label-fontSize);
  font-weight: var(--mp-text-label-fontWeight);
  line-height: var(--mp-component-field-labelHeight);
  color: var(--text-secondary);
}

.mp-form-field__required {
  margin-inline-start: var(--mp-space-2);
  color: rgb(var(--v-theme-error));
}

/* `hintGap` rather than `labelGap`: a hint sits closer to its control than a label
   does, which is the same relationship a Vuetify field's own details row has. */
.mp-form-field__description {
  margin: calc(var(--mp-component-field-hintGap) - var(--mp-component-field-labelGap)) 0 0;
  font-size: var(--mp-fontSize-12);
  line-height: var(--mp-lineHeight-compact);
  color: var(--muted);
}

.mp-form-field--error .mp-form-field__description {
  color: rgb(var(--v-theme-error));
}

/* Preset chips are a control, so they sit on the control ramp rather than
   inheriting VChipGroup's own 4px/8px margins, which fight the token rhythm. */
.mp-form-field :deep(.v-chip-group) {
  padding: 0;
  gap: var(--mp-component-dialog-footerGap);
}

.mp-form-field :deep(.v-chip-group .v-chip) {
  margin: 0;
}
</style>
