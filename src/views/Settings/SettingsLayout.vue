<script setup lang="ts">
import MpPageHeader from '@/components/MpPageHeader.vue'
import SettingsSidebar from '@/components/settings/SettingsSidebar.vue'
</script>

<template>
  <div class="settings-shell d-flex flex-column h-100">
    <MpPageHeader
      title="Settings"
      subtitle="Manage your account, connections, users, billing, and platform configuration."
    />

    <div class="settings-shell__body">
      <SettingsSidebar />
      <main class="settings-shell__content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings-shell__body {
  flex: 1 1 auto;
  display: flex;
  align-items: stretch;
  min-height: 0;
  margin-top: 8px;
}

.settings-shell__content {
  flex: 1 1 auto;
  min-width: 0;
  overflow-y: auto;
  padding: 4px 0 0 32px;
}
</style>
