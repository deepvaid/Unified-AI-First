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
    <v-card variant="flat" border rounded="lg" class="mp-card-inset" max-width="420">
      <MpEmptyState
        icon="store"
        title="Sales channel not found"
        description="The store you're trying to manage doesn't exist or was removed."
        action-label="Back to sales channels"
        @action="router.push({ name: 'SalesChannels', params: { accountId } })"
      />
    </v-card>
  </div>

  <div v-else-if="showRail" class="store-shell mp-frame-fill d-flex">
    <StoreEditorSidebar :channel="channel" />
    <!-- A div, not <main>: v-main is already the page's main landmark. -->
    <div class="store-shell__content">
      <router-view />
    </div>
  </div>

  <router-view v-else />
</template>

<style scoped lang="scss">
/* Mirrors SettingsLayout and MaropayLayout: .mp-frame-fill owns the bleed-to-edge
   margins and the frame height; the content pane restates the shell's inset as
   its padding. */
.store-shell {
  align-items: stretch;
}

.store-shell__content {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: var(--mp-space-24) var(--mp-layout-shellInsetInline) var(--mp-layout-shellInsetBlock) var(--mp-layout-shellInsetBlock);
}

@media (max-width: 1024px) {
  .store-shell__content {
    padding: var(--mp-space-20) var(--mp-layout-shellInsetMedium) var(--mp-layout-shellInsetMedium) var(--mp-layout-shellInsetMedium);
  }
}

@media (max-width: 900px) {
  .store-shell {
    flex-direction: column;
    height: auto;
    min-height: var(--mp-frame-height);
    overflow: visible;
  }

  .store-shell__content {
    overflow: visible;
  }
}

@media (max-width: 640px) {
  .store-shell__content {
    padding: var(--mp-space-16) var(--mp-layout-shellInsetCompact) var(--mp-layout-shellInsetCompact) var(--mp-layout-shellInsetCompact);
  }
}
</style>
