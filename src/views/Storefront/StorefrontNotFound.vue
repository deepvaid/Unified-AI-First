<script setup lang="ts">
import StorefrontAnchor from './StorefrontAnchor.vue'

// The storefront's 404 page, as the store renders it. Also where links to pages
// that don't exist on the real store land ("/service", "/cart", "/products").
</script>

<template>
  <div class="sf-404">
    <p class="sf-404__code" aria-hidden="true">404</p>
    <h1 class="sf-404__title">Sorry, This Page Not Found!</h1>
    <p>The page you are trying to access doesn't exist or has been moved.</p>
    <StorefrontAnchor href="/" class="sf-404__home">GO TO HOMEPAGE</StorefrontAnchor>
  </div>
</template>

<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sf-404 {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  max-width: 640px;
  margin: 0 auto;
  padding: 64px 24px 0;
  text-align: center;
}

.sf-404__code {
  margin: 0;
  font-size: 96px;
  line-height: 1;
  font-weight: 800;
}

.sf-404__title {
  margin: 0;
  font-size: 25px;
  font-weight: 700;
}

.sf-404__home {
  display: inline-flex;
  align-items: center;
  height: 46px;
  margin-top: 12px;
  padding: 0 24px;
  border-radius: var(--sf-radius, 6px);
  background: var(--sf-brand, #373842);
  color: var(--sf-bg, #ffffff) !important;
  font-size: 14px;
  font-weight: 500;
}
</style>
