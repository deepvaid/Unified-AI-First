<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSocialLeadsStore, type LeadAd } from '@/stores/useSocialLeads'
import { useToast } from '@/composables/useToast'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpErrorState from '@/components/MpErrorState.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

/**
 * Meta Lead Ads → contact-list sync rules. Rebuilt from UAT `/social_leads`;
 * see docs/rebuild/social-leads/.
 *
 * A record here is a connection, not an advertisement — the source's "Lead Ad"
 * naming is kept for recognisability but the subtitle says what it actually does.
 */
const store = useSocialLeadsStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const accountId = computed(() => String(route.params.accountId))

// The source has no search and no filters at all. Both are added here: even at
// four rows the status cut is the question people ask of this list.
const search = ref('')
const statusQuickFilter = {
  key: 'status',
  label: 'Status',
  options: [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
  ],
}
const statusFilter = ref<string[]>([])

const loading = ref(false)
const loadError = ref(false)

const headers = [
  { title: 'Lead ad', key: 'name', sortable: true, minWidth: '240px' },
  { title: 'Facebook page', key: 'page' },
  { title: 'Lead form', key: 'leadForm' },
  { title: 'Contact lists', key: 'lists' },
  { title: 'Status', key: 'status', minWidth: '128px' },
  { title: 'Created', key: 'createdAt', sortable: true, minWidth: '130px' },
  { title: 'Updated', key: 'updatedAt', sortable: true, minWidth: '130px' },
  { title: '', key: 'actions', sortable: false, width: 56 },
]

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return store.leadAds.filter((ad) => {
    const byStatus = !statusFilter.value.length || statusFilter.value.includes(ad.status)
    if (!term) return byStatus
    const page = store.pageById(ad.pageId)?.name ?? ''
    const form = store.leadFormById(ad.leadFormId)?.name ?? ''
    const lists = store.contactListsById(ad.contactListIds).map(l => l.name).join(' ')
    const haystack = `${ad.name} ${page} ${form} ${lists}`.toLowerCase()
    return byStatus && haystack.includes(term)
  })
})

const activeFilterEntries = computed(() =>
  statusFilter.value.length ? [{ key: 'status', label: `Status: ${statusFilter.value.join(', ')}` }] : [],
)

const hasFilters = computed(() => Boolean(search.value.trim()) || statusFilter.value.length > 0)

function clearFilters() {
  search.value = ''
  statusFilter.value = []
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function pageLabel(ad: LeadAd) {
  const page = store.pageById(ad.pageId)
  return page ? `${page.name} (${page.pageNumber})` : 'Unknown page'
}

function newLeadAd() {
  router.push({ name: 'CreateLeadAd', params: { accountId: accountId.value } })
}

function editLeadAd(ad: LeadAd) {
  router.push({ name: 'EditLeadAd', params: { accountId: accountId.value, id: String(ad.id) } })
}

// ── Status ──────────────────────────────────────────────────────────
// The source hides this behind a kebab item whose label flips between
// "Activate Lead Ad" and its unseen deactivate twin. Here the Status cell
// carries the switch, and the kebab keeps a labelled equivalent.
function toggleStatus(ad: LeadAd) {
  const next = ad.status === 'Active' ? 'Inactive' : 'Active'
  store.setStatus(ad.id, next)
  toast.success(next === 'Active' ? `"${ad.name}" is now syncing leads` : `"${ad.name}" has stopped syncing leads`)
}

// ── Delete ──────────────────────────────────────────────────────────
const confirmDelete = ref(false)
const pendingDelete = ref<LeadAd | null>(null)

function askDelete(ad: LeadAd) {
  pendingDelete.value = ad
  confirmDelete.value = true
}

function doDelete() {
  if (!pendingDelete.value) return
  store.remove([pendingDelete.value.id])
  toast.success(`"${pendingDelete.value.name}" deleted`)
  pendingDelete.value = null
}

const deleteMessage = computed(() => {
  const ad = pendingDelete.value
  if (!ad) return ''
  const form = store.leadFormById(ad.leadFormId)?.name ?? 'its lead form'
  const count = ad.contactListIds.length
  return `New leads from ${form} will stop flowing into ${count} contact list${count === 1 ? '' : 's'}. Contacts already synced are not affected.`
})
</script>

<template>
  <div class="h-100 d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="Acquisition"
      title="Lead Ads"
      subtitle="Send leads from your Meta instant forms straight into contact lists"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="newLeadAd">
          New Meta lead ad
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        v-model:quick-filter-value="statusFilter"
        :quick-filter="statusQuickFilter"
        title="All lead ads"
        search-placeholder="Search lead ads, pages or lists"
        :total-count="filtered.length"
        :active-filters="activeFilterEntries"
        @remove-filter="statusFilter = []"
        @clear-filters="statusFilter = []"
      />

      <MpTableSkeleton v-if="loading" :rows="5" :columns="7" />

      <MpErrorState
        v-else-if="loadError"
        title="Couldn't load your lead ads"
        description="The connection to Meta timed out. Your lead ads are safe — try again."
        action-label="Retry"
        @action="loadError = false"
      />

      <v-data-table
        v-else
        :headers="headers"
        :items="filtered"
        :items-per-page="10"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template #item.name="{ item }">
          <button type="button" class="la-name" @click="editLeadAd(item)">{{ item.name }}</button>
        </template>

        <template #item.page="{ item }">
          <a
            :href="store.pageById(item.pageId)?.profileUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="la-link"
          >
            {{ pageLabel(item) }}
            <v-icon size="16" aria-hidden="true">external-link</v-icon>
            <span class="d-sr-only">(opens Facebook in a new tab)</span>
          </a>
        </template>

        <template #item.leadForm="{ item }">
          <span class="text-body-2">{{ store.leadFormById(item.leadFormId)?.name ?? '—' }}</span>
        </template>

        <template #item.lists="{ item }">
          <div class="d-flex flex-wrap ga-1">
            <MpStatusChip
              v-for="list in store.contactListsById(item.contactListIds)"
              :key="list.id"
              :status="list.name"
              type="general"
              size="sm"
              variant="outlined"
            />
          </div>
        </template>

        <template #item.status="{ item }">
          <v-switch
            :model-value="item.status === 'Active'"
            :label="item.status"
            :aria-label="`${item.name} — ${item.status === 'Active' ? 'syncing, switch off to pause' : 'paused, switch on to sync'}`"
            color="primary"
            density="compact"
            hide-details
            inset
            class="la-status"
            @update:model-value="toggleStatus(item)"
          />
        </template>

        <template #item.createdAt="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ formatDate(item.createdAt) }}</span>
        </template>

        <template #item.updatedAt="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ formatDate(item.updatedAt) }}</span>
        </template>

        <template #item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Lead ad actions" :item-label="item.name">
            <MpMenuItem icon="pencil" title="Edit" @click="editLeadAd(item)" />
            <MpMenuItem
              :icon="item.status === 'Active' ? 'pause' : 'play'"
              :title="item.status === 'Active' ? 'Pause syncing' : 'Start syncing'"
              @click="toggleStatus(item)"
            />
            <v-divider class="my-1" />
            <MpMenuItem icon="trash-2" title="Delete" danger @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>

        <template #no-data>
          <MpEmptyState
            :icon="hasFilters ? 'search-x' : 'megaphone'"
            :variant="hasFilters ? 'stack' : 'launcher'"
            :title="hasFilters ? 'No lead ads match your filters' : 'No lead ads yet'"
            :description="hasFilters
              ? 'Try a different search term, or clear the status filter.'
              : 'Connect a Meta instant form to a contact list and every lead it captures lands in Maropost automatically.'"
            :action-label="hasFilters ? 'Clear filters' : 'New Meta lead ad'"
            :action-icon="hasFilters ? undefined : 'plus'"
            @action="hasFilters ? clearFilters() : newLeadAd()"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpConfirmDialog
      v-model="confirmDelete"
      :title="`Delete &quot;${pendingDelete?.name}&quot;?`"
      :message="deleteMessage"
      confirm-label="Delete lead ad"
      danger
      @confirm="doDelete"
    />
  </div>
</template>

<style scoped>
.la-name {
  color: rgb(var(--v-theme-primary));
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  text-align: left;
}

.la-name:hover {
  text-decoration: underline;
}

.la-link {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-4);
  color: rgb(var(--v-theme-primary));
  font-size: var(--mp-fontSize-14);
}

.la-link:hover {
  text-decoration: underline;
}

/* The switch label states the value, so it must not wrap in a narrow cell. */
.la-status :deep(.v-label) {
  white-space: nowrap;
  font-size: var(--mp-fontSize-13);
}
</style>
