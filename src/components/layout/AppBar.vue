<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountsStore } from '@/stores/useAccounts'
import { useCopilotStore } from '@/stores/useCopilot'
import { useUserProfile } from '@/stores/useUserProfile'
import { useAppTheme, type ThemeMode } from '@/composables/useAppTheme'

const copilot = useCopilotStore()

const router = useRouter()
const accountsStore = useAccountsStore()
const { mode, setMode } = useAppTheme()

const themeToggleValue = computed({
  get: () => mode.value,
  set: (value: ThemeMode) => setMode(value),
})

const notificationCount = ref(18)
const userName = ref('Ross Andrew Paquette')
const userInitials = ref('RP')
const userEmail = ref('Ross@maropost.com')
const userRole = ref('Super Admin')
const profileStore = useUserProfile()
const userAvatarUrl = computed(() => profileStore.avatarUrl)
const searchOpen = ref(false)
const searchQuery = ref('')
const appbarNotice = ref('')
const appbarNoticeVisible = ref(false)

const currentAccountId = computed(() => accountsStore.activeId)
const settingsRoute = computed(() => ({ name: 'Settings' as const, params: { accountId: currentAccountId.value } }))
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
  appbarNotice.value = message
  appbarNoticeVisible.value = true
}

function navigateToRoute(routeLocation: object) {
  searchOpen.value = false
  router.push(routeLocation)
}

function askDaVinciFromSearch() {
  searchOpen.value = false
  copilot.open()
}

function openStub(label: string) {
  showAppbarNotice(`${label} is represented as a prototype action.`)
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
    sub: 'Start from a blank or template',
    kbd: 'D',
    action: () => router.push({ name: 'DashboardsList', params: { accountId: currentAccountId.value } }),
  },
  {
    key: 'widget',
    icon: 'blocks',
    title: 'Widget',
    sub: 'Add to the current dashboard',
    kbd: 'W',
    action: () => openStub('Add widget'),
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

</script>

<template>
  <v-app-bar height="52" color="surface-variant" flat class="mp-appbar">
    <div class="mp-appbar-shell w-100 d-flex align-center px-4 gap-2">
      <div class="appbar-search-group">
        <v-menu v-model="searchOpen" location="bottom start" offset="8" :close-on-content-click="false">
          <template #activator="{ props }">
            <v-text-field
              v-bind="props"
              v-model="searchQuery"
              density="compact"
              variant="outlined"
              hide-details
              prepend-inner-icon="search"
              placeholder="Find or Ask"
              aria-label="Universal AI search"
              rounded="lg"
              class="appbar-search"
              bg-color="surface"
              clearable
              @focus="searchOpen = true"
              @keydown.enter.prevent="askDaVinciFromSearch"
            >
              <template #append-inner>
                <kbd class="appbar-search-cmd">⌘K</kbd>
              </template>
            </v-text-field>
          </template>
          <v-card width="620" max-width="calc(100vw - 32px)" rounded="lg" flat border class="appbar-search-menu">
            <div class="appbar-search-menu__hero">
              <v-icon size="20" color="secondary">sparkles</v-icon>
              <div class="min-width-0">
                <div class="text-subtitle-2 font-weight-bold">Ask Da Vinci</div>
                <div class="text-body-2 text-medium-emphasis text-truncate">
                  {{ searchQuery.trim() ? `Search and answer "${searchQuery.trim()}" across this workspace` : 'Search dashboards, apps, orders, contacts, campaigns, and settings.' }}
                </div>
              </div>
              <v-btn size="small" color="secondary" variant="flat" class="text-none" @click="askDaVinciFromSearch">
                Ask
              </v-btn>
            </div>
            <v-divider />
            <div v-if="filteredSearchGroups.length" class="appbar-search-menu__results">
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
          </v-card>
        </v-menu>

        <v-menu v-model="createOpen" location="bottom end" offset="8" :close-on-content-click="false">
          <template #activator="{ props }">
            <button
              v-bind="props"
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
      </div>

      <v-spacer />

      <div class="appbar-utilities">
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

        <v-tooltip text="Galaxy" location="bottom">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon variant="text" class="appbar-action-btn" aria-label="Galaxy" @click="openStub('Galaxy')">
              <v-icon>book-open</v-icon>
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

      <button
        type="button"
        class="assistant-pill"
        aria-label="AI Assistant"
        @click="copilot.toggle()"
      >
        <v-icon size="16">sparkles</v-icon>
        <span class="assistant-pill__label">Da Vinci</span>
      </button>

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
            <span class="user-pill__name d-none d-md-block">{{ userName }}</span>
            <v-icon size="14" class="user-pill__chevron">chevron-down</v-icon>
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
                  <v-chip size="x-small" variant="tonal" color="primary" class="mt-1">{{ userRole }}</v-chip>
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
                <button type="button" class="um-item" @click="openStub('Billing'); closeUserMenu()">
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
                <button type="button" class="um-item um-item--danger" @click="openStub('Sign out'); closeUserMenu()">
                  <v-icon class="um-item__icon" size="20">log-out</v-icon>
                  <div class="um-item__body"><div class="um-item__title">Sign Out</div></div>
                </button>
              </div>
            </div>
          </div>
      </v-menu>
    </div>

    <v-snackbar v-model="appbarNoticeVisible" timeout="2400" color="surface" location="bottom right">
      {{ appbarNotice }}
    </v-snackbar>
  </v-app-bar>
</template>

<style scoped lang="scss">
.mp-appbar {
  border-bottom: 1px solid var(--hairline);
  background: var(--surface-2);
}

.mp-appbar :deep(.v-toolbar__content) {
  background: var(--surface-2);
}

.mp-appbar-shell {
  min-width: 0;
  padding: 0 22px;
  height: 100%;
  background: var(--surface-2);
}

.min-width-0 {
  min-width: 0;
}

.appbar-search-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 460px;
  max-width: 600px;
  min-width: 260px;
}

.appbar-utilities {
  display: flex;
  align-items: center;
  gap: 6px;
}

.appbar-utilities :deep(.appbar-action-btn) {
  width: 32px;
  height: 32px;
  border-radius: var(--r-pill);
  color: var(--ink);
  opacity: 1;
  transition: background 120ms ease, color 120ms ease;
}

.appbar-utilities :deep(.appbar-action-btn:hover),
.appbar-utilities :deep(.appbar-action-btn:focus-visible) {
  background: rgba(var(--v-theme-on-surface), 0.07);
  color: var(--ink);
  outline: none;
}

.appbar-utilities :deep(.appbar-action-btn .v-icon) {
  font-size: 20px;
}

.appbar-utilities :deep(.appbar-action-btn svg) {
  stroke-width: 2.25;
}

.appbar-divider {
  display: block;
  width: 1px;
  height: 22px;
  margin-inline: 8px;
  background: var(--hairline);
  flex-shrink: 0;
}

/* ── Assistant pill ─────────────────────────────── */
.assistant-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 5px 12px;
  border: 1px solid var(--hairline);
  border-radius: var(--r-pill);
  background: var(--surface-1);
  color: var(--ink);
  font: inherit;
  appearance: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 120ms ease, border-color 120ms ease;
}

.assistant-pill:hover {
  background: var(--surface-2);
}

.assistant-pill:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent) 18%, transparent);
}

.assistant-pill :deep(.v-icon) {
  color: rgb(var(--v-theme-secondary));
}

.assistant-pill__label {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.15;
  white-space: nowrap;
}

/* ── User pill ──────────────────────────────────── */
.user-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 3px 8px 3px 4px;
  border: 1px solid var(--hairline);
  border-radius: var(--r-pill);
  background: var(--surface-1);
  cursor: pointer;
  font: inherit;
  appearance: none;
  transition: background 120ms ease, border-color 120ms ease;
}

.user-pill:hover {
  background: var(--surface-2);
}

.user-pill:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent) 18%, transparent);
}

.user-pill__avatar {
  font-size: 11px;
  font-weight: 700;
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
  font-weight: 700;
}

.user-avatar-fallback--sm {
  font-size: 11px;
}

.user-avatar-fallback--lg {
  font-size: 20px;
}

.user-pill__name {
  max-width: 96px;
  overflow: hidden;
  color: var(--ink);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-pill__chevron {
  color: var(--muted);
}

/* ── Profile dropdown ───────────────────────────── */
.um-cascade-wrap {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.um-cascade-card {
  width: 280px;
  background: var(--surface-1);
  border: 1px solid var(--hairline);
  border-radius: 14px;
  box-shadow:
    0 8px 32px color-mix(in oklch, var(--ink) 12%, transparent),
    0 2px 8px color-mix(in oklch, var(--ink) 6%, transparent);
  overflow: hidden;
  max-height: 90vh;
  overflow-y: auto;
}

.um-cascade-card__header {
  padding: 14px 16px 10px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.25;
  color: rgb(var(--v-theme-primary));
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.user-menu-card {
  width: 360px;
  background: var(--surface-1);
  border: 1px solid var(--hairline);
  border-radius: 14px;
  box-shadow:
    0 8px 32px color-mix(in oklch, var(--ink) 12%, transparent),
    0 2px 8px color-mix(in oklch, var(--ink) 6%, transparent);
  overflow: hidden;
  max-height: 90vh;
  overflow-y: auto;
}

.um-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 20px;
  background: linear-gradient(
    180deg,
    color-mix(in oklch, rgb(var(--v-theme-primary)) 10%, var(--surface-1)) 0%,
    color-mix(in oklch, rgb(var(--v-theme-primary)) 4%, var(--surface-1)) 100%
  );
  border-bottom: 1px solid color-mix(in oklch, rgb(var(--v-theme-primary)) 14%, var(--hairline));
}

.um-header__info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.um-header__name {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--ink);
}

.um-header__email {
  font-size: 13px;
  color: var(--muted);
}

.um-divider {
  height: 1px;
  background: var(--hairline);
}

.um-section {
  padding: 6px 8px;
}

.um-section--last {
  padding-bottom: 10px;
}

.um-subheader {
  padding: 10px 12px 4px;
  font-size: 10.5px;
  font-weight: 700;
  line-height: 1;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 1.2px;
}

.um-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 120ms ease, transform 80ms ease;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  font: inherit;
  color: inherit;
}

.um-item:hover,
.um-item:focus-visible {
  background: rgba(var(--v-theme-on-surface), 0.05);
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
  font-weight: 700;
}

.um-item__icon {
  color: var(--muted);
  flex-shrink: 0;
}

.um-item:hover .um-item__icon {
  color: var(--ink);
}

.um-item__avatar {
  font-size: 11px;
  font-weight: 700;
}

.um-item__body {
  flex: 1;
  min-width: 0;
}

.um-item__title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--ink);
}

.um-item__sub {
  font-size: 12px;
  line-height: 1.3;
  color: var(--muted);
  margin-top: 1px;
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
  gap: 8px;
  padding: 0 10px;
  margin: 0 12px 8px;
  height: 36px;
  border: 1px solid var(--hairline);
  border-radius: 10px;
  background: var(--surface-2);
  transition: border-color 120ms ease, box-shadow 120ms ease;
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
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  color: var(--ink);
  line-height: 1.3;
}

.um-account-search__input::placeholder {
  color: var(--muted);
}

.um-switch-list {
  max-height: 380px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 8px 12px;
}

.um-account-empty {
  padding: 16px 12px;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
}

.theme-segment.v-btn-group {
  flex-shrink: 0;
  align-self: center;
  align-items: center;
  min-height: 36px;
  height: auto !important;
  padding: 3px;
  border: 1px solid var(--hairline);
  border-radius: var(--r-pill);
  background: var(--surface-2);
  overflow-x: auto;
  overflow-y: visible;
}

.theme-segment :deep(.v-btn) {
  width: 32px !important;
  min-width: 32px !important;
  height: 30px !important;
  min-height: 30px !important;
  padding: 0 !important;
  border-radius: 999px !important;
}

.theme-segment :deep(.v-btn .v-btn__content) {
  display: flex;
  align-items: center;
  justify-content: center;
  block-size: 100%;
  inline-size: 100%;
}

.theme-segment :deep(.v-btn .v-icon) {
  font-size: 18px;
  line-height: 1;
  block-size: 1em;
  inline-size: 1em;
}

.theme-segment :deep(.v-btn--active) {
  background: var(--surface-1);
  box-shadow: 0 1px 3px color-mix(in oklch, var(--ink) 8%, transparent);
}
.theme-toggle-item :deep(.v-list-item__append) {
  align-self: center;
}
.sign-out-item {
  transition: background 120ms ease;
  color: rgb(var(--v-theme-error));
}
.sign-out-item:hover {
  background: rgba(var(--v-theme-error), 0.06);
}
.sign-out-item :deep(.v-list-item__prepend .v-icon),
.sign-out-item :deep(.v-list-item-title) {
  color: rgb(var(--v-theme-error));
}

.appbar-subheader {
  font-size: 11px;
  letter-spacing: 0.05em;
  color: var(--muted);
}

.appbar-search {
  flex: 1 1 auto;
  min-width: 200px;
}

:deep(.appbar-search .v-field) {
  border-radius: var(--r-pill);
  background: var(--surface-2);
  border: 1px solid var(--hairline);
}

:deep(.appbar-search .v-field__outline) {
  --v-field-border-opacity: 0;
}

:deep(.appbar-search .v-field--focused .v-field__outline) {
  --v-field-border-opacity: 0;
}

:deep(.appbar-search .v-field--focused) {
  background: var(--surface-1);
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent) 12%, transparent);
  border-color: var(--accent);
}

:deep(.appbar-search .v-field__input) {
  font-size: 13.5px;
  font-weight: 500;
  min-height: 36px;
  padding-top: 6px;
  padding-bottom: 6px;
}

:deep(.appbar-search input::placeholder) {
  color: color-mix(in oklch, var(--muted) 70%, var(--ink) 30%);
  font-weight: 500;
  opacity: 1;
}

:deep(.appbar-search .v-field__prepend-inner .v-icon) {
  color: var(--muted);
}

.appbar-search-cmd {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: 1px 6px;
  border: 1px solid var(--hairline);
  border-radius: var(--r-pill);
  background: transparent;
  color: var(--muted);
  font-family: ui-monospace, "SF Mono", monospace;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.appbar-search-menu {
  border-color: var(--hairline);
  overflow: hidden;
}

.appbar-search-menu__hero {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: var(--surface-2);
}

.appbar-search-menu__results {
  max-height: 420px;
  overflow: auto;
  padding: 8px;
}

.appbar-search-group-results + .appbar-search-group-results {
  margin-top: 8px;
}

.appbar-search-group__label {
  padding: 8px 8px 4px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.appbar-search-result {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 58px;
  padding: 9px 10px;
  border: 0;
  border-radius: var(--r-chip);
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.appbar-search-result:hover,
.appbar-search-result:focus-visible {
  background: var(--surface-2);
}

.appbar-search-result:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent) 18%, transparent);
}

.appbar-search-result strong,
.appbar-search-result small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.appbar-search-result strong {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
}

.appbar-search-result small {
  margin-top: 2px;
  color: var(--muted);
  font-size: 11px;
}

.notification-badge :deep(.v-badge__badge) {
  height: 16px;
  min-width: 16px;
  padding-inline: 4px;
  font-size: 10px;
  line-height: 16px;
  background: var(--neg) !important;
  box-shadow: 0 0 0 2px var(--surface-1);
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
  .user-pill__name {
    display: none;
  }
  .assistant-pill {
    display: none;
  }
}

/* Mobile: hide search bar entirely, collapse to icon mode */
@media (max-width: 640px) {
  .appbar-search-group {
    display: none;
  }
  .appbar-account-tabs {
    display: none;
  }
}

/* ── Quick Create button + menu ─────────────────── */
.appbar-create-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--hairline);
  border-radius: 50%;
  background: var(--surface-1);
  color: var(--accent);
  font: inherit;
  appearance: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
}

.appbar-create-btn :deep(svg) {
  stroke-width: 2.5;
}

.appbar-create-btn:hover,
.appbar-create-btn--open {
  background: var(--surface-2);
  color: var(--accent-ink);
}

.appbar-create-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent) 18%, transparent);
}

.appbar-create-menu {
  border-color: var(--hairline);
  padding: 8px;
  overflow: hidden;
}

.appbar-create-menu__label {
  padding: 8px 8px 6px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.appbar-create-menu__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.appbar-create-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 52px;
  padding: 8px 10px;
  border: 0;
  border-radius: var(--r-chip);
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.appbar-create-row:hover,
.appbar-create-row:focus-visible {
  background: rgba(var(--v-theme-on-surface), 0.05);
}

.appbar-create-row:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent) 18%, transparent);
}

.appbar-create-row__icon {
  color: var(--ink);
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
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--ink);
}

.appbar-create-row__body small {
  margin-top: 2px;
  color: var(--muted);
  font-size: 11.5px;
}

.appbar-create-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border: 1px solid var(--hairline);
  border-radius: 6px;
  background: var(--surface-2);
  color: var(--muted);
  font-family: ui-monospace, "SF Mono", monospace;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
}
</style>
