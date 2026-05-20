<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccountsStore, type SubscriptionKey } from '@/stores/useAccounts'
import { useAppTheme, type AccentKey } from '@/composables/useAppTheme'

const props = defineProps<{
  modelValue: boolean
  rail: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  'update:rail': [val: boolean]
}>()

const accountsStore = useAccountsStore()
const { accent, darkSidebar, setAccent, setDarkSidebar } = useAppTheme()

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
        { title: 'Product Tax Category', route: `/commerce/${accountId}/product_tax_category` },
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
            { title: 'Transactional Email', route: `/accounts/${accountId}/transactional_campaigns` },
            { title: 'Campaign Tags', route: `/accounts/${accountId}/campaign_tags` },
          ],
        },
        {
          title: 'Acquisition',
          isSubGroup: true,
          items: [
            { title: 'Acquisition Forms', route: `/accounts/${accountId}/acquisition` },
            { title: 'Signup Forms', route: `/accounts/${accountId}/signup_forms` },
            { title: 'Landing Pages', route: `/accounts/${accountId}/landing_pages` },
            { title: 'Surveys', route: `/accounts/${accountId}/surveys` },
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
        {
          title: 'Content',
          isSubGroup: true,
          items: [
            { title: 'Email Content', route: `/accounts/${accountId}/contents` },
            { title: 'Dynamic Content', route: `/accounts/${accountId}/dynamic_contents` },
            { title: 'Image Library', route: `/accounts/${accountId}/images` },
            { title: 'Footer Management', route: `/accounts/${accountId}/footers` },
            { title: 'Optimise on Open', route: `/accounts/${accountId}/image_groups` },
            { title: 'Content Feeds', route: `/accounts/${accountId}/content_feeds` },
            { title: 'Coupon Banks', route: `/accounts/${accountId}/coupon_banks` },
            { title: 'Preference Management', route: `/accounts/${accountId}/preference_pages` },
            { title: 'Countdown Timer', route: `/accounts/${accountId}/live_content_images` },
          ],
        },
      ],
    },
    {
      title: 'Commerce',
      icon: 'shopping-cart',
      requires: 'commerce',
      singleRoute: `/commerce/${accountId}/orders`,
      items: [
        {
          title: 'Orders',
          isSubGroup: true,
          items: [
            { title: 'Sales Orders', route: `/commerce/${accountId}/orders` },
            { title: 'Draft Orders', route: `/commerce/${accountId}/orders/drafts` },
            { title: 'Fulfillment', route: `/commerce/${accountId}/fulfillments` },
          ],
        },
        { title: 'Promos & Coupons', route: `/commerce/${accountId}/coupons` },
        { title: 'Sales Channels', route: `/commerce/${accountId}/sales_channels` },
      ],
    },
    {
      title: 'Retail',
      icon: 'store',
      requires: 'commerce',
      singleRoute: `/commerce/${accountId}/retail`,
      items: [],
    },
    {
      title: 'Merchandise',
      icon: 'tag',
      requires: 'commerce',
      singleRoute: `/commerce/${accountId}/merchandising`,
      items: [],
    },
    {
      title: 'Service',
      icon: 'headset',
      dividerAfter: true,
      requires: 'service',
      singleRoute: `/accounts/${accountId}/service`,
      items: [
        { title: 'Tickets', route: `/accounts/${accountId}/service` },
      ],
    },
    {
      title: 'Da Vinci AI',
      icon: 'bot',
      badge: 'NEW',
      requires: 'davinci',
      singleRoute: `/accounts/${accountId}/da-vinci/dashboard`,
      dividerAfter: true,
      items: [],
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
const railHoveredSubGroup = ref<string | null>(null)
const appsExpanded = ref(false)
const expandedParentKey = ref<string | null>(null)
const expandedSubKey = ref<string | null>(null)
const router = useRouter()
const route = useRoute()
const resolvedAccountId = computed(() => {
  const routeAccountId = Array.isArray(route.params.accountId)
    ? route.params.accountId[0]
    : route.params.accountId

  return routeAccountId ?? accountsStore.activeId
})
const navGroups = computed(() => buildNavGroups(resolvedAccountId.value))
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

watch(localRail, (nextValue) => {
  emit('update:rail', nextValue)
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

function flatGroupItems(group: NavGroup): NavItem[] {
  return group.items.flatMap((item) => isSubGroup(item) ? item.items : [item])
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

function isModuleActive(group: NavGroup): boolean {
  return collectGroupRoutes(group).some((r) => routeMatches(r))
}

// ─── Manual expand/collapse tracking (split label/chevron) ──
function subGroupKey(group: NavGroup, subgroup: NavSubGroup): string {
  return `${group.title}:${subgroup.title}`
}

function activeItemForGroup(group: NavGroup): NavItem | null {
  return flatGroupItems(group)
    .filter((item) => routeMatches(item.route))
    .sort((a, b) => b.route.length - a.route.length)[0] ?? null
}

function isItemActive(group: NavGroup, item: NavItem): boolean {
  return activeItemForGroup(group)?.route === item.route
}

function activeSubGroupForGroup(group: NavGroup): NavSubGroup | null {
  const activeItem = activeItemForGroup(group)
  if (!activeItem) return null
  return railSubGroups(group).find((subgroup) =>
    subgroup.items.some((item) => item.route === activeItem.route),
  ) ?? null
}

function isParentExpanded(group: NavGroup): boolean {
  return expandedParentKey.value === group.title
}

function isSubGroupExpanded(group: NavGroup, subgroup: NavSubGroup): boolean {
  return expandedSubKey.value === subGroupKey(group, subgroup)
}

function isSubGroupActive(group: NavGroup, subgroup: NavSubGroup): boolean {
  return activeSubGroupForGroup(group)?.title === subgroup.title
}

function setExpandedParent(group: NavGroup) {
  const activeSubGroup = activeSubGroupForGroup(group)
  expandedParentKey.value = group.title
  expandedSubKey.value = activeSubGroup ? subGroupKey(group, activeSubGroup) : null
}

function toggleParent(group: NavGroup) {
  if (isParentExpanded(group)) {
    expandedParentKey.value = null
    expandedSubKey.value = null
    return
  }

  setExpandedParent(group)
}

function toggleSubGroup(group: NavGroup, subgroup: NavSubGroup) {
  expandedParentKey.value = group.title
  expandedSubKey.value = isSubGroupExpanded(group, subgroup)
    ? null
    : subGroupKey(group, subgroup)
}

function keepParentExpanded(group: NavGroup, subgroup?: NavSubGroup) {
  expandedParentKey.value = group.title
  expandedSubKey.value = subgroup ? subGroupKey(group, subgroup) : null
}

function syncExpansionWithRoute() {
  // Only collapse — never auto-expand. If a section was explicitly opened
  // by the chevron, keep it open as long as it's still the active module.
  // If the user navigated to a different module, collapse.
  if (!expandedParentKey.value) return

  const expandedGroup = navGroups.value.find((group) => group.title === expandedParentKey.value)
  if (!expandedGroup || !isModuleActive(expandedGroup)) {
    expandedParentKey.value = null
    expandedSubKey.value = null
  }
}

watch(
  () => [route.path, resolvedAccountId.value] as const,
  syncExpansionWithRoute,
  { immediate: true },
)
</script>

<template>
  <v-navigation-drawer
    v-model="localDrawer"
    :rail="localRail"
    :rail-width="64"
    permanent
    :mobile-breakpoint="0"
    width="248"
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
            @click.stop="localRail = !localRail"
          >
            <v-icon size="14">{{ localRail ? 'chevron-right' : 'chevron-left' }}</v-icon>
          </button>
        </template>
      </v-tooltip>
    </div>

    <!-- Navigation List -->
    <v-list density="compact" nav class="px-2 py-1 sidebar-scroll">
      <template v-for="group in navGroups" :key="group.title">
        <template v-if="isAppsGroup(group) && !localRail">
          <v-list-item
            :to="group.singleRoute"
            @click="group.singleRoute && goTo(group.singleRoute)"
            :prepend-icon="group.icon"
            :title="group.title"
            :value="group.title"
            rounded="lg"
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

        <v-list-item
          v-else-if="group.items.length === 0"
          :to="group.singleRoute"
          @click="group.singleRoute && goTo(group.singleRoute)"
          :prepend-icon="group.icon"
          :title="!localRail ? group.title : ''"
          :value="group.title"
          rounded="lg"
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
              <template v-slot:activator="{ props: tipProps }">
                <v-icon v-bind="tipProps" size="14" class="ml-2 sidebar-lock">lock</v-icon>
              </template>
            </v-tooltip>
          </template>
        </v-list-item>

        <div
          v-else-if="!localRail"
          class="sidebar-parent"
          :class="{ 'sidebar-parent--active': isModuleActive(group) }"
        >
          <v-menu
            location="end"
            open-on-hover
            :open-delay="0"
            :close-delay="120"
            offset="8"
            :close-on-content-click="false"
            @update:model-value="(v: boolean) => { if (!v) railHoveredSubGroup = null }"
          >
            <template #activator="{ props: menuProps, isActive: menuOpen }">
              <div class="sidebar-parent-row" v-bind="menuProps">
                <v-list-item
                  :to="group.singleRoute"
                  @click="group.singleRoute && goTo(group.singleRoute)"
                  :prepend-icon="group.icon"
                  :title="group.title"
                  rounded="lg"
                  class="sidebar-text sidebar-parent-row__label"
                  :class="{
                    'sidebar-parent-row__label--expanded': isParentExpanded(group),
                    'rail-icon-hovered': menuOpen,
                  }"
                >
                  <template #append>
                    <v-tooltip v-if="isLocked(group)" location="end" text="Upgrade to unlock">
                      <template #activator="{ props: tipProps }">
                        <v-icon v-bind="tipProps" size="14" class="ml-2 sidebar-lock">lock</v-icon>
                      </template>
                    </v-tooltip>
                  </template>
                </v-list-item>

                <button
                  type="button"
                  class="sidebar-parent-row__chevron"
                  :class="{ 'sidebar-parent-row__chevron--expanded': isParentExpanded(group) }"
                  :aria-expanded="isParentExpanded(group)"
                  :aria-label="`${isParentExpanded(group) ? 'Collapse' : 'Expand'} ${group.title}`"
                  @click.stop.prevent="toggleParent(group)"
                  @keydown.enter.stop.prevent="toggleParent(group)"
                  @keydown.space.stop.prevent="toggleParent(group)"
                >
                  <v-icon size="14">chevron-right</v-icon>
                </button>
              </div>
            </template>

            <!-- Hover flyout — single card (no sub-groups) -->
            <div v-if="!hasSubGroups(group)" class="rail-flyout-card">
              <div
                v-for="item in group.items"
                :key="item.title"
                class="rail-flyout-item"
                :class="{ 'rail-flyout-item--active': ('route' in item) && route.path.startsWith((item as NavItem).route) }"
                @click="('route' in item) && goTo((item as NavItem).route)"
              >{{ ('route' in item) ? (item as NavItem).title : '' }}</div>
            </div>

            <!-- Hover flyout — cascade (groups with sub-groups) -->
            <div v-else class="rail-cascade-wrap">
              <div class="rail-flyout-card">
                <div
                  v-for="flat in railFlatItems(group)"
                  :key="flat.title"
                  class="rail-flyout-item"
                  :class="{ 'rail-flyout-item--active': route.path.startsWith(flat.route) }"
                  @click="goTo(flat.route)"
                >{{ flat.title }}</div>
                <div
                  v-for="sub in railSubGroups(group)"
                  :key="sub.title"
                  class="rail-flyout-item rail-flyout-item--has-sub"
                  :class="{ 'rail-flyout-item--active': railHoveredSubGroup === sub.title }"
                  @mouseenter="railHoveredSubGroup = sub.title"
                >
                  <span>{{ sub.title }}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>
                </div>
              </div>
              <div v-if="railHoveredSubGroup && activeRailSubGroupItems(group).length" class="rail-flyout-card">
                <div class="rail-flyout-card__header">{{ railHoveredSubGroup }}</div>
                <div
                  v-for="child in activeRailSubGroupItems(group)"
                  :key="child.title"
                  class="rail-flyout-item"
                  :class="{ 'rail-flyout-item--active': route.path.startsWith(child.route) }"
                  @click="goTo(child.route)"
                >{{ child.title }}</div>
              </div>
            </div>
          </v-menu>

          <v-expand-transition>
            <div v-show="isParentExpanded(group)" class="sidebar-parent__children">
              <template v-for="item in group.items" :key="item.title">
                <div
                  v-if="isSubGroup(item)"
                  class="sidebar-tree-branch"
                  :class="{
                    'sidebar-tree-branch--active': isSubGroupActive(group, item),
                    'sidebar-tree-branch--expanded': isSubGroupExpanded(group, item),
                  }"
                >
                  <button
                    type="button"
                    class="sidebar-subgroup-row"
                    :aria-expanded="isSubGroupExpanded(group, item)"
                    @click="toggleSubGroup(group, item)"
                  >
                    <span class="sidebar-subgroup-row__title">{{ item.title }}</span>
                    <v-icon size="15">{{ isSubGroupExpanded(group, item) ? 'chevron-up' : 'chevron-down' }}</v-icon>
                  </button>

                  <v-expand-transition>
                    <div v-show="isSubGroupExpanded(group, item)" class="sidebar-subgroup__children">
                      <div
                        v-for="subItem in item.items"
                        :key="subItem.title"
                        class="sidebar-tree-row sidebar-tree-row--grandchild"
                        :class="{ 'sidebar-tree-row--active': isItemActive(group, subItem) }"
                      >
                        <v-list-item
                          :title="subItem.title"
                          :to="subItem.route"
                          :active="isItemActive(group, subItem)"
                          @click="keepParentExpanded(group, item)"
                          class="sidebar-text sidebar-grandchild-item sidebar-tree-link"
                          rounded="lg"
                          exact
                        />
                      </div>
                    </div>
                  </v-expand-transition>
                </div>

                <div
                  v-else
                  class="sidebar-tree-row sidebar-tree-row--child"
                  :class="{ 'sidebar-tree-row--active': isItemActive(group, item) }"
                >
                  <v-list-item
                    :title="item.title"
                    :to="item.route"
                    :active="isItemActive(group, item)"
                    @click="keepParentExpanded(group)"
                    class="sidebar-text sidebar-child-item sidebar-tree-link"
                    rounded="lg"
                    exact
                  />
                </div>
              </template>
            </div>
          </v-expand-transition>
        </div>

        <v-menu v-else location="end" open-on-hover :open-delay="0" :close-delay="120" offset="8" :close-on-content-click="false" @update:model-value="(v: boolean) => { if (!v) railHoveredSubGroup = null }">
          <template #activator="{ props: menuProps, isActive: menuOpen }">
            <v-list-item
              v-bind="menuProps"
              :prepend-icon="group.icon"
              :title="''"
              :value="group.title"
              rounded="lg"
              class="sidebar-text mb-1"
              :class="{ 'rail-icon-hovered': menuOpen }"
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
            >{{ ('route' in item) ? item.title : '' }}</div>
          </div>

          <!-- Two separate flyout cards (cascade — groups with sub-groups) -->
          <div v-else class="rail-cascade-wrap">
            <!-- Card 1: group children & subgroup headers -->
            <div class="rail-flyout-card">
              <div class="rail-flyout-card__header">{{ group.title }}</div>
              <div
                v-for="flat in railFlatItems(group)"
                :key="flat.title"
                class="rail-flyout-item"
                :class="{ 'rail-flyout-item--active': route.path.startsWith(flat.route) }"
                @click="goTo(flat.route)"
              >{{ flat.title }}</div>
              <div
                v-for="sub in railSubGroups(group)"
                :key="sub.title"
                class="rail-flyout-item rail-flyout-item--has-sub"
                :class="{ 'rail-flyout-item--active': railHoveredSubGroup === sub.title }"
                @mouseenter="railHoveredSubGroup = sub.title"
              >
                <span>{{ sub.title }}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>
              </div>
            </div>
            <!-- Card 2: grandchildren of the hovered subgroup -->
            <div v-if="railHoveredSubGroup && activeRailSubGroupItems(group).length" class="rail-flyout-card">
              <div class="rail-flyout-card__header">{{ railHoveredSubGroup }}</div>
              <div
                v-for="child in activeRailSubGroupItems(group)"
                :key="child.title"
                class="rail-flyout-item"
                :class="{ 'rail-flyout-item--active': route.path.startsWith(child.route) }"
                @click="goTo(child.route)"
              >{{ child.title }}</div>
            </div>
          </div>
        </v-menu>

        <v-divider v-if="group.dividerAfter" class="sidebar-divider my-1 mx-2" />
      </template>
    </v-list>

    <!-- Bottom: Controls -->
    <template v-slot:append>
      <!-- Expanded mode -->
      <div v-if="!localRail" class="sidebar-controls">
        <!-- Dark sidebar toggle -->
        <div class="sidebar-controls__row">
          <v-icon size="16" class="sidebar-controls__icon">moon</v-icon>
          <span class="sidebar-controls__label">Dark sidebar</span>
          <v-switch
            :model-value="darkSidebar"
            @update:model-value="setDarkSidebar($event as boolean)"
            density="compact"
            hide-details
            color="primary"
            class="sidebar-controls__switch"
          />
        </div>

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
        <v-tooltip location="end" :text="darkSidebar ? 'Light sidebar' : 'Dark sidebar'">
          <template #activator="{ props: tipProps }">
            <button
              v-bind="tipProps"
              type="button"
              class="sidebar-rail-btn"
              @click="setDarkSidebar(!darkSidebar)"
            >
              <v-icon size="18">{{ darkSidebar ? 'sun' : 'moon' }}</v-icon>
            </button>
          </template>
        </v-tooltip>

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
  --sidebar-radius: 12px;
  --sidebar-radius-sm: 10px;
  --sidebar-transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
  background: var(--sidebar-bg) !important;
  border-right: 1px solid var(--sidebar-border) !important;
  color: var(--sidebar-text);
}

.mp-sidebar :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
  overflow: visible;
}

.sidebar-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 14px 14px 14px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--sidebar-border);
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
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 1.1px;
  text-transform: uppercase;
  color: var(--sidebar-text);
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
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 14px 12px;
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

/* ─── Expanded sidebar tree: parent, level-2, level-3 ─── */
.sidebar-parent {
  margin-bottom: 1px;
}

.sidebar-parent-row {
  position: relative;
  display: flex;
  align-items: center;
}

.sidebar-parent-row__label {
  flex: 1;
  min-width: 0;
  padding-right: 36px !important;
  cursor: pointer;
}

.sidebar-parent-row__chevron {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--sidebar-radius-sm);
  color: var(--sidebar-muted);
  cursor: pointer;
  z-index: 2;
  padding: 0;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 120ms ease,
    transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
    background 120ms ease,
    color 120ms ease;
}

.sidebar-parent-row:hover .sidebar-parent-row__chevron,
.sidebar-parent-row:focus-within .sidebar-parent-row__chevron,
.sidebar-parent-row__chevron:focus-visible,
.sidebar-parent-row__chevron--expanded {
  opacity: 1;
  pointer-events: auto;
}

.sidebar-parent-row__chevron--expanded {
  transform: translateY(-50%) rotate(90deg);
}

.sidebar-parent-row__chevron:hover {
  background: var(--sidebar-hover-bg);
  color: var(--sidebar-active-text);
}

.sidebar-parent-row__chevron:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--sidebar-focus-ring);
}

.sidebar-parent--active .sidebar-parent-row__label {
  background: var(--sidebar-active-bg) !important;
  color: var(--sidebar-active-text) !important;
  font-weight: 600;
}

.sidebar-parent--active .sidebar-parent-row__label :deep(.v-list-item__overlay) {
  opacity: 0 !important;
}

.sidebar-parent--active .sidebar-parent-row__label :deep(.v-list-item__prepend > .v-icon),
.sidebar-parent--active .sidebar-parent-row__label :deep(.v-list-item-title) {
  color: var(--sidebar-active-text) !important;
}

.sidebar-parent--active .sidebar-parent-row__label :deep(.v-list-item-title) {
  font-weight: 600;
}

.sidebar-parent--active .sidebar-parent-row__chevron {
  color: var(--sidebar-muted);
}

.sidebar-parent__children {
  position: relative;
  margin: 3px 0 8px 18px;
  padding-left: 16px;
}

.sidebar-parent__children::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 1px;
  bottom: 12px;
  width: 1px;
  background: var(--sidebar-line);
}

.sidebar-tree-row,
.sidebar-tree-branch {
  position: relative;
}

.sidebar-tree-row {
  --sidebar-elbow-left: -10px;
  --sidebar-elbow-width: 10px;
}

.sidebar-tree-row::before {
  content: '';
  position: absolute;
  left: var(--sidebar-elbow-left);
  top: 0;
  width: var(--sidebar-elbow-width);
  height: 17px;
  border-left: 1px solid var(--sidebar-line);
  border-bottom: 1px solid var(--sidebar-line);
  border-bottom-left-radius: 8px;
  background: transparent;
  opacity: 0;
  z-index: 0;
  transition: opacity 120ms ease, border-color 120ms ease;
}

.sidebar-tree-row--active::before {
  opacity: 1;
}

.sidebar-subgroup-row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: 34px;
  margin: 1px 0;
  padding: 8px 9px;
  border: 0;
  border-radius: var(--sidebar-radius);
  appearance: none;
  background: transparent;
  color: var(--sidebar-text);
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: var(--sidebar-transition);
}

.sidebar-subgroup-row:hover {
  background: var(--sidebar-hover-bg);
}

.sidebar-subgroup-row:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--sidebar-focus-ring);
}

.sidebar-subgroup-row__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-subgroup-row .v-icon {
  flex: none;
  color: var(--sidebar-muted) !important;
}

.sidebar-tree-branch--active > .sidebar-subgroup-row,
.sidebar-tree-branch--expanded > .sidebar-subgroup-row {
  color: var(--sidebar-active-text);
  font-weight: 600;
}

.sidebar-tree-branch--active > .sidebar-subgroup-row .sidebar-subgroup-row__title,
.sidebar-tree-branch--expanded > .sidebar-subgroup-row .sidebar-subgroup-row__title {
  font-weight: 600;
}

.sidebar-tree-branch--active > .sidebar-subgroup-row .v-icon,
.sidebar-tree-branch--expanded > .sidebar-subgroup-row .v-icon {
  color: var(--sidebar-active-text) !important;
}

.sidebar-subgroup__children {
  position: relative;
  margin-left: 22px;
  padding-left: 14px;
}

.sidebar-subgroup__children::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 10px;
  width: 1px;
  background: var(--sidebar-line);
}

.sidebar-tree-row--grandchild::before {
  --sidebar-elbow-left: -14px;
  --sidebar-elbow-width: 14px;
}

.sidebar-tree-link {
  position: relative;
  z-index: 1;
  min-height: 34px !important;
  border-radius: var(--sidebar-radius) !important;
  overflow: visible !important;
}

.sidebar-tree-link :deep(.v-list-item__overlay) {
  opacity: 0 !important;
}

.sidebar-child-item {
  --indent-padding: 0;
}

.sidebar-grandchild-item {
  --indent-padding: 0;
}

.sidebar-tree-row--grandchild .sidebar-tree-link :deep(.v-list-item-title) {
  color: var(--sidebar-muted);
  font-size: 13.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-tree-row--active .sidebar-tree-link {
  background: var(--sidebar-active-bg) !important;
  color: var(--sidebar-active-text) !important;
  font-weight: 600;
}

.sidebar-tree-row--active .sidebar-tree-link :deep(.v-list-item-title) {
  color: var(--sidebar-active-text) !important;
  font-weight: 600;
}

.mp-sidebar :deep(.sidebar-child-item.v-list-item--active) {
  background: var(--sidebar-active-bg) !important;
  color: var(--sidebar-active-text) !important;
  font-weight: 600;
}

.mp-sidebar :deep(.sidebar-child-item.v-list-item--active .v-list-item-title) {
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
  min-height: 36px;
  margin-bottom: 1px;
  padding: 9px 10px;
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

.mp-sidebar :deep(.v-list-item__prepend > .v-icon) {
  font-size: 18px;
  margin-inline-end: 10px;
}

.mp-sidebar :deep(.v-list-item:hover > .v-list-item__overlay) {
  opacity: 0 !important;
}

.mp-sidebar :deep(.sidebar-child-item) {
  min-height: 32px !important;
  border-radius: var(--sidebar-radius) !important;
}

.mp-sidebar :deep(.sidebar-child-item .v-list-item-title) {
  font-size: 13.5px;
  font-weight: 500;
}

.mp-sidebar :deep(.sidebar-grandchild-item) {
  min-height: 32px !important;
  border-radius: var(--sidebar-radius) !important;
}

.mp-sidebar :deep(.sidebar-grandchild-item .v-list-item-title) {
  font-size: 13.5px;
  color: var(--sidebar-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mp-sidebar :deep(.sidebar-grandchild-item.v-list-item--active) {
  background: var(--sidebar-active-bg) !important;
}

.mp-sidebar :deep(.sidebar-grandchild-item.v-list-item--active .v-list-item-title) {
  color: var(--sidebar-active-text) !important;
  font-weight: 600;
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
  max-height: min(70vh, 420px);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.rail-flyout-card__header {
  position: sticky;
  top: 0;
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

/* Rail cascade — two cards side by side */
.rail-cascade-wrap {
  display: flex;
  gap: 4px;
  align-items: flex-start;
}
</style>
