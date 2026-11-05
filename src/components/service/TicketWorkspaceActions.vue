<script setup lang="ts">
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import type { TicketFolder } from '@/service/model'

/**
 * The ticket's own actions: activities toggle · open as a full page · ⋮.
 * Sits on the title row in the inbox pane and at the end of the property row on
 * the full page (which has no title band of its own). The ⋮ menu follows the
 * ticket's folder: an inbox ticket can be marked as spam or trashed, a spam one
 * rescued, a trashed one restored.
 */
defineProps<{
  folder: TicketFolder
  canExpand?: boolean
}>()

const showActivities = defineModel<boolean>('showActivities', { required: true })

const emit = defineEmits<{
  expand: []
  edit: []
  unread: []
  move: [to: 'spam' | 'notSpam' | 'trash' | 'restore']
}>()
</script>

<template>
  <div class="d-flex align-center ga-1 flex-shrink-0">
    <v-tooltip text="Show activities" location="bottom">
      <template #activator="{ props: tooltip }">
        <v-btn
          v-bind="tooltip"
          icon="history"
          variant="text"
          size="small"
          :color="showActivities ? 'primary' : undefined"
          :aria-pressed="showActivities"
          aria-label="Show activities"
          @click="showActivities = !showActivities"
        ></v-btn>
      </template>
    </v-tooltip>
    <v-tooltip v-if="canExpand" text="Open as a full page" location="bottom">
      <template #activator="{ props: tooltip }">
        <v-btn
          v-bind="tooltip"
          icon="expand"
          variant="text"
          size="small"
          aria-label="Open ticket as a full page"
          @click="emit('expand')"
        ></v-btn>
      </template>
    </v-tooltip>
    <MpRowActionsMenu ariaLabel="Ticket actions">
      <template v-if="folder === 'inbox'">
        <MpMenuItem title="Edit ticket details" icon="pencil" @click="emit('edit')" />
        <MpMenuItem title="Mark as unread" icon="mail" @click="emit('unread')" />
        <MpMenuItem title="Mark as spam" icon="shield-alert" @click="emit('move', 'spam')" />
        <v-divider class="my-1" />
        <MpMenuItem title="Move to trash" icon="trash-2" danger @click="emit('move', 'trash')" />
      </template>
      <template v-else-if="folder === 'spam'">
        <MpMenuItem title="Not spam" icon="shield-check" @click="emit('move', 'notSpam')" />
        <v-divider class="my-1" />
        <MpMenuItem title="Move to trash" icon="trash-2" danger @click="emit('move', 'trash')" />
      </template>
      <MpMenuItem v-else title="Restore" icon="undo-2" @click="emit('move', 'restore')" />
    </MpRowActionsMenu>
  </div>
</template>
