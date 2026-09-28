<script setup lang="ts">
import StorefrontAnchor from './StorefrontAnchor.vue'

// The storefront cart (/cart-page). Only its empty state for now: nothing can be
// added until the store's products are crawled (the product search was down).
// Wording from the page's own templates.
</script>

<template>
  <div class="sf-cart">
    <h1 class="sf-cart__title">Cart</h1>
    <div class="sf-cart__empty">
      <p class="sf-cart__empty-title">Your Shopping Cart is Empty!</p>
      <StorefrontAnchor href="/" class="sf-cart__start">Start Shopping!</StorefrontAnchor>
    </div>
  </div>
</template>

<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sf-cart {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px 0;
}

.sf-cart__title {
  margin: 0 0 40px;
  text-align: center;
  font-family: var(--sf-heading-font, system-ui), -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-size: 31px;
  font-weight: 700;
}

.sf-cart__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px 0;
}

.sf-cart__empty-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.sf-cart__start {
  display: inline-flex;
  align-items: center;
  height: 50px;
  padding: 0 24px;
  border-radius: var(--sf-radius, 6px);
  background: var(--sf-brand, #373842);
  color: var(--sf-bg, #ffffff) !important;
  font-size: 14px;
  font-weight: 500;
}
</style>
