/**
 * Data Table Pattern — the canonical list-view composition.
 *
 * Every table page in the platform assembles the same layers in the same order:
 * MpFilterTabs → v-card (flat border) → MpDataTableToolbar → v-data-table →
 * MpEmptyState (no data) → MpFloatingBulkBar (on selection), with MpTableSkeleton
 * standing in for the table while loading.
 *
 * Reference implementations: src/views/Commerce/SalesOrders.vue (the list),
 * src/views/Marketing/EmailCampaigns.vue (folders and the bulk bar),
 * src/views/Products/ProductsList.vue (the overflow cell).
 */
import type { Meta, StoryObj } from '@storybook/vue3'
import { ref, computed } from 'vue'
import MpFilterTabs from '../components/MpFilterTabs.vue'
import MpDataTableToolbar from '../components/MpDataTableToolbar.vue'
import MpStatusChip from '../components/MpStatusChip.vue'
import MpEmptyState from '../components/MpEmptyState.vue'
import MpFloatingBulkBar from '../components/MpFloatingBulkBar.vue'
import MpTableSkeleton from '../components/MpTableSkeleton.vue'
import MpRowActionsMenu from '../components/MpRowActionsMenu.vue'
import MpMenuItem from '../components/MpMenuItem.vue'
import MpPageHeader from '../components/MpPageHeader.vue'
import MpFolderSelect from '../components/MpFolderSelect.vue'
import MpManageFoldersDrawer from '../components/MpManageFoldersDrawer.vue'
import MpMoveToFolderDialog from '../components/MpMoveToFolderDialog.vue'
import MpConfirmDialog from '../components/MpConfirmDialog.vue'
import { useFoldersStore } from '@/stores/useFolders'
import { overlayDocs } from '@/stories/decorators'
import { bulkActions, liquidskyDocs } from '@/stories/storyTemplate'

const meta: Meta = {
  title: 'Patterns/Data Table',
  tags: ['autodocs', 'liquidsky'],
  parameters: {
    docs: {
      description: {
        component: liquidskyDocs('patterns-data-table') + `
### Overview
The **Data Table pattern** is the canonical list-view composition used by every table page in
the platform — Sales Orders, Campaigns, Contacts, Tickets, Products, Coupons. Copy this
structure whenever you build a list view. The reference implementation is
\`src/views/Commerce/SalesOrders.vue\`.

\`\`\`
MpPageHeader (title + primary action; MpFilterTabs in its #tabs slot)
  └── MpFilterTabs (All / Status1 / Status2, with counts)
  └── v-card variant="flat" border rounded="lg"
        └── MpDataTableToolbar (v-model:search + filters + actions)
        └── v-data-table (custom cell templates)  |  MpTableSkeleton while loading
        └── MpEmptyState (inside #no-data when 0 items)
  └── MpFloatingBulkBar (when selections > 0)
\`\`\`

### Layer by layer

**1. MpFilterTabs** — status segmentation above the card. Pass \`tabs\` as
\`{ label, key, count }[]\` with counts computed from the *unfiltered* dataset, and bind the
active key with \`v-model\`. In real views the tabs live in \`MpPageHeader\`'s \`#tabs\` slot;
they are shown standalone here to keep the pattern in focus. Tab filtering happens in a
computed — the table just receives the filtered array.

**2. The card** — \`v-card variant="flat" border rounded="lg" class="overflow-hidden"\`.
One card contains the toolbar and the table; nothing else. No elevation, ever.

**3. MpDataTableToolbar** — directly above the table, inside the card. Bind
\`v-model:search\` (updates every keystroke; debounce expensive work yourself), pass
\`total-count\` as the **filtered** length so the "N records" line matches the table, and give
it a specific \`search-placeholder\` ("Search orders…"). Drawer filters go in the
\`#filter-content\` slot; view-specific controls (folder select, export) in \`#actions\`.

**4. v-data-table** — \`item-value\` for selection identity, \`show-select\` for the checkbox
column, \`hover\`, \`density="comfortable"\`, and the \`search\` prop wired to the toolbar model.
Override \`#header.data-table-select\` / \`#item.data-table-select\` with \`v-checkbox-btn\`s that carry an
\`aria-label\` ("Select all rows", "Select order #1042") — Vuetify's default boxes have no name — and
\`:aria-checked="undefined"\` on the header box, because Vuetify's \`aria-checked="mixed"\` is invalid on a
native checkbox (WCAG W-04).
Style cells with custom \`#item.*\` templates:
- Identifier column reads as a link: \`text-primary font-weight-bold\`.
- Status columns always use \`MpStatusChip\` with the **correct \`type\`** (\`order\`,
  \`fulfillment\`, \`payment\`, \`campaign\`, \`ticket\`…) and \`size="sm"\` in tables.
- The last column is \`MpRowActionsMenu\` (kebab) holding \`MpMenuItem\`s. A destructive item
  takes \`danger\` and goes last, behind \`<v-divider class="my-1" />\`. Wrap the menu in
  \`<div @click.stop>\` if rows navigate on click.
- A cell with many values shows the first and a "+N more" chip that reveals the rest
  (see **Overflow Cell**).

**5. MpEmptyState** — rendered inside the table's \`#no-data\` slot, so it appears in the card
below the toolbar. Distinguish the two empties: *no matches* (search/filters active → offer to
adjust) vs *truly empty* (nothing exists yet → offer the create action).

**6. MpTableSkeleton** — while loading, render it *in place of* the table
(\`v-if="loading"\` / \`v-else\`), keeping the toolbar visible.

**7. MpFloatingBulkBar** — outside the card, after it. Appears automatically when
\`count > 0\`. Pass \`count\` and \`total\` (filtered length), handle \`@clear\` and
\`@select-all\`, and put the bulk actions in the default slot as text buttons with an icon:
\`<v-btn size="small" variant="text" class="text-none" prepend-icon="…">\`. The bar gives them
its own ink. A destructive action goes last with \`class="text-none text-error"\` and is
confirmed via \`MpConfirmDialog\` with \`danger\`.

**8. Folders** (lists that file their records: campaigns, content, forms, images) — a
"Manage Folders" button in the page header opens \`MpManageFoldersDrawer\`, \`MpFolderSelect\`
sits in the toolbar's \`#actions\` slot, the chosen folder shows as a "Folder: name" chip
through \`active-filters\`, "Move to folder…" in the row menu and the bulk bar opens
\`MpMoveToFolderDialog\`, and Delete asks first. See **With Folders**.

### The table's own geometry (Phase 4, P4-4)
The rows you see below are not sized by the pattern — they come from \`component.table.*\`,
applied to \`v-data-table\` in \`global.scss\`. Row height is a stated decision now rather than
an emergent side effect of padding plus line-height:

| Token | Governs |
|---|---|
| \`table.rowMinHeight\` (48) | the body row's floor — a cell with a chip and a cell with plain text render the same height |
| \`table.headerMinHeight\` (40) | the header row's floor, shared with buttons, form fields, nav items and list rows |
| \`table.cellPaddingBlock\` (14) · \`cellPaddingInline\` (16) | body cells; the header takes the same inline inset, so a column label can never sit off-axis from its values |
| \`table.headerPaddingBlock\` (8) | header cells — was an off-scale \`5px !important\` |
| \`table.cellPaddingInlineCompact\` (8) | the sub-\`sm\` step that keeps a three-column table off a horizontal scrollbar at 375px |

These are **floors, not caps.** A row whose tallest cell holds a real control still grows past
them — a body row with a 40px row-actions kebab measures ~69, and a header row with a select
checkbox measures ~52. That is correct: the token sets the resting rhythm and the content sets
the exception. The visible effect of P4-4 is on rows that had no such cell — a header row
without a selection column went from Vuetify's undecided 48 to a deliberate 40.

\`MpTableSkeleton\` is pinned to the **same** tokens, so a table swapping from loading to loaded
does not shift. It used to sit at the card inset (20) against the table's 16.

Every control in \`MpDataTableToolbar\` — search field, Filter button, column toggle — resolves
to \`component.control.height\` (40), the same baseline as the header row beneath it. Adding a
control to that row means giving it the token, not a number.

### 🟢 Do's
- **Do** compute tab counts from the full dataset and rows from the tab + drawer filters.
- **Do** keep the primary "Create …" action in \`MpPageHeader\`, not in the toolbar.
- **Do** prune selections when filters drop selected rows out of view.

### 🔴 Don'ts
- **Don't** put bulk actions in the toolbar — selection UI belongs to \`MpFloatingBulkBar\`.
- **Don't** hand-roll status cells — \`MpStatusChip\` with the right \`type\` is mandatory.
- **Don't** render \`MpEmptyState\` outside the card, and don't merge empty with error states
  (\`MpErrorState\` exists for failures).
        `,
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// ── Local mock data (self-contained; no store) ────────────────────────────────
interface DemoOrder {
  id: number
  orderNumber: string
  date: string
  customer: string
  items: number
  total: string
  fulfillment: string
  status: string
}

const orders: DemoOrder[] = [
  { id: 1, orderNumber: 'MB-1041', date: 'Jul 17, 2026', customer: 'Sarah Mitchell', items: 3, total: '$184.50', fulfillment: 'Shipped', status: 'Completed' },
  { id: 2, orderNumber: 'MB-1040', date: 'Jul 17, 2026', customer: 'James Okafor', items: 1, total: '$59.00', fulfillment: 'Ready For Fulfillment', status: 'Processing' },
  { id: 3, orderNumber: 'MB-1039', date: 'Jul 16, 2026', customer: 'Priya Sharma', items: 5, total: '$412.75', fulfillment: 'Not Ready', status: 'Processing' },
  { id: 4, orderNumber: 'MB-1038', date: 'Jul 16, 2026', customer: 'Daniel Reyes', items: 2, total: '$96.20', fulfillment: 'Shipped', status: 'Completed' },
  { id: 5, orderNumber: 'MB-1037', date: 'Jul 15, 2026', customer: 'Emily Chen', items: 4, total: '$233.10', fulfillment: 'Return Requested', status: 'On Hold' },
  { id: 6, orderNumber: 'MB-1036', date: 'Jul 15, 2026', customer: 'Marcus Webb', items: 1, total: '$28.99', fulfillment: 'Cancelled', status: 'Cancelled' },
  { id: 7, orderNumber: 'MB-1035', date: 'Jul 14, 2026', customer: 'Aisha Bello', items: 6, total: '$540.00', fulfillment: 'Shipped', status: 'Completed' },
  { id: 8, orderNumber: 'MB-1034', date: 'Jul 14, 2026', customer: 'Tom Nakamura', items: 2, total: '$147.35', fulfillment: 'Unapproved', status: 'Processing' },
  { id: 9, orderNumber: 'MB-1033', date: 'Jul 13, 2026', customer: 'Laura Costa', items: 3, total: '$201.60', fulfillment: 'Shipped', status: 'Refunded' },
  { id: 10, orderNumber: 'MB-1032', date: 'Jul 12, 2026', customer: 'Viktor Hansen', items: 1, total: '$74.90', fulfillment: 'Ready For Fulfillment', status: 'Processing' },
]

const headers = [
  { title: 'Order', key: 'orderNumber', sortable: true },
  { title: 'Date', key: 'date' },
  { title: 'Customer', key: 'customer' },
  { title: 'Items', key: 'items', align: 'end' as const, width: 70 },
  { title: 'Total', key: 'total', align: 'end' as const },
  { title: 'Fulfillment', key: 'fulfillment' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', headerProps: { class: 'mp-th-sr' }, sortable: false, width: 48 },
]

/**
 * Shared render for the populated pattern — Default and WithSelection differ only
 * in the pre-seeded selection.
 */
function tableStory(preselected: number[]) {
  return () => ({
    components: {
      MpFilterTabs,
      MpDataTableToolbar,
      MpStatusChip,
      MpEmptyState,
      MpFloatingBulkBar,
      MpRowActionsMenu,
      MpMenuItem,
    },
    setup() {
      const activeTab = ref('all')
      const search = ref('')
      const selected = ref<number[]>(preselected)

      const tabs = computed(() => [
        { label: 'All Orders', key: 'all', count: orders.length },
        { label: 'Completed', key: 'completed', count: orders.filter(o => o.status === 'Completed').length },
        { label: 'Processing', key: 'processing', count: orders.filter(o => o.status === 'Processing').length },
        { label: 'Not Fulfilled', key: 'not_fulfilled', count: orders.filter(o => !['Shipped', 'Cancelled'].includes(o.fulfillment)).length },
      ])

      const filteredOrders = computed(() => {
        switch (activeTab.value) {
          case 'completed': return orders.filter(o => o.status === 'Completed')
          case 'processing': return orders.filter(o => o.status === 'Processing')
          case 'not_fulfilled': return orders.filter(o => !['Shipped', 'Cancelled'].includes(o.fulfillment))
          default: return orders
        }
      })

      function selectAll() {
        selected.value = filteredOrders.value.map(o => o.id)
      }

      return { activeTab, search, selected, tabs, headers, filteredOrders, selectAll }
    },
    template: `
      <div class="d-flex flex-column gap-5">
        <MpFilterTabs v-model="activeTab" :tabs="tabs" aria-label="Filter orders by status" />

        <v-card variant="flat" border rounded="lg" class="overflow-hidden">
          <MpDataTableToolbar
            v-model:search="search"
            title="All Orders"
            :total-count="filteredOrders.length"
            search-placeholder="Search orders…"
          />

          <v-data-table
            v-model="selected"
            :headers="headers"
            :items="filteredOrders"
            :search="search"
            item-value="id"
            show-select
            hover
            density="comfortable"
            :items-per-page="15"
          >
            <!-- Labelled select boxes (WCAG W-04). aria-checked is dropped: Vuetify's "mixed" is invalid on a native checkbox. -->
            <template #header.data-table-select="{ allSelected, selectAll, someSelected }">
              <v-checkbox-btn
                :model-value="allSelected"
                :indeterminate="someSelected && !allSelected"
                :aria-checked="undefined"
                aria-label="Select all rows"
                @update:model-value="selectAll(!allSelected)"
              />
            </template>
            <template #item.data-table-select="{ internalItem, isSelected, toggleSelect }">
              <v-checkbox-btn
                :model-value="isSelected(internalItem)"
                :aria-label="\`Select order \${internalItem.raw.orderNumber}\`"
                @update:model-value="toggleSelect(internalItem)"
              />
            </template>
            <template v-slot:item.orderNumber="{ item }">
              <span class="text-primary font-weight-bold cursor-pointer">{{ item.orderNumber }}</span>
            </template>

            <template v-slot:item.date="{ item }">
              <span class="text-medium-emphasis text-body-2 text-no-wrap">{{ item.date }}</span>
            </template>

            <template v-slot:item.total="{ item }">
              <span class="font-weight-semibold text-no-wrap">{{ item.total }}</span>
            </template>

            <template v-slot:item.fulfillment="{ item }">
              <MpStatusChip :status="item.fulfillment" type="fulfillment" size="sm" />
            </template>

            <template v-slot:item.status="{ item }">
              <MpStatusChip :status="item.status" type="order" size="sm" />
            </template>

            <template v-slot:item.actions="{ item }">
              <div @click.stop>
                <MpRowActionsMenu aria-label="Order actions">
                  <MpMenuItem icon="eye" title="View order" />
                  <MpMenuItem icon="package-check" title="Mark fulfilled" :disabled="item.fulfillment === 'Shipped'" />
                  <MpMenuItem icon="printer" title="Print invoice" />
                  <v-divider class="my-1" />
                  <MpMenuItem icon="ban" title="Cancel order" danger :disabled="item.status === 'Cancelled'" />
                </MpRowActionsMenu>
              </div>
            </template>

            <template #no-data>
              <MpEmptyState
                icon="search"
                title="No orders match your search"
                description="Adjust your search or filters to see more."
                class="py-10"
              />
            </template>
          </v-data-table>
        </v-card>

        <MpFloatingBulkBar
          :count="selected.length"
          :total="filteredOrders.length"
          @clear="selected = []"
          @select-all="selectAll"
        >
          ${bulkActions(['fulfill', 'cancel'])}
        </MpFloatingBulkBar>
      </div>
    `,
  })
}

/**
 * The full populated pattern: filter tabs with live counts, toolbar search, status chips
 * with the correct types, and a kebab row-actions menu. Tabs and search are functional —
 * switch a tab or type in the search to see the table filter.
 */
export const Default: Story = {
  render: tableStory([]),
}

/**
 * Zero items. MpEmptyState renders inside the table's #no-data slot, so it sits in the card
 * below the toolbar. A truly empty list (nothing exists yet) offers the create action;
 * a filtered-to-empty list would instead suggest adjusting search/filters.
 */
export const Empty: Story = {
  render: () => ({
    components: { MpFilterTabs, MpDataTableToolbar, MpEmptyState },
    setup() {
      const activeTab = ref('all')
      const search = ref('')
      const tabs = [
        { label: 'All Orders', key: 'all', count: 0 },
        { label: 'Completed', key: 'completed', count: 0 },
        { label: 'Processing', key: 'processing', count: 0 },
        { label: 'Not Fulfilled', key: 'not_fulfilled', count: 0 },
      ]
      return { activeTab, search, tabs, headers }
    },
    template: `
      <div class="d-flex flex-column gap-5">
        <MpFilterTabs v-model="activeTab" :tabs="tabs" aria-label="Filter orders by status" />

        <v-card variant="flat" border rounded="lg" class="overflow-hidden">
          <MpDataTableToolbar
            v-model:search="search"
            title="All Orders"
            :total-count="0"
            search-placeholder="Search orders…"
          />

          <v-data-table :headers="headers" :items="[]" density="comfortable" hide-default-footer>
            <template #no-data>
              <MpEmptyState
                icon="shopping-cart"
                title="No orders yet"
                description="Orders appear here as your channels start selling."
                action-label="Create draft order"
                action-icon="plus"
                class="py-10"
              />
            </template>
          </v-data-table>
        </v-card>
      </div>
    `,
  }),
}

/**
 * Initial load. MpTableSkeleton renders in place of the table (v-if="loading" / v-else)
 * while the toolbar stays visible, so the page keeps its shape.
 */
export const Loading: Story = {
  render: () => ({
    components: { MpFilterTabs, MpDataTableToolbar, MpTableSkeleton },
    setup() {
      const activeTab = ref('all')
      const search = ref('')
      const tabs = [
        { label: 'All Orders', key: 'all' },
        { label: 'Completed', key: 'completed' },
        { label: 'Processing', key: 'processing' },
        { label: 'Not Fulfilled', key: 'not_fulfilled' },
      ]
      return { activeTab, search, tabs }
    },
    template: `
      <div class="d-flex flex-column gap-5">
        <MpFilterTabs v-model="activeTab" :tabs="tabs" aria-label="Filter orders by status" />

        <v-card variant="flat" border rounded="lg" class="overflow-hidden">
          <MpDataTableToolbar
            v-model:search="search"
            title="All Orders"
            search-placeholder="Search orders…"
          />
          <MpTableSkeleton :rows="8" :columns="6" />
        </v-card>
      </div>
    `,
  }),
}

/**
 * Rows selected. MpFloatingBulkBar appears automatically when count > 0 — it shows the
 * selection tally, a select-all affordance, bulk action buttons, and a clear control.
 * Bulk actions are text buttons with an icon, as on the app's Campaigns, Products and Tickets
 * lists; the destructive one is last, in the error colour, and must confirm via
 * MpConfirmDialog with the danger prop.
 */
export const WithSelection: Story = {
  parameters: overlayDocs(),
  render: tableStory([2, 3, 8]),
}

// ── Folders ───────────────────────────────────────────────────────────────────
interface DemoCampaign {
  id: number
  name: string
  listName: string
  status: string
  sentDate: string | null
  /** A folder id from the folders store's `campaigns` scope, or null for unfiled. */
  folderId: string | null
}

const campaigns: DemoCampaign[] = [
  { id: 1, name: 'Black Friday 2025 — Early Access VIP', listName: 'VIP Customer Circle', status: 'Sent', sentDate: '2025-11-22', folderId: 'cmp-black-friday' },
  { id: 2, name: 'Welcome Series #1 — Glad to Have You!', listName: 'Newsletter Opt-in', status: 'Sent', sentDate: '2025-11-15', folderId: 'cmp-automated' },
  { id: 3, name: 'Cyber Monday Flash Sale — 24 Hours Only', listName: 'Master Subscriber List', status: 'Sent', sentDate: '2025-11-25', folderId: 'cmp-promotions' },
  { id: 4, name: 'December Holiday Gift Guide 2025', listName: 'Master Subscriber List', status: 'Sent', sentDate: '2025-12-08', folderId: 'cmp-seasonal' },
  { id: 5, name: 'Year End Recap & Thank You', listName: 'Master Subscriber List', status: 'Sent', sentDate: '2025-12-30', folderId: null },
  { id: 6, name: 'Spring Collection Preview — First Look', listName: 'Master Subscriber List', status: 'Scheduled', sentDate: '2026-03-20', folderId: 'cmp-seasonal' },
  { id: 7, name: 'VIP Exclusive — Secret Sale Event', listName: 'VIP Customer Circle', status: 'Scheduled', sentDate: '2026-03-15', folderId: 'cmp-promotions' },
  { id: 8, name: 'Product Update: Dyson V15 Now In Stock', listName: 'Product Announcement', status: 'Draft', sentDate: null, folderId: 'cmp-announcements' },
  { id: 9, name: 'Abandoned Cart Reminder — Complete Your Order', listName: 'Abandoned Cart Recovery', status: 'Sending', sentDate: '2026-03-07', folderId: 'cmp-automated' },
  { id: 10, name: 'Customer Feedback Survey — Share Your Thoughts', listName: 'Master Subscriber List', status: 'Draft', sentDate: null, folderId: null },
]

const campaignHeaders = [
  { title: 'Campaign Name', key: 'name', sortable: true },
  { title: 'List', key: 'listName' },
  { title: 'Status', key: 'status' },
  { title: 'Sent Date', key: 'sentDate' },
  { title: 'Actions', key: 'actions', align: 'end' as const, sortable: false },
]

/**
 * A list that files its records in folders, composed the way the app's Campaigns list is
 * (`src/views/Marketing/EmailCampaigns.vue`). Four parts, all on the `useFolders` store:
 *
 * - **Manage Folders** in the page header opens `MpManageFoldersDrawer` (create, rename,
 *   nest, delete). Its `@deleted` event is where the list un-files that folder's records.
 * - **`MpFolderSelect`** in the toolbar's `#actions` slot filters the table. A parent folder
 *   includes its children, and so do the counts beside each folder.
 * - The chosen folder becomes a **"Folder: name" chip** through the toolbar's `active-filters`,
 *   with Clear; `@remove-filter` and `@clear-filters` reset the select.
 * - **Move to folder…** in the row menu, and "Move to folder" in the bulk bar, open
 *   `MpMoveToFolderDialog`. The row's folder shows as a caption under its name.
 * - **Delete**, last in the row menu and the bulk bar, always asks first (`MpConfirmDialog`,
 *   `danger`): the bulk bar here is the Campaigns page's own, Move to folder and Delete.
 *
 * Every overlay starts closed: open the drawer from the header, the dialog from a row menu.
 */
export const WithFolders: Story = {
  render: () => ({
    components: {
      MpPageHeader,
      MpDataTableToolbar,
      MpStatusChip,
      MpEmptyState,
      MpFolderSelect,
      MpManageFoldersDrawer,
      MpMoveToFolderDialog,
      MpConfirmDialog,
      MpFloatingBulkBar,
      MpRowActionsMenu,
      MpMenuItem,
    },
    setup() {
      const foldersStore = useFoldersStore()
      const rows = ref(campaigns.map(campaign => ({ ...campaign })))
      const search = ref('')
      const selected = ref<number[]>([])

      // Folder filtering
      const selectedFolderId = ref<string | null>(null)
      const manageFoldersOpen = ref(false)
      const campaignFolders = computed(() => foldersStore.foldersByScope('campaigns'))

      /** A folder and its children: a parent folder lists what is filed under both. */
      const withChildren = (folderId: string) => [folderId, ...foldersStore.childrenOf(folderId).map(f => f.id)]

      const folderCounts = computed(() => {
        const counts: Record<string, number> = {}
        for (const folder of campaignFolders.value) {
          const ids = withChildren(folder.id)
          counts[folder.id] = rows.value.filter(c => c.folderId && ids.includes(c.folderId)).length
        }
        return counts
      })

      const activeFilterEntries = computed(() => {
        const folder = foldersStore.getFolder(selectedFolderId.value)
        return folder ? [{ key: 'folder', label: `Folder: ${folder.name}` }] : []
      })

      const filteredCampaigns = computed(() => {
        if (!selectedFolderId.value) return rows.value
        const ids = withChildren(selectedFolderId.value)
        return rows.value.filter(c => c.folderId && ids.includes(c.folderId))
      })

      function folderName(folderId: string | null) {
        return foldersStore.getFolder(folderId)?.name ?? 'Unfiled'
      }

      function clearFolder() {
        selectedFolderId.value = null
      }

      function moveToFolder(id: number, folderId: string | null) {
        const campaign = rows.value.find(c => c.id === id)
        if (campaign) campaign.folderId = folderId
      }

      /** A deleted folder leaves its campaigns unfiled. */
      function reassignFolder(folderId: string) {
        for (const campaign of rows.value) {
          if (campaign.folderId === folderId) campaign.folderId = null
        }
      }

      // Move to folder (row + bulk)
      const moveTarget = ref<DemoCampaign | null>(null)
      const moveDialogOpen = computed({
        get: () => !!moveTarget.value,
        set: (open: boolean) => { if (!open) moveTarget.value = null },
      })
      const bulkMoveOpen = ref(false)
      const bulkLabel = computed(() => `${selected.value.length} campaign${selected.value.length === 1 ? '' : 's'}`)

      function onMove(folderId: string | null) {
        if (moveTarget.value) moveToFolder(moveTarget.value.id, folderId)
      }

      function onBulkMove(folderId: string | null) {
        for (const id of selected.value) moveToFolder(id, folderId)
        selected.value = []
      }

      // Delete (row + bulk), always confirmed
      const deleteTarget = ref<DemoCampaign | null>(null)
      const bulkDeleteOpen = ref(false)
      const deleteDialogOpen = computed({
        get: () => !!deleteTarget.value,
        set: (open: boolean) => { if (!open) deleteTarget.value = null },
      })
      const deleteIds = computed(() => (deleteTarget.value ? [deleteTarget.value.id] : selected.value))

      function confirmDelete() {
        rows.value = rows.value.filter(c => !deleteIds.value.includes(c.id))
        selected.value = []
        deleteTarget.value = null
        bulkDeleteOpen.value = false
      }

      function selectAll() {
        selected.value = filteredCampaigns.value.map(c => c.id)
      }

      return {
        rows, search, selected, headers: campaignHeaders,
        selectedFolderId, manageFoldersOpen, campaignFolders, folderCounts,
        activeFilterEntries, filteredCampaigns, folderName, clearFolder, reassignFolder,
        moveTarget, moveDialogOpen, bulkMoveOpen, bulkLabel, onMove, onBulkMove, selectAll,
        deleteTarget, deleteDialogOpen, bulkDeleteOpen, deleteIds, confirmDelete,
      }
    },
    template: `
      <div class="d-flex flex-column gap-5">
        <MpPageHeader
          eyebrow="Marketing · Campaigns"
          title="Email Campaigns"
          :subtitle="rows.length + ' campaigns'"
        >
          <template #actions>
            <v-btn variant="outlined" prepend-icon="folder" class="text-none" @click="manageFoldersOpen = true">Manage Folders</v-btn>
            <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">New Campaign</v-btn>
          </template>
        </MpPageHeader>

        <v-card variant="flat" border rounded="lg" class="overflow-hidden">
          <MpDataTableToolbar
            v-model:search="search"
            title="Campaigns"
            search-placeholder="Search campaigns..."
            :active-filters="activeFilterEntries"
            :total-count="filteredCampaigns.length"
            @remove-filter="clearFolder"
            @clear-filters="clearFolder"
          >
            <template #actions>
              <MpFolderSelect
                v-model="selectedFolderId"
                :folders="campaignFolders"
                :counts="folderCounts"
                :total-count="rows.length"
                @manage="manageFoldersOpen = true"
              />
            </template>
          </MpDataTableToolbar>

          <v-data-table
            v-model="selected"
            :headers="headers"
            :items="filteredCampaigns"
            :search="search"
            item-value="id"
            show-select
            hover
            density="comfortable"
            :items-per-page="15"
          >
            <!-- Labelled select boxes (WCAG W-04). aria-checked is dropped: Vuetify's "mixed" is invalid on a native checkbox. -->
            <template #header.data-table-select="{ allSelected, selectAll, someSelected }">
              <v-checkbox-btn
                :model-value="allSelected"
                :indeterminate="someSelected && !allSelected"
                :aria-checked="undefined"
                aria-label="Select all rows"
                @update:model-value="selectAll(!allSelected)"
              />
            </template>
            <template #item.data-table-select="{ internalItem, isSelected, toggleSelect }">
              <v-checkbox-btn
                :model-value="isSelected(internalItem)"
                :aria-label="'Select ' + internalItem.raw.name"
                @update:model-value="toggleSelect(internalItem)"
              />
            </template>

            <template #item.name="{ item }">
              <div class="py-2">
                <div class="font-weight-medium text-body-2">{{ item.name }}</div>
                <div v-if="item.folderId" class="text-caption text-medium-emphasis">{{ folderName(item.folderId) }}</div>
              </div>
            </template>

            <template #item.listName="{ item }">
              <span class="text-body-2 text-medium-emphasis">{{ item.listName }}</span>
            </template>

            <template #item.status="{ item }">
              <MpStatusChip :status="item.status" type="campaign" size="sm" show-icon />
            </template>

            <template #item.sentDate="{ item }">
              <span class="text-caption text-medium-emphasis text-no-wrap">{{ item.sentDate || '--' }}</span>
            </template>

            <template #item.actions="{ item }">
              <MpRowActionsMenu :ariaLabel="'Actions for ' + item.name">
                <MpMenuItem title="Edit" icon="pencil" />
                <MpMenuItem title="Duplicate" icon="copy" />
                <MpMenuItem title="Move to folder…" icon="folder-input" @click="moveTarget = item" />
                <v-divider class="my-1" />
                <MpMenuItem title="Delete" icon="trash-2" danger @click="deleteTarget = item" />
              </MpRowActionsMenu>
            </template>

            <template #no-data>
              <MpEmptyState
                v-if="search"
                icon="search"
                title="No campaigns match your search"
                description="Try a different term or clear the search."
              />
              <MpEmptyState
                v-else
                icon="folder"
                title="This folder is empty"
                :description="'No campaigns filed under ' + folderName(selectedFolderId) + ' yet.'"
              />
            </template>
          </v-data-table>
        </v-card>

        <MpManageFoldersDrawer
          v-model="manageFoldersOpen"
          scope="campaigns"
          :counts="folderCounts"
          @deleted="reassignFolder"
        />

        <MpMoveToFolderDialog
          v-model="moveDialogOpen"
          scope="campaigns"
          :current-folder-id="moveTarget ? moveTarget.folderId : null"
          :item-label="moveTarget ? moveTarget.name : undefined"
          @move="onMove"
        />

        <MpMoveToFolderDialog
          v-model="bulkMoveOpen"
          scope="campaigns"
          :current-folder-id="null"
          :item-label="bulkLabel"
          @move="onBulkMove"
        />

        <MpConfirmDialog
          :model-value="deleteDialogOpen || bulkDeleteOpen"
          :title="deleteIds.length === 1 ? 'Delete this campaign?' : 'Delete ' + deleteIds.length + ' campaigns?'"
          message="They will be permanently deleted. This cannot be undone."
          confirm-label="Delete"
          danger
          @update:model-value="open => { if (!open) { deleteTarget = null; bulkDeleteOpen = false } }"
          @confirm="confirmDelete"
        />

        <MpFloatingBulkBar
          :count="selected.length"
          :total="filteredCampaigns.length"
          @clear="selected = []"
          @select-all="selectAll"
        >
          ${bulkActions(['move', 'delete'], { move: 'bulkMoveOpen = true', delete: 'bulkDeleteOpen = true' })}
        </MpFloatingBulkBar>
      </div>
    `,
  }),
}

// ── Overflow cell ─────────────────────────────────────────────────────────────
const products = [
  { id: 1, name: 'Premium Full Face Helmet', sku: 'HLM-FF-001', collections: ['Premium Full Face', 'Helmets', 'Road', 'Touring', 'Track Day', 'New Arrivals', 'Best Sellers', 'Gift Ideas', 'Summer Sale', 'Staff Picks'] },
  { id: 2, name: 'City Commuter Scooter', sku: 'SCT-CC-014', collections: ['Scooters', 'Commuter', 'Electric'] },
  { id: 3, name: 'Reflective Rain Jacket', sku: 'APP-RJ-203', collections: ['Apparel'] },
  { id: 4, name: 'Replacement Brake Pads', sku: 'PRT-BP-088', collections: [] },
]

const productHeaders = [
  { title: 'Product', key: 'name' },
  { title: 'SKU', key: 'sku' },
  { title: 'Collections', key: 'collections', sortable: false },
]

/** The Products table's Collections column, markup copied from `src/views/Products/ProductsList.vue`. */
function overflowCellStory() {
  return () => ({
    setup: () => ({ products, headers: productHeaders }),
    template: `
      <v-card variant="flat" border rounded="lg" class="overflow-hidden">
        <v-data-table :headers="headers" :items="products" item-value="id" density="comfortable" hide-default-footer>
          <template #item.name="{ item }">
            <span class="text-body-2 font-weight-medium">{{ item.name }}</span>
          </template>
          <template #item.collections="{ item }">
            <div v-if="item.collections.length" class="d-flex flex-wrap ga-1">
              <v-chip size="x-small" variant="tonal" label>{{ item.collections[0] }}</v-chip>
              <v-tooltip v-if="item.collections.length > 1" location="top" :text="item.collections.slice(1).join(', ')">
                <template #activator="{ props: tip }">
                  <v-chip v-bind="tip" size="x-small" variant="text" tabindex="0">+{{ item.collections.length - 1 }} more</v-chip>
                </template>
              </v-tooltip>
            </div>
            <span v-else class="text-body-2 text-medium-emphasis">Not in a collection</span>
          </template>
        </v-data-table>
      </v-card>
    `,
  })
}

/**
 * A cell that can hold many values shows the first and a "+N more" chip; the chip reveals the
 * rest on hover or keyboard focus (it is a tab stop). Four rows: ten values ("+9 more"), three
 * ("+2 more"), a single value (no chip), and none (a muted sentence, never an empty cell).
 * **Overflow Cell (Open)** shows the revealed list.
 *
 * LiquidSky's `AppExpandableList` is this cell. Its example reveals the rest as a list in a
 * popover; here they are one comma-separated line in a tooltip.
 */
export const OverflowCell: Story = {
  render: overflowCellStory(),
}

/** The first row's "+9 more" chip hovered, so the other nine values are revealed. */
export const OverflowCellOpen: Story = {
  name: 'Overflow Cell (Open)',
  parameters: overlayDocs('360px'),
  render: overflowCellStory(),
  play: async ({ canvasElement }) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    canvasElement.querySelector('.v-chip--variant-text')?.dispatchEvent(new MouseEvent('mouseenter'))
  },
}
