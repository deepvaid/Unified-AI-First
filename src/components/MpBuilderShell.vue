<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

export type BuilderPersistenceMode = 'explicit' | 'autosave' | 'live'

const props = withDefaults(
  defineProps<{
    /** Back navigation target. */
    backTo?: RouteLocationRaw
    backLabel?: string
    /** Primary title in the toolbar. */
    title: string
    subtitle?: string
    /** When true, shows the dirty/status chip. */
    dirty?: boolean
    /**
     * Persistence model for the status chip copy.
     * - explicit: Unsaved / Saved
     * - autosave: Unsaved / Autosaved
     * - live: Unpublished changes / Live draft
     */
    persistenceMode?: BuilderPersistenceMode
    /** Optional override for the chip label. */
    statusLabel?: string
  }>(),
  {
    backLabel: 'Back',
    dirty: false,
    persistenceMode: 'explicit',
  },
)

defineEmits<{
  back: []
}>()

defineSlots<{
  /** Extra controls after the title (rename field, chips, etc.). */
  title?(): unknown
  /** Right-side toolbar actions (preview, save, publish). */
  actions?(): unknown
  /** Left panel (palette / layers). */
  left?(): unknown
  /** Center canvas / main editor surface. */
  default?(): unknown
  /** Right inspector panel. */
  right?(): unknown
}>()

const chipLabel = () => {
  if (props.statusLabel) return props.statusLabel
  if (props.persistenceMode === 'autosave') return props.dirty ? 'Unsaved' : 'Autosaved'
  if (props.persistenceMode === 'live') return props.dirty ? 'Unpublished changes' : 'Published'
  return props.dirty ? 'Unsaved' : 'Saved'
}
</script>

<template>
  <div class="mp-builder d-flex flex-column">
    <header class="mp-builder__top d-flex align-center ga-3 px-4">
      <v-btn
        v-if="backTo"
        variant="text"
        icon="chevron-left"
        :to="backTo"
        :aria-label="backLabel"
      />
      <v-btn
        v-else
        variant="text"
        icon="chevron-left"
        :aria-label="backLabel"
        @click="$emit('back')"
      />

      <div class="min-width-0 flex-grow-1">
        <slot name="title">
          <div class="text-subtitle-2 font-weight-bold text-truncate">{{ title }}</div>
          <div v-if="subtitle" class="text-caption text-medium-emphasis text-truncate">{{ subtitle }}</div>
        </slot>
      </div>

      <div
        class="mp-builder__chip"
        :class="{ 'mp-builder__chip--dirty': dirty }"
        role="status"
      >
        <span class="mp-builder__chip-dot" />
        {{ chipLabel() }}
      </div>

      <div class="d-flex align-center ga-2 flex-shrink-0">
        <slot name="actions" />
      </div>
    </header>

    <div class="mp-builder__body d-flex flex-grow-1 overflow-hidden">
      <aside v-if="$slots.left" class="mp-builder__left">
        <slot name="left" />
      </aside>
      <main class="mp-builder__canvas flex-grow-1 overflow-auto">
        <slot />
      </main>
      <aside v-if="$slots.right" class="mp-builder__right">
        <slot name="right" />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.mp-builder {
  height: 100%;
  background: rgb(var(--v-theme-background));
}
.mp-builder__top {
  height: 56px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  background: rgb(var(--v-theme-surface));
}
.mp-builder__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(var(--v-theme-success));
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(var(--v-theme-success), 0.08);
  flex-shrink: 0;
}
.mp-builder__chip--dirty {
  color: rgb(var(--v-theme-warning));
  background: rgba(var(--v-theme-warning), 0.10);
}
.mp-builder__chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.mp-builder__left {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  background: rgb(var(--v-theme-surface));
  overflow-y: auto;
}
.mp-builder__right {
  width: 300px;
  flex-shrink: 0;
  border-left: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  background: rgb(var(--v-theme-surface));
  overflow-y: auto;
}
.mp-builder__canvas {
  background: rgb(var(--v-theme-background));
}

@media (max-width: 1024px) {
  .mp-builder__left { width: 200px; }
  .mp-builder__right { width: 260px; }
}
@media (max-width: 768px) {
  .mp-builder__left,
  .mp-builder__right { display: none; }
}
</style>
