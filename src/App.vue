<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppBar from '@/components/layout/AppBar.vue'
import MpDaVinciBot from '@/components/MpDaVinciBot.vue'
import { useAppTheme } from '@/composables/useAppTheme'
import { useCopilotStore } from '@/stores/useCopilot'

// Apply stored accent and theme to Vuetify on initial mount
const { accent, mode, setAccent, setMode } = useAppTheme()
setAccent(accent.value)
setMode(mode.value)

const route = useRoute()
const drawer = ref(true)
const rail = ref(true)
const copilot = useCopilotStore()
const { width } = useDisplay()

watch(width, (w, prevW) => {
  if (prevW === undefined) return
  const isNarrow = w < 1180
  const wasNarrow = prevW < 1180
  if (!wasNarrow && isNarrow && !rail.value) {
    rail.value = true
  }
})

const isFullPage = computed(() => !!route.meta?.fullPage)
const sidebarRail = computed(() => rail.value)
const copilotDrawerWidth = computed(() => {
  const target = copilot.isExpanded ? 880 : 480
  return Math.min(target, Math.max(320, width.value - 32))
})
</script>

<template>
  <v-app>
    <a v-if="!isFullPage" href="#main-content" class="skip-link">Skip to main content</a>

    <AppSidebar
      v-if="!isFullPage"
      v-model="drawer"
      :rail="sidebarRail"
      @update:rail="rail = $event"
    />

    <AppBar v-if="!isFullPage" />

    <v-main
      id="main-content"
      role="main"
      tabindex="-1"
      class="bg-background"
    >
      <v-container v-if="!isFullPage" fluid class="mp-main-shell">
        <router-view />
      </v-container>
      <router-view v-else />
    </v-main>

    <!-- Da Vinci Copilot Drawer -->
    <v-navigation-drawer
      v-if="!isFullPage"
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
