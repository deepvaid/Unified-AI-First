<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { providerLabel } from '@/utils/merchandisingChannels'

const route = useRoute()
const salesChannels = useSalesChannelsStore()
const accountId = computed(() => String(route.params.accountId ?? '2000290'))
const channelId = computed(() => String(route.params.channelId ?? ''))
const channel = computed(() => salesChannels.getChannel(accountId.value, channelId.value))

const labels: Record<string, string> = {
  'search-pinning': 'Search pinning',
  'search-rules': 'Search rules',
  'search-promo-cards': 'Search promo cards',
  'search-banners': 'Search banners',
  'search-blacklisting': 'Search blacklisting',
  'search-content': 'Search content',
  'collection-promo-cards': 'Collection promo cards',
  'collection-banners': 'Collection banners',
  analytics: 'Merchandising analytics',
}

const capability = computed(() => String(route.params.capability ?? ''))
const title = computed<string>(() => labels[capability.value] || (route.meta.capability === 'analytics' ? 'Merchandising analytics' : 'Merchandising capability'))
</script>

<template>
  <div class="d-flex flex-column gap-5">
    <MpPageHeader
      :title="title"
      :subtitle="channel ? `${providerLabel(channel)} · ${channel.name}` : 'Channel context unavailable'"
    />
    <v-card flat border rounded="lg" class="pa-8">
      <MpEmptyState
        icon="sparkles"
        :title="`${title} is next in the parity build`"
        description="The channel-scoped workspace and navigation are ready. This capability will be implemented with its own list, editor, preview, and sync states in the next merchandising slice."
      />
    </v-card>
  </div>
</template>
