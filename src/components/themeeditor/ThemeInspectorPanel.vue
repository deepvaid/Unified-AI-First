<script setup lang="ts">
// The builder's right-hand inspector shell (store builder re-skin): a titled panel with a close
// control and a scrolling body spaced on the form-group rhythm. Section, block and theme-settings
// inspectors all render inside it; only the host decides when it is on screen.
defineProps<{
  title: string
}>()

const emit = defineEmits<{ close: [] }>()

defineSlots<{
  /** Inspector fields — spaced on component.field.groupGap. */
  default(): unknown
}>()
</script>

<template>
  <aside class="te-inspector" :aria-label="`${title} settings`">
    <header class="te-inspector__head">
      <h2 class="te-inspector__title text-truncate">{{ title }}</h2>
      <v-btn icon="x" variant="text" size="small" aria-label="Close settings" @click="emit('close')" />
    </header>
    <div class="te-inspector__body">
      <slot />
    </div>
  </aside>
</template>

<style scoped>
.te-inspector {
  display: flex;
  flex-direction: column;
  width: var(--mp-component-editor-inspectorWidth);
  flex-shrink: 0;
  min-height: 0;
  border-left: 1px solid var(--border-subtle);
  background: var(--surface-primary);
  color: var(--on-surface);
}

.te-inspector__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-8);
  flex-shrink: 0;
  min-height: var(--mp-component-control-height);
  padding: var(--mp-space-8) var(--mp-space-8) var(--mp-space-8) var(--mp-space-16);
  border-bottom: 1px solid var(--border-subtle);
}

.te-inspector__title {
  margin: 0;
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  line-height: 1.3;
}

/* The body owns the field rhythm; a field never sets its own margin. */
.te-inspector__body {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-field-groupGap);
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: var(--mp-space-16);
}

/* Vuetify inputs carry `flex: 1 1 auto`; in a tall column that would stretch a text field to
   fill the panel, so every direct child keeps its natural height. */
.te-inspector__body > * {
  flex: 0 0 auto;
}
</style>
