<script setup lang="ts">
import { ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const search = ref('')

const headers = [
  { title: 'Group Name', key: 'name', sortable: true },
  { title: 'Variants', key: 'variants', align: 'end' as const },
  { title: 'Impressions', key: 'impressions', align: 'end' as const },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

const groups = ref([
  { name: 'Dynamic Weather Header', variants: 3, impressions: 45000 },
  { name: 'Live Inventory Banner', variants: 2, impressions: 125000 },
])
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Optimize on Open"
      :subtitle="`${groups.length} image groups`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">Create Image Group</v-btn>
      </template>
    </MpPageHeader>

    <v-alert type="info" variant="tonal" rounded="xl">
      Deliver dynamic images that change based on when, where, and how your subscribers open your emails.
    </v-alert>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Image Groups"
        search-placeholder="Search groups..."
        :total-count="groups.length"
      />

      <v-data-table :headers="headers" :items="groups" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.impressions="{ item }">
          <span class="font-weight-medium">{{ item.impressions.toLocaleString() }}</span>
        </template>
        <template v-slot:item.actions>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="more-horizontal" variant="text" size="small" />
            </template>
            <v-list density="compact" rounded="xl" nav min-width="160" elevation="8">
              <v-list-item prepend-icon="pencil">Edit</v-list-item>
              <v-list-item prepend-icon="trash-2" class="text-error">Delete</v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
