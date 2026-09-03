<script setup lang="ts">
import { ref, watch } from 'vue'
import MpDialog from '@/components/MpDialog.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import CampaignEmailPreview from '@/components/marketing/CampaignEmailPreview.vue'

/**
 * GAP (see docs/rebuild/new-campaign/GAPS.md §1): in production this surface is a
 * third-party drag-and-drop email builder embedded by the platform ("Edit Content —
 * Editor Type: DnD"), which also generates the per-device inbox previews. Per the
 * Phase-2 decision it is represented here as a visual mock — the block palette and
 * canvas are non-editing, and "Generate previews" simulates the third-party render.
 */
const model = defineModel<boolean>({ default: false })

const props = withDefaults(defineProps<{
  contentName?: string
}>(), {
  contentName: 'Untitled content',
})

const mode = ref<'editor' | 'devices'>('editor')

const BLOCKS = [
  { icon: 'heading-1', label: 'Heading' },
  { icon: 'text', label: 'Paragraph' },
  { icon: 'image', label: 'Image' },
  { icon: 'square-mouse-pointer', label: 'Button' },
  { icon: 'columns-2', label: 'Columns' },
  { icon: 'minus', label: 'Divider' },
  { icon: 'shopping-bag', label: 'Product grid' },
  { icon: 'share-2', label: 'Social links' },
]

interface DevicePreview {
  key: string
  label: string
  caption: string
  /** CSS pixel width the email is laid out at before scaling into the card. */
  viewport: number
  dark?: boolean
}

const DEVICES: DevicePreview[] = [
  { key: 'desktop', label: 'Desktop', caption: 'Gmail · 1280px', viewport: 720 },
  { key: 'tablet', label: 'Tablet', caption: 'iPad · 768px', viewport: 560 },
  { key: 'mobile', label: 'Mobile', caption: 'iPhone · 375px', viewport: 375 },
  { key: 'mobile-dark', label: 'Mobile · Dark', caption: 'iPhone · dark mode', viewport: 375, dark: true },
]

const generating = ref(false)
const generated = ref(false)
let generateTimer: ReturnType<typeof setTimeout> | null = null

function generatePreviews() {
  generating.value = true
  generated.value = false
  if (generateTimer) clearTimeout(generateTimer)
  generateTimer = setTimeout(() => {
    generating.value = false
    generated.value = true
  }, 1400)
}

watch(model, (open) => {
  if (!open) {
    mode.value = 'editor'
    generating.value = false
    generated.value = false
    if (generateTimer) clearTimeout(generateTimer)
  }
})
</script>

<template>
  <MpDialog
    v-model="model"
    fullscreen
    flush
    :title="'Edit content'"
    :subtitle="`Drag & Drop editor · ${props.contentName}`"
    icon="pencil-ruler"
  >
    <div class="cce d-flex flex-column">
      <div class="cce__toolbar d-flex align-center px-5 border-b bg-surface">
        <v-btn-toggle v-model="mode" mandatory density="comfortable" variant="outlined" divided rounded="lg">
          <v-btn value="editor" prepend-icon="layout-template" class="text-none">Editor</v-btn>
          <v-btn value="devices" prepend-icon="monitor-smartphone" class="text-none">Device previews</v-btn>
        </v-btn-toggle>
        <v-spacer />
        <v-chip size="small" variant="tonal" prepend-icon="plug-zap">Third-party editor · visual mock</v-chip>
      </div>

      <!-- Editor mock: palette + canvas -->
      <div v-if="mode === 'editor'" class="cce__editor flex-grow-1 d-flex">
        <aside class="cce__palette border-e bg-surface" aria-label="Content blocks">
          <p class="cce__palette-title">Blocks</p>
          <div class="d-flex flex-column ga-1 px-2">
            <div v-for="block in BLOCKS" :key="block.label" class="cce__block d-flex align-center ga-3">
              <v-icon size="16" class="text-medium-emphasis" aria-hidden="true">{{ block.icon }}</v-icon>
              <span class="text-body-2">{{ block.label }}</span>
              <v-icon size="14" class="ml-auto text-disabled" aria-hidden="true">grip-vertical</v-icon>
            </div>
          </div>
        </aside>
        <div class="cce__canvas flex-grow-1">
          <CampaignEmailPreview :content-name="props.contentName" />
        </div>
      </div>

      <!-- Device previews -->
      <div v-else class="cce__devices flex-grow-1">
        <MpSectionHeader
          title="Inbox previews"
          :heading-level="3"
          description="Rendered by the preview service across common devices and clients."
        >
          <template #actions>
            <v-btn
              color="primary"
              class="text-none"
              :prepend-icon="generated ? 'refresh-cw' : 'sparkles'"
              :loading="generating"
              @click="generatePreviews"
            >
              {{ generated ? 'Regenerate previews' : 'Generate previews' }}
            </v-btn>
          </template>
        </MpSectionHeader>

        <div v-if="!generating && !generated" class="cce__device-empty d-flex flex-column align-center justify-center text-center ga-2">
          <v-icon size="40" class="text-medium-emphasis" aria-hidden="true">monitor-smartphone</v-icon>
          <p class="text-body-1 font-weight-medium mb-0">No previews generated yet</p>
          <p class="text-body-2 text-medium-emphasis mb-0">
            Generate previews to see how this email renders on desktop, tablet, and mobile — including dark mode.
          </p>
        </div>

        <div v-else class="cce__device-grid">
          <v-card v-for="device in DEVICES" :key="device.key" flat border rounded="lg" class="cce__device-card">
            <div class="d-flex align-center ga-2 px-4 pt-3">
              <span class="text-body-2 font-weight-medium">{{ device.label }}</span>
              <span class="text-caption text-medium-emphasis">{{ device.caption }}</span>
            </div>
            <div class="cce__device-stage" :class="{ 'cce__device-stage--dark': device.dark }">
              <v-skeleton-loader v-if="generating" type="image" class="cce__device-skeleton" />
              <div v-else class="cce__device-frame" :style="{ width: `${device.viewport}px`, transform: `scale(${260 / device.viewport})` }">
                <CampaignEmailPreview :content-name="props.contentName" :dark="device.dark" />
              </div>
            </div>
          </v-card>
        </div>
      </div>
    </div>

    <template #footer>
      <v-btn variant="text" class="text-none" @click="model = false">Close</v-btn>
      <v-btn color="primary" class="text-none" @click="model = false">Done</v-btn>
    </template>
  </MpDialog>
</template>

<style scoped>
.cce { min-height: 100%; }
.cce__toolbar { min-height: var(--mp-component-toolbar-minHeight); gap: var(--mp-space-12); }
.cce__palette { width: 220px; flex-shrink: 0; padding-block: var(--mp-space-12); }
.cce__palette-title {
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
  padding-inline: var(--mp-space-16);
  margin-bottom: var(--mp-space-8);
}
.cce__block {
  min-height: var(--mp-component-listItem-minHeight);
  padding-inline: var(--mp-component-listItem-paddingInline);
  border: 1px dashed var(--border-default);
  border-radius: var(--mp-radius-8);
  cursor: grab;
  background: var(--surface-primary);
}
.cce__canvas {
  background: var(--surface-sunken);
  padding: var(--mp-space-32);
  overflow: auto;
}
.cce__devices { padding: var(--mp-space-24) var(--mp-space-32); overflow: auto; }
.cce__device-empty {
  min-height: var(--mp-component-state-minHeight);
  max-width: var(--mp-component-state-measure);
  margin-inline: auto;
}
.cce__device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--mp-space-20);
}
.cce__device-stage {
  margin: var(--mp-space-12);
  border-radius: var(--mp-radius-8);
  background: var(--surface-sunken);
  height: 340px;
  overflow: hidden;
  display: flex;
  justify-content: center;
}
.cce__device-stage--dark { background: var(--ink-panel-bg); }
.cce__device-skeleton { width: 100%; }
.cce__device-frame { transform-origin: top center; flex-shrink: 0; padding-top: var(--mp-space-12); }
</style>
