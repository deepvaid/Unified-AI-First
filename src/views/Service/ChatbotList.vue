<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatbotStore } from '@/stores/useChatbot'
import { storeToRefs } from 'pinia'
import type { Chatbot, ChatbotStatus } from '@/stores/useChatbot'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const accountId = computed(() => route.params.accountId as string)

const cb = useChatbotStore()
const { chatbots } = storeToRefs(cb)
const maxChatbots = cb.MAX_CHATBOTS

const active = computed(() => chatbots.value.filter(c => c.status !== 'Archived'))
const archivedCount = computed(() => chatbots.value.filter(c => c.status === 'Archived').length)

const tab = ref('all')
const filterTabs = computed(() => [
  { label: 'All', key: 'all', count: active.value.length },
  { label: 'Active', key: 'Active', count: active.value.filter(c => c.status === 'Active').length },
  { label: 'Inactive', key: 'Inactive', count: active.value.filter(c => c.status === 'Inactive').length },
  { label: 'Disabled', key: 'Disabled', count: active.value.filter(c => c.status === 'Disabled').length },
])

const search = ref('')
const rows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return active.value.filter(c =>
    (tab.value === 'all' || c.status === tab.value) &&
    (!q || c.store.toLowerCase().includes(q) || c.storeUrl.toLowerCase().includes(q)),
  )
})

const headers = [
  { title: 'Store', key: 'store' },
  { title: 'Store URL', key: 'storeUrl' },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Conversations', key: 'conversations', align: 'end' as const },
  { title: 'Created on', key: 'createdOn' },
  { title: 'Last Modified', key: 'lastModified' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

const statusColor: Record<ChatbotStatus, string> = { Active: 'success', Inactive: 'default', Disabled: 'warning', Archived: 'default' }

function openBuilder(c: Chatbot) {
  router.push({ name: 'ChatbotBuilder', params: { accountId: accountId.value, id: c.id } })
}
function toggleActive(c: Chatbot, on: boolean) {
  cb.setStatus(c.id, on ? 'Active' : 'Inactive')
}

// Archive confirm
const archiveTarget = ref<Chatbot | null>(null)
const confirmArchive = ref(false)
function askArchive(c: Chatbot) { archiveTarget.value = c; confirmArchive.value = true }
function doArchive() { if (archiveTarget.value) cb.archive(archiveTarget.value.id); archiveTarget.value = null }

// Create dialog
const createOpen = ref(false)
const form = ref({ store: '', storeUrl: '' })
const canCreate = computed(() => form.value.store.trim() !== '')
function openCreate() { form.value = { store: '', storeUrl: '' }; createOpen.value = true }
function doCreate() {
  if (!canCreate.value) return
  const id = cb.create(form.value.store.trim(), form.value.storeUrl.trim())
  createOpen.value = false
  router.push({ name: 'ChatbotBuilder', params: { accountId: accountId.value, id } })
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Chatbots"
      :subtitle="`${active.length} of ${maxChatbots} chatbots created`"
    >
      <template #actions>
        <v-btn
          variant="text"
          class="text-none"
          prepend-icon="archive"
          :to="{ name: 'ChatbotArchived', params: { accountId } }"
        >
          Archived<span v-if="archivedCount"> ({{ archivedCount }})</span>
        </v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">Create New Chatbot</v-btn>
      </template>
    </MpPageHeader>

    <MpFilterTabs v-model="tab" :tabs="filterTabs" aria-label="Filter chatbots by status" />

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Chatbots"
        search-placeholder="Search by store or URL..."
        :total-count="rows.length"
      />

      <v-data-table
        v-if="active.length"
        :headers="headers"
        :items="rows"
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="10"
        fixed-header
        class="flex-grow-1 cbl-table"
        @click:row="(_e: unknown, r: { item: Chatbot }) => openBuilder(r.item)"
      >
        <template #item.store="{ item }">
          <span class="font-weight-medium">{{ item.store }}</span>
        </template>
        <template #item.storeUrl="{ item }">
          <span class="text-medium-emphasis">{{ item.storeUrl }}</span>
        </template>
        <template #item.status="{ item }">
          <div class="d-flex align-center ga-3" @click.stop>
            <v-switch
              :model-value="item.status === 'Active'"
              :disabled="item.status === 'Disabled'"
              color="primary"
              density="compact"
              hide-details
              @update:model-value="(v: boolean | null) => toggleActive(item, !!v)"
            />
            <v-chip size="x-small" variant="tonal" :color="statusColor[item.status]">{{ item.status }}</v-chip>
          </div>
        </template>
        <template #item.conversations="{ item }">
          <span class="num">{{ item.conversations.toLocaleString() }}</span>
        </template>
        <template #item.actions="{ item }">
          <div @click.stop>
            <MpRowActionsMenu ariaLabel="Chatbot actions">
              <v-list-item prepend-icon="pencil" title="Edit" @click="openBuilder(item)" />
              <v-list-item
                v-if="item.status === 'Active'"
                prepend-icon="pause"
                title="Deactivate"
                @click="cb.setStatus(item.id, 'Inactive')"
              />
              <v-list-item
                v-else
                prepend-icon="play"
                title="Activate"
                @click="cb.setStatus(item.id, 'Active')"
              />
              <v-divider class="my-1" style="opacity: 0.4" />
              <v-list-item prepend-icon="archive" title="Archive" class="text-error" @click="askArchive(item)" />
            </MpRowActionsMenu>
          </div>
        </template>
        <template #no-data>
          <MpEmptyState
            icon="search-x"
            title="No chatbots match your filter"
            description="Try a different status or search term."
          />
        </template>
      </v-data-table>

      <MpEmptyState
        v-else
        icon="bot-message-square"
        title="No chatbots yet"
        description="Create a chatbot for a store to start assisting and converting shoppers."
        action-label="Create New Chatbot"
        action-icon="plus"
        @action="openCreate"
      />
    </v-card>

    <MpConfirmDialog
      v-model="confirmArchive"
      title="Archive this chatbot?"
      :message="`“${archiveTarget?.store}” will be moved to Archived. You can restore it anytime.`"
      confirm-label="Archive"
      danger
      @confirm="doArchive"
    />

    <v-dialog v-model="createOpen" max-width="480">
      <v-card flat rounded="lg" class="pa-6">
        <div class="text-h6 font-weight-bold mb-1">Create new chatbot</div>
        <div class="text-body-2 text-medium-emphasis mb-5">Each chatbot powers one store. Add the store details to get started.</div>
        <v-text-field v-model="form.store" label="Store name" placeholder="e.g. Johny Style Store" variant="outlined" density="comfortable" autofocus class="mb-3" />
        <v-text-field v-model="form.storeUrl" label="Store URL" placeholder="https://mystore.com" variant="outlined" density="comfortable" prepend-inner-icon="link" hide-details class="mb-2" />
        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn variant="text" class="text-none" @click="createOpen = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" class="text-none" prepend-icon="plus" :disabled="!canCreate" @click="doCreate">Create &amp; customize</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.num { font-variant-numeric: tabular-nums; }
.cbl-table :deep(tbody tr) { cursor: pointer; }
</style>
