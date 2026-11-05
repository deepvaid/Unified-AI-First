<script setup lang="ts">
import type { TagColor } from '@/service/model'

// A user-defined tag (service desk tags, today): a soft pill in one of the eight
// tag swatches. Categorical, not a status — workflow states stay MpStatusChip.
//
// Each colour is one `color.{light,dark}.tag.<hue>.container` / `onContainer`
// pair: the chip paints the fill AND the ink from the same pair, so it never
// inherits a text colour that was chosen for some other surface.

withDefaults(defineProps<{
  /** Tag name. Long names truncate with an ellipsis; the full name is the `title`. */
  name: string
  /** One of the eight tag swatches (`TAG_COLORS`). */
  color: TagColor
  /** Pill height on the shared chip ramp: sm 20 (default, tables and lists) · md 24. */
  size?: 'sm' | 'md'
  /** Adds a remove button (`aria-label="Remove tag <name>"`) that emits `remove`. */
  removable?: boolean
}>(), {
  size: 'sm',
  removable: false,
})

defineEmits<{ remove: [] }>()
</script>

<template>
  <span class="mp-tag-chip" :class="[`mp-tag-chip--${color}`, `mp-tag-chip--${size}`, { 'mp-tag-chip--removable': removable }]">
    <span class="mp-tag-chip__name" :title="name">{{ name }}</span>
    <button
      v-if="removable"
      type="button"
      class="mp-tag-chip__remove"
      :aria-label="`Remove tag ${name}`"
      @click="$emit('remove')"
    >
      <v-icon icon="x" aria-hidden="true" />
    </button>
  </span>
</template>

<style scoped>
.mp-tag-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-2);
  max-width: 100%;
  min-width: 0;
  height: var(--mp-component-chip-height-sm);
  padding-inline: var(--mp-component-chip-paddingInline);
  border-radius: var(--mp-component-chip-radius);
  background: var(--mp-tag-chip-bg);
  color: var(--mp-tag-chip-fg);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-medium);
  line-height: var(--mp-lineHeight-tight);
  white-space: nowrap;
  vertical-align: middle;
}

.mp-tag-chip--md {
  height: var(--mp-component-chip-height-md);
}

.mp-tag-chip__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* The remove mark tucks into the end padding so a removable chip is no wider
   than it needs to be; its hit area grows past the painted glyph instead. */
.mp-tag-chip--removable {
  padding-inline-end: var(--mp-space-2);
}

.mp-tag-chip__remove {
  position: relative;
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-16);
  height: var(--mp-space-16);
  padding: 0;
  border: 0;
  border-radius: var(--mp-radius-4);
  background: transparent;
  color: var(--mp-tag-chip-fg);
  font-size: var(--mp-fontSize-14);
  cursor: pointer;
}

/* 24px target (WCAG 2.5.8) without moving any pixels. */
.mp-tag-chip__remove::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: var(--mp-space-24);
  height: var(--mp-space-24);
  transform: translate(-50%, -50%);
}

.mp-tag-chip__remove:hover {
  background: color-mix(in srgb, var(--mp-tag-chip-fg) 14%, transparent);
}

/* The focus ring itself is the global `button:focus-visible` rule (global.scss). */
.mp-tag-chip__remove :deep(.v-icon) {
  font-size: inherit;
  color: inherit;
}

/* ── Swatches — theme-aware aliases from mp-theme-aliases.css ─────────────── */
.mp-tag-chip--sky    { --mp-tag-chip-bg: var(--tag-sky-container);    --mp-tag-chip-fg: var(--tag-sky-on-container); }
.mp-tag-chip--green  { --mp-tag-chip-bg: var(--tag-green-container);  --mp-tag-chip-fg: var(--tag-green-on-container); }
.mp-tag-chip--slate  { --mp-tag-chip-bg: var(--tag-slate-container);  --mp-tag-chip-fg: var(--tag-slate-on-container); }
.mp-tag-chip--amber  { --mp-tag-chip-bg: var(--tag-amber-container);  --mp-tag-chip-fg: var(--tag-amber-on-container); }
.mp-tag-chip--violet { --mp-tag-chip-bg: var(--tag-violet-container); --mp-tag-chip-fg: var(--tag-violet-on-container); }
.mp-tag-chip--blue   { --mp-tag-chip-bg: var(--tag-blue-container);   --mp-tag-chip-fg: var(--tag-blue-on-container); }
.mp-tag-chip--orange { --mp-tag-chip-bg: var(--tag-orange-container); --mp-tag-chip-fg: var(--tag-orange-on-container); }
.mp-tag-chip--red    { --mp-tag-chip-bg: var(--tag-red-container);    --mp-tag-chip-fg: var(--tag-red-on-container); }
</style>
