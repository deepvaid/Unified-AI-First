<script setup lang="ts">
withDefaults(defineProps<{
  icon?: string
  title?: string
  description?: string
  actionLabel?: string
  actionIcon?: string
}>(), {
  icon: 'alert-triangle',
  title: 'Something went wrong',
  actionLabel: 'Try again',
  actionIcon: 'refresh-cw',
})

defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="mp-error-state d-flex flex-column align-center justify-center text-center pa-8" role="alert">
    <div class="mp-error-state__icon mb-4">
      <v-icon size="56" color="error">{{ icon }}</v-icon>
    </div>
    <div class="text-h6 font-weight-bold mb-2">{{ title }}</div>
    <div v-if="description" class="text-body-2 text-medium-emphasis mp-error-state__description">
      {{ description }}
    </div>
    <v-btn
      v-if="actionLabel"
      class="text-none mt-5"
      color="primary"
      variant="flat"
      :prepend-icon="actionIcon"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </v-btn>
  </div>
</template>

<style scoped>
.mp-error-state {
  min-height: 240px;
  width: 100%;
}

.mp-error-state__icon {
  width: 80px;
  height: 80px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(var(--v-theme-error), 0.08);
}

.mp-error-state__description {
  max-width: 420px;
  line-height: 1.5;
}
</style>
