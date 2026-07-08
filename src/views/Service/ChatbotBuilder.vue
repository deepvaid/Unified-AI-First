<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatbotStore } from '@/stores/useChatbot'
import type { PreChatFieldType, QuickPromptIntent } from '@/stores/useChatbot'

const route = useRoute()
const router = useRouter()
const accountId = computed(() => route.params.accountId as string)
const id = computed(() => Number(route.params.id))

const cb = useChatbotStore()
const chatbot = computed(() => cb.getById(id.value))
const cfg = computed(() => chatbot.value!.config)

onMounted(() => {
  if (!chatbot.value) router.replace({ name: 'ChatbotList', params: { accountId: accountId.value } })
})

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
const section = ref<Section>('general')
const NAV: { key: Section; label: string; icon: string }[] = [
  { key: 'general', label: 'General', icon: 'building-2' },
  { key: 'appearance', label: 'Appearance', icon: 'palette' },
  { key: 'hours', label: 'Business hours', icon: 'clock' },
  { key: 'prompts', label: 'Quick prompts', icon: 'message-square-more' },
  { key: 'shopping', label: 'Shopping assistant', icon: 'shopping-bag' },
  { key: 'tracking', label: 'Order tracking', icon: 'package-search' },
  { key: 'knowledge', label: 'Knowledge base', icon: 'book-open' },
  { key: 'prechat', label: 'Pre-chat form', icon: 'clipboard-list' },
]
const catalogSources = [
  { title: 'Full product catalog', value: 'catalog' },
  { title: 'Featured products only', value: 'featured' },
]

const enabledPrompts = computed(() => cfg.value?.quickPrompts.filter(p => p.enabled) ?? [])
const showPreChat = computed(() => section.value === 'prechat' && !!cfg.value?.preChatEnabled)

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
const addSourceTab = ref<'url' | 'upload'>('url')

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
function finishPublish() { publishOpen.value = false; saved.value = true }
</script>

<template>
  <div class="cb d-flex flex-column">
    <template v-if="chatbot && cfg">
      <!-- Top bar -->
      <div class="cb__bar d-flex align-center justify-space-between px-5 border-b bg-surface">
        <div class="d-flex align-center gap-3 min-width-0">
          <v-tooltip text="Back to Chatbots" location="bottom">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="arrow-left" variant="text" size="small" aria-label="Back to Chatbots" @click="goBack" />
            </template>
          </v-tooltip>
          <div class="min-width-0">
            <div class="font-weight-bold text-body-1 text-truncate">Customize your widget</div>
            <div class="text-caption text-medium-emphasis text-truncate">{{ chatbot.store }} · appearance &amp; branding</div>
          </div>
        </div>
        <div class="d-flex align-center gap-2">
          <v-btn variant="text" class="text-none text-medium-emphasis" size="small" prepend-icon="eye">Preview Chatbot</v-btn>
          <v-btn color="primary" variant="flat" size="small" class="text-none" prepend-icon="rocket" @click="publishOpen = true">Publish Chatbot</v-btn>
        </div>
      </div>

      <div class="cb__body flex-grow-1 d-flex overflow-hidden">
        <!-- Section nav -->
        <nav class="cb__nav border-r bg-surface py-3 flex-shrink-0" aria-label="Chatbot settings">
          <button
            v-for="n in NAV"
            :key="n.key"
            type="button"
            class="cb__nav-item text-none"
            :class="{ 'cb__nav-item--on': section === n.key }"
            @click="section = n.key"
          >
            <v-icon size="18">{{ n.icon }}</v-icon>
            <span>{{ n.label }}</span>
          </button>
        </nav>

        <!-- Settings panel -->
        <div class="cb__panel flex-grow-1 overflow-y-auto pa-6">
          <div class="cb__panel-inner">
            <!-- GENERAL -->
            <template v-if="section === 'general'">
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
                    <v-icon size="16" class="text-medium-emphasis cb-grip">grip-vertical</v-icon>
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
                  <span class="text-caption text-medium-emphasis">{{ cfg.knowledgeSources.length }} sources</span>
                </div>
                <div class="text-body-2 text-medium-emphasis mb-5">Connect and manage the sources that power your AI responses.</div>
                <div v-for="s in cfg.knowledgeSources" :key="s.id" class="cb-source d-flex align-center ga-3 mb-2">
                  <div class="cb-source__icon"><v-icon size="18">{{ s.icon }}</v-icon></div>
                  <div class="flex-grow-1 min-width-0">
                    <div class="d-flex align-center ga-2">
                      <span class="text-body-2 font-weight-medium text-truncate">{{ s.name }}</span>
                      <v-chip size="x-small" variant="tonal" :color="statusColor[s.status]">{{ s.status }}</v-chip>
                    </div>
                    <div class="text-caption text-medium-emphasis">{{ s.items }} items · {{ s.meta }}</div>
                  </div>
                  <v-switch v-model="s.enabled" color="primary" density="compact" hide-details class="flex-shrink-0" />
                  <v-btn icon="refresh-cw" variant="text" size="x-small" aria-label="Re-sync" />
                  <v-btn icon="trash-2" variant="text" size="x-small" color="error" aria-label="Remove source" />
                </div>
              </v-card>

              <v-card flat border rounded="lg" class="pa-6">
                <div class="text-subtitle-1 font-weight-bold mb-4">Add a source</div>
                <v-btn-toggle v-model="addSourceTab" mandatory density="comfortable" variant="outlined" divided rounded="lg" class="mp-toggle-group mp-toggle-group--segmented mb-4">
                  <v-btn value="url" size="small" class="text-none px-4" prepend-icon="link">Website URL</v-btn>
                  <v-btn value="upload" size="small" class="text-none px-4" prepend-icon="upload">Upload files</v-btn>
                </v-btn-toggle>
                <v-text-field v-if="addSourceTab === 'url'" label="Website URL" placeholder="https://mystore.com/faq" variant="outlined" density="comfortable" prepend-inner-icon="globe" hide-details />
                <div v-else class="cb-drop d-flex flex-column align-center justify-center text-center">
                  <v-icon size="28" class="mb-2 text-medium-emphasis">upload-cloud</v-icon>
                  <div class="text-body-2 font-weight-medium">Drag &amp; drop, or click to upload</div>
                  <div class="text-caption text-medium-emphasis">Max 5 MB · PDF, TXT, or DOC</div>
                </div>
              </v-card>
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
                    <v-icon size="16" class="text-medium-emphasis cb-grip">grip-vertical</v-icon>
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
        <div class="cb__preview bg-background d-flex flex-column align-center pa-6 flex-shrink-0">
          <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-3 align-self-start">Preview</div>
          <div class="cb-widget" :style="{ '--brand': cfg.primaryColor }">
            <div class="cb-widget__head">
              <div class="cb-widget__avatar">
                <v-icon size="18" color="white">message-circle</v-icon>
              </div>
              <div class="min-width-0">
                <div class="cb-widget__name text-truncate">{{ cfg.brandName }}</div>
                <div class="cb-widget__sub">{{ cfg.brandSubtitle }}</div>
              </div>
              <v-icon size="18" color="white" class="cb-widget__x">x</v-icon>
            </div>

            <div class="cb-widget__body">
              <template v-if="showPreChat">
                <div class="cb-pc__title">Welcome to {{ cfg.storeName }}</div>
                <div class="cb-pc__sub">Share a few details so we can help you faster.</div>
                <div v-for="f in cfg.preChatFields" :key="f.id" class="cb-pc__field">
                  <div class="cb-pc__label">{{ f.label }}{{ f.required ? ' *' : '' }}</div>
                  <div class="cb-pc__input" :class="{ 'cb-pc__input--area': f.type === 'Text Area' }">{{ f.placeholder }}</div>
                </div>
                <div class="cb-widget__cta">Start chat</div>
              </template>
              <template v-else>
                <div class="cb-widget__msg">{{ cfg.welcomeMessage }}</div>
                <div class="cb-widget__chips">
                  <span v-for="p in enabledPrompts" :key="p.id" class="cb-widget__chip">{{ p.text }}</span>
                </div>
              </template>
            </div>

            <div class="cb-widget__input">
              <span class="text-medium-emphasis">Write a message…</span>
              <v-icon size="16" class="text-medium-emphasis">send</v-icon>
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
    </template>
  </div>
</template>

<style scoped>
.cb { height: 100vh; overflow: hidden; }
.cb__bar { height: 56px; flex-shrink: 0; }
.border-b { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.border-r { border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }

.cb__nav { width: 220px; display: flex; flex-direction: column; gap: 2px; padding-inline: 10px; }
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

.cb-prompt .cb-grip, .cb-field .cb-grip { cursor: grab; }
.cb-prompt__intent { max-width: 130px; }

.cb-source__icon {
  width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}
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
.cb-widget__body { padding: 16px; min-height: 220px; background: rgba(var(--v-theme-on-surface), 0.02); }
.cb-widget__msg {
  display: inline-block;
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--mp-border-subtle);
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 0.8125rem;
  margin-bottom: 12px;
}
.cb-widget__chips { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
.cb-widget__chip {
  border: 1px solid var(--brand);
  color: var(--brand);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgb(var(--v-theme-surface));
}
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
