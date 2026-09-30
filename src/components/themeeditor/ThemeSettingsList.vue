<script setup lang="ts">
import MpListRow from '@/components/MpListRow.vue'
import { THEME_SETTINGS_ITEMS, type ThemeSettingsItemId } from '@/stores/themeEditorData'

// The Theme Settings panel (store builder re-skin): the list that replaces Layers when the rail's
// palette item is active — one "General" group of setting pages. Selecting one opens its form in
// the inspector; the host owns the selection.
defineProps<{
  selected: ThemeSettingsItemId | null
}>()

const emit = defineEmits<{ select: [id: ThemeSettingsItemId] }>()
</script>

<template>
  <div class="te-settings" aria-label="Theme settings">
    <div class="te-settings__head">
      <h2 class="te-settings__title">Theme settings</h2>
    </div>
    <div class="te-settings__scroll">
      <span class="mp-meta-label te-settings__group">General</span>
      <div role="list">
        <MpListRow
          v-for="item in THEME_SETTINGS_ITEMS"
          :key="item.id"
          clickable
          :title="item.label"
          class="te-settings__item"
          :class="{ 'te-settings__item--active': item.id === selected }"
          role="listitem"
          :aria-current="item.id === selected ? 'true' : undefined"
          @click="emit('select', item.id)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.te-settings {
  display: flex;
  flex-direction: column;
  width: var(--mp-component-editor-layersWidth);
  flex-shrink: 0;
  min-height: 0;
  border-right: 1px solid var(--border-subtle);
  background: var(--surface-primary);
  color: var(--on-surface);
}

.te-settings__head {
  flex-shrink: 0;
  padding: var(--mp-space-16) var(--mp-space-12) var(--mp-space-12);
}

.te-settings__title {
  margin: 0;
  padding-inline: var(--mp-space-4);
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  line-height: 1.3;
}

.te-settings__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 0 var(--mp-space-12) var(--mp-space-16);
}

.te-settings__group {
  display: block;
  padding: var(--mp-space-4) var(--mp-component-listItem-paddingInline) var(--mp-space-8);
  color: var(--text-muted);
}

.te-settings__item {
  margin-inline: 0;
  padding-inline: var(--mp-component-listItem-paddingInline);
  border-radius: var(--mp-component-nav-itemRadius);
}

/* Selected — the recipe's primary tint (E1/E5), the same as a selected Layers row. */
.te-settings__item--active,
.te-settings__item--active:hover {
  background: var(--accent-soft);
  color: var(--accent-on-container);
}
</style>
