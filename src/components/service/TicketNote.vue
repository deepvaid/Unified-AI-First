<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import MpChatBubble from '@/components/MpChatBubble.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import type { TicketMessage } from '@/stores/useTickets'

/**
 * TicketNote — an internal ("sticky") note in a ticket's thread.
 *
 * The thread's warm note bubble, plus what a note needs that a sent message
 * doesn't: its author can edit it in place or delete it, and anyone can pin it
 * to the top of the ticket. The thread owns the data; this emits what changed.
 */
const props = withDefaults(defineProps<{
  message: TicketMessage
  /** Timestamp label, formatted by the thread. */
  time: string
  /** The viewer wrote this note — Edit and Delete are offered. */
  canManage?: boolean
  /** Spam and Trash tickets are read-only: no actions. */
  readonly?: boolean
}>(), {
  canManage: false,
  readonly: false,
})

const emit = defineEmits<{
  save: [body: string]
  delete: []
  pin: [pinned: boolean]
}>()

const root = ref<HTMLElement | null>(null)
async function focusNote() {
  await nextTick()
  root.value?.focus()
}

// ── Edit in place ───────────────────────────────────────────────────────────
const editing = ref(false)
const draft = ref('')
const canSave = computed(() => !!draft.value.trim() && draft.value.trim() !== props.message.body)

function startEdit() {
  draft.value = props.message.body
  editing.value = true
  // Once the ⋯ menu has closed and handed focus back, take it for the editor.
  setTimeout(() => root.value?.querySelector('textarea')?.focus(), 150)
}
function cancelEdit() {
  editing.value = false
  void focusNote()
}
function saveEdit() {
  if (!canSave.value) return
  emit('save', draft.value.trim())
  editing.value = false
  void focusNote()
}
function onEditorKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    saveEdit()
  }
}

const deleteOpen = ref(false)
</script>

<template>
  <!-- Focusable so "jump to this note" from the pinned strip can land on it. -->
  <div ref="root" class="ticket-note" :data-note-id="message.id" tabindex="-1">
    <MpChatBubble side="start" :author="message.author" :time="time" class="ticket-note__bubble">
      <template #avatar>
        <v-avatar size="28" color="warning" variant="tonal">
          <v-icon size="16">sticky-note</v-icon>
        </v-avatar>
      </template>

      <template v-if="!readonly" #actions>
        <MpRowActionsMenu ariaLabel="Note actions" :itemLabel="`${message.author}'s note`">
          <MpMenuItem v-if="canManage" title="Edit" icon="pencil" @click="startEdit" />
          <MpMenuItem
            :title="message.pinned ? 'Unpin' : 'Pin to top'"
            :icon="message.pinned ? 'pin-off' : 'pin'"
            @click="emit('pin', !message.pinned)"
          />
          <template v-if="canManage">
            <v-divider class="my-1" />
            <MpMenuItem title="Delete" icon="trash-2" danger @click="deleteOpen = true" />
          </template>
        </MpRowActionsMenu>
      </template>

      <div v-if="editing" class="ticket-note__editor d-flex flex-column ga-2">
        <!-- An inline editor, not a form field: no label row and no details row;
             Save is disabled until the text is valid, so there is no message. -->
        <v-textarea
          v-model="draft"
          aria-label="Edit note"
          rows="3"
          auto-grow
          hide-details
          bg-color="surface"
          @keydown.esc.stop.prevent="cancelEdit"
          @keydown="onEditorKeydown"
        ></v-textarea>
        <div class="d-flex justify-end ga-2">
          <v-btn variant="text" size="small" class="text-none" @click="cancelEdit">Cancel</v-btn>
          <v-btn color="primary" variant="flat" size="small" class="text-none" :disabled="!canSave" @click="saveEdit">
            Save
          </v-btn>
        </div>
      </div>
      <template v-else>{{ message.body }}</template>

      <template #footer>
        <span class="d-inline-flex align-center flex-wrap ga-1">
          <v-icon size="16">lock</v-icon>
          <span>Only visible to your team</span>
          <span v-if="message.editedAt">· Edited</span>
          <span v-if="message.pinned" class="d-inline-flex align-center ga-1">· <v-icon size="14">pin</v-icon> Pinned</span>
        </span>
      </template>
    </MpChatBubble>

    <MpConfirmDialog
      v-model="deleteOpen"
      danger
      title="Delete this note?"
      message="Your team will no longer see it on this ticket."
      confirm-label="Delete note"
      @confirm="emit('delete')"
    />
  </div>
</template>

<style scoped>
.ticket-note {
  border-radius: var(--mp-component-bubble-radius);
}
.ticket-note:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

/* The thread reads as documents, so the bubble spans the column; the warm tint
   goes through MpChatBubble's documented re-skin seam. */
.ticket-note__bubble {
  max-width: 100%;
  --mp-bubble-bg: var(--warn-soft);
  --mp-bubble-fg: var(--warn-ink);
  --mp-bubble-border: transparent;
}

/* The bubble body is pre-wrap for message text; the editor is laid out, not typed. */
.ticket-note__editor {
  white-space: normal;
}
</style>
