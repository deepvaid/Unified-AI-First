<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import { useMerchandisingStore, type SearchPin } from '@/stores/useMerchandising'

const store = useMerchandisingStore()
const search = ref('')

const headers = [
  { title: 'Query', key: 'query', sortable: true },
  { title: 'Pinned products', key: 'pinnedProductIds', sortable: false },
  { title: 'Updated', key: 'updatedAt', sortable: true, align: 'end' as const, width: 160 },
  { title: '', key: 'actions', sortable: false, width: 64 },
]

const filteredPins = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return store.searchPinList
  return store.searchPinList.filter((pin) => pin.query.toLowerCase().includes(term))
})

const productOptions = computed(() =>
  store.merchProductList.map((p) => ({ title: p.title, value: p.id })),
)

// ── Create / edit drawer ─────────────────────────────────────────
const drawer = ref(false)
const editing = ref(false)
const editingId = ref('')
const form = ref<{ query: string; pinnedProductIds: string[] }>({ query: '', pinnedProductIds: [] })

const formValid = computed(() => Boolean(form.value.query.trim()))

function openCreate() {
  form.value = { query: '', pinnedProductIds: [] }
  editing.value = false
  editingId.value = ''
  drawer.value = true
}

function openEdit(pin: SearchPin) {
  form.value = { query: pin.query, pinnedProductIds: [...pin.pinnedProductIds] }
  editing.value = true
  editingId.value = pin.id
  drawer.value = true
}

function savePin() {
  if (!formValid.value) return
  const payload = { query: form.value.query.trim(), pinnedProductIds: form.value.pinnedProductIds }
  if (editing.value) {
    store.saveSearchPin(editingId.value, payload)
  } else {
    store.createSearchPin(payload)
  }
  drawer.value = false
}

// ── Delete flow ──────────────────────────────────────────────────
const deleteDialog = ref(false)
const pinPendingDelete = ref<SearchPin | null>(null)

function askDelete(pin: SearchPin) {
  pinPendingDelete.value = pin
  deleteDialog.value = true
}

function confirmDelete() {
  if (pinPendingDelete.value) store.deleteSearchPin(pinPendingDelete.value.id)
  pinPendingDelete.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Pinning"
      :subtitle="`Fix products to the top of search results for ${store.activeStore.domain}`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="plus" @click="openCreate">
          New pin
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card flat border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Pinned queries"
        search-placeholder="Search query…"
        :total-count="filteredPins.length"
      />

      <v-data-table
        :headers="headers"
        :items="filteredPins"
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="15"
        fixed-header
        class="flex-grow-1"
      >
        <template #item.query="{ item }">
          <a
            class="text-body-2 font-weight-bold text-primary cursor-pointer pin-query"
            @click="openEdit(item)"
          >
            {{ item.query }}
          </a>
        </template>

        <template #item.pinnedProductIds="{ item }">
          <v-chip size="x-small" variant="tonal" color="primary" class="font-weight-medium">
            {{ item.pinnedProductIds.length }} product{{ item.pinnedProductIds.length === 1 ? '' : 's' }}
          </v-chip>
        </template>

        <template #item.updatedAt="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ item.updatedAt }}</span>
        </template>

        <template #item.actions="{ item }">
          <MpRowActionsMenu :ariaLabel="`Actions for ${item.query}`">
            <v-list-item title="Edit" prepend-icon="pencil" @click="openEdit(item)" />
            <v-divider class="my-1" />
            <v-list-item title="Delete" prepend-icon="trash-2" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>

        <template #no-data>
          <MpEmptyState
            icon="pin"
            :title="search ? 'No pins match your search' : 'No pins yet'"
            :description="search ? 'Try a different keyword.' : 'Pin products to a search query so they always appear at the top of results.'"
            :action-label="!search ? 'New pin' : undefined"
            action-icon="plus"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpConfirmDialog
      v-model="deleteDialog"
      title="Delete pin?"
      :message="pinPendingDelete ? `Pinned products for “${pinPendingDelete.query}” will no longer be fixed to the top of search results.` : ''"
      confirm-label="Delete pin"
      danger
      @confirm="confirmDelete"
    />

    <MpFormDrawer
      v-model="drawer"
      :title="editing ? 'Edit pin' : 'New pin'"
      :subtitle="store.activeStore.domain"
    >
      <div class="d-flex flex-column gap-4">
        <v-text-field
          v-model="form.query"
          label="Search query"
          placeholder="e.g. boots"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
          :rules="[(v: string) => Boolean(v?.trim()) || 'Search query is required']"
        />
        <v-autocomplete
          v-model="form.pinnedProductIds"
          :items="productOptions"
          label="Pinned products"
          hint="Products appear in this order at the top of results for the query"
          persistent-hint
          variant="outlined"
          density="comfortable"
          multiple
          chips
          closable-chips
        />
      </div>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!formValid" @click="savePin">
          {{ editing ? 'Save pin' : 'Create pin' }}
        </v-btn>
      </template>
    </MpFormDrawer>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.pin-query {
  font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
}
</style>
