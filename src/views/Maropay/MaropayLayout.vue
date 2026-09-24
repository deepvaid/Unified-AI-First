<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MaropayActingRoleBanner from '@/components/maropay/MaropayActingRoleBanner.vue'
import { useMaropayStore } from '@/stores/useMaropay'
import MaropaySidebar from './MaropaySidebar.vue'

const route = useRoute()
const maropay = useMaropayStore()

const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? '2000290'
})

const assignedStoreNames = computed(() => (maropay.assignedChannelIds ?? []).map((id) => maropay.channelName(id)))
</script>

<template>
  <div class="maropay-shell mp-frame-fill d-flex">
    <MaropaySidebar :account-id="accountId" />
    <!-- A div, not <main>: v-main is already the page's main landmark. -->
    <div class="maropay-shell__content">
      <MaropayActingRoleBanner
        :role="maropay.actingRole"
        :store-names="assignedStoreNames"
        class="mb-5"
        @reset="maropay.setActingRole('owner')"
      />
      <router-view />
    </div>
  </div>
</template>

<style scoped lang="scss">
/* Mirrors SettingsLayout: .mp-frame-fill owns the bleed-to-edge margins and the
   frame height; the content pane restates the shell's inset as its padding. */
.maropay-shell {
  align-items: stretch;
}

.maropay-shell__content {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: var(--mp-space-24) var(--mp-layout-shellInsetInline) var(--mp-layout-shellInsetBlock) var(--mp-layout-shellInsetBlock);
}

@media (max-width: ($mp-layout-breakpointSplit - 0.02px)) {
  .maropay-shell {
    flex-direction: column;
    height: auto;
    overflow: visible;
  }

  .maropay-shell__content {
    overflow: visible;
    padding: var(--mp-space-20) var(--mp-layout-shellInsetMedium) var(--mp-layout-shellInsetMedium);
  }
}

@media (max-width: ($mp-layout-breakpointCompact - 0.02px)) {
  .maropay-shell__content {
    padding: var(--mp-space-16) var(--mp-layout-shellInsetCompact) var(--mp-layout-shellInsetCompact);
  }
}
</style>
