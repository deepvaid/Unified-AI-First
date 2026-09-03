<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MpSectionRail from '@/components/MpSectionRail.vue'
import { settingsRailGroups } from '@/components/settings/settingsMenu'

const route = useRoute()

const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? '2000290'
})

const groups = computed(() => settingsRailGroups(accountId.value))
</script>

<template>
  <div class="settings-shell mp-frame-fill d-flex">
    <!-- P4-7: was a bespoke SettingsSidebar — a near-verbatim copy of MpSectionRail
         at its own item height. The rail's `title` + `searchable` props were built
         for this flavor; Retail and Merchandising already used them. -->
    <MpSectionRail
      ariaLabel="Settings navigation"
      title="Settings"
      searchable
      search-placeholder="Search Settings"
      :groups="groups"
    />
    <main class="settings-shell__content">
      <router-view />
    </main>
  </div>
</template>

<style scoped lang="scss">
/* .mp-frame-fill owns the bleed-to-edge margins and the frame height; the
   scoped rules only add the flex geometry and the stacked breakpoint. */
.settings-shell {
  align-items: stretch;
}

.settings-shell__content {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: var(--mp-space-24) var(--mp-layout-shellInsetInline) var(--mp-layout-shellInsetBlock) var(--mp-layout-shellInsetBlock);
}

@media (max-width: 1024px) {
  .settings-shell__content {
    padding: var(--mp-space-20) var(--mp-layout-shellInsetMedium) var(--mp-layout-shellInsetMedium) var(--mp-layout-shellInsetMedium);
  }
}

@media (max-width: 900px) {
  .settings-shell {
    flex-direction: column;
    height: auto;
    overflow: visible;
  }

  .settings-shell__content {
    overflow: visible;
  }
}

@media (max-width: 640px) {
  .settings-shell__content {
    padding: var(--mp-space-16) var(--mp-layout-shellInsetCompact) var(--mp-layout-shellInsetCompact) var(--mp-layout-shellInsetCompact);
  }
}
</style>

