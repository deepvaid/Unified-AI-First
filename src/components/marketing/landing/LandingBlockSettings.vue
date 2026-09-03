<script setup lang="ts">
import MpAlert from '@/components/MpAlert.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import { mp_color_light_textPrimary } from '@/design-tokens/generated/tokens'
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
const TITLE_SIZE_ITEMS = TITLE_SIZES.map(s => ({ value: s, label: s }))
const BUTTON_SIZE_ITEMS = BUTTON_SIZES.map(s => ({ value: s, label: s }))
const ASPECT_ITEMS = ASPECTS.map(a => ({ value: a, label: a }))
const BUTTON_STYLE_ITEMS = [
  { value: 'filled', label: 'Filled' },
  { value: 'outline', label: 'Outline' },
]
const DIVIDER_STYLE_ITEMS = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
]
const ALIGN_ITEMS = [
  { value: 'left', label: 'Align left', icon: 'align-left', tooltip: 'Align left' },
  { value: 'center', label: 'Align center', icon: 'align-center', tooltip: 'Align center' },
  { value: 'right', label: 'Align right', icon: 'align-right', tooltip: 'Align right' },
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
  <MpFormGrid>
    <MpFormSection :title="`${block.type} settings`" />

    <!-- title -->
    <template v-if="block.type === 'title'">
      <v-textarea v-model="block.text" label="Text" auto-grow rows="3" />
      <MpFormField label="Size">
        <MpSegmentedControl :model-value="block.titleSize" :items="TITLE_SIZE_ITEMS" size="sm" ariaLabel="Title size" @update:model-value="v => block.titleSize = v as typeof block.titleSize" />
      </MpFormField>
      <MpFormField label="Text color">
        <v-menu :close-on-content-click="false" location="start">
          <template #activator="{ props: menuProps }">
            <div class="d-flex align-center ga-2">
              <button v-bind="menuProps" type="button" class="lbs-swatch" :style="{ background: block.colorOverride || 'transparent' }" aria-label="Text color override" />
              <span class="text-caption text-medium-emphasis">{{ block.colorOverride || 'Default color' }}</span>
              <v-btn v-if="block.colorOverride" size="x-small" variant="text" class="text-none" @click="block.colorOverride = ''">Reset</v-btn>
            </div>
          </template>
          <v-color-picker :model-value="block.colorOverride || mp_color_light_textPrimary" mode="hex" :modes="['hex']" @update:model-value="v => (block.colorOverride = v)" />
        </v-menu>
      </MpFormField>
    </template>

    <!-- paragraph / text -->
    <template v-else-if="block.type === 'paragraph' || block.type === 'text'">
      <v-textarea v-model="block.text" label="Text" auto-grow rows="5" />
      <v-switch v-model="block.muted" label="Muted (lower emphasis)" />
    </template>

    <!-- button -->
    <template v-else-if="block.type === 'button'">
      <v-text-field v-model="block.label" label="Label" />
      <v-text-field v-model="block.url" label="Link URL" placeholder="https://" />
      <MpFormField label="Style">
        <MpSegmentedControl :model-value="block.buttonStyle" :items="BUTTON_STYLE_ITEMS" size="sm" ariaLabel="Button style" @update:model-value="v => block.buttonStyle = v as typeof block.buttonStyle" />
      </MpFormField>
      <MpFormField label="Size">
        <MpSegmentedControl :model-value="block.buttonSize" :items="BUTTON_SIZE_ITEMS" size="sm" ariaLabel="Button size" @update:model-value="v => block.buttonSize = v as typeof block.buttonSize" />
      </MpFormField>
      <v-switch v-model="block.fullWidth" label="Full width" />
    </template>

    <!-- image / video -->
    <template v-else-if="block.type === 'image'">
      <v-text-field v-model="block.alt" label="Alt text" />
      <v-text-field v-model="block.caption" label="Caption" hint="Optional — shown under the image." />
      <MpFormField label="Aspect ratio">
        <MpSegmentedControl :model-value="block.aspect" :items="ASPECT_ITEMS" size="sm" ariaLabel="Aspect ratio" @update:model-value="v => block.aspect = v as typeof block.aspect" />
      </MpFormField>
      <v-switch v-model="block.rounded" label="Rounded corners" />
    </template>
    <template v-else-if="block.type === 'video'">
      <v-text-field v-model="block.videoUrl" label="Video URL" placeholder="https://" />
      <v-text-field v-model="block.alt" label="Caption" />
      <v-switch v-model="block.autoplayLook" label="Autoplay look (hide play glyph)" />
    </template>

    <!-- list -->
    <template v-else-if="block.type === 'list'">
      <div v-for="(_, i) in block.items" :key="i" class="mp-form-grid__trailing">
        <v-text-field v-model="block.items[i]" :label="`Item ${i + 1}`" />
        <v-btn icon="x" size="x-small" variant="text" aria-label="Remove item" @click="removeListItem(i)" />
      </div>
      <div>
        <v-btn variant="tonal" size="small" prepend-icon="plus" class="text-none" @click="addListItem">Add item</v-btn>
      </div>
      <v-switch v-model="block.ordered" label="Ordered (numbered) list" />
    </template>

    <!-- form -->
    <template v-else-if="block.type === 'form'">
      <MpFormField label="Fields" hint="Email is always collected.">
        <v-switch v-model="block.fieldName" label="Name field" />
        <v-switch v-model="block.fieldPhone" label="Phone field" />
      </MpFormField>
      <v-text-field v-model="block.label" label="Submit button label" />
      <v-text-field v-model="block.successMessage" label="Success message" />
    </template>

    <!-- social -->
    <template v-else-if="block.type === 'social'">
      <MpFormField label="Networks">
        <div class="d-flex flex-wrap ga-2">
          <button
            v-for="n in NETWORKS"
            :key="n.value"
            type="button"
            class="lbs-chip"
            :class="{ 'lbs-chip--active': block.networks.includes(n.value) }"
            :aria-pressed="block.networks.includes(n.value)"
            @click="toggleNetwork(n.value)"
          >
            <v-icon size="15">{{ n.icon }}</v-icon>
            <span class="text-capitalize">{{ n.value }}</span>
          </button>
        </div>
      </MpFormField>
    </template>

    <!-- icons -->
    <template v-else-if="block.type === 'icons'">
      <MpFormField label="Icons">
        <div class="d-flex flex-wrap ga-2">
          <button
            v-for="ic in ICON_CHOICES"
            :key="ic"
            type="button"
            class="lbs-icon-choice"
            :class="{ 'lbs-icon-choice--active': block.iconSet.includes(ic) }"
            :aria-label="ic"
            :aria-pressed="block.iconSet.includes(ic)"
            @click="toggleIcon(ic)"
          >
            <v-icon size="16">{{ ic }}</v-icon>
          </button>
        </div>
      </MpFormField>
    </template>

    <!-- menu -->
    <template v-else-if="block.type === 'menu'">
      <div v-for="(link, i) in block.links" :key="i" class="mp-form-grid__trailing">
        <MpFormGrid :cols="2">
          <v-text-field v-model="link.label" :label="`Link ${i + 1} label`" />
          <v-text-field v-model="link.url" :label="`Link ${i + 1} URL`" placeholder="https://" />
        </MpFormGrid>
        <v-btn icon="x" size="x-small" variant="text" aria-label="Remove link" @click="removeLink(i)" />
      </div>
      <div>
        <v-btn variant="tonal" size="small" prepend-icon="plus" class="text-none" @click="addLink">Add link</v-btn>
      </div>
    </template>

    <!-- html -->
    <template v-else-if="block.type === 'html'">
      <v-textarea v-model="block.code" label="HTML" auto-grow rows="5" class="lbs-mono" />
      <MpAlert tone="info" live="off">
        Rendered in a sandboxed preview — scripts and styles are isolated from the rest of the page.
      </MpAlert>
    </template>

    <!-- spacer -->
    <template v-else-if="block.type === 'spacer'">
      <MpFormField label="Height">
        <template #default="{ labelId }">
          <v-slider v-model="block.height" :min="8" :max="160" :step="4" thumb-label :aria-labelledby="labelId">
            <template #append><span class="text-caption text-medium-emphasis lbs-slider-value">{{ block.height }}px</span></template>
          </v-slider>
        </template>
      </MpFormField>
    </template>

    <!-- divider -->
    <template v-else-if="block.type === 'divider'">
      <MpFormField label="Style">
        <MpSegmentedControl :model-value="block.dividerStyle" :items="DIVIDER_STYLE_ITEMS" size="sm" ariaLabel="Divider style" @update:model-value="v => block.dividerStyle = v as typeof block.dividerStyle" />
      </MpFormField>
      <MpFormField label="Width">
        <template #default="{ labelId }">
          <v-slider v-model="block.dividerWidthPct" :min="10" :max="100" :step="5" thumb-label :aria-labelledby="labelId">
            <template #append><span class="text-caption text-medium-emphasis lbs-slider-value">{{ block.dividerWidthPct }}%</span></template>
          </v-slider>
        </template>
      </MpFormField>
    </template>

    <!-- shared alignment control -->
    <MpFormField
      v-if="['title', 'paragraph', 'text', 'button', 'social', 'icons', 'menu'].includes(block.type)"
      label="Alignment"
    >
      <MpSegmentedControl :model-value="block.align" :items="ALIGN_ITEMS" size="sm" ariaLabel="Alignment" @update:model-value="v => block.align = v as typeof block.align" />
    </MpFormField>

    <div>
      <v-btn variant="text" color="error" prepend-icon="trash-2" class="text-none" @click="$emit('remove', block.id)">Delete block</v-btn>
    </div>
  </MpFormGrid>
</template>

<style scoped>
.lbs-swatch {
  width: var(--mp-component-field-height-sm);
  height: var(--mp-component-field-height-sm);
  border-radius: var(--mp-component-chip-radius);
  border: 1px solid var(--border-default);
  cursor: pointer;
  flex-shrink: 0;
}
.lbs-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: var(--mp-radius-full);
  border: 1px solid var(--border-default);
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-semibold);
  cursor: pointer;
  transition: border-color 100ms ease, color 100ms ease, background 100ms ease;
}
.lbs-chip--active {
  border-color: rgb(var(--v-theme-primary));
  color: var(--accent-on-container);
  background: var(--accent-soft);
}
.lbs-chip:focus-visible,
.lbs-icon-choice:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
.lbs-icon-choice {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--mp-component-chip-radius);
  border: 1px solid var(--border-default);
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface-variant));
  cursor: pointer;
  transition: border-color 100ms ease, color 100ms ease, background 100ms ease;
}
.lbs-icon-choice--active {
  border-color: rgb(var(--v-theme-primary));
  color: var(--accent-on-container);
  background: var(--accent-soft);
}
.lbs-slider-value {
  display: inline-block;
  inline-size: var(--mp-space-40);
  text-align: end;
}
:deep(.lbs-mono textarea) {
  font-family: monospace;
  font-size: 0.82rem;
}
</style>
