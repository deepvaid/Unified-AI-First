<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'

const model = defineModel<boolean>({ default: false })

const props = withDefaults(defineProps<{
  title: string
  subtitle?: string
  width?: number
  /** When true, Esc/X/scrim route through the `close` emit instead of closing directly,
   *  so hosts can confirm before discarding unsaved work. */
  guarded?: boolean
}>(), {
  width: 480,
  guarded: false,
})

const emit = defineEmits<{ close: [] }>()

function requestClose() {
  if (props.guarded) emit('close')
  else model.value = false
}

const drawerWidth = computed(() => props.width)

const titleId = useId()
const panel = ref<HTMLElement | null>(null)
let lastFocused: HTMLElement | null = null

// Move focus into the panel on open, restore it to the trigger on close.
watch(model, async (open) => {
  if (open) {
    lastFocused = document.activeElement as HTMLElement | null
    await nextTick()
    panel.value?.focus()
  } else if (lastFocused) {
    lastFocused.focus?.()
    lastFocused = null
  }
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    requestClose()
    return
  }
  if (e.key !== 'Tab' || !panel.value) return
  const focusable = Array.from(
    panel.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
    // Skip elements hidden inside collapsed sections (display:none ancestors etc.).
  ).filter(el => el.offsetParent !== null)
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (!first || !last) return
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}
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
      class="mp-form-drawer"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      @keydown="onKeydown"
    >
      <div ref="panel" tabindex="-1" class="mp-form-drawer__panel d-flex flex-column h-100">
      <div class="mp-form-drawer__header d-flex align-start ga-3 pa-5">
        <div class="min-width-0 flex-grow-1">
          <div :id="titleId" class="mp-form-drawer__title">{{ title }}</div>
          <div v-if="subtitle" class="text-body-2 text-medium-emphasis mt-1">{{ subtitle }}</div>
        </div>
        <v-btn
          icon="x"
          variant="text"
          size="small"
          density="comfortable"
          aria-label="Close"
          @click="requestClose"
        />
      </div>
      <v-divider />

      <div class="mp-form-drawer__body flex-grow-1 overflow-auto pa-5">
        <slot />
      </div>

      <template v-if="$slots.footer">
        <v-divider />
        <div class="mp-form-drawer__footer d-flex align-center justify-end ga-2 px-5 py-4">
          <slot name="footer" />
        </div>
      </template>
    </div>
    </v-navigation-drawer>
  </Teleport>
</template>

<style scoped>
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
  margin-top: 12px;
  margin-bottom: 12px;
  margin-right: 12px;
  border: 1px solid var(--border-default);
  border-radius: var(--mp-component-dialog-radius-default);
  /* Temporary drawers carry Vuetify's `elevation-0` utility, which sets
     box-shadow with !important — so the soft shell shadow needs it too. */
  box-shadow: var(--elevation-modal) !important;
  overflow: hidden;
  transition-duration: var(--dur-base);
  transition-timing-function: var(--ease);
}

/* Closed state: Vuetify slides the drawer out by exactly its own width
   (inline translateX), but margin-right keeps the box 12px inside the
   viewport — leaving a 12px sliver of the rounded shell visible at the
   right edge. Push it past the margin and the shadow bleed. */
.mp-form-drawer.v-navigation-drawer:not(.v-navigation-drawer--active) {
  transform: translateX(calc(100% + 32px)) !important;
}

/* Clip the panel (and its scrolling body) to the rounded shell. */
.mp-form-drawer :deep(.v-navigation-drawer__content) {
  border-radius: inherit;
  overflow: hidden;
}

.mp-form-drawer__panel {
  background: var(--surface-overlay);
}

.mp-form-drawer__title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

/* Full-bleed sheet on small viewports: drop the gutters + radius and clamp the
   width so the 480 default can't overflow a 375px screen. */
@media (max-width: 640px) {
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
