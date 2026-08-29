<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useContactsStore, type Segment, type SegmentRule, type SegmentMatchLogic } from '@/stores/useContacts'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useToast } from '@/composables/useToast'

const store = useContactsStore()
const toast = useToast()
const route = useRoute()
const search = ref('')

// Creating a segment starts at the builder chooser (/segments/types).
const chooserRoute = computed(() => ({
  name: 'SegmentBuilderChooser',
  params: { accountId: route.params.accountId },
}))

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
  { title: 'Contacts', key: 'count', align: 'end' as const },
  { title: 'Last Calculated', key: 'lastCalc', hideBelow: 'sm' as const },
  { title: '', key: 'actions', sortable: false, width: 48 },
]

// Row identity + its headline count always show; supporting columns drop out
// progressively. The actions column is never tiered — the kebab must stay
// reachable at every width.
const { visibleHeaders } = useResponsiveTableHeaders(headers)
const { loading } = useInitialLoad()

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

// Snapshot the form on open (ids stripped) so close paths can tell edits from noise.
const openSnapshot = ref('')
function snapshotState() {
  return JSON.stringify([
    segName.value,
    matchLogic.value,
    rules.value.map(r => [r.matchAll, r.criteria.map(c => [c.category, c.field, c.operator, c.value])]),
  ])
}
const drawerDirty = computed(() => drawer.value && snapshotState() !== openSnapshot.value)

const confirmDiscard = ref(false)
function requestCloseDrawer() {
  if (drawerDirty.value) confirmDiscard.value = true
  else drawer.value = false
}

function openCreate() {
  editingId.value = null
  segName.value = ''
  matchLogic.value = 'all'
  rules.value = [newRule()]
  openSnapshot.value = snapshotState()
  drawer.value = true
}

// The chooser sends the Legacy builder here with ?create=legacy.
// GAP: the real legacy builder is an inaccessible cross-origin iframe on the
// source, so it could not be crawled. This drawer stands in — see GAPS.md.
onMounted(() => {
  if (route.query.create === 'legacy') openCreate()
})

function openEdit(segment: Segment) {
  editingId.value = segment.id
  segName.value = segment.name
  matchLogic.value = segment.matchLogic ?? 'all'
  // Deep-clone stored rules (or seed one) so edits stay uncommitted until save.
  rules.value = (segment.rules && segment.rules.length)
    ? segment.rules.map(r => ({ id: nextId(), matchAll: r.matchAll, criteria: r.criteria.map(c => ({ ...c, id: nextId() })) }))
    : [newRule()]
  openSnapshot.value = snapshotState()
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

function describeCriterion(c: { field: string; operator: string; value: string }): string {
  const val = c.value.trim() || '…'
  return `${c.field} ${c.operator} “${val}”`
}

/** Plain-language summary for merchants (shown above the rule builder). */
const plainLanguageSummary = computed(() => {
  if (matchLogic.value === 'active') return 'Contacts who are currently active.'
  if (!rules.value.length || totalFilters.value === 0) return 'Contacts matching the rules below.'
  const ruleJoiner = matchLogic.value === 'all' ? ' and ' : ' or '
  const parts = rules.value.map((rule) => {
    const critJoiner = rule.matchAll ? ' and ' : ' or '
    const critText = rule.criteria.map(describeCriterion).join(critJoiner)
    return rule.criteria.length > 1 ? `(${critText})` : critText
  })
  return `Contacts who ${parts.join(ruleJoiner)}.`
})

/** Mock audience universe for the live estimate (largest seeded segment is ~18k). */
const AUDIENCE_SIZE = 24816

/** Deterministic mock match estimate so merchants get sizing feedback as they build. */
const matchEstimate = computed(() => {
  if (matchLogic.value === 'active') return AUDIENCE_SIZE
  const narrowing = matchLogic.value === 'all' ? 0.45 : 0.72
  // Hash the rule contents (not the name) for a stable per-definition jitter (0.7–1.3).
  const ruleKey = JSON.stringify(rules.value.map(r => [r.matchAll, r.criteria.map(c => [c.category, c.field, c.operator, c.value])]))
  let hash = 0
  for (const ch of ruleKey) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  const jitter = 0.7 + (Math.abs(hash) % 600) / 1000
  const estimate = Math.round(AUDIENCE_SIZE * Math.pow(narrowing, totalFilters.value) * jitter)
  return Math.max(25, Math.min(AUDIENCE_SIZE, estimate))
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
    store.updateSegment(editingId.value, { ...payload, count: matchEstimate.value })
    toast.success('Segment updated')
  } else {
    store.addSegment({ ...payload, count: matchEstimate.value })
    toast.success('Segment created')
  }
  drawer.value = false
}

function recalculate(segment: Segment) {
  store.recalcSegment(segment.id)
  toast.success('Segment recalculation started')
}

// Delete
const deleteDialog = ref(false)
const pendingSegment = ref<Segment | null>(null)
function askDelete(segment: Segment) { pendingSegment.value = segment; deleteDialog.value = true }
function confirmDelete() {
  if (pendingSegment.value) { store.deleteSegment(pendingSegment.value.id); toast.success('Segment deleted') }
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
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" :to="chooserRoute">Create segment</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="All Segments"
        :total-count="store.segments.length"
      />

      <MpTableSkeleton v-if="loading" :rows="7" :columns="4" />

      <v-data-table v-else
        :headers="visibleHeaders"
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
          <MpRowActionsMenu ariaLabel="Segment actions" :itemLabel="item.name">
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
            action-label="Create segment"
            action-icon="plus"
            class="py-10"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- ── Condition builder drawer ─────────────────────────────────────────── -->
    <MpFormDrawer
      v-model="drawer"
      :title="editingId != null ? 'Edit Segment' : 'Create Segment'" size="lg"
      :guarded="drawerDirty"
      @close="requestCloseDrawer"
    >
      <MpFormGrid>
        <v-text-field v-model="segName" label="Segment Name *" />

        <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="text-body-2">
          <span class="font-weight-medium">Summary: </span>{{ plainLanguageSummary }}
          <div class="text-caption mt-1">≈ {{ matchEstimate.toLocaleString() }} contacts match</div>
        </v-alert>

        <MpFormField label="Match logic">
          <template #default="{ labelId }">
            <v-radio-group v-model="matchLogic" :aria-labelledby="labelId">
              <v-radio label="Match ALL rules" value="all" />
              <v-radio label="Match ONE OR MORE rules" value="any" />
              <v-radio label="Include all active contacts" value="active" />
            </v-radio-group>
          </template>
        </MpFormField>
      </MpFormGrid>

      <template v-if="matchLogic !== 'active'">
        <div
          v-for="(rule, rIdx) in rules"
          :key="rule.id"
          class="rule-block"
        >
          <div class="d-flex align-center justify-space-between">
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

          <MpFormGrid>
            <div
              v-for="crit in rule.criteria"
              :key="crit.id"
              class="mp-form-grid__trailing"
            >
              <MpFormGrid :cols="2">
                <v-select v-model="crit.category" :items="CATEGORIES" label="Category" />
                <v-select v-model="crit.field" :items="FIELDS" label="Field" />
                <v-select v-model="crit.operator" :items="OPERATORS" label="Operator" />
                <v-text-field v-model="crit.value" label="Value" />
              </MpFormGrid>
              <v-btn
                icon="x"
                variant="text"
                size="x-small"
                class="text-medium-emphasis"
                aria-label="Remove criteria"
                :disabled="rule.criteria.length === 1"
                @click="removeCriterion(rule, crit.id)"
              />
            </div>
          </MpFormGrid>

          <div class="d-flex align-center justify-space-between">
            <v-switch
              v-model="rule.matchAll"
              :label="rule.matchAll ? 'Match all criteria' : 'Match any criteria'"
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
        <v-btn variant="text" class="text-none" @click="requestCloseDrawer">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="save">Save Segment</v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDiscard"
      title="Discard segment changes?"
      message="You have unsaved changes to this segment. Closing now will discard them."
      confirm-label="Discard changes"
      danger
      @confirm="drawer = false"
    />

    <MpConfirmDialog
      v-model="deleteDialog"
      title="Delete segment?"
      :message="`Delete “${pendingSegment?.name}”? Campaigns targeting it will lose this audience.`"
      confirm-label="Delete"
      danger
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.rule-block {
  /* The block owns the rhythm between its header, its criteria grid and its
     footer, on the same gap the criteria themselves sit on. */
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-field-groupGap);
  border: 1px solid rgba(var(--v-border-color), 0.14);
  border-radius: 12px;
  padding: 16px;
  background: rgba(var(--v-theme-on-surface), 0.015);
}

.builder-note {
  border: 1px dashed rgba(var(--v-border-color), 0.3);
}
</style>
