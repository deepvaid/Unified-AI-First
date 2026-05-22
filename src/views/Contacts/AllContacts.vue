<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useContactsStore } from '@/stores/useContacts'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

const router = useRouter()
const route = useRoute()
const store = useContactsStore()
const search = ref('')
const selected = ref<number[]>([])

// Quick-Add drawer
const addDrawer = ref(false)
const addStep = ref(1)
const newContact = ref({ firstName: '', lastName: '', email: '', phone: '', company: '', role: '', tags: [] as string[], list: 'Newsletter Subscribers', status: 'Active' })
const tagInput = ref('')
function addTag() { if (tagInput.value.trim()) { newContact.value.tags.push(tagInput.value.trim()); tagInput.value = '' } }
function removeTag(i: number) { newContact.value.tags.splice(i, 1) }
function saveContact() { addDrawer.value = false; addStep.value = 1; newContact.value = { firstName:'', lastName:'', email:'', phone:'', company:'', role:'', tags:[], list:'Newsletter Subscribers', status:'Active' }; saveSnack.value = true }

// Import wizard
const importDialog = ref(false)
const importStep = ref(1)
const importList = ref('Newsletter Subscribers')
const fieldMappings = ref([
  { csvCol: 'First Name', field: 'First Name', sample: 'John' },
  { csvCol: 'Last Name',  field: 'Last Name',  sample: 'Doe' },
  { csvCol: 'Email',      field: 'Email',       sample: 'john@example.com' },
  { csvCol: 'Phone',      field: 'Phone',       sample: '+1 555 000 0000' },
  { csvCol: 'Company',    field: 'Company',     sample: 'Acme Corp' },
])
const contactFields = ['Email','First Name','Last Name','Phone','Company','City','Country','Tag','Custom Field 1','— Skip —']
function startImport() { importDialog.value = true; importStep.value = 1 }

// Filters — vocab aligned to store enum values
const filters = ref({
  status: null as string | null,
  score: null as string | null,
  activity: null as string | null,
})

const filterOptions = {
  // Store values: 'Subscribed', 'Unsubscribed', 'Bounced', 'Spam'
  status: ['Subscribed', 'Unsubscribed', 'Bounced', 'Spam'],
  score: ['80–100 (Hot)', '50–79 (Warm)', '0–49 (Cold)'],
  activity: ['Last 7 days', 'Last 30 days', 'Last 90 days', 'Over 90 days'],
}

const filterLabels: Record<string, string> = {
  status: 'Status',
  score: 'Score',
  activity: 'Last Activity',
}

const activeFilterEntries = computed(() => {
  return Object.entries(filters.value)
    .filter(([, v]) => v !== null)
    .map(([key, value]) => ({ key, label: `${filterLabels[key]}: ${value}` }))
})

const filteredContacts = computed(() => {
  return store.contacts.filter(c => {
    if (filters.value.status && c.status !== filters.value.status) return false
    if (filters.value.score) {
      const s = c.score
      if (filters.value.score.startsWith('80') && s < 80) return false
      if (filters.value.score.startsWith('50') && (s < 50 || s > 79)) return false
      if (filters.value.score.startsWith('0') && s >= 50) return false
    }
    if (filters.value.activity && c.lastActive) {
      const lastActive = new Date(c.lastActive).getTime()
      const now = Date.now()
      const days = (now - lastActive) / 86400000
      if (filters.value.activity === 'Last 7 days' && days > 7) return false
      if (filters.value.activity === 'Last 30 days' && days > 30) return false
      if (filters.value.activity === 'Last 90 days' && days > 90) return false
      if (filters.value.activity === 'Over 90 days' && days <= 90) return false
    }
    return true
  })
})

function removeFilter(key: string) {
  filters.value[key as keyof typeof filters.value] = null
}

function clearAllFilters() {
  filters.value = { status: null, score: null, activity: null }
}

// Table
const headers = [
  { title: 'Contact', key: 'contact', sortable: true },
  { title: 'Company', key: 'company' },
  { title: 'Tags', key: 'tags', sortable: false },
  { title: 'Status', key: 'status' },
  { title: 'Score', key: 'score', align: 'end' as const },
  { title: 'Last Active', key: 'lastActive', align: 'end' as const },
  { title: '', key: 'actions', align: 'end' as const, sortable: false, width: '48px' },
]

// Column visibility
const hiddenColumns = ref<string[]>([])
const visibleHeaders = computed(() =>
  headers.filter(h => !hiddenColumns.value.includes(h.key))
)

const scoreColor = (s: number) => s >= 80 ? 'success' : s >= 50 ? 'warning' : 'error'
const saveSnack = ref(false)

function selectAll() {
  selected.value = store.contacts.map((_, i) => i)
}

function contactPath(contactId: number | string) {
  const accountId = Array.isArray(route.params.accountId)
    ? route.params.accountId[0]
    : route.params.accountId
  return `/accounts/${accountId}/contacts/${contactId}`
}

function openContact(contactId: number | string) {
  router.push(contactPath(contactId))
}

function handleContactRowClick(event: MouseEvent, payload: { item: unknown }) {
  const target = event.target as HTMLElement | null
  if (target?.closest('button, a, input, [role="button"], .v-selection-control, .v-overlay')) return

  const item = payload.item as { id?: number | string }
  if (item.id) openContact(item.id)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">

    <!-- Header -->
    <MpPageHeader
      title="Contacts"
      :subtitle="`${store.contacts.length.toLocaleString()} total contacts · ${store.contacts.filter(c => c.status === 'Active').length.toLocaleString()} active`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="upload" class="text-none" @click="startImport" color="surface">Import</v-btn>
        <v-btn variant="flat" prepend-icon="share" class="text-none" @click="startImport" color="surface">Export</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="addDrawer=true;addStep=1">Add Contact</v-btn>
      </template>
    </MpPageHeader>

    <!-- Single Card: Table with integrated toolbar, filters, bulk bar -->
    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">

      <!-- Toolbar: title, search, filter, filter chips, bulk bar -->
      <MpDataTableToolbar
        v-model:search="search"
        v-model:hidden-columns="hiddenColumns"
        title="All Contacts"
        :headers="headers"
        :active-filters="activeFilterEntries"
        :selected-count="selected.length"
        :total-count="filteredContacts.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
        @clear-selection="selected = []"
        @select-all="selectAll"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <div v-for="(options, key) in filterOptions" :key="key" class="mb-3">
              <v-select
                v-model="filters[key as keyof typeof filters]"
                :label="filterLabels[key]"
                :items="options"
                variant="outlined"
                density="compact"
                hide-details
                clearable
              />
            </div>
          </div>
        </template>
        <template #bulk-actions>
          <v-btn variant="flat" size="small" class="text-none" prepend-icon="share" rounded="lg" color="surface">Export</v-btn>
          <v-btn variant="flat" size="small" class="text-none" prepend-icon="copy" rounded="lg" color="surface">Duplicate</v-btn>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" variant="flat" size="small" class="text-none" append-icon="chevron-down" rounded="lg" color="surface">More Actions</v-btn>
            </template>
            <v-list density="compact" rounded="lg" elevation="3" class="py-1">
              <v-list-item prepend-icon="playlist-plus" title="Add to List" />
              <v-list-item prepend-icon="tags" title="Apply Tag" />
              <v-list-item prepend-icon="circle-minus" title="Unsubscribe" />
              <v-divider class="my-1" style="opacity: 0.4" />
              <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" />
            </v-list>
          </v-menu>
        </template>
      </MpDataTableToolbar>

      <!-- Data Table -->
      <v-data-table
        v-model="selected"
        :headers="visibleHeaders"
        :items="filteredContacts"
        :search="search"
        show-select
        hover
        density="comfortable"
        :items-per-page="15"
        fixed-header
        class="flex-grow-1 contacts-table"
        @click:row="handleContactRowClick"
      >
        <template v-slot:item.contact="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar size="36" class="mr-3 border">
              <v-img :src="(item as any).avatarUrl" :alt="`${(item as any).firstName} ${(item as any).lastName}`" cover>
                <template #placeholder>
                  <div class="avatar-fallback">{{ (item as any).firstName?.[0] ?? '?' }}</div>
                </template>
                <template #error>
                  <div class="avatar-fallback">{{ (item as any).firstName?.[0] ?? '?' }}</div>
                </template>
              </v-img>
            </v-avatar>
            <div>
              <button
                type="button"
                class="contact-link"
                @click.stop="openContact((item as any).id)"
              >
                {{ (item as any).firstName + ' ' + ((item as any).lastName ?? '') }}
              </button>
              <div class="text-caption text-medium-emphasis">{{ (item as any).email }}</div>
              <div class="contact-row-hint">
                View profile
                <v-icon size="12">arrow-up-right</v-icon>
              </div>
            </div>
          </div>
        </template>

        <template v-slot:item.company="{ item }">
          <span class="text-body-2">{{ (item as any).company }}</span>
        </template>

        <template v-slot:item.tags="{ item }">
          <div class="d-flex gap-1 flex-wrap py-1">
            <v-chip v-for="tag in (item as any).tags ?? []" :key="tag" size="x-small" variant="tonal" color="secondary">{{ tag }}</v-chip>
          </div>
        </template>

        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="String(item.status ?? '')" type="contact" size="x-small" variant="flat" />
        </template>

        <template v-slot:item.score="{ item }">
          <div class="d-flex align-center gap-2" style="min-width:80px;">
            <v-progress-linear :model-value="item.score" :color="scoreColor(item.score)" rounded height="6" bg-color="surface-variant" style="width:48px;" />
            <span class="text-caption font-weight-bold">{{ item.score }}</span>
          </div>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-menu location="bottom end">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="more-horizontal" variant="text" size="small" density="comfortable" color="medium-emphasis" @click.stop />
            </template>
            <v-list density="compact" rounded="lg" min-width="160" elevation="3" class="py-1">
              <v-list-item prepend-icon="external-link" title="View profile" @click="openContact((item as any).id)" />
              <v-list-item prepend-icon="pencil" title="Edit" />
              <v-list-item prepend-icon="copy" title="Duplicate" />
              <v-divider class="my-1" style="opacity: 0.4" />
              <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" />
            </v-list>
          </v-menu>
        </template>
        <template #no-data>
          <MpEmptyState
            icon="users"
            :title="search ? 'No contacts match your search' : 'No contacts found'"
            :description="search ? 'Try a different search term or clear filters.' : 'Import or add contacts to get started.'"
            action-label="Add Contact"
            action-icon="plus"
            class="py-10"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Quick-Add Contact Drawer -->
    <MpFormDrawer v-model="addDrawer" title="Add Contact" :subtitle="`Step ${addStep} of 2`" :width="460">
      <!-- Step 1: Basic Info -->
      <div v-if="addStep===1">
        <div class="d-flex justify-center mb-5">
          <v-avatar color="primary" size="72" class="text-h4 font-weight-bold">
            {{ newContact.firstName?.[0]?.toUpperCase() ?? '?' }}
          </v-avatar>
        </div>
        <v-row dense>
          <v-col cols="6"><v-text-field v-model="newContact.firstName" label="First Name *" variant="outlined" density="comfortable" /></v-col>
          <v-col cols="6"><v-text-field v-model="newContact.lastName" label="Last Name" variant="outlined" density="comfortable" /></v-col>
          <v-col cols="12"><v-text-field v-model="newContact.email" label="Email Address *" type="email" variant="outlined" density="comfortable" prepend-inner-icon="mail" /></v-col>
          <v-col cols="12"><v-text-field v-model="newContact.phone" label="Phone Number" variant="outlined" density="comfortable" prepend-inner-icon="phone" /></v-col>
          <v-col cols="12"><v-text-field v-model="newContact.company" label="Company" variant="outlined" density="comfortable" prepend-inner-icon="building-2" /></v-col>
        </v-row>
      </div>

      <!-- Step 2: List, Tags, Status -->
      <div v-else>
        <v-select v-model="newContact.list" label="Subscribe to List" :items="['Newsletter Subscribers','VIP Customer Circle','Win-Back Segment','All Contacts']" variant="outlined" density="comfortable" class="mb-4" prepend-inner-icon="playlist-check" />
        <v-select v-model="newContact.status" label="Status" :items="['Active','Unsubscribed']" variant="outlined" density="comfortable" class="mb-4" />
        <div class="text-subtitle-2 font-weight-bold mb-2">Tags</div>
        <div class="d-flex flex-wrap gap-2 mb-3">
          <v-chip v-for="(t,i) in newContact.tags" :key="i" closable size="small" color="secondary" variant="tonal" @click:close="removeTag(i)">{{ t }}</v-chip>
        </div>
        <v-text-field v-model="tagInput" label="Add tag..." variant="outlined" density="compact" hide-details
          @keyup.enter="addTag" append-inner-icon="plus" @click:append-inner="addTag" />
      </div>

      <template #footer>
        <v-btn v-if="addStep===2" variant="text" class="text-none" @click="addStep=1">Back</v-btn>
        <v-btn v-else variant="text" class="text-none" @click="addDrawer=false">Cancel</v-btn>
        <v-btn v-if="addStep===1" color="primary" variant="elevated" class="text-none" :disabled="!newContact.email||!newContact.firstName" @click="addStep=2">Next</v-btn>
        <v-btn v-else color="primary" variant="elevated" class="text-none" prepend-icon="check" @click="saveContact">Save Contact</v-btn>
      </template>
    </MpFormDrawer>

    <!-- Import Wizard Dialog -->
    <v-dialog v-model="importDialog" max-width="680" rounded="xl" persistent>
      <v-card rounded="lg" color="surface">
        <v-stepper v-model="importStep" :items="['Upload File','Map Fields','Review & Import']" flat>
          <template v-slot:item.1>
            <div class="pa-6">
              <div class="text-subtitle-1 font-weight-bold mb-1">Upload your CSV file</div>
              <div class="text-body-2 text-medium-emphasis mb-5">Supported: CSV, XLSX. Max 25MB. First row should be column headers.</div>
              <v-card variant="outlined" rounded="lg" class="pa-8 text-center" style="border-style:dashed;cursor:pointer;">
                <v-icon size="48" color="primary" class="mb-3">cloud-upload</v-icon>
                <div class="text-body-1 font-weight-medium mb-1">Drag & drop file here</div>
                <div class="text-caption text-medium-emphasis mb-4">or click to browse</div>
                <v-btn variant="flat" color="primary" class="text-none" prepend-icon="folder-open">Browse File</v-btn>
              </v-card>
              <v-select v-model="importList" label="Import into list" :items="['Newsletter Subscribers','VIP Customer Circle','Win-Back Segment']" variant="outlined" density="comfortable" class="mt-4" />
            </div>
          </template>
          <template v-slot:item.2>
            <div class="pa-6">
              <div class="text-subtitle-1 font-weight-bold mb-1">Map CSV columns to contact fields</div>
              <div class="text-body-2 text-medium-emphasis mb-4">We auto-detected {{ fieldMappings.length }} columns. Adjust mappings if needed.</div>
              <v-table density="compact">
                <thead><tr><th>CSV Column</th><th>Sample Value</th><th>Maps To</th></tr></thead>
                <tbody>
                  <tr v-for="(m,i) in fieldMappings" :key="i">
                    <td class="py-2 text-body-2 font-weight-medium">{{ m.csvCol }}</td>
                    <td class="text-caption text-medium-emphasis">{{ m.sample }}</td>
                    <td>
                      <v-select v-model="m.field" :items="contactFields" variant="outlined" density="compact" hide-details style="min-width:180px;" />
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </template>
          <template v-slot:item.3>
            <div class="pa-6">
              <div class="text-subtitle-1 font-weight-bold mb-4">Review before importing</div>
              <v-row dense class="mb-4">
                <v-col cols="4"><v-card variant="tonal" color="primary" rounded="lg" class="pa-4 text-center"><div class="text-h4 font-weight-bold">1,284</div><div class="text-caption">Rows detected</div></v-card></v-col>
                <v-col cols="4"><v-card variant="tonal" color="success" rounded="lg" class="pa-4 text-center"><div class="text-h4 font-weight-bold">1,241</div><div class="text-caption">Valid contacts</div></v-card></v-col>
                <v-col cols="4"><v-card variant="tonal" color="warning" rounded="lg" class="pa-4 text-center"><div class="text-h4 font-weight-bold">43</div><div class="text-caption">Skipped (invalid)</div></v-card></v-col>
              </v-row>
              <v-alert type="info" variant="tonal" density="compact" rounded="xl" class="text-body-2 mb-3">
                <strong>Duplicates:</strong> 23 contacts with matching emails will be <strong>merged</strong> (fields updated, not replaced).
              </v-alert>
              <v-alert type="success" variant="tonal" density="compact" rounded="xl" class="text-body-2">
                Importing into: <strong>{{ importList }}</strong>
              </v-alert>
            </div>
          </template>

          <template v-slot:actions>
            <div class="pa-4 border-t d-flex justify-space-between w-100">
              <v-btn variant="text" class="text-none" @click="importStep > 1 ? importStep-- : importDialog=false">
                {{ importStep === 1 ? 'Cancel' : 'Back' }}
              </v-btn>
              <v-btn v-if="importStep < 3" color="primary" variant="elevated" class="text-none" @click="importStep++">Continue</v-btn>
              <v-btn v-else color="success" variant="elevated" class="text-none" prepend-icon="upload" @click="importDialog=false;saveSnack=true">Import 1,241 Contacts</v-btn>
            </div>
          </template>
        </v-stepper>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="saveSnack" :timeout="2500" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> Contact saved successfully</div>
    </v-snackbar>
  </div>
</template>

<style scoped>
:deep(.v-data-table thead tr) {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.15);
}

.contacts-table :deep(tbody tr) {
  cursor: pointer;
}

.contacts-table :deep(tbody tr:hover) {
  background: color-mix(in oklch, var(--accent) 4%, transparent);
}

.contact-link {
  appearance: none;
  border: 0;
  background: transparent;
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  padding: 0;
  text-align: left;
}

.contact-link:hover,
.contact-link:focus-visible {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
  text-underline-offset: 3px;
}

.contact-link:focus-visible {
  outline: none;
  border-radius: 4px;
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.16);
}

.contact-row-hint {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-top: 2px;
  color: rgb(var(--v-theme-primary));
  font-size: 11px;
  font-weight: 600;
  opacity: 0;
  transition: opacity 120ms ease;
}

.contacts-table :deep(tbody tr:hover) .contact-row-hint,
.contacts-table :deep(tbody tr:focus-within) .contact-row-hint {
  opacity: 1;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-primary-container));
  color: rgb(var(--v-theme-on-primary-container));
  font-weight: 700;
  font-size: 14px;
}
</style>
