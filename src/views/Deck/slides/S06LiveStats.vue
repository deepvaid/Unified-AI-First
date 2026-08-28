<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'

const STATS = [
  { label: 'Components', value: '89', icon: 'component', subStat: 'shared UI components — buttons, cards, tables' },
  { label: 'Documented', value: '84', icon: 'book-open', subStat: 'components with a Storybook page' },
  { label: 'Screens', value: '171', icon: 'layout-dashboard', subStat: 'working pages across 11 modules' },
  { label: 'Design tokens', value: '297', icon: 'palette', subStat: 'colors, spacing, type — defined in one place' },
  { label: 'Themes', value: '2', icon: 'moon-star', subStat: 'light and dark, from the same tokens' },
  { label: 'Routes', value: '185+', icon: 'route', subStat: 'every screen has a shareable link' },
]
</script>

<template>
  <DeckSlide eyebrow="Current state" title="What's in the sandbox today.">
    <v-row>
      <v-col v-for="(stat, i) in STATS" :key="stat.label" cols="12" sm="6" lg="4">
        <MpKpiCard
          :label="stat.label"
          :value="stat.value"
          :icon="stat.icon"
          :sub-stat="stat.subStat"
          class="h-100 cine"
          :style="{ '--ci': 1.2 + i * 0.4 }"
        />
      </v-col>
    </v-row>
    <p class="s06__footnote mt-4 cine--soft" :style="{ '--ci': 4 }">
      Worth noting: these six cards are the actual MpKpiCard component from our dashboards —
      this deck is built with the same system it's presenting.
    </p>
  </DeckSlide>
</template>

<style scoped>
.s06__footnote {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: var(--mp-fontSize-14);
}
</style>
