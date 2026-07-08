<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useFormsStore } from '@/stores/useForms'
import { storeToRefs } from 'pinia'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'

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
function editInBuilder() {
  router.push({ name: 'FormBuilder', params: { accountId: accountId.value } })
}
function duplicate(id: number) { formsStore.duplicate(id) }
function removeForms(ids: number[]) { formsStore.remove(ids); selected.value = [] }
function setStatus(ids: number[], status: 'Active' | 'Paused') { formsStore.setStatus(ids, status); selected.value = [] }

// Filters (list mode)
const filters = ref({ status: '', type: '' })
const activeFilterEntries = computed(() => {
  const entries: Array<{ key: string; label: string }> = []
  if (filters.value.status) entries.push({ key: 'status', label: `Status: ${filters.value.status}` })
  if (filters.value.type) entries.push({ key: 'type', label: `Type: ${filters.value.type}` })
  return entries
})
function removeFilter(key: string) {
  if (key === 'status') filters.value.status = ''
  if (key === 'type') filters.value.type = ''
}
function clearAllFilters() { filters.value.status = ''; filters.value.type = '' }

const listItems = computed(() =>
  forms.value.filter(f =>
    (!filters.value.status || f.status === filters.value.status) &&
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

// Template picker
const chooseDialog = ref(false)
const selectedTemplate = ref<number | null>(null)
const templateSearch = ref('')
const filterType = ref('All')
const templates = [
  { id: 0, name: 'Blank Canvas', type: 'Modal', desc: 'Start from scratch with full creative control', icon: 'square-dashed', color: 'grey', popular: false },
  { id: 1, name: 'Newsletter Sign-up', type: 'Modal', desc: 'Simple email capture with high conversion rate', icon: 'newspaper', color: 'primary', popular: true },
  { id: 2, name: 'Exit Intent', type: 'Modal', desc: 'Appear just as visitors are about to leave', icon: 'log-out', color: 'warning', popular: true },
  { id: 3, name: 'Discount Offer', type: 'Modal', desc: 'Offer a coupon code in exchange for email', icon: 'percent', color: 'success', popular: true },
  { id: 4, name: 'VIP Club Invite', type: 'Modal', desc: 'Exclusive membership feel for top customers', icon: 'crown', color: 'warning', popular: false },
  { id: 5, name: 'Product Announcement', type: 'Modal', desc: 'Announce new products with email capture', icon: 'badge', color: 'secondary', popular: false },
  { id: 6, name: 'Sidebar Newsletter', type: 'Embedded', desc: 'Non-intrusive embedded form for blog/content pages', icon: 'columns-2', color: 'primary', popular: true },
  { id: 7, name: 'Footer Subscribe', type: 'Embedded', desc: 'Footer-anchored form following GDPR best practices', icon: 'panel-bottom', color: 'info', popular: false },
  { id: 8, name: 'Two-Step Lead Capture', type: 'Modal', desc: 'Button click reveals form to improve qualified leads', icon: 'circle', color: 'purple', popular: false },
  { id: 9, name: 'Countdown Urgency', type: 'Modal', desc: 'Timer-driven popup for limited-time offers', icon: 'timer', color: 'error', popular: false },
]
const filteredTemplates = computed(() =>
  templates.filter(t =>
    (filterType.value === 'All' || t.type === filterType.value) &&
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
  chooseDialog.value = false
  router.push({ name: 'FormBuilder', params: { accountId: accountId.value } })
}
</script>

<template>
  <div class="acquisition-page h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Acquisition Forms"
      subtitle="Capture leads and grow your audience across your channels."
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">Create Form</v-btn>
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
        variant="outlined"
        density="compact"
        hide-details
        rounded="lg"
        class="acq-search"
      />
    </div>

    <!-- Empty state -->
    <v-card v-if="!forms.length" variant="flat" border rounded="lg">
      <MpEmptyState
        icon="layout-template"
        title="No acquisition forms yet"
        description="Create a pop-up or embedded form to start capturing leads."
        action-label="Create Form"
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
              <div v-if="form.type === 'Modal'" class="fp__modal">
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
                    <MpStatusChip :status="form.status" type="general" size="x-small" />
                  </div>
                </div>
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon="more-vertical" variant="text" size="small" aria-label="More actions" />
                  </template>
                  <v-list density="compact" rounded="xl" nav min-width="180" class="pa-2">
                    <v-list-item prepend-icon="eye" rounded="lg">Preview</v-list-item>
                    <v-list-item prepend-icon="copy" rounded="lg" @click="duplicate(form.id)">Duplicate</v-list-item>
                    <v-list-item prepend-icon="code-2" rounded="lg">Get embed code</v-list-item>
                    <v-list-item
                      v-if="form.status !== 'Active'"
                      prepend-icon="play"
                      rounded="lg"
                      @click="setStatus([form.id], 'Active')"
                    >Activate</v-list-item>
                    <v-list-item
                      v-else
                      prepend-icon="pause"
                      rounded="lg"
                      @click="setStatus([form.id], 'Paused')"
                    >Pause</v-list-item>
                    <v-list-item prepend-icon="trash-2" rounded="lg" class="text-error mt-1" @click="removeForms([form.id])">Delete</v-list-item>
                  </v-list>
                </v-menu>
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
              <v-btn block variant="tonal" color="primary" size="small" class="text-none" prepend-icon="pencil" @click="editInBuilder">Edit in Builder</v-btn>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="4">
          <v-card variant="flat" border rounded="lg" class="add-card h-100 d-flex flex-column align-center justify-center text-center pa-6 cursor-pointer" @click="openCreate">
            <v-icon size="40" color="primary" class="mb-3">circle-plus</v-icon>
            <div class="text-body-1 font-weight-bold mb-1">Create New Form</div>
            <div class="text-caption text-medium-emphasis">Choose a template and launch the builder</div>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- List -->
    <v-card v-else variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden list-card">
      <MpDataTableToolbar
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
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <v-select v-model="filters.status" label="Status" :items="['', 'Active', 'Draft', 'Paused']" variant="outlined" density="compact" hide-details class="mb-3" />
            <v-select v-model="filters.type" label="Type" :items="['', 'Modal', 'Embedded']" variant="outlined" density="compact" hide-details class="mb-3" />
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
        <template #item.status="{ item }"><MpStatusChip :status="item.status" type="general" size="x-small" /></template>
        <template #item.actions="{ item }">
          <div class="acq-actions d-flex justify-end ga-1">
            <v-tooltip text="Edit in Builder" location="top">
              <template #activator="{ props }"><v-btn v-bind="props" icon="pencil" variant="text" size="small" color="primary" aria-label="Edit in Builder" @click="editInBuilder" /></template>
            </v-tooltip>
            <v-tooltip text="Duplicate" location="top">
              <template #activator="{ props }"><v-btn v-bind="props" icon="copy" variant="text" size="small" aria-label="Duplicate" @click="duplicate(item.id)" /></template>
            </v-tooltip>
            <v-tooltip text="Delete" location="top">
              <template #activator="{ props }"><v-btn v-bind="props" icon="trash-2" variant="text" size="small" color="error" aria-label="Delete" @click="removeForms([item.id])" /></template>
            </v-tooltip>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Bulk actions -->
    <MpFloatingBulkBar :count="selected.length" :total="forms.length" @clear="selected = []">
      <v-btn variant="text" size="small" class="text-none" prepend-icon="copy" @click="selected.forEach(duplicate); selected = []">Duplicate</v-btn>
      <v-btn variant="text" size="small" class="text-none" prepend-icon="play" @click="setStatus(selected, 'Active')">Activate</v-btn>
      <v-btn variant="text" size="small" class="text-none" prepend-icon="pause" @click="setStatus(selected, 'Paused')">Pause</v-btn>
      <v-btn variant="text" size="small" class="text-none text-error" prepend-icon="trash-2" @click="removeForms(selected)">Delete</v-btn>
    </MpFloatingBulkBar>

    <!-- Template picker -->
    <v-dialog v-model="chooseDialog" max-width="820" rounded="xl">
      <v-card rounded="lg" border flat color="surface" class="template-dialog-card">
        <div class="pa-5 pb-3 d-flex align-center justify-space-between">
          <div>
            <div class="text-h6 font-weight-bold">Choose a Template</div>
            <div class="text-caption text-medium-emphasis">Pick a starting point or begin from scratch</div>
          </div>
          <v-btn icon="x" variant="text" size="small" aria-label="Close" @click="chooseDialog = false" />
        </div>
        <div class="pa-5 pt-0">
          <div class="d-flex align-center ga-3 mb-4">
            <v-btn-toggle v-model="filterType" density="compact" variant="outlined" divided rounded="lg" mandatory class="mp-toggle-group mp-toggle-group--segmented">
              <v-btn v-for="t in ['All', 'Modal', 'Embedded']" :key="t" :value="t" size="small" class="text-none px-4">{{ t }}</v-btn>
            </v-btn-toggle>
            <v-text-field v-model="templateSearch" prepend-inner-icon="search" placeholder="Search templates…" variant="outlined" density="compact" hide-details rounded="lg" class="flex-grow-1" />
          </div>
          <v-row dense class="template-grid">
            <v-col v-for="tmpl in filteredTemplates" :key="tmpl.id" cols="12" sm="6" md="4">
              <v-card
                :variant="selectedTemplate === tmpl.id ? 'tonal' : 'flat'"
                :color="selectedTemplate === tmpl.id ? 'primary' : 'default'"
                rounded="lg"
                border
                class="pa-4 cursor-pointer template-card h-100"
                :class="{ selected: selectedTemplate === tmpl.id }"
                @click="selectedTemplate = tmpl.id"
              >
                <div class="d-flex align-start justify-space-between mb-2">
                  <v-icon :color="tmpl.color" size="28">{{ tmpl.icon }}</v-icon>
                  <div class="d-flex ga-1">
                    <v-chip v-if="tmpl.popular" color="primary" size="x-small" variant="flat" class="font-weight-bold">Popular</v-chip>
                    <v-chip size="x-small" variant="tonal" rounded="lg">{{ tmpl.type }}</v-chip>
                  </div>
                </div>
                <div class="text-body-2 font-weight-bold mb-1">{{ tmpl.name }}</div>
                <div class="text-caption text-medium-emphasis">{{ tmpl.desc }}</div>
                <v-icon v-if="selectedTemplate === tmpl.id" color="primary" class="selected-check" size="20">circle-check</v-icon>
              </v-card>
            </v-col>
          </v-row>
        </div>
        <div class="pa-5 pt-3 d-flex justify-space-between align-center">
          <v-btn variant="text" class="text-none" @click="chooseDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" class="text-none" :disabled="selectedTemplate === null" prepend-icon="ruler" @click="openBuilder">Open Builder</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped lang="scss">
.acquisition-page { padding-bottom: 8px; }
.gap-5 { gap: 24px; }
.num { font-variant-numeric: tabular-nums; }

.acq-search { max-width: 280px; }

.form-grid { row-gap: 20px; }

.form-card {
  transition: border-color $mp-transition-base, box-shadow $mp-transition-base;
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
.acq-actions { opacity: 0; transition: opacity 0.2s; }
tr:hover .acq-actions { opacity: 1; }

.add-card {
  transition: border-color $mp-transition-base, background-color $mp-transition-base;
  background: linear-gradient(180deg, rgba(var(--v-theme-surface-variant), 0.18), rgba(var(--v-theme-surface-variant), 0.08));
  border-style: dashed !important;
  border-color: rgba(var(--v-theme-border), 0.9) !important;
  min-height: 280px;
}
.add-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.24) !important;
  background: rgba(var(--v-theme-primary), 0.05);
}

.template-dialog-card { border-color: var(--mp-border-subtle); }
.template-grid { max-height: 420px; overflow-y: auto; row-gap: 12px; }
.template-card {
  position: relative;
  transition: border-color $mp-transition-base, background-color $mp-transition-base;
  background: rgb(var(--v-theme-surface));
  border-color: var(--mp-border-subtle) !important;
}
.template-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.2) !important;
  background: rgba(var(--v-theme-primary), 0.04);
}
.template-card.selected { background: rgba(var(--v-theme-primary), 0.08); }
.selected-check { position: absolute; top: 10px; right: 10px; }
</style>
