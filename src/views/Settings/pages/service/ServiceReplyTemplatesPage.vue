<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpRichTextArea from '@/components/MpRichTextArea.vue'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { useToast } from '@/composables/useToast'
import { useServiceSettingsStore } from '@/stores/useServiceSettings'
import { isDuplicateName, TEMPLATE_TAG_GROUPS, type ReplyTemplate, type ReplyTemplateKind } from '@/service/model'

// Reply templates and notification emails. UAT lists them together; here they
// are two tabs, because agents write replies but the desk sends notifications —
// those can be edited, never created, duplicated or deleted.

const route = useRoute()
const router = useRouter()
const toast = useToast()
const settings = useServiceSettingsStore()

// ── Tab (kept in ?tab= so a link can land on Notifications) ─────────────────
const activeTab = computed<ReplyTemplateKind, string>({
  get() {
    const raw = Array.isArray(route.query.tab) ? route.query.tab[0] : route.query.tab
    return raw === 'notification' ? 'notification' : 'reply'
  },
  set(tab) {
    void router.replace({ query: { ...route.query, tab } })
  },
})
const tabs = computed(() => [
  { label: 'Reply templates', key: 'reply', count: settings.replyTemplates.filter(t => t.kind === 'reply').length },
  { label: 'Notifications', key: 'notification', count: settings.replyTemplates.filter(t => t.kind === 'notification').length },
])
const isReplyTab = computed(() => activeTab.value === 'reply')

// ── Rows ─────────────────────────────────────────────────────────────────────
/** One readable line: paragraph and line breaks become spaces, tags stay as {{…}}. */
function plainText(html: string): string {
  const spaced = html.replace(/<br\s*\/?>/gi, ' ').replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
  const text = new DOMParser().parseFromString(spaced, 'text/html').body.textContent ?? ''
  return text.replace(/\s+/g, ' ').trim()
}

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const availableIn = (t: ReplyTemplate) =>
  t.kind === 'notification' ? 'Every inbox' : t.inboxId ? settings.inboxName(t.inboxId) : 'All inboxes'

const rows = computed(() =>
  settings.replyTemplates
    .filter(t => t.kind === activeTab.value)
    .map(t => ({
      id: t.id,
      name: t.name,
      inboxId: t.inboxId,
      availableIn: availableIn(t),
      preview: plainText(t.body),
      updatedAt: t.updatedAt,
    })),
)

// ── Search + inbox quick filter (reply tab only) ────────────────────────────
const search = ref('')
const inboxFilter = ref('all')
const inboxQuickFilter = computed(() => ({
  key: 'inbox',
  label: 'Inbox',
  multiple: false,
  options: [
    { label: 'All inboxes', value: 'all' },
    ...settings.inboxes.map(i => ({ label: i.name, value: i.id })),
  ],
}))
const inboxFilterModel = computed({
  get: () => [inboxFilter.value],
  set: (v: string[]) => { inboxFilter.value = v[0] ?? 'all' },
})
const inboxFilterActive = computed(() => isReplyTab.value && inboxFilter.value !== 'all')
const activeFilters = computed(() =>
  inboxFilterActive.value ? [{ key: 'inbox', label: `Inbox: ${settings.inboxName(inboxFilter.value)}` }] : [],
)

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return rows.value.filter(row => {
    // An inbox shows what its agents can insert: its own templates plus the shared ones.
    if (inboxFilterActive.value && row.inboxId !== null && row.inboxId !== inboxFilter.value) return false
    return !q || row.name.toLowerCase().includes(q) || row.preview.toLowerCase().includes(q)
  })
})

function clearSearchAndFilters() {
  search.value = ''
  inboxFilter.value = 'all'
}

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Available in', key: 'availableIn', hideBelow: 'md' as const },
  { title: 'Preview', key: 'preview', sortable: false, hideBelow: 'lg' as const, cellProps: { class: 'tpl-preview-cell' } },
  { title: 'Updated', key: 'updatedAt', hideBelow: 'sm' as const },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const, headerProps: { class: 'mp-th-sr' } },
]
const hiddenColumns = ref<string[]>([])
const { visibleHeaders } = useResponsiveTableHeaders(headers, hiddenColumns)

// ── Create / edit drawer ────────────────────────────────────────────────────
// Seeded notifications have no event field, so their drawer subtitle is written here.
const NOTIFICATION_EVENTS: Record<string, string> = {
  'tpl-agent-assigned': 'Sent to an agent when a ticket is assigned to them.',
  'tpl-agent-customer-replied': 'Sent to the assigned agent when the customer replies.',
  'tpl-agent-ticket-closed': 'Sent to the assigned agent when a ticket is closed.',
  'tpl-cc-agent-replied': 'Sent to people on CC when an agent replies.',
  'tpl-cc-ticket-closed': 'Sent to people on CC when a ticket is closed.',
}

interface TemplateForm {
  name: string
  inboxId: string | null
  body: string
  attachments: string[]
}
const blankForm = (): TemplateForm => ({ name: '', inboxId: null, body: '', attachments: [] })

const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const formKind = ref<ReplyTemplateKind>('reply')
const form = ref<TemplateForm>(blankForm())
const pristine = ref('')

const isDirty = computed(() => JSON.stringify(form.value) !== pristine.value)
const isNotification = computed(() => formKind.value === 'notification')
const drawerTitle = computed(() => (editingId.value ? 'Edit template' : 'New template'))
const drawerSubtitle = computed(() =>
  isNotification.value
    ? NOTIFICATION_EVENTS[editingId.value ?? ''] ?? 'Sent automatically when this ticket event happens.'
    : 'Agents insert it from the reply composer.',
)

const inboxItems = computed(() => [
  { title: 'All inboxes', value: null },
  ...settings.inboxes.map(i => ({ title: i.name, value: i.id })),
])

const nameDuplicate = computed(() =>
  isDuplicateName(settings.replyTemplates.filter(t => t.kind === formKind.value), form.value.name, editingId.value ?? undefined),
)
const nameError = computed(() => (nameDuplicate.value ? 'A template with this name already exists.' : ''))
// The editor holds HTML, so an emptied message is still `<p></p>`.
const bodyEmpty = computed(() => plainText(form.value.body) === '')
const canSave = computed(() => !!form.value.name.trim() && !nameDuplicate.value && !bodyEmpty.value)

function openDrawer(next: TemplateForm, id: string | null, kind: ReplyTemplateKind) {
  editingId.value = id
  formKind.value = kind
  form.value = next
  pristine.value = JSON.stringify(next)
  drawerOpen.value = true
}

function openCreate() {
  openDrawer(blankForm(), null, 'reply')
}

function openEdit(id: string) {
  const t = settings.findTemplate(id)
  if (!t) return
  openDrawer({ name: t.name, inboxId: t.inboxId, body: t.body, attachments: [...t.attachments] }, t.id, t.kind)
}

let attachSeq = 1
function mockAttach() {
  let file = `attachment-${attachSeq++}.pdf`
  while (form.value.attachments.includes(file)) file = `attachment-${attachSeq++}.pdf`
  form.value.attachments.push(file)
}

function save() {
  if (!canSave.value) return
  const name = form.value.name.trim()
  const fields = {
    name,
    body: form.value.body,
    attachments: [...form.value.attachments],
    inboxId: isNotification.value ? null : form.value.inboxId,
  }
  if (editingId.value) {
    settings.updateTemplate(editingId.value, fields)
    toast.success(`“${name}” saved`)
  } else {
    settings.createTemplate({ ...fields, kind: 'reply' })
    toast.success(`“${name}” created`)
  }
  drawerOpen.value = false
}

// Guarded: Esc, the close button and the scrim land here instead of closing outright.
const confirmDiscard = ref(false)
function requestClose() {
  if (isDirty.value) confirmDiscard.value = true
  else drawerOpen.value = false
}

// ── Duplicate (reply templates only) ────────────────────────────────────────
function copyName(name: string): string {
  const replies = settings.replyTemplates.filter(t => t.kind === 'reply')
  let candidate = `${name} (copy)`
  let n = 2
  while (isDuplicateName(replies, candidate)) candidate = `${name} (copy ${n++})`
  return candidate
}

function duplicate(id: string) {
  const t = settings.findTemplate(id)
  if (!t || t.kind !== 'reply') return
  const name = copyName(t.name)
  settings.createTemplate({ name, kind: 'reply', inboxId: t.inboxId, body: t.body, attachments: [...t.attachments] })
  toast.success(`“${name}” created`)
}

// ── Delete (reply templates only) ───────────────────────────────────────────
const deleteTarget = ref<ReplyTemplate | null>(null)
const confirmDelete = computed({
  get: () => deleteTarget.value !== null,
  set: open => { if (!open) deleteTarget.value = null },
})

// The store switches off any acknowledgement that sends this template.
const deleteConsequences = computed(() => {
  const id = deleteTarget.value?.id
  if (!id) return []
  return settings.inboxes
    .filter(inbox => inbox.acknowledgement.enabled && inbox.acknowledgement.templateId === id)
    .map(inbox => `${inbox.name} stops sending its acknowledgement`)
})

function performDelete() {
  const t = deleteTarget.value
  if (!t) return
  settings.deleteTemplate(t.id)
  toast.success(`“${t.name}” deleted`)
  deleteTarget.value = null
}
</script>

<template>
  <div class="settings-page d-flex flex-column gap-4">
    <MpPageHeader
      :level="2"
      density="compact"
      title="Reply Templates"
      subtitle="Saved replies agents insert from the composer, and the emails the desk sends on ticket events."
    >
      <template v-if="isReplyTab" #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">
          New template
        </v-btn>
      </template>
    </MpPageHeader>

    <MpFilterTabs v-model="activeTab":tabs="tabs" aria-label="Template type" controls-id="reply-templates-table" />

    <v-card id="reply-templates-table" variant="flat" border rounded="lg" class="d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        v-model:hidden-columns="hiddenColumns"
        v-model:quick-filter-value="inboxFilterModel"
        :quick-filter="isReplyTab ? inboxQuickFilter : undefined"
        :active-filters="activeFilters"
        :search-placeholder="isReplyTab ? 'Search reply templates' : 'Search notifications'"
        :headers="headers"
        :total-count="filteredRows.length"
        @remove-filter="inboxFilter = 'all'"
        @clear-filters="inboxFilter = 'all'"
      />

      <v-data-table
        :key="activeTab"
        :headers="visibleHeaders"
        :items="filteredRows"
        item-value="id"
        density="comfortable"
        :items-per-page="10"
        hover
        class="tpl-table"
        :aria-label="isReplyTab ? 'Reply templates' : 'Notification emails'"
      >
        <template #item.name="{ item }">
          <button type="button" class="mp-link text-start" @click="openEdit(item.id)">{{ item.name }}</button>
        </template>

        <template #item.availableIn="{ item }">
          <span class="text-no-wrap">{{ item.availableIn }}</span>
        </template>

        <template #item.preview="{ item }">
          <span class="d-block text-truncate text-medium-emphasis" :title="item.preview">{{ item.preview }}</span>
        </template>

        <template #item.updatedAt="{ item }">
          <span class="text-no-wrap">{{ shortDate(item.updatedAt) }}</span>
        </template>

        <template #item.actions="{ item }">
          <div @click.stop>
            <MpRowActionsMenu ariaLabel="Template actions" :itemLabel="item.name">
              <MpMenuItem title="Edit" icon="pencil" @click="openEdit(item.id)" />
              <template v-if="isReplyTab">
                <MpMenuItem title="Duplicate" icon="copy" @click="duplicate(item.id)" />
                <v-divider class="my-1" />
                <MpMenuItem
                  title="Delete"
                  icon="trash-2"
                  danger
                  @click="deleteTarget = settings.findTemplate(item.id) ?? null"
                />
              </template>
            </MpRowActionsMenu>
          </div>
        </template>

        <template #no-data>
          <MpEmptyState
            v-if="search.trim() || inboxFilterActive"
            icon="search"
            :heading-level="3"
            title="No templates match"
            :description="search.trim() ? 'Try a different name or a word from the message.' : 'No templates are available in this inbox yet.'"
            :action-label="inboxFilterActive ? 'Clear filters' : 'Clear search'"
            @action="clearSearchAndFilters"
          />
          <MpEmptyState
            v-else-if="isReplyTab"
            icon="message-square-text"
            :heading-level="3"
            title="No reply templates yet"
            description="Save the answers your team types most, so agents can insert them in one click."
            action-label="New template"
            action-icon="plus"
            @action="openCreate"
          />
          <MpEmptyState
            v-else
            icon="bell"
            :heading-level="3"
            title="No notification emails"
            description="The emails the desk sends on ticket events appear here."
          />
        </template>
      </v-data-table>
    </v-card>

    <MpFormDrawer
      v-model="drawerOpen"
      :title="drawerTitle"
      :subtitle="drawerSubtitle"
      size="lg"
      guarded
      @close="requestClose"
    >
      <MpFormGrid>
        <v-text-field
          v-model="form.name"
          label="Name *"
          placeholder="e.g. Refund issued"
          :error-messages="nameError"
        />
        <v-select
          v-if="!isNotification"
          v-model="form.inboxId"
          label="Available in"
          :items="inboxItems"
        />
        <MpRichTextArea
          v-model="form.body"
          label="Message"
          required
          :rows="8"
          :tag-groups="TEMPLATE_TAG_GROUPS"
          hint="Insert tags to personalise it — they fill in from the ticket and contact."
        />
        <MpFormField label="Attachments">
          <div class="d-flex flex-column align-start ga-2">
            <v-btn variant="outlined" prepend-icon="paperclip" class="text-none" @click="mockAttach">Attach file</v-btn>
            <div v-if="form.attachments.length" class="d-flex flex-wrap ga-2">
              <v-chip
                v-for="(file, i) in form.attachments"
                :key="file"
                size="small"
                closable
                prepend-icon="paperclip"
                :close-label="`Remove ${file}`"
                @click:close="form.attachments.splice(i, 1)"
              >
                {{ file }}
              </v-chip>
            </div>
          </div>
        </MpFormField>
      </MpFormGrid>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="requestClose">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="save">
          {{ editingId ? 'Save' : 'Create template' }}
        </v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDiscard"
      title="Discard changes?"
      message="This template has unsaved changes. Closing now will discard them."
      confirm-label="Discard"
      danger
      @confirm="drawerOpen = false"
    />

    <MpConfirmDialog
      v-model="confirmDelete"
      danger
      :title="`Delete ${deleteTarget?.name ?? 'template'}?`"
      message="Agents can no longer insert it. Replies already sent with it aren't affected."
      :consequences="deleteConsequences"
      confirm-label="Delete template"
      @confirm="performDelete"
    />
  </div>
</template>

<style scoped>
/* The preview column takes the free width and truncates, instead of pushing the table wide. */
.tpl-table :deep(td.tpl-preview-cell) {
  max-width: 0;
  width: 100%;
}
</style>
