<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useFormsStore, newFormDefaults, embedScriptFor } from '@/stores/useForms'
import type { AcquisitionForm, FormType, PopupPosition } from '@/stores/useForms'
import { storeToRefs } from 'pinia'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpDialog from '@/components/MpDialog.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const accountId = computed(() => route.params.accountId as string)

const formsStore = useFormsStore()
const { forms } = storeToRefs(formsStore)

const viewMode = ref<'grid' | 'list'>('grid')
const search = ref('')
const selected = ref<number[]>([])

const kpis = computed(() => [
  { label: 'Total Views', value: forms.value.reduce((a, f) => a + f.views, 0).toLocaleString(), color: 'primary', icon: 'eye' },
  { label: 'Total Conversions', value: forms.value.reduce((a, f) => a + f.conversions, 0).toLocaleString(), color: 'success', icon: 'user-plus' },
  { label: 'Avg. Conv. Rate', value: (forms.value.reduce((a, f) => a + f.rate, 0) / (forms.value.length || 1)).toFixed(1) + '%', color: 'warning', icon: 'percent' },
  { label: 'Active Forms', value: forms.value.filter(f => f.status === 'Active').length, color: 'secondary', icon: 'circle-check' },
])

const visibleForms = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return forms.value
  return forms.value.filter(f => f.name.toLowerCase().includes(q))
})

const accentVar = (accent: string) => ({ '--fp-accent': `rgb(var(--v-theme-${accent}))` })

function toggleSelect(id: number) {
  const i = selected.value.indexOf(id)
  if (i === -1) selected.value.push(id)
  else selected.value.splice(i, 1)
}

// Actions
function editInBuilder(form: AcquisitionForm) {
  router.push({ name: 'FormBuilder', params: { accountId: accountId.value }, query: { formId: String(form.id) } })
}
function duplicate(id: number) { formsStore.duplicate(id) }
function removeForms(ids: number[]) { formsStore.remove(ids); selected.value = [] }
function setStatus(ids: number[], status: 'Active' | 'Paused') { formsStore.setStatus(ids, status); selected.value = [] }

const confirmDeleteIds = ref<number[] | null>(null)
function askDelete(ids: number[]) { confirmDeleteIds.value = ids }
function confirmDelete() {
  if (confirmDeleteIds.value) removeForms(confirmDeleteIds.value)
  confirmDeleteIds.value = null
}

// Filters (list mode)
// Status is the promoted filter: a multi-select pill in the toolbar, so the
// cut people make most often doesn't cost a trip to the drawer.
const statusQuickFilter = {
  key: 'status',
  label: 'Status',
  options: ['Active', 'Draft', 'Published', 'Paused'].map((v) => ({ label: v, value: v })),
}
const statusFilter = ref<string[]>([])

const filters = ref({ type: '' })
const activeFilterEntries = computed(() => {
  const entries: Array<{ key: string; label: string }> = []
  if (statusFilter.value.length) entries.push({ key: 'status', label: `Status: ${statusFilter.value.join(', ')}` })
  if (filters.value.type) entries.push({ key: 'type', label: `Type: ${filters.value.type}` })
  return entries
})
function removeFilter(key: string) {
  if (key === 'status') statusFilter.value = []
  if (key === 'type') filters.value.type = ''
}
function clearAllFilters() { statusFilter.value = []; filters.value.type = '' }

const listItems = computed(() =>
  forms.value.filter(f =>
    (!statusFilter.value.length || statusFilter.value.includes(f.status)) &&
    (!filters.value.type || f.type === filters.value.type),
  ),
)

const listHeaders = [
  { title: 'Form', key: 'name' },
  { title: 'Type', key: 'type' },
  { title: 'Views', key: 'views', align: 'end' as const },
  { title: 'Conversions', key: 'conversions', align: 'end' as const },
  { title: 'Rate', key: 'rate', align: 'end' as const },
  { title: 'Status', key: 'status' },
  { title: 'Updated', key: 'updated' },
  { title: '', key: 'actions', align: 'end' as const, sortable: false },
]

// ─── Template gallery (aligned to crawl: scratch + 6 named templates) ───
interface FormTemplate {
  id: string
  name: string
  type: FormType | null
  position: PopupPosition | null
  desc: string
  icon: string
  color: string
}
const FORM_TEMPLATES: FormTemplate[] = [
  { id: 'scratch', name: 'Create from scratch', type: null, position: null, desc: 'Start with a blank form and build it your way.', icon: 'square-dashed', color: 'grey' },
  { id: 'first-order-discount', name: 'First order discount', type: 'Popup', position: 'classic-center', desc: 'Offer a first-purchase discount in exchange for an email.', icon: 'percent', color: 'success' },
  { id: 'neutral-modern', name: 'Neutral modern', type: 'Popup', position: 'classic-center', desc: 'A clean, on-brand popup for general list growth.', icon: 'square', color: 'secondary' },
  { id: 'looking-for-something', name: 'Looking for something?', type: 'Popup', position: 'classic-center', desc: 'Help visitors find what they need while capturing an email.', icon: 'search', color: 'info' },
  { id: 'be-first-to-know', name: 'Be the first to know', type: 'Embedded', position: null, desc: 'Inline form for product-launch announcements.', icon: 'bell', color: 'warning' },
  { id: 'join-the-club', name: 'Join the club', type: 'Embedded', position: null, desc: 'Membership-style embedded sign-up.', icon: 'crown', color: 'warning' },
  { id: 'welcome-coupon', name: 'Welcome coupon', type: 'Embedded', position: null, desc: 'Embedded coupon capture for footers and blog pages.', icon: 'ticket', color: 'primary' },
]

const chooseDialog = ref(false)
const selectedTemplate = ref<string | null>(null)
const templateSearch = ref('')
const filterType = ref<'All' | FormType>('All')
const filteredTemplates = computed(() =>
  FORM_TEMPLATES.filter(t =>
    (filterType.value === 'All' || t.type === filterType.value || t.id === 'scratch') &&
    (!templateSearch.value || t.name.toLowerCase().includes(templateSearch.value.toLowerCase())),
  ),
)
function openCreate() {
  selectedTemplate.value = null
  templateSearch.value = ''
  filterType.value = 'All'
  chooseDialog.value = true
}
function openBuilder() {
  if (selectedTemplate.value === null) return
  const tmpl = FORM_TEMPLATES.find(t => t.id === selectedTemplate.value)
  chooseDialog.value = false
  if (!tmpl || tmpl.id === 'scratch') {
    router.push({ name: 'FormBuilder', params: { accountId: accountId.value } })
    return
  }
  const base = newFormDefaults()
  const id = formsStore.createForm({
    ...base,
    name: tmpl.name,
    type: tmpl.type ?? 'Popup',
    design: tmpl.position ? { ...base.design, position: tmpl.position } : base.design,
    headline: tmpl.name,
  })
  router.push({ name: 'FormBuilder', params: { accountId: accountId.value }, query: { formId: String(id) } })
}

// ─── Preview & embed-code dialogs ───────────────────────────────────────
const previewDialog = ref(false)
const embedDialog = ref(false)
const activeForm = ref<AcquisitionForm | null>(null)
function openPreview(form: AcquisitionForm) { activeForm.value = form; previewDialog.value = true }
function openEmbed(form: AcquisitionForm) { activeForm.value = form; embedDialog.value = true }
const embedSnippets = computed(() => (activeForm.value ? embedScriptFor(activeForm.value) : { script: '', manual: '' }))
const toast = useToast()
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  } catch {
    // clipboard unavailable — no-op in this prototype
  }
}
</script>

<template>
  <div class="acquisition-page h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Acquisition Forms"
      subtitle="Capture leads and grow your audience across your channels."
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">New Form</v-btn>
      </template>
    </MpPageHeader>

    <v-row dense>
      <v-col v-for="s in kpis" :key="s.label" cols="12" sm="6" md="3">
        <MpKpiCard :label="s.label" :value="s.value" :icon="s.icon" :color="s.color" />
      </v-col>
    </v-row>

    <!-- Toolbar: view toggle + (grid) search -->
    <div class="d-flex align-center justify-space-between ga-3 flex-wrap">
      <v-btn-toggle
        v-model="viewMode"
        mandatory
        density="comfortable"
        variant="outlined"
        divided
        rounded="lg"
        class="mp-toggle-group mp-toggle-group--segmented"
      >
        <v-btn value="grid" size="small" class="text-none px-4" prepend-icon="grid-2x2">Grid</v-btn>
        <v-btn value="list" size="small" class="text-none px-4" prepend-icon="list">List</v-btn>
      </v-btn-toggle>

      <v-text-field
        v-if="viewMode === 'grid'"
        v-model="search"
        prepend-inner-icon="search"
        placeholder="Search forms…"
        hide-details
        class="acq-search"
      />
    </div>

    <!-- Empty state -->
    <v-card v-if="!forms.length" variant="flat" border rounded="lg">
      <MpEmptyState
        icon="layout-template"
        title="No acquisition forms yet"
        description="Create a pop-up or embedded form to start capturing leads."
        action-label="New Form"
        action-icon="plus"
        @action="openCreate"
      />
    </v-card>

    <!-- Grid -->
    <template v-else-if="viewMode === 'grid'">
      <MpEmptyState
        v-if="!visibleForms.length"
        icon="search-x"
        title="No forms match your search"
        :description="`Nothing found for “${search}”. Try a different term.`"
      />
      <v-row v-else class="form-grid" dense>
        <v-col v-for="form in visibleForms" :key="form.id" cols="12" sm="6" md="4">
          <v-card
            variant="flat"
            border
            rounded="lg"
            class="form-card overflow-hidden h-100 d-flex flex-column"
            :class="{ 'form-card--selected': selected.includes(form.id) }"
          >
            <!-- Mini preview -->
            <div class="fp" :class="`fp--${form.type.toLowerCase()}`" :style="accentVar(form.accent)">
              <v-checkbox
                :model-value="selected.includes(form.id)"
                density="compact"
                hide-details
                class="fp__check"
                :class="{ 'fp__check--on': selected.includes(form.id) }"
                @update:model-value="toggleSelect(form.id)"
                @click.stop
              />
              <div v-if="form.type === 'Popup'" class="fp__modal">
                <div class="fp__headline">{{ form.headline }}</div>
                <div class="fp__field">Email address</div>
                <div v-if="form.collectName" class="fp__field">First name</div>
                <div class="fp__cta">{{ form.buttonLabel }}</div>
              </div>
              <div v-else class="fp__embed">
                <div class="fp__headline fp__headline--sm">{{ form.headline }}</div>
                <div class="fp__inline">
                  <div class="fp__field fp__field--grow">Email address</div>
                  <div class="fp__cta fp__cta--sm">{{ form.buttonLabel }}</div>
                </div>
              </div>
            </div>

            <div class="pa-5 flex-grow-1 d-flex flex-column">
              <div class="d-flex align-start justify-space-between mb-2">
                <div class="min-width-0">
                  <div class="text-body-1 font-weight-bold text-truncate">{{ form.name }}</div>
                  <div class="d-flex align-center ga-2 mt-1">
                    <v-chip size="x-small" variant="tonal" color="secondary" rounded="lg">{{ form.type }}</v-chip>
                    <MpStatusChip :status="form.status" type="general" size="sm" />
                  </div>
                </div>
                <MpRowActionsMenu :ariaLabel="`${form.name} actions`">
                  <MpMenuItem title="Preview" icon="eye" @click="openPreview(form)" />
                  <MpMenuItem title="Duplicate" icon="copy" @click="duplicate(form.id)" />
                  <MpMenuItem title="Get embed code" icon="code-2" @click="openEmbed(form)" />
                  <MpMenuItem
                    v-if="form.status !== 'Active'"
                    title="Activate"
                    icon="play"
                    @click="setStatus([form.id], 'Active')"
                  />
                  <MpMenuItem
                    v-else
                    title="Pause"
                    icon="pause"
                    @click="setStatus([form.id], 'Paused')"
                  />
                  <v-divider class="my-1" />
                  <MpMenuItem title="Delete" icon="trash-2" danger @click="askDelete([form.id])" />
                </MpRowActionsMenu>
              </div>

              <div class="form-stats d-flex ga-4 mt-auto pt-4">
                <div class="text-center flex-grow-1">
                  <div class="text-h6 font-weight-bold num">{{ form.views.toLocaleString() }}</div>
                  <div class="text-caption text-medium-emphasis">Views</div>
                </div>
                <div class="text-center flex-grow-1">
                  <div class="text-h6 font-weight-bold text-success num">{{ form.conversions.toLocaleString() }}</div>
                  <div class="text-caption text-medium-emphasis">Conversions</div>
                </div>
                <div class="text-center flex-grow-1">
                  <div class="text-h6 font-weight-bold text-primary num">{{ form.rate }}%</div>
                  <div class="text-caption text-medium-emphasis">Conv. Rate</div>
                </div>
              </div>
            </div>

            <div class="px-5 pb-5">
              <v-btn block variant="tonal" color="primary" size="small" class="text-none" prepend-icon="pencil" @click="editInBuilder(form)">Edit in Builder</v-btn>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="4">
          <v-card variant="flat" border rounded="lg" class="add-card h-100 d-flex flex-column align-center justify-center text-center pa-6 cursor-pointer" @click="openCreate">
            <v-icon size="40" color="primary" class="mb-3">circle-plus</v-icon>
            <div class="text-body-1 font-weight-bold mb-1">New Form</div>
            <div class="text-caption text-medium-emphasis">Choose a template and launch the builder</div>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- List -->
    <v-card v-else variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden list-card">
      <MpDataTableToolbar
        v-model:quick-filter-value="statusFilter"
        :quick-filter="statusQuickFilter"
        v-model:search="search"
        title="Forms"
        search-placeholder="Search forms..."
        :active-filters="activeFilterEntries"
        :total-count="listItems.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <MpFormSection title="Filter by">
              <MpFormGrid>
                <v-select v-model="filters.type" label="Type" :items="['', 'Popup', 'Embedded']" hide-details />
              </MpFormGrid>
            </MpFormSection>
          </div>
        </template>
      </MpDataTableToolbar>

      <v-data-table
        v-model="selected"
        :headers="listHeaders"
        :items="listItems"
        item-value="id"
        show-select
        hover
        density="comfortable"
        :search="search"
        class="flex-grow-1 acquisition-data-table"
      >
        <template #item.name="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.name }}</span>
        </template>
        <template #item.type="{ item }"><v-chip size="x-small" variant="outlined" color="secondary" rounded="lg">{{ item.type }}</v-chip></template>
        <template #item.views="{ item }"><span class="font-weight-medium num">{{ item.views.toLocaleString() }}</span></template>
        <template #item.conversions="{ item }"><span class="font-weight-medium text-success num">{{ item.conversions.toLocaleString() }}</span></template>
        <template #item.rate="{ item }"><span class="font-weight-bold text-primary num">{{ item.rate }}%</span></template>
        <template #item.status="{ item }"><MpStatusChip :status="item.status" type="general" size="sm" /></template>
        <template #item.actions="{ item }">
          <MpRowActionsMenu :ariaLabel="`${item.name} actions`">
            <MpMenuItem title="Edit in Builder" icon="pencil" @click="editInBuilder(item)" />
            <MpMenuItem title="Preview" icon="eye" @click="openPreview(item)" />
            <MpMenuItem title="Duplicate" icon="copy" @click="duplicate(item.id)" />
            <MpMenuItem title="Get embed code" icon="code-2" @click="openEmbed(item)" />
            <v-divider class="my-1" />
            <MpMenuItem title="Delete" icon="trash-2" danger @click="askDelete([item.id])" />
          </MpRowActionsMenu>
        </template>
      </v-data-table>
    </v-card>

    <!-- Bulk actions -->
    <MpFloatingBulkBar :count="selected.length" :total="forms.length" @clear="selected = []">
      <v-btn variant="text" size="small" class="text-none" prepend-icon="copy" @click="selected.forEach(duplicate); selected = []">Duplicate</v-btn>
      <v-btn variant="text" size="small" class="text-none" prepend-icon="play" @click="setStatus(selected, 'Active')">Activate</v-btn>
      <v-btn variant="text" size="small" class="text-none" prepend-icon="pause" @click="setStatus(selected, 'Paused')">Pause</v-btn>
      <v-btn variant="text" size="small" class="text-none text-error" prepend-icon="trash-2" @click="askDelete(selected)">Delete</v-btn>
    </MpFloatingBulkBar>

    <!-- Template picker -->
    <MpDialog
      v-model="chooseDialog"
      size="lg"
      title="Choose a Template"
      subtitle="Pick a starting point or begin from scratch"
    >
      <div class="d-flex align-center ga-3">
        <v-btn-toggle v-model="filterType" density="compact" variant="outlined" divided rounded="lg" mandatory class="mp-toggle-group mp-toggle-group--segmented">
          <v-btn v-for="t in ['All', 'Popup', 'Embedded']" :key="t" :value="t" size="small" class="text-none px-4">{{ t }}</v-btn>
        </v-btn-toggle>
        <v-text-field v-model="templateSearch" prepend-inner-icon="search" placeholder="Search templates…" hide-details class="flex-grow-1" />
      </div>
      <v-row dense class="template-grid">
        <v-col v-for="tmpl in filteredTemplates" :key="tmpl.id" cols="12" sm="6" md="4">
          <v-card
            :variant="selectedTemplate === tmpl.id ? 'tonal' : 'flat'"
            :color="selectedTemplate === tmpl.id ? 'primary' : 'default'"
            rounded="lg"
            border
            class="pa-4 cursor-pointer template-card h-100 d-flex flex-column ga-2"
            :class="{ selected: selectedTemplate === tmpl.id }"
            @click="selectedTemplate = tmpl.id"
          >
            <div class="d-flex align-start justify-space-between">
              <v-icon :color="tmpl.color" size="28">{{ tmpl.icon }}</v-icon>
              <div v-if="tmpl.type" class="d-flex ga-1">
                <v-chip size="x-small" variant="tonal" rounded="lg">{{ tmpl.type }}</v-chip>
                <v-chip v-if="tmpl.position" size="x-small" variant="outlined" rounded="lg">Center</v-chip>
              </div>
            </div>
            <div class="text-body-2 font-weight-bold">{{ tmpl.name }}</div>
            <div class="text-caption text-medium-emphasis">{{ tmpl.desc }}</div>
            <v-icon v-if="selectedTemplate === tmpl.id" color="primary" class="selected-check" size="20">circle-check</v-icon>
          </v-card>
        </v-col>
      </v-row>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="chooseDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="selectedTemplate === null" prepend-icon="ruler" @click="openBuilder">Open Builder</v-btn>
      </template>
    </MpDialog>

    <!-- Preview dialog: readonly render of the form's blocks -->
    <MpDialog v-model="previewDialog" size="md" :title="activeForm?.name ?? 'Preview'">
      <div v-if="activeForm" class="preview-stage d-flex justify-center pa-6">
        <div
          class="preview-form"
          :style="{
            width: Math.min(activeForm.design.width, 340) + 'px',
            padding: `${activeForm.design.paddingTop}px ${activeForm.design.paddingRight}px ${activeForm.design.paddingBottom}px ${activeForm.design.paddingLeft}px`,
            background: activeForm.design.backgroundType === 'color' ? activeForm.design.backgroundColor : '#1A1A2E',
            borderRadius: activeForm.design.borderRadius + 'px',
            border: `${activeForm.design.borderThickness}px solid ${activeForm.design.borderColor}`,
          }"
        >
          <div v-for="b in activeForm.mainFormBlocks" :key="b.id" class="preview-block" :style="{ textAlign: b.align }">
            <div v-if="b.type === 'title'" class="preview-block__title">{{ b.text }}</div>
            <div v-else-if="b.type === 'paragraph' || b.type === 'text'" class="preview-block__paragraph">{{ b.text }}</div>
            <ul v-else-if="b.type === 'list'" class="preview-block__list"><li v-for="(li, i) in b.items" :key="i">{{ li }}</li></ul>
            <div v-else-if="b.type === 'image' || b.type === 'video'" class="preview-block__media"><v-icon size="24" color="white">{{ b.type === 'video' ? 'video' : 'image' }}</v-icon></div>
            <hr v-else-if="b.type === 'divider'" class="preview-block__divider" />
            <div v-else-if="b.type === 'email_submit'">
              <div class="preview-block__field">Email address</div>
              <div class="preview-block__submit">{{ b.text || activeForm.buttonLabel }}</div>
            </div>
          </div>
        </div>
      </div>
    </MpDialog>

    <!-- Embed code dialog -->
    <MpDialog v-model="embedDialog" size="md" :title="`Embed “${activeForm?.name ?? ''}”`">
      <template v-if="activeForm">
        <MpFormSection title="Website Embed">
          <v-textarea :model-value="embedSnippets.script" readonly rows="2" class="embed-mono" hide-details />
          <v-btn variant="tonal" size="small" class="text-none align-self-start" prepend-icon="copy" @click="copyText(embedSnippets.script)">Copy script</v-btn>
        </MpFormSection>
        <MpFormSection title="Manual Integration">
          <v-textarea :model-value="embedSnippets.manual" readonly rows="4" class="embed-mono" hide-details />
          <v-btn variant="tonal" size="small" class="text-none align-self-start" prepend-icon="copy" @click="copyText(embedSnippets.manual)">Copy snippet</v-btn>
        </MpFormSection>
      </template>
    </MpDialog>

    <MpConfirmDialog
      :model-value="confirmDeleteIds !== null"
      title="Delete form(s)?"
      message="This will permanently remove the selected form(s). This can't be undone."
      confirm-label="Delete"
      danger
      @update:model-value="confirmDeleteIds = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped lang="scss">
.acquisition-page { padding-bottom: 8px; }
.gap-5 { gap: 24px; }
.num { font-variant-numeric: tabular-nums; }

.acq-search { max-width: 280px; }

.form-grid { row-gap: 20px; }

.form-card {
  transition: border-color var(--mp-motion-duration-base) var(--mp-motion-easing-standard), box-shadow var(--mp-motion-duration-base) var(--mp-motion-easing-standard);
  background: rgb(var(--v-theme-surface));
  border-color: var(--mp-border-subtle) !important;
}
.form-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.25) !important;
  box-shadow: 0 6px 20px rgba(var(--v-theme-on-surface), 0.06);
}
.form-card--selected {
  border-color: rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 0 0 1px rgb(var(--v-theme-primary));
}

/* Mini form preview */
.fp {
  position: relative;
  height: 132px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--mp-border-subtle);
  background:
    radial-gradient(120% 120% at 50% 0%, color-mix(in oklch, var(--fp-accent) 12%, transparent), transparent 60%),
    rgba(var(--v-theme-on-surface), 0.02);
  overflow: hidden;
}
.fp__check {
  position: absolute;
  top: 4px;
  left: 6px;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.form-card:hover .fp__check,
.fp__check--on { opacity: 1; }

.fp__modal {
  width: 76%;
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--mp-border-subtle);
  border-radius: 8px;
  padding: 10px 12px;
  box-shadow: 0 8px 20px rgba(var(--v-theme-on-surface), 0.08);
}
.fp__embed {
  width: 100%;
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--mp-border-subtle);
  border-radius: 8px;
  padding: 10px 12px;
}
.fp__headline {
  font-size: 10px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 7px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fp__headline--sm { margin-bottom: 6px; }
.fp__field {
  height: 14px;
  border: 1px solid var(--mp-border-subtle);
  border-radius: 4px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  margin-bottom: 6px;
  font-size: 7px;
  color: rgba(var(--v-theme-on-surface), 0.45);
  display: flex;
  align-items: center;
  padding: 0 6px;
}
.fp__inline { display: flex; align-items: center; gap: 6px; }
.fp__field--grow { flex: 1 1 auto; margin-bottom: 0; }
.fp__cta {
  height: 15px;
  border-radius: 4px;
  background: var(--fp-accent);
  color: #fff;
  font-size: 7px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
}
.fp__cta--sm { flex: 0 0 auto; }

.form-stats { border-top: 1px solid var(--mp-border-subtle); }

.list-card {
  background: rgb(var(--v-theme-surface));
  border-color: var(--mp-border-subtle) !important;
}
.acquisition-data-table :deep(th),
.acquisition-data-table :deep(td) { padding-inline: 20px !important; }

.add-card {
  transition: border-color var(--mp-motion-duration-base) var(--mp-motion-easing-standard), background-color var(--mp-motion-duration-base) var(--mp-motion-easing-standard);
  background: linear-gradient(180deg, rgba(var(--v-theme-surface-variant), 0.18), rgba(var(--v-theme-surface-variant), 0.08));
  border-style: dashed !important;
  border-color: rgba(var(--v-theme-border), 0.9) !important;
  min-height: 280px;
}
.add-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.24) !important;
  background: rgba(var(--v-theme-primary), 0.05);
}

.template-grid { max-height: 420px; overflow-y: auto; row-gap: 12px; }
.template-card {
  position: relative;
  transition: border-color var(--mp-motion-duration-base) var(--mp-motion-easing-standard), background-color var(--mp-motion-duration-base) var(--mp-motion-easing-standard);
  background: rgb(var(--v-theme-surface));
  border-color: var(--mp-border-subtle) !important;
}
.template-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.2) !important;
  background: rgba(var(--v-theme-primary), 0.04);
}
.template-card.selected { background: rgba(var(--v-theme-primary), 0.08); }
.selected-check { position: absolute; top: 10px; right: 10px; }

/* Preview & embed dialogs */
.preview-stage { background: rgba(var(--v-theme-on-surface), 0.03); border-radius: 12px; }
.preview-form { color: #fff; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25); }
.preview-block { margin-bottom: 8px; }
.preview-block__title { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
.preview-block__paragraph { font-size: 12px; opacity: 0.8; }
.preview-block__list { font-size: 12px; opacity: 0.85; padding-left: 18px; }
.preview-block__media { height: 80px; display: flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.1); border-radius: 8px; }
.preview-block__divider { border: none; border-top: 1px solid rgba(255, 255, 255, 0.2); }
.preview-block__field, .preview-block__submit {
  height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-bottom: 6px;
}
.preview-block__field { background: rgba(255, 255, 255, 0.12); justify-content: flex-start; padding: 0 10px; opacity: 0.85; }
.preview-block__submit { background: rgb(var(--v-theme-primary)); font-weight: 600; }
:deep(.embed-mono textarea) { font-family: monospace; font-size: 0.78rem; }
</style>
