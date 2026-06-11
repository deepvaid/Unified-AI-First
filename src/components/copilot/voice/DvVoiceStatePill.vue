<script setup lang="ts">
import { computed } from 'vue'
import type { VoiceState } from '@/composables/useDaVinciVoice'

const props = withDefaults(
  defineProps<{
    state: VoiceState
    /** Overrides the default state label (e.g. a live caption while speaking) */
    label?: string
    /** minimal = tiny pip + uppercase mono label (Marojarvis statepill) */
    variant?: 'pill' | 'dot' | 'minimal'
  }>(),
  { label: undefined, variant: 'pill' },
)

const stateConfig: Record<VoiceState, { icon: string; text: string }> = {
  idle: { icon: 'sparkles', text: 'Idle' },
  listening: { icon: 'mic', text: 'Listening…' },
  thinking: { icon: 'loader', text: 'Thinking…' },
  speaking: { icon: 'audio-lines', text: 'Speaking…' },
}

const config = computed(() => stateConfig[props.state])
const text = computed(() => props.label ?? config.value.text)
const isActive = computed(() => props.state !== 'idle')
const isCaption = computed(() => props.state === 'speaking' && !!props.label)
</script>

<template>
  <span
    v-if="variant === 'dot'"
    class="dv-state-dot"
    :class="[`dv-state-dot--${state}`]"
    role="status"
    :aria-label="text"
  />
  <div
    v-else-if="variant === 'minimal'"
    class="dv-state-min"
    :class="[`dv-state-min--${state}`]"
    role="status"
  >
    <span class="dv-state-min__pip" aria-hidden="true"></span>
    <span class="dv-state-min__text" :class="{ 'dv-state-min__text--caption': isCaption }">{{ text }}</span>
  </div>
  <div
    v-else
    class="dv-state-pill"
    :class="{ 'dv-state-pill--active': isActive, [`dv-state-pill--${state}`]: true }"
    role="status"
  >
    <v-icon size="13" :class="{ 'dv-state-pill__spin': state === 'thinking' }">{{ config.icon }}</v-icon>
    <span class="dv-state-pill__text">{{ text }}</span>
  </div>
</template>

<style scoped>
.dv-state-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 13px;
  border-radius: 999px;
  border: 1px solid var(--dv-border);
  background: rgb(var(--v-theme-surface));
  color: var(--dv-text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.dv-state-pill--active {
  background: var(--dv-accent-soft);
  color: var(--dv-accent);
  border-color: transparent;
}

.dv-state-pill__text {
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dv-state-pill__spin {
  animation: dv-pill-spin 1.1s linear infinite;
}

.dv-state-pill--listening .v-icon,
.dv-state-pill--speaking .v-icon {
  animation: dv-pill-pulse 1.4s ease infinite;
}

/* ── minimal variant — tiny pip + uppercase mono label (Marojarvis statepill) ── */
.dv-state-min {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: ui-monospace, 'SF Mono', SFMono-Regular, Menlo, monospace;
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--dv-text-secondary);
}

.dv-state-min__pip {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dv-text-secondary);
  transition: background 0.4s ease, box-shadow 0.4s ease;
}

.dv-state-min--listening .dv-state-min__pip {
  background: var(--dv-accent);
  box-shadow: 0 0 0 3px var(--dv-accent-soft);
  animation: dv-min-pulse 1.4s cubic-bezier(0.22, 1, 0.36, 1) infinite;
}

.dv-state-min--thinking .dv-state-min__pip {
  background: var(--dv-text-secondary);
  animation: dv-min-pulse 1s ease infinite;
}

.dv-state-min--speaking .dv-state-min__pip {
  background: var(--dv-text-secondary);
  animation: dv-min-pulse 0.7s ease infinite;
}

.dv-state-min__text {
  max-width: min(520px, 86vw);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* live speech caption — drops the uppercase mono treatment (prototype #statetext) */
.dv-state-min__text--caption {
  font-family: inherit;
  font-size: 0.78rem;
  letter-spacing: 0.01em;
  text-transform: none;
  color: var(--dv-text-primary);
}

@keyframes dv-min-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.55);
    opacity: 0.55;
  }
}

.dv-state-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--dv-muted);
  transition: background 0.2s ease;
}

.dv-state-dot--listening,
.dv-state-dot--speaking {
  background: var(--dv-accent);
  animation: dv-pill-pulse 1.4s ease infinite;
}

.dv-state-dot--thinking {
  background: var(--dv-accent);
  opacity: 0.6;
}

@keyframes dv-pill-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes dv-pill-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dv-state-pill__spin,
  .dv-state-pill--listening .v-icon,
  .dv-state-pill--speaking .v-icon,
  .dv-state-dot--listening,
  .dv-state-dot--speaking,
  .dv-state-min__pip {
    animation: none;
  }
}
</style>
