<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { useStoreThemesStore } from '@/stores/useStoreThemes'
import { useStorefrontStore } from '@/stores/useStorefront'
import type { StoreTheme } from '@/stores/themeBuilderData'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import StorefrontPreview from '@/components/saleschannels/StorefrontPreview.vue'

// Store editor ▸ Themes (UAT parity — Neelam-Store, docs/rebuild/neelam-store/CRAWL-SUMMARY.md):
// the current theme with Show store, and the themes installed on the store, each opening
// in the theme builder. Upload theme, the row menus and Themes In Focus follow once the
// admin can be crawled — they aren't guessed here.

const route = useRoute()
const router = useRouter()
const salesChannelsStore = useSalesChannelsStore()
const themesStore = useStoreThemesStore()
const storefronts = useStorefrontStore()

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

const channelId = computed(() => {
  const value = route.params.channelId
  return (Array.isArray(value) ? value[0] : value) ?? ''
})

const channel = computed(() => salesChannelsStore.getChannel(accountId.value, channelId.value))
const previewHeader = computed(() => storefronts.previewHeaderFor(channel.value))

const installed = computed(() => themesStore.themesForChannel(channelId.value))
const current = computed(() => installed.value.find((theme) => theme.status === 'Published'))

const search = ref('')
const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return term ? installed.value.filter((theme) => theme.name.toLowerCase().includes(term)) : installed.value
})

const storefrontHref = computed(() => router.resolve({ name: 'StorefrontHome', params: { accountId: accountId.value, channelId: channelId.value } }).href)

function builderRoute(theme: StoreTheme) {
  return { name: 'StoreThemeBuilder', params: { accountId: accountId.value, channelId: channelId.value }, query: { theme: theme.id } }
}

/**
 * The theme editor re-skin (docs/rebuild/theme-editor-reskin): the current UAT builder and code
 * editor rebuilt on the design system. The row menu mirrors the admin's "Customize" / "Edit code"
 * entries; the pencil keeps opening the AI-first builder so both are reachable side by side.
 */
function editorRoute(theme: StoreTheme, name: 'ThemeEditorBuilder' | 'ThemeEditorCode') {
  return { name, params: { accountId: accountId.value, channelId: channelId.value, themeId: theme.id } }
}

const DAY = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const TIME = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

/** "Aug 26, 2026" */
function day(iso: string): string {
  return DAY.format(new Date(iso))
}

/** "Aug 26, 2026 at 04:18 AM", as the store's admin writes it. */
function lastUpdate(iso: string): string {
  const date = new Date(iso)
  return `${DAY.format(date)} at ${TIME.format(date)}`
}

const headers = [
  { title: 'Theme', key: 'preview', sortable: false },
  { title: 'Theme name', key: 'name', sortable: true },
  { title: 'Created by', key: 'createdBy', sortable: true },
  { title: 'Last update', key: 'updatedAt', sortable: true },
  { title: '', key: 'actions', align: 'end' as const, sortable: false },
]
</script>

<template>
  <div v-if="!channel" class="h-100 d-flex align-center justify-center">
    <v-card variant="flat" border rounded="lg" class="pa-6" max-width="420">
      <MpEmptyState
        icon="store"
        title="Sales channel not found"
        description="The store you're trying to manage doesn't exist or was removed."
        action-label="Back to sales channels"
        @action="router.push({ name: 'SalesChannels', params: { accountId } })"
      />
    </v-card>
  </div>

  <div v-else class="d-flex flex-column gap-5">
    <MpPageHeader title="Themes" :subtitle="`Storefront themes for ${channel.name}`" />

    <v-card variant="flat" border rounded="lg" class="store-themes__current">
      <MpSectionHeader title="Current theme" :heading-level="2" />
      <template v-if="current">
        <StorefrontPreview :sections="current.templates.home" :styles="current.styles" :brand="previewHeader.brand" :menu="previewHeader.menu" />
        <div class="store-themes__current-bar">
          <div class="min-width-0">
            <div class="text-subtitle-1 font-weight-medium">{{ current.name }}</div>
            <div class="text-body-2 text-medium-emphasis">Last update: {{ day(current.updatedAt) }}</div>
          </div>
          <v-btn variant="outlined" class="text-none" prepend-icon="external-link" :href="storefrontHref" target="_blank" rel="noopener">
            Show store
          </v-btn>
        </div>
      </template>
      <MpEmptyState
        v-else
        icon="palette"
        title="No theme selected"
        description="Choose a theme from the library or create a new one to get started."
        :heading-level="3"
      />
    </v-card>

    <v-card variant="flat" border rounded="lg" class="d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Themes installed"
        search-placeholder="Search themes…"
        :total-count="filtered.length"
      />

      <v-data-table
        :headers="headers"
        :items="filtered"
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="15"
      >
        <template v-slot:header.actions>
          <span class="d-sr-only">Actions</span>
        </template>

        <template v-slot:item.preview>
          <v-avatar size="40" rounded="lg" color="primary" variant="tonal">
            <v-icon size="18">palette</v-icon>
          </v-avatar>
        </template>

        <template v-slot:item.name="{ item }">
          <div class="py-2">
            <div class="font-weight-medium">{{ item.name }}</div>
            <div v-if="item.availableVersion" class="text-caption text-medium-emphasis">
              Theme version v.{{ item.availableVersion }} available
            </div>
          </div>
        </template>

        <template v-slot:item.createdBy="{ item }">
          <span class="text-body-2">{{ item.createdBy ?? '—' }}</span>
        </template>

        <template v-slot:item.updatedAt="{ item }">
          <span class="text-body-2">{{ lastUpdate(item.updatedAt) }}</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex align-center justify-end ga-1">
            <v-btn icon variant="text" size="small" :to="builderRoute(item)" :aria-label="`Edit ${item.name} in the theme builder`">
              <v-icon size="18">pencil</v-icon>
              <v-tooltip activator="parent" location="top">Edit theme</v-tooltip>
            </v-btn>
            <MpRowActionsMenu ariaLabel="Theme actions" :itemLabel="item.name">
              <MpMenuItem title="Customize" icon="layout-template" :to="editorRoute(item, 'ThemeEditorBuilder')" />
              <MpMenuItem title="Edit code" icon="file-code" :to="editorRoute(item, 'ThemeEditorCode')" />
            </MpRowActionsMenu>
          </div>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="palette"
            :title="search ? 'No themes match your search' : 'No themes installed'"
            :description="search ? 'Try another theme name.' : 'Themes you install on this store appear here.'"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<style scoped>
.store-themes__current {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-card-gap);
  padding: var(--mp-component-card-padding);
}

.store-themes__current-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-16);
}

.min-width-0 {
  min-width: 0;
}
</style>
