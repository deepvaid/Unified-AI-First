<script setup lang="ts">
import type { BaseFont, LandingPageStyle } from '@/stores/useLandingPages'

const props = defineProps<{
  style: LandingPageStyle
}>()

const emit = defineEmits<{
  update: [patch: Partial<LandingPageStyle>]
}>()

const FONTS: { value: BaseFont; label: string }[] = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Mono', label: 'Monospace' },
]

function set<K extends keyof LandingPageStyle>(key: K, value: LandingPageStyle[K]) {
  emit('update', { [key]: value } as Partial<LandingPageStyle>)
}
</script>

<template>
  <div>
    <div class="text-subtitle-2 font-weight-bold mb-1">Page style</div>
    <div class="text-caption text-medium-emphasis mb-4">Applies across every block on this page.</div>

    <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mb-2">Background</div>
    <div class="d-flex align-center ga-2 mb-4">
      <v-menu :close-on-content-click="false" location="start">
        <template #activator="{ props: menuProps }">
          <button v-bind="menuProps" type="button" class="lp-swatch" :style="{ background: props.style.backgroundColor }" aria-label="Background color" />
        </template>
        <v-color-picker :model-value="props.style.backgroundColor" mode="hex" :modes="['hex']" @update:model-value="v => set('backgroundColor', v)" />
      </v-menu>
      <span class="text-caption font-weight-medium">{{ props.style.backgroundColor }}</span>
    </div>

    <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mb-2">Content width</div>
    <v-slider
      :model-value="props.style.contentWidth"
      :min="480"
      :max="960"
      :step="20"
      thumb-label
      color="primary"
      class="mb-4"
      hide-details
      @update:model-value="v => set('contentWidth', v)"
    >
      <template #append>
        <span class="text-caption text-medium-emphasis" style="width: 44px;">{{ props.style.contentWidth }}px</span>
      </template>
    </v-slider>

    <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mb-2">Base font</div>
    <v-select
      :model-value="props.style.baseFont"
      :items="FONTS"
      item-title="label"
      item-value="value"
      variant="outlined"
      density="comfortable"
      rounded="lg"
      class="mb-4"
      hide-details
      @update:model-value="v => set('baseFont', v)"
    />

    <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mb-2">Accent / button color</div>
    <div class="d-flex align-center ga-2 mb-4">
      <v-menu :close-on-content-click="false" location="start">
        <template #activator="{ props: menuProps }">
          <button v-bind="menuProps" type="button" class="lp-swatch" :style="{ background: props.style.accentColor }" aria-label="Accent color" />
        </template>
        <v-color-picker :model-value="props.style.accentColor" mode="hex" :modes="['hex']" @update:model-value="v => set('accentColor', v)" />
      </v-menu>
      <span class="text-caption font-weight-medium">{{ props.style.accentColor }}</span>
    </div>

    <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mb-2">Button radius</div>
    <v-slider
      :model-value="props.style.buttonRadius"
      :min="0"
      :max="28"
      :step="2"
      thumb-label
      color="primary"
      hide-details
      @update:model-value="v => set('buttonRadius', v)"
    >
      <template #append>
        <span class="text-caption text-medium-emphasis" style="width: 36px;">{{ props.style.buttonRadius }}px</span>
      </template>
    </v-slider>
  </div>
</template>

<style scoped>
.lp-swatch {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.18);
  cursor: pointer;
  box-shadow: inset 0 0 0 2px rgb(var(--v-theme-surface));
  flex-shrink: 0;
}
</style>
