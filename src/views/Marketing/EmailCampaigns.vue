<script setup lang="ts">
import { useCampaignsStore } from '@/stores/useCampaigns'
import { ref, computed } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

const store = useCampaignsStore()

const creatorDrawer = ref(false)
const newCampaignName = ref('')
const creatorStep = ref(1)
const search = ref('')

const filters = ref({
  folder: 'All Folders',
})

const activeFilterEntries = computed(() => {
  const entries: Array<{ key: string; label: string }> = []
  if (filters.value.folder !== 'All Folders') entries.push({ key: 'folder', label: `Folder: ${filters.value.folder}` })
  return entries
})

function removeFilter(key: string) {
  if (key === 'folder') filters.value.folder = 'All Folders'
}

function clearAllFilters() {
  filters.value.folder = 'All Folders'
}

const filteredCampaigns = computed(() => {
  return filters.value.folder === 'All Folders'
    ? store.campaigns
    : store.campaigns.filter(c => c.folder === filters.value.folder)
})

const headers = [
  { title: 'Campaign Name', key: 'name', sortable: true },
  { title: 'List', key: 'listName' },
  { title: 'Status', key: 'status' },
  { title: 'Sent Date', key: 'sentDate' },
  { title: 'Open Rate', key: 'openRate', align: 'end' as const },
  { title: 'Click Rate', key: 'clickRate', align: 'end' as const },
  { title: 'Revenue', key: 'revenue', align: 'end' as const, sortable: true },
  { title: 'Actions', key: 'actions', align: 'end' as const, sortable: false }
]

const totalRevenue = store.campaigns.reduce((a, c) => a + c.metrics.revenue, 0)
const totalSent = store.campaigns.reduce((a, c) => a + c.metrics.sent, 0)
const sentCampaigns = store.campaigns.filter(c => c.status === 'Sent')
const avgOpenRate = sentCampaigns.length ? Math.floor(sentCampaigns.reduce((a, c) => a + (c.metrics.opens / (c.metrics.sent || 1)) * 100, 0) / sentCampaigns.length) : 0

const openCreator = () => {
  creatorStep.value = 1
  newCampaignName.value = ''
  creatorDrawer.value = true
}

const submitCampaign = () => {
  if (newCampaignName.value) {
    store.createCampaign(newCampaignName.value)
    creatorDrawer.value = false
  }
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <!-- Page Header -->
    <MpPageHeader
      title="Email Campaigns"
      :subtitle="`${store.campaigns.length} campaigns · $${totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 0})} total attributed revenue`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="folder" class="text-none" color="surface">Manage Folders</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreator">New Campaign</v-btn>
      </template>
    </MpPageHeader>

    <!-- Summary Stats -->
    <v-row class="mb-6" dense>
      <v-col cols="6" sm="3">
        <MpKpiCard label="Sent" :value="store.campaigns.filter(c => c.status === 'Sent').length" />
      </v-col>
      <v-col cols="6" sm="3">
        <MpKpiCard label="Avg. Open Rate" :value="`${avgOpenRate}%`" />
      </v-col>
      <v-col cols="6" sm="3">
        <MpKpiCard label="Total Sends" :value="totalSent.toLocaleString()" />
      </v-col>
      <v-col cols="6" sm="3">
        <MpKpiCard label="Total Revenue" :value="`$${totalRevenue.toLocaleString()}`" />
      </v-col>
    </v-row>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 bg-surface d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Campaigns"
        search-placeholder="Search campaigns..."
        :active-filters="activeFilterEntries"
        :total-count="filteredCampaigns.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <v-select
              v-model="filters.folder"
              label="Folder"
              :items="['All Folders', 'Promotions', 'Seasonal', 'Announcements', 'Automated', 'Newsletter', 'Transactional', 'General']"
              variant="outlined"
              density="compact"
              hide-details
              class="mb-3"
            />
          </div>
        </template>
        <template #bulk-actions>
          <v-btn variant="text" prepend-icon="refresh-cw" class="text-none text-medium-emphasis" size="small">Refresh</v-btn>
        </template>
      </MpDataTableToolbar>

      <v-data-table
        :headers="headers"
        :items="filteredCampaigns"
        :search="search"
        item-value="id"
        hover
        density="comfortable"
        class="flex-grow-1"
        :items-per-page="15"
        fixed-header
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center py-2 gap-3">
            <v-icon :color="item.status === 'Sent' ? 'success' : item.status === 'Sending' ? 'warning' : 'medium-emphasis'" size="20">
              {{ item.status === 'Sent' ? 'mail-check' : 'mail' }}
            </v-icon>
            <div>
              <div class="font-weight-medium text-body-2 cursor-pointer text-primary">{{ item.name }}</div>
              <div class="text-caption text-medium-emphasis">Folder: {{ item.folder }}</div>
            </div>
          </div>
        </template>

        <template v-slot:item.listName="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ item.listName }}</span>
        </template>

        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status" type="campaign" showIcon />
        </template>

        <template v-slot:item.sentDate="{ item }">
          <span class="text-caption text-medium-emphasis">{{ item.sentDate || '--' }}</span>
        </template>

        <template v-slot:item.openRate="{ item }">
          <div v-if="item.status === 'Sent'" class="text-right">
            <div class="font-weight-bold text-success text-body-2">{{ Math.floor((item.metrics.opens / item.metrics.sent) * 100) }}%</div>
            <div class="text-caption text-medium-emphasis">{{ item.metrics.opens.toLocaleString() }} opens</div>
          </div>
          <span v-else class="text-medium-emphasis text-caption">--</span>
        </template>

        <template v-slot:item.clickRate="{ item }">
          <div v-if="item.status === 'Sent'" class="text-right">
            <div class="font-weight-bold text-primary text-body-2">{{ Math.floor((item.metrics.clicks / item.metrics.opens) * 100) }}%</div>
            <div class="text-caption text-medium-emphasis">{{ item.metrics.clicks.toLocaleString() }} clicks</div>
          </div>
          <span v-else class="text-medium-emphasis text-caption">--</span>
        </template>

        <template v-slot:item.revenue="{ item }">
          <div class="text-right">
            <span v-if="item.metrics.revenue > 0" class="font-weight-bold text-success text-body-2">${{ item.metrics.revenue.toLocaleString() }}</span>
            <span v-else class="text-medium-emphasis text-caption">--</span>
          </div>
        </template>

        <template v-slot:item.actions>
          <div class="action-btns d-flex justify-end pr-2 gap-1">
            <v-btn icon="bar-chart-2" variant="text" size="small" color="primary"></v-btn>
            <v-btn icon="copy" variant="text" size="small" color="medium-emphasis"></v-btn>
            <v-btn icon="more-vertical" variant="text" size="small" color="medium-emphasis" aria-label="More actions"></v-btn>
          </div>
        </template>
        <template #no-data>
          <MpEmptyState
            icon="mail"
            :title="search ? 'No campaigns match your search' : 'No campaigns yet'"
            :description="search ? 'Try a different search term.' : 'Create your first email campaign to get started.'"
            action-label="Create Campaign"
            action-icon="plus"
            class="py-10"
            @action="creatorDrawer = true"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Campaign Creator Drawer -->
    <MpFormDrawer v-model="creatorDrawer" title="Create Campaign" :width="500">
      <v-stepper v-model="creatorStep" vertical elevation="0" class="bg-transparent pa-0">
        <v-stepper-item title="Setup Basics" value="1" color="primary">
          <v-card variant="flat" class="mt-2 mb-6">
            <v-text-field v-model="newCampaignName" label="Campaign Name" variant="outlined" density="comfortable" class="mb-4" placeholder="e.g. Black Friday Sale 2026"></v-text-field>
            <v-select label="Target Audience List" :items="['All Contacts', 'Newsletter Subscribers', 'VIP Customers', 'Re-engagement List']" variant="outlined" density="comfortable" class="mb-4"></v-select>
            <v-text-field label="Email Subject Line" variant="outlined" density="comfortable" class="mb-4" placeholder="e.g. 🔥 40% Off Sitewide — Today Only!"></v-text-field>
            <v-btn color="primary" class="text-none" @click="creatorStep = 2" :disabled="!newCampaignName">Continue</v-btn>
          </v-card>
        </v-stepper-item>

        <v-stepper-item title="Design Email" value="2" color="primary">
          <v-card variant="flat" class="mt-2 mb-6 text-center pa-6 bg-surface-variant border-dashed rounded-xl cursor-pointer">
            <v-icon size="48" color="primary" class="mb-2">palette</v-icon>
            <div class="font-weight-bold mb-1">Open Visual Editor</div>
            <div class="text-caption text-medium-emphasis">Use the drag-and-drop email builder</div>
          </v-card>
          <v-btn color="primary" class="text-none mr-2" @click="creatorStep = 3" variant="flat">Skip for now</v-btn>
        </v-stepper-item>

        <v-stepper-item title="Review & Send" value="3" color="primary">
          <v-alert type="info" variant="tonal" class="mb-4 text-body-2" rounded="lg">
            Estimated audience size: <strong>~18,432 contacts.</strong> Scheduled for immediate delivery.
          </v-alert>
          <v-btn color="success" size="large" block class="text-none" prepend-icon="rocket" @click="submitCampaign">Launch Campaign</v-btn>
        </v-stepper-item>
      </v-stepper>
    </MpFormDrawer>
  </div>
</template>
