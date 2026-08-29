<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSmsStore } from '@/stores/useSms'
import { storeToRefs } from 'pinia'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const store = useSmsStore()
const { transactionalEmails } = storeToRefs(store)
const search = ref('')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return transactionalEmails.value
  return transactionalEmails.value.filter(f => f.name.toLowerCase().includes(q) || f.subject.toLowerCase().includes(q))
})

const headers = [
  { title: 'Transactional Event', key: 'name', sortable: true },
  { title: 'Sends', key: 'sends', align: 'end' as const },
  { title: 'Updated At', key: 'updatedAt' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

function editFlow(id: number) {
  router.push({ name: 'CreateTransactional', params: { accountId: route.params.accountId }, query: { id } })
}

function newFlow() {
  router.push({ name: 'CreateTransactional', params: { accountId: route.params.accountId } })
}

const deleteTarget = ref<{ id: number; name: string } | null>(null)
function confirmDelete() {
  if (!deleteTarget.value) return
  store.deleteTransactionalEmails([deleteTarget.value.id])
  deleteTarget.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Transactional Email"
      :subtitle="`${transactionalEmails.length} transactional flows`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" :to="{ name: 'CreateTransactional', params: { accountId: $route.params.accountId } }">New Flow</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Flows"
        search-placeholder="Search flows..."
        :total-count="filtered.length"
      />

      <v-data-table v-if="transactionalEmails.length" :headers="headers" :items="filtered" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.name="{ item }">
          <div>
            <div class="font-weight-medium text-body-2">{{ item.name }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.subject }}</div>
          </div>
        </template>
        <template v-slot:item.sends="{ item }">
          <span class="num">{{ item.sends.toLocaleString() }}</span>
        </template>
        <template v-slot:item.actions="{ item }">
          <div class="d-flex justify-end pr-2">
            <MpRowActionsMenu :ariaLabel="`Actions for ${item.name}`">
              <MpMenuItem title="Edit" icon="pencil" @click="editFlow(item.id)" />
              <MpMenuItem title="Duplicate" icon="copy" @click="store.duplicateTransactionalEmail(item.id)" />
              <v-divider class="my-1" />
              <MpMenuItem title="Delete" icon="trash-2" danger @click="deleteTarget = { id: item.id, name: item.name }" />
            </MpRowActionsMenu>
          </div>
        </template>
        <template #no-data>
          <MpEmptyState
            icon="mail"
            :title="search ? 'No flows match your search' : 'No transactional flows yet'"
            :description="search ? 'Try a different search term.' : 'Create a triggered flow like an order confirmation or password reset.'"
            action-label="New Flow"
            action-icon="plus"
            @action="newFlow"
          />
        </template>
      </v-data-table>

      <MpEmptyState
        v-else
        icon="mail"
        title="No transactional flows yet"
        description="Create a triggered flow like an order confirmation or password reset."
        action-label="New Flow"
        action-icon="plus"
        @action="newFlow"
      />
    </v-card>

    <MpConfirmDialog
      :model-value="!!deleteTarget"
      title="Delete this transactional flow?"
      :message="`“${deleteTarget?.name}” will be permanently deleted. This can't be undone.`"
      confirm-label="Delete"
      danger
      @update:model-value="(v) => { if (!v) deleteTarget = null }"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.num { font-variant-numeric: tabular-nums; }
</style>
