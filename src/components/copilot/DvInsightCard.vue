<script setup lang="ts">
defineProps<{
  icon?: string
  headline: string
  description: string
  actionLabel?: string
  severity?: 'info' | 'warning' | 'success' | 'error'
}>()

const emit = defineEmits<{
  action: []
}>()

// Use Vuetify semantic color names — no hardcoded hex
const severityColor: Record<string, string> = {
  info: 'info',
  warning: 'warning',
  success: 'success',
  error: 'error',
}
</script>

<template>
  <v-card
    variant="tonal"
    :color="severityColor[severity || 'info']"
    class="insight-card"
  >
    <v-card-text class="pa-4">
      <div class="d-flex align-start ga-3">
        <v-icon :color="severityColor[severity || 'info']" size="22">{{ icon || 'lightbulb' }}</v-icon>
        <div class="flex-grow-1">
          <div class="text-subtitle-2 font-weight-bold mb-1">{{ headline }}</div>
          <div class="text-body-2 text-medium-emphasis mb-2" style="line-height: var(--mp-lineHeight-normal);">{{ description }}</div>
          <v-btn
            v-if="actionLabel"
            :color="severityColor[severity || 'info']"
            variant="tonal"
            size="small"
            class="text-none"
            @click="emit('action')"
          >
            {{ actionLabel }}
          </v-btn>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.v-card.insight-card { border-radius: var(--mp-radius-12) !important; }
</style>
