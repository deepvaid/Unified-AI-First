<script setup lang="ts">
import { computed, inject } from 'vue'
import { useRoute } from 'vue-router'
import { useStoreContentStore, type ContentKind } from '@/stores/useStoreContent'
import StorefrontAnchor from './StorefrontAnchor.vue'
import StorefrontNotFound from './StorefrontNotFound.vue'
import { STOREFRONT } from './storefrontContext'

// A storefront page (/page/:handle) or policy (/policies/:handle): breadcrumb, the
// title band (the entry's title, capitalised as the theme draws it), then the body
// as the merchant wrote it. Unknown or inactive handles get the 404 page.

const route = useRoute()
const storefront = inject(STOREFRONT)!
const content = useStoreContentStore()

const kind = computed(() => (route.meta.contentKind === 'policy' ? 'policy' : 'page') as ContentKind)
const entry = computed(() => content.entryByHandle(storefront.channel.value.id, kind.value, String(route.params.handle ?? '')))
</script>

<template>
  <article v-if="entry" class="sf-content">
    <nav class="sf-crumbs" aria-label="Breadcrumb">
      <StorefrontAnchor href="/">Home</StorefrontAnchor>
      <span aria-hidden="true">›</span>
      <span aria-current="page">{{ entry.title }}</span>
    </nav>
    <h1 class="sf-content__title">{{ entry.title }}</h1>
    <!-- Merchant-authored rich text from the store's own content. -->
    <div class="sf-content__body" v-html="entry.body" />
  </article>
  <StorefrontNotFound v-else />
</template>

<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sf-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 24px 0;
}

.sf-crumbs {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.sf-content__title {
  margin: 32px 0;
  text-align: center;
  text-transform: capitalize;
  font-family: var(--sf-heading-font, system-ui), -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-size: 39px;
  line-height: 1.2;
  font-weight: 700;
}

.sf-content__body :deep(h2) {
  margin: 0 0 16px;
  font-size: 31px;
  line-height: 1.25;
}

.sf-content__body :deep(h3) {
  margin: 28px 0 8px;
  font-size: 20px;
}

.sf-content__body :deep(p),
.sf-content__body :deep(ul) {
  margin: 0 0 12px;
}

.sf-content__body :deep(ul) {
  padding-left: 22px;
}
</style>
