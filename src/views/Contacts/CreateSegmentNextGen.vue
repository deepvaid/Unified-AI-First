<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContactsStore } from '@/stores/useContacts'
import { useCdpEntitiesStore } from '@/stores/useCdpEntities'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useToast } from '@/composables/useToast'
import {
  SEGMENT_CATEGORIES, STANDARD_FIELDS, CATEGORY_RULES, CAMPAIGN_ACTIVITY_GROUPS,
  OPERATORS_BY_TYPE, OPERATOR_LABEL, ENGAGEMENT_LEVELS, RFM_GROUPS, AS_OF_OPTIONS,
  FREQUENCY_OPTIONS, RECENCY_OPTIONS, SUBSCRIPTION_TYPES, SUBSCRIPTION_STATUSES,
  LIST_TYPES, PURCHASE_OPTIONAL_FILTERS, VALUELESS_OPERATORS, RANGE_OPERATORS,
  AI_PROMPTS, MAX_CRITERIA,
  type SegmentCategory, type SegmentFieldType,
} from './segmentCatalog'

const route = useRoute()
const router = useRouter()
const contacts = useContactsStore()
const cdp = useCdpEntitiesStore()
const toast = useToast()

const accountId = computed(() => route.params.accountId as string)
const backTo = computed(() => ({ name: 'Segments', params: { accountId: accountId.value } }))

// ── Model ─────────────────────────────────────────────────────────────────────
interface Criterion {
  id: number
  category: SegmentCategory
  /** Contact Attributes → a field name. Every other category → a rule name. */
  field: string
  operator: string
  value: string
  valueTo: string
  includeBoundary: boolean
  frequency: string
  recency: string
  subscriptionType: string
  subscriptionStatus: string
  listType: string
  listName: string
  optionalFilters: string[]
  showMore: boolean
  asOf: string
  confirmed: boolean
}

interface Rule {
  id: number
  /** How criteria inside this rule combine. */
  connector: 'AND' | 'OR'
  criteria: Criterion[]
}

let seq = 0
const nextId = () => ++seq

function newCriterion(): Criterion {
  return {
    id: nextId(),
    category: 'Contact Attributes',
    field: '',
    operator: '',
    value: '',
    valueTo: '',
    includeBoundary: false,
    frequency: 'At Least Once',
    recency: 'At Anytime',
    subscriptionType: 'Both',
    subscriptionStatus: 'Subscribed To',
    listType: 'Any List Type',
    listName: 'Any List',
    optionalFilters: [],
    showMore: false,
    asOf: 'today',
    confirmed: false,
  }
}
function newRule(): Rule {
  // The source defaults criteria within a rule to OR while the segment defaults
  // to AND. Both default to AND here so the two levels agree.
  return { id: nextId(), connector: 'AND', criteria: [newCriterion()] }
}

const name = ref('')
const nameTouched = ref(false)
const matchAll = ref(true)
const includeAllActive = ref(false)
const rules = ref<Rule[]>([newRule()])

// ── Field catalog ─────────────────────────────────────────────────────────────
/** Standard fields plus every custom field on the account. */
const fieldOptions = computed(() => [
  { type: 'subheader' as const, title: 'Standard fields' },
  ...STANDARD_FIELDS.map(f => ({ title: f.name, value: f.name })),
  { type: 'subheader' as const, title: 'Custom fields' },
  ...cdp.fields.map(f => ({ title: f.displayName || f.name, value: f.name })),
])

const fieldTypeByName = computed(() => {
  const map = new Map<string, SegmentFieldType>()
  for (const f of STANDARD_FIELDS) map.set(f.name, f.type)
  for (const f of cdp.fields) {
    const t = f.type.toLowerCase()
    map.set(f.name, (t === 'text' ? 'string' : t) as SegmentFieldType)
  }
  return map
})

function fieldType(c: Criterion): SegmentFieldType {
  return fieldTypeByName.value.get(c.field) ?? 'string'
}

/** The second select's options depend on the chosen category. */
function ruleOptions(c: Criterion) {
  if (c.category === 'Campaign Activity') {
    return CAMPAIGN_ACTIVITY_GROUPS.flatMap(g => [
      { type: 'subheader' as const, title: g.title },
      ...g.items.map(i => ({ title: i, value: i })),
    ])
  }
  if (c.category === 'Contact Attributes') return fieldOptions.value
  return CATEGORY_RULES[c.category].map(r => ({ title: r, value: r }))
}

function operatorOptions(c: Criterion): string[] {
  if (c.category !== 'Contact Attributes') return []
  const t = fieldType(c)
  if (c.field === 'Engagement Level') return ENGAGEMENT_LEVELS
  if (c.field === 'RFM Group') return RFM_GROUPS
  return OPERATORS_BY_TYPE[t]
}

function operatorLabel(c: Criterion): string {
  if (c.field === 'Engagement Level' || c.field === 'RFM Group') return 'Level'
  return OPERATOR_LABEL[fieldType(c)]
}

/** Categories that use the Frequency / Recency pair. */
function usesFrequency(c: Criterion): boolean {
  return c.category === 'Purchase Activity' || c.category === 'Campaign Activity'
}
function usesListDetails(c: Criterion): boolean {
  return c.category === 'Membership' && c.field === 'Lists'
}

function needsValue(c: Criterion): boolean {
  if (c.category !== 'Contact Attributes') return false
  if (!c.operator) return false
  if (VALUELESS_OPERATORS.has(c.operator)) return false
  if (fieldType(c) === 'boolean') return false
  if (c.field === 'Engagement Level' || c.field === 'RFM Group') return false
  return true
}
function needsRange(c: Criterion): boolean {
  return needsValue(c) && RANGE_OPERATORS.has(c.operator)
}
function isDateValue(c: Criterion): boolean {
  return needsValue(c) && fieldType(c) === 'datetime'
}
function isNumberValue(c: Criterion): boolean {
  const t = fieldType(c)
  return needsValue(c) && (t === 'float' || t === 'integer')
}

// ── Cascade resets ────────────────────────────────────────────────────────────
function onCategoryChange(c: Criterion) {
  c.field = ''
  c.operator = ''
  c.value = ''
  c.valueTo = ''
}
function onFieldChange(c: Criterion) {
  c.operator = ''
  c.value = ''
  c.valueTo = ''
}
function onOperatorChange(c: Criterion) {
  c.value = ''
  c.valueTo = ''
}

// ── Completeness ──────────────────────────────────────────────────────────────
function isComplete(c: Criterion): boolean {
  if (!c.category) return false
  if (!c.field) return false
  if (c.category !== 'Contact Attributes') return true
  if (!c.operator) return false
  if (!needsValue(c)) return true
  if (c.value.trim() === '') return false
  if (needsRange(c) && c.valueTo.trim() === '') return false
  return true
}

/** A plain-language restatement of a completed criterion. */
function summarize(c: Criterion): string {
  if (c.category !== 'Contact Attributes') {
    const bits = [c.field]
    if (usesFrequency(c)) bits.push(`${c.frequency.toLowerCase()}, ${c.recency.toLowerCase()}`)
    if (usesListDetails(c)) bits.push(`${c.subscriptionStatus.toLowerCase()} ${c.listName}`)
    return bits.join(' · ')
  }
  const parts = [c.field, c.operator.toLowerCase()]
  if (needsRange(c)) parts.push(`${c.value} and ${c.valueTo}`)
  else if (needsValue(c)) parts.push(`“${c.value}”`)
  return parts.join(' ')
}

const totalCriteria = computed(() => rules.value.reduce((n, r) => n + r.criteria.length, 0))
const atCriteriaCap = computed(() => totalCriteria.value >= MAX_CRITERIA)
const allComplete = computed(() => rules.value.every(r => r.criteria.every(isComplete)))
const incompleteCount = computed(
  () => rules.value.reduce((n, r) => n + r.criteria.filter(c => !isComplete(c)).length, 0),
)

const nameError = computed(() =>
  nameTouched.value && name.value.trim() === '' ? 'Enter a segment name' : '',
)
const canSave = computed(() => name.value.trim() !== '' && allComplete.value)

/** Why Save is disabled — the source explains nothing. */
const saveBlockedReason = computed(() => {
  if (canSave.value) return ''
  const bits: string[] = []
  if (name.value.trim() === '') bits.push('name this segment')
  if (incompleteCount.value > 0) {
    bits.push(`finish ${incompleteCount.value} ${incompleteCount.value === 1 ? 'criterion' : 'criteria'}`)
  }
  return `To save, ${bits.join(' and ')}.`
})

// ── Rule / criterion actions ──────────────────────────────────────────────────
// The source's ADD CRITERIA silently stops working once a criterion is
// confirmed: the counter increments but no row appears and Save stays disabled.
// Adding here is a plain array push, so it always produces a visible row.
function addCriterion(rule: Rule) {
  if (atCriteriaCap.value) return
  rule.criteria.push(newCriterion())
}
function removeCriterion(rule: Rule, id: number) {
  rule.criteria = rule.criteria.filter(c => c.id !== id)
  // The source silently deletes the whole rule when its last criterion goes.
  // Here an empty rule stays, with its own empty state and a delete control.
}
function addRule() {
  if (atCriteriaCap.value) return
  rules.value.push(newRule())
}
/** The source has no rule-level delete at all. */
function removeRule(id: number) {
  rules.value = rules.value.filter(r => r.id !== id)
  if (rules.value.length === 0) rules.value = [newRule()]
}

// ── AI panel ──────────────────────────────────────────────────────────────────
// The source opens this over the builder on every page load, before the user
// has expressed any intent. Here it opens only from "Build with AI".
const aiOpen = ref(false)
const aiPrompt = ref('')
const aiState = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const aiPreview = ref<string[]>([])
let aiTimer: ReturnType<typeof setTimeout> | undefined

function previewWithAi() {
  if (aiPrompt.value.trim() === '') return
  aiState.value = 'loading'
  aiPreview.value = []
  clearTimeout(aiTimer)
  // The source's preview spins forever with no result, error or timeout.
  // This one always resolves.
  aiTimer = setTimeout(() => {
    aiState.value = 'ready'
    aiPreview.value = [
      'Contact Attributes · created_at · in the past 30 days',
      'Campaign Activity · Opened Emails · at least once, in the past 30 days',
    ]
  }, 1200)
}

function applyAiRule() {
  const rule = newRule()
  const c = rule.criteria[0]!
  c.category = 'Contact Attributes'
  c.field = 'created_at'
  c.operator = 'In The Past'
  c.value = '30'
  rules.value.push(rule)
  aiOpen.value = false
  aiState.value = 'idle'
  aiPrompt.value = ''
  toast.success('Rule added from your description')
}

// ── Dirty guard ───────────────────────────────────────────────────────────────
function serializeForm(): string {
  return JSON.stringify({ n: name.value, m: matchAll.value, i: includeAllActive.value, r: rules.value })
}
const savedSnapshot = ref(serializeForm())
const isDirty = computed(() => serializeForm() !== savedSnapshot.value)

const {
  confirmLeave, allowNextLeave, discardAndLeave,
  leaveTitle, leaveMessage, leaveConfirmLabel,
} = useDirtyLeaveGuard(isDirty, {
  title: 'Leave without saving this segment?',
  message: 'You have unsaved changes. Leaving now will discard them.',
})

const saving = ref(false)

function save() {
  nameTouched.value = true
  if (!canSave.value || saving.value) return
  saving.value = true
  contacts.addSegment({
    name: name.value.trim(),
    description: `${totalCriteria.value} criteria across ${rules.value.length} ${rules.value.length === 1 ? 'rule' : 'rules'}`,
    count: 0,
    type: 'Next Gen',
    status: 'Active',
    matchLogic: matchAll.value ? 'all' : 'any',
  })
  savedSnapshot.value = serializeForm()
  toast.success('Segment created')
  allowNextLeave()
  setTimeout(() => router.push(backTo.value), 700)
}
</script>

<template>
  <div class="mp-frame-fill d-flex flex-column">
    <div class="px-8 pt-6 pb-4 bg-surface page-head">
      <MpPageHeader
        title="New segment"
        subtitle="Group contacts by the rules you define. Contacts move in and out as their data changes."
        :back-to="backTo"
      />
    </div>

    <div class="flex-grow-1 overflow-y-auto px-8 py-6 bg-background">
      <div class="sg-body mx-auto d-flex flex-column ga-6">
        <!-- Segment details -->
        <v-card flat border rounded="lg" class="pa-6">
          <MpFormSection title="Segment details" :heading-level="2" />
          <MpFormGrid :cols="1">
            <v-text-field
              v-model="name"
              label="Segment name *"
              counter="150"
              maxlength="150"
              :error-messages="nameError ? [nameError] : []"
              @blur="nameTouched = true"
            />

            <!-- The source's switch is labelled "AND (Match all)" whether it is
                 on or off, so nothing tells you the segment has become OR. -->
            <MpFormField
              label="How rules combine"
              :hint="matchAll
                ? 'A contact must match every rule below.'
                : 'A contact only has to match one of the rules below.'"
            >
              <template #default="{ labelId, descriptionId }">
                <v-switch
                  v-model="matchAll"
                  :aria-labelledby="labelId"
                  :aria-describedby="descriptionId"
                  :label="matchAll ? 'Match ALL rules (AND)' : 'Match ANY rule (OR)'"
                  hide-details
                />
              </template>
            </MpFormField>

            <MpFormField
              label="Include all active contacts"
              hint="By default a segment only includes contacts subscribed to at least one list. Turn this on to also include contacts with no list subscription and those unsubscribed from all lists. Contacts on the Do Not Mail list are still excluded."
            >
              <template #default="{ labelId, descriptionId }">
                <v-switch
                  v-model="includeAllActive"
                  :aria-labelledby="labelId"
                  :aria-describedby="descriptionId"
                  :label="includeAllActive ? 'Included' : 'Not included'"
                  hide-details
                />
              </template>
            </MpFormField>
          </MpFormGrid>
        </v-card>

        <!-- Rules -->
        <div
          v-for="(rule, ri) in rules"
          :key="rule.id"
          class="d-flex flex-column ga-3"
        >
          <!-- How this rule joins the previous one, mirroring the master switch. -->
          <div v-if="ri > 0" class="d-flex align-center ga-3">
            <v-divider />
            <v-chip size="small" variant="tonal" color="primary">
              {{ matchAll ? 'AND' : 'OR' }}
            </v-chip>
            <v-divider />
          </div>

          <v-card flat border rounded="lg" class="pa-6">
            <div class="d-flex align-center justify-space-between ga-3 mb-4">
              <!-- The source renders "Rule 1" as a span, so rules are invisible
                   to screen-reader heading navigation. -->
              <h2 class="text-subtitle-1 font-weight-bold mb-0">Rule {{ ri + 1 }}</h2>
              <!-- The source has no rule-level delete: the only way to remove a
                   rule is to delete its criteria one at a time. -->
              <v-btn
                variant="text"
                size="small"
                class="text-none"
                prepend-icon="trash-2"
                :disabled="rules.length === 1 && rule.criteria.length === 0"
                :aria-label="`Delete rule ${ri + 1}`"
                @click="removeRule(rule.id)"
              >
                Delete rule
              </v-btn>
            </div>

            <MpEmptyState
              v-if="rule.criteria.length === 0"
              icon="filter"
              title="This rule has no criteria"
              description="Add a criterion, or delete the rule."
              action-label="Add criterion"
              action-icon="plus"
              @action="addCriterion(rule)"
            />

            <div v-else class="d-flex flex-column ga-3">
              <template v-for="(crit, ci) in rule.criteria" :key="crit.id">
                <!-- How this criterion joins the previous one inside the rule.
                     The source renders two chips that swap position when
                     clicked, so the chip under the cursor changes meaning. -->
                <div v-if="ci > 0" class="d-flex align-center ga-2">
                  <v-btn-toggle
                    v-model="rule.connector"
                    mandatory
                    density="compact"
                    variant="outlined"
                    divided
                    :aria-label="`How criterion ${ci + 1} combines with the one above`"
                  >
                    <v-btn value="AND" size="small" class="text-none">AND</v-btn>
                    <v-btn value="OR" size="small" class="text-none">OR</v-btn>
                  </v-btn-toggle>
                  <v-divider />
                </div>

                <v-card flat border rounded="lg" class="pa-4 sg-criterion">
                  <div class="d-flex align-start justify-space-between ga-3">
                    <!-- Confirmed criteria collapse to a plain-language summary. -->
                    <div v-if="crit.confirmed" class="flex-grow-1 d-flex align-center ga-2 flex-wrap">
                      <v-icon size="16" color="success">circle-check</v-icon>
                      <span class="text-body-2">{{ summarize(crit) }}</span>
                    </div>

                    <div v-else class="flex-grow-1">
                      <MpFormGrid :cols="2">
                        <v-select
                          v-model="crit.category"
                          label="Category *"
                          :items="SEGMENT_CATEGORIES"
                          @update:model-value="onCategoryChange(crit)"
                        />
                        <v-autocomplete
                          v-model="crit.field"
                          :label="crit.category === 'Contact Attributes' ? 'Field *' : 'Rule *'"
                          :items="ruleOptions(crit)"
                          :placeholder="crit.category === 'Contact Attributes'
                            ? 'Search fields' : 'Choose a rule'"
                          @update:model-value="onFieldChange(crit)"
                        />

                        <v-select
                          v-if="crit.category === 'Contact Attributes' && crit.field"
                          v-model="crit.operator"
                          :label="`${operatorLabel(crit)} *`"
                          :items="operatorOptions(crit)"
                          @update:model-value="onOperatorChange(crit)"
                        />

                        <!-- Value, shaped by the operator -->
                        <v-text-field
                          v-if="needsValue(crit) && !needsRange(crit) && !isDateValue(crit)"
                          v-model="crit.value"
                          label="Value *"
                          :type="isNumberValue(crit) ? 'number' : 'text'"
                        />
                        <v-text-field
                          v-else-if="isDateValue(crit) && !needsRange(crit)"
                          v-model="crit.value"
                          label="Date *"
                          type="date"
                        />

                        <!-- The source renders the two range inputs with no
                             labels at all — aria-label null, placeholder "". -->
                        <template v-if="needsRange(crit)">
                          <v-text-field
                            v-model="crit.value"
                            label="From *"
                            :type="isDateValue(crit) ? 'date' : 'number'"
                          />
                          <v-text-field
                            v-model="crit.valueTo"
                            label="To *"
                            :type="isDateValue(crit) ? 'date' : 'number'"
                          />
                        </template>

                        <v-select
                          v-if="crit.field === 'Engagement Level' || crit.field === 'RFM Group'"
                          v-model="crit.asOf"
                          label="As of"
                          :items="AS_OF_OPTIONS"
                        />

                        <!-- Frequency / recency for activity categories -->
                        <template v-if="usesFrequency(crit) && crit.field">
                          <v-select v-model="crit.frequency" label="Frequency *" :items="FREQUENCY_OPTIONS" />
                          <v-select v-model="crit.recency" label="Recency *" :items="RECENCY_OPTIONS" />
                        </template>

                        <!-- List membership detail -->
                        <template v-if="usesListDetails(crit)">
                          <v-select v-model="crit.subscriptionType" label="Subscription type *" :items="SUBSCRIPTION_TYPES" />
                          <v-select v-model="crit.subscriptionStatus" label="Subscription status *" :items="SUBSCRIPTION_STATUSES" />
                          <v-select v-model="crit.listType" label="List type *" :items="LIST_TYPES" />
                          <v-autocomplete
                            v-model="crit.listName"
                            label="List name *"
                            :items="['Any List', ...cdp.lists.map(l => l.name)]"
                          />
                        </template>
                      </MpFormGrid>

                      <!-- Optional filters, behind the source's SHOW MORE OPTIONS -->
                      <div v-if="crit.category === 'Purchase Activity' && crit.field" class="mt-3">
                        <v-btn
                          variant="text"
                          size="small"
                          class="text-none"
                          :prepend-icon="crit.showMore ? 'chevron-up' : 'chevron-down'"
                          @click="crit.showMore = !crit.showMore"
                        >
                          {{ crit.showMore ? 'Fewer options' : 'More options' }}
                        </v-btn>
                        <v-select
                          v-if="crit.showMore"
                          v-model="crit.optionalFilters"
                          label="Optional filters"
                          :items="PURCHASE_OPTIONAL_FILTERS"
                          multiple
                          chips
                          class="mt-2"
                        />
                      </div>
                    </div>

                    <!-- Confirm / edit / delete. The source renders these as an
                         unnamed div and an untabbable icon, so neither is
                         reachable by keyboard. -->
                    <div class="d-flex align-center ga-1 flex-shrink-0">
                      <v-btn
                        v-if="!crit.confirmed"
                        icon="check"
                        variant="text"
                        size="small"
                        :disabled="!isComplete(crit)"
                        :aria-label="`Confirm criterion ${ci + 1}`"
                        @click="crit.confirmed = true"
                      />
                      <v-btn
                        v-else
                        icon="pencil"
                        variant="text"
                        size="small"
                        :aria-label="`Edit criterion ${ci + 1}`"
                        @click="crit.confirmed = false"
                      />
                      <v-btn
                        icon="trash-2"
                        variant="text"
                        size="small"
                        :aria-label="`Delete criterion ${ci + 1}`"
                        @click="removeCriterion(rule, crit.id)"
                      />
                    </div>
                  </div>
                </v-card>
              </template>

              <div class="d-flex ga-2 flex-wrap">
                <v-btn
                  variant="tonal"
                  size="small"
                  class="text-none"
                  prepend-icon="plus"
                  :disabled="atCriteriaCap"
                  @click="addCriterion(rule)"
                >
                  Add criterion
                </v-btn>
                <v-btn
                  variant="text"
                  size="small"
                  class="text-none"
                  prepend-icon="sparkles"
                  @click="aiOpen = true"
                >
                  Build with AI
                </v-btn>
              </div>
            </div>
          </v-card>
        </div>

        <div>
          <v-btn
            variant="tonal"
            class="text-none"
            prepend-icon="plus"
            :disabled="atCriteriaCap"
            @click="addRule"
          >
            Add rule
          </v-btn>
        </div>

        <!-- Criteria budget -->
        <div class="d-flex flex-column ga-1">
          <p class="text-body-2 font-weight-medium mb-0">
            {{ totalCriteria }} of {{ MAX_CRITERIA }} criteria used
          </p>
          <p class="text-caption text-medium-emphasis mb-0">
            A segment can hold up to {{ MAX_CRITERIA }} criteria. A high count slows the segment down.
          </p>
          <p class="text-caption text-medium-emphasis mb-0">
            Segments are calculated in Eastern Time (ET).
          </p>
        </div>
      </div>
    </div>

    <div class="px-8 py-4 bg-surface page-foot d-flex align-center justify-space-between ga-3 sg-foot">
      <p v-if="saveBlockedReason" class="text-caption text-medium-emphasis mb-0 sg-foot__hint">
        {{ saveBlockedReason }}
      </p>
      <span v-else />
      <div class="d-flex ga-3 sg-foot__actions">
        <v-btn variant="text" class="text-none" :to="backTo">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          prepend-icon="check"
          :disabled="!canSave"
          :loading="saving"
          @click="save"
        >
          Create segment
        </v-btn>
      </div>
    </div>

    <!-- Build with AI -->
    <MpFormDrawer v-model="aiOpen" title="Build with AI" size="lg">
      <p class="text-body-2 text-medium-emphasis">
        Describe the contacts you want in plain English and we'll turn it into a rule.
        This currently supports a limited set of records.
      </p>

      <MpFormSection title="Describe the rule" :heading-level="3" />
      <MpFormGrid :cols="1">
        <v-textarea
          v-model="aiPrompt"
          label="Segment rule *"
          rows="3"
          counter="1000"
          maxlength="1000"
          placeholder="Subscribers who have not purchased in the last 30 days"
        />
        <MpFormField label="Or start from an example">
          <template #default="{ labelId }">
            <div :aria-labelledby="labelId" class="d-flex flex-column ga-1">
              <v-btn
                v-for="p in AI_PROMPTS"
                :key="p"
                variant="text"
                size="small"
                class="text-none justify-start"
                @click="aiPrompt = p"
              >
                {{ p }}
              </v-btn>
            </div>
          </template>
        </MpFormField>
      </MpFormGrid>

      <MpFormSection title="Preview" :heading-level="3" />
      <!-- The source's preview spins indefinitely with no result, error or
           timeout. Every state here resolves. -->
      <div v-if="aiState === 'loading'" class="d-flex flex-column ga-2">
        <v-skeleton-loader type="text" />
        <v-skeleton-loader type="text" />
      </div>
      <v-alert v-else-if="aiState === 'error'" type="error" variant="tonal" density="compact" rounded="lg">
        We couldn't turn that description into a rule. Try rewording it.
      </v-alert>
      <ul v-else-if="aiState === 'ready'" class="sg-ai-preview">
        <li v-for="line in aiPreview" :key="line" class="text-body-2">{{ line }}</li>
      </ul>
      <p v-else class="text-body-2 text-medium-emphasis mb-0">
        Describe a rule above, then choose Preview.
      </p>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="aiOpen = false">Cancel</v-btn>
        <v-btn
          variant="tonal"
          class="text-none"
          :disabled="aiPrompt.trim() === '' || aiState === 'loading'"
          :loading="aiState === 'loading'"
          @click="previewWithAi"
        >
          Preview
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          :disabled="aiState !== 'ready'"
          @click="applyAiRule"
        >
          Add as rule
        </v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmLeave"
      danger
      :title="leaveTitle"
      :message="leaveMessage"
      :confirm-label="leaveConfirmLabel"
      @confirm="discardAndLeave"
    />
  </div>
</template>

<style scoped lang="scss">
.sg-body {
  width: 100%;
  /* Wider than the 880px form measure — a criterion row carries up to four
     controls side by side. */
  max-width: 1040px;
}

/* GAP: no MpFormPage shell exists, so the sticky head/foot rules are copied from
   CreateContact.vue — see docs/rebuild/GAPS.md §5. */
.page-head {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.page-head :deep(.mp-page-header) {
  margin-bottom: 0;
}

.page-foot {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.sg-criterion {
  background: rgb(var(--v-theme-background));
}

.sg-ai-preview {
  margin: 0;
  padding-inline-start: var(--mp-space-20);
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-4);
}

@media (max-width: $mp-layout-breakpointCompact) {
  .sg-foot {
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .sg-foot__hint {
    flex: 1 0 100%;
  }

  .sg-foot__actions {
    flex: 0 0 auto;
  }
}
</style>
