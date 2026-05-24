<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import { useRetailStore } from '@/stores/useRetail'
import type { RetailLocation, Country } from '@/stores/useRetail'

const store = useRetailStore()
const snackbar = ref({ visible: false, message: '' })
function showToast(message: string) { snackbar.value = { visible: true, message } }

/* ── Table ─────────────────────────────────────────────────────── */
const search = ref('')
const selectedRows = ref<string[]>([])
const countryFilter = ref<Country | ''>('')

const COUNTRY_FLAGS: Record<Country, string> = {
  AU: '🇦🇺',
  NZ: '🇳🇿',
  US: '🇺🇸',
  CA: '🇨🇦',
}

const COUNTRY_LABELS: Record<Country, string> = {
  AU: 'Australia',
  NZ: 'New Zealand',
  US: 'United States',
  CA: 'Canada',
}

const tableHeaders = [
  { title: 'Location',       key: 'name',            sortable: true },
  { title: 'Address',        key: 'address',         sortable: false },
  { title: 'Country',        key: 'country',         sortable: true,  width: 160 },
  { title: 'Registers',      key: 'registerCount',   sortable: true,  align: 'end' as const, width: 110 },
  { title: 'Associates',     key: 'associateCount',  sortable: true,  align: 'end' as const, width: 120 },
  { title: "Today's sales",  key: 'todaysSales',     sortable: true,  align: 'end' as const, width: 150 },
  { title: 'Status',         key: 'status',          sortable: false, width: 120 },
]

const rows = computed(() => {
  let items = store.locationList
  if (countryFilter.value) items = items.filter((l) => l.country === countryFilter.value)
  return items
})

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

/* ── Create drawer ─────────────────────────────────────────────── */
const createDrawer = ref(false)
const newLocation = ref({ name: '', address: '', country: 'AU' as Country })
function saveLocation() {
  showToast('Location saved — mock only')
  createDrawer.value = false
  newLocation.value = { name: '', address: '', country: 'AU' }
}

/* ── Detail drawer ─────────────────────────────────────────────── */
const detailDrawer = ref(false)
const selectedLocation = ref<RetailLocation | null>(null)

function openDetail(item: RetailLocation) {
  selectedLocation.value = item
  detailDrawer.value = true
}

const locationRegisters = computed(() =>
  selectedLocation.value
    ? store.registerList.filter((r) => r.locationId === selectedLocation.value!.id)
    : [],
)

const locationAssociates = computed(() =>
  selectedLocation.value
    ? store.associateList.filter((a) => a.locationIds.includes(selectedLocation.value!.id))
    : [],
)
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Locations"
      subtitle="Manage your physical stores and their registers, associates, and settings."
    >
      <template #actions>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="plus" @click="createDrawer = true">
          Add location
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card flat border rounded="lg" class="retail-widget-card d-flex flex-column">
      <MpDataTableToolbar v-model:search="search" search-placeholder="Search locations…">
        <template #filters>
          <v-select
            v-model="countryFilter"
            :items="[{ title: 'All countries', value: '' }, ...Object.entries(COUNTRY_LABELS).map(([k, v]) => ({ title: `${COUNTRY_FLAGS[k as Country]} ${v}`, value: k }))]"
            density="compact"
            variant="outlined"
            hide-details
            style="min-width: 180px;"
          />
        </template>
      </MpDataTableToolbar>

      <v-data-table
        v-model="selectedRows"
        :headers="tableHeaders"
        :items="rows"
        :search="search"
        item-value="id"
        hover
        show-select
        density="comfortable"
        :items-per-page="25"
        @click:row="(_e: Event, { item }: { item: RetailLocation }) => openDetail(item)"
        style="cursor: pointer;"
      >
        <template #item.name="{ item }">
          <div class="d-flex align-center ga-2">
            <v-icon size="16" color="medium-emphasis">store</v-icon>
            <span class="font-weight-medium">{{ item.name }}</span>
          </div>
        </template>

        <template #item.address="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ item.address }}</span>
        </template>

        <template #item.country="{ item }">
          <span class="text-body-2">{{ COUNTRY_FLAGS[item.country] }} {{ COUNTRY_LABELS[item.country] }}</span>
        </template>

        <template #item.registerCount="{ item }">
          <div class="d-flex align-center justify-end ga-1">
            <v-icon size="14" color="medium-emphasis">tablet-smartphone</v-icon>
            <span class="font-weight-medium">{{ item.registerCount }}</span>
          </div>
        </template>

        <template #item.associateCount="{ item }">
          <div class="d-flex align-center justify-end ga-1">
            <v-icon size="14" color="medium-emphasis">users</v-icon>
            <span class="font-weight-medium">{{ item.associateCount }}</span>
          </div>
        </template>

        <template #item.todaysSales="{ item }">
          <span class="font-weight-bold" style="color: var(--pos);">{{ fmt(item.todaysSales) }}</span>
        </template>

        <template #item.status="{ item }">
          <MpStatusChip :status="item.status === 'open' ? 'Open' : 'Closed'" type="general" size="x-small" />
        </template>

        <template #no-data>
          <MpEmptyState icon="store" title="No locations" description="Add your first location to get started." />
        </template>
      </v-data-table>
    </v-card>

    <!-- Floating bulk bar -->
    <MpFloatingBulkBar :count="selectedRows.length" @clear="selectedRows = []">
      <v-btn variant="tonal" class="text-none retail-bulk-btn" prepend-icon="edit" @click="showToast('Bulk edit — mock only')">
        Edit
      </v-btn>
      <v-btn variant="tonal" class="text-none retail-bulk-btn" prepend-icon="trash-2" color="error" @click="showToast('Bulk delete — mock only')">
        Delete
      </v-btn>
    </MpFloatingBulkBar>

    <!-- Create location drawer -->
    <MpFormDrawer v-model="createDrawer" title="Add location" subtitle="New store or fulfilment point">
      <v-row dense>
        <v-col cols="12">
          <v-text-field v-model="newLocation.name" label="Location name" placeholder="e.g. Melbourne CBD" variant="outlined" density="compact" />
        </v-col>
        <v-col cols="12">
          <v-text-field v-model="newLocation.address" label="Address" variant="outlined" density="compact" />
        </v-col>
        <v-col cols="12">
          <v-select
            v-model="newLocation.country"
            label="Country"
            :items="Object.entries(COUNTRY_LABELS).map(([k, v]) => ({ title: `${COUNTRY_FLAGS[k as Country]} ${v}`, value: k }))"
            variant="outlined"
            density="compact"
          />
        </v-col>
      </v-row>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="createDrawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" @click="saveLocation">Save location</v-btn>
      </template>
    </MpFormDrawer>

    <!-- Detail drawer -->
    <MpFormDrawer
      v-model="detailDrawer"
      :title="selectedLocation?.name ?? ''"
      :subtitle="selectedLocation?.address"
      :width="520"
    >
      <template v-if="selectedLocation">
        <!-- KPI row -->
        <v-row dense class="mb-4">
          <v-col cols="4">
            <div class="retail-detail-stat">
              <div class="retail-detail-stat__label">Today's sales</div>
              <div class="retail-detail-stat__value">{{ fmt(selectedLocation.todaysSales) }}</div>
            </div>
          </v-col>
          <v-col cols="4">
            <div class="retail-detail-stat">
              <div class="retail-detail-stat__label">Registers</div>
              <div class="retail-detail-stat__value">{{ selectedLocation.registerCount }}</div>
            </div>
          </v-col>
          <v-col cols="4">
            <div class="retail-detail-stat">
              <div class="retail-detail-stat__label">Associates</div>
              <div class="retail-detail-stat__value">{{ selectedLocation.associateCount }}</div>
            </div>
          </v-col>
        </v-row>

        <!-- Registers -->
        <div class="text-subtitle-2 font-weight-bold mb-2">Registers</div>
        <v-list density="compact" class="retail-detail-list mb-4">
          <v-list-item
            v-for="reg in locationRegisters"
            :key="reg.id"
            :subtitle="reg.deviceModel"
          >
            <template #prepend>
              <div :class="['retail-status-dot', `retail-status-dot--${reg.status}`]" style="margin-right: 10px;" />
            </template>
            <template #title>
              <span class="font-weight-medium">{{ reg.name }}</span>
            </template>
            <template #append>
              <v-chip size="x-small" variant="tonal" :color="reg.status === 'online' ? 'success' : reg.status === 'syncing' ? 'warning' : 'error'">
                {{ reg.status }}
              </v-chip>
            </template>
          </v-list-item>
          <div v-if="locationRegisters.length === 0" class="text-body-2 text-medium-emphasis pa-2">No registers at this location.</div>
        </v-list>

        <!-- Associates -->
        <div class="text-subtitle-2 font-weight-bold mb-2">Associates</div>
        <v-list density="compact" class="retail-detail-list">
          <v-list-item
            v-for="assoc in locationAssociates"
            :key="assoc.id"
            :title="assoc.name"
          >
            <template #prepend>
              <v-avatar size="28" color="primary" class="mr-2">
                <span class="text-caption text-white font-weight-bold">{{ assoc.name.split(' ').map((n) => n[0]).join('') }}</span>
              </v-avatar>
            </template>
            <template #append>
              <v-chip size="x-small" variant="tonal" color="default" class="font-weight-medium text-capitalize">
                {{ assoc.role.replace('_', ' ') }}
              </v-chip>
            </template>
          </v-list-item>
          <div v-if="locationAssociates.length === 0" class="text-body-2 text-medium-emphasis pa-2">No associates at this location.</div>
        </v-list>
      </template>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="detailDrawer = false">Close</v-btn>
        <v-btn variant="outlined" class="text-none" prepend-icon="settings" @click="showToast('Location settings — coming soon')">
          Settings
        </v-btn>
      </template>
    </MpFormDrawer>

    <v-snackbar v-model="snackbar.visible" :timeout="2000" location="bottom">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<style scoped lang="scss">
.retail-detail-list {
  background: color-mix(in oklch, var(--ink) 2%, var(--surface-1));
  border: 1px solid color-mix(in oklch, var(--ink) 7%, transparent);
  border-radius: var(--r-section);
}

.retail-detail-stat {
  padding: 12px;
  border: 1px solid color-mix(in oklch, var(--ink) 7%, transparent);
  border-radius: var(--r-section);
  background: var(--surface-1);
  text-align: center;

  &__label {
    font-size: 11px;
    color: var(--muted);
    margin-bottom: 4px;
  }

  &__value {
    font-size: 16px;
    font-weight: 700;
    color: var(--ink);
  }
}

.retail-bulk-btn {
  background: color-mix(in oklch, var(--cloud-retail-accent) 12%, transparent) !important;
}
</style>
