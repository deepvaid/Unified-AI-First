<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { SETTINGS_GROUPS, type SettingsGroup, type SettingsItem } from './settingsMenu'

const route = useRoute()
const query = ref('')

const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? '2000290'
})

const filteredGroups = computed<SettingsGroup[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return SETTINGS_GROUPS
  return SETTINGS_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.label.toLowerCase().includes(q)),
    }))
    .filter((group) => group.items.length > 0)
})

function isActive(item: SettingsItem): boolean {
  return route.name === item.routeName
}

function routeTo(item: SettingsItem) {
  return { name: item.routeName, params: { accountId: accountId.value } }
}
</script>

<template>
  <aside class="settings-sidebar" aria-label="Settings navigation">
    <div class="settings-sidebar__title">Settings</div>
    <div class="settings-sidebar__search">
      <v-icon size="16" class="settings-sidebar__search-icon">search</v-icon>
      <input
        v-model="query"
        type="text"
        class="settings-sidebar__search-input"
        placeholder="Search Settings"
        aria-label="Search settings"
      />
    </div>

    <nav class="settings-sidebar__nav">
      <div v-if="filteredGroups.length === 0" class="settings-sidebar__empty">
        No matching settings
      </div>

      <div v-for="group in filteredGroups" :key="group.title" class="settings-sidebar__group">
        <div class="settings-sidebar__group-title">{{ group.title }}</div>
        <router-link
          v-for="item in group.items"
          :key="item.slug"
          :to="routeTo(item)"
          class="settings-sidebar__item"
          :class="{ 'settings-sidebar__item--active': isActive(item) }"
          :aria-current="isActive(item) ? 'page' : undefined"
        >
          {{ item.label }}
        </router-link>
      </div>
    </nav>
  </aside>
</template>

<style scoped lang="scss">
.settings-sidebar {
  flex-shrink: 0;
  width: 260px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px 12px 16px 12px;
  border-right: 1px solid var(--hairline);
  align-self: stretch;
  min-height: 0;
  background: var(--surface-1);
}

.settings-sidebar__title {
  padding: 0 10px 2px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--ink);
}

.settings-sidebar__search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 8px 4px;
  padding: 0 10px;
  height: 34px;
  border: 1px solid var(--hairline);
  border-radius: 10px;
  background: var(--surface-1);
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.settings-sidebar__search:focus-within {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.15);
}

.settings-sidebar__search-icon {
  color: var(--muted);
  flex-shrink: 0;
}

.settings-sidebar__search-input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  font-size: 13px;
  font-family: inherit;
  color: var(--ink);
}

.settings-sidebar__search-input::placeholder {
  color: var(--muted);
}

.settings-sidebar__nav {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  padding-right: 4px;
}

.settings-sidebar__group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.settings-sidebar__group-title {
  padding: 6px 12px 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.settings-sidebar__item {
  position: relative;
  display: block;
  padding: 7px 12px;
  border-radius: 6px;
  color: var(--ink);
  font-size: 13.5px;
  font-weight: 500;
  text-decoration: none;
  transition: background 120ms ease, color 120ms ease;
}

.settings-sidebar__item:hover {
  background: var(--surface-2);
}

.settings-sidebar__item:focus-visible {
  outline: 2px solid color-mix(in oklch, rgb(var(--v-theme-primary)) 42%, transparent);
  outline-offset: 2px;
}

.settings-sidebar__item--active {
  background: var(--surface-2);
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

.settings-sidebar__item--active::before {
  content: '';
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: 0;
  width: 2px;
  border-radius: 0 2px 2px 0;
  background: rgb(var(--v-theme-primary));
}

.settings-sidebar__empty {
  padding: 12px;
  font-size: 12.5px;
  color: var(--muted);
  text-align: center;
}

@media (max-width: 900px) {
  .settings-sidebar {
    width: 100%;
    max-height: 320px;
    border-right: 0;
    border-bottom: 1px solid var(--hairline);
  }
}

@media (max-width: 640px) {
  .settings-sidebar {
    padding: 16px 12px 12px;
  }
}
</style>
