<script setup lang="ts">
// shadcn Card shell: header (title + muted description, optional action),
// content, footer — 24px paddings/gaps, 1px border, 14px radius, shadow-sm.
defineProps<{ title?: string; description?: string }>()
</script>

<template>
  <section class="scn-card">
    <header v-if="title || description || $slots.heading || $slots.action" class="scn-card__header">
      <div class="scn-card__heading">
        <slot name="heading">
          <h3 v-if="title" class="scn-card__title">{{ title }}</h3>
          <p v-if="description" class="scn-card__desc">{{ description }}</p>
        </slot>
      </div>
      <div v-if="$slots.action" class="scn-card__action"><slot name="action" /></div>
    </header>
    <div v-if="$slots.default" class="scn-card__content"><slot /></div>
    <footer v-if="$slots.footer" class="scn-card__footer"><slot name="footer" /></footer>
  </section>
</template>

<style scoped>
.scn-card {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px 0;
  background: var(--scn-card);
  border: 1px solid var(--scn-border);
  border-radius: var(--scn-radius);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  min-width: 0;
  height: 100%;
}

.scn-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 0 24px;
}

.scn-card__heading {
  min-width: 0;
}

.scn-card__title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--scn-fg);
  margin: 0;
}

.scn-card__desc {
  font-size: 14px;
  line-height: 1.4;
  color: var(--scn-muted);
  margin: 4px 0 0;
}

.scn-card__action {
  flex-shrink: 0;
}

.scn-card__content {
  padding: 0 24px;
  flex: 1;
  min-width: 0;
}

.scn-card__footer {
  padding: 0 24px;
}
</style>
