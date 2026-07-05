<script setup lang="ts">
defineProps<{
  /** Accessible name for the kebab trigger, e.g. "Journey actions". */
  ariaLabel: string
}>()

defineSlots<{
  /** Menu content — `v-list-item`s (use `class="text-error"` + a leading divider for destructive actions). */
  default(): unknown
}>()
</script>

<template>
  <v-menu>
    <template #activator="{ props: menu }">
      <v-btn
        v-bind="menu"
        icon="more-vertical"
        variant="text"
        size="x-small"
        color="medium-emphasis"
        :aria-label="ariaLabel"
      ></v-btn>
    </template>
    <v-list density="compact" min-width="180">
      <slot />
    </v-list>
  </v-menu>
</template>
