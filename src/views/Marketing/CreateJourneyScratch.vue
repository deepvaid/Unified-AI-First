<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpWizardShell from '@/components/MpWizardShell.vue'
import MpWizardStepCard from '@/components/MpWizardStepCard.vue'
import MpAlert from '@/components/MpAlert.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import JourneySettingsForm, { type JourneySettingsValue } from '@/components/marketing/JourneySettingsForm.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useToast } from '@/composables/useToast'
import { useCampaignsStore } from '@/stores/useCampaigns'
import { useCopilotStore } from '@/stores/useCopilot'

/**
 * Journey settings — `/journeys/new/scratch`. Reached from "Create from
 * scratch" and from "Build with AI" (`?buildWithAI=true`); the flag only
 * changes what happens after Create (Da Vinci opens beside the builder).
 */
const router = useRouter()
const route = useRoute()
const store = useCampaignsStore()
const copilot = useCopilotStore()
const toast = useToast()

const accountId = computed(() => route.params.accountId as string)
const withAI = computed(() => route.query.buildWithAI === 'true')

const value = ref<JourneySettingsValue>({ name: '', endDate: '', endTime: '', enabled: false, retrigger: false })
const valid = ref(false)
const form = ref<InstanceType<typeof JourneySettingsForm> | null>(null)
const existingNames = computed(() => store.journeys.map(j => j.name))

const isDirty = computed(() => value.value.name.trim().length > 0 || !!value.value.endDate)
const { confirmLeave, allowNextLeave, discardAndLeave, leaveTitle, leaveMessage, leaveConfirmLabel } = useDirtyLeaveGuard(isDirty, {
  title: 'Leave journey settings?',
  message: 'You have started creating a journey. Leaving now will discard this draft.',
})

function cancel() {
  router.push({ name: 'CreateJourney', params: { accountId: accountId.value } })
}

async function create() {
  if (!(await form.value?.validate())) return
  const v = value.value
  const id = store.createJourney({
    name: v.name.trim(),
    templateId: 'scratch',
    settings: { endDate: v.endDate || undefined, endTime: v.endTime || undefined, enabled: v.enabled, retrigger: v.retrigger },
  })
  toast.success('Journey created successfully')
  // Read the flag before navigating: `withAI` follows the current route's query.
  const openDaVinci = withAI.value
  allowNextLeave()
  await router.replace({ name: 'JourneyBuilder', params: { accountId: accountId.value, id } })
  // Open Da Vinci only once the builder route is in place — the copilot drawer
  // is a temporary drawer and a route change would close it again.
  if (openDaVinci) {
    copilot.setWidthMode('wide')
    copilot.openWithPrompt(`Help me build my new journey "${v.name.trim()}" — suggest a trigger, the email sequence and timing.`)
  }
}
</script>

<template>
  <MpWizardShell
    title="Journey settings"
    subtitle="Enter the details of your journey."
    :back-to="{ name: 'CreateJourney', params: { accountId } }"
    measure="md"
    :hint="valid ? undefined : 'Name the journey to create it'"
  >
    <template #actions>
      <v-chip v-if="withAI" color="primary" variant="tonal" size="small" class="font-weight-bold">
        <v-icon size="16" class="mr-1">sparkles</v-icon> Build with AI
      </v-chip>
    </template>

    <div class="d-flex flex-column ga-6">
      <MpAlert v-if="withAI" tone="info" title="Da Vinci joins you in the builder" live="off">
        Name and schedule the journey first. Once it is created, Da Vinci opens beside the builder to help you design the flow.
      </MpAlert>

      <MpWizardStepCard title="Settings" description="Name it now — the schedule and switches can change later.">
        <JourneySettingsForm ref="form" v-model="value" :existing-names="existingNames" @update:valid="valid = $event" />
      </MpWizardStepCard>
    </div>

    <template #footerStart>
      <v-btn variant="text" class="text-none" @click="cancel">Cancel</v-btn>
    </template>
    <template #footer>
      <v-btn color="primary" variant="flat" class="text-none" prepend-icon="workflow" :disabled="!valid" @click="create">
        Create
      </v-btn>
    </template>
  </MpWizardShell>

  <MpConfirmDialog
    v-model="confirmLeave"
    danger
    :title="leaveTitle"
    :message="leaveMessage"
    :confirm-label="leaveConfirmLabel"
    @confirm="discardAndLeave"
  />
</template>
