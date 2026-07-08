<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatbotStore } from '@/stores/useChatbot'
import { storeToRefs } from 'pinia'
import type { PreChatFieldType } from '@/stores/useChatbot'

const route = useRoute()
const router = useRouter()
const accountId = computed(() => route.params.accountId as string)

const cb = useChatbotStore()
const {
  storeName, address1, address2, instagram, storeType, storeUrl,
  brandName, brandSubtitle, logoName, primaryColor, position, welcomeMessage,
  businessHours, quickPrompts, knowledgeSources,
  preChatEnabled, skipForLoggedIn, preChatFields,
} = storeToRefs(cb)

// Static UI config (not reactive state)
const storeTypes = ['Fashion & Apparel', 'Electronics', 'Home & Living', 'Health & Beauty', 'Food & Beverage', 'Other']
const swatches = ['#1F2933', '#2563EB', '#6D28D9', '#7CB9D6', '#7BC67B', '#E9C74A', '#DD7A3B', '#C0559A']

type Section = 'general' | 'appearance' | 'hours' | 'prompts' | 'knowledge' | 'prechat'
const section = ref<Section>('general')
const NAV: { key: Section; label: string; icon: string }[] = [
  { key: 'general', label: 'General', icon: 'building-2' },
  { key: 'appearance', label: 'Appearance', icon: 'palette' },
  { key: 'hours', label: 'Business hours', icon: 'clock' },
  { key: 'prompts', label: 'Quick prompts', icon: 'message-square-more' },
  { key: 'knowledge', label: 'Knowledge base', icon: 'book-open' },
  { key: 'prechat', label: 'Pre-chat form', icon: 'clipboard-list' },
]

const enabledPrompts = computed(() => quickPrompts.value.filter(p => p.enabled))
const showPreChat = computed(() => section.value === 'prechat' && preChatEnabled.value)

// Quick prompt ops
let promptSeq = 100
function addPrompt() { quickPrompts.value.push({ id: ++promptSeq, text: 'New prompt', enabled: true }) }
function removePrompt(id: number) { quickPrompts.value = quickPrompts.value.filter(p => p.id !== id) }
function movePrompt(i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= quickPrompts.value.length) return
  const a = quickPrompts.value
  ;[a[i], a[j]] = [a[j]!, a[i]!]
}

// Pre-chat field ops
let fieldSeq = 100
const FIELD_TYPES: PreChatFieldType[] = ['Text', 'Email', 'Phone', 'Text Area']
function addField() { preChatFields.value.push({ id: ++fieldSeq, label: 'New field', type: 'Text', placeholder: '', required: false }) }
function removeField(id: number) { preChatFields.value = preChatFields.value.filter(f => f.id !== id) }
function moveField(i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= preChatFields.value.length) return
  const a = preChatFields.value
  ;[a[i], a[j]] = [a[j]!, a[i]!]
}

const statusColor: Record<string, string> = { Active: 'success', Disabled: 'default', Indexing: 'info' }
const addSourceTab = ref<'url' | 'upload'>('url')

const saved = ref(false)
function goBack() { router.push({ name: 'Tickets', params: { accountId: accountId.value } }) }
function publish() { saved.value = true }
</script>

<template>
  <div class="cb d-flex flex-column">
    <!-- Top bar -->
    <div class="cb__bar d-flex align-center justify-space-between px-5 border-b bg-surface">
      <div class="d-flex align-center gap-3 min-width-0">
        <v-tooltip text="Back to Service" location="bottom">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon="arrow-left" variant="text" size="small" aria-label="Back to Service" @click="goBack" />
          </template>
        </v-tooltip>
        <div class="min-width-0">
          <div class="font-weight-bold text-body-1">Customize your widget</div>
          <div class="text-caption text-medium-emphasis">Customize your chatbot's appearance and branding</div>
        </div>
      </div>
      <div class="d-flex align-center gap-2">
        <v-btn variant="text" class="text-none text-medium-emphasis" size="small" prepend-icon="eye">Preview Chatbot</v-btn>
        <v-btn color="primary" variant="flat" size="small" class="text-none" prepend-icon="rocket" @click="publish">Publish Chatbot</v-btn>
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
              <v-text-field v-model="storeName" label="Store name" variant="outlined" density="comfortable" class="mb-4" />
              <v-text-field v-model="address1" label="Address 1" variant="outlined" density="comfortable" class="mb-4" />
              <v-text-field v-model="address2" label="Address 2" variant="outlined" density="comfortable" class="mb-4" />
              <v-text-field v-model="instagram" label="Instagram link" variant="outlined" density="comfortable" prepend-inner-icon="instagram" hide-details />
            </v-card>
            <v-card flat border rounded="lg" class="pa-6">
              <div class="text-subtitle-1 font-weight-bold mb-4">Storefront</div>
              <v-select v-model="storeType" label="Store type" :items="storeTypes" variant="outlined" density="comfortable" placeholder="Select store type" class="mb-4" />
              <v-text-field v-model="storeUrl" label="Store URL" variant="outlined" density="comfortable" placeholder="https://mystore.com" prepend-inner-icon="link" hide-details />
            </v-card>
          </template>

          <!-- APPEARANCE -->
          <template v-else-if="section === 'appearance'">
            <v-card flat border rounded="lg" class="pa-6 mb-5">
              <div class="text-subtitle-1 font-weight-bold mb-1">Brand logo</div>
              <div class="text-body-2 text-medium-emphasis mb-4">Upload your logo and set your brand colors.</div>
              <div class="cb-upload d-flex align-center justify-center ga-3 mb-2" @click="logoName = 'logo.png'">
                <v-icon size="20">upload</v-icon>
                <span class="text-body-2 font-weight-medium">{{ logoName || 'Upload logo' }}</span>
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
                  :class="{ 'cb-swatch--on': primaryColor.toLowerCase() === c.toLowerCase() }"
                  :style="{ background: c }"
                  :aria-label="`Use ${c}`"
                  @click="primaryColor = c"
                >
                  <v-icon v-if="primaryColor.toLowerCase() === c.toLowerCase()" size="14" color="white">check</v-icon>
                </button>
              </div>
              <div class="text-caption text-medium-emphasis mb-1">Custom color</div>
              <div class="d-flex align-center ga-2">
                <v-menu :close-on-content-click="false" location="bottom start">
                  <template #activator="{ props }">
                    <button v-bind="props" class="cb-swatch cb-swatch--sm" :style="{ background: primaryColor }" aria-label="Pick custom color" />
                  </template>
                  <v-color-picker v-model="primaryColor" mode="hex" :modes="['hex']" />
                </v-menu>
                <v-text-field v-model="primaryColor" variant="outlined" density="compact" hide-details style="max-width:160px;" />
              </div>
            </v-card>

            <v-card flat border rounded="lg" class="pa-6">
              <div class="text-subtitle-1 font-weight-bold mb-4">Widget configuration</div>
              <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-2">Launcher position</div>
              <v-row dense class="mb-4">
                <v-col cols="6">
                  <v-card flat border rounded="lg" class="pa-4 text-center cursor-pointer cb-pos" :class="{ 'cb-pos--on': position === 'left' }" @click="position = 'left'">
                    <v-icon size="24" class="mb-1">panel-bottom-dashed</v-icon>
                    <div class="text-body-2 font-weight-medium">Bottom left</div>
                  </v-card>
                </v-col>
                <v-col cols="6">
                  <v-card flat border rounded="lg" class="pa-4 text-center cursor-pointer cb-pos" :class="{ 'cb-pos--on': position === 'right' }" @click="position = 'right'">
                    <v-icon size="24" class="mb-1">panel-bottom-dashed</v-icon>
                    <div class="text-body-2 font-weight-medium">Bottom right</div>
                  </v-card>
                </v-col>
              </v-row>
              <v-text-field v-model="welcomeMessage" label="Welcome message *" variant="outlined" density="comfortable" hide-details />
            </v-card>
          </template>

          <!-- BUSINESS HOURS -->
          <template v-else-if="section === 'hours'">
            <v-card flat border rounded="lg" class="pa-6">
              <div class="text-subtitle-1 font-weight-bold mb-1">Business hours</div>
              <div class="text-body-2 text-medium-emphasis mb-5">Set when live support is available. Outside these hours the bot handles chats.</div>
              <div v-for="h in businessHours" :key="h.day" class="cb-hour d-flex align-center ga-3">
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
              <div class="text-body-2 text-medium-emphasis mb-5">Predefined options shown when a customer starts a chat.</div>
              <div v-for="(p, i) in quickPrompts" :key="p.id" class="cb-row d-flex align-center ga-2 mb-2">
                <v-icon size="16" class="text-medium-emphasis cb-grip">grip-vertical</v-icon>
                <v-text-field v-model="p.text" variant="outlined" density="compact" hide-details class="flex-grow-1" />
                <v-btn icon="chevron-up" variant="text" size="x-small" :disabled="i === 0" aria-label="Move up" @click="movePrompt(i, -1)" />
                <v-btn icon="chevron-down" variant="text" size="x-small" :disabled="i === quickPrompts.length - 1" aria-label="Move down" @click="movePrompt(i, 1)" />
                <v-switch v-model="p.enabled" color="primary" density="compact" hide-details class="flex-shrink-0" />
                <v-btn icon="trash-2" variant="text" size="x-small" color="error" aria-label="Delete prompt" @click="removePrompt(p.id)" />
              </div>
            </v-card>
          </template>

          <!-- KNOWLEDGE BASE -->
          <template v-else-if="section === 'knowledge'">
            <v-card flat border rounded="lg" class="pa-6 mb-5">
              <div class="d-flex align-center justify-space-between mb-1">
                <div class="text-subtitle-1 font-weight-bold">Knowledge base</div>
                <span class="text-caption text-medium-emphasis">{{ knowledgeSources.length }} sources</span>
              </div>
              <div class="text-body-2 text-medium-emphasis mb-5">Connect and manage the sources that power your AI responses.</div>
              <div v-for="s in knowledgeSources" :key="s.id" class="cb-source d-flex align-center ga-3 mb-2">
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
              <v-switch v-model="preChatEnabled" color="primary" density="comfortable" hide-details label="Show a pre-chat form before starting a conversation" class="mb-1" />
              <v-switch v-model="skipForLoggedIn" color="primary" density="comfortable" hide-details label="Skip the form for logged-in users" :disabled="!preChatEnabled" />
            </v-card>

            <v-card flat border rounded="lg" class="pa-6" :class="{ 'cb-dim': !preChatEnabled }">
              <div class="d-flex align-center justify-space-between mb-4">
                <div class="text-subtitle-1 font-weight-bold">Form fields</div>
                <v-btn size="small" variant="tonal" color="primary" prepend-icon="plus" class="text-none" :disabled="!preChatEnabled" @click="addField">Add field</v-btn>
              </div>
              <div v-for="(f, i) in preChatFields" :key="f.id" class="cb-field mb-3">
                <div class="d-flex align-center ga-2 mb-2">
                  <v-icon size="16" class="text-medium-emphasis cb-grip">grip-vertical</v-icon>
                  <span class="text-caption font-weight-bold text-medium-emphasis">#{{ i + 1 }}</span>
                  <v-spacer />
                  <v-btn icon="chevron-up" variant="text" size="x-small" :disabled="i === 0 || !preChatEnabled" aria-label="Move up" @click="moveField(i, -1)" />
                  <v-btn icon="chevron-down" variant="text" size="x-small" :disabled="i === preChatFields.length - 1 || !preChatEnabled" aria-label="Move down" @click="moveField(i, 1)" />
                  <v-switch v-model="f.required" color="primary" density="compact" hide-details :disabled="!preChatEnabled" class="flex-shrink-0" />
                  <span class="text-caption text-medium-emphasis">Required</span>
                  <v-btn icon="trash-2" variant="text" size="x-small" color="error" :disabled="!preChatEnabled" aria-label="Delete field" @click="removeField(f.id)" />
                </div>
                <v-row dense>
                  <v-col cols="12" sm="6"><v-text-field v-model="f.label" label="Label" variant="outlined" density="compact" hide-details :disabled="!preChatEnabled" /></v-col>
                  <v-col cols="12" sm="6"><v-select v-model="f.type" label="Type" :items="FIELD_TYPES" variant="outlined" density="compact" hide-details :disabled="!preChatEnabled" /></v-col>
                  <v-col cols="12"><v-text-field v-model="f.placeholder" label="Placeholder" variant="outlined" density="compact" hide-details :disabled="!preChatEnabled" /></v-col>
                </v-row>
              </div>
            </v-card>
          </template>
        </div>
      </div>

      <!-- Live preview -->
      <div class="cb__preview bg-background d-flex flex-column align-center pa-6 flex-shrink-0">
        <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-3 align-self-start">Preview</div>
        <div class="cb-widget" :style="{ '--brand': primaryColor }">
          <div class="cb-widget__head">
            <div class="cb-widget__avatar">
              <v-icon size="18" color="white">message-circle</v-icon>
            </div>
            <div class="min-width-0">
              <div class="cb-widget__name text-truncate">{{ brandName }}</div>
              <div class="cb-widget__sub">{{ brandSubtitle }}</div>
            </div>
            <v-icon size="18" color="white" class="cb-widget__x">x</v-icon>
          </div>

          <div class="cb-widget__body">
            <template v-if="showPreChat">
              <div class="cb-pc__title">Welcome to {{ storeName }}</div>
              <div class="cb-pc__sub">Share a few details so we can help you faster.</div>
              <div v-for="f in preChatFields" :key="f.id" class="cb-pc__field">
                <div class="cb-pc__label">{{ f.label }}{{ f.required ? ' *' : '' }}</div>
                <div class="cb-pc__input" :class="{ 'cb-pc__input--area': f.type === 'Text Area' }">{{ f.placeholder }}</div>
              </div>
              <div class="cb-widget__cta">Start chat</div>
            </template>
            <template v-else>
              <div class="cb-widget__msg">{{ welcomeMessage }}</div>
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

.cb-row .cb-grip, .cb-field .cb-grip { cursor: grab; }

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
