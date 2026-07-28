<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  value: string | number
  icon?: string
  color?: string
  trend?: string
  trendPositive?: boolean
  subStat?: string
  period?: string
  /** 'hero' renders the value at display scale (48px/800) for a single headline metric. */
  emphasis?: 'default' | 'hero'
}>(), {
  emphasis: 'default',
})

const VALID_COLORS = new Set([
  'primary', 'success', 'info', 'warning', 'secondary', 'error', 'default',
  // Source-cloud accents (from source-cloud-colors.css)
  'retail', 'marketing', 'contacts', 'analytics', 'commerce', 'service',
])

const tone = computed(() => {
  const c = props.color ?? 'primary'
  return VALID_COLORS.has(c) ? c : 'primary'
})

const trendUp = computed(() => props.trendPositive !== false)
</script>

<template>
  <v-card flat border rounded="lg" class="mp-kpi-card pa-5 h-100 d-flex flex-column">
    <div class="d-flex align-center ga-2 mb-3">
      <div v-if="icon" class="mp-kpi-card__icon" :class="`mp-kpi-card__icon--${tone}`">
        <v-icon size="20">{{ icon }}</v-icon>
      </div>
      <div class="min-width-0">
        <div class="mp-meta-label text-medium-emphasis mp-kpi-card__label">
          {{ label }}
        </div>
        <div v-if="period" class="text-caption text-medium-emphasis mp-kpi-card__period">{{ period }}</div>
      </div>
    </div>

    <div class="d-flex align-end ga-3 flex-grow-1">
      <div class="min-width-0 flex-grow-1">
        <div class="mp-kpi-card__value">
          <slot name="value">
            <span :class="emphasis === 'hero' ? 'mp-kpi-value--hero' : 'mp-kpi-value'">{{ value }}</span>
          </slot>
        </div>

        <div v-if="trend" class="d-flex align-center ga-1 mt-2">
          <v-icon size="14" :class="trendUp ? 'mp-kpi-card__trend-icon--positive' : 'mp-kpi-card__trend-icon--negative'">
            {{ trendUp ? 'trending-up' : 'trending-down' }}
          </v-icon>
          <span
            class="text-caption font-weight-medium"
            :class="trendUp ? 'mp-kpi-card__trend--positive' : 'mp-kpi-card__trend--negative'"
          >
            {{ trend }}
          </span>
        </div>

        <div v-if="subStat" class="text-caption text-medium-emphasis mt-2">{{ subStat }}</div>
      </div>

      <div v-if="$slots.sparkline" class="mp-kpi-card__sparkline">
        <slot name="sparkline" />
      </div>
    </div>

    <slot />
  </v-card>
</template>

<style scoped>
.mp-kpi-card {
  background: rgb(var(--v-theme-surface));
}

/* Ghost icon treatment — no tile, just a small tinted glyph. The number is the hero. */
.mp-kpi-card__icon {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mp-kpi-card__icon--primary { color: rgb(var(--v-theme-primary)); }
.mp-kpi-card__icon--success { color: rgb(var(--v-theme-success)); }
.mp-kpi-card__icon--info { color: rgb(var(--v-theme-info)); }
.mp-kpi-card__icon--warning { color: rgb(var(--v-theme-warning)); }
.mp-kpi-card__icon--secondary { color: rgb(var(--v-theme-secondary)); }
.mp-kpi-card__icon--error { color: rgb(var(--v-theme-error)); }
.mp-kpi-card__icon--default { color: rgb(var(--v-theme-on-surface-variant)); }

.mp-kpi-card__icon--retail { color: var(--cloud-retail-accent); }
.mp-kpi-card__icon--marketing { color: var(--cloud-marketing-accent); }
.mp-kpi-card__icon--contacts { color: var(--cloud-contacts-accent); }
.mp-kpi-card__icon--analytics { color: var(--cloud-analytics-accent); }
.mp-kpi-card__icon--commerce { color: var(--cloud-commerce-accent); }
.mp-kpi-card__icon--service { color: var(--cloud-service-accent); }

.mp-kpi-card__period {
  line-height: 1.3;
}

.mp-kpi-card__sparkline {
  width: 96px;
  flex-shrink: 0;
}

/* Wrapper owns the ink color; the .mp-kpi-value / --hero utility owns size + tabular figures. */
.mp-kpi-card__value {
  color: rgb(var(--v-theme-on-surface));
}

.mp-kpi-card__trend--positive,
.mp-kpi-card__trend-icon--positive {
  color: var(--pos);
}

.mp-kpi-card__trend--negative,
.mp-kpi-card__trend-icon--negative {
  color: var(--neg);
}
</style>
