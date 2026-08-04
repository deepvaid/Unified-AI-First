// Chart math + palette for the dotted Overview v2 widget family.
// Geometry ported from the approved Claude Design mockup
// ("Dashboard Overview v2 - dotted"); see the lab twin in
// src/views/ShadcnDashboard/dottedDemoData.ts.

export const CHART_W = 720
export const CHART_H = 200

/** Light-optimized dotted-chart ramp; stays literal across themes (accepted).
    Drifts blue → teal segment-by-segment to echo FUNNEL_GRADIENT_STOPS. */
export const DOTTED_BLUES = ['#0092D4', '#21A4DE', '#45B7E6', '#59C6D8', '#7AD4CB', '#B0E9DF'] as const

/** 4-slice pie palette ("Orders by sales channel"), same blue → teal drift. */
export const DOTTED_PIE_BLUES = ['#0092D4', '#3AB2E4', '#63C6DE', '#9FE2D8'] as const

export const BAR_GRADIENT = 'linear-gradient(90deg, #0092D4 0%, #3FB4E6 60%, #63CDEF 100%)'
export const BAR_GRADIENT_GREEN = 'linear-gradient(90deg, #1f8a5b 0%, #3FB489 100%)'

export const FUNNEL_GRADIENT_STOPS = [
  { offset: '0%', color: '#5B5BF0' },
  { offset: '28%', color: '#3B82E8' },
  { offset: '52%', color: '#2E9FD4' },
  { offset: '76%', color: '#35B9D6' },
  { offset: '100%', color: '#4EC3F0' },
] as const

export function niceMax(v: number): number {
  const step = Math.pow(10, Math.floor(Math.log10(v))) / 2
  return Math.ceil(v / step) * step
}

export function shortCurrency(n: number): string {
  return n >= 1000 ? '$' + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k' : '$' + Math.round(n)
}

export function bounds(vals: number[], zeroBased: boolean): [number, number] {
  const mx = Math.max(...vals)
  const mn = Math.min(...vals)
  // 10% headroom above the max so the cardinal curve's rounded peaks never
  // reach the plot top (they'd be sheared flat by the clipPath).
  if (zeroBased) return [0, niceMax((mx || 1) * 1.1)]
  const pad = (mx - mn) * 0.45 || mx * 0.1 || 1
  return [Math.max(0, mn - pad), mx + pad * 0.4]
}

/** Y position on the 200-tall canvas for a value within [min, max]. */
export function valueToY(value: number, max: number, min = 0): number {
  if (max === min) return CHART_H
  return CHART_H - ((value - min) / (max - min)) * CHART_H
}

/**
 * Flowing cardinal (Catmull-Rom) path through the points on the 720×200 design
 * canvas — the rounded curve shadcn's `type="natural"` produces. Tangents are
 * never zeroed at a local extremum, so peaks and valleys stay smooth instead of
 * developing corners. The small overshoot this can introduce is clipped to the
 * plot box by the chart's clipPath, so it never shows.
 */
export function linePath(vals: number[], max: number, min = 0): string {
  const n = vals.length
  if (n < 2 || max === min) return ''
  const stepX = CHART_W / (n - 1)
  // Clamped index lookup — duplicating the endpoints is the standard way to
  // give the first and last segment a Catmull-Rom tangent.
  const y = (i: number) => valueToY(vals[Math.min(n - 1, Math.max(0, i))] ?? 0, max, min)

  let d = `M 0.0 ${y(0).toFixed(1)}`
  for (let i = 0; i < n - 1; i++) {
    const x1 = (i + 1) * stepX
    const c1y = y(i) + (y(i + 1) - y(i - 1)) / 6
    const c2y = y(i + 1) - (y(i + 2) - y(i)) / 6
    d += ` C ${(i * stepX + stepX / 3).toFixed(1)} ${c1y.toFixed(1)}, ${(x1 - stepX / 3).toFixed(1)} ${c2y.toFixed(1)}, ${x1.toFixed(1)} ${y(i + 1).toFixed(1)}`
  }
  return d
}

export interface RingSegment {
  dash: string
  offset: number
}

/**
 * Stroke dash segments for the r=54 ring donut (viewBox 140), with the
 * mockup's 2-unit gap between segments.
 */
export function ringSegments(values: number[], r = 54, gap = 2): RingSegment[] {
  const circ = 2 * Math.PI * r
  const total = values.reduce((a, b) => a + b, 0)
  if (total <= 0) return []
  const usable = circ - values.length * gap
  const segments: RingSegment[] = []
  let consumed = 0
  values.forEach((v, i) => {
    const len = (v / total) * usable
    segments.push({
      dash: `${len.toFixed(1)} ${(circ - len).toFixed(1)}`,
      offset: -(consumed + i * gap),
    })
    consumed += len
  })
  return segments
}

/**
 * Solid pie wedge paths on the mockup's viewBox 120 canvas (center 60, r 56),
 * starting at 12 o'clock and sweeping clockwise.
 */
export function pieWedges(values: number[], cx = 60, cy = 60, r = 56): string[] {
  const total = values.reduce((a, b) => a + b, 0)
  if (total <= 0) return []
  if (values.filter((v) => v > 0).length === 1) {
    // Single non-zero slice: a full circle (arc path degenerates).
    return values.map((v) => (v > 0 ? `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0 Z` : ''))
  }
  const pt = (angle: number): [number, number] => [
    cx + r * Math.sin(angle),
    cy - r * Math.cos(angle),
  ]
  let start = 0
  return values.map((v) => {
    const sweep = (v / total) * Math.PI * 2
    const [x1, y1] = pt(start)
    const [x2, y2] = pt(start + sweep)
    const largeArc = sweep > Math.PI ? 1 : 0
    start += sweep
    return `M${cx} ${cy} L${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
  })
}

/**
 * Symmetric funnel path on the mockup's 1200×260 canvas. `shares` are stage
 * sizes as fractions of the first stage (0–1). Heights use the mockup's
 * perceptual scaling (share^0.42) so tiny tail stages stay visible; boundary
 * transitions are the mockup's midpoint C-curves; the last column runs
 * straight to the right edge.
 */
export function funnelPath(shares: number[], w = 1200, h = 260, exponent = 0.42): string {
  const n = shares.length
  if (n < 2) return ''
  const colW = w / n
  const midY = h / 2
  const maxHalf = midY - 10
  const half = shares.map((s) => Math.max(0.02, Math.pow(Math.max(s, 0), exponent)) * maxHalf)
  const topY = half.map((hh) => midY - hh)
  const botY = half.map((hh) => midY + hh)
  const f = (v: number) => Number(v.toFixed(1))

  let d = `M0 ${f(topY[0]!)}`
  for (let i = 1; i < n; i++) {
    const x = i * colW
    const cx = x - colW / 2
    d += ` C${f(cx)} ${f(topY[i - 1]!)} ${f(cx)} ${f(topY[i]!)} ${f(x)} ${f(topY[i]!)}`
  }
  d += ` L${w} ${f(topY[n - 1]!)} L${w} ${f(botY[n - 1]!)} L${f((n - 1) * colW)} ${f(botY[n - 1]!)}`
  for (let i = n - 2; i >= 0; i--) {
    const x = i * colW
    const cx = x + colW / 2
    d += ` C${f(cx)} ${f(botY[i + 1]!)} ${f(cx)} ${f(botY[i]!)} ${f(x)} ${f(botY[i]!)}`
  }
  return d + ' Z'
}
