<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { channelDomain, merchandisingHealth, merchandisingStatus, MERCHANDISING_HEALTH_LABELS, MERCHANDISING_STATUS_LABELS, providerLabel } from '@/utils/merchandisingChannels'

const route = useRoute()
const salesChannels = useSalesChannelsStore()
const notice = ref('')
const accountId = computed(() => String(route.params.accountId ?? '2000290'))
const channelId = computed(() => String(route.params.channelId ?? ''))
const channel = computed(() => salesChannels.getChannel(accountId.value, channelId.value))

function reviewConnection() {
  notice.value = 'Connection review queued for this prototype channel.'
}
</script>

<template>
  <div v-if="channel" class="d-flex flex-column gap-5">
    <MpPageHeader title="Connection & sync" :subtitle="`${providerLabel(channel)} · ${channelDomain(channel)}`" />
    <v-alert v-if="notice" type="success" variant="tonal" closable>{{ notice }}</v-alert>
    <v-card flat border rounded="lg" class="pa-6">
      <div class="d-flex align-start justify-space-between ga-4 flex-wrap">
        <div>
          <div class="text-overline text-medium-emphasis">Merchandise connection</div>
          <h2 class="text-h6 font-weight-bold mb-2">{{ channel.name }}</h2>
          <p class="text-body-2 text-medium-emphasis mb-0">{{ channelDomain(channel) }}</p>
        </div>
        <MpStatusChip :status="MERCHANDISING_STATUS_LABELS[merchandisingStatus(channel)]" type="general" size="small" show-icon />
      </div>
      <v-divider class="my-5" />
      <div class="setup-grid">
        <div class="setup-row"><span>Provider</span><strong>{{ providerLabel(channel) }}</strong></div>
        <div class="setup-row"><span>Sync health</span><strong>{{ MERCHANDISING_HEALTH_LABELS[merchandisingHealth(channel)] }}</strong></div>
        <div class="setup-row"><span>Last sync</span><strong>{{ channel.merchandising?.lastSyncAt?.slice(0, 10) ?? 'Not connected' }}</strong></div>
      </div>
      <div class="d-flex flex-wrap ga-3 mt-6">
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="refresh-cw" @click="reviewConnection">Review connection</v-btn>
        <v-btn variant="outlined" class="text-none" prepend-icon="package" @click="reviewConnection">Check product sync</v-btn>
      </div>
    </v-card>
  </div>
</template>

<style scoped lang="scss">
.setup-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.setup-row { display: grid; gap: 4px; padding: 14px; border: 1px solid var(--mp-border-subtle); border-radius: 8px; }
.setup-row span { color: rgba(var(--v-theme-on-surface), 0.64); font-size: 0.78rem; }
@media (max-width: 720px) { .setup-grid { grid-template-columns: 1fr; } }
</style>
