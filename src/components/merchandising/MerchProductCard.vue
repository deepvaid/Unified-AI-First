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
      <v-img :src="product.image" :alt="product.title" :aspect-ratio="1" cover>
        <template #placeholder>
          <div class="merch-card__media-fallback">
            <v-icon size="20" class="text-medium-emphasis">image</v-icon>
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

    <div class="merch-card__body">
      <div class="merch-card__title text-body-2 font-weight-medium">{{ product.title }}</div>
      <div class="d-flex align-center ga-2 mt-1">
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
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-component-card-radius);
  background: var(--surface-primary);
  color: var(--on-surface);
  overflow: hidden;
  transition: border-color var(--mp-motion-duration-fast) var(--mp-motion-easing-standard),
    box-shadow var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}

.merch-card:hover {
  border-color: var(--border-hover);
}

.merch-card--selected {
  border-color: var(--accent-default);
  box-shadow: 0 0 0 1px var(--accent-default);
}

.merch-card__media {
  position: relative;
  background: var(--surface-secondary);
}

.merch-card__media-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.merch-card__rank {
  position: absolute;
  bottom: var(--mp-space-8);
  left: var(--mp-space-8);
  min-width: var(--mp-component-chip-height-sm);
  height: var(--mp-component-chip-height-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-inline: var(--mp-space-6);
  border-radius: var(--mp-radius-full);
  background: var(--surface-primary);
  color: var(--on-surface);
  border: 1px solid var(--border-subtle);
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-bold);
  font-variant-numeric: tabular-nums;
}

.merch-card__check {
  position: absolute;
  top: var(--mp-space-4);
  left: var(--mp-space-4);
  background: var(--surface-primary);
  border-radius: var(--mp-component-chip-radius);
  opacity: 0;
  transition: opacity var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}

.merch-card__pin {
  position: absolute;
  top: var(--mp-space-8);
  right: var(--mp-space-8);
  opacity: 0;
  transition: opacity var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}

.merch-card__check--visible,
.merch-card__pin--visible,
.merch-card:hover .merch-card__check,
.merch-card:hover .merch-card__pin,
.merch-card:focus-within .merch-card__check,
.merch-card:focus-within .merch-card__pin {
  opacity: 1;
}

.merch-card__body {
  padding: var(--mp-component-card-paddingCompact);
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
