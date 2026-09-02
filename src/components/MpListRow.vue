<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'

const props = withDefaults(defineProps<{
  /** Row copy. Omit and use the default slot to lay out a custom body. */
  title?: string
  /** Muted line above the title. */
  eyebrow?: string
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
</script>

<template>
  <component
    :is="tag"
    :to="to"
    :href="href"
    :type="clickable && !to && !href ? 'button' : undefined"
    class="mp-list-row"
    :class="[
      `mp-list-row--${variant}`,
      `mp-list-row--${emphasis}`,
      `mp-list-row--${density}`,
      { 'mp-list-row--interactive': isInteractive },
    ]"
  >
    <span v-if="$slots.lead" class="mp-list-row__lead">
      <slot name="lead" />
    </span>

    <span class="mp-list-row__body">
      <slot>
        <span v-if="eyebrow" class="mp-list-row__eyebrow">{{ eyebrow }}</span>
        <span v-if="title" class="mp-list-row__title">{{ title }}</span>
      </slot>
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
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
