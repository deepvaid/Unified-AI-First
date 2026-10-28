<script setup lang="ts">
/**
 * A product in the register grid. Stock that is short shows on the tile, so a
 * shortage is seen before it is tapped.
 *
 * Pass `selected` (true or false) where tapping picks a product for a details
 * panel — it renders `aria-pressed`. Leave it unset where tapping adds to the sale.
 */
import { computed } from 'vue'
import PosBadge from './PosBadge.vue'
import { posArt, posInitials, type PosStock } from './posArt'

const props = withDefaults(defineProps<{
  name: string
  /** One quiet line under the name: the variant, the variant list or the SKU. */
  meta?: string
  /** Already formatted for the store — "$49.00", "from $29.00". */
  price: string
  /** Hashes to the placeholder artwork; usually the SKU. */
  seed: string
  /** More than one shows "N variants" on the artwork. */
  variants?: number
  stock?: PosStock | null
  selected?: boolean
  /** Lucide icon on the artwork instead of the product's initials. */
  icon?: string
}>(), {
  meta: undefined,
  variants: 1,
  stock: null,
  selected: undefined,
  icon: undefined,
})

const art = computed(() => posArt(props.seed))
</script>

<template>
  <button
    type="button"
    class="pos-tile"
    :class="{ 'pos-tile--selected': selected }"
    :aria-pressed="selected === undefined ? undefined : selected"
  >
    <span class="pos-tile__art" :style="{ background: art }">
      <v-icon v-if="icon" size="20" class="pos-tile__mark" aria-hidden="true">{{ icon }}</v-icon>
      <span v-else class="pos-tile__mark pos-tile__initials" aria-hidden="true">{{ posInitials(name) }}</span>
      <span v-if="variants > 1" class="pos-tile__variants">{{ variants }} variants</span>
      <PosBadge v-if="stock" class="pos-tile__stock" size="md" :tone="stock.tone" :icon="stock.icon">{{ stock.label }}</PosBadge>
    </span>
    <span class="pos-tile__body">
      <span class="pos-tile__name">{{ name }}</span>
      <span v-if="meta" class="pos-tile__meta">{{ meta }}</span>
      <span class="pos-tile__price">{{ price }}</span>
    </span>
  </button>
</template>

<style scoped>
.pos-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  border: 1px solid var(--mp-color-light-pos-hairline);
  border-radius: var(--mp-component-pos-radius-card);
  background: var(--mp-color-light-pos-surface);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    transform var(--mp-motion-duration-fast),
    box-shadow var(--mp-motion-duration-fast),
    border-color var(--mp-motion-duration-fast);
}

.pos-tile:hover {
  border-color: rgba(var(--mp-rgb-color-light-pos-ink), 0.12);
  box-shadow: var(--mp-shadow-md);
  transform: translateY(-1px);
}

.pos-tile:active { transform: translateY(0); }

.pos-tile--selected,
.pos-tile--selected:hover {
  border-color: var(--mp-color-light-pos-accent);
  box-shadow: 0 0 0 1px var(--mp-color-light-pos-accent);
}

.pos-tile__art {
  position: relative;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  height: var(--mp-component-pos-tileImageHeight);
}

.pos-tile__mark { color: rgba(var(--mp-rgb-color-light-pos-ink), 0.55); }

.pos-tile__initials {
  font-size: var(--mp-fontSize-20);
  font-weight: var(--mp-fontWeight-bold);
  letter-spacing: 0.02em;
}

.pos-tile__variants {
  position: absolute;
  top: var(--mp-space-6);
  right: var(--mp-space-6);
  padding: var(--mp-space-2) var(--mp-space-6);
  border: 1px solid rgba(var(--mp-rgb-color-light-pos-ink), 0.1);
  border-radius: var(--mp-radius-full);
  background: rgba(var(--mp-rgb-color-light-pos-surface), 0.88);
  color: var(--mp-color-light-pos-ink);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-semibold);
  backdrop-filter: blur(4px);
}

.pos-tile__stock {
  position: absolute;
  bottom: var(--mp-space-6);
  left: var(--mp-space-6);
}

.pos-tile__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--mp-space-2);
  padding: var(--mp-space-8) var(--mp-space-10) var(--mp-space-10);
}

.pos-tile__name {
  display: -webkit-box;
  overflow: hidden;
  color: var(--mp-color-light-pos-ink);
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  line-height: var(--mp-lineHeight-snug);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.pos-tile__meta {
  overflow: hidden;
  color: var(--mp-color-light-pos-muted);
  font-size: var(--mp-fontSize-12);
  line-height: var(--mp-lineHeight-snug);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pos-tile__price {
  margin-top: var(--mp-space-2);
  color: var(--mp-color-light-pos-ink);
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-bold);
}
</style>
