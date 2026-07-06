<script setup lang="ts">
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
  <v-dialog v-model="open" max-width="640" scrollable>
    <v-card rounded="lg" flat border class="asd-card">
      <!-- Header -->
      <div class="asd-header d-flex align-center justify-space-between px-4 border-b flex-shrink-0">
        <div class="text-body-1 font-weight-bold">Add section</div>
        <v-btn icon="x" variant="text" size="small" aria-label="Close" @click="open = false"></v-btn>
      </div>

      <div class="asd-body d-flex">
        <!-- LEFT: generate + search + grouped catalog -->
        <div class="asd-left border-r d-flex flex-column">
          <button class="tb-generate-row flex-shrink-0" @click="onGenerate">
            <v-avatar color="primary" size="28" rounded="lg" class="flex-shrink-0">
              <v-icon color="white" size="15">sparkles</v-icon>
            </v-avatar>
            <span class="tb-generate-row__body">
              <span class="tb-generate-row__title text-primary">Generate with AI</span>
              <span class="tb-generate-row__sub">Describe it — Da Vinci builds the section</span>
            </span>
            <v-icon size="16" class="tb-generate-row__chev">chevron-right</v-icon>
          </button>

          <div class="pa-3 pb-2 flex-shrink-0">
            <v-text-field
              v-model="search"
              placeholder="Search sections"
              aria-label="Search sections"
              prepend-inner-icon="search"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            ></v-text-field>
          </div>

          <div class="asd-left__scroll flex-grow-1 overflow-y-auto px-2 pb-2">
            <!-- Flat filtered list while searching -->
            <template v-if="isSearching">
              <button
                v-for="def in filtered"
                :key="def.kind"
                class="asd-item"
                :class="{ 'asd-item--disabled': isKindDisabled(def), 'asd-item--active': selectedDef?.kind === def.kind }"
                :disabled="isKindDisabled(def)"
                @click="onItemClick(def)"
              >
                <v-avatar color="primary" variant="tonal" size="28" rounded="lg" class="flex-shrink-0">
                  <v-icon size="15">{{ def.icon }}</v-icon>
                </v-avatar>
                <span class="asd-item__label text-truncate">{{ def.title }}</span>
                <span v-if="isKindDisabled(def)" class="asd-item__hint">Already added</span>
                <v-icon v-else-if="def.variants?.length" size="15" class="asd-item__chev">chevron-right</v-icon>
              </button>
              <div v-if="!filtered.length" class="text-caption text-medium-emphasis text-center pa-4">
                No sections match “{{ search }}”.
              </div>
            </template>

            <!-- Grouped, collapsible categories otherwise -->
            <template v-else>
              <div v-for="group in groups" :key="group.category" class="mb-1">
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
                  <button
                    v-for="def in group.defs"
                    :key="def.kind"
                    class="asd-item"
                    :class="{ 'asd-item--disabled': isKindDisabled(def), 'asd-item--active': selectedDef?.kind === def.kind }"
                    :disabled="isKindDisabled(def)"
                    @click="onItemClick(def)"
                  >
                    <v-avatar color="primary" variant="tonal" size="28" rounded="lg" class="flex-shrink-0">
                      <v-icon size="15">{{ def.icon }}</v-icon>
                    </v-avatar>
                    <span class="asd-item__label text-truncate">{{ def.title }}</span>
                    <span v-if="isKindDisabled(def)" class="asd-item__hint">Already added</span>
                    <v-icon v-else-if="def.variants?.length" size="15" class="asd-item__chev">chevron-right</v-icon>
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- RIGHT: variant cards or empty state -->
        <div class="asd-right flex-grow-1 overflow-y-auto pa-4">
          <template v-if="selectedDef && selectedDef.variants?.length">
            <div class="text-body-2 font-weight-bold mb-1">{{ selectedDef.title }}</div>
            <div class="text-caption text-medium-emphasis mb-4">Pick a layout to add.</div>
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
            <div class="text-body-2 font-weight-medium mt-3">Select a section to see layout options</div>
            <div class="text-caption text-medium-emphasis mt-1">
              Sections with layouts show them here. Others add on click.
            </div>
          </div>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.asd-card { display: flex; flex-direction: column; overflow: hidden; }
.asd-header { height: 52px; }
.asd-body { min-height: 0; height: 440px; }

.border-b { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.border-r { border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }

.asd-left { width: 300px; flex-shrink: 0; min-height: 0; }
.asd-left__scroll { min-height: 0; }
.asd-right { min-height: 0; background: rgba(var(--v-theme-on-surface), 0.02); }

/* ── Generate-with-AI row (mirrors the builder's picker row) ──────────── */
.tb-generate-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  border: 0;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-primary), 0.06);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}
.tb-generate-row:hover { background: rgba(var(--v-theme-primary), 0.1); }
.tb-generate-row:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: -2px; }
.tb-generate-row__body { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.tb-generate-row__title { font-size: 0.8125rem; font-weight: 700; }
.tb-generate-row__sub {
  font-size: 0.6875rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  line-height: 1.3;
}
.tb-generate-row__chev { color: rgb(var(--v-theme-primary)); flex-shrink: 0; }

/* ── Category headers ────────────────────────────────────────────────── */
.asd-cat {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 8px 8px;
  border: 0;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  text-align: left;
  color: rgba(var(--v-theme-on-surface), 0.7);
}
.asd-cat:hover { background: rgba(var(--v-theme-on-surface), 0.05); }
.asd-cat:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: -2px; }
.asd-cat__chev { transition: transform 0.15s; color: rgba(var(--v-theme-on-surface), 0.5); }
.asd-cat__chev--open { transform: rotate(90deg); }
.asd-cat__label {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* ── Section items ───────────────────────────────────────────────────── */
.asd-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px 8px;
  border: 0;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  text-align: left;
  color: rgb(var(--v-theme-on-surface));
  transition: background 0.15s;
}
.asd-item:hover { background: rgba(var(--v-theme-on-surface), 0.05); }
.asd-item:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: -2px; }
.asd-item--active,
.asd-item--active:hover { background: rgba(var(--v-theme-primary), 0.1); }
.asd-item--disabled { opacity: 0.5; cursor: default; }
.asd-item--disabled:hover { background: transparent; }
.asd-item__label { font-size: 0.8125rem; font-weight: 600; flex: 1; min-width: 0; }
.asd-item__hint {
  flex-shrink: 0;
  font-size: 0.6875rem;
  color: rgba(var(--v-theme-on-surface), 0.5);
}
.asd-item__chev { flex-shrink: 0; color: rgba(var(--v-theme-on-surface), 0.4); }

/* ── Right pane empty state ──────────────────────────────────────────── */
.asd-empty { height: 100%; padding: 24px; }
.asd-empty__icon { color: rgba(var(--v-theme-on-surface), 0.3); }

/* ── Variant cards ───────────────────────────────────────────────────── */
.asd-variants {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}
.asd-variant {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.asd-variant:hover { border-color: rgb(var(--v-theme-primary)); }
.asd-variant:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }
.asd-variant__label { font-size: 0.75rem; font-weight: 700; }
.asd-variant__desc { font-size: 0.6875rem; color: rgba(var(--v-theme-on-surface), 0.6); line-height: 1.3; }

/* ── Schematic mini-mocks (dark tonal surface, token fills) ──────────── */
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
