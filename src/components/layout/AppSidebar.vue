<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccountsStore, type SubscriptionKey } from '@/stores/useAccounts'
import { Crown } from 'lucide-vue-next'
import { useAppTheme, type AccentKey } from '@/composables/useAppTheme'

const props = defineProps<{
  modelValue: boolean
  rail: boolean
  temporary?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  'update:rail': [val: boolean]
}>()

const accountsStore = useAccountsStore()
const { accent, setAccent } = useAppTheme()

// ─── Accent Swatches ─────────────────────────────────────────
interface AccentSwatch {
  key: AccentKey
  label: string
  color: string
}

const accentSwatches: AccentSwatch[] = [
  { key: 'cyan',   label: 'Cyan',   color: '#00B7F4' },
  { key: 'blue',   label: 'Blue',   color: '#2D63E8' },
  { key: 'amber',  label: 'Amber',  color: '#B45309' },
  { key: 'gray',   label: 'Gray',   color: '#4B5563' },
  { key: 'purple', label: 'Purple', color: '#8B5CF6' },
]

const showAccentPicker = ref(false)

// ─── Navigation Structure ────────────────────────────────────
interface NavItem { title: string; route: string; }
interface NavSubGroup { title: string; isSubGroup: true; items: NavItem[] }
interface NavGroup {
  title: string
  icon: string
  singleRoute?: string
  badge?: string
  requires?: SubscriptionKey
  dividerAfter?: boolean
  items: (NavItem | NavSubGroup)[]
}

interface InstalledAppItem {
  title: string
  icon: string
  status: 'Active' | 'Available'
  route: string
}

function buildNavGroups(accountId: string): NavGroup[] {
  const onlineSalesRoute = `/accounts/${accountId}/sales_channels?tab=web_store`
  const offlinePhysicalRoute = `/accounts/${accountId}/sales_channels?tab=offline_store`

  return [
    {
      title: 'Dashboards',
      icon: 'layout-dashboard',
      singleRoute: `/accounts/${accountId}/dashboard`,
      items: [
        { title: 'Home', route: `/accounts/${accountId}/dashboard` },
        { title: 'Manage', route: `/accounts/${accountId}/dashboards` },
        { title: 'Live', route: `/accounts/${accountId}/analytics/live_view` },
      ],
    },
    {
      title: 'Analytics',
      icon: 'line-chart',
      dividerAfter: true,
      singleRoute: `/accounts/${accountId}/analytics/monthly_totals`,
      items: [
        { title: 'Monthly Totals', route: `/accounts/${accountId}/analytics/monthly_totals` },
        { title: 'Sales by Order', route: `/accounts/${accountId}/analytics/orders` },
        { title: 'Dispatched Orders', route: `/accounts/${accountId}/analytics/dispatched_orders` },
        { title: 'Sales Summary', route: `/accounts/${accountId}/analytics/sales_summary` },
        { title: 'eRFM Report', route: `/accounts/${accountId}/analytics/erfm_report` },
        { title: 'Campaign Reports', route: `/accounts/${accountId}/reports` },
        { title: 'Recurring Campaign Reports', route: `/accounts/${accountId}/analytics/recurring_campaign_reports` },
        { title: 'A/B Campaign Reports', route: `/accounts/${accountId}/analytics/ab_campaign_reports` },
        { title: 'Test Campaign Reports', route: `/accounts/${accountId}/analytics/test_campaign_reports` },
        { title: 'Website Reports', route: `/accounts/${accountId}/analytics/website_reports` },
        { title: 'Journey Reports', route: `/accounts/${accountId}/analytics/journey_reports` },
        { title: 'Custom Reports', route: `/accounts/${accountId}/analytics/custom_reports` },
        { title: 'Transactional Email Reports', route: `/accounts/${accountId}/analytics/transactional_reports` },
        { title: 'Log Inspector', route: `/accounts/${accountId}/analytics/log_inspector` },
      ],
    },
    {
      title: 'CDP',
      icon: 'users',
      singleRoute: `/accounts/${accountId}/contacts`,
      items: [
        { title: 'All Contacts', route: `/accounts/${accountId}/contacts` },
        { title: 'Contact Lists', route: `/accounts/${accountId}/lists` },
        { title: 'Segments', route: `/accounts/${accountId}/segments` },
        { title: 'Contact Fields', route: `/accounts/${accountId}/contact_fields` },
        { title: 'Contact Tags', route: `/accounts/${accountId}/tags` },
        { title: 'Relational Tables', route: `/accounts/${accountId}/relational_tables` },
        { title: 'SQL Queries', route: `/accounts/${accountId}/sql_queries` },
        { title: 'Secure Lists', route: `/accounts/${accountId}/secure_lists` },
        { title: 'Web Tracking', route: `/accounts/${accountId}/web_tracking` },
      ],
    },
    {
      title: 'Products',
      icon: 'package',
      requires: 'commerce',
      dividerAfter: true,
      singleRoute: `/commerce/${accountId}/products`,
      items: [
        { title: 'Product Recommendations', route: `/commerce/${accountId}/product_recommendations` },
        { title: 'Products', route: `/commerce/${accountId}/products` },
        { title: 'Collections', route: `/commerce/${accountId}/products/collections` },
        { title: 'Inventory', route: `/commerce/${accountId}/inventory` },
        { title: 'Reservations', route: `/commerce/${accountId}/products/reservations` },
      ],
    },
    {
      title: 'Marketing',
      icon: 'megaphone',
      singleRoute: `/accounts/${accountId}/marketing`,
      items: [
        {
          title: 'Campaigns',
          isSubGroup: true,
          items: [
            { title: 'Email Campaigns', route: `/accounts/${accountId}/campaigns` },
            { title: 'SMS Campaigns', route: `/accounts/${accountId}/sms_campaigns` },
            { title: 'Transactional Email', route: `/accounts/${accountId}/transactional_campaigns` },
            { title: 'Transactional SMS', route: `/accounts/${accountId}/transactional_sms` },
            { title: 'Campaign Tags', route: `/accounts/${accountId}/campaign_tags` },
          ],
        },
        {
          title: 'Acquisition',
          isSubGroup: true,
          items: [
            { title: 'Acquisition Forms', route: `/accounts/${accountId}/acquisition` },
            { title: 'Landing Pages', route: `/accounts/${accountId}/landing_pages` },
            { title: 'Lead Ads', route: `/accounts/${accountId}/lead_ads` },
          ],
        },
        {
          title: 'Automation',
          isSubGroup: true,
          items: [
            { title: 'Journeys', route: `/accounts/${accountId}/journeys` },
            { title: 'Data Journeys', route: `/accounts/${accountId}/data_journeys` },
          ],
        },
        { title: 'Content', route: `/accounts/${accountId}/content` },
      ],
    },
    {
      title: 'Commerce',
      icon: 'shopping-cart',
      requires: 'commerce',
      singleRoute: `/commerce/${accountId}/orders`,
      items: [
        { title: 'Sales Channels', route: onlineSalesRoute },
        {
          title: 'Orders',
          isSubGroup: true,
          items: [
            { title: 'Sales Orders', route: `/commerce/${accountId}/orders` },
            { title: 'Draft Orders', route: `/commerce/${accountId}/orders/drafts` },
            { title: 'Fulfillment', route: `/commerce/${accountId}/fulfillments` },
          ],
        },
        {
          title: 'Promotions',
          isSubGroup: true,
          items: [
            { title: 'Promotions', route: `/commerce/${accountId}/promotions` },
            { title: 'Custom Gift Cards', route: `/commerce/${accountId}/custom_gift_cards` },
            { title: 'Purchasable Gift Cards', route: `/commerce/${accountId}/purchasable_gift_cards` },
          ],
        },
      ],
    },
    {
      title: 'Retail',
      icon: 'store',
      requires: 'commerce',
      singleRoute: `/commerce/${accountId}/retail/transactions`,
      items: [
        { title: 'Transactions',      route: `/commerce/${accountId}/retail/transactions` },
        { title: 'POS Preview',       route: `/commerce/${accountId}/retail/pos-preview` },
        { title: 'Stores', route: offlinePhysicalRoute },
        {
          title: 'Operations',
          isSubGroup: true,
          items: [
            { title: 'Locations',  route: `/accounts/${accountId}/sales_channels/pos-store/locations` },
            { title: 'Registers',  route: `/commerce/${accountId}/retail/registers` },
            { title: 'Associates', route: `/commerce/${accountId}/retail/associates` },
          ],
        },
        {
          title: 'Catalog & Stock',
          isSubGroup: true,
          items: [
            { title: 'Stock by Location', route: `/commerce/${accountId}/retail/stock` },
            { title: 'Bulk Inventory',    route: `/commerce/${accountId}/retail/inventory` },
            { title: 'Pricing',           route: `/commerce/${accountId}/retail/pricing` },
          ],
        },
        {
          title: 'Setup',
          isSubGroup: true,
          items: [
            { title: 'Hardware', route: `/commerce/${accountId}/retail/hardware` },
            { title: 'Settings', route: `/commerce/${accountId}/retail/settings` },
          ],
        },
      ],
    },
    {
      title: 'Merchandise',
      icon: 'sliders-horizontal',
      requires: 'commerce',
      singleRoute: `/commerce/${accountId}/merchandising/collections`,
      items: [
        { title: 'Collections',            route: `/commerce/${accountId}/merchandising/collections` },
        { title: 'Default Merchandising',  route: `/commerce/${accountId}/merchandising/default-merchandising` },
        { title: 'Recommendation Engines', route: `/commerce/${accountId}/merchandising/recommendations` },
        { title: 'Field Transformations',  route: `/commerce/${accountId}/merchandising/fields` },
        { title: 'Synonyms',               route: `/commerce/${accountId}/merchandising/search/synonyms` },
        { title: 'Search Preview',         route: `/commerce/${accountId}/merchandising/search/preview` },
        { title: 'Page Redirects',         route: `/commerce/${accountId}/merchandising/search/redirects` },
      ],
    },
    {
      title: 'Service',
      icon: 'headset',
      dividerAfter: true,
      requires: 'service',
      singleRoute: `/accounts/${accountId}/service`,
      items: [
        { title: 'Tickets', route: `/accounts/${accountId}/service` },
        { title: 'Chatbot', route: `/accounts/${accountId}/chatbot` },
      ],
    },
    {
      title: 'Da Vinci AI',
      icon: 'sparkles',
      badge: 'NEW',
      requires: 'davinci',
      singleRoute: `/accounts/${accountId}/da-vinci`,
      dividerAfter: true,
      items: [
        { title: 'Overview', route: `/accounts/${accountId}/da-vinci` },
        { title: 'Ask Da Vinci', route: `/accounts/${accountId}/da-vinci/copilot` },
      ],
    },
    {
      title: 'Apps',
      icon: 'puzzle',
      singleRoute: `/accounts/${accountId}/app_store`,
      items: [],
    },
  ]
}

const localDrawer = ref(props.modelValue)
const localRail = ref(props.rail)
const sidebarMode = computed<'expanded' | 'rail'>(() => localRail.value ? 'rail' : 'expanded')
const railHoveredSubGroup = ref<string | null>(null)
const railOpenGroup = ref<string | null>(null)
const appsExpanded = ref(false)
const flyoutOpen = ref(false)
const flyoutGroupTitle = ref<string | null>(null)
const openedByClick = ref(false)
const hoveredParentId = ref<string | null>(null)
const expandedHoveredCascade = ref<string | null>(null)
const flyoutTop = ref(64)
const router = useRouter()
const route = useRoute()
const resolvedAccountId = computed(() => {
  const routeAccountId = Array.isArray(route.params.accountId)
    ? route.params.accountId[0]
    : route.params.accountId

  // If the route accountId is not a real account (e.g. 'demo' on Commerce routes),
  // fall back to the active account so /accounts/* links stay valid.
  const isRealAccount = routeAccountId && accountsStore.accounts.some((a) => a.id === routeAccountId)
  return isRealAccount ? routeAccountId : accountsStore.activeId
})
const navGroups = computed(() => buildNavGroups(resolvedAccountId.value))
const flyoutGroup = computed(() =>
  flyoutGroupTitle.value
    ? navGroups.value.find((group) => group.title === flyoutGroupTitle.value) ?? null
    : null,
)
const expandedCascadeItems = computed<NavItem[]>(() => {
  if (!flyoutGroup.value || !expandedHoveredCascade.value) return []
  const sub = railSubGroups(flyoutGroup.value)
    .find((s) => s.title === expandedHoveredCascade.value)
  return sub?.items ?? []
})
const installedApps = computed<InstalledAppItem[]>(() => [
  {
    title: 'Shopify',
    icon: 'shopping-bag',
    status: 'Active',
    route: `/accounts/${resolvedAccountId.value}/app_store?app=shopify`,
  },
  {
    title: 'Salesforce',
    icon: 'cloud',
    status: 'Active',
    route: `/accounts/${resolvedAccountId.value}/app_store?app=salesforce`,
  },
  {
    title: 'Facebook Ads',
    icon: 'megaphone',
    status: 'Active',
    route: `/accounts/${resolvedAccountId.value}/app_store?app=facebook-ads`,
  },
  {
    title: 'Twilio',
    icon: 'message-square',
    status: 'Active',
    route: `/accounts/${resolvedAccountId.value}/app_store?app=twilio`,
  },
])

watch(() => props.modelValue, (nextValue) => {
  localDrawer.value = nextValue
})

watch(() => props.rail, (nextValue) => {
  localRail.value = nextValue
})

watch(localDrawer, (nextValue) => {
  emit('update:modelValue', nextValue)
})

watch(localRail, (nextValue, previousValue) => {
  emit('update:rail', nextValue)
  if (nextValue !== previousValue) resetFlyoutState()
})

function goTo(route: string) {
  if (router.currentRoute.value.fullPath === route) return
  router.push(route)
}

function isLocked(group: NavGroup) {
  return !!group.requires && !accountsStore.hasSubscription(group.requires)
}

function hasSubGroups(group: NavGroup) {
  return group.items.some((item) => 'isSubGroup' in item && item.isSubGroup)
}

function railSubGroups(group: NavGroup) {
  return group.items.filter((item): item is NavSubGroup => 'isSubGroup' in item && item.isSubGroup)
}

function railFlatItems(group: NavGroup) {
  return group.items.filter((item): item is NavItem => !('isSubGroup' in item))
}

const CASCADE_SUBGROUPS = new Set<string>()

function isCascadeSubGroup(sub: NavSubGroup): boolean {
  return CASCADE_SUBGROUPS.has(sub.title)
}

function activeRailSubGroupItems(group: NavGroup) {
  if (!railHoveredSubGroup.value) return []
  const sub = railSubGroups(group).find((s) => s.title === railHoveredSubGroup.value)
  return sub?.items ?? []
}

function isAppsGroup(group: NavGroup) {
  return group.title === 'Apps'
}

function isSubGroup(item: NavItem | NavSubGroup): item is NavSubGroup {
  return 'isSubGroup' in item && item.isSubGroup
}

// ─── Module-active prefix matching ─────────────────────────
function routeMatches(target: string): boolean {
  return route.path === target || route.path.startsWith(`${target}/`)
}

function collectGroupRoutes(group: NavGroup): string[] {
  const routes: string[] = []
  if (group.singleRoute) routes.push(group.singleRoute)
  for (const item of group.items) {
    if (isSubGroup(item)) {
      for (const sub of item.items) routes.push(sub.route)
    } else if ('route' in item) {
      routes.push(item.route)
    }
  }
  return routes
}

const activeNavGroupTitle = computed(() => {
  let bestTitle: string | null = null
  let bestRouteLength = -1

  for (const group of navGroups.value) {
    for (const navRoute of collectGroupRoutes(group)) {
      if (!routeMatches(navRoute)) continue
      if (navRoute.length > bestRouteLength) {
        bestRouteLength = navRoute.length
        bestTitle = group.title
      }
    }
  }

  return bestTitle
})

function isModuleActive(group: NavGroup): boolean {
  if (!localRail.value && flyoutOpen.value) {
    return flyoutGroupTitle.value === group.title
  }
  return activeNavGroupTitle.value === group.title
}

// ─── Expanded-mode click flyout ─────────────────────────────
function closeFlyout() {
  flyoutOpen.value = false
  flyoutGroupTitle.value = null
  openedByClick.value = false
  hoveredParentId.value = null
  expandedHoveredCascade.value = null
}

function resetFlyoutState() {
  closeFlyout()
  railHoveredSubGroup.value = null
  railOpenGroup.value = null
}

function toggleSidebarRail() {
  localRail.value = !localRail.value
  resetFlyoutState()
}

function updateFlyoutTop(event: Event) {
  const target = event.currentTarget as HTMLElement | null
  if (!target) return
  const rect = target.getBoundingClientRect()
  const maxTop = Math.max(8, window.innerHeight - 16)
  flyoutTop.value = Math.min(Math.max(rect.top, 8), maxTop)
  ;(target as HTMLElement).blur?.()
}

function onParentClick(group: NavGroup, event: Event) {
  if (sidebarMode.value !== 'expanded') return

  if (!group.items.length) {
    if (group.singleRoute) goTo(group.singleRoute)
    return
  }

  const isSame = flyoutOpen.value && openedByClick.value && flyoutGroupTitle.value === group.title
  if (isSame) {
    closeFlyout()
    return
  }

  updateFlyoutTop(event)
  flyoutOpen.value = true
  flyoutGroupTitle.value = group.title
  openedByClick.value = true
  hoveredParentId.value = group.title
  expandedHoveredCascade.value = null
}

function onParentHover(group: NavGroup, event: MouseEvent) {
  hoveredParentId.value = group.title
  if (sidebarMode.value !== 'expanded') return
  if (!flyoutOpen.value || !openedByClick.value) return
  if (flyoutGroupTitle.value === group.title) return
  updateFlyoutTop(event)
  flyoutGroupTitle.value = group.title
  expandedHoveredCascade.value = null
}

function toggleExpandedCascade(title: string) {
  expandedHoveredCascade.value = expandedHoveredCascade.value === title ? null : title
}

function onFlyoutChildClick(item: NavItem) {
  goTo(item.route)
  closeFlyout()
}

function onFlyoutChildPointerDown(item: NavItem, event: PointerEvent) {
  if (event.button !== 0) return
  event.preventDefault()
  event.stopPropagation()
  onFlyoutChildClick(item)
}
</script>

<template>
  <v-navigation-drawer
    v-model="localDrawer"
    :rail="localRail"
    :rail-width="64"
    :permanent="!props.temporary"
    :temporary="props.temporary"
    :mobile-breakpoint="0"
    width="240"
    class="mp-sidebar"
  >
    <!-- Brand + anchored toggle -->
    <div class="sidebar-header" :class="{ 'sidebar-header--rail': localRail }">
      <template v-if="!localRail">
        <button
          type="button"
          class="sidebar-brand"
          aria-label="Go to dashboard"
          @click="goTo(`/accounts/${resolvedAccountId}/dashboard`)"
        >
          <span class="sidebar-brand__wordmark">Maropost</span>
        </button>
      </template>

      <template v-else>
        <button
          type="button"
          class="sidebar-brand sidebar-brand--rail"
          aria-label="Go to dashboard"
          @click.stop="goTo(`/accounts/${resolvedAccountId}/dashboard`)"
        >
          <div class="rail-brand-box">M</div>
        </button>
      </template>

      <v-tooltip location="end" :text="localRail ? 'Expand sidebar' : 'Collapse sidebar'">
        <template #activator="{ props: tipProps }">
          <button
            v-bind="tipProps"
            type="button"
            class="sidebar-toggle-pill sidebar-toggle-pill--anchored"
            :aria-label="localRail ? 'Expand sidebar' : 'Collapse sidebar'"
            @click.stop="toggleSidebarRail"
          >
            <v-icon size="14">{{ localRail ? 'chevron-right' : 'chevron-left' }}</v-icon>
          </button>
        </template>
      </v-tooltip>
    </div>

    <!-- Navigation List -->
    <div class="sidebar-scroll">
    <v-list density="compact" class="py-1">
      <template v-for="group in navGroups" :key="group.title">
        <template v-if="isAppsGroup(group) && !localRail">
          <v-list-item
            :to="group.singleRoute"
            @click="group.singleRoute && goTo(group.singleRoute)"
            :prepend-icon="group.icon"
            :title="group.title"
            :value="group.title"
            rounded="lg"
            :active="isModuleActive(group)"
            active-class="active-nav-item"
            class="mb-1 sidebar-text"
          >
            <template #append>
              <v-tooltip :text="appsExpanded ? 'Hide installed apps' : 'Show installed apps'" location="end">
                <template #activator="{ props: tipProps }">
                  <v-btn
                    v-bind="tipProps"
                    :icon="appsExpanded ? 'minus' : 'plus'"
                    variant="text"
                    size="x-small"
                    density="comfortable"
                    class="sidebar-apps-toggle"
                    :aria-label="appsExpanded ? 'Hide installed apps' : 'Show installed apps'"
                    @click.stop.prevent="appsExpanded = !appsExpanded"
                  />
                </template>
              </v-tooltip>
            </template>
          </v-list-item>

          <div v-if="appsExpanded" class="sidebar-installed-apps">
            <v-list-item
              v-for="app in installedApps"
              :key="app.title"
              :to="app.route"
              @click="goTo(app.route)"
              rounded="lg"
              class="sidebar-text sidebar-child-item sidebar-app-item"
              exact
            >
              <template #prepend>
                <v-icon size="15">{{ app.icon }}</v-icon>
              </template>
              <v-list-item-title>{{ app.title }}</v-list-item-title>
              <template #append>
                <span class="sidebar-app-item__status">{{ app.status }}</span>
              </template>
            </v-list-item>
          </div>
        </template>

        <v-tooltip
          v-else-if="group.items.length === 0"
          location="end"
          :open-delay="350"
          :text="group.title"
        >
          <template #activator="{ props: tipProps }">
            <v-list-item
              v-bind="tipProps"
              :to="group.singleRoute"
              @click="group.singleRoute && goTo(group.singleRoute)"
              :prepend-icon="group.icon"
              :title="!localRail ? group.title : ''"
              :value="group.title"
              rounded="lg"
              :active="isModuleActive(group)"
              active-class="active-nav-item"
              class="mb-1 sidebar-text"
            >
              <template v-slot:append v-if="(!localRail && group.badge) || (isLocked(group) && !group.badge)">
                <v-chip
                  v-if="!localRail && group.badge"
                  size="x-small"
                  variant="tonal"
                  color="secondary"
                  class="font-weight-bold ml-2 sidebar-badge"
                >{{ group.badge }}</v-chip>
                <v-tooltip v-if="isLocked(group) && !group.badge" location="end" text="Upgrade to unlock">
                  <template v-slot:activator="{ props: lockTipProps }">
                    <v-icon v-bind="lockTipProps" size="14" class="ml-2 sidebar-crown">crown</v-icon>
                  </template>
                </v-tooltip>
              </template>
            </v-list-item>
          </template>
        </v-tooltip>

        <div
          v-else-if="!localRail"
          class="sidebar-parent-row"
          :class="{
            'sidebar-parent--flyout-open': flyoutOpen && flyoutGroupTitle === group.title,
            'sidebar-parent--hovered-after-open': flyoutOpen && openedByClick && hoveredParentId === group.title,
          }"
        >
          <v-list-item
            :prepend-icon="group.icon"
            :title="group.title"
            :value="group.title"
            rounded="lg"
            :active="isModuleActive(group)"
            active-class="active-nav-item"
            class="mb-1 sidebar-text sidebar-parent-row__label"
            @click.prevent="onParentClick(group, $event)"
            @mouseenter="onParentHover(group, $event)"
          >
            <template #append>
              <v-icon
                v-if="!isLocked(group)"
                size="14"
                class="sidebar-parent-row__chevron"
                aria-hidden="true"
              >chevron-right</v-icon>
              <v-tooltip v-if="isLocked(group)" location="end" text="Upgrade to unlock">
                <template #activator="{ props: tipProps }">
                  <v-icon v-bind="tipProps" size="14" class="ml-2 sidebar-crown">crown</v-icon>
                </template>
              </v-tooltip>
            </template>
          </v-list-item>
        </div>

        <v-menu
          v-else
          location="end"
          open-on-hover
          :open-delay="0"
          :close-delay="120"
          offset="8"
          :close-on-content-click="false"
          @update:model-value="(v: boolean) => {
            if (v) {
              railOpenGroup = group.title
            } else {
              railHoveredSubGroup = null
              if (railOpenGroup === group.title) railOpenGroup = null
            }
          }"
        >
          <template #activator="{ props: menuProps }">
            <v-list-item
              v-bind="menuProps"
              :prepend-icon="group.icon"
              :title="''"
              :value="group.title"
              rounded="lg"
              class="sidebar-text mb-1"
              :class="{ 'rail-icon-hovered': railOpenGroup === group.title }"
            />
          </template>

          <!-- Single-column flyout card (groups without sub-groups) -->
          <div v-if="!hasSubGroups(group)" class="rail-flyout-card">
            <div class="rail-flyout-card__header">{{ group.title }}</div>
            <div
              v-for="item in group.items"
              :key="item.title"
              class="rail-flyout-item"
              :class="{ 'rail-flyout-item--active': ('route' in item) && route.path.startsWith(item.route) }"
              @click="('route' in item) && goTo(item.route)"
            ><span>{{ ('route' in item) ? item.title : '' }}</span>
              <Crown v-if="isLocked(group)" :size="12" :stroke-width="1.75" />
            </div>
          </div>

          <!-- Inline sub-groups separated by dividers; cascade subs open in 2nd card -->
          <div v-else class="rail-cascade-wrap">
            <div class="rail-flyout-card">
              <div class="rail-flyout-card__header">{{ group.title }}</div>
              <template v-for="(sub, idx) in railSubGroups(group)" :key="sub.title">
                <div v-if="idx > 0" class="rail-flyout-divider" />
                <template v-if="isCascadeSubGroup(sub)">
                  <div
                    class="rail-flyout-item rail-flyout-item--has-sub"
                    :class="{ 'rail-flyout-item--active': railHoveredSubGroup === sub.title }"
                    @mouseenter="railHoveredSubGroup = sub.title"
                  >
                    <span>{{ sub.title }}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>
                  </div>
                </template>
                <template v-else>
                  <div
                    v-for="child in sub.items"
                    :key="child.title"
                    class="rail-flyout-item"
                    :class="{ 'rail-flyout-item--active': route.path.startsWith(child.route) }"
                    @click="goTo(child.route); railHoveredSubGroup = null"
                    @mouseenter="railHoveredSubGroup = null"
                  ><span>{{ child.title }}</span>
                    <Crown v-if="isLocked(group)" :size="12" :stroke-width="1.75" />
                  </div>
                </template>
              </template>
              <template v-if="railFlatItems(group).length">
                <div class="rail-flyout-divider" />
                <div
                  v-for="flat in railFlatItems(group)"
                  :key="flat.title"
                  class="rail-flyout-item"
                  :class="{ 'rail-flyout-item--active': route.path.startsWith(flat.route) }"
                  @click="goTo(flat.route); railHoveredSubGroup = null"
                  @mouseenter="railHoveredSubGroup = null"
                ><span>{{ flat.title }}</span>
                  <Crown v-if="isLocked(group)" :size="12" :stroke-width="1.75" />
                </div>
              </template>
            </div>
            <div
              v-if="railHoveredSubGroup && activeRailSubGroupItems(group).length"
              class="rail-flyout-card"
            >
              <div class="rail-flyout-card__header">{{ railHoveredSubGroup }}</div>
              <div
                v-for="child in activeRailSubGroupItems(group)"
                :key="child.title"
                class="rail-flyout-item"
                :class="{ 'rail-flyout-item--active': route.path.startsWith(child.route) }"
                @click="goTo(child.route)"
              ><span>{{ child.title }}</span>
                <Crown v-if="isLocked(group)" :size="12" :stroke-width="1.75" />
              </div>
            </div>
          </div>
        </v-menu>

        <v-divider v-if="group.dividerAfter" class="sidebar-divider my-1 mx-2" />
      </template>
    </v-list>
    </div>

    <!-- Bottom: Controls -->
    <template v-slot:append>
      <!-- Expanded mode -->
      <div v-if="!localRail" class="sidebar-controls">
        <!-- Accent picker -->
        <div class="sidebar-controls__row sidebar-controls__accents">
          <v-icon size="16" class="sidebar-controls__icon">palette</v-icon>
          <div class="accent-picker">
            <button
              v-for="swatch in accentSwatches"
              :key="swatch.key"
              type="button"
              class="accent-swatch"
              :class="{ 'accent-swatch--active': accent === swatch.key }"
              :style="{ '--swatch-color': swatch.color, background: swatch.color, color: swatch.color }"
              :aria-label="`Set accent to ${swatch.label}`"
              :title="swatch.label"
              @click="setAccent(swatch.key)"
            />
          </div>
        </div>
      </div>

      <!-- Rail mode -->
      <div v-else class="sidebar-controls sidebar-controls--rail">
        <v-menu location="end" offset="8" v-model="showAccentPicker">
          <template #activator="{ props: menuProps }">
            <button
              v-bind="menuProps"
              type="button"
              class="sidebar-rail-btn"
            >
              <v-icon size="18">palette</v-icon>
            </button>
          </template>
          <v-card flat rounded="lg" class="sidebar-surface rail-popover accent-popover">
            <div class="accent-popover__inner">
              <div class="accent-popover__title">Accent Color</div>
              <div class="accent-picker">
                <button
                  v-for="swatch in accentSwatches"
                  :key="swatch.key"
                  type="button"
                  class="accent-swatch accent-swatch--lg"
                  :class="{ 'accent-swatch--active': accent === swatch.key }"
                  :style="{ '--swatch-color': swatch.color, background: swatch.color, color: swatch.color }"
                  :aria-label="`Set accent to ${swatch.label}`"
                  :title="swatch.label"
                  @click="setAccent(swatch.key); showAccentPicker = false"
                />
              </div>
            </div>
          </v-card>
        </v-menu>
      </div>
    </template>
  </v-navigation-drawer>

  <Teleport to="body">
    <div
      v-if="!localRail && flyoutOpen && flyoutGroup"
      class="sidebar-expanded-flyout"
      role="menu"
      :aria-label="`${flyoutGroup.title} menu`"
      :style="{ top: flyoutTop + 'px' }"
    >
      <div v-if="!hasSubGroups(flyoutGroup)" class="rail-flyout-card">
        <button
          v-for="item in flyoutGroup.items"
          :key="item.title"
          type="button"
          class="rail-flyout-item"
          :class="{ 'rail-flyout-item--active': 'route' in item && routeMatches((item as NavItem).route) }"
          @mousedown.stop
          @pointerdown="'route' in item && onFlyoutChildPointerDown(item as NavItem, $event)"
          @click.stop="'route' in item && onFlyoutChildClick(item as NavItem)"
        ><span>{{ 'route' in item ? (item as NavItem).title : '' }}</span>
          <Crown v-if="isLocked(flyoutGroup!)" :size="12" :stroke-width="1.75" />
        </button>
      </div>

      <div v-else class="rail-cascade-wrap">
        <div class="rail-flyout-card">
          <template v-for="(sub, idx) in railSubGroups(flyoutGroup)" :key="sub.title">
            <div v-if="idx > 0" class="rail-flyout-divider" />
            <template v-if="isCascadeSubGroup(sub)">
              <button
                type="button"
                class="rail-flyout-item rail-flyout-item--has-sub"
                :class="{ 'rail-flyout-item--active': expandedHoveredCascade === sub.title }"
                :aria-expanded="expandedHoveredCascade === sub.title"
                @click.stop="toggleExpandedCascade(sub.title)"
              >
                <span>{{ sub.title }}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>
              </button>
            </template>
            <template v-else>
              <button
                v-for="child in sub.items"
                :key="child.title"
                type="button"
                class="rail-flyout-item"
                :class="{ 'rail-flyout-item--active': routeMatches(child.route) }"
                @mousedown.stop
                @pointerdown="onFlyoutChildPointerDown(child, $event); expandedHoveredCascade = null"
                @click.stop="onFlyoutChildClick(child); expandedHoveredCascade = null"
              ><span>{{ child.title }}</span>
                <Crown v-if="isLocked(flyoutGroup!)" :size="12" :stroke-width="1.75" />
              </button>
            </template>
          </template>
          <template v-if="railFlatItems(flyoutGroup).length">
            <div class="rail-flyout-divider" />
            <button
              v-for="flat in railFlatItems(flyoutGroup)"
              :key="flat.title"
              type="button"
              class="rail-flyout-item"
              :class="{ 'rail-flyout-item--active': routeMatches(flat.route) }"
              @mousedown.stop
              @pointerdown="onFlyoutChildPointerDown(flat, $event); expandedHoveredCascade = null"
              @click.stop="onFlyoutChildClick(flat); expandedHoveredCascade = null"
            ><span>{{ flat.title }}</span>
              <Crown v-if="isLocked(flyoutGroup!)" :size="12" :stroke-width="1.75" />
            </button>
          </template>
        </div>
        <div
          v-if="expandedHoveredCascade && expandedCascadeItems.length"
          class="rail-flyout-card"
        >
          <button
            v-for="child in expandedCascadeItems"
            :key="child.title"
            type="button"
            class="rail-flyout-item"
            :class="{ 'rail-flyout-item--active': routeMatches(child.route) }"
            @mousedown.stop
            @pointerdown="onFlyoutChildPointerDown(child, $event)"
            @click.stop="onFlyoutChildClick(child)"
          ><span>{{ child.title }}</span>
            <Crown v-if="isLocked(flyoutGroup!)" :size="12" :stroke-width="1.75" />
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.mp-sidebar {
  --sidebar-bg: var(--mp-color-sidebar-surface, var(--surface-1));
  --sidebar-border: var(--mp-color-sidebar-border, var(--hairline));
  --sidebar-line: var(--sidebar-border);
  --sidebar-text: var(--mp-color-sidebar-text, var(--ink));
  --sidebar-muted: var(--mp-color-sidebar-textMuted, var(--muted));
  --sidebar-hover-bg: color-mix(in oklch, var(--sidebar-text) 5%, transparent);
  --sidebar-active-bg: color-mix(in oklch, var(--sidebar-text) 9%, transparent);
  --sidebar-active-text: var(--sidebar-text);
  --sidebar-focus-ring: color-mix(in oklch, var(--sidebar-text) 22%, transparent);
  --sidebar-radius: 8px;
  --sidebar-radius-sm: 10px;
  --sidebar-transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
  background: var(--sidebar-bg) !important;
  border-right: 1px solid var(--sidebar-border) !important;
  color: var(--sidebar-text);
}

.mp-sidebar :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: visible;
}

.sidebar-header {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 14px 16px 20px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--sidebar-border);
  background: var(--sidebar-bg);
  z-index: 2;
}

.sidebar-header--rail {
  justify-content: center;
  padding: 12px 8px;
}

.sidebar-toggle-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid color-mix(in oklch, var(--sidebar-text) 28%, transparent);
  border-radius: 999px;
  background: var(--sidebar-bg);
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.30), 0 1px 2px rgba(0, 0, 0, 0.16);
  transition: background 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
}

.sidebar-toggle-pill :deep(.v-icon) {
  color: var(--sidebar-text) !important;
  opacity: 0.95;
  transition: opacity 120ms ease;
}

.sidebar-toggle-pill:hover {
  background: color-mix(in oklch, var(--sidebar-bg) 86%, var(--sidebar-text));
  border-color: color-mix(in oklch, var(--sidebar-text) 50%, transparent);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.40), 0 1px 4px rgba(0, 0, 0, 0.20);
}

.sidebar-toggle-pill:hover :deep(.v-icon) {
  opacity: 1;
}

.sidebar-toggle-pill:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--sidebar-focus-ring),
              0 2px 8px rgba(0, 0, 0, 0.35);
}

/* Anchored variant — sits half-outside the header's right edge */
.sidebar-toggle-pill--anchored {
  position: absolute;
  top: 50%;
  right: -12px;
  transform: translateY(-50%);
  z-index: 1010;
  transition: top 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              background 120ms ease,
              border-color 120ms ease,
              box-shadow 120ms ease;
}

/* Rail state — drop the pill to overlap the divider below the brand */
.sidebar-header--rail .sidebar-toggle-pill--anchored {
  top: 100%;
}

.sidebar-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  appearance: none;
  border: 0;
  background: transparent;
  cursor: pointer;
  font: inherit;
  padding: 0;
}

.sidebar-brand:focus-visible {
  outline: none;
  border-radius: var(--sidebar-radius-sm);
  box-shadow: 0 0 0 3px var(--sidebar-focus-ring);
}

.sidebar-brand__mark-simple {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: var(--sidebar-text);
  font-size: 18px;
  font-weight: 800;
  transition: opacity 120ms ease;
}

.sidebar-brand--rail {
  width: 100%;
  justify-content: center;
}

.rail-brand-box {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--sidebar-radius-sm);
  background: var(--sidebar-text);
  color: var(--sidebar-bg);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.5px;
  transition: opacity 120ms ease;
}

.sidebar-brand--rail:hover .rail-brand-box {
  opacity: 0.82;
}

.sidebar-brand__wordmark {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--sidebar-text);
  line-height: 1;
}

.sidebar-apps-toggle {
  width: 24px !important;
  height: 24px !important;
  color: var(--sidebar-muted) !important;
}

.sidebar-apps-toggle:hover {
  background: var(--sidebar-hover-bg) !important;
  color: var(--sidebar-active-text) !important;
}

.sidebar-apps-toggle:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--sidebar-focus-ring);
}

.sidebar-installed-apps {
  margin: 0 0 6px;
}

.sidebar-app-item {
  --indent-padding: 20px;
}

.sidebar-app-item :deep(.v-list-item__prepend > .v-icon) {
  margin-inline-end: 8px;
  color: var(--sidebar-muted);
}

.sidebar-app-item__status {
  color: var(--sidebar-muted);
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.sidebar-scroll {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 8px 12px;
  scrollbar-width: thin;
}

.sidebar-controls {
  padding: 10px 14px;
  border-top: 1px solid var(--sidebar-border);
}

.sidebar-controls--rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 0 10px;
}

.sidebar-controls__row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
}

.sidebar-controls__icon {
  flex-shrink: 0;
}

.sidebar-controls__label {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--sidebar-muted);
  flex: 1;
  white-space: nowrap;
}

.sidebar-controls__switch {
  flex: none;
}

:deep(.sidebar-controls__switch .v-switch__track) {
  height: 16px;
  min-width: 28px;
  width: 28px;
}

:deep(.sidebar-controls__switch .v-switch__thumb) {
  width: 12px;
  height: 12px;
}

:deep(.sidebar-controls__switch .v-selection-control) {
  min-height: 24px;
}

.sidebar-controls__accents {
  margin-top: 2px;
}

.accent-picker {
  display: flex;
  align-items: center;
  gap: 7px;
}

.accent-swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  padding: 0;
  appearance: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  position: relative;
}

.accent-swatch:hover {
  transform: scale(1.18);
}

.accent-swatch--active {
  box-shadow: 0 0 0 2px var(--sidebar-bg), 0 0 0 3.5px currentColor;
}

.accent-swatch--lg {
  width: 22px;
  height: 22px;
}

.sidebar-rail-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--sidebar-radius-sm);
  border: none;
  background: transparent;
  cursor: pointer;
  appearance: none;
  padding: 0;
  color: var(--sidebar-muted);
  transition: var(--sidebar-transition);
}

.sidebar-rail-btn:hover {
  background: var(--sidebar-hover-bg);
  color: var(--sidebar-active-text);
}

.sidebar-rail-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--sidebar-focus-ring);
}

.accent-popover {
  padding: 0 !important;
}

.accent-popover__inner {
  padding: 12px 16px;
}

.accent-popover__title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--sidebar-muted);
  margin-bottom: 10px;
}


.sidebar-divider {
  border-color: var(--sidebar-border) !important;
  opacity: 1;
  margin: 4px 0 !important;
}

.sidebar-badge {
  height: 18px !important;
  padding-inline: 6px;
  border-radius: var(--sidebar-radius) !important;
  background: var(--sidebar-active-bg) !important;
  color: var(--sidebar-muted) !important;
  font-size: 10px !important;
  letter-spacing: 0.04em;
}

.mp-sidebar :deep(.active-nav-item) {
  position: relative;
  background: var(--sidebar-active-bg) !important;
  box-shadow: none;
  color: var(--sidebar-active-text) !important;
  font-weight: 600;
}

/* ─── Expanded-mode parent row: hover chevron (HubSpot-style) ─── */
.sidebar-parent-row {
  position: relative;
}

.sidebar-parent-row__label {
  padding-right: 28px !important;
}

.mp-sidebar :deep(.sidebar-parent-row__chevron) {
  opacity: 0 !important;
  color: var(--sidebar-muted);
  transition: opacity 120ms ease;
}

.mp-sidebar :deep(.sidebar-parent-row:hover .sidebar-parent-row__chevron) {
  opacity: 1 !important;
}

/* ─── Expanded-mode click flyout parent highlight ─── */
.mp-sidebar :deep(.sidebar-parent--flyout-open) {
  background: var(--sidebar-active-bg) !important;
  color: var(--sidebar-active-text) !important;
  font-weight: 600;
}

.mp-sidebar :deep(.sidebar-parent--flyout-open > .v-list-item__overlay) {
  opacity: 0 !important;
}

.mp-sidebar :deep(.sidebar-parent--flyout-open .v-list-item__prepend > .v-icon),
.mp-sidebar :deep(.sidebar-parent--flyout-open .v-list-item-title) {
  color: var(--sidebar-active-text) !important;
  font-weight: 600;
}

.mp-sidebar :deep(.active-nav-item::before) {
  display: none;
}

.mp-sidebar :deep(.active-nav-item > .v-list-item__overlay) {
  opacity: 0 !important;
}

.mp-sidebar :deep(.active-nav-item .v-list-item__prepend > .v-icon),
.mp-sidebar :deep(.active-nav-item .v-list-item-title) {
  color: var(--sidebar-active-text) !important;
}

.mp-sidebar :deep(.active-nav-item .v-list-item-title),
.mp-sidebar :deep(.v-list-item--active .v-list-item-title) {
  font-weight: 600;
}

.mp-sidebar :deep(.v-list-item__prepend .v-icon),
.mp-sidebar :deep(.v-list-item-title) {
  color: var(--sidebar-text);
}

/* Rail icon hover state when flyout menu is open */
.mp-sidebar :deep(.rail-icon-hovered) {
  background: var(--sidebar-active-bg) !important;
}

.mp-sidebar :deep(.rail-icon-hovered > .v-list-item__overlay) {
  opacity: 0 !important;
}

.mp-sidebar :deep(.rail-icon-hovered .v-list-item__prepend > .v-icon) {
  color: var(--sidebar-active-text) !important;
}

.mp-sidebar :deep(.v-list-item-subtitle) {
  color: var(--sidebar-muted);
}

.mp-sidebar :deep(.v-list-item) {
  --v-list-prepend-gap: 16px;
  min-height: 38px;
  margin-bottom: 4px;
  padding: 9px 12px;
  border-radius: var(--sidebar-radius) !important;
  color: var(--sidebar-text);
}

.mp-sidebar :deep(.v-list-item:hover:not(.v-list-item--active):not(.active-nav-item)) {
  background: var(--sidebar-hover-bg) !important;
}

.mp-sidebar :deep(.v-list-item:focus-visible),
.mp-sidebar :deep(.v-list-item--focus-visible) {
  outline: none;
  box-shadow: 0 0 0 2px var(--sidebar-focus-ring);
}

.mp-sidebar :deep(.v-list-item--active) {
  background: var(--sidebar-active-bg) !important;
  color: var(--sidebar-active-text) !important;
  border-radius: var(--sidebar-radius) !important;
}

.mp-sidebar :deep(.v-list-item-title) {
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.2;
}

.mp-sidebar :deep(.v-list-item__prepend) {
  width: auto !important;
  min-width: 0 !important;
  margin-inline-end: 0 !important;
  padding-inline-end: 0 !important;
}

.mp-sidebar :deep(.v-list-item__prepend > .v-icon ~ .v-list-item__spacer) {
  width: 16px !important;
  min-width: 16px !important;
  flex-shrink: 0;
}

.mp-sidebar :deep(.v-list-item__prepend > .v-icon) {
  font-size: 18px;
  margin-inline-end: 0;
}

.mp-sidebar :deep(.v-list-item__content) {
  padding-inline-start: 0 !important;
}

.mp-sidebar :deep(.v-list-item:hover > .v-list-item__overlay) {
  opacity: 0 !important;
}

/* Expanded-mode click flyout panel (teleported) */
.sidebar-expanded-flyout {
  position: fixed;
  left: 240px;
  z-index: 1005;
}

.sidebar-expanded-flyout .rail-flyout-item {
  width: 100%;
  border: 0;
  background: transparent;
  appearance: none;
  text-align: left;
  font-family: inherit;
}

.sidebar-expanded-flyout .rail-flyout-item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--sidebar-focus-ring);
}

/* Rail flyout — single card (tokens: sidebar-dark.css + light defaults below) */
.rail-flyout-card {
  --sidebar-border: var(--hairline);
  --sidebar-text: var(--ink);
  --sidebar-muted: color-mix(in oklch, var(--ink) 62%, transparent);
  --sidebar-hover-bg: color-mix(in oklch, var(--sidebar-text) 7%, transparent);
  --sidebar-active-bg: color-mix(in oklch, var(--sidebar-text) 14%, transparent);
  --sidebar-active-text: var(--sidebar-text);
  --sidebar-radius: 8px;
  background: var(--surface-1);
  border: 1px solid var(--sidebar-border);
  border-radius: var(--sidebar-radius);
  box-shadow: 0 4px 16px color-mix(in oklch, var(--ink) 10%, transparent), 0 1px 3px color-mix(in oklch, var(--ink) 6%, transparent);
  padding: 6px;
  min-width: 200px;
  max-width: 260px;
  overflow: visible;
}

.rail-flyout-card__header {
  z-index: 1;
  margin: -2px -2px 4px;
  padding: 8px 10px 7px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--sidebar-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  border-bottom: 1px solid var(--sidebar-border);
  background: inherit;
}

.rail-flyout-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 34px;
  padding: 7px 10px;
  border-radius: var(--sidebar-radius);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.35;
  color: var(--sidebar-text);
  cursor: pointer;
  transition: background 100ms ease, color 100ms ease;
  user-select: none;
}

.rail-flyout-item:hover {
  background: var(--sidebar-hover-bg);
}

.rail-flyout-item--active {
  background: var(--sidebar-active-bg);
  color: var(--sidebar-active-text);
  font-weight: 600;
}

.rail-flyout-item svg {
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  opacity: 0.55;
}

.rail-flyout-item--active svg,
.rail-flyout-item:hover svg {
  opacity: 0.75;
}

.rail-flyout-divider {
  margin: 4px 6px;
  border-top: 1px solid var(--sidebar-border);
}

.rail-cascade-wrap {
  display: flex;
  gap: 4px;
  align-items: flex-start;
}
</style>
