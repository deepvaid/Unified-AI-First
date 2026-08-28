<script setup lang="ts">
import { ref, useId } from 'vue'
import { useScrollEdges } from '@/composables/useScrollEdges'

// The one modal shell (P4-6). Before this, eight components built dialogs from a
// raw `v-dialog` + `v-card-title/text/actions` with five different header/body/
// footer rhythms — even though CLAUDE.md already said "never raw v-dialog". There
// was simply nothing to compose, so every new dialog re-decided its own insets.
//
// This is the dialog analogue of MpFormDrawer and shares its geometry tokens
// (`component.dialog.*`), so a modal and a drawer cannot drift apart. Reach for
// MpFormDrawer for create/edit forms; reach for this for confirms, pickers,
// and anything that must sit centred over the page.

const model = defineModel<boolean>({ default: false })

const props = withDefaults(defineProps<{
  title: string
  subtitle?: string
  /** Small uppercase kicker above the title — same role as MpPageHeader's `eyebrow`. */
  eyebrow?: string
  /** Lucide icon name (kebab-case) shown before the title. Ignored when `#lead` is filled. */
  icon?: string
  /** Error tone paints the header icon — matches MpEmptyState's `tone` vocabulary. */
  tone?: 'neutral' | 'error'
  /** Width ramp: sm 440 · md 640 · lg 880 (`component.dialog.width.*`). */
  size?: 'sm' | 'md' | 'lg'
  /** Edge-to-edge sheet — preview surfaces, not forms. */
  fullscreen?: boolean
  /** Scrim and Esc no longer close it; the host must. */
  persistent?: boolean
  /**
   * Body renders edge-to-edge with no inset and no gap — for a surface that
   * brings its own frame (a preview stage, a full-bleed picker). This is the
   * supported way to opt out of the shell's inset; a `:deep(.mp-dialog__body)`
   * override in a host is not (P6-6).
   */
  flush?: boolean
  /** Esc/X/scrim route through the `close` emit instead of closing directly, so a
   *  host can confirm before discarding unsaved work. Mirrors MpFormDrawer. */
  guarded?: boolean
}>(), {
  tone: 'neutral',
  size: 'md',
  fullscreen: false,
  persistent: false,
  flush: false,
  guarded: false,
})

const emit = defineEmits<{ close: [] }>()

function requestClose() {
  if (props.guarded) emit('close')
  else model.value = false
}

defineSlots<{
  /** Dialog body. Children are spaced on `component.dialog.gap`. */
  default(): unknown
  /** Leading element in the header — an avatar or badge. Same role as MpListRow's `#lead`; replaces `icon`. */
  lead?(): unknown
  /** Trailing controls in the header, before the close button. */
  headerActions?(): unknown
  /** Footer actions — buttons, spaced on `component.dialog.footerGap`. */
  footer?(): unknown
  /** Left-aligned footer zone — a Back link or a destructive action, held away from the primary pair. */
  footerStart?(): unknown
}>()

const titleId = useId()
// The body is the dialog's description: screen readers announce the prompt text
// with the title instead of the title alone.
const bodyId = useId()

const body = ref<HTMLElement | null>(null)
const { atTop, atBottom } = useScrollEdges(body)
</script>

<template>
  <v-dialog
    :model-value="model"
    :max-width="fullscreen ? undefined : `var(--mp-component-dialog-width-${size})`"
    :fullscreen="fullscreen"
    :persistent="persistent"
    :aria-labelledby="titleId"
    :aria-describedby="bodyId"
    class="mp-dialog"
    @update:model-value="(open: boolean) => (open ? (model = true) : requestClose())"
  >
    <v-card
      flat
      border
      :rounded="fullscreen ? '0' : undefined"
      class="mp-dialog__card d-flex flex-column"
      :class="{ 'mp-dialog__card--fullscreen': fullscreen }"
    >
      <header
        class="mp-dialog__header"
        :class="{
          'mp-dialog__header--stuck': !atTop,
          'mp-dialog__header--with-lead': !!$slots.lead || !!icon,
        }"
      >
        <div v-if="$slots.lead || icon" class="mp-dialog__lead">
          <slot name="lead">
            <v-icon
              :color="tone === 'error' ? 'error' : undefined"
              size="20"
            >{{ icon }}</v-icon>
          </slot>
        </div>
        <div v-if="eyebrow" class="mp-dialog__eyebrow">{{ eyebrow }}</div>
        <div :id="titleId" class="mp-dialog__title">{{ title }}</div>
        <div v-if="subtitle" class="mp-dialog__subtitle">{{ subtitle }}</div>
        <div class="mp-dialog__header-actions">
          <slot name="headerActions" />
          <v-btn
            icon="x"
            variant="text"
            size="small"
            density="comfortable"
            aria-label="Close"
            @click="requestClose"
          />
        </div>
      </header>

      <v-divider />

      <div
        :id="bodyId"
        ref="body"
        class="mp-dialog__body"
        :class="{ 'mp-dialog__body--flush': flush }"
      >
        <slot />
      </div>

      <template v-if="$slots.footer || $slots.footerStart">
        <v-divider />
        <footer class="mp-dialog__footer" :class="{ 'mp-dialog__footer--stuck': !atBottom }">
          <div v-if="$slots.footerStart" class="mp-dialog__footer-start">
            <slot name="footerStart" />
          </div>
          <slot name="footer" />
        </footer>
      </template>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
/* `$mp-*` Sass variables come from the generated token sheet, which vite.config.ts
   and .storybook/main.ts both inject via `additionalData` — no @use needed here. */
.mp-dialog__card {
  max-height: 100%;
  min-height: 0;
  border-radius: var(--mp-component-dialog-radius);
  background: var(--surface-overlay);
}

.mp-dialog__card--fullscreen {
  height: 100%;
  border: none;
  border-radius: 0;
}

/* One inset on all three bands. The header/body/footer used to differ by
   component (pa-1 · pt-4 px-5 + px-3 py-2 + px-4 pb-4 · pa-5 pa-5 pa-4 · 16×20
   + 20 + 12×16); a single `component.dialog.padding` is what makes every modal
   in the system read as the same object.

   `min-height` is the P6-1 fix: the band was 72px with a title, 87px with a
   subtitle and 109px with an eyebrow, so no two modals in a flow agreed on where
   their body started.

   The grid is the other half of it. As a flex row, the lead icon and the close
   button centred on the *heading block* — so the moment a subtitle appeared they
   drifted ~10px below the title they belong to, and the old code papered over the
   icon half of that with a 2px optical nudge. Giving the eyebrow, title and
   subtitle their own rows in one column lets the lead and the trailing controls
   sit on the title's row explicitly: they are on the title's optical centre by
   construction, at any combination of optional lines. */
.mp-dialog__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  column-gap: var(--mp-component-dialog-headerGap);
  flex-shrink: 0;
  min-height: var(--mp-component-dialog-headerMinHeight);
  padding: var(--mp-component-dialog-padding);
  /* Lift the band so its scroll shadow lands on top of the body beneath it. */
  position: relative;
  z-index: 1;
}

/* The lead column only exists when there is a lead. Declaring it unconditionally
   would leave a phantom column-gap indenting the title past the body's fields. */
.mp-dialog__header--with-lead {
  grid-template-columns: auto minmax(0, 1fr) auto;
}

/* Both the lead and the trailing controls are taller than the title's line box (a
   32px icon button against a 20.8px line). Left to size their own row they would
   inflate it, and the header would be 88px with a title but 100px with a subtitle
   — the very jump this is meant to remove. Pinning each cell to the title's line
   box and letting the control overflow it symmetrically keeps the row at the
   title's height while the control stays centred on it. The overflow lands inside
   the header's own 20px padding, so nothing is clipped and the hit area is
   unchanged. */
.mp-dialog__lead,
.mp-dialog__header-actions {
  block-size: calc(var(--mp-fontSize-16) * var(--mp-lineHeight-snug));
}

.mp-dialog__lead {
  grid-row: 2;
  grid-column: 1;
  display: flex;
  align-items: center;
}

/* Rows: 1 eyebrow · 2 title · 3 subtitle. An absent optional line leaves a
   zero-height implicit row, so the title keeps row 2 in every combination and the
   trailing controls always land beside it. */
.mp-dialog__eyebrow,
.mp-dialog__title,
.mp-dialog__subtitle {
  grid-column: 1;
}

.mp-dialog__header--with-lead :is(.mp-dialog__eyebrow, .mp-dialog__title, .mp-dialog__subtitle) {
  grid-column: 2;
}

.mp-dialog__header-actions {
  grid-row: 2;
  grid-column: 2;
  display: flex;
  align-items: center;
  gap: var(--mp-component-dialog-headerGap);
}

.mp-dialog__header--with-lead .mp-dialog__header-actions {
  grid-column: 3;
}

.mp-dialog__eyebrow {
  grid-row: 1;
}

.mp-dialog__title {
  grid-row: 2;
}

.mp-dialog__subtitle {
  grid-row: 3;
}

.mp-dialog__eyebrow {
  margin-bottom: var(--mp-space-2);
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: var(--mp-letterSpacing-eyebrow);
  text-transform: uppercase;
  color: var(--muted);
}

.mp-dialog__title {
  font-size: var(--mp-fontSize-16);
  font-weight: var(--mp-fontWeight-bold);
  line-height: var(--mp-lineHeight-snug);
  letter-spacing: var(--mp-letterSpacing-snug);
  color: var(--text-primary);
}

.mp-dialog__subtitle {
  margin-top: var(--mp-space-2);
  font-size: var(--mp-fontSize-13);
  color: var(--muted);
  line-height: var(--mp-lineHeight-compact);
}

/* Flex column with a gap so a body of form fields is spaced by the shell rather
   than by whatever utility the host remembered to add — this is what closes the
   Phase 3 follow-up "drawer and dialog form bodies still space their fields ad
   hoc". A single-child body (a message, a list) is unaffected by the gap. */
.mp-dialog__body {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-dialog-gap);
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: var(--mp-component-dialog-padding);
  font-size: var(--mp-fontSize-14);
  color: var(--text-primary);
}

/* The body scrolls, so its children keep their natural height — they must never
   be compressed to make the content fit. Flexbox does the opposite by default,
   and a child that sets `overflow: hidden` (any card, any preview) additionally
   loses its automatic minimum size, so it collapses to nothing instead of
   scrolling. Growing and explicit heights are unaffected. */
.mp-dialog__body > :deep(*) {
  flex-shrink: 0;
}

.mp-dialog__body--flush {
  padding: 0;
  gap: 0;
}

.mp-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--mp-component-dialog-footerGap);
  flex-shrink: 0;
  padding: var(--mp-component-dialog-padding);
  position: relative;
  z-index: 1;
}

/* Anything before the primary pair is pushed to the opposite end, which is what
   the five hand-rolled `d-flex justify-end w-100` footer wrappers were each
   re-deriving (P6-5). */
.mp-dialog__footer-start {
  display: flex;
  align-items: center;
  gap: var(--mp-component-dialog-footerGap);
  margin-inline-end: auto;
}

/* Scroll affordance (P6-2): the divider is structure and never changes, so on a
   long body nothing said the content continued. The shadow is state — it appears
   only while there is content hidden under that band. */
.mp-dialog__header--stuck {
  box-shadow: var(--mp-shadow-sm);
}

.mp-dialog__footer--stuck {
  box-shadow: var(--mp-shadow-scrollUp);
}

/* Full-bleed sheet on small viewports, matching MpFormDrawer's behaviour so a
   modal and a drawer collapse the same way. */
@media (max-width: $mp-layout-breakpointCompact) {
  .mp-dialog__header,
  .mp-dialog__footer {
    padding: var(--mp-component-dialog-paddingCompact);
  }

  .mp-dialog__body:not(.mp-dialog__body--flush) {
    padding: var(--mp-component-dialog-paddingCompact);
  }
}
</style>
