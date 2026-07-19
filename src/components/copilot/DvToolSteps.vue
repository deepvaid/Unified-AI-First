<script setup lang="ts">
import { computed, ref } from 'vue'

export interface DvToolStep {
  label: string
  icon?: string
  status?: 'pending' | 'running' | 'done'
}

const props = withDefaults(
  defineProps<{
    steps: DvToolStep[]
    /** Start expanded (live generation view); collapsed for finished replies. */
    defaultOpen?: boolean
  }>(),
  {
    defaultOpen: false,
  },
)

const open = ref(props.defaultOpen)

const countLabel = computed(() => `${props.steps.length} ${props.steps.length === 1 ? 'step' : 'steps'}`)
const anyRunning = computed(() => props.steps.some((s) => s.status === 'running'))
</script>

<template>
  <div v-if="steps.length" class="dv-toolsteps">
    <button
      type="button"
      class="dv-toolsteps__toggle"
      :aria-expanded="open"
      @click="open = !open"
    >
      <v-icon size="14" class="dv-toolsteps__toggle-icon">layers</v-icon>
      <span>{{ countLabel }}</span>
      <span v-if="anyRunning" class="dv-toolsteps__working">Working on it…</span>
      <v-icon size="14" class="dv-toolsteps__chevron">{{ open ? 'chevron-up' : 'chevron-down' }}</v-icon>
    </button>

    <ul v-if="open" class="dv-toolsteps__list">
      <li
        v-for="(step, idx) in steps"
        :key="`${idx}-${step.label}`"
        class="dv-toolsteps__step"
        :class="`dv-toolsteps__step--${step.status ?? 'done'}`"
      >
        <span class="dv-toolsteps__step-icon" aria-hidden="true">
          <span v-if="step.status === 'running'" class="dv-toolsteps__dot"></span>
          <v-icon v-else size="14">{{ step.status === 'done' || !step.status ? 'check' : (step.icon ?? 'wrench') }}</v-icon>
        </span>
        {{ step.label }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.dv-toolsteps {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dv-toolsteps__toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 4px 8px 4px 4px;
  border: none;
  border-radius: var(--mp-borderRadius-full);
  background: transparent;
  font-size: var(--mp-typography-fontSize-sm);
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}

.dv-toolsteps__toggle:hover {
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface));
}

.dv-toolsteps__toggle:focus-visible {
  outline: 2px solid color-mix(in oklch, var(--dv-accent) 40%, transparent);
  outline-offset: 2px;
}

.dv-toolsteps__working {
  color: var(--dv-accent);
}

.dv-toolsteps__chevron {
  opacity: 0.7;
}

.dv-toolsteps__list {
  list-style: none;
  margin: 0;
  padding: 0 0 0 4px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dv-toolsteps__step {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--mp-typography-fontSize-sm);
  color: rgb(var(--v-theme-on-surface-variant));
}

.dv-toolsteps__step--running {
  color: rgb(var(--v-theme-on-surface));
  font-weight: 500;
}

.dv-toolsteps__step--pending {
  opacity: 0.55;
}

.dv-toolsteps__step-icon {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.dv-toolsteps__step--done .dv-toolsteps__step-icon {
  color: var(--dv-accent);
}

.dv-toolsteps__dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: var(--dv-accent);
  animation: dvToolStepPulse 1.2s ease-in-out infinite;
}

@keyframes dvToolStepPulse {
  0%, 100% { opacity: 0.5; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.1); }
}

@media (prefers-reduced-motion: reduce) {
  .dv-toolsteps__dot {
    animation: none;
  }
}
</style>
