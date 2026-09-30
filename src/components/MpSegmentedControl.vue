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
  /* The track's hairline is an INSET shadow, not a border: a 1px border added
     2px to the track, so md measured 42 against its 40 token and sat off the
     baseline it exists to share with 40px buttons and fields (sm: 34 vs 32). */
  border: 0;
  box-shadow: inset 0 0 0 1px var(--border-subtle);
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

/* The selected segment is a raised thumb: the surface fill on the track plus
   --elevation-thumb. The thumb and track differ by only ~1.2:1, so the shadow is
   what draws the selected edge — the old 8% ink blur left it nearly invisible.
   Its ink is the group's `color` (primary, the VBtnToggle default), which
   Vuetify applies as !important `text-primary` — so no colour is declared here. */
.mp-segmented :deep(.v-btn--active) {
  background: var(--surface-primary);
  box-shadow: var(--elevation-thumb);
}

/* Vuetify paints selection through the overlay too — the pill fill above is
   the selection treatment, so the overlay only ever shows hover/focus. */
.mp-segmented :deep(.v-btn--active .v-btn__overlay) {
  opacity: 0;
}

/* Dark mode: --surface-primary matches the track, so the thumb takes
   --surface-overlay (lighter than the dark track); --elevation-thumb already
   resolves to its dark twin. */
.v-theme--maropostDark .mp-segmented :deep(.v-btn--active) {
  background: var(--surface-overlay);
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
