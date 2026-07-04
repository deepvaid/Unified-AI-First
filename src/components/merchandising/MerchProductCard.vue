<script setup lang="ts">
import type { MerchProduct } from '@/stores/useMerchandising'

withDefaults(defineProps<{
  product: MerchProduct
  pinned?: boolean
  /** 1-based position badge for pinned cards */
  rank?: number
  selected?: boolean
  selectable?: boolean
  /** false renders a read-only card (no pin/select affordances), e.g. rule previews */
  interactive?: boolean
}>(), {
  pinned: false,
  selected: false,
  selectable: true,
  interactive: true,
})

const emit = defineEmits<{
  togglePin: []
  toggleSelect: []
}>()
</script>

<template>
  <div
    class="merch-card"
    :class="{ 'merch-card--pinned': pinned, 'merch-card--selected': selected }"
  >
    <div class="merch-card__media">
      <v-img :src="product.image" :alt="product.title" aspect-ratio="0.8" cover>
        <template #placeholder>
          <div class="merch-card__media-fallback">
            <v-icon size="28" class="text-medium-emphasis">image</v-icon>
          </div>
        </template>
      </v-img>

      <span v-if="rank != null" class="merch-card__rank">{{ rank }}</span>

      <v-checkbox-btn
        v-if="interactive && selectable"
        class="merch-card__check"
        :class="{ 'merch-card__check--visible': selected }"
        :model-value="selected"
        density="compact"
        :aria-label="`Select ${product.title}`"
        @click.stop
        @update:model-value="emit('toggleSelect')"
      />

      <v-btn
        v-if="interactive"
        class="merch-card__pin"
        :class="{ 'merch-card__pin--visible': pinned }"
        :icon="pinned ? 'pin-off' : 'pin'"
        size="x-small"
        :variant="pinned ? 'flat' : 'elevated'"
        :color="pinned ? 'primary' : 'surface'"
        :aria-label="pinned ? `Unpin ${product.title}` : `Pin ${product.title}`"
        @click.stop="emit('togglePin')"
      />
    </div>

    <div class="merch-card__body pa-3">
      <div class="merch-card__title text-body-2 font-weight-medium">{{ product.title }}</div>
      <div class="d-flex align-center gap-2 mt-1">
        <span class="text-body-2 font-weight-bold" :class="{ 'text-error': product.compareAt }">
          ${{ product.price }}
        </span>
        <s v-if="product.compareAt" class="text-caption text-medium-emphasis">${{ product.compareAt }}</s>
      </div>
      <div class="text-caption text-medium-emphasis mt-1">Qty: {{ product.qty }}</div>
    </div>
  </div>
</template>

<style scoped>
.merch-card {
  position: relative;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.merch-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.35);
}

.merch-card--selected {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 1px rgba(var(--v-theme-primary), 0.3);
}

.merch-card__media {
  position: relative;
  background: rgba(var(--v-theme-surface-variant), 0.3);
}

.merch-card__media-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.merch-card__rank {
  position: absolute;
  bottom: 8px;
  left: 8px;
  min-width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-inline: 6px;
  border-radius: 999px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.merch-card__check {
  position: absolute;
  top: 4px;
  left: 4px;
  background: rgba(var(--v-theme-surface), 0.9);
  border-radius: 8px;
  opacity: 0;
  transition: opacity 120ms ease;
}

.merch-card__pin {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 120ms ease;
}

.merch-card__check--visible,
.merch-card__pin--visible,
.merch-card:hover .merch-card__check,
.merch-card:hover .merch-card__pin,
.merch-card:focus-within .merch-card__check,
.merch-card:focus-within .merch-card__pin {
  opacity: 1;
}

.merch-card__title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
  min-height: 2.6em;
}
</style>
