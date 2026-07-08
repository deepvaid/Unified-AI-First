<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useSmsStore } from '@/stores/useSms'
import { storeToRefs } from 'pinia'
import type { SmsCampaign } from '@/stores/useSms'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'

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

// Compose drawer
const AUDIENCES = ['SMS Opted-In', 'SMS Marketing List', 'All contacts']
const drawer = ref(false)
const blank = (): { name: string; audience: string; message: string } => ({
  name: '',
  audience: 'SMS Opted-In',
  message: '',
})
const form = reactive(blank())

const charCount = computed(() => form.message.length)
const segments = computed(() => {
  const n = charCount.value
  if (n === 0) return 0
  return n <= 160 ? 1 : Math.ceil(n / 153)
})
const segmentCap = computed(() => (charCount.value <= 160 ? 160 : segments.value * 153))
const canCreate = computed(() => form.name.trim() !== '' && form.message.trim() !== '')

function openCompose() {
  Object.assign(form, blank())
  drawer.value = true
}
function save() {
  if (!canCreate.value) return
  const nextId = Math.max(0, ...smsCampaigns.value.map(c => c.id)) + 1
  smsCampaigns.value.unshift({
    id: nextId,
    name: form.name.trim(),
    messagePreview: form.message.trim(),
    audience: form.audience,
    status: 'Draft' as SmsCampaign['status'],
    sentDate: null,
    sent: 0,
    delivered: 0,
    clicks: 0,
  })
  drawer.value = false
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
        <template #item.actions>
          <v-menu>
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="more-horizontal" variant="text" size="small" aria-label="More actions" />
            </template>
            <v-list density="compact" rounded="lg" min-width="160" elevation="3" class="py-1">
              <v-list-item prepend-icon="pencil">Edit</v-list-item>
              <v-list-item prepend-icon="copy">Duplicate</v-list-item>
              <v-list-item prepend-icon="chart-no-axes-column">View report</v-list-item>
              <v-list-item prepend-icon="trash-2" class="text-error">Delete</v-list-item>
            </v-list>
          </v-menu>
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

    <MpFormDrawer v-model="drawer" title="New SMS Campaign" subtitle="Compose a one-off SMS to an opted-in audience.">
      <v-text-field
        v-model="form.name"
        label="Campaign name"
        placeholder="e.g. Weekend Flash Sale"
        variant="outlined"
        density="comfortable"
        autofocus
        class="mb-3"
      />
      <v-select
        v-model="form.audience"
        label="Target audience"
        :items="AUDIENCES"
        variant="outlined"
        density="comfortable"
        class="mb-3"
      />
      <v-textarea
        v-model="form.message"
        label="Message body"
        placeholder="Type your SMS. Keep it short and add a clear call to action."
        variant="outlined"
        density="comfortable"
        rows="4"
        auto-grow
        hide-details="auto"
      />
      <div class="d-flex justify-end mt-2">
        <span class="text-caption sms-count" :class="segments > 1 ? 'text-warning' : 'text-medium-emphasis'">
          {{ charCount }} / {{ segmentCap }} · {{ segments }} segment{{ segments === 1 ? '' : 's' }}
        </span>
      </div>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canCreate" @click="save">Create campaign</v-btn>
      </template>
    </MpFormDrawer>
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
.sms-count {
  font-variant-numeric: tabular-nums;
}
</style>
