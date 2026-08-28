<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, type RouteLocationRaw } from 'vue-router'

// In-content section rail for shell layouts (store editor, Settings-style
// workspaces): back link, optional entity identity + switcher, optional search,
// grouped section links with icons/counts and an active accent bar, and a
// #footer slot for actions. Sits beside the global AppSidebar — never replaces it.

export interface MpSectionRailItem {
  slug: string
  label: string
  /** Lucide icon name (kebab-case). Omit for text-only rows (Settings flavor). */
  icon?: string
  to: RouteLocationRaw
  /** Route names that keep this item highlighted (the section's children/editors). */
  match?: string[]
  /** Optional count chip shown at the end of the row. */
  count?: number
  /** Renders an external-link glyph after the label. */
  external?: boolean
}

export interface MpSectionRailGroup {
  /** Optional uppercase group heading. */
  title?: string
  items: MpSectionRailItem[]
}

export interface MpSectionRailSwitchOption {
  id: string
  label: string
  caption?: string
  icon?: string
}

const props = withDefaults(
  defineProps<{
    /** Accessible name for the rail's nav landmark. */
    ariaLabel: string
    groups: MpSectionRailGroup[]
    /** Plain heading (module flavor, e.g. "Settings"). */
    title?: string
    backTo?: RouteLocationRaw
    backLabel?: string
    /** Entity identity card (entity flavor, e.g. a store). */
    identity?: { name: string; caption?: string; icon?: string }
    /** Other entities the user can jump to; renders the switcher menu on the identity card. */
    switcherOptions?: MpSectionRailSwitchOption[]
    switcherLabel?: string
    searchable?: boolean
    searchPlaceholder?: string
  }>(),
  {
    backLabel: 'Back',
    switcherLabel: 'Switch',
    searchable: false,
    searchPlaceholder: 'Search',
  },
)

const emit = defineEmits<{
  /** A switcher option was picked. */
  switch: [id: string]
}>()

defineSlots<{
  /** Pinned below the section list — actions ("button etc."), e.g. a primary CTA. */
  footer?(): unknown
}>()

const route = useRoute()
const query = ref('')

const filteredGroups = computed<MpSectionRailGroup[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.groups
  return props.groups
    .map((group) => ({ ...group, items: group.items.filter((item) => item.label.toLowerCase().includes(q)) }))
    .filter((group) => group.items.length > 0)
})

function isActive(item: MpSectionRailItem): boolean {
  return typeof route.name === 'string' && (item.match?.includes(route.name) ?? false)
}
</script>

<template>
  <aside class="mp-section-rail" :aria-label="ariaLabel">
    <router-link v-if="backTo" class="mp-section-rail__back" :to="backTo">
      <v-icon size="14">arrow-left</v-icon>
      {{ backLabel }}
    </router-link>

    <div v-if="title" class="mp-section-rail__title">{{ title }}</div>

    <div v-if="identity" class="mp-section-rail__identity">
      <v-avatar size="32" rounded="lg" color="primary" variant="tonal">
        <v-icon size="18">{{ identity.icon ?? 'globe' }}</v-icon>
      </v-avatar>
      <div class="mp-section-rail__identity-copy">
        <div class="mp-section-rail__identity-name text-truncate">{{ identity.name }}</div>
        <div v-if="identity.caption" class="mp-section-rail__identity-caption text-truncate">{{ identity.caption }}</div>
      </div>
      <v-menu v-if="switcherOptions && switcherOptions.length > 0" location="bottom end">
        <template v-slot:activator="{ props: menuProps }">
          <v-btn v-bind="menuProps" icon="chevrons-up-down" variant="text" size="x-small" :aria-label="switcherLabel" />
        </template>
        <v-list density="compact" rounded="lg">
          <v-list-subheader>{{ switcherLabel }}</v-list-subheader>
          <v-list-item
            v-for="option in switcherOptions"
            :key="option.id"
            :title="option.label"
            :subtitle="option.caption"
            :prepend-icon="option.icon"
            @click="emit('switch', option.id)"
          />
        </v-list>
      </v-menu>
    </div>

    <div v-if="searchable" class="mp-section-rail__search">
      <v-icon size="16" class="mp-section-rail__search-icon">search</v-icon>
      <input
        v-model="query"
        type="text"
        class="mp-section-rail__search-input"
        :placeholder="searchPlaceholder"
        :aria-label="searchPlaceholder"
      />
    </div>

    <nav class="mp-section-rail__nav">
      <div v-if="filteredGroups.length === 0" class="mp-section-rail__empty">No matches</div>

      <div v-for="(group, index) in filteredGroups" :key="group.title ?? index" class="mp-section-rail__group">
        <div v-if="group.title" class="mp-section-rail__group-title">{{ group.title }}</div>
        <router-link
          v-for="item in group.items"
          :key="item.slug"
          :to="item.to"
          class="mp-section-rail__item"
          :class="{ 'mp-section-rail__item--active': isActive(item) }"
          :aria-current="isActive(item) ? 'page' : undefined"
        >
          <v-icon v-if="item.icon" size="16" class="mp-section-rail__item-icon">{{ item.icon }}</v-icon>
          <span class="mp-section-rail__item-label text-truncate">{{ item.label }}</span>
          <v-icon v-if="item.external" size="14" class="mp-section-rail__item-external">external-link</v-icon>
          <span v-if="item.count !== undefined" class="mp-section-rail__item-count">{{ item.count }}</span>
        </router-link>
      </div>
    </nav>

    <div v-if="$slots.footer" class="mp-section-rail__footer">
      <slot name="footer" />
    </div>
  </aside>
</template>

<style scoped lang="scss">
/* Nav-item geometry comes from `component.listItem.*` — the SAME tokens MpListRow,
   AppSidebar and AppBar's menu rows use, so every nav row in the product sits on
   one 40px baseline (P4-7/P4-9). This rail used to run at 8px block padding,
   AppSidebar at 10 and the old SettingsSidebar at 7. */
.mp-section-rail {
  flex-shrink: 0;
  width: var(--mp-layout-sectionRailWidth);
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-12);
  padding: var(--mp-component-card-paddingCompact);
  border-right: 1px solid var(--border-subtle);
  align-self: stretch;
  min-height: 0;
  background: var(--surface-primary);
}

.mp-section-rail__back {
  display: flex;
  align-items: center;
  gap: var(--mp-space-6);
  padding: var(--mp-space-4) var(--mp-space-10);
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-medium);
  color: var(--muted);
  text-decoration: none;
  border-radius: var(--mp-component-nav-itemRadius);
  transition: color 120ms ease, background 120ms ease;
}

.mp-section-rail__back:hover {
  color: var(--text-primary);
  background: var(--surface-secondary);
}

.mp-section-rail__title {
  padding: 0 var(--mp-space-10);
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-bold);
  letter-spacing: 0.02em;
  color: var(--text-primary);
}

.mp-section-rail__identity {
  display: flex;
  align-items: center;
  gap: var(--mp-space-10);
  margin: 0 var(--mp-space-4);
  padding: var(--mp-space-10);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-component-input-radius);
  background: var(--surface-primary);
}

.mp-section-rail__identity-copy {
  flex: 1;
  min-width: 0;
}

.mp-section-rail__identity-name {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-bold);
  color: var(--text-primary);
}

.mp-section-rail__identity-caption {
  font-size: var(--mp-fontSize-12);
  color: var(--muted);
}

/* The rail's search is a control, so it takes the shared 40px control height —
   the same one the table toolbar's search and every button resolve to. Was 34. */
.mp-section-rail__search {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  margin: 0 var(--mp-space-4);
  padding: 0 var(--mp-space-10);
  height: var(--mp-component-control-height);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-component-input-radius);
  background: var(--surface-primary);
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.mp-section-rail__search:focus-within {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.15);
}

.mp-section-rail__search-icon {
  color: var(--muted);
  flex-shrink: 0;
}

.mp-section-rail__search-input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  font-size: var(--mp-fontSize-13);
  font-family: inherit;
  color: var(--text-primary);
}

.mp-section-rail__search-input::placeholder {
  color: var(--muted);
}

.mp-section-rail__nav {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-nav-groupGap);
  overflow-y: auto;
  padding-right: var(--mp-space-4);
}

.mp-section-rail__group {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-2);
}

.mp-section-rail__group-title {
  padding: var(--mp-space-6) var(--mp-component-listItem-paddingInline) var(--mp-space-4);
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-bold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.mp-section-rail__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--mp-component-listItem-gap);
  min-height: var(--mp-component-listItem-minHeight);
  padding-block: var(--mp-component-listItem-paddingBlock);
  padding-inline: var(--mp-component-listItem-paddingInline);
  border-radius: var(--mp-component-nav-itemRadius);
  color: var(--text-primary);
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  text-decoration: none;
  transition: background 120ms ease, color 120ms ease;
}

.mp-section-rail__item-icon {
  color: var(--muted);
  flex-shrink: 0;
  transition: color 120ms ease;
}

.mp-section-rail__item-label {
  flex: 1;
  min-width: 0;
}

.mp-section-rail__item-external {
  color: var(--muted);
  flex-shrink: 0;
}

.mp-section-rail__item-count {
  flex-shrink: 0;
  min-width: var(--mp-space-20);
  padding: var(--mp-space-2) var(--mp-space-6);
  border-radius: var(--mp-radius-full);
  background: var(--surface-secondary);
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-semibold);
  text-align: center;
  color: var(--muted);
}

.mp-section-rail__item:hover {
  background: var(--surface-secondary);
}

.mp-section-rail__item:focus-visible {
  outline: 2px solid color-mix(in oklch, rgb(var(--v-theme-primary)) 42%, transparent);
  outline-offset: 2px;
}

.mp-section-rail__item--active {
  background: var(--surface-secondary);
  color: rgb(var(--v-theme-primary));
  font-weight: var(--mp-fontWeight-semibold);
}

.mp-section-rail__item--active .mp-section-rail__item-icon {
  color: rgb(var(--v-theme-primary));
}

/* The active accent bar. Its 2px width and 2px cap radius are hairline geometry,
   not spacing (Phase 2 exemption); only the inset it is held off the row's ends
   by is a token — shared with every other rail so the mark reads identically. */
.mp-section-rail__item--active::before {
  content: '';
  position: absolute;
  top: var(--mp-component-nav-activeBarInset);
  bottom: var(--mp-component-nav-activeBarInset);
  left: 0;
  width: 2px;
  border-radius: 0 2px 2px 0;
  background: rgb(var(--v-theme-primary));
}

.mp-section-rail__empty {
  padding: var(--mp-component-card-paddingCompact);
  font-size: var(--mp-fontSize-13);
  color: var(--muted);
  text-align: center;
}

.mp-section-rail__footer {
  margin: 0 var(--mp-space-4);
  padding-top: var(--mp-space-10);
  border-top: 1px solid var(--border-subtle);
}

@media (max-width: 900px) {
  .mp-section-rail {
    width: 100%;
    /* Scroll measure for the collapsed rail, not a spacing step. */
    max-height: 320px;
    border-right: 0;
    border-bottom: 1px solid var(--border-subtle);
  }
}

@media (max-width: 640px) {
  .mp-section-rail {
    padding: var(--mp-component-card-paddingCompact);
  }
}
</style>
