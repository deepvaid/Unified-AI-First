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
  /**
   * Structure. 'stack' is the centred icon/illustration + copy + action column;
   * 'launcher' adds a vertical menu of starting points (default slot) under the copy.
   * Structural alternatives only — visual weight lives on `emphasis` (P2-7).
   */
  variant?: 'stack' | 'launcher'
  /**
   * Visual weight. 'prominent' is the illustration-led, larger-measure treatment for
   * high-visibility first-run moments. Shared system-wide vocabulary (P2-7).
   */
  emphasis?: 'default' | 'prominent'
  /** Named MpIllustration to render when `emphasis="prominent"` (or via the #illustration slot in any variant). */
  illustration?: IllustrationName
  /** Tone of the leading glyph — 'error' renders it in the error colour on a soft disc (used by MpErrorState). */
  tone?: 'neutral' | 'error'
}>(), {
  headingLevel: 2,
  variant: 'stack',
  emphasis: 'default',
  tone: 'neutral',
})

defineEmits<{
  action: []
}>()

const slots = useSlots()

const hasIllustration = computed(
  () => !!slots.illustration || (props.emphasis === 'prominent' && !!props.illustration),
)
</script>

<template>
  <div
    class="mp-empty-state d-flex flex-column align-center justify-center text-center"
    :class="[`mp-empty-state--${variant}`, `mp-empty-state--${emphasis}`, `mp-empty-state--tone-${tone}`]"
  >
    <div v-if="hasIllustration" class="mp-empty-state__illustration">
      <slot name="illustration">
        <MpIllustration v-if="illustration" :name="illustration" :size="180" />
      </slot>
    </div>
    <div v-else-if="icon" class="mp-empty-state__icon">
      <v-icon :size="40" :color="tone === 'error' ? 'error' : undefined" class="text-medium-emphasis">{{ icon }}</v-icon>
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
      class="text-none mp-empty-state__action"
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
/* Geometry comes from component.state.* so every "nothing to show here" surface in
   the system — this, MpErrorState, SettingsPlaceholder — is the same shape (P3-1). */
.mp-empty-state {
  min-height: var(--mp-component-state-minHeight);
  width: 100%;
  padding: var(--mp-component-state-padding);
}

.mp-empty-state__icon {
  margin-bottom: var(--mp-space-16);
}

.mp-empty-state--tone-error .mp-empty-state__icon {
  width: var(--mp-component-state-iconDisc);
  height: var(--mp-component-state-iconDisc);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--mp-radius-full);
  background: var(--neg-soft);
}

.mp-empty-state__illustration {
  margin-bottom: var(--mp-space-20);
}

.mp-empty-state__title {
  font-size: var(--mp-fontSize-18);
  font-weight: var(--mp-fontWeight-bold);
  letter-spacing: -0.01em;
  line-height: 1.3;
  margin-bottom: var(--mp-component-state-gap);
}

.mp-empty-state__description {
  max-width: var(--mp-component-state-measure);
  line-height: 1.5;
}

.mp-empty-state__action {
  margin-top: var(--mp-space-20);
}

/* Prominent — illustration-led, larger measure and title. */
.mp-empty-state--prominent {
  min-height: var(--mp-component-state-minHeightProminent);
  padding: var(--mp-component-state-paddingProminent);
}

.mp-empty-state--prominent .mp-empty-state__title {
  font-size: var(--mp-fontSize-24);
  letter-spacing: -0.015em;
}

/* Launcher — a vertical menu of starting points below the copy. */
.mp-empty-state--launcher .mp-empty-state__title {
  font-size: var(--mp-fontSize-20);
}

.mp-empty-state__launcher {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-10);
  width: 100%;
  max-width: var(--mp-component-state-measureWide);
  margin-top: var(--mp-space-20);
}
</style>
