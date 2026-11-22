<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import { useChatbotStore } from '@/stores/useChatbot'
import { usePlgStore } from '@/stores/usePlg'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'

// A store's Chatbot: the same chatbot that lives under Service › Chatbots, surfaced
// where a channel manager already works. It never edits here — it links to the one
// builder and the one conversations page — and it is where a store without a
// chatbot discovers it (or learns the plan doesn't include one).

const route = useRoute()
const router = useRouter()
const cb = useChatbotStore()
const plg = usePlgStore()
const salesChannels = useSalesChannelsStore()

function param(name: string): string {
  const value = route.params[name]
  return (Array.isArray(value) ? value[0] : value) ?? ''
}
const accountId = computed(() => param('accountId') || '2000290')
const channelId = computed(() => param('channelId'))
const channel = computed(() => salesChannels.getChannel(accountId.value, channelId.value))
const storeName = computed(() => channel.value?.name ?? 'this store')
const chatbot = computed(() => cb.getByChannel(channelId.value))

// The store editor is Commerce-only, and Commerce includes Chatbot — so the only
// plan wall a store can hit here is the number of chatbots (same check as the Chatbots list).
const chatbotLimit = computed(() => plg.entitlements.chatbotLimit)
const limitReached = computed(() => chatbotLimit.value !== -1 && plg.active.usage.chatbots.used >= chatbotLimit.value)

type View = 'pos' | 'connected' | 'limit' | 'none'
const view = computed<View>(() => {
  if (channel.value && channel.value.type !== 'web_store') return 'pos'
  if (chatbot.value) return 'connected'
  if (limitReached.value) return 'limit'
  return 'none'
})

const activeSources = computed(() =>
  chatbot.value?.config.knowledgeSources.filter(s => s.enabled && s.status === 'Active').length ?? 0,
)
const builderRoute = computed(() => ({
  name: 'ChatbotBuilder',
  params: { accountId: accountId.value, id: chatbot.value?.id },
  query: { section: 'knowledge' },
}))
const conversationsRoute = computed(() => ({
  name: 'ChatbotConversations',
  params: { accountId: accountId.value, id: chatbot.value?.id },
}))

function viewPlans() { router.push({ name: 'Billing', params: { accountId: accountId.value } }) }
// Creating from a store links the two and then follows the normal creation flow (Appearance first).
function createChatbot() {
  if (!channel.value) return
  const domain = channel.value.webStore?.domain
  const id = cb.create(channel.value.name, domain ? `https://${domain}` : '', channel.value.id)
  router.push({ name: 'ChatbotBuilder', params: { accountId: accountId.value, id } })
}
</script>

<template>
  <div class="d-flex flex-column gap-5">
    <MpPageHeader title="Chatbot" :subtitle="`The assistant that answers shoppers on ${storeName}`" />

    <v-card v-if="view === 'pos'" flat border rounded="lg">
      <MpEmptyState
        icon="store"
        title="Chatbots run on web stores"
        description="This sales channel sells in person, so there is no storefront for a chatbot to sit on."
        :heading-level="2"
      />
    </v-card>

    <v-card v-else-if="view === 'connected' && chatbot" flat border rounded="lg" class="mp-card-inset">
      <div class="sc-bot__head">
        <div class="sc-bot__mark" aria-hidden="true"><v-icon size="20">bot-message-square</v-icon></div>
        <div class="min-width-0 flex-grow-1">
          <div class="d-flex align-center ga-2">
            <h2 class="text-subtitle-1 font-weight-medium text-truncate">{{ chatbot.store }}</h2>
            <MpStatusChip :status="chatbot.status" size="sm" class="flex-shrink-0" />
          </div>
          <div class="text-body-2 text-medium-emphasis text-truncate">{{ chatbot.storeUrl }}</div>
        </div>
        <div class="sc-bot__actions">
          <v-btn variant="text" class="text-none" prepend-icon="messages-square" :to="conversationsRoute">View conversations</v-btn>
          <v-btn color="primary" variant="flat" class="text-none" prepend-icon="pencil" :to="builderRoute">Manage chatbot</v-btn>
        </div>
      </div>

      <v-divider class="my-4" />

      <dl class="mp-label-value sc-bot__facts">
        <div>
          <dt>Conversations</dt>
          <dd><RouterLink :to="conversationsRoute" class="mp-link">{{ chatbot.conversations.toLocaleString() }}</RouterLink></dd>
        </div>
        <div>
          <dt>Knowledge sources</dt>
          <dd>{{ activeSources }} active of {{ chatbot.config.knowledgeSources.length }}</dd>
        </div>
        <div>
          <dt>Last modified</dt>
          <dd>{{ chatbot.lastModified }}</dd>
        </div>
      </dl>
    </v-card>

    <v-card v-else-if="view === 'limit'" flat border rounded="lg">
      <MpEmptyState
        icon="lock"
        :title="chatbotLimit === 0 ? 'Not included in your plan' : 'You’ve used all the chatbots on your plan'"
        :description="chatbotLimit === 0
          ? `Your current plan doesn’t include a chatbot. Upgrade to add one to ${storeName}.`
          : `Your plan includes ${chatbotLimit} ${chatbotLimit === 1 ? 'chatbot' : 'chatbots'}. Upgrade to add one to ${storeName}.`"
        action-label="View plans"
        action-icon="arrow-right"
        :heading-level="2"
        @action="viewPlans"
      />
      <div class="d-flex justify-center pb-8">
        <v-btn variant="text" class="text-none" href="mailto:sales@maropost.com?subject=Chatbot%20%E2%80%94%20plan%20upgrade">Talk to sales</v-btn>
      </div>
    </v-card>

    <v-card v-else flat border rounded="lg">
      <MpEmptyState
        emphasis="prominent"
        icon="bot-message-square"
        :title="`Add a chatbot to ${storeName}`"
        description="Answer shoppers’ questions from your own content, help them find products and check on orders — around the clock."
        action-label="Create chatbot"
        action-icon="plus"
        :heading-level="2"
        @action="createChatbot"
      />
    </v-card>
  </div>
</template>

<style scoped>
.sc-bot__head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--mp-component-card-gap);
}
.sc-bot__mark {
  width: var(--mp-component-control-height);
  height: var(--mp-component-control-height);
  border-radius: var(--mp-component-chip-radius);
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-soft);
  color: var(--accent-on-container);
}
.sc-bot__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-space-8);
}
.sc-bot__facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--mp-component-card-gap);
}
</style>
