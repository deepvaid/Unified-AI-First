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
  /**
   * Visual weight. 'prominent' renders the title (and subtitle) as a two-tone
   * display-scale masthead. Shared system-wide vocabulary (P2-7).
   */
  emphasis?: 'default' | 'prominent'
}>(), {
  level: 1,
  density: 'default',
  emphasis: 'default',
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

          <div v-if="emphasis === 'prominent'" class="mp-headline-duo">
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
        <div v-if="$slots.actions" class="mp-page-header__actions d-flex align-center ga-2 flex-shrink-0">
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

/* Actions sit beside the title from tablet up. On phones the row wraps instead:
   `flex-shrink-0` (correct on wide viewports, so a button cluster never squashes)
   otherwise forces a wide cluster — e.g. a date-range select next to an Export
   button — past the header's right edge, clipping the last action. Wrapping keeps
   every action reachable at 375px without shrinking anything. */
@media (max-width: 599.98px) {
  .mp-page-header__main {
    flex-wrap: wrap;
  }

  .mp-page-header__actions {
    width: 100%;
    flex-wrap: wrap;
  }
}

/* Level-2 (drawer / settings-page) title: modest scale, not the full masthead. */
.mp-page-title--sm {
  font-size: var(--mp-fontSize-18);
  font-weight: var(--mp-fontWeight-bold);
  letter-spacing: -0.01em;
}

.mp-page-header__eyebrow {
  display: block;
  margin-bottom: var(--mp-space-4);
  color: var(--text-muted);
}

.mp-page-header__subtitle {
  line-height: 1.4;
}

.mp-page-header__back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: var(--mp-space-4);
  flex-shrink: 0;
  width: var(--mp-space-32);
  height: var(--mp-space-32);
  border-radius: var(--mp-component-chip-radius);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
  text-decoration: none;
  color: rgb(var(--v-theme-on-surface));
  transition:
    background var(--mp-motion-duration-fast) var(--mp-motion-easing-standard),
    border-color var(--mp-motion-duration-fast) var(--mp-motion-easing-standard),
    transform var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
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
