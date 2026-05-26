<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
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
const activeTab = ref('all')

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
  { title: 'Type', key: 'type', sortable: true, width: 150 },
  { title: 'Connected clouds', key: 'connectedClouds', sortable: false, width: 310 },
  { title: 'Health', key: 'health', sortable: true, width: 160 },
  { title: 'Last activity', key: 'lastActivityAt', sortable: true, width: 170 },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const, width: 96 },
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
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
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

function healthColor(health: SalesChannel['health']) {
  if (health === 'healthy') return 'success'
  if (health === 'attention') return 'warning'
  return 'default'
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
        :headers="tableHeaders"
        :items="filteredChannels"
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="10"
        @click:row="(_event: Event, { item }: { item: SalesChannel }) => openChannel(item)"
      >
        <template #item.name="{ item }">
          <div class="d-flex align-center ga-3 min-width-0">
            <v-avatar size="36" variant="tonal" color="primary">
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
              <div class="text-caption text-medium-emphasis text-truncate">{{ item.description }}</div>
            </div>
          </div>
        </template>

        <template #item.type="{ item }">
          <v-chip size="small" variant="tonal" color="primary" label>
            {{ CHANNEL_TYPE_LABELS[item.type] }}
          </v-chip>
        </template>

        <template #item.connectedClouds="{ item }">
          <div class="d-flex align-center ga-1 flex-wrap">
            <v-chip
              v-for="cloud in item.connectedClouds"
              :key="cloud"
              size="x-small"
              variant="tonal"
              :color="cloudTone(cloud)"
              label
            >
              <v-icon size="12" class="me-1">{{ CONNECTED_CLOUD_ICONS[cloud] }}</v-icon>
              {{ CONNECTED_CLOUD_LABELS[cloud] }}
            </v-chip>
          </div>
        </template>

        <template #item.health="{ item }">
          <div class="d-flex align-center ga-2 flex-wrap">
            <MpStatusChip :status="CHANNEL_STATUS_LABELS[item.status]" type="general" size="x-small" />
            <v-chip size="x-small" variant="tonal" :color="healthColor(item.health)" label>
              {{ CHANNEL_HEALTH_LABELS[item.health] }}
            </v-chip>
          </div>
        </template>

        <template #item.lastActivityAt="{ item }">
          <span class="text-body-2">{{ formatDate(item.lastActivityAt) }}</span>
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

.sales-channel-link:hover {
  text-decoration: underline;
}
</style>
