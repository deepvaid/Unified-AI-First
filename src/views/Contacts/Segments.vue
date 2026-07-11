<script setup lang="ts">
import { ref, computed } from 'vue'
import { useContactsStore, type Segment, type SegmentRule, type SegmentMatchLogic } from '@/stores/useContacts'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

const store = useContactsStore()
const search = ref('')

const CATEGORIES = [
  'Contact Information', 'In List', 'Not In List', 'Opened', 'Clicked',
  'Did Not Open', 'Did Not Click', 'Subscribed', 'Sent', 'Received',
  'Revenue', 'Location', 'Website', 'In Journey', 'Order Status', 'Tags',
  'Not In Segment', 'Product Category', 'Conversion', 'Coupon Codes', 'In Brand',
]
const FIELDS = ['Email', 'First Name', 'Last Name', 'Phone', 'Company', 'City', 'Country', 'Total Orders', 'Total Revenue', 'Last Activity']
const OPERATORS = ['contains', 'does not contain', 'is equal', 'is not equal']

const MAX_FILTERS = 100

const headers = [
  { title: 'Segment Name', key: 'name', sortable: true },
  { title: 'Total Contacts', key: 'count', align: 'end' as const },
  { title: 'Last Calculated', key: 'lastCalc' },
  { title: '', key: 'actions', sortable: false, width: 48 },
]

// Snackbar
const snackbar = ref(false)
const snackbarText = ref('')
function notify(text: string) { snackbarText.value = text; snackbar.value = true }

// ── Condition builder state ────────────────────────────────────────────────────
const drawer = ref(false)
const editingId = ref<number | null>(null)
const segName = ref('')
const matchLogic = ref<SegmentMatchLogic>('all')
const rules = ref<SegmentRule[]>([])
let seq = 0
const nextId = () => ++seq

function newCriterion() {
  return { id: nextId(), category: CATEGORIES[0]!, field: FIELDS[0]!, operator: OPERATORS[0]!, value: '' }
}
function newRule(): SegmentRule {
  return { id: nextId(), matchAll: true, criteria: [newCriterion()] }
}

function openCreate() {
  editingId.value = null
  segName.value = ''
  matchLogic.value = 'all'
  rules.value = [newRule()]
  drawer.value = true
}

function openEdit(segment: Segment) {
  editingId.value = segment.id
  segName.value = segment.name
  matchLogic.value = segment.matchLogic ?? 'all'
  // Deep-clone stored rules (or seed one) so edits stay uncommitted until save.
  rules.value = (segment.rules && segment.rules.length)
    ? segment.rules.map(r => ({ id: nextId(), matchAll: r.matchAll, criteria: r.criteria.map(c => ({ ...c, id: nextId() })) }))
    : [newRule()]
  drawer.value = true
}

function addRule() { rules.value.push(newRule()) }
function removeRule(ruleId: number) { rules.value = rules.value.filter(r => r.id !== ruleId) }
function addCriterion(rule: SegmentRule) { rule.criteria.push(newCriterion()) }
function removeCriterion(rule: SegmentRule, critId: number) {
  rule.criteria = rule.criteria.filter(c => c.id !== critId)
}

const totalFilters = computed(() =>
  matchLogic.value === 'active' ? 0 : rules.value.reduce((sum, r) => sum + r.criteria.length, 0),
)

const canSave = computed(() => {
  if (!segName.value.trim()) return false
  if (totalFilters.value > MAX_FILTERS) return false
  return true
})

function describe(): string {
  if (matchLogic.value === 'active') return 'All active contacts'
  const logicLabel = matchLogic.value === 'all' ? 'match all rules' : 'match any rule'
  return `${totalFilters.value} filter${totalFilters.value === 1 ? '' : 's'} · ${logicLabel}`
}

function save() {
  if (!canSave.value) return
  const payload = {
    name: segName.value.trim(),
    description: describe(),
    type: 'Dynamic',
    status: 'Active',
    matchLogic: matchLogic.value,
    rules: matchLogic.value === 'active' ? [] : rules.value,
  }
  if (editingId.value != null) {
    store.updateSegment(editingId.value, payload)
    notify('Segment updated')
  } else {
    store.addSegment({ ...payload, count: 0 })
    notify('Segment created')
  }
  drawer.value = false
}

function recalculate(segment: Segment) {
  store.recalcSegment(segment.id)
  notify('Segment recalculation started')
}

// Delete
const deleteDialog = ref(false)
const pendingSegment = ref<Segment | null>(null)
function askDelete(segment: Segment) { pendingSegment.value = segment; deleteDialog.value = true }
function confirmDelete() {
  if (pendingSegment.value) { store.deleteSegment(pendingSegment.value.id); notify('Segment deleted') }
  pendingSegment.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Segments"
      :subtitle="`${store.segments.length} segments`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">Create Segment</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="All Segments"
        :total-count="store.segments.length"
      />

      <v-data-table
        :headers="headers"
        :items="store.segments"
        :search="search"
        :items-per-page="15"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.count="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.count.toLocaleString() }}</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Segment actions">
            <v-list-item prepend-icon="pencil" title="Edit" @click="openEdit(item)" />
            <v-list-item prepend-icon="refresh-cw" title="Recalculate" @click="recalculate(item)" />
            <v-divider class="my-1" style="opacity: 0.4" />
            <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="filter"
            :title="search ? 'No segments match your search' : 'No segments yet'"
            :description="search ? 'Try a different search term.' : 'Build dynamic segments to group contacts by behaviour, attributes, or lifecycle stage.'"
            action-label="Create Segment"
            action-icon="plus"
            class="py-10"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- ── Condition builder drawer ─────────────────────────────────────────── -->
    <MpFormDrawer v-model="drawer" :title="editingId != null ? 'Edit Segment' : 'Create Segment'" :width="680">
      <v-text-field v-model="segName" label="Segment Name *" variant="outlined" density="comfortable" class="mb-5" />

      <div class="text-subtitle-2 font-weight-bold mb-2">Match logic</div>
      <v-radio-group v-model="matchLogic" hide-details class="mb-4">
        <v-radio label="Match ALL rules" value="all" />
        <v-radio label="Match ONE OR MORE rules" value="any" />
        <v-radio label="Include all active contacts" value="active" />
      </v-radio-group>

      <template v-if="matchLogic !== 'active'">
        <div
          v-for="(rule, rIdx) in rules"
          :key="rule.id"
          class="rule-block mb-4"
        >
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-caption text-medium-emphasis font-weight-medium">Rule {{ rIdx + 1 }}</span>
            <v-btn
              v-if="rules.length > 1"
              icon="trash-2"
              variant="text"
              size="x-small"
              color="error"
              aria-label="Remove rule"
              @click="removeRule(rule.id)"
            />
          </div>

          <div
            v-for="crit in rule.criteria"
            :key="crit.id"
            class="criterion-row mb-2"
          >
            <v-select v-model="crit.category" :items="CATEGORIES" label="Category" variant="outlined" density="compact" hide-details />
            <v-select v-model="crit.field" :items="FIELDS" label="Field" variant="outlined" density="compact" hide-details />
            <v-select v-model="crit.operator" :items="OPERATORS" label="Operator" variant="outlined" density="compact" hide-details />
            <v-text-field v-model="crit.value" label="Value" variant="outlined" density="compact" hide-details />
            <v-btn
              icon="x"
              variant="text"
              size="x-small"
              color="medium-emphasis"
              aria-label="Remove criteria"
              :disabled="rule.criteria.length === 1"
              @click="removeCriterion(rule, crit.id)"
            />
          </div>

          <div class="d-flex align-center justify-space-between mt-3">
            <v-switch
              v-model="rule.matchAll"
              :label="rule.matchAll ? 'Match all criteria' : 'Match any criteria'"
              color="primary"
              density="compact"
              hide-details
            />
            <v-btn variant="text" size="small" class="text-none" prepend-icon="plus" @click="addCriterion(rule)">Add criteria</v-btn>
          </div>
        </div>

        <v-btn variant="tonal" size="small" class="text-none" prepend-icon="plus" @click="addRule">Add rule</v-btn>
      </template>

      <div v-else class="text-body-2 text-medium-emphasis pa-4 rounded-lg builder-note">
        This segment includes every active contact. No filter rules are applied.
      </div>

      <template #footer>
        <span class="text-caption text-medium-emphasis mr-auto" :class="{ 'text-error': totalFilters > MAX_FILTERS }">
          Total filters {{ totalFilters }}/{{ MAX_FILTERS }}
        </span>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="save">Save Segment</v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="deleteDialog"
      title="Delete segment?"
      :message="`Delete “${pendingSegment?.name}”? Campaigns targeting it will lose this audience.`"
      confirm-label="Delete"
      danger
      @confirm="confirmDelete"
    />

    <v-snackbar v-model="snackbar" :timeout="2500" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> {{ snackbarText }}</div>
    </v-snackbar>
  </div>
</template>

<style scoped>
.rule-block {
  border: 1px solid rgba(var(--v-border-color), 0.14);
  border-radius: 12px;
  padding: 16px;
  background: rgba(var(--v-theme-on-surface), 0.015);
}

.criterion-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 1fr auto;
  gap: 8px;
  align-items: center;
}

.builder-note {
  border: 1px dashed rgba(var(--v-border-color), 0.3);
}

@media (max-width: 720px) {
  .criterion-row {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
