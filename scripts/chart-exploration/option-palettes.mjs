/**
 * Option palettes for the chart colour-option review — the single hex
 * source for validation. Values match `color.chart.light.option*` in
 * src/design-tokens/tokens.json (regenerate with `npm run tokens:build`).
 *
 * Tuned 2026-08-13 so supplied stakeholder hues pass adjacency / CVD /
 * lightness-band / chroma / semantic-contrast gates. Policies:
 * - `mutedSlots`: zero-based series indexes that are DESIGNED de-emphasis
 *   slots (slate/steel): exempt from chroma floor + lightness band (documented
 *   deviation), still held to full adjacency ΔE gates. A/B use none.
 * - positive-vs-series ΔE 8–15 is a WARN legal only because positives always
 *   ship with icon + label (KPI pills use chevron + delta text) — the dataviz
 *   method's status-collision rule.
 * - optionD is a leftover exploration theme, kept so the validator still
 *   covers it; it is not part of the three-option stakeholder review.
 */

export const OPTIONS = {
  optionA: {
    label: 'Single Blue',
    series: ['#0B5CAD', '#76B8F0', '#005889', '#4AA6D8', '#006C98', '#479CC9'],
    mutedSlots: [],
    axis: ['#024180', '#205899', '#3870B3', '#5088CD', '#68A1E7'],
    semantic: {
      comparison: '#597494',
      positive: '#1B7A46',
      negative: '#C2402A',
      warning: '#B27B00',
      neutral: '#8A94A0',
    },
  },
  optionB: {
    label: 'Multi Colour',
    series: ['#1689C9', '#F28E2B', '#009B94', '#E15759', '#266099', '#59A14F'],
    mutedSlots: [],
    axis: ['#1E4E93', '#2E67B5', '#4A82CE', '#6C9DDF', '#8FB3E6'],
    semantic: {
      comparison: '#5A7390',
      positive: '#178A50',
      negative: '#C6403D',
      warning: '#B27B00',
      neutral: '#8A94A0',
    },
  },
  optionD: {
    label: 'Modern Gradient',
    series: ['#2563EB', '#9A8EF9', '#433AB8', '#33ABEE', '#A855D8', '#64748B'],
    mutedSlots: [5],
    axis: ['#312E81', '#4338CA', '#5B67EA', '#2E92E4', '#4FB3F2'],
    semantic: {
      comparison: '#C264C9',
      positive: '#148549',
      negative: '#C6403D',
      warning: '#B27B00',
      neutral: '#8A94A0',
    },
  },
}

/** The dashboard widget cards render on white in light mode. */
export const LIGHT_SURFACE = '#FFFFFF'
