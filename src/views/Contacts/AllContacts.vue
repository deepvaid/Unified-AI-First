<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useContactsStore, type Contact } from '@/stores/useContacts'
import { useCdpEntitiesStore } from '@/stores/useCdpEntities'
import { downloadCsv, type CsvColumn } from '@/utils/exportCsv'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const store = useContactsStore()
const cdp = useCdpEntitiesStore()
const toast = useToast()
const search = ref('')
const selected = ref<number[]>([])
const { loading } = useInitialLoad()

const listNames = computed(() => cdp.lists.map(l => l.name))

// CSV export column definitions (shared by header Export + bulk Export)
const contactCsvColumns: CsvColumn<Contact>[] = [
  { title: 'First Name', value: 'firstName' },
  { title: 'Last Name', value: 'lastName' },
  { title: 'Email', value: 'email' },
  { title: 'Phone', value: 'phone' },
  { title: 'Company', value: (r) => r.company ?? '' },
  { title: 'Location', value: 'location' },
  { title: 'Status', value: 'status' },
  { title: 'Score', value: 'score' },
  { title: 'Tags', value: (r) => r.tags.join('; ') },
  { title: 'Revenue', value: 'revenue' },
  { title: 'Orders', value: 'orders' },
  { title: 'Last Active', value: 'lastActive' },
  { title: 'Created', value: 'createdAt' },
]

// Quick-Add drawer
const addDrawer = ref(false)
const addStep = ref(1)
const newContact = ref({ firstName: '', lastName: '', email: '', phone: '', company: '', role: '', tags: [] as string[], list: 'Newsletter Subscribers', status: 'Subscribed' })
const tagInput = ref('')
function addTag() { if (tagInput.value.trim()) { newContact.value.tags.push(tagInput.value.trim()); tagInput.value = '' } }
function removeTag(i: number) { newContact.value.tags.splice(i, 1) }
function saveContact() {
  store.addContact({
    firstName: newContact.value.firstName,
    lastName: newContact.value.lastName,
    email: newContact.value.email,
    phone: newContact.value.phone,
    company: newContact.value.company,
    tags: [...newContact.value.tags],
    status: newContact.value.status,
  })
  addDrawer.value = false
  addStep.value = 1
  newContact.value = { firstName:'', lastName:'', email:'', phone:'', company:'', role:'', tags:[], list:'Newsletter Subscribers', status:'Subscribed' }
  toast.success('Contact added')
}

// Import drawer (2-step, legacy-parity)
const importDrawer = ref(false)
const importStep = ref(1)
const importMethod = ref<'file' | 'ftp' | 'automated'>('file')
const importDelimiter = ref<'Comma' | 'Tab' | 'Colon' | 'Semi-Colon'>('Comma')
const importList = ref<string | null>(null)
const importOptions = ref({ importNew: true, triggerJourney: false, updateExisting: true })
const importFieldOptions = ['Email', 'Phone', 'First Name', 'Last Name', 'Contact Tags', 'List Subscription', 'Custom: Source', 'Custom: Age Group', '— Skip —']
const importMappings = ref([
  { csvCol: 'email', field: 'Email' },
  { csvCol: 'first_name', field: 'First Name' },
  { csvCol: 'last_name', field: 'Last Name' },
  { csvCol: 'phone', field: 'Phone' },
  { csvCol: 'tags', field: 'Contact Tags' },
])
function startImport() {
  importDrawer.value = true
  importStep.value = 1
  importMethod.value = 'file'
  importDelimiter.value = 'Comma'
  importList.value = null
  importOptions.value = { importNew: true, triggerJourney: false, updateExisting: true }
}
function runImport() {
  importDrawer.value = false
  importStep.value = 1
  toast.success('Import started — contacts will appear once processing completes')
}

// Export the current filtered set to CSV (header action)
function exportContacts() {
  downloadCsv('contacts', filteredContacts.value, contactCsvColumns)
  toast.success('Contacts exported')
}

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
  { title: 'Company', key: 'company', hideBelow: 'lg' as const },
  { title: 'Tags', key: 'tags', sortable: false, hideBelow: 'lg' as const },
  { title: 'Status', key: 'status' },
  { title: 'Score', key: 'score', align: 'end' as const, hideBelow: 'md' as const },
  { title: 'Last Active', key: 'lastActive', align: 'end' as const, hideBelow: 'md' as const },
  { title: '', key: 'actions', align: 'end' as const, sortable: false, width: '48px' },
]

// Column visibility — manual hide menu + breakpoint-driven priority hiding
const hiddenColumns = ref<string[]>([])
const { visibleHeaders } = useResponsiveTableHeaders(headers, hiddenColumns)

const scoreColor = (s: number) => s >= 80 ? 'success' : s >= 50 ? 'warning' : 'error'
const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const formatDate = (d?: string) => d ? dateFmt.format(new Date(d)) : '—'

function selectAll() {
  selected.value = filteredContacts.value.map(c => c.id)
}

// Bulk export selected contacts
function exportSelected() {
  const rows = store.contacts.filter(c => selected.value.includes(c.id))
  downloadCsv('contacts-selected', rows, contactCsvColumns)
  toast.success('Contacts exported')
}

// Delete — single row and bulk (both via confirm dialog)
const deleteDialog = ref(false)
const pendingContact = ref<Contact | null>(null)
const bulkDelete = ref(false)

function askDeleteRow(contact: Contact) {
  pendingContact.value = contact
  bulkDelete.value = false
  deleteDialog.value = true
}
function askDeleteBulk() {
  pendingContact.value = null
  bulkDelete.value = true
  deleteDialog.value = true
}
const deleteMessage = computed(() =>
  bulkDelete.value
    ? `Delete ${selected.value.length} selected contact${selected.value.length === 1 ? '' : 's'}? This cannot be undone.`
    : `Delete ${pendingContact.value?.firstName ?? ''} ${pendingContact.value?.lastName ?? ''}? This cannot be undone.`,
)
function confirmDelete() {
  if (bulkDelete.value) {
    store.deleteContacts([...selected.value])
    selected.value = []
    toast.success('Contacts deleted')
  } else if (pendingContact.value) {
    store.deleteContact(pendingContact.value.id)
    toast.success('Contact deleted')
  }
  pendingContact.value = null
  bulkDelete.value = false
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
      eyebrow="Audiences · Contacts"
      title="Contacts"
      :subtitle="`${store.contacts.length.toLocaleString()} total contacts · ${store.contacts.filter(c => c.status === 'Subscribed').length.toLocaleString()} subscribed`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="upload" class="text-none" @click="startImport" color="surface">Import</v-btn>
        <v-btn variant="flat" prepend-icon="share" class="text-none" @click="exportContacts" color="surface">Export</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="addDrawer=true;addStep=1">Add Contact</v-btn>
      </template>
    </MpPageHeader>

    <!-- Single Card: Table with integrated toolbar, filters, bulk bar -->
    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden mp-enter">

      <!-- Toolbar: title, search, filter, filter chips, bulk bar -->
      <MpDataTableToolbar
        v-model:search="search"
        v-model:hidden-columns="hiddenColumns"
        title="All Contacts"
        :headers="headers"
        :active-filters="activeFilterEntries"
        :total-count="filteredContacts.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <MpFormGrid>
            <v-select
              v-for="(options, key) in filterOptions"
              :key="key"
              v-model="filters[key as keyof typeof filters]"
              :label="filterLabels[key]"
              :items="options"
              clearable
              placeholder="All"
              persistent-placeholder
            />
          </MpFormGrid>
        </template>
      </MpDataTableToolbar>

      <!-- Data Table -->
      <MpTableSkeleton v-if="loading" :rows="8" :columns="6" />

      <v-data-table
        v-else
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
            <v-avatar size="36" class="mr-3 border contact-avatar">
              <v-img :src="(item as any).avatarUrl" :alt="`${(item as any).firstName} ${(item as any).lastName}`" cover>
                <template #placeholder>
                  <div class="avatar-fallback">{{ (item as any).firstName?.[0] ?? '?' }}</div>
                </template>
                <template #error>
                  <div class="avatar-fallback">{{ (item as any).firstName?.[0] ?? '?' }}</div>
                </template>
              </v-img>
            </v-avatar>
            <div class="contact-identity">
              <button
                type="button"
                class="contact-link"
                @click.stop="openContact((item as any).id)"
              >
                {{ (item as any).firstName + ' ' + ((item as any).lastName ?? '') }}
              </button>
              <div class="contact-email">{{ (item as any).email }}</div>
            </div>
          </div>
        </template>

        <template v-slot:item.company="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ (item as any).company }}</span>
        </template>

        <template v-slot:item.tags="{ item }">
          <div class="d-flex gap-1 flex-wrap py-1">
            <v-chip v-for="tag in (item as any).tags ?? []" :key="tag" size="x-small" variant="tonal" color="secondary">{{ tag }}</v-chip>
          </div>
        </template>

        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="String(item.status ?? '')" type="contact" size="sm" variant="flat" />
        </template>

        <template v-slot:item.score="{ item }">
          <span class="contact-score text-no-wrap">
            <span class="contact-score__dot" :class="`contact-score__dot--${scoreColor(item.score)}`" />
            {{ item.score }}
          </span>
        </template>

        <template v-slot:item.lastActive="{ item }">
          <span class="text-body-2 text-medium-emphasis text-no-wrap">{{ formatDate((item as any).lastActive) }}</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <span @click.stop>
            <MpRowActionsMenu ariaLabel="Contact actions" :itemLabel="`${(item as Contact).firstName} ${(item as Contact).lastName ?? ''}`.trim()">
              <v-list-item prepend-icon="pencil" title="Edit" @click="openContact((item as Contact).id)" />
              <v-divider class="my-1" style="opacity: 0.4" />
              <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="askDeleteRow(item as Contact)" />
            </MpRowActionsMenu>
          </span>
        </template>
        <template #no-data>
          <MpEmptyState
            v-if="search || activeFilterEntries.length"
            emphasis="prominent"
            illustration="no-results"
            title="No matches for that search"
            description="Try adjusting your filters or spelling."
            class="py-10"
          />
          <MpEmptyState
            v-else
            emphasis="prominent"
            illustration="empty-contacts"
            title="No contacts yet"
            description="Import a list or connect a store to start building your audience."
            action-label="Add Contact"
            action-icon="plus"
            class="py-10"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpFloatingBulkBar
      :count="selected.length"
      :total="filteredContacts.length"
      @clear="selected = []"
      @select-all="selectAll"
    >
      <v-btn variant="flat" size="small" class="text-none" prepend-icon="share" rounded="lg" color="surface" @click="exportSelected">Export CSV</v-btn>
      <v-btn variant="flat" size="small" class="text-none" prepend-icon="trash-2" rounded="lg" color="error" @click="askDeleteBulk">Delete</v-btn>
    </MpFloatingBulkBar>

    <!-- Quick-Add Contact Drawer -->
    <MpFormDrawer v-model="addDrawer" title="Add Contact" :subtitle="`Step ${addStep} of 2`" size="sm">
      <!-- Step 1: Basic Info -->
      <template v-if="addStep===1">
        <div class="d-flex justify-center">
          <v-avatar color="primary" size="72" class="text-h4 font-weight-bold">
            <template v-if="newContact.firstName">{{ newContact.firstName.charAt(0).toUpperCase() }}</template>
            <v-icon v-else size="32">user</v-icon>
          </v-avatar>
        </div>
        <MpFormGrid :cols="2">
          <v-text-field v-model="newContact.firstName" label="First Name *" />
          <v-text-field v-model="newContact.lastName" label="Last Name" />
          <v-text-field v-model="newContact.email" label="Email Address *" type="email" prepend-inner-icon="mail" class="mp-form-grid__full" />
          <v-text-field v-model="newContact.phone" label="Phone Number" prepend-inner-icon="phone" class="mp-form-grid__full" />
          <v-text-field v-model="newContact.company" label="Company" prepend-inner-icon="building-2" class="mp-form-grid__full" />
        </MpFormGrid>
      </template>

      <!-- Step 2: List, Tags, Status -->
      <template v-else>
        <MpFormGrid>
          <v-select v-model="newContact.list" label="Subscribe to List" :items="listNames" prepend-inner-icon="playlist-check" />
          <v-select v-model="newContact.status" label="Status" :items="['Subscribed','Unsubscribed']" />
        </MpFormGrid>

        <MpFormSection title="Tags" />
        <MpFormGrid>
          <div v-if="newContact.tags.length" class="d-flex flex-wrap ga-2">
            <v-chip v-for="(t,i) in newContact.tags" :key="i" closable color="secondary" variant="tonal" @click:close="removeTag(i)">{{ t }}</v-chip>
          </div>
          <v-text-field
            v-model="tagInput"
            label="Add tag"
            append-inner-icon="plus"
            @keyup.enter="addTag"
            @click:append-inner="addTag"
          />
        </MpFormGrid>
      </template>

      <template #footer>
        <v-btn v-if="addStep===2" variant="text" class="text-none" @click="addStep=1">Back</v-btn>
        <v-btn v-else variant="text" class="text-none" @click="addDrawer=false">Cancel</v-btn>
        <v-btn v-if="addStep===1" color="primary" variant="flat" class="text-none" :disabled="!newContact.email||!newContact.firstName" @click="addStep=2">Next</v-btn>
        <v-btn v-else color="primary" variant="flat" class="text-none" prepend-icon="check" @click="saveContact">Save Contact</v-btn>
      </template>
    </MpFormDrawer>

    <!-- Import Contacts Drawer (2-step) -->
    <MpFormDrawer v-model="importDrawer" title="Import Contacts" :subtitle="`Step ${importStep} of 2`" size="lg">
      <!-- Step 1: Method, delimiter, list -->
      <MpFormGrid v-if="importStep === 1">
        <MpFormField label="Import Method">
          <template #default="{ labelId }">
            <v-radio-group v-model="importMethod" :aria-labelledby="labelId">
              <v-radio label="File Import" value="file" />
              <v-radio label="FTP Import" value="ftp" />
              <v-radio label="Automated Import" value="automated" />
            </v-radio-group>
          </template>
        </MpFormField>

        <div v-if="importMethod === 'file'" class="import-dropzone">
          <v-icon size="40" color="primary" class="mb-2">cloud-upload</v-icon>
          <div class="text-body-2 font-weight-medium mb-1">Drag & drop file here</div>
          <div class="text-caption text-medium-emphasis mb-3">or click to browse — accepts .csv, .txt, .zip</div>
          <v-btn variant="flat" color="primary" size="small" class="text-none" prepend-icon="folder-open">Browse File</v-btn>
        </div>
        <v-select
          v-else-if="importMethod === 'ftp'"
          label="FTP File"
          :items="['contacts_export.csv', 'weekly_sync.txt', 'crm_dump.zip']"
          placeholder="Select a file from the FTP directory"
        />
        <v-alert v-else type="info" variant="tonal" density="compact" rounded="lg" class="text-body-2">
          Automated imports run on a schedule from your configured source. New files are picked up automatically once the source is connected.
        </v-alert>

        <MpFormField label="Delimiter">
          <template #default="{ labelId }">
            <v-radio-group v-model="importDelimiter" inline :aria-labelledby="labelId">
              <v-radio label="Comma" value="Comma" />
              <v-radio label="Tab" value="Tab" />
              <v-radio label="Colon" value="Colon" />
              <v-radio label="Semi-Colon" value="Semi-Colon" />
            </v-radio-group>
          </template>
        </MpFormField>

        <v-select
          v-model="importList"
          label="Select List *"
          :items="listNames"
          prepend-inner-icon="playlist-check"
        />
      </MpFormGrid>

      <!-- Step 2: Options + mappings -->
      <template v-else>
        <MpFormGrid>
          <MpFormField label="Import Options">
            <div>
              <v-checkbox v-model="importOptions.importNew" label="Import new contacts" />
              <v-checkbox v-model="importOptions.triggerJourney" label="Trigger journey campaigns" />
              <v-checkbox v-model="importOptions.updateExisting" label="Update existing contacts" />
            </div>
          </MpFormField>
        </MpFormGrid>

        <MpFormSection title="Field Mapping" />
        <v-table density="compact">
          <thead><tr><th>CSV Column</th><th>Contact Field</th></tr></thead>
          <tbody>
            <tr v-for="(m, i) in importMappings" :key="i">
              <td class="py-2 text-body-2 font-weight-medium">{{ m.csvCol }}</td>
              <td>
                <!-- Table-cell editor: compact and detail-free on purpose, so a
                     hint or validation line can't grow the row. -->
                <v-select v-model="m.field" :items="importFieldOptions" :aria-label="`Contact field for ${m.csvCol}`" density="compact" hide-details style="min-width:200px;" />
              </td>
            </tr>
          </tbody>
        </v-table>

        <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="text-body-2">
          <strong>1,284</strong> rows detected · <strong>1,241</strong> valid · <strong>43</strong> skipped. Importing into <strong>{{ importList }}</strong>.
        </v-alert>
      </template>

      <template #footer>
        <v-btn v-if="importStep === 2" variant="text" class="text-none" @click="importStep = 1">Back</v-btn>
        <v-btn v-else variant="text" class="text-none" @click="importDrawer = false">Cancel</v-btn>
        <v-btn v-if="importStep === 1" color="primary" variant="flat" class="text-none" :disabled="!importList" @click="importStep = 2">Continue</v-btn>
        <v-btn v-else color="primary" variant="flat" class="text-none" prepend-icon="upload" @click="runImport">Import</v-btn>
      </template>
    </MpFormDrawer>

    <!-- Delete confirmation (row + bulk) -->
    <MpConfirmDialog
      v-model="deleteDialog"
      title="Delete contact?"
      :message="deleteMessage"
      confirm-label="Delete"
      danger
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.contacts-table :deep(thead th) {
  white-space: nowrap;
}

.contacts-table :deep(tbody tr) {
  cursor: pointer;
}

.import-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 28px;
  border: 1px dashed rgba(var(--v-border-color), 0.35);
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.015);
  cursor: pointer;
}

.contact-identity {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.contact-link {
  appearance: none;
  border: 0;
  background: transparent;
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 550;
  line-height: 1.3;
  padding: 0;
  text-align: left;
}

.contact-email {
  font-size: 12.5px;
  line-height: 1.3;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

/* At phone widths the identity cell is what forces the table to side-scroll: the
   email has no truncation, so its intrinsic width sets the column (measured 244px
   of a 311px-wide table). Capping the block and ellipsizing both lines keeps the
   name — the thing you scan for — fully legible. Wider viewports are untouched. */
@media (max-width: 599.98px) {
  /* The avatar is a nice-to-have identifier next to the name it duplicates; at this
     width the ~44px it costs is better spent on the name and status. */
  .contact-avatar {
    display: none;
  }

  .contact-identity {
    max-width: 132px;
    min-width: 0;
  }

  .contact-link,
  .contact-email {
    display: block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
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

.contact-score {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
}

.contact-score__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.contact-score__dot--success { background: rgb(var(--v-theme-success)); }
.contact-score__dot--warning { background: rgb(var(--v-theme-warning)); }
.contact-score__dot--error { background: rgb(var(--v-theme-error)); }

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
