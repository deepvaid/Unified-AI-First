<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useMerchandisingStore, type SearchPin } from '@/stores/useMerchandising'

const route = useRoute()
const router = useRouter()
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

// Full-page pin editor (Findify parity: query results grid w/ pin + drag rank)
function openEditor(pinId: string) {
  router.push({ name: 'MerchandisingChannelSearchPinEdit', params: { accountId: route.params.accountId, channelId: route.params.channelId, pinId } })
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
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="plus" @click="openEditor('new')">
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
            @click="openEditor(item.id)"
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
            <v-list-item title="Edit" prepend-icon="pencil" @click="openEditor(item.id)" />
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
            @action="openEditor('new')"
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
