<script setup lang="ts">
import { ref } from 'vue'
import { useAudienceStore } from '@/stores/useAudience'
import { storeToRefs } from 'pinia'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'

const store = useAudienceStore()
const { contacts } = storeToRefs(store)

const selected = ref<number[]>([])
const editingId = ref<number | null>(null)
const editName = ref('')

function toggleSelectAll(val: boolean | null) {
  if (val) {
    selected.value = contacts.value.map((c: any) => c.id)
  } else {
    selected.value = []
  }
}

function startEdit(contact: any) {
  editingId.value = contact.id
  editName.value = contact.name
}

function saveEdit(contact: any) {
  contact.name = editName.value
  editingId.value = null
}
</script>

<template>
  <div class="position-relative h-100 pb-16">
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Audience</h1>
        <p class="text-medium-emphasis">Manage contacts, lists, and segments.</p>
      </div>
      <div class="d-flex gap-4">
        <v-btn variant="flat" prepend-icon="share" color="surface">Export</v-btn>
        <v-btn color="primary" prepend-icon="user-plus" class="ml-4">Add Contact</v-btn>
      </div>
    </div>

    <!-- Data Table Bento Box -->
    <v-card class="bento-card bg-surface pa-0 pb-2">
      <div class="pa-4 d-flex align-center border-b border-opacity-25" style="border-color: rgba(var(--v-border-color), 0.1) !important;">
        <v-text-field
          density="compact"
          variant="outlined"
          placeholder="Search contacts by name or email..."
          prepend-inner-icon="search"
          hide-details
          class="max-w-md"
          style="max-width: 400px;"
        ></v-text-field>
        <v-spacer></v-spacer>
        <v-btn variant="text" prepend-icon="list-filter">Filter</v-btn>
      </div>

      <v-table class="bg-transparent" fixed-header height="60vh">
        <thead class="bg-background">
          <tr>
            <th class="py-4" style="width: 50px;">
              <v-checkbox-btn 
                :model-value="selected.length === contacts.length"
                :indeterminate="selected.length > 0 && selected.length < contacts.length"
                @update:model-value="toggleSelectAll"
                color="primary"
              ></v-checkbox-btn>
            </th>
            <th class="font-weight-bold text-medium-emphasis py-4">Name</th>
            <th class="font-weight-bold text-medium-emphasis py-4">Email</th>
            <th class="font-weight-bold text-medium-emphasis py-4">Status</th>
            <th class="font-weight-bold text-medium-emphasis py-4 text-right">Last Active</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="contact in contacts" :key="contact.id" class="transition-fast-in-fast-out hover-bg group">
            <td class="py-2">
              <v-checkbox-btn v-model="selected" :value="contact.id" color="primary"></v-checkbox-btn>
            </td>
            <td class="py-2 pl-0">
              <div v-if="editingId === contact.id" class="d-flex align-center max-w-sm" style="max-width: 250px;">
                <v-text-field
                  v-model="editName"
                  density="compact"
                  variant="outlined"
                  hide-details
                  autofocus
                  @keyup.enter="saveEdit(contact)"
                  @blur="saveEdit(contact)"
                  class="mr-2"
                ></v-text-field>
              </div>
              <div v-else class="font-weight-medium d-flex align-center cursor-pointer" @dblclick="startEdit(contact)">
                {{ contact.name }}
                <v-icon icon="pencil" size="x-small" class="ml-2 opacity-0 group-hover-opacity-50 transition-fast" @click.stop="startEdit(contact)"></v-icon>
              </div>
            </td>
            <td class="text-medium-emphasis py-2">{{ contact.email }}</td>
            <td class="py-2">
              <v-chip 
                :color="contact.status === 'Subscribed' ? 'success' : contact.status === 'Bounced' ? 'error' : 'medium-emphasis'"
                size="small"
                variant="tonal"
                class="font-weight-bold text-uppercase text-caption"
              >{{ contact.status }}</v-chip>
            </td>
            <td class="text-right text-medium-emphasis py-2">{{ contact.lastActive }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <MpFloatingBulkBar
      :count="selected.length"
      :total="contacts.length"
      @clear="selected = []"
      @select-all="toggleSelectAll(true)"
    >
      <v-btn variant="text" size="small" prepend-icon="tag" class="text-none">Add Tags</v-btn>
      <v-btn variant="text" size="small" prepend-icon="ban" color="error" class="text-none">Unsubscribe</v-btn>
    </MpFloatingBulkBar>
  </div>
</template>

<style scoped>
.hover-bg:hover {
  background-color: rgba(var(--v-theme-primary), 0.03);
}

.group:hover .group-hover-opacity-50 {
  opacity: 0.5 !important;
}

.transition-fast {
  transition: opacity 0.2s ease;
}
</style>
