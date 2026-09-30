<script setup lang="ts">
import { computed, ref } from 'vue'
import MpFormField from '@/components/MpFormField.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import type { ThemeEditorField, ThemeEditorValue } from '@/stores/themeEditorData'

// One inspector field (store builder re-skin), rendered from a field definition. Vuetify inputs
// carry their own static top label; composite controls (slider + number, image picker, alignment
// toggle, rich text) sit inside MpFormField for the identical label and aria wiring.

const props = defineProps<{
  field: ThemeEditorField
  modelValue: ThemeEditorValue | undefined
}>()

const emit = defineEmits<{ 'update:modelValue': [value: ThemeEditorValue] }>()

const text = computed(() => (typeof props.modelValue === 'string' ? props.modelValue : props.modelValue === undefined ? '' : String(props.modelValue)))
const number = computed(() => (typeof props.modelValue === 'number' ? props.modelValue : Number(props.modelValue ?? props.field.min ?? 0) || 0))

function onNumberInput(value: string | number) {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value)
  if (Number.isNaN(parsed)) return
  const min = props.field.min ?? Number.NEGATIVE_INFINITY
  const max = props.field.max ?? Number.POSITIVE_INFINITY
  emit('update:modelValue', Math.min(max, Math.max(min, parsed)))
}

// ── Image picker ──────────────────────────────────────────────────────────────
const SAMPLE_IMAGES = ['images/banner-1.webp', 'images/banner2.webp', 'images/car-image-1.webp', 'images/auth-side.png']
const FOCAL_POINTS = ['Top left', 'Top', 'Top right', 'Left', 'Center', 'Right', 'Bottom left', 'Bottom', 'Bottom right']
const focalPoint = ref('Center')

function pickImage() {
  const current = SAMPLE_IMAGES.indexOf(text.value)
  emit('update:modelValue', SAMPLE_IMAGES[(current + 1) % SAMPLE_IMAGES.length] ?? SAMPLE_IMAGES[0]!)
}

const imageLabel = computed(() => text.value.replace(/^images\//, ''))

// ── Rich text ─────────────────────────────────────────────────────────────────
const richText = ref<HTMLDivElement | null>(null)
const BLOCKS = ['H1', 'H2', 'H3', 'P']
const blockTag = ref('H1')

function exec(command: string, value?: string) {
  richText.value?.focus()
  document.execCommand(command, false, value)
  if (richText.value) emit('update:modelValue', richText.value.innerHTML)
}

function onRichInput() {
  if (richText.value) emit('update:modelValue', richText.value.innerHTML)
}

const ALIGN_ITEMS = [
  { value: 'left', label: 'Align left', icon: 'align-left', tooltip: 'Left' },
  { value: 'center', label: 'Align center', icon: 'align-center', tooltip: 'Center' },
  { value: 'right', label: 'Align right', icon: 'align-right', tooltip: 'Right' },
]
</script>

<template>
  <!-- Plain Vuetify inputs own their label; never wrap them in MpFormField. -->
  <v-text-field
    v-if="field.type === 'text' || field.type === 'link'"
    :label="field.label"
    :model-value="text"
    :hint="field.hint"
    :prepend-inner-icon="field.type === 'link' ? 'link' : undefined"
    @update:model-value="emit('update:modelValue', $event)"
  />

  <v-textarea
    v-else-if="field.type === 'textarea'"
    :label="field.label"
    :model-value="text"
    :hint="field.hint"
    rows="3"
    auto-grow
    @update:model-value="emit('update:modelValue', $event)"
  />

  <v-select
    v-else-if="field.type === 'select'"
    :label="field.label"
    :model-value="text"
    :items="field.options ?? []"
    :hint="field.hint"
    @update:model-value="emit('update:modelValue', $event)"
  />

  <v-switch
    v-else-if="field.type === 'toggle'"
    :label="field.label"
    :model-value="modelValue === true"
    inset
    @update:model-value="emit('update:modelValue', $event === true)"
  />

  <!-- Composite controls — MpFormField supplies the label and the group's aria. -->
  <MpFormField v-else-if="field.type === 'slider'" :label="field.label" :hint="field.hint">
    <template #default="{ labelId }">
      <div class="te-field__slider">
        <!-- hide-details: the group's hint (if any) is MpFormField's, not the slider's. -->
        <v-slider
          :model-value="number"
          :min="field.min ?? 0"
          :max="field.max ?? 100"
          :step="field.step ?? 1"
          :aria-labelledby="labelId"
          hide-details
          @update:model-value="emit('update:modelValue', $event)"
        />
        <v-text-field
          :model-value="number"
          type="number"
          :min="field.min"
          :max="field.max"
          :step="field.step ?? 1"
          :aria-labelledby="labelId"
          density="compact"
          hide-details
          class="te-field__number"
          @update:model-value="onNumberInput"
        />
      </div>
    </template>
  </MpFormField>

  <MpFormField v-else-if="field.type === 'image'" :label="field.label" :hint="field.hint">
    <div class="te-field__image">
      <div class="te-field__preview" :class="{ 'te-field__preview--empty': !text }" role="img" :aria-label="text ? `Preview of ${imageLabel}` : 'No image selected'">
        <span v-if="text" class="te-field__preview-name">{{ imageLabel }}</span>
        <v-chip v-if="text" size="x-small" variant="flat" class="te-field__clear" @click="emit('update:modelValue', '')">Clear</v-chip>
      </div>
      <v-btn variant="outlined" block class="text-none" prepend-icon="image" @click="pickImage">{{ text ? 'Change image' : 'Image' }}</v-btn>
      <v-menu location="bottom">
        <template #activator="{ props: menu }">
          <v-btn v-bind="menu" variant="outlined" block class="text-none" prepend-icon="crosshair" append-icon="chevron-down" aria-haspopup="menu">
            Focal point · {{ focalPoint }}
          </v-btn>
        </template>
        <v-list density="compact" role="menu" aria-label="Focal point">
          <v-list-item
            v-for="point in FOCAL_POINTS"
            :key="point"
            role="menuitemradio"
            :aria-checked="focalPoint === point"
            :title="point"
            :active="focalPoint === point"
            @click="focalPoint = point"
          />
        </v-list>
      </v-menu>
    </div>
  </MpFormField>

  <MpFormField v-else-if="field.type === 'align'" :label="field.label" :hint="field.hint">
    <MpSegmentedControl
      :model-value="text || 'left'"
      :items="ALIGN_ITEMS"
      size="sm"
      :ariaLabel="field.label"
      @update:model-value="emit('update:modelValue', $event ?? 'left')"
    />
  </MpFormField>

  <MpFormField v-else-if="field.type === 'richtext'" :label="field.label" :hint="field.hint">
    <template #default="{ labelId }">
      <div class="te-rte">
        <div class="te-rte__toolbar" role="toolbar" :aria-label="`${field.label} formatting`">
          <v-select
            v-model="blockTag"
            :items="BLOCKS"
            aria-label="Block style"
            density="compact"
            hide-details
            class="te-rte__block"
            @update:model-value="exec('formatBlock', $event)"
          />
          <v-divider vertical class="mx-1" />
          <v-btn icon="bold" variant="text" size="x-small" aria-label="Bold" @click="exec('bold')" />
          <v-btn icon="italic" variant="text" size="x-small" aria-label="Italic" @click="exec('italic')" />
          <v-btn icon="underline" variant="text" size="x-small" aria-label="Underline" @click="exec('underline')" />
          <v-divider vertical class="mx-1" />
          <v-btn icon="code-xml" variant="text" size="x-small" aria-label="Inline code" @click="exec('formatBlock', 'PRE')" />
        </div>
        <div
          ref="richText"
          class="te-rte__body"
          contenteditable="true"
          role="textbox"
          aria-multiline="true"
          :aria-labelledby="labelId"
          v-html="text"
          @input="onRichInput"
        />
      </div>
    </template>
  </MpFormField>
</template>

<style scoped>
.te-field__slider {
  display: flex;
  align-items: center;
  gap: var(--mp-space-12);
}

.te-field__slider :deep(.v-slider) {
  flex: 1 1 auto;
}

.te-field__number {
  flex: 0 0 auto;
  width: calc(var(--mp-component-control-height) * 2);
}

.te-field__image {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
}

/* Image preview tile — a placeholder swatch stands in for the asset (no real files here). */
.te-field__preview {
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: calc(var(--mp-space-40) * 2);
  padding: var(--mp-space-8);
  border-radius: var(--mp-component-input-radius);
  background: linear-gradient(135deg, var(--accent-container), var(--accent-default));
  color: var(--accent-on-container);
}

.te-field__preview--empty {
  background: var(--surface-secondary);
  border: 1px dashed var(--border-default);
  color: var(--text-muted);
}

.te-field__preview-name {
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-medium);
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.te-field__clear {
  position: absolute;
  top: var(--mp-space-8);
  right: var(--mp-space-8);
}

/* Rich text — a bordered box on the input radius; the toolbar sits on the secondary surface. */
.te-rte {
  border: 1px solid var(--border-default);
  border-radius: var(--mp-component-input-radius);
  overflow: hidden;
}

.te-rte:focus-within {
  border-color: var(--accent-default);
  box-shadow: inset 0 0 0 1px var(--accent-default);
}

.te-rte__toolbar {
  display: flex;
  align-items: center;
  gap: var(--mp-space-2);
  padding: var(--mp-space-4) var(--mp-space-6);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-secondary);
}

.te-rte__block {
  flex: 0 0 auto;
  width: calc(var(--mp-component-control-height) * 2);
}

.te-rte__body {
  min-height: calc(var(--mp-space-40) * 3);
  padding: var(--mp-space-12);
  font-size: var(--mp-fontSize-14);
  line-height: 1.5;
  outline: none;
}

.te-rte__body :deep(h1) {
  font-size: var(--mp-fontSize-20);
  font-weight: var(--mp-fontWeight-bold);
  line-height: 1.2;
  margin-block: 0 var(--mp-space-8);
}

.te-rte__body :deep(h2) {
  font-size: var(--mp-fontSize-18);
  font-weight: var(--mp-fontWeight-semibold);
  margin-block: 0 var(--mp-space-8);
}

.te-rte__body :deep(h3) {
  font-size: var(--mp-fontSize-16);
  font-weight: var(--mp-fontWeight-semibold);
  margin-block: 0 var(--mp-space-8);
}

.te-rte__body :deep(p) {
  margin-block: 0 var(--mp-space-8);
}
</style>
