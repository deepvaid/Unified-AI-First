<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRetailStore, TENDER_LABELS } from '@/stores/useRetail'
import { formatAgo } from '@/composables/useRelativeTime'

const route = useRoute()
const router = useRouter()
const store = useRetailStore()
const accountId = computed(() => route.params.accountId as string)

const snackbar = ref({ visible: false, message: '' })
function showToast(message: string) { snackbar.value = { visible: true, message } }

const retailBase = computed(() => `/commerce/${accountId.value}/retail`)
function go(path: string) {
  if (path === 'dashboard') {
    router.push(`/accounts/${accountId.value}/dashboard/${accountId.value}-retail`)
    return
  }
  router.push(`${retailBase.value}${path}`)
}

function switchContext(channelId: string, locationId: string, locationName: string, channelName: string) {
  store.setActiveContext(channelId, locationId)
  showToast(`Switched to ${channelName} · ${locationName}`)
}

const contextGroups = computed(() => store.availableContexts(accountId.value))

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

/* ── KPIs ───────────────────────────────────────────────────── */

const kpis = computed(() => {
  const k = store.kpis
  return [
    {
      label: 'Sales today',
      value: fmtMoney(k.salesToday),
      icon: 'trending-up',
      color: 'retail',
      trend: `${k.salesTrend}% vs yesterday`,
      trendPositive: k.salesTrend >= 0,
      period: store.activeLocation?.name ?? '',
    },
    {
      label: 'Transactions',
      value: String(k.txnCountToday),
      icon: 'receipt',
      color: 'primary',
      trend: `${k.txnTrend}% vs yesterday`,
      trendPositive: k.txnTrend >= 0,
      period: 'Completed today',
    },
    {
      label: 'Average basket',
      value: fmtMoney(k.avgBasket),
      icon: 'shopping-bag',
      color: 'analytics',
      trend: `${k.avgBasketTrend}% vs yesterday`,
      trendPositive: k.avgBasketTrend >= 0,
      period: 'Per transaction',
    },
    {
      label: 'Registers online',
      value: `${k.registersOnline} / ${k.registersTotal}`,
      icon: 'tablet-smartphone',
      color: k.registersOnline === k.registersTotal ? 'success' : 'warning',
      subStat: k.offlineTxnsPending > 0 ? `${k.offlineTxnsPending} offline txns pending sync` : 'All devices in sync',
    },
  ]
})

/* Sparkline (revenue) */
const sparkId = useId()
const salesSparkline = computed(() => {
  const delta = store.kpis.salesTrend
  const slope = Math.max(-0.2, Math.min(0.24, delta / 900))
  const base = [0.2, 0.23, 0.31, 0.28, 0.36, 0.34, 0.43, 0.40, 0.51, 0.47, 0.56]
  const values = base.map((v, i) => Math.min(0.9, Math.max(0.08, v + slope * i)))
  const maxIndex = values.length - 1
  return values.map((v, i) => `${((i / maxIndex) * 100).toFixed(1)},${(48 - v * 38).toFixed(1)}`).join(' ')
})

/* ── Quick actions ──────────────────────────────────────────── */

const quickActions = [
  { icon: 'tablet-smartphone', title: 'Launch POS Preview',  desc: 'Demo the tablet POS UX',         path: '/pos-preview',   color: 'retail' },
  { icon: 'receipt',           title: 'View transactions',   desc: 'Search and refund POS sales',    path: '/transactions',  color: 'primary' },
  { icon: 'plus-circle',       title: 'Add register',        desc: 'Pair a new device to a store',   path: '/registers',     color: 'success' },
  { icon: 'user-plus',         title: 'Add associate',       desc: 'Set up a new POS user',          path: '/associates',    color: 'contacts' },
  { icon: 'upload',            title: 'Upload inventory',    desc: 'Bulk stock update by CSV',       path: '/inventory',     color: 'warning' },
  { icon: 'bar-chart-3',       title: 'View dashboard',      desc: 'Open the Retail dashboard',      path: 'dashboard',      color: 'analytics' },
]

/* ── Setup todos ────────────────────────────────────────────── */

interface TodoItem {
  id: string
  title: string
  desc: string
  done: boolean
  path: string
}

const todos = ref<TodoItem[]>([
  { id: 't1', title: 'Pair your first register',     desc: 'Open the POS app on a tablet and follow the pairing flow', done: true,  path: '/registers' },
  { id: 't2', title: 'Add at least 1 associate',      desc: 'Set up PIN-based sign-in for staff',                       done: true,  path: '/associates' },
  { id: 't3', title: 'Configure receipt template',    desc: 'Add your logo and contact details',                        done: false, path: '/settings' },
  { id: 't4', title: 'Pair a payment terminal',       desc: 'Connect Stripe Reader or enable Tap to Pay',               done: false, path: '/hardware' },
  { id: 't5', title: 'Run a test transaction',        desc: 'Process a $0.01 sale to verify end-to-end',                done: false, path: '/pos-preview' },
])

const todoProgress = computed(() => {
  const done = todos.value.filter((t) => t.done).length
  return { done, total: todos.value.length, pct: Math.round((done / todos.value.length) * 100) }
})

function onTodoClick(todo: TodoItem) {
  if (todo.path) go(todo.path)
  else showToast('Coming soon')
}

/* ── Recent activity ────────────────────────────────────────── */

const recentTransactions = computed(() =>
  store.transactionList.filter((t) => t.locationId === store.activeLocationId).slice(0, 8),
)
const recentRegisters = computed(() =>
  [...store.registerList]
    .filter((r) => r.locationId === store.activeLocationId)
    .sort((a, b) => (a.lastSeenAt < b.lastSeenAt ? 1 : -1))
    .slice(0, 5),
)

function statusIcon(s: 'completed' | 'refunded' | 'partial_refund' | 'voided' | 'suspended'): string {
  if (s === 'completed') return 'check-circle-2'
  if (s === 'refunded' || s === 'partial_refund') return 'undo-2'
  if (s === 'voided') return 'circle-x'
  return 'pause-circle'
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <!-- Title-level context switcher header -->
    <div class="retail-header">
      <div class="retail-header__row">
        <div class="retail-header__titles">
          <div class="retail-header__title-line">
            <h1 class="retail-header__title text-h5 font-weight-bold">Retail</h1>
            <v-icon size="18" class="retail-header__sep">chevron-right</v-icon>
            <v-menu offset="6">
              <template #activator="{ props: activator }">
                <button
                  v-bind="activator"
                  type="button"
                  class="retail-header__context"
                  :aria-label="`Switch sales channel and location. Currently ${store.activeChannel?.name ?? ''} · ${store.activeLocation?.name ?? ''}`"
                >
                  <v-icon size="16" class="me-2">store</v-icon>
                  <span class="retail-header__channel">{{ store.activeChannel?.name ?? 'POS Store' }}</span>
                  <span class="retail-header__divider">/</span>
                  <span class="retail-header__location">{{ store.activeLocation?.name ?? '' }}</span>
                  <v-icon size="16" class="ms-2">chevron-down</v-icon>
                </button>
              </template>
              <v-list density="comfortable" min-width="340" class="retail-header__menu">
                <template v-for="(group, idx) in contextGroups" :key="group.channel.id">
                  <v-divider v-if="idx > 0" class="my-1" />
                  <div class="retail-header__group-label">{{ group.channel.name }}</div>
                  <v-list-item
                    v-for="loc in group.locations"
                    :key="`${group.channel.id}-${loc.id}`"
                    :active="loc.id === store.activeLocationId && group.channel.id === store.activeChannelId"
                    @click="switchContext(group.channel.id, loc.id, loc.name, group.channel.name)"
                  >
                    <template #prepend>
                      <v-icon
                        size="18"
                        :color="loc.id === store.activeLocationId && group.channel.id === store.activeChannelId ? 'primary' : undefined"
                      >
                        {{ loc.id === store.activeLocationId && group.channel.id === store.activeChannelId ? 'check-circle' : 'map-pin' }}
                      </v-icon>
                    </template>
                    <v-list-item-title class="text-body-2 font-weight-medium">{{ loc.name }}</v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                      {{ loc.country }} · {{ loc.registerCount }} registers · {{ loc.associateCount }} associates
                    </v-list-item-subtitle>
                  </v-list-item>
                </template>
                <v-divider class="my-1" />
                <v-list-item prepend-icon="settings" title="Manage locations" @click="go('/locations')" />
              </v-list>
            </v-menu>
          </div>
          <div class="retail-header__subtitle text-body-2 text-medium-emphasis">
            In-store POS · {{ store.kpis.registersOnline }} of {{ store.kpis.registersTotal }} registers online
          </div>
        </div>
        <div class="retail-header__actions">
          <v-btn
            variant="flat"
            color="primary"
            class="text-none"
            prepend-icon="tablet-smartphone"
            @click="go('/pos-preview')"
          >
            Launch POS
          </v-btn>
        </div>
      </div>
    </div>

    <!-- KPI row -->
    <v-row dense>
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="12" sm="6" md="3">
        <v-card flat border rounded="lg" class="retail-kpi-card h-100">
          <div class="retail-kpi-card__inner">
            <div class="retail-kpi-card__left">
              <div class="retail-kpi-card__header-row">
                <div class="retail-kpi-card__icon-chip" :class="`retail-kpi-card__icon-chip--${kpi.color}`">
                  <v-icon size="14">{{ kpi.icon }}</v-icon>
                </div>
                <div style="min-width: 0">
                  <div class="retail-kpi-card__title">{{ kpi.label }}</div>
                  <div v-if="kpi.period" class="retail-kpi-card__period">{{ kpi.period }}</div>
                </div>
              </div>
              <div class="retail-kpi-card__value num">{{ kpi.value }}</div>
              <div v-if="kpi.trend" class="retail-kpi-card__trend">
                <span
                  class="retail-kpi-card__trend-pill"
                  :class="kpi.trendPositive ? 'retail-kpi-card__trend-pill--pos' : 'retail-kpi-card__trend-pill--neg'"
                >
                  <v-icon size="12">{{ kpi.trendPositive ? 'chevron-up' : 'chevron-down' }}</v-icon>
                  {{ kpi.trend }}
                </span>
              </div>
              <div v-else-if="kpi.subStat" class="retail-kpi-card__sub">{{ kpi.subStat }}</div>
            </div>
            <div v-if="kpi.trend" class="retail-kpi-card__sparkline-col" aria-hidden="true">
              <svg class="retail-kpi-card__sparkline" viewBox="0 0 100 52" preserveAspectRatio="none">
                <defs>
                  <linearGradient :id="`${sparkId}-${kpi.label.replace(/\s+/g, '-')}`" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="currentColor" stop-opacity="0.18" />
                    <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <polygon :points="`0,52 ${salesSparkline} 100,52`" :fill="`url(#${sparkId}-${kpi.label.replace(/\s+/g, '-')})`" class="retail-kpi-card__sparkline-fill" />
                <polyline :points="salesSparkline" class="retail-kpi-card__sparkline-line" />
              </svg>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick actions + Setup todos -->
    <v-row dense>
      <v-col cols="12" md="8">
        <v-card flat border rounded="lg" class="retail-widget-card h-100">
          <div class="retail-widget-header">
            <div class="retail-widget-header__title">Quick actions</div>
            <div class="retail-widget-header__actions">
              <span class="retail-widget-header__sub">Jump to common tasks</span>
            </div>
          </div>
          <div class="retail-widget-body">
            <v-row dense>
              <v-col v-for="action in quickActions" :key="action.title" cols="6" md="4">
                <div
                  class="retail-action-tile"
                  role="button"
                  tabindex="0"
                  @click="go(action.path)"
                  @keydown.enter="go(action.path)"
                  @keydown.space.prevent="go(action.path)"
                >
                  <div class="retail-action-tile__icon" :class="`retail-action-tile__icon--${action.color}`">
                    <v-icon size="16">{{ action.icon }}</v-icon>
                  </div>
                  <div class="retail-action-tile__title">{{ action.title }}</div>
                  <div class="retail-action-tile__desc">{{ action.desc }}</div>
                </div>
              </v-col>
            </v-row>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card flat border rounded="lg" class="retail-widget-card h-100 d-flex flex-column">
          <div class="retail-widget-header">
            <div class="retail-widget-header__title">Setup checklist</div>
            <div class="retail-widget-header__actions">
              <span class="retail-widget-header__sub">{{ todoProgress.done }} / {{ todoProgress.total }}</span>
            </div>
          </div>
          <div class="retail-widget-progress">
            <v-progress-linear
              :model-value="todoProgress.pct"
              color="primary"
              height="4"
              rounded
              bg-color="surface-variant"
            />
          </div>
          <v-list :border="false" density="compact" class="retail-list flex-grow-1">
            <v-list-item
              v-for="todo in todos"
              :key="todo.id"
              rounded="lg"
              lines="two"
              @click="onTodoClick(todo)"
            >
              <template #prepend>
                <v-icon
                  size="16"
                  :color="todo.done ? 'success' : undefined"
                  class="me-1"
                >
                  {{ todo.done ? 'check-circle-2' : 'circle' }}
                </v-icon>
              </template>
              <v-list-item-title
                class="retail-list-title"
                :class="{ 'text-decoration-line-through text-medium-emphasis': todo.done }"
              >{{ todo.title }}</v-list-item-title>
              <v-list-item-subtitle class="retail-list-sub">{{ todo.desc }}</v-list-item-subtitle>
              <template #append>
                <v-icon size="14" color="medium-emphasis">chevron-right</v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent activity row -->
    <v-row dense>
      <v-col cols="12" md="7">
        <v-card flat border rounded="lg" class="retail-widget-card h-100">
          <div class="retail-widget-header">
            <div class="retail-widget-header__title">Recent transactions</div>
            <div class="retail-widget-header__actions">
              <v-btn size="small" variant="text" class="text-none" append-icon="arrow-right" @click="go('/transactions')">
                View all
              </v-btn>
            </div>
          </div>
          <v-list :border="false" density="compact" class="retail-list">
            <v-list-item
              v-for="txn in recentTransactions"
              :key="txn.id"
              @click="go('/transactions')"
            >
              <template #prepend>
                <div class="retail-row-icon" :class="{ 'retail-row-icon--success': txn.status === 'completed', 'retail-row-icon--warning': txn.status === 'refunded' || txn.status === 'partial_refund' }">
                  <v-icon size="14">{{ statusIcon(txn.status) }}</v-icon>
                </div>
              </template>
              <v-list-item-title class="retail-list-title d-flex align-center ga-2">
                <span>{{ txn.id }}</span>
                <v-chip v-if="txn.origin === 'boris'" size="x-small" variant="tonal" color="primary">BORIS</v-chip>
              </v-list-item-title>
              <v-list-item-subtitle class="retail-list-sub">
                {{ store.locationName(txn.locationId) }} · {{ store.registerName(txn.registerId) }} · {{ store.associateName(txn.associateId) }} · {{ formatAgo(txn.completedAt) }}
              </v-list-item-subtitle>
              <template #append>
                <div class="d-flex flex-column align-end" style="gap: 2px;">
                  <span class="font-weight-bold" :class="txn.total < 0 ? 'text-error' : ''" style="color: var(--ink); font-size: 13px;">
                    {{ fmtMoney(txn.total) }}
                  </span>
                  <span class="text-caption text-medium-emphasis">{{ TENDER_LABELS[txn.tender] }}</span>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card flat border rounded="lg" class="retail-widget-card h-100">
          <div class="retail-widget-header">
            <div class="retail-widget-header__title">Register fleet</div>
            <div class="retail-widget-header__actions">
              <v-btn size="small" variant="text" class="text-none" append-icon="arrow-right" @click="go('/registers')">
                View all
              </v-btn>
            </div>
          </div>
          <v-list :border="false" density="compact" class="retail-list">
            <v-list-item
              v-for="reg in recentRegisters"
              :key="reg.id"
              @click="go('/registers')"
            >
              <template #prepend>
                <div class="retail-row-icon">
                  <v-icon size="14">{{ reg.deviceType.startsWith('iPad') || reg.deviceType.includes('Tablet') ? 'tablet' : 'smartphone' }}</v-icon>
                </div>
              </template>
              <v-list-item-title class="retail-list-title">
                {{ reg.name }} <span class="text-medium-emphasis font-weight-normal">— {{ store.locationName(reg.locationId) }}</span>
              </v-list-item-title>
              <v-list-item-subtitle class="retail-list-sub">
                {{ reg.deviceModel }} · v{{ reg.appVersion }} · {{ formatAgo(reg.lastSeenAt) }}
              </v-list-item-subtitle>
              <template #append>
                <span class="retail-status-dot" :class="`retail-status-dot--${reg.status}`">
                  {{ reg.status.charAt(0).toUpperCase() + reg.status.slice(1) }}
                </span>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.visible" :timeout="2000" location="bottom" attach="body">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<style scoped lang="scss">
.retail-header {
  margin-bottom: 8px;
}

.retail-header__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.retail-header__titles {
  min-width: 0;
  flex: 1 1 auto;
}

.retail-header__title-line {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.retail-header__title {
  line-height: 1.2;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}

.retail-header__sep {
  color: rgba(var(--v-theme-on-surface), 0.3);
}

.retail-header__context {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid transparent;
  color: rgb(var(--v-theme-on-surface));
  font-size: 1.05rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease;
  line-height: 1.2;
}

.retail-header__context:hover {
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-color: rgba(var(--v-theme-on-surface), 0.08);
}

.retail-header__context:focus-visible {
  outline: none;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-color: rgb(var(--v-theme-primary));
}

.retail-header__channel {
  color: rgb(var(--v-theme-on-surface));
}

.retail-header__divider {
  color: rgba(var(--v-theme-on-surface), 0.35);
  margin: 0 4px;
  font-weight: 400;
}

.retail-header__location {
  color: rgb(var(--v-theme-primary));
}

.retail-header__subtitle {
  margin-top: 4px;
  line-height: 1.4;
}

.retail-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.retail-header__menu {
  padding-top: 4px;
  padding-bottom: 4px;
}

.retail-header__group-label {
  padding: 6px 16px 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.55);
}
</style>
