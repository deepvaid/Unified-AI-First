<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue'
import MpIconButton from '@/components/MpIconButton.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpTreeRow from '@/components/MpTreeRow.vue'
import {
  addableBlockKinds,
  getBlockDef,
  getSectionDef,
  type ThemeEditorBlock,
  type ThemeEditorSection,
} from '@/stores/themeEditorData'

// The builder's Layers panel (store builder re-skin): the template's sections as a
// tree of MpTreeRows — section → blocks → a block's nested blocks (Trust Stats Bar →
// Stat: …) — with "Add section" above and an "Add block" command row closing each
// open group. Rows drag to reorder, as in UAT; Alt + ↑ / ↓ does the same from the
// keyboard (drag alone would fail WCAG 2.5.7 / 2.1.1). Selection is the host's.

const props = defineProps<{
  sections: ThemeEditorSection[]
  selectedSectionId: string | null
  selectedBlockId: string | null
}>()

const emit = defineEmits<{
  selectSection: [sectionId: string]
  selectBlock: [sectionId: string, blockId: string]
  addSection: []
  addBlock: [sectionId: string, kind: string, parentBlockId?: string]
  removeSection: [sectionId: string]
  removeBlock: [sectionId: string, blockId: string]
  reorderSection: [from: number, to: number]
  reorderBlock: [sectionId: string, from: number, to: number]
}>()

const expanded = ref<Set<string>>(new Set())

function toggle(id: string) {
  const next = new Set(expanded.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expanded.value = next
}

function selectSection(section: ThemeEditorSection) {
  emit('selectSection', section.id)
  if (!expanded.value.has(section.id)) expanded.value = new Set([...expanded.value, section.id])
}

const sectionIcon = (section: ThemeEditorSection) => getSectionDef(section.kind)?.icon ?? 'layout-template'
const blockIcon = (block: ThemeEditorBlock) => getBlockDef(block.kind)?.icon ?? 'box'
const blockKindTitle = (kind: string) => getBlockDef(kind)?.title ?? kind

// ── "Add block" — one menu, anchored to whichever command row opened it ──────
const addMenu = reactive<{ open: boolean; target: Element | undefined; sectionId: string; parentBlockId?: string; kinds: string[] }>({
  open: false,
  target: undefined,
  sectionId: '',
  parentBlockId: undefined,
  kinds: [],
})

function openAddMenu(event: MouseEvent, section: ThemeEditorSection, parent?: ThemeEditorBlock) {
  addMenu.target = (event.currentTarget as Element | null) ?? undefined
  addMenu.sectionId = section.id
  addMenu.parentBlockId = parent?.id
  addMenu.kinds = addableBlockKinds(section, parent)
  addMenu.open = true
}

function pickBlockKind(kind: string) {
  emit('addBlock', addMenu.sectionId, kind, addMenu.parentBlockId)
  addMenu.open = false
}

// ── Reorder: drag (pointer) and Alt + ↑ / ↓ (keyboard) ────────────────────────
const rowRefs = new Map<string, { focus: () => void }>()
const bindRow = (id: string) => (el: unknown) => {
  if (el) rowRefs.set(id, el as { focus: () => void })
  else rowRefs.delete(id)
}

const announcement = ref('')

async function keyboardMove(id: string, label: string, to: number, count: number, move: () => void) {
  if (to < 0 || to >= count) return
  move()
  announcement.value = `${label} moved to position ${to + 1} of ${count}`
  await nextTick()
  rowRefs.get(id)?.focus()
}

function onSectionKeydown(event: KeyboardEvent, section: ThemeEditorSection, index: number) {
  if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return
  event.preventDefault()
  const to = index + (event.key === 'ArrowUp' ? -1 : 1)
  void keyboardMove(section.id, section.label, to, props.sections.length, () => emit('reorderSection', index, to))
}

function onBlockKeydown(event: KeyboardEvent, section: ThemeEditorSection, block: ThemeEditorBlock, index: number) {
  if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return
  event.preventDefault()
  event.stopPropagation()
  const to = index + (event.key === 'ArrowUp' ? -1 : 1)
  void keyboardMove(block.id, block.label, to, section.blocks.length, () => emit('reorderBlock', section.id, index, to))
}

const dragSection = ref<number | null>(null)
const dragBlock = ref<{ sectionId: string; index: number } | null>(null)
const dropTarget = ref<string | null>(null)

function onSectionDragStart(event: DragEvent, index: number) {
  dragSection.value = index
  event.dataTransfer?.setData('application/x-theme-section-index', String(index))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function onSectionDrop(index: number) {
  dropTarget.value = null
  if (dragSection.value === null) return
  emit('reorderSection', dragSection.value, index)
  dragSection.value = null
}

function onBlockDragStart(event: DragEvent, sectionId: string, index: number) {
  dragBlock.value = { sectionId, index }
  event.dataTransfer?.setData('application/x-theme-block-index', String(index))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
  event.stopPropagation()
}

function onBlockDrop(sectionId: string, index: number) {
  dropTarget.value = null
  if (!dragBlock.value || dragBlock.value.sectionId !== sectionId) return
  emit('reorderBlock', sectionId, dragBlock.value.index, index)
  dragBlock.value = null
}

function onDragEnd() {
  dragSection.value = null
  dragBlock.value = null
  dropTarget.value = null
}
</script>

<template>
  <div class="te-layers" aria-label="Layers">
    <div class="te-layers__head">
      <h2 class="te-layers__title">Layers</h2>
      <v-btn variant="outlined" block prepend-icon="plus" class="text-none" @click="emit('addSection')">Add section</v-btn>
    </div>

    <div class="te-layers__scroll">
      <p id="te-layers-hint" class="d-sr-only">Drag a row, or press Alt with the up or down arrow, to reorder.</p>
      <div class="d-sr-only" aria-live="polite">{{ announcement }}</div>

      <div role="list" aria-label="Sections" aria-describedby="te-layers-hint">
        <div
          v-for="(section, index) in sections"
          :key="section.id"
          role="listitem"
          class="te-layers__item"
          :class="{ 'te-layers__item--drop': dropTarget === section.id }"
          draggable="true"
          @dragstart="onSectionDragStart($event, index)"
          @dragover.prevent="dropTarget = section.id"
          @dragleave="dropTarget = null"
          @drop.prevent="onSectionDrop(index)"
          @dragend="onDragEnd"
        >
          <MpTreeRow
            :ref="bindRow(section.id)"
            :label="section.label"
            emphasis="prominent"
            expandable
            :expanded="expanded.has(section.id)"
            :selected="section.id === selectedSectionId && !selectedBlockId"
            class="te-layers__row"
            @select="selectSection(section)"
            @toggle="toggle(section.id)"
            @keydown="onSectionKeydown($event, section, index)"
          >
            <template #lead>
              <v-icon class="te-lead te-lead__type">{{ sectionIcon(section) }}</v-icon>
              <v-icon class="te-lead te-lead__grip" aria-hidden="true">grip-vertical</v-icon>
            </template>
            <template #actions>
              <MpIconButton size="sm" icon="trash-2" :ariaLabel="`Remove ${section.label}`" @click.stop="emit('removeSection', section.id)" />
            </template>
          </MpTreeRow>

          <div v-if="expanded.has(section.id)" role="list" :aria-label="`${section.label} blocks`">
            <div
              v-for="(block, blockIndex) in section.blocks"
              :key="block.id"
              role="listitem"
              class="te-layers__item"
              :class="{ 'te-layers__item--drop': dropTarget === block.id }"
              draggable="true"
              @dragstart="onBlockDragStart($event, section.id, blockIndex)"
              @dragover.prevent.stop="dropTarget = block.id"
              @dragleave="dropTarget = null"
              @drop.prevent.stop="onBlockDrop(section.id, blockIndex)"
              @dragend="onDragEnd"
            >
              <MpTreeRow
                :ref="bindRow(block.id)"
                :label="block.label"
                :depth="1"
                :expandable="!!block.blocks"
                :expanded="expanded.has(block.id)"
                :selected="block.id === selectedBlockId"
                class="te-layers__row"
                @select="emit('selectBlock', section.id, block.id)"
                @toggle="toggle(block.id)"
                @keydown="onBlockKeydown($event, section, block, blockIndex)"
              >
                <template #lead>
                  <v-icon class="te-lead te-lead__type">{{ blockIcon(block) }}</v-icon>
                  <v-icon class="te-lead te-lead__grip" aria-hidden="true">grip-vertical</v-icon>
                </template>
                <template #actions>
                  <MpIconButton size="sm" icon="pencil" :ariaLabel="`Edit ${block.label}`" @click.stop="emit('selectBlock', section.id, block.id)" />
                  <MpIconButton size="sm" icon="trash-2" :ariaLabel="`Remove ${block.label}`" @click.stop="emit('removeBlock', section.id, block.id)" />
                </template>
              </MpTreeRow>

              <div v-if="block.blocks && expanded.has(block.id)" role="list" :aria-label="`${block.label} blocks`">
                <div v-for="child in block.blocks" :key="child.id" role="listitem">
                  <MpTreeRow
                    :label="child.label"
                    :icon="blockIcon(child)"
                    :depth="2"
                    :selected="child.id === selectedBlockId"
                    @select="emit('selectBlock', section.id, child.id)"
                  >
                    <template #actions>
                      <MpIconButton size="sm" icon="pencil" :ariaLabel="`Edit ${child.label}`" @click.stop="emit('selectBlock', section.id, child.id)" />
                      <MpIconButton size="sm" icon="trash-2" :ariaLabel="`Remove ${child.label}`" @click.stop="emit('removeBlock', section.id, child.id)" />
                    </template>
                  </MpTreeRow>
                </div>
                <MpTreeRow
                  v-if="addableBlockKinds(section, block).length"
                  variant="action"
                  icon="plus"
                  label="Add block"
                  :depth="2"
                  aria-haspopup="menu"
                  @select="openAddMenu($event, section, block)"
                />
              </div>
            </div>

            <MpTreeRow variant="action" icon="plus" label="Add block" :depth="1" @select="openAddMenu($event, section)" />
          </div>
        </div>
      </div>

      <div v-if="!sections.length" class="te-layers__empty">No sections on this template yet.</div>
    </div>

    <v-menu v-model="addMenu.open" :activator="addMenu.target" location="bottom start">
      <v-list density="compact" role="menu" aria-label="Add block">
        <MpMenuItem v-for="kind in addMenu.kinds" :key="kind" :title="blockKindTitle(kind)" :icon="getBlockDef(kind)?.icon" @click="pickBlockKind(kind)" />
      </v-list>
    </v-menu>
  </div>
</template>

<style scoped>
.te-layers {
  display: flex;
  flex-direction: column;
  width: var(--mp-component-editor-layersWidth);
  flex-shrink: 0;
  min-height: 0;
  border-right: 1px solid var(--border-subtle);
  background: var(--surface-primary);
  color: var(--on-surface);
}

.te-layers__head {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-12);
  flex-shrink: 0;
  padding: var(--mp-space-16) var(--mp-space-12) var(--mp-space-12);
}

.te-layers__title {
  margin: 0;
  padding-inline: var(--mp-space-4);
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  line-height: 1.3;
}

.te-layers__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 0 var(--mp-space-8) var(--mp-space-16);
}

.te-layers__empty {
  padding: var(--mp-space-16) var(--mp-space-8);
  font-size: var(--mp-fontSize-12);
  color: var(--text-muted);
}

/* Rows stack without gaps so the indent guides read as one continuous line. */
.te-layers__item--drop > .te-layers__row {
  box-shadow: inset 0 2px 0 var(--accent-default);
}

/* The lead swaps the type icon for a drag grip on hover — the row IS the drag
   handle; the grip only says so, without spending a column on it. */
.te-lead {
  font-size: var(--mp-component-tree-iconSize);
  color: var(--icon-secondary);
}

.te-lead__grip {
  display: none;
  cursor: grab;
}

.te-layers__row:hover .te-lead__type {
  display: none;
}

.te-layers__row:hover .te-lead__grip {
  display: inline-flex;
}

.mp-tree-row--selected .te-lead {
  color: currentColor;
}
</style>
