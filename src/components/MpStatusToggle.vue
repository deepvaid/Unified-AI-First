<script setup lang="ts">
import { computed, useId } from 'vue'

const props = defineProps<{
  status: 'Active' | 'Paused' | 'Draft'
}>()

const emit = defineEmits<{
  toggle: []
}>()

const labelId = useId()

const labelClass = computed(() =>
  props.status === 'Active' ? 'text-success' : props.status === 'Paused' ? 'text-warning' : 'text-medium-emphasis',
)
</script>

<template>
  <div class="d-flex align-center gap-2">
    <v-switch
      :model-value="status === 'Active'"
      color="success"
      density="compact"
      hide-details
      :disabled="status === 'Draft'"
      :aria-label="status === 'Active' ? 'Pause' : 'Activate'"
      :aria-describedby="labelId"
      @update:model-value="emit('toggle')"
    ></v-switch>
    <span :id="labelId" class="text-caption font-weight-medium" :class="labelClass">{{ status }}</span>
  </div>
</template>
