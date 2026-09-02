<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useProductExtrasStore, formatStamp,
  CATALOG_SOURCES, CATALOG_CATEGORIES, FEED_TYPES, FEED_PERIODS, FEED_SORTS, FEED_BRANDS, FEED_STORES,
  type CatalogProduct, type ProductFeed, type FeedTemplate,
  type FeedInput, type FeedType,
} from '@/stores/useProductExtras'
import { useToast } from '@/composables/useToast'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import MpAlert from '@/components/MpAlert.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpDialog from '@/components/MpDialog.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

/**
 * Product Recommendations — the catalog that feeds e-mail recommendation
 * blocks, the feeds that select from it, and the templates that render it.
 * Rebuilt from UAT account 116000; see docs/rebuild/product-recommendations/.
 */
const store = useProductExtrasStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const accountId = computed(() => String(route.params.accountId))
const commerceBase = computed(() => `/commerce/${accountId.value}/product_recommendations`)

// ── Tabs (route-backed, like UAT) ────────────────────────────────────
const TAB_KEYS = ['catalog', 'feeds', 'templates'] as const
type TabKey = (typeof TAB_KEYS)[number]

const tabs = [
  { label: 'Product Catalog', key: 'catalog' },
  { label: 'Product Feeds', key: 'feeds' },
  { label: 'Product Feed Templates', key: 'templates' },
]

function tabFromRoute(): TabKey {
  const name = String(route.name ?? '')
  if (name === 'ProductFeeds') return 'feeds'
  if (name === 'ProductFeedTemplates') return 'templates'
  return 'catalog'
}

const activeTab = ref<TabKey>(tabFromRoute())
watch(() => route.name, () => { activeTab.value = tabFromRoute() })
watch(activeTab, (tab) => {
  const path = tab === 'catalog' ? commerceBase.value
    : tab === 'feeds' ? `${commerceBase.value}/product_feeds`
      : `${commerceBase.value}/product_feed_templates`
  if (route.path !== path) router.replace(path)
})

const money = (n: number) => `${n < 0 ? '-' : ''}$${Math.abs(n).toFixed(2)}`

// ══ Tab 1 — Product Catalog ═════════════════════════════════════════
// Source is the promoted filter: a multi-select pill in the toolbar, so the
// cut merchants make most often doesn't cost a trip to the drawer.
const sourceQuickFilter = {
  key: 'source',
  label: 'Source',
  options: CATALOG_SOURCES.map((s) => ({ label: s, value: s })),
}
const sourceFilter = ref<string[]>([])
const catalogSearch = ref('')

const catalogHeaders = [
  { title: 'Item ID', key: 'itemId', sortable: true, hideBelow: 'md' as const },
  { title: 'Product', key: 'name', sortable: true, minWidth: '260px' },
  { title: 'Price', key: 'price', align: 'end' as const, sortable: true },
  { title: 'Created at', key: 'createdAt', sortable: true, hideBelow: 'lg' as const },
  { title: 'Updated at', key: 'updatedAt', sortable: true, hideBelow: 'md' as const },
  { title: '', key: 'actions', sortable: false, width: 56 },
]
const { visibleHeaders: catalogVisibleHeaders } = useResponsiveTableHeaders(catalogHeaders)

const filteredCatalog = computed(() => {
  const term = catalogSearch.value.trim().toLowerCase()
  return store.catalog.filter((p) => {
    const bySource = !sourceFilter.value.length || sourceFilter.value.includes(p.source)
    const byTerm = !term || p.name.toLowerCase().includes(term) || p.itemId.toLowerCase().includes(term)
    return bySource && byTerm
  })
})

/** Products missing a mandatory field are excluded from recommendations upstream. */
function isIncomplete(p: CatalogProduct): boolean {
  return !p.name.trim() || !p.storeUrl.trim() || !p.imageUrl.trim()
}
const incompleteCount = computed(() => store.catalog.filter(isIncomplete).length)

const catalogFilterEntries = computed(() =>
  sourceFilter.value.length ? [{ key: 'source', label: `Source: ${sourceFilter.value.join(', ')}` }] : [],
)

// Edit product drawer
const editDrawer = ref(false)
const editGuard = ref(false)
const editingItemId = ref<string | null>(null)
const editForm = ref({ name: '', price: '', imageUrl: '', storeUrl: '', categories: [] as string[], description: '' })
const editSnapshot = ref('')

const editSource = computed(() => store.catalog.find((p) => p.itemId === editingItemId.value)?.source ?? '')
const editDirty = computed(() => JSON.stringify(editForm.value) !== editSnapshot.value)
const editValid = computed(() =>
  editForm.value.name.trim().length > 0
  && editForm.value.storeUrl.trim().length > 0
  && editForm.value.price.trim().length > 0
  && !Number.isNaN(Number(editForm.value.price)),
)

function openEditProduct(product: CatalogProduct) {
  editingItemId.value = product.itemId
  editForm.value = {
    name: product.name,
    price: String(product.price),
    imageUrl: product.imageUrl,
    storeUrl: product.storeUrl,
    categories: [...product.categories],
    description: product.description,
  }
  editSnapshot.value = JSON.stringify(editForm.value)
  editDrawer.value = true
}

function requestCloseEdit() {
  if (editDirty.value) editGuard.value = true
  else editDrawer.value = false
}

function discardEdit() {
  editDrawer.value = false
}

function saveProduct() {
  if (!editingItemId.value || !editValid.value) return
  store.updateCatalogProduct(editingItemId.value, {
    name: editForm.value.name.trim(),
    price: Number(editForm.value.price),
    imageUrl: editForm.value.imageUrl.trim(),
    storeUrl: editForm.value.storeUrl.trim(),
    categories: editForm.value.categories,
    description: editForm.value.description.trim(),
  })
  editDrawer.value = false
  toast.success('Product updated')
}

// Import catalog dialog
const importDialog = ref(false)
const importFile = ref<File[] | File | null>(null)
const importDelimiter = ref<'Comma' | 'Semi-Colon'>('Comma')
const importStep = ref<1 | 2>(1)
const importing = ref(false)

const importFileName = computed(() => {
  const f = Array.isArray(importFile.value) ? importFile.value[0] : importFile.value
  return f?.name ?? ''
})

function openImport() {
  importFile.value = null
  importDelimiter.value = 'Comma'
  importStep.value = 1
  importDialog.value = true
}

function continueImport() {
  if (!importFileName.value) return
  importStep.value = 2
}

async function runImport() {
  importing.value = true
  await new Promise((resolve) => setTimeout(resolve, 700))
  const added = store.importCatalog(importFileName.value, 3)
  importing.value = false
  importDialog.value = false
  toast.success(`${added} products imported from ${importFileName.value}`)
}

// ══ Tab 2 — Product Feeds ═══════════════════════════════════════════
const feedSearch = ref('')

const feedHeaders = [
  { title: 'Name', key: 'name', sortable: true, minWidth: '240px' },
  { title: 'Metric', key: 'metric', sortable: true },
  { title: 'Created at', key: 'createdAt', sortable: true, hideBelow: 'lg' as const },
  { title: 'Updated at', key: 'updatedAt', sortable: true, hideBelow: 'md' as const },
  { title: '', key: 'actions', sortable: false, width: 56 },
]
const { visibleHeaders: feedVisibleHeaders } = useResponsiveTableHeaders(feedHeaders)

const filteredFeeds = computed(() => {
  const term = feedSearch.value.trim().toLowerCase()
  return term ? store.productFeeds.filter((f) => f.name.toLowerCase().includes(term)) : store.productFeeds
})

/** Metrics on legacy rows that the current form can no longer produce. */
const LEGACY_METRICS = ['Bought Together', 'Similar Products', 'Trending']
const isLegacyMetric = (metric: string) => LEGACY_METRICS.includes(metric)

const feedDrawer = ref(false)
const feedGuard = ref(false)
const editingFeedId = ref<number | null>(null)
const emptyFeedForm = (): FeedInput => ({
  name: '', activeOnly: true, inStockOnly: true, webstoreApprovedOnly: true,
  source: 'Default', storeName: '', brands: [], categoryMode: 'all', categories: [],
  metric: 'Best Sellers', period: 'Last 5 days', sortBy: 'Random',
})
const feedForm = ref<FeedInput>(emptyFeedForm())
const feedSnapshot = ref('')

/** Only store-backed sources carry a store name; Default is account-wide. */
const feedNeedsStore = computed(() => ['Shopify', 'Commerce Cloud', 'Magento', 'Woocommerce'].includes(feedForm.value.source))
const feedDirty = computed(() => JSON.stringify(feedForm.value) !== feedSnapshot.value)
const feedValid = computed(() =>
  feedForm.value.name.trim().length > 0
  && feedForm.value.source.length > 0
  && (!feedNeedsStore.value || feedForm.value.storeName.length > 0)
  && (feedForm.value.categoryMode === 'all' || feedForm.value.categories.length > 0),
)

function openCreateFeed() {
  editingFeedId.value = null
  feedForm.value = emptyFeedForm()
  feedSnapshot.value = JSON.stringify(feedForm.value)
  feedDrawer.value = true
}

function openEditFeed(feed: ProductFeed) {
  editingFeedId.value = feed.id
  feedForm.value = {
    name: feed.name,
    activeOnly: feed.activeOnly,
    inStockOnly: feed.inStockOnly,
    webstoreApprovedOnly: feed.webstoreApprovedOnly,
    source: feed.source,
    storeName: feed.storeName,
    brands: [...feed.brands],
    categoryMode: feed.categoryMode,
    categories: [...feed.categories],
    // Legacy metrics can't round-trip through the current type list.
    metric: (FEED_TYPES as readonly string[]).includes(feed.metric) ? (feed.metric as FeedType) : 'Best Sellers',
    period: feed.period,
    sortBy: feed.sortBy,
  }
  feedSnapshot.value = JSON.stringify(feedForm.value)
  feedDrawer.value = true
}

function requestCloseFeed() {
  if (feedDirty.value) feedGuard.value = true
  else feedDrawer.value = false
}

function saveFeed() {
  if (!feedValid.value) return
  const payload: FeedInput = {
    ...feedForm.value,
    name: feedForm.value.name.trim(),
    storeName: feedNeedsStore.value ? feedForm.value.storeName : '',
    categories: feedForm.value.categoryMode === 'all' ? [] : feedForm.value.categories,
  }
  if (editingFeedId.value !== null) {
    store.updateFeed(editingFeedId.value, payload)
    toast.success('Product feed updated')
  } else {
    store.addFeed(payload)
    toast.success('Product feed created')
  }
  feedDrawer.value = false
}

// ══ Tab 3 — Product Feed Templates ══════════════════════════════════
const templateScope = ref<'active' | 'archived'>('active')

// Active vs archived is an exclusive mode, not a filter — there is no "all",
// because the table has no column that would tell the two sets apart. It rides
// the toolbar's single-select pill so it matches the row it sits in.
const templateScopeQuickFilter = {
  key: 'scope',
  label: 'Show',
  multiple: false,
  options: [
    { label: 'Active templates', value: 'active' },
    { label: 'Archived templates', value: 'archived' },
  ],
}
const templateScopeFilter = computed({
  get: () => [templateScope.value],
  set: (v: string[]) => { templateScope.value = (v[0] as 'active' | 'archived') ?? 'active' },
})
const templateSearch = ref('')

const templateHeaders = [
  { title: 'Name', key: 'name', sortable: true, minWidth: '260px' },
  { title: 'Block layout', key: 'layout', sortable: false },
  { title: 'Created at', key: 'createdAt', sortable: true, hideBelow: 'lg' as const },
  { title: 'Updated at', key: 'updatedAt', sortable: true, hideBelow: 'md' as const },
  { title: '', key: 'actions', sortable: false, width: 56 },
]
const { visibleHeaders: templateVisibleHeaders } = useResponsiveTableHeaders(templateHeaders)

const filteredTemplates = computed(() => {
  const term = templateSearch.value.trim().toLowerCase()
  return store.feedTemplates.filter((t) => {
    const byScope = templateScope.value === 'archived' ? t.archived : !t.archived
    const byTerm = !term || t.name.toLowerCase().includes(term)
    return byScope && byTerm
  })
})

function openCreateTemplate() {
  router.push(`${commerceBase.value}/product_feed_templates/new`)
}

function openEditTemplate(template: FeedTemplate) {
  router.push(`${commerceBase.value}/product_feed_templates/${template.id}`)
}

const confirmArchive = ref(false)
const pendingArchive = ref<FeedTemplate | null>(null)

function askArchive(template: FeedTemplate) {
  pendingArchive.value = template
  confirmArchive.value = true
}

function doArchive() {
  if (!pendingArchive.value) return
  store.archiveTemplate(pendingArchive.value.id)
  toast.success(`“${pendingArchive.value.name}” archived`)
  pendingArchive.value = null
}

function restore(template: FeedTemplate) {
  store.restoreTemplate(template.id)
  toast.success(`“${template.name}” restored`)
}
</script>

<template>
  <div class="h-100 d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="My Product Recommendations"
      title="Product Recommendations"
      subtitle="Maintain the catalog, feeds and templates behind recommendation blocks in your emails."
    >
      <template #actions>
        <v-btn v-if="activeTab === 'catalog'" color="primary" variant="flat" prepend-icon="upload" class="text-none" @click="openImport">
          Import product catalog
        </v-btn>
        <v-btn v-else-if="activeTab === 'feeds'" color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreateFeed">
          New product feed
        </v-btn>
        <v-btn v-else color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreateTemplate">
          New feed template
        </v-btn>
      </template>
      <template #tabs>
        <MpFilterTabs v-model="activeTab" :tabs="tabs" aria-label="Product recommendations sections" controls-id="rec-panel" />
      </template>
    </MpPageHeader>

    <div id="rec-panel" class="flex-grow-1 d-flex flex-column ga-4">
      <!-- ══ Product Catalog ══════════════════════════════════════════ -->
      <template v-if="activeTab === 'catalog'">
        <MpAlert tone="info" live="off">
          Importing a catalog creates or updates products. Products missing an Item ID, name, price,
          image URL or store URL are left out of recommendations.
          <a class="rec-alert__link" href="https://galaxy.maropost.com/s/article/Product-Catalog" target="_blank" rel="noopener">
            Learn more about Product Catalog
          </a>
          <template v-if="incompleteCount > 0">
            <br>
            <strong>{{ incompleteCount }}</strong> {{ incompleteCount === 1 ? 'product is' : 'products are' }} incomplete right now.
          </template>
        </MpAlert>

        <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
          <MpDataTableToolbar
            v-model:search="catalogSearch"
            title="Product catalog"
            search-placeholder="Search name or item ID"
            v-model:quick-filter-value="sourceFilter"
            :total-count="filteredCatalog.length"
            :quick-filter="sourceQuickFilter"
            :active-filters="catalogFilterEntries"
            @remove-filter="sourceFilter = []"
            @clear-filters="sourceFilter = []"
          />

          <v-data-table
            :headers="catalogVisibleHeaders"
            :items="filteredCatalog"
            :items-per-page="10"
            hover
            density="comfortable"
            fixed-header
            class="flex-grow-1"
          >
            <template #item.itemId="{ item }">
              <span class="rec-mono text-body-2">{{ item.itemId }}</span>
            </template>
            <template #item.name="{ item }">
              <div class="d-flex align-center ga-3 py-2">
                <v-avatar :size="36" rounded="lg" class="border flex-shrink-0">
                  <v-img v-if="item.imageUrl" :src="item.imageUrl" cover :alt="''">
                    <template #error>
                      <div class="rec-thumb-fallback"><v-icon size="16">image</v-icon></div>
                    </template>
                  </v-img>
                  <div v-else class="rec-thumb-fallback"><v-icon size="16">image</v-icon></div>
                </v-avatar>
                <div class="min-w-0">
                  <div v-if="item.name" class="text-body-2 font-weight-medium">{{ item.name }}</div>
                  <div v-else class="text-body-2 text-medium-emphasis font-italic">Untitled product</div>
                  <div v-if="isIncomplete(item)" class="rec-incomplete d-flex align-center ga-1 text-caption">
                    <v-icon size="16">triangle-alert</v-icon>
                    Incomplete — excluded from recommendations
                  </div>
                </div>
              </div>
            </template>
            <template #item.price="{ item }">
              <span class="text-body-2" :class="item.price <= 0 ? 'text-medium-emphasis' : ''">{{ money(item.price) }}</span>
            </template>
            <template #item.createdAt="{ item }">
              <span class="text-body-2 text-medium-emphasis">{{ formatStamp(item.createdAt) }}</span>
            </template>
            <template #item.updatedAt="{ item }">
              <span class="text-body-2 text-medium-emphasis">{{ formatStamp(item.updatedAt) }}</span>
            </template>
            <template #item.actions="{ item }">
              <MpRowActionsMenu ariaLabel="Product actions" :item-label="item.name || item.itemId">
                <MpMenuItem icon="pencil" title="Edit product" @click="openEditProduct(item)" />
              </MpRowActionsMenu>
            </template>
            <template #no-data>
              <MpEmptyState
                icon="package"
                :title="catalogSearch || sourceFilter.length ? 'No products match your filters' : 'No catalog products yet'"
                :description="catalogSearch || sourceFilter.length ? 'Try a different search term or clear the source filter.' : 'Import a product catalog to power recommendation blocks.'"
                :action-label="catalogSearch || sourceFilter.length ? undefined : 'Import product catalog'"
                :action-icon="catalogSearch || sourceFilter.length ? undefined : 'upload'"
                @action="openImport"
              />
            </template>
          </v-data-table>
        </v-card>
      </template>

      <!-- ══ Product Feeds ════════════════════════════════════════════ -->
      <template v-else-if="activeTab === 'feeds'">
        <MpAlert tone="info" live="off">
          Product recommendations are only generated once a product catalog has been imported.
        </MpAlert>

        <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
          <MpDataTableToolbar
            v-model:search="feedSearch"
            title="Product feeds"
            search-placeholder="Search feed name"
            :total-count="filteredFeeds.length"
          />

          <v-data-table
            :headers="feedVisibleHeaders"
            :items="filteredFeeds"
            :items-per-page="10"
            hover
            density="comfortable"
            fixed-header
            class="flex-grow-1"
          >
            <template #item.name="{ item }">
              <span class="text-body-2 font-weight-medium">{{ item.name }}</span>
            </template>
            <template #item.metric="{ item }">
              <div class="d-flex align-center ga-2">
                <v-chip size="small" variant="tonal" :color="isLegacyMetric(item.metric) ? 'secondary' : 'primary'" label>
                  {{ item.metric }}
                </v-chip>
                <v-tooltip v-if="isLegacyMetric(item.metric)" location="top" text="Legacy metric — kept on existing feeds, but new feeds can't select it.">
                  <template #activator="{ props: tip }">
                    <v-icon v-bind="tip" size="16" class="text-medium-emphasis" tabindex="0" role="img"
                            aria-label="Legacy metric — kept on existing feeds, but new feeds can't select it.">info</v-icon>
                  </template>
                </v-tooltip>
              </div>
            </template>
            <template #item.createdAt="{ item }">
              <span class="text-body-2 text-medium-emphasis">{{ formatStamp(item.createdAt) }}</span>
            </template>
            <template #item.updatedAt="{ item }">
              <span class="text-body-2 text-medium-emphasis">{{ formatStamp(item.updatedAt) }}</span>
            </template>
            <template #item.actions="{ item }">
              <MpRowActionsMenu ariaLabel="Feed actions" :item-label="item.name">
                <MpMenuItem icon="pencil" title="Edit product feed" @click="openEditFeed(item)" />
              </MpRowActionsMenu>
            </template>
            <template #no-data>
              <MpEmptyState
                icon="list-filter"
                :title="feedSearch ? 'No feeds match your search' : 'No product feeds yet'"
                :description="feedSearch ? 'Try a different search term.' : 'A feed picks the products a recommendation block should draw from.'"
                :action-label="feedSearch ? undefined : 'New product feed'"
                :action-icon="feedSearch ? undefined : 'plus'"
                @action="openCreateFeed"
              />
            </template>
          </v-data-table>
        </v-card>
      </template>

      <!-- ══ Product Feed Templates ═══════════════════════════════════ -->
      <template v-else>
        <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
          <MpDataTableToolbar
            v-model:search="templateSearch"
            v-model:quick-filter-value="templateScopeFilter"
            title="Feed templates"
            search-placeholder="Search template name"
            :quick-filter="templateScopeQuickFilter"
            :total-count="filteredTemplates.length"
          />

          <v-data-table
            :headers="templateVisibleHeaders"
            :items="filteredTemplates"
            :items-per-page="10"
            hover
            density="comfortable"
            fixed-header
            class="flex-grow-1"
          >
            <template #item.name="{ item }">
              <span class="text-body-2 font-weight-medium">{{ item.name }}</span>
            </template>
            <template #item.layout="{ item }">
              <v-chip size="small" variant="tonal" label>
                {{ item.rows }} × {{ item.columns }}
              </v-chip>
              <span class="text-caption text-medium-emphasis ml-2">{{ item.rows * item.columns }} products</span>
            </template>
            <template #item.createdAt="{ item }">
              <span class="text-body-2 text-medium-emphasis">{{ formatStamp(item.createdAt) }}</span>
            </template>
            <template #item.updatedAt="{ item }">
              <span class="text-body-2 text-medium-emphasis">{{ formatStamp(item.updatedAt) }}</span>
            </template>
            <template #item.actions="{ item }">
              <MpRowActionsMenu ariaLabel="Template actions" :item-label="item.name">
                <MpMenuItem icon="pencil" title="Edit feed template" @click="openEditTemplate(item)" />
                <template v-if="item.archived">
                  <MpMenuItem icon="archive-restore" title="Restore feed template" @click="restore(item)" />
                </template>
                <template v-else>
                  <v-divider class="my-1" />
                  <MpMenuItem icon="archive" title="Archive feed template" @click="askArchive(item)" />
                </template>
              </MpRowActionsMenu>
            </template>
            <template #no-data>
              <MpEmptyState
                icon="layout-grid"
                :title="templateScope === 'archived' ? 'No archived templates' : templateSearch ? 'No templates match your search' : 'No feed templates yet'"
                :description="templateScope === 'archived' ? 'Templates you archive are kept here and can be restored.' : 'A template lays out how recommended products render inside an email.'"
                :action-label="templateScope === 'archived' || templateSearch ? undefined : 'New feed template'"
                :action-icon="templateScope === 'archived' || templateSearch ? undefined : 'plus'"
                @action="openCreateTemplate"
              />
            </template>
          </v-data-table>
        </v-card>
      </template>
    </div>

    <!-- ── Edit catalog product ─────────────────────────────────────── -->
    <MpFormDrawer
      v-model="editDrawer"
      title="Edit product"
      subtitle="Catalog record used by recommendation blocks"
      size="lg"
      guarded
      @close="requestCloseEdit"
    >
      <MpAlert tone="warning" live="off">
        Edits here are overwritten at the next catalog sync from
        <strong>{{ editSource }}</strong>.
      </MpAlert>

      <MpFormSection title="Identity" />
      <MpFormGrid :cols="2">
        <MpFormField label="Item ID">
          <template #default="{ labelId }">
            <div class="rec-readonly text-body-2" :aria-labelledby="labelId">{{ editingItemId }}</div>
          </template>
        </MpFormField>
        <MpFormField label="Source">
          <template #default="{ labelId }">
            <div class="rec-readonly text-body-2" :aria-labelledby="labelId">{{ editSource }}</div>
          </template>
        </MpFormField>
      </MpFormGrid>

      <MpFormSection title="Details" required />
      <MpFormGrid :cols="2">
        <v-text-field
          v-model="editForm.name"
          label="Name *"
          :error-messages="editForm.name.trim() ? [] : ['Name is required']"
          class="mp-form-grid__full"
        />
        <v-text-field
          v-model="editForm.price"
          label="Price *"
          type="number"
          prefix="$"
          :error-messages="editForm.price.trim() && !Number.isNaN(Number(editForm.price)) ? [] : ['Enter a price']"
        />
        <v-text-field v-model="editForm.imageUrl" label="Image URL" placeholder="https://…" />
        <v-text-field
          v-model="editForm.storeUrl"
          label="Store URL *"
          placeholder="https://…"
          :error-messages="editForm.storeUrl.trim() ? [] : ['Store URL is required']"
          class="mp-form-grid__full"
        />
        <v-select
          v-model="editForm.categories"
          :items="CATALOG_CATEGORIES"
          label="Category"
          multiple
          chips
          closable-chips
          hint="Choose one or more categories from the list."
          persistent-hint
          class="mp-form-grid__full"
        />
        <v-textarea v-model="editForm.description" label="Description" rows="3" class="mp-form-grid__full" />
      </MpFormGrid>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="requestCloseEdit">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!editValid" @click="saveProduct">Save</v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="editGuard"
      title="Discard your changes?"
      message="This product has unsaved edits. Closing now discards them."
      confirm-label="Discard changes"
      danger
      @confirm="discardEdit"
    />

    <!-- ── Import product catalog ───────────────────────────────────── -->
    <MpDialog v-model="importDialog" title="Import product catalog" size="md">
      <template v-if="importStep === 1">
        <p class="text-body-2 text-medium-emphasis">
          Your catalog's data is used to build product feeds. Rows missing the mandatory fields —
          <strong>Item ID, Name, Price, Image URL and Store URL</strong> — are skipped and won't appear
          in recommendations.
        </p>

        <MpFormSection title="Select file" required description="CSV, TXT or ZIP up to 128 MB. A ZIP must contain exactly one .csv or .txt file." />
        <v-file-input
          v-model="importFile"
          label="Catalog file *"
          accept=".csv,.txt,.zip"
          prepend-icon=""
          prepend-inner-icon="paperclip"
        />
        <v-btn variant="text" size="small" prepend-icon="download" class="text-none align-self-start">
          Download example file
        </v-btn>

        <MpFormSection title="Delimiter" />
        <MpFormField label="Column delimiter">
          <template #default="{ labelId }">
            <v-radio-group v-model="importDelimiter" inline hide-details :aria-labelledby="labelId">
              <v-radio label="Comma" value="Comma" />
              <v-radio label="Semi-colon" value="Semi-Colon" />
            </v-radio-group>
          </template>
        </MpFormField>
      </template>

      <template v-else>
        <p class="text-body-2">Ready to import <strong>{{ importFileName }}</strong>.</p>
        <MpFormSection title="Summary" />
        <dl class="mp-label-value rec-dl">
          <div>
            <dt class="mp-meta-label text-medium-emphasis">File</dt>
            <dd class="text-body-2">{{ importFileName }}</dd>
          </div>
          <div>
            <dt class="mp-meta-label text-medium-emphasis">Delimiter</dt>
            <dd class="text-body-2">{{ importDelimiter === 'Comma' ? 'Comma' : 'Semi-colon' }}</dd>
          </div>
          <div>
            <dt class="mp-meta-label text-medium-emphasis">Mode</dt>
            <dd class="text-body-2">Create or update by Item ID</dd>
          </div>
        </dl>
      </template>

      <template #footer>
        <v-btn variant="text" class="text-none" :disabled="importing" @click="importDialog = false">Cancel</v-btn>
        <v-btn v-if="importStep === 1" color="primary" variant="flat" class="text-none" :disabled="!importFileName" @click="continueImport">
          Continue
        </v-btn>
        <v-btn v-else color="primary" variant="flat" class="text-none" :loading="importing" @click="runImport">
          Start import
        </v-btn>
      </template>
      <template #footerStart>
        <v-btn v-if="importStep === 2" variant="text" class="text-none" :disabled="importing" @click="importStep = 1">Back</v-btn>
      </template>
    </MpDialog>

    <!-- ── New / Edit product feed ──────────────────────────────────── -->
    <MpFormDrawer
      v-model="feedDrawer"
      :title="editingFeedId !== null ? 'Edit product feed' : 'New product feed'"
      subtitle="Choose which catalog products a recommendation block draws from"
      size="lg"
      guarded
      @close="requestCloseFeed"
    >
      <MpFormSection title="General" required />
      <MpFormGrid>
        <v-text-field
          v-model="feedForm.name"
          label="Product feed name *"
          :error-messages="feedForm.name.trim() ? [] : ['Name is required']"
        />
        <MpFormField label="Include only">
          <template #default="{ labelId }">
            <div class="d-flex flex-column ga-2" :aria-labelledby="labelId">
              <v-switch v-model="feedForm.activeOnly" label="Active products only" hide-details density="compact" />
              <v-switch v-model="feedForm.inStockOnly" label="In-stock products only" hide-details density="compact" />
              <v-switch v-model="feedForm.webstoreApprovedOnly" label="Webstore-approved products only" hide-details density="compact" />
            </div>
          </template>
        </MpFormField>
      </MpFormGrid>

      <MpFormSection title="Source" required />
      <MpFormGrid :cols="2">
        <v-select
          v-model="feedForm.source"
          :items="[...CATALOG_SOURCES]"
          label="Source *"
          :class="feedNeedsStore ? '' : 'mp-form-grid__full'"
        />
        <v-select
          v-if="feedNeedsStore"
          v-model="feedForm.storeName"
          :items="FEED_STORES"
          label="Store name *"
          :error-messages="feedForm.storeName ? [] : ['Choose the store this feed reads from']"
        />
        <v-select
          v-model="feedForm.brands"
          :items="FEED_BRANDS"
          label="Brand"
          multiple
          chips
          closable-chips
          clearable
          class="mp-form-grid__full"
        />
      </MpFormGrid>

      <MpFormSection title="Filter categories" />
      <MpFormField label="Category scope">
        <template #default="{ labelId }">
          <v-radio-group v-model="feedForm.categoryMode" hide-details :aria-labelledby="labelId">
            <v-radio label="Show all categories" value="all" />
            <v-radio label="Limit to specific categories" value="limit" />
            <v-radio label="Exclude specific categories" value="exclude" />
          </v-radio-group>
        </template>
      </MpFormField>
      <v-select
        v-if="feedForm.categoryMode !== 'all'"
        v-model="feedForm.categories"
        :items="CATALOG_CATEGORIES"
        :label="feedForm.categoryMode === 'limit' ? 'Categories to include *' : 'Categories to exclude *'"
        multiple
        chips
        closable-chips
        :error-messages="feedForm.categories.length ? [] : ['Choose at least one category']"
      />

      <MpFormSection title="Recommendations type" />
      <MpFormGrid :cols="2">
        <v-select v-model="feedForm.metric" :items="[...FEED_TYPES]" label="Type" />
        <v-select v-model="feedForm.period" :items="[...FEED_PERIODS]" label="Based on" />
      </MpFormGrid>

      <MpFormSection title="Sort by" />
      <MpFormField label="Product order">
        <template #default="{ labelId }">
          <v-radio-group v-model="feedForm.sortBy" hide-details :aria-labelledby="labelId">
            <v-radio v-for="sort in FEED_SORTS" :key="sort" :label="sort" :value="sort" />
          </v-radio-group>
        </template>
      </MpFormField>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="requestCloseFeed">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!feedValid" @click="saveFeed">
          {{ editingFeedId !== null ? 'Save changes' : 'Create feed' }}
        </v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="feedGuard"
      title="Discard your changes?"
      message="This feed has unsaved changes. Closing now discards them."
      confirm-label="Discard changes"
      danger
      @confirm="feedDrawer = false"
    />

    <MpConfirmDialog
      v-model="confirmArchive"
      title="Archive this template?"
      :message="`“${pendingArchive?.name}” stops being available to new emails. You can restore it from the archived list.`"
      confirm-label="Archive template"
      @confirm="doArchive"
    />
  </div>
</template>

<style scoped>
.rec-alert__link {
  color: inherit;
  font-weight: var(--mp-fontWeight-semibold);
}

.rec-thumb-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-secondary);
  color: var(--on-surface-muted);
}

.rec-mono {
  font-family: var(--mp-fontFamily-mono);
}

/* Warm soft-surface ink, not the raw warning hue — the text has to pass on white. */
.rec-incomplete {
  color: var(--warn-ink);
}

.rec-readonly {
  min-height: var(--mp-component-control-height);
  display: flex;
  align-items: center;
  color: var(--on-surface);
}

/* Import summary: the shared label/value grid, single column inside the dialog. */
.rec-dl {
  grid-template-columns: 1fr;
  gap: var(--mp-space-12);
}

.min-w-0 {
  min-width: 0;
}
</style>
