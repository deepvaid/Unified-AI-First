<script setup lang="ts">
// Restyled data table for the lab package: soft header row, row hover, tinted
// status pills. Generic: columns + rows via props; a cell is either a string
// or a { pill, tone } object.
import type { PillTone } from '../catalogLabData'

export interface LabTableColumn {
  key: string
  label: string
  align?: 'left' | 'right'
}

export type LabTableCell = string | { pill: string; tone: PillTone }

defineProps<{
  columns: LabTableColumn[]
  rows: Array<Record<string, LabTableCell>>
  tableLabel: string
}>()

function isPill(cell: LabTableCell | undefined): cell is { pill: string; tone: PillTone } {
  return typeof cell === 'object' && cell !== null && 'pill' in cell
}
</script>

<template>
  <div class="ltb">
    <table class="ltb__table" :aria-label="tableLabel">
      <thead>
        <tr>
          <th
            v-for="c in columns"
            :key="c.key"
            class="ltb__th"
            :class="{ 'ltb__cell--right': c.align === 'right' }"
            scope="col"
          >
            {{ c.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, ri) in rows" :key="ri" class="ltb__tr">
          <td
            v-for="c in columns"
            :key="c.key"
            class="ltb__td"
            :class="{ 'ltb__cell--right': c.align === 'right' }"
          >
            <span v-if="isPill(row[c.key])" class="ltb__pill" :class="`ltb__pill--${(row[c.key] as { tone: PillTone }).tone}`">
              {{ (row[c.key] as { pill: string }).pill }}
            </span>
            <template v-else>{{ row[c.key] }}</template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.ltb {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
}

.ltb__table {
  width: 100%;
  border-collapse: collapse;
}

.ltb__th {
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
  background: var(--surface-secondary);
  padding: 8px 12px;
}

.ltb__th:first-child {
  border-radius: 10px 0 0 10px;
}

.ltb__th:last-child {
  border-radius: 0 10px 10px 0;
}

.ltb__td {
  font-size: 13px;
  color: var(--text-primary);
  padding: 11px 12px;
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 260px;
  font-variant-numeric: tabular-nums;
}

.ltb__tr:last-child .ltb__td {
  border-bottom: none;
}

.ltb__tr {
  transition: background 0.12s ease;
}

.ltb__tr:hover {
  background: color-mix(in srgb, var(--surface-secondary) 55%, transparent);
}

.ltb__cell--right {
  text-align: right;
}

.ltb__pill {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
}

.ltb__pill--pos {
  color: var(--pos-ink);
  background: color-mix(in oklch, var(--pos) 13%, #ffffff);
}

.ltb__pill--neg {
  color: var(--neg-ink);
  background: color-mix(in oklch, var(--neg) 13%, #ffffff);
}

.ltb__pill--info {
  color: #0a4fa8;
  background: color-mix(in srgb, #0092d4 13%, #ffffff);
}

.ltb__pill--warn {
  color: #8a5a10;
  background: color-mix(in srgb, #e8a13b 18%, #ffffff);
}

@media (prefers-reduced-motion: reduce) {
  .ltb__tr {
    transition: none;
  }
}
</style>
