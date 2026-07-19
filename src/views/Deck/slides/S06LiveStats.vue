<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'

const STATS = [
  { label: 'Building blocks', value: '89', icon: 'component', subStat: 'buttons, cards, tables — made once, used everywhere' },
  { label: 'Instruction cards', value: '84', icon: 'book-open', subStat: 'every block comes with its own manual page' },
  { label: 'Finished screens', value: '171', icon: 'layout-dashboard', subStat: 'real pages you can open and click today' },
  { label: 'Design decisions', value: '297', icon: 'palette', subStat: 'colors & spacing decided once, in one place' },
  { label: 'Looks', value: '2', icon: 'moon-star', subStat: 'light and dark — one switch flips everything' },
  { label: 'Web addresses', value: '185+', icon: 'route', subStat: 'every screen has a link you can share in chat' },
]
</script>

<template>
  <DeckSlide eyebrow="Counted, not claimed" title="89 building blocks. One voice.">
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
      A small confession: these six cards aren't a chart someone drew. They're the real thing —
      the same cards our dashboards use. The deck is built from the product it's presenting.
    </p>
  </DeckSlide>
</template>

<style scoped>
.s06__footnote {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: var(--mp-typography-fontSize-body);
}
</style>
