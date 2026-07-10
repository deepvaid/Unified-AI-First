<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import {
  useMerchandisingStore,
  type MerchCondition,
  type MerchConditionAction,
  type SearchRule,
} from '@/stores/useMerchandising'

const store = useMerchandisingStore()
const search = ref('')

const headers = [
  { title: 'Status', key: 'status', sortable: false, width: 140 },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Search terms', key: 'terms', sortable: false },
  { title: 'Updated', key: 'updatedAt', sortable: true, align: 'end' as const, width: 160 },
  { title: '', key: 'actions', sortable: false, width: 64 },
]

const actionOptions: Array<{ title: string; value: MerchConditionAction }> = [
  { title: 'Include', value: 'include' },
  { title: 'Exclude', value: 'exclude' },
  { title: 'Promote', value: 'promote' },
]

const filteredRules = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return store.searchRuleList
  return store.searchRuleList.filter(
    (rule) =>
      rule.name.toLowerCase().includes(term) ||
      rule.terms.some((t) => t.toLowerCase().includes(term)),
  )
})

// ── Create / edit drawer ─────────────────────────────────────────
const drawer = ref(false)
const editing = ref(false)
const editingId = ref('')
const form = ref<{ name: string; terms: string[]; conditions: MerchCondition[] }>({
  name: '',
  terms: [],
  conditions: [],
})

const formValid = computed(() => Boolean(form.value.name.trim()) && form.value.terms.length > 0)

function openCreate() {
  form.value = { name: '', terms: [], conditions: [] }
  editing.value = false
  editingId.value = ''
  drawer.value = true
}

function openEdit(rule: SearchRule) {
  form.value = {
    name: rule.name,
    terms: [...rule.terms],
    conditions: rule.conditions.map((c) => ({ ...c, values: [...c.values] })),
  }
  editing.value = true
  editingId.value = rule.id
  drawer.value = true
}

function addCondition() {
  form.value.conditions.push({
    id: `src${Date.now()}-${form.value.conditions.length}`,
    action: 'include',
    field: '',
    values: [],
  })
}

function removeCondition(index: number) {
  form.value.conditions.splice(index, 1)
}

function saveRule() {
  if (!formValid.value) return
  const payload = {
    name: form.value.name.trim(),
    terms: form.value.terms,
    conditions: form.value.conditions,
  }
  if (editing.value) {
    store.saveSearchRule(editingId.value, payload)
  } else {
    store.createSearchRule(payload)
  }
  drawer.value = false
}

// ── Delete flow ──────────────────────────────────────────────────
const deleteDialog = ref(false)
const rulePendingDelete = ref<SearchRule | null>(null)

function askDelete(rule: SearchRule) {
  rulePendingDelete.value = rule
  deleteDialog.value = true
}

function confirmDelete() {
  if (rulePendingDelete.value) store.deleteSearchRule(rulePendingDelete.value.id)
  rulePendingDelete.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Merchandising rules"
      :subtitle="`Boost, bury or exclude products for search terms on ${store.activeStore.domain}`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="plus" @click="openCreate">
          New rule
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
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="15"
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
              @update:model-value="store.toggleSearchRuleStatus(item.id)"
            />
            <span
              class="text-caption font-weight-medium"
              :class="item.status === 'active' ? 'text-success' : 'text-medium-emphasis'"
            >
              {{ item.status === 'active' ? 'Enabled' : 'Disabled' }}
            </span>
          </div>
        </template>

        <template #item.name="{ item }">
          <a class="text-body-2 font-weight-bold text-primary cursor-pointer" @click="openEdit(item)">
            {{ item.name }}
          </a>
        </template>

        <template #item.terms="{ item }">
          <div class="d-flex flex-wrap gap-1">
            <v-chip
              v-for="term in item.terms"
              :key="term"
              size="x-small"
              variant="tonal"
              color="default"
              class="font-weight-medium"
            >
              {{ term }}
            </v-chip>
          </div>
        </template>

        <template #item.updatedAt="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ item.updatedAt }}</span>
        </template>

        <template #item.actions="{ item }">
          <MpRowActionsMenu :ariaLabel="`Actions for ${item.name}`">
            <v-list-item title="Edit" prepend-icon="pencil" @click="openEdit(item)" />
            <v-divider class="my-1" />
            <v-list-item title="Delete" prepend-icon="trash-2" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>

        <template #no-data>
          <MpEmptyState
            icon="sliders-horizontal"
            :title="search ? 'No rules match your search' : 'No merchandising rules yet'"
            :description="search ? 'Try a different keyword.' : 'Create a rule to boost, bury or exclude products when shoppers search specific terms.'"
            :action-label="!search ? 'New rule' : undefined"
            action-icon="plus"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpConfirmDialog
      v-model="deleteDialog"
      title="Delete rule?"
      :message="rulePendingDelete ? `“${rulePendingDelete.name}” will be removed and will stop affecting search results.` : ''"
      confirm-label="Delete rule"
      danger
      @confirm="confirmDelete"
    />

    <MpFormDrawer
      v-model="drawer"
      :title="editing ? 'Edit rule' : 'New rule'"
      :subtitle="store.activeStore.domain"
      :width="560"
    >
      <div class="d-flex flex-column gap-4">
        <v-text-field
          v-model="form.name"
          label="Rule name"
          placeholder="e.g. Boost denim on jeans searches"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
          :rules="[(v: string) => Boolean(v?.trim()) || 'Rule name is required']"
        />
        <v-combobox
          v-model="form.terms"
          label="Search terms"
          hint="The rule applies when a shopper searches any of these terms — press Enter to add"
          persistent-hint
          variant="outlined"
          density="comfortable"
          multiple
          chips
          closable-chips
        />

        <div>
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-subtitle-2 font-weight-medium">Conditions</span>
            <v-btn variant="text" size="small" class="text-none" prepend-icon="plus" @click="addCondition">
              Add condition
            </v-btn>
          </div>
          <p v-if="form.conditions.length === 0" class="text-body-2 text-medium-emphasis mb-0">
            No conditions yet — add one to target products by field.
          </p>
          <div v-else class="d-flex flex-column gap-3">
            <v-card
              v-for="(condition, index) in form.conditions"
              :key="condition.id"
              flat
              border
              rounded="lg"
              class="pa-3"
            >
              <div class="d-flex flex-column gap-3">
                <div class="d-flex gap-3">
                  <v-select
                    v-model="condition.action"
                    :items="actionOptions"
                    label="Action"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    class="flex-grow-1"
                  />
                  <v-text-field
                    v-model="condition.field"
                    label="Field"
                    placeholder="e.g. Brand"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    class="flex-grow-1"
                  />
                  <v-btn
                    icon="trash-2"
                    variant="text"
                    size="small"
                    color="medium-emphasis"
                    :aria-label="`Remove condition ${index + 1}`"
                    @click="removeCondition(index)"
                  />
                </div>
                <v-combobox
                  v-model="condition.values"
                  label="Values"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  multiple
                  chips
                  closable-chips
                />
              </div>
            </v-card>
          </div>
        </div>
      </div>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!formValid" @click="saveRule">
          {{ editing ? 'Save rule' : 'Create rule' }}
        </v-btn>
      </template>
    </MpFormDrawer>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
