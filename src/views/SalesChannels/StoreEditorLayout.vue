<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import StoreEditorSidebar from '@/components/saleschannels/StoreEditorSidebar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

// Store editor shell (UAT parity A06b): keeps the global sidebar and adds a
// per-store section rail — the redesigned answer to legacy's full sidebar swap.
// Offline/POS channels render without the rail (its sections are web-store concepts).
const route = useRoute()
const router = useRouter()
const salesChannelsStore = useSalesChannelsStore()

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

const channelId = computed(() => {
  const value = route.params.channelId
  return (Array.isArray(value) ? value[0] : value) ?? ''
})

const channel = computed(() => salesChannelsStore.getChannel(accountId.value, channelId.value))
const showRail = computed(() => channel.value?.type === 'web_store')
</script>

<template>
  <div v-if="!channel" class="h-100 d-flex align-center justify-center">
    <v-card variant="flat" border rounded="lg" class="pa-6" max-width="420">
      <MpEmptyState
        icon="store"
        title="Sales channel not found"
        description="The store you're trying to manage doesn't exist or was removed."
        action-label="Back to sales channels"
        @action="router.push({ name: 'SalesChannels', params: { accountId } })"
      />
    </v-card>
  </div>

  <div v-else-if="showRail" class="store-shell d-flex">
    <StoreEditorSidebar :channel="channel" />
    <main class="store-shell__content">
      <router-view />
    </main>
  </div>

  <router-view v-else />
</template>

<style scoped lang="scss">
.store-shell {
  margin: -32px -36px;
  height: calc(100vh - 52px - var(--mp-frame-offset, 0px));
  overflow: hidden;
  align-items: stretch;
}

.store-shell__content {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 36px 32px 32px;
}

@media (max-width: 1024px) {
  .store-shell {
    margin: -28px;
  }
  .store-shell__content {
    padding: 20px 28px 28px 28px;
  }
}

@media (max-width: 900px) {
  .store-shell {
    flex-direction: column;
    height: auto;
    min-height: calc(100vh - 52px - var(--mp-frame-offset, 0px));
    overflow: visible;
  }

  .store-shell__content {
    overflow: visible;
  }
}

@media (max-width: 640px) {
  .store-shell {
    margin: -22px;
  }
  .store-shell__content {
    padding: 16px 22px 22px 22px;
  }
}
</style>
