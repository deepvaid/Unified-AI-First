<script setup lang="ts">
// Reference-styled card shell for every lab widget: soft radius-20 surface,
// icon chip + title header, decorative "…" affordance. Route-local — keeps the
// lab fully isolated from production components.
defineProps<{
  title: string
  subtitle?: string
  icon?: string
}>()
</script>

<template>
  <section class="lab-frame">
    <header class="lab-frame__head">
      <div class="lab-frame__id">
        <span v-if="icon" class="lab-frame__chip" aria-hidden="true">
          <v-icon size="15">{{ icon }}</v-icon>
        </span>
        <div class="lab-frame__titles">
          <h3 class="lab-frame__title">{{ title }}</h3>
          <p v-if="subtitle" class="lab-frame__subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <div class="lab-frame__aside">
        <slot name="aside">
          <span class="lab-frame__more" aria-hidden="true">
            <v-icon size="16">ellipsis</v-icon>
          </span>
        </slot>
      </div>
    </header>
    <div class="lab-frame__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.lab-frame {
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03), 0 10px 28px rgba(15, 23, 42, 0.04);
  padding: 20px 22px 22px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
}

.lab-frame__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.lab-frame__id {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.lab-frame__chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--surface-secondary);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.lab-frame__title {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lab-frame__subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin: 2px 0 0;
}

.lab-frame__aside {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.lab-frame__more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
}

.lab-frame__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
</style>
