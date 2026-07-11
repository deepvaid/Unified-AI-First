import type { MpSectionRailGroup } from '@/components/MpSectionRail.vue'
import type { RouteLocationRaw } from 'vue-router'

// Rail menu for the channel-scoped merchandising workspace. Groups mirror the
// real Merchandise cloud IA (Findify crawl, tracker A12): Search tools, Smart
// Collections, Recommendations, Analytics, Channel Setup. Every item routes to
// a real page with a UNIQUE match set — no shared placeholders, no collisions.

function route(name: string, accountId: string, channelId: string): RouteLocationRaw {
  return { name, params: { accountId, channelId } }
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
        { slug: 'search-pinning', label: 'Pinning', icon: 'pin', to: route('MerchandisingChannelSearchPinning', accountId, channelId), match: ['MerchandisingChannelSearchPinning', 'MerchandisingChannelSearchPinEdit'] },
        { slug: 'search-rules', label: 'Rules', icon: 'sliders-horizontal', to: route('MerchandisingChannelSearchRules', accountId, channelId), match: ['MerchandisingChannelSearchRules'] },
        { slug: 'search-promos', label: 'Promo Cards', icon: 'tags', to: route('MerchandisingChannelSearchPromos', accountId, channelId), match: ['MerchandisingChannelSearchPromos'] },
        { slug: 'search-banners', label: 'Banners', icon: 'image', to: route('MerchandisingChannelSearchBanners', accountId, channelId), match: ['MerchandisingChannelSearchBanners'] },
        { slug: 'search-blacklisting', label: 'Blacklisting', icon: 'ban', to: route('MerchandisingChannelBlacklisting', accountId, channelId), match: ['MerchandisingChannelBlacklisting'] },
        { slug: 'search-synonyms', label: 'Synonyms', icon: 'repeat', to: route('MerchandisingChannelSynonyms', accountId, channelId), match: ['MerchandisingChannelSynonyms'] },
        { slug: 'search-redirects', label: 'Redirects', icon: 'corner-up-right', to: route('MerchandisingChannelRedirects', accountId, channelId), match: ['MerchandisingChannelRedirects'] },
        { slug: 'search-content', label: 'Content', icon: 'file-text', to: route('MerchandisingChannelContent', accountId, channelId), match: ['MerchandisingChannelContent'] },
      ],
    },
    {
      title: 'Smart Collections',
      items: [
        { slug: 'collections', label: 'Collections', icon: 'layers', to: route('MerchandisingChannelCollections', accountId, channelId), match: ['MerchandisingChannelCollections'] },
        { slug: 'collection-merchandising', label: 'Default merchandising', icon: 'pin', to: route('MerchandisingChannelDefaults', accountId, channelId), match: ['MerchandisingChannelDefaults', 'MerchandisingChannelPinning', 'MerchandisingChannelRuleEdit'] },
        { slug: 'collection-promos', label: 'Promo Cards', icon: 'tags', to: route('MerchandisingChannelCollectionPromos', accountId, channelId), match: ['MerchandisingChannelCollectionPromos'] },
        { slug: 'collection-banners', label: 'Banners', icon: 'image', to: route('MerchandisingChannelCollectionBanners', accountId, channelId), match: ['MerchandisingChannelCollectionBanners'] },
      ],
    },
    {
      title: 'Recommendations',
      items: [{ slug: 'recommendations', label: 'Recommendation engines', icon: 'sparkles', to: route('MerchandisingChannelRecommendations', accountId, channelId), match: ['MerchandisingChannelRecommendations', 'MerchandisingChannelEngineEdit'] }],
    },
    {
      title: 'Analytics',
      items: [
        { slug: 'analytics-snapshot', label: 'Snapshot', icon: 'bar-chart-3', to: route('MerchandisingChannelAnalytics', accountId, channelId), match: ['MerchandisingChannelAnalytics'] },
        { slug: 'analytics-search', label: 'Search', icon: 'search', to: route('MerchandisingChannelAnalyticsSearch', accountId, channelId), match: ['MerchandisingChannelAnalyticsSearch'] },
        { slug: 'analytics-collections', label: 'Smart Collections', icon: 'layers', to: route('MerchandisingChannelAnalyticsCollections', accountId, channelId), match: ['MerchandisingChannelAnalyticsCollections'] },
        { slug: 'analytics-recommendations', label: 'Recommendations', icon: 'sparkles', to: route('MerchandisingChannelAnalyticsRecommendations', accountId, channelId), match: ['MerchandisingChannelAnalyticsRecommendations'] },
      ],
    },
    {
      title: 'Channel Setup',
      items: [
        { slug: 'setup', label: 'Connection & sync', icon: 'settings', to: route('MerchandisingChannelSetup', accountId, channelId), match: ['MerchandisingChannelSetup'] },
        { slug: 'product-sync', label: 'Product sync', icon: 'package', to: route('MerchandisingChannelProductSync', accountId, channelId), match: ['MerchandisingChannelProductSync'] },
        { slug: 'integrations', label: 'Integrations', icon: 'puzzle', to: route('MerchandisingChannelIntegrations', accountId, channelId), match: ['MerchandisingChannelIntegrations'] },
        { slug: 'fields', label: 'Field transformations', icon: 'wand-sparkles', to: route('MerchandisingChannelFields', accountId, channelId), match: ['MerchandisingChannelFields'] },
      ],
    },
  ]
}
