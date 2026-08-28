<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import { useSalesChannelsStore, type SalesChannel } from '@/stores/useSalesChannels'
import {
  channelDomain,
  merchandisingChannels,
  merchandisingHealth,
  merchandisingStatus,
  MERCHANDISING_HEALTH_LABELS,
  MERCHANDISING_STATUS_LABELS,
  providerLabel,
} from '@/utils/merchandisingChannels'

const route = useRoute()
const router = useRouter()
const salesChannels = useSalesChannelsStore()
const accountId = computed(() => String(route.params.accountId ?? '2000290'))
const channels = computed(() => merchandisingChannels(salesChannels.channels, accountId.value))

const search = ref('')

const filteredChannels = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return channels.value
  return channels.value.filter(
    (channel) =>
      channel.name.toLowerCase().includes(term) ||
      providerLabel(channel).toLowerCase().includes(term) ||
      channelDomain(channel).toLowerCase().includes(term),
  )
})

const headers = [
  { title: 'Channel', key: 'name', sortable: true },
  { title: 'Domain', key: 'domain', sortable: false, hideBelow: 'md' as const },
  { title: 'Merchandise', key: 'status', sortable: false },
  { title: 'Sync health', key: 'health', sortable: false },
  { title: 'Last activity', key: 'lastActivityAt', sortable: true, hideBelow: 'lg' as const },
  { title: '', key: 'open', align: 'end' as const, sortable: false },
]
const { visibleHeaders } = useResponsiveTableHeaders(headers)

function openChannel(channel: SalesChannel) {
  router.push({ name: 'MerchandisingChannelOverview', params: { accountId: accountId.value, channelId: channel.id } })
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Merchandising"
      subtitle="Choose an online sales channel to manage search, collections, and recommendations — POS and offline channels stay in Retail."
    >
      <template #actions>
        <v-btn
          variant="outlined"
          color="primary"
          class="text-none"
          prepend-icon="store"
          :to="{ name: 'SalesChannels', params: { accountId } }"
        >
          Manage sales channels
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Online channels"
        search-placeholder="Search channels or domains…"
        :total-count="filteredChannels.length"
      />

      <v-data-table
        :headers="visibleHeaders"
        :items="filteredChannels"
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="15"
        fixed-header
        class="flex-grow-1 row-clickable"
        @click:row="(_event: MouseEvent, { item }: { item: SalesChannel }) => openChannel(item)"
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center gap-3 py-2">
            <v-avatar size="34" rounded="lg" color="primary" variant="tonal">
              <v-icon size="18">{{ item.provider === 'shopify' ? 'shopping-bag' : 'globe' }}</v-icon>
            </v-avatar>
            <div class="min-width-0">
              <div class="text-body-2 font-weight-bold text-primary text-truncate">{{ item.name }}</div>
              <div class="text-caption text-medium-emphasis text-truncate">{{ providerLabel(item) }}</div>
            </div>
          </div>
        </template>

        <template v-slot:item.domain="{ item }">
          <span class="text-caption font-mono text-medium-emphasis">{{ channelDomain(item) }}</span>
        </template>

        <template v-slot:item.status="{ item }">
          <MpStatusChip
            :status="MERCHANDISING_STATUS_LABELS[merchandisingStatus(item)]"
            type="general"
            size="sm"
            show-icon
          />
        </template>

        <template v-slot:item.health="{ item }">
          <span class="d-flex align-center gap-1 text-body-2">
            <v-icon size="10" :color="merchandisingHealth(item) === 'healthy' ? 'success' : 'warning'">circle</v-icon>
            {{ MERCHANDISING_HEALTH_LABELS[merchandisingHealth(item)] }}
          </span>
        </template>

        <template v-slot:item.lastActivityAt="{ item }">
          <span class="text-body-2">{{ item.lastActivityAt.slice(0, 10) }}</span>
        </template>

        <template v-slot:item.open="{ item }">
          <span class="d-inline-flex align-center gap-1 text-body-2 font-weight-medium text-primary">
            {{ merchandisingStatus(item) === 'setup_required' ? 'Set up' : 'Open overview' }}
            <v-icon size="16">chevron-right</v-icon>
          </span>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="globe"
            title="No online sales channels"
            description="Create or connect an online sales channel before opening Merchandising."
            action-label="View sales channels"
            action-icon="store"
            @action="router.push({ name: 'SalesChannels', params: { accountId } })"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<style scoped>
.min-width-0 {
  min-width: 0;
}

.row-clickable :deep(tbody tr) {
  cursor: pointer;
}
</style>
