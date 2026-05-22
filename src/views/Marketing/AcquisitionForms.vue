<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const router = useRouter()
const route = useRoute()
const accountId = computed(() => route.params.accountId as string)

const forms = ref([
  { id: 1, name: 'Main Website Pop-up', type: 'Modal', views: 45000, conversions: 1200, rate: 2.7, status: 'Active', updated: 'Mar 5, 2026' },
  { id: 2, name: 'Blog Sidebar Form', type: 'Embedded', views: 85000, conversions: 350, rate: 0.4, status: 'Active', updated: 'Feb 28, 2026' },
  { id: 3, name: 'Exit Intent 2026', type: 'Modal', views: 12000, conversions: 45, rate: 0.4, status: 'Draft', updated: 'Mar 1, 2026' },
  { id: 4, name: 'Holiday VIP Sign-up', type: 'Modal', views: 0, conversions: 0, rate: 0, status: 'Draft', updated: 'Mar 7, 2026' },
  { id: 5, name: 'Footer Newsletter', type: 'Embedded', views: 32000, conversions: 880, rate: 2.8, status: 'Paused', updated: 'Jan 15, 2026' },
])

const statusColor = (s: string) => ({ Active: 'success', Draft: 'grey', Paused: 'warning' })[s as string] ?? 'default'
const statusIcon = (s: string) => ({ Active: 'circle-check', Draft: 'pencil', Paused: 'circle-pause' })[s as string] ?? 'help-circle'

const chooseDialog = ref(false)
const selectedTemplate = ref<number | null>(null)
const templateSearch = ref('')

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

const filterType = ref('All')
const filteredTemplates = computed(() =>
  templates.filter((t) =>
    (filterType.value === 'All' || t.type === filterType.value) &&
    (!templateSearch.value || t.name.toLowerCase().includes(templateSearch.value.toLowerCase())),
  ),
)

function openBuilder() {
  if (selectedTemplate.value === null) return
  chooseDialog.value = false
  router.push({ name: 'FormBuilder', params: { accountId: accountId.value } })
}

function editInBuilder() {
  router.push({ name: 'FormBuilder', params: { accountId: accountId.value } })
}

const viewMode = ref<'grid' | 'list'>('grid')
const search = ref('')

const filters = ref({
  status: '',
  type: '',
})

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

function clearAllFilters() {
  filters.value.status = ''
  filters.value.type = ''
}
</script>

<template>
  <div class="acquisition-page h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Acquisition Forms"
      subtitle="Capture leads and grow your audience across your channels."
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="chooseDialog = true">Create Form</v-btn>
      </template>
    </MpPageHeader>

    <div class="kpi-row d-flex gap-4">
      <v-col
        v-for="s in [
          { label: 'Total Views', value: forms.reduce((a, f) => a + f.views, 0).toLocaleString(), color: 'primary', icon: 'eye' },
          { label: 'Total Conversions', value: forms.reduce((a, f) => a + f.conversions, 0).toLocaleString(), color: 'success', icon: 'user-plus' },
          { label: 'Avg. Conv. Rate', value: ((forms.reduce((a, f) => a + f.rate, 0) / forms.length)).toFixed(1) + '%', color: 'warning', icon: 'percent' },
          { label: 'Active Forms', value: forms.filter((f) => f.status === 'Active').length, color: 'secondary', icon: 'circle-check' },
        ]"
        :key="s.label"
        cols="12"
        sm="3"
      >
        <v-card variant="flat" border rounded="lg" class="pa-5 kpi-card">
          <div class="d-flex justify-space-between align-center mb-3">
            <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase">{{ s.label }}</div>
            <div class="kpi-icon-wrap">
              <v-icon :color="s.color" size="18">{{ s.icon }}</v-icon>
            </div>
          </div>
          <div class="text-h5 font-weight-bold" :class="`text-${s.color}`">{{ s.value }}</div>
        </v-card>
      </v-col>
    </div>

    <div class="view-toolbar d-flex align-center gap-2 overflow-x-auto hide-scrollbar mt-3">
      <v-btn-toggle
        v-model="viewMode"
        density="comfortable"
        mandatory
        class="mp-toggle-group mp-toggle-group--pills bg-transparent"
        selected-class="bg-primary text-white"
      >
        <v-btn
          v-for="v in [{ val: 'grid', icon: 'grid-2x2', label: 'Grid' }, { val: 'list', icon: 'list', label: 'List' }]"
          :key="v.val"
          :value="v.val"
          rounded="pill"
          variant="flat"
          size="small"
          class="view-toggle-btn text-none px-4 mr-2"
          :class="viewMode === v.val ? '' : 'bg-grey-lighten-4 text-medium-emphasis'"
        >
          <v-icon size="small" class="mr-1">{{ v.icon }}</v-icon> {{ v.label }}
        </v-btn>
      </v-btn-toggle>
    </div>

    <v-row v-if="viewMode === 'grid'" class="form-grid" dense>
      <v-col
        v-for="form in forms.filter((f) => !search || f.name.toLowerCase().includes(search.toLowerCase()))"
        :key="form.id"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card variant="flat" border rounded="lg" class="form-card overflow-hidden">
          <div class="form-preview d-flex align-center justify-center pa-4">
            <v-icon size="48" color="primary" class="form-preview-icon">
              {{ form.type === 'Modal' ? 'panel-right' : 'columns-2' }}
            </v-icon>
          </div>
          <div class="pa-5">
            <div class="d-flex align-start justify-space-between mb-2">
              <div>
                <div class="text-body-1 font-weight-bold mb-0.5">{{ form.name }}</div>
                <div class="d-flex align-center gap-2">
                  <v-chip size="x-small" variant="tonal" color="secondary" rounded="lg">{{ form.type }}</v-chip>
                  <v-chip :color="statusColor(form.status)" :prepend-icon="statusIcon(form.status)" size="x-small" variant="flat" rounded="lg">{{ form.status }}</v-chip>
                </div>
              </div>
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" icon="more-vertical" variant="text" size="small"></v-btn>
                </template>
                <v-list density="compact" rounded="xl" nav min-width="160" class="pa-2">
                  <v-list-item prepend-icon="pencil" rounded="lg" @click="editInBuilder()">Edit in Builder</v-list-item>
                  <v-list-item prepend-icon="copy" rounded="lg">Duplicate</v-list-item>
                  <v-list-item prepend-icon="code-2" rounded="lg">Get Embed Code</v-list-item>
                  <v-list-item prepend-icon="trash-2" rounded="lg" class="text-error mt-1">Delete</v-list-item>
                </v-list>
              </v-menu>
            </div>
            <div class="form-stats d-flex gap-4 mt-4 pt-4">
              <div class="text-center flex-grow-1">
                <div class="text-h6 font-weight-bold">{{ form.views.toLocaleString() }}</div>
                <div class="text-caption text-medium-emphasis">Views</div>
              </div>
              <div class="text-center flex-grow-1">
                <div class="text-h6 font-weight-bold text-success">{{ form.conversions.toLocaleString() }}</div>
                <div class="text-caption text-medium-emphasis">Conversions</div>
              </div>
              <div class="text-center flex-grow-1">
                <div class="text-h6 font-weight-bold text-primary">{{ form.rate }}%</div>
                <div class="text-caption text-medium-emphasis">Conv. Rate</div>
              </div>
            </div>
          </div>
          <div class="px-5 pb-5">
            <v-btn block variant="tonal" color="primary" size="small" class="text-none" prepend-icon="pencil" @click="editInBuilder()">Edit in Builder</v-btn>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="4">
        <v-card variant="flat" border rounded="lg" class="pa-6 d-flex flex-column align-center justify-center text-center cursor-pointer add-card" style="min-height:280px;" @click="chooseDialog = true">
          <v-icon size="40" color="primary" class="mb-3">circle-plus</v-icon>
          <div class="text-body-1 font-weight-bold mb-1">Create New Form</div>
          <div class="text-caption text-medium-emphasis">Choose a template and launch the form builder</div>
        </v-card>
      </v-col>
    </v-row>

    <v-card v-else variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden list-card">
      <MpDataTableToolbar
        v-model:search="search"
        title="Forms"
        search-placeholder="Search forms..."
        :active-filters="activeFilterEntries"
        :total-count="forms.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <v-select
              v-model="filters.status"
              label="Status"
              :items="['', 'Active', 'Draft', 'Paused']"
              variant="outlined"
              density="compact"
              hide-details
              class="mb-3"
            />
            <v-select
              v-model="filters.type"
              label="Type"
              :items="['', 'Modal', 'Embedded']"
              variant="outlined"
              density="compact"
              hide-details
              class="mb-3"
            />
          </div>
        </template>
      </MpDataTableToolbar>

      <v-data-table
        :headers="[{ title: 'Form', key: 'name' }, { title: 'Type', key: 'type' }, { title: 'Views', key: 'views', align: 'end' }, { title: 'Conversions', key: 'conversions', align: 'end' }, { title: 'Rate', key: 'rate', align: 'end' }, { title: 'Status', key: 'status' }, { title: 'Updated', key: 'updated' }, { title: '', key: 'actions', align: 'end', sortable: false }]"
        :items="forms"
        hover
        density="comfortable"
        :search="search"
        class="flex-grow-1 acquisition-data-table"
      >
        <template v-slot:item.name="{ item }">
          <div class="py-1"><div class="text-body-2 font-weight-medium">{{ item.name }}</div></div>
        </template>
        <template v-slot:item.type="{ item }"><v-chip size="x-small" variant="outlined" color="secondary" rounded="lg">{{ item.type }}</v-chip></template>
        <template v-slot:item.views="{ item }"><span class="font-weight-medium">{{ item.views.toLocaleString() }}</span></template>
        <template v-slot:item.conversions="{ item }"><span class="font-weight-medium text-success">{{ item.conversions.toLocaleString() }}</span></template>
        <template v-slot:item.rate="{ item }"><span class="font-weight-bold text-primary">{{ item.rate }}%</span></template>
        <template v-slot:item.status="{ item }"><v-chip :color="statusColor(item.status)" size="x-small" variant="flat" rounded="lg">{{ item.status }}</v-chip></template>
        <template v-slot:item.actions>
          <div class="ActionButtons d-flex justify-end gap-1">
            <v-tooltip text="Edit in Builder" location="top"><template v-slot:activator="{props}"><v-btn v-bind="props" icon="pencil" variant="text" size="small" color="primary" aria-label="Edit in Builder" @click="editInBuilder()"></v-btn></template></v-tooltip>
            <v-tooltip text="Duplicate" location="top"><template v-slot:activator="{props}"><v-btn v-bind="props" icon="copy" variant="text" size="small"></v-btn></template></v-tooltip>
            <v-tooltip text="Delete" location="top"><template v-slot:activator="{props}"><v-btn v-bind="props" icon="trash-2" variant="text" size="small" color="error"></v-btn></template></v-tooltip>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="chooseDialog" max-width="820" rounded="xl">
      <v-card rounded="lg" border flat color="surface" class="template-dialog-card">
        <div class="pa-5 pb-3 d-flex align-center justify-space-between">
          <div>
            <div class="text-h6 font-weight-bold">Choose a Template</div>
            <div class="text-caption text-medium-emphasis">Pick a starting point or begin from scratch</div>
          </div>
          <v-btn icon="x" variant="text" size="small" @click="chooseDialog = false"></v-btn>
        </div>

        <div class="pa-5">
          <div class="d-flex align-center gap-3 mb-4">
            <v-btn-toggle
              v-model="filterType"
              density="compact"
              variant="outlined"
              divided
              rounded="lg"
              mandatory
              class="mp-toggle-group mp-toggle-group--segmented"
            >
              <v-btn v-for="t in ['All', 'Modal', 'Embedded']" :key="t" :value="t" size="small" class="text-none px-4">{{ t }}</v-btn>
            </v-btn-toggle>
            <v-text-field
              v-model="templateSearch"
              prepend-inner-icon="search"
              placeholder="Search templates…"
              variant="outlined"
              density="compact"
              hide-details
              class="flex-grow-1"
            />
          </div>

          <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-3" v-if="filteredTemplates.some((t) => t.popular)">Most Popular</div>

          <v-row dense class="template-grid">
            <v-col v-for="tmpl in filteredTemplates" :key="tmpl.id" cols="12" sm="6" md="4">
              <v-card
                @click="selectedTemplate = tmpl.id"
                :variant="selectedTemplate === tmpl.id ? 'tonal' : 'flat'"
                :color="selectedTemplate === tmpl.id ? 'primary' : 'default'"
                rounded="lg"
                border
                class="pa-4 cursor-pointer template-card h-100"
                :class="{ selected: selectedTemplate === tmpl.id }"
              >
                <div class="d-flex align-start justify-space-between mb-2">
                  <v-icon :color="tmpl.color" size="28">{{ tmpl.icon }}</v-icon>
                  <div class="d-flex gap-1">
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
.acquisition-page {
  padding-bottom: 8px;
}

.gap-5 {
  gap: 24px;
}

.kpi-row {
  margin-top: 4px;
}

.view-toolbar {
  padding: 4px 0;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.kpi-card {
  background: rgb(var(--v-theme-surface));
  border-color: var(--mp-border-subtle) !important;
}

.kpi-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-surface-variant), 0.72);
  border: 1px solid rgba(var(--v-theme-border), 0.92);
}

.view-toggle-btn {
  border: 1px solid rgba(var(--v-theme-border), 0.75);
}

.form-grid {
  row-gap: 20px;
}

.form-card {
  transition: border-color $mp-transition-base, background-color $mp-transition-base;
  background: rgb(var(--v-theme-surface));
  border-color: var(--mp-border-subtle) !important;
}

.form-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.2) !important;
  background: rgba(var(--v-theme-surface-variant), 0.16);
}

.form-preview {
  height: 120px;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.08), rgba(var(--v-theme-secondary), 0.05));
  border-bottom: 1px solid var(--mp-border-subtle);
}

.form-preview-icon {
  opacity: 0.42;
}

.form-stats {
  border-top: 1px solid var(--mp-border-subtle);
}

.list-card {
  background: rgb(var(--v-theme-surface));
  border-color: var(--mp-border-subtle) !important;
}

.acquisition-data-table :deep(th),
.acquisition-data-table :deep(td) {
  padding-inline: 24px !important;
}

.add-card {
  transition: border-color $mp-transition-base, background-color $mp-transition-base;
  background: linear-gradient(180deg, rgba(var(--v-theme-surface-variant), 0.18), rgba(var(--v-theme-surface-variant), 0.08));
  border-style: dashed !important;
  border-color: rgba(var(--v-theme-border), 0.9) !important;
}

.add-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.24) !important;
  background: rgba(var(--v-theme-primary), 0.05);
}

.template-dialog-card {
  border-color: var(--mp-border-subtle);
}

.template-grid {
  max-height: 420px;
  overflow-y: auto;
  row-gap: 12px;
}

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

.template-card.selected {
  background: rgba(var(--v-theme-primary), 0.08);
}

.selected-check {
  position: absolute;
  top: 10px;
  right: 10px;
}

.ActionButtons {
  opacity: 0;
  transition: opacity 0.2s;
}

tr:hover .ActionButtons {
  opacity: 1;
}
</style>
