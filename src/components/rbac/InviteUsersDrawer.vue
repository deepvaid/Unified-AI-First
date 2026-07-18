<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
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

watch(open, (isOpen) => {
  if (isOpen) {
    step.value = 1
    emails.value = []
    roleIds.value = []
    scopeAll.value = true
    scopeLocationIds.value = []
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
  <MpFormDrawer v-model="open" title="Invite users" :subtitle="`Step ${step} of 2`" :width="520">
    <!-- Step 1: who + which roles -->
    <div v-if="step === 1">
      <div class="text-subtitle-2 font-weight-bold mb-2">Email addresses</div>
      <v-combobox
        v-model="emails"
        multiple
        chips
        closable-chips
        variant="outlined"
        density="compact"
        placeholder="name@company.com — press Enter after each"
        :error-messages="invalidEmails.length ? `Invalid email${invalidEmails.length === 1 ? '' : 's'}: ${invalidEmails.join(', ')}` : undefined"
        class="mb-4"
        aria-label="Email addresses to invite"
      />

      <div class="text-subtitle-2 font-weight-bold mb-2">Roles</div>
      <p class="text-caption text-medium-emphasis mt-0 mb-3">
        Every invitee receives the same roles. Roles are grouped by product and filtered to this account’s subscriptions.
      </p>
      <RolePicker v-model="roleIds" />

      <v-alert
        v-if="!validation.ok"
        type="warning"
        variant="tonal"
        density="compact"
        rounded="lg"
        class="text-body-2 mt-4"
      >
        {{ validation.conflicts[0]!.a.name }} can’t be combined with {{ validation.conflicts[0]!.b.name }}. Remove one to continue.
      </v-alert>

      <template v-if="hasCommerceRole">
        <div class="text-subtitle-2 font-weight-bold mt-5 mb-2">Store scope</div>
        <v-radio-group v-model="scopeAll" hide-details density="compact" class="mb-2">
          <v-radio label="All locations" :value="true" />
          <v-radio label="Specific locations" :value="false" />
        </v-radio-group>
        <v-select
          v-if="!scopeAll"
          v-model="scopeLocationIds"
          :items="locationItems"
          multiple
          chips
          closable-chips
          label="Locations"
          variant="outlined"
          density="compact"
          class="mb-2"
        />
        <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="text-body-2">
          Location scoping is provisional — the commerce permission catalog is still being finalized.
        </v-alert>
      </template>
    </div>

    <!-- Step 2: review & confirm -->
    <div v-else>
      <div class="text-subtitle-2 font-weight-bold mb-2">Inviting {{ emails.length }} {{ emails.length === 1 ? 'person' : 'people' }}</div>
      <div class="d-flex flex-wrap gap-2 mb-5">
        <v-chip v-for="email in emails" :key="email" size="small" variant="tonal" prepend-icon="mail">{{ email }}</v-chip>
      </div>

      <div class="text-subtitle-2 font-weight-bold mb-2">Roles</div>
      <div v-for="group in reviewGroups" :key="group.product" class="mb-3">
        <div class="text-caption text-medium-emphasis mb-1">{{ group.label }}</div>
        <div class="d-flex flex-wrap gap-2">
          <v-chip v-for="role in group.roles" :key="role!.id" size="small" variant="tonal" color="secondary">{{ role!.name }}</v-chip>
        </div>
      </div>

      <div class="text-subtitle-2 font-weight-bold mt-5 mb-2">Access summary</div>
      <div class="review-access mb-5">
        <div v-for="entry in reviewAccess" :key="entry.product" class="review-access__row">
          <v-icon size="15" :color="entry.entitled ? 'success' : 'warning'">
            {{ entry.entitled ? 'circle-check' : 'lock' }}
          </v-icon>
          <span>{{ entry.label }}</span>
          <span v-if="!entry.entitled" class="review-access__note">Not in this account’s subscription — access stays inactive until subscribed</span>
        </div>
      </div>

      <div v-if="hasCommerceRole" class="mb-5">
        <div class="text-subtitle-2 font-weight-bold mb-1">Store scope</div>
        <span class="text-body-2 text-medium-emphasis">
          {{ scopeAll ? 'All locations' : scopeLocationIds.map(id => retail.locationName(id)).join(', ') }}
        </span>
      </div>

      <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="text-body-2">
        Each invitee receives a sign-up link by email. Access is granted after they accept, and every invitation is recorded in the audit log.
      </v-alert>
    </div>

    <template #footer>
      <div class="w-100 d-flex justify-end ga-2">
        <v-btn v-if="step === 2" variant="text" class="text-none" @click="step = 1">Back</v-btn>
        <v-btn v-else variant="text" class="text-none" @click="open = false">Cancel</v-btn>
        <v-btn v-if="step === 1" color="primary" variant="flat" class="text-none" :disabled="!canContinue" @click="step = 2">
          Continue
        </v-btn>
        <v-btn v-else color="primary" variant="flat" class="text-none" prepend-icon="send" @click="sendInvites">
          Send invitation{{ emails.length === 1 ? '' : 's' }}
        </v-btn>
      </div>
    </template>
  </MpFormDrawer>
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
  color: var(--ink);
}

.review-access__row .v-icon {
  align-self: center;
}

.review-access__note {
  font-size: 11.5px;
  color: var(--muted);
}
</style>
