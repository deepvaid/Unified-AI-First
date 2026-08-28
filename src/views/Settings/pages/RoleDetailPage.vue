<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpErrorState from '@/components/MpErrorState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import SettingsSection from '@/components/settings/SettingsSection.vue'
import PermissionMatrix from '@/components/rbac/PermissionMatrix.vue'
import { useRbacStore } from '@/stores/useRbac'
import { PERMISSION_INDEX, PRODUCT_META, PRODUCT_ORDER, type ProductKey } from '@/stores/rbacData'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const rbac = useRbacStore()

const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? '2000290'
})

const roleId = computed(() => {
  const id = Array.isArray(route.params.roleId) ? route.params.roleId[0] : route.params.roleId
  return id ?? ''
})

const role = computed(() => rbac.roleById(roleId.value))
const usage = computed(() => rbac.roleUsage[roleId.value] ?? 0)

const backTo = computed(() => ({ name: 'SettingsRoles', params: { accountId: accountId.value } }))

// Local edit state (custom roles only)
const localName = ref('')
const localDescription = ref('')
const localPermissionIds = ref<string[]>([])

watch(role, (next) => {
  localName.value = next?.name ?? ''
  localDescription.value = next?.description ?? ''
  localPermissionIds.value = [...(next?.permissionIds ?? [])]
}, { immediate: true })

const dirty = computed(() => {
  if (!role.value) return false
  return localName.value !== role.value.name
    || localDescription.value !== role.value.description
    || [...localPermissionIds.value].sort().join(',') !== [...role.value.permissionIds].sort().join(',')
})

const canSave = computed(() => Boolean(role.value && !role.value.system && dirty.value && localName.value.trim()))

/** Products the matrix should render: full catalog for global roles, product + any cross-product grants otherwise. */
function matrixProducts(permissionIds: string[]): ProductKey[] {
  if (!role.value) return []
  if (role.value.product === 'platform') return [...PRODUCT_ORDER]
  const products = new Set<ProductKey>([role.value.product])
  for (const pid of permissionIds) {
    const product = PERMISSION_INDEX[pid]?.product
    if (product) products.add(product)
  }
  return PRODUCT_ORDER.filter(p => products.has(p))
}

const holders = computed(() => rbac.users.filter(u => u.roleIds.includes(roleId.value)))

const baseRoleName = computed(() =>
  role.value?.baseRoleId ? rbac.roleById(role.value.baseRoleId)?.name ?? null : null,
)

const toast = useToast()
function notify(text: string) {
  toast.info(text)
}

function save() {
  if (!role.value || !canSave.value) return
  rbac.updateRole(role.value.id, {
    name: localName.value.trim(),
    description: localDescription.value.trim(),
    permissionIds: [...localPermissionIds.value],
  })
  notify('Role saved')
}

function duplicate() {
  if (!role.value) return
  const copy = rbac.duplicateRole(role.value.id)
  if (!copy) {
    notify('Custom role limit reached for this plan')
    return
  }
  router.push({ name: 'SettingsRoleDetail', params: { accountId: accountId.value, roleId: copy.id } })
}

const deleteDialog = ref(false)

function confirmDelete() {
  if (!role.value) return
  const name = role.value.name
  const result = rbac.deleteRole(role.value.id)
  if (result.ok) {
    router.push(backTo.value)
  } else {
    notify(`${name} couldn’t be deleted`)
  }
}

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}
</script>

<template>
  <div class="settings-page d-flex flex-column gap-4">
    <MpErrorState
      v-if="!role"
      icon="shield-question"
      title="Role not found"
      description="This role may have been deleted, or the link is out of date."
      action-label="Back to roles"
      action-icon="arrow-left"
      @action="router.push(backTo)"
    />

    <template v-else>
      <MpPageHeader
        :level="2"
        density="compact"
        :back-to="backTo"
        :title="role.name"
        :subtitle="`${PRODUCT_META[role.product].label} · ${role.system ? 'System role' : 'Custom role'} · ${usage} user${usage === 1 ? '' : 's'}${baseRoleName ? ` · Based on ${baseRoleName}` : ''}`"
      >
        <template #actions>
          <v-btn
            v-if="role.system"
            color="primary"
            variant="flat"
            :prepend-icon="rbac.canCreateCustomRole ? 'copy' : 'lock'"
            class="text-none"
            @click="duplicate"
          >
            Duplicate to customize
          </v-btn>
          <v-btn
            v-else
            color="primary"
            variant="flat"
            class="text-none"
            :disabled="!canSave"
            @click="save"
          >
            Save changes
          </v-btn>
        </template>
      </MpPageHeader>

      <v-alert
        v-if="role.system"
        type="info"
        variant="tonal"
        density="compact"
        rounded="lg"
        class="text-body-2"
      >
        System roles are maintained by Maropost and can’t be edited. Duplicate this role to create a customizable copy.
      </v-alert>

      <SettingsSection
        v-if="!role.system"
        title="Role details"
        description="Name and describe the role so admins know when to assign it."
      >
        <MpFormGrid>
          <v-text-field
            v-model="localName"
            label="Role name *"
          />
          <v-textarea
            v-model="localDescription"
            label="Description"
            rows="3"
          />
        </MpFormGrid>
      </SettingsSection>

      <SettingsSection
        title="Permissions"
        :description="role.system
          ? 'What this role grants. Dependencies are shown as granted.'
          : 'Granting Edit automatically includes View; locked items are required by another grant.'"
      >
        <PermissionMatrix
          v-if="role.system"
          :model-value="role.permissionIds"
          :products="matrixProducts(role.permissionIds)"
          readonly
        />
        <PermissionMatrix
          v-else
          v-model="localPermissionIds"
          :products="matrixProducts(localPermissionIds)"
        />
      </SettingsSection>

      <SettingsSection
        title="Users with this role"
        :description="holders.length ? 'Assignments update from the Users page.' : 'No one holds this role yet.'"
      >
        <div v-if="holders.length" class="holders">
          <div v-for="user in holders" :key="user.id" class="holders__row">
            <v-avatar color="primary" variant="tonal" size="28" class="font-weight-bold text-caption">{{ user.avatar }}</v-avatar>
            <span class="holders__name">{{ user.name }}</span>
            <span class="holders__email">{{ user.email }}</span>
            <MpStatusChip :status="statusLabel(user.status)" type="general" size="sm" />
          </div>
        </div>
        <v-btn
          variant="text"
          size="small"
          class="text-none mt-2"
          prepend-icon="users"
          :to="{ name: 'SettingsUsersPermissions', params: { accountId } }"
        >
          Manage users
        </v-btn>
      </SettingsSection>

      <SettingsSection v-if="!role.system" title="Danger zone" compact>
        <p class="text-body-2 text-medium-emphasis">
          Deleting a role is permanent. Roles assigned to users can’t be deleted — reassign those users first.
        </p>
        <v-tooltip
          :disabled="usage === 0"
          location="top"
          :text="`Assigned to ${usage} user${usage === 1 ? '' : 's'} — reassign them first`"
        >
          <template #activator="{ props: tipProps }">
            <span v-bind="tipProps" class="d-inline-block">
              <v-btn
                variant="outlined"
                color="error"
                size="small"
                class="text-none"
                prepend-icon="trash-2"
                :disabled="usage > 0"
                @click="deleteDialog = true"
              >
                Delete role
              </v-btn>
            </span>
          </template>
        </v-tooltip>
      </SettingsSection>

      <MpConfirmDialog
        v-model="deleteDialog"
        title="Delete custom role?"
        :message="`Delete ${role.name}? This cannot be undone.`"
        confirm-label="Delete"
        danger
        @confirm="confirmDelete"
      />
    </template>
  </div>
</template>

<style scoped lang="scss">
.settings-page {
  max-width: 980px;
}

.holders {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.holders__row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.holders__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.holders__email {
  font-size: 12px;
  color: var(--muted);
}
</style>
