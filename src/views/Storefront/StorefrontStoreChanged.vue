<script setup lang="ts">
import { computed, inject } from 'vue'
import { useStorefrontCartStore } from '@/stores/useStorefrontCart'
import { STOREFRONT } from './storefrontContext'

// Says why the cart is empty after the store changed under the shopper: a theme
// applied, or the store restored, here or in the admin's tab (useStorefrontCart,
// storeChanged). The layout shows it on every page; the cart page places its own.
// Storefront styling (P4-8): theme colours, so it reads on every store.

const emit = defineEmits<{ dismissed: [] }>()

const storefront = inject(STOREFRONT)!
const cart = useStorefrontCartStore()
const channelId = computed(() => storefront.channel.value.id)

/** The products a store change took out of the cart, or null. */
const changed = computed(() => cart.noticeFor(channelId.value))
/** "A, B and C"; four are all named, past four "A, B, C and 2 more". */
const changedNames = computed(() => {
  const names = changed.value ?? []
  if (names.length > 4) return `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
})

function dismiss(): void {
  cart.dismissNotice(channelId.value)
  emit('dismissed')
}
</script>

<template>
  <!-- Always on the page, so a store change while it is open is announced. -->
  <div role="status">
    <div v-if="changed" class="sf-changed">
      <p class="sf-changed__text">
        This store changed while you were shopping, so your cart was emptied: {{ changedNames }}.
      </p>
      <button type="button" class="sf-changed__dismiss" @click="dismiss">Got it</button>
    </div>
  </div>
</template>

<style scoped>
.sf-changed {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 24px;
  margin-bottom: 32px;
  padding: 14px 16px;
  border: 1px solid var(--sf-divider, #e3e3e0);
  border-radius: var(--sf-corner, 8px);
  background: var(--sf-surface, #f7f7f5);
  color: var(--sf-text, #121011);
  font-size: 15px;
  line-height: 22px;
}

.sf-changed__text {
  flex: 1 1 240px;
  min-width: 0;
  margin: 0;
}

/* Underlined like a link; 44px of hit area around its 24px line. */
.sf-changed__dismiss {
  position: relative;
  flex: none;
  min-height: 24px;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.sf-changed__dismiss::after {
  content: '';
  position: absolute;
  inset: -10px -8px;
}

.sf-changed__dismiss:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 3px;
}
</style>
