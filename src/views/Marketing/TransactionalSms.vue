<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSmsStore } from '@/stores/useSms'
import { storeToRefs } from 'pinia'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const store = useSmsStore()
const { transactionalSms } = storeToRefs(store)
const search = ref('')

function newFlow() {
  router.push({ name: 'CreateTransactionalSms', params: { accountId: route.params.accountId } })
}
function editFlow(id: number) {
  router.push({ name: 'CreateTransactionalSms', params: { accountId: route.params.accountId }, query: { id } })
}

const deleteTarget = ref<{ id: number; name: string } | null>(null)
function confirmDelete() {
  if (!deleteTarget.value) return
  store.deleteTransactionalSms([deleteTarget.value.id])
  deleteTarget.value = null
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return transactionalSms.value
  return transactionalSms.value.filter(
    f => f.name.toLowerCase().includes(q) || f.messagePreview.toLowerCase().includes(q),
  )
})

const headers = [
  { title: 'Transactional Event', key: 'name', sortable: true },
  { title: 'Message', key: 'messagePreview', sortable: false },
  { title: 'Sender ID', key: 'senderId' },
  { title: 'Status', key: 'status' },
  { title: 'Sent Date', key: 'sentDate' },
  { title: 'Delivered', key: 'delivered', align: 'end' as const },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Transactional SMS"
      :subtitle="`${transactionalSms.length} transactional SMS flows`"
    >
      <template #actions>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="plus"
          class="text-none"
          @click="newFlow"
        >
          New SMS
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Flows"
        search-placeholder="Search SMS flows..."
        :total-count="filtered.length"
      />

      <v-data-table
        v-if="transactionalSms.length"
        :headers="headers"
        :items="filtered"
        :search="search"
        hover
        density="comfortable"
        :items-per-page="15"
        fixed-header
        class="flex-grow-1"
      >
        <template #item.name="{ item }">
          <span class="font-weight-medium">{{ item.name }}</span>
        </template>
        <template #item.messagePreview="{ item }">
          <span class="d-inline-block text-medium-emphasis text-truncate sms-msg">{{ item.messagePreview }}</span>
        </template>
        <template #item.senderId="{ item }">
          <span class="text-caption font-weight-medium sms-sender">{{ item.senderId }}</span>
        </template>
        <template #item.status="{ item }">
          <MpStatusChip :status="item.status" type="general" />
        </template>
        <template #item.sentDate="{ item }">
          <span :class="item.sentDate ? '' : 'text-medium-emphasis'">{{ item.sentDate ?? '—' }}</span>
        </template>
        <template #item.delivered="{ item }">
          <span class="num">{{ item.delivered ? item.delivered.toLocaleString() : '—' }}</span>
        </template>
        <template #item.actions="{ item }">
          <MpRowActionsMenu :ariaLabel="`Actions for ${item.name}`">
            <v-list-item @click="editFlow(item.id)">
              <template #prepend><v-icon size="18">pencil</v-icon></template>
              <v-list-item-title class="text-body-2">Edit</v-list-item-title>
            </v-list-item>
            <v-list-item @click="store.duplicateTransactionalSms(item.id)">
              <template #prepend><v-icon size="18">copy</v-icon></template>
              <v-list-item-title class="text-body-2">Duplicate</v-list-item-title>
            </v-list-item>
            <v-divider class="my-1" />
            <v-list-item class="text-error" @click="deleteTarget = { id: item.id, name: item.name }">
              <template #prepend><v-icon size="18">trash-2</v-icon></template>
              <v-list-item-title class="text-body-2">Delete</v-list-item-title>
            </v-list-item>
          </MpRowActionsMenu>
        </template>
      </v-data-table>

      <MpEmptyState
        v-else
        icon="message-square"
        title="No transactional SMS yet"
        description="Create a triggered SMS like an order confirmation, OTP, or shipping update."
        action-label="New SMS"
        action-icon="plus"
        @action="newFlow"
      />
    </v-card>

    <MpConfirmDialog
      :model-value="!!deleteTarget"
      title="Delete this transactional SMS?"
      :message="`“${deleteTarget?.name}” will be permanently deleted. This can't be undone.`"
      confirm-label="Delete"
      danger
      @update:model-value="(v) => { if (!v) deleteTarget = null }"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.sms-msg {
  max-width: 360px;
  vertical-align: middle;
}
.sms-sender {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.02em;
}
.num {
  font-variant-numeric: tabular-nums;
}
</style>
