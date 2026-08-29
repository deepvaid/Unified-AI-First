<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import RolePicker from '@/components/rbac/RolePicker.vue'
import { useRbacStore } from '@/stores/useRbac'
import { useRetailStore } from '@/stores/useRetail'
import { PERMISSION_INDEX, PRODUCT_META, PRODUCT_ORDER, type ProductKey } from '@/stores/rbacData'

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{ invited: [emails: string[]] }>()

const rbac = useRbacStore()
const retail = useRetailStore()

const step = ref(1)
const emails = ref<string[]>([])
const roleIds = ref<string[]>([])
const scopeAll = ref(true)
const scopeLocationIds = ref<string[]>([])

// Snapshot the form on open so close paths can tell edits from noise.
const openSnapshot = ref('')
function snapshotState() {
  return JSON.stringify([emails.value, roleIds.value, scopeAll.value, scopeLocationIds.value])
}
const drawerDirty = computed(() => open.value && snapshotState() !== openSnapshot.value)

const confirmDiscard = ref(false)
function requestCloseDrawer() {
  if (drawerDirty.value) confirmDiscard.value = true
  else open.value = false
}

watch(open, (isOpen) => {
  if (isOpen) {
    step.value = 1
    emails.value = []
    roleIds.value = []
    scopeAll.value = true
    scopeLocationIds.value = []
    openSnapshot.value = snapshotState()
  }
})

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const invalidEmails = computed(() => emails.value.filter(e => !EMAIL_RE.test(e)))

const hasCommerceRole = computed(() => roleIds.value.some(id => rbac.roleById(id)?.product === 'commerce'))
const validation = computed(() => rbac.validateAssignment(roleIds.value))

const scopeValid = computed(() => !hasCommerceRole.value || scopeAll.value || scopeLocationIds.value.length > 0)
const canContinue = computed(() =>
  emails.value.length > 0
  && invalidEmails.value.length === 0
  && roleIds.value.length > 0
  && validation.value.ok
  && scopeValid.value,
)

const locationItems = computed(() => retail.locationList.map(l => ({ title: l.name, value: l.id })))

/** Selected roles grouped by product for the review step. */
const reviewGroups = computed(() =>
  PRODUCT_ORDER
    .map(product => ({
      product,
      label: PRODUCT_META[product].label,
      roles: roleIds.value.map(id => rbac.roleById(id)).filter(r => r && r.product === product),
    }))
    .filter(g => g.roles.length > 0),
)

/** Products the selected roles grant access to, with entitlement state. */
const reviewAccess = computed(() => {
  const grantedProducts = new Set<ProductKey>()
  for (const roleId of roleIds.value) {
    for (const pid of rbac.roleById(roleId)?.permissionIds ?? []) {
      const product = PERMISSION_INDEX[pid]?.product
      if (product) grantedProducts.add(product)
    }
  }
  return PRODUCT_ORDER
    .filter(p => grantedProducts.has(p))
    .map(p => ({ product: p, label: PRODUCT_META[p].label, entitled: rbac.productEntitled(p) }))
})

function sendInvites() {
  const created = rbac.inviteUsers({
    emails: [...emails.value],
    roleIds: [...roleIds.value],
    commerceScope: hasCommerceRole.value
      ? { allLocations: scopeAll.value, locationIds: scopeAll.value ? [] : [...scopeLocationIds.value] }
      : undefined,
  })
  open.value = false
  emit('invited', created.map(u => u.email))
}
</script>

<template>
  <MpFormDrawer
    v-model="open"
    title="Invite users"
    :subtitle="`Step ${step} of 2`"
    :guarded="drawerDirty"
    @close="requestCloseDrawer"
  >
    <!-- Step 1: who + which roles -->
    <MpFormGrid v-if="step === 1">
      <v-combobox
        v-model="emails"
        multiple
        chips
        closable-chips
        label="Email addresses *"
        placeholder="name@company.com"
        hint="Press Enter after each address."
        persistent-hint
        :error-messages="invalidEmails.length ? `Invalid email${invalidEmails.length === 1 ? '' : 's'}: ${invalidEmails.join(', ')}` : undefined"
      />

      <MpFormSection
        title="Roles"
        required
        description="Every invitee receives the same roles. Roles are grouped by product and filtered to this account’s subscriptions."
      />
      <RolePicker v-model="roleIds" />

      <v-alert
        v-if="!validation.ok"
        type="warning"
        variant="tonal"
        density="compact"
        rounded="lg"
        class="text-body-2"
      >
        {{ validation.conflicts[0]!.a.name }} can’t be combined with {{ validation.conflicts[0]!.b.name }}. Remove one to continue.
      </v-alert>

      <template v-if="hasCommerceRole">
        <MpFormSection title="Store scope" />
        <MpFormField label="Locations this invitation covers">
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
        <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="text-body-2">
          Location scoping is provisional — the commerce permission catalog is still being finalized.
        </v-alert>
      </template>
    </MpFormGrid>

    <!-- Step 2: review & confirm -->
    <MpFormGrid v-else>
      <MpFormSection :title="`Inviting ${emails.length} ${emails.length === 1 ? 'person' : 'people'}`" />
      <div class="d-flex flex-wrap ga-2">
        <v-chip v-for="email in emails" :key="email" size="small" variant="tonal" prepend-icon="mail">{{ email }}</v-chip>
      </div>

      <MpFormSection title="Roles" />
      <div v-for="group in reviewGroups" :key="group.product" class="d-flex flex-column ga-1">
        <div class="text-caption text-medium-emphasis">{{ group.label }}</div>
        <div class="d-flex flex-wrap ga-2">
          <v-chip v-for="role in group.roles" :key="role!.id" size="small" variant="tonal" color="secondary">{{ role!.name }}</v-chip>
        </div>
      </div>

      <MpFormSection title="Access summary" />
      <div class="review-access">
        <div v-for="entry in reviewAccess" :key="entry.product" class="review-access__row">
          <v-icon size="15" :color="entry.entitled ? 'success' : 'warning'">
            {{ entry.entitled ? 'circle-check' : 'lock' }}
          </v-icon>
          <span>{{ entry.label }}</span>
          <span v-if="!entry.entitled" class="review-access__note">Not in this account’s subscription — access stays inactive until subscribed</span>
        </div>
      </div>

      <template v-if="hasCommerceRole">
        <MpFormSection title="Store scope" />
        <span class="text-body-2 text-medium-emphasis">
          {{ scopeAll ? 'All locations' : scopeLocationIds.map(id => retail.locationName(id)).join(', ') }}
        </span>
      </template>

      <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="text-body-2">
        Each invitee receives a sign-up link by email. Access is granted after they accept, and every invitation is recorded in the audit log.
      </v-alert>
    </MpFormGrid>

    <template #footer>
      <v-btn v-if="step === 2" variant="text" class="text-none" @click="step = 1">Back</v-btn>
      <v-btn v-else variant="text" class="text-none" @click="requestCloseDrawer">Cancel</v-btn>
      <v-btn v-if="step === 1" color="primary" variant="flat" class="text-none" :disabled="!canContinue" @click="step = 2">
        Continue
      </v-btn>
      <v-btn v-else color="primary" variant="flat" class="text-none" prepend-icon="send" @click="sendInvites">
        Send invitation{{ emails.length === 1 ? '' : 's' }}
      </v-btn>
    </template>
  </MpFormDrawer>

  <MpConfirmDialog
    v-model="confirmDiscard"
    title="Discard invitation changes?"
    message="You have unsaved changes to this invitation. Closing now will discard them."
    confirm-label="Discard changes"
    danger
    @confirm="open = false"
  />
</template>

<style scoped>
.review-access {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.review-access__row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 13px;
  color: var(--text-primary);
}

.review-access__row .v-icon {
  align-self: center;
}

.review-access__note {
  font-size: 11.5px;
  color: var(--muted);
}
</style>
