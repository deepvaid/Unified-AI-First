<script setup lang="ts">
import SettingsSidebar from '@/components/settings/SettingsSidebar.vue'
</script>

<template>
  <div class="settings-shell d-flex">
    <SettingsSidebar />
    <main class="settings-shell__content">
      <router-view />
    </main>
  </div>
</template>

<style scoped lang="scss">
.settings-shell {
  margin: -32px -36px;
  height: calc(100vh - 52px);
  overflow: hidden;
  align-items: stretch;
}

.settings-shell__content {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 36px 32px 32px;
}

@media (max-width: 1024px) {
  .settings-shell {
    margin: -28px;
  }
  .settings-shell__content {
    padding: 20px 28px 28px 28px;
  }
}

@media (max-width: 900px) {
  .settings-shell {
    flex-direction: column;
    height: auto;
    min-height: calc(100vh - 52px);
    overflow: visible;
  }

  .settings-shell__content {
    overflow: visible;
  }
}

@media (max-width: 640px) {
  .settings-shell {
    margin: -22px;
  }
  .settings-shell__content {
    padding: 16px 22px 22px 22px;
  }
}
</style>

