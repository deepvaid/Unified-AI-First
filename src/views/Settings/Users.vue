<script setup lang="ts">
import { ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { formatAgo } from '@/composables/useRelativeTime'
import { useToast } from '@/composables/useToast'

const search = ref('')

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Email', key: 'email' },
  { title: 'Role Access', key: 'role' },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

interface TeamUser {
  name: string
  email: string
  role: string
  status: string
  lastInvitedAt?: string
}

const ROLES = ['Super Admin', 'Editor', 'Viewer']

const users = ref<TeamUser[]>([
  { name: 'Admin User', email: 'admin@company.com', role: 'Super Admin', status: 'Active' },
  { name: 'Marketing Manager', email: 'marketing@company.com', role: 'Editor', status: 'Active' },
  { name: 'Analyst Temp', email: 'analyst@contract.com', role: 'Viewer', status: 'Suspended' },
])

const toast = useToast()
function showToast(message: string) {
  toast.info(message)
}

/* ── Edit role ─────────────────────────────────────────────────── */
const editRoleDrawer = ref(false)
const editRoleUser = ref<TeamUser | null>(null)
const editRoleValue = ref('')

function openEditRole(user: TeamUser) {
  editRoleUser.value = user
  editRoleValue.value = user.role
  editRoleDrawer.value = true
}

function saveRole() {
  if (editRoleUser.value) {
    editRoleUser.value.role = editRoleValue.value
    showToast(`Role updated for ${editRoleUser.value.name}`)
  }
  editRoleDrawer.value = false
}

/* ── Resend invite ─────────────────────────────────────────────── */
function resendInvite(user: TeamUser) {
  user.lastInvitedAt = new Date().toISOString()
  showToast(`Invite re-sent to ${user.email}`)
}

/* ── Remove user ───────────────────────────────────────────────── */
const confirmRemove = ref(false)
const removeTarget = ref<TeamUser | null>(null)

function openRemove(user: TeamUser) {
  removeTarget.value = user
  confirmRemove.value = true
}

function removeUser() {
  if (removeTarget.value) {
    users.value = users.value.filter((u) => u !== removeTarget.value)
    showToast(`${removeTarget.value.name} removed`)
  }
  removeTarget.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Users & Permissions"
      :subtitle="`${users.length} team members`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">Invite User</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Team Members"
      />
      <v-data-table :headers="headers" :items="users" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.email="{ item }">
          <div class="d-flex flex-column">
            <span>{{ item.email }}</span>
            <span v-if="item.lastInvitedAt" class="text-caption text-medium-emphasis">
              Invite sent {{ formatAgo(item.lastInvitedAt) }}
            </span>
          </div>
        </template>
        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status" type="general" />
        </template>
        <template v-slot:item.actions="{ item }">
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="more-horizontal" variant="text" size="small" />
            </template>
            <v-list density="compact" rounded="lg" min-width="160" elevation="3" class="py-1">
              <v-list-item prepend-icon="pencil" @click="openEditRole(item)">Edit Role</v-list-item>
              <v-list-item prepend-icon="mail" @click="resendInvite(item)">Resend Invite</v-list-item>
              <v-list-item prepend-icon="user-minus" class="text-error" @click="openRemove(item)">Remove User</v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </v-card>

    <!-- Edit role -->
    <MpFormDrawer v-model="editRoleDrawer" title="Edit role" :subtitle="editRoleUser?.name">
      <v-select
        v-model="editRoleValue"
        label="Role Access"
        :items="ROLES"
        variant="outlined"
        density="compact"
      />
      <template #footer>
        <v-btn variant="text" class="text-none" @click="editRoleDrawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" @click="saveRole">Save</v-btn>
      </template>
    </MpFormDrawer>

    <!-- Remove user -->
    <MpConfirmDialog
      v-model="confirmRemove"
      title="Remove user?"
      :message="`${removeTarget?.name ?? 'This user'} will lose access immediately. This cannot be undone.`"
      confirm-label="Remove User"
      danger
      @confirm="removeUser"
    />
  </div>
</template>
