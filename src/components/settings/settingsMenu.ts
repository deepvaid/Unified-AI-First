import type { MpSectionRailGroup } from '@/components/MpSectionRail.vue'

export interface SettingsItem {
  slug: string
  label: string
  routeName: string
  /** Extra route names that keep this item highlighted (e.g. detail pages). */
  match?: string[]
  /** Renders a launch (↗) icon and points to an area outside the Settings shell. */
  external?: boolean
}

export interface SettingsGroup {
  title: string
  items: SettingsItem[]
}

export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    title: 'Your Preferences',
    items: [
      { slug: 'general', label: 'General', routeName: 'SettingsGeneral' },
      { slug: 'notifications', label: 'Notifications', routeName: 'SettingsNotifications' },
    ],
  },
  {
    title: 'Account Management',
    items: [
      { slug: 'account-defaults', label: 'Account Defaults', routeName: 'SettingsAccountDefaults' },
      { slug: 'account-billing', label: 'Account & Billing', routeName: 'Billing', external: true },
      { slug: 'users-permissions', label: 'Users', routeName: 'SettingsUsersPermissions' },
      { slug: 'roles', label: 'Roles & Permissions', routeName: 'SettingsRoles', match: ['SettingsRoleDetail'] },
      { slug: 'audit-log', label: 'Audit Log', routeName: 'SettingsAuditLog' },
    ],
  },
  {
    title: 'Platform Setup',
    items: [
      { slug: 'connections', label: 'Connections', routeName: 'SettingsConnections' },
      { slug: 'dns-setup', label: 'DNS Setup', routeName: 'SettingsDnsSetup' },
      { slug: 'integrations', label: 'Integrations', routeName: 'SettingsIntegrations' },
      { slug: 'tracking-analytics', label: 'Tracking & Analytics', routeName: 'SettingsTrackingAnalytics' },
      { slug: 'privacy-consent', label: 'Privacy & Consent', routeName: 'SettingsPrivacyConsent' },
      { slug: 'security', label: 'Security', routeName: 'SettingsSecurity' },
    ],
  },
  {
    title: 'Store Setup',
    items: [
      { slug: 'store-profile', label: 'Store Profile', routeName: 'SettingsStoreProfile' },
      { slug: 'payment-account', label: 'Payment Account', routeName: 'SettingsPaymentAccount' },
    ],
  },
  {
    title: 'Support / AI',
    items: [
      { slug: 'service', label: 'Service', routeName: 'SettingsService' },
      { slug: 'ai-settings', label: 'AI Settings', routeName: 'SettingsAiSettings' },
    ],
  },
]

/**
 * Adapts SETTINGS_GROUPS to the shape MpSectionRail consumes.
 *
 * Phase 4 (P4-7) deleted `SettingsSidebar.vue`, which was a near-verbatim
 * reimplementation of MpSectionRail at its own item height — the rail already
 * had the `title` + `searchable` props for exactly this "Settings flavor".
 * The rail highlights on `match`, so each item's own route name leads its match
 * set, followed by any detail routes that should keep it lit.
 */
export function settingsRailGroups(accountId: string): MpSectionRailGroup[] {
  return SETTINGS_GROUPS.map((group) => ({
    title: group.title,
    items: group.items.map((item) => ({
      slug: item.slug,
      label: item.label,
      to: { name: item.routeName, params: { accountId } },
      match: [item.routeName, ...(item.match ?? [])],
      external: item.external,
    })),
  }))
}
