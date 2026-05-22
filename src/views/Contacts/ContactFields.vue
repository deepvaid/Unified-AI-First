<script setup lang="ts">
import { ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const search = ref('')

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
        <template v-slot:item.required="{ item }">
          <v-icon :color="item.required ? 'success' : 'medium-emphasis'">
            {{ item.required ? 'check' : 'minus' }}
          </v-icon>
        </template>
        <template v-slot:item.actions>
          <v-menu location="bottom end">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="more-horizontal" variant="text" size="small" density="comfortable" color="medium-emphasis" />
            </template>
            <v-list density="compact" rounded="lg" min-width="160" elevation="3" class="py-1">
              <v-list-item prepend-icon="pencil" title="Edit" />
              <v-divider class="my-1" style="opacity: 0.4" />
              <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" />
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
