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
    <v-list density="compact" min-width="180" class="mp-row-actions__list">
      <slot />
    </v-list>
  </v-menu>
</template>

<style scoped>
/* A menu is 12 on the concentric radius scale (P2-6) — stated here so a row
   menu, the folder-select panel and the app-bar menus all read the same.
   180px is a popover measure, not a spacing step. */
.mp-row-actions__list {
  border-radius: var(--mp-component-menu-radius);
}

.mp-row-actions__list :deep(.v-list-item) {
  min-height: var(--mp-component-listItem-minHeight);
  padding-block: var(--mp-component-listItem-paddingBlock);
  padding-inline: var(--mp-component-listItem-paddingInline);
  border-radius: var(--mp-component-nav-itemRadius);
}
</style>
