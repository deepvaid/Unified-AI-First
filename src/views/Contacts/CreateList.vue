<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useCdpEntitiesStore,
  blankCarts,
  LIST_BRANDS,
  LIST_LANGUAGES,
  type CdpListCart,
  type CdpListType,
} from '@/stores/useCdpEntities'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const cdp = useCdpEntitiesStore()
const toast = useToast()

const accountId = computed(() => route.params.accountId as string)
const backTo = computed(() => ({ name: 'ContactLists', params: { accountId: accountId.value } }))

/** The account's registered postal address, prefilled exactly as the source does. */
const ACCOUNT_ADDRESS = '100 King St, Sydney NSW 2000, Australia'

const editingId = computed(() => {
  const raw = route.params.id
  return raw == null ? null : Number(raw)
})
const isEdit = computed(() => editingId.value != null)

// ── Form state ────────────────────────────────────────────────────────────────
const name = ref('')
const type = ref<CdpListType>('Normal')
const addToManageSubscription = ref(false)
const brand = ref('')
const displayName = ref('')
const description = ref('')
const postUrl = ref('')
const fromName = ref('')
const fromEmail = ref('')
const replyTo = ref('')
const language = ref<string>('English')
const address = ref(ACCOUNT_ADDRESS)
const carts = ref<CdpListCart[]>(blankCarts())

if (isEdit.value) {
  const existing = cdp.lists.find(l => l.id === editingId.value)
  if (existing) {
    name.value = existing.name
    type.value = existing.type
    addToManageSubscription.value = existing.addToManageSubscription
    brand.value = existing.brand
    displayName.value = existing.displayName
    description.value = existing.description
    postUrl.value = existing.postUrl
    fromName.value = existing.fromName
    fromEmail.value = existing.fromEmail
    replyTo.value = existing.replyTo
    language.value = existing.language
    address.value = existing.address
    carts.value = existing.carts.map(c => ({ ...c }))
  }
}

// ── Validation ────────────────────────────────────────────────────────────────
const nameTouched = ref(false)
const addressTouched = ref(false)

const nameError = computed(() =>
  nameTouched.value && name.value.trim() === '' ? 'Enter a list name' : '',
)
// The source marks Address required but lets Save through without it. Treated as
// a defect and gated here — see PARITY.md "Deliberate deviations".
const addressError = computed(() =>
  addressTouched.value && address.value.trim() === ''
    ? 'Enter the postal address shown in campaign footers'
    : '',
)

const canSave = computed(() => name.value.trim() !== '' && address.value.trim() !== '')

// ── Dirty guard ───────────────────────────────────────────────────────────────
function serializeForm(): string {
  return JSON.stringify({
    name: name.value, type: type.value, ams: addToManageSubscription.value,
    brand: brand.value, displayName: displayName.value, description: description.value,
    postUrl: postUrl.value, fromName: fromName.value, fromEmail: fromEmail.value,
    replyTo: replyTo.value, language: language.value, address: address.value,
    carts: carts.value,
  })
}
const savedSnapshot = ref(serializeForm())
const isDirty = computed(() => serializeForm() !== savedSnapshot.value)

const {
  confirmLeave, allowNextLeave, discardAndLeave,
  leaveTitle, leaveMessage, leaveConfirmLabel,
} = useDirtyLeaveGuard(isDirty, {
  title: 'Leave without saving this list?',
  message: 'You have unsaved changes. Leaving now will discard them.',
})

const saving = ref(false)

function save() {
  nameTouched.value = true
  addressTouched.value = true
  if (!canSave.value || saving.value) return
  saving.value = true

  const payload = {
    name: name.value.trim(),
    type: type.value,
    addToManageSubscription: addToManageSubscription.value,
    brand: brand.value,
    displayName: displayName.value.trim(),
    description: description.value.trim(),
    postUrl: postUrl.value.trim(),
    fromName: fromName.value.trim(),
    fromEmail: fromEmail.value.trim(),
    replyTo: replyTo.value.trim(),
    language: language.value,
    address: address.value.trim(),
    carts: carts.value.map(c => ({ ...c })),
  }

  if (isEdit.value && editingId.value != null) {
    cdp.updateList(editingId.value, payload)
    toast.success('List updated')
  } else {
    cdp.addList(payload)
    toast.success('List created')
  }

  savedSnapshot.value = serializeForm()
  allowNextLeave()
  setTimeout(() => router.push(backTo.value), 700)
}
</script>

<template>
  <div class="mp-frame-fill d-flex flex-column">
    <div class="px-8 pt-6 pb-4 bg-surface page-head">
      <MpPageHeader
        :title="isEdit ? 'Edit list' : 'New list'"
        subtitle="A list groups contacts and carries the sender identity used when you email them."
        :back-to="backTo"
      />
    </div>

    <div class="flex-grow-1 overflow-y-auto px-8 py-6 bg-background">
      <div class="cl-body mx-auto d-flex flex-column ga-6">
        <!-- List details.
             The source leaves this section untitled and unbounded — seven fields
             floating above two titled cards. Given a name and a card here. -->
        <v-card flat border rounded="lg" class="pa-6">
          <MpFormSection
            title="List details"
            description="Name the list and choose how it behaves."
            :heading-level="2"
          />
          <MpFormGrid :cols="2">
            <v-text-field
              v-model="name"
              label="List name *"
              counter="150"
              maxlength="150"
              class="mp-form-grid__full"
              :error-messages="nameError ? [nameError] : []"
              @blur="nameTouched = true"
            />
            <v-select
              v-model="type"
              label="List type"
              :items="['Normal', 'Suppressed']"
              hint="Suppressed lists are excluded from every send."
              persistent-hint
            />
            <v-autocomplete
              v-model="brand"
              label="Brand"
              :items="[...LIST_BRANDS]"
              clearable
            />
          </MpFormGrid>
        </v-card>

        <!-- Manage Subscription page.
             In the source these three fields sit among the general fields, and
             their shared purpose is buried in hover-only tooltips. Grouped here
             so the relationship is structural, and the tooltip copy is promoted
             to always-visible, programmatically-associated hints. -->
        <v-card flat border rounded="lg" class="pa-6">
          <MpFormSection
            title="Manage Subscription page"
            description="How this list appears on the hosted page where contacts choose what they receive."
            :heading-level="2"
          />
          <MpFormGrid :cols="2">
            <!-- A Yes/No dropdown in the source. A switch states the same binary
                 more directly and keeps the hint permanently visible. -->
            <MpFormField
              label="Show this list to contacts"
              hint="Manage Subscription lets contacts choose which lists they subscribe to or unsubscribe from."
              class="mp-form-grid__full"
            >
              <template #default="{ labelId, descriptionId }">
                <v-switch
                  v-model="addToManageSubscription"
                  :aria-labelledby="labelId"
                  :aria-describedby="descriptionId"
                  :label="addToManageSubscription ? 'Yes' : 'No'"
                  hide-details
                />
              </template>
            </MpFormField>
            <v-text-field
              v-model="displayName"
              label="Display name"
              class="mp-form-grid__full"
              hint="The name of the list shown to contacts on the Manage Subscription page."
              persistent-hint
            />
            <v-textarea
              v-model="description"
              label="Description"
              rows="3"
              class="mp-form-grid__full"
              hint="The description of the list as it appears on the Manage Subscription page."
              persistent-hint
            />
            <v-text-field
              v-model="postUrl"
              label="Post URL"
              type="url"
              inputmode="url"
              placeholder="https://example.com/webhooks/subscriptions"
              class="mp-form-grid__full"
              hint="A webhook that fires each time a contact's subscription status for this list changes."
              persistent-hint
            />
          </MpFormGrid>
        </v-card>

        <!-- Email campaign fields -->
        <v-card flat border rounded="lg" class="pa-6">
          <MpFormSection
            title="Sender identity"
            description="Used on every email campaign sent to this list. The postal address is a legal requirement in campaign footers."
            :heading-level="2"
          />
          <MpFormGrid :cols="2">
            <v-text-field v-model="fromName" label="From name" />
            <v-text-field v-model="fromEmail" label="From email" type="email" inputmode="email" />
            <v-text-field v-model="replyTo" label="Reply to" type="email" inputmode="email" />
            <v-select v-model="language" label="Language" :items="[...LIST_LANGUAGES]" />
            <!-- A single-line input in the source, where a long postal address
                 scrolls out of view and cannot be checked. -->
            <v-textarea
              v-model="address"
              label="Address *"
              rows="3"
              class="mp-form-grid__full"
              :error-messages="addressError ? [addressError] : []"
              @blur="addressTouched = true"
            />
          </MpFormGrid>
        </v-card>

        <!-- Carts -->
        <v-card flat border rounded="lg" class="pa-6">
          <MpFormSection
            title="Cart integrations"
            description="Bind this list to a connected cart. Each cart's field is enabled once you select it."
            :heading-level="2"
          />
          <MpFormGrid :cols="1">
            <!-- Each cart is a group so its field is announced as belonging to
                 its checkbox — in the source the pairing is visual only. -->
            <div
              v-for="cart in carts"
              :key="cart.id"
              role="group"
              :aria-label="`${cart.name} cart integration`"
              class="d-flex flex-column ga-2"
            >
              <v-checkbox
                v-model="cart.enabled"
                :label="cart.name"
                hide-details
              />
              <!-- The source leaves this field enabled while its cart is unchecked,
                   with no indication whether the value is kept. Gated here. -->
              <v-text-field
                v-model="cart.itemProductLds"
                label="Item / Product / LDS"
                :disabled="!cart.enabled"
                class="cl-cart-field"
              />
            </div>
          </MpFormGrid>
        </v-card>
      </div>
    </div>

    <div class="px-8 py-4 bg-surface page-foot d-flex align-center justify-space-between ga-3 cl-foot">
      <p v-if="!canSave" class="text-caption text-medium-emphasis mb-0 cl-foot__hint">
        A list name and a postal address are needed to save this list.
      </p>
      <span v-else />
      <div class="d-flex ga-3 cl-foot__actions">
        <v-btn variant="text" class="text-none" :to="backTo">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          prepend-icon="check"
          :disabled="!canSave"
          :loading="saving"
          @click="save"
        >
          {{ isEdit ? 'Save changes' : 'Create list' }}
        </v-btn>
      </div>
    </div>

    <MpConfirmDialog
      v-model="confirmLeave"
      danger
      :title="leaveTitle"
      :message="leaveMessage"
      :confirm-label="leaveConfirmLabel"
      @confirm="discardAndLeave"
    />
  </div>
</template>

<style scoped lang="scss">
.cl-body {
  width: 100%;
  /* Matches CreateContact.vue's form measure — there is no form-width token and
     contentMaxWidth (1280) is too wide for a 2-column form. */
  max-width: 880px;
}

/* GAP: no MpFormPage shell exists, so the sticky head/foot rules are copied from
   CreateContact.vue — see docs/rebuild/GAPS.md §5. */
.page-head {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.page-head :deep(.mp-page-header) {
  margin-bottom: 0;
}

.page-foot {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* The cart field is indented to read as belonging to the checkbox above it. */
.cl-cart-field {
  margin-inline-start: var(--mp-space-32);
}

@media (max-width: $mp-layout-breakpointCompact) {
  .cl-foot {
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .cl-foot__hint {
    flex: 1 0 100%;
  }

  .cl-foot__actions {
    flex: 0 0 auto;
  }

  .cl-cart-field {
    margin-inline-start: 0;
  }
}
</style>
