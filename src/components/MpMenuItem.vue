<script setup lang="ts">
// The one action-menu item (GAPS §1, closed 2026-08-30).
//
// `role="menuitem"` inside MpRowActionsMenu's `role="menu"` panel used to be a
// call-site convention — written by hand on ~200 v-list-items and forgotten on
// the next new menu. This wrapper owns the contract instead: the role, the
// verb-first title, an optional leading icon, and the one danger treatment
// (`text-error`; the separating divider stays explicit in the menu, before the
// destructive group).
//
// Everything else v-list-item accepts (disabled, subtitle, @click, to, …) falls
// through via attrs; slots pass through untouched. A disabled item also gets
// `aria-disabled`, which v-list-item doesn't set: without it a screen reader
// doesn't hear "dimmed", and the greyed label isn't recognised as an inactive
// control (WCAG 1.4.3 exempts those from contrast).
import { computed, useAttrs } from 'vue'

const attrs = useAttrs()
const disabled = computed(() => attrs.disabled === '' || attrs.disabled === true || attrs.disabled === 'true')

withDefaults(defineProps<{
  /** Verb-first label ("Edit", "Duplicate", "Delete"). */
  title: string
  /** Optional leading Lucide icon name. */
  icon?: string
  /** Destructive action: renders the error treatment. Place last, after a `<v-divider class="my-1" />`. */
  danger?: boolean
}>(), {
  danger: false,
})
</script>

<template>
  <v-list-item
    role="menuitem"
    :aria-disabled="disabled ? 'true' : undefined"
    :title="title"
    :prepend-icon="icon"
    :class="{ 'text-error': danger }"
  >
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps" />
    </template>
  </v-list-item>
</template>
