<script setup lang="ts">
const props = defineProps<{
  /** Ordered step labels. */
  steps: string[]
  /** 1-based index of the currently active step. */
  current: number
  /** When true, visited steps (<= maxStep) become clickable and emit `select`. */
  clickable?: boolean
  /** Highest 1-based step reached; steps up to this are jumpable. Defaults to `current`. */
  maxStep?: number
}>()

const emit = defineEmits<{ select: [step: number] }>()

function canJump(oneBased: number) {
  return !!props.clickable && oneBased <= (props.maxStep ?? props.current)
}
function onSelect(oneBased: number) {
  if (canJump(oneBased)) emit('select', oneBased)
}
</script>

<template>
  <div class="d-flex align-center gap-2" role="list" aria-label="Wizard steps">
    <template v-for="(label, index) in steps" :key="index">
      <div v-if="index > 0" class="mp-wizard-step__rail"></div>
      <component
        :is="canJump(index + 1) ? 'button' : 'div'"
        type="button"
        class="mp-wizard-step"
        :class="{
          'mp-wizard-step--active': current === index + 1,
          'mp-wizard-step--done': current > index + 1,
          'mp-wizard-step--jumpable': canJump(index + 1),
        }"
        role="listitem"
        :aria-current="current === index + 1 ? 'step' : undefined"
        @click="onSelect(index + 1)"
      >
        <span class="mp-wizard-step__num">
          <v-icon v-if="current > index + 1" size="12">check</v-icon>
          <template v-else>{{ index + 1 }}</template>
        </span>
        {{ label }}
        <span v-if="current > index + 1" class="d-sr-only">(completed)</span>
      </component>
    </template>
  </div>
</template>

<style scoped>
.mp-wizard-step {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.5);
  background: none;
  border: 0;
  padding: 0;
  font-family: inherit;
}
button.mp-wizard-step--jumpable {
  cursor: pointer;
}
button.mp-wizard-step--jumpable:hover {
  color: rgb(var(--v-theme-on-surface));
}
button.mp-wizard-step--jumpable:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 3px;
  border-radius: 4px;
}
.mp-wizard-step__num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.25);
  font-size: 0.6875rem;
  font-weight: 700;
}
.mp-wizard-step--active {
  color: rgb(var(--v-theme-on-surface));
}
.mp-wizard-step--active .mp-wizard-step__num {
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
.mp-wizard-step--done .mp-wizard-step__num {
  background: rgba(var(--v-theme-primary), 0.12);
  border-color: transparent;
  color: rgb(var(--v-theme-primary));
}
.mp-wizard-step__rail {
  width: 32px;
  height: 1.5px;
  background: rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Small screens: step chips collapse to numbers so toolbars fit */
@media (max-width: 700px) {
  .mp-wizard-step {
    font-size: 0;
    gap: 0;
  }
  .mp-wizard-step__rail {
    width: 14px;
  }
}
</style>
