<script setup lang="ts">
import { ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const search = ref('')

const categories = [
  { name: 'Standard General Merchandise', rate: 'Varies by location', code: 'TAX-001' },
  { name: 'Digital Services / Saas', rate: '0% in most states', code: 'TAX-DIG-05' },
  { name: 'Apparel & Clothing', rate: 'Exempt under $110 (NY)', code: 'TAX-APP-12' },
  { name: 'Grocery / Unprepared Food', rate: 'Exempt', code: 'TAX-FOOD-00' },
]

const headers = [
  { title: 'Category Name', key: 'name', sortable: true },
  { title: 'Tax Code', key: 'code' },
  { title: 'Default Rate Map', key: 'rate' },
  { title: '', key: 'actions', sortable: false, width: 48 },
]
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Tax Categories"
      :subtitle="`${categories.length} categories`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">New Tax Category</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="All Categories"
      />

      <v-data-table
        :headers="headers"
        :items="categories"
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
