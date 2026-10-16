<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

export type BuilderPersistenceMode = 'explicit' | 'autosave' | 'live'

/**
 * Shared chrome for builder/editor routes (meta `builderShell`): a 56px toolbar
 * (back · title · optional center cluster · status chip · actions), an optional
 * 52px steps row, and left/canvas/right panels. By default the shell fills the
 * app's rounded content frame edge-to-edge (`.mp-frame-fill`); pass `standalone`
 * to contain it in the parent instead (Storybook, embedded previews).
 *
 * Leave-guard rule of thumb: views with `explicit`/`live` persistence should
 * wire `useDirtyLeaveGuard` (back navigation flows through vue-router, so the
 * guard intercepts the shell's back button too); `autosave` views should NOT
 * add a blocking guard — leaving is loss-free by design.
 */
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
     * - live: Unpublished changes / Published
     */
    persistenceMode?: BuilderPersistenceMode
    /** Optional override for the chip label. */
    statusLabel?: string
    /** Hide the status chip entirely (screens where it is redundant). */
    hideStatus?: boolean
    /** Fill the parent (height 100%) instead of the app content frame. */
    standalone?: boolean
    /** Left panel width in px (≤1024px viewports render it 20px narrower). */
    leftWidth?: number
    /** Right panel width in px (≤1024px viewports render it 40px narrower). */
    rightWidth?: number
  }>(),
  {
    backLabel: 'Back',
    dirty: false,
    persistenceMode: 'explicit',
    hideStatus: false,
    standalone: false,
    leftWidth: 220,
    rightWidth: 300,
  },
)

defineEmits<{
  back: []
}>()

defineSlots<{
  /** Extra controls after the title (rename field, chips, etc.). */
  title?(): unknown
  /** Mid-toolbar cluster (device toggles, template selects). */
  'toolbar-center'?(): unknown
  /** Right-side toolbar actions (preview, save, publish). */
  actions?(): unknown
  /** Optional second 52px row under the toolbar (wizard steps). */
  steps?(): unknown
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
  <div
    class="mp-builder d-flex flex-column"
    :class="standalone ? 'mp-builder--contain' : 'mp-frame-fill'"
    :style="{ '--mp-builder-left-w': `${leftWidth}px`, '--mp-builder-right-w': `${rightWidth}px` }"
  >
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

      <div class="min-width-0 flex-grow-1 d-flex align-center ga-3">
        <slot name="title">
          <div class="min-width-0">
            <!-- The builder's page heading (WCAG best practice — W-18): an h1 at the toolbar's size. -->
            <h1 class="text-subtitle-2 font-weight-bold text-truncate ma-0">{{ title }}</h1>
            <div v-if="subtitle" class="text-caption text-medium-emphasis text-truncate">{{ subtitle }}</div>
          </div>
        </slot>
      </div>

      <div v-if="$slots['toolbar-center']" class="d-flex align-center ga-2 flex-shrink-0">
        <slot name="toolbar-center" />
      </div>

      <div
        v-if="!hideStatus"
        class="mp-builder__chip"
        :class="{ 'mp-builder__chip--dirty': dirty }"
        role="status"
      >
        <span class="mp-builder__chip-dot" />
        {{ chipLabel() }}
      </div>

      <div class="mp-builder__actions d-flex align-center ga-2 flex-shrink-0">
        <slot name="actions" />
      </div>
    </header>

    <div v-if="$slots.steps" class="mp-builder__steps">
      <slot name="steps" />
    </div>

    <div class="mp-builder__body d-flex flex-grow-1 overflow-hidden">
      <aside v-if="$slots.left" class="mp-builder__left">
        <slot name="left" />
      </aside>
      <!-- A div, not <main>: v-main is already the page's main landmark (WCAG W-18). -->
      <div class="mp-builder__canvas flex-grow-1 overflow-auto">
        <slot />
      </div>
      <aside v-if="$slots.right" class="mp-builder__right">
        <slot name="right" />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.mp-builder {
  background: rgb(var(--v-theme-background));
}
.mp-builder--contain {
  height: 100%;
}
.mp-builder__top {
  height: 56px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  background: rgb(var(--v-theme-surface));
}
.mp-builder__steps {
  height: 52px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  background: rgb(var(--v-theme-surface));
}
.mp-builder__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  /* Declared soft pairs, not a tinted fill under the full-strength ink
     (that read 4.49 / 4.13:1 — WCAG W-08). */
  color: var(--pos-ink);
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--pos-soft);
  flex-shrink: 0;
}
.mp-builder__chip--dirty {
  color: var(--warn-ink);
  background: var(--warn-soft);
}
.mp-builder__chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.mp-builder__body {
  min-height: 0;
}
.mp-builder__left {
  width: var(--mp-builder-left-w, 220px);
  flex-shrink: 0;
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  background: rgb(var(--v-theme-surface));
  overflow-y: auto;
}
.mp-builder__right {
  width: var(--mp-builder-right-w, 300px);
  flex-shrink: 0;
  border-left: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  background: rgb(var(--v-theme-surface));
  overflow-y: auto;
}
.mp-builder__canvas {
  background: rgb(var(--v-theme-background));
}

@media (max-width: 1024px) {
  .mp-builder__left { width: calc(var(--mp-builder-left-w, 220px) - 20px); }
  .mp-builder__right { width: calc(var(--mp-builder-right-w, 300px) - 40px); }
}
@media (max-width: 768px) {
  .mp-builder__left,
  .mp-builder__right { display: none; }
  /* The head band wraps: the actions cluster takes a full second line instead
     of clipping off the right edge (EmailContentEditor at 375). */
  .mp-builder__top {
    height: auto;
    min-height: 56px;
    flex-wrap: wrap;
    padding-bottom: var(--mp-space-8);
  }
  .mp-builder__actions {
    flex: 1 0 100%;
    justify-content: flex-end;
  }
}
</style>
