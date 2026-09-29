// Turns "Show top products as a pie chart" into a supported dashboard widget.
//
// Pure (type-only imports plus two data modules) so the resolver is unit-tested under
// `node --test` against the real metric catalog — see tests/davinci/widgetRequest.test.ts.
//
// The contract: never draft something the dashboard can't draw, never silently swap
// what the merchant asked for. When the request can't be honoured exactly, resolve to
// the closest thing the catalog CAN do and say so in `note`.

import { DASHBOARD_SOURCE_META, type DashboardMetricDescriptor } from '../stores/dashboards/metricCatalog.ts'
import { DASHBOARD_RANGE_LABELS } from '../stores/dashboards/rangeLabels.ts'
import { WIDGET_LIBRARY } from '../stores/dashboards/widgetLibrary.ts'
import type {
  DashboardChartVariant,
  DashboardDatePreset,
  DashboardWidgetBlocker,
  DashboardWidgetDraft,
  DashboardWidgetType,
} from '../stores/dashboards/types.ts'

// ── Options: the ways a metric can be drawn ──────────────────────────────────

export interface WidgetOption {
  key: string
  type: DashboardWidgetType
  chartVariant?: DashboardChartVariant
  /** Short tile label ("Line", "Ranked list"). */
  label: string
  /** How it reads in a sentence ("line chart"). */
  noun: string
  icon: string
}

function option(
  key: string,
  type: DashboardWidgetType,
  label: string,
  noun: string,
  icon: string,
  chartVariant?: DashboardChartVariant,
): WidgetOption {
  return chartVariant ? { key, type, label, noun, icon, chartVariant } : { key, type, label, noun, icon }
}

const LINE = option('line', 'timeseries', 'Line', 'line chart', 'line-chart', 'line')
const AREA = option('area', 'timeseries', 'Area', 'area chart', 'area-chart', 'area')
const STACKED_AREA = option('stacked-area', 'timeseries', 'Stacked area', 'stacked area chart', 'area-chart', 'stacked-area')
const COLUMN = option('column', 'bar', 'Column', 'column chart', 'chart-column', 'vertical')
const BAR = option('bar', 'bar', 'Bar', 'bar chart', 'chart-bar-big', 'horizontal')
const STACKED_COLUMN = option('stacked-column', 'bar', 'Stacked columns', 'stacked column chart', 'chart-column', 'stacked-column')

const SINGLE: Partial<Record<DashboardWidgetType, WidgetOption>> = {
  kpi: option('kpi', 'kpi', 'KPI', 'KPI tile', 'layout-grid'),
  pie: option('pie', 'pie', 'Pie', 'pie chart', 'pie-chart'),
  donut: option('donut', 'donut', 'Donut', 'donut chart', 'chart-pie'),
  table: option('table', 'table', 'Table', 'table', 'table'),
  bar_list: option('list', 'bar_list', 'Ranked list', 'ranked list', 'list-ordered'),
  gauge: option('gauge', 'gauge', 'Gauge', 'gauge', 'goal'),
  heatmap: option('heatmap', 'heatmap', 'Heatmap', 'heatmap', 'grid-3x3'),
  funnel: option('funnel', 'funnel', 'Funnel', 'funnel', 'filter'),
  stacked_bar: option('stacked', 'stacked_bar', 'Stacked bars', 'stacked bar chart', 'bar-chart-3'),
  breakdown: option('breakdown', 'breakdown', 'Breakdown', 'breakdown list', 'list'),
  activity: option('activity', 'activity', 'Activity feed', 'activity feed', 'list'),
  attention: option('attention', 'attention', 'Attention list', 'attention list', 'bell-ring'),
  insights: option('insights', 'insights', 'Insights', 'insights panel', 'sparkles'),
  metric_explorer: option('explorer', 'metric_explorer', 'Metric explorer', 'metric explorer', 'chart-spline'),
  tabs: option('tabs', 'tabs', 'Tabbed lists', 'tabbed list', 'layout-list'),
  palette: option('palette', 'palette', 'Palette review', 'palette review', 'palette'),
  setup: option('setup', 'setup', 'Setup guide', 'setup guide', 'list-checks'),
}

/** The look the dashboard itself gives a metric (stacked areas, stacked columns…). */
const NATURAL_VARIANT = new Map<string, DashboardChartVariant>()
for (const entry of WIDGET_LIBRARY) {
  if (entry.chartVariant && !NATURAL_VARIANT.has(entry.metricId)) NATURAL_VARIANT.set(entry.metricId, entry.chartVariant)
}

/** Every way `metric` can be drawn — what the Refine dialog offers. */
export function optionsForMetric(metric: DashboardMetricDescriptor): WidgetOption[] {
  const natural = NATURAL_VARIANT.get(metric.id)
  const out: WidgetOption[] = []
  for (const type of metric.supportedWidgetTypes) {
    if (type === 'timeseries') out.push(...(natural === 'stacked-area' ? [STACKED_AREA] : []), LINE, AREA)
    else if (type === 'bar') out.push(...(natural === 'stacked-column' ? [STACKED_COLUMN] : []), COLUMN, BAR)
    else {
      const single = SINGLE[type]
      if (single) out.push(single)
    }
  }
  return out
}

/**
 * The option a widget of this type/variant actually renders as. Time series without a
 * variant render as an area (DashboardChartWidget.apexChartType) and bars without one
 * render as columns — so those are what they are called.
 */
export function optionFor(type: DashboardWidgetType, variant?: DashboardChartVariant): WidgetOption {
  if (type === 'timeseries') return variant === 'line' ? LINE : variant === 'stacked-area' ? STACKED_AREA : AREA
  if (type === 'bar') return variant === 'horizontal' ? BAR : variant === 'stacked-column' ? STACKED_COLUMN : COLUMN
  return SINGLE[type] ?? SINGLE.kpi!
}

/** The metric's own default look — always with an explicit variant. */
export function defaultOption(metric: DashboardMetricDescriptor): WidgetOption {
  const type = metric.defaultWidgetType
  const natural = NATURAL_VARIANT.get(metric.id)
  if (type === 'timeseries') return optionFor(type, natural === 'stacked-area' ? 'stacked-area' : 'area')
  if (type === 'bar') return optionFor(type, natural === 'stacked-column' ? 'stacked-column' : 'vertical')
  return optionFor(type)
}

const CHART_TYPES = new Set<DashboardWidgetType>([
  'timeseries', 'bar', 'pie', 'donut', 'stacked_bar', 'bar_list', 'gauge', 'heatmap', 'funnel',
])
const isChartOption = (o: WidgetOption) => CHART_TYPES.has(o.type)
const isTimeOption = (o: WidgetOption) => o.type === 'timeseries'

// ── Parsing ──────────────────────────────────────────────────────────────────

export type ChartFamily =
  | 'line' | 'area' | 'bar' | 'column' | 'pie' | 'donut' | 'table' | 'list' | 'kpi'
  | 'gauge' | 'heatmap' | 'funnel' | 'scatter' | 'stacked' | 'chart' | 'widget'

export interface ParsedWidgetRequest {
  /** Normalised prompt. */
  text: string
  /** Singularised tokens of `text`. */
  tokens: string[]
  family: ChartFamily | null
  timeShape: boolean
  grain: 'day' | 'week' | 'month' | null
  dimension: string | null
  range: { preset: DashboardDatePreset | null; phrase: string } | null
}

export function normalizePrompt(text: string): string {
  return text.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim()
}

function singular(word: string): string {
  if (word.length <= 3) return word
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`
  if (word.endsWith('ss') || word.endsWith('us') || word.endsWith('is')) return word
  if (/(?:ch|sh|x|z|s)es$/.test(word)) return word.slice(0, -2)
  if (word.endsWith('s')) return word.slice(0, -1)
  return word
}

export function tokenize(text: string): string[] {
  return normalizePrompt(text)
    .replace(/[^a-z0-9%&' -]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(singular)
}

const RANGE_LEAD = '(?:for |in |over |during |within )?(?:the )?'
const RANGE_PATTERNS: Array<{ re: RegExp; preset: DashboardDatePreset | null }> = [
  { re: new RegExp(`\\b${RANGE_LEAD}(?:last|past|previous)\\s+(?:7|seven)\\s+days?\\b`), preset: 'last_7_days' },
  { re: new RegExp(`\\b${RANGE_LEAD}(?:last|past|previous)\\s+(?:30|thirty)\\s+days?\\b`), preset: 'last_30_days' },
  { re: new RegExp(`\\b${RANGE_LEAD}(?:last|past|previous)\\s+(?:90|ninety)\\s+days?\\b`), preset: 'last_90_days' },
  { re: /\btoday\b/, preset: 'today' },
  { re: /\byesterday\b/, preset: 'yesterday' },
  { re: /\b(?:this month|month to date|mtd)\b/, preset: 'month_to_date' },
  { re: /\b(?:this quarter|quarter to date|qtd)\b/, preset: 'quarter_to_date' },
  { re: /\b(?:this year|year to date|ytd)\b/, preset: 'year_to_date' },
  { re: /\b(?:black friday|cyber monday|bfcm)\b/, preset: 'black_friday_cyber_monday' },
  { re: new RegExp(`\\b${RANGE_LEAD}(?:last|past|previous|this)\\s+(?:\\d+\\s+)?(?:day|week|month|quarter|year)s?\\b`), preset: null },
]

const FAMILY_PATTERNS: Array<{ family: ChartFamily; re: RegExp }> = [
  { family: 'scatter', re: /\bscatter(?: ?plot| chart| graph)?\b/ },
  { family: 'heatmap', re: /\bheat ?maps?\b|\bmatrix\b/ },
  { family: 'gauge', re: /\bgauges?\b|\bdial\b/ },
  { family: 'funnel', re: /\bfunnels?\b/ },
  { family: 'donut', re: /\bdo(?:ugh)?nuts?\b/ },
  { family: 'pie', re: /\bpie(?: chart| graph)?s?\b/ },
  { family: 'stacked', re: /\bstacked\b/ },
  { family: 'area', re: /\barea (?:chart|graph|plot)s?\b|\bas an? area\b/ },
  { family: 'line', re: /\bline (?:chart|graph|plot)s?\b|\bas an? line\b/ },
  { family: 'column', re: /\bcolumns?(?: chart| graph)?s?\b|\bvertical bars?\b|\bas an? column\b/ },
  { family: 'bar', re: /\b(?:horizontal )?bars?(?: chart| graph)?s?\b|\bas an? bar\b/ },
  { family: 'table', re: /\btables?\b/ },
  { family: 'list', re: /\b(?:ranked|progress) lists?\b/ },
  { family: 'kpi', re: /\bkpis?\b|\bscorecards?\b/ },
  { family: 'chart', re: /\b(?:charts?|graphs?|plots?|visuali[sz]ations?)\b/ },
  { family: 'widget', re: /\b(?:widgets?|tiles?)\b/ },
]

const DIMENSION_RE =
  /\b(?:by|per|across) (day of (?:the )?week|weekday|sales channel|channel|email domain|domain|device(?: type)?|country|market|product(?: name)?|folder|type|status|location|store|segment|campaign|source|region|category|customer type)\b/
const GRAIN_RE = /\b(?:by|per|each|every) (day|week|month)\b(?! of)|\b(daily|weekly|monthly)\b/
const TIME_SHAPE_RE = /\bover time\b|\btrend(?:s|ing)?\b|\bhistor(?:y|ical)\b|\bgrowth\b|\btimeline\b|\btime series\b/

// "Da Vinci, show orders" must not match the Da Vinci Insights widget.
const VOCATIVE_RE = /\b(?:ask |hey |hi |ok |okay )?da ?vinci\b[,:!]?\s*/gi

const SYNONYMS: Record<string, string> = { sale: 'revenue', gmv: 'revenue', earning: 'revenue', purchase: 'order', audience: 'contact' }

export function parseWidgetRequest(prompt: string): ParsedWidgetRequest {
  const text = normalizePrompt(prompt.replace(VOCATIVE_RE, ' '))

  let range: ParsedWidgetRequest['range'] = null
  for (const { re, preset } of RANGE_PATTERNS) {
    const m = re.exec(text)
    if (m) {
      range = { preset, phrase: m[0].replace(/^(?:for|in|over|during|within) /, '').replace(/^the /, '') }
      break
    }
  }

  let family: ChartFamily | null = null
  for (const entry of FAMILY_PATTERNS) {
    if (entry.re.test(text)) {
      family = entry.family
      break
    }
  }

  const dimension = DIMENSION_RE.exec(text)?.[1]?.replace(/ the /, ' ') ?? null
  const grainMatch = GRAIN_RE.exec(text)
  const grainWord = grainMatch?.[1] ?? grainMatch?.[2] ?? null
  const grain = grainWord === 'week' || grainWord === 'weekly' ? 'week'
    : grainWord === 'month' || grainWord === 'monthly' ? 'month'
      : grainWord ? 'day' : null
  const timeShape = !!grain || family === 'line' || family === 'area' || TIME_SHAPE_RE.test(text)

  return { text, tokens: tokenize(text), family, timeShape, grain, dimension, range }
}

// ── Candidate scoring ────────────────────────────────────────────────────────

const LABEL_STOP = new Set(['by', 'of', 'vs', 'and', 'the', 'a', 'per', 'to', 'for', 'in', 'on', 'over', 'time', 'trend', 'growth', 'volume'])

const DOMAIN_WORDS: Partial<Record<DashboardMetricDescriptor['dataSource'], RegExp>> = {
  retail: /\b(?:retail|pos|point[- ]of[- ]sale|in[- ]store|registers?|tills?)\b/,
  merchandising: /\b(?:merch|merchandis(?:e|ing)|merchcloud|merch cloud)\b/,
}

function containsPhrase(tokens: string[], phrase: string[]): boolean {
  if (!phrase.length || phrase.length > tokens.length) return false
  outer: for (let start = 0; start <= tokens.length - phrase.length; start += 1) {
    for (let i = 0; i < phrase.length; i += 1) if (tokens[start + i] !== phrase[i]) continue outer
    return true
  }
  return false
}

interface Candidate {
  metric: DashboardMetricDescriptor
  index: number
  keywordScore: number
  score: number
  domainScoped: boolean
}

function candidate(metric: DashboardMetricDescriptor, index: number, req: ParsedWidgetRequest, pool: Set<string>): Candidate | null {
  const hits = metric.aiKeywords.filter((keyword) => containsPhrase(req.tokens, tokenize(keyword)))
  const label = tokenize(metric.label).filter((token) => !LABEL_STOP.has(token))
  const matched = label.filter((token) => pool.has(token)).length
  const clean = label.length > 0 && matched === label.length
  // Minimum evidence: a whole-phrase keyword hit, or every word of the label present.
  if (!hits.length && !clean) return null

  const domain = DOMAIN_WORDS[metric.dataSource]
  if (domain && !domain.test(req.text) && !hits.some((keyword) => keyword.includes(' '))) return null

  const keywordScore = hits.reduce((total, keyword) => total + keyword.length, 0)
  return { metric, index, keywordScore, score: keywordScore + matched * 3 - (label.length - matched), domainScoped: !!domain }
}

// ── Fit: how well can the metric draw what was asked? ────────────────────────

type Fit = { level: 0 | 1 | 2 | 3; option: WidgetOption }

const FAMILY_KEYS: Record<Exclude<ChartFamily, 'chart' | 'widget' | 'scatter'>, string[]> = {
  line: ['line'],
  area: ['area', 'stacked-area'],
  bar: ['bar', 'column', 'stacked-column'],
  column: ['column', 'bar', 'stacked-column'],
  pie: ['pie', 'donut'],
  donut: ['donut', 'pie'],
  table: ['table'],
  list: ['list', 'table', 'breakdown'],
  kpi: ['kpi'],
  gauge: ['gauge'],
  heatmap: ['heatmap'],
  funnel: ['funnel'],
  stacked: ['stacked', 'stacked-column', 'stacked-area'],
}

/** Families that degrade to "the closest chart" when the exact one isn't available. */
const CHART_FAMILIES = new Set<ChartFamily>(['line', 'area', 'bar', 'column', 'pie', 'donut', 'scatter', 'stacked', 'chart', 'heatmap', 'gauge', 'funnel'])

const CATEGORICAL_ORDER = ['column', 'donut', 'pie', 'stacked', 'heatmap', 'list', 'table', 'breakdown']

/** A categorical view of the metric — its own default look when it has one (stacked columns stay stacked). */
function firstCategorical(metric: DashboardMetricDescriptor, opts: WidgetOption[]): WidgetOption | undefined {
  const natural = defaultOption(metric)
  if (opts.some((o) => o.key === natural.key) && natural.type !== 'timeseries' && natural.type !== 'kpi') return natural
  for (const key of CATEGORICAL_ORDER) {
    const found = opts.find((o) => o.key === key)
    if (found) return found
  }
  return undefined
}

function defaultChart(metric: DashboardMetricDescriptor, opts: WidgetOption[]): WidgetOption | undefined {
  const fallback = defaultOption(metric)
  if (isChartOption(fallback)) return fallback
  return opts.find(isChartOption)
}

function fit(metric: DashboardMetricDescriptor, req: ParsedWidgetRequest): Fit {
  const opts = optionsForMetric(metric)
  const timeOption = opts.find(isTimeOption)
  const preferredTime = req.family === 'line' ? LINE : req.family === 'area' ? AREA : undefined

  if (req.family === 'chart' && opts.some(isChartOption)) {
    if (req.timeShape && timeOption) return { level: 3, option: defaultOption(metric).type === 'timeseries' ? defaultOption(metric) : timeOption }
    if (req.dimension) {
      const categorical = firstCategorical(metric, opts)
      if (categorical) return { level: 3, option: categorical }
    }
    return { level: 3, option: defaultChart(metric, opts) ?? defaultOption(metric) }
  }

  if (req.family && req.family !== 'widget' && req.family !== 'chart' && req.family !== 'scatter') {
    for (const key of FAMILY_KEYS[req.family]) {
      const exact = opts.find((o) => o.key === key)
      if (exact && (!req.timeShape || isTimeOption(exact) || !!timeOption)) return { level: 3, option: exact }
    }
  }

  if (req.timeShape && timeOption) {
    const natural = defaultOption(metric)
    return { level: 2, option: preferredTime ?? (natural.type === 'timeseries' ? natural : timeOption) }
  }
  if (req.dimension) {
    const categorical = firstCategorical(metric, opts)
    if (categorical) return { level: 2, option: categorical }
  }
  if (req.family && CHART_FAMILIES.has(req.family)) {
    const chart = defaultChart(metric, opts)
    if (chart) return { level: 1, option: chart }
  }
  return { level: 0, option: defaultOption(metric) }
}

// ── Honest notes ─────────────────────────────────────────────────────────────

export const FAMILY_NOUN: Record<ChartFamily, string> = {
  line: 'line chart', area: 'area chart', bar: 'bar chart', column: 'column chart', pie: 'pie chart',
  donut: 'donut chart', table: 'table', list: 'ranked list', kpi: 'KPI tile', gauge: 'gauge',
  heatmap: 'heatmap', funnel: 'funnel', scatter: 'scatter plot', stacked: 'stacked bar chart',
  chart: 'chart', widget: 'widget',
}

const article = (noun: string) => (/^[aeiou]/i.test(noun) ? `an ${noun}` : `a ${noun}`)
const joinOr = (items: string[]) => (items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}`)

function mentions(metric: DashboardMetricDescriptor, dimension: string): boolean {
  const pool = new Set(tokenize(`${metric.label} ${metric.description} ${metric.aiKeywords.join(' ')}`))
  return tokenize(dimension).every((token) => pool.has(token) || LABEL_STOP.has(token))
}

function buildNote(
  metric: DashboardMetricDescriptor,
  chosen: WidgetOption,
  req: ParsedWidgetRequest,
  dashboardRange: DashboardDatePreset | undefined,
): string | undefined {
  const parts: string[] = []
  const opts = optionsForMetric(metric)
  const family = req.family

  const met = !!family && (
    family === 'chart' || family === 'widget'
    || (family !== 'scatter' && FAMILY_KEYS[family].includes(chosen.key))
  )

  if (family === 'scatter') {
    parts.push(`Scatter plots aren't available, so I drafted ${metric.label} as ${article(chosen.noun)}.`)
  } else if (family && !met) {
    const asked = article(FAMILY_NOUN[family])
    parts.push(opts.length === 1
      ? `${metric.label} can only be shown as ${article(chosen.noun)}, so I drafted that instead of ${asked}.`
      : `${metric.label} can be drawn as ${joinOr(opts.map((o) => article(o.noun)))}, so I drafted ${article(chosen.noun)} instead of ${asked}.`)
  } else if (req.timeShape && !family && !isTimeOption(chosen) && !opts.some(isTimeOption)) {
    parts.push(`${metric.label} isn't tracked over time yet, so I drafted ${article(chosen.noun)}.`)
  }

  if (req.dimension && !mentions(metric, req.dimension) && !parts.length) {
    parts.push(`${metric.label} isn't broken down by ${req.dimension}, so I drafted ${article(chosen.noun)}.`)
  }

  if (req.grain && req.grain !== 'day' && isChartOption(chosen)) {
    const unit = metric.timeBasis === 'sends' ? 'send' : 'day'
    parts.push(`It plots one point per ${unit} — ${req.grain === 'week' ? 'weekly' : 'monthly'} buckets aren't available.`)
  }

  if (req.range) {
    const { preset, phrase } = req.range
    if (metric.timeBasis === 'sends') parts.push(`${metric.label} is plotted per send (your latest sends), so it doesn't follow a date range.`)
    else if (metric.timeBasis === 'all_time') parts.push(`${metric.label} covers all time, not ${phrase}.`)
    else if (metric.timeBasis === 'latest') parts.push(`${metric.label} lists the most recent records, whatever the date range.`)
    else if (dashboardRange && preset !== dashboardRange) {
      parts.push(`Widgets follow this dashboard’s date range (${DASHBOARD_RANGE_LABELS[dashboardRange]}), not ${phrase} — change it from the dashboard’s date picker.`)
    }
  }

  return parts.length ? parts.join(' ') : undefined
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface WidgetResolution {
  metric: DashboardMetricDescriptor
  option: WidgetOption
  type: DashboardWidgetType
  chartVariant: DashboardChartVariant | undefined
  /** Set whenever the draft differs from what was asked for. */
  note?: string
  request: ParsedWidgetRequest
}

export function resolveWidgetRequest(
  prompt: string,
  metrics: DashboardMetricDescriptor[],
  opts: { dashboardRange?: DashboardDatePreset } = {},
): WidgetResolution | null {
  const req = parseWidgetRequest(prompt)
  const pool = new Set(req.tokens)
  for (const token of req.tokens) {
    const synonym = SYNONYMS[token]
    if (synonym) pool.add(synonym)
  }

  const ranked = metrics
    .map((metric, index) => candidate(metric, index, req, pool))
    .filter((c): c is Candidate => c !== null)
    .map((c) => {
      const f = fit(c.metric, req)
      const defaultType = c.metric.defaultWidgetType
      const shapeMatch = (req.dimension && defaultType !== 'timeseries' && defaultType !== 'kpi')
        || (req.timeShape && defaultType === 'timeseries')
      return { ...c, ...f, shapeMatch: !!shapeMatch }
    })
    .sort((a, b) =>
      b.level - a.level
      || b.score - a.score
      || b.keywordScore - a.keywordScore
      || Number(a.domainScoped) - Number(b.domainScoped)
      || Number(b.shapeMatch) - Number(a.shapeMatch)
      || a.index - b.index)

  const best = ranked[0]
  if (!best) return null
  return {
    metric: best.metric,
    option: best.option,
    type: best.option.type,
    chartVariant: best.option.chartVariant,
    note: buildNote(best.metric, best.option, req, opts.dashboardRange),
    request: req,
  }
}

export function draftFromResolution(
  resolution: WidgetResolution,
  dashboardId: string,
  prompt: string,
): Omit<DashboardWidgetDraft, 'lastRefreshedAt'> {
  const { metric, option } = resolution
  return {
    dashboardId,
    type: resolution.type,
    ...(resolution.chartVariant ? { chartVariant: resolution.chartVariant } : {}),
    title: metric.defaultTitle,
    dataSource: metric.dataSource,
    metricId: metric.id,
    drilldown: metric.drilldown,
    aiProvenance: {
      prompt,
      summary: `Da Vinci mapped your prompt to ${metric.label} as ${article(option.noun)}.`,
    },
  }
}

/** One line for the "Why these" block. */
export function rationaleFor(resolution: WidgetResolution): string {
  const { metric, option } = resolution
  const source = DASHBOARD_SOURCE_META[metric.dataSource].label
  const others = optionsForMetric(metric).filter((o) => o.key !== option.key).map((o) => o.label.toLowerCase())
  const base = `I matched this to ${metric.label} from ${source}.`
  return others.length ? `${base} Use Refine to switch it to ${joinOr(others)}.` : `${base} It has one view, so there is nothing to switch in Refine.`
}

/** What span a draft covers, for its subtitle — the dashboard's range unless the metric ignores it. */
export function timeBasisLabel(metric: DashboardMetricDescriptor, range: DashboardDatePreset): string {
  if (metric.timeBasis === 'sends') return 'Latest sends'
  if (metric.timeBasis === 'all_time') return 'All time'
  if (metric.timeBasis === 'latest') return 'Most recent'
  return DASHBOARD_RANGE_LABELS[range]
}

export function addBlockerMessage(blocker: DashboardWidgetBlocker): string {
  switch (blocker.reason) {
    case 'dashboard-full':
      return `${blocker.dashboardName} already has ${blocker.limit} widgets, the most a dashboard can hold. Remove one, or add this to another dashboard.`
    case 'unsupported':
      return `${blocker.metricLabel} isn't available on this account, so it can't be added to a dashboard.`
    case 'missing-dashboard':
      return 'There is no dashboard to add this to. Open or create a dashboard first.'
  }
}
