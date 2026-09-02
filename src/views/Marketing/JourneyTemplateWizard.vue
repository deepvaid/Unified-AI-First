<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpWizardShell from '@/components/MpWizardShell.vue'
import MpWizardStepCard from '@/components/MpWizardStepCard.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import JourneySettingsForm, { type JourneySettingsValue } from '@/components/marketing/JourneySettingsForm.vue'
import JourneyTemplateSetup from '@/components/marketing/JourneyTemplateSetup.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useToast } from '@/composables/useToast'
import { useWizardSteps } from '@/composables/useWizardSteps'
import { useCampaignsStore } from '@/stores/useCampaigns'
import { useCdpEntitiesStore } from '@/stores/useCdpEntities'
import { useContactsStore } from '@/stores/useContacts'
import { useContentStore } from '@/stores/useContent'
import { useCommerceStore } from '@/stores/useCommerce'
import { templateById, type FlowNode } from '@/stores/journeyFlowData'
import { blankBindings, connectedStores, templateSetupById, type SetupBindings } from '@/stores/journeyTemplateSetup'

/**
 * Journey Templates wizard — `/journeys/new/template?template=<id>`.
 * Step 1 "Settings" (name, schedule, switches) · step 2 "Setup" (prerequisites,
 * sender, trigger binding, content per email). Nothing is written until Finish.
 * Opening it without a template sends the user back to Journey Selection, as
 * production does.
 */
const router = useRouter()
const route = useRoute()
const store = useCampaignsStore()
const toast = useToast()
const cdp = useCdpEntitiesStore()
const contacts = useContactsStore()
const content = useContentStore()
const commerce = useCommerceStore()

const accountId = computed(() => route.params.accountId as string)
const templateId = computed(() => String(route.query.template ?? ''))
const template = computed(() => templateById[templateId.value])
const meta = computed(() => templateSetupById[templateId.value])

watch([template, meta], ([tpl, m]) => {
  if (!tpl || !m || tpl.id === 'scratch') router.replace({ name: 'CreateJourney', params: { accountId: accountId.value } })
}, { immediate: true })

// ── Step 1 ──────────────────────────────────────────────────────────────────
const settings = ref<JourneySettingsValue>({ name: '', endDate: '', endTime: '', enabled: false, retrigger: false })
const settingsValid = ref(false)
const settingsForm = ref<InstanceType<typeof JourneySettingsForm> | null>(null)
const existingNames = computed(() => store.journeys.map(j => j.name))

// ── Step 2 ──────────────────────────────────────────────────────────────────
const bindings = ref<SetupBindings>(blankBindings(meta.value?.emails.length ?? 0))
const setupValid = ref(false)

const { step, maxStep, goTo, prev } = useWizardSteps(2, { canAdvance: () => settingsValid.value })

async function next() {
  if (!(await settingsForm.value?.validate())) return
  goTo(2)
}

const title = computed(() => {
  const name = template.value?.name ?? 'journey'
  return step.value === 1 ? `Settings for ${name} journey` : `Setup for ${name} journey`
})
const hint = computed(() => {
  if (step.value === 1) return settingsValid.value ? undefined : 'Name the journey to continue'
  return setupValid.value ? undefined : 'Complete every required field to finish'
})

const isDirty = computed(() => settings.value.name.trim().length > 0 || bindings.value.fromName.length > 0)
const { confirmLeave, allowNextLeave, discardAndLeave, leaveTitle, leaveMessage, leaveConfirmLabel } = useDirtyLeaveGuard(isDirty, {
  title: 'Leave journey setup?',
  message: 'You have started creating a journey. Leaving now will discard this draft.',
})

function cancel() {
  router.push({ name: 'CreateJourney', params: { accountId: accountId.value } })
}

// ── Finish: bind the picks onto the template graph, then create ─────────────
function boundNodes(): FlowNode[] {
  const tpl = template.value!
  const m = meta.value!
  const b = bindings.value
  const nodes = tpl.nodes.map(n => ({ ...n, children: [...n.children], config: { ...n.config } }))
  const byId = new Map(nodes.map(n => [n.id, n]))
  const nameOf = <T extends { id: number | string; name: string }>(items: T[], id: number | string | null) =>
    items.find(i => i.id === id)?.name ?? ''

  const trigger = byId.get(m.trigger.nodeId)
  if (trigger) {
    trigger.configured = true
    switch (m.trigger.kind) {
      case 'list': {
        const names = b.listIds.map(id => nameOf(cdp.lists, id))
        trigger.config = { ...trigger.config, list: names[0] ?? '', lists: names }
        trigger.subtitle = names.length === 1 ? names[0]! : `${names.length} lists`
        break
      }
      case 'store': {
        const name = nameOf(connectedStores, b.storeId)
        trigger.config = { ...trigger.config, store: name }
        trigger.subtitle = name
        break
      }
      case 'segment': {
        const name = nameOf(contacts.segments, b.segmentId)
        trigger.config = { ...trigger.config, segment: name }
        trigger.subtitle = `Enters "${name}"`
        break
      }
      case 'product': {
        const productNames = b.productIds.map(id => nameOf(commerce.products, id))
        trigger.config = {
          ...trigger.config,
          mode: b.productMode,
          products: productNames,
          allProducts: b.allProducts,
          source: b.source ?? '',
          brands: b.brands,
          categories: b.categories,
          orderStatus: b.orderStatusEnabled ? b.orderStatus : '',
        }
        trigger.subtitle = b.productMode === 'categories'
          ? `${b.source} · ${b.categories.length || 'all'} categories`
          : b.allProducts ? 'Any product purchased' : `${productNames.length} product${productNames.length === 1 ? '' : 's'}`
        break
      }
    }
  }

  m.emails.forEach((email, i) => {
    const contentName = nameOf(content.items, b.contentIds[i] ?? null)
    for (const id of email.nodeIds) {
      const node = byId.get(id)
      if (!node) continue
      node.config = { ...node.config, fromName: b.fromName, fromEmail: b.fromEmail, replyTo: b.fromEmail, content: contentName }
      node.configured = true
      if (!node.config.subject) node.subtitle = contentName
    }
  })

  if (m.filter) {
    const name = nameOf(contacts.segments, b.filterSegmentId)
    for (const id of m.filter.nodeIds) {
      const node = byId.get(id)
      if (node) { node.config = { ...node.config, segment: name }; node.configured = true }
    }
  }

  if (m.dnm) {
    const node = byId.get(m.dnm.nodeId)
    if (node) {
      const list = b.dnmType === 'general' ? 'General Do Not Mail list' : `Brand Do Not Mail list · ${b.dnmBrand}`
      node.config = { ...node.config, list }
      node.subtitle = list
      node.configured = true
    }
  }
  return nodes
}

function finish() {
  if (!setupValid.value || !template.value) return
  const s = settings.value
  const id = store.createJourney({
    name: s.name.trim(),
    templateId: template.value.id,
    nodes: boundNodes(),
    settings: { endDate: s.endDate || undefined, endTime: s.endTime || undefined, enabled: s.enabled, retrigger: s.retrigger },
  })
  toast.success('Journey created successfully')
  allowNextLeave()
  router.replace({ name: 'JourneyBuilder', params: { accountId: accountId.value, id } })
}

</script>

<template>
  <MpWizardShell
    v-if="template && meta"
    :title="title"
    :steps="['Settings', 'Setup']"
    :current="step"
    :max-step="maxStep"
    :back-to="{ name: 'CreateJourney', params: { accountId } }"
    measure="lg"
    :hint="hint"
    @select="goTo"
    @back="prev"
  >
    <template #actions>
      <v-btn variant="text" class="text-none text-medium-emphasis" @click="cancel">Cancel</v-btn>
    </template>

    <div v-if="step === 1" class="jtw-settings mx-auto">
      <MpWizardStepCard title="Journey settings" description="Enter the details of your journey.">
        <JourneySettingsForm
          ref="settingsForm"
          v-model="settings"
          :existing-names="existingNames"
          @update:valid="settingsValid = $event"
        />
      </MpWizardStepCard>
    </div>

    <JourneyTemplateSetup
      v-else
      v-model="bindings"
      :template="template"
      :meta="meta"
      @update:valid="setupValid = $event"
    />

    <template #footerStart>
      <v-btn v-if="step === 2" variant="text" class="text-none" prepend-icon="arrow-left" @click="prev">Back</v-btn>
      <v-btn v-else variant="text" class="text-none" @click="cancel">Cancel</v-btn>
    </template>
    <template #footer>
      <v-btn v-if="step === 1" color="primary" variant="flat" class="text-none" append-icon="arrow-right" :disabled="!settingsValid" @click="next">
        Next
      </v-btn>
      <v-btn v-else color="primary" variant="flat" class="text-none" prepend-icon="workflow" :disabled="!setupValid" @click="finish">
        Finish
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

<style scoped>
/* Step 1 is three fields; hold it to the md measure inside the lg shell. */
.jtw-settings { max-width: var(--mp-component-dialog-width-md); }
</style>
