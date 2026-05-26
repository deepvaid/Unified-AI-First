export interface SettingsItem {
  slug: string
  label: string
  routeName: string
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
      { slug: 'account-billing', label: 'Account & Billing', routeName: 'SettingsAccountBilling' },
      { slug: 'users-permissions', label: 'Users & Permissions', routeName: 'SettingsUsersPermissions' },
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
