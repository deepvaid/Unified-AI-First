<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { useScrollEdges } from '@/composables/useScrollEdges'
import {
  mp_component_drawer_width_sm,
  mp_component_drawer_width_md,
  mp_component_drawer_width_lg,
} from '@/design-tokens/generated/tokens'

const model = defineModel<boolean>({ default: false })

const props = withDefaults(defineProps<{
  title: string
  subtitle?: string
  /** Width ramp: sm 440 · md 480 · lg 640 (`component.drawer.width.*`). */
  size?: 'sm' | 'md' | 'lg'
  /** When true, Esc/X/scrim route through the `close` emit instead of closing directly,
   *  so hosts can confirm before discarding unsaved work. */
  guarded?: boolean
}>(), {
  size: 'md',
  guarded: false,
})

const emit = defineEmits<{ close: [] }>()

function requestClose() {
  if (props.guarded) emit('close')
  else model.value = false
}

// VNavigationDrawer feeds `width` into its own layout arithmetic, so it has to be
// a number — a `var()` string silently breaks the closed-state translate. Reading
// the generated constants keeps the ramp token-sourced anyway.
const DRAWER_WIDTHS = {
  sm: Number.parseInt(mp_component_drawer_width_sm, 10),
  md: Number.parseInt(mp_component_drawer_width_md, 10),
  lg: Number.parseInt(mp_component_drawer_width_lg, 10),
} as const

const drawerWidth = computed(() => DRAWER_WIDTHS[props.size])

const titleId = useId()
const bodyId = useId()
const panel = ref<HTMLElement | null>(null)

// Focus-in on open, restore on close, Tab cycling, Escape → guarded close path.
const { onKeydown } = useFocusTrap(panel, () => model.value, { onEscape: requestClose })

const body = ref<HTMLElement | null>(null)
const { atTop, atBottom } = useScrollEdges(body)
</script>

<template>
  <!-- Teleport to body so the fixed-position drawer + scrim escape any ancestor
       that establishes a containing block (e.g. cards animating .mp-enter leave a
       transform, and overflow:hidden clips). Provide/inject (theme, layout) follows
       the component tree, not the DOM, so this stays theme- and layout-correct. -->
  <Teleport to="body">
    <v-navigation-drawer
      v-model="model"
      :width="drawerWidth"
      location="right"
      temporary
      scrim
      :persistent="guarded"
      class="mp-form-drawer mp-float-drawer"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="bodyId"
      @keydown="onKeydown"
    >
      <div ref="panel" tabindex="-1" class="mp-form-drawer__panel d-flex flex-column h-100">
      <div class="mp-form-drawer__header" :class="{ 'mp-form-drawer__header--stuck': !atTop }">
        <!-- A real heading, not a styled div — parity with MpDialog and an anchor
             for the drawer's heading outline. h2: the page's h1 sits behind the
             overlay; sections inside the body start at h3. -->
        <h2 :id="titleId" class="mp-form-drawer__title">{{ title }}</h2>
        <div v-if="subtitle" class="mp-form-drawer__subtitle">{{ subtitle }}</div>
        <div class="mp-form-drawer__header-actions">
          <v-btn
            icon="x"
            variant="text"
            size="small"
            density="comfortable"
            aria-label="Close"
            @click="requestClose"
          />
        </div>
      </div>
      <v-divider />

      <div ref="body" :id="bodyId" class="mp-form-drawer__body">
        <slot />
      </div>

      <template v-if="$slots.footer || $slots.footerStart">
        <v-divider />
        <div class="mp-form-drawer__footer" :class="{ 'mp-form-drawer__footer--stuck': !atBottom }">
          <div v-if="$slots.footerStart" class="mp-form-drawer__footer-start">
            <slot name="footerStart" />
          </div>
          <slot name="footer" />
        </div>
      </template>
    </div>
    </v-navigation-drawer>
  </Teleport>
</template>

<style scoped lang="scss">
/* `$mp-*` Sass variables come from the generated token sheet, which vite.config.ts
   and .storybook/main.ts both inject via `additionalData` — no @use needed here. */

/* Float the drawer as a rounded surface, like .copilot-drawer — a 12px gutter on
   the right, top and bottom, plus radius, border and a soft shadow. Vuetify sets
   top/height/bottom inline from the layout (top: 56px + bottom: 0 under the app
   bar; top: 0 + bottom: 0 on fullPage routes with no app bar). We keep its top
   and bottom and only force height:auto, so the box stretches between them; the
   margins then carve the 12px gutters — no hardcoded app-bar height needed, and
   it lands correctly whether or not the app bar is present.
   Retime the slide to the shared editorial motion tokens while we're here. */
.mp-form-drawer.v-navigation-drawer {
  height: auto !important;
  margin-top: var(--mp-space-12);
  margin-bottom: var(--mp-space-12);
  margin-right: var(--mp-space-12);
  border: 1px solid var(--border-default);
  border-radius: var(--mp-component-dialog-radius);
  /* Temporary drawers carry Vuetify's `elevation-0` utility, which sets
     box-shadow with !important — so the soft shell shadow needs it too. */
  box-shadow: var(--elevation-modal) !important;
  overflow: hidden;
  transition-duration: var(--dur-base);
  transition-timing-function: var(--ease);
}

/* Closed state lives in global.scss as .mp-float-drawer (shared with the copilot dock). */

/* Clip the panel (and its scrolling body) to the rounded shell. */
.mp-form-drawer :deep(.v-navigation-drawer__content) {
  border-radius: inherit;
  overflow: hidden;
}

.mp-form-drawer__panel {
  background: var(--surface-overlay);
}

/* Header / body / footer share the ONE overlay rhythm with MpDialog
   (`component.dialog.*`), so a drawer and a modal read as the same object. These
   used to be pa-5 / pa-5 / px-5 py-4 utilities — a 16px footer against 20px
   bands, and utilities mixed with token CSS on the same element (P1-13). */
/* Same header contract as MpDialog (P6-1): one floor so the band does not jump
   when the subtitle is absent, and a grid so the close button sits on the title's
   optical centre rather than on the heading block's. See MpDialog.vue for the
   full reasoning — the two shells are deliberately the same object here. */
.mp-form-drawer__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  column-gap: var(--mp-component-dialog-headerGap);
  flex-shrink: 0;
  min-height: var(--mp-component-dialog-headerMinHeight);
  padding: var(--mp-component-dialog-padding);
  position: relative;
  z-index: 1;
}

.mp-form-drawer__title {
  grid-row: 1;
  grid-column: 1;
}

.mp-form-drawer__subtitle {
  grid-row: 2;
  grid-column: 1;
}

.mp-form-drawer__header-actions {
  grid-row: 1;
  grid-column: 2;
  display: flex;
  align-items: center;
  gap: var(--mp-component-dialog-headerGap);
  /* Pinned to the title's line box so the 40px button cannot inflate the row. */
  block-size: calc(var(--mp-fontSize-16) * var(--mp-lineHeight-snug));
}

/* Fields are spaced by the shell, not by whatever utility each host remembered
   to add — closes the Phase 3 follow-up on ad-hoc drawer form spacing. The flex
   sizing used to come from `flex-grow-1 overflow-auto` utilities on the element,
   which mixed two mechanisms for one job (P1-13) and left the composable with no
   stable scroll container to observe. */
.mp-form-drawer__body {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-dialog-gap);
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: var(--mp-component-dialog-padding);
}

/* Same contract as MpDialog's body: a scrolling column must not compress its
   children, and a child with `overflow: hidden` would otherwise collapse to
   nothing rather than push the body into scroll. */
.mp-form-drawer__body > :deep(*) {
  flex-shrink: 0;
}

.mp-form-drawer__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--mp-component-dialog-footerGap);
  flex-shrink: 0;
  padding: var(--mp-component-dialog-padding);
  position: relative;
  z-index: 1;
}

.mp-form-drawer__footer-start {
  display: flex;
  align-items: center;
  gap: var(--mp-component-dialog-footerGap);
  margin-inline-end: auto;
}

/* Scroll affordance, shared with MpDialog (P6-2). */
.mp-form-drawer__header--stuck {
  box-shadow: var(--mp-shadow-sm);
}

.mp-form-drawer__footer--stuck {
  box-shadow: var(--mp-shadow-scrollUp);
}

/* 16, not 18: a drawer title and a modal title are the same object seen from two
   sides, and the system had grown three overlay title sizes (P6-1). */
.mp-form-drawer__title {
  margin: 0;
  font-size: var(--mp-fontSize-16);
  font-weight: var(--mp-fontWeight-bold);
  letter-spacing: var(--mp-letterSpacing-snug);
  line-height: var(--mp-lineHeight-snug);
}

.mp-form-drawer__subtitle {
  margin-top: var(--mp-space-2);
  font-size: var(--mp-fontSize-13);
  color: var(--muted);
  line-height: var(--mp-lineHeight-compact);
}

/* Full-bleed sheet on small viewports: drop the gutters + radius and clamp the
   width so the 480 default can't overflow a 375px screen. */
@media (max-width: $mp-layout-breakpointCompact) {
  .mp-form-drawer__header,
  .mp-form-drawer__body,
  .mp-form-drawer__footer {
    padding: var(--mp-component-dialog-paddingCompact);
  }

  .mp-form-drawer.v-navigation-drawer {
    margin: 0;
    width: 100vw !important;
    max-width: 100vw !important;
    border: none;
    border-left: 1px solid var(--border-default);
    border-radius: 0;
  }
}
</style>
