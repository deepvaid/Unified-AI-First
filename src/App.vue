<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppBar from '@/components/layout/AppBar.vue'
import MpDaVinciBot from '@/components/MpDaVinciBot.vue'
import { useAppTheme, applySidebarTheme, type SidebarTheme } from '@/composables/useAppTheme'
import { applyChartPalette, type ChartPalette } from '@/plugins/chartPalette'
import { useCopilotStore } from '@/stores/useCopilot'
import { useAccountsStore } from '@/stores/useAccounts'

// Apply stored accent and theme to Vuetify on initial mount
const { accent, mode, setAccent, setMode } = useAppTheme()
setAccent(accent.value)
setMode(mode.value)

const accountsStore = useAccountsStore()
const route = useRoute()

// Sidebar theme: a ?nav=light|gray|dark query param wins over the account's
// preference (for stakeholder demos). Captured in-memory so it sticks across
// in-SPA navigation for this tab, without touching localStorage (which three
// side-by-side tabs would otherwise clobber). Otherwise follow the account.
const VALID_NAV_THEMES: readonly SidebarTheme[] = ['light', 'gray', 'dark']
const isNavTheme = (v: unknown): v is SidebarTheme =>
  typeof v === 'string' && (VALID_NAV_THEMES as readonly string[]).includes(v)
const navOverride = ref<SidebarTheme | null>(isNavTheme(route.query.nav) ? route.query.nav : null)
watch(() => route.query.nav, (nav) => {
  if (isNavTheme(nav)) navOverride.value = nav
})
watch(
  () => navOverride.value ?? accountsStore.activeAccount.sidebarTheme ?? 'light',
  applySidebarTheme,
  { immediate: true },
)

// Dashboard chart palette: a ?chart=blue|cool|multicolor query param (stakeholder demo),
// same in-memory-per-tab handling as ?nav=. Independent of, and composes with, ?nav=.
const VALID_CHART_PALETTES: readonly ChartPalette[] = ['blue', 'cool', 'multicolor']
const isChartPalette = (v: unknown): v is ChartPalette =>
  typeof v === 'string' && (VALID_CHART_PALETTES as readonly string[]).includes(v)
const chartOverride = ref<ChartPalette | null>(isChartPalette(route.query.chart) ? route.query.chart : null)
watch(() => route.query.chart, (chart) => {
  if (isChartPalette(chart)) chartOverride.value = chart
})
watch(() => chartOverride.value ?? 'blue', applyChartPalette, { immediate: true })

const drawer = ref(true)
const rail = ref(false)
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

const isFullPage = computed(() => !!route.meta?.fullPage)
const isFlush = computed(() => !!route.meta?.flush)
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
    <a v-if="!isFullPage" href="#main-content" class="skip-link">Skip to main content</a>

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
      <v-container v-if="!isFullPage && !isFlush" fluid class="mp-main-shell">
        <router-view />
      </v-container>
      <router-view v-else />
    </v-main>

    <!-- Da Vinci Copilot Drawer — also on fullPage routes (journey/campaign
         builders dock it beside the canvas instead of covering it) -->
    <v-navigation-drawer
      v-model="copilot.isOpen"
      location="right"
      :width="copilotDrawerWidth"
      class="copilot-drawer"
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

.copilot-drawer {
  border-left: 1px solid var(--mp-border-subtle);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.copilot-drawer .v-navigation-drawer__content {
  display: flex;
  flex-direction: column;
  overflow: hidden !important;
}
</style>
