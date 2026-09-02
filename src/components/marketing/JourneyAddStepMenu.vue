<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CatalogItem } from '@/stores/journeyFlowData'
import { categoryColor, categoryLabel, categoryOnColor } from './flowTheme'

const props = defineProps<{
  /** Addable catalog items shown in the menu. */
  items: CatalogItem[]
}>()

const emit = defineEmits<{
  pick: [item: CatalogItem]
}>()

defineSlots<{
  /** Menu activator — bind the provided `props` onto the trigger element. */
  default(slotProps: { props: Record<string, unknown> }): unknown
}>()

const COMMON_KINDS = new Set(['send-email', 'delay', 'yes-no', 'percent-split'])
const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.items
  return props.items.filter(i => `${i.title} ${i.subtitle}`.toLowerCase().includes(q))
})

const commonItems = computed(() =>
  filtered.value.filter(i => COMMON_KINDS.has(i.kind)),
)

const grouped = computed(() => {
  const commonIds = new Set(commonItems.value.map(i => i.kind))
  const rest = filtered.value.filter(i => !commonIds.has(i.kind))
  const byCat = new Map<string, CatalogItem[]>()
  for (const item of rest) {
    const key = item.category
    const list = byCat.get(key) ?? []
    list.push(item)
    byCat.set(key, list)
  }
  return [...byCat.entries()].map(([cat, items]) => ({
    key: cat,
    label: categoryLabel[cat as keyof typeof categoryLabel] ?? cat,
    items,
  }))
})

function pick(item: CatalogItem) {
  query.value = ''
  emit('pick', item)
}
</script>

<template>
  <v-menu :close-on-content-click="true" location="right">
    <template #activator="{ props: menu }">
      <slot :props="menu" />
    </template>
    <v-card rounded="lg" border flat width="260" class="py-2">
      <div class="px-3 py-1 text-caption text-medium-emphasis font-weight-bold text-uppercase border-b mb-1">Add step</div>
      <div class="px-2 pb-2">
        <!-- Menu filter, not a form field: compact and detail-free so the popover
             can't resize under the pointer while it is open. -->
        <v-text-field
          v-model="query"
          hide-details
          clearable
          prepend-inner-icon="search"
          placeholder="Search steps…"
          aria-label="Search steps"
          @click.stop
        />
      </div>
      <div class="jas-scroll">
        <template v-if="commonItems.length">
          <div class="px-3 py-1 text-caption text-medium-emphasis font-weight-bold">Common</div>
          <v-list density="compact" nav>
            <v-list-item v-for="tmpl in commonItems" :key="`c-${tmpl.kind}`" rounded="lg" @click="pick(tmpl)">
              <template #prepend>
                <v-avatar :color="categoryColor[tmpl.category]" size="22" rounded="md">
                  <v-icon :color="categoryOnColor[tmpl.category]" size="13">{{ tmpl.icon }}</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title class="text-caption ml-2">{{ tmpl.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </template>
        <template v-for="group in grouped" :key="group.key">
          <div class="px-3 py-1 text-caption text-medium-emphasis font-weight-bold">{{ group.label }}</div>
          <v-list density="compact" nav>
            <v-list-item v-for="tmpl in group.items" :key="tmpl.kind" rounded="lg" @click="pick(tmpl)">
              <template #prepend>
                <v-avatar :color="categoryColor[tmpl.category]" size="22" rounded="md">
                  <v-icon :color="categoryOnColor[tmpl.category]" size="13">{{ tmpl.icon }}</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title class="text-caption ml-2">{{ tmpl.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </template>
        <div v-if="!filtered.length" class="px-3 py-2 text-caption text-medium-emphasis">No steps match.</div>
      </div>
    </v-card>
  </v-menu>
</template>

<style scoped>
.border-b {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.jas-scroll {
  max-height: 320px;
  overflow-y: auto;
}
</style>
