<script setup lang="ts">
import { computed, ref } from 'vue'
import MpDaVinciBot from '@/components/MpDaVinciBot.vue'
import DvHistoryDrawer from '@/components/copilot/DvHistoryDrawer.vue'
import { useCopilotStore, type ChatMessage } from '@/stores/useCopilot'

// The live conversation is shared via the copilot store, so opening this page
// simply continues the drawer's thread. The localStorage snapshot remains only
// as a fallback for cold deep links from older sessions.
const STORAGE_KEY = 'davinci-active-conversation-v1'
const STALE_MS = 60_000

interface Snapshot {
  conversationId: string
  messages: unknown[]
  accountId: string
  dashboardId: string | null
  snapshotAt: number
}

function readSnapshot(): { messages: unknown[]; conversationId: string | null } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { messages: [], conversationId: null }
    const snap: Snapshot = JSON.parse(raw)
    window.localStorage.removeItem(STORAGE_KEY)
    if (Date.now() - snap.snapshotAt > STALE_MS) {
      return { messages: [], conversationId: null }
    }
    const msgs = Array.isArray(snap.messages) ? snap.messages : []
    return { messages: msgs, conversationId: snap.conversationId }
  } catch {
    return { messages: [], conversationId: null }
  }
}

const copilot = useCopilotStore()

if (copilot.messages.length === 0) {
  const hydrated = readSnapshot()
  if (hydrated.messages.length) {
    copilot.messages = hydrated.messages as ChatMessage[]
    copilot.chatMode = true
    copilot.conversationId = hydrated.conversationId
  }
}

const activeConversationId = computed(() => copilot.conversationId)
const botKey = ref(0)

function startNewChat() {
  copilot.resetConversation()
  botKey.value += 1
  window.localStorage.removeItem(STORAGE_KEY)
}
</script>

<template>
  <div class="davinci-copilot">
    <header class="davinci-copilot__topbar">
      <v-btn
        size="small"
        variant="flat"
        rounded="pill"
        prepend-icon="square-pen"
        class="davinci-copilot__newchat"
        @click="startNewChat"
      >
        Start new chat
      </v-btn>
    </header>

    <div class="davinci-copilot__body">
      <aside class="davinci-copilot__rail">
        <DvHistoryDrawer
          :open="true"
          mode="rail"
          :active-id="activeConversationId ?? undefined"
          @new-chat="startNewChat"
        />
      </aside>

      <main class="davinci-copilot__main">
        <MpDaVinciBot
          :key="botKey"
          :headerless="true"
        />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.davinci-copilot {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: calc(100vh - var(--v-layout-top, var(--mp-layout-appbarHeight)));
  background: var(--surface-primary);
}

.davinci-copilot__topbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: var(--mp-space-48);
  padding: 0 var(--mp-space-16);
  background: var(--surface-primary);
  border-bottom: 1px solid var(--border-subtle);
  flex: 0 0 auto;
}

/* The one primary CTA on this surface wears the Da Vinci gradient skin
   (dv-tokens.css pair --dv-grad / --dv-on-accent) over a plain v-btn. */
.davinci-copilot__newchat {
  background: var(--dv-grad);
  color: var(--dv-on-accent);
}

.davinci-copilot__body {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}

.davinci-copilot__rail {
  width: var(--mp-layout-sectionRailWidth);
  flex: 0 0 var(--mp-layout-sectionRailWidth);
  background: var(--surface-secondary);
  border-right: 1px solid var(--border-subtle);
  overflow-y: auto;
}

/* Below the split breakpoint a side-by-side rail leaves the conversation ~115px
   wide, so the two panes stack instead — the same treatment MerchandisingLayout
   gives its rail. Hiding the rail here is not an option: it is the only history
   surface on this page (MpDaVinciBot is headerless, so its own history trigger
   is not rendered), and F6 keeps a side panel reachable below the breakpoint. */
@media (max-width: ($mp-layout-breakpointSplit - 0.02px)) {
  .davinci-copilot__body {
    flex-direction: column;
  }

  .davinci-copilot__rail {
    width: 100%;
    flex: 0 0 auto;
    max-height: 35vh;
    border-right: 0;
    border-bottom: 1px solid var(--border-subtle);
  }
}

.davinci-copilot__main {
  flex: 1 1 auto;
  min-width: 0;
  background: var(--surface-primary);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
