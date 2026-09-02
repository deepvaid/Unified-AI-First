<script setup lang="ts">
export interface MpSegmentedItem {
  value: string
  /**
   * Segment text. For icon segments it becomes the `aria-label` instead of
   * visible text, so it is required whenever `icon` is set.
   */
  label?: string
  /** Lucide icon name. An icon segment renders icon-only (square). */
  icon?: string
  disabled?: boolean
  /** Wraps the segment in a v-tooltip — pass the label here too for icon segments. */
  tooltip?: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string | null
    items: MpSegmentedItem[]
    /** md track = control.height (40) so it aligns with buttons; sm (32) for dense chrome. */
    size?: 'sm' | 'md'
    /** When false, clicking the active segment clears the selection (model → null). */
    mandatory?: boolean
    /** Accessible name for the group, e.g. "Preview device". */
    ariaLabel: string
  }>(),
  { size: 'md', mandatory: true }
)

const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>()

function onUpdate(value: unknown) {
  emit('update:modelValue', (value as string | undefined) ?? null)
}
</script>

<template>
  <v-btn-toggle
    class="mp-segmented"
    :class="{ 'mp-segmented--sm': props.size === 'sm' }"
    :model-value="props.modelValue ?? undefined"
    :mandatory="props.mandatory"
    :aria-label="props.ariaLabel"
    :divided="false"
    @update:model-value="onUpdate"
  >
    <!-- `icon` stays a boolean here: passing an icon NAME plus a default slot
         makes Vuetify render the (empty) slot instead of the icon. -->
    <template v-for="item in props.items" :key="item.value">
      <v-tooltip v-if="item.tooltip" :text="item.tooltip" location="bottom">
        <template #activator="{ props: tip }">
          <v-btn
            v-bind="tip"
            :value="item.value"
            :icon="Boolean(item.icon)"
            :disabled="item.disabled"
            :aria-label="item.icon ? item.label : undefined"
            :aria-pressed="props.modelValue === item.value"
            variant="text"
          >
            <v-icon v-if="item.icon">{{ item.icon }}</v-icon>
            <template v-else>{{ item.label }}</template>
          </v-btn>
        </template>
      </v-tooltip>
      <v-btn
        v-else
        :value="item.value"
        :icon="Boolean(item.icon)"
        :disabled="item.disabled"
        :aria-label="item.icon ? item.label : undefined"
        :aria-pressed="props.modelValue === item.value"
        variant="text"
      >
        <v-icon v-if="item.icon">{{ item.icon }}</v-icon>
        <template v-else>{{ item.label }}</template>
      </v-btn>
    </template>
  </v-btn-toggle>
</template>

<style scoped>
/* Padded track + pill segments on component.segmented.* — extracted from the
   app-bar theme switcher (its geometry was already on scale stops: md track
   40 = 32 thumb + 4 padding either side). The global button-group
   normalization in global.scss excludes .mp-segmented; this component owns
   its geometry completely. */
.mp-segmented {
  flex-shrink: 0;
  align-items: center;
  min-height: var(--mp-component-segmented-height-md);
  /* Every property the global VBtn default writes as an INLINE style
     (min-height, border-radius, padding-inline — maropostDefaults in
     plugins/maropostTheme.ts) needs !important below: inline styles outrank
     scoped class rules. Same story for VBtnGroup's own fixed height. */
  height: auto !important;
  padding: var(--mp-component-segmented-padding);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-component-segmented-radius);
  background: var(--surface-secondary);
  overflow: visible;
}

.mp-segmented :deep(.v-btn) {
  height: var(--mp-component-segmented-itemHeight-md) !important;
  min-height: 0 !important;
  min-width: var(--mp-component-segmented-itemHeight-md) !important;
  padding-inline: var(--mp-space-12) !important;
  border-radius: var(--mp-radius-full) !important;
  font-size: var(--mp-fontSize-13) !important;
  font-weight: var(--mp-fontWeight-medium);
  color: var(--muted);
}

/* Icon segments are square. */
.mp-segmented :deep(.v-btn--icon) {
  width: var(--mp-component-segmented-itemHeight-md) !important;
  padding: 0 !important;
}

.mp-segmented :deep(.v-btn .v-icon) {
  font-size: var(--mp-fontSize-18);
  line-height: 1;
  block-size: 1em;
  inline-size: 1em;
}

.mp-segmented :deep(.v-btn--active) {
  background: var(--surface-primary);
  color: var(--text-primary);
  box-shadow: 0 1px 3px color-mix(in oklch, var(--text-primary) 8%, transparent);
}

/* Vuetify paints selection through the overlay too — the pill fill above is
   the selection treatment, so the overlay only ever shows hover/focus. */
.mp-segmented :deep(.v-btn--active .v-btn__overlay) {
  opacity: 0;
}

/* Dark mode: --surface-primary matches the track and the ink-derived shadow
   inverts to a glow, so the active pill would read as inset rather than
   raised. --surface-overlay is lighter than the track's --surface-secondary
   in dark, which keeps the raised look. */
.v-theme--maropostDark .mp-segmented :deep(.v-btn--active) {
  background: var(--surface-overlay);
  box-shadow: var(--elevation-raised);
}

.mp-segmented--sm {
  min-height: var(--mp-component-segmented-height-sm);
}

.mp-segmented--sm :deep(.v-btn) {
  height: var(--mp-component-segmented-itemHeight-sm) !important;
  min-width: var(--mp-component-segmented-itemHeight-sm) !important;
  padding-inline: var(--mp-space-8) !important;
  font-size: var(--mp-fontSize-12) !important;
}

.mp-segmented--sm :deep(.v-btn--icon) {
  width: var(--mp-component-segmented-itemHeight-sm) !important;
}

.mp-segmented--sm :deep(.v-btn .v-icon) {
  font-size: var(--mp-fontSize-16);
}
</style>
