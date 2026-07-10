// Store editor section rail — data-driven menu (mirrors settings/settingsMenu.ts).
// Live pages only: sections appear here once their page exists (UAT parity A06b);
// unbuilt legacy sections (General, Integrations, Store Settings) are NOT listed.

export interface StoreEditorItem {
  slug: string
  label: string
  icon: string
  /** Route to navigate to (per-channel; needs accountId + channelId params). */
  routeName: string
  /** Route names that keep this item highlighted (the section's editors/children). */
  match: string[]
}

export const STORE_EDITOR_ITEMS: StoreEditorItem[] = [
  { slug: 'overview', label: 'Overview', icon: 'layout-dashboard', routeName: 'SalesChannelDetail', match: ['SalesChannelDetail'] },
  { slug: 'theme', label: 'Theme', icon: 'palette', routeName: 'StoreThemeBuilder', match: ['StoreThemeBuilder', 'StoreThemeCode'] },
  { slug: 'navigation', label: 'Navigation', icon: 'list-tree', routeName: 'StoreNavigation', match: ['StoreNavigation', 'StoreNavigationMenuCreate', 'StoreNavigationMenuEdit'] },
  { slug: 'pages', label: 'Pages', icon: 'file-text', routeName: 'StorePages', match: ['StorePages', 'StorePageCreate', 'StorePageEdit'] },
  { slug: 'blogs', label: 'Blogs', icon: 'rss', routeName: 'StoreBlogs', match: ['StoreBlogs', 'StoreBlogCreate', 'StoreBlogEdit'] },
  { slug: 'campaigns', label: 'Campaigns', icon: 'megaphone', routeName: 'StoreCampaigns', match: ['StoreCampaigns'] },
  { slug: 'assets', label: 'Assets', icon: 'image', routeName: 'StoreAssets', match: ['StoreAssets'] },
]

/** Section root for the current route — used by the store switcher to land on the same section. */
export function sectionRootForRoute(routeName: string | undefined): string {
  if (!routeName) return 'SalesChannelDetail'
  const item = STORE_EDITOR_ITEMS.find((entry) => entry.match.includes(routeName))
  return item?.routeName ?? 'SalesChannelDetail'
}
