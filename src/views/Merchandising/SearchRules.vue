<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormField from '@/components/MpFormField.vue'
import {
  useMerchandisingStore,
  MERCH_CONDITION_ACTION_LABELS,
  type MerchCondition,
  type MerchConditionAction,
  type MerchConditionApplyTo,
  type SearchRule,
} from '@/stores/useMerchandising'

const store = useMerchandisingStore()
const search = ref('')

const headers = [
  { title: 'Status', key: 'status', sortable: false, width: 140 },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Search terms', key: 'terms', sortable: false },
  { title: 'Updated', key: 'updatedAt', sortable: true, align: 'end' as const, width: 160 },
  { title: '', key: 'actions', sortable: false, width: 64 },
]

// Findify condition types (crawled order): Promote · Pin · Only include · Exclude
const actionOptions: Array<{ title: string; value: MerchConditionAction }> = (
  ['promote', 'pin', 'include', 'exclude'] as MerchConditionAction[]
).map((value) => ({ title: MERCH_CONDITION_ACTION_LABELS[value], value }))

const applyToOptions: Array<{ title: string; value: MerchConditionApplyTo }> = [
  { title: 'Both', value: 'both' },
  { title: 'Product', value: 'product' },
  { title: 'Variant', value: 'variant' },
]

// Findify's boost slider quick presets (Bury / Lower / Higher / Boost)
const WEIGHT_PRESETS = [
  { label: 'Bury', value: -99 },
  { label: 'Lower', value: -30 },
  { label: 'Higher', value: 30 },
  { label: 'Boost', value: 90 },
]

const filteredRules = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return store.searchRuleList
  return store.searchRuleList.filter(
    (rule) =>
      rule.name.toLowerCase().includes(term) ||
      rule.terms.some((t) => t.toLowerCase().includes(term)),
  )
})

// ── Create / edit drawer ─────────────────────────────────────────
const drawer = ref(false)
const editing = ref(false)
const editingId = ref('')
const form = ref<{ name: string; terms: string[]; conditions: MerchCondition[] }>({
  name: '',
  terms: [],
  conditions: [],
})

const formValid = computed(() => Boolean(form.value.name.trim()) && form.value.terms.length > 0)

function openCreate() {
  form.value = { name: '', terms: [], conditions: [] }
  editing.value = false
  editingId.value = ''
  drawer.value = true
}

function openEdit(rule: SearchRule) {
  form.value = {
    name: rule.name,
    terms: [...rule.terms],
    conditions: rule.conditions.map((c) => ({ ...c, applyTo: c.applyTo ?? 'both', values: [...c.values] })),
  }
  editing.value = true
  editingId.value = rule.id
  drawer.value = true
}

function addCondition() {
  form.value.conditions.push({
    id: `src${Date.now()}-${form.value.conditions.length}`,
    action: 'promote',
    applyTo: 'both',
    weight: 30,
    field: '',
    values: [],
  })
}

// Findify defaults a fresh Promote condition to a positive boost.
function onActionChange(condition: MerchCondition) {
  if (condition.action === 'promote' && condition.weight === undefined) condition.weight = 30
}

// Findify caps rules at 9 promote conditions.
const promoteCount = computed(() => form.value.conditions.filter((c) => c.action === 'promote').length)

function removeCondition(index: number) {
  form.value.conditions.splice(index, 1)
}

// The preset chips are index-selected, like every other preset row in the system.
function weightPresetIndex(condition: MerchCondition) {
  const index = WEIGHT_PRESETS.findIndex((preset) => preset.value === condition.weight)
  return index === -1 ? undefined : index
}

function onWeightPreset(condition: MerchCondition, index: number | undefined) {
  const preset = index == null ? undefined : WEIGHT_PRESETS[index]
  if (preset) condition.weight = preset.value
}

function saveRule() {
  if (!formValid.value) return
  const payload = {
    name: form.value.name.trim(),
    terms: form.value.terms,
    conditions: form.value.conditions,
  }
  if (editing.value) {
    store.saveSearchRule(editingId.value, payload)
  } else {
    store.createSearchRule(payload)
  }
  drawer.value = false
}

// ── Delete flow ──────────────────────────────────────────────────
const deleteDialog = ref(false)
const rulePendingDelete = ref<SearchRule | null>(null)

function askDelete(rule: SearchRule) {
  rulePendingDelete.value = rule
  deleteDialog.value = true
}

function confirmDelete() {
  if (rulePendingDelete.value) store.deleteSearchRule(rulePendingDelete.value.id)
  rulePendingDelete.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Merchandising rules"
      :subtitle="`Boost, bury or exclude products for search terms on ${store.activeStore.domain}`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="plus" @click="openCreate">
          New rule
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card flat border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Rules"
        search-placeholder="Search rules…"
        :total-count="filteredRules.length"
      />

      <v-data-table
        :headers="headers"
        :items="filteredRules"
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="15"
        fixed-header
        class="flex-grow-1"
      >
        <!-- Row switch: `hide-details` is deliberate so a table row stays one line tall. -->
        <template #item.status="{ item }">
          <div class="d-flex align-center gap-2">
            <v-switch
              :model-value="item.status === 'active'"
              color="success"
              density="compact"
              hide-details
              :aria-label="`Toggle ${item.name}`"
              @update:model-value="store.toggleSearchRuleStatus(item.id)"
            />
            <span
              class="text-caption font-weight-medium"
              :class="item.status === 'active' ? 'text-success' : 'text-medium-emphasis'"
            >
              {{ item.status === 'active' ? 'Enabled' : 'Disabled' }}
            </span>
          </div>
        </template>

        <template #item.name="{ item }">
          <a class="text-body-2 font-weight-bold text-primary cursor-pointer" @click="openEdit(item)">
            {{ item.name }}
          </a>
        </template>

        <template #item.terms="{ item }">
          <div class="d-flex flex-wrap gap-1">
            <v-chip
              v-for="term in item.terms"
              :key="term"
              size="x-small"
              variant="tonal"
              color="default"
              class="font-weight-medium"
            >
              {{ term }}
            </v-chip>
          </div>
        </template>

        <template #item.updatedAt="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ item.updatedAt }}</span>
        </template>

        <template #item.actions="{ item }">
          <MpRowActionsMenu :ariaLabel="`Actions for ${item.name}`">
            <v-list-item title="Edit" prepend-icon="pencil" @click="openEdit(item)" />
            <v-divider class="my-1" />
            <v-list-item title="Delete" prepend-icon="trash-2" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>

        <template #no-data>
          <MpEmptyState
            icon="sliders-horizontal"
            :title="search ? 'No rules match your search' : 'No merchandising rules yet'"
            :description="search ? 'Try a different keyword.' : 'Create a rule to boost, bury or exclude products when shoppers search specific terms.'"
            :action-label="!search ? 'New rule' : undefined"
            action-icon="plus"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpConfirmDialog
      v-model="deleteDialog"
      title="Delete rule?"
      :message="rulePendingDelete ? `“${rulePendingDelete.name}” will be removed and will stop affecting search results.` : ''"
      confirm-label="Delete rule"
      danger
      @confirm="confirmDelete"
    />

    <MpFormDrawer
      v-model="drawer"
      :title="editing ? 'Edit rule' : 'New rule'"
      :subtitle="store.activeStore.domain" size="lg"
    >
      <MpFormSection title="General" />
      <MpFormGrid>
        <v-text-field
          v-model="form.name"
          label="Rule name *"
          placeholder="e.g. Boost denim on jeans searches"
          :rules="[(v: string) => Boolean(v?.trim()) || 'Rule name is required']"
        />
        <v-combobox
          v-model="form.terms"
          label="Search terms *"
          hint="The rule applies when a shopper searches any of these terms — press Enter to add"
          persistent-hint
          multiple
          chips
          closable-chips
        />
      </MpFormGrid>

      <MpFormSection
        title="Conditions"
        description="Target products by field when one of the search terms is used."
      />
      <MpFormGrid>
        <v-alert
          v-if="promoteCount >= 9"
          type="warning"
          variant="tonal"
          density="compact"
          text="Rules support a maximum of 9 Promote conditions."
        />
        <p v-if="form.conditions.length === 0" class="text-body-2 text-medium-emphasis mb-0">
          No conditions yet — add one to target products by field.
        </p>
        <v-card
          v-for="(condition, index) in form.conditions"
          :key="condition.id"
          flat
          border
          rounded="lg"
          class="condition-card"
        >
          <MpFormGrid>
            <div class="mp-form-grid__trailing">
              <MpFormGrid :cols="2">
                <v-select
                  v-model="condition.action"
                  :items="actionOptions"
                  label="Condition type"
                  @update:model-value="onActionChange(condition)"
                />
                <v-text-field
                  v-model="condition.field"
                  label="Field"
                  placeholder="e.g. Brand"
                />
              </MpFormGrid>
              <v-btn
                icon="trash-2"
                variant="text"
                size="small"
                class="text-medium-emphasis"
                :aria-label="`Remove condition ${index + 1}`"
                @click="removeCondition(index)"
              />
            </div>

            <MpFormField label="Apply to">
              <template #default="{ labelId }">
                <div>
                  <v-btn-toggle v-model="condition.applyTo" mandatory :aria-labelledby="labelId">
                    <v-btn
                      v-for="option in applyToOptions"
                      :key="option.value"
                      :value="option.value"
                      class="text-none"
                    >
                      {{ option.title }}
                    </v-btn>
                  </v-btn-toggle>
                </div>
              </template>
            </MpFormField>

            <v-combobox
              v-model="condition.values"
              label="Values"
              multiple
              chips
              closable-chips
            />

            <template v-if="condition.action === 'promote'">
              <MpFormField label="Boost strength" :hint="`Currently ${condition.weight ?? 0}`">
                <template #default="{ labelId, descriptionId }">
                  <v-slider
                    v-model="condition.weight"
                    :min="-99"
                    :max="90"
                    :step="1"
                    :aria-labelledby="labelId"
                    :aria-describedby="descriptionId"
                  />
                </template>
              </MpFormField>
              <MpFormField label="Presets" hint="Sets the boost strength above.">
                <v-chip-group
                  :model-value="weightPresetIndex(condition)"
                  @update:model-value="onWeightPreset(condition, $event)"
                >
                  <v-chip v-for="preset in WEIGHT_PRESETS" :key="preset.label" filter>
                    {{ preset.label }}
                  </v-chip>
                </v-chip-group>
              </MpFormField>
            </template>
          </MpFormGrid>
        </v-card>
        <div>
          <v-btn variant="text" size="small" class="text-none" prepend-icon="plus" @click="addCondition">
            Add condition
          </v-btn>
        </div>
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!formValid" @click="saveRule">
          {{ editing ? 'Save rule' : 'Create rule' }}
        </v-btn>
      </template>
    </MpFormDrawer>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.condition-card {
  padding: var(--mp-component-card-paddingCompact);
}
</style>
