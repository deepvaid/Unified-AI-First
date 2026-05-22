<script setup lang="ts">
import { ref } from 'vue'
import MpDaVinciBot from '@/components/MpDaVinciBot.vue'
import DvHistoryDrawer from '@/components/copilot/DvHistoryDrawer.vue'

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

const hydrated = readSnapshot()
const initialMessages = ref<unknown[]>(hydrated.messages)
const hydratedConversationId = ref<string | null>(hydrated.conversationId)
const botKey = ref(0)

function startNewChat() {
  initialMessages.value = []
  hydratedConversationId.value = null
  botKey.value += 1
  window.localStorage.removeItem(STORAGE_KEY)
}
</script>

<template>
  <div class="davinci-copilot">
    <header class="davinci-copilot__topbar">
      <button
        type="button"
        class="davinci-copilot__newchat"
        @click="startNewChat"
      >
        <v-icon size="14">square-pen</v-icon>
        Start new chat
      </button>
    </header>

    <div class="davinci-copilot__body">
      <aside class="davinci-copilot__rail">
        <DvHistoryDrawer
          :open="true"
          mode="rail"
          :active-id="hydratedConversationId ?? undefined"
          @new-chat="startNewChat"
        />
      </aside>

      <main class="davinci-copilot__main">
        <MpDaVinciBot
          :key="botKey"
          :headerless="true"
          :initial-messages="(initialMessages as any)"
        />
      </main>
    </div>
  </div>
</template>

<style scoped>
.davinci-copilot {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: calc(100vh - var(--v-layout-top, 64px));
  background: rgb(var(--v-theme-surface));
}

.davinci-copilot__topbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 48px;
  padding: 0 16px;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
  flex: 0 0 auto;
}

.davinci-copilot__newchat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  border: none;
  border-radius: 9999px;
  background: var(--dv-grad);
  color: var(--dv-on-accent);
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.1px;
  cursor: pointer;
  transition: filter 120ms ease;
}

.davinci-copilot__newchat:hover {
  filter: brightness(1.05);
}

.davinci-copilot__newchat :deep(.v-icon) {
  color: var(--dv-on-accent);
}

.davinci-copilot__body {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}

.davinci-copilot__rail {
  width: 260px;
  flex: 0 0 260px;
  background: rgb(var(--v-theme-surface-variant));
  border-right: 1px solid rgb(var(--v-theme-outline-variant));
  overflow-y: auto;
}

.davinci-copilot__main {
  flex: 1 1 auto;
  min-width: 0;
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
