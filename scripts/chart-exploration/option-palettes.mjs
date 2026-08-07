/**
 * Option palettes for the chart visual-system exploration — the single hex
 * source for P4 validation. P5 copies these values into
 * src/plugins/chartPalette.ts, and the final token-freeze commit moves them
 * into tokens.json; this file remains the validated QA record.
 *
 * Tuned 2026-08-07 across 5 validator rounds (see notes/option-*.md for the
 * archived gate output). Policies:
 * - `mutedSlots`: zero-based series indexes that are DESIGNED de-emphasis
 *   slots (slate/steel): exempt from chroma floor + lightness band (documented
 *   deviation), still held to full adjacency ΔE gates.
 * - positive-vs-series ΔE 8–15 is a WARN legal only because positives always
 *   ship with icon + label (KPI pills use chevron + delta text) — the dataviz
 *   method's status-collision rule.
 */

export const OPTIONS = {
  optionA: {
    label: 'Restrained Blue',
    series: ['#0E72B8', '#5FB9EB', '#234E92', '#38A8DC', '#5C6B7A', '#AFC3D1'],
    mutedSlots: [4, 5],
    axis: ['#123B63', '#15568C', '#0E72B8', '#2E96D2', '#63BCE8'],
    semantic: {
      comparison: '#1B4F7A',
      positive: '#1B7A46',
      negative: '#C2402A',
      warning: '#B27B00',
      neutral: '#8A94A0',
    },
  },
  optionB: {
    label: 'Sophisticated Multi-Color',
    series: ['#2E6FC2', '#D4703A', '#17948C', '#6B5CC8', '#D078A3', '#515C67'],
    mutedSlots: [5],
    axis: ['#1E4E93', '#2E67B5', '#4A82CE', '#6C9DDF', '#8FB3E6'],
    semantic: {
      comparison: '#C2622E',
      positive: '#178A50',
      negative: '#C6403D',
      warning: '#B27B00',
      neutral: '#8A94A0',
    },
  },
  optionC: {
    label: 'Blue Teal Green',
    series: ['#0073AB', '#45C6E0', '#008268', '#4E9FDE', '#3FB68E', '#1F5099'],
    mutedSlots: [],
    axis: ['#0B3D5C', '#00618F', '#0073AB', '#1D96BE', '#4FC2CE'],
    semantic: {
      comparison: '#2E9E6B',
      positive: '#38761D',
      negative: '#C2402A',
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
