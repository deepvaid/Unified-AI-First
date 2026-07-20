<script setup lang="ts">
// In-app design-system hub: the token foundations (ported from the standalone
// design-kit app) and the leadership-facing docs (FAQ crib sheet + operating
// model, rendered from docs/design-system/*.md), with the docs-grounded
// Da Vinci assistant (DvDocsAssistant) alongside. The markdown is
// repo-authored (trusted), so rendering via marked + v-html is safe here.
import { computed, defineAsyncComponent, ref } from 'vue'
import { marked } from 'marked'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import DvDocsAssistant from '@/components/copilot/DvDocsAssistant.vue'
import faqRaw from '../../../docs/design-system/showcase-faq-crib-sheet.md?raw'
import operatingModelRaw from '../../../docs/design-system/operating-model.md?raw'

const tabs = [
  { label: 'FAQ', key: 'faq' },
  { label: 'Operating model', key: 'operating-model' },
  { label: 'Colors', key: 'colors' },
  { label: 'Typography', key: 'typography' },
  { label: 'Spacing', key: 'spacing' },
]

const activeTab = ref('faq')

const DOC_TABS: Record<string, string> = {
  faq: faqRaw,
  'operating-model': operatingModelRaw,
}

const sectionComponents: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  colors: defineAsyncComponent(() => import('./sections/Colors.vue')),
  typography: defineAsyncComponent(() => import('./sections/Typography.vue')),
  spacing: defineAsyncComponent(() => import('./sections/Spacing.vue')),
}

const activeDocRaw = computed(() => DOC_TABS[activeTab.value] ?? null)
const activeSection = computed(() => sectionComponents[activeTab.value] ?? null)

const docHtml = computed(() =>
  activeDocRaw.value === null ? '' : marked.parse(activeDocRaw.value, { async: false }),
)
</script>

<template>
  <div class="d-flex flex-column gap-5">
    <MpPageHeader
      title="Design system"
      subtitle="Docs, token foundations, and a Da Vinci that knows them all"
      back-to="/accounts/2000290/design-system"
    >
      <template #tabs>
        <MpFilterTabs v-model="activeTab" :tabs="tabs" aria-label="Design system documents" controls-id="ds-doc" />
      </template>
    </MpPageHeader>

    <v-row>
      <v-col cols="12" md="8">
        <v-card flat border rounded="lg" class="pa-6 pa-md-8">
          <component :is="activeSection" v-if="activeSection" id="ds-doc" />
          <!-- eslint-disable-next-line vue/no-v-html — repo-authored markdown, not user content -->
          <article v-else id="ds-doc" class="ds-prose" v-html="docHtml" />
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <div class="ds-docs-rail">
          <DvDocsAssistant class="ds-docs-rail__chat" />
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.ds-docs-rail {
  position: sticky;
  top: 76px;
}

.ds-docs-rail__chat {
  height: calc(100vh - 120px);
  max-height: 720px;
}

/* Readable typography for the rendered markdown. */
.ds-prose {
  max-width: 72ch;
  font-size: 0.9375rem;
  line-height: 1.65;
  color: rgb(var(--v-theme-on-surface));
}

.ds-prose :deep(h1) {
  font-size: 1.5rem;
  line-height: 1.3;
  margin-bottom: 0.75em;
}

.ds-prose :deep(h2) {
  font-size: 1.125rem;
  margin: 1.75em 0 0.6em;
  padding-top: 0.75em;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.ds-prose :deep(h3) {
  font-size: 1rem;
  margin: 1.5em 0 0.5em;
}

.ds-prose :deep(p) {
  margin-bottom: 0.9em;
}

.ds-prose :deep(blockquote) {
  border-left: 3px solid var(--dv-accent, rgb(var(--v-theme-primary)));
  background: var(--dv-accent-soft, rgba(var(--v-theme-primary), 0.06));
  border-radius: 0 8px 8px 0;
  padding: 10px 16px;
  margin: 0 0 0.9em;
}

.ds-prose :deep(blockquote p:last-child) {
  margin-bottom: 0;
}

.ds-prose :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0 0 1em;
  font-size: 0.875rem;
}

.ds-prose :deep(th),
.ds-prose :deep(td) {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding: 8px 10px;
  text-align: left;
  vertical-align: top;
}

.ds-prose :deep(th) {
  background: rgb(var(--v-theme-surface-variant, var(--v-theme-surface)));
  font-weight: 600;
}

.ds-prose :deep(code) {
  font-size: 0.85em;
  background: rgba(var(--v-border-color), calc(var(--v-border-opacity) * 2));
  border-radius: 4px;
  padding: 0.1em 0.35em;
}

.ds-prose :deep(hr) {
  border: none;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  margin: 1.5em 0;
}

.ds-prose :deep(ul),
.ds-prose :deep(ol) {
  padding-left: 1.4em;
  margin-bottom: 0.9em;
}

.ds-prose :deep(a) {
  color: rgb(var(--v-theme-primary));
}
</style>
