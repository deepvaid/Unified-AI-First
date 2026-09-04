<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import InviteUsersDrawer from '@/components/rbac/InviteUsersDrawer.vue'
import UserAccessDrawer from '@/components/rbac/UserAccessDrawer.vue'
import { useRbacStore } from '@/stores/useRbac'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { formatAgo } from '@/composables/useRelativeTime'
import { PRODUCT_META, type ProductKey, type UserAccount } from '@/stores/rbacData'
import { useToast } from '@/composables/useToast'

const rbac = useRbacStore()
const { loading } = useInitialLoad()

const search = ref('')
const selected = ref<string[]>([])
const statusTab = ref('all')

const PRODUCT_ICONS: Record<ProductKey, string> = {
  platform: 'globe',
  marketing: 'megaphone',
  service: 'headphones',
  commerce: 'shopping-cart',
}

const tabs = computed(() => [
  { label: 'All', key: 'all', count: rbac.usersByStatus.all },
  { label: 'Active', key: 'active', count: rbac.usersByStatus.active },
  { label: 'Invited', key: 'invited', count: rbac.usersByStatus.invited },
  { label: 'Deactivated', key: 'deactivated', count: rbac.usersByStatus.deactivated },
])

// Filters
const filters = ref({ product: null as ProductKey | null })
const roleFilterItems = computed(() => rbac.roles.map(r => ({ title: r.name, value: r.id })))

// Role is the promoted filter: a multi-select pill in the toolbar, so the cut
// people make most often doesn't cost a trip to the drawer. Roles are store
// data, so the config is a computed rather than a literal.
const roleQuickFilter = computed(() => ({
  key: 'role',
  label: 'Role',
  options: roleFilterItems.value.map((r) => ({ label: r.title, value: r.value })),
}))
const roleFilter = ref<string[]>([])
const productFilterItems = (Object.keys(PRODUCT_META) as ProductKey[]).map(p => ({ title: PRODUCT_META[p].label, value: p }))

const activeFilterEntries = computed(() => {
  const entries: { key: string; label: string }[] = []
  if (roleFilter.value.length) {
    const names = roleFilter.value.map(id => rbac.roleById(id)?.name ?? '').filter(Boolean)
    entries.push({ key: 'role', label: `Role: ${names.join(', ')}` })
  }
  if (filters.value.product) entries.push({ key: 'product', label: `Product: ${PRODUCT_META[filters.value.product].short}` })
  return entries
})

function removeFilter(key: string) {
  if (key === 'role') {
    roleFilter.value = []
    return
  }
  filters.value[key as keyof typeof filters.value] = null
}

function clearAllFilters() {
  roleFilter.value = []
  filters.value = { product: null }
}

interface UserRow extends UserAccount {
  roleNames: string
  selectable: boolean
}

const filteredUsers = computed<UserRow[]>(() =>
  rbac.users
    .filter((u) => {
      if (statusTab.value !== 'all' && u.status !== statusTab.value) return false
      if (roleFilter.value.length && !u.roleIds.some(id => roleFilter.value.includes(id))) return false
      if (filters.value.product && !rbac.productAccessSummary(u.id).some(a => a.product === filters.value.product)) return false
      return true
    })
    .map(u => ({
      ...u,
      roleNames: u.roleIds.map(id => rbac.roleById(id)?.name ?? '').join(', '),
      selectable: !u.isOwner,
    })),
)

// Table
const headers = [
  { title: 'User', key: 'name', sortable: true },
  { title: 'Roles', key: 'roleNames', sortable: false },
  { title: 'Products', key: 'products', sortable: false, hideBelow: 'md' as const },
  { title: 'Status', key: 'status' },
  { title: 'Last active', key: 'lastActiveAt', align: 'end' as const, hideBelow: 'lg' as const },
  { title: '', key: 'actions', align: 'end' as const, sortable: false, width: '48px' },
]
const hiddenColumns = ref<string[]>([])
const { visibleHeaders } = useResponsiveTableHeaders(headers, hiddenColumns)

function roleChips(user: UserAccount) {
  const names = user.roleIds.map(id => rbac.roleById(id)?.name ?? '').filter(Boolean)
  return { visible: names.slice(0, 2), overflow: names.slice(2) }
}

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const toast = useToast()
function notify(text: string) {
  toast.info(text)
}

// Invite + access drawers
const inviteDrawer = ref(false)
const accessDrawer = ref(false)
const accessUserId = ref<string | null>(null)

function openAccess(userId: string) {
  accessUserId.value = userId
  accessDrawer.value = true
}

function onInvited(emails: string[]) {
  notify(`Invitation${emails.length === 1 ? '' : 's'} sent to ${emails.length === 1 ? emails[0] : `${emails.length} people`}`)
}

function handleRowClick(event: MouseEvent, payload: { item: unknown }) {
  const target = event.target as HTMLElement | null
  if (target?.closest('button, a, input, [role="button"], .v-selection-control, .v-overlay')) return
  const item = payload.item as UserRow
  if (item.id) openAccess(item.id)
}

// Invitation actions
function resend(userId: string) {
  const user = rbac.userById(userId)
  rbac.resendInvite(userId)
  notify(`Invitation resent to ${user?.email}`)
}

const revokeDialog = ref(false)
const revokeTarget = ref<UserAccount | null>(null)

function askRevoke(user: UserAccount) {
  revokeTarget.value = user
  revokeDialog.value = true
}

function confirmRevoke() {
  if (!revokeTarget.value) return
  rbac.revokeInvite(revokeTarget.value.id)
  notify(`Invitation for ${revokeTarget.value.email} revoked`)
  revokeTarget.value = null
}

// Status + remove
function setStatus(user: UserAccount, status: 'active' | 'deactivated') {
  rbac.setUserStatus(user.id, status)
  notify(status === 'active' ? `${user.name} reactivated` : `${user.name} deactivated`)
}

const removeDialog = ref(false)
const removeTarget = ref<UserAccount | null>(null)
const bulkRemove = ref(false)

function askRemoveRow(user: UserAccount) {
  removeTarget.value = user
  bulkRemove.value = false
  removeDialog.value = true
}

function askRemoveBulk() {
  removeTarget.value = null
  bulkRemove.value = true
  removeDialog.value = true
}

const removeMessage = computed(() =>
  bulkRemove.value
    ? `Remove ${selected.value.length} selected user${selected.value.length === 1 ? '' : 's'} from this account? They lose access immediately. This cannot be undone.`
    : `Remove ${removeTarget.value?.name} from this account? They lose access immediately. This cannot be undone.`,
)

function confirmRemove() {
  if (bulkRemove.value) {
    const count = selected.value.length
    for (const id of [...selected.value]) rbac.removeUser(id)
    selected.value = []
    notify(`${count} user${count === 1 ? '' : 's'} removed`)
  } else if (removeTarget.value) {
    rbac.removeUser(removeTarget.value.id)
    notify(`${removeTarget.value.name} removed`)
  }
  removeTarget.value = null
  bulkRemove.value = false
  accessDrawer.value = false
}

function onRequestRemove(userId: string) {
  const user = rbac.userById(userId)
  if (user) askRemoveRow(user)
}

// Bulk actions
const selectedUsers = computed(() => selected.value.map(id => rbac.userById(id)).filter((u): u is UserAccount => Boolean(u)))
const selectedInvited = computed(() => selectedUsers.value.filter(u => u.status === 'invited'))
const selectedActive = computed(() => selectedUsers.value.filter(u => u.status === 'active'))

const bulkAssignGroups = computed(() => rbac.assignableRoles.filter(g => !g.locked))

function selectAll() {
  selected.value = filteredUsers.value.filter(u => u.selectable).map(u => u.id)
}

function bulkAssignRole(roleId: string) {
  const changed = rbac.addRoleToUsers([...selected.value], roleId)
  const role = rbac.roleById(roleId)
  notify(changed > 0
    ? `${role?.name} added to ${changed} user${changed === 1 ? '' : 's'}`
    : 'No users updated — role already assigned or conflicts')
}

function bulkResend() {
  for (const user of selectedInvited.value) rbac.resendInvite(user.id)
  notify(`Invitation${selectedInvited.value.length === 1 ? '' : 's'} resent to ${selectedInvited.value.length} user${selectedInvited.value.length === 1 ? '' : 's'}`)
}

function bulkDeactivate() {
  const count = selectedActive.value.length
  for (const user of selectedActive.value) rbac.setUserStatus(user.id, 'deactivated')
  selected.value = []
  notify(`${count} user${count === 1 ? '' : 's'} deactivated`)
}
</script>

<template>
  <div class="settings-page d-flex flex-column gap-4">
    <MpPageHeader
      :level="2"
      density="compact"
      title="Users"
      :subtitle="`${rbac.usersByStatus.all} members · Invite people and manage their roles across products.`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="user-plus" class="text-none" @click="inviteDrawer = true">
          Invite users
        </v-btn>
      </template>
    </MpPageHeader>

    <MpFilterTabs v-model="statusTab" :tabs="tabs" aria-label="Filter users by status" controls-id="users-table" />

    <v-card id="users-table" variant="flat" border rounded="lg" class="d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:quick-filter-value="roleFilter"
        :quick-filter="roleQuickFilter"
        v-model:search="search"
        v-model:hidden-columns="hiddenColumns"
        search-placeholder="Search name, email, or role"
        :headers="headers"
        :active-filters="activeFilterEntries"
        :total-count="filteredUsers.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <v-select
            v-model="filters.product"
            label="Product access"
            :items="productFilterItems"
            clearable
          />
        </template>
      </MpDataTableToolbar>

      <MpTableSkeleton v-if="loading" :rows="8" :columns="6" />

      <v-data-table
        v-else
        v-model="selected"
        :headers="visibleHeaders"
        :items="filteredUsers"
        :search="search"
        item-value="id"
        item-selectable="selectable"
        show-select
        hover
        density="comfortable"
        :items-per-page="15"
        fixed-header
        class="users-table"
        @click:row="handleRowClick"
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar color="primary" variant="tonal" size="34" class="mr-3 font-weight-bold text-caption">
              {{ (item as UserRow).avatar }}
            </v-avatar>
            <div class="user-identity">
              <div class="user-identity__name">
                {{ (item as UserRow).name }}
                <v-tooltip v-if="(item as UserRow).isOwner" location="top" text="Account owner — full access, protected from changes">
                  <template #activator="{ props: tipProps }">
                    <v-icon v-bind="tipProps" size="16" color="primary">shield-check</v-icon>
                  </template>
                </v-tooltip>
              </div>
              <div class="user-identity__email">{{ (item as UserRow).email }}</div>
            </div>
          </div>
        </template>

        <template v-slot:item.roleNames="{ item }">
          <div class="d-flex align-center gap-1 text-no-wrap">
            <v-chip
              v-for="name in roleChips(item as UserRow).visible"
              :key="name"
              size="x-small"
              variant="tonal"
              color="secondary"
            >
              {{ name }}
            </v-chip>
            <v-tooltip
              v-if="roleChips(item as UserRow).overflow.length"
              location="top"
              :text="roleChips(item as UserRow).overflow.join(', ')"
            >
              <template #activator="{ props: tipProps }">
                <v-chip v-bind="tipProps" size="x-small" variant="outlined">+{{ roleChips(item as UserRow).overflow.length }}</v-chip>
              </template>
            </v-tooltip>
          </div>
        </template>

        <template v-slot:item.products="{ item }">
          <div class="d-flex align-center gap-1">
            <v-tooltip
              v-for="entry in rbac.productAccessSummary((item as UserRow).id)"
              :key="entry.product"
              location="top"
              :text="entry.entitled ? entry.label : `${entry.label} — not in this account's subscription`"
            >
              <template #activator="{ props: tipProps }">
                <span
                  v-bind="tipProps"
                  class="product-dot"
                  :class="[`product-dot--${entry.product}`, { 'product-dot--locked': !entry.entitled }]"
                  role="img"
                  :aria-label="entry.label"
                >
                  <v-icon size="16">{{ entry.entitled ? PRODUCT_ICONS[entry.product] : 'lock' }}</v-icon>
                </span>
              </template>
            </v-tooltip>
          </div>
        </template>

        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="statusLabel((item as UserRow).status)" type="general" size="sm" />
        </template>

        <template v-slot:item.lastActiveAt="{ item }">
          <span class="text-body-2 text-medium-emphasis text-no-wrap">
            {{ (item as UserRow).status === 'invited'
              ? `Invite sent ${formatAgo((item as UserRow).invitedAt)}`
              : formatAgo((item as UserRow).lastActiveAt) }}
          </span>
        </template>

        <template v-slot:item.actions="{ item }">
          <span @click.stop>
            <MpRowActionsMenu ariaLabel="User actions" :itemLabel="(item as UserRow).name">
              <MpMenuItem icon="user-cog" title="Manage access" @click="openAccess((item as UserRow).id)" />
              <template v-if="!(item as UserRow).isOwner">
                <template v-if="(item as UserRow).status === 'invited'">
                  <MpMenuItem icon="send" title="Resend invite" @click="resend((item as UserRow).id)" />
                  <MpMenuItem icon="mail-x" title="Revoke invite" @click="askRevoke(item as UserRow)" />
                </template>
                <MpMenuItem
                  v-else-if="(item as UserRow).status === 'active'"
                  icon="pause"
                  title="Deactivate"
                  @click="setStatus(item as UserRow, 'deactivated')"
                />
                <MpMenuItem
                  v-else
                  icon="play"
                  title="Reactivate"
                  @click="setStatus(item as UserRow, 'active')"
                />
                <v-divider class="my-1" />
                <MpMenuItem icon="trash-2" title="Remove" danger @click="askRemoveRow(item as UserRow)" />
              </template>
            </MpRowActionsMenu>
          </span>
        </template>

        <template #no-data>
          <MpEmptyState
            v-if="search || activeFilterEntries.length || statusTab !== 'all'"
            emphasis="prominent"
            illustration="no-results"
            title="No users match"
            description="Try a different search, status tab, or filter."
          />
          <MpEmptyState
            v-else
            icon="users"
            title="No users yet"
            description="Invite your team and assign roles to control what each person can see and do."
            action-label="Invite users"
            action-icon="user-plus"
            @action="inviteDrawer = true"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpFloatingBulkBar
      :count="selected.length"
      :total="filteredUsers.filter(u => u.selectable).length"
      @clear="selected = []"
      @select-all="selectAll"
    >
      <!-- The trigger sits in the floating bottom bulk bar — open upward, away
           from the viewport edge. -->
      <v-menu location="top">
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps" variant="flat" size="small" class="text-none" prepend-icon="user-cog" rounded="lg" color="surface">
            Assign role
          </v-btn>
        </template>
        <v-list density="compact" role="menu" aria-label="Assign role">
          <template v-for="group in bulkAssignGroups" :key="group.product">
            <v-list-subheader>{{ group.label }}</v-list-subheader>
            <MpMenuItem v-for="role in group.roles" :key="role.id" :title="role.name" @click="bulkAssignRole(role.id)" />
          </template>
        </v-list>
      </v-menu>
      <v-btn
        variant="flat"
        size="small"
        class="text-none"
        prepend-icon="send"
        rounded="lg"
        color="surface"
        :disabled="selectedInvited.length === 0"
        @click="bulkResend"
      >
        Resend invites
      </v-btn>
      <v-btn
        variant="flat"
        size="small"
        class="text-none"
        prepend-icon="pause"
        rounded="lg"
        color="surface"
        :disabled="selectedActive.length === 0"
        @click="bulkDeactivate"
      >
        Deactivate
      </v-btn>
      <v-btn variant="flat" size="small" class="text-none" prepend-icon="trash-2" rounded="lg" color="error" @click="askRemoveBulk">
        Remove
      </v-btn>
    </MpFloatingBulkBar>

    <InviteUsersDrawer v-model="inviteDrawer" @invited="onInvited" />

    <UserAccessDrawer
      v-model="accessDrawer"
      :user-id="accessUserId"
      @notify="notify"
      @request-remove="onRequestRemove"
    />

    <MpConfirmDialog
      v-model="removeDialog"
      title="Remove user?"
      :message="removeMessage"
      confirm-label="Remove"
      danger
      @confirm="confirmRemove"
    />

    <MpConfirmDialog
      v-model="revokeDialog"
      title="Revoke invitation?"
      :message="`Revoke the pending invitation for ${revokeTarget?.email}? The sign-up link stops working immediately.`"
      confirm-label="Revoke"
      danger
      @confirm="confirmRevoke"
    />
  </div>
</template>

<style scoped lang="scss">
.settings-page {
  max-width: 980px;
}

.users-table :deep(thead th) {
  white-space: nowrap;
}

.users-table :deep(tbody tr) {
  cursor: pointer;
}

.user-identity__name {
  display: flex;
  align-items: center;
  gap: var(--mp-space-4);
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
  white-space: nowrap;
}

.user-identity__email {
  font-size: var(--mp-fontSize-12);
  color: var(--muted);
}

/* 24px disc around a 16px row icon (recipe D1). */
.product-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-24);
  height: var(--mp-space-24);
  border-radius: var(--mp-radius-full);
  border: 1px solid var(--border-subtle);
  background: var(--surface-primary);
  color: var(--text-primary);
}

.product-dot--marketing { color: var(--cloud-marketing-text); }
.product-dot--service { color: var(--cloud-service-text); }
.product-dot--commerce { color: var(--cloud-commerce-text); }

.product-dot--locked {
  color: var(--muted);
}

.product-dot :deep(.v-icon) {
  color: currentColor;
}
</style>
