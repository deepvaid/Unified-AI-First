<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpAlert from '@/components/MpAlert.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import {
  STAFF_ROLE_LABELS,
  useRetailStore,
  type StaffMember,
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

const staff = computed<StaffMember[]>(() =>
  retailStore.staffList.filter((staff) => staff.locationIds.includes(locationId.value)),
)

const validLocation = computed(() => !!channel.value?.offlineStore && !!location.value)

const registerHeaders = [
  { title: 'Register', key: 'name', sortable: true },
  { title: 'Device', key: 'device', sortable: false, hideBelow: 'md' as const },
  { title: 'Peripherals', key: 'peripherals', sortable: false, hideBelow: 'lg' as const },
  { title: 'Pending', key: 'pendingOfflineTxns', sortable: true, width: 120, hideBelow: 'sm' as const },
  { title: 'Status', key: 'status', sortable: true, width: 120 },
  { title: 'Last seen', key: 'lastSeenAt', sortable: true, width: 170, hideBelow: 'md' as const },
]
const { visibleHeaders: visibleRegisterHeaders } = useResponsiveTableHeaders(registerHeaders)

const staffHeaders = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Role', key: 'role', sortable: true, hideBelow: 'sm' as const },
  { title: 'PIN', key: 'pinSet', sortable: true, width: 110, hideBelow: 'md' as const },
  { title: 'Status', key: 'active', sortable: true, width: 120 },
  { title: 'Last login', key: 'lastLoginAt', sortable: true, width: 170, hideBelow: 'md' as const },
]
const { visibleHeaders: visibleStaffHeaders } = useResponsiveTableHeaders(staffHeaders)

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
        :subtitle="`${channel.name} location detail, registers, staff, and fulfillment settings.`"
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
        <v-col cols="12" sm="6" md="3">
          <MpKpiCard label="Today sales" :value="formatCurrency(location.todaysSales)" icon="banknote" />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <MpKpiCard
            label="Registers"
            :value="`${registers.filter((register) => register.status === 'online').length} / ${registers.length}`"
            icon="monitor-smartphone"
            sub-stat="Online / total"
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <MpKpiCard label="Staff" :value="staff.filter((staff) => staff.active).length" icon="users" sub-stat="Active" />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <MpKpiCard
            label="Status"
            :value="location.status === 'open' ? 'Open' : 'Closed'"
            icon="circle-dot"
            :color="location.status === 'open' ? 'success' : 'default'"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" lg="7">
          <v-card flat border rounded="lg" class="h-100 ld-card">
            <h2 class="mp-section-title">Address and hours</h2>
            <dl class="mp-label-value">
              <div>
                <dt>Address</dt>
                <dd>{{ location.address }}</dd>
              </div>
              <div>
                <dt>Country</dt>
                <dd>{{ location.country }}</dd>
              </div>
              <div>
                <dt>Location roles</dt>
                <dd>{{ roleText(roles) }}</dd>
              </div>
              <div>
                <dt>Operating hours</dt>
                <dd>Mon-Sun, 9:00 AM-6:00 PM</dd>
              </div>
            </dl>
          </v-card>
        </v-col>

        <v-col cols="12" lg="5">
          <v-card flat border rounded="lg" class="h-100 ld-card">
            <div>
              <h2 class="mp-section-title">Pickup and fulfillment</h2>
              <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
                These settings describe how this physical location supports the Offline Store channel.
              </p>
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
            <MpAlert v-else tone="info" live="off">
              Pickup and fulfillment are not enabled for this location.
            </MpAlert>
          </v-card>
        </v-col>
      </v-row>

      <v-card flat border rounded="lg">
        <h2 class="mp-section-title ld-table-title">Registers</h2>
        <v-data-table
          :headers="visibleRegisterHeaders"
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
            <MpStatusChip :status="registerStatusLabel(item.status)" type="general" size="sm" />
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
        <h2 class="mp-section-title ld-table-title">Staff</h2>
        <v-data-table
          :headers="visibleStaffHeaders"
          :items="staff"
          item-value="id"
          density="comfortable"
          :items-per-page="5"
        >
          <template #item.name="{ item }">
            <div class="text-body-2 font-weight-bold">{{ item.name }}</div>
          </template>
          <template #item.role="{ item }">
            <span class="text-body-2">{{ STAFF_ROLE_LABELS[item.role] }}</span>
          </template>
          <template #item.pinSet="{ item }">
            <MpStatusChip :status="item.pinSet ? 'Enabled' : 'Disabled'" type="general" size="sm" />
          </template>
          <template #item.active="{ item }">
            <MpStatusChip :status="item.active ? 'Active' : 'Inactive'" type="general" size="sm" />
          </template>
          <template #item.lastLoginAt="{ item }">
            <span class="text-body-2">{{ formatDate(item.lastLoginAt) }}</span>
          </template>
          <template #no-data>
            <MpEmptyState
              icon="users"
              title="No staff assigned"
              description="Assign staff before this location can track staff activity."
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

<style scoped>
.ld-card {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-card-gap);
  padding: var(--mp-component-card-padding);
}

.ld-table-title {
  padding: var(--mp-component-card-padding) var(--mp-component-card-padding) var(--mp-space-8);
}
</style>
