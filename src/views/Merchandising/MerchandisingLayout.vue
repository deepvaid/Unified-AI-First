<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useCommerceStore } from '@/stores/useCommerce'
import { catalogFor } from '@/storefront/catalog'
import MpBanner from '@/components/MpBanner.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import { useMerchandisingStore } from '@/stores/useMerchandising'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { channelDomain, merchandisingHealth, merchandisingStatus, MERCHANDISING_STATUS_LABELS, providerLabel } from '@/utils/merchandisingChannels'
import MerchandisingSidebar from './MerchandisingSidebar.vue'

const route = useRoute()
const router = useRouter()
const salesChannels = useSalesChannelsStore()
const merchandising = useMerchandisingStore()
const accountId = computed(() => String(route.params.accountId ?? '2000290'))
const channelId = computed(() => String(route.params.channelId ?? ''))
watch(channelId, (id) => merchandising.setActiveChannel(id), { immediate: true })
const channel = computed(() => salesChannels.getChannel(accountId.value, channelId.value))
const status = computed(() => channel.value ? merchandisingStatus(channel.value) : 'unsupported')
const health = computed(() => channel.value ? merchandisingHealth(channel.value) : 'error')
const needsSetup = computed(() => status.value === 'setup_required')
const hasHealthIssue = computed(() => health.value === 'warning' || health.value === 'error')
const syncBannerDismissed = ref(false)
// Wizard routes (route meta `wizardFlush`) bring their own MpWizardShell bands,
// so the content pane hands them its full box: no padding, no scroll of its own.
const flushChild = computed(() => !!route.meta.wizardFlush && !needsSetup.value)

function backToSelector() {
  router.push({ name: 'MerchandisingHome', params: { accountId: accountId.value } })
}

function reviewSync() {
  router.push({ name: 'MerchandisingChannelSetup', params: { accountId: accountId.value, channelId: channelId.value } })
}

// Connecting syncs the store's products, then opens the workspace. The count
// is the store's own published products, the ones its search will find.
const toast = useToast()
const productCount = computed(() => catalogFor(useCommerceStore().products, channelId.value).length)
const synced = ref<number | null>(null)
let syncTimer = 0

function connectChannel() {
  if (synced.value !== null) return
  synced.value = 0
  syncTimer = window.setInterval(() => {
    if (synced.value! < productCount.value) {
      synced.value = Math.min(productCount.value, synced.value! + Math.max(1, Math.ceil(productCount.value / 8)))
      return
    }
    window.clearInterval(syncTimer)
    const name = channel.value!.name
    salesChannels.connectMerchandising(accountId.value, channelId.value)
    synced.value = null
    toast.success(`${productCount.value} ${productCount.value === 1 ? 'product is' : 'products are'} synced. Search and recommendations are on for ${name}.`, { title: 'Merchandising connected' })
  }, 160)
}
onBeforeUnmount(() => window.clearInterval(syncTimer))
</script>

<template>
  <div v-if="!channel" class="mp-frame-fill merch-shell d-flex align-center justify-center">
    <v-card flat border rounded="lg" max-width="500">
      <MpEmptyState
        icon="store"
        title="Merchandising channel not found"
        description="This channel may have been removed, is offline, or belongs to another account."
        action-label="All sales channels"
        action-icon="arrow-left"
        @action="backToSelector"
      />
    </v-card>
  </div>

  <div v-else class="mp-frame-fill merch-shell d-flex">
    <MerchandisingSidebar :account-id="accountId" :channel="channel" />
    <!-- A div, not <main>: v-main is already the page's main landmark (WCAG W-18). -->
    <div class="merch-shell__content" :class="{ 'merch-shell__content--flush': flushChild }">
      <MpBanner
        v-if="hasHealthIssue && !needsSetup && !syncBannerDismissed"
        tone="warning"
        class="mb-5"
        dismissible
        @dismiss="syncBannerDismissed = true"
      >
        <strong>Merchandising sync needs attention.</strong>&nbsp;{{ channel.name }} is available, but its catalog sync is not healthy. Review connection and sync settings before publishing changes.
        <template #actions>
          <v-btn variant="outlined" color="warning" size="small" class="text-none" @click="reviewSync">Review sync</v-btn>
        </template>
      </MpBanner>

      <div v-if="needsSetup" class="merch-shell__setup d-flex align-center justify-center">
        <v-card flat border rounded="lg" class="merch-shell__setup-card" max-width="620">
          <div class="d-flex align-start ga-4">
            <v-avatar color="warning" variant="tonal" rounded="lg" size="48"><v-icon>plug</v-icon></v-avatar>
            <div>
              <div class="mp-meta-label text-warning">{{ providerLabel(channel) }}</div>
              <h1 class="mp-page-title mb-2">Connect Merchandising to {{ channel.name }}</h1>
              <p class="text-body-2 text-medium-emphasis mb-4">Connecting syncs this store's {{ productCount }} published {{ productCount === 1 ? 'product' : 'products' }} and turns on search and recommendations for its shoppers. Your Commerce data stays as it is.</p>
              <div class="d-flex flex-wrap ga-2 mb-6">
                <v-chip size="small" variant="tonal">{{ channelDomain(channel) }}</v-chip>
                <MpStatusChip :status="MERCHANDISING_STATUS_LABELS[status]" type="general" size="md" show-icon />
              </div>
              <div v-if="synced !== null" class="mb-4" role="status">
                <v-progress-linear :model-value="productCount ? (synced / productCount) * 100 : 100" color="primary" rounded height="6" aria-label="Product sync" />
                <div class="text-caption text-medium-emphasis mt-2">Syncing products: {{ synced }} of {{ productCount }}</div>
              </div>
              <div class="d-flex flex-wrap ga-3">
                <v-btn color="primary" variant="flat" class="text-none" prepend-icon="plug" :loading="synced !== null" @click="connectChannel">Connect Merchandising</v-btn>
                <v-btn variant="text" class="text-none" :disabled="synced !== null" @click="backToSelector">Choose another channel</v-btn>
              </div>
            </div>
          </div>
        </v-card>
      </div>

      <router-view v-else />
    </div>
  </div>
</template>

<style scoped lang="scss">
/* .mp-frame-fill owns the bleed-to-edge margins and the frame height; the
   content pane restates the shell's inset as its own padding. */
.merch-shell {
  align-items: stretch;
}

.merch-shell__content {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: var(--mp-space-24) var(--mp-layout-shellInsetInline) var(--mp-layout-shellInsetBlock);
}

/* Wizard child (MpWizardShell standalone) owns its bands and scroll. */
.merch-shell__content--flush {
  padding: 0;
  overflow: hidden;
}

.merch-shell__setup {
  min-height: 60vh;
}

.merch-shell__setup-card {
  padding: var(--mp-component-card-paddingSpacious);
}

/* Below the split breakpoint the rail stacks above the content and the page
   scrolls as one — the frame's fixed height and clipping are released. */
@media (max-width: ($mp-layout-breakpointSplit - 0.02px)) {
  .merch-shell { flex-direction: column; height: auto; overflow: visible; }
  .merch-shell__content { overflow: visible; padding: var(--mp-space-20) var(--mp-layout-shellInsetMedium) var(--mp-layout-shellInsetMedium); }
}

@media (max-width: ($mp-layout-breakpointCompact - 0.02px)) {
  .merch-shell__content { padding: var(--mp-space-16) var(--mp-layout-shellInsetCompact) var(--mp-layout-shellInsetCompact); }
}
</style>
