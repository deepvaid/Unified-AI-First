<script setup lang="ts">
import DvOrbitOrb from './voice/DvOrbitOrb.vue'

// Shared Da Vinci front page — identity orb, gradient greeting, suggestion
// chips. Used by both the text-mode landing (MpDaVinciBot) and the voice-mode
// ready state (DvOrbitVoiceSurface); only the host footer differs.
withDefaults(
  defineProps<{
    /** First name shown in the greeting ("Hi Ross,") */
    name?: string
    /** Gradient second line */
    prompt?: string
    /** Suggestion chips (2-column grid) */
    suggestions?: string[]
    /** Identity orb size in px */
    orbSize?: number
  }>(),
  {
    name: 'Ross',
    prompt: 'what should we look at?',
    suggestions: () => [],
    orbSize: 104,
  },
)

const emit = defineEmits<{ suggestion: [text: string] }>()
</script>

<template>
  <div class="dv-hero">
    <DvOrbitOrb :size="orbSize" />
    <h2 class="dv-hero__hi">Hi {{ name }},</h2>
    <div class="dv-hero__ask">{{ prompt }}</div>
    <span class="dv-hero__rule" aria-hidden="true"></span>
    <div v-if="suggestions.length" class="dv-hero__chips">
      <button
        v-for="text in suggestions"
        :key="text"
        type="button"
        class="dv-hero__chip"
        @click="emit('suggestion', text)"
      >
        {{ text }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.dv-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.dv-hero__hi {
  margin: 32px 0 0;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.18;
  letter-spacing: -0.5px;
  color: rgb(var(--v-theme-on-surface));
}

.dv-hero__ask {
  font-size: 34px;
  font-weight: 700;
  line-height: 1.18;
  letter-spacing: -0.5px;
  background: var(--dv-hero-grad);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.dv-hero__rule {
  width: 170px;
  height: 4px;
  border-radius: 999px;
  background: var(--dv-hero-grad);
  margin-top: 18px;
}

.dv-hero__chips {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 26px;
  max-width: 340px;
}

.dv-hero__chip {
  border: 1px solid var(--dv-border);
  border-radius: 999px;
  background: rgb(var(--v-theme-surface));
  padding: 9px 14px;
  font-size: var(--mp-typography-fontSize-sm);
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.dv-hero__chip:hover {
  border-color: var(--dv-accent);
  background: var(--dv-accent-soft);
}
</style>
