<script setup lang="ts">
import { computed, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStoreContentStore, type ContentKind } from '@/stores/useStoreContent'
import StorefrontAnchor from './StorefrontAnchor.vue'
import StorefrontNotFound from './StorefrontNotFound.vue'
import { STOREFRONT, isExternalHref } from './storefrontContext'

// A storefront page (/page/:handle) or policy (/policies/:handle): breadcrumb, the
// title band (the entry's title, capitalised as the theme draws it), then the body
// as the merchant wrote it. Unknown or inactive handles get the 404 page. A theme on
// the sections drawing sets the title's weight and case itself, separates the
// breadcrumb with "/", and leaves out a first heading of the body that only repeats
// the title.

const route = useRoute()
const router = useRouter()
const storefront = inject(STOREFRONT)!
const content = useStoreContentStore()

const kind = computed(() => (route.meta.contentKind === 'policy' ? 'policy' : 'page') as ContentKind)
const entry = computed(() => content.entryByHandle(storefront.channel.value.id, kind.value, String(route.params.handle ?? '')))
const sections = computed(() => storefront.sectionsDrawing.value)

/** The text of a bit of HTML, as compared with the title: tags out, spaces folded, any case. */
function plain(html: string): string {
  const text = new DOMParser().parseFromString(html, 'text/html').body.textContent ?? ''
  return text.replace(/\s+/g, ' ').trim().toLowerCase()
}

/** The body as shown: on the sections drawing, without a leading <h2> that says the title again. */
const body = computed(() => {
  const html = entry.value?.body ?? ''
  if (!sections.value || !entry.value) return html
  const lead = /^\s*<h2\b[^>]*>([\s\S]*?)<\/h2>\s*/i.exec(html)
  return lead && plain(lead[1]!) === plain(entry.value.title) ? html.slice(lead[0].length) : html
})

/** A store-relative link in the body ("/policies/refund-policy") opens that storefront page, not the admin's path. */
function followBodyLink(event: MouseEvent): void {
  const href = (event.target as HTMLElement).closest('a')?.getAttribute('href')
  if (!href || href.startsWith('#') || isExternalHref(href)) return
  event.preventDefault()
  void router.push(storefront.link(href))
}
</script>

<template>
  <article v-if="entry" class="sf-content" :class="{ 'sf-content--sections': sections }">
    <nav class="sf-crumbs" aria-label="Breadcrumb">
      <StorefrontAnchor href="/">Home</StorefrontAnchor>
      <span aria-hidden="true">{{ sections ? '/' : '›' }}</span>
      <span aria-current="page">{{ entry.title }}</span>
    </nav>
    <h1 class="sf-content__title">{{ entry.title }}</h1>
    <!-- Merchant-authored rich text from the store's own content. -->
    <div class="sf-content__body" @click="followBodyLink" v-html="body" />
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
  /* The heading case and weight are set by a theme on the sections drawing only
     (storefrontThemeVars); every other theme keeps the capitalised bold title. */
  text-transform: var(--sf-heading-case, capitalize);
  font-family: var(--sf-heading-font, system-ui), -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-size: 39px;
  line-height: 1.2;
  font-weight: var(--sf-heading-weight, 700);
}

/* The sections drawing: the store's narrow reading measure and gutter (shared with the
   account page), and breadcrumbs as its product page draws them. */
.sf-content.sf-content--sections {
  max-width: var(--sf-measure-narrow, 900px);
  padding-inline: var(--sf-gutter, 24px);
}

.sf-content--sections .sf-crumbs {
  gap: 10px;
  color: var(--sf-muted, #5f5f5f);
  font-size: 13px;
  line-height: 20px;
}

.sf-content--sections .sf-crumbs a {
  color: var(--sf-muted, #5f5f5f);
}

.sf-content--sections .sf-crumbs [aria-current='page'] {
  color: var(--sf-text, #121011);
}

.sf-content__body :deep(a) {
  text-decoration: underline;
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
