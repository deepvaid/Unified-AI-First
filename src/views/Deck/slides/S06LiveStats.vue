<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'

const STATS = [
  { label: 'Components', value: '89', icon: 'component', subStat: '27 top-level Mp* compounds' },
  { label: 'Storybook stories', value: '84', icon: 'book-open', subStat: 'Storybook 9, autodocs + axe' },
  { label: 'Product screens', value: '171', icon: 'layout-dashboard', subStat: 'across 11 modules' },
  { label: 'Design tokens', value: '297', icon: 'palette', subStat: 'one tokens.json, generated everywhere' },
  { label: 'Themes', value: '2', icon: 'moon-star', subStat: 'light + dark, one flip' },
  { label: 'Routes', value: '185+', icon: 'route', subStat: 'every demo is deep-linkable' },
]
</script>

<template>
  <DeckSlide eyebrow="The inventory — live" title="This slide is rendered by the system it's counting.">
    <v-row>
      <v-col v-for="stat in STATS" :key="stat.label" cols="12" sm="6" lg="4">
        <MpKpiCard
          :label="stat.label"
          :value="stat.value"
          :icon="stat.icon"
          :sub-stat="stat.subStat"
          class="h-100"
        />
      </v-col>
    </v-row>
    <p class="s06__footnote mt-4">
      Six real MpKpiCards — the same component the dashboards use. No slideware was harmed.
    </p>
  </DeckSlide>
</template>

<style scoped>
.s06__footnote {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: var(--mp-typography-fontSize-body);
}
</style>
