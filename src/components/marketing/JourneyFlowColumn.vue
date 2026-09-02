<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogItem, NodeCategory } from '@/stores/journeyFlowData'
import { nodeCatalog } from '@/stores/journeyFlowData'
import type { FlowSegment } from '@/composables/useFlowTree'
import JourneyAddStepMenu from './JourneyAddStepMenu.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import { branchChipColor, categoryColor, categoryLabel, categoryOnColor } from './flowTheme'

const props = defineProps<{
  segments: FlowSegment[]
  selectedId: string | null
  /** Palette for the add-step menus; defaults to the marketing catalog. */
  catalog?: CatalogItem[]
  /** Node to pulse once (jump-to-issue); cleared by the parent on a timer. */
  flashId?: string | null
  /**
   * Card density. `card` is the full 320px card; `compact` is production's
   * collapsed face — a 54px icon tile with the title underneath — which the
   * builder switches to below 75% zoom. Layout positions do not change.
   */
  face?: 'card' | 'compact'
}>()

const emit = defineEmits<{
  select: [id: string]
  add: [afterId: string, item: CatalogItem, childIndex: number]
  duplicate: [id: string]
  remove: [id: string]
  /** Yes/No filters: swap the two branch targets. */
  flip: [id: string]
}>()

// Per-card accent fed to the CSS via custom properties — the spine, icon tile,
// and eyebrow all derive from the one category color. 'end' has no theme key
// (grey-darken-1 is a Material class name, not a --v-theme var) → neutral mix.
const accentVars = (c: NodeCategory) => c === 'end'
  ? {
      '--node-accent': 'var(--text-muted)',
      '--node-accent-soft': 'var(--surface-secondary)',
      '--node-accent-on': 'rgb(var(--v-theme-surface))',
    }
  : {
      '--node-accent': `rgb(var(--v-theme-${categoryColor[c]}))`,
      '--node-accent-soft': `rgba(var(--v-theme-${categoryColor[c]}), 0.12)`,
      '--node-accent-on': `rgb(var(--v-theme-${categoryOnColor[c]}))`,
    }

// Every non-trigger step is insertable on an edge — including End, which the
// production palette offers as a step.
const addableItems = computed(() =>
  (props.catalog ?? nodeCatalog).filter(i => i.category !== 'trigger'),
)
const compact = computed(() => props.face === 'compact')

const nodeAria = (seg: FlowSegment) =>
  `${categoryLabel[seg.node.category]} step: ${seg.node.title}${seg.node.configured ? '' : ' — needs setup'}`

/** The run ends here (no join to continue to, and not an explicit End step). */
const endsRun = computed(() => {
  const last = props.segments[props.segments.length - 1]
  if (!last || last.branches) return false
  if (last.node.category === 'end' || last.node.kind === 'end-journey') return false
  return !last.node.children[0]
})
</script>

<template>
  <template v-for="seg in segments" :key="seg.node.id">
    <!-- Node card -->
    <div class="d-flex flex-column align-center flow-node-wrap">
      <div class="flow-node"
        :class="{
          'flow-node--selected': selectedId === seg.node.id,
          'flow-node--warn': !seg.node.configured,
          'flow-node--flash': flashId === seg.node.id,
          'flow-node--compact': compact,
        }"
        :style="accentVars(seg.node.category)">
        <!-- Compact face: icon tile + title, same hit target and menu -->
        <button v-if="compact" class="flow-node__open flow-node__open--compact" :aria-label="nodeAria(seg)" @click="emit('select', seg.node.id)">
          <span class="flow-node__tile" aria-hidden="true">
            <v-icon size="26">{{ seg.node.icon }}</v-icon>
          </span>
          <span class="flow-node__tile-title">{{ seg.node.title }}</span>
        </button>
        <button v-else class="flow-node__open" :aria-label="nodeAria(seg)" @click="emit('select', seg.node.id)">
          <span class="flow-node__main">
            <span class="flow-node__icon" aria-hidden="true">
              <v-icon size="17">{{ seg.node.icon }}</v-icon>
            </span>
            <span class="flow-node__heading">
              <span class="flow-node__type">{{ categoryLabel[seg.node.category] }}</span>
              <span class="flow-node__title">{{ seg.node.title }}</span>
              <span v-if="seg.node.subtitle" class="flow-node__body">{{ seg.node.subtitle }}</span>
            </span>
          </span>
          <span v-if="seg.node.contacts != null" class="flow-node__foot">
            <v-icon size="11" class="mr-1">users</v-icon>{{ seg.node.contacts.toLocaleString() }} contacts
          </span>
          <span v-if="!seg.node.configured" class="flow-node__setup">
            <v-icon size="13" class="mr-1 flex-shrink-0">triangle-alert</v-icon>
            Needs setup — open to configure
          </span>
        </button>

        <div class="flow-node__tools">
          <MpRowActionsMenu ariaLabel="Actions" :itemLabel="seg.node.title">
            <MpMenuItem icon="pencil" title="Configure" @click="emit('select', seg.node.id)" />
            <MpMenuItem icon="copy" title="Duplicate"
              :disabled="seg.node.category === 'trigger' || seg.node.category === 'filter'"
              @click="emit('duplicate', seg.node.id)" />
            <MpMenuItem v-if="seg.node.kind === 'yes-no'" icon="arrow-left-right" title="Flip Yes/No"
              @click="emit('flip', seg.node.id)" />
            <v-divider class="my-1" />
            <MpMenuItem icon="trash-2" title="Delete" danger
              :disabled="seg.node.category === 'trigger'" @click="emit('remove', seg.node.id)" />
          </MpRowActionsMenu>
        </div>
      </div>

      <!-- Outgoing edge (linear nodes only — filter edges are the branch columns) -->
      <div v-if="!seg.branches" class="d-flex flex-column align-center">
        <div class="flow-connector"></div>
        <JourneyAddStepMenu :items="addableItems" @pick="item => emit('add', seg.node.id, item, 0)">
          <template #default="{ props: menu }">
            <v-btn v-bind="menu" icon="plus" size="x-small" variant="flat" class="add-btn"
              aria-label="Add step after this one"></v-btn>
          </template>
        </JourneyAddStepMenu>
        <div class="flow-connector"></div>
      </div>
    </div>

    <!-- Branch columns -->
    <div v-if="seg.branches" class="branch-row">
      <div v-for="(b, i) in seg.branches" :key="i" class="branch-col" :class="{ 'branch-col--joins': !!seg.joinId }">
        <div class="branch-stub"></div>
        <v-chip :color="branchChipColor(b.label)" size="x-small" variant="tonal"
          class="branch-chip font-weight-bold mb-2 flex-shrink-0">
          {{ b.label }}
        </v-chip>

        <template v-if="!b.empty">
          <div class="flow-connector"></div>
          <JourneyFlowColumn :segments="b.segments" :selected-id="selectedId" :catalog="catalog" :flash-id="flashId" :face="face"
            @select="id => emit('select', id)"
            @add="(afterId, item, childIndex) => emit('add', afterId, item, childIndex)"
            @duplicate="id => emit('duplicate', id)"
            @remove="id => emit('remove', id)"
            @flip="id => emit('flip', id)" />
        </template>
        <template v-else>
          <div class="flow-connector"></div>
          <JourneyAddStepMenu :items="addableItems" @pick="item => emit('add', seg.node.id, item, i)">
            <template #default="{ props: menu }">
              <button v-bind="menu" class="branch-empty" :class="{ 'branch-empty--compact': compact }" :aria-label="`Add a step to the ${b.label} branch`">
                <v-icon size="15" class="mr-1">plus</v-icon>
                <span class="text-caption font-weight-medium">Add step</span>
              </button>
            </template>
          </JourneyAddStepMenu>
        </template>

        <div v-if="seg.joinId" class="branch-drop"></div>
      </div>
    </div>
    <!-- Converge into the join node (rendered as the next segment) -->
    <div v-if="seg.branches && seg.joinId" class="flow-connector flow-connector--arrow"></div>
  </template>

  <div v-if="endsRun" class="flow-end flex-shrink-0" role="note" aria-label="End of journey">
    <v-icon size="13" class="mr-1">flag</v-icon>
    <span>End of journey</span>
  </div>
</template>

<style scoped>
/* ── Node card ──────────────────────────────────────────────────────────────
   Quiet white surface — hairline border, soft shadow — the way Klaviyo,
   Customer.io and HoneyBook draw flow steps. The category colour lives on the
   icon tile only (--node-accent / --node-accent-soft custom props per card), so
   a canvas of many steps reads as one calm system rather than a colour chart. */
.flow-node {
  position: relative; width: 300px; background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-radius-12); overflow: hidden;
  box-shadow: var(--mp-shadow-sm);
  transition: border-color var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease);
}
.flow-node:hover { box-shadow: var(--mp-shadow-md); border-color: var(--border-strong); }
.flow-node--selected,
.flow-node--selected:hover {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.35), var(--mp-shadow-md);
}
.flow-node--warn .flow-node__icon { background: rgba(var(--v-theme-warning), 0.14); color: rgb(var(--v-theme-warning)); }
.flow-node--flash { animation: node-flash 1.2s ease-out 1; }
@keyframes node-flash {
  0%, 100% { box-shadow: var(--mp-shadow-sm); }
  35% { box-shadow: 0 0 0 6px rgba(var(--v-theme-warning), 0.35), var(--mp-shadow-lg); }
  70% { box-shadow: 0 0 0 3px rgba(var(--v-theme-warning), 0.2), var(--mp-shadow-md); }
}
@media (prefers-reduced-motion: reduce) {
  .flow-node--flash { animation: none; }
}

.flow-node__open {
  display: block; width: 100%; padding: 0; margin: 0; border: 0;
  background: transparent; text-align: left; cursor: pointer; color: inherit;
}
.flow-node__open:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; border-radius: var(--mp-radius-12); }
.flow-node__main { display: flex; align-items: flex-start; gap: var(--mp-space-12); padding: var(--mp-space-14) var(--mp-space-48) var(--mp-space-14) var(--mp-space-14); }
.flow-node__icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: var(--mp-space-32); height: var(--mp-space-32); border-radius: var(--mp-radius-10); flex-shrink: 0;
  background: var(--node-accent-soft); color: var(--node-accent);
}
.flow-node__heading { display: flex; flex-direction: column; min-width: 0; padding-top: 1px; }
.flow-node__type {
  font-size: var(--mp-fontSize-10); font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
  color: var(--text-muted); line-height: 1.4;
}
.flow-node--warn .flow-node__type { color: rgb(var(--v-theme-warning)); }
.flow-node__title {
  font-size: var(--mp-fontSize-14); font-weight: 600; color: rgb(var(--v-theme-on-surface));
  line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.flow-node__body {
  margin-top: var(--mp-space-2); font-size: var(--mp-fontSize-12); line-height: 1.45;
  color: var(--text-muted);
  overflow: hidden; text-overflow: ellipsis; display: -webkit-box;
  -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.flow-node__foot {
  display: flex; align-items: center; padding: var(--mp-space-8) var(--mp-space-14);
  font-size: var(--mp-fontSize-11); font-weight: 600; color: var(--text-muted);
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: var(--surface-secondary);
}
.flow-node__setup {
  display: flex; align-items: center; padding: var(--mp-space-8) var(--mp-space-14);
  font-size: var(--mp-fontSize-11); font-weight: 600; line-height: 1.3;
  color: rgb(var(--v-theme-warning));
  background: rgba(var(--v-theme-warning), 0.08);
  border-top: 1px solid rgba(var(--v-theme-warning), 0.25);
}
.flow-node__tools {
  position: absolute; top: var(--mp-space-10); right: var(--mp-space-8); display: flex; align-items: center;
  opacity: 0; transition: opacity var(--dur-fast) var(--ease);
}

/* ── Compact face (production's collapsed node, shown below 75% zoom) ──────
   The card shrinks to a swatch tile with the title underneath; the spine is
   dropped because the tile itself carries the category colour. Width stays
   fixed so the tree layout does not move when the face switches. */
.flow-node--compact {
  width: var(--mp-space-64); border: 0; background: transparent; box-shadow: none;
  border-radius: var(--mp-radius-12); overflow: visible;
}
.flow-node--compact::before { display: none; }
.flow-node--compact:hover { box-shadow: none; }
.flow-node--compact.flow-node--selected { box-shadow: none; }
.flow-node--compact.flow-node--selected .flow-node__tile {
  outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 2px;
}
.flow-node--compact.flow-node--warn .flow-node__tile { background: rgb(var(--v-theme-warning)); color: rgb(var(--v-theme-on-warning)); }
.flow-node__open--compact { display: flex; flex-direction: column; align-items: center; gap: var(--mp-space-8); padding-bottom: var(--mp-space-4); }
.flow-node__open--compact:focus-visible { border-radius: var(--mp-radius-12); }
.flow-node__tile {
  display: inline-flex; align-items: center; justify-content: center;
  width: var(--mp-space-64); height: var(--mp-space-64); border-radius: var(--mp-radius-12);
  background: var(--node-accent); color: var(--node-accent-on);
  box-shadow: var(--mp-shadow-sm);
}
.flow-node__tile-title {
  display: block; width: 120px; text-align: center;
  font-size: 0.75rem; font-weight: 600; line-height: 1.3; color: rgb(var(--v-theme-on-surface));
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.flow-node--compact .flow-node__tools { top: -6px; right: -34px; }
.branch-empty--compact { width: 140px; padding: var(--mp-space-8); }
.flow-node-wrap:hover .flow-node__tools,
.flow-node--selected .flow-node__tools,
.flow-node-wrap:focus-within .flow-node__tools { opacity: 1; }

/* ── Connectors ─────────────────────────────────────────────────────────── */
.flow-connector { width: 2px; height: var(--mp-space-24); background: var(--border-strong); opacity: 0.7; flex-shrink: 0; }
.flow-connector--arrow { position: relative; height: 28px; }
.flow-connector--arrow::after {
  content: ''; position: absolute; bottom: -1px; left: 50%; transform: translateX(-50%);
  border-left: 5px solid transparent; border-right: 5px solid transparent;
  border-top: 6px solid var(--border-strong);
}
.add-btn {
  width: var(--mp-space-24); height: var(--mp-space-24); min-width: var(--mp-space-24);
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--border-strong);
  color: var(--text-muted);
  opacity: 0.7; transition: opacity var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease);
}
.flow-node-wrap:hover .add-btn, .add-btn:hover, .add-btn:focus-visible { opacity: 1; }
.add-btn:hover, .add-btn:focus-visible {
  background: rgb(var(--v-theme-primary)); border-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary)); transform: scale(1.12);
}
.flow-end {
  display: inline-flex; align-items: center; padding: var(--mp-space-4) var(--mp-space-12);
  border: 1px solid var(--border-default); border-radius: var(--mp-radius-full);
  font-size: var(--mp-fontSize-11); font-weight: 600;
  color: var(--text-muted); background: var(--surface-secondary);
}

/* ── Branch columns ─────────────────────────────────────────────────────────
   Split/join rails are pseudo-elements; the outermost columns draw rounded
   elbows (border-top/bottom + border-left/right + radius) instead of hard
   right angles; middle columns keep a straight rail + stub. */
.branch-row { display: flex; align-items: stretch; }
.branch-col {
  position: relative; display: flex; flex-direction: column; align-items: center;
  padding: 0 20px;
}
.branch-col::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: var(--border-default);
}
.branch-col:first-child::before {
  left: calc(50% - 1px); height: 16px; background: transparent;
  border-top: 2px solid var(--border-default);
  border-left: 2px solid var(--border-default);
  border-top-left-radius: 12px;
}
.branch-col:last-child::before {
  right: calc(50% - 1px); left: 0; height: 16px; background: transparent;
  border-top: 2px solid var(--border-default);
  border-right: 2px solid var(--border-default);
  border-top-right-radius: 12px;
}
.branch-col:only-child::before { display: none; }
.branch-col--joins::after {
  content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
  background: var(--border-default);
}
.branch-col--joins:first-child::after {
  left: calc(50% - 1px); height: 16px; background: transparent;
  border-bottom: 2px solid var(--border-default);
  border-left: 2px solid var(--border-default);
  border-bottom-left-radius: 12px;
}
.branch-col--joins:last-child::after {
  right: calc(50% - 1px); left: 0; height: 16px; background: transparent;
  border-bottom: 2px solid var(--border-default);
  border-right: 2px solid var(--border-default);
  border-bottom-right-radius: 12px;
}
.branch-col--joins:only-child::after { display: none; }

/* Outer columns: the elbow's border-left/right already draws the descender —
   keep the stub for spacing but paint it only on middle columns. */
.branch-stub { width: 2px; height: 16px; background: transparent; margin-bottom: 8px; flex-shrink: 0; }
.branch-col:not(:first-child):not(:last-child) .branch-stub { background: var(--border-default); }
.branch-drop { flex: 1 1 auto; width: 2px; min-height: 14px; background: var(--border-default); margin-top: 8px; }
.branch-col--joins:first-child .branch-drop,
.branch-col--joins:last-child .branch-drop { margin-bottom: 14px; }

.branch-chip { letter-spacing: 0.02em; }

.branch-empty {
  display: flex; align-items: center; justify-content: center;
  width: 300px; padding: var(--mp-space-12);
  border: 1.5px dashed var(--border-strong);
  border-radius: var(--mp-radius-12); background: transparent; cursor: pointer;
  color: var(--text-muted); transition: border-color var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease);
}
.branch-empty:hover {
  border-color: rgba(var(--v-theme-primary), 0.6); color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.04);
}
.branch-empty:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
</style>
