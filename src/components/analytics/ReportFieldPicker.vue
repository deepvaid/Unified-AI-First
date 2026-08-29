<script setup lang="ts">
/**
 * Searchable multi-select drawer used by every Custom Report wizard for its
 * optional-fields / ISPs / performance-metrics pickers.
 *
 * GAP: there is no design-system grouped multi-select picker. This composes
 * MpFormDrawer as a feature-scoped stand-in — see docs/rebuild/GAPS.md §1 for the
 * proposed MpFieldPicker spec.
 */
import { computed, ref, watch } from 'vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

const props = withDefaults(defineProps<{
  title: string
  subtitle?: string
  /** Every selectable option. */
  items: string[]
  /** Noun used in the group headings, e.g. "fields" → "Selected fields (2)". */
  noun?: string
}>(), { noun: 'fields' })

const model = defineModel<boolean>({ default: false })
const selected = defineModel<string[]>('selected', { default: () => [] })

const search = ref('')

// A fresh open starts from a clean search, and edits stay local until Apply.
const draft = ref<string[]>([])
watch(model, open => {
  if (open) {
    search.value = ''
    draft.value = [...selected.value]
  }
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return props.items
  return props.items.filter(i => i.toLowerCase().includes(q))
})

const selectedItems = computed(() => filtered.value.filter(i => draft.value.includes(i)))
const unselectedItems = computed(() => filtered.value.filter(i => !draft.value.includes(i)))

const allSelected = computed(
  () => filtered.value.length > 0 && filtered.value.every(i => draft.value.includes(i)),
)
const someSelected = computed(
  () => filtered.value.some(i => draft.value.includes(i)) && !allSelected.value,
)

function toggleAll() {
  if (allSelected.value) {
    draft.value = draft.value.filter(i => !filtered.value.includes(i))
  } else {
    draft.value = [...new Set([...draft.value, ...filtered.value])]
  }
}

function toggle(item: string) {
  draft.value = draft.value.includes(item)
    ? draft.value.filter(i => i !== item)
    : [...draft.value, item]
}

function apply() {
  selected.value = [...draft.value]
  model.value = false
}
</script>

<template>
  <MpFormDrawer v-model="model" :title="title" :subtitle="subtitle" size="md">
    <v-text-field
      v-model="search"
      label="Search"
      prepend-inner-icon="search"
      clearable
    />

    <template v-if="filtered.length">
      <v-checkbox
        :model-value="allSelected"
        :indeterminate="someSelected"
        :label="allSelected ? 'Clear all' : 'Select all'"
        hide-details
        @update:model-value="toggleAll"
      />

      <div v-if="selectedItems.length">
        <h3 class="text-caption text-medium-emphasis text-uppercase mb-1">
          Selected {{ noun }} ({{ draft.length }})
        </h3>
        <v-checkbox
          v-for="item in selectedItems"
          :key="item"
          :model-value="true"
          :label="item"
          hide-details
          @update:model-value="toggle(item)"
        />
      </div>

      <div v-if="unselectedItems.length">
        <h3 class="text-caption text-medium-emphasis text-uppercase mb-1">
          Unselected {{ noun }} ({{ items.length - draft.length }})
        </h3>
        <v-checkbox
          v-for="item in unselectedItems"
          :key="item"
          :model-value="false"
          :label="item"
          hide-details
          @update:model-value="toggle(item)"
        />
      </div>
    </template>

    <MpEmptyState
      v-else
      icon="search-x"
      :title="`No matching ${noun}`"
      :description="`Nothing matches “${search}”.`"
      action-label="Clear search"
      :heading-level="3"
      @action="search = ''"
    />

    <template #footerStart>
      <span class="text-caption text-medium-emphasis">
        {{ draft.length }} selected
      </span>
    </template>
    <template #footer>
      <v-btn variant="text" class="text-none" @click="model = false">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" @click="apply">Apply</v-btn>
    </template>
  </MpFormDrawer>
</template>
