<script setup lang="ts">
import type { CatalogItem } from '@/stores/journeyFlowData'
import { categoryColor } from './flowTheme'

defineProps<{
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
</script>

<template>
  <v-menu :close-on-content-click="true" location="right">
    <template #activator="{ props: menu }">
      <slot :props="menu" />
    </template>
    <v-card rounded="lg" border flat width="220" class="py-2">
      <div class="px-3 py-1 text-caption text-medium-emphasis font-weight-bold text-uppercase border-b mb-1">Add step</div>
      <v-list density="compact" nav>
        <v-list-item v-for="tmpl in items" :key="tmpl.kind" rounded="lg" @click="emit('pick', tmpl)">
          <template #prepend>
            <v-avatar :color="categoryColor[tmpl.category]" size="22" rounded="md">
              <v-icon color="white" size="13">{{ tmpl.icon }}</v-icon>
            </v-avatar>
          </template>
          <v-list-item-title class="text-caption ml-2">{{ tmpl.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<style scoped>
.border-b {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
