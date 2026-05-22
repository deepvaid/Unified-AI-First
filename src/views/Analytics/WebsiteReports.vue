<script setup lang="ts">
import { ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const search = ref('')

const headers = [
  { title: 'Page Path', key: 'path', sortable: true },
  { title: 'Pageviews', key: 'views', align: 'end' as const },
  { title: 'Unique Visitors', key: 'visitors', align: 'end' as const },
  { title: 'Avg. Time on Page', key: 'time' },
]

const webData = Array.from({ length: 15 }, (_, i) => ({
  path: ['/home', '/products', '/pricing', '/about', '/checkout'][i % 5] + (i > 4 ? `/${i}` : ''),
  views: Math.floor(Math.random() * 50000),
  visitors: Math.floor(Math.random() * 30000),
  time: `${Math.floor(Math.random() * 3)}m ${Math.floor(Math.random() * 60)}s`
}))
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Website Reports"
      subtitle="Page-level traffic and engagement analytics"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface">Export CSV</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Page Analytics"
        :total-count="webData.length"
      />
      <v-data-table :headers="headers" :items="webData" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.views="{ item }">
          <span class="font-weight-medium">{{ item.views.toLocaleString() }}</span>
        </template>
        <template v-slot:item.visitors="{ item }">
          <span class="font-weight-medium">{{ item.visitors.toLocaleString() }}</span>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
