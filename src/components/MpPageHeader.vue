<script setup lang="ts">
import { RouterLink } from 'vue-router'

withDefaults(defineProps<{
  title: string
  subtitle?: string
  backTo?: string | Record<string, unknown>
  level?: 1 | 2
  density?: 'default' | 'compact'
  /** Muted, uppercase, tracked label above the title (e.g. "COMMERCE · ORDERS"). */
  eyebrow?: string
  /** 'display' renders the title (and subtitle) as a two-tone display-scale masthead. */
  variant?: 'default' | 'display'
}>(), {
  level: 1,
  density: 'default',
  variant: 'default',
})
</script>

<template>
  <div class="mp-page-header" :class="density === 'compact' ? 'mb-1' : 'mb-2'">
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
          @click="navigate"
        >
          <v-icon size="20">chevron-left</v-icon>
        </a>
      </RouterLink>

      <div class="mp-page-header__main min-width-0 flex-grow-1 d-flex align-start ga-3">
        <div class="min-width-0 flex-grow-1">
          <span v-if="eyebrow" class="mp-page-header__eyebrow mp-meta-label">{{ eyebrow }}</span>

          <div v-if="variant === 'display'" class="mp-headline-duo">
            <component
              :is="level === 2 ? 'h2' : 'h1'"
              class="is-ink mp-display-sm"
            >{{ title }}</component>
            <span v-if="subtitle" class="is-muted mp-display-sm">{{ subtitle }}</span>
          </div>

          <template v-else>
            <component
              :is="level === 2 ? 'h2' : 'h1'"
              class="mp-page-header__title mp-page-title"
              :class="{ 'mp-page-title--sm': level === 2 }"
            >{{ title }}</component>
            <div v-if="subtitle" class="mp-page-header__subtitle mp-page-subtitle mt-1">
              {{ subtitle }}
            </div>
          </template>
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

/* Level-2 (drawer / settings-page) title: modest scale, not the full masthead. */
.mp-page-title--sm {
  font-size: 18px;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.mp-page-header__eyebrow {
  display: block;
  margin-bottom: 4px;
  color: var(--text-muted);
}

.mp-page-header__subtitle {
  line-height: 1.4;
}

.mp-page-header__back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
  text-decoration: none;
  color: rgb(var(--v-theme-on-surface));
  transition: background 120ms ease, border-color 120ms ease, transform 120ms ease;
  cursor: pointer;
}

.mp-page-header__back:hover {
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-color: rgba(var(--v-theme-on-surface), 0.22);
  transform: translateX(-1px);
}

.mp-page-header__back:active {
  background: rgba(var(--v-theme-on-surface), 0.08);
  transform: translateX(-1px);
}

.mp-page-header__back:focus-visible {
  outline: none;
  border-color: var(--focus-ring);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--focus-ring) 40%, transparent);
}
</style>
