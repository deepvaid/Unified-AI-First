<script setup lang="ts">
import { ref } from 'vue'
import type { LandingPageBlock } from '@/stores/useLandingPages'
import type { PaletteItem } from './LandingBlockPalette.vue'

const props = defineProps<{
  blocks: LandingPageBlock[]
  selectedId: string | null
  palette: PaletteItem[]
}>()

const emit = defineEmits<{
  select: [id: string]
  duplicate: [id: string]
  remove: [id: string]
  move: [id: string, dir: -1 | 1]
  reorder: [fromIndex: number, toIndex: number]
}>()

function meta(type: LandingPageBlock['type']) {
  return props.palette.find(p => p.type === type)
}

function preview(block: LandingPageBlock): string {
  switch (block.type) {
    case 'title': case 'paragraph': case 'text': return block.text || '(empty)'
    case 'button': return block.label || 'Button'
    case 'image': return block.alt || 'Image'
    case 'video': return block.alt || 'Video'
    case 'form': return block.label || 'Subscribe form'
    case 'list': return `${block.items.length} item${block.items.length === 1 ? '' : 's'}`
    case 'menu': return `${block.links.length} link${block.links.length === 1 ? '' : 's'}`
    case 'divider': return 'Divider'
    case 'spacer': return `${block.height}px spacer`
    case 'social': return `${block.networks.length} network${block.networks.length === 1 ? '' : 's'}`
    case 'icons': return `${block.iconSet.length} icon${block.iconSet.length === 1 ? '' : 's'}`
    case 'html': return 'Custom HTML'
    default: return ''
  }
}

const dragIndex = ref<number | null>(null)
const overIndex = ref<number | null>(null)

function onDragStart(e: DragEvent, index: number) {
  dragIndex.value = index
  e.dataTransfer?.setData('application/x-lp-layer-index', String(index))
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}
function onDragOver(index: number) {
  overIndex.value = index
}
function onDrop(index: number) {
  if (dragIndex.value !== null && dragIndex.value !== index) emit('reorder', dragIndex.value, index)
  dragIndex.value = null
  overIndex.value = null
}
function onDragEnd() {
  dragIndex.value = null
  overIndex.value = null
}
</script>

<template>
  <div class="llp-list" role="list" aria-label="Page layers">
    <div v-if="!blocks.length" class="text-caption text-medium-emphasis pa-3 text-center">
      No blocks yet — add one from the Blocks tab.
    </div>
    <div
      v-for="(block, index) in blocks"
      :key="block.id"
      role="listitem"
      class="llp-row"
      :class="{ 'llp-row--selected': block.id === selectedId, 'llp-row--over': overIndex === index && dragIndex !== index }"
      draggable="true"
      tabindex="0"
      :aria-label="`${meta(block.type)?.label ?? block.type} layer, ${preview(block)}`"
      @click="emit('select', block.id)"
      @keydown.enter="emit('select', block.id)"
      @dragstart="onDragStart($event, index)"
      @dragover.prevent="onDragOver(index)"
      @drop.prevent="onDrop(index)"
      @dragend="onDragEnd"
    >
      <v-icon size="16" class="llp-row__grip" aria-hidden="true">grip-vertical</v-icon>
      <v-icon size="16" class="llp-row__icon">{{ meta(block.type)?.icon ?? 'square' }}</v-icon>
      <div class="llp-row__text min-width-0">
        <div class="llp-row__label text-truncate">{{ meta(block.type)?.label ?? block.type }}</div>
        <div class="llp-row__preview text-truncate">{{ preview(block) }}</div>
      </div>
      <div class="llp-row__actions">
        <button type="button" class="llp-icon-btn" aria-label="Move up" :disabled="index === 0" @click.stop="emit('move', block.id, -1)">
          <v-icon size="16">chevron-up</v-icon>
        </button>
        <button type="button" class="llp-icon-btn" aria-label="Move down" :disabled="index === blocks.length - 1" @click.stop="emit('move', block.id, 1)">
          <v-icon size="16">chevron-down</v-icon>
        </button>
        <button type="button" class="llp-icon-btn" aria-label="Duplicate block" @click.stop="emit('duplicate', block.id)">
          <v-icon size="16">copy-plus</v-icon>
        </button>
        <button type="button" class="llp-icon-btn llp-icon-btn--danger" aria-label="Delete block" @click.stop="emit('remove', block.id)">
          <v-icon size="16">trash-2</v-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.llp-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.llp-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 6px;
  border-radius: 8px;
  border: 1.5px solid transparent;
  cursor: grab;
  transition: background 100ms ease, border-color 100ms ease;
}
.llp-row:hover {
  background: var(--surface-secondary);
}
.llp-row--selected {
  border-color: rgb(var(--v-theme-primary));
  background: var(--accent-soft);
}
.llp-row--over {
  box-shadow: inset 0 2px 0 rgb(var(--v-theme-primary));
}
.llp-row:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
.llp-row__grip {
  color: var(--on-surface-muted);
  flex-shrink: 0;
}
.llp-row__icon {
  color: rgb(var(--v-theme-on-surface-variant));
  flex-shrink: 0;
}
.llp-row__text {
  flex-grow: 1;
}
.llp-row__label {
  font-size: var(--mp-text-label-fontSize);
  font-weight: var(--mp-fontWeight-semibold);
  color: rgb(var(--v-theme-on-surface));
}
.llp-row__preview {
  font-size: var(--mp-fontSize-12);
  color: var(--on-surface-muted);
}
.llp-row__actions {
  display: none;
  align-items: center;
  gap: 1px;
  flex-shrink: 0;
}
.llp-row:hover .llp-row__actions,
.llp-row--selected .llp-row__actions {
  display: flex;
}
.llp-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-24);
  height: var(--mp-space-24);
  border-radius: var(--mp-radius-4);
  color: rgb(var(--v-theme-on-surface-variant));
  background: transparent;
  border: none;
  cursor: pointer;
}
.llp-icon-btn:hover {
  background: var(--surface-secondary);
  color: rgb(var(--v-theme-on-surface));
}
.llp-icon-btn:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: -2px;
}
.llp-icon-btn:disabled {
  opacity: 0.3;
  cursor: default;
}
.llp-icon-btn--danger:hover {
  background: rgba(var(--v-theme-error), 0.12);
  color: rgb(var(--v-theme-error));
}
</style>
