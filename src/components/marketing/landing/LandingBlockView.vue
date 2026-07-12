<script setup lang="ts">
import { computed } from 'vue'
import type { LandingPageBlock } from '@/stores/useLandingPages'
import type { PaletteItem } from './LandingBlockPalette.vue'

const props = withDefaults(defineProps<{
  block: LandingPageBlock
  editable?: boolean
  selected?: boolean
  showStructure?: boolean
  palette?: PaletteItem[]
}>(), {
  editable: false,
  selected: false,
  showStructure: false,
  palette: () => [],
})

const emit = defineEmits<{
  select: []
  duplicate: []
  remove: []
}>()

const typeLabel = computed(() => props.palette.find(p => p.type === props.block.type)?.label ?? props.block.type)

const titleTag = computed(() => ({ S: 'h4', M: 'h3', L: 'h2', XL: 'h1' }[props.block.titleSize]))

function onGripDragStart(e: DragEvent) {
  if (!e.dataTransfer) return
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('application/x-lp-reorder-id', props.block.id)
}
</script>

<template>
  <div
    class="lbv"
    :class="{ 'lbv--editable': editable, 'lbv--selected': selected, 'lbv--structure': showStructure, [`lbv--${block.type}`]: true }"
    @click="editable && emit('select')"
  >
    <div v-if="editable" class="lbv__chip">
      <v-icon size="12" class="me-1">{{ palette.find(p => p.type === block.type)?.icon ?? 'square' }}</v-icon>{{ typeLabel }}
    </div>
    <div v-if="editable" class="lbv__controls">
      <button type="button" class="lbv__ctrl" draggable="true" aria-label="Drag to reorder" @dragstart="onGripDragStart" @click.stop>
        <v-icon size="14">grip-vertical</v-icon>
      </button>
      <button type="button" class="lbv__ctrl" aria-label="Duplicate block" @click.stop="emit('duplicate')">
        <v-icon size="14">copy-plus</v-icon>
      </button>
      <button type="button" class="lbv__ctrl lbv__ctrl--danger" aria-label="Delete block" @click.stop="emit('remove')">
        <v-icon size="14">trash-2</v-icon>
      </button>
    </div>

    <!-- title -->
    <component :is="titleTag" v-if="block.type === 'title'" class="lbv-title" :class="`lbv-title--${block.titleSize}`" :style="{ textAlign: block.align, color: block.colorOverride || undefined }">{{ block.text }}</component>

    <!-- paragraph / text -->
    <p v-else-if="block.type === 'paragraph' || block.type === 'text'" class="lbv-paragraph" :class="{ 'lbv-paragraph--muted': block.muted }" :style="{ textAlign: block.align }">{{ block.text }}</p>

    <!-- list -->
    <component :is="block.ordered ? 'ol' : 'ul'" v-else-if="block.type === 'list'" class="lbv-list">
      <li v-for="(li, i) in block.items" :key="i">{{ li }}</li>
    </component>

    <!-- image -->
    <figure v-else-if="block.type === 'image'" class="lbv-figure">
      <div class="lbv-image" :class="[`lbv-image--${block.aspect.replace(':', '-')}`, { 'lbv-image--rounded': block.rounded }]">
        <v-icon size="30">image</v-icon>
      </div>
      <figcaption v-if="block.caption" class="lbv-caption">{{ block.caption }}</figcaption>
    </figure>

    <!-- video -->
    <div v-else-if="block.type === 'video'" class="lbv-video">
      <v-icon v-if="!block.autoplayLook" size="42" class="lbv-video__play">circle-play</v-icon>
      <span v-if="block.alt" class="lbv-video__caption">{{ block.alt }}</span>
    </div>

    <!-- button -->
    <div v-else-if="block.type === 'button'" :style="{ textAlign: block.align }">
      <a
        class="lbv-button"
        :class="[`lbv-button--${block.buttonStyle}`, `lbv-button--${block.buttonSize}`, { 'lbv-button--full': block.fullWidth }]"
        :href="editable ? undefined : (block.url || '#')"
        @click="editable && $event.preventDefault()"
      >{{ block.label }}</a>
    </div>

    <!-- form -->
    <div v-else-if="block.type === 'form'" class="lbv-form">
      <div v-if="block.fieldName" class="lbv-form__field">Name</div>
      <div class="lbv-form__field">Email address</div>
      <div v-if="block.fieldPhone" class="lbv-form__field">Phone</div>
      <a class="lbv-button lbv-button--filled lbv-button--M lbv-button--full" href="#" @click="editable && $event.preventDefault()">{{ block.label || 'Subscribe' }}</a>
    </div>

    <!-- divider -->
    <hr v-else-if="block.type === 'divider'" class="lbv-divider" :class="`lbv-divider--${block.dividerStyle}`" :style="{ width: `${block.dividerWidthPct}%` }">

    <!-- spacer -->
    <div v-else-if="block.type === 'spacer'" class="lbv-spacer" :class="{ 'lbv-spacer--hint': editable }" :style="{ height: `${block.height}px` }">
      <span v-if="editable" class="lbv-spacer__label">{{ block.height }}px spacer</span>
    </div>

    <!-- social -->
    <div v-else-if="block.type === 'social'" class="lbv-icon-row" :style="{ justifyContent: block.align === 'center' ? 'center' : block.align === 'right' ? 'flex-end' : 'flex-start' }">
      <v-icon v-for="n in block.networks" :key="n" size="20">{{ n === 'tiktok' ? 'music-2' : n }}</v-icon>
    </div>

    <!-- icons -->
    <div v-else-if="block.type === 'icons'" class="lbv-icon-row" :style="{ justifyContent: block.align === 'center' ? 'center' : block.align === 'right' ? 'flex-end' : 'flex-start' }">
      <v-icon v-for="ic in block.iconSet" :key="ic" size="20">{{ ic }}</v-icon>
    </div>

    <!-- menu -->
    <nav v-else-if="block.type === 'menu'" class="lbv-menu" :style="{ justifyContent: block.align === 'center' ? 'center' : block.align === 'right' ? 'flex-end' : 'flex-start' }">
      <span v-for="(link, i) in block.links" :key="i" class="lbv-menu__item">{{ link.label }}</span>
    </nav>

    <!-- html -->
    <div v-else-if="block.type === 'html'" class="lbv-html">
      <div class="lbv-html__badge">HTML</div>
      <pre>{{ block.code }}</pre>
    </div>
  </div>
</template>

<style scoped>
.lbv {
  position: relative;
  padding: 10px 12px;
  border: 1.5px solid transparent;
  border-radius: 8px;
  transition: border-color 100ms ease, background 100ms ease;
}
.lbv--editable {
  cursor: pointer;
}
.lbv--editable:hover {
  border-color: rgba(var(--v-theme-primary), 0.35);
}
.lbv--selected {
  border-color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.03);
}
.lbv--structure {
  border-style: dashed;
  border-color: rgba(var(--v-theme-on-surface), 0.25) !important;
}
.lbv__chip {
  position: absolute;
  top: -11px;
  left: 10px;
  display: none;
  align-items: center;
  padding: 1px 8px;
  border-radius: 999px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  z-index: 1;
}
.lbv--editable:hover .lbv__chip,
.lbv--selected .lbv__chip {
  display: flex;
}
.lbv__controls {
  position: absolute;
  top: -15px;
  right: 8px;
  display: none;
  gap: 1px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  padding: 2px;
  z-index: 1;
}
.lbv--editable:hover .lbv__controls,
.lbv--selected .lbv__controls {
  display: flex;
}
.lbv__ctrl {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: rgb(var(--v-theme-on-surface-variant));
  cursor: pointer;
}
.lbv__ctrl:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgb(var(--v-theme-on-surface));
}
.lbv__ctrl--danger:hover {
  background: rgba(var(--v-theme-error), 0.12);
  color: rgb(var(--v-theme-error));
}
.lbv__ctrl[draggable='true'] {
  cursor: grab;
}

/* title */
.lbv-title {
  font-family: var(--lp-font, inherit);
  font-weight: 700;
  line-height: 1.25;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}
.lbv-title--S { font-size: 1.15rem; }
.lbv-title--M { font-size: 1.6rem; }
.lbv-title--L { font-size: 2.1rem; }
.lbv-title--XL { font-size: 2.75rem; letter-spacing: -0.02em; }

/* paragraph */
.lbv-paragraph {
  font-family: var(--lp-font, inherit);
  font-size: 0.98rem;
  line-height: 1.65;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 0;
}
.lbv-paragraph--muted { opacity: 0.65; }

/* list */
.lbv-list {
  padding-left: 22px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.95rem;
  line-height: 1.8;
  margin: 0;
}

/* image */
.lbv-figure { margin: 0; }
.lbv-image {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(var(--v-theme-on-surface), 0.55);
  background: linear-gradient(135deg, color-mix(in oklch, var(--lp-accent, #0073AB) 18%, transparent), color-mix(in oklch, var(--lp-accent, #0073AB) 6%, transparent));
  border-radius: 4px;
}
.lbv-image--rounded { border-radius: 14px; }
.lbv-image--16-9 { aspect-ratio: 16 / 9; }
.lbv-image--4-3 { aspect-ratio: 4 / 3; }
.lbv-image--1-1 { aspect-ratio: 1 / 1; }
.lbv-image--auto { aspect-ratio: 3 / 1.4; }
.lbv-caption {
  margin-top: 6px;
  font-size: 0.78rem;
  text-align: center;
  color: rgb(var(--v-theme-on-surface-variant));
}

/* video */
.lbv-video {
  position: relative;
  aspect-ratio: 16 / 9;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: linear-gradient(135deg, rgba(20, 20, 24, 0.92), rgba(35, 35, 42, 0.92));
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
}
.lbv-video__play { opacity: 0.9; }
.lbv-video__caption { font-size: 0.78rem; opacity: 0.8; }

/* button */
.lbv-button {
  display: inline-block;
  font-family: var(--lp-font, inherit);
  font-weight: 600;
  text-decoration: none;
  border-radius: var(--lp-radius, 8px);
  cursor: pointer;
  transition: filter 120ms ease, transform 120ms ease;
}
.lbv-button:hover { filter: brightness(0.94); }
.lbv-button--filled {
  background: var(--lp-accent, rgb(var(--v-theme-primary)));
  color: #fff;
  border: 1.5px solid transparent;
}
.lbv-button--outline {
  background: transparent;
  color: var(--lp-accent, rgb(var(--v-theme-primary)));
  border: 1.5px solid var(--lp-accent, rgb(var(--v-theme-primary)));
}
.lbv-button--S { padding: 5px 14px; font-size: 0.8rem; }
.lbv-button--M { padding: 10px 22px; font-size: 0.9rem; }
.lbv-button--L { padding: 14px 30px; font-size: 1rem; }
.lbv-button--full { display: block; width: 100%; text-align: center; }

/* form */
.lbv-form { display: flex; flex-direction: column; gap: 8px; max-width: 340px; }
.lbv-form__field {
  height: 38px;
  border-radius: var(--lp-radius, 8px);
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 0.85rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

/* divider */
.lbv-divider {
  border: none;
  border-top: 1.5px solid rgba(var(--v-theme-on-surface), 0.18);
  margin: 6px auto;
}
.lbv-divider--dashed { border-top-style: dashed; }

/* spacer */
.lbv-spacer { position: relative; }
.lbv-spacer--hint {
  background: repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(var(--v-theme-on-surface), 0.05) 6px, rgba(var(--v-theme-on-surface), 0.05) 12px);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lbv-spacer__label {
  font-size: 0.65rem;
  color: rgb(var(--v-theme-on-surface-variant));
  opacity: 0;
  transition: opacity 100ms ease;
}
.lbv:hover .lbv-spacer__label { opacity: 0.8; }

/* icon rows */
.lbv-icon-row {
  display: flex;
  gap: 16px;
  color: var(--lp-accent, rgb(var(--v-theme-on-surface-variant)));
}

/* menu */
.lbv-menu { display: flex; gap: 22px; font-size: 0.85rem; font-weight: 600; font-family: var(--lp-font, inherit); }
.lbv-menu__item { color: rgb(var(--v-theme-on-surface)); }

/* html */
.lbv-html {
  position: relative;
  font-family: monospace;
  font-size: 0.8rem;
  background: rgba(var(--v-theme-on-surface), 0.05);
  padding: 12px 10px 10px;
  border-radius: 6px;
  color: rgb(var(--v-theme-on-surface-variant));
}
.lbv-html pre { margin: 0; white-space: pre-wrap; }
.lbv-html__badge {
  position: absolute;
  top: -8px;
  left: 8px;
  background: rgb(var(--v-theme-secondary));
  color: rgb(var(--v-theme-on-secondary));
  font-size: 0.6rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}
</style>
