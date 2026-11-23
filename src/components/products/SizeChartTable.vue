<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import {
  addMeasurement, addSize, cellKey, cellLabel, issueList, moveItem, moveMeasurement, removeItem, removeMeasurement,
} from '@/storefront/sizeChartForm'
import type { SizeChartIssueTarget, SizeChartIssues, SizeRow } from '@/storefront/sizeChartForm'
import type { SizeUnit } from '@/storefront/sizeCharts'

/**
 * A size chart's measurements as an editable grid: sizes are rows, measurements
 * are columns, and every cell is a field ("Chest for size M"). Sizes and
 * measurements can be added, renamed, moved and removed; the arrow keys move
 * between cells as in a spreadsheet (left and right once the caret is at the
 * edge of the text). The edits themselves are pure (src/storefront/sizeChartForm.ts).
 */

const columns = defineModel<string[]>('columns', { required: true })
const rows = defineModel<SizeRow[]>('rows', { required: true })

const props = withDefaults(defineProps<{
  /** The unit the numbers are written in, said to screen readers with the grid. */
  unit?: SizeUnit
  /** Problems to mark, from `sizeChartIssues`. Absent: nothing is marked. */
  issues?: SizeChartIssues | null
}>(), {
  unit: 'in',
  issues: null,
})

const uid = useId()
const UNIT_WORDS: Record<SizeUnit, string> = { in: 'inches', cm: 'centimeters' }

// ── Problems ─────────────────────────────────────────────────────────────
const sizeIssue = (r: number) => props.issues?.sizeNames[r] ?? ''
const columnIssue = (c: number) => props.issues?.measurementNames[c] ?? ''
const cellIssue = (r: number, c: number) => props.issues?.cells[cellKey(r, c)] ?? ''
const messageId = (r: number, c: number) => `${uid}-msg-${r}-${c}`
const tableIssue = computed(() => [props.issues?.sizes, props.issues?.measurements].filter(Boolean).join('. '))

/** The grid's problems in words; the one in the focused field is shown, else the first. */
const gridProblems = computed(() => (props.issues
  ? issueList({ columns: columns.value, rows: rows.value }, props.issues).filter((p) => ['size', 'measurement', 'cell'].includes(p.target.kind))
  : []))
const focusedCell = ref<string | null>(null)
const shownProblem = computed(() => {
  const list = gridProblems.value
  if (!list.length) return ''
  const here = list.find((p) => placeOf(p.target) === focusedCell.value) ?? list[0]!
  return list.length > 1 ? `${here.text} (${list.length} cells to fix)` : here.text
})
function placeOf(target: SizeChartIssueTarget): string | null {
  if (target.kind === 'size') return `${target.row}:-1`
  if (target.kind === 'measurement') return `-1:${target.column}`
  if (target.kind === 'cell') return `${target.row}:${target.column}`
  return null
}
function onFocusIn(event: FocusEvent): void {
  focusedCell.value = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-cell]')?.dataset.cell ?? null
}

/** The attributes that mark a field with a problem: red, an icon (not colour alone), and the message read out. */
function marked(message: string, r: number, c: number) {
  return message
    ? { error: true, 'append-inner-icon': 'circle-alert', 'aria-invalid': 'true', 'aria-describedby': messageId(r, c) }
    : {}
}

// ── Finding a cell ───────────────────────────────────────────────────────
// Row -1 is the measurement names; column -1 is the sizes.
const table = ref<HTMLTableElement | null>(null)
const root = ref<HTMLElement | null>(null)

function cellInput(r: number, c: number): HTMLInputElement | null {
  return table.value?.querySelector<HTMLInputElement>(`[data-cell="${r}:${c}"] input`) ?? null
}

/** Focuses a cell's field with its text selected; `reveal` scrolls it to the middle of the view first (the form's error summary). */
function focusInput(input: HTMLInputElement | null | undefined, reveal = false): boolean {
  if (!input) return false
  if (reveal) input.closest('td, th')?.scrollIntoView({ block: 'center', inline: 'nearest' })
  input.focus({ preventScroll: reveal })
  input.select()
  return true
}

function focusButton(selector: string): void {
  root.value?.querySelector<HTMLElement>(`${selector} button`)?.focus()
}

/**
 * Esc while a row or column menu is open (focus still on its button) closes that
 * menu and nothing else: it would otherwise reach the drawer around the grid too.
 */
function onMenuEscape(event: KeyboardEvent): void {
  const trigger = (event.currentTarget as HTMLElement).querySelector<HTMLElement>('[aria-expanded="true"]')
  if (!trigger) return
  event.stopPropagation()
  trigger.click()
}

/** Focus lands after the menu that asked for the change has closed. */
function afterMenu(run: () => void): void {
  void nextTick(() => window.setTimeout(run, 0))
}

// ── Keyboard: move between cells ─────────────────────────────────────────
const atStart = (input: HTMLInputElement) =>
  input.selectionStart === 0 && (input.selectionEnd === 0 || input.selectionEnd === input.value.length)
const atEnd = (input: HTMLInputElement) =>
  input.selectionEnd === input.value.length && (input.selectionStart === input.value.length || input.selectionStart === 0)

function onKeydown(event: KeyboardEvent): void {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) return
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return
  const place = input.closest<HTMLElement>('[data-cell]')?.dataset.cell?.split(':').map(Number)
  if (!place || place.length !== 2) return
  const [r, c] = place as [number, number]
  let next: [number, number] | null = null
  if (event.key === 'ArrowUp') next = [r - 1, c]
  else if (event.key === 'ArrowDown' || event.key === 'Enter') next = [r + 1, c]
  else if (event.key === 'ArrowLeft' && atStart(input)) next = [r, c - 1]
  else if (event.key === 'ArrowRight' && atEnd(input)) next = [r, c + 1]
  if (next && focusInput(cellInput(...next))) event.preventDefault()
}

// ── Saying what changed ──────────────────────────────────────────────────
const announcement = ref('')
function announce(text: string): void {
  announcement.value = ''
  void nextTick(() => { announcement.value = text })
}

const sizeName = (r: number) => rows.value[r]?.size.trim() || `Row ${r + 1}`
const columnName = (c: number) => columns.value[c]?.trim() || `Measurement ${c + 1}`

// ── Editing ──────────────────────────────────────────────────────────────
function setSize(r: number, size: string): void {
  rows.value = rows.value.map((row, i) => (i === r ? { size, values: [...row.values] } : row))
}

function setCell(r: number, c: number, value: string): void {
  rows.value = rows.value.map((row, i) => (i === r ? { size: row.size, values: row.values.map((v, j) => (j === c ? value : v)) } : row))
}

function setColumn(c: number, name: string): void {
  columns.value = columns.value.map((column, i) => (i === c ? name : column))
}

function addRow(): void {
  rows.value = addSize(rows.value, columns.value.length)
  const r = rows.value.length - 1
  const added = rows.value[r]!
  announce(added.size ? `Size ${added.size} added` : 'Size added')
  // A suggested size is filled in, so the first measurement is next; else the size itself.
  void nextTick(() => focusInput(added.size && columns.value.length ? cellInput(r, 0) : cellInput(r, -1)))
}

function moveRow(from: number, to: number): void {
  const name = sizeName(from)
  rows.value = moveItem(rows.value, from, to)
  announce(`${name} moved ${to < from ? 'up' : 'down'}, now row ${to + 1} of ${rows.value.length}`)
  afterMenu(() => focusButton(`[data-row-actions="${to}"]`))
}

function removeRow(r: number): void {
  const name = sizeName(r)
  rows.value = removeItem(rows.value, r)
  announce(`${name} removed`)
  afterMenu(() => {
    if (!focusInput(cellInput(Math.min(r, rows.value.length - 1), -1))) focusButton('[data-add="size"]')
  })
}

function addColumn(): void {
  const next = addMeasurement(columns.value, rows.value)
  rows.value = next.rows
  columns.value = next.columns
  announce('Measurement added. Name it in the new column.')
  void nextTick(() => focusInput(cellInput(-1, columns.value.length - 1)))
}

function moveColumn(from: number, to: number): void {
  const name = columnName(from)
  const next = moveMeasurement(columns.value, rows.value, from, to)
  rows.value = next.rows
  columns.value = next.columns
  announce(`${name} moved ${to < from ? 'left' : 'right'}, now column ${to + 1} of ${columns.value.length}`)
  afterMenu(() => focusButton(`[data-column-actions="${to}"]`))
}

function removeColumn(c: number): void {
  const name = columnName(c)
  const next = removeMeasurement(columns.value, rows.value, c)
  rows.value = next.rows
  columns.value = next.columns
  announce(`${name} removed`)
  afterMenu(() => {
    if (!focusInput(cellInput(-1, Math.min(c, columns.value.length - 1)))) focusButton('[data-add="measurement"]')
  })
}

// ── Focusing a problem (the form's error summary) ────────────────────────
function focusTarget(target: SizeChartIssueTarget): void {
  if (target.kind === 'size') focusInput(cellInput(target.row, -1), true)
  else if (target.kind === 'measurement') focusInput(cellInput(-1, target.column), true)
  else if (target.kind === 'cell') focusInput(cellInput(target.row, target.column), true)
  else if (target.kind === 'sizes') focusButton('[data-add="size"]')
  else if (target.kind === 'measurements') focusButton('[data-add="measurement"]')
}

defineExpose({ focusTarget })

// ── The sticky Size column gets its edge once the grid scrolls sideways ──
const scroller = ref<HTMLElement | null>(null)
const scrolled = ref(false)
const onScroll = () => { scrolled.value = (scroller.value?.scrollLeft ?? 0) > 0 }
let observer: ResizeObserver | undefined
onMounted(() => {
  if (typeof ResizeObserver === 'undefined' || !scroller.value) return
  observer = new ResizeObserver(onScroll)
  observer.observe(scroller.value)
})
onBeforeUnmount(() => observer?.disconnect())
watch(() => columns.value.length, () => void nextTick(onScroll))

/** A column is at least wide enough to show its whole name beside its menu button. */
const fitName = (name: string) => ({ minWidth: `max(calc(var(--mp-space-48) * 3), calc(${name.trim().length + 1}ch + var(--mp-space-48)))` })

const caption = computed(() => `Measurements in ${UNIT_WORDS[props.unit]}: sizes are rows, measurements are columns`)
</script>

<template>
  <div ref="root" class="size-chart-table" :class="{ 'size-chart-table--scrolled': scrolled }">
    <div ref="scroller" class="size-chart-table__scroll" @scroll.passive="onScroll">
      <table ref="table" class="size-chart-table__grid" @keydown="onKeydown" @focusin="onFocusIn">
        <caption class="d-sr-only">{{ caption }}</caption>
        <thead>
          <tr>
            <th scope="col" class="size-chart-table__size size-chart-table__label">Size</th>
            <th v-for="(column, c) in columns" :key="c" scope="col" class="size-chart-table__measure" :style="fitName(column)">
              <!-- The column's own menu sits inside its name field, so the header lines up with the cells. -->
              <v-text-field
                :model-value="column"
                density="compact"
                hide-details
                placeholder="Chest"
                :aria-label="`Measurement ${c + 1} name`"
                :data-cell="`-1:${c}`"
                class="size-chart-table__field size-chart-table__field--name"
                v-bind="marked(columnIssue(c), -1, c)"
                @update:model-value="setColumn(c, $event)"
              >
                <template #append-inner>
                  <!-- mousedown stays here, so the menu button takes focus rather than the field's input. -->
                  <div :data-column-actions="c" class="size-chart-table__column-menu" @keydown.esc="onMenuEscape" @mousedown.stop>
                    <MpRowActionsMenu ariaLabel="Measurement actions" :item-label="columnName(c)">
                      <MpMenuItem icon="arrow-left" title="Move left" :disabled="c === 0" @click="moveColumn(c, c - 1)" />
                      <MpMenuItem icon="arrow-right" title="Move right" :disabled="c === columns.length - 1" @click="moveColumn(c, c + 1)" />
                      <v-divider class="my-1" />
                      <MpMenuItem icon="trash-2" title="Remove measurement" danger @click="removeColumn(c)" />
                    </MpRowActionsMenu>
                  </div>
                </template>
              </v-text-field>
              <span v-if="columnIssue(c)" :id="messageId(-1, c)" class="d-sr-only">{{ columnIssue(c) }}</span>
            </th>
            <th scope="col" class="size-chart-table__actions"><span class="d-sr-only">Size actions</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, r) in rows" :key="r">
            <th scope="row" class="size-chart-table__size">
              <v-text-field
                :model-value="row.size"
                density="compact"
                hide-details
                placeholder="M"
                :aria-label="`Size, row ${r + 1}`"
                :data-cell="`${r}:-1`"
                class="size-chart-table__field size-chart-table__field--size"
                v-bind="marked(sizeIssue(r), r, -1)"
                @update:model-value="setSize(r, $event)"
              />
              <span v-if="sizeIssue(r)" :id="messageId(r, -1)" class="d-sr-only">{{ sizeIssue(r) }}</span>
            </th>
            <td v-for="(column, c) in columns" :key="c" class="size-chart-table__measure" :title="cellIssue(r, c) || undefined">
              <v-text-field
                :model-value="row.values[c] ?? ''"
                density="compact"
                hide-details
                inputmode="decimal"
                :aria-label="cellLabel(column, c, row.size, r)"
                :data-cell="`${r}:${c}`"
                class="size-chart-table__field"
                v-bind="marked(cellIssue(r, c), r, c)"
                @update:model-value="setCell(r, c, $event)"
              />
              <span v-if="cellIssue(r, c)" :id="messageId(r, c)" class="d-sr-only">{{ cellIssue(r, c) }}</span>
            </td>
            <td class="size-chart-table__actions">
              <div :data-row-actions="r" @keydown.esc="onMenuEscape">
                <MpRowActionsMenu ariaLabel="Size actions" :item-label="sizeName(r)">
                  <MpMenuItem icon="arrow-up" title="Move up" :disabled="r === 0" @click="moveRow(r, r - 1)" />
                  <MpMenuItem icon="arrow-down" title="Move down" :disabled="r === rows.length - 1" @click="moveRow(r, r + 1)" />
                  <v-divider class="my-1" />
                  <MpMenuItem icon="trash-2" title="Remove size" danger @click="removeRow(r)" />
                </MpRowActionsMenu>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="!rows.length" class="size-chart-table__empty">No sizes yet. Add one to start the chart.</p>
    <!-- Screen readers hear a field's problem as its description; this line is for the eye. -->
    <p v-if="tableIssue || shownProblem" class="size-chart-table__error" aria-hidden="true">
      <v-icon icon="circle-alert" size="16" />
      {{ tableIssue || shownProblem }}
    </p>

    <div class="size-chart-table__add">
      <div data-add="size">
        <v-btn variant="text" prepend-icon="plus" class="text-none" @click="addRow">Add size</v-btn>
      </div>
      <div data-add="measurement">
        <v-btn variant="text" prepend-icon="plus" class="text-none" @click="addColumn">Add measurement</v-btn>
      </div>
    </div>

    <div class="d-sr-only" role="status" aria-live="polite" aria-atomic="true">{{ announcement }}</div>
  </div>
</template>

<style scoped>
/* The sticky Size column paints over the cells scrolling under it, in the surface
   around the grid: `--size-chart-table-bg`, set by a host on another surface, else
   the drawer panel's own. */
.size-chart-table {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
  min-width: 0;
}

.size-chart-table__scroll {
  overflow-x: auto;
  /* Room for a focused field's ring, so it is never clipped by the scroll box. */
  padding-block: var(--mp-space-2);
}

.size-chart-table__grid {
  width: 100%;
  border-collapse: separate;
  border-spacing: var(--mp-space-6) var(--mp-space-4);
  margin-inline: calc(var(--mp-space-6) * -1);
}

.size-chart-table__grid th,
.size-chart-table__grid td {
  padding: 0;
  vertical-align: middle;
  font-weight: var(--mp-fontWeight-regular);
  text-align: start;
}

.size-chart-table__label {
  font-size: var(--mp-text-label-fontSize);
  font-weight: var(--mp-text-label-fontWeight) !important;
  color: var(--text-secondary);
  padding-inline-start: var(--mp-space-2) !important;
}

/* The sizes stay put while wide charts scroll sideways. */
.size-chart-table__size {
  position: sticky;
  inset-inline-start: 0;
  z-index: 1;
  width: var(--mp-space-80);
  min-width: var(--mp-space-80);
  background: var(--size-chart-table-bg, var(--surface-overlay));
  /* Covers the spacing gap too, so a cell never shows through beside it. */
  box-shadow: calc(var(--mp-space-6) * -1) 0 0 var(--size-chart-table-bg, var(--surface-overlay));
}

.size-chart-table--scrolled .size-chart-table__size {
  box-shadow:
    calc(var(--mp-space-6) * -1) 0 0 var(--size-chart-table-bg, var(--surface-overlay)),
    var(--mp-space-4) 0 0 var(--size-chart-table-bg, var(--surface-overlay)),
    calc(var(--mp-space-4) + 1px) 0 0 var(--border-subtle);
}

.size-chart-table__measure {
  min-width: calc(var(--mp-space-48) * 3);
}

.size-chart-table__actions {
  width: var(--mp-component-control-height);
  text-align: center !important;
}

.size-chart-table__column-menu {
  display: flex;
  margin-block: calc(var(--mp-space-4) * -1);
  margin-inline-end: calc(var(--mp-space-6) * -1);
}

/* Grid cells are dense chrome: a tighter inset than a form field, so a name fits. */
.size-chart-table__field :deep(.v-field__input) {
  padding-inline: var(--mp-space-10);
}
/* The column menu button sits centred in the field and never makes it taller than a cell. */
.size-chart-table__field :deep(.v-field__append-inner) {
  align-items: center;
  padding-block: 0;
  padding-inline-start: 0;
}

/* The measurement names and sizes read as the headings they are. */
.size-chart-table__field--name :deep(input),
.size-chart-table__field--size :deep(input) {
  font-weight: var(--mp-fontWeight-medium);
}

.size-chart-table__empty {
  margin: 0;
  font-size: var(--mp-fontSize-13);
  color: var(--text-muted);
}

.size-chart-table__error {
  display: flex;
  align-items: center;
  gap: var(--mp-space-6);
  margin: 0;
  font-size: var(--mp-fontSize-13);
  color: rgb(var(--v-theme-error));
}

.size-chart-table__add {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-space-8);
  /* Text buttons sit on the grid's edge, not inset by their own padding. */
  margin-inline-start: calc(var(--mp-space-12) * -1);
}
</style>
