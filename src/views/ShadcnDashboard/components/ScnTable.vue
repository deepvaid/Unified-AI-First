<script setup lang="ts" generic="T extends Record<string, any>">
// shadcn Table treatment: muted medium-weight header row, hairline row
// dividers, 14px cells, outlined dot badges for status objects.
export interface ScnColumn {
  key: string
  label: string
  align?: 'left' | 'right'
}

export interface ScnBadgeCell {
  label: string
  tone: 'pos' | 'neg' | 'info' | 'warn'
}

defineProps<{
  columns: ScnColumn[]
  rows: T[]
}>()

function isBadge(v: unknown): v is ScnBadgeCell {
  return typeof v === 'object' && v !== null && 'label' in v && 'tone' in v
}

const TONE_COLORS: Record<ScnBadgeCell['tone'], string> = {
  pos: '#22C55E',
  info: '#2B7FFF',
  warn: '#F59E0B',
  neg: '#EF4444',
}
</script>

<template>
  <table class="scn-table">
    <thead>
      <tr>
        <th v-for="col in columns" :key="col.key" :class="{ 'scn-table--right': col.align === 'right' }">
          {{ col.label }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, ri) in rows" :key="ri">
        <td
          v-for="(col, ci) in columns"
          :key="col.key"
          :class="{ 'scn-table--right': col.align === 'right', 'scn-table--lead': ci === 0 }"
        >
          <span v-if="isBadge(row[col.key])" class="scn-table__badge">
            <span class="scn-table__badge-dot" :style="{ background: TONE_COLORS[(row[col.key] as ScnBadgeCell).tone] }" />
            {{ (row[col.key] as ScnBadgeCell).label }}
          </span>
          <template v-else>{{ row[col.key] }}</template>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.scn-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.scn-table th {
  text-align: left;
  font-size: 13px;
  font-weight: 500;
  color: var(--scn-muted);
  padding: 0 8px 10px;
}

.scn-table th:first-child,
.scn-table td:first-child {
  padding-left: 0;
}

.scn-table th:last-child,
.scn-table td:last-child {
  padding-right: 0;
}

.scn-table td {
  padding: 11px 8px;
  border-top: 1px solid var(--scn-border);
  color: var(--scn-fg);
  font-variant-numeric: tabular-nums;
}

.scn-table--lead {
  font-weight: 500;
}

.scn-table--right {
  text-align: right;
}

.scn-table__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border: 1px solid var(--scn-border);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  color: var(--scn-fg);
  white-space: nowrap;
}

.scn-table__badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  flex-shrink: 0;
}
</style>
