<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLandingPagesStore, defaultLandingBlock } from '@/stores/useLandingPages'
import type { LandingPageBlock, LandingPageBlockType } from '@/stores/useLandingPages'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'

const route = useRoute()
const router = useRouter()
const lpStore = useLandingPagesStore()

const accountId = computed(() => route.params.accountId as string)
const pageId = computed(() => Number(route.params.id))
const page = computed(() => lpStore.pages.find(p => p.id === pageId.value))
const backTo = computed(() => ({ name: 'LandingPages', params: { accountId: accountId.value } }))

const PALETTE: { type: LandingPageBlockType; label: string; icon: string }[] = [
  { type: 'title', label: 'Title', icon: 'heading' },
  { type: 'paragraph', label: 'Paragraph', icon: 'text' },
  { type: 'list', label: 'List', icon: 'list' },
  { type: 'image', label: 'Image', icon: 'image' },
  { type: 'button', label: 'Button', icon: 'square-mouse-pointer' },
  { type: 'divider', label: 'Divider', icon: 'minus' },
  { type: 'spacer', label: 'Spacer', icon: 'move-vertical' },
  { type: 'social', label: 'Social', icon: 'share-2' },
  { type: 'html', label: 'HTML', icon: 'code' },
  { type: 'video', label: 'Video', icon: 'video' },
  { type: 'form', label: 'Form', icon: 'clipboard-list' },
  { type: 'icons', label: 'Icons', icon: 'shapes' },
  { type: 'menu', label: 'Menu', icon: 'menu' },
  { type: 'text', label: 'Text', icon: 'type' },
]

const pageName = ref(page.value?.name ?? '')
const blocks = ref<LandingPageBlock[]>(page.value ? page.value.blocks.map(b => ({ ...b, items: [...b.items] })) : [])
const selectedId = ref<string | null>(blocks.value[0]?.id ?? null)
const selected = computed(() => blocks.value.find(b => b.id === selectedId.value) ?? null)
const previewDevice = ref<'desktop' | 'mobile'>('desktop')

function addBlock(type: LandingPageBlockType) {
  const block = defaultLandingBlock(type)
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
  if (b) blocks.value.splice(next, 0, b)
}
function listText(block: LandingPageBlock): string {
  return block.items.join('\n')
}
function setListText(block: LandingPageBlock, value: string) {
  block.items = value.split('\n')
}

// ─── Page settings drawer (SEO / meta / URL / redirect / tracking) ─────
const settingsOpen = ref(false)
const seo = ref(page.value ? { ...page.value.seo } : { description: '', pageTitle: '', redirectAfterExpiry: '', metaKeywords: '', tracking: '' })
const pageUrl = ref(page.value?.url ?? '')

// ─── Topbar actions ──────────────────────────────────────────────────────
const toast = ref<{ show: boolean; text: string }>({ show: false, text: '' })
function notify(text: string) { toast.value = { show: true, text } }

function verifyDomain() {
  if (!page.value) return
  lpStore.verifyDomain(page.value.id)
  notify('Domain verified')
}
function saveAsTemplate() {
  if (!page.value) return
  lpStore.saveAsTemplate(page.value.id)
  notify('Saved as template')
}

const previewOpen = ref(route.query.preview === '1')

function saveAndClose() {
  if (!page.value) return
  lpStore.update(page.value.id, {
    name: pageName.value,
    url: pageUrl.value,
    seo: { ...seo.value },
    blocks: blocks.value,
  })
  router.push(backTo.value)
}
</script>

<template>
  <div class="lpe d-flex flex-column">
    <template v-if="page">
      <!-- top bar -->
      <header class="lpe-top d-flex align-center ga-3 px-4">
        <v-btn variant="text" icon="chevron-left" :to="backTo" aria-label="Back to Landing Pages" />
        <v-text-field
          v-model="pageName"
          variant="plain"
          density="compact"
          hide-details
          class="lpe-name"
          aria-label="Page name"
        />
        <v-spacer />
        <v-btn variant="text" class="text-none" prepend-icon="settings" @click="settingsOpen = true">Page Settings</v-btn>
        <v-btn variant="text" class="text-none" prepend-icon="shield-check" @click="verifyDomain">Verify Domain</v-btn>
        <v-btn variant="text" class="text-none" prepend-icon="eye" @click="previewOpen = true">Preview</v-btn>
        <v-btn variant="text" class="text-none" prepend-icon="copy-plus" @click="saveAsTemplate">Save as Template</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="check" @click="saveAndClose">Save and Close</v-btn>
      </header>

      <div class="lpe-body d-flex flex-grow-1 overflow-hidden">
        <!-- palette -->
        <aside class="lpe-palette pa-3">
          <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mb-2 px-1">Blocks</div>
          <button
            v-for="p in PALETTE"
            :key="p.type"
            type="button"
            class="lpe-palette__item d-flex align-center ga-2"
            @click="addBlock(p.type)"
          >
            <v-icon size="18">{{ p.icon }}</v-icon>
            <span class="text-body-2">{{ p.label }}</span>
            <v-icon size="16" class="lpe-palette__add ml-auto">plus</v-icon>
          </button>
        </aside>

        <!-- canvas -->
        <main class="lpe-canvas flex-grow-1 pa-6 d-flex flex-column align-center">
          <v-btn-toggle v-model="previewDevice" density="compact" variant="outlined" divided mandatory rounded="lg" class="mp-toggle-group mp-toggle-group--segmented mb-4">
            <v-btn value="desktop" class="text-none" size="small" prepend-icon="monitor">Desktop</v-btn>
            <v-btn value="mobile" class="text-none" size="small" prepend-icon="smartphone">Mobile</v-btn>
          </v-btn-toggle>

          <div class="lpe-doc" :style="{ maxWidth: previewDevice === 'mobile' ? '375px' : '700px' }">
            <div
              v-for="block in blocks"
              :key="block.id"
              class="lpe-block"
              :class="{ 'lpe-block--selected': block.id === selectedId }"
              @click="selectedId = block.id"
            >
              <div class="lpe-block__controls">
                <v-btn size="x-small" variant="text" icon="chevron-up" aria-label="Move up" @click.stop="move(block.id, -1)" />
                <v-btn size="x-small" variant="text" icon="chevron-down" aria-label="Move down" @click.stop="move(block.id, 1)" />
                <v-btn size="x-small" variant="text" icon="trash-2" color="error" aria-label="Delete" @click.stop="removeBlock(block.id)" />
              </div>

              <h2 v-if="block.type === 'title'" class="lpe-title" :style="{ textAlign: block.align }">{{ block.text }}</h2>
              <p v-else-if="block.type === 'paragraph' || block.type === 'text'" class="lpe-paragraph" :style="{ textAlign: block.align }">{{ block.text }}</p>
              <ul v-else-if="block.type === 'list'" class="lpe-list">
                <li v-for="(li, i) in block.items" :key="i">{{ li }}</li>
              </ul>
              <div v-else-if="block.type === 'image'" class="lpe-image">
                <v-icon size="32">image</v-icon>
                <span class="text-caption text-medium-emphasis">{{ block.alt || 'Image' }}</span>
              </div>
              <div v-else-if="block.type === 'video'" class="lpe-image">
                <v-icon size="32">video</v-icon>
                <span class="text-caption text-medium-emphasis">{{ block.alt || 'Video embed' }}</span>
              </div>
              <div v-else-if="block.type === 'button'" :style="{ textAlign: block.align }">
                <span class="lpe-button">{{ block.label }}</span>
              </div>
              <div v-else-if="block.type === 'form'" class="lpe-form-block">
                <div class="lpe-form-block__field">Email address</div>
                <div class="lpe-form-block__submit">{{ block.label || 'Subscribe' }}</div>
              </div>
              <hr v-else-if="block.type === 'divider'" class="lpe-divider" />
              <div v-else-if="block.type === 'spacer'" class="lpe-spacer" :style="{ height: `${block.height}px` }" />
              <div v-else-if="block.type === 'social'" class="lpe-social" :style="{ textAlign: block.align }">
                <v-icon>facebook</v-icon><v-icon>instagram</v-icon><v-icon>twitter</v-icon><v-icon>linkedin</v-icon>
              </div>
              <div v-else-if="block.type === 'icons'" class="lpe-social" :style="{ textAlign: block.align }">
                <v-icon>star</v-icon><v-icon>heart</v-icon><v-icon>shield-check</v-icon>
              </div>
              <nav v-else-if="block.type === 'menu'" class="lpe-menu" :style="{ textAlign: block.align }">
                <span v-for="(li, i) in block.items" :key="i" class="lpe-menu__item">{{ li }}</span>
              </nav>
              <pre v-else-if="block.type === 'html'" class="lpe-html">{{ block.text }}</pre>
            </div>
          </div>
        </main>

        <!-- settings -->
        <aside class="lpe-settings pa-4">
          <template v-if="selected">
            <div class="text-subtitle-2 font-weight-bold mb-4 text-capitalize">{{ selected.type }} settings</div>

            <template v-if="selected.type === 'title' || selected.type === 'paragraph' || selected.type === 'text'">
              <v-textarea v-model="selected.text" label="Text" variant="outlined" density="comfortable" rounded="lg" auto-grow rows="3" class="mb-4" hide-details />
            </template>
            <template v-else-if="selected.type === 'list' || selected.type === 'menu'">
              <v-textarea :model-value="listText(selected)" label="Items (one per line)" variant="outlined" density="comfortable" rounded="lg" auto-grow rows="3" class="mb-4" hide-details @update:model-value="v => setListText(selected!, v)" />
            </template>
            <template v-else-if="selected.type === 'image' || selected.type === 'video'">
              <v-text-field v-model="selected.alt" label="Alt text / caption" variant="outlined" density="comfortable" rounded="lg" class="mb-4" hide-details />
              <v-btn variant="tonal" block prepend-icon="upload" class="text-none mb-4">Upload media</v-btn>
            </template>
            <template v-else-if="selected.type === 'button' || selected.type === 'form'">
              <v-text-field v-model="selected.label" label="Label" variant="outlined" density="comfortable" rounded="lg" class="mb-4" hide-details />
              <v-text-field v-if="selected.type === 'button'" v-model="selected.url" label="Link URL" variant="outlined" density="comfortable" rounded="lg" class="mb-4" hide-details />
            </template>
            <template v-else-if="selected.type === 'spacer'">
              <v-slider v-model="selected.height" label="Height" :min="8" :max="96" :step="4" thumb-label class="mb-4" hide-details />
            </template>
            <template v-else-if="selected.type === 'html'">
              <v-textarea v-model="selected.text" label="HTML" variant="outlined" density="comfortable" rounded="lg" auto-grow rows="5" class="mb-4 lpe-mono" hide-details />
            </template>
            <template v-else>
              <div class="text-body-2 text-medium-emphasis mb-4">No content options for this block.</div>
            </template>

            <template v-if="['title', 'paragraph', 'text', 'button', 'social', 'icons', 'menu'].includes(selected.type)">
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

      <!-- Page settings drawer -->
      <MpFormDrawer v-model="settingsOpen" title="Page Settings" subtitle="SEO, URL, and tracking for this page">
        <v-text-field v-model="pageUrl" label="Page URL" variant="outlined" density="comfortable" class="mb-4" />
        <v-text-field v-model="seo.pageTitle" label="Page Title" variant="outlined" density="comfortable" class="mb-4" />
        <v-textarea v-model="seo.description" label="Description" variant="outlined" density="comfortable" rows="2" class="mb-4" />
        <v-text-field v-model="seo.redirectAfterExpiry" label="Redirect after expiry" placeholder="https://mystore.com" variant="outlined" density="comfortable" class="mb-4" />
        <v-text-field v-model="seo.metaKeywords" label="Meta Keywords" variant="outlined" density="comfortable" class="mb-4" />
        <v-textarea v-model="seo.tracking" label="Page Tracking" placeholder="Paste analytics / pixel tracking code" variant="outlined" density="comfortable" rows="3" />
        <template #footer>
          <v-btn variant="text" class="text-none" @click="settingsOpen = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" class="text-none" @click="settingsOpen = false">Done</v-btn>
        </template>
      </MpFormDrawer>

      <!-- Preview dialog -->
      <v-dialog v-model="previewOpen" max-width="720" rounded="xl">
        <v-card rounded="lg" border flat class="pa-5">
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="text-h6 font-weight-bold">{{ pageName }}</div>
            <v-btn icon="x" variant="text" size="small" aria-label="Close" @click="previewOpen = false" />
          </div>
          <div class="lpe-preview-stage pa-6">
            <div class="lpe-doc lpe-doc--preview mx-auto">
              <div v-for="block in blocks" :key="block.id" class="lpe-block lpe-block--readonly">
                <h2 v-if="block.type === 'title'" class="lpe-title" :style="{ textAlign: block.align }">{{ block.text }}</h2>
                <p v-else-if="block.type === 'paragraph' || block.type === 'text'" class="lpe-paragraph" :style="{ textAlign: block.align }">{{ block.text }}</p>
                <ul v-else-if="block.type === 'list'" class="lpe-list"><li v-for="(li, i) in block.items" :key="i">{{ li }}</li></ul>
                <div v-else-if="block.type === 'image' || block.type === 'video'" class="lpe-image"><v-icon size="28">{{ block.type === 'video' ? 'video' : 'image' }}</v-icon></div>
                <div v-else-if="block.type === 'button'" :style="{ textAlign: block.align }"><span class="lpe-button">{{ block.label }}</span></div>
                <div v-else-if="block.type === 'form'" class="lpe-form-block"><div class="lpe-form-block__field">Email address</div><div class="lpe-form-block__submit">{{ block.label || 'Subscribe' }}</div></div>
                <hr v-else-if="block.type === 'divider'" class="lpe-divider" />
              </div>
            </div>
          </div>
        </v-card>
      </v-dialog>

      <v-snackbar v-model="toast.show" color="success" timeout="1600" location="bottom right">{{ toast.text }}</v-snackbar>
    </template>

    <MpEmptyState
      v-else
      icon="file-x"
      title="Landing page not found"
      description="This landing page doesn’t exist."
      action-label="Back to Landing Pages"
      action-icon="arrow-left"
      class="my-auto"
      @action="$router.push(backTo)"
    />
  </div>
</template>

<style scoped>
.lpe {
  height: 100%;
  background: rgb(var(--v-theme-background));
}
.lpe-top {
  height: 60px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  background: rgb(var(--v-theme-surface));
}
.lpe-name {
  max-width: 260px;
  font-weight: 700;
}
.lpe-palette {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  background: rgb(var(--v-theme-surface));
  overflow-y: auto;
}
.lpe-palette__item {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  transition: background 100ms ease;
}
.lpe-palette__item:hover {
  background: rgba(var(--v-theme-primary), 0.08);
}
.lpe-palette__add {
  opacity: 0;
  transition: opacity 100ms ease;
}
.lpe-palette__item:hover .lpe-palette__add {
  opacity: 0.6;
}
.lpe-canvas {
  overflow-y: auto;
  background: rgb(var(--v-theme-background));
}
.lpe-doc {
  width: 100%;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  border-radius: 12px;
  padding: 16px;
  min-height: 400px;
  transition: max-width 0.2s ease;
}
.lpe-doc--preview { max-width: 700px; }
.lpe-block {
  position: relative;
  padding: 10px 12px;
  border: 1.5px solid transparent;
  border-radius: 8px;
  transition: border-color 100ms ease;
}
.lpe-block:hover {
  border-color: rgba(var(--v-theme-primary), 0.25);
}
.lpe-block--selected {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.03);
}
.lpe-block--readonly { cursor: default; }
.lpe-block__controls {
  position: absolute;
  top: -14px;
  right: 8px;
  display: none;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  padding: 1px;
}
.lpe-block:hover .lpe-block__controls,
.lpe-block--selected .lpe-block__controls {
  display: flex;
}
.lpe-title {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.3;
  color: rgb(var(--v-theme-on-surface));
}
.lpe-paragraph {
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgb(var(--v-theme-on-surface-variant));
}
.lpe-list {
  padding-left: 20px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.95rem;
  line-height: 1.7;
}
.lpe-image {
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
.lpe-button {
  display: inline-block;
  padding: 10px 24px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
}
.lpe-form-block { display: flex; flex-direction: column; gap: 8px; max-width: 320px; }
.lpe-form-block__field {
  height: 36px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 0.85rem;
  color: rgb(var(--v-theme-on-surface-variant));
}
.lpe-form-block__submit {
  height: 38px;
  border-radius: 8px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
}
.lpe-divider {
  border: none;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  margin: 4px 0;
}
.lpe-spacer {
  background: repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(var(--v-theme-on-surface), 0.05) 6px, rgba(var(--v-theme-on-surface), 0.05) 12px);
  border-radius: 4px;
}
.lpe-social {
  display: flex;
  gap: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}
.lpe-menu { display: flex; gap: 20px; font-size: 0.85rem; font-weight: 600; }
.lpe-html {
  font-family: monospace;
  font-size: 0.8rem;
  background: rgba(var(--v-theme-on-surface), 0.05);
  padding: 10px;
  border-radius: 6px;
  color: rgb(var(--v-theme-on-surface-variant));
  white-space: pre-wrap;
}
.lpe-settings {
  width: 300px;
  flex-shrink: 0;
  border-left: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  background: rgb(var(--v-theme-surface));
  overflow-y: auto;
}
.lpe-preview-stage { background: rgba(var(--v-theme-on-surface), 0.02); border-radius: 12px; }
:deep(.lpe-mono textarea) {
  font-family: monospace;
  font-size: 0.82rem;
}
</style>
