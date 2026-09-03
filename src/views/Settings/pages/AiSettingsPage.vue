<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpListRow from '@/components/MpListRow.vue'
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
      <!-- Divided rows inside the section card — the hairline is the only separator,
           so a surface is not a second bordered box inside a bordered card. -->
      <div class="ai-surface-list">
        <MpListRow v-for="s in surfaces" :key="s.key" variant="divided">
          <span class="ai-surface-row__name">{{ s.title }}</span>
          <span class="ai-surface-row__desc">{{ s.description }}</span>
          <template #trailing>
            <v-chip
              size="small"
              :color="s.included ? 'success' : undefined"
              :variant="s.included ? 'tonal' : 'flat'"
            >
              {{ s.included ? 'Included' : 'Not included' }}
            </v-chip>
          </template>
        </MpListRow>
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
.ai-surface-row__name {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
}

.ai-surface-row__desc {
  font-size: var(--mp-fontSize-12);
  color: var(--muted);
  margin-top: var(--mp-space-2);
}
</style>
