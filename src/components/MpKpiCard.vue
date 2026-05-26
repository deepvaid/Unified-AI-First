<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value: string | number
  icon?: string
  color?: string
  trend?: string
  trendPositive?: boolean
  subStat?: string
}>()

const VALID_COLORS = new Set(['primary', 'success', 'info', 'warning', 'secondary', 'error', 'default'])

const tone = computed(() => {
  const c = props.color ?? 'primary'
  return VALID_COLORS.has(c) ? c : 'primary'
})

const trendUp = computed(() => props.trendPositive !== false)
</script>

<template>
  <v-card flat border rounded="lg" class="mp-kpi-card pa-5 h-100 d-flex flex-column">
    <div class="d-flex align-center ga-3 mb-3">
      <div v-if="icon" class="mp-kpi-card__icon" :class="`mp-kpi-card__icon--${tone}`">
        <v-icon size="20">{{ icon }}</v-icon>
      </div>
      <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mp-kpi-card__label">
        {{ label }}
      </div>
    </div>

    <div class="text-h5 font-weight-bold mp-kpi-card__value">{{ value }}</div>

    <div v-if="trend" class="d-flex align-center ga-1 mt-2">
      <v-icon size="14" :color="trendUp ? 'success' : 'error'">
        {{ trendUp ? 'trending-up' : 'trending-down' }}
      </v-icon>
      <span class="text-caption font-weight-medium" :class="trendUp ? 'text-success' : 'text-error'">
        {{ trend }}
      </span>
    </div>

    <div v-if="subStat" class="text-caption text-medium-emphasis mt-2">{{ subStat }}</div>

    <slot />
  </v-card>
</template>

<style scoped>
.mp-kpi-card {
  background: rgb(var(--v-theme-surface));
}

.mp-kpi-card__icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mp-kpi-card__icon--primary {
  background: rgba(var(--v-theme-primary), 0.10);
  color: rgb(var(--v-theme-primary));
}

.mp-kpi-card__icon--success {
  background: rgba(var(--v-theme-success), 0.12);
  color: rgb(var(--v-theme-success));
}

.mp-kpi-card__icon--info {
  background: rgba(var(--v-theme-info), 0.12);
  color: rgb(var(--v-theme-info));
}

.mp-kpi-card__icon--warning {
  background: rgba(var(--v-theme-warning), 0.14);
  color: rgb(var(--v-theme-warning));
}

.mp-kpi-card__icon--secondary {
  background: rgba(var(--v-theme-secondary), 0.12);
  color: rgb(var(--v-theme-secondary));
}

.mp-kpi-card__icon--error {
  background: rgba(var(--v-theme-error), 0.12);
  color: rgb(var(--v-theme-error));
}

.mp-kpi-card__icon--default {
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgb(var(--v-theme-on-surface-variant));
}

.mp-kpi-card__label {
  letter-spacing: 0.04em;
}

.mp-kpi-card__value {
  line-height: 1.2;
  color: rgb(var(--v-theme-on-surface));
}
</style>
