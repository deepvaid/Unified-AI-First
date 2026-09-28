<script setup lang="ts">
import { computed, inject } from 'vue'
import { STOREFRONT, isExternalHref } from './storefrontContext'

// A link inside the storefront. Store-relative hrefs stay in the prototype's
// storefront (a broken one lands on its 404 page, as on the real store); a URL
// with a scheme opens in a new tab.

const props = defineProps<{ href: string }>()
const storefront = inject(STOREFRONT)!
const external = computed(() => isExternalHref(props.href))
</script>

<template>
  <a v-if="external" :href="href" target="_blank" rel="noopener noreferrer"><slot /></a>
  <RouterLink v-else :to="storefront.link(href)"><slot /></RouterLink>
</template>
