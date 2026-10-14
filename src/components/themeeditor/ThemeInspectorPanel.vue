<script setup lang="ts">
import MpIconButton from '@/components/MpIconButton.vue'

// The builder's inspector shell (store builder re-skin): a titled panel with a close control and
// a scrolling body spaced on the form-group rhythm. Where it sits follows UAT: a section or block
// opens in the Layers column (`start` — it takes Layers' place, × goes back), theme settings open
// on the right (`end`). Only the host decides when it is on screen.
withDefaults(defineProps<{
  title: string
  placement?: 'start' | 'end'
}>(), {
  placement: 'end',
})

const emit = defineEmits<{ close: [] }>()

defineSlots<{
  /** Inspector fields — spaced on component.field.groupGap. */
  default(): unknown
}>()
</script>

<template>
  <aside class="te-inspector" :class="`te-inspector--${placement}`" :aria-label="`${title} settings`">
    <header class="te-inspector__head">
      <h2 class="te-inspector__title text-truncate">{{ title }}</h2>
      <MpIconButton icon="x" ariaLabel="Close settings" @click="emit('close')" />
    </header>
    <div class="te-inspector__body">
      <slot />
    </div>
  </aside>
</template>

<style scoped lang="scss">
.te-inspector {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  min-height: 0;
  background: var(--surface-primary);
  color: var(--on-surface);
}

/* In the Layers column: Layers' own width, so the canvas doesn't move when a row is picked. */
.te-inspector--start {
  width: var(--mp-component-editor-layersWidth);
  border-right: 1px solid var(--border-subtle);
}

.te-inspector--end {
  width: var(--mp-component-editor-inspectorWidth);
  border-left: 1px solid var(--border-subtle);
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

/* Below breakpointWide the three panels would squeeze the canvas to a strip, so the
   inspector stops taking layout width and floats over the canvas's right edge
   (recipe F6: side panels overlay the content). The host's content row is the
   positioning context; the canvas isolates its own stacking so the preview's
   selection labels can't paint through. Closing it is the existing × — no new
   control. */
@media (max-width: ($mp-layout-breakpointWide - 0.02px)) {
  .te-inspector--end {
    position: absolute;
    inset-block: 0;
    inset-inline-end: 0;
    box-shadow: var(--elevation-overlay);
  }
}
</style>
