<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import {
  ASSOCIATE_ROLE_LABELS,
  useRetailStore,
  type Associate,
  type Register,
} from '@/stores/useRetail'
import {
  LOCATION_ROLE_LABELS,
  useSalesChannelsStore,
  type LocationRole,
} from '@/stores/useSalesChannels'

const route = useRoute()
const router = useRouter()
const retailStore = useRetailStore()
const salesChannelsStore = useSalesChannelsStore()

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

const channelId = computed(() => {
  const value = route.params.channelId
  return (Array.isArray(value) ? value[0] : value) ?? ''
})

const locationId = computed(() => {
  const value = route.params.locationId
  return (Array.isArray(value) ? value[0] : value) ?? ''
})

const channel = computed(() => salesChannelsStore.getChannel(accountId.value, channelId.value))
const linkedLocationIds = computed(() => new Set(channel.value?.offlineStore?.locationIds ?? []))
const location = computed(() =>
  linkedLocationIds.value.has(locationId.value)
    ? retailStore.locationList.find((item) => item.id === locationId.value)
    : undefined,
)

const roles = computed<LocationRole[]>(() =>
  channel.value?.offlineStore?.locationRoles[locationId.value] ?? ['pos_selling'],
)

const registers = computed<Register[]>(() =>
  retailStore.registerList.filter((register) => register.locationId === locationId.value),
)

const associates = computed<Associate[]>(() =>
  retailStore.associateList.filter((associate) => associate.locationIds.includes(locationId.value)),
)

const validLocation = computed(() => !!channel.value?.offlineStore && !!location.value)

const registerHeaders = [
  { title: 'Register', key: 'name', sortable: true },
  { title: 'Device', key: 'device', sortable: false },
  { title: 'Peripherals', key: 'peripherals', sortable: false },
  { title: 'Pending', key: 'pendingOfflineTxns', sortable: true, width: 120 },
  { title: 'Status', key: 'status', sortable: true, width: 120 },
  { title: 'Last seen', key: 'lastSeenAt', sortable: true, width: 170 },
]

const associateHeaders = [
  { title: 'Associate', key: 'name', sortable: true },
  { title: 'Role', key: 'role', sortable: true },
  { title: 'PIN', key: 'pinSet', sortable: true, width: 110 },
  { title: 'Status', key: 'active', sortable: true, width: 120 },
  { title: 'Last login', key: 'lastLoginAt', sortable: true, width: 170 },
]

const enabledFulfillmentRoles = computed(() =>
  roles.value.filter((role) => role === 'pickup' || role === 'fulfillment' || role === 'warehouse'),
)

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

function roleText(value: LocationRole[]) {
  return value.map((role) => LOCATION_ROLE_LABELS[role]).join(', ')
}

function registerStatusLabel(status: Register['status']) {
  if (status === 'online') return 'Online'
  if (status === 'syncing') return 'Syncing'
  return 'Offline'
}
</script>

<template>
  <div class="location-detail h-100 d-flex flex-column gap-5">
    <template v-if="validLocation && location && channel">
      <MpPageHeader
        :title="location.name"
        :subtitle="`${channel.name} location detail, registers, associates, and fulfillment settings.`"
        :back-to="{ name: 'SalesChannelLocations', params: { accountId, channelId: channel.id } }"
      >
        <template #actions>
          <v-btn
            variant="outlined"
            class="text-none"
            prepend-icon="monitor-smartphone"
            :to="{ name: 'RetailRegisters', params: { accountId } }"
          >
            Retail registers
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="text-none"
            prepend-icon="settings"
            :to="{ name: 'RetailSettings', params: { accountId } }"
          >
            POS settings
          </v-btn>
        </template>
      </MpPageHeader>

      <v-row>
        <v-col cols="12" md="3">
          <v-card flat border rounded="lg">
            <v-card-text>
              <div class="text-caption text-medium-emphasis">Today sales</div>
              <div class="text-h5 font-weight-bold">{{ formatCurrency(location.todaysSales) }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card flat border rounded="lg">
            <v-card-text>
              <div class="text-caption text-medium-emphasis">Registers</div>
              <div class="text-h5 font-weight-bold">
                {{ registers.filter((register) => register.status === 'online').length }} / {{ registers.length }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card flat border rounded="lg">
            <v-card-text>
              <div class="text-caption text-medium-emphasis">Associates</div>
              <div class="text-h5 font-weight-bold">{{ associates.filter((associate) => associate.active).length }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card flat border rounded="lg">
            <v-card-text>
              <div class="text-caption text-medium-emphasis">Status</div>
              <div class="mt-2">
                <MpStatusChip :status="location.status === 'open' ? 'Open' : 'Closed'" type="general" size="small" />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" lg="7">
          <v-card flat border rounded="lg" class="h-100">
            <v-card-text class="pa-5">
              <div class="text-subtitle-1 font-weight-bold mb-4">Address and hours</div>
              <v-list class="bg-transparent pa-0" density="compact">
                <v-list-item class="px-0" title="Address" :subtitle="location.address">
                  <template #prepend>
                    <v-icon size="18" color="primary">map-pin</v-icon>
                  </template>
                </v-list-item>
                <v-list-item class="px-0" title="Country" :subtitle="location.country">
                  <template #prepend>
                    <v-icon size="18" color="primary">globe-2</v-icon>
                  </template>
                </v-list-item>
                <v-list-item class="px-0" title="Location roles" :subtitle="roleText(roles)">
                  <template #prepend>
                    <v-icon size="18" color="primary">tags</v-icon>
                  </template>
                </v-list-item>
                <v-list-item class="px-0" title="Operating hours" subtitle="Mon-Sun, 9:00 AM-6:00 PM">
                  <template #prepend>
                    <v-icon size="18" color="primary">clock</v-icon>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" lg="5">
          <v-card flat border rounded="lg" class="h-100">
            <v-card-text class="pa-5">
              <div class="text-subtitle-1 font-weight-bold mb-2">Pickup and fulfillment</div>
              <div class="text-body-2 text-medium-emphasis mb-4">
                These settings describe how this physical location supports the Offline Store channel.
              </div>
              <div v-if="enabledFulfillmentRoles.length" class="d-flex align-center ga-2 flex-wrap">
                <v-chip
                  v-for="role in enabledFulfillmentRoles"
                  :key="role"
                  size="small"
                  color="primary"
                  variant="tonal"
                  label
                >
                  {{ LOCATION_ROLE_LABELS[role] }}
                </v-chip>
              </div>
              <v-alert v-else type="info" variant="tonal" density="compact">
                Pickup and fulfillment are not enabled for this location.
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-card flat border rounded="lg">
        <v-card-title class="px-6 pt-5 pb-2 text-subtitle-1 font-weight-bold">Registers</v-card-title>
        <v-data-table
          :headers="registerHeaders"
          :items="registers"
          item-value="id"
          density="comfortable"
          :items-per-page="5"
        >
          <template #item.name="{ item }">
            <div>
              <div class="text-body-2 font-weight-bold">{{ item.name }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.appVersion }}</div>
            </div>
          </template>
          <template #item.device="{ item }">
            <span class="text-body-2">{{ item.deviceType }} - {{ item.deviceModel }}</span>
          </template>
          <template #item.peripherals="{ item }">
            <span class="text-body-2">
              {{ [item.pairedTerminal, item.pairedPrinter].filter(Boolean).join(', ') || 'None paired' }}
            </span>
          </template>
          <template #item.pendingOfflineTxns="{ item }">
            <span class="text-body-2">{{ item.pendingOfflineTxns }}</span>
          </template>
          <template #item.status="{ item }">
            <MpStatusChip :status="registerStatusLabel(item.status)" type="general" size="x-small" />
          </template>
          <template #item.lastSeenAt="{ item }">
            <span class="text-body-2">{{ formatDate(item.lastSeenAt) }}</span>
          </template>
          <template #no-data>
            <MpEmptyState
              icon="monitor-smartphone"
              title="No registers assigned"
              description="Assign a POS register before this location can take in-person sales."
            />
          </template>
        </v-data-table>
      </v-card>

      <v-card flat border rounded="lg">
        <v-card-title class="px-6 pt-5 pb-2 text-subtitle-1 font-weight-bold">Associates</v-card-title>
        <v-data-table
          :headers="associateHeaders"
          :items="associates"
          item-value="id"
          density="comfortable"
          :items-per-page="5"
        >
          <template #item.name="{ item }">
            <div class="text-body-2 font-weight-bold">{{ item.name }}</div>
          </template>
          <template #item.role="{ item }">
            <span class="text-body-2">{{ ASSOCIATE_ROLE_LABELS[item.role] }}</span>
          </template>
          <template #item.pinSet="{ item }">
            <MpStatusChip :status="item.pinSet ? 'Enabled' : 'Disabled'" type="general" size="x-small" />
          </template>
          <template #item.active="{ item }">
            <MpStatusChip :status="item.active ? 'Active' : 'Inactive'" type="general" size="x-small" />
          </template>
          <template #item.lastLoginAt="{ item }">
            <span class="text-body-2">{{ formatDate(item.lastLoginAt) }}</span>
          </template>
          <template #no-data>
            <MpEmptyState
              icon="users"
              title="No associates assigned"
              description="Assign associates before this location can track staff activity."
            />
          </template>
        </v-data-table>
      </v-card>
    </template>

    <template v-else>
      <MpPageHeader
        title="Location not found"
        subtitle="This location is not linked to the selected Offline Store channel."
        :back-to="{ name: 'SalesChannels', params: { accountId } }"
      />
      <v-card flat border rounded="lg">
        <MpEmptyState
          icon="map-pin"
          title="Location not available"
          description="Return to the Offline Store locations page and choose an available location."
          action-label="Back to locations"
          action-icon="arrow-left"
          @action="router.push({ name: 'SalesChannelLocations', params: { accountId, channelId } })"
        />
      </v-card>
    </template>
  </div>
</template>
