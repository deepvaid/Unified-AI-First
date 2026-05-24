<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import { useRetailStore } from '@/stores/useRetail'

const store = useRetailStore()
const snackbar = ref({ visible: false, message: '' })
function showToast(message: string) { snackbar.value = { visible: true, message } }

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

const channelHeaders = [
  { title: 'SKU',          key: 'sku',         sortable: true,  width: 180 },
  { title: 'Product',      key: 'productName', sortable: true },
  { title: 'Cost',         key: 'cost',        sortable: true,  align: 'end' as const, width: 110 },
  { title: 'Online price', key: 'online',      sortable: true,  align: 'end' as const, width: 140 },
  { title: 'POS price',    key: 'pos',         sortable: true,  align: 'end' as const, width: 140 },
  { title: 'Margin',       key: 'margin',      sortable: false, align: 'end' as const, width: 120 },
]

const overrideHeaders = [
  { title: 'SKU',           key: 'sku',           sortable: true, width: 180 },
  { title: 'Product',       key: 'productName',   sortable: true },
  { title: 'Location',      key: 'locationId',    sortable: false, width: 200 },
  { title: 'Override price',key: 'overridePrice', sortable: true, align: 'end' as const, width: 160 },
  { title: 'Reason',        key: 'reason',        sortable: false, width: 200 },
  { title: '',              key: 'actions',       sortable: false, width: 64 },
]

const channelRows = computed(() =>
  store.channelPriceList.map((p) => ({
    ...p,
    margin: ((p.pos - p.cost) / p.pos * 100),
  })),
)

const search = ref('')
const overrideSearch = ref('')
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Pricing"
      subtitle="Channel-level prices and per-location overrides. Promotions apply on top at transaction time."
    >
      <template #actions>
        <v-btn variant="outlined" class="text-none" prepend-icon="upload" @click="showToast('Upload — coming soon')">
          Import
        </v-btn>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="plus" @click="showToast('New override — coming soon')">
          New override
        </v-btn>
      </template>
    </MpPageHeader>

    <!-- Resolution order banner -->
    <v-card flat border rounded="lg" class="retail-widget-card pa-4">
      <div class="d-flex align-center ga-2 flex-wrap">
        <v-icon size="16" color="info">info</v-icon>
        <span class="text-body-2 font-weight-medium" style="color: var(--ink);">Price resolution order:</span>
        <v-chip size="x-small" variant="tonal" color="default">Base price</v-chip>
        <v-icon size="12">arrow-right</v-icon>
        <v-chip size="x-small" variant="tonal" color="primary">Channel price</v-chip>
        <v-icon size="12">arrow-right</v-icon>
        <v-chip size="x-small" variant="tonal" color="warning">Location override</v-chip>
        <v-icon size="12">arrow-right</v-icon>
        <v-chip size="x-small" variant="tonal" color="success">Promotion</v-chip>
        <v-icon size="12">arrow-right</v-icon>
        <v-chip size="x-small" variant="tonal" color="default">Tax & rounding</v-chip>
      </div>
    </v-card>

    <!-- Channel pricing -->
    <v-card flat border rounded="lg" class="retail-widget-card">
      <div class="retail-widget-header">
        <div class="retail-widget-header__title">Channel pricing</div>
        <div class="retail-widget-header__actions">
          <v-text-field
            v-model="search"
            density="compact"
            variant="outlined"
            placeholder="Search SKU…"
            prepend-inner-icon="search"
            hide-details
            style="max-width: 240px;"
          />
        </div>
      </div>

      <v-data-table
        :headers="channelHeaders"
        :items="channelRows"
        :search="search"
        item-value="sku"
        hover
        density="comfortable"
        :items-per-page="10"
      >
        <template #item.cost="{ item }">
          <span class="text-medium-emphasis">{{ fmt(item.cost) }}</span>
        </template>
        <template #item.online="{ item }">
          <span class="font-weight-medium">{{ fmt(item.online) }}</span>
        </template>
        <template #item.pos="{ item }">
          <span class="font-weight-medium">{{ fmt(item.pos) }}</span>
        </template>
        <template #item.margin="{ item }">
          <v-chip size="x-small" variant="tonal" :color="item.margin >= 50 ? 'success' : item.margin >= 30 ? 'primary' : 'warning'" class="font-weight-medium">
            {{ item.margin.toFixed(0) }}%
          </v-chip>
        </template>
        <template #no-data>
          <MpEmptyState icon="tag" title="No prices" description="Add product pricing to get started." />
        </template>
      </v-data-table>
    </v-card>

    <!-- Location overrides -->
    <v-card flat border rounded="lg" class="retail-widget-card">
      <div class="retail-widget-header">
        <div class="retail-widget-header__title">Location overrides</div>
        <div class="retail-widget-header__actions">
          <span class="retail-widget-header__sub">{{ store.priceOverrideList.length }} active</span>
        </div>
      </div>

      <v-data-table
        :headers="overrideHeaders"
        :items="store.priceOverrideList"
        :search="overrideSearch"
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="10"
      >
        <template #item.locationId="{ item }">
          <v-chip size="x-small" variant="tonal" color="primary" class="font-weight-medium">
            {{ store.locationName(item.locationId) }}
          </v-chip>
        </template>
        <template #item.overridePrice="{ item }">
          <span class="font-weight-medium">{{ fmt(item.overridePrice) }}</span>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            icon="trash-2"
            variant="text"
            size="x-small"
            color="error"
            aria-label="Delete override"
            @click="store.deletePriceOverride(item.id)"
          />
        </template>
        <template #no-data>
          <MpEmptyState icon="map-pin" title="No overrides" description="Create per-location price overrides to handle regional or flagship pricing." />
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar v-model="snackbar.visible" :timeout="2000" location="bottom">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>
