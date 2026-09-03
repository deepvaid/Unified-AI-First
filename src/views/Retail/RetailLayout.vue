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
/* Mirrors SettingsLayout: the shell eats .mp-main-shell's inset (32/36, 28, 22) and
   restates it as the content pane's padding. 52px is the shared frame constant
   (see .mp-frame-fill in global.scss). */
.retail-shell {
  margin: calc(-1 * var(--mp-layout-shellInsetBlock)) calc(-1 * var(--mp-layout-shellInsetInline));
  min-height: calc(100vh - 52px - var(--mp-frame-offset, 0px));
  overflow: hidden;
  align-items: stretch;
}

.retail-shell__content {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: var(--mp-space-24) var(--mp-layout-shellInsetInline) var(--mp-layout-shellInsetBlock) var(--mp-layout-shellInsetBlock);
}

@media (max-width: 1024px) {
  .retail-shell { margin: calc(-1 * var(--mp-layout-shellInsetMedium)); }
  .retail-shell__content { padding: var(--mp-space-20) var(--mp-layout-shellInsetMedium) var(--mp-layout-shellInsetMedium); }
}

@media (max-width: 900px) {
  .retail-shell { flex-direction: column; height: auto; overflow: visible; }
  .retail-shell__content { overflow: visible; }
}

@media (max-width: 640px) {
  .retail-shell { margin: calc(-1 * var(--mp-layout-shellInsetCompact)); }
  .retail-shell__content { padding: var(--mp-space-16) var(--mp-layout-shellInsetCompact) var(--mp-layout-shellInsetCompact); }
}
</style>
