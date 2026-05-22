<script setup lang="ts">
import { ref, computed } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const search = ref('')

const apps = [
  { name: 'Shopify', category: 'Commerce', connected: true, desc: 'Sync orders, customers, and product catalogs automatically.' },
  { name: 'Salesforce', category: 'CRM', connected: true, desc: 'Bi-directional sync for leads and engagement data.' },
  { name: 'Zapier', category: 'Automation', connected: false, desc: 'Trigger complex workflows across 5000+ external apps.' },
  { name: 'Google Workspace', category: 'Productivity', connected: false, desc: 'Connect calendar and document templates.' },
  { name: 'Facebook Ads', category: 'Advertising', connected: true, desc: 'Automatically sync custom audiences and conversion events.' },
  { name: 'Twilio', category: 'SMS', connected: true, desc: 'Enterprise SMS gateway for transactional alerts.' },
]

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

    <v-row>
      <v-col cols="12" sm="6" md="4" v-for="app in filteredApps" :key="app.name">
        <v-card variant="flat" border class="h-100 d-flex flex-column pa-2 transition-swing hover-lift">
          <v-card-text class="d-flex flex-column h-100 pa-6">
             <div class="d-flex align-center justify-space-between mb-6">
                 <v-avatar size="56" :color="app.connected ? 'primary-lighten-1' : 'grey-lighten-4'" class="mr-4 text-primary">
                   <v-icon size="32">{{ app.category === 'Commerce' ? 'shopping-cart' : app.category === 'CRM' ? 'cloud' : 'code-2' }}</v-icon>
                 </v-avatar>
                 <v-chip size="small" :color="app.connected ? 'success' : 'grey'" variant="flat" class="font-weight-bold px-3 py-1 text-uppercase text-caption">
                   <v-icon start size="14" v-if="app.connected">circle-check</v-icon>
                   {{ app.connected ? 'Active' : 'Unconfigured' }}
                 </v-chip>
             </div>

             <h3 class="text-h6 font-weight-bold mb-2">{{ app.name }}</h3>
             <p class="text-medium-emphasis text-body-2 mb-6 flex-grow-1">{{ app.desc }}</p>

             <div class="d-flex align-center justify-space-between mt-auto pt-4 border-t">
               <span class="text-caption text-medium-emphasis font-weight-bold text-uppercase">{{ app.category }}</span>
               <v-btn :variant="app.connected ? 'text' : 'tonal'" :color="app.connected ? 'medium-emphasis' : 'primary'" size="small" class="text-none font-weight-bold">
                 {{ app.connected ? 'Manage App' : 'Connect' }}
               </v-btn>
             </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.05) !important;
}
.border-t {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
}
</style>
