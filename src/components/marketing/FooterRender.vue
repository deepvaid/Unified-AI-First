<script setup lang="ts">
import type { FooterItem } from '@/stores/useMarketingAssets'

/**
 * The rendered email footer, as recipients see it — merge tags unresolved,
 * exactly as UAT's footer preview shows them before a send. Shared by the
 * footer detail's framed thumbnail and the full-screen preview.
 */
defineProps<{
  footer: FooterItem
}>()

const SENT_LINE = 'This email was sent to {{contact.email}} by {{campaign.from_email}}'
const ADDRESS_LINE = '{{campaign.address}}'
</script>

<template>
  <div class="footer-render" :aria-label="`${footer.name} rendered footer`">
    <hr class="footer-render__rule" aria-hidden="true" />
    <p class="footer-render__line">{{ SENT_LINE }}</p>
    <p class="footer-render__line">{{ ADDRESS_LINE }}</p>
    <p v-if="footer.body" class="footer-render__body">{{ footer.body }}</p>
    <p class="footer-render__links">
      <a href="#" @click.prevent>1-Click Unsubscribe</a>
      <a href="#" @click.prevent>Report Spam</a>
      <a href="#" @click.prevent>Manage Subscriptions</a>
    </p>
  </div>
</template>

<style scoped>
.footer-render {
  text-align: center;
  padding: var(--mp-space-16);
  font-size: var(--mp-fontSize-13);
  color: var(--text-secondary, rgba(var(--v-theme-on-surface), 0.6));
}

.footer-render__rule {
  border: none;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  margin-bottom: var(--mp-space-12);
}

.footer-render__line,
.footer-render__body {
  margin: 0 0 var(--mp-space-6);
}

.footer-render__body {
  white-space: pre-wrap;
}

.footer-render__links {
  display: flex;
  justify-content: center;
  gap: var(--mp-space-16);
  margin: var(--mp-space-10) 0 0;
  flex-wrap: wrap;
}

.footer-render__links a {
  color: rgb(var(--v-theme-primary));
}
</style>
