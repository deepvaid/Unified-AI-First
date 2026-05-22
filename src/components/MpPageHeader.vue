<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { MbPageHeader } from '@marobase/ui'

defineProps<{
  title: string
  subtitle?: string
  backTo?: string | Record<string, unknown>
}>()
</script>

<template>
  <div class="mp-page-header mb-2">
    <div class="mp-page-header__top d-flex align-start ga-3">
      <RouterLink
        v-if="backTo"
        v-slot="{ href, navigate }"
        :to="backTo"
        custom
      >
        <a
          class="mp-page-header__back"
          :href="href"
          aria-label="Back"
          @click.prevent="navigate"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M15 6L9 12L15 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </a>
      </RouterLink>

      <div class="mp-page-header__main min-width-0 flex-grow-1">
        <MbPageHeader :title="title" :subtitle="subtitle" size="sm">
          <template v-if="$slots.actions" #actions>
            <slot name="actions" />
          </template>
        </MbPageHeader>
      </div>
    </div>
  </div>

  <slot name="tabs" />
</template>

<style scoped>
.mp-page-header__back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  flex-shrink: 0;
  border-radius: 999px;
  padding: 6px;
  text-decoration: none;
  color: rgb(var(--v-theme-on-surface-variant));
}

.mp-page-header__back:hover {
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgb(var(--v-theme-on-surface));
}

.mp-page-header__back:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-surface));
}
</style>
