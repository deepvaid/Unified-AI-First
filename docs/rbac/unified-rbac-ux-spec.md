# Unified RBAC & User Management — UX Specification

| | |
|---|---|
| **Source PRD** | [PRD: Unified RBAC for Maropost Products (MMC, MSC, MCC)](https://maropost.atlassian.net/wiki/spaces/PROD/pages/5898403875) — v1.0, Draft |
| **Prototype** | This repo, under Settings → Users / Roles & Permissions / Audit Log (`src/views/Settings/pages/`, `src/components/rbac/`, `src/stores/useRbac.ts` + `src/stores/rbacData.ts`) |
| **Status** | Implementation-ready spec, validated in a working prototype |
| **Date** | 2026-07-14 |

The PRD centralizes Users, Roles, and Permissions into one RBAC framework serving MMC (Marketing Cloud), MSC (Service Cloud), and MCC (Commerce Cloud), layered on top of subscription entitlements. This document translates it into an information architecture, flows, screens, components, and technical contracts — and flags every place the PRD is unclear, with the recommendation the design adopts.

---

## 1. PRD gap analysis & recommendations

The design does not silently assume; each gap below is resolved with an explicit, flagged recommendation.

| # | Gap / contradiction in PRD | Recommendation adopted in this design |
|---|---|---|
| 1 | The personas table scrambles product codes (Merchant→MMC, Marketer→MSC, Support Agent→MCC), contradicting the role tables (MMC roles are campaigns/journeys; MSC roles are tickets/agents) | Use **MMC = Marketing, MSC = Service, MCC = Commerce** per the role tables. PRD personas table should be corrected |
| 2 | MCC permission catalog is a WIP spreadsheet (inaccessible SharePoint link) | Ship a **provisional commerce catalog** (Orders, Products, Inventory, Fulfillment, Store Settings), visibly labeled "Provisional" in every surface that renders it |
| 3 | Store/location scoping is implied ("scoped access to store operations") but never specified | **Commerce-role assignments accept an optional location scope** (All locations / specific locations). UI is labeled provisional; the pattern extends to any future scoped product |
| 4 | "Role conflicts" and "dependency rules" are named as validation steps but never defined | **Multi-role = union of permissions** (most-permissive-wins). Conflicts exist only where explicitly declared on a role (`conflictsWith`) — seeded example: Read-Only Analyst ⊗ admin roles. Dependencies are an explicit `requires` graph: create/edit/delete require view; manage requires edit |
| 5 | Custom roles are "plan-dependent" with no tiers defined | Three-tier gate (starter: 0, professional: 3, enterprise: unlimited) with a **locked button + upsell dialog**. Prototype derives tier from subscription count — clearly commented as demo logic; real implementation reads the billing service |
| 6 | Deactivate vs. delete semantics undefined (MSC role list says "Delete or Deactivate users") | **Deactivate** = reversible; blocks sign-in, keeps roles and history. **Remove** = permanent; requires typed confirm dialog. Invited users get **Revoke invite** instead |
| 7 | "Logs audit trail" with no event taxonomy, retention, or visibility rules | Concrete taxonomy of 11 events (`user.invited/…/removed`, `role.created/…/deleted`), each with actor, target, timestamp, human summary. Visible to Account Owner + Platform Admins. Retention is a backend decision — flagged open |
| 8 | Bulk management is absent from the PRD but its scalability objective requires it | Bulk **Assign role / Resend invites / Deactivate / Remove** on multi-select. Flagged as a design recommendation, not a PRD requirement |
| 9 | Invitation lifecycle (resend, revoke, expiry) unspecified | Resend + revoke are designed and built. **Expiry is a backend policy** — recommend 7 days with resend resetting the clock; flagged open |
| 10 | Owner lifecycle (transfer, demotion) unaddressed | Exactly one Account Owner; the row is fully protected (no deactivate/remove/demote, excluded from bulk selection). **Ownership transfer is explicitly out of scope** and stated in UI copy |

**Open questions for product** (carried from PRD + new): custom roles in MUP; Partner Portal personas; audit retention window; invitation expiry policy; whether a user can exist with zero roles (design decision: no — deactivate or remove instead).

---

## 2. Information architecture

RBAC lives inside the existing **Settings** area — it is account administration, and the PRD's "centralized Users & Permissions console" maps to Settings → Account Management. No new top-level surface is introduced.

```
Settings
└── Account Management
    ├── Users                    ← the console: all users, roles, product access, status
    ├── Roles & Permissions      ← role catalog: system + custom
    │   └── [Role detail]        ← read-only for system roles; editor for custom roles
    └── Audit Log                ← who changed access, when
```

Object model:

```
Account (1)
├── Users (n)         — status: active | invited | deactivated; exactly one isOwner
│   └── roleIds (n)   — multi-role; effective access = union
│   └── commerceScope — optional; all locations | specific locationIds   [provisional]
├── Roles (n)         — product: platform | marketing | service | commerce
│   ├── system        — maintained by Maropost, immutable, duplicable
│   └── custom        — tier-gated; may record baseRoleId lineage
├── Permission catalog (fixed) — product → module → permissions (view/create/edit/delete/manage)
│   └── requires[]    — dependency edges (create/edit/delete → view; manage → edit)
└── Audit events (append-only)
```

Two access layers compose, and the UI always shows both: **subscription entitlement** (account-level: which products the plan includes — existing `useAccounts.hasSubscription`) constrains **role grants** (user-level). A role grant for an unsubscribed product is never silently active: pickers lock those groups, and access summaries render the product dimmed with a lock and explanatory tooltip.

## 3. User types & key use cases

| Persona (PRD, corrected) | Maps to | Key use cases in this design |
|---|---|---|
| **Account Owner** | `isOwner` + Account Owner role | Invite team, assign/revoke any role, deactivate/remove users, create custom roles, read audit log |
| **Product Admin** | Platform Admin / MMC Admin / MSC Account Admin / MCC Admin | Manage users within their product's scope; view roles; duplicate system roles |
| **Marketer** (MMC) | Marketing Manager, Campaign Manager, Audience/Content/Acquisition/Integrations Manager, API User | Consumes access; sees only permitted modules; hits the standardized 403 elsewhere |
| **Merchant** (MCC) | MCC Admin, Store Operations (+ location scope) | Store operations limited to assigned locations |
| **Support Agent** (MSC) | MSC Agent | Tickets/templates only; no user management |

Primary jobs, in order of frequency: (1) invite a new teammate with the right roles, (2) check/adjust what someone can access, (3) offboard someone safely, (4) tailor a role the defaults don't cover, (5) answer "who changed this?".

## 4. Permission & role hierarchy

**Catalog** (`src/stores/rbacData.ts` → `PERMISSION_CATALOG`): 4 products → 21 modules → 62 permissions. Every permission id is `product.module.action`. Named permissions override the generic action label (e.g. `marketing.campaigns.manage` = "Manage sending & SMS settings"). The MCC branch is provisional (gap #2).

**Dependency rules**: explicit `requires` edges, enforced in one place (`expandWithDependencies`). Granting closes over the graph automatically; a granted permission that another grant depends on is **checked + disabled** with a "Required by {label}" tooltip. Revoking a dependency requires revoking its dependents first (the UI enforces this by locking, and the store re-expands on save as defense in depth).

**Roles** (16 seeded):

- **Global system roles** — Account Owner (everything; not assignable), Platform Admin (everything except `platform.account.manage`), Read-Only Analyst (dashboards + marketing analytics view; conflicts with admin roles).
- **MMC system roles** (8, per PRD table) — Admin, Marketing Manager, Audience Manager, Content Manager, Acquisition Manager, Integrations Manager, API User, Campaign Manager.
- **MSC system roles** — Account Admin, Agent (per PRD table).
- **MCC system roles** (provisional) — Admin, Store Operations.
- **Custom roles** — created blank or by duplicating any role; record "Based on {source}" lineage; tier-gated (gap #5).

**Multi-role resolution**: union of permission sets (gap #4). The Manage-access drawer proves the union to the admin via a live "effective permissions" read-only matrix of the *pending* selection. Declared conflicts surface twice: inline on the role option ("Conflicts with X") before selection, and as a blocking warning alert if both end up selected — Save is disabled until resolved.

## 5. End-to-end user flows

**Invite users** — Users → "Invite users" → drawer step 1: emails (chip input, per-chip regex validation with named invalid emails), role checklist (grouped Global → MMC → MSC → MCC; unsubscribed groups locked; conflicts block Continue), conditional Store scope when a commerce role is picked → step 2 review: invitees, roles by product, computed access summary (with entitlement warnings), sign-up-link notice → Send. Each invitee lands in the table as `Invited`, and one audit event per invitee is written. Resend/revoke available per row, in the bulk bar, and (revoke) behind a danger confirm.

**Manage a user's access** — click any row (or kebab → Manage access) → drawer: identity + status; role checklist (same component as invite); conflict/zero-role warnings block save; commerce scope when relevant; product access summary + expandable effective-permissions matrix previewing the *unsaved* selection; danger zone (Deactivate/Reactivate without confirm — reversible; Remove behind danger confirm). Save validates → applies → snackbar → audit event. Owner variant: picker disabled, explanatory alerts, no danger actions (gap #10).

**Deactivate / reactivate / remove** — kebab or bulk bar. Deactivate keeps roles ("access suspended, roles retained" in the audit summary); reactivate restores exactly what they had. Remove is permanent and confirm-gated. Owner excluded everywhere, including bulk selection (checkbox disabled).

**Create a custom role** — Roles → "Create custom role". If tier-blocked: lock icon on the button + upsell dialog ("Custom roles are a plan feature" / "limit reached", View plans → Billing). Otherwise: drawer captures name, description, product (entitled products only), start-from (blank or duplicate any role of that product) → creates → lands in the role editor to pick permissions. Duplicating from a role detail page or list kebab follows the same gate.

**Edit / delete a role** — system roles open read-only with a "Duplicate to customize" banner+action. Custom roles: editable name/description/matrix, dirty-gated Save. Delete is blocked while assigned (`Assigned to N users — reassign them first` tooltip on the disabled action) and confirm-gated when free; deleting returns to the roles list.

**Audit review** — Audit Log lists every access change newest-first: relative time (exact timestamp on hover), actor, color-coded action chip, target (user/role), human-readable summary. Filter by target tab, action type, actor, period; free-text search. Every mutating flow above writes here.

**Insufficient permission** — one standardized state everywhere (`ACCESS_DENIED_COPY`): lock icon, "You don't have access to this", "Your current roles don't include permission to view this area. Contact your account owner to request access." The Audit Log's "Preview as" toggle (Account Owner ↔ Marketing Manager) demos it live. The same MpEmptyState pattern is the spec for any module a user lacks `view` on.

## 6. Navigation & page structure

| Route | Name | Page |
|---|---|---|
| `/accounts/:accountId/settings/users-permissions` | `SettingsUsersPermissions` (stable, pre-existing) | Users console |
| `/accounts/:accountId/settings/roles` | `SettingsRoles` | Roles list |
| `/accounts/:accountId/settings/roles/:roleId` | `SettingsRoleDetail` | Role detail/editor |
| `/accounts/:accountId/settings/audit-log` | `SettingsAuditLog` | Audit log |

Settings sidebar ("Account Management" group) lists Users, Roles & Permissions, Audit Log. The sidebar's active-state matcher accepts a `match` array so Roles stays highlighted on role detail. The Settings shell already sets `railShell: true`, so the global sidebar auto-minimizes. Deep links are safe: unknown `:roleId` renders an error state with a back action (covers deleted-role links).

## 7. Screens & interaction behaviour

### 7.1 Users console (`UsersPermissionsPage.vue`)

- **Header**: title, live member count, primary "Invite users".
- **Status tabs**: All / Active / Invited / Deactivated with live counts (`MpFilterTabs`).
- **Toolbar**: debounced search (name/email/role), filter drawer (Role, Product access) with removable filter chips, column visibility menu.
- **Table columns**: User (avatar, name, email; owner gets a shield-check with tooltip) · Roles (2 chips + "+N" overflow tooltip) · Products (icon dots per product with tooltips; unsubscribed → lock icon, dimmed) · Status (`MpStatusChip`) · Last active (relative; invited rows show "Invite sent {ago}") · kebab.
- **Row actions** (context-dependent): Manage access; Resend/Revoke invite (invited); Deactivate (active) / Reactivate (deactivated); Remove (danger). Owner: Manage access only.
- **Bulk bar**: appears on selection — Assign role (grouped menu of entitled roles; skips conflicts/owner and reports how many changed), Resend invites (enabled only when invited users are selected), Deactivate (applies to active), Remove (danger confirm). Owner is unselectable.
- **States**: skeleton on load; filtered-empty ("No users match") vs true-empty ("No users yet" + Invite CTA); every mutation → snackbar + audit event.

### 7.2 Invite drawer / Manage-access drawer (`rbac/InviteUsersDrawer.vue`, `rbac/UserAccessDrawer.vue`)

Both compose `RolePicker`; the access drawer adds the effective-permissions preview (`PermissionMatrix` readonly) and the danger zone. Validation summary: invalid emails named in the error; ≥1 role required ("Users need at least one role. To take away all access, deactivate or remove the user instead."); conflicts block with a warning alert naming both roles; commerce scope must name ≥1 location when "Specific locations" is chosen.

### 7.3 Roles list (`RolesPermissionsPage.vue`)

Product tabs (All/Global/MMC/MSC/MCC with counts) → table sorted product → system-first → name: Role (name, one-line description, "Based on X" lineage) · Product chip · System/Custom chip · Users count · Permissions count · kebab (View|Edit, Duplicate [tier-gated], Delete [custom only; disabled with reassign tooltip while assigned]). Header action carries the tier state: enabled / lock icon + counter caption ("2 of 3 custom roles used" / "Custom roles not included in this plan") + upsell dialog.

### 7.4 Role detail (`RoleDetailPage.vue`)

Back-linked header, subtitle `{product} · {System|Custom} role · {n} users · Based on {source}`. System: info banner + read-only matrix + "Duplicate to customize". Custom: name/description fields, editable matrix (scoped to the role's product plus any cross-product grants; global roles see all products), dirty-gated Save, holders list ("Users with this role" with status chips, link to Users), danger-zone Delete with usage guard.

### 7.5 Permission matrix (`rbac/PermissionMatrix.vue`)

Product tabs (granted-count badges) → one bordered card per module: header with tri-state grant-all checkbox and "n of m" counter; permission rows with checkbox, label, action tag for named permissions. Dependency behavior per §4. Readonly mode swaps checkboxes for check/minus icons. MCC tab always carries the provisional info alert.

### 7.6 Audit log (`AuditLogPage.vue`)

Per §5 plus: "Preview as" toggle in the header demonstrating the standardized 403; target tabs with counts; empty states for no-match vs no-activity.

## 8. Reusable frontend patterns & components

**Reused unchanged** (no duplicates created): `MpPageHeader`, `MpFilterTabs`, `MpDataTableToolbar`, `MpTableSkeleton`, `MpEmptyState`, `MpErrorState`, `MpFloatingBulkBar`, `MpRowActionsMenu`, `MpConfirmDialog`, `MpFormDrawer`, `MpStatusChip`, `SettingsSection`, `useInitialLoad`, `useResponsiveTableHeaders`, `useRelativeTime`. The whole console follows the canonical data-table recipe (see `AllContacts.vue`).

**Extended**: `MpStatusChip` general map gains `invited: warning`, `deactivated: neutral`. `SettingsItem` gains optional `match: string[]` for detail-page highlighting.

**New, reusable** (with Storybook stories): 

- `PermissionMatrix` — `{ modelValue: string[], products?: ProductKey[], readonly?: boolean }`. Used editable (role editor) and readonly (system role view, effective-permissions preview).
- `RolePicker` — `{ modelValue: string[], disabled?: boolean }`. Used by invite, manage-access, and (as a menu variant) bulk assign.

**New, page-private**: `InviteUsersDrawer`, `UserAccessDrawer` (view-level composites; extracted for page size, not speculative reuse).

## 9. Responsive behaviour

- Settings shell stacks the sidebar above content below 900px (existing behavior).
- Tables use column-priority hiding via `hideBelow` (`md`: Products/Actor; `lg`: Last active/Permissions/Target) plus the manual column menu; tabs gain overflow arrows; the table scrolls horizontally inside its card as last resort.
- Drawers (480–560px) become effectively full-width on mobile (existing `MpFormDrawer` behavior); the matrix module grid collapses from multi-column to single column via `auto-fill/minmax`.
- Chips are capped (2 + "+N") and cells `text-no-wrap`, so the 980px settings column never wraps rows.

## 10. Accessibility

- **Structure**: one h-level page title per page (`MpPageHeader level=2`), section headings in cards, `aria-current` on tabs, `controlsId` wiring tabs → table container.
- **Names**: every icon-only control is labelled — kebabs ("Actions for {name}"), matrix checkboxes ("{permission} — {module}"), tri-state module toggles ("Grant all {module} permissions"), product dots (`role="img"` + product label), preview toggle.
- **State not by colour alone**: status chips carry text; locked groups show a lock icon *and* a sentence; conflicts are icon + text; readonly matrix uses distinct icons, not just colour.
- **Keyboard**: `MpFormDrawer` provides focus trap + Esc; dialogs are Vuetify-native; matrix and picker are plain checkboxes (native toggling); row click has an interactive-element guard so inline controls don't trigger navigation; visible `:focus-visible` styles on custom link-buttons.
- **Announcements**: `MpErrorState` uses `role="alert"`; blocking validation uses alerts adjacent to the control; snackbars confirm every mutation.

## 11. Technical considerations for implementation

**Frontend contract** — `useRbac` is the reference shape for the real RBAC service client:

- Reads: `users`, `roles`, `usersByStatus`, `roleUsage`, `effectivePermissions(userId)`, `productAccessSummary(userId)`, `assignableRoles` (server should return grouped + entitlement-filtered), `sortedEvents`.
- Writes: `inviteUsers`, `resendInvite`, `revokeInvite`, `assignRoles` (validating), `addRoleToUsers` (bulk), `setUserStatus`, `removeUser`, `createRole`, `duplicateRole`, `updateRole`, `deleteRole` (usage-guarded).
- Validation belongs on both sides: the client pre-validates (`validateAssignment`, `expandWithDependencies`) for instant UX; the RBAC service must re-validate (subscription eligibility, conflicts, dependencies) and be the source of truth — matching PRD step 4.

**Enforcement**: route-level `meta.requires`-style guards extend from subscription keys to permission ids (`meta.requiresPermission: 'platform.audit.view'`); unauthorized → the standardized 403 (`ACCESS_DENIED_COPY`), never a blank page. API errors should return a standardized error body the UI can map to the same state.

**Permission catalog as data**: ship the catalog (and `requires` edges) from the platform service, not hard-coded per client, so product teams can add modules without UI releases. Ids must be stable (`product.module.action`).

**Audit**: write events server-side in the same transaction as the mutation; the client-side `logEvent` in the prototype only simulates this. Include actor, target, before/after role sets.

**Migration (PRD)**: the "Based on {role}" lineage plus auto-created custom roles covers the PRD's migration path (map existing permission combos → unified roles; incompatible combos → auto-created custom roles named for the customer).

**Known prototype simplifications**: plan tier derived from subscription count; commerce location scope stored but not enforced anywhere; mock store resets on full page reload; invitation expiry not modeled.

**QA checklist** (all verified in the prototype):

1. Invite: invalid email blocks with named error; ≥1 role required; locked product groups cannot be selected; review shows entitlement warnings; send creates Invited rows + audit events + snackbar.
2. Access drawer: conflict pair (Read-Only Analyst + any admin) blocks Save with a warning naming both; effective-permissions preview reflects the *pending* union; owner is fully protected.
3. Dependencies: granting Manage auto-grants Edit+View; View/Edit render locked with "Required by" tooltips; unchecking Manage releases Edit but not View while Create/Delete remain.
4. Lifecycle: deactivate (reversible, roles retained) vs remove (confirm, permanent) vs revoke invite (confirm); owner excluded from all, including bulk selection.
5. Roles: system roles read-only + duplicable; duplicate lands on an editable copy with lineage; delete disabled while assigned; deleting an unassigned custom role returns to the list.
6. Tier gates: starter account → lock icon + "plan feature" upsell; professional at limit → "limit reached" upsell; enterprise unrestricted.
7. Audit: every mutation appears with correct actor/action/summary; filters and tabs work; "Preview as Marketing Manager" swaps to the standardized 403.
8. Responsive: columns drop at md/lg; mobile stacks the settings nav; drawers usable at 375px.
