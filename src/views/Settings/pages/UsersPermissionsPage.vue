<script setup lang="ts">
import { ref } from 'vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import SettingsPageHeader from '@/components/settings/SettingsPageHeader.vue'
import SettingsSection from '@/components/settings/SettingsSection.vue'

const teamUsers = ref([
  { id: 1, name: 'Ross Andrew Paquette', email: 'Ross@maropost.com',  role: 'Owner',         marketing: true,  service: true,  commerce: true,  status: 'Active',  avatar: 'RP' },
  { id: 2, name: 'Sarah Connor',         email: 'sarah@maropost.com', role: 'Admin',         marketing: true,  service: true,  commerce: false, status: 'Active',  avatar: 'SC' },
  { id: 3, name: 'Mike Zhang',           email: 'mike@maropost.com',  role: 'Support Agent', marketing: false, service: true,  commerce: false, status: 'Active',  avatar: 'MZ' },
  { id: 4, name: 'Priya Sharma',         email: 'priya@maropost.com', role: 'Marketer',      marketing: true,  service: false, commerce: false, status: 'Active',  avatar: 'PS' },
  { id: 5, name: 'Tom Brady',            email: 'tom@maropost.com',   role: 'Analyst',       marketing: true,  service: false, commerce: true,  status: 'Invited', avatar: 'TB' },
])

const addUserDialog = ref(false)
const newUserEmail = ref('')
const newUserRole = ref('Marketer')
</script>

<template>
  <div class="settings-page">
    <SettingsPageHeader
      title="Users & Permissions"
      :subtitle="`${teamUsers.length} members · Manage role and module access per user.`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="user-plus" class="text-none" @click="addUserDialog = true">
          Invite User
        </v-btn>
      </template>
    </SettingsPageHeader>

    <SettingsSection title="Team Members" description="Review access, ownership, and module permissions.">
      <div class="users-table">
        <v-table density="comfortable">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th class="text-center">Marketing</th>
              <th class="text-center">Service</th>
              <th class="text-center">Commerce</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in teamUsers" :key="u.id">
              <td>
                <div class="user-cell">
                  <v-avatar color="primary" variant="tonal" size="34" class="font-weight-bold text-caption">{{ u.avatar }}</v-avatar>
                  <div>
                    <div class="user-cell__name">{{ u.name }}</div>
                    <div class="user-cell__email">{{ u.email }}</div>
                  </div>
                </div>
              </td>
              <td><v-chip size="x-small" variant="tonal" color="secondary">{{ u.role }}</v-chip></td>
              <td class="text-center"><v-icon :color="u.marketing ? 'success' : 'grey-lighten-2'" size="18">{{ u.marketing ? 'circle-check' : 'circle-minus' }}</v-icon></td>
              <td class="text-center"><v-icon :color="u.service ? 'success' : 'grey-lighten-2'" size="18">{{ u.service ? 'circle-check' : 'circle-minus' }}</v-icon></td>
              <td class="text-center"><v-icon :color="u.commerce ? 'success' : 'grey-lighten-2'" size="18">{{ u.commerce ? 'circle-check' : 'circle-minus' }}</v-icon></td>
              <td><v-chip :color="u.status === 'Active' ? 'success' : 'warning'" size="x-small" variant="flat">{{ u.status }}</v-chip></td>
              <td class="text-right">
                <v-btn icon="pencil" variant="text" size="small" aria-label="Edit" />
                <v-btn v-if="u.role !== 'Owner'" icon="trash-2" variant="text" size="small" color="error" aria-label="Remove" />
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </SettingsSection>

    <MpFormDrawer
      v-model="addUserDialog"
      title="Invite Team Member"
      subtitle="Grant role-based module access"
      :width="460"
    >
      <v-text-field
        v-model="newUserEmail"
        label="Email Address"
        type="email"
        variant="outlined"
        density="compact"
        hide-details
        class="mb-3"
        placeholder="colleague@company.com"
      />
      <v-select
        v-model="newUserRole"
        label="Role"
        :items="['Admin','Marketer','Support Agent','Analyst','Viewer']"
        variant="outlined"
        density="compact"
        hide-details
        class="mb-3"
      />
      <div class="text-subtitle-2 font-weight-bold mb-2">Module Access</div>
      <div class="d-flex gap-4 mb-3">
        <v-checkbox label="Marketing" color="primary" density="compact" hide-details />
        <v-checkbox label="Service" color="primary" density="compact" hide-details />
        <v-checkbox label="Commerce" color="primary" density="compact" hide-details />
      </div>
      <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="text-body-2">
        The invitee will receive a sign-up link. Access is granted after they accept.
      </v-alert>
      <template #footer>
        <div class="w-100 d-flex justify-end gap-3">
          <v-btn variant="text" class="text-none" @click="addUserDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" class="text-none" prepend-icon="send" :disabled="!newUserEmail">
            Send Invitation
          </v-btn>
        </div>
      </template>
    </MpFormDrawer>
  </div>
</template>

<style scoped lang="scss">
.settings-page {
  max-width: 980px;
}

.users-table {
  border: 1px solid var(--hairline);
  border-radius: 12px;
  background: var(--surface-1);
  overflow: hidden;
}

.users-table :deep(.v-table) {
  background: transparent;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
}

.user-cell__name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
}

.user-cell__email {
  font-size: 12px;
  color: var(--muted);
}

@media (max-width: 760px) {
  .users-table {
    overflow-x: auto;
  }
}
</style>
