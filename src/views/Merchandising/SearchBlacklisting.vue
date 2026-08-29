<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import {
  useMerchandisingStore,
  type BlacklistLogic,
  type BlacklistTerm,
} from '@/stores/useMerchandising'

const store = useMerchandisingStore()

const activeTab = ref<'terms' | 'products'>('terms')
const tabs = computed(() => [
  { label: 'Search suggestions', key: 'terms', count: store.blacklistTermList.length },
  { label: 'Product matches', key: 'products', count: store.blacklistedProductList.length },
])

/* ── Search suggestions tab ─────────────────────────────────────── */

const logicOptions: Array<{ title: string; value: BlacklistLogic }> = [
  { title: 'Exact match', value: 'exact' },
  { title: 'Contains', value: 'contains' },
]

const newLogic = ref<BlacklistLogic>('exact')
const newTerm = ref('')

function addTerm() {
  const term = newTerm.value.trim()
  if (!term) return
  store.createBlacklistTerm({ logic: newLogic.value, term })
  newTerm.value = ''
}

const termHeaders = [
  { title: 'Logic', key: 'logic', sortable: false, width: 160 },
  { title: 'Term', key: 'term', sortable: true },
  { title: '', key: 'actions', sortable: false, align: 'end' as const, width: 64 },
]

const deleteDialog = ref(false)
const termPendingDelete = ref<BlacklistTerm | null>(null)

function askDeleteTerm(term: BlacklistTerm) {
  termPendingDelete.value = term
  deleteDialog.value = true
}

function confirmDeleteTerm() {
  if (termPendingDelete.value) store.deleteBlacklistTerm(termPendingDelete.value.id)
  termPendingDelete.value = null
}

/* ── Product matches tab ────────────────────────────────────────── */

const productHeaders = [
  { title: 'Product', key: 'product', sortable: false },
  { title: 'Blacklisted', key: 'active', sortable: false, align: 'end' as const, width: 140 },
]

const blacklistedRows = computed(() =>
  store.blacklistedProductList.map((row) => ({
    ...row,
    product: store.merchProductList.find((p) => p.id === row.productId),
  })),
)

const addableProducts = computed(() => {
  const blacklistedIds = new Set(store.blacklistedProductList.map((row) => row.productId))
  return store.merchProductList
    .filter((p) => !blacklistedIds.has(p.id))
    .map((p) => ({ title: p.title, value: p.id }))
})

const productToAdd = ref<string | null>(null)

function addProduct(id: string | null) {
  if (!id) return
  store.addBlacklistedProduct(id)
  productToAdd.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Blacklisting"
      :subtitle="`Hide terms from search suggestions and products from results on ${store.activeStore.domain}`"
    />

    <div class="flex-grow-1 d-flex flex-column">
      <MpFilterTabs
        v-model="activeTab"
        :tabs="tabs"
        aria-label="Blacklisting sections"
        controls-id="blacklisting-content"
      />

      <div id="blacklisting-content" class="flex-grow-1 d-flex flex-column">
        <!-- Search suggestions -->
        <v-card
          v-if="activeTab === 'terms'"
          flat
          border
          rounded="lg"
          class="flex-grow-1 d-flex flex-column overflow-hidden"
        >
          <!-- Inline add bar above the table: `hide-details` is deliberate so the
               row stays one control tall as terms are typed. -->
          <div class="d-flex align-center gap-3 pa-4">
            <v-select
              v-model="newLogic"
              :items="logicOptions"
              aria-label="Logic"
              hide-details
              max-width="200"
            />
            <v-text-field
              v-model="newTerm"
              aria-label="Term"
              placeholder="e.g. counterfeit"
              hide-details
              @keydown.enter="addTerm"
            />
            <v-btn
              color="primary"
              variant="flat"
              class="text-none"
              prepend-icon="plus"
              :disabled="!newTerm.trim()"
              @click="addTerm"
            >
              Add
            </v-btn>
          </div>
          <v-divider />

          <v-data-table
            :headers="termHeaders"
            :items="store.blacklistTermList"
            item-value="id"
            hover
            density="comfortable"
            :items-per-page="15"
            fixed-header
            class="flex-grow-1"
          >
            <template #item.logic="{ item }">
              <v-chip
                size="x-small"
                variant="tonal"
                :color="item.logic === 'exact' ? 'primary' : 'warning'"
                class="font-weight-medium"
              >
                {{ item.logic === 'exact' ? 'Exact match' : 'Contains' }}
              </v-chip>
            </template>

            <template #item.term="{ item }">
              <span class="text-body-2 font-weight-medium">{{ item.term }}</span>
            </template>

            <template #item.actions="{ item }">
              <v-btn
                icon="trash-2"
                variant="text"
                size="x-small"
                class="text-medium-emphasis"
                :aria-label="`Delete ${item.term}`"
                @click="askDeleteTerm(item)"
              />
            </template>

            <template #no-data>
              <MpEmptyState
                icon="ban"
                title="No blacklisted terms"
                description="Add a term above to keep it out of search suggestions."
              />
            </template>
          </v-data-table>
        </v-card>

        <!-- Product matches -->
        <v-card
          v-else
          flat
          border
          rounded="lg"
          class="flex-grow-1 d-flex flex-column overflow-hidden"
        >
          <div class="pa-4">
            <v-autocomplete
              :model-value="productToAdd"
              :items="addableProducts"
              label="Add a product to the blacklist"
              placeholder="Search products…"
              prepend-inner-icon="search"
              hide-details
              clearable
              @update:model-value="addProduct"
            />
          </div>
          <v-divider />

          <v-data-table
            :headers="productHeaders"
            :items="blacklistedRows"
            item-value="id"
            hover
            density="comfortable"
            :items-per-page="15"
            fixed-header
            class="flex-grow-1"
          >
            <template #item.product="{ item }">
              <div class="py-1">
                <div class="text-body-2 font-weight-medium">
                  {{ item.product?.title ?? item.productId }}
                </div>
                <div v-if="item.product" class="text-caption text-medium-emphasis">
                  ${{ item.product.price.toFixed(2) }}
                </div>
              </div>
            </template>

            <template #item.active="{ item }">
              <div class="d-flex justify-end">
                <v-switch
                  :model-value="item.active"
                  color="error"
                  density="compact"
                  hide-details
                  :aria-label="`Toggle blacklisting for ${item.product?.title ?? item.productId}`"
                  @update:model-value="store.toggleBlacklistedProduct(item.id)"
                />
              </div>
            </template>

            <template #no-data>
              <MpEmptyState
                icon="package-x"
                title="No blacklisted products"
                description="Search for a product above to remove it from search results."
              />
            </template>
          </v-data-table>
        </v-card>
      </div>
    </div>

    <MpConfirmDialog
      v-model="deleteDialog"
      title="Delete blacklisted term?"
      :message="termPendingDelete ? `“${termPendingDelete.term}” will start appearing in search suggestions again.` : ''"
      confirm-label="Delete term"
      danger
      @confirm="confirmDeleteTerm"
    />
  </div>
</template>
