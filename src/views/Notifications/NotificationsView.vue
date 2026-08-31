<script setup lang="ts">
import { storeToRefs } from 'pinia'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import NotificationRow from '@/components/notifications/NotificationRow.vue'
import { useNotifications, type AppNotification } from '@/stores/useNotifications'
import { useToast } from '@/composables/useToast'

const store = useNotifications()
const { items, unreadCount } = storeToRefs(store)
const toast = useToast()

// Prototype stub — the mock feed has no real files behind its report rows.
function download(n: AppNotification) {
  toast.success('Download started.', { title: n.title })
}
</script>

<template>
  <div>
    <MpPageHeader
      title="Notifications"
      :subtitle="unreadCount ? `${unreadCount} unread` : 'All caught up'"
    >
      <template #actions>
        <v-btn
          variant="outlined"
          class="text-none"
          :disabled="unreadCount === 0"
          @click="store.markAllRead()"
        >
          Mark all read
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card flat border rounded="lg" class="notifications-card">
      <div v-if="items.length">
        <NotificationRow
          v-for="n in items"
          :key="n.id"
          :notification="n"
          @select="store.markRead(n.id)"
          @download="download(n)"
        />
      </div>
      <MpEmptyState
        v-else
        icon="bell-off"
        title="You're all caught up"
        description="New activity across your account will land here."
      />
    </v-card>
  </div>
</template>

<style scoped>
.notifications-card {
  padding-inline: var(--mp-component-card-paddingCompact);
  padding-block: var(--mp-space-4);
}
</style>
