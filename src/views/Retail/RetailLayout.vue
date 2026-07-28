<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import RetailSidebar from './RetailSidebar.vue'

const route = useRoute()
const accountId = computed(() => String(route.params.accountId ?? '2000290'))
</script>

<template>
  <div class="retail-shell d-flex">
    <RetailSidebar :account-id="accountId" />
    <main class="retail-shell__content">
      <router-view />
    </main>
  </div>
</template>

<style scoped lang="scss">
.retail-shell {
  margin: -32px -36px;
  min-height: calc(100vh - 52px - var(--mp-frame-offset, 0px));
  overflow: hidden;
  align-items: stretch;
}

.retail-shell__content {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 36px 32px 32px;
}

@media (max-width: 1024px) {
  .retail-shell { margin: -28px; }
  .retail-shell__content { padding: 20px 28px 28px; }
}

@media (max-width: 900px) {
  .retail-shell { flex-direction: column; height: auto; overflow: visible; }
  .retail-shell__content { overflow: visible; }
}

@media (max-width: 640px) {
  .retail-shell { margin: -22px; }
  .retail-shell__content { padding: 16px 22px 22px; }
}
</style>
