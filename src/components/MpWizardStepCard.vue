<script setup lang="ts">
/**
 * MpWizardStepCard — the step-content card inside MpWizardShell's measure.
 *
 * One card per form step: a real heading (the step's section heading under the
 * page h1), a one-line description, a divider, then the fields. Six wizards
 * hand-rolled this with `div.text-subtitle-1` headings and no divider; this
 * card makes the preamble semantic and identical everywhere.
 *
 * Not MpFormSection — that is the 13px in-form overline for groups *within* a
 * form; this owns a card and a title-scale heading. Galleries and canvas steps
 * skip the card and render bare in the shell's measure.
 */
withDefaults(defineProps<{
  title: string
  description?: string
  /** h2 by default — the step title sits directly under the page h1. */
  headingLevel?: 2 | 3
  /** Divider between the preamble and the content (skip for dense gallery cards). */
  divider?: boolean
}>(), {
  headingLevel: 2,
  divider: true,
})
</script>

<template>
  <v-card variant="flat" border rounded="lg" class="mp-wizard-step-card">
    <div class="d-flex align-center ga-2" :class="description ? 'mb-1' : 'mb-4'">
      <component :is="`h${headingLevel}`" class="text-h6 font-weight-bold">{{ title }}</component>
      <slot name="title-append" />
    </div>
    <p v-if="description" class="text-body-2 text-medium-emphasis mb-6">{{ description }}</p>
    <v-divider v-if="divider" class="mb-6" />
    <slot />
  </v-card>
</template>

<style scoped>
.mp-wizard-step-card {
  padding: var(--mp-component-card-paddingSpacious);
}
</style>
