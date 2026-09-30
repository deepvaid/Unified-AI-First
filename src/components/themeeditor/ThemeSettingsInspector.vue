<script setup lang="ts">
import { computed, ref } from 'vue'
import MpFormField from '@/components/MpFormField.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import ThemeFieldControl from './ThemeFieldControl.vue'
import ThemeSchemeCard from './ThemeSchemeCard.vue'
import {
  THEME_FONTS,
  type ThemeColorScheme,
  type ThemeEditorSettings,
  type ThemeSettingsItemId,
  type ThemeTypeScheme,
} from '@/stores/themeEditorData'

// The inspector body for a Theme Settings page (store builder re-skin). Logo, Social Media,
// Buttons, Product Card and Furniture surfaces are plain forms; Theme Colors and Typography are
// the UAT scheme lists — the default scheme, "New scheme", then "Current themes" — with an inline
// form for the scheme being edited. Edits go through `change` so the store stays the owner.

const props = defineProps<{
  item: ThemeSettingsItemId
  settings: ThemeEditorSettings
}>()

const emit = defineEmits<{
  change: [mutate: (settings: ThemeEditorSettings) => void]
}>()

function change(mutate: (settings: ThemeEditorSettings) => void) {
  emit('change', mutate)
}

// ── Colour schemes ────────────────────────────────────────────────────────────
const editingColor = ref<string | null>(null)
const defaultColor = computed(() => props.settings.colorSchemes.find((scheme) => scheme.id === props.settings.defaultColorScheme))
const otherColors = computed(() => props.settings.colorSchemes.filter((scheme) => scheme.id !== props.settings.defaultColorScheme))
const editingColorScheme = computed(() => props.settings.colorSchemes.find((scheme) => scheme.id === editingColor.value))

const COLOR_KEYS: Array<{ key: keyof Omit<ThemeColorScheme, 'id' | 'name'>; label: string }> = [
  { key: 'background', label: 'Background' },
  { key: 'text', label: 'Text' },
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
]

function addColorScheme() {
  change((settings) => {
    const base = defaultColor.value ?? settings.colorSchemes[0]
    const id = `scheme-${Date.now().toString(36)}`
    settings.colorSchemes.push({ ...(base ?? { background: '#FFFFFF', text: '#1F2937', primary: '#5B5FC7', secondary: '#EEF0FB' }), id, name: `Scheme ${settings.colorSchemes.length + 1}` })
    editingColor.value = id
  })
}

function removeColorScheme(id: string) {
  change((settings) => {
    settings.colorSchemes = settings.colorSchemes.filter((scheme) => scheme.id !== id)
  })
  if (editingColor.value === id) editingColor.value = null
}

function patchColor(id: string, patch: Partial<ThemeColorScheme>) {
  change((settings) => {
    const scheme = settings.colorSchemes.find((entry) => entry.id === id)
    if (scheme) Object.assign(scheme, patch)
  })
}

// ── Type schemes ──────────────────────────────────────────────────────────────
const editingType = ref<string | null>(null)
const defaultType = computed(() => props.settings.typography.find((scheme) => scheme.id === props.settings.defaultTypography))
const otherTypes = computed(() => props.settings.typography.filter((scheme) => scheme.id !== props.settings.defaultTypography))
const editingTypeScheme = computed(() => props.settings.typography.find((scheme) => scheme.id === editingType.value))

function addTypeScheme() {
  change((settings) => {
    const base = defaultType.value ?? settings.typography[0]
    const id = `type-${Date.now().toString(36)}`
    settings.typography.push({ ...(base ?? { headingFont: 'Inter', bodyFont: 'Inter', baseSize: 16 }), id, name: `Scheme ${settings.typography.length + 1}` })
    editingType.value = id
  })
}

function removeTypeScheme(id: string) {
  change((settings) => {
    settings.typography = settings.typography.filter((scheme) => scheme.id !== id)
  })
  if (editingType.value === id) editingType.value = null
}

function patchType(id: string, patch: Partial<ThemeTypeScheme>) {
  change((settings) => {
    const scheme = settings.typography.find((entry) => entry.id === id)
    if (scheme) Object.assign(scheme, patch)
  })
}
</script>

<template>
  <!-- ── Logo ─────────────────────────────────────────────────────────────── -->
  <template v-if="item === 'logo'">
    <ThemeFieldControl
      :field="{ key: 'image', label: 'Image', type: 'image' }"
      :model-value="settings.logo.image"
      @update:model-value="change((s) => { s.logo.image = String($event) })"
    />
    <MpFormGrid>
      <v-text-field label="Logo link" :model-value="settings.logo.link" prepend-inner-icon="link" @update:model-value="change((s) => { s.logo.link = $event })" />
      <v-text-field label="Store name" :model-value="settings.logo.storeName" @update:model-value="change((s) => { s.logo.storeName = $event })" />
      <v-textarea label="Store description" :model-value="settings.logo.description" rows="3" auto-grow @update:model-value="change((s) => { s.logo.description = $event })" />
      <v-text-field label="Language code" :model-value="settings.logo.languageCode" @update:model-value="change((s) => { s.logo.languageCode = $event })" />
    </MpFormGrid>
  </template>

  <!-- ── Social media ─────────────────────────────────────────────────────── -->
  <MpFormGrid v-else-if="item === 'social-media'">
    <v-text-field label="Facebook" :model-value="settings.socialMedia.facebook" prepend-inner-icon="link" placeholder="https://facebook.com/…" @update:model-value="change((s) => { s.socialMedia.facebook = $event })" />
    <v-text-field label="Instagram" :model-value="settings.socialMedia.instagram" prepend-inner-icon="link" placeholder="https://instagram.com/…" @update:model-value="change((s) => { s.socialMedia.instagram = $event })" />
    <v-text-field label="X" :model-value="settings.socialMedia.x" prepend-inner-icon="link" placeholder="https://x.com/…" @update:model-value="change((s) => { s.socialMedia.x = $event })" />
    <v-text-field label="YouTube" :model-value="settings.socialMedia.youtube" prepend-inner-icon="link" placeholder="https://youtube.com/@…" @update:model-value="change((s) => { s.socialMedia.youtube = $event })" />
    <v-text-field label="TikTok" :model-value="settings.socialMedia.tiktok" prepend-inner-icon="link" placeholder="https://tiktok.com/@…" @update:model-value="change((s) => { s.socialMedia.tiktok = $event })" />
  </MpFormGrid>

  <!-- ── Theme colours ────────────────────────────────────────────────────── -->
  <template v-else-if="item === 'theme-colors'">
    <ThemeSchemeCard v-if="defaultColor" :name="defaultColor.name" is-default @edit="editingColor = defaultColor.id">
      <div class="te-swatch" :style="{ background: defaultColor.background, color: defaultColor.text }">
        <span class="te-swatch__sample">Aa</span>
        <span class="te-swatch__pills">
          <span class="te-swatch__pill" :style="{ background: defaultColor.primary, color: defaultColor.background }">Aa</span>
          <span class="te-swatch__pill" :style="{ background: defaultColor.secondary, color: defaultColor.text }">Aa</span>
        </span>
      </div>
    </ThemeSchemeCard>

    <v-btn variant="outlined" block prepend-icon="plus" class="text-none" @click="addColorScheme">New scheme</v-btn>

    <MpFormSection v-if="otherColors.length" title="Current themes">
      <ThemeSchemeCard
        v-for="scheme in otherColors"
        :key="scheme.id"
        :name="scheme.name"
        @edit="editingColor = scheme.id"
        @remove="removeColorScheme(scheme.id)"
      >
        <div class="te-swatch" :style="{ background: scheme.background, color: scheme.text }">
          <span class="te-swatch__sample">Aa</span>
          <span class="te-swatch__pills">
            <span class="te-swatch__pill" :style="{ background: scheme.primary, color: scheme.background }">Aa</span>
            <span class="te-swatch__pill" :style="{ background: scheme.secondary, color: scheme.text }">Aa</span>
          </span>
        </div>
      </ThemeSchemeCard>
    </MpFormSection>

    <MpFormSection v-if="editingColorScheme" :title="`Edit ${editingColorScheme.name}`">
      <MpFormGrid>
        <v-text-field label="Scheme name" :model-value="editingColorScheme.name" @update:model-value="patchColor(editingColorScheme!.id, { name: $event })" />
        <v-text-field
          v-for="entry in COLOR_KEYS"
          :key="entry.key"
          :label="entry.label"
          :model-value="editingColorScheme[entry.key]"
          class="mp-field-mono"
          @update:model-value="patchColor(editingColorScheme!.id, { [entry.key]: $event })"
        >
          <template #prepend-inner>
            <span class="te-color-dot" :style="{ background: editingColorScheme[entry.key] }" aria-hidden="true" />
          </template>
        </v-text-field>
        <v-switch
          label="Use as default scheme"
          :model-value="settings.defaultColorScheme === editingColorScheme.id"
          inset
          @update:model-value="change((s) => { if ($event) s.defaultColorScheme = editingColorScheme!.id })"
        />
      </MpFormGrid>
      <div class="d-flex justify-end">
        <v-btn variant="text" class="text-none" @click="editingColor = null">Done</v-btn>
      </div>
    </MpFormSection>
  </template>

  <!-- ── Buttons ──────────────────────────────────────────────────────────── -->
  <template v-else-if="item === 'buttons'">
    <ThemeFieldControl
      :field="{ key: 'radius', label: 'Corner radius', type: 'slider', min: 0, max: 24, step: 2 }"
      :model-value="settings.buttons.radius"
      @update:model-value="change((s) => { s.buttons.radius = Number($event) })"
    />
    <v-select label="Style" :model-value="settings.buttons.style" :items="['Solid', 'Outline']" @update:model-value="change((s) => { s.buttons.style = $event })" />
    <v-switch label="Uppercase labels" :model-value="settings.buttons.uppercase" inset @update:model-value="change((s) => { s.buttons.uppercase = $event === true })" />
    <MpFormField label="Preview">
      <div class="d-flex ga-2">
        <v-btn :variant="settings.buttons.style === 'Outline' ? 'outlined' : 'flat'" color="primary" :style="{ borderRadius: `${settings.buttons.radius}px`, textTransform: settings.buttons.uppercase ? 'uppercase' : 'none' }">Primary</v-btn>
        <v-btn variant="outlined" :style="{ borderRadius: `${settings.buttons.radius}px`, textTransform: settings.buttons.uppercase ? 'uppercase' : 'none' }">Secondary</v-btn>
      </div>
    </MpFormField>
  </template>

  <!-- ── Product card ─────────────────────────────────────────────────────── -->
  <template v-else-if="item === 'product-card'">
    <v-select label="Image ratio" :model-value="settings.productCard.imageRatio" :items="['Square', 'Portrait', 'Landscape']" @update:model-value="change((s) => { s.productCard.imageRatio = $event })" />
    <v-switch label="Show vendor" :model-value="settings.productCard.showVendor" inset @update:model-value="change((s) => { s.productCard.showVendor = $event === true })" />
    <v-switch label="Show rating" :model-value="settings.productCard.showRating" inset @update:model-value="change((s) => { s.productCard.showRating = $event === true })" />
    <v-switch label="Quick add to cart" :model-value="settings.productCard.quickAdd" inset @update:model-value="change((s) => { s.productCard.quickAdd = $event === true })" />
  </template>

  <!-- ── Typography ───────────────────────────────────────────────────────── -->
  <template v-else-if="item === 'typography'">
    <ThemeSchemeCard v-if="defaultType" :name="defaultType.name" is-default @edit="editingType = defaultType.id">
      <div class="te-type">
        <span class="te-type__sample" :style="{ fontFamily: defaultType.headingFont }">Aa</span>
        <span class="te-type__body" :style="{ fontFamily: defaultType.bodyFont }">Body Text</span>
        <span class="te-type__meta">Base font size {{ defaultType.baseSize }}px</span>
      </div>
    </ThemeSchemeCard>

    <v-btn variant="outlined" block prepend-icon="plus" class="text-none" @click="addTypeScheme">New scheme</v-btn>

    <MpFormSection v-if="otherTypes.length" title="Current themes">
      <ThemeSchemeCard
        v-for="scheme in otherTypes"
        :key="scheme.id"
        :name="scheme.name"
        @edit="editingType = scheme.id"
        @remove="removeTypeScheme(scheme.id)"
      >
        <div class="te-type">
          <span class="te-type__sample" :style="{ fontFamily: scheme.headingFont }">Aa</span>
          <span class="te-type__body" :style="{ fontFamily: scheme.bodyFont }">Body Text</span>
          <span class="te-type__meta">Base font size {{ scheme.baseSize }}px</span>
        </div>
      </ThemeSchemeCard>
    </MpFormSection>

    <MpFormSection v-if="editingTypeScheme" :title="`Edit ${editingTypeScheme.name}`">
      <MpFormGrid>
        <v-text-field label="Scheme name" :model-value="editingTypeScheme.name" @update:model-value="patchType(editingTypeScheme!.id, { name: $event })" />
        <v-select label="Heading font" :model-value="editingTypeScheme.headingFont" :items="THEME_FONTS" @update:model-value="patchType(editingTypeScheme!.id, { headingFont: $event })" />
        <v-select label="Body font" :model-value="editingTypeScheme.bodyFont" :items="THEME_FONTS" @update:model-value="patchType(editingTypeScheme!.id, { bodyFont: $event })" />
        <ThemeFieldControl
          :field="{ key: 'baseSize', label: 'Base font size', type: 'slider', min: 12, max: 20, step: 1 }"
          :model-value="editingTypeScheme.baseSize"
          @update:model-value="patchType(editingTypeScheme!.id, { baseSize: Number($event) })"
        />
        <v-switch
          label="Use as default scheme"
          :model-value="settings.defaultTypography === editingTypeScheme.id"
          inset
          @update:model-value="change((s) => { if ($event) s.defaultTypography = editingTypeScheme!.id })"
        />
      </MpFormGrid>
      <div class="d-flex justify-end">
        <v-btn variant="text" class="text-none" @click="editingType = null">Done</v-btn>
      </div>
    </MpFormSection>
  </template>

  <!-- ── Furniture surfaces ───────────────────────────────────────────────── -->
  <MpFormGrid v-else-if="item === 'furniture-surfaces'">
    <v-select label="Wood tone" :model-value="settings.furnitureSurfaces.wood" :items="['Walnut', 'Oak', 'Ash', 'Ebony']" @update:model-value="change((s) => { s.furnitureSurfaces.wood = $event })" />
    <v-select label="Fabric tone" :model-value="settings.furnitureSurfaces.fabric" :items="['Linen', 'Velvet', 'Wool', 'Leather']" @update:model-value="change((s) => { s.furnitureSurfaces.fabric = $event })" />
    <v-select label="Metal tone" :model-value="settings.furnitureSurfaces.metal" :items="['Brushed brass', 'Matte black', 'Chrome', 'Copper']" @update:model-value="change((s) => { s.furnitureSurfaces.metal = $event })" />
  </MpFormGrid>
</template>

<style scoped>
/* Scheme swatches — the merchant's colours, so the fills are data, not tokens (P4-8 boundary). */
.te-swatch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mp-space-8);
  padding: var(--mp-space-12);
  border-radius: var(--mp-component-chip-radius);
}

.te-swatch__sample {
  font-size: var(--mp-fontSize-24);
  font-weight: var(--mp-fontWeight-bold);
  line-height: 1;
}

.te-swatch__pills {
  display: flex;
  gap: var(--mp-space-8);
}

.te-swatch__pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--mp-space-48);
  padding: var(--mp-space-2) var(--mp-space-12);
  border-radius: var(--r-pill);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-medium);
}

.te-color-dot {
  display: inline-block;
  width: var(--mp-space-16);
  height: var(--mp-space-16);
  border-radius: var(--r-pill);
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}

.te-type {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mp-space-4);
  padding-block: var(--mp-space-4);
}

.te-type__sample {
  font-size: var(--mp-fontSize-28);
  font-weight: var(--mp-fontWeight-bold);
  line-height: 1;
}

.te-type__body {
  font-size: var(--mp-fontSize-14);
}

.te-type__meta {
  font-size: var(--mp-fontSize-12);
  color: var(--text-muted);
}
</style>
