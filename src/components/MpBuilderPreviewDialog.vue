<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
  }>(),
  {
    title: 'Preview',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

defineSlots<{
  /** Preview content (email canvas, landing sheet, chatbot widget, etc.). */
  default?(): unknown
  /** Optional toolbar controls (device toggle, etc.). */
  toolbar?(): unknown
}>()

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    fullscreen
    transition="dialog-bottom-transition"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="mp-builder-preview d-flex flex-column" rounded="0" flat>
      <div class="mp-builder-preview__bar d-flex align-center ga-3 px-4">
        <div class="text-subtitle-2 font-weight-bold text-truncate">{{ title }}</div>
        <v-spacer />
        <slot name="toolbar" />
        <v-btn icon="x" variant="text" size="small" aria-label="Close preview" @click="close" />
      </div>
      <div class="mp-builder-preview__stage flex-grow-1 overflow-y-auto">
        <slot />
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.mp-builder-preview {
  height: 100%;
  background: rgb(var(--v-theme-background));
}
.mp-builder-preview__bar {
  height: 56px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  background: rgb(var(--v-theme-surface));
}
.mp-builder-preview__stage {
  padding: 32px 24px;
  display: flex;
  justify-content: center;
  background: rgb(var(--v-theme-background));
}
</style>
