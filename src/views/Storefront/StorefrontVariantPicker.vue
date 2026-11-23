<script setup lang="ts" generic="V extends SellableVariant">
import { computed, nextTick, ref, useId, watch } from 'vue'
import { initialSelection, optionKey, optionKind, optionValuesOf, stockNote, valueState, variantAvailable, variantFor } from '@/storefront/variants'
import type { OptionKind, SellableVariant, ValueState, VariantOption, VariantProduct } from '@/storefront/variants'
import { soldOutText } from '@/storefront/listing'
import { announce } from './storefrontAnnouncer'

// The product's options as a shopper chooses them, on the product page and in
// quick add: one group of real radio buttons per option, so arrow keys move
// within a group and Tab moves between groups. A colour shown as swatches is a
// row of dots with the chosen colour's name in the legend; sizes and other
// options are buttons. A value that is sold out with the other choices is struck
// through but can still be chosen (and says "sold out"); a combination the
// product does not have cannot be chosen.
//
// v-model is the selection (option name → value). Without one, the picker starts
// from initialSelection (a colour in stock, never a size). It emits the variant
// the selection names, or undefined while an option is unchosen. `validate()`
// says "Select a size" under the first unchosen option and moves focus there.

const props = withDefaults(defineProps<{
  product: VariantProduct<V> & { name?: string }
  /** The kinds of option to show; quick add leaves the colour to the card it came from: `['size', 'plain']`. */
  kinds?: readonly OptionKind[]
  /** `sheet`: larger size buttons that fill the width, for quick add. */
  layout?: 'page' | 'sheet'
  /** A message under an option, by option name; it wins over the picker's own. */
  errors?: Readonly<Record<string, string | undefined>>
  /** What the URL asks for (`?color=sand&size=m`), when the picker starts without a selection. */
  query?: Readonly<Record<string, string | undefined>>
}>(), {
  kinds: () => ['color', 'size', 'plain'],
  layout: 'page',
  errors: () => ({}),
  query: () => ({}),
})

const selection = defineModel<Record<string, string>>()
const emit = defineEmits<{
  /** The variant the selection names (also once on start), or undefined while an option is unchosen. */
  variant: [variant: V | undefined]
}>()

if (!selection.value) selection.value = initialSelection(props.product, props.query)
const chosen = computed<Record<string, string>>(() => selection.value ?? {})

const uid = useId()
const options = computed<VariantOption[]>(() => props.product.detail?.options ?? [])
const shown = computed(() => options.value.filter((option) => props.kinds.includes(optionKind(option))))
const variant = computed(() => variantFor(props.product, chosen.value))

interface ValueView {
  value: string
  state: ValueState
  selected: boolean
  swatch?: string
}

interface OptionView {
  option: VariantOption
  key: string
  kind: OptionKind
  swatches: boolean
  values: ValueView[]
}

const views = computed<OptionView[]>(() => shown.value.map((option) => {
  const kind = optionKind(option)
  const hexes = option.swatches ?? {}
  return {
    option,
    key: optionKey(option.name),
    kind,
    swatches: kind === 'color' && option.display !== 'buttons' && option.values.some((value) => !!hexes[value]),
    values: option.values.map((value) => ({
      value,
      state: valueState(props.product, chosen.value, option.name, value),
      selected: chosen.value[option.name] === value,
      swatch: hexes[value],
    })),
  }
}))

/** Notes go under the size group, else the last group shown. */
const noteOption = computed(() => (shown.value.find((option) => optionKind(option) === 'size') ?? shown.value[shown.value.length - 1])?.name)

/** The value a note names: the size ("M"), else the last option's ("Sand"). */
const noteValue = computed(() => {
  if (!variant.value) return ''
  const values = optionValuesOf(variant.value, options.value)
  const size = options.value.findIndex((option) => optionKind(option) === 'size')
  return values[size >= 0 ? size : values.length - 1] ?? ''
})

/** The variants that could be bought when the picker opened: one of them sold out since "just sold out". */
const availableAtStart = new Set((props.product.detail?.variantsList ?? []).filter(variantAvailable).map((v) => v.id))

/** "Sorry, M is sold out. Choose another size." when the chosen variant cannot be bought ("just sold out" when it sold out during the visit). */
const soldOutNote = computed(() => {
  if (!variant.value || variantAvailable(variant.value) || !options.value.length) return ''
  const size = options.value.find((option) => optionKind(option) === 'size') ?? options.value[options.value.length - 1]!
  return soldOutText(noteValue.value, size.name, availableAtStart.has(variant.value.id))
})

/** "Only 2 left in M". */
const lowNote = computed(() => {
  const note = variant.value ? stockNote(variant.value) : null
  if (!note) return ''
  return noteValue.value && options.value.length ? `${note} in ${noteValue.value}` : note
})

// ── Choosing ───────────────────────────────────────────────────────────────
/** The option `validate()` found unchosen, until the shopper chooses it. */
const missing = ref<string | null>(null)

function choose(option: VariantOption, value: string): void {
  const next: Record<string, string> = { ...chosen.value, [option.name]: value }
  // A choice the new value does not come in is let go (a sold-out one stays: it exists).
  for (const other of options.value) {
    const current = next[other.name]
    if (other.name !== option.name && current !== undefined && valueState(props.product, next, other.name, current) === 'absent') delete next[other.name]
  }
  if (missing.value === option.name) missing.value = null
  selection.value = next
  // Say what the radios do not: the variant just chosen is low or gone.
  void nextTick(() => {
    const note = soldOutNote.value || lowNote.value
    if (note) announce(note)
  })
}

watch(variant, (value) => emit('variant', value), { immediate: true })

function messageFor(view: OptionView): string {
  const own = props.errors[view.option.name]
  if (own) return own
  return missing.value === view.option.name ? `Select a ${view.option.name.toLowerCase()}` : ''
}

const describedBy = (view: OptionView): string | undefined => {
  const ids = [
    messageFor(view) ? `${uid}-${view.key}-error` : '',
    view.option.name === noteOption.value && (soldOutNote.value || lowNote.value) ? `${uid}-${view.key}-note` : '',
  ].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
}

function accessibleState(state: ValueState): string {
  if (state === 'sold-out') return ', sold out'
  if (state === 'absent') return ', unavailable'
  return ''
}

// ── For the page around it ───────────────────────────────────────────────────
const root = ref<HTMLElement | null>(null)

/** Moves focus into an option's group: its chosen value, else its first one that can be chosen. */
async function focus(optionName?: string): Promise<void> {
  await nextTick()
  const view = views.value.find((v) => v.option.name === optionName) ?? views.value[0]
  if (!view) return
  const inputs = [...(root.value?.querySelectorAll<HTMLInputElement>(`input[name="${uid}-${view.key}"]`) ?? [])]
  ;(inputs.find((input) => input.checked) ?? inputs.find((input) => !input.disabled))?.focus()
}

/**
 * Whether every option shown is chosen. When one is not, it says "Select a
 * size" under it, moves focus there and returns false. Add to cart calls it
 * instead of ever being disabled.
 */
function validate(): boolean {
  const unchosen = shown.value.find((option) => chosen.value[option.name] === undefined)
  if (!unchosen) {
    missing.value = null
    return true
  }
  missing.value = unchosen.name
  void focus(unchosen.name)
  return false
}

defineExpose({ validate, focus, variant })
</script>

<template>
  <div ref="root" class="sf-vp" :class="`sf-vp--${layout}`">
    <fieldset
      v-for="view in views"
      :key="view.key"
      class="sf-vp__group"
      :aria-describedby="describedBy(view)"
    >
      <legend class="sf-vp__legend">
        <span class="sf-vp__name">{{ view.option.name }}</span>
        <template v-if="view.swatches && chosen[view.option.name]">
          <!-- The space goes inside the value's span: a legend (display: table) drops one between spans. -->
          <span aria-hidden="true">:</span><span class="sf-vp__chosen">{{ ` ${chosen[view.option.name]}` }}</span>
        </template>
      </legend>
      <span v-if="$slots['option-aside']" class="sf-vp__aside">
        <slot name="option-aside" :option="view.option" :kind="view.kind" />
      </span>

      <div
        class="sf-vp__values"
        :class="view.swatches ? 'sf-vp__values--swatches' : view.kind === 'size' ? 'sf-vp__values--sizes' : 'sf-vp__values--plain'"
      >
        <label
          v-for="item in view.values"
          :key="item.value"
          class="sf-vp__value"
          :class="{
            'sf-vp__value--swatch': view.swatches,
            'is-selected': item.selected,
            'is-sold-out': item.state === 'sold-out',
            'is-absent': item.state === 'absent',
          }"
          :title="view.swatches ? `${item.value}${item.state === 'sold-out' ? ' (sold out)' : ''}` : undefined"
        >
          <input
            type="radio"
            class="sf-vp__input"
            :name="`${uid}-${view.key}`"
            :value="item.value"
            :checked="item.selected"
            :disabled="item.state === 'absent'"
            @change="choose(view.option, item.value)"
          >
          <template v-if="view.swatches">
            <span class="sf-vp__swatch" :style="{ '--sf-swatch': item.swatch ?? 'transparent' }" aria-hidden="true" />
            <span class="sf-vp__sr">{{ item.value }}{{ accessibleState(item.state) }}</span>
          </template>
          <!-- The name as one text ("L, sold out"): a hidden span beside the drawn value would be read after a space. -->
          <span v-else class="sf-vp__face">
            <span aria-hidden="true">{{ item.value }}</span><span class="sf-vp__sr">{{ item.value }}{{ accessibleState(item.state) }}</span>
          </span>
        </label>
      </div>

      <p v-if="messageFor(view)" :id="`${uid}-${view.key}-error`" class="sf-vp__message sf-vp__message--error">
        <v-icon size="16" aria-hidden="true">circle-alert</v-icon>
        {{ messageFor(view) }}
      </p>
      <template v-if="view.option.name === noteOption && (soldOutNote || lowNote)">
        <p :id="`${uid}-${view.key}-note`" class="sf-vp__message" :class="soldOutNote ? 'sf-vp__message--sold-out' : 'sf-vp__message--low'">
          {{ soldOutNote || lowNote }}
        </p>
      </template>
    </fieldset>
  </div>
</template>

<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. Colours and corners
 * come from the store's theme (--sf-*). Every target is at least 44px tall. */
.sf-vp {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.sf-vp__group {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

/* Floated, so the "Size guide" link can sit on the legend's line. */
.sf-vp__legend {
  float: left;
  margin: 0 0 10px;
  padding: 0;
  font-size: 14px;
  line-height: 24px;
}

.sf-vp__name {
  font-weight: 600;
}

.sf-vp__chosen {
  color: var(--sf-muted, #5f5f5f);
}

.sf-vp__aside {
  float: right;
  margin-bottom: 10px;
  font-size: 14px;
  line-height: 24px;
}

.sf-vp__values {
  clear: both;
}

.sf-vp__values--swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-inline-start: -8px;
}

.sf-vp__values--sizes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
  gap: 8px;
}

.sf-vp--sheet .sf-vp__values--sizes {
  grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
}

.sf-vp__values--plain {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sf-vp__value {
  position: relative;
  display: inline-flex;
  cursor: pointer;
}

/* The radio covers its value: it takes the click and the focus, the face shows it. */
.sf-vp__input {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: inherit;
}

.sf-vp__value.is-absent {
  cursor: not-allowed;
}

/* Sizes and other values: a box with the value in it. */
.sf-vp__face {
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: 56px;
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid color-mix(in srgb, var(--sf-text, #121011) 22%, transparent);
  border-radius: var(--sf-radius, 4px);
  background: var(--sf-bg, #ffffff);
  color: var(--sf-text, #121011);
  font-size: 14px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  transition: border-color 120ms ease, background-color 120ms ease;
}

.sf-vp--sheet .sf-vp__face {
  min-height: 48px;
}

.sf-vp__value:hover .sf-vp__face {
  border-color: var(--sf-text, #121011);
}

.is-selected .sf-vp__face {
  border-color: var(--sf-text, #121011);
  background: var(--sf-text, #121011);
  color: var(--sf-bg, #ffffff);
}

.is-sold-out .sf-vp__face {
  color: var(--sf-muted, #5f5f5f);
  text-decoration: line-through;
  text-decoration-thickness: 1px;
  background: var(--sf-surface, #f5f5f5);
}

.is-sold-out.is-selected .sf-vp__face {
  border-color: var(--sf-text, #121011);
  background: var(--sf-surface, #f5f5f5);
  color: var(--sf-text, #121011);
  box-shadow: inset 0 0 0 1px var(--sf-text, #121011);
}

.is-absent .sf-vp__face {
  border-style: dashed;
  opacity: 0.4;
}

.sf-vp__input:focus-visible + .sf-vp__face {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

/* Swatches: a 28px dot in a 44px target. */
.sf-vp__value--swatch {
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
}

.sf-vp__swatch {
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--sf-swatch);
  /* A hairline so a white or cream swatch shows on a light page. */
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.16);
}

.is-selected .sf-vp__swatch {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.16), 0 0 0 3px var(--sf-bg, #ffffff), 0 0 0 4.5px var(--sf-text, #121011);
}

.sf-vp__value:hover:not(.is-selected):not(.is-absent) .sf-vp__swatch {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.16), 0 0 0 3px var(--sf-bg, #ffffff), 0 0 0 4px color-mix(in srgb, var(--sf-text, #121011) 35%, transparent);
}

/* Sold out: a line across the dot, in the page's text colour on a light ring. */
.is-sold-out .sf-vp__swatch::after {
  content: '';
  position: absolute;
  top: 50%;
  left: -3px;
  right: -3px;
  height: 2px;
  margin-top: -1px;
  background: var(--sf-text, #121011);
  box-shadow: 0 0 0 1px var(--sf-bg, #ffffff);
  transform: rotate(-45deg);
}

.is-absent .sf-vp__swatch {
  opacity: 0.3;
}

.sf-vp__input:focus-visible + .sf-vp__swatch {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 6px;
}

.sf-vp__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.sf-vp__message {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 20px;
}

.sf-vp__message--error {
  color: var(--sf-error, #b3261e);
  font-weight: 500;
}

.sf-vp__message--sold-out {
  color: var(--sf-text, #121011);
}

.sf-vp__message--low {
  color: var(--sf-error, #b3261e);
  font-weight: 500;
}

/* A phone: five sizes to a row, on the page and in quick add alike. */
@media (max-width: 600px) {
  .sf-vp .sf-vp__values--sizes {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .sf-vp__face {
    min-width: 0;
    min-height: 48px;
    padding: 0 6px;
  }
}
</style>
