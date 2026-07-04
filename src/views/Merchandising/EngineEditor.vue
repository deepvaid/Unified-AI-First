<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpErrorState from '@/components/MpErrorState.vue'
import MerchProductCard from '@/components/merchandising/MerchProductCard.vue'
import { useCopilotStore } from '@/stores/useCopilot'
import {
  useMerchandisingStore,
  engineRecommendationPreview,
  engineTypesForPage,
  ENGINE_TYPE_LABELS,
  ENGINE_TYPE_DESCRIPTIONS,
  ENGINE_TYPE_ICONS,
  ENGINE_PAGE_LABELS,
  ENGINE_PAGE_DESCRIPTIONS,
  ENGINE_PAGE_ICONS,
  ENGINE_FALLBACK_OPTIONS,
  MERCH_FIELD_OPTIONS,
  type EnginePage,
  type EngineType,
  type MerchCondition,
} from '@/stores/useMerchandising'

const route = useRoute()
const router = useRouter()
const store = useMerchandisingStore()
const copilot = useCopilotStore()

const listRoute = computed(() => `/commerce/${route.params.accountId}/merchandising/recommendations`)

/* ── Mode ─────────────────────────────────────────────────────── */
const engineId = computed(() => String(route.params.engineId))
const isNew = computed(() => engineId.value === 'new')
const sourceEngine = computed(() => (isNew.value ? null : store.getEngine(engineId.value)))
const notFound = computed(() => !isNew.value && !sourceEngine.value)

/* ── Editable draft ───────────────────────────────────────────── */
const draft = ref({
  name: sourceEngine.value?.name ?? '',
  page: (sourceEngine.value?.page ?? null) as EnginePage | null,
  type: (sourceEngine.value?.type ?? null) as EngineType | null,
  minProducts: sourceEngine.value?.minProducts ?? 4,
  maxProducts: sourceEngine.value?.maxProducts ?? 10,
  fallbacks: [...(sourceEngine.value?.fallbacks ?? [])],
  notes: sourceEngine.value?.notes ?? '',
  conditions: (sourceEngine.value?.conditions ?? []).map((c) => ({ ...c, values: [...c.values] })),
})
const savedSnapshot = ref(JSON.stringify(draft.value))
const dirty = computed(() => JSON.stringify(draft.value) !== savedSnapshot.value)

/* ── Wizard: Page type → Recommendation type → Settings → Filters ── */
const step = ref(1)

const PAGES = Object.keys(ENGINE_PAGE_LABELS) as EnginePage[]
const availableTypes = computed(() => (draft.value.page ? engineTypesForPage(draft.value.page) : []))

// A context-dependent type becomes invalid if the page changes beneath it
watch(() => draft.value.page, () => {
  if (draft.value.type && !availableTypes.value.includes(draft.value.type)) draft.value.type = null
})

const countsValid = computed(() =>
  draft.value.minProducts >= 1 && draft.value.maxProducts >= draft.value.minProducts && draft.value.maxProducts <= 24,
)

const stepValid = computed(() => {
  if (step.value === 1) return draft.value.page !== null
  if (step.value === 2) return draft.value.type !== null
  if (step.value === 3) return countsValid.value
  return true
})

const canSave = computed(() =>
  draft.value.name.trim().length > 0
  && draft.value.page !== null
  && draft.value.type !== null
  && countsValid.value
  && (dirty.value || isNew.value),
)

const stepLabels = computed(() => [
  draft.value.page ? `${ENGINE_PAGE_LABELS[draft.value.page]} page` : 'Page type',
  draft.value.type ? ENGINE_TYPE_LABELS[draft.value.type] : 'Recommendation type',
  'Settings',
  'Filters',
])

const STEP_TITLES = ['Select page type', 'Select recommendation type', 'General settings', 'Filters']

/* ── Filters (include/exclude) ────────────────────────────────── */
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

/* ── Fallbacks ────────────────────────────────────────────────── */
const remainingFallbacks = computed(() =>
  ENGINE_FALLBACK_OPTIONS.filter((f) => !draft.value.fallbacks.includes(f)),
)

/* ── Preview (persistent from step 2 onward) ──────────────────── */
const previewDevice = ref<'desktop' | 'mobile'>('desktop')

const previewProducts = computed(() => {
  if (!draft.value.type) return []
  return engineRecommendationPreview(
    { type: draft.value.type, conditions: draft.value.conditions, maxProducts: draft.value.maxProducts },
    store.merchProductList,
  )
})

/* ── Save / delete ────────────────────────────────────────────── */
const saveSnack = ref(false)
const confirmDelete = ref(false)

function save() {
  if (!canSave.value || !draft.value.page || !draft.value.type) return
  const payload = {
    name: draft.value.name,
    page: draft.value.page,
    type: draft.value.type,
    minProducts: draft.value.minProducts,
    maxProducts: draft.value.maxProducts,
    fallbacks: draft.value.fallbacks,
    notes: draft.value.notes,
    conditions: draft.value.conditions,
  }
  if (isNew.value) {
    const created = store.createEngine(payload)
    savedSnapshot.value = JSON.stringify(draft.value)
    saveSnack.value = true
    router.replace(`${listRoute.value}/${created.id}`)
    return
  }
  store.saveEngine({ id: engineId.value, ...payload })
  savedSnapshot.value = JSON.stringify(draft.value)
  saveSnack.value = true
}

function performDelete() {
  if (sourceEngine.value) store.deleteEngine(sourceEngine.value.id)
  confirmDelete.value = false
  router.push(listRoute.value)
}
</script>

<template>
  <div v-if="!notFound" class="d-flex flex-column gap-4">
    <MpPageHeader
      :title="isNew ? 'New recommendation engine' : (draft.name || 'Edit engine')"
      :subtitle="`Step ${step} of 4 · ${STEP_TITLES[step - 1]}`"
      :back-to="listRoute"
    >
      <template #actions>
        <v-btn variant="text" class="text-none text-medium-emphasis" @click="router.push(listRoute)">Cancel</v-btn>
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
          v-if="step > 1"
          variant="flat"
          color="surface"
          class="text-none"
          prepend-icon="arrow-left"
          @click="step -= 1"
        >
          Back
        </v-btn>
        <v-btn
          v-if="step < 4"
          color="primary"
          variant="flat"
          class="text-none"
          append-icon="arrow-right"
          :disabled="!stepValid"
          @click="step += 1"
        >
          Next
        </v-btn>
        <v-btn
          v-else
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
    </MpPageHeader>

    <!-- Persistent name + step indicator -->
    <div class="d-flex align-center gap-4 flex-wrap">
      <v-text-field
        v-model="draft.name"
        label="Engine name"
        variant="outlined"
        density="comfortable"
        hide-details
        class="engine-name-field"
      />
      <div class="engine-steps d-flex align-center gap-2 flex-wrap">
        <template v-for="(label, index) in stepLabels" :key="index">
          <v-divider v-if="index > 0" class="engine-steps__line" />
          <button
            type="button"
            class="engine-step"
            :class="{
              'engine-step--active': step === index + 1,
              'engine-step--done': step > index + 1,
            }"
            :disabled="index + 1 > step && !stepValid"
            @click="index + 1 <= step ? (step = index + 1) : null"
          >
            <span class="engine-step__index">
              <v-icon v-if="step > index + 1" size="12">check</v-icon>
              <template v-else>{{ index + 1 }}</template>
            </span>
            {{ label }}
          </button>
        </template>
      </div>
    </div>

    <!-- Step 1: page type -->
    <div v-if="step === 1" class="engine-type-grid">
      <button
        v-for="page in PAGES"
        :key="page"
        type="button"
        class="engine-type-card text-left"
        :class="{ 'engine-type-card--selected': draft.page === page }"
        @click="draft.page = page"
      >
        <v-avatar size="40" variant="tonal" color="primary" class="mb-3">
          <v-icon size="20">{{ ENGINE_PAGE_ICONS[page] }}</v-icon>
        </v-avatar>
        <div class="text-body-2 font-weight-bold mb-1">{{ ENGINE_PAGE_LABELS[page] }} Page</div>
        <div class="text-caption text-medium-emphasis">{{ ENGINE_PAGE_DESCRIPTIONS[page] }}</div>
      </button>
    </div>

    <!-- Steps 2–4: content column + persistent preview -->
    <div v-else class="engine-layout d-flex gap-4 align-start">
      <div class="engine-main flex-grow-1 d-flex flex-column gap-4">

        <!-- Step 2: recommendation type -->
        <template v-if="step === 2">
          <button type="button" class="engine-davinci text-left" @click="copilot.open()">
            <v-avatar size="36" variant="tonal" color="primary" class="flex-shrink-0">
              <v-icon size="18">sparkles</v-icon>
            </v-avatar>
            <span class="min-w-0">
              <span class="d-block text-body-2 font-weight-bold">Not sure which to pick? Ask Da Vinci</span>
              <span class="d-block text-caption text-medium-emphasis">
                Describe what you want shoppers to see — Da Vinci suggests the engine type and settings.
              </span>
            </span>
            <v-icon size="16" class="ml-auto flex-shrink-0 text-medium-emphasis">arrow-right</v-icon>
          </button>

          <div class="engine-type-grid">
            <button
              v-for="type in availableTypes"
              :key="type"
              type="button"
              class="engine-type-card text-left"
              :class="{ 'engine-type-card--selected': draft.type === type }"
              @click="draft.type = type"
            >
              <div class="d-flex align-center justify-space-between mb-3">
                <v-avatar size="40" variant="tonal" color="primary">
                  <v-icon size="20">{{ ENGINE_TYPE_ICONS[type] }}</v-icon>
                </v-avatar>
                <v-chip v-if="type === 'personalized'" size="x-small" color="primary" variant="flat">AI powered</v-chip>
              </div>
              <div class="text-body-2 font-weight-bold mb-1">{{ ENGINE_TYPE_LABELS[type] }}</div>
              <div class="text-caption text-medium-emphasis">{{ ENGINE_TYPE_DESCRIPTIONS[type] }}</div>
            </button>
          </div>
        </template>

        <!-- Step 3: settings -->
        <v-card v-else-if="step === 3" variant="flat" border rounded="lg" class="pa-5 engine-settings">
      <div class="text-subtitle-2 font-weight-bold mb-1">Number of products displayed</div>
      <div class="text-body-2 text-medium-emphasis mb-3">
        The widget renders between the minimum and maximum, depending on available results.
      </div>
      <div class="d-flex gap-3 mb-5">
        <v-number-input
          v-model="draft.minProducts"
          label="Min"
          :min="1"
          :max="draft.maxProducts"
          variant="outlined"
          density="comfortable"
          hide-details
          control-variant="stacked"
          class="engine-count-field"
        />
        <v-number-input
          v-model="draft.maxProducts"
          label="Max"
          :min="draft.minProducts"
          :max="24"
          variant="outlined"
          density="comfortable"
          hide-details
          control-variant="stacked"
          class="engine-count-field"
        />
      </div>

      <v-divider class="mb-5" style="opacity: 0.5" />

      <div class="text-subtitle-2 font-weight-bold mb-1">Fallbacks</div>
      <div class="text-body-2 text-medium-emphasis mb-3">
        Shown when the engine doesn’t have enough data for a shopper — applied in order.
      </div>
      <div class="d-flex align-center gap-2 flex-wrap mb-5">
        <v-chip
          v-for="fallback in draft.fallbacks"
          :key="fallback"
          size="small"
          variant="tonal"
          closable
          @click:close="draft.fallbacks = draft.fallbacks.filter((f) => f !== fallback)"
        >
          {{ fallback }}
        </v-chip>
        <v-menu v-if="remainingFallbacks.length" location="bottom start">
          <template #activator="{ props: menuProps }">
            <v-btn v-bind="menuProps" variant="flat" color="surface" size="small" class="text-none" prepend-icon="plus">
              Add fallback
            </v-btn>
          </template>
          <v-list density="compact" rounded="lg" min-width="200" elevation="3" class="py-1">
            <v-list-item
              v-for="fallback in remainingFallbacks"
              :key="fallback"
              :title="fallback"
              @click="draft.fallbacks.push(fallback)"
            />
          </v-list>
        </v-menu>
        <span v-if="!draft.fallbacks.length" class="text-caption text-medium-emphasis">No fallbacks selected.</span>
      </div>

      <v-divider class="mb-5" style="opacity: 0.5" />

      <v-textarea
        v-model="draft.notes"
        label="Notes"
        placeholder="Internal notes about this engine…"
        variant="outlined"
        density="comfortable"
        rows="3"
        hide-details
      />
    </v-card>

        <!-- Step 4: filters -->
        <v-card v-else variant="flat" border rounded="lg" class="engine-filters">
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

      <!-- Preview (persistent from step 2) -->
      <v-card variant="flat" border rounded="lg" class="engine-preview flex-shrink-0">
        <div class="px-4 py-2 d-flex align-center justify-space-between gap-2">
          <span class="text-subtitle-2 font-weight-bold">Preview</span>
          <div class="d-flex align-center gap-2">
            <span class="text-caption text-medium-emphasis text-no-wrap">
              {{ draft.page ? `${ENGINE_PAGE_LABELS[draft.page]} page` : '' }}
            </span>
            <v-btn-toggle
              v-model="previewDevice"
              density="compact"
              mandatory
              rounded="lg"
              class="engine-device-toggle"
            >
              <v-btn value="desktop" size="x-small" icon="monitor" aria-label="Desktop preview" />
              <v-btn value="mobile" size="x-small" icon="smartphone" aria-label="Mobile preview" />
            </v-btn-toggle>
          </div>
        </div>
        <v-divider />
        <div class="pa-4">
          <div v-if="!draft.type" class="text-body-2 text-medium-emphasis text-center py-8">
            Pick a recommendation type to see a live preview.
          </div>
          <template v-else>
            <div
              class="engine-preview-grid"
              :class="{ 'engine-preview-grid--mobile': previewDevice === 'mobile' }"
            >
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
          </template>
        </div>
      </v-card>
    </div>

    <!-- Delete confirm -->
    <v-dialog :model-value="confirmDelete" max-width="440" @update:model-value="confirmDelete = false">
      <v-card rounded="lg">
        <v-card-title class="pa-5 text-h6 font-weight-bold">Delete “{{ draft.name }}”?</v-card-title>
        <v-card-text class="pb-2 text-body-2 text-medium-emphasis">
          The widget stops rendering on the storefront immediately.
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
.engine-name-field {
  width: 360px;
  flex: 0 0 auto;
}

/* ── Step indicator ────────────────────────────────────────────── */
.engine-steps {
  min-width: 0;
  flex: 1 1 auto;
}

.engine-steps__line {
  flex: 1 1 24px;
  max-width: 48px;
  opacity: 0.5;
}

.engine-step {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.6);
  white-space: nowrap;
}

.engine-step:disabled {
  cursor: default;
}

.engine-step__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  font-size: 11px;
}

.engine-step--active {
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.08);
}

.engine-step--active .engine-step__index {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.engine-step--done {
  color: rgba(var(--v-theme-on-surface), 0.78);
}

.engine-step--done .engine-step__index {
  background: rgba(var(--v-theme-success), 0.15);
  color: rgb(var(--v-theme-success));
}

/* ── Type/page cards ───────────────────────────────────────────── */
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

.engine-type-card--selected {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 1px rgb(var(--v-theme-primary));
}

.engine-type-card:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

/* ── Settings ──────────────────────────────────────────────────── */
.engine-settings {
  max-width: 720px;
}

.engine-count-field {
  width: 160px;
  flex: 0 0 auto;
}

/* ── Content column + persistent preview ───────────────────────── */
.engine-main {
  min-width: 0;
}

.engine-filters {
  min-width: 0;
}

.engine-davinci {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px dashed rgba(var(--v-theme-primary), 0.4);
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.03);
  cursor: pointer;
  font: inherit;
  transition: background 120ms ease, border-color 120ms ease;
}

.engine-davinci:hover {
  background: rgba(var(--v-theme-primary), 0.07);
  border-color: rgba(var(--v-theme-primary), 0.6);
}

.engine-davinci:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.engine-preview {
  width: 380px;
  position: sticky;
  top: 16px;
}

.engine-device-toggle {
  height: 28px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.engine-preview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  max-height: 64vh;
  overflow-y: auto;
}

.engine-preview-grid--mobile {
  max-width: 270px;
  margin-inline: auto;
}

.min-w-0 {
  min-width: 0;
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

  .engine-name-field {
    width: 100%;
  }
}
</style>
