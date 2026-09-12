<script setup lang="ts">
import { computed } from 'vue'
import MpFormField from '@/components/MpFormField.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import StorefrontPreview from '@/components/saleschannels/StorefrontPreview.vue'
import { createSection, defaultThemeStyles } from '@/stores/themeBuilderData'
import { STOREFRONT_ACCENTS, STOREFRONT_DEFAULT_HEADING } from '@/stores/trialLabData'

/**
 * Commerce sample task — change the hero heading and the accent colour of a
 * sample storefront and see it in the real StorefrontPreview. Sections carry
 * stable ids so the preview's keys never churn between renders.
 */
export interface CommerceDraft { heading: string; accentKey: string }

const draft = defineModel<CommerceDraft>({ required: true })

const BASE_SECTIONS = [
  createSection('header', {}, 'tl-header'),
  createSection('hero', {}, 'tl-hero'),
  createSection('featured-products', {}, 'tl-featured'),
]

const sections = computed(() => BASE_SECTIONS.map(s => (
  s.id === 'tl-hero'
    ? { ...s, settings: { ...s.settings, headline: draft.value.heading.trim() || STOREFRONT_DEFAULT_HEADING } }
    : s
)))

const accent = computed(() => STOREFRONT_ACCENTS.find(a => a.key === draft.value.accentKey) ?? STOREFRONT_ACCENTS[0]!)
const styles = computed(() => ({ ...defaultThemeStyles(), accentColor: accent.value.value, brandColor: accent.value.value }))
</script>

<template>
  <div class="tl-task">
    <div class="tl-task__editor">
      <MpFormGrid :cols="1">
        <v-text-field
          :model-value="draft.heading"
          label="Storefront heading"
          :placeholder="STOREFRONT_DEFAULT_HEADING"
          hint="The headline on your home page hero."
          @update:model-value="draft = { ...draft, heading: $event }"
        />
      </MpFormGrid>

      <MpFormField label="Accent colour" hint="Buttons, links and highlights use this colour.">
        <div class="tl-commerce__swatches" role="radiogroup" aria-label="Accent colour">
          <button
            v-for="a in STOREFRONT_ACCENTS"
            :key="a.key"
            type="button"
            role="radio"
            class="tl-commerce__swatch"
            :class="{ 'tl-commerce__swatch--on': a.key === draft.accentKey }"
            :style="{ '--swatch': a.value }"
            :aria-checked="a.key === draft.accentKey"
            :aria-label="a.label"
            @click="draft = { ...draft, accentKey: a.key }"
          >
            <v-icon v-if="a.key === draft.accentKey" size="16" class="tl-commerce__swatch-check">check</v-icon>
          </button>
        </div>
      </MpFormField>
    </div>

    <div class="tl-task__preview" aria-label="Storefront preview">
      <div class="tl-task__preview-bar">
        <span class="tl-task__preview-label">Preview</span>
        <v-chip size="x-small" variant="tonal" label>Sample store</v-chip>
      </div>
      <div class="tl-commerce__frame">
        <StorefrontPreview :sections="sections" :styles="styles" device="tablet" />
      </div>
    </div>
  </div>
</template>

<style scoped src="./trialTask.css"></style>
<style scoped>
.tl-commerce__swatches {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-space-8);
}

.tl-commerce__swatch {
  width: var(--mp-component-control-height);
  height: var(--mp-component-control-height);
  border-radius: var(--mp-radius-full);
  border: 2px solid transparent;
  background: var(--swatch);
  color: rgb(var(--v-theme-on-primary));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.tl-commerce__swatch:focus-visible {
  outline: 2px solid var(--accent-focus-ring);
  outline-offset: 2px;
}

.tl-commerce__swatch--on {
  border-color: var(--text-primary);
}

.tl-commerce__frame {
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-12);
  overflow: hidden;
  background: var(--surface-secondary);
  max-height: 560px;
  overflow-y: auto;
}
</style>
