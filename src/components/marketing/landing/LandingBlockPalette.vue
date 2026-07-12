<script setup lang="ts">
import type { LandingPageBlockType } from '@/stores/useLandingPages'

export interface PaletteItem {
  type: LandingPageBlockType
  label: string
  icon: string
}

defineProps<{
  palette: PaletteItem[]
}>()

const emit = defineEmits<{
  add: [type: LandingPageBlockType]
}>()

/** Drag source for HTML5 drag-and-drop into canvas insertion points. */
function onDragStart(e: DragEvent, type: LandingPageBlockType) {
  if (!e.dataTransfer) return
  e.dataTransfer.effectAllowed = 'copy'
  e.dataTransfer.setData('application/x-lp-block-type', type)
}
</script>

<template>
  <div class="lbp-grid">
    <button
      v-for="p in palette"
      :key="p.type"
      type="button"
      class="lbp-tile"
      draggable="true"
      :aria-label="`Add ${p.label} block`"
      @dragstart="onDragStart($event, p.type)"
      @click="emit('add', p.type)"
    >
      <v-icon size="20" class="lbp-tile__icon">{{ p.icon }}</v-icon>
      <span class="lbp-tile__label">{{ p.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.lbp-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.lbp-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 6px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  border-radius: 10px;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface-variant));
  cursor: grab;
  transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease, color 120ms ease;
}
.lbp-tile:hover,
.lbp-tile:focus-visible {
  transform: translateY(-2px);
  border-color: rgba(var(--v-theme-primary), 0.4);
  color: rgb(var(--v-theme-primary));
  box-shadow: 0 6px 14px rgba(var(--v-theme-on-surface), 0.08);
}
.lbp-tile:focus-visible {
  outline: none;
}
.lbp-tile:active {
  cursor: grabbing;
  transform: translateY(0);
}
.lbp-tile__label {
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.1;
}
</style>
