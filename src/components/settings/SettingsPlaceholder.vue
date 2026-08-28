<script setup lang="ts">
import MpPageHeader from '@/components/MpPageHeader.vue'
import SettingsSection from './SettingsSection.vue'

defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="settings-page">
    <MpPageHeader :level="2" density="compact" :title="title" :subtitle="description" />
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
  gap: var(--mp-space-14);
}

.settings-placeholder__icon {
  color: rgb(var(--v-theme-primary));
  margin-top: var(--mp-space-2);
  flex-shrink: 0;
}

.settings-placeholder__copy {
  min-width: 0;
}

.settings-placeholder__title {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-bold);
  color: var(--text-primary);
  margin-bottom: var(--mp-space-4);
}

.settings-placeholder__sub {
  margin: 0;
  color: var(--muted);
  font-size: var(--mp-fontSize-13);
  line-height: 1.5;
}
</style>
