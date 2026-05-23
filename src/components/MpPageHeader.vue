<script setup lang="ts">
import { RouterLink } from 'vue-router'

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
          <v-icon size="20">chevron-left</v-icon>
        </a>
      </RouterLink>

      <div class="mp-page-header__main min-width-0 flex-grow-1 d-flex align-start ga-3">
        <div class="min-width-0 flex-grow-1">
          <h1 class="mp-page-header__title text-h5 font-weight-bold">{{ title }}</h1>
          <div v-if="subtitle" class="mp-page-header__subtitle text-body-2 text-medium-emphasis mt-1">
            {{ subtitle }}
          </div>
        </div>
        <div v-if="$slots.actions" class="d-flex align-center ga-2 flex-shrink-0">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </div>

  <slot name="tabs" />
</template>

<style scoped>
.mp-page-header__title {
  line-height: 1.2;
  color: rgb(var(--v-theme-on-surface));
}

.mp-page-header__subtitle {
  line-height: 1.4;
}

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
