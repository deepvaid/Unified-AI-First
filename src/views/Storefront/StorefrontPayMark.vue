<script setup lang="ts">
// A payment mark — "We accept", the footer row, the instalment line. The brand's
// name stands in for its artwork, which the prototype doesn't carry. Maropay is
// Maropost's own mark, so it is the one that wears a colour.

defineProps<{ mark: string }>()
</script>

<template>
  <span class="sf-mark" :class="{ 'sf-mark--maropay': mark === 'Maropay' }">
    <v-icon v-if="mark === 'Maropay'" size="13" aria-hidden="true">wallet</v-icon>
    {{ mark }}
  </span>
</template>

<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sf-mark {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #ffffff;
  color: #1f1f1f;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.sf-mark--maropay {
  border-color: var(--mp-color-light-primary);
  color: var(--mp-color-light-primary);
}
</style>
