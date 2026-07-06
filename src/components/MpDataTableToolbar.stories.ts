import type { Meta, StoryObj } from '@storybook/vue3'
import MpDataTableToolbar from './MpDataTableToolbar.vue'
import MpFloatingBulkBar from './MpFloatingBulkBar.vue'
import { ref, computed } from 'vue'

const meta = {
  title: 'Data Display/MpDataTableToolbar',
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
(when \`headers\` is passed), and an \`#actions\` slot for view-specific controls like
\`MpFolderSelect\`.

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
  title="All Products"
  :total-count="filtered.length"
  :headers="headers"
  search-placeholder="Search products…"
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

### 🔴 Don'ts
- **Don't** use this component outside the context of a Data Table or large list view.
- **Don't** hide primary actions inside the \`#actions\` slot if they are critical to the workflow
  (like "Create New") — put those in the \`MpPageHeader\` instead.
- **Don't** build bulk-selection actions here — selection UI belongs to \`MpFloatingBulkBar\`.
- **Don't** build custom active-filter chips below the toolbar.

### 💡 Best Practices
- **Filter drawer:** the \`#filter-content\` slot renders inside an \`MpFormDrawer\` titled by
  \`filterTitle\`/\`filterSubtitle\`, with built-in "Clear all" and "Done" footer buttons.
- **Column toggle:** pass all column headers (including \`actions\`) via \`:headers\` — the menu
  automatically excludes \`actions\`/select/expand keys. Bind \`v-model:hidden-columns\` and filter
  your headers computed before passing it to \`v-data-table\`. The icon button badges the hidden count.
- **Chip overflow:** only the first 3 filter chips render; the rest collapse into a "+N more"
  chip — remove hidden filters via the drawer or Clear.

### A11y
- **Provides:** the search field has an \`aria-label\` (mirroring the placeholder); the Filter and
  column-toggle buttons carry \`aria-label\`s ("Open table filters", "Toggle visible columns");
  filter chips are closable with Vuetify's built-in close-target; the filter drawer inherits
  \`MpFormDrawer\`'s full dialog semantics (focus trap, Escape-close, labelled title); column
  checkboxes are real labelled \`v-checkbox\`es.
- **Consumer must:** keep \`activeFilters\` labels human-readable ("Status: Active") — the label
  is the chip's only accessible name — and debounce expensive queries themselves (the search
  model updates on every keystroke).
- **Gaps:** the active-filter badge next to the Filter button is purely visual (its count is not
  in the button's accessible name); the "+N more" chip is informational only — hidden filters
  can't be removed from the chip row; the "N records" count is not programmatically associated
  with the table and doesn't announce on filter changes (noted for the Phase 4 a11y pass).
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
    search: { control: false, description: 'v-model:search — instant search text (updates every keystroke).', table: { category: 'models' } },
    filterOpen: { control: false, description: 'v-model:filter-open — filter drawer visibility (usually left internal).', table: { category: 'models' } },
    hiddenColumns: { control: false, description: 'v-model:hidden-columns — keys of hidden columns; filter your headers with it before v-data-table.', table: { category: 'models' } },
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
      const filters = ref({ status: ['Active'] as string[], list: [] as string[] })
      const filterLabels: Record<string, string> = { status: 'Status', list: 'List' }

      const sampleHeaders = [
        { title: 'Contact', key: 'contact' },
        { title: 'Company', key: 'company' },
        { title: 'Status', key: 'status' },
        { title: 'Score', key: 'score' },
        { title: '', key: 'actions' },
      ]

      const activeFilters = computed(() =>
        Object.entries(filters.value)
          .filter(([, v]) => v.length > 0)
          .map(([key, value]) => ({
            key,
            label: `${filterLabels[key]}: ${(value as string[]).join(', ')}`,
          }))
      )

      function removeFilter(key: string) { ;(filters.value as any)[key] = [] }
      function clearFilters() { filters.value = { status: [], list: [] } }

      return { args, search, hiddenColumns, sampleHeaders, filters, activeFilters, removeFilter, clearFilters }
    },
    template: `
      <v-card variant="flat" border rounded="xl" class="overflow-hidden">
        <MpDataTableToolbar
          v-bind="args"
          v-model:search="search"
          v-model:hidden-columns="hiddenColumns"
          :headers="sampleHeaders"
          :active-filters="activeFilters"
          @remove-filter="removeFilter"
          @clear-filters="clearFilters"
        >
          <template #filter-content>
            <div class="pa-4 pb-2">
              <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
              <v-select v-model="filters.status" label="Status"
                :items="['Active', 'Unsubscribed', 'Bounced']"
                multiple chips closable-chips variant="outlined" density="compact" hide-details clearable class="mb-3" />
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
    filterSubtitle: 'Narrow the table by status and list',
  },
}
