<script setup lang="ts">
/**
 * A receipt as the register's thermal printer prints it: the model's
 * fixed-width lines (48 columns at 80 mm, 32 at 58 mm) on paper that stays
 * white in both themes, because real paper does.
 *
 * Thumbnails shrink it with `scale`; the designer makes each section a button.
 */
import { computed } from 'vue'
import { SECTION_META, layoutBlock, type ReceiptDoc, type SectionKind } from '@/views/Retail/receipts/receiptModel'

const props = withDefaults(defineProps<{
  doc: ReceiptDoc
  /** Size multiplier — thumbnails go below 1, the designer canvas above. */
  scale?: number
  /** Designer mode: each section becomes a button that selects it. */
  selectable?: boolean
  selectedSectionId?: SectionKind | null
}>(), {
  scale: 1,
  selectable: false,
  selectedSectionId: null,
})

const emit = defineEmits<{ select: [id: SectionKind] }>()

const blocks = computed(() =>
  props.doc.blocks.map((b) => ({ id: b.sectionId, lines: layoutBlock(b, props.doc.columns) })),
)

function initials(text: string) {
  return text.trim().replace(/^\[\s*|\s*\]$/g, '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('')
}
</script>

<template>
  <div
    class="receipt-paper"
    :class="`receipt-paper--${doc.density}`"
    :style="{ '--receipt-columns': doc.columns, '--receipt-scale': scale }"
  >
    <component
      :is="selectable ? 'button' : 'div'"
      v-for="b in blocks"
      :key="b.id"
      class="receipt-paper__block"
      :class="{ 'receipt-paper__block--selected': selectable && selectedSectionId === b.id }"
      :type="selectable ? 'button' : undefined"
      :aria-label="selectable ? `${SECTION_META[b.id].label} section` : undefined"
      :aria-pressed="selectable ? selectedSectionId === b.id : undefined"
      @click="selectable && emit('select', b.id)"
    >
      <div
        v-for="(line, i) in b.lines"
        :key="i"
        class="receipt-paper__line"
        :class="{ 'receipt-paper__line--strong': line.strong }"
      >
        <span v-if="line.graphic === 'code128'" class="receipt-paper__barcode" aria-hidden="true" />
        <span v-else-if="line.graphic === 'qr'" class="receipt-paper__qr" aria-hidden="true" />
        <span
          v-else-if="line.graphic === 'logo-sm' || line.graphic === 'logo-lg'"
          class="receipt-paper__logo"
          :class="{ 'receipt-paper__logo--lg': line.graphic === 'logo-lg' }"
          aria-hidden="true"
        >{{ initials(line.text) }}</span>
        <template v-else>{{ line.text || ' ' }}</template>
      </div>
    </component>
  </div>
</template>

<style scoped>
/* Paper is always paper: the light surface and ink pair, in either theme. */
.receipt-paper {
  --receipt-paper: var(--mp-color-light-surface);
  --receipt-ink: var(--mp-color-light-onSurface);
  --receipt-edge: var(--mp-space-6);

  display: flex;
  flex-direction: column;
  gap: 0.6em;
  width: calc(var(--receipt-columns) * 1ch + 2.4em);
  padding: 1.2em 1.2em calc(1.2em + var(--receipt-edge));
  background: var(--receipt-paper);
  color: var(--receipt-ink);
  font-family: var(--mp-fontFamily-mono);
  font-size: calc(var(--mp-fontSize-12) * var(--receipt-scale));
  line-height: 1.45;
  box-shadow: var(--mp-shadow-sm);
  /* Torn bottom edge, as the printer's cutter leaves it */
  -webkit-mask:
    linear-gradient(#000 0 0) top / 100% calc(100% - var(--receipt-edge)) no-repeat,
    conic-gradient(from -45deg at bottom, transparent, #000 1deg 89deg, transparent 90deg) bottom / calc(var(--receipt-edge) * 2) var(--receipt-edge) repeat-x;
  mask:
    linear-gradient(#000 0 0) top / 100% calc(100% - var(--receipt-edge)) no-repeat,
    conic-gradient(from -45deg at bottom, transparent, #000 1deg 89deg, transparent 90deg) bottom / calc(var(--receipt-edge) * 2) var(--receipt-edge) repeat-x;
}

.receipt-paper--compact { gap: 0; line-height: 1.3; }

.receipt-paper__block {
  display: block;
  width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
}

button.receipt-paper__block {
  border-radius: var(--mp-radius-4);
  outline: 1px dashed transparent;
  outline-offset: 0.3em;
  cursor: pointer;
}

button.receipt-paper__block:hover { outline-color: var(--mp-color-light-borderSubtle); }
button.receipt-paper__block:focus-visible { outline: 2px solid var(--focus-ring); }

.receipt-paper__block--selected,
.receipt-paper__block--selected:hover {
  outline: 2px solid var(--accent-default) !important;
}

.receipt-paper__line {
  white-space: pre;
  overflow: hidden;
}

.receipt-paper__line--strong { font-weight: 700; }

.receipt-paper__barcode {
  display: block;
  height: 3.2em;
  margin: 0.2em auto;
  width: 70%;
  background: repeating-linear-gradient(
    90deg,
    var(--receipt-ink) 0 0.12em, transparent 0.12em 0.22em,
    var(--receipt-ink) 0.22em 0.42em, transparent 0.42em 0.5em,
    var(--receipt-ink) 0.5em 0.56em, transparent 0.56em 0.74em
  );
}

.receipt-paper__qr {
  display: block;
  width: 6em;
  height: 6em;
  margin: 0.2em auto;
  background:
    conic-gradient(var(--receipt-ink) 25%, transparent 0 50%, var(--receipt-ink) 0 75%, transparent 0) 0 0 / 1em 1em,
    var(--receipt-paper);
  box-shadow: inset 0 0 0 0.6em var(--receipt-paper), inset 0 0 0 1em var(--receipt-ink);
}

.receipt-paper__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3em;
  height: 3em;
  margin: 0 auto;
  border-radius: 50%;
  background: var(--receipt-ink);
  color: var(--receipt-paper);
  font-weight: 700;
}

.receipt-paper__logo--lg {
  width: 4.5em;
  height: 4.5em;
  font-size: 1.2em;
}
</style>
