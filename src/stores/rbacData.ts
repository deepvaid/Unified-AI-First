import type { SubscriptionKey } from '@/stores/useAccounts'

/* ── Products ─────────────────────────────────────────────────── */

export type ProductKey = 'platform' | 'marketing' | 'service' | 'commerce'

export interface ProductMeta {
  label: string
  short: string
  /** Subscription that unlocks this product's roles; platform roles are always available. */
  subscription?: SubscriptionKey
  /** MCC permission catalog is still WIP on the product side — surfaced in the UI. */
  provisional?: boolean
}

export const PRODUCT_ORDER: ProductKey[] = ['platform', 'marketing', 'service', 'commerce']

export const PRODUCT_META: Record<ProductKey, ProductMeta> = {
  platform:  { label: 'Core Platform',          short: 'Global' },
  marketing: { label: 'Marketing Cloud (MMC)',  short: 'MMC', subscription: 'marketing' },
  service:   { label: 'Service Cloud (MSC)',    short: 'MSC', subscription: 'service' },
  commerce:  { label: 'Commerce Cloud (MCC)',   short: 'MCC', subscription: 'commerce', provisional: true },
}

/* ── Permission catalog ───────────────────────────────────────── */

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'manage'

export const ACTION_LABELS: Record<PermissionAction, string> = {
  view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete', manage: 'Manage',
}

export interface Permission {
  /** `${product}.${module}.${action}` — globally unique. */
  id: string
  action: PermissionAction
  /** Overrides the generic action label for named permissions. */
  label?: string
  /** Permission ids that must also be granted (dependency rules). */
  requires?: string[]
}

export interface PermissionModule {
  id: string
  label: string
  permissions: Permission[]
}

export interface PermissionProduct {
  key: ProductKey
  modules: PermissionModule[]
}

function perms(
  product: ProductKey,
  moduleId: string,
  actions: PermissionAction[],
  labels: Partial<Record<PermissionAction, string>> = {},
): Permission[] {
  const prefix = `${product}.${moduleId}`
  return actions.map((action) => {
    const requires =
      action === 'view'
        ? undefined
        : action === 'manage'
          ? [actions.includes('edit') ? `${prefix}.edit` : `${prefix}.view`]
          : [`${prefix}.view`]
    return { id: `${prefix}.${action}`, action, label: labels[action], requires }
  })
}

export const PERMISSION_CATALOG: PermissionProduct[] = [
  {
    key: 'platform',
    modules: [
      { id: 'account',    label: 'Account & Billing',    permissions: perms('platform', 'account', ['view', 'manage'], { manage: 'Manage billing & plan' }) },
      { id: 'users',      label: 'Users & Roles',        permissions: perms('platform', 'users', ['view', 'create', 'manage'], { create: 'Invite users', manage: 'Manage roles & access' }) },
      { id: 'audit',      label: 'Audit Log',            permissions: perms('platform', 'audit', ['view']) },
      { id: 'dashboards', label: 'Reports & Dashboards', permissions: perms('platform', 'dashboards', ['view']) },
    ],
  },
  {
    key: 'marketing',
    modules: [
      { id: 'campaigns',    label: 'Campaigns',             permissions: perms('marketing', 'campaigns', ['view', 'create', 'edit', 'delete', 'manage'], { manage: 'Manage sending & SMS settings' }) },
      { id: 'journeys',     label: 'Journeys',              permissions: perms('marketing', 'journeys', ['view', 'create', 'edit', 'manage'], { manage: 'Activate & pause journeys' }) },
      { id: 'audience',     label: 'Audience & Contacts',   permissions: perms('marketing', 'audience', ['view', 'create', 'edit', 'delete', 'manage'], { manage: 'Manage lists & segments' }) },
      { id: 'content',      label: 'Content & Assets',      permissions: perms('marketing', 'content', ['view', 'create', 'edit', 'delete']) },
      { id: 'acquisition',  label: 'Forms & Landing Pages', permissions: perms('marketing', 'acquisition', ['view', 'create', 'edit', 'manage'], { manage: 'Publish forms & pages' }) },
      { id: 'analytics',    label: 'Marketing Analytics',   permissions: perms('marketing', 'analytics', ['view', 'manage'], { manage: 'Export reports' }) },
      { id: 'integrations', label: 'Integrations',          permissions: perms('marketing', 'integrations', ['view', 'manage'], { manage: 'Connect & configure apps' }) },
      { id: 'api',          label: 'API & Settings',        permissions: perms('marketing', 'api', ['view', 'manage'], { manage: 'Manage API keys & tokens' }) },
    ],
  },
  {
    key: 'service',
    modules: [
      { id: 'tickets',      label: 'Tickets',          permissions: perms('service', 'tickets', ['view', 'create', 'edit', 'delete', 'manage'], { manage: 'Assign & escalate' }) },
      { id: 'templates',    label: 'Templates & Tags', permissions: perms('service', 'templates', ['view', 'create', 'edit', 'delete']) },
      { id: 'agents',       label: 'Service Users',    permissions: perms('service', 'agents', ['view', 'manage'], { manage: 'Manage agent access' }) },
      { id: 'integrations', label: 'Integrations',     permissions: perms('service', 'integrations', ['view', 'manage'], { manage: 'Connect & configure apps' }) },
    ],
  },
  {
    key: 'commerce',
    modules: [
      { id: 'orders',      label: 'Orders',         permissions: perms('commerce', 'orders', ['view', 'create', 'edit', 'manage'], { manage: 'Refunds & cancellations' }) },
      { id: 'products',    label: 'Products',       permissions: perms('commerce', 'products', ['view', 'create', 'edit', 'delete']) },
      { id: 'inventory',   label: 'Inventory',      permissions: perms('commerce', 'inventory', ['view', 'edit']) },
      { id: 'fulfillment', label: 'Fulfillment',    permissions: perms('commerce', 'fulfillment', ['view', 'manage'], { manage: 'Manage fulfillment workflows' }) },
      { id: 'settings',    label: 'Store Settings', permissions: perms('commerce', 'settings', ['view', 'manage'], { manage: 'Manage store configuration' }) },
    ],
  },
]

/* ── Derived catalog indexes ──────────────────────────────────── */

export interface PermissionInfo extends Permission {
  product: ProductKey
  moduleId: string
  moduleLabel: string
}

export const PERMISSION_INDEX: Record<string, PermissionInfo> = {}
/** Reverse dependency map: which permissions require this one. */
export const REQUIRED_BY: Record<string, string[]> = {}

for (const product of PERMISSION_CATALOG) {
  for (const mod of product.modules) {
    for (const p of mod.permissions) {
      PERMISSION_INDEX[p.id] = { ...p, product: product.key, moduleId: mod.id, moduleLabel: mod.label }
      for (const req of p.requires ?? []) {
        ;(REQUIRED_BY[req] ??= []).push(p.id)
      }
    }
  }
}

export function productPermissionIds(key: ProductKey): string[] {
  const product = PERMISSION_CATALOG.find(p => p.key === key)
  return product ? product.modules.flatMap(m => m.permissions.map(p => p.id)) : []
}

export function permissionLabel(id: string): string {
  const info = PERMISSION_INDEX[id]
  if (!info) return id
  return info.label ?? `${ACTION_LABELS[info.action]} ${info.moduleLabel.toLowerCase()}`
}

/** Grants closed over their dependency requirements. */
export function expandWithDependencies(ids: string[]): string[] {
  const out = new Set<string>()
  const visit = (id: string) => {
    if (out.has(id)) return
    out.add(id)
    for (const req of PERMISSION_INDEX[id]?.requires ?? []) visit(req)
  }
  ids.forEach(visit)
  return [...out]
}

/* ── Roles ────────────────────────────────────────────────────── */

export interface Role {
  id: string
  name: string
  description: string
  /** 'platform' = global role, otherwise product-specific. */
  product: ProductKey
  /** System roles are created by Platform and are non-editable; duplicate to customize. */
  system: boolean
  /** Set when the role was duplicated from another role. */
  baseRoleId?: string
  permissionIds: string[]
  /** Roles that cannot be held together with this one. */
  conflictsWith?: string[]
  updatedAt: string
}

export const ROLE_OWNER_ID = 'role-owner'

const ALL_PERMISSION_IDS = PRODUCT_ORDER.flatMap(productPermissionIds)

export const SEED_ROLES: Role[] = [
  // Global system roles
  {
    id: ROLE_OWNER_ID,
    name: 'Account Owner',
    description: 'Full account control including user management, role assignment, billing, and platform configuration.',
    product: 'platform',
    system: true,
    permissionIds: [...ALL_PERMISSION_IDS],
    updatedAt: '2026-05-02T10:00:00Z',
  },
  {
    id: 'role-platform-admin',
    name: 'Platform Admin',
    description: 'Administrative access across all products except ownership and billing-level controls.',
    product: 'platform',
    system: true,
    permissionIds: ALL_PERMISSION_IDS.filter(id => id !== 'platform.account.manage'),
    conflictsWith: ['role-analyst'],
    updatedAt: '2026-05-02T10:00:00Z',
  },
  {
    id: 'role-analyst',
    name: 'Read-Only Analyst',
    description: 'View-only access to reports and dashboards across enabled products.',
    product: 'platform',
    system: true,
    permissionIds: ['platform.dashboards.view', 'marketing.analytics.view'],
    conflictsWith: ['role-platform-admin', 'role-mmc-admin'],
    updatedAt: '2026-05-02T10:00:00Z',
  },

  // MMC system roles
  {
    id: 'role-mmc-admin',
    name: 'MMC Admin',
    description: 'Access to all Marketing Cloud modules, settings, and user management.',
    product: 'marketing',
    system: true,
    permissionIds: [...productPermissionIds('marketing'), 'platform.users.view', 'platform.users.create', 'platform.users.manage'],
    conflictsWith: ['role-analyst'],
    updatedAt: '2026-05-02T10:00:00Z',
  },
  {
    id: 'role-mmc-marketing-manager',
    name: 'Marketing Manager',
    description: 'Campaigns, journeys, analytics, audience, content, and API settings.',
    product: 'marketing',
    system: true,
    permissionIds: [
      'marketing.campaigns.view', 'marketing.campaigns.create', 'marketing.campaigns.edit', 'marketing.campaigns.delete', 'marketing.campaigns.manage',
      'marketing.journeys.view', 'marketing.journeys.create', 'marketing.journeys.edit', 'marketing.journeys.manage',
      'marketing.audience.view', 'marketing.audience.create', 'marketing.audience.edit',
      'marketing.content.view', 'marketing.content.create', 'marketing.content.edit', 'marketing.content.delete',
      'marketing.analytics.view', 'marketing.analytics.manage',
      'marketing.api.view', 'marketing.api.manage',
    ],
    updatedAt: '2026-05-02T10:00:00Z',
  },
  {
    id: 'role-mmc-audience-manager',
    name: 'Audience Manager',
    description: 'Complete audience module plus data journeys.',
    product: 'marketing',
    system: true,
    permissionIds: [
      'marketing.audience.view', 'marketing.audience.create', 'marketing.audience.edit', 'marketing.audience.delete', 'marketing.audience.manage',
      'marketing.journeys.view',
    ],
    updatedAt: '2026-05-02T10:00:00Z',
  },
  {
    id: 'role-mmc-content-manager',
    name: 'Content Manager',
    description: 'Complete content module — email content, dynamic content, and image library.',
    product: 'marketing',
    system: true,
    permissionIds: ['marketing.content.view', 'marketing.content.create', 'marketing.content.edit', 'marketing.content.delete'],
    updatedAt: '2026-05-02T10:00:00Z',
  },
  {
    id: 'role-mmc-acquisition-manager',
    name: 'Acquisition Manager',
    description: 'Complete acquisition module — forms and landing pages.',
    product: 'marketing',
    system: true,
    permissionIds: ['marketing.acquisition.view', 'marketing.acquisition.create', 'marketing.acquisition.edit', 'marketing.acquisition.manage'],
    updatedAt: '2026-05-02T10:00:00Z',
  },
  {
    id: 'role-mmc-integrations-manager',
    name: 'Integrations Manager',
    description: 'Integrations plus contact lists, contacts, and product feed visibility.',
    product: 'marketing',
    system: true,
    permissionIds: [
      'marketing.integrations.view', 'marketing.integrations.manage',
      'marketing.audience.view', 'marketing.audience.edit',
      'commerce.products.view',
    ],
    updatedAt: '2026-05-02T10:00:00Z',
  },
  {
    id: 'role-mmc-api-user',
    name: 'API User',
    description: 'Programmatic access to Marketing Cloud APIs only.',
    product: 'marketing',
    system: true,
    permissionIds: ['marketing.api.view', 'marketing.api.manage'],
    updatedAt: '2026-05-02T10:00:00Z',
  },
  {
    id: 'role-mmc-campaign-manager',
    name: 'Campaign Manager',
    description: 'Create, duplicate, edit, schedule, and stop campaigns, including SMS compliance and quiet-hour settings.',
    product: 'marketing',
    system: true,
    permissionIds: [
      'marketing.campaigns.view', 'marketing.campaigns.create', 'marketing.campaigns.edit', 'marketing.campaigns.delete', 'marketing.campaigns.manage',
      'marketing.audience.view', 'marketing.content.view', 'marketing.analytics.view',
    ],
    updatedAt: '2026-05-02T10:00:00Z',
  },

  // MSC system roles
  {
    id: 'role-msc-admin',
    name: 'MSC Account Admin',
    description: 'Full Service Cloud control — tickets, templates, integrations, and service user management.',
    product: 'service',
    system: true,
    permissionIds: [...productPermissionIds('service'), 'platform.users.view', 'platform.users.create'],
    updatedAt: '2026-05-02T10:00:00Z',
  },
  {
    id: 'role-msc-agent',
    name: 'MSC Agent',
    description: 'Work tickets, manage reply templates and tags, and use connected integrations.',
    product: 'service',
    system: true,
    permissionIds: [
      'service.tickets.view', 'service.tickets.create', 'service.tickets.edit',
      'service.templates.view', 'service.templates.create', 'service.templates.edit', 'service.templates.delete',
      'service.integrations.view',
    ],
    updatedAt: '2026-05-02T10:00:00Z',
  },

  // MCC system roles (provisional — catalog WIP on the product side)
  {
    id: 'role-mcc-admin',
    name: 'MCC Admin',
    description: 'Access to all Commerce Cloud modules and store settings. (Provisional)',
    product: 'commerce',
    system: true,
    permissionIds: [...productPermissionIds('commerce')],
    updatedAt: '2026-05-02T10:00:00Z',
  },
  {
    id: 'role-mcc-store-ops',
    name: 'Store Operations',
    description: 'Day-to-day store running — orders, inventory, and fulfillment. (Provisional)',
    product: 'commerce',
    system: true,
    permissionIds: [
      'commerce.orders.view', 'commerce.orders.edit',
      'commerce.inventory.view', 'commerce.inventory.edit',
      'commerce.fulfillment.view', 'commerce.fulfillment.manage',
      'commerce.products.view',
    ],
    updatedAt: '2026-05-02T10:00:00Z',
  },

  // Seed custom role — demos duplication lineage, edit, and delete
  {
    id: 'role-custom-weekend',
    name: 'Weekend Campaign Editor',
    description: 'Edit and schedule campaigns during weekend coverage, without send-settings access.',
    product: 'marketing',
    system: false,
    baseRoleId: 'role-mmc-campaign-manager',
    permissionIds: [
      'marketing.campaigns.view', 'marketing.campaigns.create', 'marketing.campaigns.edit',
      'marketing.audience.view', 'marketing.content.view',
    ],
    updatedAt: '2026-06-28T16:40:00Z',
  },
]

/* ── Users ────────────────────────────────────────────────────── */

export type UserStatus = 'active' | 'invited' | 'deactivated'

/** Provisional store/location scoping for commerce roles — a flagged PRD gap. */
export interface CommerceScope {
  allLocations: boolean
  locationIds: string[]
}

export interface UserAccount {
  id: string
  name: string
  email: string
  avatar: string
  roleIds: string[]
  status: UserStatus
  /** Exactly one owner per account; the row is protected everywhere. */
  isOwner?: boolean
  lastActiveAt?: string
  invitedAt?: string
  invitedBy?: string
  commerceScope?: CommerceScope
}

export const SEED_USERS: UserAccount[] = [
  { id: 'user-1',  name: 'Ross Andrew Paquette', email: 'ross@maropost.com',   avatar: 'RP', roleIds: [ROLE_OWNER_ID], status: 'active', isOwner: true, lastActiveAt: '2026-07-14T09:12:00Z' },
  { id: 'user-2',  name: 'Sarah Connor',         email: 'sarah@maropost.com',  avatar: 'SC', roleIds: ['role-platform-admin'], status: 'active', lastActiveAt: '2026-07-14T08:47:00Z' },
  { id: 'user-3',  name: 'Mike Zhang',           email: 'mike@maropost.com',   avatar: 'MZ', roleIds: ['role-msc-agent'], status: 'active', lastActiveAt: '2026-07-13T22:05:00Z' },
  { id: 'user-4',  name: 'Priya Sharma',         email: 'priya@maropost.com',  avatar: 'PS', roleIds: ['role-mmc-campaign-manager', 'role-mmc-content-manager'], status: 'active', lastActiveAt: '2026-07-14T07:30:00Z' },
  { id: 'user-5',  name: 'Tom Brady',            email: 'tom@maropost.com',    avatar: 'TB', roleIds: ['role-analyst'], status: 'invited', invitedAt: '2026-07-10T15:20:00Z', invitedBy: 'Ross Andrew Paquette' },
  { id: 'user-6',  name: 'Elena Rodriguez',      email: 'elena@maropost.com',  avatar: 'ER', roleIds: ['role-mmc-marketing-manager'], status: 'active', lastActiveAt: '2026-07-12T18:14:00Z' },
  { id: 'user-7',  name: 'James Okafor',         email: 'james@maropost.com',  avatar: 'JO', roleIds: ['role-mcc-admin'], status: 'active', lastActiveAt: '2026-07-14T06:02:00Z', commerceScope: { allLocations: false, locationIds: ['loc-bondi', 'loc-chadstone'] } },
  { id: 'user-8',  name: 'Aisha Khan',           email: 'aisha@maropost.com',  avatar: 'AK', roleIds: ['role-mmc-audience-manager'], status: 'deactivated', lastActiveAt: '2026-06-20T11:45:00Z' },
  { id: 'user-9',  name: "Liam O'Brien",         email: 'liam@maropost.com',   avatar: 'LO', roleIds: ['role-msc-admin'], status: 'active', lastActiveAt: '2026-07-13T16:28:00Z' },
  { id: 'user-10', name: 'Nina Petrova',         email: 'nina@maropost.com',   avatar: 'NP', roleIds: ['role-custom-weekend'], status: 'active', lastActiveAt: '2026-07-11T20:52:00Z' },
  { id: 'user-11', name: 'Dev Patel',            email: 'dev@maropost.com',    avatar: 'DP', roleIds: ['role-mmc-integrations-manager'], status: 'invited', invitedAt: '2026-06-30T10:05:00Z', invitedBy: 'Sarah Connor' },
]

/* ── Audit log ────────────────────────────────────────────────── */

export type AuditAction =
  | 'user.invited' | 'user.invite_resent' | 'user.invite_revoked'
  | 'user.roles_changed' | 'user.deactivated' | 'user.reactivated' | 'user.removed'
  | 'role.created' | 'role.duplicated' | 'role.updated' | 'role.deleted'

export interface AuditEvent {
  id: string
  at: string
  actorId: string
  actorName: string
  action: AuditAction
  targetType: 'user' | 'role'
  targetId: string
  targetLabel: string
  summary: string
  product?: ProductKey
}

export const AUDIT_ACTION_META: Record<AuditAction, { label: string; color?: string }> = {
  'user.invited':        { label: 'Invited', color: 'success' },
  'user.invite_resent':  { label: 'Invite resent', color: 'primary' },
  'user.invite_revoked': { label: 'Invite revoked', color: 'error' },
  'user.roles_changed':  { label: 'Roles changed', color: 'primary' },
  'user.deactivated':    { label: 'Deactivated', color: 'warning' },
  'user.reactivated':    { label: 'Reactivated', color: 'success' },
  'user.removed':        { label: 'Removed', color: 'error' },
  'role.created':        { label: 'Role created', color: 'success' },
  'role.duplicated':     { label: 'Role duplicated', color: 'primary' },
  'role.updated':        { label: 'Role updated', color: 'primary' },
  'role.deleted':        { label: 'Role deleted', color: 'error' },
}

export const SEED_EVENTS: AuditEvent[] = [
  { id: 'evt-24', at: '2026-07-13T09:41:00Z', actorId: 'user-1', actorName: 'Ross Andrew Paquette', action: 'user.invite_resent', targetType: 'user', targetId: 'user-11', targetLabel: 'Dev Patel', summary: 'Resent the invitation to dev@maropost.com' },
  { id: 'evt-23', at: '2026-07-10T15:20:00Z', actorId: 'user-1', actorName: 'Ross Andrew Paquette', action: 'user.invited', targetType: 'user', targetId: 'user-5', targetLabel: 'Tom Brady', summary: 'Invited tom@maropost.com with Read-Only Analyst', product: 'platform' },
  { id: 'evt-22', at: '2026-07-09T11:03:00Z', actorId: 'user-2', actorName: 'Sarah Connor', action: 'user.roles_changed', targetType: 'user', targetId: 'user-4', targetLabel: 'Priya Sharma', summary: 'Added Content Manager alongside Campaign Manager', product: 'marketing' },
  { id: 'evt-21', at: '2026-07-08T14:12:00Z', actorId: 'user-1', actorName: 'Ross Andrew Paquette', action: 'role.updated', targetType: 'role', targetId: 'role-custom-weekend', targetLabel: 'Weekend Campaign Editor', summary: 'Removed campaign delete permission', product: 'marketing' },
  { id: 'evt-20', at: '2026-07-04T10:30:00Z', actorId: 'user-2', actorName: 'Sarah Connor', action: 'user.roles_changed', targetType: 'user', targetId: 'user-7', targetLabel: 'James Okafor', summary: 'Scoped Commerce access to Bondi Junction and Chadstone', product: 'commerce' },
  { id: 'evt-19', at: '2026-07-02T09:15:00Z', actorId: 'user-1', actorName: 'Ross Andrew Paquette', action: 'user.deactivated', targetType: 'user', targetId: 'user-8', targetLabel: 'Aisha Khan', summary: 'Deactivated account — extended leave' },
  { id: 'evt-18', at: '2026-06-30T10:05:00Z', actorId: 'user-2', actorName: 'Sarah Connor', action: 'user.invited', targetType: 'user', targetId: 'user-11', targetLabel: 'Dev Patel', summary: 'Invited dev@maropost.com with Integrations Manager', product: 'marketing' },
  { id: 'evt-17', at: '2026-06-28T16:40:00Z', actorId: 'user-1', actorName: 'Ross Andrew Paquette', action: 'role.updated', targetType: 'role', targetId: 'role-custom-weekend', targetLabel: 'Weekend Campaign Editor', summary: 'Renamed from “Weekend Editor” and updated description', product: 'marketing' },
  { id: 'evt-16', at: '2026-06-27T13:22:00Z', actorId: 'user-1', actorName: 'Ross Andrew Paquette', action: 'user.roles_changed', targetType: 'user', targetId: 'user-10', targetLabel: 'Nina Petrova', summary: 'Assigned Weekend Campaign Editor', product: 'marketing' },
  { id: 'evt-15', at: '2026-06-27T13:20:00Z', actorId: 'user-1', actorName: 'Ross Andrew Paquette', action: 'role.duplicated', targetType: 'role', targetId: 'role-custom-weekend', targetLabel: 'Weekend Campaign Editor', summary: 'Duplicated from Campaign Manager', product: 'marketing' },
  { id: 'evt-14', at: '2026-06-25T17:55:00Z', actorId: 'user-2', actorName: 'Sarah Connor', action: 'user.removed', targetType: 'user', targetId: 'user-x1', targetLabel: 'Carlos Mendes', summary: 'Removed carlos@maropost.com from the account' },
  { id: 'evt-13', at: '2026-06-24T08:18:00Z', actorId: 'user-1', actorName: 'Ross Andrew Paquette', action: 'user.reactivated', targetType: 'user', targetId: 'user-3', targetLabel: 'Mike Zhang', summary: 'Reactivated account after seasonal pause' },
  { id: 'evt-12', at: '2026-06-21T12:02:00Z', actorId: 'user-1', actorName: 'Ross Andrew Paquette', action: 'user.deactivated', targetType: 'user', targetId: 'user-3', targetLabel: 'Mike Zhang', summary: 'Deactivated account — seasonal pause' },
  { id: 'evt-11', at: '2026-06-19T15:44:00Z', actorId: 'user-2', actorName: 'Sarah Connor', action: 'user.roles_changed', targetType: 'user', targetId: 'user-6', targetLabel: 'Elena Rodriguez', summary: 'Replaced Campaign Manager with Marketing Manager', product: 'marketing' },
  { id: 'evt-10', at: '2026-06-18T09:36:00Z', actorId: 'user-1', actorName: 'Ross Andrew Paquette', action: 'role.deleted', targetType: 'role', targetId: 'role-x1', targetLabel: 'Holiday Helpdesk', summary: 'Deleted unused custom role', product: 'service' },
  { id: 'evt-9',  at: '2026-06-17T14:27:00Z', actorId: 'user-1', actorName: 'Ross Andrew Paquette', action: 'user.invite_revoked', targetType: 'user', targetId: 'user-x2', targetLabel: 'jordan@maropost.com', summary: 'Revoked pending invitation' },
  { id: 'evt-8',  at: '2026-06-16T11:09:00Z', actorId: 'user-2', actorName: 'Sarah Connor', action: 'user.roles_changed', targetType: 'user', targetId: 'user-9', targetLabel: "Liam O'Brien", summary: 'Assigned MSC Account Admin', product: 'service' },
  { id: 'evt-7',  at: '2026-06-16T10:58:00Z', actorId: 'user-2', actorName: 'Sarah Connor', action: 'user.invited', targetType: 'user', targetId: 'user-9', targetLabel: "Liam O'Brien", summary: 'Invited liam@maropost.com with MSC Agent', product: 'service' },
  { id: 'evt-6',  at: '2026-06-15T16:33:00Z', actorId: 'user-1', actorName: 'Ross Andrew Paquette', action: 'role.created', targetType: 'role', targetId: 'role-x1', targetLabel: 'Holiday Helpdesk', summary: 'Created custom role from scratch', product: 'service' },
  { id: 'evt-5',  at: '2026-06-15T10:12:00Z', actorId: 'user-1', actorName: 'Ross Andrew Paquette', action: 'user.roles_changed', targetType: 'user', targetId: 'user-7', targetLabel: 'James Okafor', summary: 'Assigned MCC Admin', product: 'commerce' },
  { id: 'evt-4',  at: '2026-06-14T09:47:00Z', actorId: 'user-1', actorName: 'Ross Andrew Paquette', action: 'user.invited', targetType: 'user', targetId: 'user-7', targetLabel: 'James Okafor', summary: 'Invited james@maropost.com with MCC Admin', product: 'commerce' },
  { id: 'evt-3',  at: '2026-06-13T13:05:00Z', actorId: 'user-1', actorName: 'Ross Andrew Paquette', action: 'user.roles_changed', targetType: 'user', targetId: 'user-2', targetLabel: 'Sarah Connor', summary: 'Promoted to Platform Admin', product: 'platform' },
  { id: 'evt-2',  at: '2026-06-12T08:30:00Z', actorId: 'user-1', actorName: 'Ross Andrew Paquette', action: 'user.invited', targetType: 'user', targetId: 'user-4', targetLabel: 'Priya Sharma', summary: 'Invited priya@maropost.com with Campaign Manager', product: 'marketing' },
  { id: 'evt-1',  at: '2026-06-12T08:28:00Z', actorId: 'user-1', actorName: 'Ross Andrew Paquette', action: 'user.invited', targetType: 'user', targetId: 'user-2', targetLabel: 'Sarah Connor', summary: 'Invited sarah@maropost.com with MMC Admin', product: 'marketing' },
]

/* ── Standardized restricted-access copy ──────────────────────── */

export const ACCESS_DENIED_COPY = {
  title: "You don't have access to this",
  description: 'Your current roles don’t include permission to view this area. Contact your account owner to request access.',
}
