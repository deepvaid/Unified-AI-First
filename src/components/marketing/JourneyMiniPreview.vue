<script setup lang="ts">
import { computed } from 'vue'
import type { FlowNode, NodeCategory } from '@/stores/journeyFlowData'
import { buildSegments, type FlowSegment } from '@/composables/useFlowTree'
import { branchChipColor, categoryColor } from './flowTheme'

// Read-only miniature of a journey flow — a scaled-down reading of the builder
// canvas: surface cards with a category-tinted icon disc, hairline connectors
// with rounded elbows, and outcome-coloured branch labels. Pass `nodes` at the
// root; recursive branch columns pass `segments` directly.
const props = defineProps<{
  nodes?: FlowNode[]
  segments?: FlowSegment[]
}>()

const segs = computed(() => props.segments ?? buildSegments(props.nodes ?? []))

// The category colour lives on the icon disc only; the title sits on the card
// surface in --text-primary, so contrast never depends on the category hue.
// 'end' has no theme CSS var → neutral mix.
const discStyle = (c: NodeCategory) => c === 'end'
  ? {
      backgroundColor: 'rgba(var(--v-theme-on-surface), 0.08)',
      color: 'rgba(var(--v-theme-on-surface), 0.6)',
    }
  : {
      backgroundColor: `rgba(var(--v-theme-${categoryColor[c]}), 0.14)`,
      color: `rgb(var(--v-theme-${categoryColor[c]}))`,
    }

const labelStyle = (label: string) => {
  const color = branchChipColor(label)
  return {
    backgroundColor: `rgba(var(--v-theme-${color}), 0.12)`,
    color: `rgb(var(--v-theme-${color}))`,
  }
}
</script>

<template>
  <div class="mini-col">
    <template v-for="seg in segs" :key="seg.node.id">
      <div class="mini-node" :class="{ 'mini-node--end': seg.node.category === 'end' }">
        <span class="mini-node__disc" :style="discStyle(seg.node.category)">
          <v-icon size="12">{{ seg.node.icon }}</v-icon>
        </span>
        <span class="mini-node__title">{{ seg.node.title }}</span>
      </div>
      <div v-if="!seg.branches && seg.node.children[0]" class="mini-line"></div>

      <template v-if="seg.branches">
        <div class="mini-line mini-line--short"></div>
        <div class="mini-branches">
          <div v-for="(b, i) in seg.branches" :key="i" class="mini-branch"
            :class="{ 'mini-branch--joins': !!seg.joinId }">
            <div class="mini-branch__stub"></div>
            <span class="mini-branch__label" :style="labelStyle(b.label)">{{ b.label }}</span>
            <template v-if="!b.empty">
              <div class="mini-line mini-line--short"></div>
              <JourneyMiniPreview :segments="b.segments" />
            </template>
            <span v-else class="mini-branch__empty" aria-label="Empty branch">·</span>
            <div v-if="seg.joinId" class="mini-drop"></div>
          </div>
        </div>
        <div v-if="seg.joinId" class="mini-line"></div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.mini-col {
  --mini-rail: var(--border-default);
  --mini-rail-width: 2px;
  --mini-elbow: var(--mp-radius-8);
  display: flex; flex-direction: column; align-items: center; min-width: 0;
}

/* Node card — a surface tile, hairline border, tinted icon disc, primary-ink title. */
.mini-node {
  display: inline-flex; align-items: center; gap: var(--mp-space-6);
  max-width: 180px;
  padding: var(--mp-space-4) var(--mp-space-10) var(--mp-space-4) var(--mp-space-4);
  border-radius: var(--mp-radius-8);
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--border-default);
  box-shadow: var(--mp-shadow-sm);
}
.mini-node--end {
  background: transparent;
  box-shadow: none;
  border-style: dashed;
}
.mini-node__disc {
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 22px; height: 22px; border-radius: var(--mp-radius-4);
}
.mini-node__title {
  font-size: var(--mp-fontSize-11); font-weight: 600; line-height: 1.3;
  color: var(--text-primary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.mini-node--end .mini-node__title { color: var(--text-secondary); }

/* Connectors */
.mini-line { width: var(--mini-rail-width); height: var(--mp-space-14); background: var(--mini-rail); flex-shrink: 0; }
.mini-line--short { height: var(--mp-space-8); }

/* Branch rails: rounded elbows on the outer columns, a straight bar across the middle ones. */
.mini-branches { display: flex; align-items: stretch; }
.mini-branch {
  position: relative; display: flex; flex-direction: column; align-items: center;
  padding: 0 var(--mp-space-8);
}
.mini-branch__stub { width: var(--mini-rail-width); height: var(--mp-space-10); background: var(--mini-rail); }
.mini-branch::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: var(--mp-space-10);
  border-top: var(--mini-rail-width) solid var(--mini-rail);
  pointer-events: none;
}
.mini-branch:first-child::before {
  left: 50%; border-left: var(--mini-rail-width) solid var(--mini-rail);
  border-top-left-radius: var(--mini-elbow);
}
.mini-branch:last-child::before {
  right: 50%; border-right: var(--mini-rail-width) solid var(--mini-rail);
  border-top-right-radius: var(--mini-elbow);
}
.mini-branch:first-child .mini-branch__stub,
.mini-branch:last-child .mini-branch__stub { visibility: hidden; }
.mini-branch:only-child::before { display: none; }
.mini-branch:only-child .mini-branch__stub { visibility: visible; }

.mini-branch--joins::after {
  content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: var(--mp-space-10);
  border-bottom: var(--mini-rail-width) solid var(--mini-rail);
  pointer-events: none;
}
.mini-branch--joins:first-child::after {
  left: 50%; border-left: var(--mini-rail-width) solid var(--mini-rail);
  border-bottom-left-radius: var(--mini-elbow);
}
.mini-branch--joins:last-child::after {
  right: 50%; border-right: var(--mini-rail-width) solid var(--mini-rail);
  border-bottom-right-radius: var(--mini-elbow);
}
.mini-branch--joins:first-child .mini-drop,
.mini-branch--joins:last-child .mini-drop { visibility: hidden; }

.mini-branch__label {
  font-size: var(--mp-fontSize-10); font-weight: 700; letter-spacing: 0.06em; line-height: 1;
  padding: var(--mp-space-2) var(--mp-space-6); border-radius: var(--mp-radius-4);
  white-space: nowrap; text-transform: uppercase;
}
.mini-branch__empty { font-size: var(--mp-fontSize-11); color: var(--text-secondary); padding: var(--mp-space-2) 0; }
.mini-drop {
  flex: 1 1 auto; width: var(--mini-rail-width); min-height: var(--mp-space-8);
  background: var(--mini-rail); margin-top: var(--mp-space-4);
}
</style>
