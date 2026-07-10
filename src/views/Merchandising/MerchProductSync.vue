<script setup lang="ts">
import { computed } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import { useMerchandisingStore, type SyncInfo } from '@/stores/useMerchandising'

const store = useMerchandisingStore()
const sync = computed(() => store.syncInfo)

/** Feed health → general status chip label. */
const FEED_STATUS_LABELS: Record<SyncInfo['feedStatus'], string> = {
  healthy: 'Active',
  delayed: 'Pending',
  failed: 'Error',
}

const feedStatusLabel = computed(() => FEED_STATUS_LABELS[sync.value.feedStatus])

const statusTiles = computed(() => [
  { label: 'Feed pull', icon: 'rss', status: feedStatusLabel.value },
  { label: 'Webhooks', icon: 'webhook', status: 'Active' },
  { label: 'Active sync', icon: 'refresh-cw', status: 'Active' },
  { label: 'Search engine', icon: 'search', status: 'Active' },
])
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Product sync"
      :subtitle="`Feed health and indexing status for ${store.activeStore.domain}`"
    />

    <v-row dense>
      <v-col cols="12" sm="6" md="3">
        <MpKpiCard
          label="Indexed products"
          :value="sync.catalogCount.toLocaleString('en-US')"
          icon="package"
          color="primary"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <MpKpiCard label="Feed status" value="" icon="rss" color="info">
          <MpStatusChip :status="feedStatusLabel" type="general" size="small" />
        </MpKpiCard>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <MpKpiCard label="Last full sync" :value="sync.lastFullSync" icon="database" color="secondary" />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <MpKpiCard label="Last delta sync" :value="sync.lastDeltaSync" icon="refresh-cw" color="success" />
      </v-col>
    </v-row>

    <v-card flat border rounded="lg" class="pa-5">
      <div class="text-subtitle-1 font-weight-bold mb-1">Sync pipeline</div>
      <p class="text-caption text-medium-emphasis mb-4">
        Every stage of the product feed pipeline, from pull to searchable index.
      </p>
      <div class="sync-tile-grid">
        <div v-for="tile in statusTiles" :key="tile.label" class="sync-tile">
          <v-avatar size="36" color="primary" variant="tonal" rounded="lg">
            <v-icon size="18">{{ tile.icon }}</v-icon>
          </v-avatar>
          <span class="text-body-2 font-weight-medium">{{ tile.label }}</span>
          <MpStatusChip :status="tile.status" type="general" size="x-small" />
        </div>
      </div>
      <div class="d-flex align-center ga-2 text-caption text-medium-emphasis mt-4">
        <v-icon size="14">info</v-icon>
        Syncs run automatically in this prototype — there is nothing to configure here.
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.sync-tile-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.sync-tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  border-radius: 8px;
}

@media (max-width: 900px) {
  .sync-tile-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .sync-tile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
