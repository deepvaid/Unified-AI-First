<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

/**
 * MpOptionCard — the keyboard-operable card of a chooser gallery, in two modes
 * derived from its props (the MpListRow "resolve your own tag" rule):
 *
 * - **Button** (no target): `role="button"` + Enter/Space. With `selected` it
 *   is a toggle (`aria-pressed`, primary ring + check) for select-then-commit
 *   wizard galleries; without it, a plain action card (`choose()`-style
 *   click-to-go with side effects) — no pressed state announced.
 * - **Navigation** (`to`/`href` given): a real anchor via v-card's own link
 *   rendering — natively keyboard operable, no `aria-pressed` (a link is not
 *   a toggle). Pure-navigation choosers (campaign type, segment builder).
 */
const props = withDefaults(defineProps<{
  /** Selection mode: whether this option is selected (ring + check). Omit entirely for plain/navigation cards. */
  selected?: boolean
  title: string
  description?: string
  /** Lucide icon name rendered in a tonal primary avatar before the title. */
  icon?: string
  /** Navigation mode: render the card as a router link. */
  to?: RouteLocationRaw
  /** Navigation mode: render the card as a plain anchor. */
  href?: string
  /** Render the title as a real heading — chooser tiles are page landmarks. Omit for a plain div. */
  headingLevel?: 2 | 3
}>(), {
  selected: undefined,
})

const isLink = computed(() => props.to !== undefined || props.href !== undefined)
const isButton = computed(() => !isLink.value)
const titleTag = computed(() => (props.headingLevel ? `h${props.headingLevel}` : 'div'))

// Click/dblclick are native events that fall through to the root v-card.
// Enter/Space re-dispatch a native click on the root so those fallthrough
// listeners fire for keyboard users too. (Selection mode only — a link
// handles its own keys.)
function onKeyActivate(e: KeyboardEvent) {
  if (e.target !== e.currentTarget) return
  e.preventDefault()
  ;(e.currentTarget as HTMLElement).click()
}
</script>

<template>
  <v-card
    flat
    border
    rounded="lg"
    class="mp-option-card d-flex flex-column"
    :class="{ 'mp-option-card--selected': selected }"
    :to="to"
    :href="href"
    :role="isButton ? 'button' : undefined"
    :tabindex="isButton ? 0 : undefined"
    :aria-pressed="isButton && selected !== undefined ? selected : undefined"
    @keydown.enter="isButton && onKeyActivate($event)"
    @keydown.space="isButton && onKeyActivate($event)"
  >
    <div class="mp-option-card__body d-flex flex-column flex-grow-1">
      <div class="d-flex align-center ga-3" :class="{ 'mb-2': description || $slots.default }">
        <v-avatar v-if="icon" color="primary" variant="tonal" size="34" rounded="lg" class="flex-shrink-0">
          <v-icon size="18">{{ icon }}</v-icon>
        </v-avatar>
        <component :is="titleTag" class="mp-option-card__title text-body-2 font-weight-bold">{{ title }}</component>
        <slot name="title-append" />
        <v-icon v-if="selected" color="primary" size="18" class="ml-auto flex-shrink-0">circle-check</v-icon>
      </div>
      <div v-if="description" class="text-caption text-medium-emphasis">{{ description }}</div>
      <slot />
    </div>
    <div v-if="$slots.media" class="mp-option-card__media mt-auto">
      <slot name="media" />
    </div>
  </v-card>
</template>

<style scoped>
.mp-option-card__body {
  padding: var(--mp-component-card-padding);
}

.mp-option-card {
  cursor: pointer;
  color: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.mp-option-card:hover {
  border-color: var(--border-hover);
}
.mp-option-card:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
.mp-option-card--selected {
  border-color: var(--accent-default);
  box-shadow: 0 0 0 1px var(--accent-default);
}
.mp-option-card__title {
  margin: 0;
}
.mp-option-card__media {
  border-top: 1px solid var(--border-subtle);
  background: var(--surface-canvas);
}
</style>
