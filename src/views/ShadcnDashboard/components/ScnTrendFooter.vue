<script setup lang="ts">
// shadcn CardFooter content: trend line (font-medium + 16px trend icon)
// over a muted caption line.
withDefaults(defineProps<{ trend: string; caption?: string; direction?: 'up' | 'down' | 'none' }>(), {
  direction: 'up',
})
</script>

<template>
  <div class="scn-trend">
    <div class="scn-trend__line">
      {{ trend }}
      <v-icon v-if="direction !== 'none'" size="16" aria-hidden="true">
        {{ direction === 'down' ? 'trending-down' : 'trending-up' }}
      </v-icon>
    </div>
    <div v-if="caption" class="scn-trend__caption">{{ caption }}</div>
  </div>
</template>

<style scoped>
.scn-trend {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
}

.scn-trend__line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  line-height: 1;
  color: var(--scn-fg);
}

.scn-trend__caption {
  color: var(--scn-muted);
  line-height: 1.3;
}
</style>
