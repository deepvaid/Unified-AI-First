import type { DashboardAccent } from '@/stores/dashboards/types'

// Seeded dashboard accents → Vuetify theme colors. Accents/icons are fixed
// per dashboard (set by seeds); they are not user-editable.
const ACCENT_TO_VUETIFY: Record<DashboardAccent, string> = {
  primary: 'primary',
  secondary: 'secondary',
  success: 'success',
  warning: 'warning',
  info: 'info',
  neutral: 'surface-variant',
}

export function accentToVuetifyColor(accent: DashboardAccent | undefined): string {
  return accent ? ACCENT_TO_VUETIFY[accent] : 'primary'
}

export function relativeTime(iso: string | undefined): string {
  if (!iso) return 'Never'
  const target = new Date(iso).getTime()
  if (Number.isNaN(target)) return 'Never'
  const diffMs = Date.now() - target
  if (diffMs < 0) return 'Just now'
  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 45) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  const years = Math.floor(days / 365)
  return `${years}y ago`
}
