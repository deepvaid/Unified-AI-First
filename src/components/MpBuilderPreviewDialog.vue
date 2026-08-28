<script setup lang="ts">
import MpDialog from './MpDialog.vue'

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
</script>

<template>
  <!-- Composes MpDialog in fullscreen (P4-6): the header band, close affordance
       and body scroll come from the shell, so a preview and a form modal share
       one chrome. Only the centred stage is local. -->
  <MpDialog
    :model-value="modelValue"
    fullscreen
    flush
    :title="title"
    class="mp-builder-preview"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #headerActions>
      <slot name="toolbar" />
    </template>

    <div class="mp-builder-preview__stage">
      <slot />
    </div>
  </MpDialog>
</template>

<style scoped>
.mp-builder-preview :deep(.mp-dialog__card) {
  background: rgb(var(--v-theme-background));
}

/* The stage is the full-bleed canvas the preview sits on, so it takes the
   shell's inset off (the `flush` prop, not a :deep() reach into MpDialog's
   internals — P6-6) and paints its own generous one. */
.mp-builder-preview :deep(.mp-dialog__body) {
  background: rgb(var(--v-theme-background));
}

.mp-builder-preview__stage {
  display: flex;
  justify-content: center;
  padding: var(--mp-component-card-paddingSpacious) var(--mp-space-24);
}
</style>
