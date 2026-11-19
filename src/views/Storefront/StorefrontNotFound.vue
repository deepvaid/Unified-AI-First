<script setup lang="ts">
import StorefrontAnchor from './StorefrontAnchor.vue'
import { useDemoStore } from './storefrontContext'

// The storefront's 404 page, as the store renders it. Also where links to pages
// that don't exist on the real store land ("/service", "/cart", "/products").
// The wording is the real store's theme, word for word; a store shown to prospects
// says the same in plain sentence case.
const demo = useDemoStore()
</script>

<template>
  <div class="sf-404">
    <p class="sf-404__code" aria-hidden="true">404</p>
    <h1 class="sf-404__title">{{ demo ? 'We can’t find that page' : 'Sorry, This Page Not Found!' }}</h1>
    <p>{{ demo ? 'It may have moved, or the link may be out of date.' : 'The page you are trying to access doesn\'t exist or has been moved.' }}</p>
    <StorefrontAnchor href="/" class="sf-404__home">{{ demo ? 'Back to the home page' : 'GO TO HOMEPAGE' }}</StorefrontAnchor>
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
