<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpUsageMeter from '@/components/MpUsageMeter.vue'
import DvOrbitOrb from '@/components/copilot/voice/DvOrbitOrb.vue'
import { useAccountsStore } from '@/stores/useAccounts'
import { useChatbotStore } from '@/stores/useChatbot'
import { usePlgStore } from '@/stores/usePlg'

const route = useRoute()
const activeTab = ref<'get-started' | 'dashboard'>(
  route.path.endsWith('/dashboard') ? 'dashboard' : 'get-started',
)

const accountsStore = useAccountsStore()
const chatbotStore = useChatbotStore()
const plg = usePlgStore()

const hasDavinciAi = computed(() => plg.entitlements.davinciAi)
const aiTokenUsage = computed(() => plg.active.usage.aiTokens)
const aiTokenHint = computed(() =>
  aiTokenUsage.value.limit === -1
    ? 'Unlimited on your plan'
    : 'Resets monthly · Upgrade for a larger allocation',
)

const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? ''
})

// The chatbot list is a flat mock store (not partitioned per account), so we
// deep-link to the first non-archived chatbot's builder, same as ChatbotList's
// default "active" ordering.
const firstChatbotId = computed(() => {
  const firstActive = chatbotStore.chatbots.find(c => c.status !== 'Archived')
  return firstActive?.id ?? chatbotStore.chatbots[0]?.id
})

interface IncludedSurface {
  key: string
  title: string
  description: string
  icon: string
  included: boolean
  to: RouteLocationRaw
}

const includedSurfaces = computed<IncludedSurface[]>(() => [
  {
    key: 'chatbot',
    title: 'Chatbot',
    description: 'Build chat assistants for your stores.',
    icon: 'bot',
    included: accountsStore.hasAnySubscription(['service', 'commerce']),
    to: { name: 'ChatbotList', params: { accountId: accountId.value } },
  },
  {
    key: 'shopping-assistant',
    title: 'Shopping assistant',
    description: 'Guide shoppers to products in chat.',
    icon: 'shopping-cart',
    included: accountsStore.hasSubscription('commerce'),
    to: firstChatbotId.value != null
      ? { name: 'ChatbotBuilder', params: { accountId: accountId.value, id: firstChatbotId.value }, query: { section: 'shopping' } }
      : { name: 'ChatbotList', params: { accountId: accountId.value } },
  },
  {
    key: 'ask-davinci',
    title: 'Ask Da Vinci',
    description: 'Chat with your AI copilot for quick answers and actions.',
    icon: 'sparkles',
    included: accountsStore.hasSubscription('davinci'),
    to: { name: 'DaVinciCopilot', params: { accountId: accountId.value } },
  },
  {
    key: 'ai-experience',
    title: 'AI experience',
    description: 'Voice-first AI workspace for hands-free workflows.',
    icon: 'wand-2',
    included: accountsStore.hasSubscription('davinci'),
    to: { name: 'DaVinciExperience', params: { accountId: accountId.value } },
  },
])

const features = [
  {
    title: 'Generate content and grow your audience',
    description: 'Email subject lines, campaign briefs, and creative variations on demand — tuned to your brand voice.',
    tone: 'violet-blue',
    icon: 'sparkles',
  },
  {
    title: 'Scale revenue without scaling complexity',
    description: 'Predictive send times, churn signals, and AI-tuned audience targeting working quietly in the background.',
    tone: 'blue-cyan',
    icon: 'trending-up',
  },
  {
    title: 'Resolve tickets faster with AI',
    description: 'Auto-summarize threads, draft replies in your tone, and route conversations to the right agent.',
    tone: 'indigo-violet',
    icon: 'headset',
  },
]

const metrics = [
  { label: 'Avg. Lift via Smart Send', value: '+ 14.2%', color: 'primary', icon: 'trending-up' },
  { label: 'Orders Saved (Churn Prevention)', value: '1,402', color: 'success', icon: 'shopping-cart' },
  { label: 'Dynamic Recommendations Revenue', value: '$84,300', color: 'info', icon: 'dollar-sign' },
]
</script>

<template>
  <div class="h-100 d-flex flex-column">
    <MpPageHeader title="Da Vinci AI" subtitle="Your AI copilot for marketing, commerce, and service" />

    <v-tabs
      v-model="activeTab"
      color="primary"
      class="dv-tabs mb-6"
      slider-color="primary"
    >
      <v-tab value="get-started" class="text-none">Get started</v-tab>
      <v-tab value="dashboard" class="text-none">
        Dashboard
        <v-chip
          size="x-small"
          color="primary"
          variant="flat"
          class="ml-2 font-weight-bold"
          style="height: 18px; font-size: 10px; letter-spacing: 0.04em;"
        >
          BETA
        </v-chip>
      </v-tab>
    </v-tabs>

    <!-- Get started tab -->
    <section v-if="activeTab === 'get-started'" class="dv-landing">
      <v-card flat rounded="lg" class="dv-hero pa-10 mb-6 text-center">
        <div class="dv-hero__brand d-inline-flex align-center justify-center mb-6">
          <DvOrbitOrb class="mr-2" :size="32" />
          <span class="text-h5 font-weight-bold">Da Vinci AI</span>
        </div>
        <h1 class="text-h3 font-weight-bold mb-4 dv-hero__headline">
          The complete AI solution<br />that's easy to use.
        </h1>
        <p class="text-body-1 text-medium-emphasis mb-0 mx-auto" style="max-width: 640px;">
          Unify your marketing, commerce, and service teams with AI built for merchants — predictive send times, content generation, and intelligent routing, all in one place.
        </p>
      </v-card>

      <v-card v-if="hasDavinciAi" flat border rounded="lg" class="pa-5 mb-6">
        <MpUsageMeter
          label="Da Vinci AI tokens"
          icon="sparkles"
          :used="aiTokenUsage.used"
          :limit="aiTokenUsage.limit"
          :hint="aiTokenHint"
        />
      </v-card>
      <v-card v-else flat border rounded="lg" class="pa-5 mb-6 d-flex align-center justify-space-between flex-wrap ga-3">
        <div class="d-flex align-center ga-3">
          <v-icon size="20" class="text-medium-emphasis">sparkles</v-icon>
          <div>
            <div class="text-subtitle-2 font-weight-bold mb-1">Da Vinci AI tokens</div>
            <v-chip size="small" variant="flat">
              <v-icon start size="12">crown</v-icon>
              Not included
            </v-chip>
          </div>
        </div>
        <div class="d-flex align-center gap-2">
          <v-btn variant="text" size="small" color="primary" class="text-none px-0" :to="{ name: 'Billing', params: { accountId } }">View plans</v-btn>
          <v-btn variant="text" size="small" class="text-none px-0" href="mailto:sales@maropost.com?subject=Da%20Vinci%20AI%20upgrade">Talk to sales</v-btn>
        </div>
      </v-card>

      <v-row>
        <v-col v-for="f in features" :key="f.title" cols="12" md="4">
          <v-card flat border rounded="lg" class="h-100 d-flex flex-column">
            <div class="dv-feature-media d-flex align-center justify-center" :class="`dv-feature-media--${f.tone}`">
              <div class="dv-feature-play">
                <v-icon size="22" color="primary">play</v-icon>
              </div>
            </div>
            <div class="pa-5 d-flex flex-column flex-grow-1">
              <div class="d-flex align-center mb-3">
                <v-icon size="20" color="primary" class="mr-2">{{ f.icon }}</v-icon>
                <div class="text-subtitle-1 font-weight-bold">{{ f.title }}</div>
              </div>
              <p class="text-body-2 text-medium-emphasis mb-0">{{ f.description }}</p>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <MpSectionHeader title="What's included in your account" class="mt-8 mb-4" />
      <v-row>
        <v-col v-for="s in includedSurfaces" :key="s.key" cols="12" sm="6" md="3">
          <v-card
            flat
            border
            rounded="lg"
            class="dv-included-card h-100 pa-5 d-flex flex-column"
            :class="{ 'dv-included-card--locked': !s.included }"
            :to="s.included ? s.to : undefined"
          >
            <div class="d-flex align-center justify-space-between mb-3">
              <v-icon size="20" :color="s.included ? 'primary' : undefined" class="text-medium-emphasis">{{ s.icon }}</v-icon>
              <v-chip
                size="small"
                :color="s.included ? 'success' : undefined"
                :variant="s.included ? 'tonal' : 'flat'"
              >
                <v-icon v-if="!s.included" start size="12">crown</v-icon>
                {{ s.included ? 'Included' : 'Not included' }}
              </v-chip>
            </div>
            <div class="text-subtitle-2 font-weight-bold mb-1">{{ s.title }}</div>
            <p class="text-body-2 text-medium-emphasis mb-0 flex-grow-1">{{ s.description }}</p>
            <div v-if="!s.included" class="d-flex align-center gap-2 mt-3">
              <v-btn
                variant="text"
                size="small"
                color="primary"
                class="text-none px-0"
                :to="{ name: 'Billing', params: { accountId } }"
              >
                View plans
              </v-btn>
              <v-btn
                variant="text"
                size="small"
                class="text-none px-0"
                href="mailto:sales@maropost.com?subject=Da%20Vinci%20AI%20upgrade"
              >
                Talk to sales
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </section>

    <!-- Dashboard tab -->
    <section v-else-if="activeTab === 'dashboard'">
      <v-row>
        <v-col v-for="m in metrics" :key="m.label" cols="12" md="4">
          <v-card flat border rounded="lg" class="pa-5">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase">{{ m.label }}</div>
              <v-icon :color="m.color" size="20">{{ m.icon }}</v-icon>
            </div>
            <div class="text-h4 font-weight-bold" :class="`text-${m.color}`">{{ m.value }}</div>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </div>
</template>

<style scoped>
.dv-tabs {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.dv-hero {
  background: linear-gradient(135deg, #ede9fe 0%, #dbeafe 50%, #cffafe 100%);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

/* The light lavender gradient is brand art with no dark equivalent — swap in
   the dark accent containers (same violet/blue/cyan hue order) so the
   on-surface headline/body text stays legible instead of near-invisible. */
.v-theme--maropostDark .dv-hero {
  background: linear-gradient(
    135deg,
    var(--mp-color-dark-accent-purple-container) 0%,
    var(--mp-color-dark-accent-blue-container) 50%,
    var(--mp-color-dark-accent-cyan-container) 100%
  );
}

.dv-hero__headline {
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.dv-feature-media {
  aspect-ratio: 16 / 9;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  position: relative;
  overflow: hidden;
}

.dv-feature-media--violet-blue { background: linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%); }
.dv-feature-media--blue-cyan { background: linear-gradient(135deg, #dbeafe 0%, #cffafe 100%); }
.dv-feature-media--indigo-violet { background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%); }

/* Dark equivalents — same violet/blue/cyan accent-container tokens the
   .dv-hero gradient above uses, so the play glyph's card stays legible
   instead of the light pastel art rendering near-white on a dark page. */
.v-theme--maropostDark .dv-feature-media--violet-blue {
  background: linear-gradient(135deg, var(--mp-color-dark-accent-purple-container) 0%, var(--mp-color-dark-accent-blue-container) 100%);
}
.v-theme--maropostDark .dv-feature-media--blue-cyan {
  background: linear-gradient(135deg, var(--mp-color-dark-accent-blue-container) 0%, var(--mp-color-dark-accent-cyan-container) 100%);
}
.v-theme--maropostDark .dv-feature-media--indigo-violet {
  background: linear-gradient(135deg, var(--mp-color-dark-accent-blue-container) 0%, var(--mp-color-dark-accent-purple-container) 100%);
}

.dv-feature-play {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* Dark mode: the near-white circle leaves the bright cyan primary glyph at
   ~1.8:1. Swap to the dark scrim token so the same bright icon reads at
   full contrast against a dark surface instead. */
.v-theme--maropostDark .dv-feature-play {
  background: var(--scrim-overlay);
}

.dv-included-card--locked {
  opacity: 0.85;
}
</style>
