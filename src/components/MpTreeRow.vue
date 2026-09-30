<script setup lang="ts">
import { ref } from 'vue'
import MpIconButton from './MpIconButton.vue'

// The one tree row — builder layers, file explorers, nested settings lists.
//
// Geometry sits on `component.tree.*`: a 32px row (the sm control stop — trees are
// dense persistent chrome, like menus are dense transient chrome), one indent step
// per level with a hairline guide through the parent's disclosure toggle, and sm
// (24) icon buttons for the row's own actions.
//
// Structure is the part hand-rolled trees kept getting wrong: the row is NOT a
// button. A clickable row that holds other buttons nests interactive content
// (invalid HTML, garbled accessible names). Here the label is the one main
// <button>, stretched over the whole row with a pseudo-element so the row still
// clicks anywhere, and the disclosure toggle / meta / actions sit above it as
// siblings. Selection is the host's: the row only reports `select` / `toggle`.
//
// Semantics stay honest: this is a disclosure list, not an ARIA tree (no arrow-key
// contract is promised). The host wraps rows as list items and nests child lists.

const props = withDefaults(defineProps<{
  /** Row text — also the main button's accessible name, and its `title` when truncated. */
  label: string
  /** Lucide icon before the label. Ignored when `#lead` is filled. */
  icon?: string
  /** Nesting level, 0 = root. Each level indents by `component.tree.indent` and draws a guide. */
  depth?: number
  /** Shows the disclosure toggle (children exist). */
  expandable?: boolean
  expanded?: boolean
  /** The current selection — tonal fill + `aria-current`. */
  selected?: boolean
  /**
   * Structure. `item` is a node (disclosure, selection, actions); `action` is a
   * command row that ends a group — "Add block" — with an accent label and none of
   * an item's controls.
   */
  variant?: 'item' | 'action'
  /** Label weight — containers (sections, folders) read prominent. */
  emphasis?: 'default' | 'prominent'
}>(), {
  icon: undefined,
  depth: 0,
  expandable: false,
  expanded: false,
  selected: false,
  variant: 'item',
  emphasis: 'default',
})

const emit = defineEmits<{
  /** The row was activated (click / Enter / Space on the label). */
  select: [event: MouseEvent]
  /** The disclosure toggle was pressed. */
  toggle: []
}>()

defineSlots<{
  /** Replaces the icon — a coloured file glyph, an avatar. */
  lead?(): unknown
  /** Always-visible trailing mark — an unsaved dot, a count. */
  meta?(): unknown
  /** Row actions (MpIconButton size="sm", MpRowActionsMenu size="sm"). Revealed on hover, focus and selection. */
  actions?(): unknown
}>()

const main = ref<HTMLButtonElement | null>(null)

defineExpose({
  /** Moves focus to the row's main button — e.g. after a keyboard reorder moved the row. */
  focus: () => main.value?.focus(),
})
</script>

<template>
  <div
    class="mp-tree-row"
    :class="[
      `mp-tree-row--${variant}`,
      `mp-tree-row--${emphasis}`,
      { 'mp-tree-row--selected': selected && variant === 'item' },
    ]"
    :style="{ '--mp-tree-depth': depth }"
  >
    <span v-if="depth > 0" class="mp-tree-row__guides" aria-hidden="true" />

    <span class="mp-tree-row__twisty">
      <MpIconButton
        v-if="variant === 'item' && expandable"
        size="sm"
        :icon="expanded ? 'chevron-down' : 'chevron-right'"
        :ariaLabel="`${expanded ? 'Collapse' : 'Expand'} ${label}`"
        :aria-expanded="expanded"
        :tooltip="false"
        @click.stop="emit('toggle')"
      />
    </span>

    <button
      ref="main"
      type="button"
      class="mp-tree-row__main"
      :aria-current="selected && variant === 'item' ? 'true' : undefined"
      :title="label"
      @click="emit('select', $event)"
    >
      <span v-if="$slots.lead || icon" class="mp-tree-row__lead">
        <slot name="lead">
          <v-icon class="mp-tree-row__icon">{{ icon }}</v-icon>
        </slot>
      </span>
      <span class="mp-tree-row__label">{{ label }}</span>
    </button>

    <span v-if="$slots.meta" class="mp-tree-row__meta">
      <slot name="meta" />
    </span>

    <span v-if="variant === 'item' && $slots.actions" class="mp-tree-row__actions">
      <slot name="actions" />
    </span>
  </div>
</template>

<style scoped>
.mp-tree-row {
  position: relative;
  display: flex;
  align-items: center;
  min-height: var(--mp-component-tree-rowHeight);
  padding-inline:
    calc(var(--mp-component-tree-paddingInline) + var(--mp-tree-depth, 0) * var(--mp-component-tree-indent))
    var(--mp-component-tree-paddingInline);
  border-radius: var(--mp-component-tree-radius);
  color: var(--text-primary);
  transition: background var(--dur-fast) var(--ease);
}

.mp-tree-row:hover {
  background: var(--surface-secondary);
}

/* Selected — the recipe's primary tint (E1/E5): accent-soft with its declared ink. */
.mp-tree-row--selected,
.mp-tree-row--selected:hover {
  background: var(--accent-soft);
  color: var(--accent-on-container);
}

/* Indent guides — one hairline per ancestor level, through the centre of that
   level's disclosure toggle, so contiguous rows draw one continuous line. The
   hairline is a translucent step of --border-strong rather than --border-subtle:
   at 1.23:1 the subtle border disappears as a single vertical pixel, and the
   translucency keeps it calm over the hover and selected fills too (≈1.7:1 on
   white — decorative, so no contrast floor applies). */
.mp-tree-row__guides {
  --mp-tree-guide: color-mix(in oklch, var(--border-strong) 50%, transparent);
  position: absolute;
  inset-block: 0;
  inset-inline-start: var(--mp-component-tree-paddingInline);
  width: calc(var(--mp-tree-depth) * var(--mp-component-tree-indent));
  background-image: linear-gradient(
    to right,
    transparent calc(var(--mp-component-iconButton-size-sm) / 2),
    var(--mp-tree-guide) calc(var(--mp-component-iconButton-size-sm) / 2),
    var(--mp-tree-guide) calc(var(--mp-component-iconButton-size-sm) / 2 + 1px),
    transparent calc(var(--mp-component-iconButton-size-sm) / 2 + 1px)
  );
  background-size: var(--mp-component-tree-indent) 100%;
  background-repeat: repeat-x;
  pointer-events: none;
}

/* The disclosure column is always reserved, so leaf and branch icons align. */
.mp-tree-row__twisty {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 var(--mp-component-iconButton-size-sm);
  height: var(--mp-component-iconButton-size-sm);
}

.mp-tree-row__main {
  display: flex;
  align-items: center;
  gap: var(--mp-component-tree-gap);
  flex: 1 1 auto;
  min-width: 0;
  align-self: stretch;
  /* No end padding: the ellipsis runs to the meta/actions edge, which bring their
     own inset — the label keeps every pixel of a narrow panel. */
  padding-inline: var(--mp-space-4) 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: start;
  cursor: pointer;
}

/* The whole row is the hit area; toggle, meta and actions sit above it. */
.mp-tree-row__main::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
}

.mp-tree-row__main:focus-visible {
  outline: none;
}

.mp-tree-row__main:focus-visible::after {
  outline: 2px solid var(--focus-ring);
  outline-offset: -2px;
}

.mp-tree-row__lead {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.mp-tree-row__icon {
  font-size: var(--mp-component-tree-iconSize);
  color: var(--icon-secondary);
}

.mp-tree-row--selected .mp-tree-row__icon {
  color: currentColor;
}

.mp-tree-row__label {
  min-width: 0;
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-regular);
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mp-tree-row--prominent .mp-tree-row__label {
  font-weight: var(--mp-fontWeight-medium);
}

.mp-tree-row__meta,
.mp-tree-row__actions {
  position: relative;
  z-index: 1;
  align-items: center;
  flex-shrink: 0;
  gap: var(--mp-space-2);
}

.mp-tree-row__meta {
  display: inline-flex;
  padding-inline: var(--mp-space-4);
}

/* Actions reserve no width at rest, so a long label keeps the whole row; they
   appear on hover, on keyboard focus anywhere in the row, and on the selection
   (the touch path: tap selects, and the selected row shows its actions). */
.mp-tree-row__actions {
  display: none;
}

.mp-tree-row:hover .mp-tree-row__actions,
.mp-tree-row:focus-within .mp-tree-row__actions,
.mp-tree-row--selected .mp-tree-row__actions {
  display: inline-flex;
}

/* Action rows ("Add block") — the accent command at the end of a group. */
.mp-tree-row--action {
  color: var(--accent-default);
}

.mp-tree-row--action .mp-tree-row__icon {
  color: currentColor;
}

.mp-tree-row--action .mp-tree-row__label {
  font-weight: var(--mp-fontWeight-medium);
}

.mp-tree-row--action:hover {
  background: var(--accent-soft);
  color: var(--accent-on-container);
}
</style>
