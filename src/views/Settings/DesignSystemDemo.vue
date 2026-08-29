<script setup lang="ts">
// The design-system index page: token foundations in detail (Colors /
// Typography / Spacing, driven by tokens.json), a live component demo, and
// the docs-grounded Da Vinci assistant (DvDocsAssistant) one click away.
import { computed, defineAsyncComponent, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import DvDocsAssistant from '@/components/copilot/DvDocsAssistant.vue'

interface DemoOrder {
  id: string
  merchant: string
  amount: string
  status: 'Processing' | 'Completed' | 'Cancelled'
}

/* ── Page sections ─────────────────────────────────────────────── */

const sectionTabs = [
  { label: 'Overview', key: 'overview' },
  { label: 'Colors', key: 'colors' },
  { label: 'Typography', key: 'typography' },
  { label: 'Spacing', key: 'spacing' },
  { label: 'Components', key: 'components' },
]

const activeSection = ref('overview')

const foundationSections: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  colors: defineAsyncComponent(() => import('@/views/DesignSystem/sections/Colors.vue')),
  typography: defineAsyncComponent(() => import('@/views/DesignSystem/sections/Typography.vue')),
  spacing: defineAsyncComponent(() => import('@/views/DesignSystem/sections/Spacing.vue')),
}

const activeFoundation = computed(() => foundationSections[activeSection.value] ?? null)

// Counted from the repo (kept in sync with the showcase pack).
const stats = [
  { label: 'Shared components', value: '89', icon: 'shapes', sub: 'the parts in the kit' },
  { label: 'Documented parts', value: '84', icon: 'book-open', sub: 'each with an instruction page' },
  { label: 'Real screens', value: '171', icon: 'layout-dashboard', sub: 'built from the same kit' },
  { label: 'Design tokens', value: '297', icon: 'git-branch', sub: 'written down once, used everywhere' },
  { label: 'Themes', value: '2', icon: 'moon', sub: 'light and dark, from one switch' },
]

/* ── Da Vinci + token brief drawers ────────────────────────────── */

const drawerOpen = ref(false)
const assistantOpen = ref(false)

/* ── Components demo (list pattern with live Mp* parts) ────────── */

const activeTab = ref('all')
const search = ref('')
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

function toggleSelect(id: string) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter(item => item !== id)
    : [...selected.value, id]
}
</script>

<template>
  <div class="d-flex flex-column gap-5">
    <MpPageHeader
      title="Design System"
      subtitle="One kit of parts behind every screen — explore it, or ask Da Vinci about it"
    >
      <template #actions>
        <v-btn variant="outlined" prepend-icon="sparkles" @click="assistantOpen = true">Ask Da Vinci</v-btn>
        <v-btn color="primary" prepend-icon="file-text" @click="drawerOpen = true">Token Brief</v-btn>
      </template>
      <template #tabs>
        <MpFilterTabs v-model="activeSection" :tabs="sectionTabs" aria-label="Design system sections" controls-id="ds-section" />
      </template>
    </MpPageHeader>

    <!-- Design-system Da Vinci: slide-in panel, launched from the header.
         MpFormDrawer supplies the dialog semantics (focus trap, Escape, labelled
         header + close) the previous raw v-navigation-drawer lacked. -->
    <MpFormDrawer
      v-model="assistantOpen"
      title="Ask Da Vinci"
      subtitle="Answers from the design-system docs"
      size="sm"
    >
      <!-- A chat panel scrolls internally: undo the shell's flex-shrink:0 so the
           assistant fills the body instead of pushing it into scroll. -->
      <DvDocsAssistant style="flex: 1 1 auto; min-height: 0" />
    </MpFormDrawer>

    <div id="ds-section">
      <!-- ── Overview ─────────────────────────────────────────── -->
      <div v-if="activeSection === 'overview'" class="d-flex flex-column gap-5">
        <v-row dense>
          <v-col v-for="stat in stats" :key="stat.label" cols="6" sm="4" md>
            <MpKpiCard :label="stat.label" :value="stat.value" :icon="stat.icon" color="primary" :sub-stat="stat.sub" />
          </v-col>
        </v-row>

        <v-card flat border rounded="lg">
          <v-card-title class="text-subtitle-1 font-weight-bold">What this is</v-card-title>
          <v-card-text class="text-body-2 ds-overview-copy">
            <p>
              A working prototype environment: real screens, built from one shared kit of parts, running on
              pretend data. It's the reference the product is built to match — shared work converges into
              LiquidSky, and nothing ships from here as a separate library.
            </p>
            <p class="mb-0">
              Explore the foundations in the tabs above, try the live component demo, or press
              <strong>Ask Da Vinci</strong> — it answers from the design-system docs: the FAQ, the operating
              model, the audit, and the component inventory.
            </p>
          </v-card-text>
        </v-card>

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
          <v-card-title class="text-subtitle-1 font-weight-bold">How the live token demo works</v-card-title>
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
                <div class="text-caption text-medium-emphasis">This page and the Storybook foundation stories reflect the same token source.</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- ── Foundations: Colors / Typography / Spacing ───────── -->
      <v-card v-else-if="activeFoundation" flat border rounded="lg" class="pa-6 pa-md-8">
        <component :is="activeFoundation" />
      </v-card>

      <!-- ── Components: the live demo ────────────────────────── -->
      <div v-else class="d-flex flex-column gap-5">
        <v-card flat border rounded="lg">
          <v-card-text class="text-body-2 text-medium-emphasis">
            A live list screen assembled from the shared parts — page tabs, toolbar, data table, status chips,
            empty state, and the floating bulk bar. Select rows, search, and filter: everything here is the
            real component, not a picture of it.
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
      </div>
    </div>

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
.ds-overview-copy p {
  max-width: 72ch;
  line-height: 1.6;
  margin-bottom: 12px;
}
</style>
