<script setup lang="ts">
import { computed } from 'vue'
import { getBlockDef, type ThemeBlock } from '@/stores/themeBuilderData'
import { purchaseChosenId, type PurchasePreview } from './storefrontPreview'

/**
 * A product page's purchase options block in StorefrontPreview's buy box, on either
 * drawing: the product's plans and buying once as the block lays them out (boxed
 * cards, plain radio rows or one dropdown), the option the page opens on marked, and
 * the block's policy line. In an interactive canvas it is the block's own button.
 */
const props = withDefaults(defineProps<{
  block: ThemeBlock
  /** The options shown: a product's own, or the drawn example. */
  shown: PurchasePreview
  /** A button that selects the block (the theme builder's canvas). */
  interactive?: boolean
  /** Drawn with the selection ring. */
  selected?: boolean
  /** Just added: the transient "New" cue. */
  isNew?: boolean
}>(), {
  interactive: false,
  selected: false,
  isNew: false,
})

const emit = defineEmits<{ select: [] }>()

function setting(key: string, fallback = ''): string {
  const value = props.block.settings[key]
  return typeof value === 'string' && value.trim() ? value : fallback
}

const style = computed(() => setting('style', 'Cards'))
const chosenId = computed(() => purchaseChosenId(props.block, props.shown))
const chosen = computed(() => [...props.shown.single, ...props.shown.groups.flatMap((group) => group.options)].find((row) => row.id === chosenId.value))
const label = computed(() => `Edit ${getBlockDef(props.block.kind)?.title ?? props.block.kind} block`)
</script>

<template>
  <component
    :is="interactive ? 'button' : 'div'"
    class="sf-block sf-buy"
    :class="[`sf-buy--${style === 'Radio buttons' ? 'radios' : style.toLowerCase()}`, {
      'sf-block--selected': selected,
      'sf-block--new': isNew,
    }]"
    :type="interactive ? 'button' : undefined"
    :aria-label="interactive ? label : undefined"
    @click.stop="emit('select')"
  >
    <span v-if="style === 'Dropdown'" class="sf-buy__select">
      <span>{{ chosen?.name }}</span>
      <b>{{ chosen?.price }}</b>
      <v-icon size="12" aria-hidden="true">chevron-down</v-icon>
    </span>
    <template v-else>
      <span v-for="row in shown.single" :key="row.id" class="sf-buy__row" :class="{ 'is-on': row.id === chosenId }">
        <i aria-hidden="true" />
        <span>{{ row.name }}<small v-if="row.saving"> · {{ row.saving.toLowerCase() }}</small></span>
        <b>{{ row.price }}</b>
      </span>
      <template v-for="group in shown.groups" :key="group.label">
        <span class="sf-buy__label">{{ group.label }}<small v-if="group.saving"> · {{ group.saving.toLowerCase() }}</small></span>
        <span v-for="row in group.options" :key="row.id" class="sf-buy__row" :class="{ 'is-on': row.id === chosenId }">
          <i aria-hidden="true" />
          <span>{{ row.name }}<small v-if="row.saving"> · {{ row.saving.toLowerCase() }}</small></span>
          <b>{{ row.price }}</b>
        </span>
      </template>
    </template>
    <span v-if="setting('policyText') || setting('termsLink')" class="sf-buy__policy">
      {{ setting('policyText') }}
      <u v-if="setting('termsLink')">Subscription terms</u>
    </span>
  </component>
</template>

<style scoped>
/* P4-8 — out of system on purpose: part of the merchant storefront StorefrontPreview draws (see its stylesheet). */

/* The block in the buy box: boxed cards, plain radio rows or one dropdown. Its root is also
 * StorefrontPreview's .sf-block (hover, selection and New rings); the extra class keeps these
 * rules ahead of that one's, whichever stylesheet loads last. */
.sf-block.sf-buy {
  display: flex;
  flex-direction: column;
  align-self: stretch;
  gap: 5px;
  color: var(--sf-text);
  font-size: 10.5px;
  text-align: start;
}

.sf-buy__row,
.sf-buy__select {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border: 1px solid color-mix(in oklch, var(--sf-text) 22%, transparent);
  border-radius: var(--sf-radius);
}

/* A theme with card corners of its own (the sections drawing's) rounds the cards like its product cards, as the storefront does. */
.sf-buy__row {
  border-radius: var(--sf-card-radius, var(--sf-radius));
}

/* In a narrow canvas a long name wraps and the price drops under it, rather than the two colliding. */
.sf-buy__row,
.sf-buy__select {
  flex-wrap: wrap;
}

.sf-buy__row > span,
.sf-buy__select > span {
  flex: 1 1 0;
  min-width: 48px;
  overflow-wrap: anywhere;
}

.sf-buy__row b,
.sf-buy__select b {
  margin-inline-start: auto;
  white-space: nowrap;
}

.sf-buy__row.is-on {
  border-color: var(--sf-brand);
  box-shadow: inset 0 0 0 1px var(--sf-brand);
}

/* The radio: a ring, filled when chosen. */
.sf-buy__row i {
  flex-shrink: 0;
  width: 9px;
  height: 9px;
  border: 1px solid color-mix(in oklch, var(--sf-text) 55%, transparent);
  border-radius: 50%;
}

.sf-buy__row.is-on i {
  border: 3px solid var(--sf-brand);
}

.sf-buy--radios .sf-buy__row {
  padding: 2px 0;
  border: 0;
  box-shadow: none;
}

.sf-buy__label {
  margin-top: 2px;
  font-weight: 700;
}

.sf-buy small {
  font-size: inherit;
  color: color-mix(in oklch, var(--sf-text) 65%, transparent);
}

.sf-buy__label small {
  font-weight: 400;
}

.sf-buy__policy {
  color: color-mix(in oklch, var(--sf-text) 65%, transparent);
  font-size: 10px;
}
</style>
