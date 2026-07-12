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
const { smsCampaigns } = storeToRefs(store)
const search = ref('')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return smsCampaigns.value
  return smsCampaigns.value.filter(
    c => c.name.toLowerCase().includes(q) || c.messagePreview.toLowerCase().includes(q),
  )
})

const headers = [
  { title: 'Campaign', key: 'name', sortable: true },
  { title: 'Message', key: 'messagePreview', sortable: false },
  { title: 'Audience', key: 'audience' },
  { title: 'Status', key: 'status' },
  { title: 'Sent', key: 'sent', align: 'end' as const },
  { title: 'Delivered', key: 'delivered', align: 'end' as const },
  { title: 'Clicks', key: 'clicks', align: 'end' as const },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

function openCompose() {
  router.push({ name: 'CreateSmsCampaign', params: { accountId: route.params.accountId } })
}

function editCampaign(id: number) {
  router.push({ name: 'CreateSmsCampaign', params: { accountId: route.params.accountId }, query: { id } })
}

// Delete (row + bulk not needed here — legacy list has no multi-select)
const deleteTarget = ref<{ id: number; name: string } | null>(null)
function confirmDelete() {
  if (!deleteTarget.value) return
  store.deleteSmsCampaigns([deleteTarget.value.id])
  deleteTarget.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="SMS Campaigns"
      :subtitle="`${smsCampaigns.length} SMS marketing campaigns`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCompose">
          New SMS Campaign
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Campaigns"
        search-placeholder="Search SMS campaigns..."
        :total-count="filtered.length"
      />

      <v-data-table
        v-if="smsCampaigns.length"
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
        <template #item.status="{ item }">
          <MpStatusChip :status="item.status" type="campaign" />
        </template>
        <template #item.sent="{ item }">
          <span class="num">{{ item.sent ? item.sent.toLocaleString() : '—' }}</span>
        </template>
        <template #item.delivered="{ item }">
          <span class="num">{{ item.delivered ? item.delivered.toLocaleString() : '—' }}</span>
        </template>
        <template #item.clicks="{ item }">
          <span class="num">{{ item.clicks ? item.clicks.toLocaleString() : '—' }}</span>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex justify-end pr-2 gap-1">
            <v-tooltip v-if="item.status === 'Sent'" text="SMS reports are coming soon" location="top">
              <template #activator="{ props }">
                <span v-bind="props"><v-btn icon="bar-chart-2" variant="text" size="small" color="medium-emphasis" aria-label="View report (unavailable)" disabled></v-btn></span>
              </template>
            </v-tooltip>
            <MpRowActionsMenu :ariaLabel="`Actions for ${item.name}`">
              <v-list-item v-if="item.status === 'Draft'" @click="editCampaign(item.id)">
                <template #prepend><v-icon size="18">pencil</v-icon></template>
                <v-list-item-title class="text-body-2">Edit</v-list-item-title>
              </v-list-item>
              <v-list-item @click="store.duplicateSmsCampaign(item.id)">
                <template #prepend><v-icon size="18">copy</v-icon></template>
                <v-list-item-title class="text-body-2">Duplicate</v-list-item-title>
              </v-list-item>
              <v-divider class="my-1" />
              <v-list-item class="text-error" @click="deleteTarget = { id: item.id, name: item.name }">
                <template #prepend><v-icon size="18">trash-2</v-icon></template>
                <v-list-item-title class="text-body-2">Delete</v-list-item-title>
              </v-list-item>
            </MpRowActionsMenu>
          </div>
        </template>
      </v-data-table>

      <MpEmptyState
        v-else
        icon="message-circle"
        title="No SMS campaigns yet"
        description="Reach opted-in contacts with a promotional or announcement text message."
        action-label="New SMS Campaign"
        action-icon="plus"
        @action="openCompose"
      />
    </v-card>

    <MpConfirmDialog
      :model-value="!!deleteTarget"
      title="Delete this SMS campaign?"
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
  max-width: 340px;
  vertical-align: middle;
}
.num {
  font-variant-numeric: tabular-nums;
}
</style>
