<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import { useRetailStore } from '@/stores/useRetail'
import type { Register, RegisterStatus } from '@/stores/useRetail'
import { formatAgo } from '@/composables/useRelativeTime'

const store = useRetailStore()
const snackbar = ref({ visible: false, message: '' })
function showToast(message: string) { snackbar.value = { visible: true, message } }

/* ── Filter tabs ───────────────────────────────────────────────── */
const activeTab = ref('all')

const tabCounts = computed(() => {
  const list = store.registerList.filter((r) => r.locationId === store.activeLocationId)
  return {
    all: list.length,
    online: list.filter((r) => r.status === 'online').length,
    offline: list.filter((r) => r.status === 'offline').length,
    syncing: list.filter((r) => r.status === 'syncing').length,
  }
})

const tabs = computed(() => [
  { label: 'All',     key: 'all',     count: tabCounts.value.all },
  { label: 'Online',  key: 'online',  count: tabCounts.value.online },
  { label: 'Offline', key: 'offline', count: tabCounts.value.offline },
  { label: 'Syncing', key: 'syncing', count: tabCounts.value.syncing },
])

/* ── Table ─────────────────────────────────────────────────────── */
const search = ref('')
const selectedRows = ref<string[]>([])

const tableHeaders = [
  { title: 'Name',             key: 'name',                sortable: true },
  { title: 'Location',         key: 'locationId',          sortable: false, width: 160 },
  { title: 'Device',           key: 'deviceModel',         sortable: false, width: 180 },
  { title: 'App version',      key: 'appVersion',          sortable: true,  width: 120 },
  { title: 'Status',           key: 'status',              sortable: false, width: 130 },
  { title: 'Last seen',        key: 'lastSeenAt',          sortable: false, width: 130 },
  { title: 'Pending txns',     key: 'pendingOfflineTxns',  sortable: true,  align: 'end' as const, width: 120 },
  { title: 'Terminal',         key: 'pairedTerminal',      sortable: false, width: 150 },
  { title: '',                 key: 'actions',             sortable: false, width: 56 },
]

const rows = computed(() => {
  let list = store.registerList.filter((r) => r.locationId === store.activeLocationId)
  if (activeTab.value !== 'all') list = list.filter((r) => r.status === activeTab.value)
  return list
})

const STATUS_CHIP_STATUS: Record<RegisterStatus, string> = {
  online: 'Active',
  offline: 'Inactive',
  syncing: 'Processing',
}

/* ── Detail drawer ─────────────────────────────────────────────── */
const detailDrawer = ref(false)
const selectedRegister = ref<Register | null>(null)

function openDetail(item: Register) {
  selectedRegister.value = item
  detailDrawer.value = true
}

/* ── Pair register drawer ──────────────────────────────────────── */
const pairDrawer = ref(false)
const pairForm = ref({ name: '', location: '', deviceType: 'iPad', terminal: '', printer: '' })

function savePair() {
  showToast('Register paired — mock only')
  pairDrawer.value = false
}

const DEVICE_TYPES = ['iPad', 'iPhone', 'Android Tablet', 'Android Phone']
const TERMINALS = ['Stripe S700', 'Stripe M2', 'Tap to Pay', 'None']
const PRINTERS = ['Star mC-Print3', 'Epson TM-m30III', 'None']
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Registers"
      :subtitle="`POS devices for ${store.activeLocation?.name ?? ''}. Monitor status, sync events, and offline queues.`"
    >
      <template #actions>
        <v-btn variant="outlined" class="text-none" prepend-icon="refresh-cw" @click="showToast('Force sync sent to all online registers')">
          Sync all
        </v-btn>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="plus" @click="pairDrawer = true">
          Pair register
        </v-btn>
      </template>
    </MpPageHeader>

    <!-- Fleet status summary -->
    <v-row dense>
      <v-col cols="6" sm="3">
        <div class="retail-fleet-tile">
          <div class="retail-fleet-tile__dot retail-status-dot retail-status-dot--online" />
          <div>
            <div class="retail-fleet-tile__value">{{ tabCounts.online }}</div>
            <div class="retail-fleet-tile__label">Online</div>
          </div>
        </div>
      </v-col>
      <v-col cols="6" sm="3">
        <div class="retail-fleet-tile">
          <div class="retail-fleet-tile__dot retail-status-dot retail-status-dot--syncing" />
          <div>
            <div class="retail-fleet-tile__value">{{ tabCounts.syncing }}</div>
            <div class="retail-fleet-tile__label">Syncing</div>
          </div>
        </div>
      </v-col>
      <v-col cols="6" sm="3">
        <div class="retail-fleet-tile">
          <div class="retail-fleet-tile__dot retail-status-dot retail-status-dot--offline" />
          <div>
            <div class="retail-fleet-tile__value">{{ tabCounts.offline }}</div>
            <div class="retail-fleet-tile__label">Offline</div>
          </div>
        </div>
      </v-col>
      <v-col cols="6" sm="3">
        <div class="retail-fleet-tile">
          <v-icon size="16" color="warning" style="margin-right: 8px;">clock</v-icon>
          <div>
            <div class="retail-fleet-tile__value">{{ store.registerList.filter((r) => r.locationId === store.activeLocationId).reduce((s, r) => s + r.pendingOfflineTxns, 0) }}</div>
            <div class="retail-fleet-tile__label">Pending txns</div>
          </div>
        </div>
      </v-col>
    </v-row>

    <MpFilterTabs v-model="activeTab" :tabs="tabs" />

    <v-card flat border rounded="lg" class="retail-widget-card d-flex flex-column">
      <MpDataTableToolbar v-model:search="search" search-placeholder="Search registers…">
        <template #actions>
          <v-btn v-if="selectedRows.length === 0" variant="outlined" size="small" class="text-none" prepend-icon="download" @click="showToast('Export registers — mock only')">
            Export
          </v-btn>
        </template>
      </MpDataTableToolbar>

      <v-data-table
        v-model="selectedRows"
        :headers="tableHeaders"
        :items="rows"
        :search="search"
        item-value="id"
        hover
        show-select
        density="comfortable"
        :items-per-page="25"
        @click:row="(_e: Event, { item }: { item: Register }) => openDetail(item)"
        style="cursor: pointer;"
      >
        <template #item.name="{ item }">
          <div class="d-flex align-center ga-2">
            <div :class="['retail-status-dot', `retail-status-dot--${item.status}`]" />
            <span class="font-weight-medium">{{ item.name }}</span>
          </div>
        </template>

        <template #item.locationId="{ item }">
          <v-chip size="x-small" variant="tonal" color="primary" class="font-weight-medium">
            {{ store.locationName(item.locationId) }}
          </v-chip>
        </template>

        <template #item.deviceModel="{ item }">
          <div class="d-flex align-center ga-1">
            <v-icon size="14" color="medium-emphasis">
              {{ item.deviceType.includes('iPad') || item.deviceType.includes('Tablet') ? 'tablet' : 'smartphone' }}
            </v-icon>
            <span class="text-body-2">{{ item.deviceModel }}</span>
          </div>
        </template>

        <template #item.appVersion="{ item }">
          <span class="text-body-2 text-mono">v{{ item.appVersion }}</span>
        </template>

        <template #item.status="{ item }">
          <MpStatusChip :status="STATUS_CHIP_STATUS[item.status]" type="general" size="x-small" />
        </template>

        <template #item.lastSeenAt="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ formatAgo(item.lastSeenAt) }}</span>
        </template>

        <template #item.pendingOfflineTxns="{ item }">
          <span v-if="item.pendingOfflineTxns > 0" class="font-weight-bold" style="color: var(--v-theme-warning);">
            {{ item.pendingOfflineTxns }}
          </span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template #item.pairedTerminal="{ item }">
          <span v-if="item.pairedTerminal" class="text-body-2">{{ item.pairedTerminal }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template #item.actions="{ item }">
          <v-menu location="bottom end">
            <template #activator="{ props }">
              <v-btn icon="more-horizontal" variant="text" size="x-small" v-bind="props" @click.stop />
            </template>
            <v-list density="compact">
              <v-list-item title="Force resync" prepend-icon="refresh-cw" @click="showToast(`Resync sent to ${item.name}`)" />
              <v-list-item title="Reprint last receipt" prepend-icon="printer" @click="showToast('Reprint sent — mock only')" />
              <v-list-item title="Deactivate" prepend-icon="power" @click="showToast(`${item.name} deactivated — mock only`)" />
            </v-list>
          </v-menu>
        </template>

        <template #no-data>
          <MpEmptyState icon="tablet-smartphone" title="No registers" description="Pair a device to get started." />
        </template>
      </v-data-table>
    </v-card>

    <!-- Bulk bar -->
    <MpFloatingBulkBar :count="selectedRows.length" @clear="selectedRows = []">
      <v-btn variant="tonal" class="text-none" prepend-icon="refresh-cw" @click="showToast('Force resync sent — mock only')">
        Force resync
      </v-btn>
      <v-btn variant="tonal" class="text-none" prepend-icon="power" color="warning" @click="showToast('Deactivated — mock only')">
        Deactivate
      </v-btn>
    </MpFloatingBulkBar>

    <!-- Detail drawer -->
    <MpFormDrawer
      v-model="detailDrawer"
      :title="selectedRegister?.name ?? 'Register'"
      :subtitle="selectedRegister ? store.locationName(selectedRegister.locationId) : ''"
      :width="520"
    >
      <template v-if="selectedRegister">
        <!-- Status banner -->
        <div class="register-detail-status mb-5" :class="`register-detail-status--${selectedRegister.status}`">
          <div :class="['retail-status-dot', `retail-status-dot--${selectedRegister.status}`]" />
          <span class="font-weight-medium text-capitalize">{{ selectedRegister.status }}</span>
          <span class="text-medium-emphasis" style="margin-left: auto; font-size: 12px;">
            Last seen {{ formatAgo(selectedRegister.lastSeenAt) }}
          </span>
        </div>

        <!-- Device info -->
        <div class="text-subtitle-2 font-weight-bold mb-2">Device</div>
        <v-list density="compact" class="retail-detail-list mb-4">
          <v-list-item title="Model" :subtitle="selectedRegister.deviceModel" />
          <v-list-item title="Type" :subtitle="selectedRegister.deviceType" />
          <v-list-item title="App version" :subtitle="`v${selectedRegister.appVersion}`" />
        </v-list>

        <!-- Hardware pairing -->
        <div class="text-subtitle-2 font-weight-bold mb-2">Paired hardware</div>
        <v-list density="compact" class="retail-detail-list mb-4">
          <v-list-item title="Payment terminal">
            <template #append>
              <span v-if="selectedRegister.pairedTerminal" class="text-body-2 font-weight-medium">{{ selectedRegister.pairedTerminal }}</span>
              <v-btn v-else size="x-small" variant="tonal" class="text-none" @click="showToast('Pair terminal — mock only')">Pair</v-btn>
            </template>
          </v-list-item>
          <v-list-item title="Receipt printer">
            <template #append>
              <span v-if="selectedRegister.pairedPrinter" class="text-body-2 font-weight-medium">{{ selectedRegister.pairedPrinter }}</span>
              <v-btn v-else size="x-small" variant="tonal" class="text-none" @click="showToast('Pair printer — mock only')">Pair</v-btn>
            </template>
          </v-list-item>
        </v-list>

        <!-- Offline queue -->
        <div class="text-subtitle-2 font-weight-bold mb-2">Offline queue</div>
        <div v-if="selectedRegister.pendingOfflineTxns > 0" class="register-offline-warning mb-4">
          <v-icon size="18" color="warning">alert-triangle</v-icon>
          <div>
            <div class="font-weight-medium" style="font-size: 13px;">{{ selectedRegister.pendingOfflineTxns }} transactions pending sync</div>
            <div style="font-size: 12px; color: var(--muted);">These will upload automatically when the device reconnects.</div>
          </div>
          <v-btn size="x-small" variant="tonal" color="warning" class="text-none ml-auto" @click="showToast('Sync triggered — mock only')">Sync now</v-btn>
        </div>
        <div v-else class="text-body-2 text-medium-emphasis mb-4">No pending transactions. Device is fully synced.</div>

        <!-- Actions -->
        <div class="d-flex flex-column gap-2">
          <v-btn variant="outlined" class="text-none" prepend-icon="refresh-cw" @click="showToast('Force resync sent — mock only')">
            Force resync
          </v-btn>
          <v-btn variant="outlined" class="text-none" prepend-icon="printer" @click="showToast('Test receipt printed — mock only')">
            Print test receipt
          </v-btn>
        </div>
      </template>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="detailDrawer = false">Close</v-btn>
        <v-btn variant="tonal" color="error" class="text-none" prepend-icon="power" @click="showToast('Deactivated — mock only'); detailDrawer = false">
          Deactivate
        </v-btn>
      </template>
    </MpFormDrawer>

    <!-- Pair register drawer -->
    <MpFormDrawer v-model="pairDrawer" title="Pair new register" subtitle="Connect a device to your POS network">
      <v-row dense>
        <v-col cols="12">
          <v-text-field v-model="pairForm.name" label="Register name" placeholder="e.g. Front counter" variant="outlined" density="compact" />
        </v-col>
        <v-col cols="12">
          <v-select
            v-model="pairForm.location"
            label="Location"
            :items="store.locationList.map((l) => ({ title: l.name, value: l.id }))"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12">
          <v-select
            v-model="pairForm.deviceType"
            label="Device type"
            :items="DEVICE_TYPES"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12">
          <v-select
            v-model="pairForm.terminal"
            label="Payment terminal (optional)"
            :items="TERMINALS"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12">
          <v-select
            v-model="pairForm.printer"
            label="Receipt printer (optional)"
            :items="PRINTERS"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12">
          <v-card flat border rounded="lg" class="pa-3">
            <div class="d-flex align-center ga-2 mb-1">
              <v-icon size="16" color="info">info</v-icon>
              <span class="text-body-2 font-weight-medium">Pairing instructions</span>
            </div>
            <div class="text-body-2 text-medium-emphasis">
              1. Open the Retail app on your device.<br>
              2. Go to Settings → Pair device.<br>
              3. Enter the pairing code shown here: <strong>8472-K</strong>
            </div>
          </v-card>
        </v-col>
      </v-row>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="pairDrawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" @click="savePair">Pair device</v-btn>
      </template>
    </MpFormDrawer>

    <v-snackbar v-model="snackbar.visible" :timeout="2000" location="bottom">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<style scoped lang="scss">
.retail-fleet-tile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid color-mix(in oklch, var(--ink) 7%, transparent);
  border-radius: var(--r-section);
  background: var(--surface-1);

  &__value {
    font-size: 20px;
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
  }

  &__label {
    font-size: 11px;
    color: var(--muted);
    margin-top: 2px;
  }

  &__dot {
    flex-shrink: 0;
  }
}

.register-detail-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--r-section);
  background: color-mix(in oklch, var(--ink) 4%, transparent);

  &--online { background: color-mix(in oklch, #22c55e 8%, transparent); }
  &--offline { background: color-mix(in oklch, #ef4444 8%, transparent); }
  &--syncing { background: color-mix(in oklch, #f59e0b 8%, transparent); }
}

.register-offline-warning {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border: 1px solid color-mix(in oklch, #f59e0b 30%, transparent);
  border-radius: var(--r-section);
  background: color-mix(in oklch, #f59e0b 8%, transparent);
}

.retail-detail-list {
  background: color-mix(in oklch, var(--ink) 2%, var(--surface-1));
  border: 1px solid color-mix(in oklch, var(--ink) 7%, transparent);
  border-radius: var(--r-section);
}

.text-mono {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
}
</style>
