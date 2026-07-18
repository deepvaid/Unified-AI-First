<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppBar from '@/components/layout/AppBar.vue'
import MpDaVinciBot from '@/components/MpDaVinciBot.vue'
import {
  useAppTheme,
  applySidebarTheme,
  resolvedShell,
  resolvedFrame,
  setShellOverride,
  setFrameOverride,
  type SidebarTheme,
  type ShellVariant,
  type FramePref,
} from '@/composables/useAppTheme'
import { applyChartPalette, type ChartPalette } from '@/plugins/chartPalette'
import { useCopilotStore } from '@/stores/useCopilot'
import { useAccountsStore } from '@/stores/useAccounts'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { usePlgStore, isPlgDemoPreset } from '@/stores/usePlg'
import PlgTrialBanner from '@/components/plg/PlgTrialBanner.vue'

// Apply stored accent and theme to Vuetify on initial mount
const { accent, mode, setAccent, setMode } = useAppTheme()
setAccent(accent.value)
setMode(mode.value)

const accountsStore = useAccountsStore()
const route = useRoute()

// Sidebar theme: a ?nav=white|gray|dark query param wins over the account's
// preference (for stakeholder demos). Captured in-memory so it sticks across
// in-SPA navigation for this tab, without touching localStorage (which three
// side-by-side tabs would otherwise clobber). Otherwise follow the account.
const VALID_NAV_THEMES: readonly SidebarTheme[] = ['white', 'gray', 'dark']
// Legacy share links used ?nav=light for what is now the White chrome.
const normalizeNavTheme = (v: unknown): SidebarTheme | null => {
  if (v === 'light') return 'white'
  return typeof v === 'string' && (VALID_NAV_THEMES as readonly string[]).includes(v)
    ? (v as SidebarTheme)
    : null
}
const navOverride = ref<SidebarTheme | null>(normalizeNavTheme(route.query.nav))
watch(() => route.query.nav, (nav) => {
  const theme = normalizeNavTheme(nav)
  if (theme) navOverride.value = theme
})
// Rail shell rides the dark sidebar palette; an explicit ?nav= still wins.
watch(
  () => navOverride.value ?? (resolvedShell.value === 'rail' ? 'dark' : (accountsStore.activeAccount.sidebarTheme ?? 'gray')),
  applySidebarTheme,
  { immediate: true },
)

// Shell variant + content frame: ?shell=classic|studio|rail and ?frame=on|off
// query params (stakeholder share links) — same in-memory-per-tab idiom as ?nav=.
const isShellVariant = (v: unknown): v is ShellVariant =>
  v === 'classic' || v === 'studio' || v === 'rail'
const isFramePref = (v: unknown): v is FramePref => v === 'on' || v === 'off'
watch(() => route.query.shell, (s) => {
  if (isShellVariant(s)) setShellOverride(s)
}, { immediate: true })
watch(() => route.query.frame, (f) => {
  if (isFramePref(f)) setFrameOverride(f)
}, { immediate: true })

// Dashboard chart palette: a ?chart=blue|cool|multicolor|multihue query param (stakeholder demo),
// same in-memory-per-tab handling as ?nav=. Independent of, and composes with, ?nav=.
const VALID_CHART_PALETTES: readonly ChartPalette[] = ['blue', 'cool', 'multicolor', 'multihue']
const isChartPalette = (v: unknown): v is ChartPalette =>
  typeof v === 'string' && (VALID_CHART_PALETTES as readonly string[]).includes(v)
const chartOverride = ref<ChartPalette | null>(isChartPalette(route.query.chart) ? route.query.chart : null)
watch(() => route.query.chart, (chart) => {
  if (isChartPalette(chart)) chartOverride.value = chart
})
watch(() => chartOverride.value ?? 'blue', applyChartPalette, { immediate: true })

// PLG demo state: a ?plg=trial-d3|trial-d12|trial-expired|paid-build|...|grace
// query param (stakeholder share links) applies a subscription preset to the
// active account — same idiom as ?nav=, but persisted via the plg store.
const plgStore = usePlgStore()
watch(() => route.query.plg, (p) => {
  if (isPlgDemoPreset(p)) plgStore.applyDemoPreset(p)
}, { immediate: true })

const drawer = ref(true)
// Rail (collapsed) by default in every shell + nav variation. The sidebar
// toggle still works and persists the choice, so an explicit 'expanded'
// preference wins; only that opens the sidebar on load. Auto-collapse rules
// below (narrow viewport, section shells) apply on top.
const manualRailPref = () => localStorage.getItem('app-sidebar-rail')
const rail = ref(manualRailPref() !== 'expanded')
const copilot = useCopilotStore()
const { width, smAndDown } = useDisplay()

watch(width, (w, prevW) => {
  if (prevW === undefined) return
  const isNarrow = w < 1180
  const wasNarrow = prevW < 1180
  if (!wasNarrow && isNarrow && !rail.value) {
    rail.value = true
  }
  // Auto-close sidebar on mobile
  if (w < 768 && prevW >= 768) {
    drawer.value = false
  }
  // Auto-open on desktop return
  if (w >= 768 && prevW < 768) {
    drawer.value = true
  }
})

// Auto-minimize the main sidebar while a section-rail shell (store editor) is on
// screen — two full sidebars is redundant. Fires only on context edges, so a
// manual re-expand inside the shell is respected; the user's prior state is
// restored on exit (unless the narrow-viewport rule forces rail anyway).
const salesChannelsStore = useSalesChannelsStore()
const railBeforeShell = ref<boolean | null>(null)

const inRailShell = computed(() => {
  // Unconditional rail shells (e.g. Settings) mark their parent route directly.
  if (route.meta?.railShell || route.meta?.merchandisingShell) return true
  if (!route.meta?.storeEditor) return false
  const aId = String(route.params.accountId ?? '')
  const cId = String(route.params.channelId ?? '')
  // POS/offline channels render without the shell rail — don't collapse for them.
  return salesChannelsStore.getChannel(aId, cId)?.type === 'web_store'
})

// immediate: deep links straight into the editor collapse on first load too.
watch(inRailShell, (now, was) => {
  if (now && !was) {
    railBeforeShell.value = rail.value
    rail.value = true
  } else if (!now && was) {
    if (railBeforeShell.value === false && width.value >= 1180) {
      rail.value = false
    }
    railBeforeShell.value = null
  }
}, { immediate: true })

const isFullPage = computed(() => !!route.meta?.fullPage)
const isFlush = computed(() => !!route.meta?.flush)
// Rounded content frame — resolvedFrame already folds in the shell's default.
const showFrame = computed(() => resolvedFrame.value && !isFullPage.value && !isFlush.value)
// On mobile, sidebar is a temporary overlay (not permanent)
const sidebarTemporary = computed(() => smAndDown.value)
const sidebarRail = computed(() => rail.value)
const copilotDrawerWidth = computed(() => {
  // Default ~400px to mirror Google Gemini's Gmail side panel; expand to 720px
  // for reviewing widget drafts.
  const target = copilot.isExpanded ? 720 : 400
  return Math.min(target, Math.max(360, width.value - 32))
})
</script>

<template>
  <v-app>
    <!-- Rendered on fullPage routes too: #main-content always exists, and builders
         are exactly where keyboard users need a consistent first tab stop. -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <AppSidebar
      v-if="!isFullPage"
      v-model="drawer"
      :rail="sidebarRail"
      :temporary="sidebarTemporary"
      @update:rail="rail = $event"
    />

    <AppBar v-if="!isFullPage" />

    <v-main
      id="main-content"
      role="main"
      tabindex="-1"
      class="bg-background"
    >
      <PlgTrialBanner v-if="!isFullPage" />
      <div v-if="showFrame" class="mp-content-frame">
        <v-container fluid class="mp-main-shell">
          <router-view />
        </v-container>
      </div>
      <v-container v-else-if="!isFullPage && !isFlush" fluid class="mp-main-shell">
        <router-view />
      </v-container>
      <router-view v-else />
    </v-main>

    <!-- Da Vinci Copilot Drawer — also on fullPage routes (journey/campaign
         builders dock it beside the canvas instead of covering it) -->
    <v-navigation-drawer
      v-model="copilot.isOpen"
      location="right"
      :width="copilotDrawerWidth + 12"
      class="copilot-drawer"
      :style="{
        '--copilot-top': isFullPage ? '4px' : '60px',
        '--copilot-w': copilotDrawerWidth + 'px',
      }"
    >
      <MpDaVinciBot
        @close="copilot.close()"
        @expand="copilot.toggleExpanded()"
      />
    </v-navigation-drawer>
  </v-app>
</template>

<style>
.skip-link {
  position: absolute;
  left: 16px;
  top: -48px;
  z-index: 1000;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 600;
  transition: top 0.2s ease;
}

.skip-link:focus {
  top: 16px;
}

/* Studio frame — the working area floats as one rounded surface on the
   canvas. Sub-shells that size themselves against the viewport subtract
   --mp-frame-offset (top gap + bottom inset); it resolves to 0 outside
   the frame (flush/fullPage routes), so those keep exact old behavior. */
.mp-content-frame {
  /* margins (4 + 12) + borders (2) + the 4px slack the old 52px constant
     absorbed — keeps viewport-sized sub-shells exactly flush inside. */
  --mp-frame-offset: 22px;
  margin: 4px 12px 12px 4px;
  min-height: calc(100vh - 56px - 16px);
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--mp-border-subtle);
  border-radius: var(--mp-component-card-radius-lg);
  overflow: hidden;
}

.mp-main-shell {
  padding: 32px 36px !important;
}

@media (max-width: 1024px) {
  .mp-main-shell {
    padding: 28px !important;
  }
}

@media (max-width: 640px) {
  .mp-main-shell {
    padding: 22px !important;
  }
}

/* Copilot floats as a rounded surface like .mp-content-frame — same 4px top /
   12px right+bottom gutters, radius, border, and soft shadow. Vuetify's layout
   engine sets top/height inline, so override with calc + !important;
   --copilot-top is bound in the template (60px under the app bar, 4px on
   fullPage routes without one). The drawer RESERVES width+12 of layout space
   but RENDERS at --copilot-w with a 12px margin, so the panel keeps a true
   right gutter without overlapping the reserved content band. */
.copilot-drawer {
  top: var(--copilot-top, 60px) !important;
  height: calc(100% - var(--copilot-top, 60px) - 12px) !important;
  width: var(--copilot-w) !important;
  margin-right: 12px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--mp-border-subtle);
  border-radius: var(--mp-component-card-radius-lg);
  box-shadow: var(--mp-shadow-md);
  overflow: hidden;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Closed state: Vuetify's inline translateX misses the 12px margin-right
   (and the shadow), leaving a sliver of the panel visible at the right
   edge. Push it fully off-screen. */
.copilot-drawer.v-navigation-drawer:not(.v-navigation-drawer--active) {
  transform: translateX(calc(100% + 32px)) !important;
}

.copilot-drawer .v-navigation-drawer__content {
  display: flex;
  flex-direction: column;
  overflow: hidden !important;
  border-radius: inherit;
}
</style>
