<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContentStore } from '@/stores/useContent'
import MpEmptyState from '@/components/MpEmptyState.vue'

type BlockType = 'title' | 'paragraph' | 'list' | 'image' | 'button' | 'divider' | 'spacer' | 'social' | 'html'

interface EmailBlock {
  id: string
  type: BlockType
  text: string
  items: string[]
  alt: string
  label: string
  url: string
  height: number
  align: 'left' | 'center' | 'right'
}

const route = useRoute()
const router = useRouter()
const content = useContentStore()

const accountId = computed(() => route.params.accountId as string)
const contentId = computed(() => Number(route.params.id))
const item = computed(() => content.items.find(i => i.id === contentId.value))
const backTo = computed(() => ({ name: 'EmailContent', params: { accountId: accountId.value } }))

const PALETTE: { type: BlockType; label: string; icon: string }[] = [
  { type: 'title', label: 'Title', icon: 'heading' },
  { type: 'paragraph', label: 'Paragraph', icon: 'text' },
  { type: 'list', label: 'List', icon: 'list' },
  { type: 'image', label: 'Image', icon: 'image' },
  { type: 'button', label: 'Button', icon: 'square-mouse-pointer' },
  { type: 'divider', label: 'Divider', icon: 'minus' },
  { type: 'spacer', label: 'Spacer', icon: 'move-vertical' },
  { type: 'social', label: 'Social', icon: 'share-2' },
  { type: 'html', label: 'HTML', icon: 'code' },
]

let counter = 0
function makeId() {
  counter += 1
  return `b${counter}`
}

function defaults(type: BlockType): EmailBlock {
  const base: EmailBlock = { id: makeId(), type, text: '', items: [], alt: '', label: '', url: '', height: 24, align: 'left' }
  switch (type) {
    case 'title': return { ...base, text: 'Your headline here', align: 'center' }
    case 'paragraph': return { ...base, text: 'Write a short, friendly paragraph to introduce this email.' }
    case 'list': return { ...base, items: ['First point', 'Second point', 'Third point'] }
    case 'image': return { ...base, alt: 'Hero image' }
    case 'button': return { ...base, label: 'Shop now', url: 'https://', align: 'center' }
    case 'html': return { ...base, text: '<!-- custom HTML -->' }
    default: return base
  }
}

const blocks = ref<EmailBlock[]>([
  { ...defaults('title'), text: 'Welcome to Maropost 🎉' },
  { ...defaults('paragraph'), text: 'Thanks for joining. Here’s everything you need to get started with your store.' },
  { ...defaults('button'), label: 'Explore your dashboard' },
])
const selectedId = ref<string | null>(blocks.value[0]?.id ?? null)
const selected = computed(() => blocks.value.find(b => b.id === selectedId.value) ?? null)
const saved = ref(false)

function addBlock(type: BlockType) {
  const block = defaults(type)
  const idx = selectedId.value ? blocks.value.findIndex(b => b.id === selectedId.value) : blocks.value.length - 1
  blocks.value.splice(idx + 1, 0, block)
  selectedId.value = block.id
}
function removeBlock(id: string) {
  const idx = blocks.value.findIndex(b => b.id === id)
  if (idx === -1) return
  blocks.value.splice(idx, 1)
  if (selectedId.value === id) selectedId.value = blocks.value[Math.max(0, idx - 1)]?.id ?? null
}
function move(id: string, dir: -1 | 1) {
  const idx = blocks.value.findIndex(b => b.id === id)
  const next = idx + dir
  if (idx === -1 || next < 0 || next >= blocks.value.length) return
  const [b] = blocks.value.splice(idx, 1)
  if (!b) return
  blocks.value.splice(next, 0, b)
}
function listText(block: EmailBlock): string {
  return block.items.join('\n')
}
function setListText(block: EmailBlock, value: string) {
  block.items = value.split('\n')
}
function save() {
  saved.value = true
  setTimeout(() => router.push(backTo.value), 800)
}
</script>

<template>
  <div class="ece d-flex flex-column">
    <template v-if="item">
      <!-- top bar -->
      <header class="ece-top d-flex align-center ga-3 px-4">
        <v-btn variant="text" icon="chevron-left" :to="backTo" aria-label="Back to Email Content" />
        <div class="min-width-0">
          <div class="text-subtitle-2 font-weight-bold text-truncate">{{ item.name }}</div>
          <div class="text-caption text-medium-emphasis">Drag & drop editor · {{ blocks.length }} blocks</div>
        </div>
        <v-spacer />
        <v-btn variant="text" class="text-none" prepend-icon="eye">Preview</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="check" @click="save">Save</v-btn>
      </header>

      <div class="ece-body d-flex flex-grow-1 overflow-hidden">
        <!-- palette -->
        <aside class="ece-palette pa-3">
          <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mb-2 px-1">Blocks</div>
          <button
            v-for="p in PALETTE"
            :key="p.type"
            type="button"
            class="ece-palette__item d-flex align-center ga-2"
            @click="addBlock(p.type)"
          >
            <v-icon size="18">{{ p.icon }}</v-icon>
            <span class="text-body-2">{{ p.label }}</span>
            <v-icon size="16" class="ece-palette__add ml-auto">plus</v-icon>
          </button>
        </aside>

        <!-- canvas -->
        <main class="ece-canvas flex-grow-1 pa-6">
          <div class="ece-doc mx-auto">
            <div
              v-for="block in blocks"
              :key="block.id"
              class="ece-block"
              :class="{ 'ece-block--selected': block.id === selectedId }"
              @click="selectedId = block.id"
            >
              <div class="ece-block__controls">
                <v-btn size="x-small" variant="text" icon="chevron-up" aria-label="Move up" @click.stop="move(block.id, -1)" />
                <v-btn size="x-small" variant="text" icon="chevron-down" aria-label="Move down" @click.stop="move(block.id, 1)" />
                <v-btn size="x-small" variant="text" icon="trash-2" color="error" aria-label="Delete" @click.stop="removeBlock(block.id)" />
              </div>

              <h2 v-if="block.type === 'title'" class="ece-title" :style="{ textAlign: block.align }">{{ block.text }}</h2>
              <p v-else-if="block.type === 'paragraph'" class="ece-paragraph" :style="{ textAlign: block.align }">{{ block.text }}</p>
              <ul v-else-if="block.type === 'list'" class="ece-list">
                <li v-for="(li, i) in block.items" :key="i">{{ li }}</li>
              </ul>
              <div v-else-if="block.type === 'image'" class="ece-image">
                <v-icon size="32">image</v-icon>
                <span class="text-caption text-medium-emphasis">{{ block.alt || 'Image' }}</span>
              </div>
              <div v-else-if="block.type === 'button'" :style="{ textAlign: block.align }">
                <span class="ece-button">{{ block.label }}</span>
              </div>
              <hr v-else-if="block.type === 'divider'" class="ece-divider" />
              <div v-else-if="block.type === 'spacer'" class="ece-spacer" :style="{ height: `${block.height}px` }" />
              <div v-else-if="block.type === 'social'" class="ece-social" :style="{ textAlign: block.align }">
                <v-icon>facebook</v-icon><v-icon>instagram</v-icon><v-icon>twitter</v-icon><v-icon>linkedin</v-icon>
              </div>
              <pre v-else-if="block.type === 'html'" class="ece-html">{{ block.text }}</pre>
            </div>
          </div>
        </main>

        <!-- settings -->
        <aside class="ece-settings pa-4">
          <template v-if="selected">
            <div class="text-subtitle-2 font-weight-bold mb-4 text-capitalize">{{ selected.type }} settings</div>

            <template v-if="selected.type === 'title' || selected.type === 'paragraph'">
              <v-textarea v-model="selected.text" label="Text" variant="outlined" density="comfortable" rounded="lg" auto-grow rows="3" class="mb-4" hide-details />
            </template>
            <template v-else-if="selected.type === 'list'">
              <v-textarea :model-value="selected ? listText(selected) : ''" @update:model-value="v => selected && setListText(selected, v)" label="Items (one per line)" variant="outlined" density="comfortable" rounded="lg" auto-grow rows="3" class="mb-4" hide-details />
            </template>
            <template v-else-if="selected.type === 'image'">
              <v-text-field v-model="selected.alt" label="Alt text" variant="outlined" density="comfortable" rounded="lg" class="mb-4" hide-details />
              <v-btn variant="tonal" block prepend-icon="upload" class="text-none mb-4">Upload image</v-btn>
            </template>
            <template v-else-if="selected.type === 'button'">
              <v-text-field v-model="selected.label" label="Button label" variant="outlined" density="comfortable" rounded="lg" class="mb-4" hide-details />
              <v-text-field v-model="selected.url" label="Link URL" variant="outlined" density="comfortable" rounded="lg" class="mb-4" hide-details />
            </template>
            <template v-else-if="selected.type === 'spacer'">
              <v-slider v-model="selected.height" label="Height" :min="8" :max="96" :step="4" thumb-label class="mb-4" hide-details />
            </template>
            <template v-else-if="selected.type === 'html'">
              <v-textarea v-model="selected.text" label="HTML" variant="outlined" density="comfortable" rounded="lg" auto-grow rows="5" class="mb-4 ece-mono" hide-details />
            </template>
            <template v-else>
              <div class="text-body-2 text-medium-emphasis mb-4">No content options for this block.</div>
            </template>

            <template v-if="['title', 'paragraph', 'button', 'social'].includes(selected.type)">
              <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mb-2">Alignment</div>
              <v-btn-toggle v-model="selected.align" mandatory density="comfortable" variant="outlined" divided class="mb-4">
                <v-btn value="left" icon="align-left" size="small" />
                <v-btn value="center" icon="align-center" size="small" />
                <v-btn value="right" icon="align-right" size="small" />
              </v-btn-toggle>
            </template>

            <v-btn variant="text" color="error" prepend-icon="trash-2" class="text-none" @click="removeBlock(selected.id)">Delete block</v-btn>
          </template>
          <div v-else class="text-body-2 text-medium-emphasis pt-4">Select a block to edit it, or add one from the left.</div>
        </aside>
      </div>

      <v-snackbar v-model="saved" color="success" timeout="800" location="bottom right">Content saved</v-snackbar>
    </template>

    <MpEmptyState
      v-else
      icon="file-x"
      title="Content not found"
      description="This email content doesn’t exist."
      action-label="Back to Email Content"
      action-icon="arrow-left"
      class="my-auto"
      @action="$router.push(backTo)"
    />
  </div>
</template>

<style scoped>
.ece {
  height: 100%;
  background: rgb(var(--v-theme-background));
}
.ece-top {
  height: 60px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  background: rgb(var(--v-theme-surface));
}
.ece-palette {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  background: rgb(var(--v-theme-surface));
  overflow-y: auto;
}
.ece-palette__item {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  transition: background 100ms ease;
}
.ece-palette__item:hover {
  background: rgba(var(--v-theme-primary), 0.08);
}
.ece-palette__add {
  opacity: 0;
  transition: opacity 100ms ease;
}
.ece-palette__item:hover .ece-palette__add {
  opacity: 0.6;
}
.ece-canvas {
  overflow-y: auto;
  background: rgb(var(--v-theme-background));
}
.ece-doc {
  max-width: 600px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  border-radius: 12px;
  padding: 16px;
  min-height: 400px;
}
.ece-block {
  position: relative;
  padding: 10px 12px;
  border: 1.5px solid transparent;
  border-radius: 8px;
  transition: border-color 100ms ease;
}
.ece-block:hover {
  border-color: rgba(var(--v-theme-primary), 0.25);
}
.ece-block--selected {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.03);
}
.ece-block__controls {
  position: absolute;
  top: -14px;
  right: 8px;
  display: none;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  padding: 1px;
}
.ece-block:hover .ece-block__controls,
.ece-block--selected .ece-block__controls {
  display: flex;
}
.ece-title {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.3;
  color: rgb(var(--v-theme-on-surface));
}
.ece-paragraph {
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgb(var(--v-theme-on-surface-variant));
}
.ece-list {
  padding-left: 20px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.95rem;
  line-height: 1.7;
}
.ece-image {
  height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-radius: 8px;
  color: rgb(var(--v-theme-on-surface-variant));
}
.ece-button {
  display: inline-block;
  padding: 10px 24px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
}
.ece-divider {
  border: none;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  margin: 4px 0;
}
.ece-social {
  display: flex;
  gap: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}
.ece-social[style*="center"] { justify-content: center; }
.ece-social[style*="right"] { justify-content: flex-end; }
.ece-html {
  font-family: monospace;
  font-size: 0.8rem;
  background: rgba(var(--v-theme-on-surface), 0.05);
  padding: 10px;
  border-radius: 6px;
  color: rgb(var(--v-theme-on-surface-variant));
  white-space: pre-wrap;
}
.ece-settings {
  width: 300px;
  flex-shrink: 0;
  border-left: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  background: rgb(var(--v-theme-surface));
  overflow-y: auto;
}
:deep(.ece-mono textarea) {
  font-family: monospace;
  font-size: 0.82rem;
}
</style>
