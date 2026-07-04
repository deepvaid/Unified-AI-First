<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpErrorState from '@/components/MpErrorState.vue'
import MerchProductCard from '@/components/merchandising/MerchProductCard.vue'
import {
  useMerchandisingStore,
  engineRecommendationPreview,
  ENGINE_TYPE_LABELS,
  ENGINE_TYPE_DESCRIPTIONS,
  ENGINE_TYPE_ICONS,
  ENGINE_PAGE_LABELS,
  MERCH_FIELD_OPTIONS,
  type EnginePage,
  type EngineType,
  type MerchCondition,
} from '@/stores/useMerchandising'

const route = useRoute()
const router = useRouter()
const store = useMerchandisingStore()

const listRoute = computed(() => `/commerce/${route.params.accountId}/merchandising/recommendations`)

/* ── Mode ─────────────────────────────────────────────────────── */
const engineId = computed(() => String(route.params.engineId))
const isNew = computed(() => engineId.value === 'new')
const sourceEngine = computed(() => (isNew.value ? null : store.getEngine(engineId.value)))
const notFound = computed(() => !isNew.value && !sourceEngine.value)

/* ── Wizard stage (new engines pick a type first) ─────────────── */
const stage = ref<'type' | 'config'>(isNew.value ? 'type' : 'config')

const ENGINE_TYPES = Object.keys(ENGINE_TYPE_LABELS) as EngineType[]

/* ── Editable draft ───────────────────────────────────────────── */
const draft = ref({
  name: sourceEngine.value?.name ?? '',
  page: (sourceEngine.value?.page ?? 'product') as EnginePage,
  type: (sourceEngine.value?.type ?? 'personalized') as EngineType,
  productCount: sourceEngine.value?.productCount ?? 8,
  conditions: (sourceEngine.value?.conditions ?? []).map((c) => ({ ...c, values: [...c.values] })),
})
const savedSnapshot = ref(JSON.stringify(draft.value))
const dirty = computed(() => JSON.stringify(draft.value) !== savedSnapshot.value)
const canSave = computed(() => (dirty.value || isNew.value) && draft.value.name.trim().length > 0)

function chooseType(type: EngineType) {
  draft.value.type = type
  if (!draft.value.name) draft.value.name = ENGINE_TYPE_LABELS[type]
  stage.value = 'config'
}

const pageOptions = Object.entries(ENGINE_PAGE_LABELS).map(([value, title]) => ({
  title: `${title} page`,
  value,
}))

const countOptions = [4, 8, 12].map((n) => ({ title: `${n} products`, value: n }))

/* ── Filters (include/exclude only) ───────────────────────────── */
const editingId = ref<string | null>(null)
const conditionDraft = ref<{ action: 'include' | 'exclude'; field: string; values: string[] }>({
  action: 'include', field: '', values: [],
})
const fieldOptions = Object.keys(MERCH_FIELD_OPTIONS)
const valueOptions = computed(() => MERCH_FIELD_OPTIONS[conditionDraft.value.field] ?? [])
const conditionValid = computed(() => !!conditionDraft.value.field && conditionDraft.value.values.length > 0)

watch(() => conditionDraft.value.field, () => { conditionDraft.value.values = [] })

function startAddCondition() {
  editingId.value = 'new'
  conditionDraft.value = { action: 'include', field: '', values: [] }
}

function startEditCondition(condition: MerchCondition) {
  editingId.value = condition.id
  conditionDraft.value = {
    action: condition.action === 'exclude' ? 'exclude' : 'include',
    field: condition.field,
    values: [...condition.values],
  }
}

function confirmCondition() {
  if (!conditionValid.value) return
  const payload: MerchCondition = {
    id: editingId.value === 'new' ? `ec${Date.now()}` : editingId.value!,
    action: conditionDraft.value.action,
    field: conditionDraft.value.field,
    values: [...conditionDraft.value.values],
  }
  if (editingId.value === 'new') {
    draft.value.conditions.push(payload)
  } else {
    const idx = draft.value.conditions.findIndex((c) => c.id === editingId.value)
    if (idx !== -1) draft.value.conditions[idx] = payload
  }
  editingId.value = null
}

function removeCondition(id: string) {
  draft.value.conditions = draft.value.conditions.filter((c) => c.id !== id)
}

/* ── Preview ──────────────────────────────────────────────────── */
const previewProducts = computed(() =>
  engineRecommendationPreview(draft.value, store.merchProductList),
)

/* ── Save / delete ────────────────────────────────────────────── */
const saveSnack = ref(false)
const confirmDelete = ref(false)

function save() {
  if (!canSave.value) return
  if (isNew.value) {
    const created = store.createEngine({ ...draft.value })
    savedSnapshot.value = JSON.stringify(draft.value)
    saveSnack.value = true
    router.replace(`${listRoute.value}/${created.id}`)
    return
  }
  store.saveEngine({ id: engineId.value, ...draft.value })
  savedSnapshot.value = JSON.stringify(draft.value)
  saveSnack.value = true
}

function performDelete() {
  if (sourceEngine.value) store.deleteEngine(sourceEngine.value.id)
  confirmDelete.value = false
  router.push(listRoute.value)
}

const subtitle = computed(() => {
  if (!isNew.value) return `${ENGINE_TYPE_LABELS[draft.value.type]} · ${ENGINE_PAGE_LABELS[draft.value.page]} page`
  return stage.value === 'type'
    ? 'Step 1 of 2 · Choose an engine type'
    : 'Step 2 of 2 · Configure and preview'
})
</script>

<template>
  <div v-if="!notFound" class="d-flex flex-column gap-4">
    <MpPageHeader
      :title="isNew && stage === 'type' ? 'New engine' : (draft.name || 'New engine')"
      :subtitle="subtitle"
      :back-to="listRoute"
    >
      <template #actions>
        <template v-if="stage === 'config'">
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
            {{ isNew ? 'Create engine' : 'Save' }}
          </v-btn>
        </template>
      </template>
    </MpPageHeader>

    <!-- Step 1: type picker -->
    <div v-if="stage === 'type'" class="engine-type-grid">
      <button
        v-for="type in ENGINE_TYPES"
        :key="type"
        type="button"
        class="engine-type-card text-left"
        @click="chooseType(type)"
      >
        <v-avatar size="40" variant="tonal" color="primary" class="mb-3">
          <v-icon size="20">{{ ENGINE_TYPE_ICONS[type] }}</v-icon>
        </v-avatar>
        <div class="text-body-2 font-weight-bold mb-1">{{ ENGINE_TYPE_LABELS[type] }}</div>
        <div class="text-caption text-medium-emphasis">{{ ENGINE_TYPE_DESCRIPTIONS[type] }}</div>
      </button>
    </div>

    <!-- Step 2: config + preview -->
    <div v-else class="engine-layout d-flex gap-4 align-start">
      <div class="engine-editor d-flex flex-column gap-4 flex-grow-1">
        <v-card variant="flat" border rounded="lg" class="pa-5">
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="d-flex align-center gap-3">
              <v-avatar size="36" variant="tonal" color="primary">
                <v-icon size="18">{{ ENGINE_TYPE_ICONS[draft.type] }}</v-icon>
              </v-avatar>
              <div>
                <div class="text-subtitle-2 font-weight-bold">{{ ENGINE_TYPE_LABELS[draft.type] }}</div>
                <div class="text-caption text-medium-emphasis">{{ ENGINE_TYPE_DESCRIPTIONS[draft.type] }}</div>
              </div>
            </div>
            <v-btn
              v-if="isNew"
              variant="text"
              size="small"
              class="text-none text-medium-emphasis"
              @click="stage = 'type'"
            >
              Change type
            </v-btn>
          </div>

          <v-text-field
            v-model="draft.name"
            label="Engine name"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <div class="d-flex gap-3 flex-wrap">
            <v-select
              v-model="draft.page"
              :items="pageOptions"
              label="Placement"
              variant="outlined"
              density="comfortable"
              hide-details
              class="flex-grow-1"
            />
            <v-select
              v-model="draft.productCount"
              :items="countOptions"
              label="Products shown"
              variant="outlined"
              density="comfortable"
              hide-details
              class="flex-grow-1"
            />
          </div>
        </v-card>

        <!-- Filters -->
        <v-card variant="flat" border rounded="lg">
          <div class="d-flex align-center justify-space-between px-5 py-4">
            <div>
              <span class="text-subtitle-2 font-weight-bold">Filters</span>
              <span class="text-caption text-medium-emphasis ml-2">Narrow which products the engine may recommend</span>
            </div>
            <v-btn
              color="primary"
              variant="flat"
              size="small"
              class="text-none"
              prepend-icon="plus"
              :disabled="editingId !== null"
              @click="startAddCondition"
            >
              Add filter
            </v-btn>
          </div>
          <v-divider />

          <div v-if="editingId !== null" class="engine-condition-form px-5 py-4 d-flex flex-column gap-3">
            <div class="d-flex gap-3 flex-wrap">
              <v-select
                v-model="conditionDraft.action"
                :items="[{ title: 'Include', value: 'include' }, { title: 'Exclude', value: 'exclude' }]"
                label="Action"
                variant="outlined"
                density="compact"
                hide-details
                class="engine-field-action"
              />
              <v-select
                v-model="conditionDraft.field"
                :items="fieldOptions"
                label="Field"
                variant="outlined"
                density="compact"
                hide-details
                class="engine-field-field"
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
                class="flex-grow-1 engine-field-values"
              />
            </div>
            <div class="d-flex justify-end gap-2">
              <v-btn variant="text" size="small" class="text-none" @click="editingId = null">Cancel</v-btn>
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
            <tbody>
              <tr v-for="condition in draft.conditions" :key="condition.id">
                <td class="text-body-2 font-weight-medium text-no-wrap" style="width: 110px">
                  {{ condition.action === 'include' ? 'Include' : 'Exclude' }}
                </td>
                <td class="text-body-2 text-medium-emphasis" style="width: 140px">{{ condition.field }}</td>
                <td>
                  <div class="d-flex gap-1 flex-wrap py-1">
                    <v-chip v-for="value in condition.values" :key="value" size="x-small" variant="tonal">{{ value }}</v-chip>
                  </div>
                </td>
                <td class="text-end" style="width: 56px">
                  <v-menu location="bottom end">
                    <template #activator="{ props: menuProps }">
                      <v-btn
                        v-bind="menuProps"
                        icon="more-vertical"
                        variant="text"
                        size="small"
                        density="comfortable"
                        color="medium-emphasis"
                        :aria-label="`Filter actions for ${condition.field}`"
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
          <div v-else-if="editingId === null" class="px-5 py-4 text-body-2 text-medium-emphasis">
            No filters — the engine may recommend any product in the catalog.
          </div>
        </v-card>
      </div>

      <!-- Preview -->
      <v-card variant="flat" border rounded="lg" class="engine-preview flex-shrink-0">
        <div class="px-4 py-3 d-flex align-center justify-space-between">
          <span class="text-subtitle-2 font-weight-bold">Preview</span>
          <span class="text-caption text-medium-emphasis">{{ ENGINE_PAGE_LABELS[draft.page] }} page</span>
        </div>
        <v-divider />
        <div class="pa-4">
          <div class="engine-preview-grid">
            <MerchProductCard
              v-for="product in previewProducts"
              :key="product.id"
              :product="product"
              :interactive="false"
            />
          </div>
          <div v-if="previewProducts.length === 0" class="text-body-2 text-medium-emphasis text-center py-8">
            No products match the current filters.
          </div>
        </div>
      </v-card>
    </div>

    <!-- Delete confirm -->
    <v-dialog :model-value="confirmDelete" max-width="440" @update:model-value="confirmDelete = false">
      <v-card rounded="lg">
        <v-card-title class="pa-5 text-h6 font-weight-bold">Delete “{{ draft.name }}”?</v-card-title>
        <v-card-text class="pb-2 text-body-2 text-medium-emphasis">
          The widget stops rendering on the {{ ENGINE_PAGE_LABELS[draft.page].toLowerCase() }} page immediately.
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" class="text-none" @click="confirmDelete = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" class="text-none" @click="performDelete">Delete engine</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="saveSnack" :timeout="2500" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> Engine saved</div>
    </v-snackbar>
  </div>

  <div v-else class="pa-10">
    <MpErrorState
      icon="sparkles"
      title="Engine not found"
      description="This engine may have been deleted, or the link is incorrect."
      action-label="Back to Recommendations"
      action-icon="arrow-left"
      @action="router.push(listRoute)"
    />
  </div>
</template>

<style scoped>
.engine-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.engine-type-card {
  padding: 20px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
  font: inherit;
  transition: border-color 120ms ease, background 120ms ease;
}

.engine-type-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.45);
  background: rgba(var(--v-theme-primary), 0.03);
}

.engine-type-card:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.engine-editor {
  min-width: 0;
}

.engine-preview {
  width: 380px;
  position: sticky;
  top: 16px;
}

.engine-preview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  max-height: 64vh;
  overflow-y: auto;
}

.engine-condition-form {
  background: rgba(var(--v-theme-surface-variant), 0.18);
}

.engine-field-action {
  width: 150px;
  flex: 0 0 auto;
}

.engine-field-field {
  width: 170px;
  flex: 0 0 auto;
}

.engine-field-values {
  min-width: 220px;
}

@media (max-width: 1100px) {
  .engine-layout {
    flex-direction: column;
  }

  .engine-preview {
    width: 100%;
    position: static;
  }

  .engine-preview-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>
