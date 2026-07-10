<script setup lang="ts">
import { computed } from 'vue';
import type { MbBadgeIcon, MbBadgeProps, MbBadgeVariant } from './MbBadge.types';
import '../styles/mb-badge.css';

const props = withDefaults(defineProps<MbBadgeProps>(), {
  label: 'Premium',
  tone: 'additional',
  variant: 'outline',
  icon: 'star',
  interactive: false,
  disabled: false,
  ariaLabel: undefined
});

const emit = defineEmits<{
  (event: 'click', payload: MouseEvent): void;
}>();

const resolvedVariant = computed<MbBadgeVariant>(() => props.variant);

const isDisabled = computed(() => props.disabled || !props.interactive);
const icon = computed<MbBadgeIcon>(() => props.icon);
const ariaLabel = computed(() => props.ariaLabel ?? props.label);

function onClick(event: MouseEvent) {
  if (props.disabled) {
    event.preventDefault();
    return;
  }

  emit('click', event);
}
</script>

<template>
  <button
    type="button"
    class="mb-badge"
    :data-tone="tone"
    :data-variant="resolvedVariant"
    :data-interactive="interactive ? 'true' : 'false'"
    :disabled="isDisabled"
    :aria-label="ariaLabel"
    @click="onClick"
  >
    <span v-if="icon !== 'none'" class="mb-badge__icon" aria-hidden="true">
      <svg v-if="icon === 'star'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 3.4L14.7 8.8L20.7 9.7L16.4 13.9L17.4 19.9L12 17.1L6.6 19.9L7.6 13.9L3.3 9.7L9.3 8.8L12 3.4Z"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linejoin="round"
        />
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />
        <path d="M12 7.8V12.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        <circle cx="12" cy="16.2" r="1.1" fill="currentColor" />
      </svg>
    </span>
    <span class="mb-badge__label">{{ label }}</span>
  </button>
</template>
