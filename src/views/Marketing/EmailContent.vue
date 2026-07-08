<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useContentStore } from '@/stores/useContent'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

const route = useRoute()
const content = useContentStore()
const items = computed(() => content.items)
const accountId = computed(() => route.params.accountId as string)
// "Create Content" opens the drag-&-drop editor on the blank-canvas starter template.
const blankId = computed(
  () => content.items.find(i => i.name.includes('Blank'))?.id ?? content.items[0]?.id,
)
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Email Content"
      :subtitle="`${items.length} templates`"
    >
      <template #actions>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="plus"
          class="text-none"
          :to="{ name: 'EmailContentEditor', params: { accountId, id: blankId } }"
        >
          Create Content
        </v-btn>
      </template>
    </MpPageHeader>

    <v-row v-if="items.length">
      <v-col cols="12" md="4" v-for="item in items" :key="item.name">
        <v-card variant="flat" border rounded="lg" class="h-100 d-flex flex-column">
          <div class="bg-surface-variant d-flex justify-center align-center rounded-t-xl content-thumb">
            <v-icon size="48" color="medium-emphasis">mail</v-icon>
          </div>
          <v-card-text class="pa-4 flex-grow-1">
            <div class="text-subtitle-1 font-weight-bold mb-1">{{ item.name }}</div>
            <div class="text-body-2 text-medium-emphasis mb-1">{{ item.type }}</div>
            <div class="text-caption text-medium-emphasis">Last updated: {{ item.lastUpdated }}</div>
          </v-card-text>
          <v-card-actions class="px-4 pb-4 pt-0">
            <v-btn
              variant="flat"
              size="small"
              class="text-none"
              color="surface"
              :to="{ name: 'EmailContentEditor', params: { accountId, id: item.id } }"
            >
              Edit
            </v-btn>
            <v-btn variant="text" size="small" class="text-none" @click="content.cloneContent(item.id)">Clone</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-card v-else variant="flat" border rounded="lg">
      <MpEmptyState
        icon="mail"
        title="No email content yet"
        description="Create a reusable email template to use across campaigns and journeys."
        action-label="Create Content"
        action-icon="plus"
      />
    </v-card>
  </div>
</template>

<style scoped>
.content-thumb {
  height: 150px;
}
</style>
