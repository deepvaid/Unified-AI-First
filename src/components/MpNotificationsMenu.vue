<script setup lang="ts">
import { mergeProps } from 'vue'
import { storeToRefs } from 'pinia'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpListRow from '@/components/MpListRow.vue'
import { useNotifications, type NotificationSeverity } from '@/stores/useNotifications'

// The trigger lives inside a v-menu activator, so attrs (e.g. the app bar's
// `appbar-action-btn` class) are forwarded to the bell button explicitly.
defineOptions({ inheritAttrs: false })

const store = useNotifications()
const { items, unreadCount } = storeToRefs(store)

const SEVERITY_LABELS: Record<NotificationSeverity, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
}
</script>

<template>
  <v-menu location="bottom end" :close-on-content-click="false">
    <template #activator="{ props: menuProps }">
      <v-tooltip text="Notifications" location="bottom">
        <template #activator="{ props: tipProps }">
          <!-- Badge wraps the button (the app's v-badge convention) so it needs
               no z-index against sibling controls. -->
          <v-badge
            :model-value="unreadCount > 0"
            :content="unreadCount"
            color="error"
            location="top end"
            offset-x="8"
            offset-y="6"
            class="mp-notifications__badge"
          >
            <v-btn
              v-bind="mergeProps(menuProps, tipProps, $attrs)"
              icon
              variant="text"
              aria-haspopup="dialog"
              :aria-label="unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'"
            >
              <v-icon>bell</v-icon>
            </v-btn>
          </v-badge>
        </template>
      </v-tooltip>
    </template>

    <v-card role="dialog" aria-label="Notifications" width="360" class="mp-notifications__panel">
      <header class="mp-notifications__header">
        <span class="mp-notifications__heading" role="heading" aria-level="2">Notifications</span>
        <v-btn
          variant="text"
          size="small"
          class="text-none"
          :disabled="unreadCount === 0"
          @click="store.markAllRead()"
        >
          Mark all read
        </v-btn>
      </header>

      <div v-if="items.length" class="mp-notifications__list">
        <MpListRow
          v-for="n in items"
          :key="n.id"
          variant="divided"
          clickable
          @click="store.markRead(n.id)"
        >
          <template #lead>
            <span
              class="mp-notifications__disc"
              :class="`mp-notifications__disc--${n.severity}`"
              aria-hidden="true"
            >
              <v-icon size="14">{{ n.icon }}</v-icon>
            </span>
          </template>
          <div class="mp-notifications__body">
            <div class="mp-notifications__title" :class="{ 'mp-notifications__title--unread': !n.read }">
              <span class="d-sr-only">{{ n.read ? '' : 'Unread — ' }}{{ SEVERITY_LABELS[n.severity] }}: </span>
              {{ n.title }}
            </div>
            <div class="mp-notifications__sub">{{ n.context }} · {{ n.time }}</div>
          </div>
          <template #trailing>
            <span v-if="!n.read" class="mp-notifications__dot" aria-hidden="true" />
          </template>
        </MpListRow>
      </div>

      <MpEmptyState
        v-else
        icon="bell-off"
        title="You're all caught up"
        description="New activity across your account will land here."
        :heading-level="3"
      />
    </v-card>
  </v-menu>
</template>

<style scoped>
.mp-notifications__badge :deep(.v-badge__badge) {
  height: var(--mp-space-16);
  min-width: var(--mp-space-16);
  padding-inline: var(--mp-space-4);
  font-size: var(--mp-fontSize-10);
  line-height: var(--mp-space-16);
  /* A solid semantic fill states its ink (P5.5). */
  background: var(--neg) !important;
  color: var(--on-neg) !important;
  box-shadow: 0 0 0 2px var(--surface-primary);
}

/* Panel chrome (surface, border, radius, shadow) comes from the global
   popover rule — this block only owns the internal layout. */
.mp-notifications__panel {
  display: flex;
  flex-direction: column;
}

.mp-notifications__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-8);
  padding: var(--mp-space-8) var(--mp-space-8) var(--mp-space-8) var(--mp-space-16);
  border-bottom: 1px solid var(--border-subtle);
}

.mp-notifications__heading {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
}

.mp-notifications__list {
  padding: var(--mp-space-4);
  max-height: 420px;
  overflow-y: auto;
}

.mp-notifications__disc {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-28);
  height: var(--mp-space-28);
  border-radius: var(--mp-radius-full);
  flex-shrink: 0;
}

/* Severity tints mirror DashboardAttentionWidget — one severity vocabulary,
   one color treatment. */
.mp-notifications__disc--critical {
  background: color-mix(in oklch, rgb(var(--v-theme-error)) 10%, transparent);
  color: rgb(var(--v-theme-error));
}

.mp-notifications__disc--warning {
  background: color-mix(in oklch, rgb(var(--v-theme-warning)) 14%, transparent);
  color: rgb(var(--v-theme-warning));
}

.mp-notifications__disc--info {
  background: color-mix(in oklch, var(--accent) 10%, transparent);
  color: var(--accent);
}

.mp-notifications__body {
  min-width: 0;
}

.mp-notifications__title {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-medium);
  line-height: 1.35;
  color: var(--text-primary);
}

.mp-notifications__title--unread {
  font-weight: var(--mp-fontWeight-semibold);
}

.mp-notifications__sub {
  margin-top: var(--mp-space-2);
  font-size: var(--mp-fontSize-12);
  color: var(--muted);
}

.mp-notifications__dot {
  display: inline-block;
  width: var(--mp-space-8);
  height: var(--mp-space-8);
  border-radius: var(--mp-radius-full);
  background: var(--accent);
  flex-shrink: 0;
}
</style>
