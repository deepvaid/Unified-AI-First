<script setup lang="ts">
import { computed, mergeProps, useAttrs } from 'vue'

// The one icon-only button. An icon with no visible text is only usable when it
// carries a name (aria-label) and, for sighted pointer users, the same name as a
// tooltip (recipe D2) — this atom makes both the default instead of a call-site
// habit, and owns the square geometry on `component.iconButton.*`:
//
//   sm 24 · icon 16 — inside a 32px tree/list row (the WCAG 2.5.8 floor)
//   md 32 · icon 18 — panel headers, tab strips
//   lg 40 · icon 20 — toolbars, beside 40px fields and buttons (control.height)
//
// Everything else a v-btn accepts (to, href, disabled, @click, aria-expanded,
// aria-pressed…) falls through to the button. `active` is the pressed look only;
// the host still states the ARIA that fits (aria-pressed for a toggle,
// aria-selected for a tab).

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  /** Lucide icon name (kebab-case). */
  icon: string
  /** Accessible name — required: the button has no visible text. */
  ariaLabel: string
  size?: 'sm' | 'md' | 'lg'
  /** Tooltip text. Defaults to `ariaLabel`; `false` when a visible label already names the control. */
  tooltip?: string | false
  /** Pressed / current look (tonal primary). The host owns the matching ARIA state. */
  active?: boolean
  /** Tooltip placement. */
  tooltipLocation?: 'top' | 'bottom' | 'start' | 'end'
}>(), {
  size: 'md',
  tooltip: undefined,
  active: false,
  tooltipLocation: 'top',
})

const attrs = useAttrs()

const tooltipText = computed(() => (props.tooltip === false ? '' : props.tooltip || props.ariaLabel))

// maropostDefaults.VBtn writes text-button geometry (min-height 40, padding-inline 14)
// as an INLINE style on every v-btn. Vuetify merges a component's explicit `style`
// after its default one, so restating the two properties here is what makes the
// square stick — no !important, and no app-wide reset (see DESIGN_AUDIT.md).
const SQUARE = { minHeight: '0', paddingInline: '0' }

const buttonProps = (activator: Record<string, unknown> = {}) =>
  mergeProps(activator, attrs, {
    class: ['mp-icon-btn', `mp-icon-btn--${props.size}`, { 'mp-icon-btn--active': props.active }],
    style: SQUARE,
    'aria-label': props.ariaLabel,
  })
</script>

<template>
  <v-tooltip v-if="tooltipText" :text="tooltipText" :location="tooltipLocation">
    <template #activator="{ props: activator }">
      <!-- `icon` stays a boolean: an icon NAME plus a default slot renders the (empty)
           slot instead of the icon (menus-notifications-segmented gotcha). -->
      <v-btn v-bind="buttonProps(activator)" icon variant="text">
        <v-icon class="mp-icon-btn__icon">{{ icon }}</v-icon>
      </v-btn>
    </template>
  </v-tooltip>
  <v-btn v-else v-bind="buttonProps()" icon variant="text">
    <v-icon class="mp-icon-btn__icon">{{ icon }}</v-icon>
  </v-btn>
</template>

<style scoped>
/* The explicit `style` above has already neutralised the inline text-button
   min-height/padding; the ramp sets the square here. Two classes plus the scoped
   attribute out-rank Vuetify's `.v-btn--icon.v-btn--density-*` sizing without
   !important. */
.v-btn.mp-icon-btn {
  flex-shrink: 0;
  color: var(--icon-secondary);
}

.v-btn.mp-icon-btn--sm {
  width: var(--mp-component-iconButton-size-sm);
  height: var(--mp-component-iconButton-size-sm);
}

.v-btn.mp-icon-btn--md {
  width: var(--mp-component-iconButton-size-md);
  height: var(--mp-component-iconButton-size-md);
}

.v-btn.mp-icon-btn--lg {
  width: var(--mp-component-iconButton-size-lg);
  height: var(--mp-component-iconButton-size-lg);
}

.mp-icon-btn--sm .mp-icon-btn__icon {
  font-size: var(--mp-component-iconButton-iconSize-sm);
}

.mp-icon-btn--md .mp-icon-btn__icon {
  font-size: var(--mp-component-iconButton-iconSize-md);
}

.mp-icon-btn--lg .mp-icon-btn__icon {
  font-size: var(--mp-component-iconButton-iconSize-lg);
}

.v-btn.mp-icon-btn:hover,
.v-btn.mp-icon-btn:focus-visible {
  color: var(--icon-primary);
}

/* Pressed / current — the recipe's toggle look (D2): tonal primary, never a bare
   colour swap. */
.v-btn.mp-icon-btn--active {
  background: var(--accent-soft);
  color: var(--accent-on-container);
}

.v-btn.mp-icon-btn:disabled {
  color: var(--icon-disabled);
}
</style>
