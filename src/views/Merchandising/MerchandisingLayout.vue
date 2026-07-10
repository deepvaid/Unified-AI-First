<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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

function backToSelector() {
  router.push({ name: 'MerchandisingHome', params: { accountId: accountId.value } })
}

function connectChannel() {
  router.push({ name: 'MerchandisingChannelSetup', params: { accountId: accountId.value, channelId: channelId.value } })
}
</script>

<template>
  <div v-if="!channel" class="merch-shell merch-shell--recovery d-flex align-center justify-center">
    <v-card flat border rounded="lg" class="pa-8" max-width="500">
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

  <div v-else class="merch-shell d-flex">
    <MerchandisingSidebar :account-id="accountId" :channel="channel" />
    <main class="merch-shell__content">
      <v-alert
        v-if="hasHealthIssue && !needsSetup"
        type="warning"
        variant="tonal"
        border="start"
        icon="triangle-alert"
        class="mb-5"
        closable
      >
        <div class="font-weight-bold">Merchandising sync needs attention</div>
        <div class="text-body-2">{{ channel.name }} is available, but its catalog sync is not healthy. Review connection and sync settings before publishing changes.</div>
        <template #append>
          <v-btn variant="outlined" color="warning" size="small" class="text-none" @click="connectChannel">Review sync</v-btn>
        </template>
      </v-alert>

      <div v-if="needsSetup" class="merch-shell__setup d-flex align-center justify-center">
        <v-card flat border rounded="lg" class="pa-8" max-width="620">
          <div class="d-flex align-start ga-4">
            <v-avatar color="warning" variant="tonal" rounded="lg" size="48"><v-icon>plug</v-icon></v-avatar>
            <div>
              <div class="text-overline text-warning">{{ providerLabel(channel) }}</div>
              <h1 class="text-h5 font-weight-bold mb-2">Connect Merchandising to {{ channel.name }}</h1>
              <p class="text-body-2 text-medium-emphasis mb-4">Connect this online channel before managing search, smart collections, or recommendations. Existing Commerce data stays unchanged until the sync is ready.</p>
              <div class="d-flex flex-wrap ga-2 mb-6">
                <v-chip size="small" variant="tonal">{{ channelDomain(channel) }}</v-chip>
                <MpStatusChip :status="MERCHANDISING_STATUS_LABELS[status]" type="general" size="small" show-icon />
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
.merch-shell {
  margin: -32px -36px;
  min-height: calc(100vh - 52px);
  overflow: hidden;
  align-items: stretch;
}

.merch-shell__content {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 36px 32px 32px;
}

.merch-shell__setup {
  min-height: 60vh;
}

.merch-shell--recovery {
  min-height: calc(100vh - 52px);
}

@media (max-width: 1024px) {
  .merch-shell { margin: -28px; }
  .merch-shell__content { padding: 20px 28px 28px; }
}

@media (max-width: 900px) {
  .merch-shell { flex-direction: column; height: auto; overflow: visible; }
  .merch-shell__content { overflow: visible; }
}

@media (max-width: 640px) {
  .merch-shell { margin: -22px; }
  .merch-shell__content { padding: 16px 22px 22px; }
}
</style>
