<script setup lang="ts">
/** One way to pay — card, cash, gift card. A full-width row, one tap to choose. */
withDefaults(defineProps<{
  label: string
  icon: string
  selected?: boolean
}>(), {
  selected: false,
})
</script>

<template>
  <button
    type="button"
    class="pos-tender"
    :class="{ 'pos-tender--selected': selected }"
    :aria-pressed="selected"
  >
    <span class="pos-tender__icon">
      <v-icon size="20" aria-hidden="true">{{ icon }}</v-icon>
    </span>
    <span class="pos-tender__label">{{ label }}</span>
    <span class="pos-tender__check">
      <v-icon v-if="selected" size="18" aria-hidden="true">check</v-icon>
    </span>
  </button>
</template>

<style scoped>
.pos-tender {
  display: grid;
  grid-template-columns: var(--mp-space-40) 1fr var(--mp-space-24);
  align-items: center;
  gap: var(--mp-space-12);
  width: 100%;
  padding: var(--mp-space-12) var(--mp-space-14);
  border: 1px solid var(--mp-color-light-pos-hairline);
  border-radius: var(--mp-component-pos-radius-card);
  background: var(--mp-color-light-pos-surface);
  color: var(--mp-color-light-pos-ink);
  font-family: inherit;
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  text-align: left;
  cursor: pointer;
  transition:
    border-color var(--mp-motion-duration-instant),
    background var(--mp-motion-duration-instant);
}

.pos-tender:hover {
  border-color: rgba(var(--mp-rgb-color-light-pos-ink), 0.16);
  background: rgba(var(--mp-rgb-color-light-pos-ink), 0.03);
}

.pos-tender__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-40);
  height: var(--mp-space-40);
  border-radius: var(--mp-component-pos-radius-control);
  background: rgba(var(--mp-rgb-color-light-pos-ink), 0.06);
}

.pos-tender__check {
  display: flex;
  justify-content: center;
  color: var(--mp-color-light-pos-accentInk);
}

.pos-tender--selected,
.pos-tender--selected:hover {
  border-color: var(--mp-color-light-pos-accent);
  background: rgba(var(--mp-rgb-color-light-pos-accent), 0.06);
}

.pos-tender--selected .pos-tender__icon {
  background: var(--mp-color-light-pos-accent);
  color: var(--mp-color-light-pos-onAccent);
}
</style>
