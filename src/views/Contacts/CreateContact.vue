<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContactsStore } from '@/stores/useContacts'
import { useCdpEntitiesStore, type CdpField } from '@/stores/useCdpEntities'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const contacts = useContactsStore()
const cdp = useCdpEntitiesStore()
const toast = useToast()

const accountId = computed(() => route.params.accountId as string)
const backTo = computed(() => ({ name: 'AllContacts', params: { accountId: accountId.value } }))

// ── Contact details ───────────────────────────────────────────────────────────
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const phone = ref('')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const emailTouched = ref(false)
const emailError = computed(() =>
  emailTouched.value && email.value.trim() !== '' && !EMAIL_RE.test(email.value.trim())
    ? 'Enter a valid email address, for example name@company.com'
    : '',
)

/** A contact is identified by email or phone — at least one is required. */
const hasEmail = computed(() => email.value.trim() !== '')
const hasPhone = computed(() => phone.value.trim() !== '')
const hasIdentifier = computed(() => hasEmail.value || hasPhone.value)
const canSave = computed(() => hasIdentifier.value && emailError.value === '')

// ── List subscription ─────────────────────────────────────────────────────────
const listId = ref<number | null>(null)
const optedInEmail = ref(false)
const optedInSms = ref(false)

const listOptions = computed(() =>
  cdp.lists.map(l => ({ title: `${l.name} (${l.count.toLocaleString()})`, value: l.id })),
)

/** Opt-in is only meaningful once a list is chosen and that channel has a value. */
const canOptInEmail = computed(() => listId.value != null && hasEmail.value)
const canOptInSms = computed(() => listId.value != null && hasPhone.value)

function onListChange() {
  // Parity with the source: choosing a list pre-selects every eligible channel.
  // Unlike the source, the operator is told this happened (see the section hint).
  optedInEmail.value = canOptInEmail.value
  optedInSms.value = canOptInSms.value
}

// ── Tags ──────────────────────────────────────────────────────────────────────
const tags = ref<string[]>([])
const tagOptions = computed(() => cdp.tags.map(t => t.name))

// ── Custom fields ─────────────────────────────────────────────────────────────
const fieldSearch = ref('')
const fieldValues = ref<Record<string, string | boolean>>({})

const visibleFields = computed(() => {
  const q = fieldSearch.value.trim().toLowerCase()
  if (!q) return cdp.fields
  return cdp.fields.filter(
    f => f.name.toLowerCase().includes(q) || f.displayName.toLowerCase().includes(q),
  )
})

function fieldLabel(f: CdpField) {
  return f.displayName || f.name
}

function valueOf(f: CdpField) {
  return fieldValues.value[f.name] ?? (f.type === 'Boolean' ? false : '')
}

function setValue(f: CdpField, value: string | boolean | null) {
  fieldValues.value[f.name] = value ?? ''
}

/** Only fields the operator actually filled are saved — no silent defaults. */
const filledFields = computed(() =>
  Object.entries(fieldValues.value).filter(([, v]) => v !== '' && v !== false),
)

function inputTypeFor(f: CdpField) {
  if (f.type === 'Integer' || f.type === 'Float') return 'number'
  if (f.type === 'Datetime') return 'date'
  return 'text'
}

// ── Add custom field drawer ───────────────────────────────────────────────────
const FIELD_TYPES = ['String', 'Integer', 'Boolean', 'Datetime', 'Text', 'Float'] as const
const addFieldOpen = ref(false)
const nfName = ref('')
const nfType = ref<(typeof FIELD_TYPES)[number]>('String')
const nfDefault = ref('')
const nfDisplayName = ref('')
const nfDescription = ref('')
const nfEditProfile = ref(false)
const nfSubmitted = ref(false)

const nfNameValid = computed(() => nfName.value.trim() !== '')

function openAddField() {
  nfName.value = ''
  nfType.value = 'String'
  nfDefault.value = ''
  nfDisplayName.value = ''
  nfDescription.value = ''
  nfEditProfile.value = false
  nfSubmitted.value = false
  addFieldOpen.value = true
}

function saveField() {
  nfSubmitted.value = true
  if (!nfNameValid.value) return
  cdp.addField({
    name: nfName.value.trim(),
    type: nfType.value,
    defaultValue: nfDefault.value,
    displayName: nfDisplayName.value.trim(),
    description: nfDescription.value.trim(),
    addToEditProfile: nfEditProfile.value,
  })
  addFieldOpen.value = false
  toast.success(`Custom field “${nfName.value.trim()}” added`)
}

// ── Journey trigger ───────────────────────────────────────────────────────────
const triggerJourneys = ref(true)

// ── Unsaved-changes guard ─────────────────────────────────────────────────────
function serializeForm() {
  return JSON.stringify([
    firstName.value, lastName.value, email.value, phone.value,
    listId.value, optedInEmail.value, optedInSms.value,
    tags.value, fieldValues.value, triggerJourneys.value,
  ])
}
const savedSnapshot = ref(serializeForm())
const isDirty = computed(() => serializeForm() !== savedSnapshot.value)
const {
  confirmLeave,
  allowNextLeave,
  discardAndLeave,
  leaveTitle,
  leaveMessage,
  leaveConfirmLabel,
} = useDirtyLeaveGuard(isDirty, {
  title: 'Leave without saving this contact?',
  message: 'You have unsaved changes. Leaving now will discard them.',
})

const saving = ref(false)

function save() {
  emailTouched.value = true
  if (!canSave.value || saving.value) return
  saving.value = true
  contacts.addContact({
    firstName: firstName.value.trim(),
    lastName: lastName.value.trim(),
    email: email.value.trim(),
    phone: phone.value.trim(),
    tags: tags.value,
    listId: listId.value ?? undefined,
    optedInEmail: optedInEmail.value,
    optedInSms: optedInSms.value,
    customFields: Object.fromEntries(filledFields.value),
    triggerJourneys: triggerJourneys.value,
  })
  savedSnapshot.value = serializeForm()
  toast.success('Contact created')
  allowNextLeave()
  setTimeout(() => router.push(backTo.value), 700)
}
</script>

<template>
  <div class="mp-frame-fill d-flex flex-column">
    <div class="px-8 pt-6 pb-4 bg-surface page-head">
      <MpPageHeader
        title="New contact"
        subtitle="Add a single contact by hand. Email or phone number is required."
        :back-to="backTo"
      />
    </div>

    <div class="flex-grow-1 overflow-y-auto px-8 py-6 bg-background">
      <div class="nc-body mx-auto d-flex flex-column ga-6">
        <!-- Contact details -->
        <v-card flat border rounded="lg" class="pa-6">
          <MpFormSection
            title="Contact details"
            description="Enter an email address or a phone number — at least one is needed to identify this contact."
            :heading-level="2"
          />
          <MpFormGrid :cols="2">
            <v-text-field v-model="firstName" label="First name" autocomplete="given-name" />
            <v-text-field v-model="lastName" label="Last name" autocomplete="family-name" />
            <v-text-field
              v-model="email"
              label="Email"
              type="email"
              inputmode="email"
              autocomplete="email"
              placeholder="name@company.com"
              :error-messages="emailError ? [emailError] : []"
              @blur="emailTouched = true"
            />
            <v-text-field
              v-model="phone"
              label="Phone number"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              placeholder="+61 412 345 678"
              hint="Include the country code."
              persistent-hint
            />
          </MpFormGrid>
        </v-card>

        <!-- List subscription -->
        <v-card flat border rounded="lg" class="pa-6">
          <MpFormSection
            title="List subscription"
            :description="hasIdentifier
              ? 'Choosing a list opts this contact in to every channel you have a value for. Uncheck any you do not have consent for.'
              : 'Add an email address or phone number above to subscribe this contact to a list.'"
            :heading-level="2"
          />
          <MpFormGrid :cols="2">
            <v-select
              v-model="listId"
              label="List"
              :items="listOptions"
              :disabled="!hasIdentifier"
              clearable
              @update:model-value="onListChange"
            />
            <div />
            <MpFormField label="Opt-in status" class="mp-form-grid__full">
              <template #default="{ labelId }">
                <div role="group" class="d-flex flex-wrap ga-6" :aria-labelledby="labelId">
                  <v-checkbox
                    v-model="optedInEmail"
                    label="Opted in for email notifications"
                    :disabled="!canOptInEmail"
                    hide-details
                  />
                  <v-checkbox
                    v-model="optedInSms"
                    label="Opted in for SMS notifications"
                    :disabled="!canOptInSms"
                    hide-details
                  />
                </div>
              </template>
            </MpFormField>
          </MpFormGrid>
        </v-card>

        <!-- Tags -->
        <v-card flat border rounded="lg" class="pa-6">
          <MpFormSection
            title="Tags"
            description="Tags group contacts for segments and campaign targeting."
            :heading-level="2"
          />
          <MpFormGrid>
            <v-select
              v-model="tags"
              label="Tags"
              :items="tagOptions"
              multiple
              chips
              closable-chips
            />
          </MpFormGrid>
        </v-card>

        <!-- Custom fields -->
        <v-card flat border rounded="lg" class="pa-6">
          <div class="d-flex align-start justify-space-between ga-4 flex-wrap">
            <MpFormSection
              title="Custom fields"
              description="Optional. Only the fields you fill in are saved to this contact."
              :heading-level="2"
              class="flex-grow-1"
            />
            <v-btn variant="outlined" class="text-none" prepend-icon="plus" @click="openAddField">
              Add field
            </v-btn>
          </div>

          <v-text-field
            v-model="fieldSearch"
            label="Search custom fields"
            prepend-inner-icon="search"
            clearable
            class="mb-4"
            :hint="`${visibleFields.length} of ${cdp.fields.length} fields`"
            persistent-hint
          />

          <MpFormGrid v-if="visibleFields.length" :cols="2">
            <template v-for="f in visibleFields" :key="f.id">
              <v-checkbox
                v-if="f.type === 'Boolean'"
                :model-value="valueOf(f) === true"
                :label="fieldLabel(f)"
                @update:model-value="setValue(f, $event === true)"
              />
              <v-textarea
                v-else-if="f.type === 'Text'"
                :model-value="valueOf(f) as string"
                :label="fieldLabel(f)"
                rows="3"
                class="mp-form-grid__full"
                @update:model-value="setValue(f, $event)"
              />
              <v-text-field
                v-else
                :model-value="valueOf(f) as string"
                :label="fieldLabel(f)"
                :type="inputTypeFor(f)"
                @update:model-value="setValue(f, $event)"
              />
            </template>
          </MpFormGrid>

          <MpEmptyState
            v-else
            icon="search-x"
            title="No matching fields"
            :description="`Nothing matches “${fieldSearch}”. Try a different search, or add a new custom field.`"
            action-label="Clear search"
            :heading-level="3"
            @action="fieldSearch = ''"
          />
        </v-card>

        <!-- Journey trigger -->
        <v-card flat border rounded="lg" class="pa-6">
          <MpFormField
            label="Trigger journey campaigns"
            hint="When on, contacts added to the list above enter any journey whose New Subscription trigger uses that list. This does not affect other journey triggers."
          >
            <template #default="{ labelId, descriptionId }">
              <v-switch
                v-model="triggerJourneys"
                :aria-labelledby="labelId"
                :aria-describedby="descriptionId"
                :label="triggerJourneys ? 'On' : 'Off'"
                hide-details
              />
            </template>
          </MpFormField>
        </v-card>
      </div>
    </div>

    <div class="px-8 py-4 bg-surface page-foot d-flex align-center justify-space-between ga-3 nc-foot">
      <p v-if="!hasIdentifier" class="text-caption text-medium-emphasis mb-0 nc-foot__hint">
        Add an email address or phone number to save this contact.
      </p>
      <span v-else />
      <div class="d-flex ga-3 nc-foot__actions">
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
          Save contact
        </v-btn>
      </div>
    </div>

    <!-- Add custom field -->
    <MpFormDrawer
      v-model="addFieldOpen"
      title="Add custom field"
      subtitle="Custom fields store extra data against every contact in this account."
      size="sm"
    >
      <MpFormGrid>
        <v-text-field
          v-model="nfName"
          label="Field name *"
          placeholder="loyalty_tier"
          :error-messages="nfSubmitted && !nfNameValid ? ['Enter a field name'] : []"
        />
        <v-select
          v-model="nfType"
          label="Field type *"
          :items="[...FIELD_TYPES]"
          hint="Field type cannot be changed after the field is created."
          persistent-hint
        />
        <v-text-field v-model="nfDefault" label="Default value" />
        <v-text-field
          v-model="nfDisplayName"
          label="Display name"
          hint="Shown instead of the field name wherever the field appears."
          persistent-hint
        />
        <v-textarea v-model="nfDescription" label="Description" rows="3" />
        <MpFormField
          label="Add to the edit profile page"
          hint="Shows this field's data on the Edit Profile page, visible to your contacts."
        >
          <template #default="{ labelId, descriptionId }">
            <v-switch
              v-model="nfEditProfile"
              :aria-labelledby="labelId"
              :aria-describedby="descriptionId"
              :label="nfEditProfile ? 'Visible to contacts' : 'Hidden from contacts'"
              hide-details
            />
          </template>
        </MpFormField>
      </MpFormGrid>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="addFieldOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" @click="saveField">Add field</v-btn>
      </template>
    </MpFormDrawer>

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
.nc-body {
  width: 100%;
  /* Local form measure, as CreateTransactional.vue does for its own grid — there is
     no form-width token, and contentMaxWidth (1280) is too wide for a 2-column form. */
  max-width: 880px;
}

/* GAP: no MpFormPage shell exists, so the sticky head/foot rules are copied from
   CreateTransactional.vue, as CreateTransactionalSms.vue already does — see
   docs/rebuild/GAPS.md §5. */
.page-head {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.page-head :deep(.mp-page-header) {
  margin-bottom: 0;
}

.page-foot {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Below the compact breakpoint the hint gets its own line rather than being
   crushed into a column beside the buttons. */
@media (max-width: $mp-layout-breakpointCompact) {
  .nc-foot {
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .nc-foot__hint {
    flex: 1 0 100%;
  }

  .nc-foot__actions {
    flex: 0 0 auto;
  }
}
</style>
