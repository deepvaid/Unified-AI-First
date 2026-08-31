<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** Accessible name for the kebab trigger, e.g. "Journey actions". */
  ariaLabel: string
  /** Optional row identity (name/title/number) appended to `ariaLabel` for a per-row accessible name, e.g. "Contact actions for James Anderson". */
  itemLabel?: string
}>()

defineSlots<{
  /**
   * Menu content — `v-list-item`s with `role="menuitem"`. Destructive actions go
   * last, behind a `<v-divider class="my-1" />`, with `class="text-error"`.
   */
  default(): unknown
}>()

const computedAriaLabel = computed(() =>
  props.itemLabel ? `${props.ariaLabel} for ${props.itemLabel}` : props.ariaLabel
)
</script>

<template>
  <v-menu location="bottom end">
    <template #activator="{ props: menu }">
      <!-- The trigger always swallows its click: a kebab press must never also
           activate a clickable host row/card. -->
      <v-btn
        v-bind="menu"
        icon="more-vertical"
        variant="text"
        size="x-small"
        class="text-medium-emphasis mp-row-actions__trigger"
        :aria-label="computedAriaLabel"
        aria-haspopup="menu"
        @click.stop
      ></v-btn>
    </template>
    <v-list density="compact" role="menu" class="mp-row-actions__list">
      <slot />
    </v-list>
  </v-menu>
</template>

<style scoped>
/* The glyph stays compact but the target does not: an x-small icon button paints
   ~28px, under the 40px baseline for icon buttons — extend the hit area to
   control.height without moving any pixels. */
.mp-row-actions__trigger {
  position: relative;
}

.mp-row-actions__trigger::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: var(--mp-component-control-height);
  height: var(--mp-component-control-height);
  transform: translate(-50%, -50%);
}

/* A menu is 12 on the concentric radius scale (P2-6) — stated here so a row
   menu, the folder-select panel and the app-bar menus all read the same.
   Item sizing deliberately has no rule here: the global popover rule in
   global.scss (component.menu.itemHeight/itemPaddingBlock) is the single
   source of menu-item geometry. */
.mp-row-actions__list {
  border-radius: var(--mp-component-menu-radius);
  min-width: var(--mp-component-menu-minWidth);
}
</style>
