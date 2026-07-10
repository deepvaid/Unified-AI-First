import type {
  MerchandisingConnectionHealth,
  MerchandisingConnectionStatus,
  SalesChannel,
  SalesChannelProvider,
} from '@/stores/useSalesChannels'

export const MERCHANDISING_PROVIDER_LABELS: Record<SalesChannelProvider, string> = {
  maropost_store_builder: 'Maropost Web Store',
  shopify: 'Shopify',
  bigcommerce: 'BigCommerce',
  magento: 'Magento',
  other: 'Commerce integration',
}
export const MERCHANDISING_STATUS_LABELS: Record<MerchandisingConnectionStatus, string> = {
  connected: 'Connected',
  setup_required: 'Setup required',
  sync_issue: 'Sync issue',
  unsupported: 'Not available',
}

export const MERCHANDISING_HEALTH_LABELS: Record<MerchandisingConnectionHealth, string> = {
  healthy: 'Healthy',
  warning: 'Needs attention',
  error: 'Action required',
  syncing: 'Syncing',
}

export function providerLabel(channel: SalesChannel): string {
  return MERCHANDISING_PROVIDER_LABELS[channel.provider]
}

export function channelDomain(channel: SalesChannel): string {
  return channel.webStore?.domain ?? 'Online channel'
}

export function merchandisingStatus(channel: SalesChannel): MerchandisingConnectionStatus {
  if (channel.type !== 'web_store') return 'unsupported'
  if (channel.merchandising?.status) return channel.merchandising.status
  if (channel.webStore?.merchandiseConnected) {
    return channel.status === 'sync_issue' ? 'sync_issue' : 'connected'
  }
  return 'setup_required'
}

export function merchandisingHealth(channel: SalesChannel): MerchandisingConnectionHealth {
  if (channel.merchandising?.health) return channel.merchandising.health
  if (merchandisingStatus(channel) === 'sync_issue') return 'error'
  if (merchandisingStatus(channel) === 'connected') return 'healthy'
  return 'warning'
}

export function isMerchandisingChannel(channel: SalesChannel): boolean {
  return channel.type === 'web_store' && merchandisingStatus(channel) !== 'unsupported'
}

export function merchandisingChannels(channels: SalesChannel[], accountId: string): SalesChannel[] {
  return channels.filter((channel) => channel.accountId === accountId && isMerchandisingChannel(channel))
}

export function merchandisingRoute(accountId: string, channelId: string, section = '') {
  const suffix = section ? `/${section.replace(/^\/+/, '')}` : ''
  return `/accounts/${accountId}/sales_channels/${channelId}/merchandising${suffix}`
}

export function routeSectionForLegacyPath(path: string): string {
  if (path.includes('/search/preview')) return 'search/preview'
  if (path.includes('/search/synonyms')) return 'search/synonyms'
  if (path.includes('/search/redirects')) return 'search/redirects'
  if (path.includes('/collections')) return 'smart-collections/collections'
  if (path.includes('/recommendations')) return 'recommendations'
  if (path.includes('/fields')) return 'setup'
  return ''
}
