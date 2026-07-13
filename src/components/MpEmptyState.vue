<script setup lang="ts">
import { computed, useSlots } from 'vue'
import MpIllustration, { type IllustrationName } from './MpIllustration.vue'

const props = withDefaults(defineProps<{
  icon?: string
  title: string
  description?: string
  actionLabel?: string
  actionIcon?: string
  /** Heading level announced to assistive tech (role="heading" + aria-level). */
  headingLevel?: number
  /** Visual treatment: 'default' (icon + text), 'expressive' (illustration-led), 'launcher' (menu of starting points via default slot). */
  variant?: 'default' | 'expressive' | 'launcher'
  /** Named MpIllustration to render in the 'expressive' variant (or via the #illustration slot in any variant). */
  illustration?: IllustrationName
}>(), {
  headingLevel: 2,
  variant: 'default',
})

defineEmits<{
  action: []
}>()

const slots = useSlots()

const hasIllustration = computed(
  () => !!slots.illustration || (props.variant === 'expressive' && !!props.illustration),
)
</script>

<template>
  <div
    class="mp-empty-state d-flex flex-column align-center justify-center text-center"
    :class="`mp-empty-state--${variant}`"
  >
    <div v-if="hasIllustration" class="mp-empty-state__illustration">
      <slot name="illustration">
        <MpIllustration v-if="illustration" :name="illustration" :size="180" />
      </slot>
    </div>
    <div v-else-if="icon" class="mp-empty-state__icon">
      <v-icon :size="40" color="medium-emphasis">{{ icon }}</v-icon>
    </div>

    <div class="mp-empty-state__title" role="heading" :aria-level="headingLevel">{{ title }}</div>

    <div v-if="description" class="text-body-2 text-medium-emphasis mp-empty-state__description">
      {{ description }}
    </div>

    <div v-if="variant === 'launcher'" class="mp-empty-state__launcher">
      <slot />
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
.mp-empty-state {
  min-height: 240px;
  width: 100%;
  padding: 32px;
}

.mp-empty-state__icon {
  margin-bottom: 16px;
}

.mp-empty-state__illustration {
  margin-bottom: 20px;
}

.mp-empty-state__title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.3;
  margin-bottom: 8px;
}

.mp-empty-state__description {
  max-width: 420px;
  line-height: 1.5;
}

/* Expressive — illustration-led, larger measure and title */
.mp-empty-state--expressive {
  min-height: 320px;
  padding: 48px;
}

.mp-empty-state--expressive .mp-empty-state__title {
  font-size: 22px;
  font-weight: 750;
  letter-spacing: -0.015em;
}

/* Launcher — a vertical menu of starting points below the copy */
.mp-empty-state--launcher .mp-empty-state__title {
  font-size: 20px;
  font-weight: 750;
}

.mp-empty-state__launcher {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 480px;
  margin-top: 20px;
}
</style>
