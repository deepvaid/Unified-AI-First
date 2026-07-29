<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useMerchandisingStore, type FieldTransformation } from '@/stores/useMerchandising'

const store = useMerchandisingStore()
const search = ref('')

const headers = [
  { title: 'Status', key: 'status', sortable: false, width: 140 },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Input field', key: 'inputField', sortable: false, width: 180 },
  { title: 'Output field', key: 'outputField', sortable: false, width: 200 },
  { title: 'Rule type', key: 'ruleType', sortable: false, width: 200 },
  { title: 'Translations', key: 'translations', sortable: false, width: 180 },
  { title: '', key: 'actions', sortable: false, width: 64 },
]

const ruleTypeLabel: Record<FieldTransformation['ruleType'], string> = {
  field_manipulation: 'Field Manipulation',
  value_transformation: 'Value Transformation',
}

const ruleTypeOptions = [
  { title: 'Field Manipulation', value: 'field_manipulation' },
  { title: 'Value Transformation', value: 'value_transformation' },
]

const snackbar = ref({ visible: false, message: '' })
function showToast(message: string) {
  snackbar.value = { visible: true, message }
}

function onToggle(item: FieldTransformation) {
  store.toggleFieldStatus(item.id)
}

const filteredRules = computed(() => store.fieldList)

function duplicate(item: FieldTransformation) {
  const copy = store.duplicateField(item.id)
  if (copy) showToast(`Rule duplicated as “${copy.name}”`)
}

/* ── Edit drawer ───────────────────────────────────────────────── */
const editDrawer = ref(false)
const editTarget = ref<FieldTransformation | null>(null)
const editDraft = ref({
  name: '',
  inputField: '',
  outputField: '',
  ruleType: 'field_manipulation' as FieldTransformation['ruleType'],
  translations: [] as string[],
})
const editTranslationInput = ref('')

function openEdit(item: FieldTransformation) {
  editTarget.value = item
  editDraft.value = {
    name: item.name,
    inputField: item.inputField,
    outputField: item.outputField ?? '',
    ruleType: item.ruleType,
    translations: [...item.translations],
  }
  editTranslationInput.value = ''
  editDrawer.value = true
}

function addEditTranslation() {
  const trimmed = editTranslationInput.value.trim().toUpperCase()
  if (!trimmed || editDraft.value.translations.includes(trimmed)) {
    editTranslationInput.value = ''
    return
  }
  editDraft.value.translations.push(trimmed)
  editTranslationInput.value = ''
}

function removeEditTranslation(lang: string) {
  editDraft.value.translations = editDraft.value.translations.filter((l) => l !== lang)
}

function submitEdit() {
  if (!editTarget.value) return
  const name = editDraft.value.name.trim()
  const inputField = editDraft.value.inputField.trim()
  if (!name || !inputField) return
  store.saveField(editTarget.value.id, {
    name,
    inputField,
    outputField: editDraft.value.outputField.trim() || null,
    ruleType: editDraft.value.ruleType,
    translations: editDraft.value.translations,
  })
  editDrawer.value = false
  showToast(`Rule “${name}” updated`)
}

/* ── Delete confirm ────────────────────────────────────────────── */
const confirmDeleteOpen = ref(false)
const pendingDelete = ref<FieldTransformation | null>(null)

function askDelete(item: FieldTransformation) {
  pendingDelete.value = item
  confirmDeleteOpen.value = true
}

function doDelete() {
  if (pendingDelete.value) {
    store.deleteField(pendingDelete.value.id)
    showToast(`Rule “${pendingDelete.value.name}” deleted`)
  }
  pendingDelete.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Field Transformations"
      :subtitle="`Rewrite product attributes before indexing for ${store.activeStore.domain}`"
    >
      <template #actions>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          prepend-icon="plus"
          @click="showToast('Create new rule — coming soon')"
        >
          Create new rule
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card flat border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Rules"
        search-placeholder="Search rules…"
        :total-count="filteredRules.length"
      />

      <v-data-table
        :headers="headers"
        :items="filteredRules"
        :search="search"
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="20"
        fixed-header
        class="flex-grow-1"
      >
        <template #item.status="{ item }">
          <div class="d-flex align-center gap-2">
            <v-switch
              :model-value="item.status === 'active'"
              color="success"
              density="compact"
              hide-details
              :aria-label="`Toggle ${item.name}`"
              @update:model-value="onToggle(item)"
            />
            <span
              class="text-caption font-weight-medium"
              :class="item.status === 'active' ? 'text-success' : 'text-medium-emphasis'"
            >
              {{ item.status === 'active' ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </template>

        <template #item.name="{ item }">
          <span class="font-weight-medium text-body-2">{{ item.name }}</span>
        </template>

        <template #item.inputField="{ item }">
          <span class="text-body-2">{{ item.inputField }}</span>
        </template>

        <template #item.outputField="{ item }">
          <span v-if="item.outputField" class="text-body-2">{{ item.outputField }}</span>
          <span v-else class="text-body-2 text-medium-emphasis">—</span>
        </template>

        <template #item.ruleType="{ item }">
          <v-chip size="x-small" variant="tonal" color="primary" class="font-weight-medium">
            {{ ruleTypeLabel[item.ruleType] }}
          </v-chip>
        </template>

        <template #item.translations="{ item }">
          <div class="d-flex flex-wrap gap-1">
            <v-chip
              v-for="lang in item.translations"
              :key="lang"
              size="x-small"
              variant="tonal"
              color="info"
              class="font-weight-bold"
            >
              {{ lang }}
            </v-chip>
          </div>
        </template>

        <template #item.actions="{ item }">
          <v-menu>
            <template #activator="{ props: activator }">
              <v-btn
                v-bind="activator"
                icon="more-vertical"
                variant="text"
                size="x-small"
                class="text-medium-emphasis"
                aria-label="Row actions"
              />
            </template>
            <v-list density="compact" min-width="180">
              <v-list-item prepend-icon="pencil" title="Edit rule" @click="openEdit(item)" />
              <v-list-item prepend-icon="copy" title="Duplicate" @click="duplicate(item)" />
              <v-list-item
                :prepend-icon="item.status === 'active' ? 'circle-pause' : 'circle-play'"
                :title="item.status === 'active' ? 'Disable' : 'Enable'"
                @click="onToggle(item)"
              />
              <v-divider />
              <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="askDelete(item)" />
            </v-list>
          </v-menu>
        </template>

        <template #no-data>
          <MpEmptyState
            icon="wand-sparkles"
            title="No field transformation rules yet"
            description="Add a rule to normalize, rename, or translate product fields before they enter the search index."
            action-label="Create new rule"
            action-icon="plus"
            @action="showToast('Create new rule — coming soon')"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Edit rule drawer -->
    <MpFormDrawer v-model="editDrawer" title="Edit rule" subtitle="Update this field transformation rule">
      <v-text-field
        v-model="editDraft.name"
        label="Rule name"
        variant="outlined"
        density="comfortable"
        class="mb-3"
        autofocus
      />
      <v-text-field
        v-model="editDraft.inputField"
        label="Input field"
        variant="outlined"
        density="comfortable"
        class="mb-3"
      />
      <v-text-field
        v-model="editDraft.outputField"
        label="Output field"
        placeholder="Leave blank to transform in place"
        variant="outlined"
        density="comfortable"
        class="mb-3"
      />
      <v-select
        v-model="editDraft.ruleType"
        label="Rule type"
        :items="ruleTypeOptions"
        variant="outlined"
        density="comfortable"
        class="mb-3"
      />
      <label class="text-caption font-weight-medium text-medium-emphasis">Translations</label>
      <v-text-field
        v-model="editTranslationInput"
        placeholder="Type a language code, then press Enter"
        density="comfortable"
        variant="outlined"
        hide-details
        class="mt-2"
        @keydown.enter.prevent="addEditTranslation"
      />
      <div v-if="editDraft.translations.length > 0" class="d-flex flex-wrap gap-1 mt-2">
        <v-chip
          v-for="lang in editDraft.translations"
          :key="lang"
          size="small"
          variant="tonal"
          color="info"
          closable
          @click:close="removeEditTranslation(lang)"
        >
          {{ lang }}
        </v-chip>
      </div>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="editDrawer = false">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          :disabled="!editDraft.name.trim() || !editDraft.inputField.trim()"
          @click="submitEdit"
        >
          Save changes
        </v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDeleteOpen"
      title="Delete rule?"
      :message="`“${pendingDelete?.name}” will be permanently deleted. This cannot be undone.`"
      confirm-label="Delete"
      danger
      @confirm="doDelete"
    />

    <v-snackbar v-model="snackbar.visible" :timeout="2000" location="bottom">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>
