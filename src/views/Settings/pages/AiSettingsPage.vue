<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import SettingsSection from '@/components/settings/SettingsSection.vue'
import { useAccountsStore } from '@/stores/useAccounts'

const route = useRoute()
const accountsStore = useAccountsStore()

const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? ''
})

const chatbotIncluded = computed(() => accountsStore.hasAnySubscription(['service', 'commerce']))

const surfaces = computed(() => [
  {
    key: 'chatbot',
    title: 'Chatbot',
    description: 'Build chat assistants for your stores.',
    included: chatbotIncluded.value,
  },
  {
    key: 'shopping-assistant',
    title: 'Shopping assistant',
    description: 'Guide shoppers to products in chat.',
    included: accountsStore.hasSubscription('commerce'),
  },
  {
    key: 'ask-davinci',
    title: 'Ask Da Vinci',
    description: 'Chat with your AI copilot for quick answers and actions.',
    included: accountsStore.hasSubscription('davinci'),
  },
  {
    key: 'ai-experience',
    title: 'AI experience',
    description: 'Voice-first AI workspace for hands-free workflows.',
    included: accountsStore.hasSubscription('davinci'),
  },
])
</script>

<template>
  <div class="settings-page">
    <MpPageHeader :level="2" density="compact"
      title="AI Settings"
      subtitle="Tune how Da Vinci AI surfaces suggestions, what data it can access, and how it interacts with your team."
    />

    <SettingsSection title="Da Vinci AI" description="Availability of each AI surface on this account's plan.">
      <div class="stack">
        <div v-for="s in surfaces" :key="s.key" class="ai-surface-row">
          <div class="ai-surface-row__copy">
            <div class="ai-surface-row__name">{{ s.title }}</div>
            <div class="ai-surface-row__desc">{{ s.description }}</div>
          </div>
          <v-chip
            size="small"
            :color="s.included ? 'success' : undefined"
            :variant="s.included ? 'tonal' : 'flat'"
          >
            {{ s.included ? 'Included' : 'Not included' }}
          </v-chip>
        </div>
      </div>
    </SettingsSection>

    <SettingsSection title="Chatbot settings">
      <template v-if="chatbotIncluded">
        <p class="text-body-2 text-medium-emphasis mb-3">
          Manage chat assistants for your stores from the chatbot builder.
        </p>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          prepend-icon="bot"
          :to="{ name: 'ChatbotList', params: { accountId } }"
        >
          Manage chatbots
        </v-btn>
      </template>
      <template v-else>
        <p class="text-body-2 text-medium-emphasis mb-3">
          Not included in your plan — Chatbot is part of Service Cloud and Commerce Cloud.
        </p>
        <v-btn
          variant="text"
          color="primary"
          class="text-none px-0"
          :to="{ name: 'Billing', params: { accountId } }"
        >
          View plans
        </v-btn>
      </template>
    </SettingsSection>
  </div>
</template>

<style scoped lang="scss">
.stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ai-surface-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: color-mix(in oklch, var(--surface-secondary) 34%, transparent);
}

.ai-surface-row__name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
}

.ai-surface-row__desc {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 2px;
}
</style>
