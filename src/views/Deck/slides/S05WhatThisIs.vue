<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'

const IS = [
  'The approved visual direction, running as real Vue 3 + Vuetify code',
  'A proving ground — recipes, tokens, interactions, dark mode, a11y baseline',
  "The acceptance reference for what 'done' looks like",
]

const IS_NOT = [
  'A production npm package — LiquidSky stays the shared foundation',
  'A backend — every byte of data is mock, on purpose',
  'A big-bang rewrite proposal',
]
</script>

<template>
  <DeckSlide eyebrow="Ground rules" title="A working reference, not another library.">
    <v-row>
      <v-col cols="12" md="6">
        <v-card flat border rounded="lg" class="pa-6 h-100">
          <div class="mp-eyebrow mb-4 text-success">What it is</div>
          <div v-for="item in IS" :key="item" class="s05__row">
            <v-icon size="20" color="success" class="mt-1">check-circle</v-icon>
            <span>{{ item }}</span>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card flat border rounded="lg" class="pa-6 h-100">
          <div class="mp-eyebrow mb-4">What it isn't</div>
          <div v-for="item in IS_NOT" :key="item" class="s05__row s05__row--muted">
            <v-icon size="20" class="mt-1 text-medium-emphasis">circle-x</v-icon>
            <span>{{ item }}</span>
          </div>
        </v-card>
      </v-col>
    </v-row>
    <p class="s05__footnote mt-6">
      That separation is deliberate — it's what lets us move fast here without creating a second
      source of truth out there.
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
