<script setup lang="ts">
import { ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const search = ref('')

const images = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  name: `banner_v${i+1}.jpg`,
  size: `${Math.floor(Math.random() * 500 + 50)} KB`,
  date: '2026-03-07'
}))

const filteredImages = () =>
  images.filter(img => !search.value || img.name.toLowerCase().includes(search.value.toLowerCase()))
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Image Library"
      :subtitle="`${images.length} images`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">Upload Images</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Images"
        search-placeholder="Search images..."
        :total-count="images.length"
      />

      <div class="pa-4">
        <v-row>
          <v-col cols="12" sm="6" md="3" v-for="img in filteredImages()" :key="img.id">
            <v-card variant="flat" border rounded="lg" class="overflow-hidden">
              <v-img
                src="https://picsum.photos/300/200?random"
                cover
                height="150"
                class="bg-grey-lighten-2"
              />
              <v-card-text class="pa-3">
                <div class="text-body-2 font-weight-medium text-truncate">{{ img.name }}</div>
                <div class="text-caption text-medium-emphasis">{{ img.size }} · {{ img.date }}</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </v-card>
  </div>
</template>
