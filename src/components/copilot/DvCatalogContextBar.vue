<script setup lang="ts">
// DvCatalogContextBar — the strip under the Da Vinci header while the drawer is in
// catalog context: what Da Vinci is working on, what's left in the allowance, and
// the way out. Sits on the Da Vinci soft tint with its declared text pair.
import { computed } from 'vue'
import {
  CATALOG_FIELD_TITLES,
  walletLabel,
  type CatalogField,
  type CatalogMode,
  type CatalogWallet,
} from '@/composables/catalogCopilotConfig'

const props = defineProps<{
  mode: CatalogMode
  field?: CatalogField
  productName?: string
  wallet: CatalogWallet
}>()

const emit = defineEmits<{ exit: [] }>()

const contextLabel = computed(() => {
  const name = props.productName?.trim()
  if (props.mode === 'create') return 'New product'
  if (props.mode === 'enrich') return name || 'This product'
  return `${CATALOG_FIELD_TITLES[props.field ?? 'description']} · ${name || 'Untitled product'}`
})

const allowance = computed(() => walletLabel(props.wallet))
</script>

<template>
  <section class="dv-catalog-bar" aria-label="Catalog Co-Pilot">
    <v-icon size="18" class="dv-catalog-bar__icon" aria-hidden="true">package</v-icon>
    <div class="dv-catalog-bar__text">
      <span class="dv-catalog-bar__title">Catalog Co-Pilot</span>
      <span class="dv-catalog-bar__context">{{ contextLabel }}</span>
    </div>
    <v-tooltip
      location="bottom"
      max-width="280"
      text="Credits are used when you apply a draft — not when you publish. Discarding is free."
    >
      <template #activator="{ props: tip }">
        <span v-bind="tip" class="dv-catalog-bar__allowance" tabindex="0">{{ allowance }}</span>
      </template>
    </v-tooltip>
    <v-btn
      icon
      size="28"
      variant="text"
      class="dv-catalog-bar__exit"
      aria-label="Leave Catalog Co-Pilot"
      @click="emit('exit')"
    >
      <v-icon size="16">x</v-icon>
      <v-tooltip activator="parent" location="bottom">Leave Catalog Co-Pilot</v-tooltip>
    </v-btn>
  </section>
</template>

<style scoped>
.dv-catalog-bar {
  display: flex;
  align-items: center;
  gap: var(--mp-space-10);
  padding: var(--mp-space-8) var(--mp-space-8) var(--mp-space-8) var(--mp-space-16);
  background: var(--dv-accent-soft);
  color: var(--dv-text-primary);
  border-bottom: 1px solid var(--dv-border);
  flex-shrink: 0;
}

.dv-catalog-bar__icon {
  flex-shrink: 0;
  color: var(--dv-text-primary);
}

.dv-catalog-bar__text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.dv-catalog-bar__title {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  line-height: var(--mp-lineHeight-compact);
}

.dv-catalog-bar__context {
  font-size: var(--mp-fontSize-12);
  line-height: var(--mp-lineHeight-compact);
  color: var(--dv-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dv-catalog-bar__allowance {
  flex-shrink: 0;
  padding: var(--mp-space-2) var(--mp-space-8);
  border: 1px solid var(--dv-border);
  border-radius: var(--mp-radius-full);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-medium);
  font-variant-numeric: tabular-nums;
  color: var(--dv-text-primary);
  white-space: nowrap;
}

.dv-catalog-bar__allowance:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.dv-catalog-bar__exit {
  flex-shrink: 0;
  color: var(--dv-text-secondary);
}
</style>
