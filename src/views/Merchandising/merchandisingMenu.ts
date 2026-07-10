import type { MpSectionRailGroup } from '@/components/MpSectionRail.vue'
import type { RouteLocationRaw } from 'vue-router'

function route(name: string, accountId: string, channelId: string, extra: Record<string, string> = {}): RouteLocationRaw {
  return { name, params: { accountId, channelId, ...extra } }
}
export function merchandisingMenu(accountId: string, channelId: string): MpSectionRailGroup[] {
  return [
    {
      title: 'Overview',
      items: [{ slug: 'overview', label: 'Overview', icon: 'layout-dashboard', to: route('MerchandisingChannelOverview', accountId, channelId), match: ['MerchandisingChannelOverview'] }],
    },
    {
      title: 'Search',
      items: [
        { slug: 'search-preview', label: 'Preview', icon: 'search', to: route('MerchandisingChannelSearchPreview', accountId, channelId), match: ['MerchandisingChannelSearchPreview'] },
        { slug: 'search-pinning', label: 'Pinning', icon: 'pin', to: route('MerchandisingChannelCapability', accountId, channelId, { capability: 'search-pinning' }), match: ['MerchandisingChannelCapability'] },
        { slug: 'search-rules', label: 'Rules', icon: 'sliders-horizontal', to: route('MerchandisingChannelCapability', accountId, channelId, { capability: 'search-rules' }), match: ['MerchandisingChannelCapability'] },
        { slug: 'search-promos', label: 'Promo Cards', icon: 'tags', to: route('MerchandisingChannelCapability', accountId, channelId, { capability: 'search-promo-cards' }), match: ['MerchandisingChannelCapability'] },
        { slug: 'search-banners', label: 'Banners', icon: 'image', to: route('MerchandisingChannelCapability', accountId, channelId, { capability: 'search-banners' }), match: ['MerchandisingChannelCapability'] },
        { slug: 'search-blacklisting', label: 'Blacklisting', icon: 'ban', to: route('MerchandisingChannelCapability', accountId, channelId, { capability: 'search-blacklisting' }), match: ['MerchandisingChannelCapability'] },
        { slug: 'search-synonyms', label: 'Synonyms', icon: 'repeat', to: route('MerchandisingChannelSynonyms', accountId, channelId), match: ['MerchandisingChannelSynonyms'] },
        { slug: 'search-redirects', label: 'Redirects', icon: 'corner-up-right', to: route('MerchandisingChannelRedirects', accountId, channelId), match: ['MerchandisingChannelRedirects'] },
        { slug: 'search-content', label: 'Content', icon: 'file-text', to: route('MerchandisingChannelCapability', accountId, channelId, { capability: 'search-content' }), match: ['MerchandisingChannelCapability'] },
      ],
    },
    {
      title: 'Smart Collections',
      items: [
        { slug: 'collections', label: 'Collections', icon: 'layers', to: route('MerchandisingChannelCollections', accountId, channelId), match: ['MerchandisingChannelCollections'] },
        { slug: 'collection-pinning', label: 'Pinning', icon: 'pin', to: route('MerchandisingChannelDefaults', accountId, channelId), match: ['MerchandisingChannelDefaults', 'MerchandisingChannelPinning', 'MerchandisingChannelRuleEdit'] },
        { slug: 'collection-rules', label: 'Rules', icon: 'sliders-horizontal', to: route('MerchandisingChannelDefaults', accountId, channelId), match: ['MerchandisingChannelDefaults', 'MerchandisingChannelRuleEdit'] },
        { slug: 'collection-promos', label: 'Promo Cards', icon: 'tags', to: route('MerchandisingChannelCapability', accountId, channelId, { capability: 'collection-promo-cards' }), match: ['MerchandisingChannelCapability'] },
        { slug: 'collection-banners', label: 'Banners', icon: 'image', to: route('MerchandisingChannelCapability', accountId, channelId, { capability: 'collection-banners' }), match: ['MerchandisingChannelCapability'] },
      ],
    },
    {
      title: 'Recommendations',
      items: [{ slug: 'recommendations', label: 'Recommendation engines', icon: 'sparkles', to: route('MerchandisingChannelRecommendations', accountId, channelId), match: ['MerchandisingChannelRecommendations', 'MerchandisingChannelEngineEdit'] }],
    },
    {
      title: 'Analytics',
      items: [{ slug: 'analytics', label: 'Performance', icon: 'bar-chart-3', to: route('MerchandisingChannelAnalytics', accountId, channelId), match: ['MerchandisingChannelAnalytics'] }],
    },
    {
      title: 'Channel Setup',
      items: [
        { slug: 'setup', label: 'Connection & sync', icon: 'settings', to: route('MerchandisingChannelSetup', accountId, channelId), match: ['MerchandisingChannelSetup'] },
        { slug: 'fields', label: 'Field transformations', icon: 'wand-sparkles', to: route('MerchandisingChannelFields', accountId, channelId), match: ['MerchandisingChannelFields'] },
      ],
    },
  ]
}
