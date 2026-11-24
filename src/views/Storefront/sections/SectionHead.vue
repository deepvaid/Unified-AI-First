<script setup lang="ts">
import { computed } from 'vue'
import { accentParts } from '@/storefront/themeSections'

// A section's head on the sections drawing: its title (an h2), with an optional line
// above it in the accent colour (the eyebrow, "Recommendations"), a line under it (the
// subtitle) and words of it in the accent colour. Anything beside the title ("View
// all", a carousel's arrows) is the default slot. A head with no eyebrow or subtitle
// is the title alone, as the sections always drew it.

const props = withDefaults(defineProps<{
  title?: string
  /** Id for the h2, so the section can be labelled by it. */
  titleId?: string
  eyebrow?: string
  subtitle?: string
  /** Words of the title drawn in the accent colour. */
  accentWords?: string
  /** 'Center' stacks the head on the page's axis; the head sits on the left otherwise. */
  alignment?: string
}>(), { title: '', titleId: undefined, eyebrow: '', subtitle: '', accentWords: '', alignment: '' })

const parts = computed(() => accentParts(props.title, props.accentWords))
const stacked = computed(() => Boolean(props.eyebrow || props.subtitle))
</script>

<template>
  <div class="sfs__head" :class="{ 'sfs__head--center': alignment === 'Center', 'sfs__head--stacked': stacked }">
    <div v-if="stacked" class="sfs__heading">
      <p v-if="eyebrow" class="sfs__eyebrow">{{ eyebrow }}</p>
      <h2 v-if="title" :id="titleId" class="sfs__title">
        <template v-for="(part, index) in parts" :key="index"><span v-if="part.accent" class="sfs__accent">{{ part.text }}</span><template v-else>{{ part.text }}</template></template>
      </h2>
      <p v-if="subtitle" class="sfs__subtitle">{{ subtitle }}</p>
    </div>
    <h2 v-else-if="title" :id="titleId" class="sfs__title">
      <template v-for="(part, index) in parts" :key="index"><span v-if="part.accent" class="sfs__accent">{{ part.text }}</span><template v-else>{{ part.text }}</template></template>
    </h2>
    <slot />
  </div>
</template>

<style scoped src="./sections.css"></style>
