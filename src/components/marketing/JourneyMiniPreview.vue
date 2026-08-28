<script setup lang="ts">
import { computed } from 'vue'
import type { FlowNode, NodeCategory } from '@/stores/journeyFlowData'
import { buildSegments, type FlowSegment } from '@/composables/useFlowTree'
import { categoryColor } from './flowTheme'

// Read-only miniature of a journey flow. Pass `nodes` at the root; recursive
// branch columns pass `segments` directly.
const props = defineProps<{
  nodes?: FlowNode[]
  segments?: FlowSegment[]
}>()

const segs = computed(() => props.segments ?? buildSegments(props.nodes ?? []))

// 'end' has no theme CSS var (grey-darken-1 is a Material class name) → neutral mix.
const pillStyle = (c: NodeCategory) => c === 'end'
  ? {
      backgroundColor: 'rgba(var(--v-theme-on-surface), 0.08)',
      color: 'rgba(var(--v-theme-on-surface), 0.65)',
    }
  : {
      backgroundColor: `rgba(var(--v-theme-${categoryColor[c]}), 0.12)`,
      color: `rgb(var(--v-theme-${categoryColor[c]}))`,
    }
</script>

<template>
  <div class="mini-col">
    <template v-for="seg in segs" :key="seg.node.id">
      <div class="mini-pill" :style="pillStyle(seg.node.category)">
        <v-icon size="11" class="flex-shrink-0">{{ seg.node.icon }}</v-icon>
        <span class="mini-pill__title">{{ seg.node.title }}</span>
      </div>
      <div v-if="!seg.branches && seg.node.children[0]" class="mini-line"></div>

      <div v-if="seg.branches" class="mini-branches">
        <div v-for="(b, i) in seg.branches" :key="i" class="mini-branch"
          :class="{ 'mini-branch--joins': !!seg.joinId }">
          <span class="mini-branch__label">{{ b.label }}</span>
          <template v-if="!b.empty">
            <div class="mini-line"></div>
            <JourneyMiniPreview :segments="b.segments" />
          </template>
          <span v-else class="mini-branch__empty">·</span>
          <div v-if="seg.joinId" class="mini-drop"></div>
        </div>
      </div>
      <div v-if="seg.branches && seg.joinId" class="mini-line"></div>
    </template>
  </div>
</template>

<style scoped>
.mini-col { display: flex; flex-direction: column; align-items: center; min-width: 0; }

.mini-pill {
  display: inline-flex; align-items: center; gap: 5px;
  max-width: 150px; padding: 3px 9px; border-radius: 999px;
  font-size: 0.625rem; font-weight: 700; line-height: 1.4;
}
.mini-pill__title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.mini-line { width: 1.5px; height: 9px; background: rgba(var(--v-border-color), 0.7); flex-shrink: 0; }

.mini-branches { display: flex; align-items: stretch; }
.mini-branch {
  position: relative; display: flex; flex-direction: column; align-items: center;
  padding: var(--mp-space-8) var(--mp-space-8) 0;
}
.mini-branch::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1.5px;
  background: rgba(var(--v-border-color), 0.7);
}
.mini-branch:first-child::before { left: 50%; }
.mini-branch:last-child::before { right: 50%; }
.mini-branch:only-child::before { display: none; }
.mini-branch--joins::after {
  content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1.5px;
  background: rgba(var(--v-border-color), 0.7);
}
.mini-branch--joins:first-child::after { left: 50%; }
.mini-branch--joins:last-child::after { right: 50%; }

.mini-branch__label {
  font-size: 0.5rem; font-weight: 800; letter-spacing: 0.06em;
  color: rgba(var(--v-theme-on-surface), 0.55); margin-bottom: 3px; white-space: nowrap;
}
.mini-branch__empty { font-size: 0.625rem; color: rgba(var(--v-theme-on-surface), 0.4); padding: 2px 0; }
.mini-drop { flex: 1 1 auto; width: 1.5px; min-height: 6px; background: rgba(var(--v-border-color), 0.7); margin-top: 4px; }
</style>
