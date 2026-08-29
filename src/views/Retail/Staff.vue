<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import { useRetailStore } from '@/stores/useRetail'
import { useCommerceStore } from '@/stores/useCommerce'
import type { StaffMember, StaffRole } from '@/stores/useRetail'
import { STAFF_ROLE_LABELS } from '@/stores/useRetail'
import { formatAgo } from '@/composables/useRelativeTime'
import { useToast } from '@/composables/useToast'

const store = useRetailStore()
const commerce = useCommerceStore()
const toast = useToast()
function showToast(message: string) { toast.info(message) }

/* ── Filter tabs ───────────────────────────────────────────────── */
const activeTab = ref('all')

const tabCounts = computed(() => ({
  all: store.staffList.length,
  active: store.staffList.filter((a) => a.active).length,
  inactive: store.staffList.filter((a) => !a.active).length,
}))

const tabs = computed(() => [
  { label: 'All',      key: 'all',      count: tabCounts.value.all },
  { label: 'Active',   key: 'active',   count: tabCounts.value.active },
  { label: 'Inactive', key: 'inactive', count: tabCounts.value.inactive },
])

/* ── Table ─────────────────────────────────────────────────────── */
const search = ref('')
const selectedRows = ref<string[]>([])

const tableHeaders = [
  { title: 'Name',       key: 'name',       sortable: true },
  { title: 'Role',       key: 'role',       sortable: true, width: 180 },
  { title: 'Locations',  key: 'locationIds', sortable: false, width: 260 },
  { title: 'PIN',        key: 'pinSet',     sortable: false, width: 80 },
  { title: 'Last login', key: 'lastLoginAt', sortable: true, width: 140 },
  { title: 'Active',     key: 'active',     sortable: false, width: 90 },
]

const rows = computed(() => {
  let list = store.staffList
  if (activeTab.value === 'active') list = list.filter((a) => a.active)
  if (activeTab.value === 'inactive') list = list.filter((a) => !a.active)
  return list
})

const ROLE_COLOR: Record<StaffRole, string> = {
  staff: 'default',
  senior_staff: 'primary',
  manager: 'info',
  admin: 'warning',
}

/* ── Detail / edit drawer ──────────────────────────────────────── */
const editDrawer = ref(false)
const selectedStaff = ref<StaffMember | null>(null)
const editForm = ref({ name: '', role: 'staff' as StaffRole, locationIds: [] as string[], pinReset: false })

function openEdit(item: StaffMember) {
  selectedStaff.value = item
  editForm.value = { name: item.name, role: item.role, locationIds: [...item.locationIds], pinReset: false }
  editDrawer.value = true
}

function saveStaffMember() {
  showToast('Staff member saved — mock only')
  editDrawer.value = false
}

/* ── Add drawer ────────────────────────────────────────────────── */
const addDrawer = ref(false)
const addForm = ref({ name: '', role: 'staff' as StaffRole, locationIds: [] as string[] })

function saveNewStaffMember() {
  showToast('Staff member added — mock only')
  addDrawer.value = false
  addForm.value = { name: '', role: 'staff', locationIds: [] }
}

const ROLE_ITEMS = Object.entries(STAFF_ROLE_LABELS).map(([v, t]) => ({ value: v, title: t }))
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Staff"
      subtitle="Manage store staff — their roles, location assignments, and POS access."
    >
      <template #actions>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="user-plus" @click="addDrawer = true">
          Add staff member
        </v-btn>
      </template>
    </MpPageHeader>

    <MpFilterTabs v-model="activeTab" :tabs="tabs" />

    <v-card flat border rounded="lg" class="retail-widget-card d-flex flex-column">
      <MpDataTableToolbar v-model:search="search" search-placeholder="Search staff…">
        <template #actions>
          <v-btn variant="outlined" size="small" class="text-none" prepend-icon="download" @click="showToast('Export — mock only')">
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
        @click:row="(_e: Event, { item }: { item: StaffMember }) => openEdit(item)"
        style="cursor: pointer;"
      >
        <template #item.name="{ item }">
          <div class="d-flex align-center ga-3">
            <v-avatar size="30" color="primary">
              <span class="text-caption text-white font-weight-bold">
                {{ item.name.split(' ').map((n) => n[0]).join('') }}
              </span>
            </v-avatar>
            <span class="font-weight-medium">{{ item.name }}</span>
          </div>
        </template>

        <template #item.role="{ item }">
          <v-chip size="x-small" variant="tonal" :color="ROLE_COLOR[item.role]" class="font-weight-medium text-capitalize">
            {{ STAFF_ROLE_LABELS[item.role] }}
          </v-chip>
        </template>

        <template #item.locationIds="{ item }">
          <div class="d-flex flex-wrap gap-1">
            <v-chip
              v-for="locId in item.locationIds"
              :key="locId"
              size="x-small"
              variant="tonal"
              color="default"
            >{{ store.locationName(locId) }}</v-chip>
          </div>
        </template>

        <template #item.pinSet="{ item }">
          <v-icon
            :color="item.pinSet ? 'success' : 'error'"
            :title="item.pinSet ? 'PIN set' : 'No PIN'"
            size="18"
          >
            {{ item.pinSet ? 'shield-check' : 'shield-alert' }}
          </v-icon>
        </template>

        <template #item.lastLoginAt="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ formatAgo(item.lastLoginAt) }}</span>
        </template>

        <template #item.active="{ item }">
          <!-- Table-cell control: density and detail suppression are deliberate here. -->
          <v-switch
            :model-value="item.active"
            :aria-label="`${item.name} active`"
            hide-details
            density="compact"
            @click.stop
            @change="showToast(`${item.name} ${item.active ? 'deactivated' : 'activated'} — mock only`)"
          />
        </template>

        <template #no-data>
          <MpEmptyState icon="users" title="No staff" description="Add your first staff member to enable POS access." />
        </template>
      </v-data-table>
    </v-card>

    <!-- Floating bulk bar -->
    <MpFloatingBulkBar :count="selectedRows.length" @clear="selectedRows = []">
      <v-btn variant="tonal" class="text-none" prepend-icon="power" color="warning" @click="showToast('Deactivated — mock only')">
        Deactivate
      </v-btn>
      <v-btn variant="tonal" class="text-none" prepend-icon="key-round" @click="showToast('PIN reset sent — mock only')">
        Reset PINs
      </v-btn>
      <v-btn variant="tonal" class="text-none" prepend-icon="map-pin" @click="showToast('Assign location — mock only')">
        Assign location
      </v-btn>
    </MpFloatingBulkBar>

    <!-- Edit staff drawer -->
    <MpFormDrawer
      v-model="editDrawer"
      :title="selectedStaff?.name ?? 'Staff member'"
      subtitle="Edit role, locations, and access"
    >
      <MpFormGrid>
        <v-text-field v-model="editForm.name" label="Full name" />
        <v-select
          v-model="editForm.role"
          label="Role"
          :items="ROLE_ITEMS"
        />
        <v-select
          v-model="editForm.locationIds"
          label="Locations"
          :items="store.locationList.map((l) => ({ title: l.name, value: l.id }))"
          multiple
          chips
          closable-chips
        />

        <!-- Security section -->
        <MpFormSection title="Security" />
        <div class="d-flex align-center ga-3">
          <v-icon size="18" class="text-medium-emphasis">key-round</v-icon>
          <div class="flex-grow-1">
            <div class="text-body-2 font-weight-medium">POS PIN</div>
            <div class="text-caption text-medium-emphasis">
              {{ selectedStaff?.pinSet ? 'PIN is set. Reset to generate a new one.' : 'No PIN set. This person cannot sign in to POS.' }}
            </div>
          </div>
          <v-btn size="small" variant="tonal" class="text-none" @click="showToast('PIN reset link sent — mock only')">
            {{ selectedStaff?.pinSet ? 'Reset PIN' : 'Set PIN' }}
          </v-btn>
        </div>

        <!-- Activity preview -->
        <MpFormSection title="Recent activity" />
        <div class="d-flex flex-column ga-1">
          <div class="text-body-2 text-medium-emphasis">
            Last login: {{ selectedStaff ? formatAgo(selectedStaff.lastLoginAt) : '—' }}
          </div>
          <div class="text-body-2 text-medium-emphasis">
            Transactions today: {{ commerce.posOrders.filter((o) => o.pos?.staffId === selectedStaff?.id).length }}
          </div>
        </div>
      </MpFormGrid>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="editDrawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" @click="saveStaffMember">Save</v-btn>
      </template>
    </MpFormDrawer>

    <!-- Add staff member drawer -->
    <MpFormDrawer v-model="addDrawer" title="Add staff member" subtitle="Grant POS access to a new team member">
      <MpFormGrid>
        <v-text-field v-model="addForm.name" label="Full name" placeholder="e.g. Sam Reid" />
        <v-select
          v-model="addForm.role"
          label="Role"
          :items="ROLE_ITEMS"
        />
        <v-select
          v-model="addForm.locationIds"
          label="Assign to locations"
          :items="store.locationList.map((l) => ({ title: l.name, value: l.id }))"
          multiple
          chips
          closable-chips
        />
        <div class="d-flex align-center ga-2">
          <v-icon size="16" color="info">info</v-icon>
          <span class="text-body-2 text-medium-emphasis">A PIN setup link will be sent to the staff member's email.</span>
        </div>
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="addDrawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" @click="saveNewStaffMember">Add staff member</v-btn>
      </template>
    </MpFormDrawer>
  </div>
</template>

<style scoped lang="scss">
.gap-1 {
  gap: 4px;
}
</style>
