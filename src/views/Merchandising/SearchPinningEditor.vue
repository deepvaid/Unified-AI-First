<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpErrorState from '@/components/MpErrorState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MerchProductCard from '@/components/merchandising/MerchProductCard.vue'
import { useToast } from '@/composables/useToast'
import {
  useMerchandisingStore,
  MERCH_SORT_OPTIONS,
  sortMerchProducts,
  type MerchSortKey,
} from '@/stores/useMerchandising'

// Search-query pin editor (Findify "Search ▸ Pinning ▸ create"): the query's
// live results are merchandised by pinning products to ranked top positions.
// Same two-pane pattern as the collection PinningEditor, keyed by query.
const route = useRoute()
const router = useRouter()
const store = useMerchandisingStore()
const toast = useToast()

// Channel-scoped routes — this editor only mounts inside the merchandising shell.
const listRoute = computed(() => ({ name: 'MerchandisingChannelSearchPinning', params: { accountId: route.params.accountId, channelId: route.params.channelId } }))

/* ── Mode: edit existing pin or create a new one ──────────────── */
const pinId = computed(() => String(route.params.pinId))
const isNew = computed(() => pinId.value === 'new')
const pin = computed(() => (isNew.value ? null : store.getSearchPin(pinId.value)))
const notFound = computed(() => !isNew.value && !pin.value)

/* ── Editable state (committed to the store on Save) ──────────── */
const query = ref<string>(pin.value?.query ?? (typeof route.query.q === 'string' ? route.query.q : ''))
const pinnedIds = ref<string[]>([...(pin.value?.pinnedProductIds ?? [])])
const savedSnapshot = ref(JSON.stringify({ q: query.value, p: pinnedIds.value }))

const dirty = computed(() => JSON.stringify({ q: query.value, p: pinnedIds.value }) !== savedSnapshot.value)
const canSave = computed(() => dirty.value && !!query.value.trim())

/* ── Product panes ────────────────────────────────────────────── */
// The unpinned pane mocks the query's search results: products matching the
// query term (all products when the query matches nothing, so the pane stays
// usable while the merchant is still typing).
const resultsFilter = ref('')
const sortKey = ref<MerchSortKey>('popularity')

const pinnedProducts = computed(() =>
  pinnedIds.value
    .map((id) => store.merchProductList.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p),
)

const queryMatches = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return store.merchProductList
  const hits = store.merchProductList.filter((p) => p.title.toLowerCase().includes(q))
  return hits.length > 0 ? hits : store.merchProductList
})

const unpinnedProducts = computed(() => {
  const f = resultsFilter.value.trim().toLowerCase()
  const rows = queryMatches.value.filter((p) =>
    !pinnedIds.value.includes(p.id) && (!f || p.title.toLowerCase().includes(f)),
  )
  return sortMerchProducts(rows, sortKey.value)
})

/* ── Pin / unpin / select ─────────────────────────────────────── */
const selectedIds = ref<string[]>([])

function pinProduct(id: string) {
  if (!pinnedIds.value.includes(id)) pinnedIds.value.push(id)
  selectedIds.value = selectedIds.value.filter((s) => s !== id)
}

function unpin(id: string) {
  pinnedIds.value = pinnedIds.value.filter((p) => p !== id)
  selectedIds.value = selectedIds.value.filter((s) => s !== id)
}

function toggleSelect(id: string) {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter((s) => s !== id)
    : [...selectedIds.value, id]
}

const selectedPinnedCount = computed(() => selectedIds.value.filter((id) => pinnedIds.value.includes(id)).length)
const selectedUnpinnedCount = computed(() => selectedIds.value.length - selectedPinnedCount.value)

function bulkPin() {
  selectedIds.value.forEach((id) => { if (!pinnedIds.value.includes(id)) pinnedIds.value.push(id) })
  selectedIds.value = []
}

function bulkUnpin() {
  pinnedIds.value = pinnedIds.value.filter((id) => !selectedIds.value.includes(id))
  selectedIds.value = []
}

/* ── Drag-to-reorder (pinned pane, native HTML5 DnD) ──────────── */
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

function onDragStart(index: number, event: DragEvent) {
  dragIndex.value = index
  event.dataTransfer?.setData('text/plain', String(index))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function onDragOver(index: number, event: DragEvent) {
  event.preventDefault()
  dragOverIndex.value = index
}

function onDrop(index: number) {
  if (dragIndex.value === null || dragIndex.value === index) { resetDrag(); return }
  const next = [...pinnedIds.value]
  const [moved] = next.splice(dragIndex.value, 1)
  next.splice(index, 0, moved!)
  pinnedIds.value = next
  resetDrag()
}

function resetDrag() {
  dragIndex.value = null
  dragOverIndex.value = null
}

/* ── Save / delete ────────────────────────────────────────────── */
const confirmDelete = ref(false)

function save() {
  if (!canSave.value) return
  const payload = { query: query.value.trim(), pinnedProductIds: [...pinnedIds.value] }
  if (isNew.value) {
    const created = store.createSearchPin(payload)
    router.replace({ name: 'MerchandisingChannelSearchPinEdit', params: { accountId: route.params.accountId, channelId: route.params.channelId, pinId: created.id } })
  } else if (pin.value) {
    store.saveSearchPin(pin.value.id, payload)
  }
  savedSnapshot.value = JSON.stringify({ q: query.value, p: pinnedIds.value })
  toast.success('Pin saved')
}

function performDelete() {
  if (pin.value) store.deleteSearchPin(pin.value.id)
  router.push(listRoute.value)
}
</script>

<template>
  <div v-if="!notFound" class="h-100 d-flex flex-column gap-4">
    <MpPageHeader
      :title="query.trim() ? `Pins for “${query.trim()}”` : 'New pin'"
      :subtitle="`${pinnedProducts.length} pinned · ${queryMatches.length} results`"
      :back-to="listRoute"
    >
      <template #actions>
        <v-btn
          v-if="!isNew"
          variant="flat"
          color="surface"
          class="text-none"
          prepend-icon="trash-2"
          @click="confirmDelete = true"
        >
          Delete
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          prepend-icon="check"
          :disabled="!canSave"
          @click="save"
        >
          Save
        </v-btn>
      </template>
    </MpPageHeader>

    <!-- Controls: a workspace toolbar, not a form — compact density and
         `hide-details` are deliberate so the row stays one control tall. -->
    <div class="d-flex align-center gap-3 flex-wrap">
      <v-text-field
        v-model="query"
        label="Search query"
        placeholder="e.g. boots"
        prepend-inner-icon="search"
        density="compact"
        hide-details
        class="spin-query"
      />
      <v-spacer />
      <v-text-field
        v-model="resultsFilter"
        placeholder="Filter results…"
        aria-label="Filter unpinned results"
        prepend-inner-icon="list-filter"
        density="compact"
        hide-details
        clearable
        class="spin-filter"
      />
      <v-select
        v-model="sortKey"
        :items="[...MERCH_SORT_OPTIONS]"
        aria-label="Sort unpinned results"
        density="compact"
        hide-details
        class="spin-sort"
      />
    </div>

    <!-- Two-pane grid -->
    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex overflow-hidden spin-workspace">
      <!-- Pinned pane -->
      <section class="spin-pane spin-pane--pinned d-flex flex-column">
        <div class="px-4 py-3 d-flex align-center justify-space-between">
          <span class="text-subtitle-2 font-weight-bold">Pinned ({{ pinnedProducts.length }})</span>
          <span class="text-caption text-medium-emphasis">Drag to reorder</span>
        </div>
        <v-divider />
        <div class="pa-4 flex-grow-1 overflow-y-auto">
          <div v-if="pinnedProducts.length === 0" class="spin-empty text-center pa-8">
            <v-icon size="28" class="text-medium-emphasis mb-2">pin</v-icon>
            <div class="text-body-2 text-medium-emphasis">
              No pinned products yet. Pin results from the right to fix them at the top of this query.
            </div>
          </div>
          <div v-else class="spin-grid">
            <div
              v-for="(product, index) in pinnedProducts"
              :key="product.id"
              class="spin-draggable"
              :class="{
                'spin-draggable--dragging': dragIndex === index,
                'spin-draggable--over': dragOverIndex === index && dragIndex !== index,
              }"
              draggable="true"
              @dragstart="onDragStart(index, $event)"
              @dragover="onDragOver(index, $event)"
              @drop.prevent="onDrop(index)"
              @dragend="resetDrag"
            >
              <MerchProductCard
                :product="product"
                pinned
                :rank="index + 1"
                :selected="selectedIds.includes(product.id)"
                @toggle-pin="unpin(product.id)"
                @toggle-select="toggleSelect(product.id)"
              />
            </div>
          </div>
        </div>
      </section>

      <v-divider vertical class="spin-divider" />

      <!-- Results pane -->
      <section class="spin-pane flex-grow-1 d-flex flex-column">
        <div class="px-4 py-3 d-flex align-center justify-space-between">
          <span class="text-subtitle-2 font-weight-bold">Results{{ query.trim() ? ` for “${query.trim()}”` : '' }}</span>
          <span class="text-caption text-medium-emphasis">{{ unpinnedProducts.length }} products</span>
        </div>
        <v-divider />
        <div class="pa-4 flex-grow-1 overflow-y-auto">
          <MpEmptyState
            v-if="unpinnedProducts.length === 0"
            icon="scan-search"
            title="No results match"
            description="Try a different filter term."
            class="py-8"
          />
          <div v-else class="spin-grid">
            <MerchProductCard
              v-for="product in unpinnedProducts"
              :key="product.id"
              :product="product"
              :selected="selectedIds.includes(product.id)"
              @toggle-pin="pinProduct(product.id)"
              @toggle-select="toggleSelect(product.id)"
            />
          </div>
        </div>
      </section>
    </v-card>

    <MpFloatingBulkBar :count="selectedIds.length" @clear="selectedIds = []">
      <v-btn
        v-if="selectedUnpinnedCount > 0"
        variant="flat"
        color="surface"
        size="small"
        class="text-none"
        prepend-icon="pin"
        rounded="lg"
        @click="bulkPin"
      >
        Pin selected
      </v-btn>
      <v-btn
        v-if="selectedPinnedCount > 0"
        variant="flat"
        color="surface"
        size="small"
        class="text-none"
        prepend-icon="pin-off"
        rounded="lg"
        @click="bulkUnpin"
      >
        Unpin selected
      </v-btn>
    </MpFloatingBulkBar>

    <MpConfirmDialog
      v-model="confirmDelete"
      title="Delete this pin?"
      :message="`Pinned products for “${query.trim()}” will no longer be fixed to the top of search results.`"
      confirm-label="Delete pin"
      danger
      @confirm="performDelete"
    />

  </div>

  <div v-else class="pa-10">
    <MpErrorState
      icon="pin-off"
      title="Pin not found"
      description="This pin may have been deleted, or the link is incorrect."
      action-label="Back to Pinning"
      action-icon="arrow-left"
      @action="router.push(listRoute)"
    />
  </div>
</template>

<style scoped>
.spin-query {
  width: 300px;
  flex: 0 0 auto;
}

.spin-filter {
  width: 240px;
  flex: 0 0 auto;
}

.spin-sort {
  width: 210px;
  flex: 0 0 auto;
}

.spin-workspace {
  min-height: 480px;
}

.spin-pane {
  min-width: 0;
  flex: 1 1 50%;
}

.spin-divider {
  opacity: 0.6;
  border-style: dashed;
}

.spin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.spin-draggable {
  cursor: grab;
}

.spin-draggable:active {
  cursor: grabbing;
}

.spin-draggable--dragging {
  opacity: 0.4;
}

.spin-draggable--over {
  outline: 2px dashed rgb(var(--v-theme-primary));
  outline-offset: 2px;
  border-radius: 12px;
}

.spin-empty {
  border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
}

@media (max-width: 860px) {
  .spin-workspace {
    flex-direction: column;
  }

  .spin-divider {
    display: none;
  }

  .spin-pane--pinned {
    border-bottom: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  }

  .spin-query,
  .spin-filter,
  .spin-sort {
    width: 100%;
  }
}
</style>
