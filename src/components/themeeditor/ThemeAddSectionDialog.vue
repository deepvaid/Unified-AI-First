<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MpDialog from '@/components/MpDialog.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import {
  SECTION_CATEGORIES,
  catalogGroups,
  sectionCatalog,
  type ThemeEditorSectionDef,
  type ThemeEditorVariant,
} from '@/stores/themeEditorData'

// The builder's "Add section" picker (store builder re-skin), as UAT lays it out: a two-pane
// dialog — left, the Da Vinci generator tile (locked on this plan), a search field, the category
// filter ("All (6)") and the accordion groups of section types; right, the chosen type's layout
// variants. Types without variants add on click. Composes MpDialog; every row is MpListRow.

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  add: [def: ThemeEditorSectionDef, variantId?: string]
}>()

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const search = ref('')
const category = ref<string | null>(null)
const categoriesExpanded = ref(true)
const collapsed = ref<Set<string>>(new Set())
const selected = ref<ThemeEditorSectionDef | null>(null)

const isSearching = computed(() => search.value.trim().length > 0)

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return sectionCatalog.filter((def) => !def.hidden && (def.title.toLowerCase().includes(term) || def.description.toLowerCase().includes(term)))
})

const groups = computed(() => catalogGroups(category.value ?? undefined))

function toggleGroup(group: string) {
  const next = new Set(collapsed.value)
  if (next.has(group)) next.delete(group)
  else next.add(group)
  collapsed.value = next
}

function pick(def: ThemeEditorSectionDef) {
  if (def.variants?.length) {
    selected.value = def
    return
  }
  emit('add', def)
  open.value = false
}

function pickVariant(def: ThemeEditorSectionDef, variant: ThemeEditorVariant) {
  emit('add', def, variant.id)
  open.value = false
}

watch(open, (value) => {
  if (!value) {
    search.value = ''
    category.value = null
    selected.value = null
    collapsed.value = new Set()
  }
})
</script>

<template>
  <MpDialog v-model="open" size="lg" title="Add section" flush>
    <div class="te-asd">
      <!-- LEFT: generator · search · categories · groups -->
      <div class="te-asd__left">
        <v-tooltip location="bottom" text="Upgrade to use — unlock AI-powered capabilities with Da Vinci AI. Contact Sales to upgrade.">
          <template #activator="{ props: tip }">
            <div v-bind="tip" class="te-asd__generate" aria-disabled="true">
              <MpListRow class="te-asd__generate-row">
                <template #lead>
                  <v-avatar color="primary" size="28" rounded="lg" class="flex-shrink-0">
                    <v-icon color="on-primary" size="15">sparkles</v-icon>
                  </v-avatar>
                </template>
                <span class="te-asd__generate-title">Da Vinci</span>
                <span class="te-asd__generate-sub">Generate with AI</span>
              </MpListRow>
            </div>
          </template>
        </v-tooltip>

        <div class="te-asd__search">
          <!-- Picker filter, not a form field: placeholder + aria-label keep the catalog's scroll height. -->
          <v-text-field v-model="search" placeholder="Search" aria-label="Search sections" prepend-inner-icon="search" hide-details clearable />
        </div>

        <div class="te-asd__scroll">
          <template v-if="isSearching">
            <div role="list" aria-label="Matching sections">
              <MpListRow
                v-for="def in filtered"
                :key="def.kind"
                clickable
                :title="def.title"
                class="te-asd__item"
                :class="{ 'te-asd__item--active': selected?.kind === def.kind }"
                role="listitem"
                @click="pick(def)"
              >
                <template #lead>
                  <v-icon size="15" class="te-asd__item-icon">{{ def.icon }}</v-icon>
                </template>
                <template #trailing>
                  <v-icon v-if="def.variants?.length" size="15" class="te-asd__chev">chevron-right</v-icon>
                </template>
              </MpListRow>
            </div>
            <div v-if="!filtered.length" class="te-asd__empty">No sections match “{{ search }}”.</div>
          </template>

          <template v-else>
            <span class="mp-meta-label te-asd__kicker">Sections</span>

            <!-- Category filter — the "All (6)" accordion -->
            <div class="te-asd__group">
              <button type="button" class="te-asd__group-head" :aria-expanded="categoriesExpanded" @click="categoriesExpanded = !categoriesExpanded">
                <span>All ({{ SECTION_CATEGORIES.length }})</span>
                <v-icon size="15" class="te-asd__chev">{{ categoriesExpanded ? 'chevron-up' : 'chevron-down' }}</v-icon>
              </button>
              <div v-show="categoriesExpanded" role="radiogroup" aria-label="Filter by category">
                <MpListRow
                  v-for="entry in SECTION_CATEGORIES"
                  :key="entry"
                  clickable
                  density="compact"
                  :title="entry"
                  class="te-asd__item te-asd__item--category"
                  :class="{ 'te-asd__item--active': category === entry }"
                  role="radio"
                  :aria-checked="category === entry"
                  @click="category = category === entry ? null : entry"
                />
              </div>
            </div>

            <!-- Section groups -->
            <div v-for="entry in groups" :key="entry.group" class="te-asd__group">
              <button type="button" class="te-asd__group-head" :aria-expanded="!collapsed.has(entry.group)" @click="toggleGroup(entry.group)">
                <span>{{ entry.group }} ({{ entry.defs.length }})</span>
                <v-icon size="15" class="te-asd__chev">{{ collapsed.has(entry.group) ? 'chevron-down' : 'chevron-up' }}</v-icon>
              </button>
              <div v-show="!collapsed.has(entry.group)" role="list">
                <MpListRow
                  v-for="def in entry.defs"
                  :key="def.kind"
                  clickable
                  density="compact"
                  :title="def.title"
                  class="te-asd__item"
                  :class="{ 'te-asd__item--active': selected?.kind === def.kind }"
                  role="listitem"
                  @click="pick(def)"
                >
                  <template #trailing>
                    <v-icon v-if="def.variants?.length" size="15" class="te-asd__chev">chevron-right</v-icon>
                  </template>
                </MpListRow>
              </div>
            </div>
            <div v-if="!groups.length" class="te-asd__empty">No sections in this category.</div>
          </template>
        </div>
      </div>

      <!-- RIGHT: layout variants -->
      <div class="te-asd__right">
        <template v-if="selected?.variants?.length">
          <MpFormSection :title="selected.title" :description="selected.description" />
          <div class="te-asd__variants">
            <MpOptionCard
              v-for="variant in selected.variants"
              :key="variant.id"
              :title="variant.label"
              :description="variant.description"
              :selected="false"
              :heading-level="3"
              @click="pickVariant(selected, variant)"
            >
              <template #media>
                <span class="te-asd__schematic" :class="`te-asd__schematic--${variant.id}`" aria-hidden="true">
                  <span v-for="n in (variant.id === 'slider' || variant.id === 'carousel' ? 5 : 3)" :key="n" class="te-asd__tile" />
                </span>
              </template>
            </MpOptionCard>
          </div>
        </template>

        <div v-else class="te-asd__placeholder">
          <v-icon size="28" class="te-asd__placeholder-icon">layout-template</v-icon>
          <div class="text-body-2 font-weight-medium">Select a section to see layout options</div>
          <div class="text-caption text-medium-emphasis">Sections with layouts show them here. Others add on click.</div>
        </div>
      </div>
    </div>
  </MpDialog>
</template>

<style scoped>
/* MpDialog owns the frame; the body is a fixed-height two-pane split (a viewport measure). */
.te-asd {
  display: flex;
  height: 520px;
  min-height: 0;
}

.te-asd__left {
  display: flex;
  flex-direction: column;
  width: var(--mp-component-toolbar-searchWidth);
  flex-shrink: 0;
  min-height: 0;
  border-right: 1px solid var(--border-subtle);
}

/* Da Vinci tile — the accent-tinted affordance, locked on this plan (tooltip explains). */
.te-asd__generate {
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--accent-subtle-bg);
  opacity: 0.6;
  cursor: not-allowed;
}

.te-asd__generate-row {
  padding-inline: var(--mp-component-listItem-paddingInline);
}

.te-asd__generate-title {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-bold);
  color: var(--accent-on-container);
}

.te-asd__generate-sub {
  font-size: var(--mp-fontSize-11);
  color: var(--text-secondary);
}

.te-asd__search {
  flex-shrink: 0;
  padding: var(--mp-space-12) var(--mp-space-12) var(--mp-space-8);
}

.te-asd__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 0 var(--mp-space-12) var(--mp-space-12);
}

.te-asd__kicker {
  display: block;
  padding: var(--mp-space-8) var(--mp-component-listItem-paddingInline) var(--mp-space-4);
  color: var(--text-muted);
}

.te-asd__group + .te-asd__group {
  margin-block-start: var(--mp-space-8);
}

.te-asd__group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: var(--mp-space-32);
  padding: var(--mp-space-4) var(--mp-component-listItem-paddingInline);
  border: 0;
  border-radius: var(--mp-component-nav-itemRadius);
  background: transparent;
  color: var(--text-primary);
  font: inherit;
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  cursor: pointer;
  text-align: left;
}

.te-asd__group-head:hover {
  background: var(--surface-secondary);
}

.te-asd__group-head:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: -2px;
}

.te-asd__item {
  margin-inline: 0;
  padding-inline: var(--mp-component-listItem-paddingInline);
  border-radius: var(--mp-component-nav-itemRadius);
}

.te-asd__item--active {
  background: var(--accent-selected-bg);
  color: var(--accent-on-container);
}

.te-asd__item-icon,
.te-asd__chev {
  color: var(--icon-secondary);
}

.te-asd__empty {
  padding: var(--mp-space-16) var(--mp-component-listItem-paddingInline);
  font-size: var(--mp-fontSize-12);
  color: var(--text-muted);
}

/* Right pane — the variant gallery on the sunken surface. */
.te-asd__right {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-field-groupGap);
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: var(--mp-space-16) var(--mp-space-20);
  background: var(--surface-canvas);
}

.te-asd__variants {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--mp-component-card-gridMin), 1fr));
  gap: var(--mp-space-16);
}

/* Layout schematic: tiles in a row (grid) or a strip that runs off the edge (slider/carousel). */
.te-asd__schematic {
  display: flex;
  gap: var(--mp-space-6);
  min-height: calc(var(--mp-space-40) * 2);
  padding: var(--mp-space-12);
  border-radius: var(--mp-component-chip-radius);
  background: var(--surface-secondary);
  overflow: hidden;
}

.te-asd__tile {
  flex: 1 0 calc(33% - var(--mp-space-6));
  border-radius: var(--mp-radius-4);
  background: var(--accent-container);
}

.te-asd__schematic--slider .te-asd__tile,
.te-asd__schematic--carousel .te-asd__tile {
  flex: 0 0 38%;
}

.te-asd__schematic--with-cta .te-asd__tile:first-child,
.te-asd__schematic--standard .te-asd__tile:first-child {
  flex: 1 0 100%;
}

.te-asd__schematic--with-cta .te-asd__tile:not(:first-child),
.te-asd__schematic--standard .te-asd__tile:not(:first-child) {
  display: none;
}

.te-asd__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--mp-space-4);
  flex: 1 1 auto;
  text-align: center;
  color: var(--text-secondary);
}

.te-asd__placeholder-icon {
  color: var(--icon-secondary);
  margin-block-end: var(--mp-space-8);
}
</style>
