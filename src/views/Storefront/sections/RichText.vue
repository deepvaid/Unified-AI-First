<script setup lang="ts">
import { computed } from 'vue'
import type { ThemeSection } from '@/storefront/themeSections'
import { text } from './sectionSettings'

// A heading and a paragraph for the store's story: the `rich-text` section,
// on a reading measure, left-aligned or centred.

const props = defineProps<{ section: ThemeSection }>()

const heading = computed(() => text(props.section.settings, 'heading'))
const body = computed(() => text(props.section.settings, 'body'))
const centered = computed(() => text(props.section.settings, 'alignment') === 'Center')
</script>

<template>
  <section v-if="heading || body" class="sfs sfr" :class="{ 'sfr--center': centered }">
    <h2 v-if="heading" class="sfs__title">{{ heading }}</h2>
    <p v-if="body" class="sfr__body">{{ body }}</p>
  </section>
</template>

<style scoped src="./sections.css"></style>
<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sfr {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 820px;
}

.sfr--center {
  align-items: center;
  text-align: center;
}

.sfr__body {
  margin: 0;
  font-size: 18px;
  line-height: 1.65;
}
</style>
