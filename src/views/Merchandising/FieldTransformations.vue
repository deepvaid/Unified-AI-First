<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
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

const snackbar = ref({ visible: false, message: '' })
function showToast(message: string) {
  snackbar.value = { visible: true, message }
}

function onToggle(item: FieldTransformation) {
  store.toggleFieldStatus(item.id)
}

const filteredRules = computed(() => store.fieldList)
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
                color="medium-emphasis"
                aria-label="Row actions"
              />
            </template>
            <v-list density="compact" min-width="180">
              <v-list-item prepend-icon="pencil" title="Edit rule" @click="showToast('Edit — coming soon')" />
              <v-list-item prepend-icon="copy" title="Duplicate" @click="showToast('Duplicated')" />
              <v-list-item
                :prepend-icon="item.status === 'active' ? 'circle-pause' : 'circle-play'"
                :title="item.status === 'active' ? 'Disable' : 'Enable'"
                @click="onToggle(item)"
              />
              <v-divider />
              <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="showToast('Deleted')" />
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

    <v-snackbar v-model="snackbar.visible" :timeout="2000" location="bottom">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>
