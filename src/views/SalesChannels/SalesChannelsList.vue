<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import {
  CHANNEL_HEALTH_LABELS,
  CHANNEL_STATUS_LABELS,
  CHANNEL_TYPE_LABELS,
  CONNECTED_CLOUD_ICONS,
  CONNECTED_CLOUD_LABELS,
  useSalesChannelsStore,
  type ConnectedCloud,
  type SalesChannel,
} from '@/stores/useSalesChannels'

const route = useRoute()
const router = useRouter()
const store = useSalesChannelsStore()

const search = ref('')
const VALID_TABS = ['all', 'web_store', 'offline_store', 'attention'] as const
function tabFromRoute(): string {
  const raw = route.query.tab
  const value = Array.isArray(raw) ? raw[0] : raw
  return value && (VALID_TABS as readonly string[]).includes(value) ? value : 'all'
}
const activeTab = ref(tabFromRoute())
watch(() => route.query.tab, () => { activeTab.value = tabFromRoute() })

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

const channels = computed(() => store.channelsForAccount(accountId.value))

const tabs = computed(() => [
  { label: 'All', key: 'all', count: channels.value.length },
  { label: 'Web Stores', key: 'web_store', count: channels.value.filter((channel) => channel.type === 'web_store').length },
  { label: 'Offline Stores', key: 'offline_store', count: channels.value.filter((channel) => channel.type === 'offline_store').length },
  { label: 'Needs attention', key: 'attention', count: channels.value.filter((channel) => channel.health !== 'healthy' || channel.status !== 'connected').length },
])

const tableHeaders = [
  { title: 'Sales Channel', key: 'name', sortable: true },
  { title: 'Type', key: 'type', sortable: true, width: 130 },
  { title: 'Clouds', key: 'connectedClouds', sortable: false, width: 150 },
  { title: 'Status', key: 'health', sortable: true, width: 140 },
  { title: 'Activity', key: 'lastActivityAt', sortable: true, width: 120 },
  { title: '', key: 'actions', sortable: false, align: 'end' as const, width: 56 },
]

const filteredChannels = computed(() => {
  const query = search.value.trim().toLowerCase()
  return channels.value
    .filter((channel) => {
      if (activeTab.value === 'web_store' && channel.type !== 'web_store') return false
      if (activeTab.value === 'offline_store' && channel.type !== 'offline_store') return false
      if (activeTab.value === 'attention' && channel.health === 'healthy' && channel.status === 'connected') return false
      if (!query) return true
      return [
        channel.name,
        channel.description,
        CHANNEL_TYPE_LABELS[channel.type],
        CHANNEL_STATUS_LABELS[channel.status],
        CHANNEL_HEALTH_LABELS[channel.health],
      ].some((value) => value?.toLowerCase().includes(query))
    })
    .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime())
})

function channelRoute(channel: SalesChannel) {
  return { name: 'SalesChannelDetail', params: { accountId: accountId.value, channelId: channel.id } }
}

function openChannel(channel: SalesChannel) {
  router.push(channelRoute(channel))
}

function createChannel() {
  router.push({ name: 'CreateSalesChannel', params: { accountId: accountId.value } })
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

function formatRelative(iso: string) {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffMs = now - then
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (diffMs < hour) return `${Math.max(1, Math.round(diffMs / minute))}m ago`
  if (diffMs < day) return `${Math.round(diffMs / hour)}h ago`
  if (diffMs < 7 * day) return `${Math.round(diffMs / day)}d ago`
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(iso))
}

function channelIcon(channel: SalesChannel) {
  return channel.type === 'web_store' ? 'globe' : 'store'
}

function cloudTone(cloud: ConnectedCloud) {
  if (cloud === 'retail') return 'info'
  if (cloud === 'merchandise') return 'secondary'
  if (cloud === 'store_builder') return 'primary'
  return 'success'
}

type MergedStatus = { label: string; tone: 'success' | 'warning' | 'danger' | 'default' }

function mergedStatus(channel: SalesChannel): MergedStatus {
  if (channel.status === 'sync_issue') return { label: 'Sync issue', tone: 'danger' }
  if (channel.status === 'needs_setup') return { label: 'Needs setup', tone: 'warning' }
  if (channel.status === 'draft') return { label: 'Draft', tone: 'default' }
  if (channel.health === 'attention') return { label: 'Needs attention', tone: 'warning' }
  if (channel.health === 'incomplete') return { label: 'Incomplete', tone: 'warning' }
  return { label: 'Healthy', tone: 'success' }
}

function statusChipColor(tone: MergedStatus['tone']) {
  if (tone === 'success') return 'success'
  if (tone === 'warning') return 'warning'
  if (tone === 'danger') return 'error'
  return undefined
}
</script>

<template>
  <div class="sales-channels-page h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Sales Channels"
      subtitle="Manage where your products are sold online and in person."
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="createChannel">
          Create sales channel
        </v-btn>
      </template>
    </MpPageHeader>

    <MpFilterTabs v-model="activeTab" :tabs="tabs" aria-label="Filter sales channels" />

    <v-card flat border rounded="lg" class="d-flex flex-column">
      <MpDataTableToolbar
        v-model:search="search"
        title="All sales channels"
        search-placeholder="Search sales channels..."
        :total-count="filteredChannels.length"
        :headers="tableHeaders"
      />

      <v-data-table
        class="sales-channels-table"
        :headers="tableHeaders"
        :items="filteredChannels"
        item-value="id"
        hover
        density="default"
        :items-per-page="10"
        @click:row="(_event: Event, { item }: { item: SalesChannel }) => openChannel(item)"
      >
        <template #item.name="{ item }">
          <div class="sales-channel-cell d-flex align-center ga-4 min-width-0">
            <v-avatar size="42" variant="tonal" color="primary">
              <v-icon size="18">{{ channelIcon(item) }}</v-icon>
            </v-avatar>
            <div class="min-width-0">
              <RouterLink
                :to="channelRoute(item)"
                class="sales-channel-link text-body-2 font-weight-bold"
                @click.stop
              >
                {{ item.name }}
              </RouterLink>
              <div class="sales-channel-description text-caption text-medium-emphasis text-truncate">{{ item.description }}</div>
            </div>
          </div>
        </template>

        <template #item.type="{ item }">
          <v-chip size="small" variant="tonal" color="primary" label>
            {{ CHANNEL_TYPE_LABELS[item.type] }}
          </v-chip>
        </template>

        <template #item.connectedClouds="{ item }">
          <div class="d-flex align-center ga-1">
            <v-tooltip
              v-for="cloud in item.connectedClouds"
              :key="cloud"
              :text="CONNECTED_CLOUD_LABELS[cloud]"
              location="top"
            >
              <template #activator="{ props: tipProps }">
                <span
                  v-bind="tipProps"
                  class="cloud-pill"
                  :class="`cloud-pill--${cloudTone(cloud)}`"
                >
                  <v-icon size="14">{{ CONNECTED_CLOUD_ICONS[cloud] }}</v-icon>
                </span>
              </template>
            </v-tooltip>
          </div>
        </template>

        <template #item.health="{ item }">
          <v-chip
            size="small"
            variant="tonal"
            :color="statusChipColor(mergedStatus(item).tone)"
            label
          >
            {{ mergedStatus(item).label }}
          </v-chip>
        </template>

        <template #item.lastActivityAt="{ item }">
          <v-tooltip :text="formatDate(item.lastActivityAt)" location="top">
            <template #activator="{ props: tipProps }">
              <span v-bind="tipProps" class="text-body-2 text-medium-emphasis">{{ formatRelative(item.lastActivityAt) }}</span>
            </template>
          </v-tooltip>
        </template>

        <template #item.actions="{ item }">
          <v-menu location="bottom end">
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                icon="more-vertical"
                variant="text"
                size="small"
                :aria-label="`Actions for ${item.name}`"
                @click.stop
              />
            </template>
            <v-card flat border rounded="lg" min-width="210">
              <v-list density="compact">
                <v-list-item prepend-icon="eye" title="View details" @click="openChannel(item)" />
                <v-list-item prepend-icon="activity" title="View health" @click="openChannel(item)" />
                <v-list-item prepend-icon="settings" title="Channel settings" @click="openChannel(item)" />
              </v-list>
            </v-card>
          </v-menu>
        </template>

        <template #no-data>
          <MpEmptyState
            icon="store"
            title="No sales channels found"
            description="Create a Web Store or Offline Store to start selling through Maropost."
            action-label="Create sales channel"
            action-icon="plus"
            @action="createChannel"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<style scoped>
.sales-channel-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.sales-channels-table :deep(tbody td) {
  padding-top: 14px !important;
  padding-bottom: 14px !important;
}

.sales-channel-cell {
  padding-block: 2px;
}

.sales-channel-description {
  margin-top: 3px;
}

.sales-channel-link:hover {
  text-decoration: underline;
}

.cloud-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.cloud-pill--success {
  background: rgba(var(--v-theme-success), 0.12);
  color: rgb(var(--v-theme-success));
}

.cloud-pill--info {
  background: rgba(var(--v-theme-info), 0.12);
  color: rgb(var(--v-theme-info));
}

.cloud-pill--secondary {
  background: rgba(var(--v-theme-secondary), 0.12);
  color: rgb(var(--v-theme-secondary));
}

.cloud-pill--primary {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}
</style>
