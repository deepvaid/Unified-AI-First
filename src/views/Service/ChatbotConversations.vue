<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useChatbotStore } from '@/stores/useChatbot'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpChatBubble from '@/components/MpChatBubble.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'

const route = useRoute()
const accountId = computed(() => route.params.accountId as string)
const chatbotId = computed(() => Number(route.params.id))

const cb = useChatbotStore()
const chatbot = computed(() => cb.getById(chatbotId.value))
const listRoute = computed(() => ({ name: 'ChatbotList', params: { accountId: accountId.value } }))

const conversations = computed(() => cb.conversationsFor(chatbotId.value))
const search = ref('')
const rows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return conversations.value
  return conversations.value.filter(c =>
    c.visitor.toLowerCase().includes(q) ||
    c.topic.toLowerCase().includes(q) ||
    c.messages.some(m => m.text.toLowerCase().includes(q)),
  )
})

const selectedId = ref<string | null>(null)
const selected = computed(() => rows.value.find(c => c.id === selectedId.value) ?? null)
// Keep a conversation open: the first one on arrival, and the first match while searching.
watch(rows, list => {
  if (!list.some(c => c.id === selectedId.value)) selectedId.value = list[0]?.id ?? null
}, { immediate: true })

const subtitle = computed(() => {
  if (!chatbot.value) return undefined
  const total = chatbot.value.conversations.toLocaleString()
  return conversations.value.length
    ? `${chatbot.value.store} · the ${conversations.value.length} most recent of ${total}`
    : chatbot.value.store
})
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader title="Conversations" :subtitle="subtitle" :back-to="listRoute" />

    <v-card v-if="!chatbot" flat border rounded="lg" class="flex-grow-1 d-flex flex-column justify-center">
      <MpEmptyState
        icon="bot-message-square"
        title="Chatbot not found"
        description="It may have been removed. Go back to your chatbots to pick another."
        action-label="Back to Chatbots"
        @action="$router.push(listRoute)"
      />
    </v-card>

    <v-card v-else-if="!conversations.length" flat border rounded="lg" class="flex-grow-1 d-flex flex-column justify-center">
      <MpEmptyState
        icon="messages-square"
        title="No conversations yet"
        description="Conversations appear here once shoppers start chatting with this chatbot on your store."
      />
    </v-card>

    <v-card v-else flat border rounded="lg" class="cv flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Recent conversations"
        search-placeholder="Search by visitor, topic or message..."
        :total-count="rows.length"
      />

      <div class="cv__body">
        <div class="cv__list" role="list" aria-label="Conversations">
          <div v-for="c in rows" :key="c.id" role="listitem">
            <MpListRow
              variant="divided"
              clickable
              class="cv__row"
              :class="{ 'cv__row--on': c.id === selectedId }"
              :aria-current="c.id === selectedId ? 'true' : undefined"
              :title="c.visitor"
              :subtitle="c.messages[0]?.text"
              :meta="c.startedAt"
              @click="selectedId = c.id"
            />
          </div>
          <MpEmptyState
            v-if="!rows.length"
            icon="search-x"
            :title="`No conversations match “${search.trim()}”`"
            description="Try a different search term, or clear it to see every conversation."
            action-label="Clear search"
            @action="search = ''"
          />
        </div>

        <section v-if="selected" class="cv__thread" :aria-label="`Conversation with ${selected.visitor}`">
          <header class="cv__thread-head">
            <div class="min-width-0">
              <h2 class="text-subtitle-1 font-weight-medium text-truncate">{{ selected.visitor }}</h2>
              <div class="text-body-2 text-medium-emphasis">{{ selected.topic }} · {{ selected.startedAt }}</div>
            </div>
            <MpStatusChip :status="selected.resolved ? 'Resolved' : 'Open'" type="ticket" size="sm" class="flex-shrink-0" />
          </header>
          <div class="cv__messages">
            <MpChatBubble
              v-for="(m, i) in selected.messages"
              :key="i"
              :side="m.from === 'bot' ? 'end' : 'start'"
              :tone="m.from === 'bot' ? 'accent' : 'neutral'"
              :author="m.from === 'bot' ? 'Chatbot' : selected.visitor"
              :time="m.time"
            >{{ m.text }}</MpChatBubble>
          </div>
        </section>
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.cv__body {
  flex: 1 1 auto;
  /* Room to read a transcript even when the list is short. */
  min-height: calc(var(--mp-component-state-minHeightProminent) * 1.5);
  display: flex;
  border-top: 1px solid var(--border-subtle);
}
.cv__list {
  flex: 0 0 var(--mp-layout-previewPanelWidth);
  min-width: 0;
  overflow-y: auto;
  border-right: 1px solid var(--border-subtle);
}
.cv__row {
  width: 100%;
  padding-inline: var(--mp-component-card-padding);
  text-align: left;
}
.cv__row--on {
  background: var(--accent-soft);
  color: var(--accent-on-container);
}
.cv__thread {
  flex: 1 1 0;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.cv__thread-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-12);
  padding: var(--mp-space-16) var(--mp-component-card-padding);
  border-bottom: 1px solid var(--border-subtle);
}
.cv__messages {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-card-gap);
  padding: var(--mp-component-card-padding);
}

/* Narrow: the list sits above the open conversation and the page scrolls as one. */
@media (max-width: 960px) {
  .cv__body { flex-direction: column; min-height: 0; }
  .cv__list {
    flex: 0 0 auto;
    overflow: visible;
    border-right: 0;
    border-bottom: 1px solid var(--border-subtle);
  }
  .cv__thread { flex: 0 0 auto; }
  .cv__messages { overflow: visible; }
}
</style>
