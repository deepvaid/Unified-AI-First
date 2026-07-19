<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'

const IS = [
  'A working prototype environment — 171 real screens on our actual front-end stack (Vue 3 + Vuetify).',
  'One set of shared components and design tokens used consistently across every screen.',
  'Our visual reference for what approved design looks like going forward.',
]

const IS_NOT = [
  'Not a production rewrite — nothing changes for customers.',
  'Not connected to real data — it runs on sample data by design.',
  'Not a second library for teams to maintain — the plan is to converge into LiquidSky.',
]
</script>

<template>
  <DeckSlide eyebrow="Scope" title="What this is — and what it isn't.">
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
      This separation is deliberate — it lets us iterate quickly with zero production risk.
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
