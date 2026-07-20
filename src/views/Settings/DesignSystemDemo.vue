<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'

interface DemoOrder {
  id: string
  merchant: string
  amount: string
  status: 'Processing' | 'Completed' | 'Cancelled'
}

const activeTab = ref('all')
const search = ref('')
const drawerOpen = ref(false)
const selected = ref<string[]>([])

const rows = ref<DemoOrder[]>([
  { id: 'ORD-1101', merchant: 'Northlight Apparel', amount: '$2,184.40', status: 'Processing' },
  { id: 'ORD-1102', merchant: 'Urban Grind Coffee', amount: '$918.00', status: 'Completed' },
  { id: 'ORD-1103', merchant: 'Evergreen Home', amount: '$1,240.75', status: 'Cancelled' },
])

const tabs = computed(() => {
  const completed = rows.value.filter(r => r.status === 'Completed').length
  const processing = rows.value.filter(r => r.status === 'Processing').length
  return [
    { label: 'All', key: 'all', count: rows.value.length },
    { label: 'Processing', key: 'processing', count: processing },
    { label: 'Completed', key: 'completed', count: completed },
  ]
})

const filteredRows = computed(() => {
  const term = search.value.trim().toLowerCase()
  return rows.value.filter((row) => {
    const matchTab = activeTab.value === 'all' || row.status.toLowerCase() === activeTab.value
    const matchSearch = term.length === 0
      || row.id.toLowerCase().includes(term)
      || row.merchant.toLowerCase().includes(term)
      || row.status.toLowerCase().includes(term)
    return matchTab && matchSearch
  })
})

const headers = [
  { title: 'Order', key: 'id' },
  { title: 'Merchant', key: 'merchant' },
  { title: 'Amount', key: 'amount', align: 'end' as const },
  { title: 'Status', key: 'status', align: 'end' as const },
]

const colorTokens = [
  { label: 'Primary', cssVar: '--mp-color-light-primary', toneClass: 'bg-primary text-on-primary' },
  { label: 'Secondary', cssVar: '--mp-color-light-secondary', toneClass: 'bg-secondary text-on-secondary' },
  { label: 'Success', cssVar: '--mp-color-light-success', toneClass: 'bg-success text-white' },
  { label: 'Warning', cssVar: '--mp-color-light-warning', toneClass: 'bg-warning text-on-warning' },
  { label: 'Error', cssVar: '--mp-color-light-error', toneClass: 'bg-error text-white' },
  { label: 'Info', cssVar: '--mp-color-light-info', toneClass: 'bg-info text-on-primary' },
]

const spacingTokens = [
  '--mp-spacing-1',
  '--mp-spacing-2',
  '--mp-spacing-3',
  '--mp-spacing-4',
  '--mp-spacing-6',
  '--mp-spacing-8',
]

function toggleSelect(id: string) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter(item => item !== id)
    : [...selected.value, id]
}
</script>

<template>
  <div class="d-flex flex-column gap-5">
    <MpPageHeader
      title="Design System Demo"
      subtitle="Live Figma token sync demo for stakeholders"
    >
      <template #actions>
        <v-btn variant="outlined" prepend-icon="book-open" :to="`/accounts/2000290/design-system/docs`">Docs &amp; FAQ</v-btn>
        <v-btn color="primary" prepend-icon="file-text" @click="drawerOpen = true">Token Brief</v-btn>
      </template>
    </MpPageHeader>

    <v-row>
      <v-col cols="12" md="4">
        <MpKpiCard label="Token Source" value="1" icon="git-branch" color="primary" sub-stat="src/design-tokens/tokens.json" />
      </v-col>
      <v-col cols="12" md="4">
        <MpKpiCard label="Core Mp Components" value="11+" icon="shapes" color="secondary" sub-stat="Shared by app + Storybook" />
      </v-col>
      <v-col cols="12" md="4">
        <MpKpiCard label="Sync Command" value="tokens:sync-figma" icon="refresh-cw" color="success" sub-stat="Updates app + Storybook tokens" />
      </v-col>
    </v-row>

    <v-card flat border rounded="lg">
      <v-card-title class="text-subtitle-1 font-weight-bold">Live Token Colors</v-card-title>
      <v-card-text>
        <v-row>
          <v-col v-for="token in colorTokens" :key="token.cssVar" cols="12" sm="6" md="4" lg="2">
            <v-card flat border rounded="lg" class="overflow-hidden">
              <div :class="['d-flex align-center justify-center pa-4 token-color-swatch', token.toneClass]">
                <span class="text-caption font-weight-medium">{{ token.label }}</span>
              </div>
              <div class="pa-3">
                <div class="text-body-2 font-weight-medium">{{ token.label }}</div>
                <div class="text-caption text-medium-emphasis">{{ token.cssVar }}</div>
                <div class="text-caption text-disabled">{{ `var(${token.cssVar})` }}</div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card flat border rounded="lg">
      <v-card-title class="text-subtitle-1 font-weight-bold">Spacing Scale</v-card-title>
      <v-card-text>
        <div class="d-flex flex-wrap align-end gap-3">
          <div v-for="token in spacingTokens" :key="token" class="d-flex flex-column align-center gap-2">
            <div class="spacing-bar" :style="{ width: `var(${token})` }" />
            <span class="text-caption text-medium-emphasis">{{ token }}</span>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <MpFilterTabs v-model="activeTab" :tabs="tabs" />

    <v-card flat border rounded="lg">
      <MpDataTableToolbar
        v-model:search="search"
        title="App + Storybook Shared Components"
        :total-count="filteredRows.length"
        :active-filters="activeTab === 'all' ? [] : [{ key: activeTab, label: `Status: ${activeTab}` }]"
        @remove-filter="activeTab = 'all'"
        @clear-filters="activeTab = 'all'"
      >
        <template #actions>
          <v-btn variant="flat" prepend-icon="refresh-cw" color="surface">Refresh preview</v-btn>
        </template>
      </MpDataTableToolbar>

      <v-data-table
        :headers="headers"
        :items="filteredRows"
        item-value="id"
        hide-default-footer
      >
        <template #item.id="{ item }">
          <div class="d-flex align-center gap-2">
            <v-checkbox-btn
              :model-value="selected.includes(item.id)"
              @update:model-value="toggleSelect(item.id)"
            />
            <span class="font-weight-medium">{{ item.id }}</span>
          </div>
        </template>

        <template #item.status="{ item }">
          <div class="d-flex justify-end">
            <MpStatusChip :status="item.status" type="order" />
          </div>
        </template>

        <template #bottom>
          <MpEmptyState
            v-if="filteredRows.length === 0"
            icon="palette"
            title="No rows for current filters"
            description="Try resetting filters to see all demo records."
            action-label="Reset filters"
            action-icon="filter-x"
            @action="activeTab = 'all'; search = ''"
          />
        </template>
      </v-data-table>
    </v-card>

    <v-card flat border rounded="lg">
      <v-card-title class="text-subtitle-1 font-weight-bold">How the live demo works</v-card-title>
      <v-card-text class="d-flex flex-column gap-3">
        <div class="d-flex align-start gap-3">
          <v-chip color="primary" variant="tonal">1</v-chip>
          <div>
            <div class="text-body-2 font-weight-medium">Change token in Figma Tokens Studio</div>
            <div class="text-caption text-medium-emphasis">Update something obvious like <code>color-light.primary</code>.</div>
          </div>
        </div>
        <div class="d-flex align-start gap-3">
          <v-chip color="primary" variant="tonal">2</v-chip>
          <div>
            <div class="text-body-2 font-weight-medium">Pull latest and run sync</div>
            <div class="text-caption text-medium-emphasis"><code>git pull && npm run tokens:sync-figma</code></div>
          </div>
        </div>
        <div class="d-flex align-start gap-3">
          <v-chip color="primary" variant="tonal">3</v-chip>
          <div>
            <div class="text-body-2 font-weight-medium">Show both runtimes update</div>
            <div class="text-caption text-medium-emphasis">App route <code>/design-system</code> and Storybook foundation stories reflect the same token source.</div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <MpFloatingBulkBar
      :count="selected.length"
      :total="filteredRows.length"
      @clear="selected = []"
      @select-all="selected = filteredRows.map(r => r.id)"
    >
      <v-btn size="small" variant="text">Export selected</v-btn>
      <v-btn size="small" variant="text" color="error">Archive selected</v-btn>
    </MpFloatingBulkBar>

    <MpFormDrawer
      v-model="drawerOpen"
      title="Token sync talking points"
      subtitle="Use this as your stakeholder script"
    >
      <v-list density="comfortable" class="pa-0" lines="two">
        <v-list-item prepend-icon="link" title="Single source of truth" subtitle="All token values live in src/design-tokens/tokens.json." />
        <v-list-item prepend-icon="paint-bucket" title="Visual consistency" subtitle="Same token variables drive app surfaces and Storybook stories." />
        <v-list-item prepend-icon="wand-2" title="Low-risk updates" subtitle="Design updates land through one sync command and regenerate outputs." />
      </v-list>

      <template #footer>
        <v-btn variant="text" @click="drawerOpen = false">Close</v-btn>
        <v-btn color="primary" prepend-icon="circle-check" @click="drawerOpen = false">Looks good</v-btn>
      </template>
    </MpFormDrawer>
  </div>
</template>

<style scoped>
.token-color-swatch {
  min-height: var(--mp-spacing-16);
}

.spacing-bar {
  height: var(--mp-spacing-2);
  min-width: var(--mp-spacing-2);
  border-radius: var(--mp-borderRadius-sm);
  background: rgb(var(--v-theme-primary));
}
</style>
