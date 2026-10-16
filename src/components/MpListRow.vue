<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { RouterLink } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'

const props = withDefaults(defineProps<{
  /** Row copy. Omit and use the default slot to lay out a custom body. */
  title?: string
  /** Muted line above the title. */
  eyebrow?: string
  /**
   * Muted second line under the title — a two-line row. The title then wraps
   * instead of truncating (it's copy, not a label). `#title` / `#subtitle` slots
   * replace the text but keep the styling.
   */
  subtitle?: string
  /** Trailing muted value (timestamp, count). Rendered right-aligned, tabular. */
  meta?: string
  /**
   * Structure. 'plain' is a bare row; 'divided' adds a hairline between siblings;
   * 'boxed' renders each row as its own bordered tile. Structural only — visual
   * weight lives on `emphasis` (P2-7).
   */
  variant?: 'plain' | 'divided' | 'boxed'
  /** Visual weight of the title. */
  emphasis?: 'default' | 'prominent'
  /** Vertical density. 'compact' drops the 40px floor for tight menus and checklists. */
  density?: 'default' | 'compact'
  /** Router target — renders the row as a RouterLink. */
  to?: RouteLocationRaw
  /** External target — renders the row as an anchor. */
  href?: string
  /** Renders the row as a <button> (use with @click). */
  clickable?: boolean
}>(), {
  variant: 'plain',
  emphasis: 'default',
  density: 'default',
})

const tag = computed(() => {
  if (props.to) return RouterLink
  if (props.href) return 'a'
  if (props.clickable) return 'button'
  return 'div'
})

const isInteractive = computed(() => !!props.to || !!props.href || props.clickable)

const slots = useSlots()
const twoLine = computed(() => !!props.subtitle || !!slots.subtitle)

/**
 * `#actions` on an interactive row: the root becomes a plain div and the body
 * becomes the link/button, stretched over the row by a pseudo-element, so the
 * actions sit beside it instead of nested inside it (WCAG 4.1.2 — W-10).
 */
const split = computed(() => isInteractive.value && !!slots.actions)
const linkAttrs = computed(() => ({
  to: props.to,
  href: props.href,
  type: props.clickable && !props.to && !props.href ? 'button' : undefined,
}))
</script>

<template>
  <component
    :is="split ? 'div' : tag"
    v-bind="split ? {} : linkAttrs"
    class="mp-list-row"
    :class="[
      `mp-list-row--${variant}`,
      `mp-list-row--${emphasis}`,
      `mp-list-row--${density}`,
      { 'mp-list-row--interactive': isInteractive, 'mp-list-row--two-line': twoLine, 'mp-list-row--split': split },
    ]"
  >
    <span v-if="$slots.lead" class="mp-list-row__lead">
      <slot name="lead" />
    </span>

    <component
      :is="split ? tag : 'span'"
      v-bind="split ? linkAttrs : {}"
      class="mp-list-row__body"
      :class="{ 'mp-list-row__hit': split }"
    >
      <slot>
        <span v-if="eyebrow" class="mp-list-row__eyebrow">{{ eyebrow }}</span>
        <span v-if="title || $slots.title" class="mp-list-row__title"><slot name="title">{{ title }}</slot></span>
        <span v-if="twoLine" class="mp-list-row__subtitle"><slot name="subtitle">{{ subtitle }}</slot></span>
      </slot>
    </component>

    <span v-if="$slots.actions" class="mp-list-row__actions">
      <slot name="actions" />
    </span>

    <span v-if="meta || $slots.trailing" class="mp-list-row__trailing">
      <slot name="trailing">{{ meta }}</slot>
    </span>
  </component>
</template>

<style scoped>
/* One row geometry for every list in the system. minHeight reuses
   component.control.height, so a list row lines up with buttons and form fields. */
.mp-list-row {
  display: flex;
  align-items: center;
  gap: var(--mp-component-listItem-gap);
  width: 100%;
  min-height: var(--mp-component-listItem-minHeight);
  padding-block: var(--mp-component-listItem-paddingBlock);
  color: var(--text-primary);
  font: inherit;
  text-align: left;
  text-decoration: none;
}

/* Compact drops the 40px floor — checklists and dense menus where a full control
   height would read as loose rather than calm. */
.mp-list-row--compact {
  min-height: 0;
  padding-block: var(--mp-space-4);
}

.mp-list-row--divided + .mp-list-row--divided {
  border-top: 1px solid var(--border-subtle);
}

.mp-list-row--boxed {
  padding-inline: var(--mp-component-listItem-paddingInline);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-component-chip-radius);
  background: var(--surface-primary);
}

.mp-list-row--interactive {
  cursor: pointer;
  appearance: none;
  transition:
    background var(--mp-motion-duration-fast) var(--mp-motion-easing-standard),
    border-color var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}

/* Plain/divided interactive rows bleed their hover surface into the card inset so
   the highlight reaches the card edge instead of floating inside it. */
.mp-list-row--interactive:where(.mp-list-row--plain, .mp-list-row--divided) {
  margin-inline: calc(-1 * var(--mp-component-listItem-paddingInline));
  padding-inline: var(--mp-component-listItem-paddingInline);
  border-radius: var(--mp-component-chip-radius);
}

.mp-list-row--interactive:hover,
.mp-list-row--interactive:focus-visible {
  background: var(--surface-secondary);
}

.mp-list-row--interactive:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: -2px;
}

/* Split row (#actions): the body is the real link/button and its ::after covers
   the row, so the whole row still activates it; actions are lifted above that
   layer. Focus is drawn on the row, exactly as for an unsplit row. */
.mp-list-row--split {
  position: relative;
}

.mp-list-row__hit {
  appearance: none;
  background: none;
  border: 0;
  padding: 0;
  color: inherit;
  font: inherit;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.mp-list-row__hit::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
}

.mp-list-row__hit:focus-visible {
  outline: none;
}

.mp-list-row--split:has(.mp-list-row__hit:focus-visible) {
  background: var(--surface-secondary);
  outline: 2px solid var(--focus-ring);
  outline-offset: -2px;
}

.mp-list-row__actions {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.mp-list-row__actions + .mp-list-row__trailing {
  margin-left: 0;
}

.mp-list-row--boxed.mp-list-row--interactive:hover {
  border-color: color-mix(in oklch, var(--tile-accent, var(--accent)) 30%, var(--border-subtle));
}

.mp-list-row__lead {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.mp-list-row__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.mp-list-row__eyebrow {
  font-size: var(--mp-fontSize-11);
  color: var(--muted);
  margin-bottom: var(--mp-space-2);
}

.mp-list-row__title {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-medium);
  color: inherit;
  line-height: var(--mp-lineHeight-snug);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Two-line rows: body-size title that wraps, and a muted subtitle under it. */
.mp-list-row--two-line .mp-list-row__title {
  font-size: var(--mp-text-body-fontSize);
  white-space: normal;
  overflow-wrap: anywhere;
}

.mp-list-row__subtitle {
  margin-top: var(--mp-space-2);
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-compact);
  color: var(--on-surface-muted);
  overflow-wrap: anywhere;
}

.mp-list-row--prominent .mp-list-row__title {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
}

.mp-list-row__trailing {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
  font-size: var(--mp-fontSize-12);
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
</style>
