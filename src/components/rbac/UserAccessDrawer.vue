<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import PermissionMatrix from '@/components/rbac/PermissionMatrix.vue'
import RolePicker from '@/components/rbac/RolePicker.vue'
import { useRbacStore } from '@/stores/useRbac'
import { useRetailStore } from '@/stores/useRetail'
import { formatAgo } from '@/composables/useRelativeTime'
import { PERMISSION_INDEX, PRODUCT_META, PRODUCT_ORDER, type ProductKey } from '@/stores/rbacData'

const open = defineModel<boolean>({ default: false })

const props = defineProps<{
  userId: string | null
}>()

const emit = defineEmits<{
  notify: [message: string]
  'request-remove': [userId: string]
}>()

const rbac = useRbacStore()
const retail = useRetailStore()

const user = computed(() => (props.userId ? rbac.userById(props.userId) : undefined))
const isOwner = computed(() => user.value?.isOwner ?? false)

const localRoleIds = ref<string[]>([])
const scopeAll = ref(true)
const scopeLocationIds = ref<string[]>([])
const showPermissions = ref(false)

watch([open, () => props.userId], ([isOpen]) => {
  if (!isOpen || !user.value) return
  localRoleIds.value = [...user.value.roleIds]
  scopeAll.value = user.value.commerceScope ? user.value.commerceScope.allLocations : true
  scopeLocationIds.value = [...(user.value.commerceScope?.locationIds ?? [])]
  showPermissions.value = false
}, { immediate: true })

const validation = computed(() => rbac.validateAssignment(localRoleIds.value))
const hasCommerceRole = computed(() => localRoleIds.value.some(id => rbac.roleById(id)?.product === 'commerce'))
const scopeValid = computed(() => !hasCommerceRole.value || scopeAll.value || scopeLocationIds.value.length > 0)

const dirty = computed(() => {
  if (!user.value) return false
  const current = [...user.value.roleIds].sort().join(',')
  const next = [...localRoleIds.value].sort().join(',')
  if (current !== next) return true
  const scope = user.value.commerceScope
  const scopeNow = hasCommerceRole.value ? `${scopeAll.value}:${[...scopeLocationIds.value].sort().join(',')}` : 'none'
  const scopeWas = scope ? `${scope.allLocations}:${[...scope.locationIds].sort().join(',')}` : 'none'
  return scopeNow !== scopeWas
})

const canSave = computed(() =>
  !isOwner.value && dirty.value && localRoleIds.value.length > 0 && validation.value.ok && scopeValid.value,
)

/** Live preview — union of the pending role selection, not the saved state. */
const previewPermissions = computed(() => {
  const out = new Set<string>()
  for (const roleId of localRoleIds.value) {
    for (const pid of rbac.roleById(roleId)?.permissionIds ?? []) out.add(pid)
  }
  return out
})

const previewAccess = computed(() => {
  const grantedProducts = new Set<ProductKey>()
  for (const pid of previewPermissions.value) {
    const product = PERMISSION_INDEX[pid]?.product
    if (product) grantedProducts.add(product)
  }
  return PRODUCT_ORDER
    .filter(p => grantedProducts.has(p))
    .map(p => ({ product: p, label: PRODUCT_META[p].label, entitled: rbac.productEntitled(p) }))
})

const previewProducts = computed(() => previewAccess.value.map(a => a.product))

const locationItems = computed(() => retail.locationList.map(l => ({ title: l.name, value: l.id })))

function save() {
  if (!user.value || !canSave.value) return
  const result = rbac.assignRoles(
    user.value.id,
    [...localRoleIds.value],
    hasCommerceRole.value
      ? { allLocations: scopeAll.value, locationIds: scopeAll.value ? [] : [...scopeLocationIds.value] }
      : undefined,
  )
  if (result.ok) {
    emit('notify', `Access updated for ${user.value.name}`)
    open.value = false
  } else if (result.error) {
    emit('notify', result.error)
  }
}

function toggleStatus() {
  if (!user.value || isOwner.value) return
  const next = user.value.status === 'deactivated' ? 'active' : 'deactivated'
  rbac.setUserStatus(user.value.id, next)
  emit('notify', next === 'active' ? `${user.value.name} reactivated` : `${user.value.name} deactivated`)
}

function askRemove() {
  if (!user.value || isOwner.value) return
  emit('request-remove', user.value.id)
}
</script>

<template>
  <MpFormDrawer v-model="open" title="Manage access" :subtitle="user?.email" size="lg">
    <template v-if="user">
      <!-- Identity -->
      <div class="access-identity">
        <v-avatar color="primary" variant="tonal" size="44" class="font-weight-bold">{{ user.avatar }}</v-avatar>
        <div class="access-identity__text">
          <div class="access-identity__name">
            {{ user.name }}
            <v-tooltip v-if="isOwner" location="top" text="Account owner — full access, protected from changes">
              <template #activator="{ props: tipProps }">
                <v-icon v-bind="tipProps" size="15" color="primary">shield-check</v-icon>
              </template>
            </v-tooltip>
          </div>
          <div class="access-identity__meta">
            <MpStatusChip :status="user.status" type="general" size="sm" />
            <span v-if="user.status === 'invited' && user.invitedAt" class="text-caption text-medium-emphasis">
              Invited {{ formatAgo(user.invitedAt) }} by {{ user.invitedBy }}
            </span>
            <span v-else-if="user.lastActiveAt" class="text-caption text-medium-emphasis">
              Last active {{ formatAgo(user.lastActiveAt) }}
            </span>
          </div>
        </div>
      </div>

      <v-alert v-if="isOwner" type="info" variant="tonal" density="compact" rounded="lg" class="text-body-2">
        The account owner always has full access across every product. Roles can’t be changed here.
      </v-alert>

      <!-- Roles -->
      <MpFormSection title="Roles" />
      <RolePicker v-model="localRoleIds" :disabled="isOwner" />

      <v-alert
        v-if="!validation.ok"
        type="warning"
        variant="tonal"
        density="compact"
        rounded="lg"
        class="text-body-2"
      >
        {{ validation.conflicts[0]!.a.name }} can’t be combined with {{ validation.conflicts[0]!.b.name }}. Remove one to save.
      </v-alert>
      <v-alert
        v-else-if="!isOwner && localRoleIds.length === 0"
        type="warning"
        variant="tonal"
        density="compact"
        rounded="lg"
        class="text-body-2"
      >
        Users need at least one role. To take away all access, deactivate or remove the user instead.
      </v-alert>

      <!-- Commerce scope -->
      <template v-if="hasCommerceRole && !isOwner">
        <MpFormSection title="Store scope" />
        <MpFormGrid>
          <MpFormField label="Locations this user can work in">
            <template #default="{ labelId }">
              <v-radio-group v-model="scopeAll" :aria-labelledby="labelId">
                <v-radio label="All locations" :value="true" />
                <v-radio label="Specific locations" :value="false" />
              </v-radio-group>
            </template>
          </MpFormField>
          <v-select
            v-if="!scopeAll"
            v-model="scopeLocationIds"
            :items="locationItems"
            multiple
            chips
            closable-chips
            label="Locations"
          />
        </MpFormGrid>
      </template>

      <!-- Access preview -->
      <div class="d-flex align-center ga-2">
        <MpFormSection title="Product access" />
        <v-spacer />
        <v-btn
          variant="text"
          size="small"
          class="text-none"
          :prepend-icon="showPermissions ? 'chevron-up' : 'chevron-down'"
          @click="showPermissions = !showPermissions"
        >
          {{ showPermissions ? 'Hide' : 'Show' }} effective permissions
        </v-btn>
      </div>
      <div class="access-products">
        <div v-for="entry in previewAccess" :key="entry.product" class="access-products__row">
          <v-icon size="15" :color="entry.entitled ? 'success' : 'warning'">
            {{ entry.entitled ? 'circle-check' : 'lock' }}
          </v-icon>
          <span>{{ entry.label }}</span>
          <span v-if="!entry.entitled" class="access-products__note">Not in this account’s subscription</span>
        </div>
        <div v-if="previewAccess.length === 0" class="text-caption text-medium-emphasis">No access — assign at least one role.</div>
        <p v-if="dirty" class="text-caption text-medium-emphasis">Previewing unsaved role selection.</p>
      </div>

      <PermissionMatrix
        v-if="showPermissions && previewProducts.length"
        :model-value="[...previewPermissions]"
        :products="previewProducts"
        readonly
      />

      <!-- Danger zone -->
      <div class="danger-zone">
        <MpFormSection title="Danger zone" />
        <template v-if="isOwner">
          <p class="text-body-2 text-medium-emphasis">
            The account owner can’t be deactivated, removed, or demoted. Ownership transfer is out of scope for this prototype.
          </p>
        </template>
        <template v-else>
          <p class="text-body-2 text-medium-emphasis">
            Deactivating suspends sign-in but keeps roles and history. Removing permanently deletes the user’s access.
          </p>
          <div class="d-flex ga-3">
            <v-btn
              v-if="user.status !== 'invited'"
              variant="outlined"
              size="small"
              class="text-none"
              :prepend-icon="user.status === 'deactivated' ? 'play' : 'pause'"
              @click="toggleStatus"
            >
              {{ user.status === 'deactivated' ? 'Reactivate user' : 'Deactivate user' }}
            </v-btn>
            <v-btn variant="outlined" color="error" size="small" class="text-none" prepend-icon="trash-2" @click="askRemove">
              Remove user
            </v-btn>
          </div>
        </template>
      </div>
    </template>

    <template #footer>
      <v-btn variant="text" class="text-none" @click="open = false">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="save">Save changes</v-btn>
    </template>
  </MpFormDrawer>
</template>

<style scoped>
.access-identity {
  display: flex;
  align-items: center;
  gap: 14px;
}

.access-identity__text {
  min-width: 0;
}

.access-identity__name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 650;
  color: var(--text-primary);
}

.access-identity__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
}

.access-products {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.access-products__row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 13px;
  color: var(--text-primary);
}

.access-products__row .v-icon {
  align-self: center;
}

.access-products__note {
  font-size: 11.5px;
  color: var(--muted);
}

.danger-zone {
  /* The panel owns the rhythm between its heading, its copy and its buttons —
     those used to be flush because each child cancelled its own margin. */
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
  border: 1px solid color-mix(in oklch, rgb(var(--v-theme-error)) 25%, transparent);
  border-radius: 12px;
  padding: 14px 16px;
  background: color-mix(in oklch, rgb(var(--v-theme-error)) 2%, var(--surface-primary));
}
</style>
