<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCdpEntitiesStore, type SqlQuery } from '@/stores/useCdpEntities'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MpDialog from '@/components/MpDialog.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { downloadCsv, type CsvColumn } from '@/utils/exportCsv'
import { useToast } from '@/composables/useToast'

const store = useCdpEntitiesStore()
const toast = useToast()
const search = ref('')

// ── Formatting ────────────────────────────────────────────────────────────────
// The source renders both timestamps as "Jan 05, 2026 at 02:42 AM".
const DATE_PART = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
const TIME_PART = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return `${DATE_PART.format(d)} at ${TIME_PART.format(d)}`
}

// DEFECT FIX (audit F2 / §8 "Query status badges"): the source's API returns
// `failed_at` on every record and the table never renders it, so `Records: 0` is
// ambiguous between "ran and returned nothing" and "never ran at all". Status is
// derived from the two fields the payload already carries.
type QueryStatus = 'Success' | 'Failed' | 'Never run'
function statusOf(q: SqlQuery): QueryStatus {
  if (q.failedAt) return 'Failed'
  return q.records == null ? 'Never run' : 'Success'
}

type QueryRow = SqlQuery & { status: QueryStatus }
const rows = computed<QueryRow[]>(() => store.queries.map(q => ({ ...q, status: statusOf(q) })))

// DEFECT FIX (audit F1): the source has no search at all — the only way to narrow
// the list is the folder tree — even though its own component ships an unused
// `searchString`. Name and SQL body are both searched; the SQL is what you
// actually remember about a query you did not name well.
const filteredQueries = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter(row =>
    row.name.toLowerCase().includes(q) ||
    row.query.toLowerCase().includes(q) ||
    row.targets.some(t => t.toLowerCase().includes(q)),
  )
})

// Columns and their order are the source's, plus Status. Records is right-aligned
// with a thousands separator, matching the legacy `currency` filter.
const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Records', key: 'records', align: 'end' as const, sortable: true },
  { title: 'Created At', key: 'createdAt', sortable: true, hideBelow: 'lg' as const },
  { title: 'Updated At', key: 'updatedAt', sortable: true, hideBelow: 'md' as const },
  { title: '', key: 'actions', sortable: false, width: 48 },
]

// Row identity, its status and its headline count always show; the two timestamps
// drop out progressively. The actions column is never tiered — the kebab must stay
// reachable at every width.
const { visibleHeaders } = useResponsiveTableHeaders(headers)
const { loading } = useInitialLoad()

// ── Bulk selection ────────────────────────────────────────────────────────────
const selected = ref<number[]>([])
function selectAll() {
  selected.value = filteredQueries.value.map(q => q.id)
}

// ── Create / edit ─────────────────────────────────────────────────────────────
// The source is a centred 670px modal, not a drawer. `size="md"` (640) is the
// nearest stop on the shared dialog width ramp.
const dialog = ref(false)
const editingId = ref<number | null>(null)

interface QueryForm {
  name: string
  targets: string[]
  /** Null until chosen: the source's Update Type renders blank on a new query. */
  updateType: SqlQuery['updateType'] | null
  query: string
}

/** Verbatim from the source's option list. */
const UPDATE_TYPES = [
  { value: 'Overwrite', title: 'Overwrite - Overwrites the existing data present in the target table.' },
  { value: 'Append', title: 'Append - Appends the existing data present in the target table.' },
]

function blankForm(): QueryForm {
  return { name: '', targets: [], updateType: null, query: '' }
}
const form = ref<QueryForm>(blankForm())

// DEFECT FIX (audit F9 / A6 / A7): the source renders "… is required" in brand
// blue as a hint before a field is ever touched, and leaves it rendered after the
// field is filled — so a valid form looks unresolved and colour alone separates
// hint from error. Here the rule is evaluated continuously but only *shown* once
// the field has been visited (or a save has been attempted), and it clears the
// moment the rule is satisfied.
const touched = ref({ name: false, targets: false, updateType: false, query: false })
type FormField = keyof typeof touched.value

const errors = computed<Record<FormField, string>>(() => ({
  name: form.value.name === ''
    ? 'Query name is required'
    : form.value.name.trim() === '' ? 'Name cannot be blank' : '',
  targets: form.value.targets.length === 0 ? 'Select at least one target table' : '',
  updateType: form.value.updateType === null ? 'Update type is required' : '',
  query: form.value.query === ''
    ? 'Query is required'
    : form.value.query.trim() === '' ? 'Query cannot be blank' : '',
}))

function fieldError(field: FormField): string[] {
  return touched.value[field] && errors.value[field] ? [errors.value[field]] : []
}

const isValid = computed(() => (Object.keys(errors.value) as FormField[]).every(k => !errors.value[k]))

// Snapshot on open so the edit dialog can tell a real change from a re-open.
const openSnapshot = ref('')
const snapshotState = () => JSON.stringify(form.value)
const isDirty = computed(() => snapshotState() !== openSnapshot.value)

const isEditing = computed(() => editingId.value !== null)

// DEFECT FIX (audit §7.3): the source's Edit dialog enables CONFIRM on open with
// no dirty check, so an untouched record can be re-submitted. Save is gated on
// validity, and on an edit also on something having actually changed.
const canSave = computed(() => isValid.value && (!isEditing.value || isDirty.value))

function openDialog(q?: SqlQuery) {
  editingId.value = q?.id ?? null
  form.value = q
    ? { name: q.name, targets: [...q.targets], updateType: q.updateType, query: q.query }
    : blankForm()
  touched.value = { name: false, targets: false, updateType: false, query: false }
  openSnapshot.value = snapshotState()
  dialog.value = true
}

const confirmDiscard = ref(false)
function requestClose() {
  if (isDirty.value) confirmDiscard.value = true
  else dialog.value = false
}

function save() {
  // A save attempt counts as visiting every field, so nothing fails silently.
  touched.value = { name: true, targets: true, updateType: true, query: true }
  if (!canSave.value) return
  const payload = {
    name: form.value.name.trim(),
    targets: [...form.value.targets],
    updateType: form.value.updateType as SqlQuery['updateType'],
    query: form.value.query,
  }
  if (editingId.value !== null) {
    store.updateQuery(editingId.value, payload)
    toast.success('Query saved')
  } else {
    store.addQuery(payload)
    toast.success('Query created')
  }
  dialog.value = false
}

// ── Execute ───────────────────────────────────────────────────────────────────
// The most serious issue on the source page (audit F4): Execute Query runs the SQL
// immediately and, on Overwrite, truncates the target table — with no preview, no
// dry run, and confirmation copy that could not be verified during the crawl. The
// guard below names the tables that are about to be rewritten.
const executeDialog = ref(false)
const pendingExecute = ref<SqlQuery | null>(null)
function askExecute(q: SqlQuery) { pendingExecute.value = q; executeDialog.value = true }

const executeTargets = computed(() =>
  pendingExecute.value?.targets.length ? pendingExecute.value.targets.join(', ') : 'no target table',
)
const executeIsDestructive = computed(() => pendingExecute.value?.updateType === 'Overwrite')
const executeConsequences = computed(() =>
  executeIsDestructive.value
    ? [
        `Every existing row in ${executeTargets.value} is deleted before the new rows load.`,
        'The query runs immediately against live data.',
        'This cannot be undone.',
      ]
    : [
        `Rows are added to ${executeTargets.value}; existing rows are kept.`,
        'The query runs immediately against live data.',
      ],
)

function confirmExecute() {
  if (!pendingExecute.value) return
  store.executeQuery(pendingExecute.value.id)
  toast.success(`“${pendingExecute.value.name}” executed`)
  pendingExecute.value = null
}

// ── Export ────────────────────────────────────────────────────────────────────
// The source's Export Query triggers a download that could not be exercised
// read-only; the mdi-application-export icon points at the definition rather than
// the result set, which is what this exports.
const exportColumns: CsvColumn<SqlQuery>[] = [
  { title: 'Name', value: 'name' },
  { title: 'Targets', value: (q) => q.targets.join(' | ') },
  { title: 'Update type', value: 'updateType' },
  { title: 'Query', value: 'query' },
  { title: 'Created at', value: (q) => formatDateTime(q.createdAt) },
  { title: 'Updated at', value: (q) => formatDateTime(q.updatedAt) },
]
function exportQuery(q: SqlQuery) {
  downloadCsv(q.name.replace(/\s+/g, '-').toLowerCase(), [q], exportColumns)
  toast.success('Query exported')
}

// ── Delete ────────────────────────────────────────────────────────────────────
const deleteDialog = ref(false)
const pendingDelete = ref<SqlQuery | null>(null)
function askDelete(q: SqlQuery) { pendingDelete.value = q; deleteDialog.value = true }
function confirmDelete() {
  if (pendingDelete.value) {
    store.deleteQuery(pendingDelete.value.id)
    selected.value = selected.value.filter(id => id !== pendingDelete.value?.id)
    toast.success('Query deleted')
  }
  pendingDelete.value = null
}

const bulkDeleteDialog = ref(false)
function confirmBulkDelete() {
  const count = selected.value.length
  store.deleteQueries([...selected.value])
  selected.value = []
  toast.success(count === 1 ? 'Query deleted' : `${count} queries deleted`)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="SQL Queries"
      :subtitle="`${store.queries.length} saved queries`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openDialog()">
          New query
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="All queries"
        search-placeholder="Search by name or SQL"
        :total-count="store.queries.length"
      />

      <MpTableSkeleton v-if="loading" :rows="8" :columns="6" />

      <v-data-table
        v-else
        v-model="selected"
        :headers="visibleHeaders"
        :items="filteredQueries"
        item-value="id"
        show-select
        hover
        density="comfortable"
        fixed-header
        :items-per-page="10"
        :items-per-page-options="[5, 10, 25, 50, 100]"
        class="flex-grow-1"
      >
        <!-- DEFECT FIX (audit A3): the source's row checkboxes are focusable but
             `opacity: 0` at rest and carry no accessible name, so a keyboard user
             tabs into an invisible, unnamed control on every row. Vuetify's own
             `show-select` checkboxes are unlabelled too (axe `label`, critical),
             so both are overridden here with named ones. -->
        <template v-slot:header.data-table-select="{ allSelected, selectAll, someSelected }">
          <v-checkbox-btn
            :model-value="allSelected"
            :indeterminate="someSelected && !allSelected"
            aria-label="Select all queries on this page"
            @update:model-value="selectAll(!allSelected)"
          />
        </template>

        <template v-slot:item.data-table-select="{ internalItem, isSelected, toggleSelect }">
          <v-checkbox-btn
            :model-value="isSelected(internalItem)"
            :aria-label="`Select ${internalItem.raw.name}`"
            @update:model-value="toggleSelect(internalItem)"
          />
        </template>

        <template v-slot:item.name="{ item }">
          <!-- DEFECT FIX (audit F3): the source renders the name as an <a href=null>
               with no click handler, and Edit is reachable only from the kebab. -->
          <button type="button" class="mp-query-name" @click="openDialog(item)">{{ item.name }}</button>
        </template>

        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status" type="general" size="sm" />
        </template>

        <template v-slot:item.records="{ item }">
          <span v-if="item.records != null" class="text-body-2 font-weight-medium mp-num">
            {{ item.records.toLocaleString() }}
          </span>
          <span v-else class="text-disabled">—</span>
        </template>

        <template v-slot:item.createdAt="{ item }">
          <span class="text-body-2 text-medium-emphasis text-no-wrap">{{ formatDateTime(item.createdAt) }}</span>
        </template>

        <template v-slot:item.updatedAt="{ item }">
          <span class="text-body-2 text-medium-emphasis text-no-wrap">{{ formatDateTime(item.updatedAt) }}</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Query actions" :itemLabel="item.name">
            <v-list-item prepend-icon="play-circle" title="Execute query" @click="askExecute(item)" />
            <v-list-item prepend-icon="upload" title="Export query" @click="exportQuery(item)" />
            <v-list-item prepend-icon="pencil" title="Edit query" @click="openDialog(item)" />
            <!-- DEFECT FIX (audit F13): in the source, Delete Query sits directly
                 under Edit Query with no separator and no destructive styling. -->
            <v-divider class="my-1" style="opacity: 0.4" />
            <v-list-item prepend-icon="trash-2" title="Delete query" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>

        <template v-slot:no-data>
          <!-- DEFECT FIX (audit F14): the source's empty state is a bare, centred
               "No data available" cell — no icon, no explanation, no CTA. -->
          <MpEmptyState
            icon="database"
            :title="search ? 'No queries match your search' : 'No saved queries'"
            :description="search
              ? 'Try a different name, table or SQL fragment.'
              : 'A SQL query moves rows out of relational tables and into other relational tables.'"
            :action-label="search ? 'Clear search' : 'Create query'"
            :action-icon="search ? 'x' : 'plus'"
            class="py-10"
            @action="search ? (search = '') : openDialog()"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpFloatingBulkBar
      :count="selected.length"
      :total="filteredQueries.length"
      @clear="selected = []"
      @select-all="selectAll"
    >
      <v-btn
        size="small"
        variant="flat"
        color="error"
        rounded="lg"
        class="text-none"
        prepend-icon="trash-2"
        @click="bulkDeleteDialog = true"
      >
        Delete
      </v-btn>
    </MpFloatingBulkBar>

    <!-- Create / edit query -->
    <MpDialog
      v-model="dialog"
      size="md"
      :title="isEditing ? 'Edit query' : 'New query'"
      guarded
      @close="requestClose"
    >
      <p class="text-body-2 text-medium-emphasis mb-0">
        SQL Queries move data out of relational tables and into other relational tables.
      </p>

      <MpFormGrid>
        <v-text-field
          v-model="form.name"
          label="Name *"
          :error-messages="fieldError('name')"
          @blur="touched.name = true"
        />

        <!-- The live count in the label is the source's own affordance
             ("Targets * (0)" → "Targets * (1)"). -->
        <v-autocomplete
          v-model="form.targets"
          :label="`Targets * (${form.targets.length})`"
          :items="store.relationalTargets"
          :error-messages="fieldError('targets')"
          multiple
          chips
          closable-chips
          @blur="touched.targets = true"
          @update:model-value="touched.targets = true"
        />

        <!-- The source hides this behind an (i) tooltip sitting outside the field,
             so it is hover-only and unreachable by keyboard. It is an associated,
             always-visible hint here. -->
        <v-select
          v-model="form.updateType"
          label="Update type *"
          :items="UPDATE_TYPES"
          :error-messages="fieldError('updateType')"
          hint="Overwrite truncates the target table before loading. Append leaves existing data and adds to it."
          persistent-hint
          @blur="touched.updateType = true"
          @update:model-value="touched.updateType = true"
        />

        <v-textarea
          v-model="form.query"
          label="Query *"
          rows="5"
          spellcheck="false"
          class="mp-sql-input"
          :error-messages="fieldError('query')"
          @blur="touched.query = true"
        />
      </MpFormGrid>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="requestClose">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="save">
          {{ isEditing ? 'Save changes' : 'Create' }}
        </v-btn>
      </template>
    </MpDialog>

    <MpConfirmDialog
      v-model="confirmDiscard"
      title="Discard query changes?"
      message="You have unsaved changes to this query. Closing now will discard them."
      confirm-label="Discard changes"
      danger
      @confirm="dialog = false"
    />

    <MpConfirmDialog
      v-model="executeDialog"
      :title="`Execute “${pendingExecute?.name}”?`"
      :message="executeIsDestructive
        ? `This is an Overwrite query. Running it empties ${executeTargets} before loading the rows it returns.`
        : `This is an Append query. Running it loads the rows it returns into ${executeTargets}.`"
      :consequences="executeConsequences"
      :confirm-label="executeIsDestructive ? 'Overwrite and run' : 'Run query'"
      :danger="executeIsDestructive"
      @confirm="confirmExecute"
    />

    <MpConfirmDialog
      v-model="deleteDialog"
      :title="`Delete “${pendingDelete?.name}”?`"
      message="This saved query is permanently deleted. The data it has already loaded into its target tables is left alone."
      confirm-label="Delete query"
      danger
      @confirm="confirmDelete"
    />

    <MpConfirmDialog
      v-model="bulkDeleteDialog"
      :title="selected.length === 1 ? 'Delete 1 query?' : `Delete ${selected.length} queries?`"
      message="These saved queries are permanently deleted. The data they have already loaded into their target tables is left alone."
      confirm-label="Delete"
      danger
      @confirm="confirmBulkDelete"
    />
  </div>
</template>

<style scoped>
/* The row name is the primary way into a query, so it is a real button: keyboard
   reachable and announced as an action, unlike the source's dead anchor. */
.mp-query-name {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-weight: var(--mp-fontWeight-semibold);
  color: rgb(var(--v-theme-primary));
  text-align: start;
  cursor: pointer;
}

.mp-query-name:hover {
  text-decoration: underline;
}

.mp-query-name:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  border-radius: var(--mp-radius-4);
}

/* Right-aligned counts line up digit for digit down the column. */
.mp-num {
  font-variant-numeric: tabular-nums;
}

/* Not a code editor — a monospace textarea (see the report: a real SQL editor is a
   GAPS candidate). Monospace and spellcheck off are what the source gets wrong at
   16px Roboto with red squiggles under every keyword. */
.mp-sql-input :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
}
</style>
