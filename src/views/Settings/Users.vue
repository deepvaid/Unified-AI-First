<script setup lang="ts">
import { ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const search = ref('')

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Email', key: 'email' },
  { title: 'Role Access', key: 'role' },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

const users = ref([
  { name: 'Admin User', email: 'admin@company.com', role: 'Super Admin', status: 'Active' },
  { name: 'Marketing Manager', email: 'marketing@company.com', role: 'Editor', status: 'Active' },
  { name: 'Analyst Temp', email: 'analyst@contract.com', role: 'Viewer', status: 'Suspended' },
])
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
        <template v-slot:item.status="{ item }">
          <v-chip :color="item.status === 'Active' ? 'success' : 'error'" size="small">{{ item.status }}</v-chip>
        </template>
        <template v-slot:item.actions>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="more-horizontal" variant="text" size="small" />
            </template>
            <v-list density="compact" rounded="xl" nav min-width="160" elevation="8">
              <v-list-item prepend-icon="pencil">Edit Role</v-list-item>
              <v-list-item prepend-icon="mail">Resend Invite</v-list-item>
              <v-list-item prepend-icon="user-minus" class="text-error">Remove User</v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
