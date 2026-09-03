<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpAlert from '@/components/MpAlert.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { useRetailStore, type RetailLocation } from '@/stores/useRetail'
import {
  CHANNEL_STATUS_LABELS,
  LOCATION_ROLE_LABELS,
  useSalesChannelsStore,
  type LocationRole,
} from '@/stores/useSalesChannels'

type LocationRow = RetailLocation & {
  roles: LocationRole[]
  registers: number
  onlineRegisters: number
  staff: number
}

const route = useRoute()
const router = useRouter()
const retailStore = useRetailStore()
const salesChannelsStore = useSalesChannelsStore()

const search = ref('')
const addDrawer = ref(false)
const selectedLocationId = ref<string | null>(null)
const selectedRoles = ref<LocationRole[]>(['pos_selling'])

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

const channelId = computed(() => {
  const value = route.params.channelId
  return (Array.isArray(value) ? value[0] : value) ?? ''
})

const channel = computed(() => salesChannelsStore.getChannel(accountId.value, channelId.value))
const isOfflineChannel = computed(() => channel.value?.type === 'offline_store' && !!channel.value.offlineStore)

const linkedLocationIds = computed(() => new Set(channel.value?.offlineStore?.locationIds ?? []))

const locationRows = computed<LocationRow[]>(() =>
  retailStore.locationList
    .filter((location) => linkedLocationIds.value.has(location.id))
    .map((location) => {
      const registers = retailStore.registerList.filter((register) => register.locationId === location.id)
      const staff = retailStore.staffList.filter((staff) => staff.locationIds.includes(location.id))
      return {
        ...location,
        roles: channel.value?.offlineStore?.locationRoles[location.id] ?? ['pos_selling'],
        registers: registers.length,
        onlineRegisters: registers.filter((register) => register.status === 'online').length,
        staff: staff.length,
      }
    }),
)

const filteredLocations = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return locationRows.value
  return locationRows.value.filter((location) =>
    [
      location.name,
      location.address,
      location.country,
      locationRoleText(location.roles),
      location.status,
    ].some((value) => value.toLowerCase().includes(query)),
  )
})

const availableLocationOptions = computed(() =>
  retailStore.locationList
    .filter((location) => !linkedLocationIds.value.has(location.id))
    .map((location) => ({
      title: location.name,
      value: location.id,
      props: { subtitle: location.address },
    })),
)

const roleOptions = computed(() =>
  Object.entries(LOCATION_ROLE_LABELS).map(([value, title]) => ({
    title,
    value: value as LocationRole,
  })),
)

const tableHeaders = [
  { title: 'Location', key: 'name', sortable: true },
  { title: 'Roles', key: 'roles', sortable: false, width: 240, hideBelow: 'lg' as const },
  { title: 'Registers', key: 'registers', sortable: true, width: 150, hideBelow: 'md' as const },
  { title: 'Staff', key: 'staff', sortable: true, width: 150, hideBelow: 'md' as const },
  { title: 'Today', key: 'todaysSales', sortable: true, width: 140, hideBelow: 'sm' as const },
  { title: 'Status', key: 'status', sortable: true, width: 120 },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const, width: 96 },
]
const { visibleHeaders } = useResponsiveTableHeaders(tableHeaders)

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function locationRoleText(roles: LocationRole[]) {
  return roles.map((role) => LOCATION_ROLE_LABELS[role]).join(', ')
}

function openLocation(location: LocationRow) {
  if (!channel.value) return
  router.push({
    name: 'SalesChannelLocationDetail',
    params: { accountId: accountId.value, channelId: channel.value.id, locationId: location.id },
  })
}

function openAddLocation() {
  selectedLocationId.value = availableLocationOptions.value[0]?.value ?? null
  selectedRoles.value = ['pos_selling']
  addDrawer.value = true
}

function linkLocation() {
  if (!selectedLocationId.value || !channel.value) return
  salesChannelsStore.linkLocationToChannel(
    accountId.value,
    channel.value.id,
    selectedLocationId.value,
    selectedRoles.value.length ? selectedRoles.value : ['pos_selling'],
  )
  addDrawer.value = false
}
</script>

<template>
  <div class="sales-channel-locations h-100 d-flex flex-column gap-5">
    <template v-if="channel && isOfflineChannel">
      <MpPageHeader
        title="Locations"
        :subtitle="`${locationRows.length} linked locations · ${channel.name}`"
        :back-to="{ name: 'SalesChannelDetail', params: { accountId, channelId: channel.id } }"
      >
        <template #actions>
          <v-btn
            color="primary"
            variant="flat"
            class="text-none"
            prepend-icon="plus"
            :disabled="availableLocationOptions.length === 0"
            @click="openAddLocation"
          >
            Link location
          </v-btn>
        </template>
      </MpPageHeader>

      <v-row>
        <v-col cols="12" md="4">
          <MpKpiCard
            label="Offline Store"
            :value="channel.name"
            icon="store"
            color="retail"
            :sub-stat="CHANNEL_STATUS_LABELS[channel.status]"
          />
        </v-col>
        <v-col cols="12" md="4">
          <MpKpiCard
            label="Linked locations"
            :value="locationRows.length"
            icon="map-pin"
            sub-stat="Owned by this Offline Store channel."
          />
        </v-col>
        <v-col cols="12" md="4">
          <MpKpiCard
            label="Online registers"
            :value="`${locationRows.reduce((sum, location) => sum + location.onlineRegisters, 0)} / ${locationRows.reduce((sum, location) => sum + location.registers, 0)}`"
            icon="monitor"
            sub-stat="Current Retail Cloud register health."
          />
        </v-col>
      </v-row>

      <v-card flat border rounded="lg" class="d-flex flex-column">
        <MpDataTableToolbar
          v-model:search="search"
          search-placeholder="Search locations..."
          :total-count="filteredLocations.length"
          :headers="tableHeaders"
        />

        <v-data-table
          :headers="visibleHeaders"
          :items="filteredLocations"
          item-value="id"
          hover
          density="comfortable"
          :items-per-page="10"
          @click:row="(_event: Event, { item }: { item: LocationRow }) => openLocation(item)"
        >
          <template #item.name="{ item }">
            <div class="min-width-0">
              <div class="text-body-2 font-weight-bold">{{ item.name }}</div>
              <div class="text-caption text-medium-emphasis text-truncate">{{ item.address }}</div>
            </div>
          </template>

          <template #item.roles="{ item }">
            <span class="text-body-2 text-medium-emphasis">
              {{ item.roles.map((role: LocationRole) => LOCATION_ROLE_LABELS[role]).join(' · ') }}
            </span>
          </template>

          <template #item.registers="{ item }">
            <span class="text-body-2">{{ item.onlineRegisters }} online / {{ item.registers }} total</span>
          </template>

          <template #item.todaysSales="{ item }">
            <span class="text-body-2 font-weight-bold">{{ formatCurrency(item.todaysSales) }}</span>
          </template>

          <template #item.status="{ item }">
            <MpStatusChip :status="item.status === 'open' ? 'Open' : 'Closed'" type="general" size="sm" />
          </template>

          <template #item.actions="{ item }">
            <v-btn
              icon
              variant="text"
              size="small"
              :aria-label="`Open ${item.name}`"
              @click.stop="openLocation(item)"
            >
              <v-icon>chevron-right</v-icon>
              <v-tooltip activator="parent" location="top">Open location</v-tooltip>
            </v-btn>
          </template>

          <template #no-data>
            <MpEmptyState
              icon="map-pin"
              title="No locations linked"
              description="Link a physical location before assigning registers to this Offline Store channel."
              action-label="Link location"
              action-icon="plus"
              @action="openAddLocation"
            />
          </template>
        </v-data-table>
      </v-card>

      <MpFormDrawer
        v-model="addDrawer"
        title="Link location"
        subtitle="Add an existing physical location to this Offline Store channel."
      >
        <MpAlert v-if="availableLocationOptions.length === 0" tone="info" live="off">
          Every available Retail Cloud location is already linked to this Offline Store channel.
        </MpAlert>

        <template v-else>
          <MpFormGrid>
            <v-select
              v-model="selectedLocationId"
              :items="availableLocationOptions"
              label="Location"
            />

            <v-select
              v-model="selectedRoles"
              :items="roleOptions"
              label="Location roles"
              multiple
              chips
            />
          </MpFormGrid>

          <MpAlert tone="info" live="off">
            In v1, a physical location belongs to one Offline Store channel. Registers stay managed from Location Detail.
          </MpAlert>
        </template>

        <template #footer>
          <v-btn variant="text" class="text-none" @click="addDrawer = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="text-none"
            :disabled="!selectedLocationId"
            @click="linkLocation"
          >
            Link location
          </v-btn>
        </template>
      </MpFormDrawer>
    </template>

    <template v-else>
      <MpPageHeader
        title="Locations unavailable"
        subtitle="Locations are managed inside an Offline Store sales channel."
        :back-to="{ name: 'SalesChannels', params: { accountId } }"
      />
      <v-card flat border rounded="lg">
        <MpEmptyState
          icon="store"
          title="Open an Offline Store channel"
          description="Web Stores do not own physical locations in this model."
          action-label="Back to Sales Channels"
          action-icon="arrow-left"
          @action="router.push({ name: 'SalesChannels', params: { accountId } })"
        />
      </v-card>
    </template>
  </div>
</template>
