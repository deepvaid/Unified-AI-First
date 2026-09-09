<script setup lang="ts">
import MpAlert from '@/components/MpAlert.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import type { SpecTreeNode, TemplateSpec } from './templateSpecs'

// The reference column of the templates gallery: what the page is made of, where
// the file lives, which product pages follow it, which token owns which gap.
// Data-only — every word comes from templateSpecs.ts.

defineProps<{ spec: TemplateSpec }>()
defineEmits<{ close: [] }>()

/** Flattens the tree to depth-tagged rows so the markup stays one loop. */
function flatten(nodes: SpecTreeNode[], depth = 0): { node: SpecTreeNode; depth: number }[] {
  return nodes.flatMap((node) => [
    { node, depth },
    ...(node.children ? flatten(node.children, depth + 1) : []),
  ])
}
</script>

<template>
  <aside class="tpl-spec" aria-label="Template spec">
    <header class="tpl-spec__head">
      <div class="min-width-0">
        <p class="mp-meta-label mb-1">Template spec</p>
        <h2 class="mp-section-title">{{ spec.title }}</h2>
      </div>
      <v-btn
        icon="x"
        variant="text"
        size="small"
        density="comfortable"
        aria-label="Close spec panel"
        @click="$emit('close')"
      />
    </header>

    <p class="tpl-spec__summary">{{ spec.summary }}</p>

    <section class="tpl-spec__section">
      <MpSectionHeader title="Component tree" :heading-level="3" />
      <ul class="tpl-spec__tree">
        <li
          v-for="(row, i) in flatten(spec.tree)"
          :key="i"
          class="tpl-spec__tree-row"
          :style="{ '--tpl-depth': row.depth }"
        >
          <code>{{ row.node.name }}</code>
          <span v-if="row.node.note" class="tpl-spec__note">{{ row.node.note }}</span>
        </li>
      </ul>
    </section>

    <section class="tpl-spec__section">
      <MpSectionHeader title="Source" :heading-level="3" />
      <dl class="tpl-spec__dl">
        <dt class="mp-meta-label">This file</dt>
        <dd class="mp-meta-value"><code>{{ spec.file }}</code></dd>
        <dt class="mp-meta-label">Copied from</dt>
        <dd class="mp-meta-value">
          <div v-for="path in spec.canonical" :key="path"><code>{{ path }}</code></div>
        </dd>
        <dt class="mp-meta-label">Used by</dt>
        <dd class="mp-meta-value">
          <div v-for="entry in spec.usedBy" :key="entry.path" class="tpl-spec__used">
            <code>{{ entry.path }}</code>
            <span v-if="entry.note" class="tpl-spec__note">{{ entry.note }}</span>
          </div>
          <p v-if="spec.usedByCount" class="tpl-spec__note mb-0">
            and {{ spec.usedByCount - spec.usedBy.length }} more views follow this archetype
          </p>
        </dd>
      </dl>
    </section>

    <section class="tpl-spec__section">
      <MpSectionHeader title="Spacing" :heading-level="3" />
      <dl class="tpl-spec__dl">
        <template v-for="row in spec.spacing" :key="row.token">
          <dt class="tpl-spec__token"><code>{{ row.token }}</code></dt>
          <dd class="mp-meta-value">{{ row.owns }}</dd>
        </template>
      </dl>
    </section>

    <section class="tpl-spec__section">
      <MpSectionHeader title="Rules" :heading-level="3" />
      <MpListRow
        v-for="(rule, i) in spec.rules"
        :key="i"
        variant="divided"
        density="compact"
      >
        <template #lead>
          <v-icon
            size="16"
            :class="rule.kind === 'do' ? 'text-success' : 'text-error'"
          >{{ rule.kind === 'do' ? 'check' : 'x' }}</v-icon>
        </template>
        <span class="tpl-spec__rule">{{ rule.text }}</span>
      </MpListRow>
    </section>

    <MpAlert v-if="spec.productNotes?.length" tone="info" title="In the product">
      <p v-for="(note, i) in spec.productNotes" :key="i" class="mb-0">{{ note }}</p>
    </MpAlert>
  </aside>
</template>

<style scoped lang="scss">
.tpl-spec {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-24);
  padding: var(--mp-component-card-padding);
  background: var(--surface-primary);
  color: var(--on-surface);
}

.tpl-spec__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--mp-space-8);
}

.tpl-spec__summary {
  margin: calc(-1 * var(--mp-space-16)) 0 0;
  color: var(--text-secondary);
  font-size: var(--mp-fontSize-13);
  line-height: 1.5;
}

.tpl-spec__section {
  display: flex;
  flex-direction: column;
}

/* MpSectionHeader carries its own bottom margin; the sections gap does the rest. */
.tpl-spec__tree {
  list-style: none;
  margin: 0;
  padding: 0;
}

.tpl-spec__tree-row {
  padding: var(--mp-space-4) 0;
  padding-inline-start: calc(var(--tpl-depth) * var(--mp-space-16));
}

/* The global .mp-label-value grid is built for a wide detail column; in a 360px
   docs aside the pairs stack instead. The type roles are unchanged. */
.tpl-spec__dl {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-4);
  margin: 0;
}

.tpl-spec__dl dt:not(:first-child) {
  margin-top: var(--mp-space-12);
}

.tpl-spec__dl dd {
  margin: 0;
}

.tpl-spec__token {
  font-size: var(--mp-fontSize-12);
  font-weight: 500;
  color: var(--text-primary);
}

.tpl-spec__used + .tpl-spec__used {
  margin-top: var(--mp-space-6);
}

.tpl-spec__tree-row code,
.tpl-spec__dl code {
  font-size: var(--mp-fontSize-12);
  color: var(--text-primary);
  word-break: break-word;
}

.tpl-spec__note {
  display: block;
  color: var(--text-secondary);
  font-size: var(--mp-fontSize-11);
  line-height: 1.45;
}

.tpl-spec__rule {
  font-size: var(--mp-fontSize-13);
  line-height: 1.45;
}
</style>
