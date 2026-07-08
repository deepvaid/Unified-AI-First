<script setup lang="ts">
import { ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'

const search = ref('')

const typeIcon: Record<string, string> = {
  String: 'type',
  Integer: 'hash',
  Decimal: 'hash',
  Date: 'calendar',
  Boolean: 'toggle-left',
}

const headers = [
  { title: 'Field Name', key: 'name', sortable: true },
  { title: 'Data Type', key: 'type' },
  { title: 'Default Value', key: 'default' },
  { title: 'Required', key: 'required' },
  { title: '', key: 'actions', sortable: false, width: 48 },
]

const fields = [
  { name: 'First Name', type: 'String', default: '', required: true },
  { name: 'Last Name', type: 'String', default: '', required: false },
  { name: 'Company', type: 'String', default: '', required: false },
  { name: 'Age', type: 'Integer', default: '0', required: false },
  { name: 'Opt-in Date', type: 'Date', default: 'CURRENT_DATE', required: true },
]
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Custom Fields"
      :subtitle="`${fields.length} fields defined`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">Add Field</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="All Fields"
      />

      <v-data-table
        :headers="headers"
        :items="fields"
        :search="search"
        :items-per-page="15"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.type="{ item }">
          <div class="d-flex align-center gap-2">
            <v-icon size="16" color="medium-emphasis">{{ typeIcon[item.type] ?? 'circle-dot' }}</v-icon>
            <span class="text-body-2">{{ item.type }}</span>
          </div>
        </template>

        <template v-slot:item.default="{ item }">
          <span v-if="item.default" class="text-body-2">{{ item.default }}</span>
          <span v-else class="text-disabled">—</span>
        </template>

        <template v-slot:item.required="{ item }">
          <MpStatusChip :status="item.required ? 'Required' : 'Optional'" type="general" size="small" />
        </template>

        <template v-slot:item.actions>
          <v-menu location="bottom end">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="more-horizontal" variant="text" size="small" density="comfortable" color="medium-emphasis" aria-label="Field actions" />
            </template>
            <v-list density="compact" rounded="lg" min-width="160" elevation="3" class="py-1">
              <v-list-item prepend-icon="pencil" title="Edit" />
              <v-divider class="my-1" style="opacity: 0.4" />
              <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" />
            </v-list>
          </v-menu>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="list"
            :title="search ? 'No fields match your search' : 'No custom fields yet'"
            :description="search ? 'Try a different search term.' : 'Add a custom field to capture more contact data.'"
            action-label="Add Field"
            action-icon="plus"
            class="py-10"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
