<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** Accessible name for the kebab trigger, e.g. "Journey actions". */
  ariaLabel: string
  /** Optional row identity (name/title/number) appended to `ariaLabel` for a per-row accessible name, e.g. "Contact actions for James Anderson". */
  itemLabel?: string
}>()

defineSlots<{
  /** Menu content — `v-list-item`s (use `class="text-error"` + a leading divider for destructive actions). */
  default(): unknown
}>()

const computedAriaLabel = computed(() =>
  props.itemLabel ? `${props.ariaLabel} for ${props.itemLabel}` : props.ariaLabel
)
</script>

<template>
  <v-menu>
    <template #activator="{ props: menu }">
      <v-btn
        v-bind="menu"
        icon="more-vertical"
        variant="text"
        size="x-small"
        class="text-medium-emphasis"
        :aria-label="computedAriaLabel"
      ></v-btn>
    </template>
    <v-list density="compact" min-width="180">
      <slot />
    </v-list>
  </v-menu>
</template>
