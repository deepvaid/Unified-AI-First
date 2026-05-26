<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import { useRetailStore } from '@/stores/useRetail'
import type { Associate, AssociateRole } from '@/stores/useRetail'
import { ASSOCIATE_ROLE_LABELS } from '@/stores/useRetail'
import { formatAgo } from '@/composables/useRelativeTime'

const store = useRetailStore()
const snackbar = ref({ visible: false, message: '' })
function showToast(message: string) { snackbar.value = { visible: true, message } }

/* ── Filter tabs ───────────────────────────────────────────────── */
const activeTab = ref('all')

const tabCounts = computed(() => ({
  all: store.associateList.length,
  active: store.associateList.filter((a) => a.active).length,
  inactive: store.associateList.filter((a) => !a.active).length,
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
  let list = store.associateList
  if (activeTab.value === 'active') list = list.filter((a) => a.active)
  if (activeTab.value === 'inactive') list = list.filter((a) => !a.active)
  return list
})

const ROLE_COLOR: Record<AssociateRole, string> = {
  associate: 'default',
  senior_associate: 'primary',
  manager: 'info',
  admin: 'warning',
}

/* ── Detail / edit drawer ──────────────────────────────────────── */
const editDrawer = ref(false)
const selectedAssociate = ref<Associate | null>(null)
const editForm = ref({ name: '', role: 'associate' as AssociateRole, locationIds: [] as string[], pinReset: false })

function openEdit(item: Associate) {
  selectedAssociate.value = item
  editForm.value = { name: item.name, role: item.role, locationIds: [...item.locationIds], pinReset: false }
  editDrawer.value = true
}

function saveAssociate() {
  showToast('Associate saved — mock only')
  editDrawer.value = false
}

/* ── Add drawer ────────────────────────────────────────────────── */
const addDrawer = ref(false)
const addForm = ref({ name: '', role: 'associate' as AssociateRole, locationIds: [] as string[] })

function saveNewAssociate() {
  showToast('Associate added — mock only')
  addDrawer.value = false
  addForm.value = { name: '', role: 'associate', locationIds: [] }
}

const ROLE_ITEMS = Object.entries(ASSOCIATE_ROLE_LABELS).map(([v, t]) => ({ value: v, title: t }))
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Associates"
      subtitle="Manage store associates — their roles, location assignments, and POS access."
    >
      <template #actions>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="user-plus" @click="addDrawer = true">
          Add associate
        </v-btn>
      </template>
    </MpPageHeader>

    <MpFilterTabs v-model="activeTab" :tabs="tabs" />

    <v-card flat border rounded="lg" class="retail-widget-card d-flex flex-column">
      <MpDataTableToolbar v-model:search="search" search-placeholder="Search associates…">
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
        @click:row="(_e: Event, { item }: { item: Associate }) => openEdit(item)"
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
            {{ ASSOCIATE_ROLE_LABELS[item.role] }}
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
          <v-switch
            :model-value="item.active"
            color="primary"
            hide-details
            density="compact"
            @click.stop
            @change="showToast(`${item.name} ${item.active ? 'deactivated' : 'activated'} — mock only`)"
          />
        </template>

        <template #no-data>
          <MpEmptyState icon="users" title="No associates" description="Add your first associate to enable POS access." />
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

    <!-- Edit associate drawer -->
    <MpFormDrawer
      v-model="editDrawer"
      :title="selectedAssociate?.name ?? 'Associate'"
      subtitle="Edit role, locations, and access"
    >
      <v-row dense>
        <v-col cols="12">
          <v-text-field v-model="editForm.name" label="Full name" variant="outlined" density="compact" />
        </v-col>
        <v-col cols="12">
          <v-select
            v-model="editForm.role"
            label="Role"
            :items="ROLE_ITEMS"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12">
          <v-select
            v-model="editForm.locationIds"
            label="Locations"
            :items="store.locationList.map((l) => ({ title: l.name, value: l.id }))"
            multiple
            chips
            closable-chips
            variant="outlined"
            density="compact"
          />
        </v-col>

        <!-- Security section -->
        <v-col cols="12">
          <div class="text-subtitle-2 font-weight-bold mb-2 mt-2">Security</div>
          <v-card flat border rounded="lg" class="pa-3 d-flex align-center ga-3">
            <v-icon size="18" color="medium-emphasis">key-round</v-icon>
            <div class="flex-grow-1">
              <div class="text-body-2 font-weight-medium">POS PIN</div>
              <div class="text-caption text-medium-emphasis">
                {{ selectedAssociate?.pinSet ? 'PIN is set. Reset to generate a new one.' : 'No PIN set. Associate cannot sign in to POS.' }}
              </div>
            </div>
            <v-btn size="small" variant="tonal" class="text-none" @click="showToast('PIN reset link sent — mock only')">
              {{ selectedAssociate?.pinSet ? 'Reset PIN' : 'Set PIN' }}
            </v-btn>
          </v-card>
        </v-col>

        <!-- Activity preview -->
        <v-col cols="12" class="mt-2">
          <div class="text-subtitle-2 font-weight-bold mb-2">Recent activity</div>
          <div class="text-body-2 text-medium-emphasis">
            Last login: {{ selectedAssociate ? formatAgo(selectedAssociate.lastLoginAt) : '—' }}
          </div>
          <div class="text-body-2 text-medium-emphasis mt-1">
            Transactions today: {{ store.transactionList.filter((t) => t.associateId === selectedAssociate?.id).length }}
          </div>
        </v-col>
      </v-row>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="editDrawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" @click="saveAssociate">Save</v-btn>
      </template>
    </MpFormDrawer>

    <!-- Add associate drawer -->
    <MpFormDrawer v-model="addDrawer" title="Add associate" subtitle="Grant POS access to a new team member">
      <v-row dense>
        <v-col cols="12">
          <v-text-field v-model="addForm.name" label="Full name" placeholder="e.g. Sam Reid" variant="outlined" density="compact" />
        </v-col>
        <v-col cols="12">
          <v-select
            v-model="addForm.role"
            label="Role"
            :items="ROLE_ITEMS"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12">
          <v-select
            v-model="addForm.locationIds"
            label="Assign to locations"
            :items="store.locationList.map((l) => ({ title: l.name, value: l.id }))"
            multiple
            chips
            closable-chips
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12">
          <v-card flat border rounded="lg" class="pa-3">
            <div class="d-flex align-center ga-2">
              <v-icon size="16" color="info">info</v-icon>
              <span class="text-body-2">A PIN setup link will be sent to the associate's email.</span>
            </div>
          </v-card>
        </v-col>
      </v-row>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="addDrawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" @click="saveNewAssociate">Add associate</v-btn>
      </template>
    </MpFormDrawer>

    <v-snackbar v-model="snackbar.visible" :timeout="2000" location="bottom">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<style scoped lang="scss">
.gap-1 {
  gap: 4px;
}
</style>
