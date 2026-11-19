<script setup lang="ts">
import { ref } from 'vue'
import MpFormField from '@/components/MpFormField.vue'
import { useToast } from '@/composables/useToast'
import { MAX_PRODUCT_IMAGES, PRODUCT_IMAGE_TYPES, prepareProductImage } from './productMedia'

// A product's pictures on the product forms: add by picking or dropping files,
// remove one at a time. The first picture is the one lists and cards show.
// Files never leave the browser: each is shrunk and kept as a data URL.

const props = withDefaults(defineProps<{
  /** Picture URLs, the first one leading. */
  modelValue: string[]
  /** The most pictures a product can have. */
  max?: number
  label?: string
}>(), { max: MAX_PRODUCT_IMAGES, label: 'Pictures' })

const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

const toast = useToast()
const picker = ref<HTMLInputElement>()
const busy = ref(false)
const dragging = ref(false)

async function addFiles(files: File[]): Promise<void> {
  const room = props.max - props.modelValue.length
  const pictures = files.filter((file) => PRODUCT_IMAGE_TYPES.includes(file.type))
  const notes: string[] = []
  if (pictures.length < files.length) notes.push('Only PNG, JPG and WEBP pictures can be added.')
  if (pictures.length > room) notes.push(`A product has up to ${props.max} pictures, so ${pictures.length - room} were left out.`)

  busy.value = true
  const added: string[] = []
  for (const file of pictures.slice(0, room)) {
    try {
      added.push(await prepareProductImage(file))
    } catch {
      notes.push(`${file.name} could not be read.`)
    }
  }
  busy.value = false

  if (added.length) emit('update:modelValue', [...props.modelValue, ...added])
  if (notes.length) toast.warning(notes.join(' '))
}

function onPick(event: Event): void {
  const input = event.target as HTMLInputElement
  void addFiles([...(input.files ?? [])])
  // So picking the same file again still fires a change.
  input.value = ''
}

function onDrop(event: DragEvent): void {
  dragging.value = false
  void addFiles([...(event.dataTransfer?.files ?? [])])
}

function remove(index: number): void {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
}
</script>

<template>
  <MpFormField
    :label="label"
    :hint="`Up to ${max} pictures, PNG, JPG or WEBP. Drop files here or use Add pictures. The first one is the main picture.`"
  >
    <ul
      class="pmf"
      :class="{ 'pmf--drop': dragging }"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
    >
      <li v-for="(url, index) in modelValue" :key="index" class="pmf__tile">
        <img :src="url" :alt="`Picture ${index + 1}`" class="pmf__image">
        <v-chip v-if="index === 0" size="x-small" variant="flat" color="surface" label class="pmf__main">Main</v-chip>
        <v-btn
          icon="x"
          size="small"
          variant="flat"
          color="surface"
          class="mp-btn--icon pmf__remove"
          :aria-label="`Remove picture ${index + 1}`"
          @click="remove(index)"
        />
      </li>
      <li v-if="modelValue.length < max">
        <v-btn
          stacked
          variant="outlined"
          prepend-icon="image-plus"
          class="pmf__add text-none text-medium-emphasis"
          :loading="busy"
          @click="picker?.click()"
        >
          {{ modelValue.length ? 'Add picture' : 'Add pictures' }}
        </v-btn>
      </li>
    </ul>
    <input ref="picker" type="file" hidden multiple :accept="PRODUCT_IMAGE_TYPES.join(',')" @change="onPick">
  </MpFormField>
</template>

<style scoped>
.pmf {
  /* A tile is two of the 48px steps: large enough to tell pictures apart, small enough for four in a side rail. */
  --pmf-tile: calc(var(--mp-space-48) * 2);

  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-space-12);
  margin: 0;
  padding: 0;
  list-style: none;
  border-radius: var(--mp-radius-10);
}

/* Files held over the field: the whole row answers, not one tile. */
.pmf--drop {
  outline: var(--mp-space-2) dashed rgb(var(--v-theme-primary));
  outline-offset: var(--mp-space-4);
}

.pmf__tile {
  position: relative;
  width: var(--pmf-tile);
  height: var(--pmf-tile);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-10);
  overflow: hidden;
}

.pmf__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pmf__main {
  position: absolute;
  left: var(--mp-space-4);
  bottom: var(--mp-space-4);
}

.pmf__remove {
  position: absolute;
  top: var(--mp-space-4);
  right: var(--mp-space-4);
}

/* !important where VBtn's global defaults arrive as inline styles (radius, padding,
   font size), which no class outranks. */
.v-btn.pmf__add {
  width: var(--pmf-tile);
  height: var(--pmf-tile);
  min-width: 0;
  padding: var(--mp-space-8) !important;
  border-style: dashed;
  border-color: var(--border-strong);
  border-radius: var(--mp-radius-10) !important;
  font-size: var(--mp-fontSize-12) !important;
}
</style>
