<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import {
  channelDomain,
  merchandisingChannels,
  merchandisingHealth,
  merchandisingRoute,
  merchandisingStatus,
  MERCHANDISING_HEALTH_LABELS,
  MERCHANDISING_STATUS_LABELS,
  providerLabel,
} from '@/utils/merchandisingChannels'

const route = useRoute()
const router = useRouter()
const salesChannels = useSalesChannelsStore()
const accountId = computed(() => String(route.params.accountId ?? '2000290'))
const channels = computed(() => merchandisingChannels(salesChannels.channels, accountId.value))

function statusType(_status: string): 'general' {
  return 'general'
}

function openChannel(channelId: string) {
  router.push(merchandisingRoute(accountId.value, channelId))
}
</script>

<template>
  <div class="merch-selector h-100 d-flex flex-column gap-6">
    <MpPageHeader
      title="Merchandising"
      subtitle="Choose an online sales channel to manage search, collections, and recommendations."
    >
      <template #actions>
        <v-btn
          variant="outlined"
          color="primary"
          class="text-none"
          prepend-icon="store"
          :to="{ name: 'SalesChannels', params: { accountId } }"
        >
          Manage sales channels
        </v-btn>
      </template>
    </MpPageHeader>

    <v-alert type="info" variant="tonal" border="start" icon="globe" title="Online channels only">
      Merchandise is scoped to a storefront or commerce integration. POS and offline channels stay in Retail.
    </v-alert>

    <section aria-labelledby="channel-list-title">
      <div class="d-flex align-center justify-space-between mb-3">
        <div>
          <h2 id="channel-list-title" class="text-h6 font-weight-bold">Select a sales channel</h2>
          <p class="text-body-2 text-medium-emphasis mb-0">{{ channels.length }} online channels available</p>
        </div>
      </div>

      <div v-if="channels.length" class="channel-grid">
        <v-card
          v-for="channel in channels"
          :key="channel.id"
          flat
          border
          rounded="lg"
          class="channel-card"
          :class="{ 'channel-card--attention': merchandisingHealth(channel) !== 'healthy' }"
          role="button"
          tabindex="0"
          @click="openChannel(channel.id)"
          @keydown.enter="openChannel(channel.id)"
          @keydown.space.prevent="openChannel(channel.id)"
        >
          <div class="channel-card__top d-flex align-start justify-space-between ga-3">
            <div class="d-flex align-center ga-3 min-width-0">
              <v-avatar color="primary" variant="tonal" rounded="lg" size="42">
                <v-icon>{{ channel.provider === 'shopify' ? 'shopping-bag' : 'globe' }}</v-icon>
              </v-avatar>
              <div class="min-width-0">
                <h3 class="text-body-1 font-weight-bold text-truncate">{{ channel.name }}</h3>
                <div class="text-caption text-medium-emphasis text-truncate">{{ providerLabel(channel) }}</div>
              </div>
            </div>
            <v-icon size="18" color="medium-emphasis">arrow-up-right</v-icon>
          </div>

          <div class="channel-card__meta mt-5">
            <div class="channel-card__meta-row">
              <span class="text-caption text-medium-emphasis">Domain</span>
              <span class="text-body-2 text-truncate">{{ channelDomain(channel) }}</span>
            </div>
            <div class="channel-card__meta-row">
              <span class="text-caption text-medium-emphasis">Merchandise</span>
              <MpStatusChip
                :status="MERCHANDISING_STATUS_LABELS[merchandisingStatus(channel)]"
                :type="statusType(merchandisingStatus(channel))"
                size="x-small"
                show-icon
              />
            </div>
            <div class="channel-card__meta-row">
              <span class="text-caption text-medium-emphasis">Sync health</span>
              <span class="d-flex align-center ga-1 text-body-2">
                <v-icon size="14" :color="merchandisingHealth(channel) === 'healthy' ? 'success' : 'warning'">circle</v-icon>
                {{ MERCHANDISING_HEALTH_LABELS[merchandisingHealth(channel)] }}
              </span>
            </div>
          </div>

          <v-divider class="my-4" />
          <div class="d-flex align-center justify-space-between">
            <span class="text-caption text-medium-emphasis">
              Last activity {{ channel.lastActivityAt.slice(0, 10) }}
            </span>
            <span class="channel-card__link text-body-2 font-weight-medium">
              {{ merchandisingStatus(channel) === 'setup_required' ? 'Set up' : 'Open overview' }}
              <v-icon size="16">arrow-right</v-icon>
            </span>
          </div>
        </v-card>
      </div>

      <v-card v-else flat border rounded="lg" class="pa-8">
        <MpEmptyState
          icon="globe"
          title="No online sales channels"
          description="Create or connect an online sales channel before opening Merchandising."
          action-label="View sales channels"
          action-icon="store"
          @action="router.push({ name: 'SalesChannels', params: { accountId } })"
        />
      </v-card>
    </section>
  </div>
</template>

<style scoped lang="scss">
.channel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  gap: 16px;
}

.channel-card {
  padding: 20px;
  cursor: pointer;
  transition: border-color 0.16s ease, transform 0.16s ease;
}

.channel-card:hover,
.channel-card:focus-visible {
  border-color: rgb(var(--v-theme-primary));
  transform: translateY(-1px);
  outline: none;
}

.channel-card--attention {
  border-left: 3px solid rgb(var(--v-theme-warning));
}

.channel-card__meta {
  display: grid;
  gap: 12px;
}

.channel-card__meta-row {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.channel-card__link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: rgb(var(--v-theme-primary));
}

@media (max-width: 640px) {
  :deep(.mp-page-header__top),
  :deep(.mp-page-header__main) {
    flex-wrap: wrap;
  }

  :deep(.mp-page-header__main > .d-flex.align-center) {
    width: 100%;
  }

  :deep(.mp-page-header__main > .d-flex.align-center .v-btn) {
    width: 100%;
  }
}
</style>
