<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpErrorState from '@/components/MpErrorState.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MerchProductCard from '@/components/merchandising/MerchProductCard.vue'
import {
  useMerchandisingStore,
  MERCH_SORT_OPTIONS,
  sortMerchProducts,
  type MerchSortKey,
} from '@/stores/useMerchandising'

const route = useRoute()
const router = useRouter()
const store = useMerchandisingStore()

const listRoute = computed(() => `/commerce/${route.params.accountId}/merchandising/default-merchandising`)

/* ── Mode: edit existing rule or create a new one ─────────────── */
const ruleId = computed(() => String(route.params.ruleId))
const isNew = computed(() => ruleId.value === 'new')
const rule = computed(() => (isNew.value ? null : store.getPinningRule(ruleId.value)))
const notFound = computed(() => !isNew.value && !rule.value)

/* ── Editable state (committed to the store on Save) ──────────── */
const collectionId = ref<string>(
  rule.value?.collectionId
  ?? (typeof route.query.collection === 'string' ? route.query.collection : ''),
)
const pinnedIds = ref<string[]>([...(rule.value?.pinnedProductIds ?? [])])
const savedSnapshot = ref(JSON.stringify({ c: collectionId.value, p: pinnedIds.value }))

const dirty = computed(() => JSON.stringify({ c: collectionId.value, p: pinnedIds.value }) !== savedSnapshot.value)
const canSave = computed(() => dirty.value && !!collectionId.value)

const collectionOptions = computed(() =>
  store.collectionList.map((c) => ({ title: c.name, value: c.id })),
)
const collectionName = computed(() =>
  store.collectionList.find((c) => c.id === collectionId.value)?.name ?? 'New pinning rule',
)

/* ── Product panes ────────────────────────────────────────────── */
const search = ref('')
const sortKey = ref<MerchSortKey>('popularity')

const pinnedProducts = computed(() =>
  pinnedIds.value
    .map((id) => store.merchProductList.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p),
)

const unpinnedProducts = computed(() => {
  const q = search.value.trim().toLowerCase()
  const rows = store.merchProductList.filter((p) =>
    !pinnedIds.value.includes(p.id) && (!q || p.title.toLowerCase().includes(q)),
  )
  return sortMerchProducts(rows, sortKey.value)
})

/* ── Pin / unpin / select ─────────────────────────────────────── */
const selectedIds = ref<string[]>([])

function pin(id: string) {
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
const saveSnack = ref(false)
const confirmDelete = ref(false)

function save() {
  if (!canSave.value) return
  if (isNew.value) {
    const created = store.createPinningRule(collectionId.value)
    store.savePinningRule(created.id, { collectionId: collectionId.value, pinnedProductIds: pinnedIds.value })
    saveSnack.value = true
    router.replace(`${listRoute.value}/pinning/${created.id}`)
  } else if (rule.value) {
    store.savePinningRule(rule.value.id, { collectionId: collectionId.value, pinnedProductIds: pinnedIds.value })
  }
  savedSnapshot.value = JSON.stringify({ c: collectionId.value, p: pinnedIds.value })
  saveSnack.value = true
}

function performDelete() {
  if (rule.value) store.deletePinningRule(rule.value.id)
  confirmDelete.value = false
  router.push(listRoute.value)
}
</script>

<template>
  <div v-if="!notFound" class="h-100 d-flex flex-column gap-4">
    <MpPageHeader
      :title="collectionName"
      :subtitle="`${pinnedProducts.length} pinned · ${store.merchProductList.length} products`"
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

    <!-- Controls -->
    <div class="d-flex align-center gap-3 flex-wrap">
      <v-select
        v-model="collectionId"
        :items="collectionOptions"
        label="Collection"
        variant="outlined"
        density="compact"
        hide-details
        :disabled="!isNew"
        class="pin-collection-select"
      />
      <v-spacer />
      <v-text-field
        v-model="search"
        placeholder="Search unpinned products…"
        aria-label="Search unpinned products"
        prepend-inner-icon="search"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        class="pin-search"
      />
      <v-select
        v-model="sortKey"
        :items="[...MERCH_SORT_OPTIONS]"
        aria-label="Sort unpinned products"
        variant="outlined"
        density="compact"
        hide-details
        class="pin-sort"
      />
    </div>

    <!-- Two-pane grid -->
    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex overflow-hidden pin-workspace">
      <!-- Pinned pane -->
      <section class="pin-pane pin-pane--pinned d-flex flex-column">
        <div class="pin-pane__head px-4 py-3 d-flex align-center justify-space-between">
          <span class="text-subtitle-2 font-weight-bold">Pinned ({{ pinnedProducts.length }})</span>
          <span class="text-caption text-medium-emphasis">Drag to reorder</span>
        </div>
        <v-divider />
        <div class="pin-pane__body pa-4 flex-grow-1 overflow-y-auto">
          <div v-if="pinnedProducts.length === 0" class="pin-empty text-center pa-8">
            <v-icon size="28" class="text-medium-emphasis mb-2">pin</v-icon>
            <div class="text-body-2 text-medium-emphasis">
              No pinned products yet. Pin products from the right to fix their position at the top of this collection.
            </div>
          </div>
          <div v-else class="pin-grid">
            <div
              v-for="(product, index) in pinnedProducts"
              :key="product.id"
              class="pin-draggable"
              :class="{
                'pin-draggable--dragging': dragIndex === index,
                'pin-draggable--over': dragOverIndex === index && dragIndex !== index,
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

      <v-divider vertical class="pin-divider" />

      <!-- Unpinned pane -->
      <section class="pin-pane flex-grow-1 d-flex flex-column">
        <div class="pin-pane__head px-4 py-3 d-flex align-center justify-space-between">
          <span class="text-subtitle-2 font-weight-bold">Unpinned</span>
          <span class="text-caption text-medium-emphasis">{{ unpinnedProducts.length }} products</span>
        </div>
        <v-divider />
        <div class="pin-pane__body pa-4 flex-grow-1 overflow-y-auto">
          <MpEmptyState
            v-if="unpinnedProducts.length === 0"
            icon="scan-search"
            title="No products match"
            description="Try a different search term."
            class="py-8"
          />
          <div v-else class="pin-grid">
            <MerchProductCard
              v-for="product in unpinnedProducts"
              :key="product.id"
              :product="product"
              :selected="selectedIds.includes(product.id)"
              @toggle-pin="pin(product.id)"
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

    <!-- Delete confirm -->
    <v-dialog :model-value="confirmDelete" max-width="440" @update:model-value="confirmDelete = false">
      <v-card rounded="lg">
        <v-card-title class="pa-5 text-h6 font-weight-bold">Delete this pinning rule?</v-card-title>
        <v-card-text class="pb-2 text-body-2 text-medium-emphasis">
          Pinned positions for “{{ collectionName }}” will be removed. Products stay in the collection.
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" class="text-none" @click="confirmDelete = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" class="text-none" @click="performDelete">Delete rule</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="saveSnack" :timeout="2500" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> Pinning rule saved</div>
    </v-snackbar>
  </div>

  <div v-else class="pa-10">
    <MpErrorState
      icon="pin-off"
      title="Pinning rule not found"
      description="This rule may have been deleted, or the link is incorrect."
      action-label="Back to Default Merchandising"
      action-icon="arrow-left"
      @action="router.push(listRoute)"
    />
  </div>
</template>

<style scoped>
.pin-collection-select {
  width: 300px;
  flex: 0 0 auto;
}

.pin-search {
  width: 260px;
  flex: 0 0 auto;
}

.pin-sort {
  width: 210px;
  flex: 0 0 auto;
}

.pin-workspace {
  min-height: 480px;
}

.pin-pane {
  min-width: 0;
  flex: 1 1 50%;
}

.pin-divider {
  opacity: 0.6;
  border-style: dashed;
}

.pin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.pin-draggable {
  cursor: grab;
}

.pin-draggable:active {
  cursor: grabbing;
}

.pin-draggable--dragging {
  opacity: 0.4;
}

.pin-draggable--over {
  outline: 2px dashed rgb(var(--v-theme-primary));
  outline-offset: 2px;
  border-radius: 12px;
}

.pin-empty {
  border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
}

@media (max-width: 860px) {
  .pin-workspace {
    flex-direction: column;
  }

  .pin-divider {
    display: none;
  }

  .pin-pane--pinned {
    border-bottom: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  }

  .pin-collection-select,
  .pin-search,
  .pin-sort {
    width: 100%;
  }
}
</style>
