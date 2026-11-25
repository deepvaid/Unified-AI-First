// Who a piece of clothing is for (men, women, or everyone) and what of a shared
// size chart applies to it. A clothing store's product page (the size guide and
// the row of other products) and its chat assistant read the same rules, so they
// agree. Pure rules: no Vue, no Pinia, no `@/` imports, so `npm run test:storefront`
// and `npm run test:chatbot` run them in Node.

import type { SizeChart } from './sizeCharts.ts'

/** Who a piece or a request is for. */
export type Audience = 'him' | 'her'

/** The collection names that mean men's and women's clothes. */
export interface AudienceWords {
  him: RegExp
  her: RegExp
}

export const AUDIENCE_WORDS: AudienceWords = {
  him: /^(men|mens|men’s|men's|man)$/i,
  her: /^(women|womens|women’s|women's|woman)$/i,
}

/**
 * Who a piece is for: its collections say (Men, Women), else its subtitle ("Men's
 * boxy tee"). Null when it is in both, or in neither and its subtitle does not say.
 */
export function audienceOf(collections: readonly string[], subtitle = '', words: AudienceWords = AUDIENCE_WORDS): Audience | null {
  const him = collections.some((c) => words.him.test(c.trim()))
  const her = collections.some((c) => words.her.test(c.trim()))
  if (him !== her) return him ? 'him' : 'her'
  if (him) return null
  if (/^men['’]?s\b/i.test(subtitle.trim())) return 'him'
  if (/^women['’]?s\b/i.test(subtitle.trim())) return 'her'
  return null
}

/** Whether two pieces may be shown together: the same audience, or one of them is for everyone. */
export function sharesAudience(a: Audience | null, b: Audience | null): boolean {
  return a === null || b === null || a === b
}

// ── A size chart for one audience ────────────────────────────────────────────

/** A chart column a piece shows: where its values are in each row, and its name for this piece. */
export interface ChartColumn {
  index: number
  label: string
}

const GENDERED = /^(women|men)['’]?s\s+/i

/**
 * A chart's columns for a piece: a column named "Women’s …" or "Men’s …" is kept only
 * for that audience, without the prefix ("Women’s bust" is "Bust"). A piece for
 * everyone keeps them all as written.
 */
export function columnsForAudience(columns: readonly string[], audience: Audience | null): ChartColumn[] {
  return columns.flatMap((name, index) => {
    const gendered = GENDERED.exec(name)
    if (!gendered || !audience) return [{ index, label: name }]
    const forHer = gendered[1]!.toLowerCase() === 'women'
    const label = name.replace(GENDERED, '')
    return forHer === (audience === 'her') ? [{ index, label: label.charAt(0).toUpperCase() + label.slice(1) }] : []
  })
}

/** A value a chart leaves blank: nothing, or a dash ("—", a size a column doesn't have). */
const BLANK = /^[-–—]?$/

/**
 * The chart as a piece's size guide shows it: its columns for the audience (see
 * `columnsForAudience`), each row's values to match, without a size whose values are
 * all blank for it (a men's boot is not made in a women's 6), and without the "How to
 * measure" lines for a measurement only the other audience's columns take ("Bust:"
 * on a men's jacket).
 */
export function chartForAudience<C extends SizeChart>(chart: C, audience: Audience | null): C {
  const kept = columnsForAudience(chart.columns, audience)
  if (kept.length === chart.columns.length) return chart
  const keptIndexes = new Set(kept.map((c) => c.index))
  const measureOf = (name: string) => name.replace(GENDERED, '').trim().toLowerCase()
  const keptWords = kept.map((c) => measureOf(c.label))
  const droppedWords = chart.columns.filter((_, index) => !keptIndexes.has(index)).map(measureOf)
  const names = (label: string, word: string) => !!word && label.includes(word)
  const lines = chart.howToMeasure.split('\n').filter((line) => {
    const label = /^([^:]{1,40}):/.exec(line.trim())?.[1]?.trim().toLowerCase()
    if (!label) return true
    return !droppedWords.some((word) => names(label, word)) || keptWords.some((word) => names(label, word))
  })
  return {
    ...chart,
    columns: kept.map((c) => c.label),
    rows: chart.rows
      .map((row) => ({ ...row, values: kept.map((c) => row.values[c.index] ?? '') }))
      .filter((row) => !kept.length || row.values.some((value) => !BLANK.test(value.trim()))),
    howToMeasure: lines.join('\n'),
  }
}
