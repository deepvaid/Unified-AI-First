import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAccountsStore } from '@/stores/useAccounts'
import {
  ACCESS_DENIED_COPY,
  PRODUCT_META,
  PRODUCT_ORDER,
  ROLE_OWNER_ID,
  SEED_EVENTS,
  SEED_ROLES,
  SEED_USERS,
  expandWithDependencies,
  type AuditEvent,
  type CommerceScope,
  type ProductKey,
  type Role,
  type UserAccount,
  type UserStatus,
} from '@/stores/rbacData'

export interface AssignableRoleGroup {
  product: ProductKey
  label: string
  short: string
  locked: boolean
  provisional: boolean
  roles: Role[]
}

export interface AssignmentValidation {
  ok: boolean
  conflicts: { a: Role; b: Role }[]
  missingSubscriptions: ProductKey[]
}

export const useRbacStore = defineStore('rbac', () => {
  const accounts = useAccountsStore()

  const users = ref<UserAccount[]>(SEED_USERS.map(u => ({ ...u, roleIds: [...u.roleIds] })))
  const roles = ref<Role[]>(SEED_ROLES.map(r => ({ ...r, permissionIds: [...r.permissionIds] })))
  const events = ref<AuditEvent[]>([...SEED_EVENTS])

  /** The signed-in admin performing every action in this prototype. */
  const currentUserId = ref('user-1')
  const currentUser = computed(() => users.value.find(u => u.id === currentUserId.value))

  let nextId = 100

  /* ── Lookups ─────────────────────────────────────────────── */

  function userById(id: string): UserAccount | undefined {
    return users.value.find(u => u.id === id)
  }

  function roleById(id: string): Role | undefined {
    return roles.value.find(r => r.id === id)
  }

  const usersByStatus = computed(() => {
    const counts: Record<UserStatus | 'all', number> = { all: users.value.length, active: 0, invited: 0, deactivated: 0 }
    for (const u of users.value) counts[u.status] += 1
    return counts
  })

  /** Counts every holder of a role, including deactivated users (they keep roles for reactivation). */
  const roleUsage = computed(() => {
    const usage: Record<string, number> = {}
    for (const u of users.value) {
      for (const id of u.roleIds) usage[id] = (usage[id] ?? 0) + 1
    }
    return usage
  })

  function effectivePermissions(userId: string): Set<string> {
    const user = userById(userId)
    const out = new Set<string>()
    if (!user) return out
    for (const roleId of user.roleIds) {
      for (const pid of roleById(roleId)?.permissionIds ?? []) out.add(pid)
    }
    return out
  }

  function productAccessSummary(userId: string): { product: ProductKey; label: string; short: string; entitled: boolean }[] {
    const granted = effectivePermissions(userId)
    return PRODUCT_ORDER
      .filter(product => [...granted].some(pid => pid.startsWith(`${product}.`)))
      .map(product => ({
        product,
        label: PRODUCT_META[product].label,
        short: PRODUCT_META[product].short,
        entitled: productEntitled(product),
      }))
  }

  function productEntitled(product: ProductKey): boolean {
    const subscription = PRODUCT_META[product].subscription
    return !subscription || accounts.hasSubscription(subscription)
  }

  /** Roles grouped for pickers: Global first, then products; unsubscribed groups locked; Owner excluded. */
  const assignableRoles = computed<AssignableRoleGroup[]>(() =>
    PRODUCT_ORDER.map(product => ({
      product,
      label: PRODUCT_META[product].label,
      short: PRODUCT_META[product].short,
      locked: !productEntitled(product),
      provisional: PRODUCT_META[product].provisional ?? false,
      roles: roles.value.filter(r => r.product === product && r.id !== ROLE_OWNER_ID),
    })),
  )

  const sortedEvents = computed(() =>
    [...events.value].sort((a, b) => b.at.localeCompare(a.at)),
  )

  /* ── Plan tier (custom-role gating) ──────────────────────── */

  // DEMO HEURISTIC, not real billing logic: the account's subscription count
  // stands in for its plan tier so switching accounts demos every gate state.
  const planTier = computed<'starter' | 'professional' | 'enterprise'>(() => {
    const n = accounts.activeAccount?.subscriptions.length ?? 0
    return n >= 5 ? 'enterprise' : n >= 2 ? 'professional' : 'starter'
  })

  const customRoles = computed(() => roles.value.filter(r => !r.system))
  const customRoleLimit = computed(() =>
    planTier.value === 'enterprise' ? Number.POSITIVE_INFINITY : planTier.value === 'professional' ? 3 : 0,
  )
  const canCreateCustomRole = computed(() => customRoles.value.length < customRoleLimit.value)

  /* ── Validation ──────────────────────────────────────────── */

  function validateAssignment(roleIds: string[]): AssignmentValidation {
    const picked = roleIds.map(roleById).filter((r): r is Role => Boolean(r))
    const conflicts: { a: Role; b: Role }[] = []
    for (const role of picked) {
      for (const otherId of role.conflictsWith ?? []) {
        const other = picked.find(r => r.id === otherId)
        if (other && !conflicts.some(c => (c.a === other && c.b === role))) {
          conflicts.push({ a: role, b: other })
        }
      }
    }
    const missingSubscriptions = [...new Set(picked.map(r => r.product))].filter(p => !productEntitled(p))
    return { ok: conflicts.length === 0, conflicts, missingSubscriptions }
  }

  /* ── Audit ───────────────────────────────────────────────── */

  function logEvent(e: Omit<AuditEvent, 'id' | 'at' | 'actorId' | 'actorName'>) {
    events.value.unshift({
      id: `evt-${nextId++}`,
      at: new Date().toISOString(),
      actorId: currentUserId.value,
      actorName: currentUser.value?.name ?? 'Unknown',
      ...e,
    })
  }

  /* ── User actions ────────────────────────────────────────── */

  function inviteUsers(payload: { emails: string[]; roleIds: string[]; commerceScope?: CommerceScope }): UserAccount[] {
    const roleNames = payload.roleIds.map(id => roleById(id)?.name).filter(Boolean).join(', ')
    const created: UserAccount[] = []
    for (const email of payload.emails) {
      const name = email.split('@')[0] ?? email
      const user: UserAccount = {
        id: `user-${nextId++}`,
        name,
        email,
        avatar: name.slice(0, 2).toUpperCase(),
        roleIds: [...payload.roleIds],
        status: 'invited',
        invitedAt: new Date().toISOString(),
        invitedBy: currentUser.value?.name,
        commerceScope: payload.commerceScope ? { ...payload.commerceScope, locationIds: [...payload.commerceScope.locationIds] } : undefined,
      }
      users.value.push(user)
      created.push(user)
      logEvent({
        action: 'user.invited',
        targetType: 'user',
        targetId: user.id,
        targetLabel: user.name,
        summary: `Invited ${email} with ${roleNames || 'no roles'}`,
      })
    }
    return created
  }

  function resendInvite(userId: string) {
    const user = userById(userId)
    if (!user || user.status !== 'invited') return
    user.invitedAt = new Date().toISOString()
    user.invitedBy = currentUser.value?.name
    logEvent({ action: 'user.invite_resent', targetType: 'user', targetId: user.id, targetLabel: user.name, summary: `Resent the invitation to ${user.email}` })
  }

  function revokeInvite(userId: string) {
    const user = userById(userId)
    if (!user || user.status !== 'invited') return
    users.value = users.value.filter(u => u.id !== userId)
    logEvent({ action: 'user.invite_revoked', targetType: 'user', targetId: user.id, targetLabel: user.name, summary: `Revoked the pending invitation for ${user.email}` })
  }

  function assignRoles(userId: string, roleIds: string[], commerceScope?: CommerceScope): { ok: boolean; error?: string } {
    const user = userById(userId)
    if (!user) return { ok: false, error: 'User not found.' }
    if (user.isOwner) return { ok: false, error: 'The account owner’s access can’t be changed.' }
    const validation = validateAssignment(roleIds)
    if (!validation.ok) {
      const { a, b } = validation.conflicts[0]!
      return { ok: false, error: `${a.name} can’t be combined with ${b.name}.` }
    }
    user.roleIds = [...roleIds]
    user.commerceScope = commerceScope ? { ...commerceScope, locationIds: [...commerceScope.locationIds] } : undefined
    const roleNames = roleIds.map(id => roleById(id)?.name).filter(Boolean).join(', ')
    logEvent({ action: 'user.roles_changed', targetType: 'user', targetId: user.id, targetLabel: user.name, summary: `Updated roles to ${roleNames || 'none'}` })
    return { ok: true }
  }

  function addRoleToUsers(userIds: string[], roleId: string): number {
    const role = roleById(roleId)
    if (!role || roleId === ROLE_OWNER_ID) return 0
    let changed = 0
    for (const id of userIds) {
      const user = userById(id)
      if (!user || user.isOwner || user.roleIds.includes(roleId)) continue
      if (!validateAssignment([...user.roleIds, roleId]).ok) continue
      user.roleIds.push(roleId)
      changed += 1
    }
    if (changed > 0) {
      logEvent({
        action: 'user.roles_changed',
        targetType: 'user',
        targetId: userIds[0] ?? '',
        targetLabel: `${changed} user${changed === 1 ? '' : 's'}`,
        summary: `Added ${role.name} to ${changed} user${changed === 1 ? '' : 's'}`,
        product: role.product,
      })
    }
    return changed
  }

  function setUserStatus(userId: string, status: 'active' | 'deactivated') {
    const user = userById(userId)
    if (!user || user.isOwner || user.status === status) return
    user.status = status
    logEvent({
      action: status === 'active' ? 'user.reactivated' : 'user.deactivated',
      targetType: 'user',
      targetId: user.id,
      targetLabel: user.name,
      summary: status === 'active' ? 'Reactivated account' : 'Deactivated account — access suspended, roles retained',
    })
  }

  function removeUser(userId: string) {
    const user = userById(userId)
    if (!user || user.isOwner) return
    users.value = users.value.filter(u => u.id !== userId)
    logEvent({ action: 'user.removed', targetType: 'user', targetId: user.id, targetLabel: user.name, summary: `Removed ${user.email} from the account` })
  }

  /* ── Role actions ────────────────────────────────────────── */

  function createRole(payload: { name: string; description: string; product: ProductKey; permissionIds: string[] }): Role | null {
    if (!canCreateCustomRole.value) return null
    const role: Role = {
      id: `role-custom-${nextId++}`,
      name: payload.name,
      description: payload.description,
      product: payload.product,
      system: false,
      permissionIds: expandWithDependencies(payload.permissionIds),
      updatedAt: new Date().toISOString(),
    }
    roles.value.push(role)
    logEvent({ action: 'role.created', targetType: 'role', targetId: role.id, targetLabel: role.name, summary: 'Created custom role from scratch', product: role.product })
    return role
  }

  function duplicateRole(roleId: string, name?: string): Role | null {
    const source = roleById(roleId)
    if (!source || !canCreateCustomRole.value) return null
    const role: Role = {
      id: `role-custom-${nextId++}`,
      name: name ?? `Copy of ${source.name}`,
      description: source.description,
      product: source.product,
      system: false,
      baseRoleId: source.system ? source.id : (source.baseRoleId ?? source.id),
      permissionIds: [...source.permissionIds],
      updatedAt: new Date().toISOString(),
    }
    roles.value.push(role)
    logEvent({ action: 'role.duplicated', targetType: 'role', targetId: role.id, targetLabel: role.name, summary: `Duplicated from ${source.name}`, product: role.product })
    return role
  }

  function updateRole(roleId: string, patch: Partial<Pick<Role, 'name' | 'description' | 'permissionIds'>>): boolean {
    const role = roleById(roleId)
    if (!role || role.system) return false
    if (patch.name !== undefined) role.name = patch.name
    if (patch.description !== undefined) role.description = patch.description
    if (patch.permissionIds !== undefined) role.permissionIds = expandWithDependencies(patch.permissionIds)
    role.updatedAt = new Date().toISOString()
    logEvent({ action: 'role.updated', targetType: 'role', targetId: role.id, targetLabel: role.name, summary: 'Updated role details and permissions', product: role.product })
    return true
  }

  function deleteRole(roleId: string): { ok: boolean; blockedBy?: number } {
    const role = roleById(roleId)
    if (!role || role.system) return { ok: false }
    const usage = roleUsage.value[roleId] ?? 0
    if (usage > 0) return { ok: false, blockedBy: usage }
    roles.value = roles.value.filter(r => r.id !== roleId)
    logEvent({ action: 'role.deleted', targetType: 'role', targetId: role.id, targetLabel: role.name, summary: 'Deleted custom role', product: role.product })
    return { ok: true }
  }

  return {
    users, roles, events, currentUserId, currentUser,
    userById, roleById, usersByStatus, roleUsage,
    effectivePermissions, productAccessSummary, productEntitled,
    assignableRoles, sortedEvents,
    planTier, customRoles, customRoleLimit, canCreateCustomRole,
    validateAssignment, logEvent,
    inviteUsers, resendInvite, revokeInvite, assignRoles, addRoleToUsers, setUserStatus, removeUser,
    createRole, duplicateRole, updateRole, deleteRole,
  }
})

export { ACCESS_DENIED_COPY }
