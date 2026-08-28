<script setup lang="ts">
defineProps<{
  /** Whether this option is currently selected (renders the primary ring + check). */
  selected: boolean
  title: string
  description?: string
  /** Lucide icon name rendered in a tonal primary avatar before the title. */
  icon?: string
}>()

// Click/dblclick are native events that fall through to the root v-card.
// Enter/Space re-dispatch a native click on the root so those fallthrough
// listeners fire for keyboard users too.
function onKeyActivate(e: KeyboardEvent) {
  if (e.target !== e.currentTarget) return
  e.preventDefault()
  ;(e.currentTarget as HTMLElement).click()
}
</script>

<template>
  <v-card
    flat
    border
    rounded="lg"
    class="mp-option-card d-flex flex-column"
    :class="{ 'mp-option-card--selected': selected }"
    role="button"
    tabindex="0"
    :aria-pressed="selected"
    @keydown.enter="onKeyActivate"
    @keydown.space="onKeyActivate"
  >
    <div class="mp-option-card__body d-flex flex-column flex-grow-1">
      <div class="d-flex align-center ga-3" :class="{ 'mb-2': description || $slots.default }">
        <v-avatar v-if="icon" color="primary" variant="tonal" size="34" rounded="lg" class="flex-shrink-0">
          <v-icon size="18">{{ icon }}</v-icon>
        </v-avatar>
        <div class="text-body-2 font-weight-bold">{{ title }}</div>
        <v-icon v-if="selected" color="primary" size="18" class="ml-auto flex-shrink-0">circle-check</v-icon>
      </div>
      <div v-if="description" class="text-caption text-medium-emphasis">{{ description }}</div>
      <slot />
    </div>
    <div v-if="$slots.media" class="mp-option-card__media mt-auto">
      <slot name="media" />
    </div>
  </v-card>
</template>

<style scoped>
.mp-option-card__body {
  padding: var(--mp-component-card-padding);
}

.mp-option-card {
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.mp-option-card:hover {
  border-color: var(--border-hover);
}
.mp-option-card:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
.mp-option-card--selected {
  border-color: var(--accent-default);
  box-shadow: 0 0 0 1px var(--accent-default);
}
.mp-option-card__media {
  border-top: 1px solid var(--border-subtle);
  background: var(--surface-canvas);
}
</style>
