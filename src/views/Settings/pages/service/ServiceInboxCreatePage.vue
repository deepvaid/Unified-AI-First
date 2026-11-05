<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpWizardSteps from '@/components/MpWizardSteps.vue'
import MpWizardStepCard from '@/components/MpWizardStepCard.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useWizardSteps } from '@/composables/useWizardSteps'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useToast } from '@/composables/useToast'
import { CRM_OPTIONS, useServiceSettingsStore } from '@/stores/useServiceSettings'
import { isDuplicateName } from '@/service/model'

/*
 * Multi-step settings pattern (3 Nov call: "within a tab having multiple pages
 * is not clear"). A setting that needs more than one page gets its own route
 * INSIDE the Settings shell — the rail stays, so you never lose where you are —
 * with the steps in the header and Back/Next in the page footer. It ends on the
 * new item's detail page. UAT hides the second step (support emails, then the
 * acknowledgement) behind the list's ⋮ menu; here it's step 2.
 */

const route = useRoute()
const router = useRouter()
const toast = useToast()
const settings = useServiceSettingsStore()
const accountId = computed(() => route.params.accountId as string)

const STEPS = ['Basics', 'Support email']

const form = reactive({ name: '', description: '', crm: null as string | null, emailName: '', emailAddress: '' })

// ── Validation (messages only once there's something to judge) ──────────────
const nameError = computed(() =>
  isDuplicateName(settings.inboxes, form.name) ? 'An inbox with this name already exists.' : '',
)
const basicsValid = computed(() => !!form.name.trim() && !nameError.value)

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const addressError = computed(() => {
  const address = form.emailAddress.trim().toLowerCase()
  if (!address) return ''
  if (!EMAIL_PATTERN.test(address)) return 'Enter an email address like support@yourstore.com.'
  const taken = settings.supportEmails.find(e => e.address === address)
  return taken ? `Already used by ${settings.inboxName(taken.inboxId)}.` : ''
})
const emailValid = computed(() => !!form.emailName.trim() && !!form.emailAddress.trim() && !addressError.value)

const { step, maxStep, goTo, next, prev } = useWizardSteps(STEPS.length, {
  canAdvance: from => (from === 1 ? basicsValid.value : true),
})

// ── Leaving with something typed asks first ─────────────────────────────────
const isDirty = computed(() =>
  [form.name, form.description, form.emailName, form.emailAddress].some(v => v.trim()) || !!form.crm,
)
const { confirmLeave, allowNextLeave, discardAndLeave, leaveTitle, leaveMessage, leaveConfirmLabel } =
  useDirtyLeaveGuard(isDirty, { title: 'Discard this inbox?', message: 'Nothing has been created yet. Leaving now discards what you’ve entered.' })

const listRoute = computed(() => ({ name: 'SettingsServiceInboxes', params: { accountId: accountId.value } }))

function create(withEmail: boolean) {
  if (!basicsValid.value || (withEmail && !emailValid.value)) return
  const id = settings.createInbox({
    name: form.name,
    description: form.description,
    crm: form.crm ?? '',
    email: withEmail ? { name: form.emailName, address: form.emailAddress } : undefined,
  })
  toast.success(
    withEmail
      ? `${form.name.trim()} created — open the link we sent to ${form.emailAddress.trim().toLowerCase()} to start replying`
      : `${form.name.trim()} created — add a support email before it can receive tickets`,
  )
  allowNextLeave()
  router.push({
    name: 'SettingsServiceInbox',
    params: { accountId: accountId.value, inboxId: id },
    query: { tab: 'emails' },
  })
}
</script>

<template>
  <div class="settings-page d-flex flex-column gap-4">
    <MpPageHeader
      :level="2"
      density="compact"
      :back-to="listRoute"
      title="Create inbox"
      :subtitle="`Step ${step} of ${STEPS.length} — ${STEPS[step - 1]}`"
    >
      <template #tabs>
        <MpWizardSteps :steps="STEPS" :current="step" :max-step="maxStep" clickable class="mt-3" @select="goTo" />
      </template>
    </MpPageHeader>

    <MpWizardStepCard
      v-if="step === 1"
      title="Basics"
      description="Name it after what customers write about, so agents can tell at a glance where a ticket came from."
    >
      <MpFormGrid>
        <v-text-field
          v-model="form.name"
          label="Inbox name *"
          placeholder="Orders & returns"
          :error-messages="nameError"
          autofocus
        ></v-text-field>
        <v-textarea
          v-model="form.description"
          label="Description"
          placeholder="Cancellations, exchanges and refunds"
          rows="3"
        ></v-textarea>
        <v-select
          v-model="form.crm"
          :items="CRM_OPTIONS"
          label="CRM"
          placeholder="None"
          hint="Contacts who write to this inbox are matched in this CRM."
          clearable
        ></v-select>
      </MpFormGrid>
    </MpWizardStepCard>

    <MpWizardStepCard
      v-else
      title="Support email"
      description="The address customers write to. We email it a verification link; this inbox can reply once the link is opened."
    >
      <MpFormGrid :cols="2">
        <v-text-field
          v-model="form.emailName"
          label="Sender name *"
          placeholder="Orders team"
          hint="Shown to customers as who the reply is from."
          autofocus
        ></v-text-field>
        <v-text-field
          v-model="form.emailAddress"
          label="Email address *"
          placeholder="orders@yourstore.com"
          type="email"
          :error-messages="addressError"
        ></v-text-field>
      </MpFormGrid>
    </MpWizardStepCard>

    <div class="d-flex align-center flex-wrap ga-2">
      <v-btn v-if="step === 1" variant="text" class="text-none" :to="listRoute">Cancel</v-btn>
      <v-btn v-else variant="text" class="text-none" prepend-icon="arrow-left" @click="prev">Back</v-btn>
      <v-spacer />
      <template v-if="step === 1">
        <v-btn color="primary" variant="flat" class="text-none" append-icon="arrow-right" :disabled="!basicsValid" @click="next">
          Next
        </v-btn>
      </template>
      <template v-else>
        <v-btn variant="text" class="text-none" @click="create(false)">Skip, add an email later</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!emailValid" @click="create(true)">
          Create inbox
        </v-btn>
      </template>
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
