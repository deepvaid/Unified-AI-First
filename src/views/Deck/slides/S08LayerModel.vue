<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'

const LAYERS = [
  {
    name: 'Design tokens',
    desc: 'tokens.json → generated CSS, SCSS, TypeScript and the Vuetify theme. One source.',
    owner: 'shared',
  },
  {
    name: 'Vuetify primitives',
    desc: 'Buttons, fields, tables, overlays — the Material-based implementation foundation.',
    owner: 'shared',
  },
  {
    name: 'Generic compounds (Mp*)',
    desc: 'Page headers, table toolbars, form drawers, confirm dialogs, empty/error states.',
    owner: 'converges into LiquidSky',
  },
  {
    name: 'Page recipes',
    desc: 'List pages, detail pages, settings, wizards — repeatable compositions, documented.',
    owner: 'copyable patterns',
  },
  {
    name: 'Product surfaces',
    desc: 'Dashboards, builders, Da Vinci — purpose-built workspaces on the same foundations.',
    owner: 'stays in the product',
  },
]
</script>

<template>
  <DeckSlide eyebrow="How it's put together" title="Five layers, one direction of truth.">
    <div class="s08__stack">
      <div v-for="(layer, i) in LAYERS" :key="layer.name" class="s08__layer" :style="{ '--i': i }">
        <span class="s08__num">{{ i + 1 }}</span>
        <div class="flex-grow-1">
          <div class="s08__name">{{ layer.name }}</div>
          <div class="s08__desc">{{ layer.desc }}</div>
        </div>
        <v-chip size="small" label variant="tonal" :color="i === 2 ? 'primary' : undefined" class="s08__owner">
          {{ layer.owner }}
        </v-chip>
      </div>
    </div>
  </DeckSlide>
</template>

<style scoped>
.s08__stack {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-3);
  max-width: 900px;
}

.s08__layer {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-5);
  padding: var(--mp-spacing-4) var(--mp-spacing-6);
  border: 1px solid var(--mp-border-subtle);
  border-radius: var(--mp-borderRadius-md);
  background: rgb(var(--v-theme-surface));
  margin-inline-start: calc(var(--i) * var(--mp-spacing-6));
  animation: s08-rise var(--mp-motion-duration-entrance) var(--mp-motion-easing-standard) both;
  animation-delay: calc(var(--i) * var(--mp-motion-stagger-step) * 2);
}

.s08__num {
  font-family: var(--mp-typography-fontFamily-mono);
  font-size: var(--mp-typography-fontSize-sm);
  color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
}

.s08__name {
  font-size: var(--mp-typography-fontSize-md);
  font-weight: var(--mp-typography-fontWeight-bold);
}

.s08__desc {
  font-size: var(--mp-typography-fontSize-body);
  color: rgb(var(--v-theme-on-surface-variant));
}

.s08__owner {
  flex-shrink: 0;
}

@keyframes s08-rise {
  from {
    opacity: 0;
    transform: translateX(-14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (max-width: 900px) {
  .s08__layer {
    margin-inline-start: 0;
  }

  .s08__owner {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .s08__layer {
    animation: none;
  }
}
</style>
