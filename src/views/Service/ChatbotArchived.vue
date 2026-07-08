<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useChatbotStore } from '@/stores/useChatbot'
import { storeToRefs } from 'pinia'
import type { Chatbot } from '@/stores/useChatbot'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

const route = useRoute()
const accountId = computed(() => route.params.accountId as string)

const cb = useChatbotStore()
const { chatbots } = storeToRefs(cb)
const search = ref('')

const rows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return chatbots.value.filter(c =>
    c.status === 'Archived' &&
    (!q || c.store.toLowerCase().includes(q) || c.storeUrl.toLowerCase().includes(q)),
  )
})
const archivedCount = computed(() => chatbots.value.filter(c => c.status === 'Archived').length)

const headers = [
  { title: 'Store', key: 'store' },
  { title: 'Store URL', key: 'storeUrl' },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Conversations', key: 'conversations', align: 'end' as const },
  { title: 'Archived on', key: 'archivedOn' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

function restore(c: Chatbot) { cb.restore(c.id) }
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Archived Chatbots"
      :subtitle="`${archivedCount} chatbot${archivedCount === 1 ? '' : 's'}`"
      :back-to="{ name: 'ChatbotList', params: { accountId } }"
    />

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Archived"
        search-placeholder="Search archived chatbots..."
        :total-count="rows.length"
      />

      <v-data-table
        v-if="archivedCount"
        :headers="headers"
        :items="rows"
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="10"
        fixed-header
        class="flex-grow-1"
      >
        <template #item.store="{ item }">
          <span class="font-weight-medium">{{ item.store }}</span>
        </template>
        <template #item.storeUrl="{ item }">
          <span class="text-medium-emphasis">{{ item.storeUrl }}</span>
        </template>
        <template #item.status>
          <v-chip size="x-small" variant="tonal" color="default">Archived</v-chip>
        </template>
        <template #item.conversations="{ item }">
          <span class="num">{{ item.conversations.toLocaleString() }}</span>
        </template>
        <template #item.archivedOn="{ item }">
          <span>{{ item.archivedOn ?? '—' }}</span>
        </template>
        <template #item.actions="{ item }">
          <v-btn variant="tonal" color="primary" size="small" class="text-none" prepend-icon="rotate-ccw" @click="restore(item)">Restore</v-btn>
        </template>
      </v-data-table>

      <MpEmptyState
        v-else
        icon="archive"
        title="No archived chatbots"
        description="Chatbots you archive from the list will appear here, ready to restore."
      />
    </v-card>
  </div>
</template>

<style scoped>
.num { font-variant-numeric: tabular-nums; }
</style>
