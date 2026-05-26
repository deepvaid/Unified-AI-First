<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpStatusChip from '@/components/MpStatusChip.vue'
import {
  useMerchandisingStore,
  ENGINE_TYPE_LABELS,
} from '@/stores/useMerchandising'

const route = useRoute()
const router = useRouter()
const store = useMerchandisingStore()
const accountId = computed(() => route.params.accountId as string)

const snackbar = ref({ visible: false, message: '' })
function showToast(message: string) {
  snackbar.value = { visible: true, message }
}

const merchBase = computed(() => `/commerce/${accountId.value}/merchandising`)

function go(path: string) {
  if (path === 'dashboard') {
    router.push(`/accounts/${accountId.value}/dashboard/${accountId.value}-merchandise`)
    return
  }
  router.push(`${merchBase.value}${path}`)
}

function switchStore(id: string) {
  store.setActiveStore(id)
  showToast(`Switched to ${store.activeStore.domain}`)
}

/* ── Derived dashboard data ─────────────────────────────────────── */

const activeEngines = computed(() => store.engineList.filter((e) => e.status === 'active').length)
const activeSynonyms = computed(() => store.synonymList.filter((s) => s.status === 'active').length)
const activeCollections = computed(() => store.collectionList.filter((c) => c.status === 'active').length)
const totalRedirects = computed(() => store.redirectList.length)

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

/* ── KPIs ───────────────────────────────────────────────────────── */

const kpis = computed(() => [
  {
    label: 'MerchCloud-driven revenue',
    value: formatCurrency(store.analytics.merchCloudRevenue),
    icon: 'trending-up',
    color: 'retail',
    trend: `${store.analytics.merchCloudRevenueTrend}% vs prev 30d`,
    trendPositive: (store.analytics.merchCloudRevenueTrend ?? 0) >= 0,
    period: 'Last 30 days',
  },
  {
    label: 'Active engines',
    value: String(activeEngines.value),
    icon: 'sparkles',
    color: 'primary',
    subStat: `of ${store.engineList.length} total`,
  },
  {
    label: 'Active synonyms',
    value: String(activeSynonyms.value),
    icon: 'repeat',
    color: 'contacts',
    subStat: `${totalRedirects.value} page redirects`,
  },
  {
    label: 'Smart collections',
    value: String(activeCollections.value),
    icon: 'layers',
    color: 'marketing',
    subStat: 'curated for storefront',
  },
])

/* ── Revenue sparkline (same formula as DashboardKpiWidget) ─────── */
const sparkId = useId()

const revenueSparkline = computed(() => {
  const delta = store.analytics.merchCloudRevenueTrend ?? 12
  const slope = Math.max(-0.2, Math.min(0.24, delta / 900))
  const base = [0.2, 0.23, 0.31, 0.28, 0.36, 0.34, 0.43, 0.40, 0.51, 0.47, 0.56]
  const values = base.map((v, i) => Math.min(0.9, Math.max(0.08, v + slope * i)))
  const maxIndex = values.length - 1
  return values
    .map((v, i) => `${((i / maxIndex) * 100).toFixed(1)},${(48 - v * 38).toFixed(1)}`)
    .join(' ')
})

/* ── Quick actions ──────────────────────────────────────────────── */

const quickActions = [
  { icon: 'sparkles', title: 'New engine', desc: 'Add a recommendation engine', path: '/recommendations', color: 'primary' },
  { icon: 'layers', title: 'Create collection', desc: 'Curate a smart collection', path: '/collections', color: 'marketing' },
  { icon: 'repeat', title: 'Add synonym', desc: 'Map equivalent search terms', path: '/search/synonyms', color: 'contacts' },
  { icon: 'arrow-right', title: 'Page redirect', desc: 'Send shoppers to a page', path: '/search/redirects', color: 'retail' },
  { icon: 'wand-sparkles', title: 'Field rule', desc: 'Transform a product field', path: '/fields', color: 'warning' },
  { icon: 'bar-chart-3', title: 'View dashboard', desc: 'Open the Merchandise dashboard', path: 'dashboard', color: 'analytics' },
]

/* ── Things to do ───────────────────────────────────────────────── */

interface TodoItem {
  id: string
  title: string
  desc: string
  done: boolean
  path: string
}

const todos = ref<TodoItem[]>([
  {
    id: 't1',
    title: 'Configure default merchandising',
    desc: 'Set fallback ranking rules for new collections',
    done: false,
    path: '/default-merchandising',
  },
  {
    id: 't2',
    title: 'Review 1 disabled synonym',
    desc: '"joggers ↔ sweatpants" is currently off',
    done: false,
    path: '/search/synonyms',
  },
  {
    id: 't3',
    title: 'Connect a second sales channel',
    desc: 'Sync your BigCommerce store to scale recommendations',
    done: false,
    path: '',
  },
  {
    id: 't4',
    title: 'Preview search results',
    desc: 'Validate top queries before launch',
    done: true,
    path: '/search/preview',
  },
])

const todoProgress = computed(() => {
  const done = todos.value.filter((t) => t.done).length
  return { done, total: todos.value.length, pct: Math.round((done / todos.value.length) * 100) }
})

function onTodoClick(todo: TodoItem) {
  if (todo.path) go(todo.path)
  else showToast('Channel setup coming soon')
}

/* ── Recent activity ────────────────────────────────────────────── */

const recentEngines = computed(() => store.engineList.slice(0, 5))
const recentSynonyms = computed(() => store.synonymList.slice(0, 5))
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <!-- Title-level context header -->
    <div class="merch-header">
      <div class="merch-header__row">
        <div class="merch-header__title-group">
          <span class="merch-header__module">Merchandise</span>
          <v-icon size="16" class="merch-header__divider">chevron-right</v-icon>

          <v-menu offset="6" :close-on-content-click="true">
            <template #activator="{ props: activator }">
              <button v-bind="activator" class="merch-header__store-btn" type="button">
                <span class="merch-header__store-name">{{ store.activeStore.domain }}</span>
                <v-icon size="14" class="merch-header__chevron">chevron-down</v-icon>
              </button>
            </template>
            <v-card flat border rounded="lg" min-width="300">
              <v-list density="compact" class="py-1">
                <v-list-item
                  v-for="s in store.merchStores"
                  :key="s.id"
                  :active="s.id === store.activeStoreId"
                  rounded="lg"
                  @click="switchStore(s.id)"
                >
                  <template #prepend>
                    <v-icon
                      size="16"
                      :color="s.id === store.activeStoreId ? 'primary' : undefined"
                      class="me-1"
                    >
                      {{ s.id === store.activeStoreId ? 'check-circle' : 'globe' }}
                    </v-icon>
                  </template>
                  <v-list-item-title class="text-body-2 font-weight-medium">{{ s.domain }}</v-list-item-title>
                  <v-list-item-subtitle class="text-caption">
                    {{ s.platform }} · {{ s.productCount.toLocaleString() }} products · {{ s.engineCount }} engines
                  </v-list-item-subtitle>
                </v-list-item>
                <v-divider class="my-1" />
                <v-list-item
                  prepend-icon="plus"
                  title="Connect another store"
                  @click="showToast('Store onboarding — coming soon')"
                />
              </v-list>
            </v-card>
          </v-menu>
        </div>

        <div class="merch-header__actions">
          <v-btn
            variant="flat"
            color="primary"
            class="text-none"
            prepend-icon="bar-chart-3"
            @click="go('dashboard')"
          >
            View dashboard
          </v-btn>
        </div>
      </div>

      <div class="merch-header__subtitle">
        AI-powered storefront discovery · {{ activeEngines }} active engines
      </div>
    </div>

    <!-- KPI row -->
    <v-row dense>
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="12" sm="6" md="3">
        <v-card flat border rounded="lg" class="merch-kpi-card h-100">
          <div class="merch-kpi-card__inner">
            <div class="merch-kpi-card__left">
              <div class="merch-kpi-card__header-row">
                <div class="merch-kpi-card__icon-chip" :class="`merch-kpi-card__icon-chip--${kpi.color}`">
                  <v-icon size="14">{{ kpi.icon }}</v-icon>
                </div>
                <div class="min-width-0">
                  <div class="merch-kpi-card__title">{{ kpi.label }}</div>
                  <div v-if="kpi.period" class="merch-kpi-card__period">{{ kpi.period }}</div>
                </div>
              </div>
              <div class="merch-kpi-card__value num">{{ kpi.value }}</div>
              <div v-if="kpi.trend" class="merch-kpi-card__trend">
                <span
                  class="merch-kpi-card__trend-pill"
                  :class="kpi.trendPositive ? 'merch-kpi-card__trend-pill--pos' : 'merch-kpi-card__trend-pill--neg'"
                >
                  <v-icon size="12">{{ kpi.trendPositive ? 'chevron-up' : 'chevron-down' }}</v-icon>
                  {{ kpi.trend }}
                </span>
              </div>
              <div v-else-if="kpi.subStat" class="merch-kpi-card__sub">{{ kpi.subStat }}</div>
            </div>
            <!-- Sparkline for KPIs with trend data -->
            <div v-if="kpi.trend" class="merch-kpi-card__sparkline-col" aria-hidden="true">
              <svg class="merch-kpi-card__sparkline" viewBox="0 0 100 52" preserveAspectRatio="none">
                <defs>
                  <linearGradient :id="`${sparkId}-fill`" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="currentColor" stop-opacity="0.18" />
                    <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  :points="`0,52 ${revenueSparkline} 100,52`"
                  :fill="`url(#${sparkId}-fill)`"
                  class="merch-kpi-card__sparkline-fill"
                />
                <polyline :points="revenueSparkline" class="merch-kpi-card__sparkline-line" />
              </svg>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main grid: quick actions + things to do -->
    <v-row dense>
      <v-col cols="12" md="8">
        <v-card flat border rounded="lg" class="merch-widget-card h-100">
          <div class="merch-widget-header">
            <div class="merch-widget-header__title">Quick actions</div>
            <div class="merch-widget-header__actions">
              <span class="merch-widget-header__sub">Jump to common tasks</span>
            </div>
          </div>
          <div class="merch-widget-body">
            <v-row dense>
              <v-col v-for="action in quickActions" :key="action.title" cols="6" md="4">
                <div
                  class="merch-action-tile"
                  role="button"
                  tabindex="0"
                  @click="go(action.path)"
                  @keydown.enter="go(action.path)"
                  @keydown.space.prevent="go(action.path)"
                >
                  <div class="merch-action-tile__icon" :class="`merch-action-tile__icon--${action.color}`">
                    <v-icon size="16">{{ action.icon }}</v-icon>
                  </div>
                  <div class="merch-action-tile__title">{{ action.title }}</div>
                  <div class="merch-action-tile__desc">{{ action.desc }}</div>
                </div>
              </v-col>
            </v-row>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card flat border rounded="lg" class="merch-widget-card h-100 d-flex flex-column">
          <div class="merch-widget-header">
            <div class="merch-widget-header__title">Things to do</div>
            <div class="merch-widget-header__actions">
              <span class="merch-widget-header__sub">{{ todoProgress.done }} / {{ todoProgress.total }}</span>
            </div>
          </div>
          <div class="merch-widget-progress">
            <v-progress-linear
              :model-value="todoProgress.pct"
              color="primary"
              height="4"
              rounded
              bg-color="surface-variant"
            />
          </div>
          <v-list :border="false" density="compact" class="merch-todo-list flex-grow-1">
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
                class="merch-list-title"
                :class="{ 'text-decoration-line-through text-medium-emphasis': todo.done }"
              >{{ todo.title }}</v-list-item-title>
              <v-list-item-subtitle class="merch-list-sub">{{ todo.desc }}</v-list-item-subtitle>
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
      <v-col cols="12" md="6">
        <v-card flat border rounded="lg" class="merch-widget-card h-100">
          <div class="merch-widget-header">
            <div class="merch-widget-header__title">Recent recommendation engines</div>
            <div class="merch-widget-header__actions">
              <v-btn
                size="small"
                variant="text"
                class="text-none"
                append-icon="arrow-right"
                @click="go('/recommendations')"
              >
                View all
              </v-btn>
            </div>
          </div>
          <v-list :border="false" density="compact" class="merch-recent-list">
            <v-list-item
              v-for="engine in recentEngines"
              :key="engine.id"
              @click="go('/recommendations')"
            >
              <template #prepend>
                <div class="merch-row-icon">
                  <v-icon size="14">sparkles</v-icon>
                </div>
              </template>
              <v-list-item-title class="merch-list-title">{{ engine.name }}</v-list-item-title>
              <v-list-item-subtitle class="merch-list-sub">{{ ENGINE_TYPE_LABELS[engine.type] }} · updated {{ engine.updatedAt }}</v-list-item-subtitle>
              <template #append>
                <MpStatusChip
                  :status="engine.status === 'active' ? 'Active' : 'Inactive'"
                  type="general"
                  size="x-small"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card flat border rounded="lg" class="merch-widget-card h-100">
          <div class="merch-widget-header">
            <div class="merch-widget-header__title">Recent synonyms</div>
            <div class="merch-widget-header__actions">
              <v-btn
                size="small"
                variant="text"
                class="text-none"
                append-icon="arrow-right"
                @click="go('/search/synonyms')"
              >
                View all
              </v-btn>
            </div>
          </div>
          <v-list :border="false" density="compact" class="merch-recent-list">
            <v-list-item
              v-for="syn in recentSynonyms"
              :key="syn.id"
              @click="go('/search/synonyms')"
            >
              <template #prepend>
                <div class="merch-row-icon merch-row-icon--contacts">
                  <v-icon size="14">repeat</v-icon>
                </div>
              </template>
              <v-list-item-title class="merch-list-title">
                {{ syn.queries.join(', ') }}
                <v-icon v-if="syn.type === 'two_way'" size="12" class="mx-1">arrow-left-right</v-icon>
                <v-icon v-else size="12" class="mx-1">arrow-right</v-icon>
                <span class="text-medium-emphasis">{{ syn.type === 'two_way' ? '(bidirectional)' : syn.leadsTo.join(', ') }}</span>
              </v-list-item-title>
              <v-list-item-subtitle class="merch-list-sub">
                Updated {{ syn.updatedAt }}
              </v-list-item-subtitle>
              <template #append>
                <MpStatusChip
                  :status="syn.status === 'active' ? 'Active' : 'Inactive'"
                  type="general"
                  size="x-small"
                />
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
/* ── Title-level context header ───────────────────────────────── */
.merch-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.merch-header__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.merch-header__title-group {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.merch-header__module {
  font-size: 20px;
  font-weight: 700;
  color: var(--ink);
  white-space: nowrap;
}

.merch-header__divider {
  color: rgba(var(--v-theme-on-surface), 0.35);
  flex-shrink: 0;
}

.merch-header__store-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px 2px 6px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: background 120ms ease;
  min-width: 0;

  &:hover {
    background: rgba(var(--v-theme-on-surface), 0.06);
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: 1px;
  }
}

.merch-header__store-name {
  font-size: 20px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 360px;
}

.merch-header__chevron {
  color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
  opacity: 0.7;
}

.merch-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.merch-header__subtitle {
  font-size: 14px;
  color: var(--muted);
  font-weight: 500;
}

/* ── Shared card chrome (matches DashboardWidgetCard) ──────────── */
.merch-widget-card,
.merch-kpi-card {
  background: var(--surface-1) !important;
  border-color: color-mix(in oklch, var(--ink) 7%, transparent) !important;
  border-radius: var(--r-section) !important;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.02), 0 1px 2px rgba(15, 23, 42, 0.04) !important;
  overflow: hidden;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.merch-widget-card:hover,
.merch-kpi-card:hover {
  border-color: color-mix(in oklch, var(--ink) 18%, transparent) !important;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.06) !important;
}

/* ── Widget card header (matches DashboardWidgetCard header) ────── */
.merch-widget-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 20px 22px 14px;
}

.merch-widget-header__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.merch-widget-header__actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.merch-widget-header__sub {
  font-size: 12.5px;
  color: var(--muted);
  font-weight: 500;
  white-space: nowrap;
}

/* ── Widget body ─────────────────────────────────────────────── */
.merch-widget-body {
  padding: 0 22px 20px;
}

/* ── KPI card (matches DashboardKpiWidget) ───────────────────── */
.merch-kpi-card {
  container-type: inline-size;
}

.merch-kpi-card__inner {
  display: flex;
  align-items: stretch;
  gap: 12px;
  padding: 16px 18px;
  height: 100%;
}

.merch-kpi-card__left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1 1 0;
  min-width: 0;
}

.merch-kpi-card__header-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.merch-kpi-card__icon-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: var(--r-chip);
  background: var(--accent-soft);
  color: var(--accent-ink);
}

.merch-kpi-card__icon-chip--primary {
  background: var(--accent-soft);
  color: var(--accent-ink);
}

.merch-kpi-card__icon-chip--retail {
  background: color-mix(in oklch, var(--cloud-retail-accent) 12%, transparent);
  color: var(--cloud-retail-text);
}

.merch-kpi-card__icon-chip--marketing {
  background: color-mix(in oklch, var(--cloud-marketing-accent) 12%, transparent);
  color: var(--cloud-marketing-text);
}

.merch-kpi-card__icon-chip--contacts {
  background: color-mix(in oklch, var(--cloud-contacts-accent) 12%, transparent);
  color: var(--cloud-contacts-text);
}

.merch-kpi-card__icon-chip--analytics {
  background: color-mix(in oklch, var(--cloud-analytics-accent) 12%, transparent);
  color: var(--cloud-analytics-text);
}

.merch-kpi-card__title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--ink);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.25;
}

.merch-kpi-card__period {
  color: var(--muted);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.merch-kpi-card__value {
  margin-top: 6px;
  font-size: 28px;
  line-height: 1.1;
  letter-spacing: -0.5px;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.merch-kpi-card__trend {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.merch-kpi-card__trend-pill {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.merch-kpi-card__trend-pill--pos { color: var(--pos); }
.merch-kpi-card__trend-pill--neg { color: var(--neg); }

.merch-kpi-card__sub {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  margin-top: 4px;
}

/* Sparkline */
.merch-kpi-card__sparkline-col {
  display: flex;
  align-items: flex-end;
  flex: 0 1 38%;
  max-width: 40%;
  min-width: 70px;
  align-self: stretch;
  padding-top: 8px;
  color: var(--cloud-retail-accent);
}

.merch-kpi-card__sparkline {
  width: 100%;
  height: 88px;
  overflow: visible;
}

.merch-kpi-card__sparkline-line {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}

.merch-kpi-card__sparkline-fill {
  stroke: none;
}

/* ── Quick action tiles ───────────────────────────────────────── */
.merch-action-tile {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border: 1px solid color-mix(in oklch, var(--ink) 8%, transparent);
  border-radius: var(--r-section);
  background: var(--surface-1);
  cursor: pointer;
  transition: border-color 120ms ease, box-shadow 120ms ease;
  height: 100%;
}

.merch-action-tile:hover {
  border-color: color-mix(in oklch, var(--accent) 35%, transparent);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}

.merch-action-tile:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.merch-action-tile__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--r-chip);
  background: var(--accent-soft);
  color: var(--accent-ink);
}

.merch-action-tile__icon--primary {
  background: var(--accent-soft);
  color: var(--accent-ink);
}

.merch-action-tile__icon--retail {
  background: color-mix(in oklch, var(--cloud-retail-accent) 12%, transparent);
  color: var(--cloud-retail-text);
}

.merch-action-tile__icon--marketing {
  background: color-mix(in oklch, var(--cloud-marketing-accent) 12%, transparent);
  color: var(--cloud-marketing-text);
}

.merch-action-tile__icon--contacts {
  background: color-mix(in oklch, var(--cloud-contacts-accent) 12%, transparent);
  color: var(--cloud-contacts-text);
}

.merch-action-tile__icon--analytics {
  background: color-mix(in oklch, var(--cloud-analytics-accent) 12%, transparent);
  color: var(--cloud-analytics-text);
}

.merch-action-tile__icon--warning {
  background: color-mix(in oklch, #f59e0b 12%, transparent);
  color: #b45309;
}

.merch-action-tile__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.25;
}

.merch-action-tile__desc {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.3;
}

/* ── Progress bar ─────────────────────────────────────────────── */
.merch-widget-progress {
  padding: 0 22px 12px;
}

/* ── Lists (todo + recent) ────────────────────────────────────── */
.merch-todo-list,
.merch-recent-list {
  padding: 4px 10px 12px;
  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
}

.merch-todo-list :deep(.v-list-item),
.merch-recent-list :deep(.v-list-item) {
  min-height: 44px;
  padding-block: 8px;
}

.merch-todo-list :deep(.v-list-item__prepend > .v-icon),
.merch-recent-list :deep(.v-list-item__prepend > .v-icon) {
  margin-inline-end: 12px;
}

.merch-todo-list :deep(.v-list-item__prepend > .merch-row-icon),
.merch-recent-list :deep(.v-list-item__prepend > .merch-row-icon) {
  margin-inline-end: 12px;
}

.merch-list-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.3;
}

.merch-list-sub {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  line-height: 1.35;
  opacity: 1 !important;
}

.merch-row-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: var(--r-chip);
  background: color-mix(in oklch, var(--cloud-retail-accent) 12%, transparent);
  color: var(--cloud-retail-text);
}

.merch-row-icon--contacts {
  background: color-mix(in oklch, var(--cloud-contacts-accent) 12%, transparent);
  color: var(--cloud-contacts-text);
}
</style>
