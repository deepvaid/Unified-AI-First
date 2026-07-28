<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRetailStore } from '@/stores/useRetail'
import { useCommerceStore } from '@/stores/useCommerce'
import { formatAgo } from '@/composables/useRelativeTime'
import MpKpiCard from '@/components/MpKpiCard.vue'

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
      period: store.isAllLocations ? 'All locations' : store.activeLocation.name,
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
  { icon: 'user-plus',         title: 'Add staff member',    desc: 'Set up a new POS user',          path: '/staff',         color: 'contacts' },
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
  { id: 't2', title: 'Add at least 1 staff member',   desc: 'Set up PIN-based sign-in for staff',                       done: true,  path: '/staff' },
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

const commerce = useCommerceStore()
const recentTransactions = computed(() =>
  commerce.posOrders.filter((o) => store.scopedLocationIds.includes(o.pos?.locationId ?? '')).slice(0, 8),
)
const recentRegisters = computed(() =>
  [...store.registerList]
    .filter((r) => store.scopedLocationIds.includes(r.locationId))
    .sort((a, b) => (a.lastSeenAt < b.lastSeenAt ? 1 : -1))
    .slice(0, 5),
)

function statusIcon(status: string): string {
  if (status === 'Completed') return 'check-circle-2'
  if (status === 'Refunded') return 'undo-2'
  if (status === 'Cancelled') return 'circle-x'
  return 'pause-circle'
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <!-- The rail owns location scope; this header just names the workspace. -->
    <div class="retail-header">
      <div class="retail-header__row">
        <div class="retail-header__titles">
          <div class="retail-header__title-line">
            <h1 class="retail-header__title text-h5 font-weight-bold">Retail</h1>
            <v-icon size="18" class="retail-header__sep">chevron-right</v-icon>
            <span class="retail-header__scope">
              <v-icon size="16" class="me-2">{{ store.isAllLocations ? 'store' : 'map-pin' }}</v-icon>
              {{ store.isAllLocations ? 'All locations' : store.activeLocation.name }}
            </span>
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
        <MpKpiCard
          :label="kpi.label"
          :value="kpi.value"
          :icon="kpi.icon"
          :color="kpi.color"
          :trend="kpi.trend"
          :trend-positive="kpi.trendPositive"
          :sub-stat="kpi.subStat"
          :period="kpi.period"
        >
          <template v-if="kpi.trend" #sparkline>
            <svg class="retail-sparkline" viewBox="0 0 100 52" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient :id="`${sparkId}-${kpi.label.replace(/\s+/g, '-')}`" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="currentColor" stop-opacity="0.18" />
                  <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
                </linearGradient>
              </defs>
              <polygon :points="`0,52 ${salesSparkline} 100,52`" :fill="`url(#${sparkId}-${kpi.label.replace(/\s+/g, '-')})`" stroke="none" />
              <polyline
                :points="salesSparkline"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                vector-effect="non-scaling-stroke"
              />
            </svg>
          </template>
        </MpKpiCard>
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
                <div class="retail-row-icon" :class="{ 'retail-row-icon--success': txn.status === 'Completed', 'retail-row-icon--warning': txn.paymentStatus === 'Refunded' || txn.paymentStatus === 'Partially Refunded' }">
                  <v-icon size="14">{{ statusIcon(txn.status) }}</v-icon>
                </div>
              </template>
              <v-list-item-title class="retail-list-title d-flex align-center ga-2">
                <span>{{ txn.orderNumber }}</span>
                <v-chip v-if="txn.pos?.origin === 'boris'" size="x-small" variant="tonal" color="primary">BORIS</v-chip>
              </v-list-item-title>
              <v-list-item-subtitle class="retail-list-sub">
                {{ store.locationName(txn.pos?.locationId ?? '') }} · {{ store.registerName(txn.pos?.registerId ?? '') }} · {{ store.associateName(txn.pos?.staffId ?? '') }} · {{ formatAgo(txn.date) }}
              </v-list-item-subtitle>
              <template #append>
                <div class="d-flex flex-column align-end" style="gap: 2px;">
                  <span class="font-weight-bold" :class="parseFloat(txn.total) < 0 ? 'text-error' : ''" style="color: var(--ink); font-size: 13px;">
                    {{ fmtMoney(parseFloat(txn.total)) }}
                  </span>
                  <span class="text-caption text-medium-emphasis">{{ txn.paymentMethod }}</span>
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
.retail-sparkline {
  width: 100%;
  height: 48px;
  overflow: visible;
  color: var(--cloud-retail-accent);
}

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

.retail-header__scope {
  display: inline-flex;
  align-items: center;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.2;
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

</style>
