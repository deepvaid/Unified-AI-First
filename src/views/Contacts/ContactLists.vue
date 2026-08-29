<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCdpEntitiesStore, type CdpList } from '@/stores/useCdpEntities'
import { useContactsStore } from '@/stores/useContacts'
import { downloadCsv, type CsvColumn } from '@/utils/exportCsv'
import type { Contact } from '@/stores/useContacts'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useToast } from '@/composables/useToast'

const store = useCdpEntitiesStore()
const contactsStore = useContactsStore()
const toast = useToast()
const route = useRoute()
const router = useRouter()
const search = ref('')

const headers = [
  { title: 'List Name', key: 'name', sortable: true },
  { title: 'Contacts', key: 'count', align: 'end' as const },
  { title: 'Type', key: 'type', hideBelow: 'sm' as const },
  { title: 'Created', key: 'created', hideBelow: 'md' as const },
  { title: '', key: 'actions', sortable: false, width: 48 },
]

// Row identity + its headline count always show; supporting columns drop out
// progressively. The actions column is never tiered — the kebab must stay
// reachable at every width.
const { visibleHeaders } = useResponsiveTableHeaders(headers)
const { loading } = useInitialLoad()

const contactCsvColumns: CsvColumn<Contact>[] = [
  { title: 'First Name', value: 'firstName' },
  { title: 'Last Name', value: 'lastName' },
  { title: 'Email', value: 'email' },
  { title: 'Phone', value: 'phone' },
  { title: 'Company', value: (r) => r.company ?? '' },
  { title: 'Status', value: 'status' },
]


// Create and edit are a full page (CreateList.vue), matching the source.
const createRoute = computed(() => ({ name: 'CreateList', params: { accountId: route.params.accountId } }))
function editRoute(list: CdpList) {
  return { name: 'EditList', params: { accountId: route.params.accountId, id: String(list.id) } }
}

function viewContacts() {
  router.push(`/accounts/${route.params.accountId}/contacts`)
}

function exportContacts(list: CdpList) {
  downloadCsv(`${list.name.replace(/\s+/g, '-').toLowerCase()}-contacts`, contactsStore.contacts, contactCsvColumns)
  toast.success('Contacts exported')
}

function duplicate(list: CdpList) {
  store.duplicateList(list.id)
  toast.success('List duplicated')
}

// Delete
const deleteDialog = ref(false)
const pendingList = ref<CdpList | null>(null)
function askDelete(list: CdpList) { pendingList.value = list; deleteDialog.value = true }
function confirmDelete() {
  if (pendingList.value) { store.deleteList(pendingList.value.id); toast.success('List deleted') }
  pendingList.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Contact Lists"
      :subtitle="`${store.lists.length} lists`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" :to="createRoute">Create list</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="All Lists"
        :total-count="store.lists.length"
      />

      <MpTableSkeleton v-if="loading" :rows="7" :columns="5" />

      <v-data-table v-else
        :headers="visibleHeaders"
        :items="store.lists"
        :search="search"
        :items-per-page="15"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.count="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.count.toLocaleString() }}</span>
        </template>
        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="List actions" :itemLabel="item.name">
            <v-list-item prepend-icon="users" title="View Contacts" @click="viewContacts" />
            <v-list-item prepend-icon="pencil" title="Edit" :to="editRoute(item)" />
            <v-list-item prepend-icon="share" title="Export Contacts" @click="exportContacts(item)" />
            <v-list-item prepend-icon="copy" title="Duplicate" @click="duplicate(item)" />
            <v-divider class="my-1" style="opacity: 0.4" />
            <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="list"
            :title="search ? 'No lists match your search' : 'No contact lists yet'"
            :description="search ? 'Try a different search term.' : 'Create a list to organize your contacts and send targeted campaigns.'"
            action-label="Create list"
            action-icon="plus"
            class="py-10"
            @action="router.push(createRoute)"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpConfirmDialog
      v-model="deleteDialog"
      title="Delete list?"
      :message="`Delete “${pendingList?.name}”? This does not delete the contacts, only the list.`"
      confirm-label="Delete"
      danger
      @confirm="confirmDelete"
    />
  </div>
</template>
