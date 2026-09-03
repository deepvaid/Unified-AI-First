<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpErrorState from '@/components/MpErrorState.vue'
import MpWizardShell from '@/components/MpWizardShell.vue'
import MpWizardStepCard from '@/components/MpWizardStepCard.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import MerchProductCard from '@/components/merchandising/MerchProductCard.vue'
import { useToast } from '@/composables/useToast'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useWizardSteps } from '@/composables/useWizardSteps'
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
const toast = useToast()
const copilot = useCopilotStore()

// Channel-scoped routes — this editor only mounts inside the merchandising shell.
const listRoute = computed(() => ({ name: 'MerchandisingChannelRecommendations', params: { accountId: route.params.accountId, channelId: route.params.channelId } }))

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
const isDirty = dirty
const {
  confirmLeave,
  allowNextLeave,
  discardAndLeave,
  leaveTitle,
  leaveMessage,
  leaveConfirmLabel,
} = useDirtyLeaveGuard(isDirty, {
  title: 'Leave engine editor?',
  message: 'You have unsaved changes. Leaving now will discard them.',
})

/* ── Wizard: Page type → Recommendation type → Settings → Filters ── */
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

const STEP_TITLES = ['Page type', 'Recommendation type', 'Settings', 'Filters']

// The old hand-rolled version bound :max-step to the *current* step, which
// killed forward jumps the moment the user stepped back — the composable's
// high-water maxStep is the fix.
const { step, maxStep, goTo: goToStep, next: nextStep, prev: prevStep, unlockAll } = useWizardSteps(STEP_TITLES.length, {
  canAdvance: () => stepValid.value,
})
// Editing an existing engine: every step is already configured, so all are jumpable.
if (!isNew.value && sourceEngine.value) unlockAll()

const stepHint = computed(() => {
  if (step.value === 1 && !draft.value.page) return 'Choose a page type to continue'
  if (step.value === 2 && !draft.value.type) return 'Choose a recommendation type to continue'
  if (step.value === 3 && !countsValid.value) return 'Set a valid product range to continue'
  if (step.value === 4 && !canSave.value && !draft.value.name.trim()) return 'Name the engine to save it'
  return undefined
})

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

/* ── Da Vinci hand-off ────────────────────────────────────────── */
function askDaVinci() {
  const where = draft.value.page ? `${ENGINE_PAGE_LABELS[draft.value.page]} page` : 'store'
  copilot.openWithPrompt(`Which recommendation engine should I use on my ${where}? I want to lift conversions.`)
}

/* ── Fallbacks ────────────────────────────────────────────────── */
const remainingFallbacks = computed(() =>
  ENGINE_FALLBACK_OPTIONS.filter((f) => !draft.value.fallbacks.includes(f)),
)

/* ── Preview (persistent from step 2 onward) ──────────────────── */
const previewDevice = ref<'desktop' | 'mobile'>('desktop')
const PREVIEW_DEVICES = [
  { value: 'desktop', label: 'Desktop preview', icon: 'monitor' },
  { value: 'mobile', label: 'Mobile preview', icon: 'smartphone' },
]

const previewProducts = computed(() => {
  if (!draft.value.type) return []
  return engineRecommendationPreview(
    { type: draft.value.type, conditions: draft.value.conditions, maxProducts: draft.value.maxProducts },
    store.merchProductList,
  )
})

/* ── Save / delete ────────────────────────────────────────────── */
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
    allowNextLeave()
    toast.success('Engine saved')
    router.replace({ name: 'MerchandisingChannelEngineEdit', params: { accountId: route.params.accountId, channelId: route.params.channelId, engineId: created.id } })
    return
  }
  store.saveEngine({ id: engineId.value, ...payload })
  savedSnapshot.value = JSON.stringify(draft.value)
  allowNextLeave()
  toast.success('Engine saved')
}

function performDelete() {
  if (sourceEngine.value) store.deleteEngine(sourceEngine.value.id)
  confirmDelete.value = false
  allowNextLeave()
  router.push(listRoute.value)
}

</script>

<template>
  <MpWizardShell
    v-if="!notFound"
    :title="isNew ? 'New recommendation engine' : (draft.name || 'Edit engine')"
    :steps="STEP_TITLES"
    :current="step"
    :max-step="maxStep"
    :back-to="listRoute"
    measure="lg"
    :hint="stepHint"
    standalone
    @select="goToStep"
    @back="prevStep"
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
    </template>

    <div class="d-flex flex-column gap-4">
    <!-- Persistent name — editable on every step, so a rename never needs a jump back. -->
    <!-- `hide-details` is deliberate here (the only one in this file): the field sits
         alone on a chrome row, and a details line would shunt the content down on
         every keystroke. -->
    <v-text-field
      v-model="draft.name"
      label="Engine name *"
      hide-details
      class="engine-name-field"
    />

    <!-- Step 1: page type -->
    <div v-if="step === 1" class="engine-type-grid">
      <MpOptionCard
        v-for="page in PAGES"
        :key="page"
        :selected="draft.page === page"
        :title="`${ENGINE_PAGE_LABELS[page]} Page`"
        :description="ENGINE_PAGE_DESCRIPTIONS[page]"
        :icon="ENGINE_PAGE_ICONS[page]"
        class="h-100"
        @click="draft.page = page"
      />
    </div>

    <!-- Steps 2–4: content column + persistent preview -->
    <div v-else class="engine-layout d-flex gap-4 align-start">
      <div class="engine-main flex-grow-1 d-flex flex-column gap-4">

        <!-- Step 2: recommendation type -->
        <template v-if="step === 2">
          <button type="button" class="engine-davinci text-left" @click="askDaVinci">
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
            <MpOptionCard
              v-for="type in availableTypes"
              :key="type"
              :selected="draft.type === type"
              :title="ENGINE_TYPE_LABELS[type]"
              :description="ENGINE_TYPE_DESCRIPTIONS[type]"
              :icon="ENGINE_TYPE_ICONS[type]"
              class="h-100"
              @click="draft.type = type"
            >
              <div v-if="type === 'personalized'" class="mt-2">
                <v-chip size="x-small" color="primary" variant="flat">AI powered</v-chip>
              </div>
            </MpOptionCard>
          </div>
        </template>

        <!-- Step 3: settings -->
        <MpWizardStepCard v-else-if="step === 3" title="Settings" class="engine-settings">
          <MpFormGrid :cols="2">
            <MpFormSection
              title="Number of products displayed"
              description="The widget renders between the minimum and maximum, depending on available results."
            />
            <v-number-input
              v-model="draft.minProducts"
              label="Min"
              :min="1"
              :max="draft.maxProducts"
              control-variant="stacked"
            />
            <v-number-input
              v-model="draft.maxProducts"
              label="Max"
              :min="draft.minProducts"
              :max="24"
              control-variant="stacked"
            />

            <MpFormSection
              title="Fallbacks"
              description="Shown when the engine doesn’t have enough data for a shopper — applied in order."
            />
            <div class="mp-form-grid__full d-flex align-center gap-2 flex-wrap">
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
                <v-list role="menu" aria-label="Add fallback">
                  <MpMenuItem
                    v-for="fallback in remainingFallbacks"
                    :key="fallback"
                    :title="fallback"
                    @click="draft.fallbacks.push(fallback)"
                  />
                </v-list>
              </v-menu>
              <span v-if="!draft.fallbacks.length" class="text-caption text-medium-emphasis">No fallbacks selected.</span>
            </div>

            <v-textarea
              v-model="draft.notes"
              label="Notes"
              placeholder="e.g. Boost margin on summer lines before the July sale"
              rows="3"
              class="mp-form-grid__full"
            />
          </MpFormGrid>
        </MpWizardStepCard>

        <!-- Step 4: filters -->
        <v-card v-else variant="flat" border rounded="lg" class="engine-filters">
        <div class="d-flex align-center justify-space-between px-5 py-4">
          <div>
            <h2 class="mp-section-title d-inline">Filters</h2>
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

        <div v-if="editingId !== null" class="engine-condition-form px-5 py-4">
          <MpFormGrid :cols="2">
            <v-select
              v-model="conditionDraft.action"
              :items="[{ title: 'Include', value: 'include' }, { title: 'Exclude', value: 'exclude' }]"
              label="Action"
            />
            <v-select
              v-model="conditionDraft.field"
              :items="fieldOptions"
              label="Field *"
            />
            <v-select
              v-model="conditionDraft.values"
              :items="valueOptions"
              label="Values *"
              multiple
              chips
              closable-chips
              :disabled="!conditionDraft.field"
              class="mp-form-grid__full"
            />
            <div class="mp-form-grid__full d-flex justify-end gap-2">
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
          </MpFormGrid>
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
                <MpRowActionsMenu ariaLabel="Filter actions" :item-label="condition.field">
                  <MpMenuItem icon="pencil" title="Edit" @click="startEditCondition(condition)" />
                  <v-divider class="my-1" />
                  <MpMenuItem icon="trash-2" title="Delete" danger @click="removeCondition(condition.id)" />
                </MpRowActionsMenu>
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
          <h2 class="mp-section-title">Preview</h2>
          <div class="d-flex align-center gap-2">
            <span class="text-caption text-medium-emphasis text-no-wrap">
              {{ draft.page ? `${ENGINE_PAGE_LABELS[draft.page]} page` : '' }}
            </span>
            <MpSegmentedControl
              :model-value="previewDevice"
              :items="PREVIEW_DEVICES"
              size="sm"
              ariaLabel="Preview device"
              @update:model-value="(v) => (previewDevice = v === 'mobile' ? 'mobile' : 'desktop')"
            />
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
    </div>

    <template #footer>
      <v-btn
        v-if="step < 4"
        color="primary"
        variant="flat"
        class="text-none"
        append-icon="arrow-right"
        :disabled="!stepValid"
        @click="nextStep"
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
  </MpWizardShell>

  <template v-if="!notFound">
    <!-- Delete confirm -->
    <MpConfirmDialog
      v-model="confirmDelete"
      danger
      :title="`Delete “${draft.name}”?`"
      message="The widget stops rendering on the storefront immediately."
      confirm-label="Delete engine"
      @confirm="performDelete"
    />

    <MpConfirmDialog
      v-model="confirmLeave"
      danger
      :title="leaveTitle"
      :message="leaveMessage"
      :confirm-label="leaveConfirmLabel"
      @confirm="discardAndLeave"
    />
  </template>

  <MpErrorState
    v-if="notFound"
    icon="sparkles"
    title="Engine not found"
    description="This engine may have been deleted, or the link is incorrect."
    action-label="Back to Recommendations"
    action-icon="arrow-left"
    @action="router.push(listRoute)"
  />
</template>

<style scoped>
.engine-name-field {
  max-width: 360px;
}

/* ── Type/page card grid (chrome lives in MpOptionCard) ───────────── */
.engine-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--mp-space-12);
}

/* ── Settings ──────────────────────────────────────────────────── */
.engine-settings {
  max-width: 720px;
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
  gap: var(--mp-space-12);
  padding: var(--mp-space-14) var(--mp-space-16);
  border: 1px dashed var(--border-default);
  border-radius: var(--mp-radius-12);
  background: var(--surface-secondary);
  color: var(--on-surface);
  cursor: pointer;
  font: inherit;
  transition: background var(--mp-motion-duration-fast) var(--mp-motion-easing-standard),
    border-color var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}

.engine-davinci:hover {
  background: var(--accent-soft);
  border-color: var(--accent-default);
}

.engine-davinci:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.engine-preview {
  width: var(--mp-layout-inboxListWidth);
  position: sticky;
  top: 0;
}

.engine-preview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--mp-space-10);
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
  background: var(--surface-secondary);
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
