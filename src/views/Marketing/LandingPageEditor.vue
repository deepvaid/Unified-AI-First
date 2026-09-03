<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch, type ComponentPublicInstance } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLandingPagesStore, defaultLandingBlock, defaultLandingStyle } from '@/stores/useLandingPages'
import type { LandingPageBlock, LandingPageBlockType, LandingPageStyle, BaseFont } from '@/stores/useLandingPages'
import MpBuilderShell from '@/components/MpBuilderShell.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpBuilderPreviewDialog from '@/components/MpBuilderPreviewDialog.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import LandingBlockPalette, { type PaletteItem } from '@/components/marketing/landing/LandingBlockPalette.vue'
import LandingLayersPanel from '@/components/marketing/landing/LandingLayersPanel.vue'
import LandingPageStylePanel from '@/components/marketing/landing/LandingPageStylePanel.vue'
import LandingBlockSettings from '@/components/marketing/landing/LandingBlockSettings.vue'
import LandingBlockView from '@/components/marketing/landing/LandingBlockView.vue'
import LandingInsertionPoint from '@/components/marketing/landing/LandingInsertionPoint.vue'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const lpStore = useLandingPagesStore()

const accountId = computed(() => route.params.accountId as string)
const pageId = computed(() => Number(route.params.id))
const page = computed(() => lpStore.pages.find(p => p.id === pageId.value))
const backTo = computed(() => ({ name: 'LandingPages', params: { accountId: accountId.value } }))

const PALETTE: PaletteItem[] = [
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

// ─── Working copy of page content (autosaved into the store, see below) ───
const pageName = ref(page.value?.name ?? '')
const pageUrl = ref(page.value?.url ?? '')
const seo = ref(page.value ? { ...page.value.seo } : { description: '', pageTitle: '', redirectAfterExpiry: '', metaKeywords: '', tracking: '' })
const blocks = ref<LandingPageBlock[]>(page.value ? page.value.blocks.map(b => ({ ...b, items: [...b.items], networks: [...b.networks], iconSet: [...b.iconSet], links: b.links.map(l => ({ ...l })) })) : [])
const pageStyle = ref<LandingPageStyle>(page.value ? { ...page.value.style } : defaultLandingStyle())

const selectedId = ref<string | null>(null)
const selected = computed(() => blocks.value.find(b => b.id === selectedId.value) ?? null)

const device = ref<'desktop' | 'mobile'>('desktop')
const showStructure = ref(false)
const leftTab = ref<'blocks' | 'layers'>('blocks')
const settingsOpen = ref(false)
const previewOpen = ref(route.query.preview === '1')
const previewDevice = ref<'desktop' | 'mobile'>('desktop')
const DEVICE_ITEMS = [
  { value: 'desktop', label: 'Desktop view', icon: 'monitor', tooltip: 'Desktop view' },
  { value: 'mobile', label: 'Mobile view', icon: 'smartphone', tooltip: 'Mobile view' },
]

const FONT_STACK: Record<BaseFont, string> = {
  Inter: 'Inter, system-ui, -apple-system, sans-serif',
  Georgia: 'Georgia, "Times New Roman", serif',
  Mono: "'JetBrains Mono', 'Fira Code', monospace",
}
const styleVars = computed(() => ({
  '--lp-content-width': `${pageStyle.value.contentWidth}px`,
  '--lp-font': FONT_STACK[pageStyle.value.baseFont],
  '--lp-accent': pageStyle.value.accentColor,
  '--lp-radius': `${pageStyle.value.buttonRadius}px`,
}))

function updatePageStyle(patch: Partial<LandingPageStyle>) {
  Object.assign(pageStyle.value, patch)
}

// ─── Block refs (for scroll-into-view from the Layers panel) ─────────────
const blockRefs = new Map<string, HTMLElement>()
function setBlockRef(id: string, el: Element | ComponentPublicInstance | null) {
  if (el instanceof HTMLElement) blockRefs.set(id, el)
  else blockRefs.delete(id)
}
function selectAndScroll(id: string) {
  selectedId.value = id
  nextTick(() => blockRefs.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
}

// ─── Undo (structural edits only — max 20 snapshots) ──────────────────────
interface Snapshot { blocks: LandingPageBlock[]; style: LandingPageStyle }
const undoStack = ref<Snapshot[]>([])
function snapshot() {
  undoStack.value.push({ blocks: JSON.parse(JSON.stringify(blocks.value)), style: { ...pageStyle.value } })
  if (undoStack.value.length > 20) undoStack.value.shift()
}
function undo() {
  const prev = undoStack.value.pop()
  if (!prev) return
  blocks.value = prev.blocks
  pageStyle.value = prev.style
  selectedId.value = null
}

// ─── Flash highlight on newly-added blocks ────────────────────────────────
const flashId = ref<string | null>(null)
function flash(id: string) {
  flashId.value = id
  setTimeout(() => { if (flashId.value === id) flashId.value = null }, 700)
}

// ─── Block mutations ──────────────────────────────────────────────────────
function addBlockAt(index: number, type: LandingPageBlockType) {
  snapshot()
  const block = defaultLandingBlock(type)
  blocks.value.splice(index, 0, block)
  selectedId.value = block.id
  flash(block.id)
}
function addBlock(type: LandingPageBlockType) {
  const idx = selectedId.value ? blocks.value.findIndex(b => b.id === selectedId.value) + 1 : blocks.value.length
  addBlockAt(idx, type)
}
function duplicateBlock(id: string) {
  const idx = blocks.value.findIndex(b => b.id === id)
  if (idx === -1) return
  const source = blocks.value[idx]
  if (!source) return
  snapshot()
  const copy: LandingPageBlock = { ...source, id: `lpb-copy-${Date.now()}-${idx}`, items: [...source.items], networks: [...source.networks], iconSet: [...source.iconSet], links: source.links.map(l => ({ ...l })) }
  blocks.value.splice(idx + 1, 0, copy)
  selectedId.value = copy.id
  flash(copy.id)
}
function removeBlock(id: string) {
  const idx = blocks.value.findIndex(b => b.id === id)
  if (idx === -1) return
  snapshot()
  blocks.value.splice(idx, 1)
  if (selectedId.value === id) selectedId.value = blocks.value[Math.max(0, idx - 1)]?.id ?? null
}
function moveBlock(id: string, dir: -1 | 1) {
  const idx = blocks.value.findIndex(b => b.id === id)
  const next = idx + dir
  if (idx === -1 || next < 0 || next >= blocks.value.length) return
  snapshot()
  const [b] = blocks.value.splice(idx, 1)
  if (b) blocks.value.splice(next, 0, b)
}
function reorderBlocks(fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) return
  snapshot()
  const [b] = blocks.value.splice(fromIndex, 1)
  if (!b) return
  const adjusted = fromIndex < toIndex ? toIndex - 1 : toIndex
  blocks.value.splice(adjusted, 0, b)
}
function reorderBlockToIndex(id: string, targetIndex: number) {
  const fromIndex = blocks.value.findIndex(b => b.id === id)
  if (fromIndex === -1) return
  reorderBlocks(fromIndex, targetIndex)
}

function insertQuickStart(kind: 'hero' | 'feature' | 'cta') {
  snapshot()
  const group: LandingPageBlock[] =
    kind === 'hero'
      ? [
          { ...defaultLandingBlock('title'), text: 'Say hello to your next big idea', titleSize: 'XL', align: 'center' },
          { ...defaultLandingBlock('paragraph'), text: 'A short, confident subhead that tells visitors exactly what this page is about.', align: 'center' },
          { ...defaultLandingBlock('button'), label: 'Get started', align: 'center' },
        ]
      : kind === 'feature'
        ? [
            { ...defaultLandingBlock('title'), text: 'Why teams choose us', titleSize: 'L', align: 'center' },
            { ...defaultLandingBlock('image'), alt: 'Feature preview' },
            { ...defaultLandingBlock('list'), items: ['Fast to set up', 'Built for scale', 'Loved by 10,000+ merchants'] },
          ]
        : [
            { ...defaultLandingBlock('title'), text: 'Ready when you are', titleSize: 'L', align: 'center' },
            { ...defaultLandingBlock('button'), label: 'Start free trial', align: 'center' },
          ]
  blocks.value.push(...group)
  selectedId.value = group[0]?.id ?? null
}

// ─── Keyboard: Delete removes selected, Esc deselects, Cmd/Ctrl+Z undo ────
function onKeydown(e: KeyboardEvent) {
  if (previewOpen.value || settingsOpen.value) return
  const target = e.target as HTMLElement | null
  const typing = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  if (e.key === 'Escape') {
    selectedId.value = null
    return
  }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    undo()
    return
  }
  if (typing) return
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId.value) {
    e.preventDefault()
    removeBlock(selectedId.value)
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

// ─── Autosave (debounced) ──────────────────────────────────────────────────
const dirty = ref(false)
let saveTimer: ReturnType<typeof setTimeout> | null = null
function flushSave() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null }
  if (!page.value) return
  lpStore.update(page.value.id, {
    name: pageName.value,
    url: pageUrl.value,
    seo: { ...seo.value },
    blocks: blocks.value,
    style: { ...pageStyle.value },
  })
  dirty.value = false
}
function markDirty() {
  dirty.value = true
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(flushSave, 900)
}
watch([blocks, pageStyle, pageName, pageUrl, seo], markDirty, { deep: true })
onUnmounted(() => { if (dirty.value) flushSave() })

// ─── Topbar actions ────────────────────────────────────────────────────────
const toast = useToast()
function notify(text: string) { toast.success(text) }

function verifyDomainAction() {
  if (!page.value) return
  lpStore.verifyDomain(page.value.id)
  notify('Domain verified')
}
function saveAsTemplateAction() {
  if (!page.value) return
  lpStore.saveAsTemplate(page.value.id)
  notify('Saved as template')
}
function duplicatePageAction() {
  if (!page.value) return
  lpStore.duplicate(page.value.id)
  notify('Page duplicated')
}

const urlPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(\/[\w-]*)*\/?$/i
const urlValid = computed(() => urlPattern.test(pageUrl.value.trim()))
const canPublish = computed(() => urlValid.value && pageUrl.value.trim().length > 0)

const confirmPublishOpen = ref(false)
const confirmUnpublishOpen = ref(false)
function requestPublishToggle() {
  if (!page.value) return
  if (page.value.publishStatus === 'published') {
    confirmUnpublishOpen.value = true
    return
  }
  if (!canPublish.value) {
    settingsOpen.value = true
    notify('Set a valid page URL before publishing')
    return
  }
  confirmPublishOpen.value = true
}
function confirmPublish() {
  if (!page.value) return
  flushSave()
  lpStore.publish(page.value.id)
  notify('Page published')
}
function confirmUnpublish() {
  if (!page.value) return
  lpStore.unpublish(page.value.id)
  notify('Page unpublished')
}

function openPreview() {
  previewDevice.value = device.value
  previewOpen.value = true
}

function saveAndClose() {
  flushSave()
  router.push(backTo.value)
}
</script>

<template>
  <MpBuilderShell
    v-if="page"
    :back-to="backTo"
    back-label="Back to Landing Pages"
    :title="pageName"
    :dirty="dirty"
    persistence-mode="autosave"
    :left-width="264"
  >
    <template #title>
      <!-- Toolbar chrome, not a form: plain/compact/hide-details are deliberate here. -->
      <v-text-field
        v-model="pageName"
        variant="plain"
        density="compact"
        hide-details
        class="lpe-name"
        aria-label="Page name"
      />
      <v-chip
        size="x-small"
        variant="outlined"
        class="lpe-url-chip text-truncate"
        :class="{ 'lpe-url-chip--error': !canPublish }"
        @click="settingsOpen = true"
      >{{ pageUrl || 'Set a URL' }}</v-chip>
      <MpStatusChip :status="page.publishStatus === 'published' ? 'Published' : 'Draft'" type="general" size="sm" />
    </template>

    <template #toolbar-center>
      <MpSegmentedControl
        :model-value="device"
        :items="DEVICE_ITEMS"
        size="sm"
        ariaLabel="Canvas device"
        @update:model-value="v => device = v as typeof device"
      />
      <v-btn
        :variant="showStructure ? 'tonal' : 'text'"
        :color="showStructure ? 'primary' : undefined"
        size="small"
        class="text-none"
        prepend-icon="layout-grid"
        @click="showStructure = !showStructure"
      >
        Structure
      </v-btn>
    </template>

    <template #actions>
      <v-tooltip text="Undo (⌘Z)" location="bottom">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="text"
            icon="undo-2"
            size="small"
            aria-label="Undo"
            :disabled="!undoStack.length"
            @click="undo"
          />
        </template>
      </v-tooltip>
      <v-btn variant="text" icon="eye" size="small" aria-label="Preview page" @click="openPreview" />
      <v-btn variant="text" icon="settings" size="small" aria-label="Page settings" @click="settingsOpen = true" />
      <MpRowActionsMenu ariaLabel="More page actions">
        <MpMenuItem title="Verify Domain" icon="shield-check" :disabled="page.status === 'Verified'" @click="verifyDomainAction" />
        <MpMenuItem title="Save as Template" icon="copy-plus" @click="saveAsTemplateAction" />
        <MpMenuItem title="Duplicate Page" icon="copy" @click="duplicatePageAction" />
      </MpRowActionsMenu>
      <v-btn variant="outlined" class="text-none" prepend-icon="check" @click="saveAndClose">Save and Close</v-btn>
      <v-tooltip
        :text="canPublish || page.publishStatus === 'published' ? '' : 'Set a valid page URL before publishing'"
        :disabled="canPublish || page.publishStatus === 'published'"
        location="bottom"
      >
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            :variant="page.publishStatus === 'published' ? 'tonal' : 'flat'"
            :color="page.publishStatus === 'published' ? 'warning' : 'primary'"
            class="text-none"
            :prepend-icon="page.publishStatus === 'published' ? 'circle-slash' : 'rocket'"
            :disabled="page.publishStatus !== 'published' && !canPublish"
            @click="requestPublishToggle"
          >
            {{ page.publishStatus === 'published' ? 'Unpublish' : 'Publish' }}
          </v-btn>
        </template>
      </v-tooltip>
    </template>

      <div class="lpe-body d-flex h-100 overflow-hidden">
        <!-- left: Blocks / Layers -->
        <aside class="lpe-left">
          <div class="lpe-left__tabs" role="tablist" aria-label="Editor panels">
            <button
              type="button"
              role="tab"
              class="lpe-tab"
              :class="{ 'lpe-tab--active': leftTab === 'blocks' }"
              :aria-selected="leftTab === 'blocks'"
              @click="leftTab = 'blocks'"
            >Blocks</button>
            <button
              type="button"
              role="tab"
              class="lpe-tab"
              :class="{ 'lpe-tab--active': leftTab === 'layers' }"
              :aria-selected="leftTab === 'layers'"
              @click="leftTab = 'layers'"
            >Layers</button>
          </div>
          <div class="lpe-left__body pa-3">
            <LandingBlockPalette v-if="leftTab === 'blocks'" :palette="PALETTE" @add="addBlock" />
            <LandingLayersPanel
              v-else
              :blocks="blocks"
              :selected-id="selectedId"
              :palette="PALETTE"
              @select="selectAndScroll"
              @duplicate="duplicateBlock"
              @remove="removeBlock"
              @move="moveBlock"
              @reorder="reorderBlocks"
            />
          </div>
        </aside>

        <!-- center: canvas -->
        <main class="lpe-canvas flex-grow-1" @click.self="selectedId = null">
          <div class="lpe-sheet" :class="`lpe-sheet--${device}`" :style="{ background: pageStyle.backgroundColor, ...styleVars }" @click.self="selectedId = null">
            <div class="lpe-content" @click.self="selectedId = null">
              <div v-if="!blocks.length" class="lpe-empty text-center py-16 px-6">
                <v-icon size="34" color="primary" class="mb-3">layout-template</v-icon>
                <h2 class="mp-section-title mb-1">Start with a section</h2>
                <div class="text-body-2 text-medium-emphasis mb-6">Add a ready-made block group, or drag one in from the Blocks palette.</div>
                <div class="d-flex justify-center ga-3 flex-wrap">
                  <v-btn variant="tonal" color="primary" prepend-icon="sparkles" class="text-none" @click="insertQuickStart('hero')">Hero</v-btn>
                  <v-btn variant="tonal" color="primary" prepend-icon="layout-grid" class="text-none" @click="insertQuickStart('feature')">Feature</v-btn>
                  <v-btn variant="tonal" color="primary" prepend-icon="megaphone" class="text-none" @click="insertQuickStart('cta')">CTA</v-btn>
                </div>
              </div>
              <template v-else>
                <template v-for="(block, index) in blocks" :key="block.id">
                  <LandingInsertionPoint :palette="PALETTE" @insert="type => addBlockAt(index, type)" @reorder="id => reorderBlockToIndex(id, index)" />
                  <div :ref="el => setBlockRef(block.id, el)">
                    <LandingBlockView
                      :block="block"
                      editable
                      :selected="block.id === selectedId"
                      :show-structure="showStructure"
                      :palette="PALETTE"
                      :class="{ 'lp-flash': flashId === block.id }"
                      @select="selectedId = block.id"
                      @duplicate="duplicateBlock(block.id)"
                      @remove="removeBlock(block.id)"
                    />
                  </div>
                </template>
                <LandingInsertionPoint :palette="PALETTE" @insert="type => addBlockAt(blocks.length, type)" @reorder="id => reorderBlockToIndex(id, blocks.length)" />
              </template>
            </div>
          </div>
        </main>

        <!-- right: block settings or page style -->
        <aside class="lpe-right pa-4">
          <template v-if="selected">
            <LandingBlockSettings :block="selected" @remove="removeBlock" />
          </template>
          <LandingPageStylePanel v-else :style="pageStyle" @update="updatePageStyle" />
        </aside>
      </div>

      <!-- Page settings drawer -->
      <MpFormDrawer v-model="settingsOpen" title="Page Settings" subtitle="SEO, URL, and tracking for this page">
        <MpFormSection title="URL">
          <MpFormGrid>
            <v-text-field v-model="pageUrl" label="Page URL" />
            <v-text-field v-model="seo.redirectAfterExpiry" label="Redirect after expiry" placeholder="https://mystore.com" />
          </MpFormGrid>
        </MpFormSection>
        <MpFormSection title="SEO">
          <MpFormGrid>
            <v-text-field v-model="seo.pageTitle" label="Page Title" />
            <v-textarea v-model="seo.description" label="Description" rows="3" />
            <v-text-field v-model="seo.metaKeywords" label="Meta Keywords" />
          </MpFormGrid>
        </MpFormSection>
        <MpFormSection title="Tracking">
          <MpFormGrid>
            <v-textarea v-model="seo.tracking" label="Page Tracking" placeholder="Paste analytics / pixel tracking code" rows="3" />
          </MpFormGrid>
        </MpFormSection>
        <template #footer>
          <v-btn variant="text" class="text-none" @click="settingsOpen = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" class="text-none" @click="settingsOpen = false">Done</v-btn>
        </template>
      </MpFormDrawer>

      <MpBuilderPreviewDialog v-model="previewOpen" :title="pageName || 'Preview'">
        <template #toolbar>
          <MpSegmentedControl
            :model-value="previewDevice"
            :items="DEVICE_ITEMS"
            size="sm"
            ariaLabel="Preview device"
            @update:model-value="v => previewDevice = v as typeof previewDevice"
          />
        </template>
        <div class="lpe-sheet" :class="`lpe-sheet--${previewDevice}`" :style="{ background: pageStyle.backgroundColor, ...styleVars }">
          <div class="lpe-content">
            <LandingBlockView v-for="block in blocks" :key="block.id" :block="block" :palette="PALETTE" />
          </div>
        </div>
      </MpBuilderPreviewDialog>

      <MpConfirmDialog
        v-model="confirmPublishOpen"
        title="Publish this page?"
        message="This makes the page publicly live at its published URL."
        confirm-label="Publish"
        @confirm="confirmPublish"
      />
      <MpConfirmDialog
        v-model="confirmUnpublishOpen"
        title="Unpublish this page?"
        message="Visitors will no longer be able to view this page until it's published again."
        confirm-label="Unpublish"
        danger
        @confirm="confirmUnpublish"
      />
  </MpBuilderShell>

  <div v-else class="lpe-missing d-flex align-center justify-center">
    <MpEmptyState
      icon="file-x"
      title="Landing page not found"
      description="This landing page doesn’t exist."
      action-label="Back to Landing Pages"
      action-icon="arrow-left"
      @action="$router.push(backTo)"
    />
  </div>
</template>

<style scoped>
.lpe-missing {
  min-height: 60vh;
}
.lpe-name {
  max-width: 220px;
  flex-shrink: 0;
  font-weight: 700;
}
.lpe-url-chip {
  max-width: 220px;
  cursor: pointer;
  flex-shrink: 1;
}
.lpe-url-chip--error {
  color: rgb(var(--v-theme-error));
  border-color: rgba(var(--v-theme-error), 0.5);
}

/* body layout */
.lpe-body {
  min-height: 0;
}
.lpe-left {
  display: flex;
  flex-direction: column;
  width: 264px;
  flex-shrink: 0;
  border-right: 1px solid var(--border-subtle);
  background: rgb(var(--v-theme-surface));
}
.lpe-left__tabs {
  display: flex;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-subtle);
}
.lpe-tab {
  flex: 1;
  padding: 10px 0;
  border: none;
  background: transparent;
  font-size: var(--mp-text-label-fontSize);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--on-surface-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 100ms ease, border-color 100ms ease;
}
.lpe-tab:hover {
  color: rgb(var(--v-theme-on-surface));
}
.lpe-tab:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: -2px;
}
.lpe-tab--active {
  color: rgb(var(--v-theme-primary));
  border-bottom-color: rgb(var(--v-theme-primary));
}
.lpe-left__body {
  overflow-y: auto;
  flex-grow: 1;
}
.lpe-right {
  width: 320px;
  flex-shrink: 0;
  border-left: 1px solid var(--border-subtle);
  background: rgb(var(--v-theme-surface));
  overflow-y: auto;
}

/* canvas */
.lpe-canvas {
  overflow-y: auto;
  background: rgb(var(--v-theme-background));
  padding: 40px 24px;
  display: flex;
  justify-content: center;
}
.lpe-sheet {
  border-radius: 12px;
  box-shadow: 0 12px 32px -16px rgba(var(--v-theme-on-surface), 0.28), 0 1px 2px rgba(var(--v-theme-on-surface), 0.08);
  transition: width 0.25s ease, max-width 0.25s ease;
  min-height: 520px;
  align-self: flex-start;
  overflow: hidden;
}
.lpe-sheet--desktop {
  width: 100%;
  max-width: 960px;
}
.lpe-sheet--mobile {
  width: 390px;
  max-width: 390px;
}
.lpe-content {
  max-width: min(var(--lp-content-width, 720px), 100%);
  margin: 0 auto;
  padding: 40px 32px;
  font-family: var(--lp-font, inherit);
  display: flex;
  flex-direction: column;
}
.lpe-empty {
  border: 1.5px dashed rgba(var(--v-theme-on-surface), 0.16);
  border-radius: 12px;
  margin: 20px 0;
}

/* flash highlight on newly added blocks */
@keyframes lp-flash-pulse {
  0% { background: rgba(var(--v-theme-primary), 0.16); }
  100% { background: transparent; }
}
.lp-flash {
  animation: lp-flash-pulse 700ms ease-out;
}

/* preview dialog */
.lpe-preview-bar {
  height: 52px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-subtle);
}
.lpe-preview-stage {
  overflow-y: auto;
  background: rgb(var(--v-theme-background));
  padding: 40px 24px;
  display: flex;
  justify-content: center;
}

@media (max-width: 1024px) {
  .lpe-left { width: 220px; }
  .lpe-right { width: 280px; }
}
@media (max-width: 768px) {
  .lpe-left,
  .lpe-right { display: none; }
}
</style>
