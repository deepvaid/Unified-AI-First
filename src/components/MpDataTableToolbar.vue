<script setup lang="ts">
import { computed, mergeProps } from 'vue'
import MpFormDrawer from './MpFormDrawer.vue'
import MpFormField from './MpFormField.vue'

const search = defineModel<string>('search', { default: '' })
const filterDrawer = defineModel<boolean>('filterOpen', { default: false })
const hiddenColumns = defineModel<string[]>('hiddenColumns', { default: () => [] })
const quickFilterValue = defineModel<string[]>('quickFilterValue', { default: () => [] })

const props = defineProps<{
  searchPlaceholder?: string
  title?: string
  filterTitle?: string
  filterSubtitle?: string
  activeFilters?: Array<{ key: string; label: string }>
  totalCount?: number
  headers?: Array<{ title: string; key: string; [k: string]: any }>
  /** Promote one high-traffic filter to a pill dropdown beside search. The
      long tail stays in the drawer — never the same field in both. */
  quickFilter?: {
    key: string
    label: string
    icon?: string
    options: Array<{ label: string; value: string }>
  }
}>()

defineEmits<{
  removeFilter: [key: string]
  clearFilters: []
}>()

const NON_TOGGLEABLE = new Set(['actions', 'data-table-select', 'data-table-expand'])

const toggleableHeaders = computed(() =>
  (props.headers ?? []).filter(h => h.title && !NON_TOGGLEABLE.has(h.key)),
)

function isColumnVisible(key: string) {
  return !hiddenColumns.value.includes(key)
}

function toggleColumn(key: string) {
  if (hiddenColumns.value.includes(key)) {
    hiddenColumns.value = hiddenColumns.value.filter(k => k !== key)
  } else {
    hiddenColumns.value = [...hiddenColumns.value, key]
  }
}

function resetColumns() {
  hiddenColumns.value = []
}

function toggleQuickFilterValue(value: string) {
  quickFilterValue.value = quickFilterValue.value.includes(value)
    ? quickFilterValue.value.filter(v => v !== value)
    : [...quickFilterValue.value, value]
}

// One selection reads like a folder pill ("Subscribed"); more than one falls
// back to the group label plus the row's badge count language.
const quickFilterText = computed(() => {
  if (!props.quickFilter) return ''
  if (quickFilterValue.value.length !== 1) return props.quickFilter.label
  const only = props.quickFilter.options.find(o => o.value === quickFilterValue.value[0])
  return only?.label ?? props.quickFilter.label
})

const quickFilterAriaLabel = computed(() => {
  if (!props.quickFilter) return ''
  return quickFilterValue.value.length
    ? `Filter by ${props.quickFilter.label} (${quickFilterValue.value.length} selected)`
    : `Filter by ${props.quickFilter.label}`
})

// The Filter button badges what its drawer actually holds. A promoted quick
// filter still chips below the row, but badging it here would send people into
// a drawer where that filter no longer lives.
const drawerFilterCount = computed(
  () => (props.activeFilters ?? []).filter(f => f.key !== props.quickFilter?.key).length,
)

function visibleChips(filters: Array<{ key: string; label: string }>) {
  return filters.slice(0, 3)
}
function hiddenCount(filters: Array<{ key: string; label: string }>) {
  return Math.max(0, filters.length - 3)
}
</script>

<template>
  <div class="mp-toolbar-shell">
    <div class="d-flex align-start justify-space-between ga-6 px-6 pt-6 pb-4 mp-toolbar-row">
      <div class="mp-toolbar-heading">
        <div v-if="title" class="text-subtitle-1 font-weight-bold">{{ title }}</div>
        <div v-if="totalCount != null" class="mp-meta-label text-medium-emphasis">
          {{ totalCount }} records
        </div>
        <slot name="title" />
      </div>

      <div class="d-flex align-center ga-2 flex-wrap justify-end">
        <!-- Quick filter: the one promoted filter, leading the control
             cluster — it is the cut people reach for before the drawer. -->
        <v-menu
          v-if="quickFilter"
          :close-on-content-click="false"
          location="bottom start"
        >
          <template #activator="{ props: menuProps }">
            <v-badge
              :model-value="quickFilterValue.length > 1"
              :content="quickFilterValue.length"
              color="primary"
              location="top end"
              offset-x="8"
              offset-y="6"
            >
              <v-btn
                v-bind="menuProps"
                variant="outlined"
                class="text-none mp-filter-btn"
                :prepend-icon="quickFilter.icon"
                append-icon="chevron-down"
                :aria-label="quickFilterAriaLabel"
              >
                {{ quickFilterText }}
              </v-btn>
            </v-badge>
          </template>

          <v-card min-width="220" max-width="280" flat border class="mp-toolbar-panel">
            <div class="pa-3">
              <MpFormField :label="quickFilter.label">
                <v-checkbox
                  v-for="opt in quickFilter.options"
                  :key="opt.value"
                  :label="opt.label"
                  :model-value="quickFilterValue.includes(opt.value)"
                  density="compact"
                  hide-details
                  class="mp-panel-checkbox"
                  @update:model-value="toggleQuickFilterValue(opt.value)"
                />
              </MpFormField>
            </div>
            <v-divider class="mp-divider-muted" />
            <div class="d-flex justify-end pa-3">
              <v-btn
                variant="text"
                size="small"
                class="text-none"
                :disabled="!quickFilterValue.length"
                @click="quickFilterValue = []"
              >
                Clear
              </v-btn>
            </div>
          </v-card>
        </v-menu>

        <v-badge
          v-if="$slots['filter-content']"
          :model-value="!!drawerFilterCount"
          :content="drawerFilterCount"
          color="primary"
          location="top end"
          offset-x="8"
          offset-y="6"
        >
          <v-btn
            variant="outlined"
            class="text-none mp-filter-btn"
            prepend-icon="list-filter"
            :aria-label="drawerFilterCount ? `Open table filters (${drawerFilterCount} active)` : 'Open table filters'"
            @click="filterDrawer = true"
          >
            Filter
          </v-btn>
        </v-badge>

        <v-menu
          v-if="headers?.length"
          :close-on-content-click="false"
          location="bottom end"
        >
          <template #activator="{ props: menuProps }">
            <v-tooltip text="Toggle visible columns" location="bottom">
              <template #activator="{ props: tooltipProps }">
                <v-badge
                  :model-value="!!hiddenColumns.length"
                  :content="hiddenColumns.length"
                  color="primary"
                  location="top end"
                  offset-x="8"
                  offset-y="6"
                >
                  <v-btn
                    v-bind="mergeProps(menuProps, tooltipProps)"
                    variant="outlined"
                    icon="columns-3"
                    class="mp-filter-btn mp-filter-btn--icon"
                    :aria-label="hiddenColumns.length ? `Toggle visible columns (${hiddenColumns.length} hidden)` : 'Toggle visible columns'"
                  >
                    <v-icon size="18">columns-3</v-icon>
                  </v-btn>
                </v-badge>
              </template>
            </v-tooltip>
          </template>
          <v-card min-width="220" max-width="280" flat border class="mp-toolbar-panel">
            <div class="pa-3">
              <MpFormField label="Toggle columns">
                <!-- Dense menu panel: compact and detail-free on purpose, so the
                     list of columns can't push the menu past the viewport. -->
                <v-checkbox
                  v-for="h in toggleableHeaders"
                  :key="h.key"
                  :label="h.title"
                  :model-value="isColumnVisible(h.key)"
                  density="compact"
                  hide-details
                  class="mp-panel-checkbox"
                  @update:model-value="toggleColumn(h.key)"
                />
              </MpFormField>
            </div>
            <v-divider class="mp-divider-muted" />
            <div class="d-flex justify-end pa-3">
              <v-btn
                variant="text"
                size="small"
                class="text-none"
                :disabled="!hiddenColumns.length"
                @click="resetColumns"
              >
                Reset
              </v-btn>
            </div>
          </v-card>
        </v-menu>

        <slot name="actions" />

        <div class="mp-toolbar-search">
          <!-- Toolbar filter, not a form field: the pill search is label-free by
               design (see .mp-toolbar-search below) and suppresses details so the
               toolbar row height can never shift. -->
          <v-text-field
            v-model="search"
            :placeholder="searchPlaceholder ?? 'Search...'"
            :aria-label="searchPlaceholder ?? 'Search records'"
            hide-details
            prepend-inner-icon="search"
          />
        </div>
      </div>
    </div>
  </div>

  <v-expand-transition>
    <div
      v-if="activeFilters?.length"
      class="px-6 pb-4 d-flex align-center ga-2 flex-wrap"
    >
      <span class="text-caption text-medium-emphasis font-weight-medium mr-1">Filter by:</span>
      <v-chip
        v-for="f in visibleChips(activeFilters)"
        :key="f.key"
        size="small"
        variant="tonal"
        color="primary"
        closable
        @click:close="$emit('removeFilter', f.key)"
      >
        {{ f.label }}
      </v-chip>
      <v-chip
        v-if="hiddenCount(activeFilters) > 0"
        size="small"
        variant="tonal"
        color="default"
      >
        + {{ hiddenCount(activeFilters) }} more
      </v-chip>
      <v-btn
        variant="text"
        size="small"
        class="text-none text-medium-emphasis"
        @click="$emit('clearFilters')"
      >
        Clear
      </v-btn>
    </div>
  </v-expand-transition>

  <v-divider class="mp-divider-toolbar" />

  <MpFormDrawer
    v-if="$slots['filter-content']"
    v-model="filterDrawer"
    :title="filterTitle ?? 'Filters'"
    :subtitle="filterSubtitle ?? 'Changes apply immediately'"
  >
    <slot name="filter-content" />
    <template #footerStart>
      <v-btn variant="text" class="text-none" @click="$emit('clearFilters')">
        Clear all
      </v-btn>
    </template>
    <template #footer>
      <v-btn variant="flat" color="primary" class="text-none" @click="filterDrawer = false">
        Done
      </v-btn>
    </template>
  </MpFormDrawer>
</template>

<style scoped>
.mp-toolbar-shell {
  background: rgb(var(--v-theme-surface));
}

/* P4-5: a table toolbar is not app-shell chrome. This used to borrow
   $mp-layout-appbarHeight, so changing the app bar resized every table's
   toolbar. `component.toolbar.minHeight` is its own decision. */
.mp-toolbar-row {
  min-height: var(--mp-component-toolbar-minHeight);
}

/* P4-4: every control in this row is one height — the shared 40px control
   baseline that buttons, form fields, list rows and table headers sit on. */
.mp-filter-btn {
  height: var(--mp-component-control-height);
}

.mp-filter-btn--icon {
  min-width: var(--mp-component-control-height);
  width: var(--mp-component-control-height);
  padding-inline: 0;
}

.mp-toolbar-search {
  width: var(--mp-component-toolbar-searchWidth);
  min-width: var(--mp-component-toolbar-searchMinWidth);
}

.mp-divider-muted {
  opacity: 0.4;
}

.mp-divider-toolbar {
  opacity: 0.08;
}

/* A menu panel is 12 on the concentric radius scale (P2-6), not the 16 that
   `rounded="lg"` resolves to through global.scss's card override — the same
   reason MpFolderSelect sets its panel radius here rather than as an attr. */
.mp-toolbar-panel {
  border-color: rgb(var(--v-theme-outline-variant));
  border-radius: var(--mp-component-menu-radius);
}

/* Pill search, matching the AppBar universal-search field (src/components/
   layout/AppBar.vue .appbar-search) so search inputs read as one consistent
   pattern across the app. White resting fill matches the toolbar's other
   controls (Filter, column-toggle — both `variant="outlined"` on the white
   toolbar shell), not a gray ghost fill. Vuetify's own outline is hidden
   below (opacity 0) since this draws its own border instead.

   That border reuses --mp-border-subtle: the SAME custom property global.scss
   (".v-btn--variant-outlined") sets on every outlined button, so this field and
   the Filter / column-toggle buttons beside it in the same row cannot drift
   apart in either theme (#e2e8f0 light, #33373D dark).

   Consistency was chosen over contrast here, with eyes open: --mp-border-subtle
   is ~1.2:1 on white, under the WCAG 1.4.11 3:1 non-text floor, so this reverses
   the A11Y-001 finding *for this one field* (recorded under A11Y-002 in
   docs/ui-system-audit/03-accessibility-audit.md). The sibling buttons were always
   at this value, so matching them makes the row uniformly low-contrast rather than
   mixed. Focus state below is unchanged and still compliant.

   Still true after P5.5-12 (2026-08-28), which raised --border-strong so every
   OTHER outlined field is compliant again (3.19:1+ light / 3.17:1+ dark). This row
   is now the only outlined-control family left under the floor, and it stays that
   way only because the field is matched to the buttons — so the open question is
   the BUTTON border, not this line. Raising --mp-border-subtle here alone would
   re-create exactly the mismatch that caused the earlier revert.

   If the outlined-button border ever changes, change this line with it. */
.mp-toolbar-search :deep(.v-field) {
  border-radius: var(--r-pill);
  background: var(--surface-primary);
  border: 1px solid var(--mp-border-subtle);
}

.mp-toolbar-search :deep(.v-field__outline) {
  --v-field-border-opacity: 0;
}

/* P4-4: this field sits on the same control-height token as the buttons beside
   it. It used to be pinned to a literal 38px, which with the 1px borders landed
   at 40 by arithmetic — correct by luck, and 2px adrift the moment the token
   moved. Zeroing the wrapper padding and the field's own border-box sizing keeps
   the rendered box on the token instead.

   settings-form.scss pins .v-field__input to a 40px min-height and adds 2px of
   wrapper padding top/bottom, which renders 46px — 6px taller than everything
   else in this row — so both have to be neutralised here.

   The doubled `.v-field .v-field__input` descendant is deliberate: the global
   rule is (0,3,0) and a plain :deep(.v-field__input) ties it at (0,3,0), leaving
   the winner down to stylesheet source order. The extra descendant makes this
   (0,4,0) so it wins deterministically, without !important — the same
   "override by selector specificity" contract settings-form.scss documents.

   Vuetify's .v-field__field is align-items: flex-start. Once the input is
   collapsed to content height there is no padding left to fake centring, so
   the text sat ~8px high while the center-affix search icon stayed put. State
   the alignment outright rather than restoring padding that would only ever be
   correct by arithmetic. */
.mp-toolbar-search :deep(.v-field) {
  box-sizing: border-box;
  min-height: var(--mp-component-control-height);
}

.mp-toolbar-search :deep(.v-field .v-field__field) {
  align-items: center;
  padding-block: 0;
}

.mp-toolbar-search :deep(.v-field .v-field__input) {
  min-height: 0;
  padding-block: 0;
}

.mp-toolbar-search :deep(.v-field--focused) {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  border-color: var(--accent);
}

.mp-toolbar-search :deep(input::placeholder) {
  color: var(--muted);
  opacity: 1;
}

.mp-toolbar-search :deep(.v-field__prepend-inner .v-icon) {
  color: var(--muted);
}

/* The heading block owns the space between its title, its record count and any
   slotted content — that used to be an `mt-1` the count carried itself. */
.mp-toolbar-heading {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-4);
}

/* Any checkbox in a toolbar menu panel — column toggles and quick filters. */
.mp-panel-checkbox :deep(.v-label) {
  font-size: var(--mp-fontSize-13);
}

@media (max-width: 959px) {
  .mp-toolbar-row {
    flex-direction: column;
    align-items: stretch;
  }

  .mp-toolbar-row > .d-flex.align-center.flex-wrap {
    width: 100%;
    justify-content: flex-start;
  }

  .mp-toolbar-search {
    width: 100%;
    min-width: 0;
    max-width: none;
  }
}
</style>
