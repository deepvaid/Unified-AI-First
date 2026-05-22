<script setup lang="ts">
import SettingsPageHeader from './SettingsPageHeader.vue'
import SettingsSection from './SettingsSection.vue'

defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="settings-page">
    <SettingsPageHeader :title="title" :subtitle="description" />
    <SettingsSection>
      <div class="settings-placeholder">
        <v-icon size="22" class="settings-placeholder__icon">sparkles</v-icon>
        <div class="settings-placeholder__copy">
          <div class="settings-placeholder__title">Coming soon</div>
          <p class="settings-placeholder__sub">
            {{ title }} controls will land here in an upcoming release. The navigation is in
            place so future deep links won't break.
          </p>
        </div>
      </div>
    </SettingsSection>
  </div>
</template>

<style scoped lang="scss">
.settings-placeholder {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.settings-placeholder__icon {
  color: rgb(var(--v-theme-primary));
  margin-top: 2px;
  flex-shrink: 0;
}

.settings-placeholder__copy {
  min-width: 0;
}

.settings-placeholder__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 4px;
}

.settings-placeholder__sub {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}
</style>
