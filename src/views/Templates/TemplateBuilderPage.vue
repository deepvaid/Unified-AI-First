<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import MpBuilderShell from '@/components/MpBuilderShell.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useToast } from '@/composables/useToast'

// BUILDER TEMPLATE — a full-frame editor: toolbar, palette, canvas, inspector.
// Copied from src/views/Marketing/EmailContentEditor.vue, the smallest consumer.

const router = useRouter()
const toast = useToast()

interface Block {
  id: number
  type: string
  label: string
  text: string
  align: string
}

const PALETTE = [
  { type: 'Block type A', icon: 'type' },
  { type: 'Block type B', icon: 'image' },
  { type: 'Block type C', icon: 'square' },
  { type: 'Block type D', icon: 'minus' },
]

const ALIGN_ITEMS = [
  { value: 'start', label: 'Align start', icon: 'align-left' },
  { value: 'center', label: 'Align centre', icon: 'align-center' },
  { value: 'end', label: 'Align end', icon: 'align-right' },
]

let nextId = 3
const blocks = ref<Block[]>([
  { id: 1, type: 'Block type A', label: 'Block label 01', text: 'Supporting description text.', align: 'start' },
  { id: 2, type: 'Block type B', label: 'Block label 02', text: 'Supporting description text.', align: 'center' },
])

const selectedId = ref<number | null>(1)
const selected = computed(() => blocks.value.find((b) => b.id === selectedId.value) ?? null)

/* Dirty is a snapshot diff — the shell's status chip reads the `dirty` prop and
   nothing else, so the page never renders its own saved/unsaved label. */
const saved = ref(JSON.stringify(blocks.value))
const isDirty = computed(() => JSON.stringify(blocks.value) !== saved.value)

const { confirmLeave, allowNextLeave, discardAndLeave, leaveTitle, leaveMessage, leaveConfirmLabel } =
  useDirtyLeaveGuard(isDirty, {
    title: 'Leave the builder?',
    message: 'This layout has unsaved changes. Leaving now will discard them.',
  })

function addBlock(type: string) {
  const id = nextId++
  blocks.value.push({
    id,
    type,
    label: `Block label ${String(id).padStart(2, '0')}`,
    text: 'Supporting description text.',
    align: 'start',
  })
  selectedId.value = id
}

function move(index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= blocks.value.length) return
  const [block] = blocks.value.splice(index, 1)
  if (block) blocks.value.splice(target, 0, block)
}

function remove(index: number) {
  const [block] = blocks.value.splice(index, 1)
  if (block && selectedId.value === block.id) selectedId.value = blocks.value[0]?.id ?? null
}

function save() {
  saved.value = JSON.stringify(blocks.value)
  toast.success('Layout saved')
}

function saveAndClose() {
  save()
  allowNextLeave()
  router.push({ name: 'TemplatesIndex' })
}
</script>

<template>
  <!-- standalone for the same reason as the wizard: a product builder route sets
       meta.builderShell and lets the shell fill the app frame instead. -->
  <MpBuilderShell
    standalone
    :back-to="{ name: 'TemplatesIndex' }"
    back-label="Back to Templates"
    title="Record name 01"
    :subtitle="`Builder · ${blocks.length} blocks`"
    :dirty="isDirty"
    persistence-mode="explicit"
  >
    <template #actions>
      <v-btn variant="text" class="text-none" @click="toast.info('Preview')">Preview</v-btn>
      <v-btn variant="outlined" class="text-none" @click="save">Save</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" @click="saveAndClose">Save &amp; close</v-btn>
    </template>

    <template #left>
      <div class="pa-3 d-flex flex-column gap-2">
        <p class="mp-meta-label mb-1">Blocks</p>
        <MpListRow
          v-for="item in PALETTE"
          :key="item.type"
          variant="boxed"
          density="compact"
          clickable
          :title="item.type"
          @click="addBlock(item.type)"
        >
          <template #lead><v-icon size="16">{{ item.icon }}</v-icon></template>
        </MpListRow>
      </div>
    </template>

    <!-- Canvas — the only scrolling pane -->
    <div class="tpl-canvas">
      <div class="tpl-doc">
        <template v-if="blocks.length">
          <div
            v-for="(block, index) in blocks"
            :key="block.id"
            class="tpl-block"
            :class="{ 'tpl-block--selected': block.id === selectedId }"
            role="button"
            tabindex="0"
            @click="selectedId = block.id"
            @keydown.enter="selectedId = block.id"
            @keydown.space.prevent="selectedId = block.id"
          >
            <div class="tpl-block__body" :style="{ textAlign: block.align as 'start' | 'center' | 'end' }">
              <p class="mp-meta-label mb-1">{{ block.type }}</p>
              <p class="tpl-block__label mb-1">{{ block.label }}</p>
              <p class="tpl-block__text mb-0">{{ block.text }}</p>
            </div>
            <div class="tpl-block__tools" @click.stop>
              <v-btn icon="chevron-up" size="x-small" variant="text" :aria-label="`Move ${block.label} up`" @click="move(index, -1)" />
              <v-btn icon="chevron-down" size="x-small" variant="text" :aria-label="`Move ${block.label} down`" @click="move(index, 1)" />
              <v-btn icon="trash-2" size="x-small" variant="text" :aria-label="`Delete ${block.label}`" @click="remove(index)" />
            </div>
          </div>
        </template>
        <MpEmptyState
          v-else
          icon="layout-panel-left"
          title="Start with a block"
          description="Pick one from the palette on the left."
        />
      </div>
    </div>

    <template #right>
      <div class="pa-4">
        <template v-if="selected">
          <MpFormSection :title="`${selected.type} settings`" />
          <MpFormGrid>
            <v-text-field v-model="selected.label" label="Label" placeholder="Block label" />
            <v-textarea v-model="selected.text" label="Text" placeholder="Supporting description text" rows="3" />
            <MpFormField label="Alignment">
              <MpSegmentedControl
                v-model="selected.align"
                :items="ALIGN_ITEMS"
                size="sm"
                ariaLabel="Block alignment"
              />
            </MpFormField>
          </MpFormGrid>
        </template>
        <p v-else class="text-medium-emphasis text-body-2 mb-0">Select a block to edit it.</p>
      </div>
    </template>
  </MpBuilderShell>

  <MpConfirmDialog
    v-model="confirmLeave"
    :title="leaveTitle"
    :message="leaveMessage"
    :confirm-label="leaveConfirmLabel"
    danger
    @confirm="discardAndLeave"
  />
</template>

<style scoped>
.tpl-canvas {
  padding: var(--mp-space-24);
}

.tpl-doc {
  max-width: var(--mp-layout-formMaxWidth);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
}

.tpl-block {
  display: flex;
  align-items: flex-start;
  gap: var(--mp-space-8);
  padding: var(--mp-component-card-paddingCompact);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-component-card-radius);
  background: var(--surface-primary);
  color: var(--on-surface);
  cursor: pointer;
}

.tpl-block:hover {
  background: var(--surface-secondary);
}

.tpl-block:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.tpl-block--selected {
  border-color: rgb(var(--v-theme-primary));
}

.tpl-block__body {
  flex: 1 1 auto;
  min-width: 0;
}

.tpl-block__label {
  font-size: var(--mp-fontSize-15);
  font-weight: 600;
}

.tpl-block__text {
  font-size: var(--mp-fontSize-13);
  color: var(--text-secondary);
}

.tpl-block__tools {
  display: flex;
  flex-shrink: 0;
  gap: var(--mp-component-widget-actionGap);
}
</style>
