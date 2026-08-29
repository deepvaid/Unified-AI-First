<script setup lang="ts">
import { ref, computed } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'

const search = ref('')

const images = ref(
  Array.from({ length: 12 }, (_, i) => ({
    id: i,
    name: `banner_v${i + 1}.jpg`,
    size: `${Math.floor(Math.random() * 500 + 50)} KB`,
    date: '2026-03-07',
  })),
)

const filteredImages = computed(() =>
  images.value.filter(img => !search.value || img.name.toLowerCase().includes(search.value.toLowerCase())),
)

const selected = ref<number[]>([])
function toggleSelect(id: number) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter(x => x !== id)
    : [...selected.value, id]
}
function bulkDelete() {
  images.value = images.value.filter(img => !selected.value.includes(img.id))
  selected.value = []
}
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
        <v-row v-if="filteredImages.length">
          <v-col cols="12" sm="6" md="3" v-for="img in filteredImages" :key="img.id">
            <v-card
              variant="flat"
              border
              rounded="lg"
              class="overflow-hidden image-card"
              :class="{ 'image-card--selected': selected.includes(img.id) }"
              @click="toggleSelect(img.id)"
            >
              <div class="image-card__check">
                <v-checkbox-btn
                  :model-value="selected.includes(img.id)"
                  :aria-label="`Select ${img.name}`"
                  @click.stop="toggleSelect(img.id)"
                />
              </div>
              <v-img
                :src="`https://picsum.photos/seed/${img.id}/300/200`"
                :alt="img.name"
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
        <MpEmptyState
          v-else
          icon="image"
          :title="search ? 'No images match your search' : 'No images yet'"
          :description="search ? 'Try a different search term.' : 'Upload images to build your library.'"
          class="py-10"
        />
      </div>
    </v-card>

    <MpFloatingBulkBar
      :count="selected.length"
      :total="filteredImages.length"
      @clear="selected = []"
      @select-all="selected = filteredImages.map(img => img.id)"
    >
      <v-btn size="small" variant="text" class="text-none text-error" prepend-icon="trash-2" @click="bulkDelete">Delete</v-btn>
    </MpFloatingBulkBar>
  </div>
</template>

<style scoped>
.image-card {
  cursor: pointer;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.image-card__check {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
  border-radius: 6px;
  background: rgb(var(--v-theme-surface));
  opacity: 0;
  transition: opacity 120ms ease;
}

.image-card:hover .image-card__check,
.image-card--selected .image-card__check {
  opacity: 1;
}

.image-card--selected {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 1px rgb(var(--v-theme-primary));
}
</style>
