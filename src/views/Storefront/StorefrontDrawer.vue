<script lang="ts">
// Shared by every drawer on the page, so a second one open does not unlock the page early.
let locks = 0
let saved = { overflow: '', paddingRight: '' }
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'

// A panel that slides over the storefront: the size guide, quick add, the filters
// on a phone. A native modal <dialog>, so the page behind it is inert, focus stays
// inside, and Esc closes it. On a desktop it comes in from the end of the page (or
// up from the bottom with `side="bottom"`); on a phone it is a bottom sheet.
// Focus goes back to whatever opened it. The page does not scroll behind it.
//
// The first control in the panel gets focus when it opens (the close button,
// unless the body has an element with `autofocus`). The store's theme variables
// (--sf-*) reach it as they reach the rest of the page.

const props = withDefaults(defineProps<{
  title: string
  /** A line under the title. */
  description?: string
  /** Where the panel sits on a desktop. */
  side?: 'end' | 'bottom'
  /** A bottom sheet on a phone (600px and narrower), whatever `side` is. */
  phoneSheet?: boolean
  /** Width of a side panel: md 440px, lg 560px (a wide table). */
  size?: 'md' | 'lg'
  closeLabel?: string
}>(), {
  description: undefined,
  side: 'end',
  phoneSheet: true,
  size: 'md',
  closeLabel: 'Close',
})

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{
  /** The panel closed, however it was closed. */
  close: []
}>()

const id = useId()
const dialog = ref<HTMLDialogElement | null>(null)

// ── Scroll lock (counted across drawers, above) ────────────────────────────
let locked = false

function lockScroll(): void {
  if (locked) return
  locked = true
  if (locks++ > 0) return
  const root = document.documentElement
  // Keep the page where it is when its scrollbar goes.
  const gap = window.innerWidth - root.clientWidth
  saved = { overflow: root.style.overflow, paddingRight: root.style.paddingRight }
  root.style.overflow = 'hidden'
  if (gap > 0) root.style.paddingRight = `${gap}px`
}

function unlockScroll(): void {
  if (!locked) return
  locked = false
  if (--locks > 0) return
  const root = document.documentElement
  root.style.overflow = saved.overflow
  root.style.paddingRight = saved.paddingRight
}

// ── Opening and closing ────────────────────────────────────────────────────
/** What had focus when the panel opened: it gets it back. */
let trigger: HTMLElement | null = null

function show(): void {
  const el = dialog.value
  if (!el || el.open) return
  trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
  el.showModal()
  lockScroll()
}

function restoreFocus(): void {
  const target = trigger
  trigger = null
  if (target?.isConnected) target.focus({ preventScroll: true })
}

/** Esc, the close button and the backdrop all ask through the model, so the parent stays in charge. */
function requestClose(): void {
  open.value = false
}

/** The dialog closed: by the model, or by the browser on its own (a second Esc). */
function onClosed(): void {
  unlockScroll()
  restoreFocus()
  if (open.value) open.value = false
  emit('close')
}

watch(open, (value) => {
  if (value) show()
  else if (dialog.value?.open) dialog.value.close()
}, { flush: 'post' })

onMounted(() => {
  if (open.value) show()
})

onBeforeUnmount(() => {
  if (!dialog.value?.open) return
  dialog.value.close()
  unlockScroll()
  restoreFocus()
})

// A click on the backdrop closes the panel; a drag that starts inside it and ends outside does not.
let pressedBackdrop = false
function onPointerDown(event: PointerEvent): void {
  pressedBackdrop = event.target === dialog.value
}
function onClick(event: MouseEvent): void {
  if (pressedBackdrop && event.target === dialog.value) requestClose()
  pressedBackdrop = false
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Tab from the last control goes round to the first, and Shift+Tab from the first
 * to the last, so focus never leaves the panel for the browser's own bar. A radio
 * group counts once: only its checked radio (or its first) is in the Tab order.
 */
function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Tab' || !dialog.value) return
  const radioTabStop = (el: HTMLElement): boolean => {
    if (!(el instanceof HTMLInputElement) || el.type !== 'radio' || !el.name) return true
    const group = [...dialog.value!.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${CSS.escape(el.name)}"]:not([disabled])`)]
    return el === (group.find((radio) => radio.checked) ?? group[0])
  }
  const stops = [...dialog.value.querySelectorAll<HTMLElement>(FOCUSABLE)]
    .filter((el) => el.getClientRects().length > 0 && radioTabStop(el))
  const first = stops[0]
  const last = stops[stops.length - 1]
  if (!first || !last) return
  const current = document.activeElement
  if (event.shiftKey && (current === first || !dialog.value.contains(current))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (current === last || !dialog.value.contains(current))) {
    event.preventDefault()
    first.focus()
  }
}
</script>

<template>
  <dialog
    ref="dialog"
    class="sf-drawer"
    :class="[`sf-drawer--${props.side}`, `sf-drawer--${props.size}`, { 'sf-drawer--phone-sheet': props.phoneSheet }]"
    :aria-labelledby="`${id}-title`"
    :aria-describedby="description ? `${id}-description` : undefined"
    @cancel.prevent="requestClose"
    @close="onClosed"
    @pointerdown="onPointerDown"
    @click="onClick"
    @keydown="onKeydown"
  >
    <div class="sf-drawer__panel">
      <header class="sf-drawer__head">
        <div class="sf-drawer__titles">
          <h2 :id="`${id}-title`" class="sf-drawer__title">{{ title }}</h2>
          <p v-if="description" :id="`${id}-description`" class="sf-drawer__description">{{ description }}</p>
        </div>
        <button type="button" class="sf-drawer__close" :aria-label="closeLabel" @click="requestClose">
          <v-icon size="22" aria-hidden="true">x</v-icon>
        </button>
      </header>
      <div class="sf-drawer__body">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="sf-drawer__foot">
        <slot name="footer" />
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────────
 * P4-8 — DELIBERATELY OUT OF SYSTEM, like the rest of the storefront (see
 * StorefrontLayout.vue): colours, fonts and corners come from the store's theme
 * (--sf-*), and every painted surface sets its own text colour.
 * ───────────────────────────────────────────────────────────────────────────── */
.sf-drawer {
  --sf-drawer-width: 440px;
  --sf-drawer-pad: 24px;
  position: fixed;
  inset-block: 0;
  inset-inline: auto 0;
  box-sizing: border-box;
  width: min(var(--sf-drawer-width), 100vw);
  max-width: 100vw;
  height: 100%;
  max-height: 100dvh;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: var(--sf-bg, #ffffff);
  color: var(--sf-text, #121011);
  box-shadow: -12px 0 40px rgba(0, 0, 0, 0.14);
  overflow: hidden;
}

.sf-drawer--lg {
  --sf-drawer-width: 560px;
}

.sf-drawer::backdrop {
  background: rgba(17, 17, 17, 0.42);
}

.sf-drawer[open] {
  animation: sf-drawer-in-end 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.sf-drawer[open]::backdrop {
  animation: sf-drawer-fade 260ms ease-out;
}

/* Up from the bottom: centred, as wide as a reading column. */
.sf-drawer--bottom {
  inset-block: auto 0;
  inset-inline: 0;
  width: min(640px, 100vw);
  height: auto;
  max-height: 88dvh;
  margin-inline: auto;
  border-start-start-radius: var(--sf-sheet-radius, var(--sf-radius, 12px));
  border-start-end-radius: var(--sf-sheet-radius, var(--sf-radius, 12px));
  box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.14);
}

.sf-drawer--bottom[open] {
  animation-name: sf-drawer-in-bottom;
}

.sf-drawer__panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: inherit;
}

.sf-drawer--bottom .sf-drawer__panel {
  max-height: 88dvh;
}

.sf-drawer__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 14px 16px var(--sf-drawer-pad);
  border-bottom: 1px solid var(--sf-divider, #e5e5e5);
}

.sf-drawer__titles {
  min-width: 0;
  padding-top: 6px;
}

.sf-drawer__title {
  margin: 0;
  font-family: var(--sf-heading-font, system-ui), -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-size: 26px;
  font-weight: var(--sf-heading-weight, 400);
  line-height: 1.2;
  text-transform: var(--sf-heading-case, none);
}

.sf-drawer__description {
  margin: 4px 0 0;
  font-size: 14px;
  line-height: 20px;
  color: var(--sf-muted, #5f5f5f);
}

.sf-drawer__close {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: var(--sf-radius, 6px);
  background: none;
  color: inherit;
  cursor: pointer;
}

.sf-drawer__close:hover {
  background: var(--sf-surface, rgba(0, 0, 0, 0.05));
  color: var(--sf-text, #121011);
}

.sf-drawer__close:focus-visible {
  outline: 2px solid var(--sf-accent, #2563eb);
  outline-offset: -2px;
}

.sf-drawer__body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 20px var(--sf-drawer-pad) 28px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.sf-drawer__foot {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px var(--sf-drawer-pad) calc(16px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--sf-divider, #e5e5e5);
  background: var(--sf-bg, #ffffff);
  color: var(--sf-text, #121011);
}

/* A phone: a sheet up from the bottom, the width of the screen. */
@media (max-width: 600px) {
  .sf-drawer {
    --sf-drawer-pad: 16px;
  }

  .sf-drawer--phone-sheet {
    inset-block: auto 0;
    inset-inline: 0;
    width: 100vw;
    height: auto;
    max-height: 88dvh;
    border-start-start-radius: var(--sf-sheet-radius, var(--sf-radius, 12px));
    border-start-end-radius: var(--sf-sheet-radius, var(--sf-radius, 12px));
    box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.14);
  }

  .sf-drawer--phone-sheet[open] {
    animation-name: sf-drawer-in-bottom;
  }

  .sf-drawer--phone-sheet .sf-drawer__panel {
    max-height: 88dvh;
  }

  .sf-drawer--phone-sheet .sf-drawer__body {
    padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  }
}

@keyframes sf-drawer-in-end {
  from { transform: translateX(100%); }
}

@keyframes sf-drawer-in-bottom {
  from { transform: translateY(100%); }
}

@keyframes sf-drawer-fade {
  from { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .sf-drawer[open],
  .sf-drawer[open]::backdrop {
    animation: none;
  }
}
</style>
