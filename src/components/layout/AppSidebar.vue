<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccountsStore, type SubscriptionKey } from '@/stores/useAccounts'
import { usePlgStore } from '@/stores/usePlg'
import { useOnboardingStore } from '@/stores/useOnboarding'
import { Crown } from 'lucide-vue-next'
import maropostLogo from '@/assets/maropost-logo.svg?raw'
import { useMobileNav } from '@/composables/useMobileNav'
import { mp_layout_sidebarWidth, mp_layout_sidebarRailWidth } from '@/design-tokens/generated/tokens'

// P4-7. VNavigationDrawer takes numeric widths, so the shell can't read a CSS
// custom property here — it reads the generated TS token instead. Before this,
// tokens.json and CLAUDE.md both documented 248/72 while the component rendered
// 240/64: the tokens described a layout nothing actually used (P1-4 deferred
// exactly this adoption to P4-7).
const SIDEBAR_WIDTH = Number.parseInt(mp_layout_sidebarWidth, 10)
const RAIL_WIDTH = Number.parseInt(mp_layout_sidebarRailWidth, 10)

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
const plgStore = usePlgStore()

// PLG onboarding — pinned "Get started" entry above the nav (reactive; the
// guide store updates as tasks complete anywhere in the app, and the total
// follows the subscription/goal-filtered plan).
const onboardingStore = useOnboardingStore()
const onboardingDone = computed(() => onboardingStore.doneCount)
const onboardingTotal = computed(() => onboardingStore.totalCount)
const onboardingProgress = computed(() => onboardingStore.progress)

// ─── Navigation Structure ────────────────────────────────────
interface NavItem { title: string; route: string; external?: boolean; requires?: SubscriptionKey | SubscriptionKey[]; plgLock?: 'sms' }
interface NavSubGroup { title: string; isSubGroup: true; items: NavItem[] }
interface NavGroup {
  title: string
  icon: string
  singleRoute?: string
  badge?: string
  requires?: SubscriptionKey | SubscriptionKey[]
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
        { title: 'eRFM Report', route: `/accounts/${accountId}/erfm_report` },
        { title: 'Campaign Reports', route: `/accounts/${accountId}/reports` },
        { title: 'Recurring Campaign Reports', route: `/accounts/${accountId}/reports/recurring_campaign_report` },
        { title: 'A/B Campaign Reports', route: `/accounts/${accountId}/ab_reports` },
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
      requires: ['commerce', 'retail'],
      dividerAfter: true,
      singleRoute: `/commerce/${accountId}/products`,
      items: [
        { title: 'Product Recommendations', route: `/commerce/${accountId}/product_recommendations`, requires: 'commerce' },
        { title: 'Products', route: `/commerce/${accountId}/products` },
        { title: 'Collections', route: `/commerce/${accountId}/products/collections` },
        { title: 'Inventory', route: `/commerce/${accountId}/inventory` },
        { title: 'Price Lists', route: `/commerce/${accountId}/products/price-lists` },
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
            { title: 'SMS Campaigns', route: `/accounts/${accountId}/sms_campaigns`, plgLock: 'sms' },
            { title: 'Transactional Email', route: `/accounts/${accountId}/transactional_campaigns` },
            { title: 'Transactional SMS', route: `/accounts/${accountId}/transactional_sms`, plgLock: 'sms' },
            { title: 'Campaign Tags', route: `/accounts/${accountId}/campaign_tags` },
          ],
        },
        {
          title: 'Acquisition',
          isSubGroup: true,
          items: [
            { title: 'Acquisition Forms', route: `/accounts/${accountId}/acquisition/forms` },
            { title: 'Landing Pages', route: `/accounts/${accountId}/landing_pages` },
            { title: 'Landing Page Templates', route: `/accounts/${accountId}/landing_pages/templates` },
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
      requires: ['commerce', 'retail'],
      singleRoute: `/commerce/${accountId}/orders`,
      items: [
        // Web storefronts are Commerce Cloud only; POS channels live under Retail.
        { title: 'Sales Channels', route: onlineSalesRoute, requires: 'commerce' },
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
      // Retail is a POS-operations workspace: the global entry opens it, the
      // in-workspace rail carries operations, catalog links and setup.
      title: 'Retail',
      icon: 'store',
      requires: 'retail',
      singleRoute: `/commerce/${accountId}/retail`,
      items: [
        { title: 'Overview', route: `/commerce/${accountId}/retail` },
        { title: 'Transactions', route: `/commerce/${accountId}/retail/transactions` },
        { title: 'POS Preview', route: `/commerce/${accountId}/retail/pos-preview` },
        { title: 'Stores', route: offlinePhysicalRoute },
      ],
    },
    {
      // Merchandising is channel-scoped (like Sales Channels): the global entry
      // opens the channel selector; sections live in the in-workspace rail.
      title: 'Merchandise',
      icon: 'sliders-horizontal',
      requires: 'commerce',
      singleRoute: `/commerce/${accountId}/merchandising`,
      items: [
        { title: 'Select sales channel', route: `/commerce/${accountId}/merchandising` },
      ],
    },
    {
      title: 'Service',
      icon: 'headset',
      dividerAfter: true,
      requires: 'service',
      singleRoute: `/service/${accountId}/tickets`,
      items: [
        { title: 'Tickets', route: `/service/${accountId}/tickets` },
      ],
    },
    {
      title: 'Da Vinci AI',
      icon: 'sparkles',
      badge: 'NEW',
      singleRoute: `/accounts/${accountId}/da-vinci`,
      dividerAfter: true,
      items: [
        { title: 'Overview', route: `/accounts/${accountId}/da-vinci` },
        { title: 'Chatbots', route: `/accounts/${accountId}/chatbot`, requires: ['service', 'commerce'] },
        { title: 'Ask Da Vinci', route: `/accounts/${accountId}/da-vinci/copilot`, requires: 'davinci' },
        { title: 'AI experience', route: `/accounts/${accountId}/da-vinci/experience`, requires: 'davinci' },
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

const { mobileNavOpen } = useMobileNav()

const localDrawer = ref(props.modelValue)
const localRail = ref(props.rail)
// On a temporary (mobile) drawer, always render the full expanded nav — rail
// mode (icon-only + hover flyouts) is a desktop-hover pattern that doesn't
// work on touch, and there's no width pressure inside an overlay anyway.
const effectiveRail = computed(() => props.temporary ? false : localRail.value)
// The drawer's open/closed state is driven by different sources depending on
// mode: desktop uses the parent-synced `localDrawer`; mobile uses the shared
// mobile-nav flag so the AppBar hamburger (a sibling component) can open it
// without App.vue having to wire a prop between the two.
const drawerModel = computed<boolean>({
  get: () => (props.temporary ? mobileNavOpen.value : localDrawer.value),
  set: (value: boolean) => {
    if (props.temporary) mobileNavOpen.value = value
    else localDrawer.value = value
  },
})
const sidebarMode = computed<'expanded' | 'rail'>(() => effectiveRail.value ? 'rail' : 'expanded')
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

function activateNavItem(item: NavItem) {
  if (item.external) {
    window.open(item.route, '_blank', 'noopener,noreferrer')
    return
  }
  goTo(item.route)
}

function isLocked(group: NavGroup) {
  if (!group.requires) return false
  return Array.isArray(group.requires)
    ? !accountsStore.hasAnySubscription(group.requires)
    : !accountsStore.hasSubscription(group.requires)
}

function isItemLocked(item: NavItem): boolean {
  // PLG entitlement locks (e.g. SMS excluded from trials / Build tier).
  if (item.plgLock === 'sms' && !plgStore.entitlements.sms) return true
  if (!item.requires) return false
  return Array.isArray(item.requires)
    ? !accountsStore.hasAnySubscription(item.requires)
    : !accountsStore.hasSubscription(item.requires)
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
  if (route.path === target) return true
  if (!route.path.startsWith(`${target}/`)) return false
  // Don't light up a parent hub (e.g. /merchandising) when a more specific
  // sibling route (e.g. /merchandising/collections) matches the current path.
  const allRoutes = navGroups.value.flatMap(collectGroupRoutes)
  return !allRoutes.some((r) =>
    r !== target
    && r.length > target.length
    && (route.path === r || route.path.startsWith(`${r}/`)),
  )
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
  if (!effectiveRail.value && flyoutOpen.value) {
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
  // Persist only deliberate choices — auto-collapse (narrow viewport,
  // rail-shell routes) arrives via the `rail` prop and is never stored.
  localStorage.setItem('app-sidebar-rail', localRail.value ? 'rail' : 'expanded')
}

// "[" toggles the sidebar (ignored while typing or when the drawer is a
// mobile overlay) — mirrors the toggle pill in the header.
function onSidebarHotkey(event: KeyboardEvent) {
  if (event.key !== '[' || event.metaKey || event.ctrlKey || event.altKey) return
  const target = event.target as HTMLElement | null
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
  if (props.temporary) return
  event.preventDefault()
  toggleSidebarRail()
}

onMounted(() => window.addEventListener('keydown', onSidebarHotkey))
onUnmounted(() => window.removeEventListener('keydown', onSidebarHotkey))

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
  activateNavItem(item)
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
    v-model="drawerModel"
    :rail="effectiveRail"
    :rail-width="RAIL_WIDTH"
    :width="SIDEBAR_WIDTH"
    :permanent="!props.temporary"
    :temporary="props.temporary"
    :mobile-breakpoint="1024"
    class="mp-sidebar"
    aria-label="Main navigation"
  >
    <!-- Brand + anchored toggle -->
    <div class="sidebar-header" :class="{ 'sidebar-header--rail': effectiveRail }">
      <template v-if="!effectiveRail">
        <button
          type="button"
          class="sidebar-brand"
          aria-label="Go to dashboard"
          @click="goTo(`/accounts/${resolvedAccountId}/dashboard`)"
        >
          <div class="rail-brand-box" aria-hidden="true">M</div>
          <span class="sidebar-brand__logo" v-html="maropostLogo" />
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

      <v-tooltip v-if="!props.temporary" location="end" :text="localRail ? 'Expand sidebar  ·  [' : 'Collapse sidebar  ·  ['">
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

    <!-- PLG onboarding (trial or purchased) — pinned Get Started entry -->
    <template v-if="onboardingStore.showGuideSurfaces">
      <button
        v-if="!effectiveRail"
        type="button"
        class="sidebar-get-started"
        aria-label="Get started checklist"
        @click="goTo(`/accounts/${resolvedAccountId}/get-started`)"
      >
        <div class="sidebar-get-started__row">
          <v-icon size="16" color="primary">rocket</v-icon>
          <span class="sidebar-get-started__title">Get started</span>
          <span class="sidebar-get-started__count">{{ onboardingDone }}/{{ onboardingTotal }}</span>
        </div>
        <v-progress-linear
          :model-value="onboardingProgress"
          color="primary"
          height="4"
          rounded
          class="sidebar-get-started__bar"
        />
      </button>
      <v-tooltip v-else location="end" :text="`Get started · ${onboardingDone} of ${onboardingTotal} tasks`">
        <template #activator="{ props: tipProps }">
          <button
            v-bind="tipProps"
            type="button"
            class="sidebar-get-started sidebar-get-started--rail"
            aria-label="Get started checklist"
            @click="goTo(`/accounts/${resolvedAccountId}/get-started`)"
          >
            <v-icon size="16" color="primary">rocket</v-icon>
          </button>
        </template>
      </v-tooltip>
    </template>

    <!-- Navigation List -->
    <div class="sidebar-scroll">
    <v-list density="compact" class="py-1">
      <template v-for="group in navGroups" :key="group.title">
        <template v-if="isAppsGroup(group) && !effectiveRail">
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
                    size="small"
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
              :title="!effectiveRail ? group.title : ''"
              :value="group.title"
              rounded="lg"
              :active="isModuleActive(group)"
              active-class="active-nav-item"
              class="mb-1 sidebar-text"
            >
              <template v-slot:append v-if="(!effectiveRail && group.badge) || (isLocked(group) && !group.badge)">
                <v-chip
                  v-if="!effectiveRail && group.badge"
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
          v-else-if="!effectiveRail"
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
            <button
              v-for="item in group.items"
              :key="item.title"
              type="button"
              class="rail-flyout-item"
              :class="{ 'rail-flyout-item--active': ('route' in item) && route.path.startsWith(item.route) }"
              @click="('route' in item) && activateNavItem(item as NavItem)"
            ><span>{{ ('route' in item) ? item.title : '' }}</span>
              <Crown v-if="isLocked(group)" :size="12" :stroke-width="1.75" />
              <v-tooltip v-if="'route' in item && isItemLocked(item as NavItem)" location="end" text="Upgrade to unlock">
                <template #activator="{ props: lockTipProps }">
                  <Crown v-bind="lockTipProps" :size="12" :stroke-width="1.75" />
                </template>
              </v-tooltip>
            </button>
          </div>

          <!-- Inline sub-groups separated by dividers; cascade subs open in 2nd card -->
          <div v-else class="rail-cascade-wrap">
            <div class="rail-flyout-card">
              <div class="rail-flyout-card__header">{{ group.title }}</div>
              <template v-for="(sub, idx) in railSubGroups(group)" :key="sub.title">
                <div v-if="idx > 0" class="rail-flyout-divider" />
                <template v-if="isCascadeSubGroup(sub)">
                  <button
                    type="button"
                    class="rail-flyout-item rail-flyout-item--has-sub"
                    :class="{ 'rail-flyout-item--active': railHoveredSubGroup === sub.title }"
                    @mouseenter="railHoveredSubGroup = sub.title"
                    @click="railHoveredSubGroup = sub.title"
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
                    @click="goTo(child.route); railHoveredSubGroup = null"
                    @mouseenter="railHoveredSubGroup = null"
                  ><span>{{ child.title }}</span>
                    <Crown v-if="isLocked(group)" :size="12" :stroke-width="1.75" />
                    <v-tooltip v-if="isItemLocked(child)" location="end" text="Upgrade to unlock">
                      <template #activator="{ props: lockTipProps }">
                        <Crown v-bind="lockTipProps" :size="12" :stroke-width="1.75" />
                      </template>
                    </v-tooltip>
                  </button>
                </template>
              </template>
              <template v-if="railFlatItems(group).length">
                <div class="rail-flyout-divider" />
                <button
                  v-for="flat in railFlatItems(group)"
                  :key="flat.title"
                  type="button"
                  class="rail-flyout-item"
                  :class="{ 'rail-flyout-item--active': routeMatches(flat.route) }"
                  @click="goTo(flat.route); railHoveredSubGroup = null"
                  @mouseenter="railHoveredSubGroup = null"
                ><span>{{ flat.title }}</span>
                  <Crown v-if="isLocked(group)" :size="12" :stroke-width="1.75" />
                  <v-tooltip v-if="isItemLocked(flat)" location="end" text="Upgrade to unlock">
                    <template #activator="{ props: lockTipProps }">
                      <Crown v-bind="lockTipProps" :size="12" :stroke-width="1.75" />
                    </template>
                  </v-tooltip>
                </button>
              </template>
            </div>
            <div
              v-if="railHoveredSubGroup && activeRailSubGroupItems(group).length"
              class="rail-flyout-card"
            >
              <div class="rail-flyout-card__header">{{ railHoveredSubGroup }}</div>
              <button
                v-for="child in activeRailSubGroupItems(group)"
                :key="child.title"
                type="button"
                class="rail-flyout-item"
                :class="{ 'rail-flyout-item--active': route.path.startsWith(child.route) }"
                @click="goTo(child.route)"
              ><span>{{ child.title }}</span>
                <Crown v-if="isLocked(group)" :size="12" :stroke-width="1.75" />
                <v-tooltip v-if="isItemLocked(child)" location="end" text="Upgrade to unlock">
                  <template #activator="{ props: lockTipProps }">
                    <Crown v-bind="lockTipProps" :size="12" :stroke-width="1.75" />
                  </template>
                </v-tooltip>
              </button>
            </div>
          </div>
        </v-menu>

        <v-divider v-if="group.dividerAfter" class="sidebar-divider my-1 mx-3" />
      </template>
    </v-list>
    </div>

  </v-navigation-drawer>

  <Teleport to="body">
    <div
      v-if="!effectiveRail && flyoutOpen && flyoutGroup"
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
          <v-tooltip v-if="'route' in item && isItemLocked(item as NavItem)" location="end" text="Upgrade to unlock">
            <template #activator="{ props: lockTipProps }">
              <Crown v-bind="lockTipProps" :size="12" :stroke-width="1.75" />
            </template>
          </v-tooltip>
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
                <v-tooltip v-if="isItemLocked(child)" location="end" text="Upgrade to unlock">
                  <template #activator="{ props: lockTipProps }">
                    <Crown v-bind="lockTipProps" :size="12" :stroke-width="1.75" />
                  </template>
                </v-tooltip>
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
              <v-tooltip v-if="isItemLocked(flat)" location="end" text="Upgrade to unlock">
                <template #activator="{ props: lockTipProps }">
                  <Crown v-bind="lockTipProps" :size="12" :stroke-width="1.75" />
                </template>
              </v-tooltip>
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
            <v-tooltip v-if="isItemLocked(child)" location="end" text="Upgrade to unlock">
              <template #activator="{ props: lockTipProps }">
                <Crown v-bind="lockTipProps" :size="12" :stroke-width="1.75" />
              </template>
            </v-tooltip>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.mp-sidebar {
  --sidebar-bg: var(--mp-color-sidebar-surface, var(--surface-primary));
  --sidebar-border: var(--mp-color-sidebar-border, var(--border-subtle));
  --sidebar-line: var(--sidebar-border);
  --sidebar-text: var(--mp-color-sidebar-text, var(--text-primary));
  --sidebar-muted: var(--mp-color-sidebar-textMuted, var(--muted));
  --sidebar-hover-bg: color-mix(in oklch, var(--sidebar-text) 5%, transparent);
  --sidebar-active-bg: color-mix(in oklch, var(--sidebar-text) 7%, transparent);
  --sidebar-active-text: var(--sidebar-text);
  --sidebar-focus-ring: color-mix(in oklch, var(--sidebar-text) 22%, transparent);
  /* 8 is the chips-and-menu-items step, 10 the controls step, of the one
     concentric radius system (P2-6). */
  --sidebar-radius: var(--mp-component-nav-itemRadius);
  --sidebar-radius-sm: var(--mp-component-input-radius);
  --sidebar-transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease);
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
  gap: var(--mp-space-10);
  /* Height matches the app bar (56px + 1px divider) so the two header dividers
     line up. A shell-alignment constant, not a spacing step. */
  height: 57px;
  padding: 0 var(--mp-space-16) 0 var(--mp-space-20);
  margin-bottom: var(--mp-space-6);
  border-bottom: 1px solid var(--sidebar-border);
  background: var(--sidebar-bg);
  z-index: 2;
}

.sidebar-header--rail {
  justify-content: center;
  padding: 0 var(--mp-space-8);
}

/* PLG trial onboarding — pinned Get Started entry */
.sidebar-get-started {
  flex-shrink: 0;
  display: block;
  width: calc(100% - var(--mp-space-16));
  margin: var(--mp-space-2) var(--mp-space-8) var(--mp-space-6);
  padding: var(--mp-space-8) var(--mp-space-10);
  border: 1px solid var(--sidebar-border);
  border-radius: var(--sidebar-radius-sm);
  background: var(--sidebar-hover-bg);
  color: var(--sidebar-text);
  text-align: left;
  cursor: pointer;
}

.sidebar-get-started:hover,
.sidebar-get-started:focus-visible {
  background: var(--sidebar-active-bg);
}

.sidebar-get-started:focus-visible {
  outline: 2px solid var(--sidebar-focus-ring);
  outline-offset: 1px;
}

.sidebar-get-started__row {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
}

.sidebar-get-started__title {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  line-height: 1;
}

.sidebar-get-started__count {
  margin-left: auto;
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-semibold);
  opacity: 0.7;
}

.sidebar-get-started__bar {
  margin-top: var(--mp-space-8);
}

.sidebar-get-started--rail {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-32);
  height: var(--mp-space-32);
  margin: var(--mp-space-2) auto var(--mp-space-6);
  padding: 0;
}

.sidebar-toggle-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-24);
  height: var(--mp-space-24);
  border: 1px solid color-mix(in oklch, var(--sidebar-text) 28%, transparent);
  border-radius: var(--mp-radius-full);
  background: var(--sidebar-bg);
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: var(--elevation-raised);
  transition: background var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease);
}

.sidebar-toggle-pill :deep(.v-icon) {
  color: var(--sidebar-text) !important;
  opacity: 0.95;
  transition: opacity var(--dur-fast) var(--ease);
}

.sidebar-toggle-pill:hover {
  background: color-mix(in oklch, var(--sidebar-bg) 86%, var(--sidebar-text));
  border-color: color-mix(in oklch, var(--sidebar-text) 50%, transparent);
  box-shadow: var(--elevation-overlay);
}

.sidebar-toggle-pill:hover :deep(.v-icon) {
  opacity: 1;
}

.sidebar-toggle-pill:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--sidebar-focus-ring),
              var(--elevation-raised);
}

/* Anchored variant — sits half-outside the header's right edge */
.sidebar-toggle-pill--anchored {
  position: absolute;
  top: 50%;
  right: calc(var(--mp-space-12) * -1);
  transform: translateY(-50%);
  z-index: var(--mp-zIndex-navSidebarTogglePill);
  transition: top 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              background var(--dur-fast) var(--ease),
              border-color var(--dur-fast) var(--ease),
              box-shadow var(--dur-fast) var(--ease);
}

/* Rail state — drop the pill to overlap the divider below the brand */
.sidebar-header--rail .sidebar-toggle-pill--anchored {
  top: 100%;
}

.sidebar-brand {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-8);
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
  width: var(--mp-space-24);
  height: var(--mp-space-24);
  color: var(--sidebar-text);
  font-size: var(--mp-fontSize-18);
  font-weight: var(--mp-fontWeight-heavy);
  transition: opacity var(--dur-fast) var(--ease);
}

.sidebar-brand--rail {
  width: 100%;
  justify-content: center;
}

.rail-brand-box {
  width: var(--mp-space-32);
  height: var(--mp-space-32);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--mp-radius-4);
  background: var(--sidebar-text);
  color: var(--sidebar-bg);
  font-size: var(--mp-fontSize-15);
  font-weight: var(--mp-fontWeight-bold);
  letter-spacing: -0.5px;
  transition: opacity var(--dur-fast) var(--ease);
}

.sidebar-brand--rail:hover .rail-brand-box {
  opacity: 0.82;
}

.sidebar-brand__logo {
  display: inline-flex;
  align-items: center;
  color: var(--sidebar-text);
}

.sidebar-brand__logo :deep(svg) {
  display: block;
  height: var(--mp-fontSize-18);
  width: auto;
}

.sidebar-apps-toggle {
  width: var(--mp-space-28) !important;
  height: var(--mp-space-28) !important;
  min-width: var(--mp-space-28) !important;
  min-height: var(--mp-space-28) !important;
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
  margin: 0 0 var(--mp-space-6);
}

.sidebar-app-item {
  --indent-padding: var(--mp-space-20);
}

.sidebar-app-item :deep(.v-list-item__prepend > .v-icon) {
  margin-inline-end: var(--mp-space-8);
  color: var(--sidebar-muted);
}

.sidebar-app-item__status {
  color: var(--sidebar-muted);
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.sidebar-scroll {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--mp-space-4) var(--mp-space-8) var(--mp-space-12);
  scrollbar-width: thin;
}

.sidebar-divider {
  border-color: var(--sidebar-border) !important;
  opacity: 1;
  margin: var(--mp-space-6) 0 !important;
}

.sidebar-badge {
  height: var(--mp-component-chip-height-sm) !important;
  padding-inline: var(--mp-component-chip-paddingInline);
  border-radius: var(--sidebar-radius) !important;
  background: var(--sidebar-active-bg) !important;
  color: var(--sidebar-muted) !important;
  font-size: var(--mp-fontSize-10) !important;
  letter-spacing: 0.04em;
}

.mp-sidebar :deep(.active-nav-item) {
  position: relative;
  background: var(--sidebar-active-bg) !important;
  box-shadow: none;
  color: var(--sidebar-active-text) !important;
  font-weight: var(--mp-fontWeight-semibold);
}

/* ─── Expanded-mode parent row: hover chevron (HubSpot-style) ─── */
.sidebar-parent-row {
  position: relative;
}

.sidebar-parent-row__label {
  padding-right: var(--mp-space-28) !important;
}

.mp-sidebar :deep(.sidebar-parent-row__chevron) {
  opacity: 0 !important;
  color: var(--sidebar-muted);
  transition: opacity var(--dur-fast) var(--ease);
}

.mp-sidebar :deep(.sidebar-parent-row:hover .sidebar-parent-row__chevron) {
  opacity: 1 !important;
}

/* ─── Expanded-mode click flyout parent highlight ─── */
.mp-sidebar :deep(.sidebar-parent--flyout-open) {
  background: var(--sidebar-active-bg) !important;
  color: var(--sidebar-active-text) !important;
  font-weight: var(--mp-fontWeight-semibold);
}

.mp-sidebar :deep(.sidebar-parent--flyout-open > .v-list-item__overlay) {
  opacity: 0 !important;
}

.mp-sidebar :deep(.sidebar-parent--flyout-open .v-list-item__prepend > .v-icon),
.mp-sidebar :deep(.sidebar-parent--flyout-open .v-list-item-title) {
  color: var(--sidebar-active-text) !important;
  font-weight: var(--mp-fontWeight-semibold);
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
  font-weight: var(--mp-fontWeight-semibold);
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
  /* Same `component.listItem.*` height and block rhythm as MpSectionRail and
     MpListRow, so the global sidebar, an in-content rail and a list row all sit
     on one 40px baseline (P4-7). Block padding was 10 here and 8 there.

     The INLINE inset is deliberately 16, not listItem.paddingInline (12): this
     drawer insets its scroller by 8, the section rail insets its own by 12, and
     what has to line up between them is the label column's distance from the
     panel edge — 8 + 16 here, 12 + 12 there, both 24. Matching the raw number
     instead would misalign them by 4px.

     `padding-inline` is stated on a two-class descendant so it beats Vuetify's
     own `.v-list-item--density-compact…{padding-inline:16px}` (0,3,0) rule
     deterministically. A plain scoped selector ties it and loses on source
     order — the same trap global.scss's table-padding comment documents. */
  --v-list-prepend-gap: var(--mp-space-16);
  min-height: var(--mp-component-listItem-minHeight);
  margin-bottom: var(--mp-space-2);
  padding-block: var(--mp-component-listItem-paddingBlock);
  border-radius: var(--sidebar-radius) !important;
  color: var(--sidebar-text);
}

.mp-sidebar :deep(.v-list .v-list-item) {
  padding-inline: var(--mp-space-16);
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
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  line-height: 1.2;
}

.mp-sidebar :deep(.v-list-item__prepend) {
  width: auto !important;
  min-width: 0 !important;
  margin-inline-end: 0 !important;
  padding-inline-end: 0 !important;
}

.mp-sidebar :deep(.v-list-item__prepend > .v-icon ~ .v-list-item__spacer) {
  width: var(--mp-space-16) !important;
  min-width: var(--mp-space-16) !important;
  flex-shrink: 0;
}

.mp-sidebar :deep(.v-list-item__prepend > .v-icon) {
  font-size: var(--mp-fontSize-20);
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
  left: var(--mp-layout-sidebarWidth);
  z-index: var(--mp-zIndex-navSidebarFlyout);
}

/* Rail flyout — single card (tokens: sidebar-dark.css + light defaults below) */
.rail-flyout-card {
  --sidebar-border: var(--border-subtle);
  --sidebar-text: var(--text-primary);
  --sidebar-muted: color-mix(in oklch, var(--text-primary) 62%, transparent);
  --sidebar-hover-bg: color-mix(in oklch, var(--sidebar-text) 7%, transparent);
  --sidebar-active-bg: color-mix(in oklch, var(--sidebar-text) 11%, transparent);
  --sidebar-active-text: var(--sidebar-text);
  --sidebar-radius: var(--mp-component-nav-itemRadius);
  background: var(--surface-primary);
  /* Shared popover chrome (matches .v-menu overlay surfaces in global.scss) */
  border: 1px solid var(--mp-border-subtle);
  border-radius: var(--mp-radius-12);
  box-shadow: var(--mp-shadow-lg), var(--mp-shadow-md);
  padding: var(--mp-space-6);
  /* Popover measure, not a spacing step. */
  min-width: 200px;
  max-width: var(--mp-layout-sectionRailWidth);
  overflow: visible;
}

.rail-flyout-card__header {
  z-index: 1;
  margin: calc(var(--mp-space-2) * -1) calc(var(--mp-space-2) * -1) var(--mp-space-4);
  padding: var(--mp-space-8) var(--mp-space-10);
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-semibold);
  line-height: 1.25;
  color: var(--sidebar-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid var(--sidebar-border);
  background: inherit;
}

.rail-flyout-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* A flyout row is still a nav row — same listItem geometry as the rail rows
     it stands in for. Was 34px tall at 7px block padding. */
  gap: var(--mp-space-8);
  min-height: var(--mp-component-listItem-minHeight);
  padding: var(--mp-component-listItem-paddingBlock) var(--mp-component-listItem-paddingInline);
  border-radius: var(--sidebar-radius);
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  line-height: 1.35;
  color: var(--sidebar-text);
  cursor: pointer;
  transition: background 100ms ease, color 100ms ease;
  user-select: none;
  /* Items render as <button> for keyboard focus + SR semantics — reset UA styles */
  width: 100%;
  border: 0;
  background: transparent;
  appearance: none;
  text-align: left;
  font-family: inherit;
}

.rail-flyout-item:focus-visible {
  outline: 2px solid color-mix(in oklch, var(--sidebar-text) 45%, transparent);
  outline-offset: -2px;
}

.rail-flyout-item:hover {
  background: var(--sidebar-hover-bg);
}

.rail-flyout-item--active {
  background: var(--sidebar-active-bg);
  color: var(--sidebar-active-text);
  font-weight: var(--mp-fontWeight-semibold);
}

.rail-flyout-item svg {
  flex-shrink: 0;
  width: var(--mp-space-12);
  height: var(--mp-space-12);
  opacity: 0.55;
}

.rail-flyout-item--active svg,
.rail-flyout-item:hover svg {
  opacity: 0.75;
}

.rail-flyout-divider {
  margin: var(--mp-space-4) var(--mp-space-6);
  border-top: 1px solid var(--sidebar-border);
}

.rail-cascade-wrap {
  display: flex;
  gap: var(--mp-space-4);
  align-items: flex-start;
}
</style>
