<script setup lang="ts">
import { computed, ref, watch, nextTick, mergeProps } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountsStore } from '@/stores/useAccounts'
import { useCopilotStore } from '@/stores/useCopilot'
import { useUserProfile } from '@/stores/useUserProfile'
import { useAppTheme, type ThemeMode } from '@/composables/useAppTheme'
import { useMobileNav } from '@/composables/useMobileNav'
import { useToast } from '@/composables/useToast'
import DvOrbitOrb from '@/components/copilot/voice/DvOrbitOrb.vue'
import PlgTrialChip from '@/components/plg/PlgTrialChip.vue'
import { usePlgStore, PLG_DEMO_PRESETS, type PlgDemoPreset } from '@/stores/usePlg'

const copilot = useCopilotStore()
const mobileNav = useMobileNav()
const mobileSearchOpen = ref(false)
const toast = useToast()

const router = useRouter()
const accountsStore = useAccountsStore()
const { mode, setMode } = useAppTheme()

const themeToggleValue = computed({
  get: () => mode.value,
  set: (value: ThemeMode) => setMode(value),
})

const assistantPillHover = ref(false)
const notificationCount = ref(18)
const userName = ref('Ross Andrew Paquette')
const userInitials = ref('RP')
const userEmail = ref('Ross@maropost.com')
const userRole = ref('Super Admin')
const profileStore = useUserProfile()
const userAvatarUrl = computed(() => profileStore.avatarUrl)
const searchOpen = ref(false)
const searchQuery = ref('')

const currentAccountId = computed(() => accountsStore.activeId)
const settingsRoute = computed(() => ({ name: 'Settings' as const, params: { accountId: currentAccountId.value } }))
const billingRoute = computed(() => ({ name: 'Billing' as const, params: { accountId: currentAccountId.value } }))
const profileRoute = computed(() => ({ name: 'SettingsGeneral' as const, params: { accountId: currentAccountId.value } }))
const appsRoute = computed(() => ({ name: 'AppStore' as const, params: { accountId: currentAccountId.value } }))

const accounts = computed(() => accountsStore.accounts)
const activeAccountId = computed(() => accountsStore.activeId)

const accountSearch = ref('')
const sortedFilteredAccounts = computed(() => {
  const sorted = [...accounts.value].sort((a, b) => a.name.localeCompare(b.name))
  const query = accountSearch.value.trim().toLowerCase()
  if (!query) return sorted
  return sorted.filter((a) => a.name.toLowerCase().includes(query))
})

const activeAccount = computed(() => accountsStore.activeAccount)

const AVATAR_PALETTE = [
  'primary', 'secondary', 'info', 'success', 'warning', 'error',
] as const

function accountColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length] ?? 'primary'
}

const userMenuOpen = ref(false)
const switchAccountOpen = ref(false)

function closeUserMenu() {
  userMenuOpen.value = false
  switchAccountOpen.value = false
  accountSearch.value = ''
}

watch(userMenuOpen, (open) => {
  if (!open) {
    switchAccountOpen.value = false
    accountSearch.value = ''
  }
})

function switchAccount(id: string) {
  accountsStore.switchTo(id)
  closeUserMenu()
  // Reflect the chosen account in the URL so it stays the source of truth for
  // gating; keep the current page, swapping only the accountId.
  const current = router.currentRoute.value
  if (current.name && current.params.accountId && current.params.accountId !== id) {
    router
      .push({ name: current.name, params: { ...current.params, accountId: id }, query: current.query })
      .catch(() => router.push({ name: 'DaVinciAI', params: { accountId: id } }))
  }
}

const searchSources = computed(() => [
  { group: 'Dashboards', icon: 'layout-dashboard', title: 'Marketing Dashboard', subtitle: 'Performance, revenue, and audience widgets', route: { name: 'Dashboard' as const, params: { accountId: currentAccountId.value } } },
  { group: 'Dashboards', icon: 'layout-list', title: 'Manage dashboards', subtitle: 'Create, edit, and assign dashboards', route: { name: 'DashboardsList' as const, params: { accountId: currentAccountId.value } } },
  { group: 'Commerce', icon: 'shopping-cart', title: 'Sales orders', subtitle: 'Find orders, payments, and fulfillment status', route: { name: 'SalesOrders' as const, params: { accountId: currentAccountId.value } } },
  { group: 'Marketing', icon: 'mail', title: 'Email campaigns', subtitle: 'Search campaigns, tags, folders, and sends', route: { name: 'EmailCampaigns' as const, params: { accountId: currentAccountId.value } } },
  { group: 'Contacts', icon: 'users', title: 'Contacts', subtitle: 'Profiles, lists, segments, and fields', route: { name: 'AllContacts' as const, params: { accountId: currentAccountId.value } } },
  { group: 'AI', icon: 'sparkles', title: 'Da Vinci insights', subtitle: 'Ask for automations, insights, and widget ideas', route: { name: 'DaVinciDashboard' as const, params: { accountId: currentAccountId.value } } },
  { group: 'Apps', icon: 'puzzle', title: 'Installed apps', subtitle: 'Connectors available for this customer', route: appsRoute.value },
  { group: 'Admin', icon: 'settings', title: 'Settings', subtitle: 'Company, billing, users, and permissions', route: settingsRoute.value },
])

const filteredSearchGroups = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const results = query
    ? searchSources.value.filter((item) =>
      item.title.toLowerCase().includes(query)
      || item.subtitle.toLowerCase().includes(query)
      || item.group.toLowerCase().includes(query),
    )
    : searchSources.value.slice(0, 6)

  return Object.entries(
    results.reduce<Record<string, typeof results>>((groups, item) => {
      groups[item.group] = [...(groups[item.group] ?? []), item]
      return groups
    }, {}),
  )
})

function showAppbarNotice(message: string) {
  toast.info(message)
}

function navigateToRoute(routeLocation: object) {
  searchOpen.value = false
  mobileSearchOpen.value = false
  router.push(routeLocation)
}

function askDaVinciFromSearch() {
  searchOpen.value = false
  mobileSearchOpen.value = false
  copilot.open()
}

const assistantMenuOpen = ref(false)

function openCopilot() {
  assistantMenuOpen.value = false
  copilot.open()
}

function openAiExperience() {
  assistantMenuOpen.value = false
  router.push({ name: 'DaVinciExperience', params: { accountId: currentAccountId.value } })
}

function openStub(label: string) {
  showAppbarNotice(`${label} is represented as a prototype action.`)
}

// PLG demo state switcher — stakeholder-facing demo control, not product UI.
const plgStore = usePlgStore()
const plgPresetItems = PLG_DEMO_PRESETS
const plgPresetValue = ref<PlgDemoPreset | null>(null)
watch(plgPresetValue, (preset) => {
  if (!preset) return
  plgStore.applyDemoPreset(preset)
  const label = PLG_DEMO_PRESETS.find(p => p.key === preset)?.label ?? preset
  showAppbarNotice(`PLG demo state applied: ${label}`)
})
// The preset selection is per-account; clear the control on account switch.
watch(() => accountsStore.activeId, () => {
  plgPresetValue.value = null
})
function resetPlgState() {
  plgStore.resetAccount()
  plgPresetValue.value = null
  showAppbarNotice('PLG demo state reset for this account.')
}

const createOpen = ref(false)

type CreateItem = {
  key: string
  icon: string
  title: string
  sub: string
  kbd: string
  action: () => void
}

const createItems = computed<CreateItem[]>(() => [
  {
    key: 'dashboard',
    icon: 'layout-dashboard',
    title: 'Dashboard',
    sub: 'Name it and start adding widgets',
    kbd: 'D',
    action: () => router.push({ name: 'DashboardsList', params: { accountId: currentAccountId.value } }),
  },
  {
    key: 'campaign',
    icon: 'mail',
    title: 'Email campaign',
    sub: 'One-off or A/B broadcast',
    kbd: 'E',
    action: () => router.push({ name: 'EmailCampaigns', params: { accountId: currentAccountId.value } }),
  },
  {
    key: 'segment',
    icon: 'user-round',
    title: 'Segment',
    sub: 'Build from CDP traits',
    kbd: 'S',
    action: () => router.push({ name: 'Segments', params: { accountId: currentAccountId.value } }),
  },
  {
    key: 'automation',
    icon: 'git-branch',
    title: 'Automation',
    sub: 'Multi-step journey',
    kbd: 'A',
    action: () => router.push({ name: 'Journeys', params: { accountId: currentAccountId.value } }),
  },
  {
    key: 'list',
    icon: 'list-checks',
    title: 'Contact list',
    sub: 'Upload or filter',
    kbd: 'L',
    action: () => router.push({ name: 'ContactLists', params: { accountId: currentAccountId.value } }),
  },
])

function runCreateItem(item: CreateItem) {
  createOpen.value = false
  item.action()
}

function handleCreateMenuKeydown(event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey || event.altKey) return
  const target = event.target as HTMLElement | null
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
  const key = event.key.toLowerCase()
  const match = createItems.value.find((item) => item.kbd.toLowerCase() === key)
  if (!match) return
  event.preventDefault()
  runCreateItem(match)
}

// ── Command palette (universal search) ──────────────────────────────
// A keyboard-driven command menu: an AI "Ask" action always leads, then
// quick create actions + jump-to nav at rest, or filtered results while
// typing. Rendered as one flat, arrow-navigable list with section labels.
type PaletteItem = {
  id: string
  kind: 'ask' | 'action' | 'nav'
  sectionLabel: string
  icon: string
  title: string
  subtitle?: string
  run: () => void
}

// Type tabs narrow results without retyping — "All" plus one tab per
// searchSources category, in first-seen order.
const paletteTypeTabs = computed<string[]>(() => {
  const seen = new Set<string>()
  const groups: string[] = []
  searchSources.value.forEach((s) => {
    if (!seen.has(s.group)) { seen.add(s.group); groups.push(s.group) }
  })
  return ['All', ...groups]
})
const activePaletteType = ref('All')

const paletteItems = computed<PaletteItem[]>(() => {
  const raw = searchQuery.value.trim()
  const q = raw.toLowerCase()
  const typeTab = activePaletteType.value
  const navItem = (s: (typeof searchSources.value)[number], label: string): PaletteItem => ({
    id: `nav-${s.title}`, kind: 'nav', sectionLabel: label, icon: s.icon,
    title: s.title, subtitle: s.subtitle, run: () => navigateToRoute(s.route),
  })
  const actionItem = (c: CreateItem, label: string): PaletteItem => ({
    id: `action-${c.key}`, kind: 'action', sectionLabel: label, icon: c.icon,
    title: `Create ${c.title.toLowerCase()}`, subtitle: c.sub,
    run: () => { searchOpen.value = false; c.action() },
  })

  const items: PaletteItem[] = [{
    id: 'ask',
    kind: 'ask',
    sectionLabel: '',
    icon: 'sparkles',
    title: raw ? `Ask Da Vinci about “${raw}”` : 'Ask Da Vinci anything',
    subtitle: raw
      ? 'Get an instant answer, automation, or insight'
      : 'Insights, automations, and answers across this workspace',
    run: askDaVinciFromSearch,
  }]

  // Quick-create actions aren't a searchSources category, so they only show
  // on "All" — a specific type tab narrows to just that category's results.
  const sources = typeTab === 'All' ? searchSources.value : searchSources.value.filter(s => s.group === typeTab)

  if (!q) {
    if (typeTab === 'All') createItems.value.forEach(c => items.push(actionItem(c, 'Quick actions')))
    sources.forEach(s => items.push(navItem(s, 'Suggested')))
  } else {
    sources
      .filter(s => s.title.toLowerCase().includes(q) || s.subtitle.toLowerCase().includes(q) || s.group.toLowerCase().includes(q))
      .forEach(s => items.push(navItem(s, 'Results')))
    if (typeTab === 'All') {
      createItems.value
        .filter(c => c.title.toLowerCase().includes(q) || c.sub.toLowerCase().includes(q))
        .forEach(c => items.push(actionItem(c, 'Actions')))
    }
  }
  return items
})

const activeIndex = ref(0)

// Land on the first real result when a query is present (type → Enter goes
// there); otherwise highlight the Ask row so Enter asks Da Vinci.
function resetActiveIndex() {
  const firstResult = paletteItems.value.findIndex(i => i.kind !== 'ask')
  activeIndex.value = searchQuery.value.trim() && firstResult !== -1 ? firstResult : 0
}
watch(searchQuery, resetActiveIndex)
watch(activePaletteType, resetActiveIndex)
watch(searchOpen, (open) => {
  if (open) resetActiveIndex()
  else activePaletteType.value = 'All'
})

function moveActive(delta: number) {
  const n = paletteItems.value.length
  if (!n) return
  activeIndex.value = (activeIndex.value + delta + n) % n
  nextTick(() => {
    document.getElementById(`palette-opt-${activeIndex.value}`)?.scrollIntoView({ block: 'nearest' })
  })
}

function onSearchKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowDown': event.preventDefault(); searchOpen.value = true; moveActive(1); break
    case 'ArrowUp': event.preventDefault(); moveActive(-1); break
    case 'Enter': {
      event.preventDefault()
      paletteItems.value[activeIndex.value]?.run()
      break
    }
    case 'Escape': searchOpen.value = false; break
  }
}

</script>

<template>
  <v-app-bar height="56" color="surface" flat class="mp-appbar">
    <div class="mp-appbar-shell w-100 d-flex align-center px-4 gap-2">
      <div class="appbar-search-group">
        <button
          type="button"
          class="appbar-hamburger-btn"
          aria-label="Open navigation menu"
          @click="mobileNav.toggle()"
        >
          <v-icon size="20">menu</v-icon>
        </button>

        <v-menu v-model="searchOpen" location="bottom start" offset="8" :close-on-content-click="false">
          <template #activator="{ props }">
            <!-- App-shell search, not a form field: the pill is label-free by
                 design (see .appbar-search) and suppresses details so the app bar
                 row height can never shift. -->
            <v-text-field
              v-bind="props"
              v-model="searchQuery"
              hide-details
              prepend-inner-icon="search"
              placeholder="Find or Ask"
              aria-label="Universal AI search"
              class="appbar-search appbar-search--inline"
              bg-color="surface"
              clearable
              role="combobox"
              aria-controls="cmd-palette-list"
              :aria-expanded="searchOpen"
              :aria-activedescendant="searchOpen ? `palette-opt-${activeIndex}` : undefined"
              @focus="searchOpen = true"
              @keydown="onSearchKeydown"
            >
              <template #append-inner>
                <kbd class="appbar-search-cmd">⌘K</kbd>
              </template>
            </v-text-field>
          </template>
          <v-card width="640" max-width="calc(100vw - 32px)" rounded="lg" flat border class="cmd-palette">
            <div v-if="paletteTypeTabs.length > 1" class="cmd-palette__tabs" role="group" aria-label="Filter results by type">
              <button
                v-for="tab in paletteTypeTabs"
                :key="tab"
                type="button"
                class="cmd-palette__tab"
                :class="{ 'cmd-palette__tab--active': tab === activePaletteType }"
                :aria-pressed="tab === activePaletteType"
                @mousedown.prevent
                @click="activePaletteType = tab"
              >{{ tab }}</button>
            </div>
            <ul id="cmd-palette-list" class="cmd-palette__list" role="listbox" aria-label="Search results and actions">
              <template v-for="(item, i) in paletteItems" :key="item.id">
                <li
                  v-if="item.sectionLabel && item.sectionLabel !== paletteItems[i - 1]?.sectionLabel"
                  class="cmd-palette__section-label"
                  role="presentation"
                >
                  {{ item.sectionLabel }}
                </li>
                <li role="presentation">
                  <button
                    :id="`palette-opt-${i}`"
                    type="button"
                    role="option"
                    :aria-selected="i === activeIndex"
                    class="cmd-row"
                    :class="{ 'cmd-row--active': i === activeIndex, 'cmd-row--ask': item.kind === 'ask' }"
                    @click="item.run()"
                    @mouseenter="activeIndex = i"
                  >
                    <span class="cmd-row__icon" :class="{ 'cmd-row__icon--ask': item.kind === 'ask' }">
                      <v-icon size="17">{{ item.icon }}</v-icon>
                    </span>
                    <span class="cmd-row__body">
                      <span class="cmd-row__title">{{ item.title }}</span>
                      <span v-if="item.subtitle" class="cmd-row__sub">{{ item.subtitle }}</span>
                    </span>
                    <kbd v-if="i === activeIndex" class="cmd-row__enter">↵</kbd>
                    <v-icon v-else-if="item.kind === 'nav'" size="15" class="cmd-row__chev">arrow-right</v-icon>
                  </button>
                </li>
              </template>
            </ul>
            <div class="cmd-palette__footer">
              <span class="cmd-hint"><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
              <span class="cmd-hint"><kbd>↵</kbd> Open</span>
              <span class="cmd-hint"><kbd>esc</kbd> Close</span>
              <span class="cmd-palette__brand"><v-icon size="13" color="secondary">sparkles</v-icon> Da Vinci</span>
            </div>
          </v-card>
        </v-menu>

        <button
          type="button"
          class="appbar-mobile-search-btn"
          aria-label="Search"
          @click="mobileSearchOpen = true"
        >
          <v-icon size="20">search</v-icon>
        </button>
      </div>

      <v-spacer />

      <div class="appbar-utilities">
        <PlgTrialChip />
        <v-menu v-model="createOpen" location="bottom end" offset="8" :close-on-content-click="false">
          <template #activator="{ props: menuProps }">
            <v-tooltip text="Quick create" location="bottom">
              <template #activator="{ props: tooltipProps }">
                <button
                  v-bind="mergeProps(menuProps, tooltipProps)"
                  type="button"
                  class="appbar-create-btn"
                  :class="{ 'appbar-create-btn--open': createOpen }"
                  aria-label="Quick create"
                  aria-haspopup="menu"
                  :aria-expanded="createOpen"
                >
                  <v-icon size="18">plus</v-icon>
                </button>
              </template>
            </v-tooltip>
          </template>
          <v-card
            width="340"
            rounded="lg"
            flat
            border
            class="appbar-create-menu"
            tabindex="-1"
            @keydown="handleCreateMenuKeydown"
          >
            <div class="appbar-create-menu__label">Create new</div>
            <div class="appbar-create-menu__list">
              <button
                v-for="item in createItems"
                :key="item.key"
                type="button"
                class="appbar-create-row"
                @click="runCreateItem(item)"
              >
                <v-icon size="20" class="appbar-create-row__icon">{{ item.icon }}</v-icon>
                <span class="appbar-create-row__body min-width-0">
                  <strong>{{ item.title }}</strong>
                  <small>{{ item.sub }}</small>
                </span>
                <kbd class="appbar-create-kbd">{{ item.kbd }}</kbd>
              </button>
            </div>
          </v-card>
        </v-menu>

        <v-tooltip text="Notifications" location="bottom">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              variant="text"
              icon
              class="appbar-action-btn position-relative"
              :aria-label="notificationCount > 0 ? `Notifications, ${notificationCount} unread` : 'Notifications'"
            >
              <v-icon>bell</v-icon>
              <v-badge v-if="notificationCount > 0" :content="notificationCount" color="error" floating class="notification-badge" />
            </v-btn>
          </template>
        </v-tooltip>

        <v-tooltip text="Settings" location="bottom">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon variant="text" class="appbar-action-btn" aria-label="Settings" :to="settingsRoute">
              <v-icon>settings</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </div>

      <v-menu v-model="assistantMenuOpen" location="bottom end" offset="8" :close-on-content-click="false">
        <template #activator="{ props }">
          <button
            v-bind="props"
            type="button"
            class="assistant-pill"
            aria-label="AI Assistant"
            @mouseenter="assistantPillHover = true"
            @mouseleave="assistantPillHover = false"
          >
            <DvOrbitOrb :size="20" :speed="3" :inverse="assistantPillHover" />
            <span class="assistant-pill__label">Da Vinci</span>
            <v-icon size="14" class="assistant-pill__chevron">chevron-down</v-icon>
          </button>
        </template>

        <div class="assistant-menu-card">
          <div class="um-section um-section--last">
            <button type="button" class="um-item" @click="openCopilot">
              <v-icon class="um-item__icon" size="20">bot-message-square</v-icon>
              <div class="um-item__body">
                <div class="um-item__title">Co-pilot</div>
                <div class="um-item__sub">Chat with Da Vinci in a side drawer</div>
              </div>
            </button>
            <button type="button" class="um-item" @click="openAiExperience">
              <v-icon class="um-item__icon" size="20">audio-lines</v-icon>
              <div class="um-item__body">
                <div class="um-item__title">AI experience</div>
                <div class="um-item__sub">Talk to Da Vinci in the AI-first workspace</div>
              </div>
            </button>
          </div>
        </div>
      </v-menu>

      <span class="appbar-divider" aria-hidden="true"></span>

      <v-menu v-model="userMenuOpen" location="bottom end" offset="8" :close-on-content-click="false">
        <template #activator="{ props }">
          <button
            v-bind="props"
            type="button"
            aria-label="Open user menu"
            class="user-pill"
          >
            <v-avatar size="26" class="user-pill__avatar">
              <v-img :src="userAvatarUrl" :alt="userName" cover>
                <template #placeholder>
                  <div class="user-avatar-fallback user-avatar-fallback--sm">{{ userInitials }}</div>
                </template>
                <template #error>
                  <div class="user-avatar-fallback user-avatar-fallback--sm">{{ userInitials }}</div>
                </template>
              </v-img>
            </v-avatar>
          </button>
        </template>
          <div class="um-cascade-wrap">
            <div v-if="switchAccountOpen" class="um-cascade-card">
              <div class="um-cascade-card__header">All accounts</div>
              <div class="um-switch-search">
                <v-icon size="16" class="um-account-search__icon">search</v-icon>
                <input
                  v-model="accountSearch"
                  type="text"
                  class="um-account-search__input"
                  placeholder="Search accounts…"
                  aria-label="Filter accounts"
                />
              </div>
              <div class="um-switch-list">
                <button
                  v-for="account in sortedFilteredAccounts"
                  :key="account.id"
                  type="button"
                  class="um-item"
                  :class="{ 'um-item--active': account.id === activeAccountId }"
                  :aria-pressed="account.id === activeAccountId"
                  @click="switchAccount(account.id)"
                >
                  <v-avatar size="28" variant="tonal" :color="accountColor(account.id)" class="flex-shrink-0 um-item__avatar">
                    {{ account.name.slice(0, 2).toUpperCase() }}
                  </v-avatar>
                  <div class="um-item__body">
                    <div class="um-item__title">{{ account.name }}</div>
                    <div class="um-item__sub">Account #{{ account.id }}</div>
                  </div>
                  <v-icon v-if="account.id === activeAccountId" size="16" color="primary" class="ml-auto">check-circle-2</v-icon>
                </button>
                <div v-if="sortedFilteredAccounts.length === 0" class="um-account-empty">
                  No accounts match "{{ accountSearch.trim() }}"
                </div>
              </div>
              <div class="um-divider" />
              <button
                type="button"
                class="um-item um-start-trial"
                @click="$router.push({ name: 'Signup' }); closeUserMenu()"
              >
                <v-avatar size="28" variant="tonal" color="primary" class="flex-shrink-0 um-item__avatar">
                  <v-icon size="15">plus</v-icon>
                </v-avatar>
                <div class="um-item__body">
                  <div class="um-item__title">Start free trial</div>
                  <div class="um-item__sub">Create a new workspace — 14 days free</div>
                </div>
              </button>
            </div>

            <div class="user-menu-card">
              <div class="um-header">
                <v-avatar size="56" class="flex-shrink-0">
                  <v-img :src="userAvatarUrl" :alt="userName" cover>
                    <template #placeholder>
                      <div class="user-avatar-fallback user-avatar-fallback--lg">{{ userInitials }}</div>
                    </template>
                    <template #error>
                      <div class="user-avatar-fallback user-avatar-fallback--lg">{{ userInitials }}</div>
                    </template>
                  </v-img>
                </v-avatar>
                <div class="um-header__info">
                  <div class="um-header__name">{{ userName }}</div>
                  <div class="um-header__email">{{ userEmail }}</div>
                  <v-chip size="x-small" variant="tonal" color="primary">{{ userRole }}</v-chip>
                </div>
              </div>

              <div class="um-divider" />

              <div class="um-section">
                <div class="um-subheader">Personal</div>
                <button type="button" class="um-item" @click="$router.push(profileRoute); closeUserMenu()">
                  <v-icon class="um-item__icon" size="20">user</v-icon>
                  <div class="um-item__body">
                    <div class="um-item__title">My Profile</div>
                    <div class="um-item__sub">View and edit your info</div>
                  </div>
                </button>
              </div>

              <div class="um-divider" />

              <div class="um-section">
                <div class="um-subheader">Account</div>
                <button type="button" class="um-item" @click="$router.push(settingsRoute); closeUserMenu()">
                  <v-icon class="um-item__icon" size="20">settings</v-icon>
                  <div class="um-item__body"><div class="um-item__title">Account Settings</div><div class="um-item__sub">Company, users, permissions</div></div>
                </button>
                <button type="button" class="um-item" @click="$router.push(billingRoute); closeUserMenu()">
                  <v-icon class="um-item__icon" size="20">credit-card</v-icon>
                  <div class="um-item__body"><div class="um-item__title">Billing</div><div class="um-item__sub">Plan, usage, invoices</div></div>
                </button>
                <button
                  type="button"
                  class="um-item um-account-trigger"
                  :class="{ 'um-item--active': switchAccountOpen }"
                  :aria-expanded="switchAccountOpen"
                  @click.stop="switchAccountOpen = !switchAccountOpen"
                >
                  <v-avatar size="28" variant="tonal" :color="accountColor(activeAccount.id)" class="flex-shrink-0 um-item__avatar">
                    {{ activeAccount.name.slice(0, 2).toUpperCase() }}
                  </v-avatar>
                  <div class="um-item__body">
                    <div class="um-item__title">{{ activeAccount.name }}</div>
                    <div class="um-item__sub">Account #{{ activeAccount.id }}</div>
                  </div>
                  <v-icon size="16" class="um-item__chevron">chevron-right</v-icon>
                </button>
                <button type="button" class="um-item" @click="openStub('Galaxy'); closeUserMenu()">
                  <v-icon class="um-item__icon" size="20">target</v-icon>
                  <div class="um-item__body"><div class="um-item__title">Galaxy</div><div class="um-item__sub">Cross-product workspace</div></div>
                </button>
                <button type="button" class="um-item" @click="openStub('Roadmap'); closeUserMenu()">
                  <v-icon class="um-item__icon" size="20">route</v-icon>
                  <div class="um-item__body"><div class="um-item__title">Roadmap</div><div class="um-item__sub">Planned product work</div></div>
                </button>
                <button type="button" class="um-item" @click="openStub('System Status'); closeUserMenu()">
                  <v-icon class="um-item__icon" size="20">shield-check</v-icon>
                  <div class="um-item__body"><div class="um-item__title">System Status</div><div class="um-item__sub">Trust and availability</div></div>
                </button>
              </div>

              <div class="um-divider" />

              <div class="um-section um-section--last">
                <div class="um-item" role="group" aria-label="Theme">
                  <v-icon class="um-item__icon" size="20">sun-moon</v-icon>
                  <div class="um-item__body">
                    <div class="um-item__title">Theme</div>
                    <div class="um-item__sub">Toggle light or dark mode</div>
                  </div>
                  <v-btn-toggle
                    v-model="themeToggleValue"
                    density="comfortable"
                    mandatory
                    class="theme-segment ml-auto"
                  >
                    <v-btn value="light" icon="sun" variant="text" aria-label="Light theme" />
                    <v-btn value="dark" icon="moon" variant="text" aria-label="Dark theme" />
                  </v-btn-toggle>
                </div>
                <div class="um-item" role="group" aria-label="PLG demo state">
                  <v-icon class="um-item__icon" size="20">flask-conical</v-icon>
                  <div class="um-item__body">
                    <div class="um-item__title">PLG demo state</div>
                    <div class="um-item__sub">Demo controls — not part of the product</div>
                  </div>
                </div>
                <div class="um-plg-demo">
                  <!-- Compact menu control: detail-free so the user menu can't
                       resize under the pointer while it is open. -->
                  <v-select
                    v-model="plgPresetValue"
                    :items="plgPresetItems"
                    item-title="label"
                    item-value="key"
                    hide-details
                    label="Subscription state"
                    class="um-plg-demo__select"
                  />
                  <v-btn
                    size="small"
                    variant="text"
                    class="text-none"
                    :disabled="!plgStore.hasExplicitState"
                    @click="resetPlgState"
                  >
                    Reset
                  </v-btn>
                </div>
                <button type="button" class="um-item um-item--danger" @click="openStub('Sign out'); closeUserMenu()">
                  <v-icon class="um-item__icon" size="20">log-out</v-icon>
                  <div class="um-item__body"><div class="um-item__title">Sign Out</div></div>
                </button>
              </div>
            </div>
          </div>
      </v-menu>
    </div>

    <!-- Mobile search overlay — icon-only trigger above expands into this full-screen search -->
    <v-dialog v-model="mobileSearchOpen" fullscreen transition="dialog-bottom-transition" class="appbar-mobile-search-dialog">
      <v-card class="appbar-mobile-search-card">
        <div class="appbar-mobile-search-card__header">
          <!-- App-shell search, not a form field: label-free by design, and
               detail-free so the sheet header can't shift as you type. -->
          <v-text-field
            v-model="searchQuery"
            autofocus
            hide-details
            prepend-inner-icon="search"
            placeholder="Find or Ask"
            aria-label="Universal AI search"
            clearable
            class="appbar-mobile-search-field"
            @keydown.enter.prevent="askDaVinciFromSearch"
          />
          <v-btn icon variant="text" aria-label="Close search" @click="mobileSearchOpen = false">
            <v-icon>x</v-icon>
          </v-btn>
        </div>
        <div class="appbar-mobile-search-card__results">
          <div v-if="filteredSearchGroups.length">
            <div v-for="[group, items] in filteredSearchGroups" :key="group" class="appbar-search-group-results">
              <div class="appbar-search-group__label">{{ group }}</div>
              <button
                v-for="item in items"
                :key="`${group}-${item.title}`"
                type="button"
                class="appbar-search-result"
                @click="navigateToRoute(item.route)"
              >
                <v-avatar size="30" variant="tonal" color="primary">
                  <v-icon size="17">{{ item.icon }}</v-icon>
                </v-avatar>
                <span class="min-width-0">
                  <strong>{{ item.title }}</strong>
                  <small>{{ item.subtitle }}</small>
                </span>
                <v-icon size="16">arrow-right</v-icon>
              </button>
            </div>
          </div>
          <div v-else class="pa-5 text-center text-body-2 text-medium-emphasis">
            No local prototype results. Ask Da Vinci to explore this request.
          </div>
        </div>
        <div class="appbar-mobile-search-card__footer">
          <v-btn block color="secondary" variant="flat" class="text-none" @click="askDaVinciFromSearch">Ask Da Vinci</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-app-bar>
</template>

<style scoped lang="scss">
/* Classic chrome; the studio shell overrides this in shell-variants.css.
 *
 * P4-7 migrated this file onto the token scale. Two categories are deliberately
 * left as raw values, matching the exemptions recorded in the Phase 2/3
 * changelog:
 *   · Panel and popover MEASURES (menu card widths 280/360, scroll caps 380/480,
 *     search flex bases, media-query breakpoints) — these size a surface to its
 *     content, they are not steps on the spacing rhythm.
 *   · letter-spacing — a typographic axis with no scale in tokens.json.
 * Everything that is spacing, sizing, radius or type scale resolves to --mp-*.
 *
 * The mobile full-screen search below is intentionally NOT MpDialog: its header
 * is the search field itself, not a title bar, so the shell's header contract
 * does not fit it. Every other dialog in the app composes MpDialog. */
.mp-appbar {
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-primary);
}

.mp-appbar :deep(.v-toolbar__content) {
  background: transparent;
}

.mp-appbar-shell {
  min-width: 0;
  padding: 0 var(--mp-space-24);
  height: 100%;
  /* Transparent so the header (.mp-appbar) is the single painted surface —
     lets the shell-variant nav color show through instead of a white wrapper. */
  background: transparent;
}

.min-width-0 {
  min-width: 0;
}

.appbar-search-group {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  /* Search measures, not spacing steps. */
  flex: 1 1 480px;
  max-width: 640px;
  min-width: var(--mp-layout-sectionRailWidth);
}

.appbar-utilities {
  display: flex;
  align-items: center;
  gap: var(--mp-space-4);
}

.appbar-utilities :deep(.appbar-action-btn) {
  /* P4-7: every control in this bar resolves to `component.control.height` —
     the same 40px baseline as buttons, form fields, table headers and nav rows.
     They were 36, which is on no scale stop.

     maropostDefaults.VBtn ships a blanket inline min-height + padding-inline
     meant for text buttons; it beats this rule's own height/width unless
     matched with !important, which is why these are squared off explicitly. */
  width: var(--mp-component-control-height) !important;
  height: var(--mp-component-control-height) !important;
  min-width: var(--mp-component-control-height) !important;
  min-height: var(--mp-component-control-height) !important;
  padding-inline: 0 !important;
  border-radius: var(--r-pill);
  color: var(--text-primary);
  /* Faint resting surface so the icons read as tappable controls, not glyphs
     floating on the light bar. Theme-adaptive via on-surface alpha. */
  background: var(--surface-interactive);
  opacity: 1;
  transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
}

.appbar-utilities :deep(.appbar-action-btn:hover),
.appbar-utilities :deep(.appbar-action-btn:focus-visible) {
  background: var(--surface-interactive-hover);
  color: var(--text-primary);
  outline: none;
}

.appbar-utilities :deep(.appbar-action-btn .v-icon) {
  font-size: var(--mp-fontSize-20);
}

.appbar-utilities :deep(.appbar-action-btn svg) {
  stroke-width: 2.25;
}

.appbar-divider {
  display: block;
  width: 1px;
  height: var(--mp-space-24);
  margin-inline: var(--mp-space-8);
  background: var(--border-default);
  flex-shrink: 0;
}

/* ── Assistant pill ─────────────────────────────── */
.assistant-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-6);
  height: var(--mp-component-control-height);
  padding-inline: var(--mp-component-listItem-paddingInline);
  /* --border-subtle is tuned for white cards; on the light bar it vanishes (≈1.05:1).
     A stronger on-surface edge + faint lift make the pill read as a control. */
  border: 1px solid var(--border-default);
  border-radius: var(--r-pill);
  background: var(--surface-primary);
  color: var(--text-primary);
  box-shadow: var(--elevation-raised);
  font: inherit;
  appearance: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 120ms ease, border-color 120ms ease;
}

.assistant-pill:hover {
  background: var(--dv-action-gradient);
  border-color: transparent;
  color: var(--dv-action-on-gradient);
}

.assistant-pill:hover :deep(.assistant-pill__chevron) {
  color: var(--dv-action-on-gradient);
}

/* Orb rings rest still in the pill and revolve on hover */
.assistant-pill :deep(.dv-orbit-orb__ring) {
  animation-play-state: paused;
}

.assistant-pill:hover :deep(.dv-orbit-orb__ring) {
  animation-play-state: running;
}

.assistant-pill:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  box-shadow: none;
}

.assistant-pill :deep(.v-icon) {
  color: rgb(var(--v-theme-secondary));
}

.assistant-pill__label {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  line-height: 1.15;
  white-space: nowrap;
}

.assistant-pill :deep(.assistant-pill__chevron) {
  color: var(--muted);
}

.assistant-menu-card {
  width: 280px;
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-component-menu-radius);
  box-shadow:
    0 8px 32px color-mix(in oklch, var(--text-primary) 12%, transparent),
    0 2px 8px color-mix(in oklch, var(--text-primary) 6%, transparent);
  overflow: hidden;
}

/* Dark mode: --surface-primary matches the surface these menus float over, and the
   --ink-derived shadow inverts to a white glow — give them a real elevation
   step instead. Light mode keeps the hand-tuned two-layer shadow above. */
.v-theme--maropostDark .assistant-menu-card {
  background: var(--surface-overlay);
  box-shadow: var(--elevation-overlay);
}

/* ── User pill ──────────────────────────────────── */
/* Avatar-only trigger — the menu carries the identity details. */
.user-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-component-control-height);
  height: var(--mp-component-control-height);
  padding: 0;
  border: 0;
  border-radius: var(--mp-radius-full);
  background: transparent;
  /* Resting ring separates the avatar from the bar and signals it's a control. */
  box-shadow: 0 0 0 1px var(--border-default);
  cursor: pointer;
  font: inherit;
  appearance: none;
  transition: box-shadow var(--dur-fast) var(--ease);
}

.user-pill:hover {
  box-shadow: 0 0 0 3px var(--border-hover);
}

.user-pill:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  box-shadow: none;
}

.user-pill__avatar {
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-bold);
  color: var(--accent-fg) !important;
}

.user-avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: var(--mp-fontWeight-bold);
}

.user-avatar-fallback--sm {
  font-size: var(--mp-fontSize-12);
}

.user-avatar-fallback--lg {
  font-size: var(--mp-fontSize-20);
}

/* ── Profile dropdown ───────────────────────────── */
.um-cascade-wrap {
  display: flex;
  align-items: flex-start;
  gap: var(--mp-space-8);
}

.um-cascade-card {
  width: 280px;
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-component-menu-radius);
  box-shadow:
    0 8px 32px color-mix(in oklch, var(--text-primary) 12%, transparent),
    0 2px 8px color-mix(in oklch, var(--text-primary) 6%, transparent);
  overflow: hidden;
  max-height: 90vh;
  overflow-y: auto;
}

/* Dark mode: see .assistant-menu-card override above for context. */
.v-theme--maropostDark .um-cascade-card {
  background: var(--surface-overlay);
  box-shadow: var(--elevation-overlay);
}

.um-cascade-card__header {
  padding: var(--mp-space-14) var(--mp-space-16) var(--mp-space-10);
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-bold);
  line-height: 1.25;
  color: rgb(var(--v-theme-primary));
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.user-menu-card {
  width: 360px;
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-component-menu-radius);
  box-shadow:
    0 8px 32px color-mix(in oklch, var(--text-primary) 12%, transparent),
    0 2px 8px color-mix(in oklch, var(--text-primary) 6%, transparent);
  overflow: hidden;
  max-height: 90vh;
  overflow-y: auto;
}

/* Dark mode: see .assistant-menu-card override above for context. */
.v-theme--maropostDark .user-menu-card {
  background: var(--surface-overlay);
  box-shadow: var(--elevation-overlay);
}

.um-header {
  display: flex;
  align-items: flex-start;
  gap: var(--mp-space-14);
  padding: var(--mp-component-card-padding);
  background: linear-gradient(
    180deg,
    color-mix(in oklch, rgb(var(--v-theme-primary)) 10%, var(--surface-primary)) 0%,
    color-mix(in oklch, rgb(var(--v-theme-primary)) 4%, var(--surface-primary)) 100%
  );
  border-bottom: 1px solid color-mix(in oklch, rgb(var(--v-theme-primary)) 14%, var(--border-subtle));
}

.um-header__info {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-4);
  min-width: 0;
}

.um-header__name {
  font-size: var(--mp-fontSize-18);
  font-weight: var(--mp-fontWeight-bold);
  line-height: 1.2;
  color: var(--text-primary);
}

.um-header__email {
  font-size: var(--mp-fontSize-13);
  color: var(--muted);
}

.um-divider {
  height: 1px;
  background: var(--border-subtle);
}

.um-section {
  padding: var(--mp-space-6) var(--mp-space-8);
}

.um-section--last {
  padding-bottom: var(--mp-space-10);
}

.um-plg-demo {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  /* The 44px start inset aligns this control with the menu rows' label column
     (icon + listItem gap), so it reads as belonging to the row above it. */
  padding: 0 var(--mp-component-listItem-paddingInline) var(--mp-space-10) 44px;
}

.um-plg-demo__select {
  flex: 1;
  min-width: 0;
}

.um-subheader {
  padding: var(--mp-space-10) var(--mp-component-listItem-paddingInline) var(--mp-space-4);
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-bold);
  line-height: 1;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 1.2px;
}

/* A menu row is a nav row: same `component.listItem.*` geometry as AppSidebar,
   MpSectionRail and MpListRow (P4-7). */
.um-item {
  display: flex;
  align-items: center;
  gap: var(--mp-component-listItem-gap);
  min-height: var(--mp-component-listItem-minHeight);
  padding: var(--mp-component-listItem-paddingBlock) var(--mp-component-listItem-paddingInline);
  border-radius: var(--mp-component-nav-itemRadius);
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease), transform 80ms ease;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  font: inherit;
  color: inherit;
}

.um-item:hover,
.um-item:focus-visible {
  background: var(--surface-interactive);
}

.um-item:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}

.um-item:active {
  transform: scale(0.99);
}

.um-item--active {
  background: rgba(var(--v-theme-primary), 0.08);
}

.um-item--active:hover {
  background: rgba(var(--v-theme-primary), 0.12);
}

.um-item--active .um-item__title {
  color: rgb(var(--v-theme-primary));
  font-weight: var(--mp-fontWeight-semibold);
}

.um-item__icon {
  color: var(--muted);
  flex-shrink: 0;
}

/* The Da Vinci mark stays full-ink in menus — never muted like generic icons */
.um-item__icon.dv-orbit-orb {
  color: var(--text-primary);
}

.um-item:hover .um-item__icon {
  color: var(--text-primary);
}

.um-item__avatar {
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-bold);
}

.um-item__body {
  flex: 1;
  min-width: 0;
}

.um-item__title {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  line-height: 1.3;
  color: var(--text-primary);
}

.um-item__sub {
  font-size: var(--mp-fontSize-12);
  line-height: 1.3;
  color: var(--muted);
  margin-top: var(--mp-space-2);
}

.um-item--danger .um-item__title,
.um-item--danger .um-item__icon {
  color: rgb(var(--v-theme-error)) !important;
}

.um-item--danger:hover {
  background: rgba(var(--v-theme-error), 0.06);
}

.um-account-trigger {
  cursor: pointer;
}

.um-item__chevron {
  color: var(--muted);
  margin-left: auto;
  flex-shrink: 0;
}

.um-switch-search {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  padding: 0 var(--mp-space-10);
  margin: 0 var(--mp-component-listItem-paddingInline) var(--mp-space-8);
  height: var(--mp-component-control-height);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-component-input-radius);
  background: var(--surface-secondary);
  transition: border-color var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease);
}

.um-switch-search:focus-within {
  border-color: color-mix(in oklch, rgb(var(--v-theme-primary)) 40%, transparent);
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.08);
}

.um-account-search__icon {
  color: var(--muted);
  flex-shrink: 0;
}

.um-account-search__input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-medium);
  font-family: inherit;
  color: var(--text-primary);
  line-height: 1.3;
}

.um-account-search__input::placeholder {
  color: var(--muted);
}

.um-switch-list {
  /* Scroll measure, not a spacing step. */
  max-height: 380px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 var(--mp-space-8) var(--mp-space-12);
}

.um-account-empty {
  padding: var(--mp-space-16) var(--mp-component-listItem-paddingInline);
  text-align: center;
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-medium);
  color: var(--muted);
}

.theme-segment.v-btn-group {
  flex-shrink: 0;
  align-self: center;
  align-items: center;
  /* 40 track = 32 thumb + 4 padding either side; every number on a scale stop.
     Was a 36px track with 3px padding around 30px thumbs. */
  min-height: var(--mp-component-control-height);
  height: auto !important;
  padding: var(--mp-space-4);
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-pill);
  background: var(--surface-secondary);
  overflow-x: auto;
  overflow-y: visible;
}

.theme-segment :deep(.v-btn) {
  width: var(--mp-space-32) !important;
  min-width: var(--mp-space-32) !important;
  height: var(--mp-space-32) !important;
  min-height: var(--mp-space-32) !important;
  padding: 0 !important;
  border-radius: var(--mp-radius-full) !important;
}

.theme-segment :deep(.v-btn .v-btn__content) {
  display: flex;
  align-items: center;
  justify-content: center;
  block-size: 100%;
  inline-size: 100%;
}

.theme-segment :deep(.v-btn .v-icon) {
  font-size: var(--mp-fontSize-18);
  line-height: 1;
  block-size: 1em;
  inline-size: 1em;
}

.theme-segment :deep(.v-btn--active) {
  background: var(--surface-primary);
  box-shadow: 0 1px 3px color-mix(in oklch, var(--text-primary) 8%, transparent);
}

/* Dark mode: --surface-primary matches the track and the --ink-derived shadow
   inverts to a glow, so the active pill reads as inset rather than raised.
   --surface-overlay is lighter than the track's --surface-secondary in dark, so this
   keeps the raised look; light mode keeps the original shadow above. */
.v-theme--maropostDark .theme-segment :deep(.v-btn--active) {
  background: var(--surface-overlay);
  box-shadow: var(--elevation-raised);
}

.appbar-search {
  flex: 1 1 auto;
  min-width: 200px;
}

:deep(.appbar-search .v-field) {
  border-radius: var(--r-pill);
  background: var(--surface-secondary);
  border: 1px solid var(--border-default);
}

:deep(.appbar-search .v-field__outline) {
  --v-field-border-opacity: 0;
}

:deep(.appbar-search .v-field--focused .v-field__outline) {
  --v-field-border-opacity: 0;
}

:deep(.appbar-search .v-field--focused) {
  background: var(--surface-primary);
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  border-color: var(--accent);
}

/* P4-7/P4-4: the app bar's search and the data-table toolbar's search are the
   two search fields in the product — both now resolve to the same control-height
   token, so they cannot drift. This one was 34 + padding; that one was 38. */
:deep(.appbar-search .v-field) {
  box-sizing: border-box;
  min-height: var(--mp-component-control-height);
}

:deep(.appbar-search .v-field__input) {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  min-height: 0 !important;
  padding-block: 0 !important;
}

:deep(.appbar-search input::placeholder) {
  /* Same 14px as the input text — a smaller placeholder read as a second type
     size in the one control (field-rework sweep). */
  color: var(--muted);
  font-weight: var(--mp-fontWeight-medium);
  opacity: 1;
}

:deep(.appbar-search .v-field__prepend-inner .v-icon) {
  color: var(--muted);
}

.appbar-search-cmd {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: var(--mp-space-2) var(--mp-space-6);
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-pill);
  background: transparent;
  color: var(--muted);
  font-family: ui-monospace, "SF Mono", monospace;
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-medium);
  white-space: nowrap;
}

/* ── Command palette (desktop universal search) ─────────────────────── */
.cmd-palette {
  border-color: var(--border-subtle);
  overflow: hidden;
  box-shadow: var(--elevation-modal);
}

.cmd-palette__list {
  max-height: min(60vh, 480px);
  overflow-y: auto;
  padding: var(--mp-space-6);
  margin: 0;
  list-style: none;
}

.cmd-palette__tabs {
  display: flex;
  align-items: center;
  gap: var(--mp-space-4);
  padding: var(--mp-space-8) var(--mp-space-10);
  overflow-x: auto;
  border-bottom: 1px solid var(--border-subtle);
}

.cmd-palette__tab {
  flex-shrink: 0;
  padding: var(--mp-space-4) var(--mp-space-10);
  border: 0;
  border-radius: var(--mp-radius-full);
  background: transparent;
  color: var(--muted);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-semibold);
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
}

.cmd-palette__tab:hover {
  background: var(--surface-interactive-hover);
  color: var(--text-primary);
}

.cmd-palette__tab--active {
  background: var(--surface-interactive-active);
  color: var(--text-primary);
}

.cmd-palette__tab:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--focus-ring);
}

.cmd-palette__section-label {
  padding: var(--mp-space-10) var(--mp-space-10) var(--mp-space-4);
  color: var(--muted);
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: 0.6px;
  text-transform: uppercase;
}

.cmd-row {
  display: grid;
  grid-template-columns: var(--mp-space-32) minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--mp-component-listItem-gap);
  width: 100%;
  min-height: var(--mp-component-listItem-minHeight);
  padding: var(--mp-component-listItem-paddingBlock) var(--mp-space-10);
  border: 0;
  border-radius: var(--mp-component-nav-itemRadius);
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  font: inherit;
  text-align: left;
  scroll-margin: var(--mp-space-6);
  transition: background var(--dur-fast) var(--ease);
}

.cmd-row--active {
  background: var(--surface-interactive-hover);
}

.cmd-row:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--focus-ring);
}

.cmd-row__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-32);
  height: var(--mp-space-32);
  border-radius: var(--mp-component-chip-radius);
  background: var(--surface-interactive);
  color: var(--text-primary);
}

.cmd-row--active .cmd-row__icon {
  background: var(--surface-interactive-active);
}

.cmd-row__icon--ask,
.cmd-row--active .cmd-row__icon--ask {
  background: var(--dv-action-gradient);
  color: var(--dv-action-on-gradient);
}

.cmd-row__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.cmd-row__title {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cmd-row--ask .cmd-row__title {
  font-weight: var(--mp-fontWeight-semibold);
}

.cmd-row__sub {
  margin-top: var(--mp-space-2);
  font-size: var(--mp-fontSize-12);
  line-height: 1.3;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cmd-row__chev {
  color: var(--muted);
  opacity: 0;
}

.cmd-row:hover .cmd-row__chev {
  opacity: 0.55;
}

.cmd-row__enter,
.cmd-palette__footer kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--mp-component-chip-height-sm);
  height: var(--mp-component-chip-height-sm);
  padding: 0 var(--mp-space-6);
  border: 1px solid var(--border-default);
  border-radius: var(--mp-radius-4);
  background: var(--surface-primary);
  color: var(--muted);
  font-family: ui-monospace, "SF Mono", monospace;
  font-size: var(--mp-fontSize-11);
  line-height: 1;
}

.cmd-palette__footer {
  display: flex;
  align-items: center;
  gap: var(--mp-space-14);
  padding: var(--mp-space-8) var(--mp-space-12);
  border-top: 1px solid var(--border-subtle);
  background: var(--surface-secondary);
}

.cmd-hint {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-6);
  font-size: var(--mp-fontSize-12);
  color: var(--muted);
}

.cmd-palette__brand {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-6);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--muted);
}

.appbar-search-group-results + .appbar-search-group-results {
  margin-top: var(--mp-space-8);
}

.appbar-search-group__label {
  padding: var(--mp-space-8) var(--mp-space-8) var(--mp-space-4);
  color: var(--muted);
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-medium);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.appbar-search-result {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--mp-space-10);
  width: 100%;
  /* Two-line row: the listItem floor plus its second line. */
  min-height: var(--mp-space-64);
  padding: var(--mp-component-listItem-paddingBlock) var(--mp-space-10);
  border: 0;
  border-radius: var(--mp-component-chip-radius);
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.appbar-search-result:hover,
.appbar-search-result:focus-visible {
  background: var(--surface-secondary);
}

.appbar-search-result:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  box-shadow: none;
}

.appbar-search-result strong,
.appbar-search-result small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.appbar-search-result strong {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  line-height: 1.3;
}

.appbar-search-result small {
  margin-top: var(--mp-space-2);
  color: var(--muted);
  font-size: var(--mp-fontSize-12);
}

.notification-badge :deep(.v-badge__badge) {
  height: var(--mp-space-16);
  min-width: var(--mp-space-16);
  padding-inline: var(--mp-space-4);
  font-size: var(--mp-fontSize-10);
  line-height: var(--mp-space-16);
  background: var(--neg) !important;
  /* P5.5: a solid semantic fill states its ink. The count digits used to
     inherit, relying on Vuetify's default badge color happening to be white. */
  color: var(--on-neg) !important;
  box-shadow: 0 0 0 2px var(--surface-primary);
  /* The badge overlaps a few px into the next utility button (4px gap,
     floating badge). Both it and that button are position:relative/absolute
     with z-index:auto, so DOM order decides paint order — the later Settings
     button was covering the badge's edge. Explicit z-index wins regardless
     of sibling order. */
  z-index: 1;
}

@media (max-width: 1180px) {
  .appbar-search-group {
    max-width: 420px;
  }
}

/* Tablet: hide account pill label text, shrink search */
@media (max-width: 900px) {
  .appbar-search-group {
    min-width: 160px;
    flex: 1 1 200px;
  }
  .assistant-pill {
    display: none;
  }
}

/* ── Hamburger + mobile search trigger — hidden above the mobile breakpoint ── */
.appbar-hamburger-btn,
.appbar-mobile-search-btn {
  display: none;
}

/* Mobile: collapse the inline search field to an icon-only trigger that opens
   a full-screen search overlay, and reveal the nav hamburger. The Create and
   utility buttons stay reachable — only the min-width squeeze goes away. */
@media (max-width: 640px) {
  .appbar-search-group {
    min-width: 0;
    flex: 0 0 auto;
  }

  .appbar-search--inline {
    display: none;
  }

  .appbar-hamburger-btn,
  .appbar-mobile-search-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--mp-component-control-height);
    height: var(--mp-component-control-height);
    flex-shrink: 0;
    border: 0;
    border-radius: var(--r-pill);
    background: transparent;
    color: var(--text-primary);
    appearance: none;
    cursor: pointer;
    transition: background var(--dur-fast) var(--ease);
  }

  .appbar-hamburger-btn:hover,
  .appbar-hamburger-btn:focus-visible,
  .appbar-mobile-search-btn:hover,
  .appbar-mobile-search-btn:focus-visible {
    background: var(--surface-interactive-hover);
    outline: none;
  }

}

.appbar-mobile-search-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 0 !important;
}

.appbar-mobile-search-card__header {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  padding: var(--mp-component-dialog-paddingCompact);
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.appbar-mobile-search-field {
  flex: 1 1 auto;
}

.appbar-mobile-search-card__results {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: var(--mp-space-8);
}

.appbar-mobile-search-card__footer {
  padding: var(--mp-component-dialog-paddingCompact);
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

/* ── Quick Create button + menu ─────────────────── */
/* Quiet utility icon — same voice as the bell/settings buttons beside it. */
.appbar-create-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-component-control-height);
  height: var(--mp-component-control-height);
  border: 0;
  border-radius: var(--r-pill);
  /* Match the sibling action buttons: faint resting surface + dark glyph so the
     whole utility cluster reads as one row of tappable controls. */
  background: var(--surface-interactive);
  color: var(--text-primary);
  font: inherit;
  appearance: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
}

.appbar-create-btn :deep(svg) {
  stroke-width: 2.25;
}

.appbar-create-btn:hover,
.appbar-create-btn--open {
  background: var(--surface-interactive-hover);
  color: var(--text-primary);
}

.appbar-create-btn:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  box-shadow: none;
}

.appbar-create-menu {
  border-color: var(--border-subtle);
  padding: var(--mp-space-8);
  overflow: hidden;
}

.appbar-create-menu__label {
  padding: var(--mp-space-8) var(--mp-space-8) var(--mp-space-6);
  color: var(--muted);
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-medium);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.appbar-create-menu__list {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-2);
}

.appbar-create-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--mp-component-listItem-gap);
  width: 100%;
  /* Two-line row: the listItem floor plus its second line. */
  min-height: var(--mp-space-48);
  padding: var(--mp-component-listItem-paddingBlock) var(--mp-space-10);
  border: 0;
  border-radius: var(--mp-component-chip-radius);
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.appbar-create-row:hover,
.appbar-create-row:focus-visible {
  background: var(--surface-interactive);
}

.appbar-create-row:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  box-shadow: none;
}

.appbar-create-row__icon {
  color: var(--text-primary);
  flex-shrink: 0;
}

.appbar-create-row__body strong,
.appbar-create-row__body small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.appbar-create-row__body strong {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  line-height: 1.3;
  color: var(--text-primary);
}

.appbar-create-row__body small {
  margin-top: var(--mp-space-2);
  color: var(--muted);
  font-size: var(--mp-fontSize-12);
}

.appbar-create-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--mp-component-chip-height-md);
  height: var(--mp-component-chip-height-md);
  padding: 0 var(--mp-component-chip-paddingInline);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-4);
  background: var(--surface-secondary);
  color: var(--muted);
  font-family: ui-monospace, "SF Mono", monospace;
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-semibold);
  line-height: 1;
}
</style>
