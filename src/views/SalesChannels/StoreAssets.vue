<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { assetExtension, formatAssetSize, useStoreAssetsStore, type StoreAsset } from '@/stores/useStoreAssets'
import { useToast } from '@/composables/useToast'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

const route = useRoute()
const router = useRouter()
const salesChannelsStore = useSalesChannelsStore()
const assetsStore = useStoreAssetsStore()
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

// ── Sort + pagination (legacy: sort-by dropdown, 15 per page) ────
type SortKey = 'uploadedAt' | 'name' | 'sizeKb'

const sortOptions: Array<{ value: SortKey; title: string }> = [
  { value: 'uploadedAt', title: 'Uploaded at' },
  { value: 'name', title: 'Name' },
  { value: 'sizeKb', title: 'Size' },
]

const sortBy = ref<SortKey>('uploadedAt')
const page = ref(1)
const perPage = 15

const sortedAssets = computed(() => {
  const list = [...assetsStore.assetsForChannel(channelId.value)]
  if (sortBy.value === 'name') return list.sort((a, b) => a.name.localeCompare(b.name))
  if (sortBy.value === 'sizeKb') return list.sort((a, b) => b.sizeKb - a.sizeKb)
  return list.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
})

const pageCount = computed(() => Math.max(1, Math.ceil(sortedAssets.value.length / perPage)))
const pagedAssets = computed(() => sortedAssets.value.slice((page.value - 1) * perPage, page.value * perPage))

const rangeLabel = computed(() => {
  const total = sortedAssets.value.length
  if (total === 0) return '0 assets'
  const start = (page.value - 1) * perPage + 1
  const end = Math.min(page.value * perPage, total)
  return `${start}–${end} of ${total}`
})

function formatUploaded(asset: StoreAsset): string {
  return new Date(`${asset.uploadedAt}T00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Deterministic tonal color per extension so the mock thumbnails scan easily.
const EXT_COLORS: Record<string, string> = { webp: 'primary', png: 'success', jpg: 'warning', jpeg: 'warning', gif: 'secondary', svg: 'info' }

function assetColor(asset: StoreAsset): string {
  return EXT_COLORS[assetExtension(asset)] ?? 'primary'
}

// ── Mock upload (filenames only, no backend) ─────────────────────
const fileInput = ref<HTMLInputElement | null>(null)

function pickFiles() {
  fileInput.value?.click()
}

function onFilesPicked(event: Event) {
  const input = event.target as HTMLInputElement
  const names = [...(input.files ?? [])].map((file) => file.name)
  if (names.length) {
    assetsStore.addAssets(channelId.value, names)
    toast.success(`${names.length} asset${names.length === 1 ? '' : 's'} uploaded`)
    sortBy.value = 'uploadedAt'
    page.value = 1
  }
  input.value = ''
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

  <div v-else class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Assets"
      :subtitle="`Images and files for ${channel.name}`"
    >
      <template #actions>
        <!-- Toolbar control: compact density and detail suppression are deliberate here. -->
        <v-select
          v-model="sortBy"
          :items="sortOptions"
          hide-details
          prepend-inner-icon="arrow-down-narrow-wide"
          class="assets-sort"
          aria-label="Sort assets"
        />
        <v-btn color="primary" variant="flat" prepend-icon="upload" class="text-none" @click="pickFiles">Upload assets</v-btn>
        <input ref="fileInput" type="file" accept="image/*" multiple class="d-none" @change="onFilesPicked" />
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column pa-4">
      <MpEmptyState
        v-if="sortedAssets.length === 0"
        icon="image"
        title="No assets yet"
        description="Upload images to use in your theme, pages, and blog posts."
        action-label="Upload assets"
        action-icon="upload"
        @action="pickFiles"
      />

      <template v-else>
        <div class="assets-grid">
          <div v-for="asset in pagedAssets" :key="asset.id" class="asset-card" :title="asset.name">
            <div class="asset-card__thumb">
              <v-avatar size="44" rounded="lg" :color="assetColor(asset)" variant="tonal">
                <v-icon size="22">image</v-icon>
              </v-avatar>
              <span class="asset-card__ext">{{ assetExtension(asset).toUpperCase() }}</span>
            </div>
            <div class="asset-card__meta">
              <div class="text-body-2 font-weight-medium text-truncate">{{ asset.name }}</div>
              <div class="text-caption text-medium-emphasis">{{ formatAssetSize(asset) }} · {{ formatUploaded(asset) }}</div>
            </div>
          </div>
        </div>

        <div class="d-flex align-center justify-space-between flex-wrap gap-2 mt-4">
          <span class="text-caption text-medium-emphasis">{{ rangeLabel }}</span>
          <v-pagination v-model="page" :length="pageCount" density="comfortable" total-visible="5" />
        </div>
      </template>
    </v-card>
  </div>
</template>

<style scoped>
.assets-sort {
  max-width: 180px;
}

.assets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.asset-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.15s ease;
}

.asset-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
}

.asset-card__thumb {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96px;
  background: rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.5));
}

.asset-card__ext {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  color: rgba(var(--v-theme-on-surface), 0.65);
}

.asset-card__meta {
  padding: 8px 10px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
