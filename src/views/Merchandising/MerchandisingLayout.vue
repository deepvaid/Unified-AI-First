<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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

function connectChannel() {
  router.push({ name: 'MerchandisingChannelSetup', params: { accountId: accountId.value, channelId: channelId.value } })
}
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
    <main class="merch-shell__content" :class="{ 'merch-shell__content--flush': flushChild }">
      <MpBanner
        v-if="hasHealthIssue && !needsSetup && !syncBannerDismissed"
        tone="warning"
        class="mb-5"
        dismissible
        @dismiss="syncBannerDismissed = true"
      >
        <strong>Merchandising sync needs attention.</strong>&nbsp;{{ channel.name }} is available, but its catalog sync is not healthy. Review connection and sync settings before publishing changes.
        <template #actions>
          <v-btn variant="outlined" color="warning" size="small" class="text-none" @click="connectChannel">Review sync</v-btn>
        </template>
      </MpBanner>

      <div v-if="needsSetup" class="merch-shell__setup d-flex align-center justify-center">
        <v-card flat border rounded="lg" class="merch-shell__setup-card" max-width="620">
          <div class="d-flex align-start ga-4">
            <v-avatar color="warning" variant="tonal" rounded="lg" size="48"><v-icon>plug</v-icon></v-avatar>
            <div>
              <div class="mp-meta-label text-warning">{{ providerLabel(channel) }}</div>
              <h1 class="mp-page-title mb-2">Connect Merchandising to {{ channel.name }}</h1>
              <p class="text-body-2 text-medium-emphasis mb-4">Connect this online channel before managing search, smart collections, or recommendations. Existing Commerce data stays unchanged until the sync is ready.</p>
              <div class="d-flex flex-wrap ga-2 mb-6">
                <v-chip size="small" variant="tonal">{{ channelDomain(channel) }}</v-chip>
                <MpStatusChip :status="MERCHANDISING_STATUS_LABELS[status]" type="general" size="md" show-icon />
              </div>
              <div class="d-flex flex-wrap ga-3">
                <v-btn color="primary" variant="flat" class="text-none" prepend-icon="plug" @click="connectChannel">Open connection setup</v-btn>
                <v-btn variant="text" class="text-none" @click="backToSelector">Choose another channel</v-btn>
              </div>
            </div>
          </div>
        </v-card>
      </div>

      <router-view v-else />
    </main>
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
  .merch-shell__content { overflow: visible; padding: var(--mp-space-20) var(--mp-space-28) var(--mp-space-28); }
}

@media (max-width: ($mp-layout-breakpointCompact - 0.02px)) {
  .merch-shell__content { padding: var(--mp-space-16) var(--mp-space-20) var(--mp-space-20); }
}
</style>
