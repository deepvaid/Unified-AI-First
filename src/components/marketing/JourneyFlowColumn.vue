<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogItem, NodeCategory } from '@/stores/journeyFlowData'
import { nodeCatalog } from '@/stores/journeyFlowData'
import type { FlowSegment } from '@/composables/useFlowTree'
import JourneyAddStepMenu from './JourneyAddStepMenu.vue'

const props = defineProps<{
  segments: FlowSegment[]
  selectedId: string | null
  /** Palette for the add-step menus; defaults to the marketing catalog. */
  catalog?: CatalogItem[]
}>()

const emit = defineEmits<{
  select: [id: string]
  add: [afterId: string, item: CatalogItem, childIndex: number]
  duplicate: [id: string]
  remove: [id: string]
}>()

const categoryColor: Record<NodeCategory, string> = {
  trigger: 'primary',
  action: 'success',
  filter: 'secondary',
  delay: 'warning',
  end: 'grey-darken-1',
}
const categoryLabel = (c: NodeCategory) => ({ trigger: 'Trigger', action: 'Action', filter: 'Filter', delay: 'Delay', end: 'End' })[c]
const headerStyle = (c: NodeCategory) => c === 'end'
  ? {
      backgroundColor: 'rgba(var(--v-theme-on-surface), 0.06)',
      borderBottomColor: 'rgba(var(--v-theme-on-surface), 0.12)',
    }
  : {
      backgroundColor: `rgba(var(--v-theme-${categoryColor[c]}), 0.12)`,
      borderBottomColor: `rgba(var(--v-theme-${categoryColor[c]}), 0.24)`,
    }

const addableItems = computed(() =>
  (props.catalog ?? nodeCatalog).filter(i => i.category !== 'trigger' && i.category !== 'end'),
)

const branchChipColor = (label: string) =>
  label.startsWith('YES') ? 'success' : label.startsWith('NO') ? 'error' : 'secondary'

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
      <div class="flow-node" :class="{ 'flow-node--selected': selectedId === seg.node.id }">
        <button class="flow-node__open" :aria-label="`Configure step: ${seg.node.title}`" @click="emit('select', seg.node.id)">
          <span class="flow-node__header" :style="headerStyle(seg.node.category)">
            <v-avatar :color="categoryColor[seg.node.category]" size="34" rounded="lg" class="flex-shrink-0">
              <v-icon color="white" size="18">{{ seg.node.icon }}</v-icon>
            </v-avatar>
            <span class="flow-node__heading">
              <span class="flow-node__type">{{ categoryLabel(seg.node.category) }}</span>
              <span class="flow-node__title">{{ seg.node.title }}</span>
              <span v-if="seg.node.contacts != null" class="flow-node__meta">
                <v-icon size="11" class="mr-1">users</v-icon>{{ seg.node.contacts.toLocaleString() }} contacts
              </span>
            </span>
            <v-tooltip v-if="!seg.node.configured" text="This step isn't configured yet" location="top">
              <template #activator="{ props: tip }">
                <v-icon v-bind="tip" size="16" color="warning" class="flow-node__warn">triangle-alert</v-icon>
              </template>
            </v-tooltip>
          </span>
          <span class="flow-node__body">{{ seg.node.subtitle }}</span>
        </button>

        <div class="flow-node__tools">
          <v-menu location="bottom end">
            <template #activator="{ props: menu }">
              <v-btn v-bind="menu" icon="more-vertical" variant="text" size="x-small"
                :aria-label="`Actions for ${seg.node.title}`" @click.stop></v-btn>
            </template>
            <v-card rounded="lg" border flat width="180" class="py-1">
              <v-list density="compact" nav>
                <v-list-item prepend-icon="pencil" title="Configure" @click="emit('select', seg.node.id)"></v-list-item>
                <v-list-item prepend-icon="copy" title="Duplicate"
                  :disabled="seg.node.category === 'trigger' || seg.node.category === 'filter'"
                  @click="emit('duplicate', seg.node.id)"></v-list-item>
                <v-list-item prepend-icon="trash-2" title="Delete" base-color="error"
                  :disabled="seg.node.category === 'trigger'" @click="emit('remove', seg.node.id)"></v-list-item>
              </v-list>
            </v-card>
          </v-menu>
        </div>
      </div>

      <!-- Outgoing edge (linear nodes only — filter edges are the branch columns) -->
      <div v-if="!seg.branches" class="d-flex flex-column align-center">
        <div class="flow-connector"></div>
        <JourneyAddStepMenu :items="addableItems" @pick="item => emit('add', seg.node.id, item, 0)">
          <template #default="{ props: menu }">
            <v-btn v-bind="menu" icon="plus" size="x-small" variant="flat" color="primary" class="add-btn"
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
        <v-chip :color="branchChipColor(b.label)" size="x-small" variant="flat" class="font-weight-bold mb-2 flex-shrink-0">
          {{ b.label }}
        </v-chip>

        <template v-if="!b.empty">
          <div class="flow-connector"></div>
          <JourneyFlowColumn :segments="b.segments" :selected-id="selectedId" :catalog="catalog"
            @select="id => emit('select', id)"
            @add="(afterId, item, childIndex) => emit('add', afterId, item, childIndex)"
            @duplicate="id => emit('duplicate', id)"
            @remove="id => emit('remove', id)" />
        </template>
        <template v-else>
          <div class="flow-connector"></div>
          <JourneyAddStepMenu :items="addableItems" @pick="item => emit('add', seg.node.id, item, i)">
            <template #default="{ props: menu }">
              <button v-bind="menu" class="branch-empty" :aria-label="`Add a step to the ${b.label} branch`">
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
    <div v-if="seg.branches && seg.joinId" class="flow-connector"></div>
  </template>

  <v-card v-if="endsRun" variant="outlined" rounded="lg"
    class="pa-3 d-flex align-center justify-center gap-2 text-medium-emphasis flow-end flex-shrink-0">
    <v-icon size="18">flag</v-icon>
    <span class="text-caption font-weight-medium">End of journey</span>
  </v-card>
</template>

<style scoped>
.flow-node {
  position: relative; width: 460px; background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px; overflow: hidden; transition: border-color 0.15s, box-shadow 0.15s;
}
.flow-node:hover { border-color: rgba(var(--v-theme-primary), 0.5); }
.flow-node--selected { border-color: rgb(var(--v-theme-primary)); box-shadow: 0 0 0 1px rgb(var(--v-theme-primary)); }

.flow-node__open {
  display: block; width: 100%; padding: 0; margin: 0; border: 0;
  background: transparent; text-align: left; cursor: pointer; color: inherit;
}
.flow-node__open:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 2px; border-radius: 12px; }
.flow-node__header {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 64px 10px 12px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.flow-node__heading { display: flex; flex-direction: column; min-width: 0; }
.flow-node__type { font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: rgba(var(--v-theme-on-surface), 0.55); line-height: 1.4; }
.flow-node__title { font-size: 0.875rem; font-weight: 700; color: rgb(var(--v-theme-on-surface)); line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.flow-node__meta { display: inline-flex; align-items: center; margin-top: 2px; font-size: 0.6875rem; font-weight: 600; line-height: 1.3; color: rgba(var(--v-theme-on-surface), 0.6); }
.flow-node__body { display: block; padding: 10px 14px; font-size: 0.75rem; color: rgba(var(--v-theme-on-surface), 0.65); }
.flow-node__tools { position: absolute; top: 8px; right: 8px; }
.flow-node__warn { margin-left: auto; flex-shrink: 0; }

.flow-connector { width: 2px; height: 22px; background: rgba(var(--v-border-color), 0.6); flex-shrink: 0; }
.add-btn { opacity: 0.4; transition: opacity 0.15s, transform 0.15s; }
.flow-node-wrap:hover .add-btn { opacity: 1; transform: scale(1.08); }
.add-btn:focus-visible { opacity: 1; }
.flow-end { border-style: dashed; width: 200px; }

/* ── Branch columns ─────────────────────────────────────────────────────── */
.branch-row { display: flex; align-items: stretch; }
.branch-col {
  position: relative; display: flex; flex-direction: column; align-items: center;
  padding: 0 24px;
}
.branch-col::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: rgba(var(--v-border-color), 0.6);
}
.branch-col:first-child::before { left: 50%; }
.branch-col:last-child::before { right: 50%; }
.branch-col:only-child::before { display: none; }
.branch-col--joins::after {
  content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
  background: rgba(var(--v-border-color), 0.6);
}
.branch-col--joins:first-child::after { left: 50%; }
.branch-col--joins:last-child::after { right: 50%; }
.branch-col--joins:only-child::after { display: none; }

.branch-stub { width: 2px; height: 14px; background: rgba(var(--v-border-color), 0.6); margin-bottom: 8px; flex-shrink: 0; }
.branch-drop { flex: 1 1 auto; width: 2px; min-height: 14px; background: rgba(var(--v-border-color), 0.6); margin-top: 8px; }

.branch-empty {
  display: flex; align-items: center; justify-content: center;
  width: 460px; padding: 14px;
  border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px; background: transparent; cursor: pointer;
  color: rgba(var(--v-theme-on-surface), 0.6); transition: border-color 0.15s, color 0.15s;
}
.branch-empty:hover { border-color: rgba(var(--v-theme-primary), 0.6); color: rgb(var(--v-theme-primary)); }
.branch-empty:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }
</style>
