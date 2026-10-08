<script setup lang="ts">
// DvCatalogCta — the one "… with Da Vinci" entry point in the Products module:
// Create with Da Vinci on the index, Edit with Da Vinci on the edit page, and
// Generate with Da Vinci on the description and SEO fields.
//
// Variants:
// - `tonal` (headers): the Da Vinci soft tint — the same surface as the drawer's
//   catalog context bar, so the tinted button visibly opens the tinted mode. It
//   stays below the page's one filled primary action.
// - `link` (fields): a text action sized to a field's label line, so it can sit in
//   the label row instead of adding a row under the field. In a field narrower than
//   `component.field.actionCollapseWidth` it shows only its mark (the host declares
//   the container); the label stays its accessible name.
// - `outlined` / `text`: neutral fallbacks.
// `iconOnly` collapses a header CTA to its mark on phones; the label becomes the
// accessible name and the tooltip.
//
// Presentational: the host decides whether it renders (feature flag, Build tier)
// and whether the viewer may use it. A view-only role sees it disabled with the
// reason on hover or focus — the PRD keeps the CTA visible.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{
  label?: string
  variant?: 'tonal' | 'link' | 'outlined' | 'text'
  size?: 'sm' | 'md' | 'lg'
  /** Mark only (phones). The label stays the accessible name and the tooltip. */
  iconOnly?: boolean
  disabled?: boolean
  /** Shown on hover while disabled. */
  disabledReason?: string
}>(), {
  label: 'Create with Da Vinci',
  variant: 'tonal',
  size: 'md',
  iconOnly: false,
  disabled: false,
  disabledReason: 'You need permission to create or edit products to use Da Vinci.',
})

const emit = defineEmits<{ click: [] }>()

const vuetifySize = computed(() => ({ sm: 'small', md: 'default', lg: 'large' } as const)[props.size])
const vuetifyVariant = computed(() => (props.variant === 'outlined' ? 'outlined' : 'text'))
const color = computed(() => (props.variant === 'text' ? 'primary' : undefined))
// A link collapsed to its mark by its field's width (see the container query) needs
// its label as a tooltip, like iconOnly. Watched, because CSS decides it.
const linkEl = ref<HTMLButtonElement | null>(null)
const linkCollapsed = ref(false)
let observer: ResizeObserver | undefined
onMounted(() => {
  const el = linkEl.value
  if (!el || typeof ResizeObserver === 'undefined') return
  observer = new ResizeObserver(() => {
    const text = el.querySelector('.dv-catalog-cta-link__text')
    linkCollapsed.value = !!text && getComputedStyle(text).position === 'absolute'
  })
  observer.observe(el)
})
onBeforeUnmount(() => observer?.disconnect())

const tooltip = computed(() => (props.disabled ? props.disabledReason : props.iconOnly || linkCollapsed.value ? props.label : ''))
</script>

<template>
  <!-- One root either way, so a host's layout class (ml-auto, positioning) always lands. -->
  <span class="dv-catalog-cta__root">
    <v-tooltip :text="tooltip" :disabled="!tooltip" location="bottom">
      <template #activator="{ props: tip }">
        <!-- A disabled control swallows pointer events; the wrapper carries the tooltip. -->
        <span v-bind="tip" class="dv-catalog-cta__wrap" :tabindex="disabled ? 0 : undefined">
          <button
            v-if="variant === 'link'"
            ref="linkEl"
            type="button"
            class="dv-catalog-cta-link"
            :disabled="disabled"
            @click="emit('click')"
          >
            <v-icon size="14" aria-hidden="true">sparkles</v-icon>
            <span class="dv-catalog-cta-link__text">{{ label }}</span>
          </button>
          <v-btn
            v-else-if="iconOnly"
            icon
            :variant="vuetifyVariant"
            :size="vuetifySize"
            :color="color"
            class="dv-catalog-cta dv-catalog-cta--icon"
            :class="`dv-catalog-cta--${variant}`"
            :aria-label="label"
            :disabled="disabled"
            @click="emit('click')"
          >
            <v-icon size="18">sparkles</v-icon>
          </v-btn>
          <v-btn
            v-else
            :variant="vuetifyVariant"
            :size="vuetifySize"
            :color="color"
            prepend-icon="sparkles"
            class="text-none dv-catalog-cta"
            :class="`dv-catalog-cta--${variant}`"
            :disabled="disabled"
            @click="emit('click')"
          >
            {{ label }}
          </v-btn>
        </span>
      </template>
    </v-tooltip>
  </span>
</template>

<style scoped lang="scss">
.dv-catalog-cta__root,
.dv-catalog-cta__wrap {
  display: inline-flex;
}

.dv-catalog-cta__wrap {
  border-radius: var(--mp-radius-full);
}

.dv-catalog-cta__wrap:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

/* Icon-only sits on the control-height baseline with the header's other buttons. */
.dv-catalog-cta.dv-catalog-cta--icon {
  width: var(--mp-component-control-height);
  height: var(--mp-component-control-height);
}

/* Tonal: the Da Vinci soft tint and its declared text pair (11.0:1). */
.dv-catalog-cta.dv-catalog-cta--tonal {
  background: var(--dv-accent-soft);
  color: var(--dv-text-primary);
}

.dv-catalog-cta.dv-catalog-cta--tonal:hover {
  box-shadow: inset 0 0 0 1px var(--dv-border);
}

.dv-catalog-cta.dv-catalog-cta--tonal:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

/* Outlined keeps the header's neutral ink; only the mark carries the accent. */
.dv-catalog-cta--outlined :deep(.v-btn__prepend .v-icon) {
  color: var(--dv-accent);
}

/* Link: sized to a field's label line plus its gap — a 24px hit area (SC 2.5.8)
   that fits the label row without adding one. */
.dv-catalog-cta-link {
  display: inline-flex;
  align-items: flex-start;
  gap: var(--mp-space-4);
  height: calc(var(--mp-component-field-labelHeight) + var(--mp-component-field-labelGap));
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-medium);
  line-height: var(--mp-component-field-labelHeight);
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
}

.dv-catalog-cta-link .v-icon {
  margin-top: calc((var(--mp-component-field-labelHeight) - var(--mp-space-14)) / 2);
}

.dv-catalog-cta-link:hover:not(:disabled) {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.dv-catalog-cta-link:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  border-radius: var(--mp-radius-4);
}

.dv-catalog-cta-link:disabled {
  color: var(--text-muted);
  cursor: not-allowed;
}

/* A narrow field (a half-width grid column, a docked drawer) would put the label
   and the action on top of each other: keep the mark, hide the words visually. */
@container (max-width: #{$mp-component-field-actionCollapseWidth}) {
  .dv-catalog-cta-link {
    min-width: calc(var(--mp-component-field-labelHeight) + var(--mp-component-field-labelGap));
    justify-content: center;
  }

  .dv-catalog-cta-link__text {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
}
</style>
