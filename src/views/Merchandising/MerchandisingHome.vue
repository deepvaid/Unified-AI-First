<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import { useMerchandisingStore } from '@/stores/useMerchandising'

const route = useRoute()
const router = useRouter()
const store = useMerchandisingStore()
const accountId = computed(() => route.params.accountId as string)

function openStore(storeId: string) {
  store.setActiveStore(storeId)
  router.push(`/commerce/${accountId.value}/merchandising/analytics`)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Merchandising Cloud"
      subtitle="AI-powered search, recommendations, and merchandising — select a store to start."
    />

    <div class="merch-home__grid">
      <v-card
        v-for="merchStore in store.merchStores"
        :key="merchStore.id"
        flat
        border
        rounded="lg"
        class="merch-home__card"
        :class="{ 'merch-home__card--active': merchStore.id === store.activeStoreId }"
      >
        <div class="merch-home__card-body">
          <div class="d-flex align-start justify-space-between gap-3 mb-4">
            <div class="d-flex align-center gap-3">
              <div class="merch-home__icon">
                <v-icon size="20">store</v-icon>
              </div>
              <div class="min-width-0">
                <div class="text-subtitle-1 font-weight-bold text-truncate">{{ merchStore.domain }}</div>
                <div class="text-caption text-medium-emphasis">{{ merchStore.platform }} · Last activity {{ merchStore.lastActivity }}</div>
              </div>
            </div>
            <MpStatusChip
              :status="merchStore.connected === 'active' ? 'Connected' : 'Disconnected'"
              :type="'general' as const"
              size="x-small"
            />
          </div>

          <div class="merch-home__stats">
            <div class="merch-home__stat">
              <div class="text-caption text-medium-emphasis">Products</div>
              <div class="text-h6 font-weight-bold">{{ merchStore.productCount.toLocaleString() }}</div>
            </div>
            <div class="merch-home__stat">
              <div class="text-caption text-medium-emphasis">Engines</div>
              <div class="text-h6 font-weight-bold">{{ merchStore.engineCount }}</div>
            </div>
          </div>

          <div class="d-flex justify-end mt-5">
            <v-btn
              color="primary"
              variant="flat"
              class="text-none"
              append-icon="arrow-right"
              @click="openStore(merchStore.id)"
            >
              Open store
            </v-btn>
          </div>
        </div>
      </v-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
.merch-home__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
  max-width: 920px;
}

.merch-home__card {
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.merch-home__card:hover {
  border-color: rgba(var(--v-theme-primary), 0.32);
}

.merch-home__card--active {
  border-color: rgba(var(--v-theme-primary), 0.45);
  box-shadow: 0 0 0 1px rgba(var(--v-theme-primary), 0.18);
}

.merch-home__card-body {
  padding: 20px 22px;
}

.merch-home__icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.08);
  color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
}

.merch-home__stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.merch-home__stat .text-caption {
  margin-bottom: 4px;
}
</style>
