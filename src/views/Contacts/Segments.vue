<script setup lang="ts">
import { ref } from 'vue'
import { useContactsStore } from '@/stores/useContacts'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

const store = useContactsStore()
const search = ref('')

const headers = [
  { title: 'Segment Name', key: 'name', sortable: true },
  { title: 'Total Contacts', key: 'count', align: 'end' as const },
  { title: 'Last Calculated', key: 'lastCalculated' },
  { title: '', key: 'actions', sortable: false, width: 48 },
]
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Segments"
      :subtitle="`${store.segments.length} segments`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">Create Segment</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="All Segments"
      />

      <v-data-table
        :headers="headers"
        :items="store.segments"
        :search="search"
        :items-per-page="15"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.actions>
          <v-menu location="bottom end">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="more-horizontal" variant="text" size="small" density="comfortable" color="medium-emphasis" />
            </template>
            <v-list density="compact" rounded="lg" min-width="160" elevation="3" class="py-1">
              <v-list-item prepend-icon="refresh-cw" title="Recalculate" />
              <v-list-item prepend-icon="pencil" title="Edit" />
              <v-divider class="my-1" style="opacity: 0.4" />
              <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" />
            </v-list>
          </v-menu>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="filter"
            title="No segments yet"
            description="Build dynamic segments to group contacts by behaviour, attributes, or lifecycle stage."
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
