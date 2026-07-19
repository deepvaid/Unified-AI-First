<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'

const LAYERS = [
  {
    name: 'The rulebook',
    desc: 'Colors, spacing, type — every visual decision made once, written down, reused everywhere.',
    tag: 'shared',
  },
  {
    name: 'The bricks',
    desc: 'Buttons, fields, tables, menus — the small parts every screen is made of.',
    tag: 'shared',
  },
  {
    name: 'The rooms',
    desc: 'Page headers, list toolbars, forms, empty states — patterns that repeat across the product.',
    tag: 'shared',
  },
  {
    name: 'The buildings',
    desc: 'Whole screens assembled from those rooms — orders, contacts, campaigns, settings.',
    tag: 'patterns',
  },
  {
    name: 'The neighborhoods',
    desc: 'Dashboards, builders, Da Vinci — each one unique, all unmistakably the same city.',
    tag: 'stays unique',
  },
]
</script>

<template>
  <DeckSlide eyebrow="How it holds together" title="It works like a city.">
    <div class="s08__stack">
      <div
        v-for="(layer, i) in LAYERS"
        :key="layer.name"
        class="s08__layer cine"
        :style="{ '--i': i, '--ci': 1.2 + i * 0.5 }"
      >
        <span class="s08__num">{{ i + 1 }}</span>
        <div class="flex-grow-1">
          <div class="s08__name">{{ layer.name }}</div>
          <div class="s08__desc">{{ layer.desc }}</div>
        </div>
        <v-chip size="small" label variant="tonal" :color="layer.tag === 'shared' ? 'primary' : undefined" class="s08__owner">
          {{ layer.tag }}
        </v-chip>
      </div>
    </div>
    <p class="s08__footnote mt-6 cine--soft" :style="{ '--ci': 4.2 }">
      Change a rule once — say, a shade of blue — and the whole city repaints itself. That's the
      trick behind everything you'll see tonight.
    </p>
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

.s08__footnote {
  max-width: 780px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: var(--mp-typography-fontSize-body);
}

@media (max-width: 900px) {
  .s08__layer {
    margin-inline-start: 0;
  }

  .s08__owner {
    display: none;
  }
}
</style>
