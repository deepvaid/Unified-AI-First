<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMarketingAssetsStore, type DynamicContentItem, type DynamicContentRule } from '@/stores/useMarketingAssets'
import { useContactsStore } from '@/stores/useContacts'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import { useToast } from '@/composables/useToast'

const store = useMarketingAssetsStore()
const contactsStore = useContactsStore()
const search = ref('')

const segmentOptions = computed(() => contactsStore.segments.map(s => ({ title: s.name, value: s.id })))

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: '# Segments', key: 'segmentCount', align: 'end' as const },
  { title: 'Created', key: 'createdAt', sortable: true },
  { title: 'Updated', key: 'updatedAt', sortable: true },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

const rows = computed(() => store.dynamicContents.map(d => ({ ...d, segmentCount: d.rules.length })))

// ── Create / edit drawer ─────────────────────────────────────────────────
const NAME_PATTERN = /^[a-z0-9_]*$/
const drawer = ref(false)
const editingId = ref<number | null>(null)
const name = ref('')
const originalContent = ref('')
const rules = ref<DynamicContentRule[]>([])
let ruleSeq = 0

const nameError = computed(() => {
  if (!name.value.trim()) return 'Name is required'
  if (!NAME_PATTERN.test(name.value)) return 'Use lowercase letters, numbers, and underscores only'
  return ''
})
const canSave = computed(() => !nameError.value && rules.value.every(r => r.segmentId !== null))

function blankRule(): DynamicContentRule {
  ruleSeq += 1
  return { id: ruleSeq, segmentId: null, segmentName: '', content: '' }
}

function openCreate() {
  editingId.value = null
  name.value = ''
  originalContent.value = ''
  rules.value = [blankRule()]
  drawer.value = true
}

function openEdit(item: DynamicContentItem) {
  editingId.value = item.id
  name.value = item.name
  originalContent.value = item.originalContent
  rules.value = item.rules.map(r => ({ ...r }))
  drawer.value = true
}

function addRule() {
  rules.value.push(blankRule())
}

function removeRule(id: number) {
  rules.value = rules.value.filter(r => r.id !== id)
}

function onSegmentChange(rule: DynamicContentRule) {
  rule.segmentName = segmentOptions.value.find(o => o.value === rule.segmentId)?.title ?? ''
}

function saveContent() {
  if (!canSave.value) return
  const payload = { name: name.value.trim(), originalContent: originalContent.value, rules: rules.value }
  if (editingId.value !== null) {
    store.updateDynamicContent(editingId.value, payload)
    notify('Dynamic content updated')
  } else {
    store.addDynamicContent(payload)
    notify('Dynamic content created')
  }
  drawer.value = false
}

// ── Row actions ───────────────────────────────────────────────────────────
function duplicateItem(item: DynamicContentItem) {
  store.duplicateDynamicContent(item.id)
  notify('Dynamic content duplicated')
}

const confirmDelete = ref(false)
const pendingDelete = ref<DynamicContentItem | null>(null)
function askDelete(item: DynamicContentItem) {
  pendingDelete.value = item
  confirmDelete.value = true
}
function doDelete() {
  if (pendingDelete.value) {
    store.deleteDynamicContent(pendingDelete.value.id)
    notify('Dynamic content deleted')
  }
  pendingDelete.value = null
}

// ── Toast ─────────────────────────────────────────────────────────────────
const toast = useToast()
function notify(text: string) { toast.success(text) }
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Dynamic Content"
      :subtitle="`${store.dynamicContents.length} content blocks`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">New Block</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Content Blocks"
        search-placeholder="Search blocks..."
        :total-count="rows.length"
      />

      <v-data-table :headers="headers" :items="rows" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.name="{ item }">
          <span class="text-body-2 font-weight-medium font-mono">{{ item.name }}</span>
        </template>
        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Dynamic content actions">
            <v-list-item prepend-icon="pencil" title="Edit" @click="openEdit(item)" />
            <v-list-item prepend-icon="copy" title="Duplicate" @click="duplicateItem(item)" />
            <v-divider class="my-1" style="opacity: 0.4" />
            <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>
        <template v-slot:no-data>
          <MpEmptyState
            icon="layers"
            :title="search ? 'No content blocks match your search' : 'No dynamic content yet'"
            :description="search ? 'Try a different search term.' : 'Create rules that personalize content by audience segment.'"
            :action-label="!search ? 'New Block' : undefined"
            action-icon="plus"
            class="py-10"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create / edit drawer -->
    <MpFormDrawer
      v-model="drawer"
      :title="editingId !== null ? 'Edit Dynamic Content' : 'New Dynamic Content'"
      subtitle="Show different content to different audience segments" size="lg"
    >
      <v-text-field
        v-model="name"
        label="Name"
        placeholder="e.g. vip_header_greeting"
        hint="Lowercase letters, numbers, and underscores only"
        persistent-hint
        :error-messages="name ? (nameError ? [nameError] : []) : []"
      />

      <v-textarea
        v-model="originalContent"
        label="Original content"
        rows="3"
        auto-grow
        placeholder="Default content shown to everyone else..."
        hint="Shown as a fallback when no rule below matches."
        persistent-hint
      />

      <v-divider />

      <MpFormSection title="Rules" />

      <div v-for="(rule, i) in rules" :key="rule.id" class="dc-rule pa-4">
        <div class="d-flex align-center justify-space-between mb-3">
          <span class="text-caption font-weight-bold text-uppercase text-medium-emphasis">Rule {{ i + 1 }}</span>
          <v-btn
            v-if="rules.length > 1"
            icon="trash-2"
            variant="text"
            size="x-small"
            color="error"
            aria-label="Remove rule"
            @click="removeRule(rule.id)"
          />
        </div>
        <MpFormGrid>
          <v-select
            v-model="rule.segmentId"
            :items="segmentOptions"
            label="Segment"
            @update:model-value="onSegmentChange(rule)"
          />
          <v-textarea
            v-model="rule.content"
            label="Content for this segment"
            rows="3"
            auto-grow
          />
        </MpFormGrid>
      </div>

      <v-btn variant="outlined" class="text-none" prepend-icon="plus" @click="addRule">Add new rule</v-btn>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="saveContent">
          {{ editingId !== null ? 'Save Changes' : 'Save' }}
        </v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDelete"
      title="Delete dynamic content?"
      :message="`“${pendingDelete?.name}” will be permanently deleted from any email content using it.`"
      confirm-label="Delete"
      danger
      @confirm="doDelete"
    />
  </div>
</template>

<style scoped>
.dc-rule {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
}
.font-mono { font-family: monospace; }
</style>
