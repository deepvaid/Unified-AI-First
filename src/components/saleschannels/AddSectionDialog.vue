<script setup lang="ts">
import MpDialog from '@/components/MpDialog.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpListRow from '@/components/MpListRow.vue'
import { computed, ref, watch } from 'vue'
import {
  sectionCatalog,
  sectionCategories,
  type ThemeSectionDef,
  type ThemeSectionVariant,
} from '@/stores/themeBuilderData'

const props = defineProps<{
  /** Dialog open state (v-model). */
  modelValue: boolean
  /** True when a unique kind is already present on the active template. */
  isKindDisabled: (def: ThemeSectionDef) => boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  /** Add a no-variant kind immediately (click), then close. */
  add: [def: ThemeSectionDef]
  /** Add a variant-bearing kind with the chosen variant, then close. */
  addVariant: [def: ThemeSectionDef, variantId: string]
  /** Open the Da Vinci generator (closes the dialog). */
  generate: []
}>()

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// ── Search ────────────────────────────────────────────────────────────────────
const search = ref('')

const filtered = computed<ThemeSectionDef[]>(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return sectionCatalog
  return sectionCatalog.filter(
    (def) => def.title.toLowerCase().includes(q) || def.description.toLowerCase().includes(q),
  )
})

const isSearching = computed(() => search.value.trim().length > 0)

// ── Grouping (collapsible categories) ──────────────────────────────────────────
const groups = computed(() =>
  sectionCategories
    .map((category) => ({
      category,
      defs: sectionCatalog.filter((def) => def.category === category),
    }))
    .filter((group) => group.defs.length > 0),
)

// Collapsed categories (default: all expanded).
const collapsed = ref<Set<string>>(new Set())
function toggleCategory(category: string) {
  const next = new Set(collapsed.value)
  if (next.has(category)) next.delete(category)
  else next.add(category)
  collapsed.value = next
}

// ── Right pane: selected variant-bearing kind ──────────────────────────────────
const selectedDef = ref<ThemeSectionDef | null>(null)

function onItemClick(def: ThemeSectionDef) {
  if (props.isKindDisabled(def)) return
  if (def.variants && def.variants.length > 0) {
    // Variant-bearing kind: reveal its variants in the right pane, don't add yet.
    selectedDef.value = def
    return
  }
  // No-variant kind: add immediately and close.
  emit('add', def)
}

function pickVariant(def: ThemeSectionDef, variant: ThemeSectionVariant) {
  emit('addVariant', def, variant.id)
}

function onGenerate() {
  emit('generate')
}

// Reset picker state whenever the dialog closes so it reopens clean.
watch(open, (value) => {
  if (!value) {
    search.value = ''
    selectedDef.value = null
    collapsed.value = new Set()
  }
})

</script>

<template>
  <!-- Composes MpDialog (P4-6). This dialog carried five different micro-insets
       of its own (12x14 · 8x8 · 6x8 · 8 · 6px gaps); the shell owns the frame and
       every repeating row is MpListRow, so there are two insets left: the row
       inset (component.listItem.*) and the variant tile. -->
  <MpDialog v-model="open" size="md" title="Add section" flush class="asd-dialog">
      <div class="asd-body d-flex">
        <!-- LEFT: generate + search + grouped catalog -->
        <div class="asd-left border-r d-flex flex-column">
          <MpListRow clickable class="tb-generate-row flex-shrink-0" @click="onGenerate">
            <template #lead>
              <v-avatar color="primary" size="28" rounded="lg" class="flex-shrink-0">
                <v-icon color="on-primary" size="15">sparkles</v-icon>
              </v-avatar>
            </template>
            <span class="tb-generate-row__title text-primary">Generate with AI</span>
            <span class="tb-generate-row__sub">Describe it — Da Vinci builds the section</span>
            <template #trailing>
              <v-icon size="16" class="tb-generate-row__chev">chevron-right</v-icon>
            </template>
          </MpListRow>

          <div class="pa-3 pb-2 flex-shrink-0">
            <!-- Picker filter, not a form field: compact and detail-free on
                 purpose so the catalog below keeps its scroll height. -->
            <v-text-field
              v-model="search"
              label="Search sections"
              prepend-inner-icon="search"
              density="compact"
              hide-details
              clearable
            ></v-text-field>
          </div>

          <div class="asd-left__scroll flex-grow-1 overflow-y-auto px-2 pb-2">
            <!-- Flat filtered list while searching -->
            <template v-if="isSearching">
              <MpListRow
                v-for="def in filtered"
                :key="def.kind"
                clickable
                :title="def.title"
                class="asd-item"
                :class="{ 'asd-item--disabled': isKindDisabled(def), 'asd-item--active': selectedDef?.kind === def.kind }"
                :disabled="isKindDisabled(def)"
                @click="onItemClick(def)"
              >
                <template #lead>
                  <v-avatar color="primary" variant="tonal" size="28" rounded="lg" class="flex-shrink-0">
                    <v-icon size="15">{{ def.icon }}</v-icon>
                  </v-avatar>
                </template>
                <template #trailing>
                  <span v-if="isKindDisabled(def)" class="asd-item__hint">Already added</span>
                  <v-icon v-else-if="def.variants?.length" size="15" class="asd-item__chev">chevron-right</v-icon>
                </template>
              </MpListRow>
              <div v-if="!filtered.length" class="text-caption text-medium-emphasis text-center pa-4">
                No sections match “{{ search }}”.
              </div>
            </template>

            <!-- Grouped, collapsible categories otherwise -->
            <template v-else>
              <div v-for="group in groups" :key="group.category" class="asd-group">
                <button
                  class="asd-cat"
                  :aria-expanded="!collapsed.has(group.category)"
                  @click="toggleCategory(group.category)"
                >
                  <v-icon size="15" class="asd-cat__chev" :class="{ 'asd-cat__chev--open': !collapsed.has(group.category) }">
                    chevron-right
                  </v-icon>
                  <span class="asd-cat__label">{{ group.category }} ({{ group.defs.length }})</span>
                </button>
                <div v-show="!collapsed.has(group.category)">
                  <MpListRow
                    v-for="def in group.defs"
                    :key="def.kind"
                    clickable
                    :title="def.title"
                    class="asd-item"
                    :class="{ 'asd-item--disabled': isKindDisabled(def), 'asd-item--active': selectedDef?.kind === def.kind }"
                    :disabled="isKindDisabled(def)"
                    @click="onItemClick(def)"
                  >
                    <template #lead>
                      <v-avatar color="primary" variant="tonal" size="28" rounded="lg" class="flex-shrink-0">
                        <v-icon size="15">{{ def.icon }}</v-icon>
                      </v-avatar>
                    </template>
                    <template #trailing>
                      <span v-if="isKindDisabled(def)" class="asd-item__hint">Already added</span>
                      <v-icon v-else-if="def.variants?.length" size="15" class="asd-item__chev">chevron-right</v-icon>
                    </template>
                  </MpListRow>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- RIGHT: variant cards or empty state -->
        <div class="asd-right flex-grow-1 overflow-y-auto pa-4">
          <template v-if="selectedDef && selectedDef.variants?.length">
            <MpFormSection :title="selectedDef.title" description="Pick a layout to add." />
            <div class="asd-variants">
              <button
                v-for="variant in selectedDef.variants"
                :key="variant.id"
                class="asd-variant"
                :aria-label="`${selectedDef.title}: ${variant.label}`"
                @click="pickVariant(selectedDef, variant)"
              >
                <span class="asd-schematic" :class="`asd-schematic--${selectedDef.kind}-${variant.id}`" aria-hidden="true">
                  <!-- Layout schematic: simple boxes/lines suggesting the layout -->
                  <template v-if="selectedDef.kind === 'hero'">
                    <span class="s-fill s-hero" :class="`s-hero--${variant.id}`">
                      <span class="s-line s-line--lg"></span>
                      <span class="s-line s-line--sm"></span>
                      <span class="s-pill"></span>
                    </span>
                  </template>
                  <template v-else-if="selectedDef.kind === 'image-banner'">
                    <span class="s-fill s-banner" :class="`s-banner--${variant.id}`">
                      <span class="s-line s-line--md"></span>
                      <span class="s-pill"></span>
                    </span>
                  </template>
                  <template v-else-if="selectedDef.kind === 'collection-grid'">
                    <span class="s-grid" :style="{ '--cols': String(variant.preset.columns ?? 3) }">
                      <span v-for="n in Number(variant.preset.columns ?? 3)" :key="n" class="s-tile"></span>
                    </span>
                  </template>
                  <template v-else-if="selectedDef.kind === 'featured-products'">
                    <span class="s-featured" :class="`s-featured--${variant.id}`">
                      <span v-for="n in 3" :key="n" class="s-card"></span>
                    </span>
                  </template>
                  <template v-else-if="selectedDef.kind === 'testimonials'">
                    <span class="s-testi" :class="`s-testi--${variant.id}`">
                      <span v-for="n in (variant.id === 'single' ? 1 : 3)" :key="n" class="s-quote">
                        <span class="s-line s-line--sm"></span>
                        <span class="s-line s-line--xs"></span>
                      </span>
                    </span>
                  </template>
                  <template v-else>
                    <span class="s-fill"></span>
                  </template>
                </span>
                <span class="asd-variant__label">{{ variant.label }}</span>
                <span v-if="variant.description" class="asd-variant__desc">{{ variant.description }}</span>
              </button>
            </div>
          </template>

          <div v-else class="asd-empty d-flex flex-column align-center justify-center text-center">
            <v-icon size="28" class="asd-empty__icon">layout-template</v-icon>
            <div class="text-body-2 font-weight-medium">Select a section to see layout options</div>
            <div class="text-caption text-medium-emphasis">
              Sections with layouts show them here. Others add on click.
            </div>
          </div>
        </div>
      </div>
  </MpDialog>
</template>

<style scoped>
/* MpDialog owns the frame; this dialog's body is a fixed-height two-pane split.
   440px is a viewport measure for the pane, not a spacing step. */
.asd-body { min-height: 0; height: 440px; }

/* The two panes are edge-to-edge inside the shell — the split's own borders do
   the framing, so the shell's inset would double it. That is the shell's `flush`
   prop now, not a :deep() reach into MpDialog's internals (P6-6). */

.border-b { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.border-r { border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }

.asd-left { width: var(--mp-component-toolbar-searchWidth); flex-shrink: 0; min-height: 0; }
.asd-left__scroll { min-height: 0; }

/* The list owns the space between category groups; each group used to carry its
   own `mb-1`. */
.asd-group + .asd-group { margin-block-start: var(--mp-space-4); }

/* The pane owns the rhythm between its heading and the tile grid. */
.asd-right {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-field-groupGap);
  background: rgba(var(--v-theme-on-surface), 0.02);
}

/* ── Generate-with-AI row ─────────────────────────────────────────────── */
/* An MpListRow now: height, inline inset, gap and hover all come from the row
   primitive. Only the accent tint that marks it as the AI affordance is local. */
.tb-generate-row {
  padding-inline: var(--mp-component-listItem-paddingInline);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-primary), 0.06);
}
.tb-generate-row:hover { background: rgba(var(--v-theme-primary), 0.1); }
.tb-generate-row:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: -2px; }
.tb-generate-row__title {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-bold);
}
.tb-generate-row__sub {
  font-size: var(--mp-fontSize-11);
  color: rgba(var(--v-theme-on-surface), 0.6);
  line-height: 1.3;
}
.tb-generate-row__chev { color: rgb(var(--v-theme-primary)); flex-shrink: 0; }

/* ── Category headers ────────────────────────────────────────────────── */
/* Not a list row — a disclosure header — so it stays hand-rolled, but on the
   same listItem inset as the rows it groups, at the compact tier. */
.asd-cat {
  display: flex;
  align-items: center;
  gap: var(--mp-space-6);
  width: 100%;
  padding: var(--mp-space-8) var(--mp-component-listItem-paddingInline);
  border: 0;
  background: transparent;
  cursor: pointer;
  border-radius: var(--mp-component-nav-itemRadius);
  text-align: left;
  color: var(--muted);
}
.asd-cat:hover { background: var(--surface-secondary); }
.asd-cat:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: -2px; }
.asd-cat__chev { transition: transform 0.15s; color: var(--muted); }
.asd-cat__chev--open { transform: rotate(90deg); }
.asd-cat__label {
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-bold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* ── Section items ───────────────────────────────────────────────────── */
/* MpListRow supplies height, inset, gap, hover and focus. Selection tint and the
   disabled wash are the only things this list actually adds. */
.asd-item {
  padding-inline: var(--mp-component-listItem-paddingInline);
  border-radius: var(--mp-component-nav-itemRadius);
}
.asd-item--active,
.asd-item--active:hover { background: var(--accent-soft); }
.asd-item--disabled { opacity: 0.5; cursor: default; }
.asd-item--disabled:hover { background: transparent; }
.asd-item__hint {
  flex-shrink: 0;
  font-size: var(--mp-fontSize-11);
  color: var(--muted);
}
.asd-item__chev { flex-shrink: 0; color: var(--muted); }

/* ── Right pane empty state ──────────────────────────────────────────── */
.asd-empty {
  height: 100%;
  gap: var(--mp-component-state-gap);
  padding: var(--mp-component-state-padding);
}
.asd-empty__icon { color: rgba(var(--v-theme-on-surface), 0.3); }

/* ── Variant cards ───────────────────────────────────────────────────── */
/* A media-thumbnail grid, not a list — deliberately NOT MpOptionCard: that
   card's inset (card.padding, 20) is designed for a full-width wizard tile and
   would leave ~80px of content in a 120px thumbnail. This is the second of the
   two insets P4-6 asked for, and it is the compact card tier. */
.asd-variants {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--mp-component-card-paddingCompact);
}
.asd-variant {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-6);
  padding: var(--mp-component-card-gapCompact);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-12);
  background: var(--surface-primary);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.asd-variant:hover { border-color: var(--accent); }
.asd-variant:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }
.asd-variant__label { font-size: var(--mp-fontSize-12); font-weight: var(--mp-fontWeight-bold); }
.asd-variant__desc { font-size: var(--mp-fontSize-11); color: rgba(var(--v-theme-on-surface), 0.6); line-height: 1.3; }

/* ── Schematic mini-mocks (dark tonal surface, token fills) ──────────── */
/* Everything below draws a miniature of a storefront layout. Its dimensions are
   illustration geometry, not Marobase spacing — the same exemption chart-canvas
   geometry carries (Phase 2/3 changelog). Left on raw values deliberately. */
.asd-schematic {
  display: block;
  aspect-ratio: 16 / 10;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.85);
  padding: 8px;
  overflow: hidden;
}
.s-fill {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  background: rgba(var(--v-theme-surface), 0.14);
  padding: 8px;
}
.s-line {
  display: block;
  height: 5px;
  border-radius: 3px;
  background: rgba(var(--v-theme-surface), 0.85);
}
.s-line--lg { width: 70%; }
.s-line--md { width: 55%; }
.s-line--sm { width: 45%; }
.s-line--xs { width: 30%; }
.s-pill {
  display: block;
  width: 34px;
  height: 9px;
  border-radius: 999px;
  background: rgb(var(--v-theme-primary));
}

/* Hero variants: alignment + split */
.s-hero { align-items: flex-start; }
.s-hero--minimal { align-items: center; }
.s-hero--split {
  align-items: flex-start;
  background:
    linear-gradient(to right, rgba(var(--v-theme-surface), 0.14) 55%, rgba(var(--v-theme-primary), 0.35) 55%);
}

/* Image banner */
.s-banner { align-items: flex-start; justify-content: flex-end; }
.s-banner--full-cta { padding: 4px; }

/* Collection grid */
.s-grid {
  display: grid;
  grid-template-columns: repeat(var(--cols, 3), 1fr);
  gap: 5px;
  width: 100%;
  height: 100%;
}
.s-tile { border-radius: 4px; background: rgba(var(--v-theme-surface), 0.7); }

/* Featured products */
.s-featured { display: flex; gap: 5px; width: 100%; height: 100%; }
.s-featured--carousel { overflow: hidden; }
.s-card { flex: 1; border-radius: 4px; background: rgba(var(--v-theme-surface), 0.7); }
.s-featured--carousel .s-card:last-child { flex: 0 0 30%; opacity: 0.6; }

/* Testimonials */
.s-testi { display: flex; gap: 5px; width: 100%; height: 100%; align-items: stretch; }
.s-testi--single { justify-content: center; }
.s-testi--single .s-quote { flex: 0 0 70%; }
.s-quote {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  flex: 1;
  padding: 8px;
  border-radius: 4px;
  background: rgba(var(--v-theme-surface), 0.14);
}

/* ── Narrow: stack the two panes ─────────────────────────────────────── */
@media (max-width: 560px) {
  .asd-body { flex-direction: column; height: auto; max-height: 70vh; }
  .asd-left { width: 100%; border-right: 0; border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
  .asd-left__scroll { max-height: 240px; }
  .asd-right { min-height: 160px; }
}
</style>
