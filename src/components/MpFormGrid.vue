<script setup lang="ts">
// The one form layout container (P6-8).
//
// Vertical rhythm between fields is a property of the *form*, not of each field.
// Before this, 275 fields carried their own `mb-2`/`mb-3`/`mb-4` — stacking on top
// of the shell's own 16px gap, so the real distance between two fields was 24, 28,
// 32, 36 or 40px depending on which utility the author happened to reach for. A
// field sets zero external margin; this container sets the gap once.
//
// It also owns the two row shapes that were being hand-rolled six different ways:
// a full-width row inside a two-column form, and a row with a trailing icon button.
// The trailing action gets its own fixed track, so the input's right edge still
// lands on the form's right edge instead of being pushed in by the button's width.

withDefaults(defineProps<{
  /** 1 stacks every field; 2 pairs them. Collapses to 1 below the compact breakpoint. */
  cols?: 1 | 2
}>(), { cols: 1 })

defineSlots<{
  /**
   * Form fields. Two child classes are part of the contract:
   * `mp-form-grid__full` spans both columns, and `mp-form-grid__trailing` wraps a
   * field plus its trailing icon button.
   */
  default(): unknown
}>()
</script>

<template>
  <div class="mp-form-grid" :class="`mp-form-grid--cols-${cols}`">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.mp-form-grid {
  display: grid;
  gap: var(--mp-component-field-groupGap);
  /* Items keep their own height and hang from a shared top edge. Grid's default
     `stretch` made a field as tall as the tallest thing in its row, so a
     persistent hint under one column silently grew the control beside it — two
     neighbours rendering at different heights where both should sit on the ramp.
     Aligning to the start is what makes a two-column row share one baseline
     whether or not one of the pair carries a hint or an error. */
  align-items: start;
  /* The container owns the rhythm; it does not own the space around itself. Its
     host — a dialog body, a drawer body, a settings card — already places it. */
  margin: 0;
}

.mp-form-grid--cols-1 {
  grid-template-columns: minmax(0, 1fr);
}

.mp-form-grid--cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

/* `minmax(0, 1fr)` rather than `1fr`: a select with a long option would otherwise
   push its column past its share and break the two columns' equal width. */
.mp-form-grid > :deep(.mp-form-grid__full) {
  grid-column: 1 / -1;
}

/* A field with a trailing action (an amount row with a delete button). The action
   sits in its own `control.height` track, so the input's right edge lands exactly
   where every other field's right edge lands. `align-items: start` keeps the row
   honest when the field grows — a wrapped multi-chip select or a validation
   message must not drag the button down with it. */
.mp-form-grid > :deep(.mp-form-grid__trailing) {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--mp-component-control-height);
  gap: var(--mp-component-field-groupGap);
  align-items: start;
}

/* The action fills its own track, so its right edge lands exactly on the form's
   right edge — the same box-edge alignment the dialog shell uses for its close
   button — and it is a full 40px target rather than the 28px Vuetify gives an
   icon button by default.

   A field now paints control.height exactly (the old 2px boxPadding is retired),
   so a flush action already shares the field's centre line. The one offset left
   is the static top label: a labelled field reserves labelHeight + labelGap of
   headroom above its box, so the action beside it drops by the same amount to
   stay on the input's centre. (`:has()` — first use in the repo; fine for this
   modern-browser prototype.) Centring on the *row* instead would drift the
   moment an error message grew it. */
.mp-form-grid > :deep(.mp-form-grid__trailing) > :last-child {
  justify-self: end;
  inline-size: var(--mp-component-control-height);
  block-size: var(--mp-component-control-height);
}

.mp-form-grid > :deep(.mp-form-grid__trailing:has(.v-field--variant-outlined:not(.v-field--no-label))) > :last-child {
  margin-block-start: calc(var(--mp-component-field-labelHeight) + var(--mp-component-field-labelGap));
}

@media (max-width: $mp-layout-breakpointCompact) {
  .mp-form-grid--cols-2 {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
