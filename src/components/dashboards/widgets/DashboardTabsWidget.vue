<script setup lang="ts">
// Tabbed list widget (dotted Overview v2): Recent orders / Live activity /
// Top campaigns. Renders bespoke — the widget card suppresses its standard
// header for this type.
import { ref } from 'vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import DtDottedBar from '../dotted/DtDottedBar.vue'
import type { DashboardTabsData } from '@/stores/dashboards/types'

defineProps<{
  data: DashboardTabsData
}>()

const emit = defineEmits<{
  drilldown: []
}>()

type Tab = 'orders' | 'activity' | 'campaigns'

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'orders', label: 'Recent orders' },
  { key: 'activity', label: 'Live activity' },
  { key: 'campaigns', label: 'Top campaigns' },
]

const TAG_CLOUDS: Record<string, string> = {
  email: 'marketing',
  order: 'commerce',
  audience: 'contacts',
  automation: 'marketing',
}

const tab = ref<Tab>('orders')
</script>

<template>
  <div class="tabs-widget">
    <div class="tabs-widget__bar" role="tablist">
      <button
        v-for="t in TABS"
        :key="t.key"
        type="button"
        role="tab"
        class="tabs-widget__tab"
        :aria-selected="tab === t.key"
        @click="tab = t.key"
      >
        {{ t.label }}
        <span class="tabs-widget__underline" :style="{ opacity: tab === t.key ? 1 : 0 }" aria-hidden="true" />
      </button>
      <span class="tabs-widget__spacer" />
      <a href="#" class="tabs-widget__view-all" @click.prevent="emit('drilldown')">View all</a>
    </div>

    <div v-if="tab === 'orders'" class="tabs-widget__orders">
      <div class="tabs-widget__orders-head">
        <span>Order</span><span>Customer</span><span>Status</span><span class="tabs-widget__right">Total</span>
      </div>
      <div v-for="row in data.orders" :key="row.order" class="tabs-widget__orders-row">
        <span class="tabs-widget__order-id">{{ row.order }}</span>
        <span class="tabs-widget__customer">{{ row.customer }}</span>
        <span><MpStatusChip :status="row.status" type="order" /></span>
        <span class="tabs-widget__right tabs-widget__total">{{ row.total }}</span>
      </div>
    </div>

    <div v-else-if="tab === 'activity'" class="tabs-widget__activity">
      <div v-for="item in data.activity" :key="item.id" class="tabs-widget__activity-row">
        <span
          class="tabs-widget__activity-icon"
          :style="{
            background: `color-mix(in oklch, var(--cloud-${TAG_CLOUDS[item.tag] ?? 'marketing'}-accent) 12%, transparent)`,
            color: `var(--cloud-${TAG_CLOUDS[item.tag] ?? 'marketing'}-text)`,
          }"
        >
          <v-icon size="14">{{ item.icon }}</v-icon>
        </span>
        <div class="tabs-widget__activity-text">
          <span class="tabs-widget__activity-title">{{ item.title }}</span>
          <span class="tabs-widget__activity-meta">{{ item.meta }}</span>
        </div>
        <span class="tabs-widget__spacer" />
        <span class="tabs-widget__ago">{{ item.eyebrow }}</span>
      </div>
    </div>

    <div v-else class="tabs-widget__campaigns">
      <p class="tabs-widget__campaigns-caption">{{ data.campaignsCaption }}</p>
      <div v-for="row in data.campaigns" :key="row.name" class="tabs-widget__campaign">
        <div class="tabs-widget__campaign-head">
          <span class="tabs-widget__campaign-name">{{ row.name }}</span>
          <span class="tabs-widget__campaign-revenue">{{ row.revenue }}</span>
        </div>
        <DtDottedBar :pct="row.pct" />
        <span class="tabs-widget__campaign-meta">{{ row.meta }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tabs-widget {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  container-type: inline-size;
}

.tabs-widget__bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--border-subtle);
  flex: none;
  position: sticky;
  top: 0;
  background: var(--surface-primary);
  z-index: 1;
}

.tabs-widget__tab {
  position: relative;
  height: 42px;
  padding: 0 12px;
  border: 0;
  background: transparent;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  white-space: nowrap;
}

.tabs-widget__underline {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: -7px;
  height: 2px;
  border-radius: 2px;
  background: var(--text-primary);
}

.tabs-widget__spacer {
  flex: 1;
}

.tabs-widget__view-all {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--muted);
  padding-right: 8px;
  text-decoration: none;
  white-space: nowrap;
}

.tabs-widget__view-all:hover {
  color: var(--text-primary);
}

/* Orders */
.tabs-widget__orders {
  display: flex;
  flex-direction: column;
}

.tabs-widget__orders-head,
.tabs-widget__orders-row {
  display: grid;
  grid-template-columns: minmax(84px, 104px) minmax(120px, 1fr) 108px 92px;
  gap: 16px;
  padding: 12px 20px;
}

.tabs-widget__orders-head {
  padding-top: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--muted);
  text-transform: uppercase;
}

.tabs-widget__orders-row {
  align-items: center;
  font-size: 13.5px;
  color: var(--text-primary);
}

.tabs-widget__orders-row:not(:last-child) {
  border-bottom: 1px solid var(--border-subtle);
}

.tabs-widget__orders-row:hover {
  background: var(--surface-secondary);
}

.tabs-widget__order-id {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tabs-widget__customer {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tabs-widget__right {
  text-align: right;
}

.tabs-widget__total {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* Activity */
.tabs-widget__activity {
  display: flex;
  flex-direction: column;
}

.tabs-widget__activity-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px 20px;
}

.tabs-widget__activity-row:not(:last-child) {
  border-bottom: 1px solid var(--border-subtle);
}

.tabs-widget__activity-row:hover {
  background: var(--surface-secondary);
}

.tabs-widget__activity-icon {
  width: 28px;
  height: 28px;
  flex: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tabs-widget__activity-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.tabs-widget__activity-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tabs-widget__activity-meta {
  font-size: 12.5px;
  color: var(--muted);
}

.tabs-widget__ago {
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}

/* Campaigns */
.tabs-widget__campaigns {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 20px;
}

.tabs-widget__campaigns-caption {
  margin: 0;
  font-size: 12.5px;
  color: var(--muted);
}

.tabs-widget__campaign {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tabs-widget__campaign-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.tabs-widget__campaign-name,
.tabs-widget__campaign-revenue {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
}

.tabs-widget__campaign-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tabs-widget__campaign-revenue {
  font-variant-numeric: tabular-nums;
  flex: none;
}

.tabs-widget__campaign-meta {
  font-size: 11.5px;
  color: var(--muted);
}

@container (max-width: 520px) {
  .tabs-widget__orders-head,
  .tabs-widget__orders-row {
    grid-template-columns: minmax(72px, 90px) minmax(90px, 1fr) 92px 72px;
    gap: 10px;
    padding-left: 14px;
    padding-right: 14px;
  }

  .tabs-widget__ago {
    display: none;
  }
}
</style>
