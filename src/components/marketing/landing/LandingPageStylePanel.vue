<script setup lang="ts">
import MpFormField from '@/components/MpFormField.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
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
  <MpFormGrid>
    <MpFormSection title="Page style" description="Applies across every block on this page." />

    <MpFormField label="Background">
      <div class="d-flex align-center ga-2">
        <v-menu :close-on-content-click="false" location="start">
          <template #activator="{ props: menuProps }">
            <button v-bind="menuProps" type="button" class="lp-swatch" :style="{ background: props.style.backgroundColor }" aria-label="Background color" />
          </template>
          <v-color-picker :model-value="props.style.backgroundColor" mode="hex" :modes="['hex']" @update:model-value="v => set('backgroundColor', v)" />
        </v-menu>
        <span class="text-caption font-weight-medium">{{ props.style.backgroundColor }}</span>
      </div>
    </MpFormField>

    <MpFormField label="Content width">
      <template #default="{ labelId }">
        <v-slider
          :model-value="props.style.contentWidth"
          :min="480"
          :max="960"
          :step="20"
          thumb-label
          :aria-labelledby="labelId"
          @update:model-value="v => set('contentWidth', v)"
        >
          <template #append>
            <span class="text-caption text-medium-emphasis lp-slider-value">{{ props.style.contentWidth }}px</span>
          </template>
        </v-slider>
      </template>
    </MpFormField>

    <v-select
      :model-value="props.style.baseFont"
      :items="FONTS"
      item-title="label"
      item-value="value"
      label="Base font"
      @update:model-value="v => set('baseFont', v)"
    />

    <MpFormField label="Accent / button color">
      <div class="d-flex align-center ga-2">
        <v-menu :close-on-content-click="false" location="start">
          <template #activator="{ props: menuProps }">
            <button v-bind="menuProps" type="button" class="lp-swatch" :style="{ background: props.style.accentColor }" aria-label="Accent color" />
          </template>
          <v-color-picker :model-value="props.style.accentColor" mode="hex" :modes="['hex']" @update:model-value="v => set('accentColor', v)" />
        </v-menu>
        <span class="text-caption font-weight-medium">{{ props.style.accentColor }}</span>
      </div>
    </MpFormField>

    <MpFormField label="Button radius">
      <template #default="{ labelId }">
        <v-slider
          :model-value="props.style.buttonRadius"
          :min="0"
          :max="28"
          :step="2"
          thumb-label
          :aria-labelledby="labelId"
          @update:model-value="v => set('buttonRadius', v)"
        >
          <template #append>
            <span class="text-caption text-medium-emphasis lp-slider-value">{{ props.style.buttonRadius }}px</span>
          </template>
        </v-slider>
      </template>
    </MpFormField>
  </MpFormGrid>
</template>

<style scoped>
.lp-slider-value {
  display: inline-block;
  inline-size: var(--mp-space-48);
  text-align: end;
}

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
