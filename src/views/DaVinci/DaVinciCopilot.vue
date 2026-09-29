<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpDaVinciBot from '@/components/MpDaVinciBot.vue'
import DvHistoryDrawer from '@/components/copilot/DvHistoryDrawer.vue'
import { useDaVinciToasts } from '@/composables/useDaVinciToasts'
import { useCopilotStore } from '@/stores/useCopilot'

// The live conversation is shared via the copilot store, so opening this page simply continues
// the drawer's thread. The address follows the thread (`/da-vinci/copilot/:conversationId`), and a
// link — or a reload — restores the conversation it names from the history.
const route = useRoute()
const router = useRouter()
const copilot = useCopilotStore()
const { pushToast } = useDaVinciToasts()

const routeConversationId = computed(() => (route.params.conversationId as string | undefined) || null)

function setAddress(conversationId: string | null) {
  void router.replace({
    name: 'DaVinciCopilot',
    params: { accountId: route.params.accountId, ...(conversationId ? { conversationId } : {}) },
  })
}

watch(
  routeConversationId,
  (id) => {
    if (!id || id === copilot.conversationId) return
    if (copilot.restoreConversation(id)) return
    pushToast({ title: 'That conversation is no longer available' })
    setAddress(copilot.conversationId)
  },
  { immediate: true },
)

watch(
  () => copilot.conversationId,
  (id) => {
    if (id !== routeConversationId.value) setAddress(id)
  },
  { immediate: true },
)

const activeConversationId = computed(() => copilot.conversationId)
const botKey = ref(0)

function startNewChat() {
  copilot.resetConversation()
  botKey.value += 1
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
