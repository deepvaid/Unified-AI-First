<script setup lang="ts">
/**
 * The sale's totals. Every row adds up to the Charge amount: discounts fold
 * into one expandable row, exclusive tax gets its own rows, inclusive tax is
 * a note under the total. Amounts arrive formatted for the store.
 */
import { useId } from 'vue'

export interface PosTotalsDiscount {
  key: string
  label: string
  /** Formatted, signed as it should read — "−$12.00". */
  amount: string
  /** Shows a remove button that emits `remove` with this key. */
  removable?: boolean
}

export interface PosTotalsTax {
  label: string
  amount: string
}

withDefaults(defineProps<{
  subtotal: string
  discounts?: PosTotalsDiscount[]
  discountTotal?: string
  /** Rows added on top of the subtotal (exclusive tax, as in Canada). */
  taxes?: PosTotalsTax[]
  /** One line under the total for tax already in the prices (GST in Australia). */
  taxNote?: string
  total: string
}>(), {
  discounts: () => [],
  discountTotal: undefined,
  taxes: () => [],
  taxNote: undefined,
})

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ remove: [key: string] }>()
const rowsId = useId()
</script>

<template>
  <div class="pos-totals">
    <div class="pos-totals__row">
      <span>Subtotal</span><span>{{ subtotal }}</span>
    </div>
    <template v-if="discounts.length">
      <button
        type="button"
        class="pos-totals__row pos-totals__row--discount pos-totals__toggle"
        :aria-expanded="open"
        :aria-controls="rowsId"
        @click="open = !open"
      >
        <span class="pos-totals__toggle-label">
          Discounts ({{ discounts.length }})
          <v-icon size="14" aria-hidden="true">{{ open ? 'chevron-up' : 'chevron-down' }}</v-icon>
        </span>
        <span>{{ discountTotal }}</span>
      </button>
      <div v-show="open" :id="rowsId">
        <div v-for="d in discounts" :key="d.key" class="pos-totals__row pos-totals__row--child">
          <span class="pos-totals__label">{{ d.label }}</span>
          <span class="pos-totals__amount">
            {{ d.amount }}
            <button
              v-if="d.removable"
              type="button"
              class="pos-totals__remove"
              :aria-label="`Remove ${d.label}`"
              @click="emit('remove', d.key)"
            >
              <v-icon size="14" aria-hidden="true">x</v-icon>
            </button>
          </span>
        </div>
      </div>
    </template>
    <div v-for="t in taxes" :key="t.label" class="pos-totals__row">
      <span>{{ t.label }}</span><span>{{ t.amount }}</span>
    </div>
    <div class="pos-totals__row pos-totals__row--grand">
      <span>Total</span><span>{{ total }}</span>
    </div>
    <div v-if="taxNote" class="pos-totals__row pos-totals__row--note">
      <span>{{ taxNote }}</span>
    </div>
  </div>
</template>

<style scoped>
.pos-totals__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-8);
  padding: var(--mp-space-2) 0;
  color: var(--mp-color-light-pos-muted);
  font-size: var(--mp-fontSize-13);
}

.pos-totals__row--discount {
  color: var(--mp-color-light-pos-successInk);
  font-weight: var(--mp-fontWeight-semibold);
}

/* The discount row is the disclosure; its hit area reaches the 44px target */
.pos-totals__toggle {
  position: relative;
  width: 100%;
  min-height: var(--mp-space-40);
  border: none;
  background: none;
  font: inherit;
  font-size: var(--mp-fontSize-13);
  text-align: left;
  cursor: pointer;
}

.pos-totals__toggle::before {
  position: absolute;
  inset: calc(var(--mp-space-2) * -1) 0;
  content: '';
}

.pos-totals__toggle-label {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-4);
}

.pos-totals__row--child {
  min-height: var(--mp-space-32);
  padding: 0 0 0 var(--mp-space-12);
  color: var(--mp-color-light-pos-successInk);
  font-size: var(--mp-fontSize-12);
}

.pos-totals__label {
  overflow: hidden;
  min-width: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pos-totals__amount {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-2);
  white-space: nowrap;
}

/* Small mark, 44px hit area */
.pos-totals__remove {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-28);
  height: var(--mp-space-28);
  border: none;
  border-radius: var(--mp-radius-8);
  background: transparent;
  color: var(--mp-color-light-pos-muted);
  cursor: pointer;
}

.pos-totals__remove::before {
  position: absolute;
  inset: calc(var(--mp-space-8) * -1);
  content: '';
}

.pos-totals__remove:hover {
  background: rgba(var(--mp-rgb-color-light-pos-ink), 0.06);
  color: var(--mp-color-light-pos-ink);
}

.pos-totals__row--grand {
  margin-top: var(--mp-space-6);
  padding-top: var(--mp-space-8);
  border-top: 1px solid var(--mp-color-light-pos-hairline);
  color: var(--mp-color-light-pos-ink);
  font-size: var(--mp-fontSize-18);
  font-weight: var(--mp-fontWeight-bold);
}

.pos-totals__row--note {
  padding-top: 0;
  font-size: var(--mp-fontSize-12);
}
</style>
