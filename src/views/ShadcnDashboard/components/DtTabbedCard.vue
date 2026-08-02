<script setup lang="ts">
// Tabbed list card: Recent orders / Live activity / Top campaigns.
import { ref } from 'vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import DtDottedBar from './DtDottedBar.vue'
import { LIVE_ACTIVITY, RECENT_ORDERS, TOP_CAMPAIGNS } from '../dottedDemoData'

type Tab = 'orders' | 'activity' | 'campaigns'

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'orders', label: 'Recent orders' },
  { key: 'activity', label: 'Live activity' },
  { key: 'campaigns', label: 'Top campaigns' },
]

const tab = ref<Tab>('orders')
</script>

<template>
  <section class="dt-tabbed">
    <div class="dt-tabbed__bar" role="tablist">
      <button
        v-for="t in TABS"
        :key="t.key"
        type="button"
        role="tab"
        class="dt-tabbed__tab"
        :aria-selected="tab === t.key"
        @click="tab = t.key"
      >
        {{ t.label }}
        <span class="dt-tabbed__underline" :style="{ opacity: tab === t.key ? 1 : 0 }" aria-hidden="true" />
      </button>
      <span class="dt-tabbed__spacer" />
      <a href="#" class="dt-tabbed__view-all">View all</a>
    </div>

    <div v-if="tab === 'orders'" class="dt-tabbed__orders">
      <div class="dt-tabbed__orders-head">
        <span>Order</span><span>Customer</span><span>Status</span><span class="dt-tabbed__right">Total</span>
      </div>
      <div v-for="row in RECENT_ORDERS" :key="row.order" class="dt-tabbed__orders-row">
        <span class="dt-tabbed__order-id">{{ row.order }}</span>
        <span>{{ row.customer }}</span>
        <span><MpStatusChip :status="row.status" type="order" /></span>
        <span class="dt-tabbed__right dt-tabbed__total">{{ row.total }}</span>
      </div>
    </div>

    <div v-else-if="tab === 'activity'" class="dt-tabbed__activity">
      <div v-for="item in LIVE_ACTIVITY" :key="item.title" class="dt-tabbed__activity-row">
        <span class="dt-tabbed__activity-icon" :style="{
          background: `color-mix(in oklch, var(--cloud-${item.cloud}-accent) 12%, transparent)`,
          color: `var(--cloud-${item.cloud}-text)`,
        }">
          <v-icon size="14">{{ item.icon }}</v-icon>
        </span>
        <div class="dt-tabbed__activity-text">
          <span class="dt-tabbed__activity-title">{{ item.title }}</span>
          <span class="dt-tabbed__activity-meta">{{ item.meta }}</span>
        </div>
        <span class="dt-tabbed__spacer" />
        <span class="dt-tabbed__ago">{{ item.ago }}</span>
      </div>
    </div>

    <div v-else class="dt-tabbed__campaigns">
      <p class="dt-tabbed__campaigns-caption">Last 30 days · by attributed revenue</p>
      <div v-for="row in TOP_CAMPAIGNS" :key="row.name" class="dt-tabbed__campaign">
        <div class="dt-tabbed__campaign-head">
          <span class="dt-tabbed__campaign-name">{{ row.name }}</span>
          <span class="dt-tabbed__campaign-revenue">{{ row.revenue }}</span>
        </div>
        <DtDottedBar :pct="row.pct" />
        <span class="dt-tabbed__campaign-meta">{{ row.meta }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dt-tabbed {
  border: 1px solid var(--scn-border);
  border-radius: var(--scn-radius);
  background: var(--scn-card);
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
}

.dt-tabbed__bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--scn-border);
}

.dt-tabbed__tab {
  position: relative;
  height: 42px;
  padding: 0 12px;
  border: 0;
  background: transparent;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--scn-fg);
  cursor: pointer;
}

.dt-tabbed__underline {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: -7px;
  height: 2px;
  border-radius: 2px;
  background: var(--scn-fg);
}

.dt-tabbed__spacer {
  flex: 1;
}

.dt-tabbed__view-all {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--scn-muted);
  padding-right: 8px;
  text-decoration: none;
}

.dt-tabbed__view-all:hover {
  color: var(--scn-fg);
}

/* Orders */
.dt-tabbed__orders {
  display: flex;
  flex-direction: column;
}

.dt-tabbed__orders-head,
.dt-tabbed__orders-row {
  display: grid;
  grid-template-columns: minmax(84px, 104px) minmax(120px, 1fr) 108px 92px;
  gap: 16px;
  padding: 13px 20px;
}

.dt-tabbed__orders-head {
  padding-top: 11px;
  padding-bottom: 11px;
  border-bottom: 1px solid var(--scn-border);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--scn-muted);
  text-transform: uppercase;
}

.dt-tabbed__orders-row {
  align-items: center;
  font-size: 13.5px;
  color: var(--scn-fg);
}

.dt-tabbed__orders-row:not(:last-child) {
  border-bottom: 1px solid var(--scn-border);
}

.dt-tabbed__orders-row:hover {
  background: var(--scn-soft);
}

.dt-tabbed__order-id {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.dt-tabbed__right {
  text-align: right;
}

.dt-tabbed__total {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* Activity */
.dt-tabbed__activity {
  display: flex;
  flex-direction: column;
}

.dt-tabbed__activity-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
}

.dt-tabbed__activity-row:not(:last-child) {
  border-bottom: 1px solid var(--scn-border);
}

.dt-tabbed__activity-row:hover {
  background: var(--scn-soft);
}

.dt-tabbed__activity-icon {
  width: 28px;
  height: 28px;
  flex: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dt-tabbed__activity-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.dt-tabbed__activity-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--scn-fg);
}

.dt-tabbed__activity-meta {
  font-size: 12.5px;
  color: var(--scn-muted);
}

.dt-tabbed__ago {
  font-size: 12px;
  color: var(--scn-muted);
  white-space: nowrap;
}

/* Campaigns */
.dt-tabbed__campaigns {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px;
}

.dt-tabbed__campaigns-caption {
  margin: 0;
  font-size: 12.5px;
  color: var(--scn-muted);
}

.dt-tabbed__campaign {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dt-tabbed__campaign-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.dt-tabbed__campaign-name,
.dt-tabbed__campaign-revenue {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--scn-fg);
}

.dt-tabbed__campaign-revenue {
  font-variant-numeric: tabular-nums;
}

.dt-tabbed__campaign-meta {
  font-size: 11.5px;
  color: var(--scn-muted);
}

@media (max-width: 560px) {
  .dt-tabbed__orders-head,
  .dt-tabbed__orders-row {
    grid-template-columns: minmax(72px, 90px) minmax(90px, 1fr) 92px 72px;
    gap: 10px;
    padding-left: 14px;
    padding-right: 14px;
  }
}
</style>
