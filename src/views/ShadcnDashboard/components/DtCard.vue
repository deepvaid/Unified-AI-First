<script setup lang="ts">
// Card shell for the dotted Overview v2 widgets — geometry from the mockup:
// 22/24px padding, 18px internal gap, 15px/600 title, 12.5px muted subtitle.
defineProps<{ title?: string; subtitle?: string }>()
</script>

<template>
  <section class="dt-card">
    <header v-if="title || $slots.action" class="dt-card__header">
      <div class="dt-card__heading">
        <h2 v-if="title" class="dt-card__title">{{ title }}</h2>
        <p v-if="subtitle" class="dt-card__sub">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.action" class="dt-card__action"><slot name="action" /></div>
    </header>
    <slot />
    <footer v-if="$slots.footer" class="dt-card__footer"><slot name="footer" /></footer>
  </section>
</template>

<style scoped>
.dt-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 22px 24px;
  border: 1px solid var(--scn-border);
  border-radius: var(--scn-radius);
  background: var(--scn-card);
  min-width: 0;
  height: 100%;
}

.dt-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.dt-card__heading {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.dt-card__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.012em;
  color: var(--scn-fg);
}

.dt-card__sub {
  margin: 0;
  font-size: 12.5px;
  color: var(--scn-muted);
}

.dt-card__action {
  flex-shrink: 0;
}

.dt-card__footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--scn-border);
  display: flex;
  gap: 24px;
  align-items: center;
}
</style>
