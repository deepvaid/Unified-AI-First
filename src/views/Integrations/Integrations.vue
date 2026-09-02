<script setup lang="ts">
import { ref, computed } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

const search = ref('')

const apps = [
  { name: 'Shopify', category: 'Commerce', connected: true, desc: 'Sync orders, customers, and product catalogs automatically.' },
  { name: 'Salesforce', category: 'CRM', connected: true, desc: 'Bi-directional sync for leads and engagement data.' },
  { name: 'Zapier', category: 'Automation', connected: false, desc: 'Trigger complex workflows across 5000+ external apps.' },
  { name: 'Google Workspace', category: 'Productivity', connected: false, desc: 'Connect calendar and document templates.' },
  { name: 'Facebook Ads', category: 'Advertising', connected: true, desc: 'Automatically sync custom audiences and conversion events.' },
  { name: 'Twilio', category: 'SMS', connected: true, desc: 'Enterprise SMS gateway for transactional alerts.' },
]

const categoryIcons: Record<string, string> = {
  Commerce: 'shopping-cart',
  CRM: 'contact',
  Automation: 'zap',
  Productivity: 'calendar',
  Advertising: 'megaphone',
  SMS: 'message-square',
}

const filteredApps = computed(() => {
  if (!search.value) return apps
  const q = search.value.toLowerCase()
  return apps.filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.category.toLowerCase().includes(q) ||
    a.desc.toLowerCase().includes(q)
  )
})
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="App Directory"
      :subtitle="`${apps.filter(a => a.connected).length} connected · ${apps.length} available`"
    />

    <v-card variant="flat" border rounded="lg" class="flex-shrink-0">
      <MpDataTableToolbar
        v-model:search="search"
        search-placeholder="Search integrations..."
      />
    </v-card>

    <v-row v-if="filteredApps.length">
      <v-col cols="12" sm="6" md="4" v-for="app in filteredApps" :key="app.name">
        <v-card variant="flat" border rounded="lg" class="app-card h-100">
          <div class="d-flex align-center justify-space-between">
            <div class="app-card__disc" :class="{ 'app-card__disc--connected': app.connected }">
              <v-icon size="20">{{ categoryIcons[app.category] ?? 'puzzle' }}</v-icon>
            </div>
            <MpStatusChip :status="app.connected ? 'Active' : 'Unconfigured'" size="sm" />
          </div>

          <div class="d-flex flex-column ga-1 flex-grow-1">
            <h3 class="mp-section-title">{{ app.name }}</h3>
            <p class="text-body-2 text-medium-emphasis mb-0">{{ app.desc }}</p>
          </div>

          <div class="app-card__foot d-flex align-center justify-space-between">
            <span class="mp-meta-label text-medium-emphasis">{{ app.category }}</span>
            <v-btn v-if="app.connected" variant="text" size="small">Manage App</v-btn>
            <v-btn v-else variant="outlined" color="primary" size="small">Connect</v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-card v-else variant="flat" border rounded="lg">
      <MpEmptyState
        icon="search-x"
        title="No integrations match your search"
        :description="`Nothing in the directory matches “${search}”.`"
        action-label="Clear search"
        action-icon="x"
        @action="search = ''"
      />
    </v-card>
  </div>
</template>

<style scoped>
.app-card {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-card-gap);
  padding: var(--mp-component-card-padding);
}

.app-card__disc {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-40);
  height: var(--mp-space-40);
  border-radius: var(--mp-radius-12);
  background: var(--surface-secondary);
  color: var(--on-surface-muted);
}

.app-card__disc--connected {
  background: var(--accent-soft);
  color: var(--accent-on-container);
}

.app-card__foot {
  padding-top: var(--mp-component-card-gap);
  border-top: 1px solid var(--border-subtle);
}
</style>
