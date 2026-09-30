<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpIconButton from '@/components/MpIconButton.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { useStoreThemesStore } from '@/stores/useStoreThemes'

// The theme editor's own full-page frame (store builder re-skin, docs/rebuild/theme-editor-reskin):
// UAT's 64px top bar and dark activity rail, rebuilt on the design system. Top bar: back to the
// Themes page · store switcher · theme switcher · "Theme actions" kebab (Edit code / View live
// store) · the surface's own actions. Rail: Home (builder) and Theme Settings, on the ink-panel
// surface. Routes are `fullPage`, so the global sidebar and app bar are not on screen.

const props = defineProps<{
  accountId: string
  channelId: string
  themeId: string
  /** The surface on screen — lights the matching rail item. */
  active: 'builder' | 'settings' | 'code'
}>()

defineSlots<{
  /** Right-side toolbar actions (Preview / Save / Publish). */
  actions?(): unknown
  /** The editor body below the top bar, beside the rail. */
  default(): unknown
}>()

const router = useRouter()
const salesChannelsStore = useSalesChannelsStore()
const themesStore = useStoreThemesStore()

const stores = computed(() =>
  salesChannelsStore
    .webStoreChannels(props.accountId)
    .filter((channel) => channel.provider === 'maropost_store_builder')
    .map((channel) => ({ value: channel.id, number: channel.storeNumber, name: channel.name.toLowerCase() })),
)

const themes = computed(() =>
  themesStore.themesForChannel(props.channelId).map((theme) => ({ value: theme.id, name: theme.name, live: theme.status === 'Published' })),
)

const params = computed(() => ({ accountId: props.accountId, channelId: props.channelId, themeId: props.themeId }))
const themesRoute = computed(() => ({ name: 'StoreThemes', params: { accountId: props.accountId, channelId: props.channelId } }))
const builderRoute = computed(() => ({ name: 'ThemeEditorBuilder', params: params.value }))
const settingsRoute = computed(() => ({ name: 'ThemeEditorSettings', params: params.value }))
const codeRoute = computed(() => ({ name: 'ThemeEditorCode', params: params.value }))
// Storybook's router is a single catch-all, so the storefront link degrades to a dead anchor there.
const storefrontHref = computed(() =>
  router.hasRoute('StorefrontHome')
    ? router.resolve({ name: 'StorefrontHome', params: { accountId: props.accountId, channelId: props.channelId } }).href
    : '#',
)

const surfaceRoute = computed(() => (props.active === 'code' ? 'ThemeEditorCode' : props.active === 'settings' ? 'ThemeEditorSettings' : 'ThemeEditorBuilder'))

/** Switching store keeps the surface; the theme becomes that store's current one. */
function switchStore(channelId: string | null) {
  if (!channelId || channelId === props.channelId) return
  const theme = themesStore.themeForChannel(channelId)
  if (!theme) return
  router.push({ name: surfaceRoute.value, params: { accountId: props.accountId, channelId, themeId: theme.id } })
}

function switchTheme(themeId: string | null) {
  if (!themeId || themeId === props.themeId) return
  router.push({ name: surfaceRoute.value, params: { ...params.value, themeId } })
}
</script>

<template>
  <div class="te-frame">
    <header class="te-top" role="banner">
      <MpIconButton icon="chevron-left" size="lg" ariaLabel="Back to themes" tooltipLocation="bottom" :to="themesRoute" />

      <!-- Toolbar pickers: placeholder + aria-label, no static label, no details row (the
           chrome exemption in CLAUDE.md → Form Pattern), and the quiet field treatment —
           value + chevron, no resting border — so the bar reads as chrome, not a form. -->
      <v-select
        :model-value="channelId"
        :items="stores"
        item-title="name"
        item-value="value"
        aria-label="Store"
        hide-details
        class="te-top__select te-top__select--store mp-field-quiet"
        @update:model-value="switchStore"
      >
        <template #selection="{ item }">
          <span v-if="item.raw.number" class="te-top__number">#{{ item.raw.number }}</span>
          <span class="text-truncate">{{ item.raw.name }}</span>
        </template>
        <template #item="{ props: itemProps, item }">
          <v-list-item v-bind="itemProps" title="">
            <span class="te-top__option">
              <span v-if="item.raw.number" class="te-top__number">#{{ item.raw.number }}</span>
              <span>{{ item.raw.name }}</span>
            </span>
          </v-list-item>
        </template>
      </v-select>

      <v-select
        :model-value="themeId"
        :items="themes"
        item-title="name"
        item-value="value"
        aria-label="Theme"
        hide-details
        class="te-top__select te-top__select--theme mp-field-quiet"
        @update:model-value="switchTheme"
      >
        <template #selection="{ item }">
          <span class="te-top__prefix">Theme:</span>
          <span class="text-truncate">{{ item.raw.name }}</span>
        </template>
        <template #item="{ props: itemProps, item }">
          <v-list-item v-bind="itemProps" title="">
            <div class="d-flex align-center ga-2">
              <span>{{ item.raw.name }}</span>
              <MpStatusChip v-if="item.raw.live" status="Live store" type="general" size="sm" />
            </div>
          </v-list-item>
        </template>
      </v-select>

      <v-menu location="bottom start">
        <template #activator="{ props: menu }">
          <MpIconButton v-bind="menu" icon="more-vertical" size="lg" ariaLabel="Theme actions" tooltipLocation="bottom" aria-haspopup="menu" />
        </template>
        <v-list density="compact" role="menu" aria-label="Theme actions" class="te-top__menu">
          <MpMenuItem title="Edit code" icon="file-code" :to="codeRoute" />
          <MpMenuItem title="View live store" icon="globe" :href="storefrontHref" target="_blank" rel="noopener" />
        </v-list>
      </v-menu>

      <div class="flex-grow-1" />

      <div v-if="$slots.actions" class="te-top__actions">
        <slot name="actions" />
      </div>
    </header>

    <div class="te-body">
      <nav class="te-rail mp-ink-panel" aria-label="Theme editor">
        <v-tooltip text="Home" location="right">
          <template #activator="{ props: tip }">
            <router-link
              v-bind="tip"
              :to="builderRoute"
              class="te-rail__item"
              :class="{ 'te-rail__item--active': active === 'builder' }"
              :aria-current="active === 'builder' ? 'page' : undefined"
              aria-label="Home"
            >
              <v-icon size="20">layers</v-icon>
            </router-link>
          </template>
        </v-tooltip>
        <v-tooltip text="Theme settings" location="right">
          <template #activator="{ props: tip }">
            <router-link
              v-bind="tip"
              :to="settingsRoute"
              class="te-rail__item"
              :class="{ 'te-rail__item--active': active === 'settings' }"
              :aria-current="active === 'settings' ? 'page' : undefined"
              aria-label="Theme settings"
            >
              <v-icon size="20">palette</v-icon>
            </router-link>
          </template>
        </v-tooltip>
      </nav>

      <div class="te-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.te-frame {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  background: var(--surface-canvas);
  color: var(--on-surface);
}

/* Top bar — the builder toolbar height (component.editor.topBarHeight = MpBuilderShell's 56). */
.te-top {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  flex-shrink: 0;
  height: var(--mp-component-editor-topBarHeight);
  padding-inline: var(--mp-space-8) var(--mp-space-16);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-primary);
}

/* Pickers size to their value, capped on the toolbar ramp, and give way first
   when the bar is narrow — the actions on the right never do. */
.te-top__select {
  flex: 0 1 auto;
  width: fit-content;
  min-width: 0;
  max-width: var(--mp-component-toolbar-searchMinWidth);
}

.te-top__select :deep(.v-select__selection) {
  display: flex;
  align-items: center;
  gap: var(--mp-space-6);
  min-width: 0;
}

.te-top__option {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-6);
}

/* The store number is metadata, not a link: muted and tabular, not accent. */
.te-top__number {
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.te-top__prefix {
  color: var(--text-secondary);
}

.te-top__actions {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  flex-shrink: 0;
}

.te-top__menu {
  border-radius: var(--mp-component-menu-radius);
  min-width: var(--mp-component-menu-minWidth);
}

.te-body {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}

/* Activity rail — the ink-panel surface, so icon and active tint are declared pairs. */
.te-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mp-space-4);
  flex-shrink: 0;
  width: var(--mp-component-editor-railWidth);
  padding-block: var(--mp-space-8);
  border: 0;
  border-right: 1px solid var(--ink-panel-border);
  border-radius: 0;
}

.te-rail__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-component-control-height);
  height: var(--mp-component-control-height);
  border-radius: var(--mp-component-nav-itemRadius);
  color: var(--ink-panel-muted-fg);
  text-decoration: none;
  transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
}

.te-rail__item:hover,
.te-rail__item:focus-visible {
  color: var(--ink-panel-fg);
  background: color-mix(in oklch, var(--ink-panel-fg) 10%, transparent);
}

.te-rail__item:focus-visible {
  outline: 2px solid var(--ink-panel-accent);
  outline-offset: 2px;
}

.te-rail__item--active,
.te-rail__item--active:hover {
  color: var(--ink-panel-accent);
  background: color-mix(in oklch, var(--ink-panel-accent) 18%, transparent);
}

.te-content {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}
</style>
