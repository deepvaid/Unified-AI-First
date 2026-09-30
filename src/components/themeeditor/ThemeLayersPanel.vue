<script setup lang="ts">
import { ref } from 'vue'
import MpListRow from '@/components/MpListRow.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import { addableBlockKinds, getBlockDef, type ThemeEditorBlock, type ThemeEditorSection } from '@/stores/themeEditorData'

// The builder's Layers panel (store builder re-skin): the template's sections as boxed rows, each
// expanding to its blocks (and a block's nested blocks — Trust Stats Bar → Stat: …), with
// "Add section" above and "Add block" under each open section. Rows drag to reorder by their grip,
// as in UAT; the trash on a row removes it. Selection is the host's — the panel only reports it.

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

function blockIcon(block: ThemeEditorBlock): string {
  return getBlockDef(block.kind)?.icon ?? 'box'
}

function blockKindTitle(kind: string): string {
  return getBlockDef(kind)?.title ?? kind
}

// ── Drag to reorder (native HTML5, one list at a time) ───────────────────────
const SECTION_MIME = 'application/x-theme-section-index'
const BLOCK_MIME = 'application/x-theme-block-index'

const dragSection = ref<number | null>(null)
const dragBlock = ref<{ sectionId: string; index: number } | null>(null)
const dropTarget = ref<string | null>(null)

function onSectionDragStart(event: DragEvent, index: number) {
  dragSection.value = index
  event.dataTransfer?.setData(SECTION_MIME, String(index))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function onSectionDrop(index: number, sectionId: string) {
  dropTarget.value = null
  if (dragSection.value === null) return
  emit('reorderSection', dragSection.value, index)
  dragSection.value = null
  void sectionId
}

function onBlockDragStart(event: DragEvent, sectionId: string, index: number) {
  dragBlock.value = { sectionId, index }
  event.dataTransfer?.setData(BLOCK_MIME, String(index))
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

void props
</script>

<template>
  <div class="te-layers" aria-label="Layers">
    <div class="te-layers__head">
      <h2 class="te-layers__title">Layers</h2>
      <v-btn variant="outlined" block prepend-icon="plus" class="text-none" @click="emit('addSection')">Add section</v-btn>
    </div>

    <div class="te-layers__scroll" role="list" aria-label="Sections">
      <template v-for="(section, index) in sections" :key="section.id">
        <MpListRow
          variant="boxed"
          density="compact"
          clickable
          class="te-layer"
          :class="{
            'te-layer--selected': section.id === selectedSectionId && !selectedBlockId,
            'te-layer--drop': dropTarget === section.id,
          }"
          role="listitem"
          draggable="true"
          :aria-current="section.id === selectedSectionId && !selectedBlockId ? 'true' : undefined"
          @click="selectSection(section)"
          @dragstart="onSectionDragStart($event, index)"
          @dragover.prevent="dropTarget = section.id"
          @dragleave="dropTarget = null"
          @drop.prevent="onSectionDrop(index, section.id)"
          @dragend="onDragEnd"
        >
          <template #lead>
            <v-btn
              :icon="expanded.has(section.id) ? 'chevron-down' : 'chevron-right'"
              variant="text"
              size="x-small"
              class="te-layer__toggle"
              :aria-label="`${expanded.has(section.id) ? 'Collapse' : 'Expand'} ${section.label}`"
              :aria-expanded="expanded.has(section.id)"
              @click.stop="toggle(section.id)"
            />
            <v-icon size="15" class="te-layer__icon">layout-template</v-icon>
          </template>
          <span class="te-layer__label">{{ section.label }}</span>
          <template #trailing>
            <span class="te-layer__actions">
              <v-icon size="14" class="te-layer__grip" aria-hidden="true">grip-vertical</v-icon>
              <v-btn
                icon="trash-2"
                variant="text"
                size="x-small"
                :aria-label="`Remove ${section.label}`"
                @click.stop="emit('removeSection', section.id)"
              />
            </span>
          </template>
        </MpListRow>

        <div v-if="expanded.has(section.id)" class="te-blocks" role="list" :aria-label="`${section.label} blocks`">
          <template v-for="(block, blockIndex) in section.blocks" :key="block.id">
            <MpListRow
              variant="boxed"
              density="compact"
              clickable
              class="te-layer te-layer--block"
              :class="{ 'te-layer--selected': block.id === selectedBlockId, 'te-layer--drop': dropTarget === block.id }"
              role="listitem"
              draggable="true"
              :aria-current="block.id === selectedBlockId ? 'true' : undefined"
              @click.stop="emit('selectBlock', section.id, block.id)"
              @dragstart="onBlockDragStart($event, section.id, blockIndex)"
              @dragover.prevent.stop="dropTarget = block.id"
              @dragleave="dropTarget = null"
              @drop.prevent.stop="onBlockDrop(section.id, blockIndex)"
              @dragend="onDragEnd"
            >
              <template #lead>
                <v-btn
                  v-if="block.blocks"
                  :icon="expanded.has(block.id) ? 'chevron-down' : 'chevron-right'"
                  variant="text"
                  size="x-small"
                  class="te-layer__toggle"
                  :aria-label="`${expanded.has(block.id) ? 'Collapse' : 'Expand'} ${block.label}`"
                  :aria-expanded="expanded.has(block.id)"
                  @click.stop="toggle(block.id)"
                />
                <v-icon size="15" class="te-layer__icon">{{ blockIcon(block) }}</v-icon>
              </template>
              <span class="te-layer__label">{{ block.label }}</span>
              <template #trailing>
                <span class="te-layer__actions">
                  <v-icon size="14" class="te-layer__grip" aria-hidden="true">grip-vertical</v-icon>
                  <v-btn
                    icon="pencil"
                    variant="text"
                    size="x-small"
                    :aria-label="`Edit ${block.label}`"
                    @click.stop="emit('selectBlock', section.id, block.id)"
                  />
                  <v-btn
                    icon="trash-2"
                    variant="text"
                    size="x-small"
                    :aria-label="`Remove ${block.label}`"
                    @click.stop="emit('removeBlock', section.id, block.id)"
                  />
                </span>
              </template>
            </MpListRow>

            <div v-if="block.blocks && expanded.has(block.id)" class="te-blocks te-blocks--nested" role="list" :aria-label="`${block.label} blocks`">
              <MpListRow
                v-for="child in block.blocks"
                :key="child.id"
                variant="boxed"
                density="compact"
                clickable
                class="te-layer te-layer--block"
                :class="{ 'te-layer--selected': child.id === selectedBlockId }"
                role="listitem"
                :aria-current="child.id === selectedBlockId ? 'true' : undefined"
                @click.stop="emit('selectBlock', section.id, child.id)"
              >
                <template #lead>
                  <v-icon size="15" class="te-layer__icon">{{ blockIcon(child) }}</v-icon>
                </template>
                <span class="te-layer__label">{{ child.label }}</span>
                <template #trailing>
                  <span class="te-layer__actions">
                    <v-btn
                      icon="pencil"
                      variant="text"
                      size="x-small"
                      :aria-label="`Edit ${child.label}`"
                      @click.stop="emit('selectBlock', section.id, child.id)"
                    />
                    <v-btn
                      icon="trash-2"
                      variant="text"
                      size="x-small"
                      :aria-label="`Remove ${child.label}`"
                      @click.stop="emit('removeBlock', section.id, child.id)"
                    />
                  </span>
                </template>
              </MpListRow>
              <v-menu v-if="addableBlockKinds(section, block).length" location="bottom">
                <template #activator="{ props: menu }">
                  <v-btn v-bind="menu" variant="text" size="small" prepend-icon="plus" class="text-none te-layers__add-block" aria-haspopup="menu">
                    Add block
                  </v-btn>
                </template>
                <v-list density="compact" role="menu" :aria-label="`Add block to ${block.label}`">
                  <MpMenuItem
                    v-for="kind in addableBlockKinds(section, block)"
                    :key="kind"
                    :title="blockKindTitle(kind)"
                    :icon="getBlockDef(kind)?.icon"
                    @click="emit('addBlock', section.id, kind, block.id)"
                  />
                </v-list>
              </v-menu>
            </div>
          </template>

          <v-menu location="bottom">
            <template #activator="{ props: menu }">
              <v-btn v-bind="menu" variant="text" size="small" prepend-icon="plus" class="text-none te-layers__add-block" aria-haspopup="menu">
                Add block
              </v-btn>
            </template>
            <v-list density="compact" role="menu" :aria-label="`Add block to ${section.label}`">
              <MpMenuItem
                v-for="kind in addableBlockKinds(section)"
                :key="kind"
                :title="blockKindTitle(kind)"
                :icon="getBlockDef(kind)?.icon"
                @click="emit('addBlock', section.id, kind)"
              />
            </v-list>
          </v-menu>
        </div>
      </template>

      <div v-if="!sections.length" class="te-layers__empty">No sections on this template yet.</div>
    </div>
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
  padding: var(--mp-space-12) var(--mp-space-12) var(--mp-space-8);
}

.te-layers__title {
  margin: 0;
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  line-height: 1.3;
}

.te-layers__scroll {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-4);
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: var(--mp-space-4) var(--mp-space-12) var(--mp-space-16);
}

.te-layers__empty {
  padding: var(--mp-space-16) var(--mp-space-4);
  font-size: var(--mp-fontSize-12);
  color: var(--text-muted);
}

/* Boxed rows on the tinted secondary surface — the row primitive owns height/gap/hover; the
   panel adds only selection and drop cues. */
.te-layer {
  --te-row-bg: var(--surface-secondary);
  position: relative;
  gap: var(--mp-space-8);
  background: var(--te-row-bg);
  border-color: transparent;
  padding-inline: var(--mp-space-6) var(--mp-space-4);
  font-size: var(--mp-fontSize-13);
}

.te-layer--selected,
.te-layer--selected:hover {
  --te-row-bg: var(--accent-selected-bg);
  background: var(--te-row-bg);
  border-color: color-mix(in oklch, var(--accent-default) 40%, transparent);
  color: var(--accent-on-container);
}

.te-layer--drop {
  border-color: var(--accent-default);
}

/* Dense chrome, like the explorer rows: 12px keeps "Featured Recommendations" on one line. */
.te-layer__label {
  font-size: var(--mp-fontSize-12);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.te-layer__toggle {
  margin-inline-start: calc(-1 * var(--mp-space-2));
}

.te-layer__icon {
  color: var(--icon-secondary);
}

.te-layer--selected .te-layer__icon {
  color: currentColor;
}

/* Hover-revealed row controls overlay the row's end instead of reserving width, so a long
   section name keeps the whole row; they stay in the DOM for keyboard users. */
.te-layer__actions {
  position: absolute;
  top: 50%;
  right: var(--mp-space-4);
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-2);
  padding-left: var(--mp-space-12);
  transform: translateY(-50%);
  background: linear-gradient(to right, transparent, var(--te-row-bg) var(--mp-space-12));
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--dur-fast) var(--ease);
}

.te-layer:hover .te-layer__actions,
.te-layer:focus-within .te-layer__actions,
.te-layer--selected .te-layer__actions {
  opacity: 1;
  pointer-events: auto;
}

.te-layer__grip {
  color: var(--icon-secondary);
  cursor: grab;
}

.te-blocks {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-4);
}

.te-blocks--nested {
  padding-left: var(--mp-space-16);
}

.te-layer--block .te-layer__toggle + .te-layer__icon,
.te-layer--block .te-layer__icon:first-child {
  margin-inline-start: var(--mp-space-4);
}

.te-layers__add-block {
  align-self: center;
}
</style>
