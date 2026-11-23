<script setup lang="ts">
import { computed, inject } from 'vue'
import type { ThemeSection } from '@/storefront/themeSections'
import { STOREFRONT } from '../storefrontContext'
import { text } from './sectionSettings'

// The `announcement-bar` section where the home template places it, for a store
// that does not show it above the header on every page. A running campaign's
// message takes its place, as it does above the header.

const props = defineProps<{ section: ThemeSection }>()

const storefront = inject(STOREFRONT)!
const message = computed(() => storefront.campaignMessage.value || text(props.section.settings, 'text'))
</script>

<template>
  <p v-if="message" class="sfa">{{ message }}</p>
</template>

<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sfa {
  margin: 0;
  padding: 10px var(--sf-gutter, 24px);
  background: var(--sf-brand, #121011);
  color: var(--sf-on-brand, #ffffff);
  text-align: center;
  font-size: 13px;
  line-height: 18px;
  letter-spacing: 0.02em;
}
</style>
