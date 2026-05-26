<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import {
  CHANNEL_HEALTH_LABELS,
  CHANNEL_STATUS_LABELS,
  CHANNEL_TYPE_LABELS,
  CONNECTED_CLOUD_ICONS,
  CONNECTED_CLOUD_LABELS,
  LOCATION_ROLE_LABELS,
  useSalesChannelsStore,
  type ConnectedCloud,
  type SalesChannel,
} from '@/stores/useSalesChannels'
import { useRetailStore } from '@/stores/useRetail'

const route = useRoute()
const router = useRouter()
const salesChannelsStore = useSalesChannelsStore()
const retailStore = useRetailStore()
const notice = ref('')
const noticeVisible = ref(false)

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

const channelId = computed(() => {
  const value = route.params.channelId
  return (Array.isArray(value) ? value[0] : value) ?? ''
})

const channel = computed(() => salesChannelsStore.getChannel(accountId.value, channelId.value))

const locations = computed(() => {
  if (!channel.value?.offlineStore) return []
  const ids = new Set(channel.value.offlineStore.locationIds)
  return retailStore.locationList.filter((location) => ids.has(location.id))
})

const registers = computed(() => {
  const ids = new Set(locations.value.map((location) => location.id))
  return retailStore.registerList.filter((register) => ids.has(register.locationId))
})

const associates = computed(() => {
  const ids = new Set(locations.value.map((location) => location.id))
  return retailStore.associateList.filter((associate) => associate.locationIds.some((id) => ids.has(id)))
})

const primaryAction = computed(() => {
  if (!channel.value) return null
  if (channel.value.type === 'web_store') return channel.value.webStore?.storeBuilderEnabled ? 'Open Store Builder' : 'Set up Store Builder'
  return 'Manage locations'
})

const healthItems = computed(() => {
  const current = channel.value
  if (!current) return []
  if (current.type === 'web_store') {
    return [
      {
        label: 'Commerce setup',
        value: current.status === 'connected' ? 'Connected' : 'Needs setup',
        tone: current.status === 'connected' ? 'success' : 'warning',
      },
      {
        label: 'Store Builder',
        value: current.webStore?.storeBuilderEnabled ? 'Enabled' : 'Not enabled',
        tone: current.webStore?.storeBuilderEnabled ? 'success' : 'default',
      },
      {
        label: 'Publishing',
        value: current.webStore?.published ? 'Published' : 'Draft',
        tone: current.webStore?.published ? 'success' : 'default',
      },
      {
        label: 'Merchandise Cloud',
        value: current.webStore?.merchandiseConnected ? 'Connected' : 'Disconnected',
        tone: current.webStore?.merchandiseConnected ? 'success' : 'warning',
      },
    ]
  }
  return [
    {
      label: 'Retail Cloud',
      value: 'Connected',
      tone: 'success',
    },
    {
      label: 'POS setup',
      value: current.offlineStore?.posSetupComplete ? 'Complete' : 'Incomplete',
      tone: current.offlineStore?.posSetupComplete ? 'success' : 'warning',
    },
    {
      label: 'Locations',
      value: `${locations.value.length} linked`,
      tone: locations.value.length ? 'success' : 'warning',
    },
    {
      label: 'Registers',
      value: `${registers.value.filter((register) => register.status === 'online').length} online`,
      tone: registers.value.some((register) => register.status === 'offline') ? 'warning' : 'success',
    },
  ]
})

const nextActions = computed(() => {
  const current = channel.value
  if (!current) return []
  if (current.type === 'web_store') {
    const actions = [
      current.webStore?.storeBuilderEnabled ? 'Review storefront in Store Builder' : 'Enable Store Builder',
      current.webStore?.merchandiseConnected ? 'Review Merchandise Cloud rules' : 'Connect Merchandise Cloud',
    ]
    if (!current.webStore?.published) actions.unshift('Publish storefront when ready')
    return actions
  }
  const actions = ['Review linked locations', 'Check register fleet health']
  if (!current.offlineStore?.posSetupComplete) actions.unshift('Complete POS setup')
  return actions
})

function showNotice(message: string) {
  notice.value = message
  noticeVisible.value = true
}

function openPrimaryAction() {
  if (!channel.value) return
  if (channel.value.type === 'web_store') {
    showNotice('Store Builder prototype entry point.')
  } else {
    router.push({ name: 'SalesChannelLocations', params: { accountId: accountId.value, channelId: channel.value.id } })
  }
}

function openMerchandise() {
  if (!channel.value) return
  router.push({
    name: 'MerchandisingHome',
    params: { accountId: accountId.value },
    query: { channel: channel.value.id },
  })
}

function openLocations() {
  if (!channel.value) return
  router.push({ name: 'SalesChannelLocations', params: { accountId: accountId.value, channelId: channel.value.id } })
}

function openLocation(locationId: string) {
  if (!channel.value) return
  router.push({
    name: 'SalesChannelLocationDetail',
    params: { accountId: accountId.value, channelId: channel.value.id, locationId },
  })
}

function channelIcon(current: SalesChannel) {
  return current.type === 'web_store' ? 'globe' : 'store'
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function locationRoleText(locationId: string) {
  const roles = channel.value?.offlineStore?.locationRoles[locationId] ?? []
  return roles.map((role) => LOCATION_ROLE_LABELS[role]).join(', ') || 'POS selling'
}
</script>

<template>
  <div class="sales-channel-detail h-100 d-flex flex-column gap-5">
    <template v-if="channel">
      <MpPageHeader
        :title="channel.name"
        :subtitle="channel.description"
        :back-to="{ name: 'SalesChannels', params: { accountId } }"
      >
        <template #actions>
          <v-btn variant="outlined" class="text-none" prepend-icon="settings" :to="{ name: 'SettingsAccountDefaults', params: { accountId } }">
            Platform settings
          </v-btn>
          <v-btn color="primary" variant="flat" class="text-none" @click="openPrimaryAction">
            {{ primaryAction }}
          </v-btn>
        </template>
      </MpPageHeader>

      <section class="sales-channel-hero">
        <div class="sales-channel-hero__icon">
          <v-icon size="24">{{ channelIcon(channel) }}</v-icon>
        </div>
        <div class="min-width-0 flex-grow-1">
          <div class="d-flex align-center ga-2 flex-wrap mb-2">
            <v-chip size="small" color="primary" variant="tonal" label>{{ CHANNEL_TYPE_LABELS[channel.type] }}</v-chip>
            <MpStatusChip :status="CHANNEL_STATUS_LABELS[channel.status]" type="general" size="small" />
            <v-chip size="small" :color="healthColor(channel.health)" variant="tonal" label>
              {{ CHANNEL_HEALTH_LABELS[channel.health] }}
            </v-chip>
          </div>
          <div class="d-flex align-center ga-2 flex-wrap">
            <v-chip
              v-for="cloud in channel.connectedClouds"
              :key="cloud"
              size="small"
              :color="cloudTone(cloud)"
              variant="tonal"
              label
            >
              <v-icon size="14" class="me-1">{{ CONNECTED_CLOUD_ICONS[cloud] }}</v-icon>
              {{ CONNECTED_CLOUD_LABELS[cloud] }}
            </v-chip>
          </div>
        </div>
      </section>

      <v-row>
        <v-col cols="12" lg="8">
          <v-card flat border rounded="lg">
            <v-card-text class="pa-5">
              <div class="d-flex align-center justify-space-between ga-4 mb-4">
                <div>
                  <div class="text-subtitle-1 font-weight-bold">Overview</div>
                  <div class="text-body-2 text-medium-emphasis">Channel health and next actions for this selling context.</div>
                </div>
              </div>

              <v-row>
                <v-col v-for="item in healthItems" :key="item.label" cols="12" sm="6" lg="3">
                  <div class="health-tile">
                    <div class="text-caption text-medium-emphasis">{{ item.label }}</div>
                    <v-chip class="mt-2" size="small" variant="tonal" :color="item.tone" label>{{ item.value }}</v-chip>
                  </div>
                </v-col>
              </v-row>

              <v-alert variant="tonal" color="info" density="comfortable" class="mt-5">
                Business identity and official address are managed in Platform Settings.
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" lg="4">
          <v-card flat border rounded="lg" class="h-100">
            <v-card-text class="pa-5">
              <div class="text-subtitle-1 font-weight-bold mb-3">Next best actions</div>
              <v-list density="compact" class="bg-transparent pa-0">
                <v-list-item v-for="action in nextActions" :key="action" class="px-0">
                  <template #prepend>
                    <v-icon size="17" color="primary" class="me-2">circle-check</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">{{ action }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <section v-if="channel.type === 'web_store'" class="d-flex flex-column gap-4">
        <div class="text-subtitle-1 font-weight-bold">Web Store setup</div>
        <v-row>
          <v-col cols="12" md="4">
            <v-card flat border rounded="lg" class="h-100">
              <v-card-text class="pa-5 d-flex flex-column h-100">
                <v-icon size="24" color="primary" class="mb-3">layout-template</v-icon>
                <div class="text-subtitle-2 font-weight-bold mb-1">Store Builder</div>
                <div class="text-body-2 text-medium-emphasis mb-4">
                  Build and publish this Web Store from the channel context.
                </div>
                <v-spacer />
                <v-btn variant="flat" color="primary" class="text-none" @click="showNotice('Store Builder prototype entry point.')">
                  {{ channel.webStore?.storeBuilderEnabled ? 'Open Store Builder' : 'Set up Store Builder' }}
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card flat border rounded="lg" class="h-100">
              <v-card-text class="pa-5 d-flex flex-column h-100">
                <v-icon size="24" color="secondary" class="mb-3">sliders-horizontal</v-icon>
                <div class="text-subtitle-2 font-weight-bold mb-1">Merchandise Cloud</div>
                <div class="text-body-2 text-medium-emphasis mb-4">
                  Manage search, recommendations, and merchandising rules for this Web Store.
                </div>
                <v-spacer />
                <v-btn variant="outlined" class="text-none" @click="openMerchandise">
                  {{ channel.webStore?.merchandiseConnected ? 'Open merchandising' : 'Connect Merchandise Cloud' }}
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card flat border rounded="lg" class="h-100">
              <v-card-text class="pa-5">
                <v-icon size="24" color="success" class="mb-3">globe</v-icon>
                <div class="text-subtitle-2 font-weight-bold mb-1">Commerce setup</div>
                <div class="text-body-2 text-medium-emphasis mb-4">
                  Domain, publishing, product availability, and storefront health.
                </div>
                <div class="text-caption text-medium-emphasis">Domain</div>
                <div class="text-body-2 font-weight-medium text-truncate">{{ channel.webStore?.domain }}</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </section>

      <section v-else class="d-flex flex-column gap-4">
        <div class="d-flex align-center justify-space-between ga-4">
          <div>
            <div class="text-subtitle-1 font-weight-bold">Offline Store locations</div>
            <div class="text-body-2 text-medium-emphasis">Locations are physical places owned by this Offline Store channel.</div>
          </div>
          <v-btn variant="outlined" class="text-none" prepend-icon="map-pin" @click="openLocations">
            Manage locations
          </v-btn>
        </div>

        <v-row>
          <v-col cols="12" sm="4">
            <v-card flat border rounded="lg">
              <v-card-text>
                <div class="text-caption text-medium-emphasis">Locations</div>
                <div class="text-h5 font-weight-bold">{{ locations.length }}</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4">
            <v-card flat border rounded="lg">
              <v-card-text>
                <div class="text-caption text-medium-emphasis">Registers</div>
                <div class="text-h5 font-weight-bold">{{ registers.length }}</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4">
            <v-card flat border rounded="lg">
              <v-card-text>
                <div class="text-caption text-medium-emphasis">Associates</div>
                <div class="text-h5 font-weight-bold">{{ associates.length }}</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-card flat border rounded="lg">
          <v-list v-if="locations.length" density="comfortable" class="bg-transparent">
            <v-list-item
              v-for="location in locations"
              :key="location.id"
              :title="location.name"
              :subtitle="`${location.address} · ${locationRoleText(location.id)}`"
              @click="openLocation(location.id)"
            >
              <template #prepend>
                <v-icon size="18" color="primary">map-pin</v-icon>
              </template>
              <template #append>
                <div class="d-flex align-center ga-3">
                  <span class="text-body-2 font-weight-bold">{{ formatCurrency(location.todaysSales) }}</span>
                  <MpStatusChip :status="location.status === 'open' ? 'Open' : 'Closed'" type="general" size="x-small" />
                </div>
              </template>
            </v-list-item>
          </v-list>
          <MpEmptyState
            v-else
            icon="map-pin"
            title="No locations linked"
            description="Add a physical location before assigning registers to this Offline Store."
          />
        </v-card>
      </section>

      <v-snackbar v-model="noticeVisible" timeout="2400" color="surface" location="bottom right">
        {{ notice }}
      </v-snackbar>
    </template>

    <template v-else>
      <MpPageHeader
        title="Sales channel not found"
        subtitle="This channel may have been removed or the link is no longer valid."
        :back-to="{ name: 'SalesChannels', params: { accountId } }"
      />
      <v-card flat border rounded="lg">
        <MpEmptyState
          icon="store"
          title="Sales channel not found"
          description="Return to Sales Channels and choose an available channel."
          action-label="Back to Sales Channels"
          action-icon="arrow-left"
          @action="router.push({ name: 'SalesChannels', params: { accountId } })"
        />
      </v-card>
    </template>
  </div>
</template>

<style scoped>
.sales-channel-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  padding: 18px 20px;
}

.sales-channel-hero__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.health-tile {
  min-height: 96px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 10px;
  padding: 14px;
}
</style>
