<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'

const IS = [
  'A real, working preview of how our product should feel — everything you saw tonight is clickable.',
  'Built from one shared rulebook: the same colors, spacing and voice on every single screen.',
  'Our reference for "this is what good looks like" — so we stop debating taste and start pointing.',
]

const IS_NOT = [
  'Not a rewrite of the product — nothing breaks tomorrow morning.',
  'Not real customer data — it is a safe playground, on purpose.',
  'Not extra homework for your teams — it is a head start they inherit.',
]
</script>

<template>
  <DeckSlide eyebrow="A promise, in plain words" title="What this is — and what it isn't.">
    <v-row>
      <v-col cols="12" md="6">
        <v-card flat border rounded="lg" class="pa-6 h-100 cine" :style="{ '--ci': 1.2 }">
          <div class="mp-eyebrow mb-4 text-success">It is</div>
          <div v-for="(item, i) in IS" :key="item" class="s05__row cine" :style="{ '--ci': 1.6 + i * 0.5 }">
            <v-icon size="20" color="success" class="mt-1">check-circle</v-icon>
            <span>{{ item }}</span>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card flat border rounded="lg" class="pa-6 h-100 cine" :style="{ '--ci': 1.4 }">
          <div class="mp-eyebrow mb-4">It isn't</div>
          <div v-for="(item, i) in IS_NOT" :key="item" class="s05__row s05__row--muted cine" :style="{ '--ci': 1.8 + i * 0.5 }">
            <v-icon size="20" class="mt-1 text-medium-emphasis">circle-x</v-icon>
            <span>{{ item }}</span>
          </div>
        </v-card>
      </v-col>
    </v-row>
    <p class="s05__footnote mt-6 cine--soft" :style="{ '--ci': 3.4 }">
      That split is deliberate: it lets us move fast and dream here, without putting a single
      customer at risk out there.
    </p>
  </DeckSlide>
</template>

<style scoped>
.s05__row {
  display: flex;
  gap: var(--mp-spacing-3);
  padding: var(--mp-spacing-3) 0;
  font-size: var(--mp-typography-fontSize-md);
  line-height: var(--mp-typography-lineHeight-normal);
}

.s05__row--muted {
  color: rgb(var(--v-theme-on-surface-variant));
}

.s05__footnote {
  max-width: 720px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: var(--mp-typography-fontSize-body);
}
</style>
