<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProductExtrasStore, type Reservation } from '@/stores/useProductExtras'
import { useCommerceStore } from '@/stores/useCommerce'
import { useToast } from '@/composables/useToast'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

const store = useProductExtrasStore()
const commerce = useCommerceStore()
const search = ref('')
const toast = useToast()

const LOCATIONS = ['Main Warehouse - FL', 'Secondary Node - CA', 'Retail Hub - TX']

const headers = [
  { title: 'Hold ID', key: 'id', sortable: true },
  { title: 'Product', key: 'product' },
  { title: 'Order #', key: 'orderNumber' },
  { title: 'Location', key: 'location' },
  { title: 'Qty Held', key: 'qty', align: 'end' as const },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', sortable: false, width: 48 },
]

const filters = ref({ status: [] as string[] })
const filterLabels = { status: 'Status' }
const activeFilterEntries = computed(() =>
  filters.value.status.length > 0
    ? [{ key: 'status', label: `Status: ${filters.value.status.join(', ')}` }]
    : []
)
function removeFilter(_key: string) { filters.value.status = [] }
function clearAllFilters() { filters.value.status = [] }
const filteredItems = computed(() =>
  filters.value.status.length ? store.reservations.filter(i => filters.value.status.includes(i.status)) : store.reservations
)

// ── New reservation drawer ──────────────────────────────────────────
const drawer = ref(false)
const form = ref({ product: '', orderNumber: '', location: LOCATIONS[0]!, description: '', qty: 1 })
const productOptions = computed(() => commerce.products.map(p => p.name))

function openCreate() {
  form.value = { product: '', orderNumber: '', location: LOCATIONS[0]!, description: '', qty: 1 }
  drawer.value = true
}

function saveReservation() {
  const sku = commerce.products.find(p => p.name === form.value.product)?.sku ?? ''
  store.addReservation({
    product: form.value.product || 'Unnamed product',
    sku,
    orderNumber: form.value.orderNumber.trim(),
    location: form.value.location,
    description: form.value.description.trim(),
    qty: Number(form.value.qty) || 1,
  })
  drawer.value = false
  toast.success('Reservation created')
}

// ── Release hold ────────────────────────────────────────────────────
const confirmRelease = ref(false)
const pendingRelease = ref<Reservation | null>(null)
function askRelease(item: Reservation) {
  pendingRelease.value = item
  confirmRelease.value = true
}
function doRelease() {
  if (pendingRelease.value) {
    store.releaseReservation(pendingRelease.value.id)
    toast.success('Hold released')
  }
  pendingRelease.value = null
}

</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Inventory Reservations"
      :subtitle="`${store.reservations.filter(i => i.status === 'Active Hold').length} active holds`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">New Reservation</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="All Reservations"
        :active-filters="activeFilterEntries"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <!-- Filter popover: `hide-details` is deliberate — a table filter never
             carries a hint or an error, and the popover is a dense surface. -->
        <template #filter-content>
          <v-select
            v-model="filters.status"
            :items="['Active Hold', 'Expired']"
            :label="filterLabels.status"
            multiple
            chips
            closable-chips
            hide-details
          />
        </template>
      </MpDataTableToolbar>

      <v-data-table
        :headers="headers"
        :items="filteredItems"
        :search="search"
        :items-per-page="15"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.product="{ item }">
          <div class="d-flex align-center gap-3 py-2">
            <v-img
              :src="`https://picsum.photos/seed/${item.id}/32/32`"
              :width="32"
              :height="32"
              cover
              rounded="md"
              class="flex-shrink-0 border reservation-thumb"
            >
              <template #error>
                <div class="w-100 h-100 d-flex align-center justify-center bg-surface-variant rounded-md">
                  <v-icon size="16" class="text-medium-emphasis">image</v-icon>
                </div>
              </template>
            </v-img>
            <div>
              <div class="text-body-2 font-weight-medium">{{ item.product }}</div>
              <div v-if="item.description" class="text-caption text-medium-emphasis">{{ item.description }}</div>
            </div>
          </div>
        </template>
        <template v-slot:item.location="{ item }">
          <div class="d-flex align-center gap-2">
            <v-icon size="15" class="text-medium-emphasis">map-pin</v-icon>
            <span class="text-body-2">{{ item.location }}</span>
          </div>
        </template>
        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status" type="general" />
        </template>
        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Reservation actions">
            <v-list-item prepend-icon="circle-x" title="Release Hold" class="text-error" @click="askRelease(item)" />
          </MpRowActionsMenu>
        </template>
        <template v-slot:no-data>
          <MpEmptyState
            icon="bookmark"
            :title="search || filters.status.length ? 'No reservations match your filters' : 'No reservations'"
            :description="search || filters.status.length ? 'Try a different search term or clear your filters.' : 'Create a hold to reserve inventory against an order.'"
            :action-label="search || filters.status.length ? undefined : 'New Reservation'"
            :action-icon="search || filters.status.length ? undefined : 'plus'"
            class="py-10"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- New reservation drawer -->
    <MpFormDrawer
      v-model="drawer"
      title="New Reservation"
      subtitle="Hold inventory against an order"
    >
      <MpFormGrid>
        <v-combobox v-model="form.product" :items="productOptions" label="Product" />
        <v-text-field v-model="form.orderNumber" label="Order #" placeholder="e.g. #10231" />
        <v-select v-model="form.location" :items="LOCATIONS" label="Location" prepend-inner-icon="map-pin" />
        <v-text-field v-model.number="form.qty" label="Quantity to hold" type="number" min="1" />
        <v-textarea v-model="form.description" label="Description" rows="3" placeholder="Reason for the hold…" />
      </MpFormGrid>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="check" @click="saveReservation">Create Hold</v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmRelease"
      title="Release this hold?"
      :message="`${pendingRelease?.id} (${pendingRelease?.product}) will be released and the held stock returned to available inventory.`"
      confirm-label="Release Hold"
      danger
      @confirm="doRelease"
    />
  </div>
</template>

<style scoped>
.reservation-thumb {
  flex: 0 0 32px;
  width: 32px !important;
  height: 32px !important;
  aspect-ratio: 1 / 1;
}
</style>
