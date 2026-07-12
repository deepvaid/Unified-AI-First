<script setup lang="ts">
import type { LandingPageBlock, SocialNetwork } from '@/stores/useLandingPages'

const props = defineProps<{
  block: LandingPageBlock
}>()

defineEmits<{
  remove: [id: string]
}>()

const TITLE_SIZES = ['S', 'M', 'L', 'XL'] as const
const BUTTON_SIZES = ['S', 'M', 'L'] as const
const ASPECTS = ['16:9', '4:3', '1:1', 'auto'] as const
const NETWORKS: { value: SocialNetwork; icon: string }[] = [
  { value: 'facebook', icon: 'facebook' },
  { value: 'instagram', icon: 'instagram' },
  { value: 'twitter', icon: 'twitter' },
  { value: 'linkedin', icon: 'linkedin' },
  { value: 'youtube', icon: 'youtube' },
  { value: 'tiktok', icon: 'music-2' },
]
const ICON_CHOICES = ['star', 'heart', 'shield-check', 'award', 'thumbs-up', 'zap', 'check-circle', 'sparkles', 'flame', 'trophy']

function toggleNetwork(n: SocialNetwork) {
  const idx = props.block.networks.indexOf(n)
  if (idx === -1) props.block.networks.push(n)
  else props.block.networks.splice(idx, 1)
}
function toggleIcon(icon: string) {
  const idx = props.block.iconSet.indexOf(icon)
  if (idx === -1) props.block.iconSet.push(icon)
  else props.block.iconSet.splice(idx, 1)
}
function addListItem() { props.block.items.push('New item') }
function removeListItem(i: number) { props.block.items.splice(i, 1) }
function addLink() { props.block.links.push({ label: 'New link', url: '' }) }
function removeLink(i: number) { props.block.links.splice(i, 1) }
</script>

<template>
  <div>
    <div class="text-subtitle-2 font-weight-bold mb-4 text-capitalize">{{ block.type }} settings</div>

    <!-- title -->
    <template v-if="block.type === 'title'">
      <v-textarea v-model="block.text" label="Text" variant="outlined" density="comfortable" rounded="lg" auto-grow rows="2" class="mb-4" hide-details />
      <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mb-2">Size</div>
      <v-btn-toggle v-model="block.titleSize" mandatory density="comfortable" variant="outlined" divided class="mb-4 lbs-toggle-full">
        <v-btn v-for="s in TITLE_SIZES" :key="s" :value="s" size="small" class="text-none">{{ s }}</v-btn>
      </v-btn-toggle>
      <v-menu :close-on-content-click="false" location="start">
        <template #activator="{ props: menuProps }">
          <div class="d-flex align-center ga-2 mb-4">
            <button v-bind="menuProps" type="button" class="lbs-swatch" :style="{ background: block.colorOverride || 'transparent' }" aria-label="Text color override" />
            <span class="text-caption text-medium-emphasis">{{ block.colorOverride || 'Default color' }}</span>
            <v-btn v-if="block.colorOverride" size="x-small" variant="text" class="text-none" @click="block.colorOverride = ''">Reset</v-btn>
          </div>
        </template>
        <v-color-picker :model-value="block.colorOverride || '#1A1814'" mode="hex" :modes="['hex']" @update:model-value="v => (block.colorOverride = v)" />
      </v-menu>
    </template>

    <!-- paragraph / text -->
    <template v-else-if="block.type === 'paragraph' || block.type === 'text'">
      <v-textarea v-model="block.text" label="Text" variant="outlined" density="comfortable" rounded="lg" auto-grow rows="4" class="mb-4" hide-details />
      <v-switch v-model="block.muted" label="Muted (lower emphasis)" color="primary" density="comfortable" hide-details class="mb-2" />
    </template>

    <!-- button -->
    <template v-else-if="block.type === 'button'">
      <v-text-field v-model="block.label" label="Label" variant="outlined" density="comfortable" rounded="lg" class="mb-4" hide-details />
      <v-text-field v-model="block.url" label="Link URL" variant="outlined" density="comfortable" rounded="lg" class="mb-4" hide-details />
      <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mb-2">Style</div>
      <v-btn-toggle v-model="block.buttonStyle" mandatory density="comfortable" variant="outlined" divided class="mb-4 lbs-toggle-full">
        <v-btn value="filled" size="small" class="text-none">Filled</v-btn>
        <v-btn value="outline" size="small" class="text-none">Outline</v-btn>
      </v-btn-toggle>
      <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mb-2">Size</div>
      <v-btn-toggle v-model="block.buttonSize" mandatory density="comfortable" variant="outlined" divided class="mb-4 lbs-toggle-full">
        <v-btn v-for="s in BUTTON_SIZES" :key="s" :value="s" size="small" class="text-none">{{ s }}</v-btn>
      </v-btn-toggle>
      <v-switch v-model="block.fullWidth" label="Full width" color="primary" density="comfortable" hide-details class="mb-2" />
    </template>

    <!-- image / video -->
    <template v-else-if="block.type === 'image'">
      <v-text-field v-model="block.alt" label="Alt text" variant="outlined" density="comfortable" rounded="lg" class="mb-4" hide-details />
      <v-text-field v-model="block.caption" label="Caption (optional)" variant="outlined" density="comfortable" rounded="lg" class="mb-4" hide-details />
      <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mb-2">Aspect ratio</div>
      <v-btn-toggle v-model="block.aspect" mandatory density="comfortable" variant="outlined" divided class="mb-4 lbs-toggle-full">
        <v-btn v-for="a in ASPECTS" :key="a" :value="a" size="small" class="text-none">{{ a }}</v-btn>
      </v-btn-toggle>
      <v-switch v-model="block.rounded" label="Rounded corners" color="primary" density="comfortable" hide-details class="mb-2" />
    </template>
    <template v-else-if="block.type === 'video'">
      <v-text-field v-model="block.videoUrl" label="Video URL" placeholder="https://" variant="outlined" density="comfortable" rounded="lg" class="mb-4" hide-details />
      <v-text-field v-model="block.alt" label="Caption" variant="outlined" density="comfortable" rounded="lg" class="mb-4" hide-details />
      <v-switch v-model="block.autoplayLook" label="Autoplay look (hide play glyph)" color="primary" density="comfortable" hide-details class="mb-2" />
    </template>

    <!-- list -->
    <template v-else-if="block.type === 'list'">
      <div class="d-flex flex-column ga-2 mb-3">
        <div v-for="(_, i) in block.items" :key="i" class="d-flex align-center ga-1">
          <v-text-field v-model="block.items[i]" density="compact" variant="outlined" rounded="lg" hide-details class="flex-grow-1" />
          <v-btn icon="x" size="x-small" variant="text" aria-label="Remove item" @click="removeListItem(i)" />
        </div>
      </div>
      <v-btn variant="tonal" size="small" prepend-icon="plus" class="text-none mb-4" @click="addListItem">Add item</v-btn>
      <v-switch v-model="block.ordered" label="Ordered (numbered) list" color="primary" density="comfortable" hide-details class="mb-2" />
    </template>

    <!-- form -->
    <template v-else-if="block.type === 'form'">
      <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mb-2">Fields</div>
      <v-switch v-model="block.fieldName" label="Name field" color="primary" density="comfortable" hide-details class="mb-1" />
      <v-switch v-model="block.fieldPhone" label="Phone field" color="primary" density="comfortable" hide-details class="mb-3" />
      <v-text-field v-model="block.label" label="Submit button label" variant="outlined" density="comfortable" rounded="lg" class="mb-4" hide-details />
      <v-text-field v-model="block.successMessage" label="Success message" variant="outlined" density="comfortable" rounded="lg" hide-details />
    </template>

    <!-- social -->
    <template v-else-if="block.type === 'social'">
      <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mb-2">Networks</div>
      <div class="d-flex flex-wrap ga-2 mb-2">
        <button
          v-for="n in NETWORKS"
          :key="n.value"
          type="button"
          class="lbs-chip"
          :class="{ 'lbs-chip--active': block.networks.includes(n.value) }"
          @click="toggleNetwork(n.value)"
        >
          <v-icon size="15">{{ n.icon }}</v-icon>
          <span class="text-capitalize">{{ n.value }}</span>
        </button>
      </div>
    </template>

    <!-- icons -->
    <template v-else-if="block.type === 'icons'">
      <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mb-2">Icons</div>
      <div class="d-flex flex-wrap ga-2 mb-2">
        <button
          v-for="ic in ICON_CHOICES"
          :key="ic"
          type="button"
          class="lbs-icon-choice"
          :class="{ 'lbs-icon-choice--active': block.iconSet.includes(ic) }"
          :aria-label="ic"
          @click="toggleIcon(ic)"
        >
          <v-icon size="16">{{ ic }}</v-icon>
        </button>
      </div>
    </template>

    <!-- menu -->
    <template v-else-if="block.type === 'menu'">
      <div class="d-flex flex-column ga-2 mb-3">
        <div v-for="(link, i) in block.links" :key="i" class="lbs-link-row">
          <v-text-field v-model="link.label" placeholder="Label" density="compact" variant="outlined" rounded="lg" hide-details />
          <v-text-field v-model="link.url" placeholder="URL" density="compact" variant="outlined" rounded="lg" hide-details />
          <v-btn icon="x" size="x-small" variant="text" aria-label="Remove link" @click="removeLink(i)" />
        </div>
      </div>
      <v-btn variant="tonal" size="small" prepend-icon="plus" class="text-none mb-2" @click="addLink">Add link</v-btn>
    </template>

    <!-- html -->
    <template v-else-if="block.type === 'html'">
      <v-textarea v-model="block.code" label="HTML" variant="outlined" density="comfortable" rounded="lg" auto-grow rows="6" class="mb-2 lbs-mono" hide-details />
      <div class="lbs-note d-flex ga-2 pa-2">
        <v-icon size="15" class="mt-1 flex-shrink-0">info</v-icon>
        <span class="text-caption text-medium-emphasis">Rendered in a sandboxed preview — scripts and styles are isolated from the rest of the page.</span>
      </div>
    </template>

    <!-- spacer -->
    <template v-else-if="block.type === 'spacer'">
      <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mb-2">Height</div>
      <v-slider v-model="block.height" :min="8" :max="160" :step="4" thumb-label color="primary" class="mb-2" hide-details>
        <template #append><span class="text-caption text-medium-emphasis" style="width: 40px;">{{ block.height }}px</span></template>
      </v-slider>
    </template>

    <!-- divider -->
    <template v-else-if="block.type === 'divider'">
      <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mb-2">Style</div>
      <v-btn-toggle v-model="block.dividerStyle" mandatory density="comfortable" variant="outlined" divided class="mb-4 lbs-toggle-full">
        <v-btn value="solid" size="small" class="text-none">Solid</v-btn>
        <v-btn value="dashed" size="small" class="text-none">Dashed</v-btn>
      </v-btn-toggle>
      <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mb-2">Width</div>
      <v-slider v-model="block.dividerWidthPct" :min="10" :max="100" :step="5" thumb-label color="primary" hide-details>
        <template #append><span class="text-caption text-medium-emphasis" style="width: 36px;">{{ block.dividerWidthPct }}%</span></template>
      </v-slider>
    </template>

    <!-- shared alignment control -->
    <template v-if="['title', 'paragraph', 'text', 'button', 'social', 'icons', 'menu'].includes(block.type)">
      <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mb-2 mt-2">Alignment</div>
      <v-btn-toggle v-model="block.align" mandatory density="comfortable" variant="outlined" divided class="mb-4">
        <v-btn value="left" icon="align-left" size="small" aria-label="Align left" />
        <v-btn value="center" icon="align-center" size="small" aria-label="Align center" />
        <v-btn value="right" icon="align-right" size="small" aria-label="Align right" />
      </v-btn-toggle>
    </template>

    <v-btn variant="text" color="error" prepend-icon="trash-2" class="text-none mt-2" @click="$emit('remove', block.id)">Delete block</v-btn>
  </div>
</template>

<style scoped>
.lbs-toggle-full { width: 100%; }
.lbs-toggle-full :deep(.v-btn) { flex: 1; }
.lbs-swatch {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.18);
  cursor: pointer;
  flex-shrink: 0;
}
.lbs-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 100ms ease, color 100ms ease, background 100ms ease;
}
.lbs-chip--active {
  border-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.08);
}
.lbs-icon-choice {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface-variant));
  cursor: pointer;
  transition: border-color 100ms ease, color 100ms ease, background 100ms ease;
}
.lbs-icon-choice--active {
  border-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.08);
}
.lbs-link-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 4px;
  align-items: center;
}
.lbs-note {
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 8px;
}
:deep(.lbs-mono textarea) {
  font-family: monospace;
  font-size: 0.82rem;
}
</style>
