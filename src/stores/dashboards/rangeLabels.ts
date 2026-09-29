import type { DashboardDatePreset } from './types'

// Pure data (type-only import) so the Da Vinci widget resolver can name the
// dashboard's range under Node as well as in the app.
export const DASHBOARD_RANGE_LABELS: Record<DashboardDatePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last_7_days: 'Last 7 days',
  last_30_days: 'Last 30 days',
  last_90_days: 'Last 90 days',
  month_to_date: 'This month so far',
  quarter_to_date: 'This quarter so far',
  year_to_date: 'This year so far',
  black_friday_cyber_monday: 'Black Friday Cyber Monday',
  custom: 'Custom range',
}
