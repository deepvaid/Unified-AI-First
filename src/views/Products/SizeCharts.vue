<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import { useDemoStores } from '@/stores/useDemoStores'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { emptySizeChart, useSizeChartsStore } from '@/stores/useSizeCharts'
import type { Product } from '@/stores/useCommerce'
import { useProductStores } from '@/composables/useProductStores'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { useToast } from '@/composables/useToast'
import { sizeRange, sizesOf } from '@/storefront/sizeChartForm'
import type { SizeChartDraft } from '@/storefront/sizeChartForm'
import type { SizeChart } from '@/storefront/sizeCharts'
import { productHandle } from '@/views/Storefront/storefrontCatalog'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpDialog from '@/components/MpDialog.vue'
import MpListRow from '@/components/MpListRow.vue'
import SizeChartDrawer from '@/components/products/SizeChartDrawer.vue'

/**
 * Products › Size charts: the measurements a product's size guide shows, one
 * chart per kind of garment. A product picks its chart on its own page (Size
 * guide card); a change here shows on the storefront at once. Charts are kept per
 * store (src/stores/useSizeCharts.ts); `?store=<sales channel id>` opens the page
 * on one store's charts.
 */
const route = useRoute()
const router = useRouter()
const sizeCharts = useSizeChartsStore()
const salesChannels = useSalesChannelsStore()
const demoStores = useDemoStores()
const toast = useToast()

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

// ── Stores ───────────────────────────────────────────────────────────
// New charts go to a store with products of its own whose theme shows a size
// guide on the product page; a chart of another store still lists under its name.
const productStores = useProductStores(accountId)
const chartStores = computed(() => productStores.stores.value.filter((s) => demoStores.blueprintOf(s.id)?.capabilities.sizeGuide))
const storeName = (channelId: string) => salesChannels.getChannel(accountId.value, channelId)?.name ?? channelId
const charts = computed(() => sizeCharts.charts.filter((chart) => salesChannels.getChannel(accountId.value, chart.channelId)))

const queryStores = computed(() => {
  const value = route.query.store
  const list = (Array.isArray(value) ? value : [value]).flatMap((v) => (typeof v === 'string' ? v.split(',') : []))
  return list.filter((id) => !!salesChannels.getChannel(accountId.value, id))
})

/** The stores the page was opened on (`?store=`), kept in the picker after the filter is cleared. */
const linkedStores = [...queryStores.value]

/** Stores the page can be narrowed to: those with charts, those that can have them, and those the link asked for. */
const filterStoreIds = computed(() => [...new Set([
  ...charts.value.map((chart) => chart.channelId),
  ...chartStores.value.map((store) => store.id),
  ...linkedStores,
])])

// The store picker is the toolbar's one filter, so it lives there as a pill. It
// only shows when there is more than one store to tell apart.
const storeFilter = ref<string[]>([...queryStores.value])
const storeQuickFilter = computed(() => (filterStoreIds.value.length > 1
  ? { key: 'store', label: 'Store', icon: 'store', options: filterStoreIds.value.map((id) => ({ label: storeName(id), value: id })) }
  : undefined))
const activeFilters = computed(() => (storeFilter.value.length
  ? [{ key: 'store', label: `Store: ${storeFilter.value.map(storeName).join(', ')}` }]
  : []))

// The link says which stores are shown, so it can be shared or bookmarked.
watch(storeFilter, (ids) => {
  const store = ids.length ? ids.join(',') : undefined
  if (store === route.query.store) return
  void router.replace({ query: { ...route.query, store } })
})

const search = ref('')

// ── Table ────────────────────────────────────────────────────────────
interface ChartRow extends SizeChart {
  storeName: string
  sizeList: string
  sizeCount: number
  users: Product[]
  usedCount: number
}

const allRows = computed<ChartRow[]>(() => charts.value.map((chart) => {
  const users = sizeCharts.productsUsing(chart.id)
  return {
    ...chart,
    storeName: storeName(chart.channelId),
    sizeList: sizeRange(chart.rows),
    sizeCount: chart.rows.length,
    users,
    usedCount: users.length,
  }
}))

const rows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return allRows.value.filter((row) =>
    (!storeFilter.value.length || storeFilter.value.includes(row.channelId))
    && (!q || [row.name, row.storeName, ...row.columns, ...row.rows.map((r) => r.size)].some((text) => text.toLowerCase().includes(q))))
})

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Store', key: 'storeName', sortable: true, hideBelow: 'md' as const },
  { title: 'Unit', key: 'unit', sortable: true, hideBelow: 'md' as const },
  { title: 'Sizes', key: 'sizeList', sortable: false, hideBelow: 'sm' as const },
  { title: 'Used by', key: 'usedCount', sortable: true },
  { title: 'Actions', key: 'actions', headerProps: { class: 'mp-th-sr' }, sortable: false, width: 48 },
]
const { visibleHeaders, isVisible } = useResponsiveTableHeaders(headers)

const UNIT_LABELS: Record<SizeChart['unit'], string> = { in: 'Inches', cm: 'Centimeters' }
const plural = (n: number, one: string, other = `${one}s`) => `${n} ${n === 1 ? one : other}`

// ── Empty states ─────────────────────────────────────────────────────
const searching = computed(() => !!search.value.trim())
/** The one store the page is narrowed to, when it is narrowed to one. */
const onlyStore = computed(() => (storeFilter.value.length === 1 ? storeFilter.value[0]! : null))
const canCreateIn = (channelId: string | null) => !!channelId && chartStores.value.some((s) => s.id === channelId)

const empty = computed(() => {
  if (searching.value) {
    return { icon: 'search-x', title: `No size charts match “${search.value.trim()}”`, description: 'Try a chart name, a measurement such as Chest, or a size.', action: 'Clear search', run: () => { search.value = '' } }
  }
  if (onlyStore.value) {
    const name = storeName(onlyStore.value)
    return canCreateIn(onlyStore.value)
      ? { icon: 'ruler', title: `No size charts for ${name}`, description: 'Shoppers see a size guide on a product once it has a chart.', action: 'New size chart', run: () => openCreate(onlyStore.value) }
      : { icon: 'ruler', title: `No size charts for ${name}`, description: `${name} doesn’t show a size guide on its product pages.`, action: filterStoreIds.value.length > 1 ? 'Show every store' : undefined, run: () => { storeFilter.value = [] } }
  }
  if (storeFilter.value.length) {
    return { icon: 'ruler', title: 'No size charts for these stores', description: 'Pick another store, or show every store.', action: 'Show every store', run: () => { storeFilter.value = [] } }
  }
  return chartStores.value.length
    ? { icon: 'ruler', title: 'No size charts yet', description: 'Shoppers see a size guide on a product once it has a chart.', action: 'New size chart', run: () => openCreate() }
    : { icon: 'ruler', title: 'No size charts yet', description: 'Size charts are for stores that show a size guide on their product pages. This account has none yet.', action: undefined, run: () => {} }
})

// ── Create and edit ──────────────────────────────────────────────────
const drawer = ref(false)
const editing = ref<SizeChart | SizeChartDraft>(emptySizeChart(''))
const editingId = computed(() => ('id' in editing.value ? editing.value.id : null))

/** The stores the drawer offers: where new charts go, and the edited chart's own. */
const drawerStores = computed(() => {
  const ids = new Set(chartStores.value.map((s) => s.id))
  if (editingId.value) ids.add(editing.value.channelId)
  return [...ids].map((id) => ({ id, name: storeName(id) }))
})

const productLink = (product: Product): RouteLocationRaw => ({ name: 'ProductEdit', params: { accountId: accountId.value, productId: product.id } })

const usedBy = computed(() => (editingId.value
  ? sizeCharts.productsUsing(editingId.value).map((product) => ({ id: product.id, name: product.name, sizes: sizesOf(product), to: productLink(product) }))
  : []))

function openCreate(channelId: string | null = null): void {
  const store = canCreateIn(channelId) ? channelId! : canCreateIn(onlyStore.value) ? onlyStore.value! : chartStores.value[0]?.id
  if (!store) return
  editing.value = emptySizeChart(store)
  drawer.value = true
}

function openEdit(chart: SizeChart): void {
  const current = sizeCharts.getChart(chart.id)
  if (!current) return
  editing.value = current
  drawer.value = true
}

/** The first product page on the storefront that shows the chart, opened in a new tab. */
function storefrontAction(chart: SizeChart) {
  const product = sizeCharts.productsUsing(chart.id).find((p) => p.publishStatus === 'Published')
  if (!product) return undefined
  const href = router.resolve({ name: 'StorefrontProduct', params: { accountId: accountId.value, channelId: chart.channelId, handle: productHandle(product) } }).href
  return { label: 'View in store', onClick: () => { window.open(href, '_blank', 'noopener') } }
}

function save(draft: SizeChartDraft): void {
  if (editingId.value) {
    const chart = sizeCharts.updateChart(editingId.value, draft)
    drawer.value = false
    if (!chart) return
    const count = sizeCharts.productsUsing(chart.id).length
    toast.success(count
      ? `The size guide on ${plural(count, 'product')} shows the change.`
      : 'No product shows this chart yet. Pick it on a product’s page.', { title: `${chart.name} saved`, action: storefrontAction(chart) })
  } else {
    const chart = sizeCharts.createChart(draft)
    drawer.value = false
    toast.success('Pick it on a product’s page to show it in that product’s size guide.', { title: `${chart.name} created` })
  }
}

function duplicate(chart: SizeChart): void {
  const copy = sizeCharts.duplicateChart(chart.id)
  if (!copy) return
  toast.success('No product uses the copy yet.', { title: `${copy.name} created`, action: { label: 'Edit', onClick: () => openEdit(copy) } })
}

// ── Delete ───────────────────────────────────────────────────────────
// A chart that products show cannot go: the dialog names them, and each links to
// its page, where another chart can be picked. An unused chart is deleted after a confirm.
const pending = ref<ChartRow | null>(null)
const confirmDelete = ref(false)
const inUse = ref(false)

function askDelete(row: ChartRow): void {
  pending.value = row
  if (sizeCharts.productsUsing(row.id).length) inUse.value = true
  else confirmDelete.value = true
}

function doDelete(): void {
  const chart = pending.value
  if (!chart) return
  const result = sizeCharts.deleteChart(chart.id)
  if (result.deleted) toast.success(`${chart.name} deleted`)
  else if (result.usedBy.length) inUse.value = true
}

const pendingUsers = computed(() => (pending.value ? sizeCharts.productsUsing(pending.value.id) : []))
</script>

<template>
  <div class="h-100 d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="Products"
      title="Size charts"
      subtitle="The measurements shoppers see in the size guide on a product page."
    >
      <template #actions>
        <v-btn v-if="chartStores.length" color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate()">New size chart</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        v-model:quick-filter-value="storeFilter"
        title="All size charts"
        search-placeholder="Search size charts"
        :total-count="rows.length"
        :quick-filter="storeQuickFilter"
        :active-filters="activeFilters"
        @remove-filter="storeFilter = []"
        @clear-filters="storeFilter = []"
      />

      <v-data-table
        :headers="visibleHeaders"
        :items="rows"
        item-value="id"
        :items-per-page="15"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template #item.name="{ item }">
          <div class="py-2">
            <button type="button" class="mp-link text-body-2 font-weight-medium sc-name" @click="openEdit(item)">{{ item.name }}</button>
            <div class="text-caption text-medium-emphasis">
              {{ item.columns.join(' · ') || 'No measurements' }}
            </div>
            <!-- Dropped columns fold in here rather than disappearing. -->
            <div v-if="!isVisible('storeName') || !isVisible('unit') || !isVisible('sizeList')" class="text-caption text-medium-emphasis">
              {{ [!isVisible('sizeList') ? item.sizeList : '', !isVisible('unit') ? UNIT_LABELS[item.unit] : '', !isVisible('storeName') ? item.storeName : ''].filter(Boolean).join(' · ') }}
            </div>
          </div>
        </template>
        <template #item.storeName="{ item }">
          <span class="text-body-2">{{ item.storeName }}</span>
        </template>
        <template #item.unit="{ item }">
          <span class="text-body-2">{{ UNIT_LABELS[item.unit] }}</span>
        </template>
        <template #item.sizeList="{ item }">
          <span class="text-body-2 text-no-wrap">{{ item.sizeList || '—' }}</span>
          <span v-if="item.sizeCount > 1" class="text-body-2 text-medium-emphasis text-no-wrap"> · {{ item.sizeCount }} sizes</span>
        </template>
        <template #item.usedCount="{ item }">
          <v-tooltip v-if="item.usedCount" location="top" :text="item.users.map((p) => p.name).join(', ')">
            <template #activator="{ props: tip }">
              <v-chip v-bind="tip" size="x-small" variant="tonal" label tabindex="0">
                {{ plural(item.usedCount, 'product') }}
              </v-chip>
            </template>
          </v-tooltip>
          <span v-else class="text-body-2 text-medium-emphasis text-no-wrap">Not used</span>
        </template>
        <template #item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Size chart actions" :item-label="item.name">
            <MpMenuItem icon="pencil" title="Edit" @click="openEdit(item)" />
            <MpMenuItem icon="copy" title="Duplicate" @click="duplicate(item)" />
            <v-divider class="my-1" />
            <MpMenuItem icon="trash-2" title="Delete" danger @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>
        <template #no-data>
          <MpEmptyState
            :icon="empty.icon"
            :title="empty.title"
            :description="empty.description"
            :action-label="empty.action"
            :action-icon="empty.action === 'New size chart' ? 'plus' : undefined"
            @action="empty.run()"
          />
        </template>
      </v-data-table>
    </v-card>

    <SizeChartDrawer
      v-model="drawer"
      :chart="editing"
      :stores="drawerStores"
      :others="charts"
      :used-by="usedBy"
      @save="save"
    />

    <MpConfirmDialog
      v-model="confirmDelete"
      danger
      :title="`Delete ${pending?.name ?? 'this size chart'}?`"
      message="No product uses it, so no size guide changes. This cannot be undone."
      confirm-label="Delete chart"
      @confirm="doDelete"
    />

    <MpDialog v-model="inUse" :title="`${pending?.name ?? 'This chart'} is in use`" icon="ruler" size="sm">
      <p class="sc-in-use__text">
        {{ pendingUsers.length === 1 ? `${pendingUsers[0]!.name} shows this chart in its size guide` : `These ${pendingUsers.length} products show this chart in their size guide` }},
        so it can’t be deleted. Pick another chart in the Size guide card on
        {{ pendingUsers.length === 1 ? 'the product’s page' : 'each product’s page' }} first.
      </p>
      <div class="d-flex flex-column">
        <MpListRow
          v-for="product in pendingUsers"
          :key="product.id"
          variant="divided"
          :title="product.name"
          :subtitle="sizesOf(product).length ? `Sizes ${sizesOf(product).join(' · ')}` : undefined"
          :to="productLink(product)"
        >
          <template #trailing><v-icon icon="chevron-right" size="16" aria-hidden="true" /></template>
        </MpListRow>
      </div>
      <template #footer>
        <v-btn color="primary" variant="flat" class="text-none" @click="inUse = false">Close</v-btn>
      </template>
    </MpDialog>
  </div>
</template>

<style scoped>
/* A chart's name opens its drawer: a button that reads as the table's link. */
.sc-name {
  padding: 0;
  border: 0;
  background: none;
  text-align: start;
  cursor: pointer;
}

.sc-in-use__text {
  margin: 0;
  color: var(--text-secondary);
}
</style>
