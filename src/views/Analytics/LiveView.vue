<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ApexOptions } from 'apexcharts'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import MpKpiCard from '@/components/MpKpiCard.vue'
import { applyChartTheme, chartPalette } from '@/plugins/chartPalette'

const ApexChart = defineAsyncComponent({
  loader: async () => (await import('vue3-apexcharts')).default,
  suspensible: false,
})

// ─── Live data state ────────────────────────────────────────────
const REFRESH_SECONDS = 60
const HISTORY_POINTS = 30

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function jitter(value: number, min: number, max: number, step: number): number {
  const next = value + rand(-step, step)
  return Math.min(max, Math.max(min, next))
}

const now = ref(new Date())
const visitors = ref(rand(3, 9))
const totalSales = ref(rand(80, 320))
const sessions = ref(rand(6, 18))
const orders = ref(rand(0, 4))
const activeCarts = ref(rand(1, 5))
const checkingOut = ref(rand(0, 3))
const purchased = ref(rand(0, 4))

const visitorsHistory = ref<number[]>(
  Array.from({ length: HISTORY_POINTS }, () => rand(2, 12))
)
const ordersHistory = ref<number[]>(
  Array.from({ length: HISTORY_POINTS }, () => rand(0, 3))
)
const salesHistory = ref<number[]>(
  Array.from({ length: HISTORY_POINTS }, () => rand(20, 80))
)
const sessionsHistory = ref<number[]>(
  Array.from({ length: HISTORY_POINTS }, () => rand(4, 18))
)

function buildTimeLabels(): string[] {
  const labels: string[] = []
  const base = Date.now()
  for (let i = HISTORY_POINTS - 1; i >= 0; i--) {
    const d = new Date(base - i * 60_000)
    labels.push(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
  }
  return labels
}

const activityLabels = ref<string[]>(buildTimeLabels())

const secondsLeft = ref(REFRESH_SECONDS)
const isRefreshing = ref(false)
let countdownTimer: number | undefined

function tick(): void {
  visitors.value = jitter(visitors.value, 0, 24, 5)
  totalSales.value = totalSales.value + rand(-30, 90)
  if (totalSales.value < 0) totalSales.value = 0
  sessions.value = jitter(sessions.value, 0, 40, 6)
  orders.value = jitter(orders.value, 0, 12, 2)
  activeCarts.value = jitter(activeCarts.value, 0, 14, 3)
  checkingOut.value = jitter(checkingOut.value, 0, 8, 2)
  purchased.value = purchased.value + (Math.random() < 0.6 ? rand(1, 2) : 0)

  visitorsHistory.value = [...visitorsHistory.value.slice(1), visitors.value]
  ordersHistory.value = [...ordersHistory.value.slice(1), orders.value]
  salesHistory.value = [...salesHistory.value.slice(1), rand(20, 100)]
  sessionsHistory.value = [...sessionsHistory.value.slice(1), sessions.value]
  activityLabels.value = buildTimeLabels()
  now.value = new Date()
}

async function refreshNow(): Promise<void> {
  if (isRefreshing.value) return
  isRefreshing.value = true
  tick()
  await new Promise((resolve) => setTimeout(resolve, 450))
  isRefreshing.value = false
  secondsLeft.value = REFRESH_SECONDS
}

onMounted(() => {
  countdownTimer = window.setInterval(() => {
    if (isRefreshing.value) return
    if (secondsLeft.value <= 1) {
      void refreshNow()
    } else {
      secondsLeft.value -= 1
    }
  }, 1000)
})

onBeforeUnmount(() => {
  if (countdownTimer != null) window.clearInterval(countdownTimer)
})

// ─── Chart-ready (defer mount for smoother perf) ───────────────
const chartReady = ref(false)
let deferredHandle: number | undefined
onMounted(() => {
  if (typeof window === 'undefined') {
    chartReady.value = true
    return
  }
  const reveal = () => { chartReady.value = true }
  if (typeof requestIdleCallback === 'function') {
    deferredHandle = requestIdleCallback(reveal, { timeout: 500 }) as unknown as number
    return
  }
  deferredHandle = setTimeout(reveal, 0) as unknown as number
})
onBeforeUnmount(() => {
  if (deferredHandle == null) return
  if (typeof cancelIdleCallback === 'function') {
    cancelIdleCallback(deferredHandle)
    return
  }
  clearTimeout(deferredHandle)
})

// ─── Derived display ───────────────────────────────────────────
const justNowLabel = computed(() => {
  const seconds = Math.floor((Date.now() - now.value.getTime()) / 1000)
  if (seconds < 5) return 'Just now'
  if (seconds < 60) return `${seconds}s ago`
  return `${Math.floor(seconds / 60)}m ago`
})

const formattedSales = computed(() => `$${totalSales.value.toLocaleString()}`)

const refreshProgress = computed(
  () => ((REFRESH_SECONDS - secondsLeft.value) / REFRESH_SECONDS) * 100,
)

// ─── Sparkline factory ─────────────────────────────────────────
function sparklineOptions(color: string): ApexOptions {
  return {
    chart: {
      type: 'area',
      sparkline: { enabled: true },
      animations: { enabled: false },
    },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.4, opacityTo: 0, stops: [0, 100] },
    },
    colors: [color],
    tooltip: { enabled: false },
  }
}

// visitors=cyan, sales=emerald, sessions=indigo, orders=magenta
const visitorsSparkOptions = computed(() => sparklineOptions(chartPalette[0]!))
const salesSparkOptions = computed(() => sparklineOptions(chartPalette[3]!))
const sessionsSparkOptions = computed(() => sparklineOptions(chartPalette[5]!))
const ordersSparkOptions = computed(() => sparklineOptions(chartPalette[1]!))

// ─── Activity area chart ─────────────────────────────────────── cyan + magenta
const activityBase = applyChartTheme()
const activityOptions = computed<ApexOptions>(() => ({
  ...activityBase,
  colors: [chartPalette[0]!, chartPalette[1]!],
  chart: {
    ...activityBase.chart,
    zoom: { enabled: false },
    animations: { enabled: false },
    redrawOnParentResize: true,
  },
  stroke: { curve: 'smooth', width: 3 },
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 0.18, opacityFrom: 0.36, opacityTo: 0.02, stops: [0, 96, 100] },
  },
  dataLabels: { enabled: false },
  legend: {
    show: true,
    position: 'top',
    horizontalAlign: 'right',
    fontSize: '12px',
    labels: { colors: 'rgba(var(--v-theme-on-surface), 0.72)' },
    markers: { strokeWidth: 0 },
  },
  xaxis: {
    ...activityBase.xaxis,
    categories: activityLabels.value,
    labels: {
      ...activityBase.xaxis?.labels,
      style: { colors: 'rgba(var(--v-theme-on-surface), 0.54)', fontSize: '11px' },
      rotate: 0,
      hideOverlappingLabels: true,
    },
    tickAmount: 6,
  },
  yaxis: {
    labels: {
      style: { colors: 'rgba(var(--v-theme-on-surface), 0.54)', fontSize: '11px' },
      formatter: (v: number) => `${Math.round(v)}`,
    },
  },
  tooltip: { ...activityBase.tooltip },
}))

const activitySeries = computed(() => [
  { name: 'Visitors', data: visitorsHistory.value },
  { name: 'Orders', data: ordersHistory.value },
])

// ─── Donut: New vs returning ───────────────────────────────────
const customerMixSeries = computed(() => {
  const total = Math.max(1, sessions.value * 2 + 8)
  const returning = Math.max(2, Math.round(total * 0.38))
  const fresh = total - returning
  return [fresh, returning]
})

// donut: cyan (new) + purple (returning)
const donutOptions = computed<ApexOptions>(() => ({
  chart: { fontFamily: 'Inter, system-ui, sans-serif', toolbar: { show: false } },
  labels: ['New', 'Returning'],
  colors: [chartPalette[0]!, chartPalette[2]!],
  legend: {
    position: 'bottom',
    fontSize: '12px',
    labels: { colors: 'rgba(var(--v-theme-on-surface), 0.72)' },
    markers: { strokeWidth: 0 },
  },
  dataLabels: { enabled: false },
  stroke: { width: 0 },
  plotOptions: {
    pie: {
      donut: {
        size: '70%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Sessions',
            fontSize: '12px',
            color: 'rgba(var(--v-theme-on-surface), 0.6)',
            formatter: () => `${(customerMixSeries.value[0] ?? 0) + (customerMixSeries.value[1] ?? 0)}`,
          },
          value: {
            fontSize: '20px',
            fontWeight: 700,
            color: 'rgb(var(--v-theme-on-surface))',
          },
        },
      },
    },
  },
  tooltip: { theme: 'light' },
}))

// ─── Map + locations (mock) ────────────────────────────────────
const topLocations = computed(() => [
  { flag: '🇺🇸', name: 'United States', city: 'New York', sessions: Math.max(0, sessions.value + rand(2, 6)), lat: 40.71, lng: -74.01 },
  { flag: '🇬🇧', name: 'United Kingdom', city: 'London', sessions: Math.max(0, Math.round(sessions.value * 0.6) + rand(0, 3)), lat: 51.51, lng: -0.13 },
  { flag: '🇨🇦', name: 'Canada', city: 'Toronto', sessions: Math.max(0, Math.round(sessions.value * 0.45) + rand(0, 2)), lat: 43.65, lng: -79.38 },
  { flag: '🇦🇺', name: 'Australia', city: 'Sydney', sessions: Math.max(0, Math.round(sessions.value * 0.32) + rand(0, 2)), lat: -33.87, lng: 151.21 },
  { flag: '🇩🇪', name: 'Germany', city: 'Berlin', sessions: Math.max(0, Math.round(sessions.value * 0.22) + rand(0, 1)), lat: 52.52, lng: 13.41 },
])

function pinSize(sessions: number): number {
  if (sessions >= 15) return 16
  if (sessions >= 8) return 13
  if (sessions >= 3) return 11
  return 9
}

// ─── Leaflet map instance ──────────────────────────────────────
const mapContainer = ref<HTMLDivElement | null>(null)
let leafletMap: L.Map | null = null
let markers: L.Marker[] = []

function buildMarkerIcon(size: number, sessions: number, label: string): L.DivIcon {
  const container = size + 24
  return L.divIcon({
    className: 'live-map__marker',
    html: `
      <div class="live-map__pin" style="--pin-size: ${size}px;">
        <span class="live-map__pin-pulse"></span>
        <span class="live-map__pin-dot" aria-label="${label}: ${sessions} sessions"></span>
      </div>
    `,
    iconSize: [container, container],
    iconAnchor: [container / 2, container / 2],
    popupAnchor: [0, -size / 2 - 4],
  })
}

function buildPopupHtml(loc: { flag: string; city: string; name: string; sessions: number }): string {
  return `
    <div class="live-map__popup">
      <div class="live-map__popup-title">
        <span class="live-map__popup-flag">${loc.flag}</span>
        <span>${loc.city}</span>
      </div>
      <div class="live-map__popup-meta">${loc.name} · ${loc.sessions} sessions</div>
    </div>
  `
}

function renderMarkers(): void {
  if (!leafletMap) return
  const locs = topLocations.value
  for (let i = 0; i < locs.length; i++) {
    const loc = locs[i]!
    const size = pinSize(loc.sessions)
    const icon = buildMarkerIcon(size, loc.sessions, loc.name)
    const popupHtml = buildPopupHtml(loc)
    const existing = markers[i]
    if (existing) {
      existing.setIcon(icon)
      existing.setPopupContent(popupHtml)
    } else {
      const marker = L.marker([loc.lat, loc.lng], { icon, keyboard: false })
        .addTo(leafletMap)
        .bindPopup(popupHtml, { closeButton: false, className: 'live-map__popup-wrap' })
      marker.on('mouseover', () => marker.openPopup())
      marker.on('mouseout', () => marker.closePopup())
      markers.push(marker)
    }
  }
}

onMounted(() => {
  if (!mapContainer.value) return
  leafletMap = L.map(mapContainer.value, {
    center: [25, 10],
    zoom: 1,
    minZoom: 1,
    maxZoom: 10,
    zoomSnap: 0.5,
    worldCopyJump: true,
    attributionControl: true,
    zoomControl: true,
  })
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
  }).addTo(leafletMap)
  renderMarkers()

  const bounds = L.latLngBounds(topLocations.value.map((l) => [l.lat, l.lng] as [number, number]))
  if (bounds.isValid()) {
    leafletMap.fitBounds(bounds, { padding: [28, 28], maxZoom: 3, animate: false })
  }
})

onBeforeUnmount(() => {
  markers.forEach((m) => m.remove())
  markers = []
  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
  }
})

watch(topLocations, () => {
  renderMarkers()
}, { deep: true })

const topProducts = computed(() => [
  { name: 'Aurora Wireless Headphones', revenue: 1240 + rand(-80, 120) },
  { name: 'Linen Crew Tee — Sand', revenue: 860 + rand(-60, 90) },
  { name: 'Cedar Pour-Over Kettle', revenue: 720 + rand(-50, 70) },
  { name: 'Trail Runner GTX', revenue: 540 + rand(-40, 60) },
  { name: 'Minimal Leather Wallet', revenue: 320 + rand(-30, 40) },
])

const recentActivity = computed(() => [
  { icon: 'shopping-cart', color: 'primary', label: 'Cart updated', meta: `Toronto, CA · ${rand(1, 30)}s ago` },
  { icon: 'credit-card', color: 'success', label: 'Order placed', meta: `New York, US · ${rand(15, 60)}s ago` },
  { icon: 'eye', color: 'info', label: 'Viewing product', meta: `Berlin, DE · ${rand(20, 80)}s ago` },
  { icon: 'user-plus', color: 'secondary', label: 'New visitor', meta: `Sydney, AU · ${rand(30, 90)}s ago` },
  { icon: 'shopping-cart', color: 'warning', label: 'Cart abandoned', meta: `London, UK · ${rand(40, 120)}s ago` },
])
</script>

<template>
  <div class="live-view d-flex flex-column gap-5">
    <!-- Header -->
    <div class="d-flex flex-wrap align-center justify-space-between gap-3">
      <div class="d-flex align-center gap-3">
        <v-icon size="28" color="primary">radio</v-icon>
        <div>
          <div class="text-h5 font-weight-bold">Live View</div>
          <div class="d-flex align-center gap-2 mt-1">
            <span class="live-dot" />
            <span class="text-caption text-medium-emphasis">{{ justNowLabel }}</span>
          </div>
        </div>
      </div>
      <div class="d-flex align-center gap-2">
        <v-text-field
          density="compact"
          variant="outlined"
          hide-details
          placeholder="Search location"
          prepend-inner-icon="search"
          class="live-view__search"
        />
        <v-tooltip location="bottom" :text="isRefreshing ? 'Refreshing…' : `Refreshing in ${secondsLeft}s · click to refresh now`">
          <template #activator="{ props: tipProps }">
            <v-btn
              v-bind="tipProps"
              variant="outlined"
              rounded="lg"
              class="live-view__refresh text-none"
              :loading="isRefreshing"
              :disabled="isRefreshing"
              @click="refreshNow"
            >
              <template #prepend>
                <div class="live-view__refresh-progress">
                  <v-progress-circular
                    :model-value="refreshProgress"
                    size="20"
                    width="2"
                    color="primary"
                    bg-color="rgba(var(--v-theme-on-surface), 0.12)"
                  />
                  <v-icon size="12" class="live-view__refresh-icon">refresh-cw</v-icon>
                </div>
              </template>
              <span class="text-body-2">{{ isRefreshing ? 'Refreshing' : `${secondsLeft}s` }}</span>
            </v-btn>
          </template>
        </v-tooltip>
        <v-btn variant="flat" icon="maximize" rounded="lg" color="surface" />
      </div>
    </div>

    <!-- KPI strip -->
    <v-row dense>
      <v-col cols="12" sm="6" md="3">
        <MpKpiCard
          label="Visitors right now"
          :value="visitors"
          icon="users"
          color="primary"
        >
          <div class="mt-3 live-spark">
            <ApexChart
              v-if="chartReady"
              type="area"
              height="48"
              width="100%"
              :options="visitorsSparkOptions"
              :series="[{ name: 'Visitors', data: visitorsHistory }]"
            />
          </div>
        </MpKpiCard>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <MpKpiCard
          label="Total sales"
          :value="formattedSales"
          icon="receipt"
          color="success"
        >
          <div class="mt-3 live-spark">
            <ApexChart
              v-if="chartReady"
              type="area"
              height="48"
              width="100%"
              :options="salesSparkOptions"
              :series="[{ name: 'Sales', data: salesHistory }]"
            />
          </div>
        </MpKpiCard>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <MpKpiCard
          label="Sessions"
          :value="sessions"
          icon="laptop"
          color="info"
        >
          <div class="mt-3 live-spark">
            <ApexChart
              v-if="chartReady"
              type="area"
              height="48"
              width="100%"
              :options="sessionsSparkOptions"
              :series="[{ name: 'Sessions', data: sessionsHistory }]"
            />
          </div>
        </MpKpiCard>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <MpKpiCard
          label="Orders"
          :value="orders"
          icon="package"
          color="secondary"
        >
          <div class="mt-3 live-spark">
            <ApexChart
              v-if="chartReady"
              type="area"
              height="48"
              width="100%"
              :options="ordersSparkOptions"
              :series="[{ name: 'Orders', data: ordersHistory }]"
            />
          </div>
        </MpKpiCard>
      </v-col>
    </v-row>

    <!-- Customer behavior funnel -->
    <v-card variant="flat" border rounded="lg" class="pa-6">
      <div class="text-subtitle-2 text-medium-emphasis mb-4">Customer behavior</div>
      <div class="d-flex align-center gap-4 funnel">
        <div class="funnel__step">
          <div class="text-caption text-medium-emphasis">Active carts</div>
          <div class="text-h4 font-weight-bold">{{ activeCarts }}</div>
        </div>
        <v-icon class="funnel__arrow">chevron-right</v-icon>
        <div class="funnel__step">
          <div class="text-caption text-medium-emphasis">Checking out</div>
          <div class="text-h4 font-weight-bold">{{ checkingOut }}</div>
        </div>
        <v-icon class="funnel__arrow">chevron-right</v-icon>
        <div class="funnel__step">
          <div class="text-caption text-medium-emphasis">Purchased</div>
          <div class="text-h4 font-weight-bold">{{ purchased }}</div>
        </div>
      </div>
    </v-card>

    <!-- Two-column body -->
    <v-row dense>
      <v-col cols="12" md="5">
        <div class="d-flex flex-column gap-4">
          <!-- Sessions by location (map) -->
          <v-card variant="flat" border rounded="lg" class="pa-5">
            <div class="d-flex align-center justify-space-between mb-3">
              <div>
                <div class="text-subtitle-2 font-weight-bold">Sessions by location</div>
                <div class="text-caption text-medium-emphasis">Top markets right now</div>
              </div>
              <v-chip size="x-small" variant="tonal" color="success" prepend-icon="circle">
                Live
              </v-chip>
            </div>

            <div class="live-map">
              <div ref="mapContainer" class="live-map__leaflet" />
            </div>

            <div class="live-map__legend mt-4">
              <div
                v-for="loc in topLocations"
                :key="`leg-${loc.name}`"
                class="live-map__legend-row"
              >
                <span class="live-flag">{{ loc.flag }}</span>
                <span class="text-body-2 flex-grow-1">{{ loc.name }}</span>
                <span class="text-body-2 font-weight-medium">{{ loc.sessions }}</span>
              </div>
            </div>
          </v-card>

          <!-- New vs returning -->
          <v-card variant="flat" border rounded="lg" class="pa-5">
            <div class="text-subtitle-2 font-weight-bold mb-2">New vs returning customers</div>
            <ApexChart
              v-if="chartReady"
              type="donut"
              height="220"
              width="100%"
              :options="donutOptions"
              :series="customerMixSeries"
            />
          </v-card>

          <!-- Top products -->
          <v-card variant="flat" border rounded="lg" class="pa-5">
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="text-subtitle-2 font-weight-bold">Top products by sales</div>
              <span class="text-caption text-medium-emphasis">Revenue</span>
            </div>
            <div class="live-rows">
              <div
                v-for="(p, i) in topProducts"
                :key="p.name"
                class="live-row"
              >
                <div class="live-rank">{{ i + 1 }}</div>
                <span class="text-body-2 flex-grow-1">{{ p.name }}</span>
                <span class="text-body-2 font-weight-medium">${{ p.revenue.toLocaleString() }}</span>
              </div>
            </div>
          </v-card>
        </div>
      </v-col>

      <v-col cols="12" md="7">
        <div class="d-flex flex-column gap-4 h-100">
          <!-- Real-time activity chart -->
          <v-card variant="flat" border rounded="lg" class="pa-5 flex-grow-1 d-flex flex-column">
            <div class="d-flex align-center justify-space-between mb-2">
              <div>
                <div class="text-subtitle-2 font-weight-bold">Real-time activity</div>
                <div class="text-caption text-medium-emphasis">Last 30 minutes</div>
              </div>
              <v-chip size="small" variant="tonal" color="success" prepend-icon="circle">
                Live
              </v-chip>
            </div>
            <div class="flex-grow-1" style="min-height: 320px;">
              <ApexChart
                v-if="chartReady"
                type="area"
                height="100%"
                width="100%"
                :options="activityOptions"
                :series="activitySeries"
              />
            </div>
          </v-card>

          <!-- Recent activity feed -->
          <v-card variant="flat" border rounded="lg" class="pa-5">
            <div class="text-subtitle-2 font-weight-bold mb-3">Recent activity</div>
            <div class="live-rows">
              <div
                v-for="(a, i) in recentActivity"
                :key="`${a.label}-${i}`"
                class="live-row"
              >
                <v-avatar size="32" :color="a.color" variant="tonal">
                  <v-icon size="18">{{ a.icon }}</v-icon>
                </v-avatar>
                <div class="flex-grow-1 d-flex flex-column">
                  <span class="text-body-2 font-weight-medium">{{ a.label }}</span>
                  <span class="text-caption text-medium-emphasis">{{ a.meta }}</span>
                </div>
              </div>
            </div>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped lang="scss">
.live-view {
  width: 100%;
}

/* Match KPI cards to the main dashboard's white-on-linen style.
   MbStatCard's tone="soft"/"warm" props would otherwise paint pale-cyan or
   cream fills which look inconsistent with the unified palette. */
:deep(.mb-stat-card) {
  --mb-stat-bg: rgb(var(--v-theme-surface)) !important;
  --mb-stat-border: rgb(var(--v-theme-outline-variant)) !important;
}

.live-view__search {
  width: 240px;
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgb(var(--v-theme-success));
  box-shadow: 0 0 0 0 rgba(var(--v-theme-success), 0.6);
  animation: live-pulse 1.6s ease-out infinite;
}

@keyframes live-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(var(--v-theme-success), 0.55); }
  70%  { box-shadow: 0 0 0 10px rgba(var(--v-theme-success), 0); }
  100% { box-shadow: 0 0 0 0 rgba(var(--v-theme-success), 0); }
}

.live-spark {
  margin-left: -8px;
  margin-right: -8px;
  overflow: hidden;
  width: calc(100% + 16px);
}

.funnel {
  flex-wrap: wrap;
}

.funnel__step {
  flex: 1 1 0;
  min-width: 140px;
  padding: var(--mp-spacing-4) var(--mp-spacing-5);
  border-radius: var(--mp-borderRadius-lg);
  background: rgba(var(--v-theme-surface-variant), 0.45);
  border: 1px solid rgba(var(--v-theme-border), 0.6);
}

.funnel__arrow {
  color: rgba(var(--v-theme-on-surface), 0.4);
}

.live-flag {
  font-size: 20px;
  line-height: 1;
}

.live-rank {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-surface-variant), 0.85);
  border: 1px solid rgba(var(--v-theme-border), 0.7);
  font-size: var(--mp-typography-fontSize-xs);
  font-weight: var(--mp-typography-fontWeight-semibold);
  color: rgba(var(--v-theme-on-surface), 0.72);
  flex-shrink: 0;
}

// ─── List rows (no v-list wrapper border) ──────────────────────
.live-rows {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-2);
}

.live-row {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-3);
  padding: var(--mp-spacing-2) 0;
  min-height: 36px;
}

// ─── Refresh button with circular progress ─────────────────────
.live-view__refresh {
  min-width: 92px;
  padding-inline: 12px;
}

.live-view__refresh-progress {
  position: relative;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 6px;
}

.live-view__refresh-icon {
  position: absolute;
  color: rgba(var(--v-theme-on-surface), 0.65);
}

// ─── Map widget ────────────────────────────────────────────────
.live-map {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 1;
  border-radius: var(--mp-borderRadius-lg);
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-border), 0.6);
}

.live-map__leaflet {
  width: 100%;
  height: 100%;
  z-index: 0;
  background: rgba(var(--v-theme-surface-variant), 0.35);
}

:deep(.live-map__marker) {
  background: transparent !important;
  border: none !important;
}

:deep(.live-map__marker .live-map__pin) {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.live-map__pin-dot) {
  position: relative;
  display: block;
  width: var(--pin-size, 10px);
  height: var(--pin-size, 10px);
  border-radius: 999px;
  background: rgb(var(--v-theme-primary));
  border: 2px solid rgb(var(--v-theme-surface));
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.22);
  z-index: 1;
}

:deep(.live-map__pin-pulse) {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--pin-size, 10px);
  height: var(--pin-size, 10px);
  border-radius: 999px;
  background: rgb(var(--v-theme-primary));
  transform: translate(-50%, -50%);
  opacity: 0.5;
  animation: live-map-pulse 2.2s ease-out infinite;
  pointer-events: none;
}

@keyframes live-map-pulse {
  0%   { transform: translate(-50%, -50%) scale(1);   opacity: 0.5; }
  80%  { transform: translate(-50%, -50%) scale(3.2); opacity: 0; }
  100% { transform: translate(-50%, -50%) scale(3.2); opacity: 0; }
}

// Leaflet controls & popup styling to match the UI
:deep(.leaflet-control-attribution) {
  font-size: 10px;
  opacity: 0.7;
  background: rgba(var(--v-theme-surface), 0.8) !important;
}

:deep(.leaflet-control-zoom) {
  border: 1px solid rgba(var(--v-theme-border), 0.6) !important;
  border-radius: var(--mp-borderRadius-md) !important;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06) !important;
}

:deep(.leaflet-control-zoom a) {
  background: rgb(var(--v-theme-surface)) !important;
  color: rgba(var(--v-theme-on-surface), 0.75) !important;
  border-bottom: 1px solid rgba(var(--v-theme-border), 0.4) !important;

  &:hover {
    background: rgba(var(--v-theme-surface-variant), 0.9) !important;
    color: rgb(var(--v-theme-on-surface)) !important;
  }
}

:deep(.leaflet-popup-content-wrapper) {
  border-radius: var(--mp-borderRadius-md) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14) !important;
  padding: 2px 4px !important;
  background: rgb(var(--v-theme-surface)) !important;
}

:deep(.leaflet-popup-content) {
  margin: 8px 10px !important;
  font-size: var(--mp-typography-fontSize-xs);
  line-height: 1.35;
  color: rgb(var(--v-theme-on-surface));
}

:deep(.leaflet-popup-tip) {
  background: rgb(var(--v-theme-surface)) !important;
  box-shadow: none !important;
}

:deep(.live-map__popup-title) {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: var(--mp-typography-fontWeight-semibold);
}

:deep(.live-map__popup-flag) {
  font-size: 16px;
  line-height: 1;
}

:deep(.live-map__popup-meta) {
  color: rgba(var(--v-theme-on-surface), 0.62);
  margin-top: 2px;
}

.live-map__legend {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-1);
}

.live-map__legend-row {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-3);
  padding: 4px 0;
}
</style>
