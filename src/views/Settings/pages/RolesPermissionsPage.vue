<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import { useRbacStore } from '@/stores/useRbac'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { PRODUCT_META, PRODUCT_ORDER, type ProductKey, type Role } from '@/stores/rbacData'

const route = useRoute()
const router = useRouter()
const rbac = useRbacStore()
const { loading } = useInitialLoad()

const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? '2000290'
})

const search = ref('')
const productTab = ref('all')

const tabs = computed(() => [
  { label: 'All', key: 'all', count: rbac.roles.length },
  ...PRODUCT_ORDER.map(p => ({
    label: PRODUCT_META[p].short,
    key: p,
    count: rbac.roles.filter(r => r.product === p).length,
  })),
])

interface RoleRow extends Role {
  usage: number
  productLabel: string
}

const PRODUCT_RANK: Record<ProductKey, number> = { platform: 0, marketing: 1, service: 2, commerce: 3 }

const filteredRoles = computed<RoleRow[]>(() =>
  rbac.roles
    .filter(r => productTab.value === 'all' || r.product === productTab.value)
    .map(r => ({ ...r, usage: rbac.roleUsage[r.id] ?? 0, productLabel: PRODUCT_META[r.product].short }))
    .sort((a, b) =>
      PRODUCT_RANK[a.product] - PRODUCT_RANK[b.product]
      || Number(b.system) - Number(a.system)
      || a.name.localeCompare(b.name)),
)

const headers = [
  { title: 'Role', key: 'name', sortable: true },
  { title: 'Product', key: 'productLabel', hideBelow: 'md' as const },
  { title: 'Type', key: 'system', sortable: false },
  { title: 'Users', key: 'usage', align: 'end' as const },
  { title: 'Permissions', key: 'permissions', align: 'end' as const, sortable: false, hideBelow: 'lg' as const },
  { title: '', key: 'actions', align: 'end' as const, sortable: false, width: '48px' },
]
const hiddenColumns = ref<string[]>([])
const { visibleHeaders } = useResponsiveTableHeaders(headers, hiddenColumns)

function baseRoleName(role: Role): string | null {
  return role.baseRoleId ? rbac.roleById(role.baseRoleId)?.name ?? null : null
}

// Snackbar
const snackbar = ref(false)
const snackbarText = ref('')
function notify(text: string) {
  snackbarText.value = text
  snackbar.value = true
}

function openRole(roleId: string) {
  router.push({ name: 'SettingsRoleDetail', params: { accountId: accountId.value, roleId } })
}

function handleRowClick(event: MouseEvent, payload: { item: unknown }) {
  const target = event.target as HTMLElement | null
  if (target?.closest('button, a, input, [role="button"], .v-selection-control, .v-overlay')) return
  const item = payload.item as RoleRow
  if (item.id) openRole(item.id)
}

// Custom-role creation — plan-tier gated
const upsellDialog = ref(false)
const createDrawer = ref(false)

const limitLabel = computed(() => {
  if (rbac.customRoleLimit === Number.POSITIVE_INFINITY) return null
  if (rbac.customRoleLimit === 0) return 'Custom roles not included in this plan'
  return `${rbac.customRoles.length} of ${rbac.customRoleLimit} custom roles used`
})

function startCreate() {
  if (!rbac.canCreateCustomRole) {
    upsellDialog.value = true
    return
  }
  createDrawer.value = true
}

const newRole = ref({ name: '', description: '', product: 'marketing' as ProductKey, startFrom: null as string | null })

watch(createDrawer, (isOpen) => {
  if (isOpen) newRole.value = { name: '', description: '', product: 'marketing', startFrom: null }
})

const productItems = computed(() =>
  PRODUCT_ORDER
    .filter(p => rbac.productEntitled(p))
    .map(p => ({ title: PRODUCT_META[p].label, value: p })),
)

const startFromItems = computed(() => [
  { title: 'Blank — pick permissions from scratch', value: null },
  ...rbac.roles
    .filter(r => r.product === newRole.value.product && r.id !== 'role-owner')
    .map(r => ({ title: `Duplicate ${r.name}${r.system ? ' (System)' : ''}`, value: r.id })),
])

watch(() => newRole.value.product, () => {
  newRole.value.startFrom = null
})

function createCustomRole() {
  const name = newRole.value.name.trim()
  if (!name) return
  const created = newRole.value.startFrom
    ? rbac.duplicateRole(newRole.value.startFrom, name)
    : rbac.createRole({ name, description: newRole.value.description.trim(), product: newRole.value.product, permissionIds: [] })
  if (!created) {
    upsellDialog.value = true
    return
  }
  if (newRole.value.startFrom && newRole.value.description.trim()) {
    rbac.updateRole(created.id, { description: newRole.value.description.trim() })
  }
  createDrawer.value = false
  openRole(created.id)
}

function duplicate(role: Role) {
  const copy = rbac.duplicateRole(role.id)
  if (!copy) {
    upsellDialog.value = true
    return
  }
  notify(`${copy.name} created`)
  openRole(copy.id)
}

// Delete — custom roles only, blocked while assigned
const deleteDialog = ref(false)
const deleteTarget = ref<RoleRow | null>(null)

function askDelete(role: RoleRow) {
  deleteTarget.value = role
  deleteDialog.value = true
}

function confirmDelete() {
  if (!deleteTarget.value) return
  const result = rbac.deleteRole(deleteTarget.value.id)
  notify(result.ok ? `${deleteTarget.value.name} deleted` : 'Role could not be deleted')
  deleteTarget.value = null
}
</script>

<template>
  <div class="settings-page d-flex flex-column gap-4">
    <MpPageHeader
      :level="2"
      density="compact"
      title="Roles & Permissions"
      subtitle="System roles are maintained by Maropost. Duplicate one, or build a custom role, to tailor access."
    >
      <template #actions>
        <div class="d-flex flex-column align-end">
          <v-btn
            color="primary"
            variant="flat"
            :prepend-icon="rbac.canCreateCustomRole ? 'plus' : 'lock'"
            class="text-none"
            @click="startCreate"
          >
            Create custom role
          </v-btn>
          <span v-if="limitLabel" class="text-caption text-medium-emphasis mt-1">{{ limitLabel }}</span>
        </div>
      </template>
    </MpPageHeader>

    <MpFilterTabs v-model="productTab" :tabs="tabs" aria-label="Filter roles by product" controls-id="roles-table" />

    <v-card id="roles-table" variant="flat" border rounded="lg" class="d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        v-model:hidden-columns="hiddenColumns"
        search-placeholder="Search roles"
        :headers="headers"
        :total-count="filteredRoles.length"
      />

      <MpTableSkeleton v-if="loading" :rows="8" :columns="5" />

      <v-data-table
        v-else
        :headers="visibleHeaders"
        :items="filteredRoles"
        :search="search"
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="20"
        fixed-header
        class="roles-table"
        @click:row="handleRowClick"
      >
        <template v-slot:item.name="{ item }">
          <div class="py-2 role-cell">
            <div class="role-cell__name">{{ (item as RoleRow).name }}</div>
            <div class="role-cell__description">{{ (item as RoleRow).description }}</div>
            <div v-if="baseRoleName(item as RoleRow)" class="role-cell__base">
              <v-icon size="11">copy</v-icon>
              Based on {{ baseRoleName(item as RoleRow) }}
            </div>
          </div>
        </template>

        <template v-slot:item.productLabel="{ item }">
          <v-chip size="x-small" variant="outlined" class="text-no-wrap">{{ (item as RoleRow).productLabel }}</v-chip>
        </template>

        <template v-slot:item.system="{ item }">
          <v-chip size="x-small" variant="tonal" :color="(item as RoleRow).system ? 'secondary' : 'primary'">
            {{ (item as RoleRow).system ? 'System' : 'Custom' }}
          </v-chip>
        </template>

        <template v-slot:item.usage="{ item }">
          <span class="text-body-2">{{ (item as RoleRow).usage }}</span>
        </template>

        <template v-slot:item.permissions="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ (item as RoleRow).permissionIds.length }}</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <span @click.stop>
            <MpRowActionsMenu :ariaLabel="`Actions for ${(item as RoleRow).name}`">
              <v-list-item prepend-icon="eye" :title="(item as RoleRow).system ? 'View' : 'Edit'" @click="openRole((item as RoleRow).id)" />
              <v-list-item
                prepend-icon="copy"
                title="Duplicate"
                :disabled="!rbac.canCreateCustomRole"
                @click="duplicate(item as RoleRow)"
              />
              <template v-if="!(item as RoleRow).system">
                <v-divider class="my-1" style="opacity: 0.4" />
                <v-tooltip
                  :disabled="(item as RoleRow).usage === 0"
                  location="left"
                  :text="`Assigned to ${(item as RoleRow).usage} user${(item as RoleRow).usage === 1 ? '' : 's'} — reassign them first`"
                >
                  <template #activator="{ props: tipProps }">
                    <div v-bind="tipProps">
                      <v-list-item
                        prepend-icon="trash-2"
                        title="Delete"
                        class="text-error"
                        :disabled="(item as RoleRow).usage > 0"
                        @click="askDelete(item as RoleRow)"
                      />
                    </div>
                  </template>
                </v-tooltip>
              </template>
            </MpRowActionsMenu>
          </span>
        </template>

        <template #no-data>
          <MpEmptyState
            variant="expressive"
            illustration="no-results"
            title="No roles match"
            description="Try a different search or product tab."
            class="py-10"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create custom role -->
    <MpFormDrawer v-model="createDrawer" title="Create custom role" subtitle="Start blank or duplicate an existing role" :width="480">
      <v-text-field
        v-model="newRole.name"
        label="Role name *"
        variant="outlined"
        density="compact"
        class="mb-3"
        placeholder="e.g. Weekend Campaign Editor"
      />
      <v-textarea
        v-model="newRole.description"
        label="Description"
        variant="outlined"
        density="compact"
        rows="2"
        class="mb-3"
        placeholder="What is this role for?"
      />
      <v-select
        v-model="newRole.product"
        label="Product"
        :items="productItems"
        variant="outlined"
        density="compact"
        class="mb-3"
      />
      <v-select
        v-model="newRole.startFrom"
        label="Start from"
        :items="startFromItems"
        variant="outlined"
        density="compact"
        class="mb-3"
      />
      <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="text-body-2">
        You’ll pick permissions on the next screen. Dependencies are applied automatically — granting Edit always includes View.
      </v-alert>
      <template #footer>
        <div class="w-100 d-flex justify-end gap-3">
          <v-btn variant="text" class="text-none" @click="createDrawer = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" class="text-none" :disabled="!newRole.name.trim()" @click="createCustomRole">
            Create & edit permissions
          </v-btn>
        </div>
      </template>
    </MpFormDrawer>

    <!-- Plan-tier upsell -->
    <v-dialog v-model="upsellDialog" max-width="440">
      <v-card rounded="lg" class="pa-6 text-center">
        <v-icon size="40" color="primary" class="mx-auto mb-3">lock</v-icon>
        <div class="text-h6 font-weight-bold mb-2">
          {{ rbac.customRoleLimit === 0 ? 'Custom roles are a plan feature' : 'Custom role limit reached' }}
        </div>
        <p class="text-body-2 text-medium-emphasis mb-5">
          {{ rbac.customRoleLimit === 0
            ? 'Custom roles are available on Professional and Enterprise plans. System roles remain fully available on every plan.'
            : `This account has used ${rbac.customRoles.length} of ${rbac.customRoleLimit} custom roles. Upgrade to Enterprise for unlimited custom roles.` }}
        </p>
        <div class="d-flex justify-center gap-3">
          <v-btn variant="text" class="text-none" @click="upsellDialog = false">Close</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="text-none"
            :to="{ name: 'Billing', params: { accountId } }"
          >
            View plans
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <MpConfirmDialog
      v-model="deleteDialog"
      title="Delete custom role?"
      :message="`Delete ${deleteTarget?.name}? This cannot be undone. Roles assigned to users can't be deleted.`"
      confirm-label="Delete"
      danger
      @confirm="confirmDelete"
    />

    <v-snackbar v-model="snackbar" :timeout="2500" rounded="pill" location="bottom center">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<style scoped lang="scss">
.settings-page {
  max-width: 980px;
}

.roles-table :deep(thead th) {
  white-space: nowrap;
}

.roles-table :deep(tbody tr) {
  cursor: pointer;
}

.role-cell {
  max-width: 420px;
}

.role-cell__name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
}

.role-cell__description {
  font-size: 12px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-cell__base {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  font-size: 11px;
  color: var(--muted);
}
</style>
