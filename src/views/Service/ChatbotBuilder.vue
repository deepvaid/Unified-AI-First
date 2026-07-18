<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatbotStore } from '@/stores/useChatbot'
import { useAccountsStore } from '@/stores/useAccounts'
import type { PreChatFieldType, QuickPromptIntent } from '@/stores/useChatbot'
import type { SubscriptionKey } from '@/stores/useAccounts'
import MpBuilderShell from '@/components/MpBuilderShell.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'

const route = useRoute()
const router = useRouter()
const accountId = computed(() => route.params.accountId as string)
const id = computed(() => Number(route.params.id))

const cb = useChatbotStore()
const accounts = useAccountsStore()
const chatbot = computed(() => cb.getById(id.value))
const cfg = computed(() => chatbot.value!.config)

// Static UI config (not reactive state)
const storeTypes = ['Fashion & Apparel', 'Electronics', 'Home & Living', 'Health & Beauty', 'Food & Beverage', 'Other']
const swatches = ['#1F2933', '#2563EB', '#6D28D9', '#7CB9D6', '#7BC67B', '#E9C74A', '#DD7A3B', '#C0559A']
const INTENTS: { title: string; value: QuickPromptIntent }[] = [
  { title: 'Shopping', value: 'shopping' },
  { title: 'Order tracking', value: 'track' },
  { title: 'Support', value: 'support' },
  { title: 'FAQ', value: 'faq' },
]

type Section = 'general' | 'appearance' | 'hours' | 'prompts' | 'shopping' | 'tracking' | 'knowledge' | 'prechat'
const section = ref<Section>('appearance')

interface NavGroup {
  title: string
  items: { key: Section; label: string; icon: string }[]
}
const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Essentials',
    items: [
      { key: 'appearance', label: 'Appearance', icon: 'palette' },
      { key: 'hours', label: 'Business hours', icon: 'clock' },
    ],
  },
  {
    title: 'Capabilities',
    items: [
      { key: 'prompts', label: 'Quick prompts', icon: 'message-square-more' },
      { key: 'shopping', label: 'Shopping assistant', icon: 'shopping-bag' },
      { key: 'tracking', label: 'Order tracking', icon: 'package-search' },
      { key: 'knowledge', label: 'Knowledge base', icon: 'book-open' },
      { key: 'prechat', label: 'Pre-chat form', icon: 'clipboard-list' },
    ],
  },
  {
    title: 'Advanced',
    items: [
      { key: 'general', label: 'General', icon: 'building-2' },
    ],
  },
]
const NAV = NAV_GROUPS.flatMap(g => g.items)
const catalogSources = [
  { title: 'Full product catalog', value: 'catalog' },
  { title: 'Featured products only', value: 'featured' },
]

// Subscription gating: each capability section maps to the cloud that powers it.
const SECTION_REQUIRES: Partial<Record<Section, SubscriptionKey>> = {
  shopping: 'commerce',
  tracking: 'commerce',
  knowledge: 'service',
  prechat: 'service',
}
function isSectionLocked(key: Section): boolean {
  const req = SECTION_REQUIRES[key]
  return !!req && !accounts.hasSubscription(req)
}
const LOCK_DESCRIPTIONS: Partial<Record<Section, string>> = {
  shopping: 'The Shopping assistant uses your product catalog and is part of Commerce Cloud. Upgrade your plan to guide shoppers to products in chat.',
  tracking: 'Order tracking connects to your Commerce Cloud orders. Upgrade your plan to let shoppers track orders in chat.',
  knowledge: 'The Knowledge base powers support answers and is part of Service Cloud. Upgrade your plan to answer questions from your content.',
  prechat: 'Pre-chat forms capture support context and are part of Service Cloud. Upgrade your plan to collect details before a conversation starts.',
}
const lockedDescription = computed(() => LOCK_DESCRIPTIONS[section.value] ?? '')
const salesMailto = 'mailto:sales@maropost.com?subject=Chatbot%20%E2%80%94%20plan%20upgrade'
function viewPlans() { router.push({ name: 'Billing', params: { accountId: accountId.value } }) }

const savedSnapshot = ref('')
function captureConfigSnapshot() {
  savedSnapshot.value = cfg.value ? JSON.stringify(cfg.value) : ''
}
const isDirty = computed(() => {
  if (!cfg.value || !savedSnapshot.value) return false
  return JSON.stringify(cfg.value) !== savedSnapshot.value
})
const {
  confirmLeave,
  allowNextLeave,
  discardAndLeave,
  leaveTitle,
  leaveMessage,
  leaveConfirmLabel,
} = useDirtyLeaveGuard(isDirty, {
  title: 'Leave chatbot builder?',
  message: 'You have unsaved changes. Leaving now will discard them.',
})

function focusPreview() {
  document.getElementById('cb-preview')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

onMounted(() => {
  if (!chatbot.value) {
    router.replace({ name: 'ChatbotList', params: { accountId: accountId.value } })
    return
  }
  // Deep link: honor ?section=<key> when it is a valid, unlocked section.
  const q = route.query.section
  const key = typeof q === 'string' ? q : undefined
  if (key && NAV.some(n => n.key === key) && !isSectionLocked(key as Section)) {
    section.value = key as Section
  } else if (!key) {
    // Default to Appearance (Essentials) when no section query is present.
    section.value = 'appearance'
  }
  // Never land on a locked section — fall back to the first unlocked one.
  if (isSectionLocked(section.value)) {
    const firstUnlocked = NAV.find(n => !isSectionLocked(n.key))
    if (firstUnlocked) section.value = firstUnlocked.key
  }
  captureConfigSnapshot()
})

const enabledPrompts = computed(() => cfg.value?.quickPrompts.filter(p => p.enabled) ?? [])

// Quick prompt ops
let promptSeq = 100
function addPrompt() { cfg.value.quickPrompts.push({ id: ++promptSeq, text: 'New prompt', intent: 'support', enabled: true }) }
function removePrompt(pid: number) { cfg.value.quickPrompts = cfg.value.quickPrompts.filter(p => p.id !== pid) }
function movePrompt(i: number, dir: -1 | 1) {
  const j = i + dir
  const a = cfg.value.quickPrompts
  if (j < 0 || j >= a.length) return
  ;[a[i], a[j]] = [a[j]!, a[i]!]
}

// Pre-chat field ops
let fieldSeq = 100
const FIELD_TYPES: PreChatFieldType[] = ['Text', 'Email', 'Phone', 'Text Area']
function addField() { cfg.value.preChatFields.push({ id: ++fieldSeq, label: 'New field', type: 'Text', placeholder: '', required: false }) }
function removeField(fid: number) { cfg.value.preChatFields = cfg.value.preChatFields.filter(f => f.id !== fid) }
function moveField(i: number, dir: -1 | 1) {
  const j = i + dir
  const a = cfg.value.preChatFields
  if (j < 0 || j >= a.length) return
  ;[a[i], a[j]] = [a[j]!, a[i]!]
}

const statusColor: Record<string, string> = { Active: 'success', Disabled: 'default', Indexing: 'info' }
const addSourceTab = ref<'url' | 'questionnaire' | 'upload'>('url')

// ── Knowledge base ─────────────────────────────────────────────────────────
const sourceKind = (icon: string) =>
  icon === 'globe' ? 'Website' : icon === 'clipboard-list' ? 'Questionnaire' : 'Files'
const activeSourceCount = computed(() =>
  cfg.value.knowledgeSources.filter(s => s.enabled && s.status === 'Active').length
)

const newUrl = ref('')
function addUrlSource() {
  const url = newUrl.value.trim()
  if (!url) return
  const label = url.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const nextId = Math.max(0, ...cfg.value.knowledgeSources.map(s => s.id)) + 1
  cfg.value.knowledgeSources.push({
    id: nextId, name: label, icon: 'globe', items: 0, meta: 'Added just now', status: 'Indexing', enabled: true,
  })
  newUrl.value = ''
}

// KB questionnaire
const kbDrawer = ref(false)
const kbQuestions = [
  { key: 'about', label: 'What does your business do?', placeholder: 'A short description of your store and what you sell.' },
  { key: 'products', label: 'What are your most popular products or collections?', placeholder: 'List key products, categories, or bestsellers.' },
  { key: 'shipping', label: 'What are your shipping & delivery policies?', placeholder: 'Regions served, timeframes, costs, carriers…' },
  { key: 'returns', label: 'What is your return & refund policy?', placeholder: 'Return window, conditions, how refunds are issued…' },
  { key: 'hours', label: 'What are your support hours & contact channels?', placeholder: 'Hours, email, phone, live chat…' },
  { key: 'other', label: 'Anything else customers frequently ask?', placeholder: 'Warranties, sizing, gift cards, loyalty program…' },
] as const
const emptyAnswers = (): Record<string, string> =>
  Object.fromEntries(kbQuestions.map(q => [q.key, '']))
const kbAnswers = ref<Record<string, string>>(emptyAnswers())
const kbAnsweredCount = computed(() => Object.values(kbAnswers.value).filter(v => v.trim()).length)

function submitQuestionnaire() {
  if (kbAnsweredCount.value === 0) return
  const nextId = Math.max(0, ...cfg.value.knowledgeSources.map(s => s.id)) + 1
  cfg.value.knowledgeSources.push({
    id: nextId, name: 'Business questionnaire', icon: 'clipboard-list',
    items: kbAnsweredCount.value, meta: 'Added just now', status: 'Indexing', enabled: true,
  })
  kbAnswers.value = emptyAnswers()
  kbDrawer.value = false
}

const removeDialog = ref(false)
const sourceToRemove = ref<number | null>(null)
const sourceToRemoveName = computed(() =>
  cfg.value.knowledgeSources.find(s => s.id === sourceToRemove.value)?.name ?? ''
)
function askRemoveSource(id: number) {
  sourceToRemove.value = id
  removeDialog.value = true
}
function confirmRemoveSource() {
  const i = cfg.value.knowledgeSources.findIndex(s => s.id === sourceToRemove.value)
  if (i !== -1) cfg.value.knowledgeSources.splice(i, 1)
  removeDialog.value = false
  sourceToRemove.value = null
}

const saved = ref(false)
function goBack() { router.push({ name: 'ChatbotList', params: { accountId: accountId.value } }) }

// Publish modal
const publishOpen = ref(false)
const copied = ref(false)
const installScript = computed(() =>
  `<!-- ${chatbot.value?.store ?? 'Store'} AI Chatbot Widget -->
<script>
  (function () {
    var s = document.createElement('script');
    s.src = 'https://cdn.maropost.ai/chatbot/widget.js';
    s.async = true;
    s.setAttribute('data-chatbot-id', '${id.value}');
    document.body.appendChild(s);
  })();
<\/script>`,
)
async function copyScript() {
  try {
    await navigator.clipboard.writeText(installScript.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch { /* clipboard unavailable in preview */ }
}
function finishPublish() {
  publishOpen.value = false
  saved.value = true
  captureConfigSnapshot()
  allowNextLeave()
}

// ─── Live preview scenarios ───────────────────────────────────────────
type Scenario = 'welcome' | 'shopping' | 'tracking' | 'openchat' | 'prechat'
const previewScenario = ref<Scenario>('welcome')
const scenarioTabs = computed(() => {
  const t: { key: Scenario; label: string }[] = [{ key: 'welcome', label: 'Welcome' }]
  // Only preview capabilities the account's plan actually includes.
  if (cfg.value?.shopping.enabled && !isSectionLocked('shopping')) t.push({ key: 'shopping', label: 'Shopping' })
  if (cfg.value?.orderTracking.enabled && !isSectionLocked('tracking')) t.push({ key: 'tracking', label: 'Order tracking' })
  t.push({ key: 'openchat', label: 'Open chat' })
  if (cfg.value?.preChatEnabled && !isSectionLocked('prechat')) t.push({ key: 'prechat', label: 'Pre-chat' })
  return t
})
// Editing a section jumps the preview to its matching scenario.
watch(section, s => {
  if (s === 'shopping' && cfg.value?.shopping.enabled) previewScenario.value = 'shopping'
  else if (s === 'tracking' && cfg.value?.orderTracking.enabled) previewScenario.value = 'tracking'
  else if (s === 'prechat' && cfg.value?.preChatEnabled) previewScenario.value = 'prechat'
})
// Keep the active scenario valid as capabilities toggle.
watch(scenarioTabs, tabs => {
  if (!tabs.some(t => t.key === previewScenario.value)) previewScenario.value = 'welcome'
})
// Reset transient demo state when switching scenarios.
watch(previewScenario, () => { cartAdded.value = false; chatResult.value = null })

const cbProducts = computed(() => cb.previewProducts)
const money = (n: number) => `$${n.toFixed(2)}`

// Shopping cart demo
const cartAdded = ref(false)
function addToCart() { cartAdded.value = true }

// Open-chat intent routing demo
const chatInput = ref('')
const chatResult = ref<{ text: string; intent: QuickPromptIntent } | null>(null)
const intentLabel: Record<QuickPromptIntent, string> = { shopping: 'Shopping', track: 'Order tracking', support: 'Support', faq: 'FAQ' }
const intentReply: Record<QuickPromptIntent, string> = {
  shopping: 'Looking for something to buy? I can find it and add it to your cart.',
  track: "Let's find your order — I can pull up its status right here.",
  support: 'I can help with that. Connecting you to the right support flow…',
  faq: "Here's what I found in our help center to answer that.",
}
function classify(text: string): QuickPromptIntent {
  const t = text.toLowerCase()
  if (/track|order|where|deliver|shipment|arriv|parcel/.test(t)) return 'track'
  if (/buy|shop|product|boot|shoe|size|price|cart|looking for|red|dress/.test(t)) return 'shopping'
  if (/refund|return|invoice|cancel|agent|human|complain/.test(t)) return 'support'
  return 'faq'
}
function sendChat() {
  const t = chatInput.value.trim()
  if (!t) return
  chatResult.value = { text: t, intent: classify(t) }
  chatInput.value = ''
}
</script>

<template>
  <MpBuilderShell
    v-if="chatbot && cfg"
    title="Customize your widget"
    :subtitle="`${chatbot.store} · appearance & branding`"
    back-label="Back to Chatbots"
    :dirty="isDirty"
    persistence-mode="live"
    @back="goBack"
  >
    <template #actions>
      <v-btn variant="text" class="text-none text-medium-emphasis" size="small" prepend-icon="eye" @click="focusPreview">Preview Chatbot</v-btn>
      <v-btn color="primary" variant="flat" size="small" class="text-none" prepend-icon="rocket" @click="publishOpen = true">Publish Chatbot</v-btn>
    </template>

      <div class="cb__body d-flex h-100 overflow-hidden">
        <!-- Section nav -->
        <nav class="cb__nav border-r bg-surface py-3 flex-shrink-0" aria-label="Chatbot settings">
          <div v-for="group in NAV_GROUPS" :key="group.title" class="cb__nav-group">
            <div class="cb__nav-heading text-caption text-medium-emphasis font-weight-bold text-uppercase px-3 mb-1">{{ group.title }}</div>
            <button
              v-for="n in group.items"
              :key="n.key"
              type="button"
              class="cb__nav-item text-none"
              :class="{ 'cb__nav-item--on': section === n.key }"
              @click="section = n.key"
            >
              <v-icon size="18">{{ n.icon }}</v-icon>
              <span>{{ n.label }}</span>
              <v-tooltip v-if="isSectionLocked(n.key)" text="Upgrade to unlock" location="top">
                <template #activator="{ props }">
                  <v-icon v-bind="props" size="14" class="cb__nav-crown">crown</v-icon>
                </template>
              </v-tooltip>
            </button>
          </div>
        </nav>

        <!-- Settings panel -->
        <div class="cb__panel flex-grow-1 overflow-y-auto pa-6">
          <div class="cb__panel-inner">
            <!-- PLAN-LOCKED CAPABILITY -->
            <template v-if="isSectionLocked(section)">
              <v-card flat border rounded="lg" class="d-flex flex-column justify-center">
                <MpEmptyState
                  icon="sparkles"
                  title="Not included in your plan"
                  :description="lockedDescription"
                  action-label="View plans"
                  action-icon="arrow-right"
                  class="py-10"
                  @action="viewPlans"
                />
                <div class="d-flex justify-center pb-8">
                  <v-btn variant="text" class="text-none" :href="salesMailto">Talk to sales</v-btn>
                </div>
              </v-card>
            </template>

            <!-- GENERAL -->
            <template v-else-if="section === 'general'">
              <v-card flat border rounded="lg" class="pa-6 mb-5">
                <div class="text-subtitle-1 font-weight-bold mb-1">General</div>
                <div class="text-body-2 text-medium-emphasis mb-5">Configure your store details shown in the chat widget.</div>
                <v-text-field v-model="cfg.storeName" label="Store name" variant="outlined" density="comfortable" class="mb-4" />
                <v-text-field v-model="cfg.address1" label="Address 1" variant="outlined" density="comfortable" class="mb-4" />
                <v-text-field v-model="cfg.address2" label="Address 2" variant="outlined" density="comfortable" class="mb-4" />
                <v-text-field v-model="cfg.instagram" label="Instagram link" variant="outlined" density="comfortable" prepend-inner-icon="instagram" hide-details />
              </v-card>
              <v-card flat border rounded="lg" class="pa-6">
                <div class="text-subtitle-1 font-weight-bold mb-4">Storefront</div>
                <v-select v-model="cfg.storeType" label="Store type" :items="storeTypes" variant="outlined" density="comfortable" placeholder="Select store type" class="mb-4" />
                <v-text-field v-model="cfg.storeUrl" label="Store URL" variant="outlined" density="comfortable" placeholder="https://mystore.com" prepend-inner-icon="link" hide-details />
              </v-card>
            </template>

            <!-- APPEARANCE -->
            <template v-else-if="section === 'appearance'">
              <v-card flat border rounded="lg" class="pa-6 mb-5">
                <div class="text-subtitle-1 font-weight-bold mb-1">Brand logo</div>
                <div class="text-body-2 text-medium-emphasis mb-4">Upload your logo and set your brand colors.</div>
                <div class="cb-upload d-flex align-center justify-center ga-3 mb-2" @click="cfg.logoName = 'logo.png'">
                  <v-icon size="20">upload</v-icon>
                  <span class="text-body-2 font-weight-medium">{{ cfg.logoName || 'Upload logo' }}</span>
                </div>
                <div class="text-caption text-medium-emphasis">Recommended 160×160px · PNG or SVG</div>

                <v-divider class="my-5" />
                <div class="text-subtitle-2 font-weight-bold mb-1">Primary color</div>
                <div class="text-body-2 text-medium-emphasis mb-3">Set your brand color.</div>
                <div class="d-flex flex-wrap ga-2 mb-4">
                  <button
                    v-for="c in swatches"
                    :key="c"
                    type="button"
                    class="cb-swatch"
                    :class="{ 'cb-swatch--on': cfg.primaryColor.toLowerCase() === c.toLowerCase() }"
                    :style="{ background: c }"
                    :aria-label="`Use ${c}`"
                    @click="cfg.primaryColor = c"
                  >
                    <v-icon v-if="cfg.primaryColor.toLowerCase() === c.toLowerCase()" size="14" color="white">check</v-icon>
                  </button>
                </div>
                <div class="text-caption text-medium-emphasis mb-1">Custom color</div>
                <div class="d-flex align-center ga-2">
                  <v-menu :close-on-content-click="false" location="bottom start">
                    <template #activator="{ props }">
                      <button v-bind="props" class="cb-swatch cb-swatch--sm" :style="{ background: cfg.primaryColor }" aria-label="Pick custom color" />
                    </template>
                    <v-color-picker v-model="cfg.primaryColor" mode="hex" :modes="['hex']" />
                  </v-menu>
                  <v-text-field v-model="cfg.primaryColor" variant="outlined" density="compact" hide-details style="max-width:160px;" />
                </div>
              </v-card>

              <v-card flat border rounded="lg" class="pa-6">
                <div class="text-subtitle-1 font-weight-bold mb-4">Widget configuration</div>
                <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-2">Launcher position</div>
                <v-row dense class="mb-4">
                  <v-col cols="6">
                    <v-card flat border rounded="lg" class="pa-4 text-center cursor-pointer cb-pos" :class="{ 'cb-pos--on': cfg.position === 'left' }" @click="cfg.position = 'left'">
                      <v-icon size="24" class="mb-1">panel-bottom-dashed</v-icon>
                      <div class="text-body-2 font-weight-medium">Bottom left</div>
                    </v-card>
                  </v-col>
                  <v-col cols="6">
                    <v-card flat border rounded="lg" class="pa-4 text-center cursor-pointer cb-pos" :class="{ 'cb-pos--on': cfg.position === 'right' }" @click="cfg.position = 'right'">
                      <v-icon size="24" class="mb-1">panel-bottom-dashed</v-icon>
                      <div class="text-body-2 font-weight-medium">Bottom right</div>
                    </v-card>
                  </v-col>
                </v-row>
                <v-text-field v-model="cfg.welcomeMessage" label="Welcome message *" variant="outlined" density="comfortable" hide-details />
              </v-card>
            </template>

            <!-- BUSINESS HOURS -->
            <template v-else-if="section === 'hours'">
              <v-card flat border rounded="lg" class="pa-6">
                <div class="text-subtitle-1 font-weight-bold mb-1">Business hours</div>
                <div class="text-body-2 text-medium-emphasis mb-5">Set when live support is available. Outside these hours the bot handles chats.</div>
                <div v-for="h in cfg.businessHours" :key="h.day" class="cb-hour d-flex align-center ga-3">
                  <v-switch v-model="h.enabled" color="primary" density="compact" hide-details class="flex-shrink-0" />
                  <span class="cb-hour__day font-weight-medium">{{ h.day }}</span>
                  <template v-if="h.enabled">
                    <v-text-field v-model="h.open" type="time" variant="outlined" density="compact" hide-details class="cb-hour__time" />
                    <span class="text-medium-emphasis">to</span>
                    <v-text-field v-model="h.close" type="time" variant="outlined" density="compact" hide-details class="cb-hour__time" />
                  </template>
                  <span v-else class="text-body-2 text-medium-emphasis">Closed</span>
                </div>
              </v-card>
            </template>

            <!-- QUICK PROMPTS -->
            <template v-else-if="section === 'prompts'">
              <v-card flat border rounded="lg" class="pa-6">
                <div class="d-flex align-center justify-space-between mb-1">
                  <div class="text-subtitle-1 font-weight-bold">Quick prompts</div>
                  <v-btn size="small" variant="tonal" color="primary" prepend-icon="plus" class="text-none" @click="addPrompt">Add prompt</v-btn>
                </div>
                <div class="text-body-2 text-medium-emphasis mb-5">Predefined options shown when a customer starts a chat. The <strong>intent</strong> routes the reply to shopping, order tracking, support, or FAQ.</div>
                <div v-for="(p, i) in cfg.quickPrompts" :key="p.id" class="cb-prompt mb-2">
                  <div class="d-flex align-center ga-2">
                    <v-text-field v-model="p.text" variant="outlined" density="compact" hide-details class="flex-grow-1" />
                    <v-select v-model="p.intent" :items="INTENTS" variant="outlined" density="compact" hide-details class="cb-prompt__intent" />
                    <v-btn icon="chevron-up" variant="text" size="x-small" :disabled="i === 0" aria-label="Move up" @click="movePrompt(i, -1)" />
                    <v-btn icon="chevron-down" variant="text" size="x-small" :disabled="i === cfg.quickPrompts.length - 1" aria-label="Move down" @click="movePrompt(i, 1)" />
                    <v-switch v-model="p.enabled" color="primary" density="compact" hide-details class="flex-shrink-0" />
                    <v-btn icon="trash-2" variant="text" size="x-small" color="error" aria-label="Delete prompt" @click="removePrompt(p.id)" />
                  </div>
                </div>
              </v-card>
            </template>

            <!-- SHOPPING ASSISTANT -->
            <template v-else-if="section === 'shopping'">
              <v-card flat border rounded="lg" class="pa-6 mb-5">
                <div class="d-flex align-start justify-space-between ga-4">
                  <div>
                    <div class="text-subtitle-1 font-weight-bold mb-1">Shopping assistant</div>
                    <div class="text-body-2 text-medium-emphasis">Let the bot recommend products, answer product questions, and add items to cart inside the chat.</div>
                  </div>
                  <v-switch v-model="cfg.shopping.enabled" color="primary" density="compact" hide-details inset class="flex-shrink-0 mt-n1" />
                </div>
              </v-card>
              <v-card flat border rounded="lg" class="pa-6" :class="{ 'cb-dim': !cfg.shopping.enabled }">
                <div class="text-subtitle-2 font-weight-bold mb-4">Assistant behaviour</div>
                <v-textarea v-model="cfg.shopping.greeting" label="Shopping greeting" variant="outlined" density="comfortable" rows="2" auto-grow :disabled="!cfg.shopping.enabled" class="mb-4" />
                <v-select v-model="cfg.shopping.source" :items="catalogSources" label="Product source" variant="outlined" density="comfortable" :disabled="!cfg.shopping.enabled" class="mb-4" />
                <v-switch v-model="cfg.shopping.showPrices" color="primary" density="comfortable" hide-details label="Show prices on product cards" :disabled="!cfg.shopping.enabled" class="mb-1" />
                <v-switch v-model="cfg.shopping.allowAddToCart" color="primary" density="comfortable" hide-details label="Allow add to cart from the chat" :disabled="!cfg.shopping.enabled" class="mb-4" />
                <v-text-field v-model="cfg.shopping.checkoutUrl" label="Checkout URL" placeholder="https://mystore.com/checkout" variant="outlined" density="comfortable" prepend-inner-icon="link" hide-details :disabled="!cfg.shopping.enabled" />
              </v-card>
            </template>

            <!-- ORDER TRACKING -->
            <template v-else-if="section === 'tracking'">
              <v-card flat border rounded="lg" class="pa-6 mb-5">
                <div class="d-flex align-start justify-space-between ga-4">
                  <div>
                    <div class="text-subtitle-1 font-weight-bold mb-1">Order tracking</div>
                    <div class="text-body-2 text-medium-emphasis">Let customers check order status in chat — with an account or as a guest.</div>
                  </div>
                  <v-switch v-model="cfg.orderTracking.enabled" color="primary" density="compact" hide-details inset class="flex-shrink-0 mt-n1" />
                </div>
              </v-card>
              <v-card flat border rounded="lg" class="pa-6" :class="{ 'cb-dim': !cfg.orderTracking.enabled }">
                <div class="text-subtitle-2 font-weight-bold mb-4">Tracking options</div>
                <v-switch v-model="cfg.orderTracking.allowGuest" color="primary" density="comfortable" hide-details label="Allow guest order tracking (no account required)" :disabled="!cfg.orderTracking.enabled" class="mb-1" />
                <v-text-field v-model="cfg.orderTracking.guestPortal" label="Guest tracking portal URL" placeholder="https://mystore.com/track" variant="outlined" density="comfortable" prepend-inner-icon="link" :disabled="!cfg.orderTracking.enabled || !cfg.orderTracking.allowGuest" class="my-4" />
                <v-switch v-model="cfg.orderTracking.resendEmail" color="primary" density="comfortable" hide-details label="Offer to resend the confirmation email" :disabled="!cfg.orderTracking.enabled" class="mb-1" />
                <v-switch v-model="cfg.orderTracking.accountSync" color="primary" density="comfortable" hide-details label="Sync live order status for logged-in customers" :disabled="!cfg.orderTracking.enabled" />
              </v-card>
            </template>

            <!-- KNOWLEDGE BASE -->
            <template v-else-if="section === 'knowledge'">
              <v-card flat border rounded="lg" class="pa-6 mb-5">
                <div class="d-flex align-center justify-space-between mb-1">
                  <div class="text-subtitle-1 font-weight-bold">Knowledge base</div>
                  <span v-if="cfg.knowledgeSources.length" class="text-caption text-medium-emphasis">
                    <span class="text-success font-weight-bold">{{ activeSourceCount }}</span> of {{ cfg.knowledgeSources.length }} active
                  </span>
                </div>
                <div class="text-body-2 text-medium-emphasis mb-5">Connect and manage the sources that power your AI responses.</div>

                <div
                  v-for="s in cfg.knowledgeSources"
                  :key="s.id"
                  class="cb-source d-flex align-center ga-3"
                  :class="{ 'cb-source--off': !s.enabled }"
                >
                  <div class="cb-source__icon"><v-icon size="18">{{ s.icon }}</v-icon></div>
                  <div class="flex-grow-1 min-width-0">
                    <div class="d-flex align-center ga-2">
                      <span class="text-body-2 font-weight-medium text-truncate">{{ s.name }}</span>
                      <v-chip size="x-small" variant="tonal" :color="statusColor[s.status]" class="flex-shrink-0">
                        <v-progress-circular
                          v-if="s.status === 'Indexing'"
                          indeterminate
                          size="10"
                          width="2"
                          class="me-1"
                        />
                        {{ s.status }}
                      </v-chip>
                    </div>
                    <div class="text-caption text-medium-emphasis text-truncate">
                      {{ sourceKind(s.icon) }} · {{ s.items }} items · {{ s.meta }}
                    </div>
                  </div>
                  <v-switch
                    v-model="s.enabled"
                    color="primary"
                    density="compact"
                    hide-details
                    inset
                    class="flex-shrink-0"
                    :aria-label="`Enable ${s.name}`"
                  />
                  <div class="cb-source__actions d-flex align-center flex-shrink-0">
                    <v-tooltip text="Re-sync" location="top">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon="refresh-cw" variant="text" size="x-small" color="medium-emphasis" aria-label="Re-sync source" />
                      </template>
                    </v-tooltip>
                    <v-tooltip text="Remove" location="top">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon="trash-2" variant="text" size="x-small" color="error" aria-label="Remove source" @click="askRemoveSource(s.id)" />
                      </template>
                    </v-tooltip>
                  </div>
                </div>

                <div v-if="!cfg.knowledgeSources.length" class="cb-kb-empty text-center py-8">
                  <v-icon size="30" class="mb-2 text-medium-emphasis">book-open</v-icon>
                  <div class="text-body-2 font-weight-medium">No sources connected yet</div>
                  <div class="text-caption text-medium-emphasis">Add a website or upload files below to power your AI responses.</div>
                </div>
              </v-card>

              <v-card flat border rounded="lg" class="pa-6">
                <div class="text-subtitle-1 font-weight-bold mb-4">Add a source</div>
                <v-btn-toggle v-model="addSourceTab" mandatory density="comfortable" variant="outlined" divided rounded="lg" class="mp-toggle-group mp-toggle-group--segmented mb-4">
                  <v-btn value="url" size="small" class="text-none px-4" prepend-icon="link">Website URL</v-btn>
                  <v-btn value="questionnaire" size="small" class="text-none px-4" prepend-icon="clipboard-list">Questionnaire</v-btn>
                  <v-btn value="upload" size="small" class="text-none px-4" prepend-icon="upload">Upload files</v-btn>
                </v-btn-toggle>

                <template v-if="addSourceTab === 'url'">
                  <div class="d-flex align-start ga-2">
                    <v-text-field
                      v-model="newUrl"
                      placeholder="https://mystore.com/faq"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="globe"
                      hide-details
                      class="flex-grow-1"
                      aria-label="Website URL"
                      @keyup.enter="addUrlSource"
                    />
                    <v-btn
                      color="primary"
                      variant="flat"
                      class="text-none cb-add-btn"
                      prepend-icon="plus"
                      :disabled="!newUrl.trim()"
                      @click="addUrlSource"
                    >Add source</v-btn>
                  </div>
                  <div class="text-caption text-medium-emphasis mt-2">We'll crawl the page and index its text — this can take a minute.</div>
                </template>

                <template v-else-if="addSourceTab === 'questionnaire'">
                  <div class="text-body-2 text-medium-emphasis mb-4">
                    Answer a few questions about your business and we'll turn them into a knowledge source. No website or files needed — you can update your answers any time.
                  </div>
                  <v-btn color="primary" variant="flat" class="text-none" prepend-icon="clipboard-list" @click="kbDrawer = true">
                    Fill questionnaire
                  </v-btn>
                </template>

                <div v-else class="cb-drop d-flex flex-column align-center justify-center text-center">
                  <v-icon size="28" class="mb-2 text-medium-emphasis">upload-cloud</v-icon>
                  <div class="text-body-2 font-weight-medium">Drag &amp; drop, or click to upload</div>
                  <div class="text-caption text-medium-emphasis">Max 5 MB · MD (preferred), TXT, or PDF</div>
                </div>
              </v-card>

              <MpConfirmDialog
                v-model="removeDialog"
                title="Remove source?"
                :message="`“${sourceToRemoveName}” will stop powering your AI responses. This can't be undone.`"
                confirm-label="Remove source"
                danger
                @confirm="confirmRemoveSource"
              />

              <MpFormDrawer
                v-model="kbDrawer"
                title="Knowledge base questionnaire"
                subtitle="Answer what you can — we'll turn it into a knowledge source. You can update it later."
                :width="520"
              >
                <div v-for="(q, i) in kbQuestions" :key="q.key" :class="{ 'mb-5': i < kbQuestions.length - 1 }">
                  <label class="text-body-2 font-weight-medium d-block mb-2">{{ q.label }}</label>
                  <v-textarea
                    v-model="kbAnswers[q.key]"
                    :placeholder="q.placeholder"
                    variant="outlined"
                    density="comfortable"
                    rows="2"
                    auto-grow
                    hide-details
                  />
                </div>
                <template #footer>
                  <span class="text-caption text-medium-emphasis me-auto">{{ kbAnsweredCount }} of {{ kbQuestions.length }} answered</span>
                  <v-btn variant="text" class="text-none" @click="kbDrawer = false">Cancel</v-btn>
                  <v-btn
                    color="primary"
                    variant="flat"
                    class="text-none"
                    prepend-icon="sparkles"
                    :disabled="kbAnsweredCount === 0"
                    @click="submitQuestionnaire"
                  >Create knowledge base</v-btn>
                </template>
              </MpFormDrawer>
            </template>

            <!-- PRE-CHAT FORM -->
            <template v-else>
              <v-card flat border rounded="lg" class="pa-6 mb-5">
                <div class="text-subtitle-1 font-weight-bold mb-4">Form settings</div>
                <v-switch v-model="cfg.preChatEnabled" color="primary" density="comfortable" hide-details label="Show a pre-chat form before starting a conversation" class="mb-1" />
                <v-switch v-model="cfg.skipForLoggedIn" color="primary" density="comfortable" hide-details label="Skip the form for logged-in users" :disabled="!cfg.preChatEnabled" />
              </v-card>

              <v-card flat border rounded="lg" class="pa-6" :class="{ 'cb-dim': !cfg.preChatEnabled }">
                <div class="d-flex align-center justify-space-between mb-4">
                  <div class="text-subtitle-1 font-weight-bold">Form fields</div>
                  <v-btn size="small" variant="tonal" color="primary" prepend-icon="plus" class="text-none" :disabled="!cfg.preChatEnabled" @click="addField">Add field</v-btn>
                </div>
                <div v-for="(f, i) in cfg.preChatFields" :key="f.id" class="cb-field mb-3">
                  <div class="d-flex align-center ga-2 mb-2">
                    <span class="text-caption font-weight-bold text-medium-emphasis">#{{ i + 1 }}</span>
                    <v-spacer />
                    <v-btn icon="chevron-up" variant="text" size="x-small" :disabled="i === 0 || !cfg.preChatEnabled" aria-label="Move up" @click="moveField(i, -1)" />
                    <v-btn icon="chevron-down" variant="text" size="x-small" :disabled="i === cfg.preChatFields.length - 1 || !cfg.preChatEnabled" aria-label="Move down" @click="moveField(i, 1)" />
                    <v-switch v-model="f.required" color="primary" density="compact" hide-details :disabled="!cfg.preChatEnabled" class="flex-shrink-0" />
                    <span class="text-caption text-medium-emphasis">Required</span>
                    <v-btn icon="trash-2" variant="text" size="x-small" color="error" :disabled="!cfg.preChatEnabled" aria-label="Delete field" @click="removeField(f.id)" />
                  </div>
                  <v-row dense>
                    <v-col cols="12" sm="6"><v-text-field v-model="f.label" label="Label" variant="outlined" density="compact" hide-details :disabled="!cfg.preChatEnabled" /></v-col>
                    <v-col cols="12" sm="6"><v-select v-model="f.type" label="Type" :items="FIELD_TYPES" variant="outlined" density="compact" hide-details :disabled="!cfg.preChatEnabled" /></v-col>
                    <v-col cols="12"><v-text-field v-model="f.placeholder" label="Placeholder" variant="outlined" density="compact" hide-details :disabled="!cfg.preChatEnabled" /></v-col>
                  </v-row>
                </div>
              </v-card>
            </template>
          </div>
        </div>

        <!-- Live preview -->
        <div id="cb-preview" class="cb__preview bg-background d-flex flex-column align-center pa-6 flex-shrink-0" tabindex="-1">
          <div class="d-flex align-center justify-space-between w-100 mb-3">
            <span class="text-caption text-medium-emphasis font-weight-bold text-uppercase">Preview</span>
          </div>
          <div class="cb-scenarios d-flex flex-wrap ga-1 mb-3 align-self-start">
            <button
              v-for="t in scenarioTabs"
              :key="t.key"
              type="button"
              class="cb-scenario"
              :class="{ 'cb-scenario--on': previewScenario === t.key }"
              @click="previewScenario = t.key"
            >{{ t.label }}</button>
          </div>

          <div class="cb-widget" :style="{ '--brand': cfg.primaryColor }">
            <div class="cb-widget__head">
              <div class="cb-widget__avatar"><v-icon size="18" color="white">message-circle</v-icon></div>
              <div class="min-width-0">
                <div class="cb-widget__name text-truncate">{{ cfg.brandName }}</div>
                <div class="cb-widget__sub">{{ cfg.brandSubtitle }}</div>
              </div>
              <v-icon size="18" color="white" class="cb-widget__x">x</v-icon>
            </div>

            <div class="cb-widget__body">
              <!-- WELCOME -->
              <template v-if="previewScenario === 'welcome'">
                <div class="cb-b">{{ cfg.welcomeMessage }}</div>
                <div class="cb-chips">
                  <span v-for="p in enabledPrompts" :key="p.id" class="cb-chip">{{ p.text }}</span>
                </div>
              </template>

              <!-- SHOPPING -->
              <template v-else-if="previewScenario === 'shopping'">
                <div class="cb-b">{{ cfg.shopping.greeting }}</div>
                <div class="cb-u">red boots size 11</div>
                <div class="cb-b">Here are a few great matches:</div>
                <div class="cb-products">
                  <div v-for="p in cbProducts" :key="p.id" class="cb-product">
                    <div class="cb-product__thumb">
                      <v-icon size="22">{{ p.icon }}</v-icon>
                      <span v-if="p.salePrice" class="cb-product__sale">SALE</span>
                    </div>
                    <div class="cb-product__name">{{ p.name }}</div>
                    <div v-if="cfg.shopping.showPrices" class="cb-product__price">
                      <span v-if="p.salePrice" class="cb-product__was">{{ money(p.price) }}</span>
                      <span class="cb-product__now">{{ money(p.salePrice ?? p.price) }}</span>
                    </div>
                    <button v-if="cfg.shopping.allowAddToCart" type="button" class="cb-product__add" @click="addToCart">Add to cart</button>
                  </div>
                </div>
                <template v-if="cartAdded">
                  <div class="cb-b">Added <strong>{{ cbProducts[0]?.name }}</strong> to your cart 🛒</div>
                  <div class="cb-chips">
                    <span class="cb-chip cb-chip--solid">Proceed to checkout</span>
                    <span class="cb-chip">Keep shopping</span>
                  </div>
                </template>
              </template>

              <!-- ORDER TRACKING -->
              <template v-else-if="previewScenario === 'tracking'">
                <div class="cb-b">Sure — do you have an account with us?</div>
                <div class="cb-u">{{ cfg.orderTracking.allowGuest ? 'No, I checked out as guest' : 'Yes, I have an account' }}</div>
                <div class="cb-b">Here's your latest order:</div>
                <div class="cb-order">
                  <div class="cb-order__row"><span>Order</span><strong>#88592</strong></div>
                  <div class="cb-order__row"><span>Status</span><span class="cb-order__status">Out for delivery</span></div>
                  <div class="cb-order__row"><span>ETA</span><strong>Fri, 21 Dec</strong></div>
                </div>
                <div v-if="cfg.orderTracking.allowGuest" class="cb-links">
                  <div class="cb-link"><v-icon size="13">external-link</v-icon> Open guest tracking portal</div>
                  <div v-if="cfg.orderTracking.resendEmail" class="cb-link"><v-icon size="13">mail</v-icon> Resend confirmation email</div>
                </div>
                <div class="cb-chips">
                  <span class="cb-chip">My order hasn't arrived</span>
                  <span class="cb-chip">Change delivery address</span>
                </div>
              </template>

              <!-- OPEN CHAT (intent routing) -->
              <template v-else-if="previewScenario === 'openchat'">
                <div class="cb-b">Ask me anything — I'll understand and route you to the right place.</div>
                <template v-if="chatResult">
                  <div class="cb-u">{{ chatResult.text }}</div>
                  <div class="cb-route"><v-icon size="12">git-branch</v-icon> Routed to {{ intentLabel[chatResult.intent] }}</div>
                  <div class="cb-b">{{ intentReply[chatResult.intent] }}</div>
                </template>
              </template>

              <!-- PRE-CHAT -->
              <template v-else>
                <div class="cb-pc__title">Welcome to {{ cfg.storeName }}</div>
                <div class="cb-pc__sub">Share a few details so we can help you faster.</div>
                <div v-for="f in cfg.preChatFields" :key="f.id" class="cb-pc__field">
                  <div class="cb-pc__label">{{ f.label }}{{ f.required ? ' *' : '' }}</div>
                  <div class="cb-pc__input" :class="{ 'cb-pc__input--area': f.type === 'Text Area' }">{{ f.placeholder }}</div>
                </div>
                <div class="cb-widget__cta">Start chat</div>
              </template>
            </div>

            <div class="cb-widget__input">
              <template v-if="previewScenario === 'openchat'">
                <input v-model="chatInput" class="cb-widget__field" placeholder="Try: where is my order?" aria-label="Message" @keyup.enter="sendChat" />
                <v-icon size="16" class="cb-widget__send" role="button" aria-label="Send" @click="sendChat">send</v-icon>
              </template>
              <template v-else>
                <span class="text-medium-emphasis">Write a message…</span>
                <v-icon size="16" class="text-medium-emphasis">send</v-icon>
              </template>
            </div>
            <div class="cb-widget__foot">Powered by Maropost</div>
          </div>
        </div>
      </div>

      <v-snackbar v-model="saved" :timeout="2200" color="success" rounded="pill" location="bottom center">
        <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> Chatbot published</div>
      </v-snackbar>

      <!-- Publish modal -->
      <v-dialog v-model="publishOpen" max-width="560">
        <v-card flat rounded="lg" class="pa-6">
          <div class="d-flex align-start justify-space-between mb-1">
            <div class="text-h6 font-weight-bold">Publish chatbot</div>
            <v-btn icon="x" variant="text" size="small" aria-label="Close" @click="publishOpen = false" />
          </div>
          <div class="text-body-2 text-medium-emphasis mb-4">Copy this snippet into your website to make your chatbot live.</div>

          <div class="cb-install">
            <div class="cb-install__bar d-flex align-center justify-space-between">
              <span class="text-caption font-weight-bold text-medium-emphasis">Installation script</span>
              <v-btn size="x-small" variant="tonal" :color="copied ? 'success' : 'primary'" class="text-none" :prepend-icon="copied ? 'check' : 'copy'" @click="copyScript">
                {{ copied ? 'Copied' : 'Copy' }}
              </v-btn>
            </div>
            <pre class="cb-install__code">{{ installScript }}</pre>
          </div>

          <div class="text-subtitle-2 font-weight-bold mt-5 mb-2">How to install</div>
          <ol class="cb-steps text-body-2 text-medium-emphasis">
            <li>Copy the script above.</li>
            <li>Paste it just before the closing <code>&lt;/body&gt;</code> tag on your site.</li>
            <li>Save and publish your website changes.</li>
            <li>The chatbot appears in the {{ cfg.position === 'left' ? 'bottom-left' : 'bottom-right' }} corner.</li>
          </ol>

          <div class="d-flex justify-end mt-5">
            <v-btn color="primary" variant="flat" class="text-none" prepend-icon="rocket" @click="finishPublish">Publish &amp; done</v-btn>
          </div>
        </v-card>
      </v-dialog>

      <MpConfirmDialog
        v-model="confirmLeave"
        danger
        :title="leaveTitle"
        :message="leaveMessage"
        :confirm-label="leaveConfirmLabel"
        @confirm="discardAndLeave"
      />
  </MpBuilderShell>
</template>

<style scoped>
.border-r { border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }

.cb__nav { width: 220px; display: flex; flex-direction: column; gap: 2px; padding-inline: 10px; }
.cb__nav-group { display: flex; flex-direction: column; gap: 2px; }
.cb__nav-group + .cb__nav-group { margin-top: 12px; }
.cb__nav-heading { letter-spacing: 0.04em; }
.cb__nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 10px;
  border: 0;
  background: none;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.7);
  cursor: pointer;
  text-align: left;
  transition: background 120ms ease, color 120ms ease;
}
.cb__nav-item:hover { background: rgba(var(--v-theme-on-surface), 0.04); color: rgb(var(--v-theme-on-surface)); }
.cb__nav-item--on { background: rgba(var(--v-theme-primary), 0.1); color: rgb(var(--v-theme-primary)); }
.cb__nav-crown { margin-left: auto; color: rgb(var(--v-theme-warning)); flex-shrink: 0; }

.cb__panel { min-width: 0; }
.cb__panel-inner { max-width: 640px; }

.cb-upload {
  border: 1.5px dashed rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 10px;
  padding: 20px;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease;
}
.cb-upload:hover { border-color: rgba(var(--v-theme-primary), 0.4); background: rgba(var(--v-theme-primary), 0.03); }

.cb-swatch {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.cb-swatch--on { box-shadow: 0 0 0 2px rgb(var(--v-theme-surface)), 0 0 0 4px rgb(var(--v-theme-primary)); }
.cb-swatch--sm { width: 40px; height: 40px; }

.cb-pos { transition: border-color 120ms ease, background 120ms ease; }
.cb-pos--on { border-color: rgb(var(--v-theme-primary)) !important; background: rgba(var(--v-theme-primary), 0.06); }

.cb-hour { padding: 6px 0; }
.cb-hour__day { width: 108px; flex-shrink: 0; }
.cb-hour__time { max-width: 130px; }

.cb-prompt__intent { max-width: 130px; }

.cb-source {
  border: 1px solid var(--mp-border-subtle);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 8px;
  transition: border-color 120ms ease, background 120ms ease;
}
.cb-source:hover {
  border-color: rgba(var(--v-theme-primary), 0.35);
  background: rgba(var(--v-theme-primary), 0.02);
}
.cb-source--off .cb-source__icon,
.cb-source--off .flex-grow-1 { opacity: 0.5; }
.cb-source__actions {
  padding-left: 4px;
  border-left: 1px solid var(--mp-border-subtle);
}
.cb-source__icon {
  width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}
.cb-add-btn { min-height: 48px; }
.cb-field {
  border: 1px solid var(--mp-border-subtle);
  border-radius: 10px;
  padding: 12px;
  background: rgba(var(--v-theme-on-surface), 0.015);
}
.cb-drop {
  border: 1.5px dashed rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 10px;
  padding: 28px;
}
.cb-dim { opacity: 0.55; }

.cb-install {
  border: 1px solid var(--mp-border-subtle);
  border-radius: 10px;
  overflow: hidden;
}
.cb-install__bar {
  padding: 8px 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-bottom: 1px solid var(--mp-border-subtle);
}
.cb-install__code {
  margin: 0;
  padding: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  color: rgb(var(--v-theme-on-surface));
  max-height: 180px;
  overflow-y: auto;
}
.cb-steps { padding-left: 20px; }
.cb-steps li { margin-bottom: 4px; }
.cb-steps code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  background: rgba(var(--v-theme-on-surface), 0.06);
  padding: 1px 5px;
  border-radius: 4px;
}

/* Live widget preview */
.cb__preview { width: 380px; }

@media (max-width: 1024px) {
  .cb__body { flex-direction: column; overflow-y: auto; }
  .cb__preview {
    width: 100%;
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.10);
    order: 3;
  }
  .cb__nav { width: 180px; }
}
@media (max-width: 768px) {
  .cb__body { flex-direction: column; }
  .cb__nav {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    border-right: none;
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  }
}
.cb-widget {
  width: 320px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--mp-border-subtle);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 18px 50px rgba(var(--v-theme-on-surface), 0.14);
  display: flex;
  flex-direction: column;
}
/* #fff on var(--brand) surfaces is deliberate throughout the widget preview:
   --brand is the merchant-picked widget color (swatch palette), not an app
   theme surface, so theme tokens don't apply. */
.cb-widget__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: var(--brand);
  color: #fff;
}
.cb-widget__avatar {
  width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
  background: rgba(255, 255, 255, 0.2);
  display: inline-flex; align-items: center; justify-content: center;
}
.cb-widget__name { font-weight: 700; font-size: 0.875rem; }
.cb-widget__sub { font-size: 0.6875rem; opacity: 0.85; }
.cb-widget__x { margin-left: auto; opacity: 0.9; }
.cb-widget__body {
  padding: 16px;
  min-height: 240px;
  max-height: 360px;
  overflow-y: auto;
  background: rgba(var(--v-theme-on-surface), 0.02);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Chat bubbles */
.cb-b {
  align-self: flex-start;
  max-width: 90%;
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--mp-border-subtle);
  border-radius: 12px 12px 12px 4px;
  padding: 9px 12px;
  font-size: 0.8125rem;
  line-height: 1.4;
}
.cb-u {
  align-self: flex-end;
  max-width: 90%;
  background: var(--brand);
  color: #fff;
  border-radius: 12px 12px 4px 12px;
  padding: 9px 12px;
  font-size: 0.8125rem;
  line-height: 1.4;
}

/* Quick-reply chips */
.cb-chips { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
.cb-chip {
  border: 1px solid var(--brand);
  color: var(--brand);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgb(var(--v-theme-surface));
}
.cb-chip--solid { background: var(--brand); color: #fff; }

/* Product carousel */
.cb-products { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
.cb-product {
  flex: 0 0 130px;
  border: 1px solid var(--mp-border-subtle);
  border-radius: 10px;
  background: rgb(var(--v-theme-surface));
  padding: 8px;
}
.cb-product__thumb {
  position: relative;
  height: 74px;
  border-radius: 7px;
  background: color-mix(in oklch, var(--brand) 10%, transparent);
  color: var(--brand);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
}
.cb-product__sale {
  position: absolute;
  top: 5px;
  left: 5px;
  background: rgb(var(--v-theme-error));
  color: rgb(var(--v-theme-on-error));
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 1px 5px;
  border-radius: 4px;
}
.cb-product__name {
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1.25;
  margin-bottom: 3px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cb-product__price { display: flex; align-items: baseline; gap: 4px; margin-bottom: 6px; }
.cb-product__was { font-size: 0.625rem; color: rgba(var(--v-theme-on-surface), 0.45); text-decoration: line-through; }
.cb-product__now { font-size: 0.75rem; font-weight: 700; }
.cb-product__add {
  width: 100%;
  background: var(--brand);
  color: #fff;
  border: 0;
  border-radius: 6px;
  padding: 5px;
  font-size: 0.6875rem;
  font-weight: 600;
  cursor: pointer;
}

/* Order status card */
.cb-order {
  border: 1px solid var(--mp-border-subtle);
  border-radius: 10px;
  background: rgb(var(--v-theme-surface));
  padding: 10px 12px;
}
.cb-order__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  padding: 3px 0;
}
.cb-order__row span:first-child { color: rgba(var(--v-theme-on-surface), 0.55); }
.cb-order__status { color: rgb(var(--v-theme-success)); font-weight: 700; }
.cb-links { display: flex; flex-direction: column; gap: 6px; }
.cb-link {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--mp-border-subtle);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 0.75rem;
  font-weight: 500;
  background: rgb(var(--v-theme-surface));
}
.cb-route {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--brand);
  background: color-mix(in oklch, var(--brand) 12%, transparent);
  border-radius: 999px;
  padding: 2px 8px;
}

/* Scenario switcher */
.cb-scenario {
  border: 1px solid var(--mp-border-subtle);
  background: rgb(var(--v-theme-surface));
  color: rgba(var(--v-theme-on-surface), 0.7);
  border-radius: 999px;
  padding: 4px 11px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}
.cb-scenario:hover { border-color: rgba(var(--v-theme-primary), 0.4); }
.cb-scenario--on {
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

/* Open-chat input */
.cb-widget__field {
  flex: 1 1 auto;
  border: 0;
  outline: none;
  background: transparent;
  font-size: 0.8125rem;
  color: rgb(var(--v-theme-on-surface));
}
.cb-widget__send { color: var(--brand); cursor: pointer; }
.cb-widget__input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  border-top: 1px solid var(--mp-border-subtle);
  font-size: 0.8125rem;
}
.cb-widget__foot { text-align: center; font-size: 0.625rem; color: rgba(var(--v-theme-on-surface), 0.45); padding: 6px 0 10px; }

/* Pre-chat preview */
.cb-pc__title { font-weight: 700; font-size: 0.9375rem; margin-bottom: 4px; }
.cb-pc__sub { font-size: 0.75rem; color: rgba(var(--v-theme-on-surface), 0.6); margin-bottom: 14px; }
.cb-pc__field { margin-bottom: 10px; }
.cb-pc__label { font-size: 0.6875rem; font-weight: 600; margin-bottom: 4px; }
.cb-pc__input {
  border: 1px solid var(--mp-border-subtle);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.45);
  background: rgb(var(--v-theme-surface));
}
.cb-pc__input--area { min-height: 44px; }
.cb-widget__cta {
  margin-top: 6px;
  background: var(--brand);
  color: #fff;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 600;
}
</style>
