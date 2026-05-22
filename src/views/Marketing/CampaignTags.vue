<script setup lang="ts">
import { ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const search = ref('')

const headers = [
  { title: 'Tag Name', key: 'name', sortable: true },
  { title: 'Assigned Campaigns', key: 'count', align: 'end' as const },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

const tags = ref([
  { name: 'Newsletter', count: 42 },
  { name: 'Promo_2026', count: 18 },
  { name: 'Onboarding', count: 5 },
  { name: 'Retention', count: 12 },
])
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Campaign Tags"
      :subtitle="`${tags.length} tags`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">Create Tag</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Tags"
        search-placeholder="Search tags..."
        :total-count="tags.length"
      />

      <v-data-table :headers="headers" :items="tags" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
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
