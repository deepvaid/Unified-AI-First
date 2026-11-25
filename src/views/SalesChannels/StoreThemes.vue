<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import type { SalesChannel } from '@/stores/useSalesChannels'
import { useStoreThemesStore } from '@/stores/useStoreThemes'
import { useStorefrontStore } from '@/stores/useStorefront'
import { useCommerceStore } from '@/stores/useCommerce'
import { useDemoStores } from '@/stores/useDemoStores'
import { browserStorage } from '@/stores/demoKeep'
import { useToast } from '@/composables/useToast'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import type { HideBelow } from '@/composables/useResponsiveTableHeaders'
import { previewProducts } from '@/views/Storefront/storefrontCatalog'
import { DEMO_STORES } from '@/storefront/demoStores'
import type { DemoStoreBlueprint } from '@/storefront/demoStores'
import { readInstalled } from '@/storefront/demoStores/install'
import { gridSettings } from '@/storefront/listing'
import type { StoreTheme } from '@/stores/themeBuilderData'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpAlert from '@/components/MpAlert.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import StorefrontPreview from '@/components/saleschannels/StorefrontPreview.vue'
import StoreRestoreDialog from '@/components/saleschannels/StoreRestoreDialog.vue'
import ThemeLibraryCard from '@/components/saleschannels/ThemeLibraryCard.vue'
import type { ThemeLibraryAction } from '@/components/saleschannels/ThemeLibraryCard.vue'

// Store editor ▸ Themes (UAT parity — Neelam-Store, docs/rebuild/neelam-store/CRAWL-SUMMARY.md):
// the current theme with Show store; the theme library, where each theme is a whole
// demo store a store can be made a copy of (useDemoStores, src/storefront/demoStores/);
// and the themes installed on the store, each opening in the theme builder. A store
// that can't take a theme (Neelam-Store, Atlas…) previews the library only.

const route = useRoute()
const router = useRouter()
const salesChannelsStore = useSalesChannelsStore()
const themesStore = useStoreThemesStore()
const storefronts = useStorefrontStore()
const demoStores = useDemoStores()
const toast = useToast()

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
/** The store's chrome and the product card its rows use, as the builder draws them. */
const previewExtras = computed(() => {
  const grid = gridSettings(current.value?.templates.collection)
  return { cardStyle: grid.cardStyle, quickAdd: grid.quickAdd, ...storefronts.previewChromeFor(channel.value) }
})
/** The store's own products in the preview's product rows; a store on the shared catalogue keeps the drawn stand-ins. */
const previewItems = computed(() => (channel.value ? previewProducts(useCommerceStore().products, channel.value) : undefined))

const installed = computed(() => themesStore.themesForChannel(channelId.value))
const current = computed(() => installed.value.find((theme) => theme.status === 'Published'))

const search = ref('')
const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return term ? installed.value.filter((theme) => theme.name.toLowerCase().includes(term)) : installed.value
})

function storefrontOf(store: Pick<SalesChannel, 'accountId' | 'id'>): string {
  return router.resolve({ name: 'StorefrontHome', params: { accountId: store.accountId, channelId: store.id } }).href
}

const storefrontHref = computed(() => storefrontOf({ accountId: accountId.value, id: channelId.value }))

function openStorefront() {
  window.open(storefrontHref.value, '_blank', 'noopener')
}

function builderRoute(theme: StoreTheme) {
  return { name: 'StoreThemeBuilder', params: { accountId: accountId.value, channelId: channelId.value }, query: { theme: theme.id } }
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

// ── Theme library ─────────────────────────────────────────────────────────────

const canApply = computed(() => demoStores.canApply(channelId.value))
const originalId = computed(() => channel.value?.webStore?.blueprint?.original ?? null)

/** Another theme than the store's own runs on it now: which, and since when. */
const applied = computed(() => {
  const running = demoStores.blueprintOf(channelId.value)
  if (!running || running.id === originalId.value) return null
  const at = readInstalled(channelId.value, browserStorage())?.appliedAt
  return { name: running.card.name, on: at ? day(at) : null }
})

interface LibraryEntry {
  blueprint: DemoStoreBlueprint
  action: ThemeLibraryAction
  previewHref?: string
  showcaseRuns?: string
  showcaseIsHere?: boolean
}

const library = computed<LibraryEntry[]>(() => {
  const running = demoStores.blueprintOf(channelId.value)?.id ?? null
  return DEMO_STORES.map((blueprint) => {
    const isCurrent = running === blueprint.id
    const action: ThemeLibraryAction = !canApply.value ? 'none'
      : isCurrent ? 'current'
      : blueprint.id === originalId.value ? 'restore'
      : 'apply'
    // The current theme's card shows this store. Any other previews its showcase store, while that store runs it.
    if (isCurrent) return { blueprint, action, previewHref: storefrontHref.value }
    const showcase = demoStores.blueprintOf(blueprint.homeChannel.id)
    if (showcase && showcase.id !== blueprint.id) return { blueprint, action, showcaseRuns: showcase.card.name, showcaseIsHere: blueprint.homeChannel.id === channelId.value }
    return { blueprint, action, previewHref: storefrontOf(blueprint.homeChannel) }
  })
})

const restoreOpen = ref(false)

const applyOpen = ref(false)
const applyTarget = ref<DemoStoreBlueprint | null>(null)
/** Counted as the dialog opens, so the list does not change under it as it closes. */
const applyLines = ref<string[]>([])

function askApply(blueprint: DemoStoreBlueprint) {
  applyTarget.value = blueprint
  applyLines.value = demoStores.applyPreview(channelId.value, blueprint.id)
  applyOpen.value = true
}

// ── Focus after an action ─────────────────────────────────────────────────────
// Apply, Restore, Duplicate and Delete take away the button that was pressed, so the
// dialog has nothing to give focus back to. Focus goes to the part of the page that
// changed instead: once the dialog is closing, so its focus trap has let go.
const currentCard = ref<{ $el: HTMLElement } | null>(null)
const installedCard = ref<{ $el: HTMLElement } | null>(null)

function focusIn(el: HTMLElement | null | undefined) {
  if (!el) return
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
  el.focus()
}

function focusHeading(card: { $el: HTMLElement } | null) {
  void nextTick(() => focusIn(card?.$el.querySelector<HTMLElement>('h1, h2, h3')))
}

function applyTheme() {
  const theme = applyTarget.value
  const store = channel.value
  if (!theme || !store) return
  if (demoStores.apply(store.id, theme.id)) {
    toast.success(`${store.name} is now a copy of ${theme.card.name}`, { action: { label: 'Show store', onClick: openStorefront } })
    focusHeading(currentCard.value)
  } else {
    toast.error('The theme could not be applied. This browser has no room left to keep it.')
  }
}

// ── Themes installed ──────────────────────────────────────────────────────────

function duplicate(theme: StoreTheme) {
  const copy = themesStore.duplicateTheme(theme.id)
  if (!copy) return
  toast.success(`${copy.name} added as a draft`)
  // The menu has closed by the next frame: then the new row's own menu button takes focus.
  void nextTick(() => requestAnimationFrame(() => focusIn(installedCard.value?.$el.querySelector<HTMLElement>(`[aria-label="Actions for ${CSS.escape(copy.name)}"]`))))
}

const deleteOpen = ref(false)
const deleteTarget = ref<StoreTheme | null>(null)

function askDelete(theme: StoreTheme) {
  deleteTarget.value = theme
  deleteOpen.value = true
}

function deleteDraft() {
  const theme = deleteTarget.value
  if (!theme || !themesStore.deleteTheme(theme.id)) return
  toast.success(`${theme.name} deleted`)
  focusHeading(installedCard.value)
}

const headers: { title: string; key: string; sortable: boolean; align?: 'end'; headerProps?: Record<string, unknown>; hideBelow?: HideBelow }[] = [
  { title: 'Theme', key: 'preview', sortable: false, hideBelow: 'sm' },
  { title: 'Theme name', key: 'name', sortable: true },
  { title: 'Created by', key: 'createdBy', sortable: true, hideBelow: 'lg' },
  { title: 'Last update', key: 'updatedAt', sortable: true, hideBelow: 'sm' },
  { title: 'Actions', key: 'actions', headerProps: { class: 'mp-th-sr' }, align: 'end', sortable: false },
]
const { visibleHeaders, isVisible } = useResponsiveTableHeaders(headers)

/** What a dropped column said, under the theme's name: "By Maropost · Updated Aug 26, 2026". */
function foldedMeta(theme: StoreTheme): string {
  const parts: string[] = []
  if (!isVisible('createdBy') && theme.createdBy) parts.push(`By ${theme.createdBy}`)
  if (!isVisible('updatedAt')) parts.push(`Updated ${day(theme.updatedAt)}`)
  return parts.join(' · ')
}
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

    <v-card ref="currentCard" variant="flat" border rounded="lg" class="store-themes__current">
      <MpSectionHeader title="Current theme" :heading-level="2" />
      <template v-if="current">
        <!-- The top of the home page, fading out: the whole page runs past 2,000px and hid the library below it. -->
        <div class="store-themes__window">
          <StorefrontPreview :sections="current.templates.home" :styles="current.styles" :brand="previewHeader.brand" :menu="previewHeader.menu" :products="previewItems" v-bind="previewExtras" />
        </div>
        <div class="store-themes__current-bar">
          <div class="min-width-0">
            <div class="text-subtitle-1 font-weight-medium">{{ current.name }}</div>
            <div v-if="applied" class="text-body-2 text-medium-emphasis">
              Copied from {{ applied.name }}<template v-if="applied.on"> on {{ applied.on }}</template>
              <span aria-hidden="true"> · </span>
              <button type="button" class="mp-link" @click="restoreOpen = true">Restore original store</button>
            </div>
            <div v-else class="text-body-2 text-medium-emphasis">Last update: {{ day(current.updatedAt) }}</div>
          </div>
          <v-btn
            variant="outlined"
            class="text-none"
            prepend-icon="external-link"
            :href="storefrontHref"
            target="_blank"
            rel="noopener"
            aria-label="Show store (opens in a new tab)"
          >
            Show store
          </v-btn>
        </div>
      </template>
      <MpEmptyState
        v-else
        icon="palette"
        title="No theme yet"
        :description="canApply ? 'Apply one from the theme library below.' : 'This store has no published theme.'"
        :heading-level="3"
      />
    </v-card>

    <v-card variant="flat" border rounded="lg" class="mp-card-inset">
      <MpSectionHeader
        title="Theme library"
        :description="canApply
          ? 'Each theme is a whole store: its look, products, pages and campaigns. Applying one makes this store a copy of it.'
          : 'Each theme is a whole demo store: its look, products, pages and campaigns.'"
        :heading-level="2"
      />
      <div class="store-themes__library">
        <MpAlert v-if="!canApply" tone="info" live="off">
          Themes from the library can be applied to the demo stores and to web stores made with Create sales channel.
          {{ channel.name }} keeps its own theme, but you can preview each one.
        </MpAlert>
        <v-row>
          <v-col v-for="entry in library" :key="entry.blueprint.id" cols="12" sm="6" lg="4" class="d-flex">
            <ThemeLibraryCard
              class="flex-grow-1"
              :card="entry.blueprint.card"
              :showcase-name="entry.blueprint.homeChannel.name"
              :action="entry.action"
              :preview-href="entry.previewHref"
              :showcase-runs="entry.showcaseRuns"
              :showcase-is-here="entry.showcaseIsHere"
              @apply="askApply(entry.blueprint)"
              @restore="restoreOpen = true"
            />
          </v-col>
        </v-row>
      </div>
    </v-card>

    <v-card ref="installedCard" variant="flat" border rounded="lg" class="d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Themes installed"
        search-placeholder="Search themes…"
        :total-count="filtered.length"
      />

      <v-data-table
        :headers="visibleHeaders"
        :items="filtered"
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="15"
        :hide-default-footer="filtered.length <= 15"
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
            <div class="d-flex align-center flex-wrap ga-2">
              <span class="font-weight-medium">{{ item.name }}</span>
              <MpStatusChip :status="item.status" size="sm" />
            </div>
            <div v-if="item.availableVersion" class="text-caption text-medium-emphasis">
              Theme version v.{{ item.availableVersion }} available
            </div>
            <div v-if="foldedMeta(item)" class="text-caption text-medium-emphasis">{{ foldedMeta(item) }}</div>
          </div>
        </template>

        <template v-slot:item.createdBy="{ item }">
          <span class="text-body-2">{{ item.createdBy ?? '—' }}</span>
        </template>

        <template v-slot:item.updatedAt="{ item }">
          <span class="text-body-2">{{ lastUpdate(item.updatedAt) }}</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Actions" :item-label="item.name">
            <MpMenuItem icon="pencil" title="Edit theme" :to="builderRoute(item)" />
            <MpMenuItem icon="copy" title="Duplicate" @click="duplicate(item)" />
            <template v-if="item.status === 'Draft'">
              <v-divider class="my-1" />
              <MpMenuItem icon="trash-2" title="Delete draft" danger @click="askDelete(item)" />
            </template>
          </MpRowActionsMenu>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="palette"
            :title="search ? 'No themes match your search' : 'No themes on this store'"
            :description="search ? 'Try another theme name.' : 'Themes on this store appear here.'"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpConfirmDialog
      v-model="applyOpen"
      :title="`Apply ${applyTarget?.card.name ?? 'this theme'} to ${channel.name}?`"
      :message="`${channel.name} becomes a copy of the ${applyTarget?.card.name ?? ''} store.`"
      :consequences="applyLines"
      confirm-label="Apply theme"
      danger
      @confirm="applyTheme"
    />

    <StoreRestoreDialog v-model="restoreOpen" :channel-id="channel.id" @restored="focusHeading(currentCard)" />

    <MpConfirmDialog
      v-model="deleteOpen"
      :title="`Delete ${deleteTarget?.name ?? 'this draft'}?`"
      message="The draft is removed from this store. The published theme stays."
      confirm-label="Delete draft"
      danger
      @confirm="deleteDraft"
    />
  </div>
</template>

<style scoped>
.store-themes__current {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-card-gap);
  padding: var(--mp-component-card-padding);
}

.store-themes__window {
  position: relative;
  max-height: var(--mp-layout-themePreviewHeight);
  overflow: hidden;
}

.store-themes__window::after {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: var(--mp-space-80);
  background: linear-gradient(to bottom, transparent, rgb(var(--v-theme-surface)));
  pointer-events: none;
}

/* Wraps on a phone: Show store drops under the theme's name rather than squeezing it. */
.store-themes__current-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-16);
}

.store-themes__library {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-card-gap);
}

.min-width-0 {
  min-width: 0;
}
</style>
