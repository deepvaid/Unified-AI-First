<script setup lang="ts">
import { computed } from 'vue'
import { METHOD_MARKS } from '@/maropay/methodMarks'
import type { MethodMarkId } from '@/maropay/methodMarks'

// A payment method's brand tile: the brand colour with a glyph or initials in
// place of its artwork. Colours are tokens (`color.methodMark.<id>`), sizes are
// `component.methodMark.*`. Pass `decorative` when the method's name is already
// written beside the mark, so screen readers don't hear it twice.

const props = withDefaults(defineProps<{
  mark: MethodMarkId
  size?: 'sm' | 'md' | 'lg'
  decorative?: boolean
}>(), {
  size: 'md',
  decorative: false,
})

const spec = computed(() => METHOD_MARKS[props.mark] ?? METHOD_MARKS.card)
</script>

<template>
  <span
    class="maropay-mark"
    :class="[`maropay-mark--${spec.id}`, `maropay-mark--${size}`, `maropay-mark--${spec.tone}-tile`]"
    :role="decorative ? undefined : 'img'"
    :aria-label="decorative ? undefined : spec.name"
    :aria-hidden="decorative ? 'true' : undefined"
  >
    <v-icon v-if="spec.glyph" class="maropay-mark__glyph">{{ spec.glyph }}</v-icon>
    <span v-else class="maropay-mark__initials">{{ spec.initials }}</span>
  </span>
</template>

<style scoped lang="scss">
.maropay-mark {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  vertical-align: middle;
  line-height: 1;
  white-space: nowrap;
}

@each $size in sm, md, lg {
  .maropay-mark--#{$size} {
    height: var(--mp-component-methodMark-height-#{$size});
    min-width: var(--mp-component-methodMark-minWidth-#{$size});
    padding-inline: var(--mp-component-methodMark-paddingInline-#{$size});
    border-radius: var(--mp-component-methodMark-radius-#{$size});
    font-size: var(--mp-component-methodMark-fontSize-#{$size});
  }

  .maropay-mark--#{$size} .maropay-mark__glyph {
    font-size: var(--mp-component-methodMark-glyphSize-#{$size});
  }
}

@each $id in maropay, card, visa, mastercard, amex, applePay, googlePay, paypal, klarna, afterpay, affirm, ach, ideal, sepa {
  .maropay-mark--#{$id} {
    background: var(--mp-color-methodMark-#{$id}-tile);
    color: var(--mp-color-methodMark-#{$id}-onTile);
  }
}

/* A light tile keeps its shape on a white page; a dark one on the dark theme. */
.maropay-mark--light-tile {
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}

/* The whole selector sits in :global() — Vue drops anything after a partial :global(). */
:global(.v-theme--maropostDark .maropay-mark--dark-tile) {
  box-shadow: inset 0 0 0 1px var(--border-strong);
}

.maropay-mark__glyph {
  color: inherit;
}

.maropay-mark__initials {
  font-weight: var(--mp-fontWeight-bold);
  letter-spacing: 0;
}
</style>
