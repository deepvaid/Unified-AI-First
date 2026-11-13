<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import MpAlert from '@/components/MpAlert.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import { useResponsiveTableHeaders, type ResponsiveHeader } from '@/composables/useResponsiveTableHeaders'
import { useToast } from '@/composables/useToast'
import { useServiceSettingsStore } from '@/stores/useServiceSettings'
import { inboxReplyState, type Inbox, type SupportEmail } from '@/service/model'

const props = defineProps<{ inbox: Inbox }>()
// Rows act immediately, so this tab never holds unsaved edits.
defineEmits<{ dirty: [dirty: boolean] }>()

const settings = useServiceSettingsStore()
const toast = useToast()

const emails = computed(() => settings.emailsFor(props.inbox.id))
const replyState = computed(() => inboxReplyState(emails.value))
const pending = computed(() => emails.value.filter(e => e.status === 'Pending'))

// When the table is too narrow for the Email address column, the address folds under the
// sender name, so Status and the row menu stay on screen instead of scrolling off to the right.
const headers: ResponsiveHeader[] = [
  { title: 'Sender name', key: 'name' },
  { title: 'Email address', key: 'address', hideBelow: 'sm' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: 56, headerProps: { class: 'mp-th-sr' } },
]
const { visibleHeaders, isVisible } = useResponsiveTableHeaders(headers)
const addressFolded = computed(() => !isVisible('address'))

function resend(email: SupportEmail) {
  toast.success(`Verification link sent to ${email.address}`)
}
function resendAll() {
  pending.value.forEach(resend)
}
function makeDefault(email: SupportEmail) {
  settings.makeDefaultEmail(email.id)
  toast.success(`${email.address} is now the default`)
}

// ── Remove ──────────────────────────────────────────────────────────────────
const removeTarget = ref<SupportEmail | null>(null)
const confirmRemove = computed({
  get: () => removeTarget.value !== null,
  set: open => { if (!open) removeTarget.value = null },
})
const removeConsequences = computed(() => {
  const email = removeTarget.value
  if (!email) return []
  const out = ['Customers who email it won’t create tickets in this inbox any more']
  if (email.isDefault && emails.value.length > 1) out.push('Another address becomes the default')
  if (props.inbox.acknowledgement.fromEmailId === email.id) out.push('The acknowledgement is turned off until you choose another sender')
  if (email.status === 'Verified' && replyState.value.verified === 1) out.push('Agents can’t reply from this inbox until another address is verified')
  return out
})
function performRemove() {
  const email = removeTarget.value
  if (!email) return
  settings.removeSupportEmail(email.id)
  toast.success(`${email.address} removed`)
  removeTarget.value = null
}

// ── Add ─────────────────────────────────────────────────────────────────────
const addOpen = ref(false)
const form = reactive({ name: '', address: '' })
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const addressError = computed(() => {
  const address = form.address.trim().toLowerCase()
  if (!address) return ''
  if (!EMAIL_PATTERN.test(address)) return 'Enter an email address like support@yourstore.com.'
  const taken = settings.supportEmails.find(e => e.address === address)
  if (!taken) return ''
  return taken.inboxId === props.inbox.id ? 'This inbox already has this address.' : `Already used by ${settings.inboxName(taken.inboxId)}.`
})
const canAdd = computed(() => !!form.name.trim() && !!form.address.trim() && !addressError.value)

function openAdd() {
  Object.assign(form, { name: '', address: '' })
  addOpen.value = true
}
function add() {
  if (!canAdd.value) return
  settings.addSupportEmail(props.inbox.id, { name: form.name, address: form.address })
  toast.success(`Verification link sent to ${form.address.trim().toLowerCase()}`)
  addOpen.value = false
}
</script>

<template>
  <div class="d-flex flex-column gap-4">
    <MpAlert
      v-if="emails.length && !replyState.canReply"
      tone="warning"
      title="Replies are off for this inbox"
      :live="'polite'"
    >
      Tickets still arrive, but agents can’t send replies until an address is verified.
      Open the link we emailed to {{ pending.map(e => e.address).join(', ') }}.
      <template #actions>
        <v-btn variant="text" class="text-none" @click="resendAll">Resend verification</v-btn>
      </template>
    </MpAlert>

    <v-card flat border rounded="lg" class="d-flex flex-column overflow-hidden">
      <div class="emails-head d-flex align-center flex-wrap ga-3">
        <div class="flex-grow-1">
          <h3 class="mp-section-title">Support email addresses</h3>
          <p class="text-body-2 text-medium-emphasis">
            Mail sent to these addresses becomes a ticket in {{ inbox.name }}. Replies go out from the default.
          </p>
        </div>
        <v-btn variant="outlined" prepend-icon="plus" class="text-none" @click="openAdd">Add support email</v-btn>
      </div>

      <v-data-table
        :headers="visibleHeaders"
        :items="emails"
        item-value="id"
        density="comfortable"
        hover
        :items-per-page="-1"
        hide-default-footer
        :aria-label="`Support emails for ${inbox.name}`"
      >
        <template #item.name="{ item }">
          <div class="py-1">
            <span class="d-inline-flex align-center flex-wrap ga-2">
              {{ item.name }}
              <MpStatusChip v-if="addressFolded && item.isDefault" status="Default" type="general" size="sm" />
            </span>
            <div v-if="addressFolded" class="email-address text-caption text-medium-emphasis">{{ item.address }}</div>
          </div>
        </template>

        <template #item.address="{ item }">
          <span class="d-inline-flex align-center flex-wrap ga-2 email-address">
            {{ item.address }}
            <MpStatusChip v-if="item.isDefault" status="Default" type="general" size="sm" />
          </span>
        </template>

        <template #item.status="{ item }">
          <MpStatusChip :status="item.status" type="readiness" size="sm" show-icon />
        </template>

        <template #item.actions="{ item }">
          <div @click.stop>
            <MpRowActionsMenu ariaLabel="Support email actions" :itemLabel="item.address">
              <MpMenuItem v-if="item.status === 'Pending'" title="Resend verification" icon="send" @click="resend(item)" />
              <MpMenuItem v-if="!item.isDefault" title="Make default" icon="star" @click="makeDefault(item)" />
              <v-divider v-if="item.status === 'Pending' || !item.isDefault" class="my-1" />
              <MpMenuItem title="Remove" icon="trash-2" danger @click="removeTarget = item" />
            </MpRowActionsMenu>
          </div>
        </template>

        <template #no-data>
          <MpEmptyState
            icon="mail-plus"
            title="No support emails yet"
            description="Add the address customers write to. Until then this inbox can’t receive tickets."
            action-label="Add support email"
            action-icon="plus"
            @action="openAdd"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpFormDrawer v-model="addOpen" title="Add support email" :subtitle="inbox.name" size="sm">
      <MpFormGrid>
        <v-text-field
          v-model="form.name"
          label="Sender name *"
          placeholder="Orders team"
          hint="Shown to customers as who the reply is from."
        ></v-text-field>
        <v-text-field
          v-model="form.address"
          label="Email address *"
          placeholder="orders@yourstore.com"
          type="email"
          hint="We’ll email it a verification link."
          :error-messages="addressError"
        ></v-text-field>
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="addOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canAdd" @click="add">Add and send link</v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmRemove"
      danger
      :title="`Remove ${removeTarget?.address ?? 'this address'}?`"
      message="You can add it again later; it will need verifying again."
      :consequences="removeConsequences"
      confirm-label="Remove"
      @confirm="performRemove"
    />
  </div>
</template>

<style scoped>
.emails-head {
  padding: var(--mp-component-card-padding);
  border-bottom: 1px solid var(--border-subtle);
}
.emails-head p {
  margin-top: var(--mp-space-4);
}
/* A long address wraps inside its cell rather than widening the table. */
.email-address {
  overflow-wrap: anywhere;
}
</style>
