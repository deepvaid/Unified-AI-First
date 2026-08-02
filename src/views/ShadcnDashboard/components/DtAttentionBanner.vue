<script setup lang="ts">
// Collapsible "needs your attention" banner from the dotted Overview v2 mockup.
import { ref } from 'vue'
import type { AttentionItem } from '../dottedDemoData'

defineProps<{ items: AttentionItem[]; summary: string }>()

const open = ref(true)
</script>

<template>
  <section class="dt-attn">
    <button type="button" class="dt-attn__toggle" @click="open = !open">
      <span class="dt-attn__dot" aria-hidden="true" />
      <span class="dt-attn__count">{{ items.length }} things need your attention</span>
      <span class="dt-attn__summary">{{ summary }}</span>
      <span class="dt-attn__spacer" />
      <span class="dt-attn__state">
        {{ open ? 'Hide' : 'Show' }}
        <v-icon size="15" :class="{ 'dt-attn__chev--open': open }" class="dt-attn__chev" aria-hidden="true">chevron-down</v-icon>
      </span>
    </button>
    <div v-if="open" class="dt-attn__list">
      <div v-for="item in items" :key="item.title" class="dt-attn__row">
        <span class="dt-attn__icon" :class="`dt-attn__icon--${item.tone}`">
          <v-icon size="14">{{ item.icon }}</v-icon>
        </span>
        <div class="dt-attn__text">
          <span class="dt-attn__title">{{ item.title }}</span>
          <span class="dt-attn__context">{{ item.context }}</span>
        </div>
        <span class="dt-attn__spacer" />
        <span class="dt-attn__ago">{{ item.ago }}</span>
        <v-btn variant="outlined" size="small" class="dt-attn__action text-none">{{ item.actionLabel }}</v-btn>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dt-attn {
  border: 1px solid var(--scn-border);
  border-radius: var(--scn-radius);
  background: var(--scn-card);
  overflow: hidden;
}

.dt-attn__toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border: 0;
  background: transparent;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.dt-attn__dot {
  width: 7px;
  height: 7px;
  border-radius: 99px;
  background: var(--neg);
  flex: none;
}

.dt-attn__count {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--scn-fg);
}

.dt-attn__summary {
  font-size: 13px;
  color: var(--scn-muted);
}

.dt-attn__spacer {
  flex: 1;
}

.dt-attn__state {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--scn-muted);
}

.dt-attn__chev {
  transition: transform 0.15s ease;
}

.dt-attn__chev--open {
  transform: rotate(180deg);
}

.dt-attn__list {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--scn-border);
}

.dt-attn__row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px 20px;
}

.dt-attn__row + .dt-attn__row {
  border-top: 1px solid var(--scn-border);
}

.dt-attn__row:hover {
  background: var(--scn-soft);
}

.dt-attn__icon {
  width: 26px;
  height: 26px;
  flex: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dt-attn__icon--error {
  background: rgba(192, 57, 43, 0.1);
  color: var(--neg);
}

.dt-attn__icon--warning {
  background: rgba(201, 122, 22, 0.14);
  color: rgb(var(--v-theme-warning));
}

.dt-attn__icon--accent {
  background: rgba(0, 146, 212, 0.1);
  color: var(--accent);
}

.dt-attn__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.dt-attn__title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--scn-fg);
}

.dt-attn__context {
  font-size: 12.5px;
  color: var(--scn-muted);
}

.dt-attn__ago {
  font-size: 12px;
  color: var(--scn-muted);
  white-space: nowrap;
}

.dt-attn__action {
  flex: none;
}
</style>
