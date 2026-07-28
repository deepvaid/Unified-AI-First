<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useCommerceStore } from '@/stores/useCommerce'
import { useRetailStore } from '@/stores/useRetail'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { useInitialLoad } from '@/composables/useInitialLoad'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

/**
 * One price list for every channel a merchant sells through. Online and
 * counter prices are columns on the same SKU rather than two separate screens.
 */
const store = useCommerceStore()
const retail = useRetailStore()
const salesChannels = useSalesChannelsStore()
const route = useRoute()
const { loading } = useInitialLoad()

const accountId = computed(() => String(route.params.accountId))
const search = ref('')

const channels = computed(() => salesChannels.channelsForAccount(accountId.value))

const headers = computed(() => [
  { title: 'Product', key: 'productName', sortable: true },
  { title: 'Cost', key: 'cost', align: 'end' as const, sortable: true },
  ...channels.value.map((c) => ({ title: c.name, key: `prices.${c.id}`, align: 'end' as const })),
  { title: 'Margin', key: 'margin', align: 'end' as const },
])

/** Margin against the highest channel price we sell at. */
function marginPct(cost: number, prices: Record<string, number>): number {
  const best = Math.max(0, ...Object.values(prices))
  return best > 0 ? Math.round(((best - cost) / best) * 100) : 0
}

const money = (n: number) => `$${n.toFixed(2)}`

const overrideHeaders = [
  { title: 'Product', key: 'productName' },
  { title: 'Location', key: 'locationId' },
  { title: 'Override', key: 'overridePrice', align: 'end' as const },
  { title: 'Reason', key: 'reason' },
  { title: '', key: 'actions', sortable: false, width: 48 },
]

const confirmDelete = ref(false)
const pendingId = ref<string | null>(null)
function askDelete(id: string) {
  pendingId.value = id
  confirmDelete.value = true
}
function doDelete() {
  if (pendingId.value) store.deletePriceOverride(pendingId.value)
  pendingId.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      eyebrow="Products"
      title="Price lists"
      :subtitle="`${store.priceLists.length} SKUs priced across ${channels.length} sales channels`"
    />

    <v-card variant="flat" border rounded="lg">
      <MpDataTableToolbar
        title="Channel pricing"
        v-model:search="search"
        :total-count="store.priceLists.length"
        search-placeholder="Search products or SKUs…"
      />
      <MpTableSkeleton v-if="loading" :rows="8" :columns="channels.length + 3" />
      <v-data-table
        v-else
        :headers="headers"
        :items="store.priceLists"
        :search="search"
        item-value="sku"
        density="comfortable"
        class="mp-table"
      >
        <template v-slot:item.productName="{ item }">
          <div>
            <div class="text-body-2 font-weight-medium">{{ item.productName }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.sku }}</div>
          </div>
        </template>

        <template v-slot:item.cost="{ item }">
          <span class="text-medium-emphasis" style="font-variant-numeric: tabular-nums">{{ money(item.cost) }}</span>
        </template>

        <template v-for="c in channels" :key="c.id" v-slot:[`item.prices.${c.id}`]="{ item }">
          <span style="font-variant-numeric: tabular-nums">
            {{ item.prices[c.id] !== undefined ? money(item.prices[c.id]!) : '—' }}
          </span>
        </template>

        <template v-slot:item.margin="{ item }">
          <span class="font-weight-medium" style="font-variant-numeric: tabular-nums">{{ marginPct(item.cost, item.prices) }}%</span>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="tags"
            title="No prices yet"
            description="Prices appear here once products are published to a sales channel."
          />
        </template>
      </v-data-table>
    </v-card>

    <v-card variant="flat" border rounded="lg">
      <div class="pa-4 pb-0">
        <MpSectionHeader title="Location overrides" />
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Per-store exceptions to the channel price — flagship or regional pricing.
        </p>
      </div>
      <v-data-table
        :headers="overrideHeaders"
        :items="store.priceOverrides"
        item-value="id"
        density="comfortable"
        class="mp-table"
        hide-default-footer
      >
        <template v-slot:item.productName="{ item }">
          <div>
            <div class="text-body-2 font-weight-medium">{{ item.productName }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.sku }}</div>
          </div>
        </template>

        <template v-slot:item.locationId="{ item }">
          <div class="d-flex align-center ga-2">
            <v-icon size="15" color="medium-emphasis">map-pin</v-icon>
            <span class="text-body-2">{{ retail.locationName(item.locationId) }}</span>
          </div>
        </template>

        <template v-slot:item.overridePrice="{ item }">
          <span class="font-weight-medium" style="font-variant-numeric: tabular-nums">{{ money(item.overridePrice) }}</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Price override actions">
            <v-list-item prepend-icon="trash-2" title="Remove override" @click="askDelete(item.id)" />
          </MpRowActionsMenu>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="map-pin"
            title="No location overrides"
            description="Every store uses its channel price."
          />
        </template>
      </v-data-table>
    </v-card>

    <MpConfirmDialog
      v-model="confirmDelete"
      title="Remove price override?"
      message="This store will fall back to its channel price."
      confirm-label="Remove"
      danger
      @confirm="doDelete"
    />
  </div>
</template>
