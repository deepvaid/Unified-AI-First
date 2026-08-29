import type { Meta, StoryObj } from '@storybook/vue3'
import MpDataTableToolbar from './MpDataTableToolbar.vue'
import MpFloatingBulkBar from './MpFloatingBulkBar.vue'
import MpFilterTabs from './MpFilterTabs.vue'
import MpStatusChip from './MpStatusChip.vue'
import MpRowActionsMenu from './MpRowActionsMenu.vue'
import MpEmptyState from './MpEmptyState.vue'
import { ORDERS, ORDER_HEADERS, ORDER_FILTERS, ORDER_TABS } from '@/stories/fixtures'
import { ref, computed } from 'vue'

const meta = {
  title: 'Molecules/MpDataTableToolbar',
  component: MpDataTableToolbar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The \`MpDataTableToolbar\` is the primary control surface above Data Tables. It handles the table
title + record count, instant search, a filter drawer (\`#filter-content\` slot rendered inside an
\`MpFormDrawer\`), active-filter chips with per-chip remove and Clear, a column-visibility menu
(when \`headers\` is passed), an optional \`quickFilter\` pill dropdown leading the row, and an
\`#actions\` slot for view-specific controls like \`MpFolderSelect\`.

**Use when:** a \`v-data-table\` or large list needs search/filter/column controls — every table
page in the platform places this directly above the table inside the same \`v-card\`.

**Don't use when:** the surface is a small embedded list inside a card or drawer (a plain
\`v-text-field\` is enough), or you need bulk-selection actions — those live in
\`MpFloatingBulkBar\`, not the toolbar.

### Usage
\`\`\`html
<MpDataTableToolbar
  v-model:search="search"
  v-model:hidden-columns="hiddenColumns"
  v-model:quick-filter-value="statusFilter"
  title="All Products"
  :total-count="filtered.length"
  :headers="headers"
  search-placeholder="Search products…"
  :quick-filter="{ key: 'status', label: 'Status', options: statusOptions }"
  :active-filters="activeFilters"
  @remove-filter="removeFilter"
  @clear-filters="clearFilters"
>
  <template #actions>
    <MpFolderSelect v-model="folderId" :folders="folders" @manage="manageOpen = true" />
  </template>
  <template #filter-content>
    <v-select v-model="status" label="Status" :items="statuses" multiple chips />
  </template>
</MpDataTableToolbar>
\`\`\`

### 🟢 Do's
- **Do** always provide a clear \`title\` to give context to the data grid below it.
- **Do** provide a specific \`searchPlaceholder\` like "Search contacts..." rather than generic "Search".
- **Do** pass your active filters as \`{ key, label }\` objects — the toolbar renders the chips,
  the "+N more" overflow, and the Clear button for you.
- **Do** pass \`totalCount\` with the **filtered** length so the "N records" line matches what the
  table shows.
- **Do** promote the one highest-traffic filter to \`quickFilter\` and leave the long tail in the
  drawer — the pill is for the cut users make constantly, not for every field.

### 🔴 Don'ts
- **Don't** use this component outside the context of a Data Table or large list view.
- **Don't** hide primary actions inside the \`#actions\` slot if they are critical to the workflow
  (like "Create New") — put those in the \`MpPageHeader\` instead.
- **Don't** build bulk-selection actions here — selection UI belongs to \`MpFloatingBulkBar\`.
- **Don't** build custom active-filter chips below the toolbar.
- **Don't** put the same field in \`quickFilter\` *and* the drawer — one field, one control, or the
  two fight over the same slice of data.

### 💡 Best Practices
- **Filter drawer:** the \`#filter-content\` slot renders inside an \`MpFormDrawer\` titled by
  \`filterTitle\`/\`filterSubtitle\`, with built-in "Clear all" and "Done" footer buttons.
- **Column toggle:** pass all column headers (including \`actions\`) via \`:headers\` — the menu
  automatically excludes \`actions\`/select/expand keys. Bind \`v-model:hidden-columns\` and filter
  your headers computed before passing it to \`v-data-table\`. The icon button badges the hidden count.
- **Chip overflow:** only the first 3 filter chips render; the rest collapse into a "+N more"
  chip — remove hidden filters via the drawer or Clear.
- **Quick filter:** \`:quick-filter="{ key, label, icon?, options }"\` plus
  \`v-model:quick-filter-value\` (a \`string[]\`) renders a checkbox dropdown as a pill at the
  **head of the control cluster, before the Filter button** — it is the cut people reach for
  first, so it sits first. The pill reads as the selected option when exactly one is picked and
  as the group label with a count badge beyond that. The toolbar owns the menu and its Clear button; the
  **consumer** owns filtering, the matching \`activeFilters\` entry, and clearing the model inside
  its own \`removeFilter\`/\`clearFilters\` handlers — the same contract \`activeFilters\` already has.
  The **Filter** button badges \`activeFilters\` *minus* the quick filter's key, so a promoted
  filter never sends people into a drawer that no longer holds it. When the promoted filter was
  the table's only one, drop \`#filter-content\` entirely — the Filter button disappears with it
  (see Commerce → Draft Orders and Custom Gift Cards).

### Styling
- All four controls in the row — the **quick-filter** pill, **Filter** button, **column-toggle**
  button and search field, in that order —
  resolve to **\`--mp-component-control-height\`** (40px): the one baseline shared by buttons,
  form fields, list rows, nav items and table headers. Phase 4 (P4-4) removed the literal
  \`height: 40px\` on the buttons and the \`min-height: 38px\` on the search field — 38 + borders
  happened to land on 40, which was correct by arithmetic and 2px adrift the moment anything
  moved. If you add another control to this row, give it the token, not a number.
  (\`settings-form.scss\` pins \`.v-field__input\` to a 40px min-height and adds 2px of wrapper
  padding, which would render 46px, so both are still neutralised in scoped styles.)
- The toolbar's own \`min-height\` is **\`--mp-component-toolbar-minHeight\`** (P4-5). It used to
  borrow \`$mp-layout-appbarHeight\`, which coupled every table toolbar to app-shell chrome —
  resizing the app bar resized every table.
- Counts are \`v-badge\`s that **wrap** their button, pinned to its top-right corner via
  \`location="top end"\` + \`offset-x="8"\`. A \`v-badge\` positions its dot against its own default
  slot, so a badge placed *beside* a button (or nested inside one) anchors to a 0×0 box and drifts
  into the neighbouring control — that was a real bug here. Visibility is \`:model-value\`, not
  \`v-if\`, so the button still renders at zero count.
- The search field, the **Filter** button and the **column-toggle** button sit in one row and
  deliberately share a border: all three resolve to \`--mp-border-subtle\` (\`#e2e8f0\` light /
  \`#33373D\` dark). The buttons get it from \`global.scss\`'s \`.v-btn--variant-outlined\` rule; the
  search field pins the same custom property in its own scoped style, since it hides Vuetify's
  outline and draws its own border.
- **Don't restyle one of them in isolation** — changing the outlined-button border means changing
  the search field's border in the same pass, or the row splits into two control families again.
- This border is intentionally below the 3:1 non-text contrast floor; consistency was chosen over
  contrast and recorded as accepted risk (\`docs/ui-system-audit/03-accessibility-audit.md\`,
  A11Y-002). The focus state is unaffected and stays compliant.

### A11y
- **Provides:** the search field has an \`aria-label\` (mirroring the placeholder); the Filter and
  column-toggle buttons carry dynamic \`aria-label\`s that include their badge counts ("Open table
  filters (2 active)", "Toggle visible columns (1 hidden)") *(counts added in the Phase 4 a11y
  pass)*; filter chips are closable with Vuetify's built-in close-target; the filter drawer
  inherits \`MpFormDrawer\`'s full dialog semantics (focus trap, Escape-close, labelled title);
  column checkboxes are real labelled \`v-checkbox\`es; the quick-filter pill carries the same
  count-bearing \`aria-label\` pattern ("Filter by Status (2 selected)") and its options are a
  labelled checkbox group via \`MpFormField\`.
- **Consumer must:** keep \`activeFilters\` labels human-readable ("Status: Active") — the label
  is the chip's only accessible name — and debounce expensive queries themselves (the search
  model updates on every keystroke).
- **Gaps:** the "+N more" chip is informational only — hidden filters can't be removed from the
  chip row; the "N records" count is not programmatically associated with the table and doesn't
  announce on filter changes (backlog).
        `,
      },
    },
  },
  argTypes: {
    title: { control: 'text', description: 'Table title shown at the left of the toolbar row.' },
    totalCount: { control: 'number', description: 'Renders an "N records" line under the title. Pass the filtered count.' },
    searchPlaceholder: { control: 'text', description: 'Placeholder and aria-label for the search field. Be specific ("Search contacts…").' },
    filterTitle: { control: 'text', description: 'Title of the filter drawer (defaults to "Filters").' },
    filterSubtitle: { control: 'text', description: 'Optional subtitle of the filter drawer.' },
    activeFilters: { control: 'object', description: 'Applied filters as { key, label }[]. First 3 render as closable chips, the rest collapse into "+N more".' },
    headers: { control: 'object', description: 'Table headers ({ title, key }). When passed, the column-visibility menu appears; actions/select/expand keys are excluded automatically.' },
    quickFilter: { control: 'object', description: 'Promotes one filter to a checkbox pill dropdown left of search: { key, label, icon?, options: { label, value }[] }. Pair with v-model:quick-filter-value.' },
    search: { control: false, description: 'v-model:search — instant search text (updates every keystroke).', table: { category: 'models' } },
    filterOpen: { control: false, description: 'v-model:filter-open — filter drawer visibility (usually left internal).', table: { category: 'models' } },
    hiddenColumns: { control: false, description: 'v-model:hidden-columns — keys of hidden columns; filter your headers with it before v-data-table.', table: { category: 'models' } },
    quickFilterValue: { control: false, description: 'v-model:quick-filter-value — selected quick-filter option values. Apply it to your rows and clear it in removeFilter/clearFilters.', table: { category: 'models' } },
    removeFilter: { control: false, description: 'Event — a filter chip\'s close was clicked; payload is the filter key.', table: { category: 'events' } },
    clearFilters: { control: false, description: 'Event — "Clear" (chip row) or "Clear all" (drawer footer) was clicked.', table: { category: 'events' } },
    actions: { control: false, description: 'Slot — view-specific controls next to search (e.g. MpFolderSelect, Export).', table: { category: 'slots' } },
    'filter-content': { control: false, description: 'Slot — filter form fields, rendered inside the MpFormDrawer.', table: { category: 'slots' } },
  },
} satisfies Meta<typeof MpDataTableToolbar>

export default meta
type Story = StoryObj<typeof meta>

// ── 1. Default: title + search only ──────────────────────────────────────────
export const Default: Story = {
  render: (args) => ({
    components: { MpDataTableToolbar },
    setup() {
      const search = ref('')
      return { args, search }
    },
    template: `
      <v-card variant="flat" border rounded="xl" class="overflow-hidden">
        <MpDataTableToolbar v-bind="args" v-model:search="search" />
      </v-card>
    `,
  }),
  args: {
    title: 'All Orders',
    searchPlaceholder: 'Search orders…',
  },
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/**
 * The toolbar's structures, from the least to the most equipped. Every one is the same
 * row at the same height — what changes is which controls are present.
 */
export const Variants: Story = {
  render: () => ({
    components: { MpDataTableToolbar },
    setup: () => ({ headers: ORDER_HEADERS, filters: ORDER_FILTERS }),
    template: `
      <div class="d-flex flex-column ga-8">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">search only</div>
          <v-card flat border rounded="lg">
            <MpDataTableToolbar search-placeholder="Search orders…" />
          </v-card>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">title + record count</div>
          <v-card flat border rounded="lg">
            <MpDataTableToolbar title="Sales Orders" :total-count="82" search-placeholder="Search orders…" />
          </v-card>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">+ column toggle (pass :headers)</div>
          <v-card flat border rounded="lg">
            <MpDataTableToolbar title="Sales Orders" :total-count="82" :headers="headers" search-placeholder="Search orders…" />
          </v-card>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">+ filter drawer and active chips</div>
          <v-card flat border rounded="lg">
            <MpDataTableToolbar title="Sales Orders" :total-count="12" :headers="headers" :active-filters="filters" search-placeholder="Search orders…">
              <template #filter-content><v-select label="Status" :items="['Processing','Completed']" /></template>
            </MpDataTableToolbar>
          </v-card>
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * There is no `size` prop — the toolbar spans its card. Its one sizing decision is the row
 * height, and that is a token: `component.toolbar.minHeight` for the row,
 * `component.control.height` for every control inside it. Shown here beside a plain button
 * and a form field so the shared 40px baseline is visible.
 */
export const Sizes: Story = {
  render: () => ({
    components: { MpDataTableToolbar },
    template: `
      <div class="d-flex flex-column ga-8">
        <v-card flat border rounded="lg">
          <MpDataTableToolbar title="Sales Orders" :total-count="82" search-placeholder="Search orders…" />
        </v-card>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">the same 40px baseline, outside the toolbar</div>
          <div class="d-flex align-center ga-3">
            <v-btn variant="outlined" class="text-none">A button</v-btn>
            <v-text-field variant="outlined" density="comfortable" hide-details placeholder="A form field" style="max-width: 220px" />
            <div class="text-caption text-medium-emphasis">← both --mp-component-control-height</div>
          </div>
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * Search empty vs typed, no filters vs some vs overflowing, and the sub-960px collapse where
 * the control cluster drops below the title and search goes full-width.
 */
export const States: Story = {
  render: () => ({
    components: { MpDataTableToolbar },
    setup: () => ({ headers: ORDER_HEADERS, filters: ORDER_FILTERS }),
    template: `
      <div class="d-flex flex-column ga-8">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">resting — empty search, no filters</div>
          <v-card flat border rounded="lg">
            <MpDataTableToolbar title="Sales Orders" :total-count="82" :headers="headers" search-placeholder="Search orders…" />
          </v-card>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">searching — count reflects the filtered set</div>
          <v-card flat border rounded="lg">
            <MpDataTableToolbar title="Sales Orders" :total-count="3" :headers="headers" search="anderson" search-placeholder="Search orders…" />
          </v-card>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">filtered — badge on Filter, chips below, Clear</div>
          <v-card flat border rounded="lg">
            <MpDataTableToolbar title="Sales Orders" :total-count="12" :headers="headers" :active-filters="filters" search-placeholder="Search orders…">
              <template #filter-content><v-select label="Status" :items="['Processing','Completed']" /></template>
            </MpDataTableToolbar>
          </v-card>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">narrow (&lt;960px) — controls wrap under the title</div>
          <div style="max-width: 720px">
            <v-card flat border rounded="lg">
              <MpDataTableToolbar title="Sales Orders" :total-count="82" :headers="headers" search-placeholder="Search orders…" />
            </v-card>
          </div>
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** The documented Data Table Pattern end to end, on real-looking orders:
 * `MpFilterTabs` → `v-card` → `MpDataTableToolbar` → `v-data-table` with `MpStatusChip`
 * cells and an `MpRowActionsMenu` per row. This is what every table page in the platform
 * looks like, and the surface Phase 4's table tokens govern — search and buttons on the
 * 40px control height, header cells centred on `component.table.headerMinHeight`, body
 * cells on `cellPaddingBlock`/`cellPaddingInline`.
 */
export const InContextSalesOrdersTable: Story = {
  render: () => ({
    components: { MpDataTableToolbar, MpFilterTabs, MpStatusChip, MpRowActionsMenu, MpEmptyState },
    setup() {
      const search = ref('')
      const tab = ref('all')
      const hiddenColumns = ref<string[]>([])
      const activeFilters = ref([...ORDER_FILTERS].slice(0, 2))
      const rows = computed(() => {
        const q = search.value.trim().toLowerCase()
        return ORDERS.filter(r =>
          (tab.value === 'all' || r.status.toLowerCase() === tab.value)
          && (!q || r.customer.toLowerCase().includes(q) || r.order.includes(q)),
        )
      })
      const headers = computed(() => ORDER_HEADERS.filter(h => !hiddenColumns.value.includes(h.key)))
      return {
        search, tab, hiddenColumns, activeFilters, rows, headers,
        allHeaders: ORDER_HEADERS,
        tabs: ORDER_TABS,
        removeFilter: (key: string) => { activeFilters.value = activeFilters.value.filter(f => f.key !== key) },
        clearFilters: () => { activeFilters.value = [] },
      }
    },
    template: `
      <div>
        <MpFilterTabs v-model="tab" :tabs="tabs" aria-label="Filter orders by status" class="mb-4" />
        <v-card flat border rounded="lg">
          <MpDataTableToolbar
            v-model:search="search"
            v-model:hidden-columns="hiddenColumns"
            title="Sales Orders"
            :total-count="rows.length"
            :headers="allHeaders"
            :active-filters="activeFilters"
            search-placeholder="Search orders…"
            filter-title="Filter orders"
            filter-subtitle="Changes apply immediately"
            @remove-filter="removeFilter"
            @clear-filters="clearFilters"
          >
            <template #actions>
              <v-btn variant="outlined" class="text-none" prepend-icon="download">Export</v-btn>
            </template>
            <template #filter-content>
              <v-select label="Status" :items="['Processing','Completed','Cancelled','Refunded','On Hold']" multiple chips />
              <v-select label="Sales channel" :items="['Web store','POS','Marketplace']" multiple chips />
            </template>
          </MpDataTableToolbar>

          <v-data-table
            v-if="rows.length"
            :headers="headers"
            :items="rows"
            item-value="id"
            show-select
            hide-default-footer
          >
            <template #item.fulfillment="{ item }">
              <MpStatusChip :status="item.fulfillment" type="fulfillment" size="sm" />
            </template>
            <template #item.status="{ item }">
              <MpStatusChip :status="item.status" type="order" size="sm" />
            </template>
            <template #item.actions="{ item }">
              <MpRowActionsMenu aria-label="Order actions" :item-label="item.order">
                <v-list-item title="View order" prepend-icon="eye" />
                <v-list-item title="Print packing slip" prepend-icon="printer" />
                <v-divider class="my-1" />
                <v-list-item title="Cancel order" prepend-icon="ban" class="text-error" />
              </MpRowActionsMenu>
            </template>
          </v-data-table>

          <MpEmptyState
            v-else
            title="No orders match those filters"
            icon="package-search"
            description="Try clearing a filter or widening the date range."
            action-label="Clear filters"
            @action="clearFilters"
          />
        </v-card>
      </div>
    `,
  }),
  args: {} as never,
}

// ── 2. Search populated ───────────────────────────────────────────────────────
/** The search field with a query typed in — the model updates on every keystroke (no built-in debounce). */
export const SearchPopulated: Story = {
  render: (args) => ({
    components: { MpDataTableToolbar },
    setup() {
      const search = ref('winter sale')
      return { args, search }
    },
    template: `
      <v-card variant="flat" border rounded="xl" class="overflow-hidden">
        <MpDataTableToolbar v-bind="args" v-model:search="search" />
        <div class="pa-4 text-body-2 text-medium-emphasis">Search model: "{{ search }}"</div>
      </v-card>
    `,
  }),
  args: {
    title: 'Email Campaigns',
    totalCount: 3,
    searchPlaceholder: 'Search campaigns…',
  },
}

// ── 3. Total count variants ───────────────────────────────────────────────────
/** The "N records" line under the title — pass the filtered count so it matches the table. */
export const WithTotalCount: Story = {
  render: (args) => ({
    components: { MpDataTableToolbar },
    setup() {
      const search = ref('')
      return { args, search }
    },
    template: `
      <div class="d-flex flex-column ga-4">
        <v-card variant="flat" border rounded="xl" class="overflow-hidden">
          <MpDataTableToolbar v-bind="args" v-model:search="search" />
        </v-card>
        <v-card variant="flat" border rounded="xl" class="overflow-hidden">
          <MpDataTableToolbar title="Segments" :total-count="0" search-placeholder="Search segments…" />
        </v-card>
      </div>
    `,
  }),
  args: {
    title: 'All Contacts',
    totalCount: 12840,
    searchPlaceholder: 'Search contacts…',
  },
}

// ── 4. With Filter Dropdown (single multi-select) ─────────────────────────────
export const WithSingleFilter: Story = {
  render: (args) => ({
    components: { MpDataTableToolbar },
    setup() {
      const search = ref('')
      const statusFilter = ref<string[]>([])

      const activeFilters = computed(() =>
        statusFilter.value.length
          ? [{ key: 'status', label: `Status: ${statusFilter.value.join(', ')}` }]
          : []
      )

      function removeFilter(_key: string) { statusFilter.value = [] }
      function clearFilters() { statusFilter.value = [] }

      return { args, search, statusFilter, activeFilters, removeFilter, clearFilters }
    },
    template: `
      <v-card variant="flat" border rounded="xl" class="overflow-hidden">
        <MpDataTableToolbar
          v-bind="args"
          v-model:search="search"
          :active-filters="activeFilters"
          @remove-filter="removeFilter"
          @clear-filters="clearFilters"
        >
          <template #filter-content>
            <div class="pa-4 pb-2">
              <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
              <v-select
                v-model="statusFilter"
                label="Status"
                :items="['Sent', 'Draft', 'Scheduled', 'Archived']"
                multiple
                chips
                closable-chips
                variant="outlined"
                density="compact"
                hide-details
                clearable
                class="mb-3"
              />
            </div>
          </template>
        </MpDataTableToolbar>
      </v-card>
    `,
  }),
  args: {
    title: 'Campaign Reports',
    searchPlaceholder: 'Search campaigns…',
  },
}

/**
 * The promoted filter: a checkbox pill beside search, so the cut users make constantly
 * costs one click instead of a trip to the drawer. Pick one option and the pill reads as
 * that option; pick more and it falls back to the group label with a count badge. The
 * selection round-trips through the same chip row as every other filter.
 */
export const WithQuickFilter: Story = {
  render: (args) => ({
    components: { MpDataTableToolbar },
    setup() {
      const search = ref('')
      const statusFilter = ref<string[]>(['Subscribed'])

      const activeFilters = computed(() =>
        statusFilter.value.length
          ? [{ key: 'status', label: `Status: ${statusFilter.value.join(', ')}` }]
          : []
      )

      function removeFilter(_key: string) { statusFilter.value = [] }
      function clearFilters() { statusFilter.value = [] }

      return { args, search, statusFilter, activeFilters, removeFilter, clearFilters }
    },
    template: `
      <v-card variant="flat" border rounded="xl" class="overflow-hidden">
        <MpDataTableToolbar
          v-bind="args"
          v-model:search="search"
          v-model:quick-filter-value="statusFilter"
          :active-filters="activeFilters"
          @remove-filter="removeFilter"
          @clear-filters="clearFilters"
        />
      </v-card>
    `,
  }),
  args: {
    title: 'All Contacts',
    totalCount: 41,
    searchPlaceholder: 'Search contacts…',
    quickFilter: {
      key: 'status',
      label: 'Status',
      options: ['Subscribed', 'Unsubscribed', 'Bounced', 'Spam'].map(s => ({ label: s, value: s })),
    },
  },
}

/**
 * When the promoted filter is the table's *only* filter, drop `#filter-content` — the
 * Filter button goes with it and the row is just the pill and search. Commerce → Draft
 * Orders and Custom Gift Cards both look like this.
 */
export const QuickFilterOnly: Story = {
  render: (args) => ({
    components: { MpDataTableToolbar },
    setup() {
      const search = ref('')
      const statusFilter = ref<string[]>([])

      const activeFilters = computed(() =>
        statusFilter.value.length
          ? [{ key: 'status', label: `Status: ${statusFilter.value.join(', ')}` }]
          : []
      )
      function clearFilters() { statusFilter.value = [] }

      return { args, search, statusFilter, activeFilters, clearFilters }
    },
    template: `
      <v-card variant="flat" border rounded="xl" class="overflow-hidden">
        <MpDataTableToolbar
          v-bind="args"
          v-model:search="search"
          v-model:quick-filter-value="statusFilter"
          :active-filters="activeFilters"
          @remove-filter="clearFilters"
          @clear-filters="clearFilters"
        />
      </v-card>
    `,
  }),
  args: {
    title: 'All Draft Orders',
    totalCount: 8,
    searchPlaceholder: 'Search draft orders…',
    quickFilter: {
      key: 'status',
      label: 'Status',
      options: ['Open', 'Invoice Sent'].map(v => ({ label: v, value: v })),
    },
  },
}

// ── 5. With Multiple Filters ──────────────────────────────────────────────────
export const WithMultipleFilters: Story = {
  render: (args) => ({
    components: { MpDataTableToolbar },
    setup() {
      const search = ref('')
      const filters = ref({
        status: [] as string[],
        category: [] as string[],
        vendor: [] as string[],
      })

      const filterLabels: Record<string, string> = {
        status: 'Status',
        category: 'Category',
        vendor: 'Vendor',
      }

      const activeFilters = computed(() =>
        Object.entries(filters.value)
          .filter(([, v]) => v.length > 0)
          .map(([key, value]) => ({
            key,
            label: `${filterLabels[key]}: ${(value as string[]).join(', ')}`,
          }))
      )

      function removeFilter(key: string) {
        ;(filters.value as any)[key] = []
      }

      function clearFilters() {
        filters.value = { status: [], category: [], vendor: [] }
      }

      return { args, search, filters, activeFilters, removeFilter, clearFilters }
    },
    template: `
      <v-card variant="flat" border rounded="xl" class="overflow-hidden">
        <MpDataTableToolbar
          v-bind="args"
          v-model:search="search"
          :active-filters="activeFilters"
          @remove-filter="removeFilter"
          @clear-filters="clearFilters"
        >
          <template #filter-content>
            <div class="pa-4 pb-2">
              <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
              <v-select
                v-model="filters.status"
                label="Status"
                :items="['In Stock', 'Low Stock', 'Out of Stock']"
                multiple chips closable-chips
                variant="outlined" density="compact" hide-details clearable
                class="mb-3"
              />
              <v-select
                v-model="filters.category"
                label="Category"
                :items="['Electronics', 'Apparel', 'Home & Kitchen', 'Sports & Outdoors']"
                multiple chips closable-chips
                variant="outlined" density="compact" hide-details clearable
                class="mb-3"
              />
              <v-select
                v-model="filters.vendor"
                label="Vendor"
                :items="['Acme Corp', 'Brand House', 'Global Goods', 'Prime Supplier']"
                multiple chips closable-chips
                variant="outlined" density="compact" hide-details clearable
              />
            </div>
          </template>
        </MpDataTableToolbar>
      </v-card>
    `,
  }),
  args: {
    title: 'All Products',
    searchPlaceholder: 'Search products…',
  },
}

// ── 6. With Active Filter Chips ───────────────────────────────────────────────
export const WithActiveFilters: Story = {
  render: (args) => ({
    components: { MpDataTableToolbar },
    setup() {
      const search = ref('')
      const filters = ref({
        status: ['Active', 'Draft'] as string[],
        category: ['Electronics'] as string[],
      })

      const filterLabels: Record<string, string> = { status: 'Status', category: 'Category' }

      const activeFilters = computed(() =>
        Object.entries(filters.value)
          .filter(([, v]) => v.length > 0)
          .map(([key, value]) => ({
            key,
            label: `${filterLabels[key]}: ${(value as string[]).join(', ')}`,
          }))
      )

      function removeFilter(key: string) { ;(filters.value as any)[key] = [] }
      function clearFilters() { filters.value = { status: [], category: [] } }

      return { args, search, filters, activeFilters, removeFilter, clearFilters }
    },
    template: `
      <v-card variant="flat" border rounded="xl" class="overflow-hidden">
        <MpDataTableToolbar
          v-bind="args"
          v-model:search="search"
          :active-filters="activeFilters"
          @remove-filter="removeFilter"
          @clear-filters="clearFilters"
        >
          <template #filter-content>
            <div class="pa-4 pb-2">
              <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
              <v-select v-model="filters.status" label="Status" :items="['Active', 'Draft', 'Archived']"
                multiple chips closable-chips variant="outlined" density="compact" hide-details clearable class="mb-3" />
              <v-select v-model="filters.category" label="Category" :items="['Electronics', 'Apparel', 'Home & Kitchen']"
                multiple chips closable-chips variant="outlined" density="compact" hide-details clearable />
            </div>
          </template>
        </MpDataTableToolbar>
      </v-card>
    `,
  }),
  args: {
    title: 'All Products',
    searchPlaceholder: 'Search…',
  },
}

// ── 7. Chip overflow: >3 active filters ───────────────────────────────────────
/** Five active filters: the first 3 render as closable chips, the rest collapse into "+2 more", plus Clear. */
export const ManyActiveFilters: Story = {
  render: (args) => ({
    components: { MpDataTableToolbar },
    setup() {
      const search = ref('')
      const activeFilters = ref([
        { key: 'status', label: 'Status: Active' },
        { key: 'category', label: 'Category: Electronics' },
        { key: 'vendor', label: 'Vendor: Acme Corp' },
        { key: 'price', label: 'Price: $50–$200' },
        { key: 'stock', label: 'Stock: In stock' },
      ])
      function removeFilter(key: string) {
        activeFilters.value = activeFilters.value.filter(f => f.key !== key)
      }
      function clearFilters() { activeFilters.value = [] }
      return { args, search, activeFilters, removeFilter, clearFilters }
    },
    template: `
      <v-card variant="flat" border rounded="xl" class="overflow-hidden">
        <MpDataTableToolbar
          v-bind="args"
          v-model:search="search"
          :active-filters="activeFilters"
          @remove-filter="removeFilter"
          @clear-filters="clearFilters"
        >
          <template #filter-content>
            <div class="pa-4 text-body-2 text-medium-emphasis">Filter fields live here.</div>
          </template>
        </MpDataTableToolbar>
      </v-card>
    `,
  }),
  args: {
    title: 'All Products',
    totalCount: 61,
    searchPlaceholder: 'Search products…',
  },
}

// ── 8. Bulk selection (composed with MpFloatingBulkBar) ───────────────────────
/**
 * Bulk actions are NOT part of the toolbar — selection UI lives in `MpFloatingBulkBar`.
 * This story shows the composition on a selectable table page: the toolbar keeps
 * search/filters, the floating bar appears while rows are selected.
 */
export const WithBulkActions: Story = {
  render: (args) => ({
    components: { MpDataTableToolbar, MpFloatingBulkBar },
    setup() {
      const search = ref('')
      const selectedCount = ref(4)
      const totalCount = ref(40)
      return { args, search, selectedCount, totalCount }
    },
    template: `
      <div style="min-height: 260px; position: relative;">
        <v-card variant="flat" border rounded="xl" class="overflow-hidden">
          <MpDataTableToolbar v-bind="args" v-model:search="search" :total-count="totalCount" />
          <div class="pa-4 text-body-2 text-medium-emphasis">
            {{ selectedCount }} of {{ totalCount }} rows selected in the table below the toolbar.
            <v-btn size="small" variant="text" class="text-none" @click="selectedCount = Math.min(totalCount, selectedCount + 1)">Select one more</v-btn>
          </div>
        </v-card>
        <MpFloatingBulkBar
          :count="selectedCount"
          :total="totalCount"
          @clear="selectedCount = 0"
          @select-all="selectedCount = totalCount"
        >
          <v-btn variant="outlined" size="small" class="text-none" prepend-icon="share" rounded="lg">Export</v-btn>
          <v-btn variant="outlined" size="small" class="text-none" prepend-icon="tag" rounded="lg">Tag</v-btn>
          <v-btn variant="outlined" size="small" class="text-none text-error" prepend-icon="trash-2" rounded="lg">Delete</v-btn>
        </MpFloatingBulkBar>
      </div>
    `,
  }),
  args: {
    title: 'All Contacts',
    searchPlaceholder: 'Search contacts…',
  },
}

// ── 9. With Column Toggle ────────────────────────────────────────────────────
export const WithColumnToggle: Story = {
  render: (args) => ({
    components: { MpDataTableToolbar },
    setup() {
      const search = ref('')
      const hiddenColumns = ref<string[]>([])

      const sampleHeaders = [
        { title: 'Contact', key: 'contact', sortable: true },
        { title: 'Company', key: 'company' },
        { title: 'Tags', key: 'tags', sortable: false },
        { title: 'Status', key: 'status' },
        { title: 'Score', key: 'score', align: 'end' as const },
        { title: 'Last Active', key: 'lastActive', align: 'end' as const },
        { title: '', key: 'actions', align: 'end' as const, sortable: false, width: '48px' },
      ]

      const visibleHeaders = computed(() =>
        sampleHeaders.filter(h => !hiddenColumns.value.includes(h.key))
      )

      return { args, search, hiddenColumns, sampleHeaders, visibleHeaders }
    },
    template: `
      <v-card variant="flat" border rounded="xl" class="overflow-hidden">
        <MpDataTableToolbar
          v-bind="args"
          v-model:search="search"
          v-model:hidden-columns="hiddenColumns"
          :headers="sampleHeaders"
        />
        <div class="pa-4 text-body-2 text-medium-emphasis">
          <strong>Visible columns:</strong> {{ visibleHeaders.map(h => h.title || h.key).join(', ') }}
          <br />
          <strong>Hidden:</strong> {{ hiddenColumns.length ? hiddenColumns.join(', ') : 'none' }}
        </div>
      </v-card>
    `,
  }),
  args: {
    title: 'All Contacts',
    searchPlaceholder: 'Search contacts…',
  },
}

// ── 10. Actions slot ──────────────────────────────────────────────────────────
/** View-specific controls in the `#actions` slot, rendered between the filter controls and search. */
export const WithActionsSlot: Story = {
  render: (args) => ({
    components: { MpDataTableToolbar },
    setup() {
      const search = ref('')
      return { args, search }
    },
    template: `
      <v-card variant="flat" border rounded="xl" class="overflow-hidden">
        <MpDataTableToolbar v-bind="args" v-model:search="search">
          <template #actions>
            <v-btn variant="outlined" height="40" class="text-none" prepend-icon="folder" append-icon="chevron-down">All folders</v-btn>
            <v-btn variant="outlined" height="40" class="text-none" prepend-icon="download">Export</v-btn>
          </template>
        </MpDataTableToolbar>
      </v-card>
    `,
  }),
  args: {
    title: 'Email Campaigns',
    totalCount: 25,
    searchPlaceholder: 'Search campaigns…',
  },
}

// ── 11. Full: everything the toolbar owns, together ───────────────────────────
export const FullFeatured: Story = {
  render: (args) => ({
    components: { MpDataTableToolbar },
    setup() {
      const search = ref('mia')
      const hiddenColumns = ref<string[]>(['score'])
      // Status is the promoted filter; the drawer keeps the long tail.
      const statusFilter = ref<string[]>(['Active'])
      const filters = ref({ list: [] as string[] })
      const filterLabels: Record<string, string> = { list: 'List' }

      const sampleHeaders = [
        { title: 'Contact', key: 'contact' },
        { title: 'Company', key: 'company' },
        { title: 'Status', key: 'status' },
        { title: 'Score', key: 'score' },
        { title: '', key: 'actions' },
      ]

      const activeFilters = computed(() => {
        const entries = Object.entries(filters.value)
          .filter(([, v]) => v.length > 0)
          .map(([key, value]) => ({
            key,
            label: `${filterLabels[key]}: ${(value as string[]).join(', ')}`,
          }))
        if (statusFilter.value.length) {
          entries.unshift({ key: 'status', label: `Status: ${statusFilter.value.join(', ')}` })
        }
        return entries
      })

      function removeFilter(key: string) {
        if (key === 'status') { statusFilter.value = []; return }
        ;(filters.value as any)[key] = []
      }
      function clearFilters() {
        statusFilter.value = []
        filters.value = { list: [] }
      }

      return { args, search, hiddenColumns, sampleHeaders, filters, statusFilter, activeFilters, removeFilter, clearFilters }
    },
    template: `
      <v-card variant="flat" border rounded="xl" class="overflow-hidden">
        <MpDataTableToolbar
          v-bind="args"
          v-model:search="search"
          v-model:hidden-columns="hiddenColumns"
          v-model:quick-filter-value="statusFilter"
          :headers="sampleHeaders"
          :active-filters="activeFilters"
          @remove-filter="removeFilter"
          @clear-filters="clearFilters"
        >
          <template #filter-content>
            <div class="pa-4 pb-2">
              <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
              <v-select v-model="filters.list" label="List"
                :items="['Newsletter', 'VIP Circle', 'Win-Back']"
                multiple chips closable-chips variant="outlined" density="compact" hide-details clearable />
            </div>
          </template>
          <template #actions>
            <v-btn variant="outlined" height="40" class="text-none" prepend-icon="download">Export All</v-btn>
          </template>
        </MpDataTableToolbar>
      </v-card>
    `,
  }),
  args: {
    title: 'All Contacts',
    totalCount: 28,
    searchPlaceholder: 'Search contacts…',
    filterTitle: 'Contact filters',
    filterSubtitle: 'Narrow the table by list',
    quickFilter: {
      key: 'status',
      label: 'Status',
      options: ['Active', 'Unsubscribed', 'Bounced'].map(s => ({ label: s, value: s })),
    },
  },
}
