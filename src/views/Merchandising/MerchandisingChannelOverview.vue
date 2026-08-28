<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpKpiCard from '@/components/MpKpiCard.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import { useMerchandisingStore } from '@/stores/useMerchandising'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { channelDomain, merchandisingHealth, merchandisingStatus, MERCHANDISING_STATUS_LABELS, providerLabel } from '@/utils/merchandisingChannels'

const route = useRoute()
const router = useRouter()
const salesChannels = useSalesChannelsStore()
const merchandising = useMerchandisingStore()
const accountId = computed(() => String(route.params.accountId ?? '2000290'))
const channelId = computed(() => String(route.params.channelId ?? ''))
const channel = computed(() => salesChannels.getChannel(accountId.value, channelId.value))

const kpis = computed(() => [
  { label: 'Active engines', value: merchandising.engineList.filter((item) => item.status === 'active').length, icon: 'sparkles', color: 'primary' },
  { label: 'Smart collections', value: merchandising.collectionList.filter((item) => item.status === 'active').length, icon: 'layers', color: 'commerce' },
  { label: 'Active synonyms', value: merchandising.synonymList.filter((item) => item.status === 'active').length, icon: 'repeat', color: 'warning' },
  { label: 'Page redirects', value: merchandising.redirectList.length, icon: 'corner-up-right', color: 'analytics' },
])

function go(name: string) {
  router.push({ name, params: { accountId: accountId.value, channelId: channelId.value } })
}
</script>

<template>
  <div v-if="channel" class="channel-overview d-flex flex-column gap-5">
    <MpPageHeader
      :title="`${channel.name} Merchandising`"
      :subtitle="`${providerLabel(channel)} · ${channelDomain(channel)}`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="search" @click="go('MerchandisingChannelSearchPreview')">
          Preview search
        </v-btn>
      </template>
    </MpPageHeader>

    <v-alert v-if="merchandisingHealth(channel) !== 'healthy'" type="warning" variant="tonal" border="start" icon="triangle-alert">
      Search and recommendation results may be stale until this channel's catalog sync is healthy.
    </v-alert>

    <div class="d-flex align-center ga-2">
      <MpStatusChip :status="MERCHANDISING_STATUS_LABELS[merchandisingStatus(channel)]" type="general" size="md" show-icon />
      <span class="text-body-2 text-medium-emphasis">Channel-scoped workspace</span>
    </div>

    <v-row dense>
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="12" sm="6" md="3">
        <MpKpiCard :label="kpi.label" :value="kpi.value" :icon="kpi.icon" :color="kpi.color" />
      </v-col>
    </v-row>

    <section aria-labelledby="workspace-start-title">
      <h2 id="workspace-start-title" class="text-h6 font-weight-bold mb-3">Manage this channel</h2>
      <div class="workspace-grid">
        <v-card flat border rounded="lg" class="workspace-card" @click="go('MerchandisingChannelCollections')">
          <v-avatar color="commerce" variant="tonal" rounded="lg" size="40"><v-icon>layers</v-icon></v-avatar>
          <div class="mt-4 text-body-1 font-weight-bold">Smart Collections</div>
          <div class="mt-1 text-body-2 text-medium-emphasis">Build collection membership and merchandising rules for this storefront.</div>
          <v-btn variant="text" color="primary" class="text-none px-0 mt-3" append-icon="arrow-right">Open collections</v-btn>
        </v-card>
        <v-card flat border rounded="lg" class="workspace-card" @click="go('MerchandisingChannelRecommendations')">
          <v-avatar color="secondary" variant="tonal" rounded="lg" size="40"><v-icon>sparkles</v-icon></v-avatar>
          <div class="mt-4 text-body-1 font-weight-bold">Recommendations</div>
          <div class="mt-1 text-body-2 text-medium-emphasis">Control placements, strategies, fallbacks, and product filters.</div>
          <v-btn variant="text" color="primary" class="text-none px-0 mt-3" append-icon="arrow-right">Open engines</v-btn>
        </v-card>
        <v-card flat border rounded="lg" class="workspace-card" @click="go('MerchandisingChannelAnalytics')">
          <v-avatar color="analytics" variant="tonal" rounded="lg" size="40"><v-icon>bar-chart-3</v-icon></v-avatar>
          <div class="mt-4 text-body-1 font-weight-bold">Performance</div>
          <div class="mt-1 text-body-2 text-medium-emphasis">Review discovery activity and merchandising contribution for this channel.</div>
          <v-btn variant="text" color="primary" class="text-none px-0 mt-3" append-icon="arrow-right">View analytics</v-btn>
        </v-card>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.workspace-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.workspace-card {
  padding: 20px;
  cursor: pointer;
  transition: border-color 0.16s ease, transform 0.16s ease;
}

.workspace-card:hover,
.workspace-card:focus-within {
  border-color: rgb(var(--v-theme-primary));
  transform: translateY(-1px);
}

@media (max-width: 900px) {
  .workspace-grid { grid-template-columns: 1fr; }
}
</style>
