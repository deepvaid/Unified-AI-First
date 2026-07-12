<script setup lang="ts">
import { ref } from 'vue'
import type { LandingPageBlockType } from '@/stores/useLandingPages'
import LandingBlockPalette, { type PaletteItem } from './LandingBlockPalette.vue'

defineProps<{
  palette: PaletteItem[]
}>()

const emit = defineEmits<{
  insert: [type: LandingPageBlockType]
  reorder: [id: string]
}>()

const menuOpen = ref(false)
const dragOver = ref(false)

function onDragOver(e: DragEvent) {
  if (!e.dataTransfer) return
  const types = e.dataTransfer.types
  if (types.includes('application/x-lp-block-type') || types.includes('application/x-lp-reorder-id')) {
    dragOver.value = true
  }
}
function onDrop(e: DragEvent) {
  dragOver.value = false
  const blockType = e.dataTransfer?.getData('application/x-lp-block-type')
  const reorderId = e.dataTransfer?.getData('application/x-lp-reorder-id')
  if (blockType) emit('insert', blockType as LandingPageBlockType)
  else if (reorderId) emit('reorder', reorderId)
}
function pick(type: LandingPageBlockType) {
  menuOpen.value = false
  emit('insert', type)
}
</script>

<template>
  <div
    class="lip"
    :class="{ 'lip--over': dragOver }"
    @dragover.prevent="onDragOver"
    @dragleave="dragOver = false"
    @drop.prevent="onDrop"
  >
    <div class="lip__line" />
    <v-menu v-model="menuOpen" location="bottom" :close-on-content-click="false">
      <template #activator="{ props: menuProps }">
        <button v-bind="menuProps" type="button" class="lip__pill" aria-label="Insert block here">
          <v-icon size="13">plus</v-icon>
        </button>
      </template>
      <v-card rounded="lg" border flat class="pa-3" style="width: 220px;">
        <LandingBlockPalette :palette="palette" @add="pick" />
      </v-card>
    </v-menu>
  </div>
</template>

<style scoped>
.lip {
  position: relative;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lip__line {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  background: rgb(var(--v-theme-primary));
  border-radius: 2px;
  opacity: 0;
  transition: opacity 100ms ease;
}
.lip:hover .lip__line,
.lip--over .lip__line {
  opacity: 0.5;
}
.lip--over {
  height: 40px;
}
.lip__pill {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 1.5px solid rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-primary));
  opacity: 0;
  transform: scale(0.85);
  transition: opacity 120ms ease, transform 120ms ease;
  cursor: pointer;
  z-index: 1;
}
.lip:hover .lip__pill,
.lip--over .lip__pill {
  opacity: 1;
  transform: scale(1);
}
</style>
