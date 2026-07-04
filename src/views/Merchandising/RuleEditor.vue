<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpErrorState from '@/components/MpErrorState.vue'
import MerchProductCard from '@/components/merchandising/MerchProductCard.vue'
import {
  useMerchandisingStore,
  applyRuleToProducts,
  MERCH_FIELD_OPTIONS,
  type MerchCondition,
  type MerchConditionAction,
} from '@/stores/useMerchandising'

const route = useRoute()
const router = useRouter()
const store = useMerchandisingStore()

const listRoute = computed(() => `/commerce/${route.params.accountId}/merchandising/default-merchandising`)

/* ── Mode ─────────────────────────────────────────────────────── */
const ruleId = computed(() => String(route.params.ruleId))
const isNew = computed(() => ruleId.value === 'new')
const sourceRule = computed(() => (isNew.value ? null : store.getMerchRule(ruleId.value)))
const notFound = computed(() => !isNew.value && !sourceRule.value)

/* ── Editable draft (committed on Save) ───────────────────────── */
const draft = ref({
  name: sourceRule.value?.name ?? '',
  active: sourceRule.value?.active ?? true,
  collectionIds: [...(sourceRule.value?.collectionIds ?? [])],
  popularityWeight: sourceRule.value?.popularityWeight ?? 1,
  conditions: (sourceRule.value?.conditions ?? []).map((c) => ({ ...c, values: [...c.values] })),
})
const savedSnapshot = ref(JSON.stringify(draft.value))
const dirty = computed(() => JSON.stringify(draft.value) !== savedSnapshot.value)
const canSave = computed(() => dirty.value && draft.value.name.trim().length > 0 && draft.value.collectionIds.length > 0)

const collectionOptions = computed(() => store.collectionList.map((c) => ({ title: c.name, value: c.id })))

/* ── Popularity weight (Findify stops: 0 / 0.5x / 1x / 50x / 100x) ── */
const WEIGHT_STOPS = [0, 0.5, 1, 50, 100]
const WEIGHT_LABELS = ['0', '0.5x', '1x', '50x', '100x']
const advancedOpen = ref(false)
const weightIndex = computed({
  get: () => {
    const idx = WEIGHT_STOPS.indexOf(draft.value.popularityWeight)
    return idx === -1 ? 2 : idx
  },
  set: (idx: number) => { draft.value.popularityWeight = WEIGHT_STOPS[idx] ?? 1 },
})

/* ── Conditions: inline add/edit row ──────────────────────────── */
const ACTION_OPTIONS: Array<{ title: string; value: MerchConditionAction }> = [
  { title: 'Include', value: 'include' },
  { title: 'Exclude', value: 'exclude' },
  { title: 'Promote', value: 'promote' },
]

const editingId = ref<string | null>(null) // condition id being edited, or 'new'
const conditionDraft = ref<{ action: MerchConditionAction; weight: number; field: string; values: string[] }>({
  action: 'promote', weight: 50, field: '', values: [],
})

const fieldOptions = Object.keys(MERCH_FIELD_OPTIONS)
const valueOptions = computed(() => MERCH_FIELD_OPTIONS[conditionDraft.value.field] ?? [])
const conditionValid = computed(() => !!conditionDraft.value.field && conditionDraft.value.values.length > 0)

watch(() => conditionDraft.value.field, () => { conditionDraft.value.values = [] })

function startAddCondition() {
  editingId.value = 'new'
  conditionDraft.value = { action: 'promote', weight: 50, field: '', values: [] }
}

function startEditCondition(condition: MerchCondition) {
  editingId.value = condition.id
  conditionDraft.value = {
    action: condition.action,
    weight: condition.weight ?? 50,
    field: condition.field,
    values: [...condition.values],
  }
}

function confirmCondition() {
  if (!conditionValid.value) return
  const payload: MerchCondition = {
    id: editingId.value === 'new' ? `mc${Date.now()}` : editingId.value!,
    action: conditionDraft.value.action,
    field: conditionDraft.value.field,
    values: [...conditionDraft.value.values],
    ...(conditionDraft.value.action === 'promote' ? { weight: conditionDraft.value.weight } : {}),
  }
  if (editingId.value === 'new') {
    draft.value.conditions.push(payload)
  } else {
    const idx = draft.value.conditions.findIndex((c) => c.id === editingId.value)
    if (idx !== -1) draft.value.conditions[idx] = payload
  }
  editingId.value = null
}

function cancelCondition() {
  editingId.value = null
}

function removeCondition(id: string) {
  draft.value.conditions = draft.value.conditions.filter((c) => c.id !== id)
}

function conditionActionLabel(condition: MerchCondition) {
  if (condition.action === 'promote') return `Promote / (${condition.weight ?? 0})`
  return condition.action === 'include' ? 'Include' : 'Exclude'
}

/* ── Preview (live, reflects the draft) ───────────────────────── */
const previewCollectionId = ref(draft.value.collectionIds[0] ?? '')
watch(() => draft.value.collectionIds, (ids) => {
  if (!ids.includes(previewCollectionId.value)) previewCollectionId.value = ids[0] ?? ''
})

const previewExpanded = ref(false)

const previewProducts = computed(() => {
  const pinning = store.pinningRuleList.find((r) => r.collectionId === previewCollectionId.value)
  const pinnedIds = pinning?.pinnedProductIds ?? []
  const pinned = pinnedIds
    .map((id) => store.merchProductList.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)
  const rest = store.merchProductList.filter((p) => !pinnedIds.includes(p.id))
  const ordered = applyRuleToProducts(draft.value, rest)
  return { pinned, ordered }
})

const previewGrid = computed(() => {
  const rows = [
    ...previewProducts.value.pinned.map((p) => ({ product: p, pinned: true })),
    ...previewProducts.value.ordered.map((p) => ({ product: p, pinned: false })),
  ]
  return previewExpanded.value ? rows : rows.slice(0, 8)
})

/* ── Save / delete ────────────────────────────────────────────── */
const saveSnack = ref(false)
const confirmDelete = ref(false)

function save() {
  if (!canSave.value) return
  let id = ruleId.value
  if (isNew.value) {
    id = store.createMerchRule().id
  }
  store.saveMerchRule({ id, ...draft.value, updatedAt: '' })
  savedSnapshot.value = JSON.stringify(draft.value)
  saveSnack.value = true
  if (isNew.value) router.replace(`${listRoute.value}/rules/${id}`)
}

function performDelete() {
  if (sourceRule.value) store.deleteMerchRule(sourceRule.value.id)
  confirmDelete.value = false
  router.push(listRoute.value)
}
</script>

<template>
  <div v-if="!notFound" class="d-flex flex-column gap-4">
    <MpPageHeader
      :title="draft.name || 'New merchandising rule'"
      :subtitle="`${draft.conditions.length} conditions · ${draft.collectionIds.length} collections`"
      :back-to="listRoute"
    >
      <template #actions>
        <v-btn
          v-if="!isNew"
          variant="flat"
          color="surface"
          class="text-none"
          prepend-icon="trash-2"
          @click="confirmDelete = true"
        >
          Delete
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          prepend-icon="check"
          :disabled="!canSave"
          @click="save"
        >
          Save
        </v-btn>
      </template>
    </MpPageHeader>

    <div class="rule-layout d-flex gap-4 align-start">
      <!-- Editor column -->
      <div class="rule-editor d-flex flex-column gap-4 flex-grow-1">
        <v-card variant="flat" border rounded="lg" class="pa-5">
          <v-text-field
            v-model="draft.name"
            label="Rule name"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-select
            v-model="draft.collectionIds"
            :items="collectionOptions"
            label="Collections"
            variant="outlined"
            density="comfortable"
            multiple
            chips
            closable-chips
            hint="The rule applies to every selected collection"
            persistent-hint
          />

          <button type="button" class="rule-advanced-toggle mt-4" @click="advancedOpen = !advancedOpen">
            <v-icon size="15">{{ advancedOpen ? 'chevron-down' : 'chevron-right' }}</v-icon>
            Advanced settings
          </button>
          <v-expand-transition>
            <div v-if="advancedOpen" class="pt-3">
              <div class="text-subtitle-2 font-weight-bold mb-1">Popularity weight</div>
              <div class="text-body-2 text-medium-emphasis mb-2">
                At 0 the popularity boost is disabled. Increase it to weight results toward popular products.
              </div>
              <v-slider
                v-model="weightIndex"
                :min="0"
                :max="4"
                :step="1"
                show-ticks="always"
                :ticks="Object.fromEntries(WEIGHT_LABELS.map((l, i) => [i, l]))"
                color="primary"
                hide-details
                class="mx-2"
              />
            </div>
          </v-expand-transition>
        </v-card>

        <!-- Conditions -->
        <v-card variant="flat" border rounded="lg">
          <div class="d-flex align-center justify-space-between px-5 py-4">
            <span class="text-subtitle-2 font-weight-bold">Conditions</span>
            <v-btn
              color="primary"
              variant="flat"
              size="small"
              class="text-none"
              prepend-icon="plus"
              :disabled="editingId !== null"
              @click="startAddCondition"
            >
              Add condition
            </v-btn>
          </div>
          <v-divider />

          <!-- Inline add/edit row -->
          <div v-if="editingId !== null" class="rule-condition-form px-5 py-4 d-flex flex-column gap-3">
            <div class="d-flex gap-3 flex-wrap">
              <v-select
                v-model="conditionDraft.action"
                :items="ACTION_OPTIONS"
                label="Action"
                variant="outlined"
                density="compact"
                hide-details
                class="rule-field-action"
              />
              <v-select
                v-model="conditionDraft.field"
                :items="fieldOptions"
                label="Field"
                variant="outlined"
                density="compact"
                hide-details
                class="rule-field-field"
              />
              <v-select
                v-model="conditionDraft.values"
                :items="valueOptions"
                label="Values"
                variant="outlined"
                density="compact"
                hide-details
                multiple
                chips
                closable-chips
                :disabled="!conditionDraft.field"
                class="rule-field-values flex-grow-1"
              />
            </div>
            <div v-if="conditionDraft.action === 'promote'" class="px-1">
              <div class="d-flex justify-space-between text-caption text-medium-emphasis mb-1">
                <span>Bury</span><span>Boost</span>
              </div>
              <v-slider
                v-model="conditionDraft.weight"
                :min="-100"
                :max="100"
                :step="10"
                color="primary"
                thumb-label
                hide-details
              />
            </div>
            <div class="d-flex justify-end gap-2">
              <v-btn variant="text" size="small" class="text-none" @click="cancelCondition">Cancel</v-btn>
              <v-btn
                color="primary"
                variant="flat"
                size="small"
                class="text-none"
                :disabled="!conditionValid"
                @click="confirmCondition"
              >
                {{ editingId === 'new' ? 'Add' : 'Update' }}
              </v-btn>
            </div>
          </div>
          <v-divider v-if="editingId !== null" />

          <v-table v-if="draft.conditions.length" density="comfortable">
            <thead>
              <tr>
                <th class="text-caption font-weight-bold">Action</th>
                <th class="text-caption font-weight-bold">Field</th>
                <th class="text-caption font-weight-bold">Values</th>
                <th style="width: 56px" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="condition in draft.conditions" :key="condition.id">
                <td class="text-body-2 font-weight-medium text-no-wrap">{{ conditionActionLabel(condition) }}</td>
                <td class="text-body-2 text-medium-emphasis">{{ condition.field }}</td>
                <td>
                  <div class="d-flex gap-1 flex-wrap py-1">
                    <v-chip v-for="value in condition.values" :key="value" size="x-small" variant="tonal">{{ value }}</v-chip>
                  </div>
                </td>
                <td class="text-end">
                  <v-menu location="bottom end">
                    <template #activator="{ props: menuProps }">
                      <v-btn
                        v-bind="menuProps"
                        icon="more-vertical"
                        variant="text"
                        size="small"
                        density="comfortable"
                        color="medium-emphasis"
                        :aria-label="`Condition actions for ${condition.field}`"
                      />
                    </template>
                    <v-list density="compact" rounded="lg" min-width="160" elevation="3" class="py-1">
                      <v-list-item prepend-icon="pencil" title="Edit" @click="startEditCondition(condition)" />
                      <v-divider class="my-1" style="opacity: 0.4" />
                      <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="removeCondition(condition.id)" />
                    </v-list>
                  </v-menu>
                </td>
              </tr>
            </tbody>
          </v-table>
          <MpEmptyState
            v-else-if="editingId === null"
            icon="list-plus"
            title="No conditions yet"
            description="Add a condition to include, exclude, or promote products in the selected collections."
            action-label="Add condition"
            action-icon="plus"
            class="py-8"
            @action="startAddCondition"
          />
        </v-card>
      </div>

      <!-- Preview column -->
      <v-card variant="flat" border rounded="lg" class="rule-preview flex-shrink-0">
        <div class="d-flex align-center justify-space-between px-4 py-3">
          <span class="text-subtitle-2 font-weight-bold">Preview</span>
          <v-btn
            :icon="previewExpanded ? 'minimize-2' : 'maximize-2'"
            variant="text"
            size="small"
            density="comfortable"
            :aria-label="previewExpanded ? 'Collapse preview' : 'Expand preview'"
            @click="previewExpanded = !previewExpanded"
          />
        </div>
        <v-divider />
        <div class="pa-4">
          <v-select
            v-model="previewCollectionId"
            :items="collectionOptions.filter((c) => draft.collectionIds.includes(c.value))"
            label="Collection"
            variant="outlined"
            density="compact"
            hide-details
            class="mb-4"
          />
          <div v-if="!previewCollectionId" class="text-body-2 text-medium-emphasis text-center py-8">
            Select at least one collection to preview the rule.
          </div>
          <div v-else class="rule-preview-grid" :class="{ 'rule-preview-grid--expanded': previewExpanded }">
            <MerchProductCard
              v-for="(entry, index) in previewGrid"
              :key="entry.product.id"
              :product="entry.product"
              :pinned="entry.pinned"
              :rank="index + 1"
              :interactive="false"
            />
          </div>
        </div>
      </v-card>
    </div>

    <!-- Delete confirm -->
    <v-dialog :model-value="confirmDelete" max-width="440" @update:model-value="confirmDelete = false">
      <v-card rounded="lg">
        <v-card-title class="pa-5 text-h6 font-weight-bold">Delete “{{ draft.name }}”?</v-card-title>
        <v-card-text class="pb-2 text-body-2 text-medium-emphasis">
          Product ordering in the affected collections reverts to default ranking.
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" class="text-none" @click="confirmDelete = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" class="text-none" @click="performDelete">Delete rule</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="saveSnack" :timeout="2500" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> Merchandising rule saved</div>
    </v-snackbar>
  </div>

  <div v-else class="pa-10">
    <MpErrorState
      icon="list-x"
      title="Merchandising rule not found"
      description="This rule may have been deleted, or the link is incorrect."
      action-label="Back to Default Merchandising"
      action-icon="arrow-left"
      @action="router.push(listRoute)"
    />
  </div>
</template>

<style scoped>
.rule-editor {
  min-width: 0;
}

.rule-preview {
  width: 380px;
  position: sticky;
  top: 16px;
}

.rule-preview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  max-height: 60vh;
  overflow-y: auto;
}

.rule-preview-grid--expanded {
  grid-template-columns: repeat(3, 1fr);
  max-height: none;
}

.rule-advanced-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.rule-advanced-toggle:hover {
  color: rgb(var(--v-theme-primary));
}

.rule-condition-form {
  background: rgba(var(--v-theme-surface-variant), 0.18);
}

.rule-field-action {
  width: 160px;
  flex: 0 0 auto;
}

.rule-field-field {
  width: 170px;
  flex: 0 0 auto;
}

.rule-field-values {
  min-width: 220px;
}

@media (max-width: 1100px) {
  .rule-layout {
    flex-direction: column;
  }

  .rule-preview {
    width: 100%;
    position: static;
  }

  .rule-preview-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>
