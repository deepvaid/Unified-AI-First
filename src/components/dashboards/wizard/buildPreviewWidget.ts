import { getDefaultPreset } from '@/components/dashboards/widgetSizePresets'
import type {
  DashboardChartVariant,
  DashboardWidget,
  DashboardWidgetDraft,
  DashboardWidgetType,
} from '@/stores/dashboards/types'
import { getMetricDescriptor, type DashboardMetricDescriptor } from '@/stores/dashboards/metricCatalog'

export interface PreviewWidgetInput {
  draft?: DashboardWidgetDraft | null
  widgetId?: string
  type: DashboardWidgetType
  title: string
  subtitle?: string
  dataSource: DashboardWidget['dataSource']
  metricId: DashboardWidget['metricId']
  descriptor: DashboardMetricDescriptor
  chartVariant?: DashboardChartVariant
}

export function buildPreviewWidget(input: PreviewWidgetInput): DashboardWidget {
  const preset = getDefaultPreset(input.type)
  return {
    id: input.widgetId ?? input.draft?.widgetId ?? 'preview-widget',
    type: input.type,
    title: input.title || input.descriptor.defaultTitle,
    subtitle: input.subtitle ?? input.draft?.subtitle,
    dataSource: input.dataSource,
    metricId: input.metricId,
    dimension: input.draft?.dimension,
    chartVariant: input.chartVariant ?? input.draft?.chartVariant,
    layout: {
      x: 0,
      y: 0,
      w: preset.w,
      h: preset.h,
      minW: preset.minW,
      minH: preset.minH,
    },
    filters: input.draft?.filters,
    drilldown: input.descriptor.drilldown,
    aiProvenance: input.draft?.aiProvenance,
  }
}

/**
 * The widget a Da Vinci draft would become, for a live `DashboardWidgetCard` preview.
 * `view` overrides how it is drawn (Refine's tile picker); without it the draft's own
 * type and variant are used.
 */
export function buildDraftPreviewWidget(
  draft: DashboardWidgetDraft,
  view?: { type: DashboardWidgetType; chartVariant?: DashboardChartVariant },
): DashboardWidget | null {
  const descriptor = getMetricDescriptor(draft.metricId)
  if (!descriptor) return null
  const type = view?.type ?? draft.type
  const widget = buildPreviewWidget({
    draft,
    type,
    title: draft.title,
    subtitle: draft.subtitle,
    dataSource: draft.dataSource,
    metricId: draft.metricId,
    descriptor,
    chartVariant: view ? view.chartVariant : draft.chartVariant,
  })
  // `buildPreviewWidget` falls back to the draft's variant; a view without one must not inherit it.
  return view && !view.chartVariant ? { ...widget, chartVariant: undefined } : widget
}
