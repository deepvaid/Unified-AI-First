<script setup lang="ts">
import MpListRow from '@/components/MpListRow.vue'
import type { AppNotification } from '@/stores/useNotifications'

// One row for both notification surfaces (the app-bar panel and the
// notifications page). Internal component — not part of the Mp* inventory,
// same convention as layout/ and copilot/.
const props = defineProps<{
  notification: AppNotification
}>()

const emit = defineEmits<{
  /** Row activated — mark it read (and navigate, if the surface wants to). */
  select: []
  /** The trailing download action on report/export rows. */
  download: []
}>()
</script>

<template>
  <MpListRow variant="divided" clickable @click="emit('select')">
    <template #lead>
      <!-- One generic disc — the real notification feed carries no
           classification, so severity iconography would be invented. -->
      <span class="notification-row__disc" aria-hidden="true">
        <v-icon size="14">bell</v-icon>
      </span>
    </template>
    <div class="notification-row__body">
      <div class="notification-row__title" :class="{ 'notification-row__title--unread': !props.notification.read }">
        <span v-if="!props.notification.read" class="d-sr-only">Unread — </span>
        {{ props.notification.title }}
      </div>
      <div class="notification-row__time">{{ props.notification.time }}</div>
    </div>
    <template #trailing>
      <div class="notification-row__trailing">
        <v-btn
          v-if="props.notification.downloadable"
          icon="download"
          variant="text"
          size="x-small"
          class="text-medium-emphasis"
          :aria-label="`Download — ${props.notification.title}`"
          @click.stop="emit('download')"
        />
        <span v-if="!props.notification.read" class="notification-row__dot" aria-hidden="true" />
      </div>
    </template>
  </MpListRow>
</template>

<style scoped>
.notification-row__disc {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-28);
  height: var(--mp-space-28);
  border-radius: var(--mp-radius-full);
  background: var(--surface-secondary);
  color: var(--text-muted);
  flex-shrink: 0;
}

.notification-row__body {
  min-width: 0;
}

.notification-row__title {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-medium);
  line-height: 1.35;
  color: var(--text-primary);
  /* The UAT centre truncates long messages; two lines keeps them readable
     without letting an import summary take over the panel. */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-row__title--unread {
  font-weight: var(--mp-fontWeight-semibold);
}

.notification-row__time {
  margin-top: var(--mp-space-2);
  font-size: var(--mp-fontSize-12);
  color: var(--text-muted);
}

.notification-row__trailing {
  display: flex;
  align-items: center;
  gap: var(--mp-space-6);
}

.notification-row__dot {
  display: inline-block;
  width: var(--mp-space-8);
  height: var(--mp-space-8);
  border-radius: var(--mp-radius-full);
  background: var(--accent);
  flex-shrink: 0;
}
</style>
