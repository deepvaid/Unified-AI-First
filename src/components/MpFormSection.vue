<script setup lang="ts">
// The one in-form section heading (P6-9).
//
// "GENERAL", "EXPIRATION DATE" and their siblings were being written seven
// different ways across ~260 sites — `text-subtitle-2 font-weight-bold
// text-uppercase text-medium-emphasis mb-3` in one drawer, `text-caption
// text-medium-emphasis font-weight-bold text-uppercase mb-2` in the next — so no
// two forms agreed on the type, the case, or the space around the heading.
//
// Heading-only mode (no slot content) is a heading, not a wrapper: it sits in the
// flow between fields and states its own rhythm, so adopting it is a one-line
// replacement rather than a re-nest of the whole region. The extra air a section
// needs over the ambient field gap is `field.sectionGap - field.groupGap`,
// expressed from tokens so it stays correct if either moves.
//
// Grouped mode (default slot present) additionally wraps its content in the
// heading's accessible name: `role="group"` + `aria-labelledby`, so assistive tech
// associates the fields with the section — the fieldset/legend contract without
// fieldset's layout quirks. Use it when a section's fields can nest cleanly
// (`<MpFormSection title="…"><MpFormGrid>…</MpFormGrid></MpFormSection>`);
// heading-only mode remains correct for interleaved grids.
import { computed, useId, useSlots } from 'vue'

withDefaults(defineProps<{
  title: string
  /** One supporting line under the heading. Longer context belongs in a field hint. */
  description?: string
  /** Marks every field in the section as required — the same mark a field label uses. */
  required?: boolean
  /** Heading level, for pages that already have an h2 above the form. */
  headingLevel?: 2 | 3 | 4
}>(), {
  required: false,
  headingLevel: 3,
})

const slots = useSlots()
const grouped = computed(() => Boolean(slots.default))
const headingId = useId()
</script>

<template>
  <component
    :is="grouped ? 'section' : 'div'"
    class="mp-form-section"
    :class="{ 'mp-form-section--group': grouped }"
    :role="grouped ? 'group' : undefined"
    :aria-labelledby="grouped ? headingId : undefined"
  >
    <div class="mp-form-section__heading">
      <component :is="`h${headingLevel}`" :id="headingId" class="mp-form-section__title">
        {{ title }}<span v-if="required" class="mp-form-section__required" aria-hidden="true">*</span>
      </component>
      <p v-if="description" class="mp-form-section__description">{{ description }}</p>
    </div>
    <slot />
  </component>
</template>

<style scoped>
.mp-form-section {
  /* A heading is not a field: it contributes nothing to the grid's column flow. */
  grid-column: 1 / -1;
}

/* The section rhythm. A heading that opens a form needs no extra air above it —
   the shell's own inset already provides it. */
.mp-form-section:not(:first-child) {
  margin-block-start: calc(
    var(--mp-component-field-sectionGap) - var(--mp-component-field-groupGap)
  );
}

/* Grouped mode owns the heading→fields gap; heading-only mode leaves it to the
   host grid, exactly as before. */
.mp-form-section--group {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-field-groupGap);
}

.mp-form-section__title {
  margin: 0;
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: var(--mp-letterSpacing-eyebrow);
  text-transform: uppercase;
  color: var(--muted);
}

/* One required mark, on labels and section headings alike (P6-10). */
.mp-form-section__required {
  margin-inline-start: var(--mp-space-2);
  color: rgb(var(--v-theme-error));
}

.mp-form-section__description {
  margin: var(--mp-space-4) 0 0;
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-compact);
  color: var(--muted);
  text-transform: none;
  letter-spacing: normal;
}
</style>
