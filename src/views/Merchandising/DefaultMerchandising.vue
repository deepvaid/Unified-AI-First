<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import { useMerchandisingStore, type MerchRule } from '@/stores/useMerchandising'

const route = useRoute()
const router = useRouter()
const store = useMerchandisingStore()

// Channel-scoped editor routes — this view only mounts inside the merchandising shell.
function pinningRoute(ruleId: string) {
  return { name: 'MerchandisingChannelPinning', params: { accountId: route.params.accountId, channelId: route.params.channelId, ruleId } }
}

function ruleRoute(ruleId: string) {
  return { name: 'MerchandisingChannelRuleEdit', params: { accountId: route.params.accountId, channelId: route.params.channelId, ruleId } }
}

const activeTab = ref('pinning')
const tabs = computed(() => [
  { label: 'Pinning', key: 'pinning', count: store.pinningRuleList.length },
  { label: 'Merchandising rules', key: 'rules', count: store.merchRuleList.length },
  { label: 'Promo cards', key: 'promo' },
])

function collectionName(id: string) {
  return store.collectionList.find((c) => c.id === id)?.name ?? id
}

/* ── Pinning tab ──────────────────────────────────────────────── */
const pinningHeaders = [
  { title: 'Collection', key: 'collection', sortable: false },
  { title: 'Pinned products', key: 'count', align: 'end' as const, sortable: false, width: 160 },
  { title: '', key: 'actions', align: 'end' as const, sortable: false, width: 64 },
]

const pinningRows = computed(() =>
  store.pinningRuleList.map((rule) => ({
    id: rule.id,
    collection: collectionName(rule.collectionId),
    count: rule.pinnedProductIds.length,
    updatedAt: rule.updatedAt,
  })),
)

function openPinning(id: string) {
  router.push(pinningRoute(id))
}

/* ── Rules tab ────────────────────────────────────────────────── */
const ruleHeaders = [
  { title: 'Status', key: 'status', sortable: false, width: 110 },
  { title: 'Rule', key: 'name', sortable: false },
  { title: 'Collections', key: 'collections', sortable: false },
  { title: 'Updated', key: 'updatedAt', align: 'end' as const, sortable: false, width: 140 },
  { title: '', key: 'actions', align: 'end' as const, sortable: false, width: 64 },
]

function ruleCollectionsLabel(rule: MerchRule) {
  const names = rule.collectionIds.map(collectionName)
  if (names.length <= 2) return names.join(' · ')
  return `${names.slice(0, 2).join(' · ')} +${names.length - 2} more`
}

function openRule(id: string) {
  router.push(ruleRoute(id))
}

/* ── Row click (both tables) ──────────────────────────────────── */
function handleRowClick(event: MouseEvent, open: () => void) {
  const target = event.target as HTMLElement | null
  if (target?.closest('button, a, .v-overlay')) return
  open()
}

/* ── Delete confirms ──────────────────────────────────────────── */
const confirmAction = ref<{ title: string; body: string; perform: () => void } | null>(null)

function deletePinning(row: { id: string; collection: string }) {
  confirmAction.value = {
    title: `Delete pinning for “${row.collection}”?`,
    body: 'Pinned positions will be removed. Products stay in the collection.',
    perform: () => store.deletePinningRule(row.id),
  }
}

function deleteRule(rule: MerchRule) {
  confirmAction.value = {
    title: `Delete “${rule.name}”?`,
    body: 'Product ordering in the affected collections reverts to default ranking.',
    perform: () => store.deleteMerchRule(rule.id),
  }
}

function performConfirm() {
  confirmAction.value?.perform()
  confirmAction.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Default Merchandising"
      :subtitle="`${store.pinningRuleList.length} pinning rules · ${store.merchRuleList.length} merchandising rules · ${store.activeStore.domain}`"
    >
      <template #actions>
        <v-menu location="bottom end">
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              color="primary"
              variant="flat"
              class="text-none"
              prepend-icon="plus"
              append-icon="chevron-down"
            >
              Add new rule
            </v-btn>
          </template>
          <v-list density="compact" rounded="lg" min-width="230" elevation="3" class="py-1">
            <v-list-item prepend-icon="pin" title="Pinning rule" @click="router.push(pinningRoute('new'))" />
            <v-list-item prepend-icon="sliders-horizontal" title="Merchandising rule" @click="router.push(ruleRoute('new'))" />
            <v-divider class="my-1" style="opacity: 0.4" />
            <v-list-item prepend-icon="tags" title="Promo card" subtitle="Coming soon" disabled />
          </v-list>
        </v-menu>
      </template>
      <template #tabs>
        <MpFilterTabs v-model="activeTab" :tabs="tabs" aria-label="Default merchandising sections" />
      </template>
    </MpPageHeader>

    <!-- Pinning tab -->
    <v-card v-if="activeTab === 'pinning'" variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <v-data-table
        :headers="pinningHeaders"
        :items="pinningRows"
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="15"
        class="flex-grow-1 dm-table"
        @click:row="(e: MouseEvent, { item }: { item: { id: string } }) => handleRowClick(e, () => openPinning(item.id))"
      >
        <template #item.collection="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.collection }}</span>
        </template>
        <template #item.count="{ item }">
          <span class="text-body-2 font-weight-semibold">{{ item.count }}</span>
        </template>
        <template #item.actions="{ item }">
          <v-menu location="bottom end">
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                icon="more-vertical"
                variant="text"
                size="small"
                density="comfortable"
                color="medium-emphasis"
                :aria-label="`Actions for ${item.collection}`"
              />
            </template>
            <v-list density="compact" rounded="lg" min-width="160" elevation="3" class="py-1">
              <v-list-item prepend-icon="pin" title="Edit pins" @click="openPinning(item.id)" />
              <v-divider class="my-1" style="opacity: 0.4" />
              <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="deletePinning(item)" />
            </v-list>
          </v-menu>
        </template>
        <template #no-data>
          <MpEmptyState
            icon="pin"
            title="No pinning rules yet"
            description="Pin products to fixed positions at the top of a collection."
            action-label="Add pinning rule"
            action-icon="plus"
            class="py-10"
            @action="router.push(pinningRoute('new'))"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Merchandising rules tab -->
    <v-card v-else-if="activeTab === 'rules'" variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <v-data-table
        :headers="ruleHeaders"
        :items="store.merchRuleList"
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="15"
        class="flex-grow-1 dm-table"
        @click:row="(e: MouseEvent, { item }: { item: MerchRule }) => handleRowClick(e, () => openRule(item.id))"
      >
        <template #item.status="{ item }">
          <MpStatusChip :status="item.active ? 'Active' : 'Inactive'" type="general" size="x-small" variant="flat" />
        </template>
        <template #item.name="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.name }}</span>
        </template>
        <template #item.collections="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ ruleCollectionsLabel(item) }}</span>
        </template>
        <template #item.updatedAt="{ item }">
          <span class="text-body-2 text-medium-emphasis text-no-wrap">{{ item.updatedAt }}</span>
        </template>
        <template #item.actions="{ item }">
          <v-menu location="bottom end">
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                icon="more-vertical"
                variant="text"
                size="small"
                density="comfortable"
                color="medium-emphasis"
                :aria-label="`Actions for ${item.name}`"
              />
            </template>
            <v-list density="compact" rounded="lg" min-width="170" elevation="3" class="py-1">
              <v-list-item prepend-icon="pencil" title="Edit" @click="openRule(item.id)" />
              <v-list-item
                :prepend-icon="item.active ? 'circle-pause' : 'circle-play'"
                :title="item.active ? 'Disable' : 'Enable'"
                @click="store.toggleMerchRuleActive(item.id)"
              />
              <v-divider class="my-1" style="opacity: 0.4" />
              <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="deleteRule(item)" />
            </v-list>
          </v-menu>
        </template>
        <template #no-data>
          <MpEmptyState
            icon="sliders-horizontal"
            title="No merchandising rules yet"
            description="Create rules to control product ranking, boost specific products, or apply business logic."
            action-label="Add merchandising rule"
            action-icon="plus"
            class="py-10"
            @action="router.push(ruleRoute('new'))"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Promo cards tab -->
    <v-card v-else variant="flat" border rounded="lg" class="flex-grow-1 d-flex align-center justify-center">
      <MpEmptyState
        icon="tags"
        title="Promo cards are coming soon"
        description="Create promotional messages within the product grid to highlight offers and drive users to key pages."
        class="py-12"
      />
    </v-card>

    <!-- Confirm dialog -->
    <v-dialog :model-value="!!confirmAction" max-width="440" @update:model-value="confirmAction = null">
      <v-card v-if="confirmAction" rounded="lg">
        <v-card-title class="pa-5 text-h6 font-weight-bold">{{ confirmAction.title }}</v-card-title>
        <v-card-text class="pb-2 text-body-2 text-medium-emphasis">{{ confirmAction.body }}</v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" class="text-none" @click="confirmAction = null">Cancel</v-btn>
          <v-btn color="error" variant="flat" class="text-none" @click="performConfirm">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.dm-table :deep(tbody tr) {
  cursor: pointer;
}

.dm-table :deep(thead th) {
  white-space: nowrap;
}
</style>
