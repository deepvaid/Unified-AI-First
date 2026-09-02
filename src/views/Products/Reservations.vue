<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  useProductExtrasStore, INVENTORY_LOCATIONS,
  type Reservation, type InventoryLocation, type ReservableVariant,
} from '@/stores/useProductExtras'
import { useToast } from '@/composables/useToast'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpDialog from '@/components/MpDialog.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

/**
 * Inventory reservations — units held back from available stock per location,
 * either automatically against an order or manually. Rebuilt from UAT
 * `/inventory/reservations`; see docs/rebuild/inventory-reservations/.
 */
const store = useProductExtrasStore()
const route = useRoute()
const toast = useToast()

const accountId = computed(() => String(route.params.accountId))
const ordersPath = computed(() => `/commerce/${accountId.value}/orders`)

// Location is the promoted filter: a multi-select pill in the toolbar rather
// than a single-value select, so several values can be compared at once.
const locationQuickFilter = {
  key: 'location',
  label: 'Location',
  options: ([...INVENTORY_LOCATIONS]).map((v) => ({ label: v, value: v })),
}
const locationFilter = ref<string[]>([])
const search = ref('')

const headers = [
  { title: 'Item', key: 'item', sortable: true, minWidth: '240px' },
  { title: 'SKU', key: 'sku', sortable: true, hideBelow: 'lg' as const },
  { title: 'Order', key: 'orderNumber', hideBelow: 'md' as const },
  { title: 'Location', key: 'location', sortable: true, hideBelow: 'sm' as const },
  { title: 'Description', key: 'description', hideBelow: 'lg' as const },
  { title: 'Qty', key: 'qty', align: 'end' as const, sortable: true },
  { title: '', key: 'actions', sortable: false, width: 56 },
]
const { visibleHeaders } = useResponsiveTableHeaders(headers)

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return store.reservations.filter((r) => {
    const byLocation = !locationFilter.value.length || locationFilter.value.includes(r.location)
    const byTerm = !term
      || r.item.toLowerCase().includes(term)
      || r.sku.toLowerCase().includes(term)
      || r.description.toLowerCase().includes(term)
    return byLocation && byTerm
  })
})

const totalHeld = computed(() => filtered.value.reduce((sum, r) => sum + r.qty, 0))

const locationFilterEntries = computed(() =>
  !locationFilter.value.length ? [] : [{ key: 'location', label: `Location: ${locationFilter.value.join(', ')}` }],
)

// ── Create / edit dialog ────────────────────────────────────────────
const dialog = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const form = ref<{ sku: string; location: InventoryLocation | null; qty: string; description: string }>({
  sku: '', location: null, qty: '1', description: '',
})
const snapshot = ref('')
const guard = ref(false)

const variantOptions = computed(() =>
  store.reservableVariants.map((v) => ({ title: v.label, value: v.sku })),
)

const selectedVariant = computed<ReservableVariant | undefined>(() =>
  store.reservableVariants.find((v) => v.sku === form.value.sku),
)

const showSummary = computed(() => Boolean(selectedVariant.value && form.value.location))

const qtyNumber = computed(() => Number(form.value.qty))
const qtyError = computed(() => {
  if (!form.value.qty.trim()) return ['Enter how many units to hold']
  if (!Number.isInteger(qtyNumber.value) || qtyNumber.value < 1) return ['Enter a whole number of 1 or more']
  const available = selectedVariant.value?.available ?? 0
  if (editingId.value === null && qtyNumber.value > available) {
    return [`Only ${available} unit${available === 1 ? '' : 's'} available at this location`]
  }
  return []
})

const dirty = computed(() => JSON.stringify(form.value) !== snapshot.value)
const valid = computed(() => Boolean(form.value.sku) && Boolean(form.value.location) && qtyError.value.length === 0)

function openCreate() {
  editingId.value = null
  form.value = { sku: '', location: null, qty: '1', description: '' }
  snapshot.value = JSON.stringify(form.value)
  dialog.value = true
}

function openEdit(reservation: Reservation) {
  editingId.value = reservation.id
  form.value = {
    sku: reservation.sku,
    location: reservation.location,
    qty: String(reservation.qty),
    description: reservation.description,
  }
  snapshot.value = JSON.stringify(form.value)
  dialog.value = true
}

function requestClose() {
  if (dirty.value) guard.value = true
  else dialog.value = false
}

async function save() {
  if (!valid.value || !form.value.location) return
  saving.value = true
  await new Promise((resolve) => setTimeout(resolve, 400))
  const payload = {
    item: selectedVariant.value?.label.split(' — ')[0] ?? form.value.sku,
    sku: form.value.sku,
    location: form.value.location,
    description: form.value.description.trim(),
    qty: qtyNumber.value,
  }
  if (editingId.value !== null) {
    store.updateReservation(editingId.value, payload)
    toast.success('Reservation updated')
  } else {
    store.addReservation(payload)
    toast.success('Reservation created')
  }
  saving.value = false
  dialog.value = false
}

// Reset quantity when the item changes so a stale value can't outrun stock.
watch(() => form.value.sku, () => {
  if (editingId.value === null) form.value.qty = '1'
})

// ── Delete ──────────────────────────────────────────────────────────
const confirmDelete = ref(false)
const pendingDelete = ref<Reservation | null>(null)

function askDelete(reservation: Reservation) {
  pendingDelete.value = reservation
  confirmDelete.value = true
}

function doDelete() {
  if (!pendingDelete.value) return
  store.deleteReservation(pendingDelete.value.id)
  toast.success('Reservation released')
  pendingDelete.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="Multi-location inventory"
      title="Reservations"
      :subtitle="`${filtered.length} reservation${filtered.length === 1 ? '' : 's'} holding ${totalHeld} unit${totalHeld === 1 ? '' : 's'}`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">
          New reservation
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:quick-filter-value="locationFilter"
        :quick-filter="locationQuickFilter"
        v-model:search="search"
        title="All reservations"
        search-placeholder="Search item, SKU or description"
        :total-count="filtered.length"
        :active-filters="locationFilterEntries"
        @remove-filter="locationFilter = []"
        @clear-filters="locationFilter = []"
      />

      <v-data-table
        :headers="visibleHeaders"
        :items="filtered"
        :items-per-page="10"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template #item.item="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.item }}</span>
        </template>
        <template #item.sku="{ item }">
          <span class="res-mono text-body-2">{{ item.sku }}</span>
        </template>
        <template #item.orderNumber="{ item }">
          <RouterLink v-if="item.orderNumber !== '—'" :to="ordersPath" class="res-link">{{ item.orderNumber }}</RouterLink>
          <span v-else class="text-body-2 text-medium-emphasis">Manual hold</span>
        </template>
        <template #item.location="{ item }">
          <div class="d-flex align-center ga-2">
            <v-icon size="16" class="text-medium-emphasis">map-pin</v-icon>
            <span class="text-body-2">{{ item.location }}</span>
          </div>
        </template>
        <template #item.description="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ item.description || '—' }}</span>
        </template>
        <template #item.qty="{ item }">
          <span class="text-body-2 font-weight-medium num">{{ item.qty }}</span>
        </template>
        <template #item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Reservation actions" :item-label="item.item">
            <MpMenuItem icon="pencil" title="Edit" @click="openEdit(item)" />
            <v-divider class="my-1" />
            <MpMenuItem icon="trash-2" title="Delete" danger @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>
        <template #no-data>
          <MpEmptyState
            icon="bookmark"
            :title="search || locationFilter.length ? 'No reservations match your filters' : 'No reservations'"
            :description="search || locationFilter.length ? 'Try a different search term, or switch the location back to All locations.' : 'Reservations hold stock back from available inventory — orders create them automatically, and you can add manual holds.'"
            :action-label="search || locationFilter.length ? undefined : 'New reservation'"
            :action-icon="search || locationFilter.length ? undefined : 'plus'"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- ── New / edit reservation ───────────────────────────────────── -->
    <MpDialog
      v-model="dialog"
      :title="editingId !== null ? 'Edit reservation' : 'New reservation'"
      subtitle="Hold units back from available stock at one location"
      size="md"
      guarded
      @close="requestClose"
    >
      <MpFormSection title="What to hold" required>
        <MpFormGrid>
          <v-autocomplete
            v-model="form.sku"
            :items="variantOptions"
            label="Item to reserve *"
            placeholder="Search by product or SKU"
            hint="Only products with inventory tracking turned on can be reserved."
            persistent-hint
            no-data-text="No inventory-tracked product matches that search."
          />
          <v-select
            v-model="form.location"
            :items="[...INVENTORY_LOCATIONS]"
            label="Location *"
            :disabled="!form.sku"
          />
        </MpFormGrid>
      </MpFormSection>

      <template v-if="showSummary">
        <MpFormSection title="Stock at this location">
          <dl class="mp-label-value">
            <div>
              <dt class="mp-meta-label text-medium-emphasis">Item</dt>
              <dd class="text-body-2">{{ selectedVariant?.label }}</dd>
            </div>
            <div>
              <dt class="mp-meta-label text-medium-emphasis">SKU</dt>
              <dd class="res-mono text-body-2">{{ selectedVariant?.sku }}</dd>
            </div>
            <div>
              <dt class="mp-meta-label text-medium-emphasis">In stock</dt>
              <dd class="text-body-2 num">{{ selectedVariant?.inStock ?? 0 }}</dd>
            </div>
            <div>
              <dt class="mp-meta-label text-medium-emphasis">Available</dt>
              <dd class="text-body-2 num">{{ selectedVariant?.available ?? 0 }}</dd>
            </div>
          </dl>

          <MpFormGrid>
            <v-text-field
              v-model="form.qty"
              label="Reserve quantity *"
              type="number"
              min="1"
              :error-messages="qtyError"
            />
            <v-textarea v-model="form.description" label="Description" rows="3" placeholder="Why this stock is held" />
          </MpFormGrid>
        </MpFormSection>
      </template>
      <MpFormField v-else label="Quantity and description">
        <template #default="{ labelId }">
          <p class="text-body-2 text-medium-emphasis mb-0" :aria-labelledby="labelId">
            Choose an item and a location to see stock levels and set the quantity.
          </p>
        </template>
      </MpFormField>

      <template #footer>
        <v-btn variant="text" class="text-none" :disabled="saving" @click="requestClose">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :loading="saving" :disabled="!valid" @click="save">
          {{ editingId !== null ? 'Save reservation' : 'Create reservation' }}
        </v-btn>
      </template>
    </MpDialog>

    <MpConfirmDialog
      v-model="guard"
      title="Discard your changes?"
      message="This reservation has unsaved changes. Closing now discards them."
      confirm-label="Discard changes"
      danger
      @confirm="dialog = false"
    />

    <MpConfirmDialog
      v-model="confirmDelete"
      title="Delete this reservation?"
      :message="`${pendingDelete?.qty} unit${pendingDelete?.qty === 1 ? '' : 's'} of ${pendingDelete?.item} return to available stock at ${pendingDelete?.location}.`"
      confirm-label="Delete reservation"
      danger
      @confirm="doDelete"
    />
  </div>
</template>

<style scoped>
.res-mono {
  font-family: var(--mp-fontFamily-mono);
}

.res-link {
  color: rgb(var(--v-theme-primary));
  font-weight: var(--mp-fontWeight-medium);
}
</style>
