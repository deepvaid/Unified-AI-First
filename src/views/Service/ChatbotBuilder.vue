<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatbotStore } from '@/stores/useChatbot'
import { useAccountsStore } from '@/stores/useAccounts'
import { useToast } from '@/composables/useToast'
import type { PreChatFieldType, QuickPromptIntent } from '@/stores/useChatbot'
import type { SubscriptionKey } from '@/stores/useAccounts'
import MpBuilderShell from '@/components/MpBuilderShell.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpDialog from '@/components/MpDialog.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'

const route = useRoute()
const router = useRouter()
const accountId = computed(() => route.params.accountId as string)
const id = computed(() => Number(route.params.id))

const cb = useChatbotStore()
const accounts = useAccountsStore()
const toast = useToast()
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

const addSourceTab = ref<'url' | 'questionnaire' | 'upload'>('url')
const ADD_SOURCE_ITEMS = [
  { value: 'url', label: 'Website URL' },
  { value: 'questionnaire', label: 'Questionnaire' },
  { value: 'upload', label: 'Upload files' },
]

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
  toast.success('Chatbot published')
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

      <div class="cb__body d-flex h-100">
        <!-- Section nav -->
        <nav class="cb__nav border-r bg-surface py-3 flex-shrink-0" aria-label="Chatbot settings">
          <div v-for="group in NAV_GROUPS" :key="group.title" class="cb__nav-group">
            <div class="cb__nav-heading mp-meta-label text-medium-emphasis">{{ group.title }}</div>
            <button
              v-for="n in group.items"
              :key="n.key"
              type="button"
              class="cb__nav-item text-none"
              :class="{ 'cb__nav-item--on': section === n.key }"
              :aria-current="section === n.key ? 'true' : undefined"
              @click="section = n.key"
            >
              <v-icon size="18">{{ n.icon }}</v-icon>
              <span>{{ n.label }}</span>
              <v-tooltip v-if="isSectionLocked(n.key)" text="Upgrade to unlock" location="top">
                <template #activator="{ props }">
                  <v-icon v-bind="props" size="16" class="cb__nav-crown">crown</v-icon>
                </template>
              </v-tooltip>
            </button>
          </div>
        </nav>

        <!-- Settings panel -->
        <div class="cb__panel pa-6">
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
                <MpFormSection title="General" description="Configure your store details shown in the chat widget.">
                  <MpFormGrid>
                    <v-text-field v-model="cfg.storeName" label="Store name" />
                    <v-text-field v-model="cfg.address1" label="Address 1" />
                    <v-text-field v-model="cfg.address2" label="Address 2" />
                    <v-text-field v-model="cfg.instagram" label="Instagram link" prepend-inner-icon="instagram" />
                  </MpFormGrid>
                </MpFormSection>
              </v-card>
              <v-card flat border rounded="lg" class="pa-6">
                <MpFormSection title="Storefront">
                  <MpFormGrid>
                    <v-select v-model="cfg.storeType" label="Store type" :items="storeTypes" />
                    <v-text-field v-model="cfg.storeUrl" label="Store URL" placeholder="https://mystore.com" prepend-inner-icon="link" />
                  </MpFormGrid>
                </MpFormSection>
              </v-card>
            </template>

            <!-- APPEARANCE -->
            <template v-else-if="section === 'appearance'">
              <v-card flat border rounded="lg" class="pa-6 mb-5">
                <MpFormSection title="Brand logo" description="Upload your logo and set your brand colors.">
                  <div>
                    <button type="button" class="cb-upload d-flex align-center justify-center ga-3 mb-2 w-100" @click="cfg.logoName = 'logo.png'">
                      <v-icon size="20">upload</v-icon>
                      <span class="text-body-2 font-weight-medium">{{ cfg.logoName || 'Upload logo' }}</span>
                    </button>
                    <div class="text-caption text-medium-emphasis">Recommended 160×160px · PNG or SVG</div>
                  </div>
                </MpFormSection>

                <v-divider class="my-5" />

                <MpFormSection title="Primary color" description="Set your brand color.">
                  <div class="d-flex flex-wrap ga-2">
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
                      <v-icon v-if="cfg.primaryColor.toLowerCase() === c.toLowerCase()" size="16" color="white">check</v-icon>
                    </button>
                  </div>
                  <MpFormField label="Custom color">
                    <MpFormGrid :cols="2">
                      <div class="d-flex align-center ga-2">
                      <v-menu :close-on-content-click="false" location="bottom start">
                        <template #activator="{ props }">
                          <button v-bind="props" class="cb-swatch cb-swatch--sm" :style="{ background: cfg.primaryColor }" aria-label="Pick custom color" />
                        </template>
                        <v-color-picker v-model="cfg.primaryColor" mode="hex" :modes="['hex']" />
                      </v-menu>
                      <v-text-field v-model="cfg.primaryColor" aria-label="Custom color hex value" />
                      </div>
                    </MpFormGrid>
                  </MpFormField>
                </MpFormSection>
              </v-card>

              <v-card flat border rounded="lg" class="pa-6">
                <MpFormSection title="Widget configuration">
                  <MpFormField label="Launcher position">
                    <MpFormGrid :cols="2">
                      <MpOptionCard title="Bottom left" icon="panel-bottom-dashed" :selected="cfg.position === 'left'" @click="cfg.position = 'left'" />
                      <MpOptionCard title="Bottom right" icon="panel-bottom-dashed" :selected="cfg.position === 'right'" @click="cfg.position = 'right'" />
                    </MpFormGrid>
                  </MpFormField>
                  <v-text-field v-model="cfg.welcomeMessage" label="Welcome message *" />
                </MpFormSection>
              </v-card>
            </template>

            <!-- BUSINESS HOURS -->
            <template v-else-if="section === 'hours'">
              <v-card flat border rounded="lg" class="pa-6">
                <MpFormSection title="Business hours" description="Set when live support is available. Outside these hours the bot handles chats.">
                  <div>
                    <div v-for="h in cfg.businessHours" :key="h.day" class="cb-hour d-flex align-center ga-3">
                      <v-switch v-model="h.enabled" density="compact" hide-details class="flex-shrink-0" :aria-label="`Open on ${h.day}`" />
                      <span class="cb-hour__day font-weight-medium">{{ h.day }}</span>
                      <template v-if="h.enabled">
                        <v-text-field v-model="h.open" type="time" hide-details class="cb-hour__time" />
                        <span class="text-medium-emphasis">to</span>
                        <v-text-field v-model="h.close" type="time" hide-details class="cb-hour__time" />
                      </template>
                      <span v-else class="text-body-2 text-medium-emphasis">Closed</span>
                    </div>
                  </div>
                </MpFormSection>
              </v-card>
            </template>

            <!-- QUICK PROMPTS -->
            <template v-else-if="section === 'prompts'">
              <v-card flat border rounded="lg" class="pa-6">
                <MpSectionHeader title="Quick prompts" description="Predefined options shown when a customer starts a chat. The intent routes the reply to shopping, order tracking, support, or FAQ.">
                  <template #actions>
                    <v-btn size="small" variant="tonal" color="primary" prepend-icon="plus" class="text-none" @click="addPrompt">Add prompt</v-btn>
                  </template>
                </MpSectionHeader>
                <div class="d-flex flex-column ga-2">
                  <div v-for="(p, i) in cfg.quickPrompts" :key="p.id" class="cb-prompt">
                    <div class="d-flex align-center ga-2">
                      <v-text-field v-model="p.text" hide-details class="flex-grow-1" aria-label="Prompt text" />
                      <v-select v-model="p.intent" :items="INTENTS" hide-details class="cb-prompt__intent" aria-label="Intent" />
                      <v-tooltip text="Move up" location="top">
                        <template #activator="{ props }">
                          <v-btn v-bind="props" icon="chevron-up" variant="text" size="small" :disabled="i === 0" aria-label="Move up" @click="movePrompt(i, -1)" />
                        </template>
                      </v-tooltip>
                      <v-tooltip text="Move down" location="top">
                        <template #activator="{ props }">
                          <v-btn v-bind="props" icon="chevron-down" variant="text" size="small" :disabled="i === cfg.quickPrompts.length - 1" aria-label="Move down" @click="movePrompt(i, 1)" />
                        </template>
                      </v-tooltip>
                      <v-switch v-model="p.enabled" density="compact" hide-details class="flex-shrink-0" aria-label="Enable prompt" />
                      <v-tooltip text="Delete prompt" location="top">
                        <template #activator="{ props }">
                          <v-btn v-bind="props" icon="trash-2" variant="text" size="small" color="error" aria-label="Delete prompt" @click="removePrompt(p.id)" />
                        </template>
                      </v-tooltip>
                    </div>
                  </div>
                </div>
              </v-card>
            </template>

            <!-- SHOPPING ASSISTANT -->
            <template v-else-if="section === 'shopping'">
              <v-card flat border rounded="lg" class="pa-6 mb-5">
                <div class="d-flex align-start justify-space-between ga-4">
                  <div>
                    <div class="mp-section-title mb-1">Shopping assistant</div>
                    <div class="text-body-2 text-medium-emphasis">Let the bot recommend products, answer product questions, and add items to cart inside the chat.</div>
                  </div>
                  <v-switch v-model="cfg.shopping.enabled" density="compact" hide-details inset class="flex-shrink-0 mt-n1" aria-label="Enable shopping assistant" />
                </div>
              </v-card>
              <v-card flat border rounded="lg" class="pa-6" :class="{ 'cb-dim': !cfg.shopping.enabled }">
                <MpFormSection title="Assistant behaviour">
                  <MpFormGrid>
                    <v-textarea v-model="cfg.shopping.greeting" label="Shopping greeting" rows="2" auto-grow :disabled="!cfg.shopping.enabled" />
                    <v-select v-model="cfg.shopping.source" :items="catalogSources" label="Product source" :disabled="!cfg.shopping.enabled" />
                    <v-switch v-model="cfg.shopping.showPrices" label="Show prices on product cards" :disabled="!cfg.shopping.enabled" />
                    <v-switch v-model="cfg.shopping.allowAddToCart" label="Allow add to cart from the chat" :disabled="!cfg.shopping.enabled" />
                    <v-text-field v-model="cfg.shopping.checkoutUrl" label="Checkout URL" placeholder="https://mystore.com/checkout" prepend-inner-icon="link" :disabled="!cfg.shopping.enabled" />
                  </MpFormGrid>
                </MpFormSection>
              </v-card>
            </template>

            <!-- ORDER TRACKING -->
            <template v-else-if="section === 'tracking'">
              <v-card flat border rounded="lg" class="pa-6 mb-5">
                <div class="d-flex align-start justify-space-between ga-4">
                  <div>
                    <div class="mp-section-title mb-1">Order tracking</div>
                    <div class="text-body-2 text-medium-emphasis">Let customers check order status in chat — with an account or as a guest.</div>
                  </div>
                  <v-switch v-model="cfg.orderTracking.enabled" density="compact" hide-details inset class="flex-shrink-0 mt-n1" aria-label="Enable order tracking" />
                </div>
              </v-card>
              <v-card flat border rounded="lg" class="pa-6" :class="{ 'cb-dim': !cfg.orderTracking.enabled }">
                <MpFormSection title="Tracking options">
                  <MpFormGrid>
                    <v-switch v-model="cfg.orderTracking.allowGuest" label="Allow guest order tracking (no account required)" :disabled="!cfg.orderTracking.enabled" />
                    <v-text-field v-model="cfg.orderTracking.guestPortal" label="Guest tracking portal URL" placeholder="https://mystore.com/track" prepend-inner-icon="link" :disabled="!cfg.orderTracking.enabled || !cfg.orderTracking.allowGuest" />
                    <v-switch v-model="cfg.orderTracking.resendEmail" label="Offer to resend the confirmation email" :disabled="!cfg.orderTracking.enabled" />
                    <v-switch v-model="cfg.orderTracking.accountSync" label="Sync live order status for logged-in customers" :disabled="!cfg.orderTracking.enabled" />
                  </MpFormGrid>
                </MpFormSection>
              </v-card>
            </template>

            <!-- KNOWLEDGE BASE -->
            <template v-else-if="section === 'knowledge'">
              <v-card flat border rounded="lg" class="pa-6 mb-5">
                <MpSectionHeader title="Knowledge base" description="Connect and manage the sources that power your AI responses.">
                  <template v-if="cfg.knowledgeSources.length" #actions>
                    <span class="text-caption text-medium-emphasis">
                      <span class="text-success x-strong">{{ activeSourceCount }}</span> of {{ cfg.knowledgeSources.length }} active
                    </span>
                  </template>
                </MpSectionHeader>

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
                      <v-progress-circular
                        v-if="s.status === 'Indexing'"
                        indeterminate
                        size="16"
                        width="2"
                        color="primary"
                        class="flex-shrink-0"
                        aria-label="Indexing"
                      />
                      <MpStatusChip :status="s.status" size="sm" class="flex-shrink-0" />
                    </div>
                    <div class="text-caption text-medium-emphasis text-truncate">
                      {{ sourceKind(s.icon) }} · {{ s.items }} items · {{ s.meta }}
                    </div>
                  </div>
                  <v-switch
                    v-model="s.enabled"
                    density="compact"
                    hide-details
                    inset
                    class="flex-shrink-0"
                    :aria-label="`Enable ${s.name}`"
                  />
                  <div class="cb-source__actions d-flex align-center flex-shrink-0">
                    <v-tooltip text="Re-sync" location="top">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon="refresh-cw" variant="text" size="small" class="text-medium-emphasis" aria-label="Re-sync source" />
                      </template>
                    </v-tooltip>
                    <v-tooltip text="Remove" location="top">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon="trash-2" variant="text" size="small" color="error" aria-label="Remove source" @click="askRemoveSource(s.id)" />
                      </template>
                    </v-tooltip>
                  </div>
                </div>

                <MpEmptyState
                  v-if="!cfg.knowledgeSources.length"
                  icon="book-open"
                  title="No sources connected yet"
                  description="Add a website or upload files below to power your AI responses."
                />
              </v-card>

              <v-card flat border rounded="lg" class="pa-6">
                <MpFormSection title="Add a source">
                  <MpSegmentedControl
                    v-model="addSourceTab"
                    :items="ADD_SOURCE_ITEMS"
                    size="sm"
                    ariaLabel="Source type"
                    class="align-self-start"
                  />

                  <div v-if="addSourceTab === 'url'">
                    <div class="d-flex align-start ga-2">
                      <v-text-field
                        v-model="newUrl"
                        placeholder="https://mystore.com/faq"
                        prepend-inner-icon="globe"
                        hide-details
                        class="flex-grow-1"
                        aria-label="Website URL"
                        @keyup.enter="addUrlSource"
                      />
                      <v-btn
                        color="primary"
                        variant="flat"
                        class="text-none"
                        prepend-icon="plus"
                        :disabled="!newUrl.trim()"
                        @click="addUrlSource"
                      >Add source</v-btn>
                    </div>
                    <div class="text-caption text-medium-emphasis mt-2">We'll crawl the page and index its text — this can take a minute.</div>
                  </div>

                  <template v-else-if="addSourceTab === 'questionnaire'">
                    <div class="text-body-2 text-medium-emphasis">
                      Answer a few questions about your business and we'll turn them into a knowledge source. No website or files needed — you can update your answers any time.
                    </div>
                    <div>
                      <v-btn color="primary" variant="flat" class="text-none" prepend-icon="clipboard-list" @click="kbDrawer = true">
                        Fill questionnaire
                      </v-btn>
                    </div>
                  </template>

                  <div v-else class="cb-drop d-flex flex-column align-center justify-center text-center">
                    <v-icon size="20" class="mb-2 text-medium-emphasis">upload-cloud</v-icon>
                    <div class="text-body-2 font-weight-medium">Drag &amp; drop, or click to upload</div>
                    <div class="text-caption text-medium-emphasis">Max 5 MB · MD (preferred), TXT, or PDF</div>
                  </div>
                </MpFormSection>
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
              >
                <MpFormGrid>
                  <v-textarea
                    v-for="q in kbQuestions"
                    :key="q.key"
                    v-model="kbAnswers[q.key]"
                    :label="q.label"
                    :placeholder="q.placeholder"
                    rows="2"
                    auto-grow
                  />
                </MpFormGrid>
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
                <MpFormSection title="Form settings">
                  <MpFormGrid>
                    <v-switch v-model="cfg.preChatEnabled" label="Show a pre-chat form before starting a conversation" />
                    <v-switch v-model="cfg.skipForLoggedIn" label="Skip the form for logged-in users" :disabled="!cfg.preChatEnabled" />
                  </MpFormGrid>
                </MpFormSection>
              </v-card>

              <v-card flat border rounded="lg" class="pa-6" :class="{ 'cb-dim': !cfg.preChatEnabled }">
                <MpSectionHeader title="Form fields">
                  <template #actions>
                    <v-btn size="small" variant="tonal" color="primary" prepend-icon="plus" class="text-none" :disabled="!cfg.preChatEnabled" @click="addField">Add field</v-btn>
                  </template>
                </MpSectionHeader>
                <div class="d-flex flex-column ga-3">
                  <div v-for="(f, i) in cfg.preChatFields" :key="f.id" class="cb-field">
                    <div class="d-flex align-center ga-2 mb-2">
                      <span class="text-caption x-strong text-medium-emphasis">#{{ i + 1 }}</span>
                      <v-spacer />
                      <v-tooltip text="Move up" location="top">
                        <template #activator="{ props }">
                          <v-btn v-bind="props" icon="chevron-up" variant="text" size="small" :disabled="i === 0 || !cfg.preChatEnabled" aria-label="Move up" @click="moveField(i, -1)" />
                        </template>
                      </v-tooltip>
                      <v-tooltip text="Move down" location="top">
                        <template #activator="{ props }">
                          <v-btn v-bind="props" icon="chevron-down" variant="text" size="small" :disabled="i === cfg.preChatFields.length - 1 || !cfg.preChatEnabled" aria-label="Move down" @click="moveField(i, 1)" />
                        </template>
                      </v-tooltip>
                      <v-switch v-model="f.required" density="compact" hide-details :disabled="!cfg.preChatEnabled" class="flex-shrink-0" aria-label="Required field" />
                      <span class="text-caption text-medium-emphasis">Required</span>
                      <v-tooltip text="Delete field" location="top">
                        <template #activator="{ props }">
                          <v-btn v-bind="props" icon="trash-2" variant="text" size="small" color="error" :disabled="!cfg.preChatEnabled" aria-label="Delete field" @click="removeField(f.id)" />
                        </template>
                      </v-tooltip>
                    </div>
                    <MpFormGrid :cols="2">
                      <v-text-field v-model="f.label" label="Label" :disabled="!cfg.preChatEnabled" />
                      <v-select v-model="f.type" label="Type" :items="FIELD_TYPES" :disabled="!cfg.preChatEnabled" />
                      <v-text-field v-model="f.placeholder" label="Placeholder" class="mp-form-grid__full" :disabled="!cfg.preChatEnabled" />
                    </MpFormGrid>
                  </div>
                </div>
              </v-card>
            </template>
          </div>
        </div>

        <!-- Live preview -->
        <div id="cb-preview" class="cb__preview bg-background d-flex flex-column align-center pa-6 flex-shrink-0" tabindex="-1">
          <div class="d-flex align-center justify-space-between w-100 mb-3">
            <span class="mp-meta-label text-medium-emphasis">Preview</span>
          </div>
          <div class="cb-scenarios d-flex flex-wrap ga-1 mb-3 align-self-start">
            <button
              v-for="t in scenarioTabs"
              :key="t.key"
              type="button"
              class="cb-scenario"
              :class="{ 'cb-scenario--on': previewScenario === t.key }"
              :aria-pressed="previewScenario === t.key"
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
                <button type="button" class="cb-widget__send" aria-label="Send" @click="sendChat"><v-icon size="16">send</v-icon></button>
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

      <!-- Publish modal -->
      <MpDialog
        v-model="publishOpen"
        size="md"
        title="Publish chatbot"
        subtitle="Copy this snippet into your website to make your chatbot live."
      >
        <div class="cb-install">
          <div class="cb-install__bar d-flex align-center justify-space-between">
            <span class="text-caption x-strong text-medium-emphasis">Installation script</span>
            <v-btn size="x-small" variant="tonal" :color="copied ? 'success' : 'primary'" class="text-none" :prepend-icon="copied ? 'check' : 'copy'" @click="copyScript">
              {{ copied ? 'Copied' : 'Copy' }}
            </v-btn>
          </div>
          <pre class="cb-install__code">{{ installScript }}</pre>
        </div>

        <MpFormSection title="How to install">
          <ol class="cb-steps text-body-2 text-medium-emphasis">
            <li>Copy the script above.</li>
            <li>Paste it just before the closing <code>&lt;/body&gt;</code> tag on your site.</li>
            <li>Save and publish your website changes.</li>
            <li>The chatbot appears in the {{ cfg.position === 'left' ? 'bottom-left' : 'bottom-right' }} corner.</li>
          </ol>
        </MpFormSection>

        <template #footer>
          <v-btn color="primary" variant="flat" class="text-none" prepend-icon="rocket" @click="finishPublish">Publish &amp; done</v-btn>
        </template>
      </MpDialog>

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
.border-r { border-right: 1px solid var(--border-subtle); }

/* Vuetify has no semibold utility; one scoped class instead of a 600 literal. */
.x-strong { font-weight: var(--mp-fontWeight-semibold); }

/* Section nav: rows sit on the shared listItem geometry, the same scale as MpSectionRail. */
.cb__nav { width: 220px; display: flex; flex-direction: column; gap: var(--mp-space-2); padding-inline: var(--mp-space-10); }
.cb__nav-group { display: flex; flex-direction: column; gap: var(--mp-space-2); }
.cb__nav-group + .cb__nav-group { margin-top: var(--mp-space-12); }
.cb__nav-heading { padding: var(--mp-space-6) var(--mp-component-listItem-paddingInline) var(--mp-space-4); }
.cb__nav-item {
  display: flex;
  align-items: center;
  gap: var(--mp-component-listItem-gap);
  min-height: var(--mp-component-listItem-minHeight);
  padding: var(--mp-component-listItem-paddingBlock) var(--mp-component-listItem-paddingInline);
  border-radius: var(--mp-component-nav-itemRadius);
  border: 0;
  background: none;
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  color: var(--text-secondary);
  cursor: pointer;
  text-align: left;
  transition: background var(--mp-motion-duration-fast) var(--mp-motion-easing-standard), color var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}
.cb__nav-item:hover { background: var(--surface-secondary); color: var(--on-surface); }
.cb__nav-item--on { background: var(--accent-soft); color: var(--accent-on-container); font-weight: var(--mp-fontWeight-semibold); }
.cb__nav-item:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: -2px; }
.cb__nav-crown { margin-left: auto; color: var(--warn); flex-shrink: 0; }

/* Desktop: nav | scrolling panel | preview, side by side inside a clipped body.
   These live here rather than as d-flex/overflow utilities because Vuetify's
   utilities carry !important, which made the ≤1024 block below unable to
   override them — the panel ended up either unshrinkable or squeezed to 48px. */
.cb__body { overflow: hidden; }
.cb__panel {
  min-width: 0;
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
}
.cb__panel-inner { max-width: 640px; }

.cb-upload {
  border: 1px dashed var(--border-default);
  border-radius: var(--mp-component-input-radius);
  padding: var(--mp-space-20);
  background: transparent;
  color: var(--on-surface);
  font: inherit;
  cursor: pointer;
  transition: border-color var(--mp-motion-duration-fast) var(--mp-motion-easing-standard), background var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}
.cb-upload:hover { border-color: var(--accent-default); background: var(--surface-secondary); }
.cb-upload:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }

.cb-swatch {
  width: var(--mp-component-chip-height-lg);
  height: var(--mp-component-chip-height-lg);
  border-radius: var(--mp-component-chip-radius);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.cb-swatch--on { box-shadow: 0 0 0 var(--mp-space-2) var(--surface-primary), 0 0 0 var(--mp-space-4) var(--accent-default); }
.cb-swatch:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.cb-swatch--sm { width: var(--mp-component-control-height); height: var(--mp-component-control-height); flex-shrink: 0; }

.cb-hour { padding: 6px 0; }
.cb-hour__day { width: 108px; flex-shrink: 0; }
.cb-hour__time { max-width: 130px; }

.cb-prompt__intent { max-width: 130px; }

.cb-source {
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-12);
  padding: var(--mp-space-10) var(--mp-space-12);
  margin-bottom: var(--mp-space-8);
  transition: background var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}
.cb-source:hover { background: var(--surface-secondary); }
.cb-source--off .cb-source__icon,
.cb-source--off .flex-grow-1 { opacity: 0.5; }
.cb-source__actions {
  padding-left: var(--mp-space-4);
  border-left: 1px solid var(--border-subtle);
}
.cb-source__icon {
  width: 36px; height: 36px; border-radius: var(--mp-component-chip-radius); flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--accent-soft);
  color: var(--accent-on-container);
}
.cb-field {
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-12);
  padding: var(--mp-space-12);
}
.cb-drop {
  border: 1px dashed var(--border-default);
  border-radius: var(--mp-component-input-radius);
  padding: var(--mp-space-28);
}
.cb-dim { opacity: 0.55; }

.cb-install {
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-12);
  overflow: hidden;
}
.cb-install__bar {
  padding: var(--mp-space-8) var(--mp-space-12);
  background: var(--surface-secondary);
  color: var(--on-surface);
  border-bottom: 1px solid var(--border-subtle);
}
.cb-install__code {
  margin: 0;
  padding: var(--mp-space-12);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--mp-fontSize-12);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--on-surface);
  max-height: 180px;
  overflow-y: auto;
}
.cb-steps { padding-left: var(--mp-space-20); }
.cb-steps li { margin-bottom: var(--mp-space-4); }
.cb-steps code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--mp-fontSize-12);
  background: var(--surface-secondary);
  color: var(--on-surface);
  padding: var(--mp-space-2) var(--mp-space-6);
  border-radius: var(--mp-radius-4);
}

/* Live widget preview */
.cb__preview { width: 380px; }

@media (max-width: 1024px) {
  /* Stacked: the body scrolls as one and each pane takes its natural height. */
  .cb__body { flex-direction: column; overflow-y: auto; }
  .cb__panel {
    flex: 0 0 auto;
    overflow: visible;
  }
  .cb__preview {
    width: 100%;
    border-top: 1px solid var(--border-subtle);
    order: 3;
  }
  .cb__nav {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border-subtle);
  }
  .cb__nav-group { flex-direction: row; flex-wrap: wrap; align-items: center; }
  .cb__nav-heading { width: 100%; }
}
.cb-widget {
  width: 320px;
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-component-card-radius);
  overflow: hidden;
  box-shadow: var(--mp-shadow-lg);
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
  background: var(--surface-secondary);
  color: var(--on-surface);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Chat bubbles */
.cb-b {
  align-self: flex-start;
  max-width: 90%;
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);
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
  background: var(--surface-primary);
}
.cb-chip--solid { background: var(--brand); color: #fff; }

/* Product carousel */
.cb-products { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
.cb-product {
  flex: 0 0 130px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: var(--surface-primary);
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
  background: var(--neg);
  color: var(--on-neg);
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
.cb-product__was { font-size: 0.625rem; color: var(--on-surface-muted); text-decoration: line-through; }
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
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: var(--surface-primary);
  padding: 10px 12px;
}
.cb-order__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  padding: 3px 0;
}
.cb-order__row span:first-child { color: var(--on-surface-muted); }
.cb-order__status { color: var(--pos); font-weight: var(--mp-fontWeight-bold); }
.cb-links { display: flex; flex-direction: column; gap: 6px; }
.cb-link {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--surface-primary);
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
  border: 1px solid var(--border-subtle);
  background: var(--surface-primary);
  color: var(--text-secondary);
  border-radius: var(--mp-radius-full);
  padding: var(--mp-space-4) var(--mp-space-10);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-medium);
  cursor: pointer;
  transition: background var(--mp-motion-duration-fast) var(--mp-motion-easing-standard), color var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}
.cb-scenario:hover { background: var(--surface-secondary); color: var(--on-surface); }
.cb-scenario:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.cb-scenario--on {
  background: var(--accent-default);
  border-color: var(--accent-default);
  color: var(--accent-on);
}

/* Open-chat input */
.cb-widget__field {
  flex: 1 1 auto;
  border: 0;
  outline: none;
  background: transparent;
  font-size: 0.8125rem;
  color: var(--on-surface);
}
.cb-widget__send {
  display: inline-flex;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--brand);
  cursor: pointer;
}
.cb-widget__send:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.cb-widget__input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  border-top: 1px solid var(--border-subtle);
  font-size: 0.8125rem;
}
.cb-widget__foot { text-align: center; font-size: 0.625rem; color: var(--on-surface-muted); padding: 6px 0 10px; }

/* Pre-chat preview */
.cb-pc__title { font-weight: 700; font-size: 0.9375rem; margin-bottom: 4px; }
.cb-pc__sub { font-size: 0.75rem; color: var(--on-surface-muted); margin-bottom: 14px; }
.cb-pc__field { margin-bottom: 10px; }
.cb-pc__label { font-size: 0.6875rem; font-weight: 600; margin-bottom: 4px; }
.cb-pc__input {
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 0.75rem;
  color: var(--on-surface-muted);
  background: var(--surface-primary);
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
