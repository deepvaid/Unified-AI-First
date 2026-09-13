<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpWizardShell from '@/components/MpWizardShell.vue'
import { useToast } from '@/composables/useToast'
import { formatAgo } from '@/composables/useRelativeTime'
import { SAMPLE_TICKET, goalDef, isTrialGoal, type TrialGoal } from '@/stores/trialLabData'
import { useTrialRun } from './useTrialRun'
import { useEnterWorkspace } from './useEnterWorkspace'
import MarketingTask, { type MarketingDraft } from './tasks/MarketingTask.vue'
import CommerceTask, { type CommerceDraft } from './tasks/CommerceTask.vue'
import ServiceTask, { type ServiceDraft } from './tasks/ServiceTask.vue'

/**
 * First task — hosts one of the three sample tasks inside a standalone
 * MpWizardShell. The working copy lives here until "Save draft" commits it to
 * the store; saving is the completion event the funnel measures.
 */
const route = useRoute()
const toast = useToast()
const { store, variant, run, isVerified, arrive, goTo } = useTrialRun()
const { enterWorkspace } = useEnterWorkspace()

const OPEN_REASON = 'Your workspace holds real settings and data, so we confirm it’s you before opening it. Your sample work is kept either way.'

function openWorkspace() {
  if (isVerified.value) void enterWorkspace(variant.value)
  else store.ui.verifyDialog = { reason: OPEN_REASON }
}

const goal = computed<TrialGoal>(() => {
  const raw = Array.isArray(route.params.goal) ? route.params.goal[0] : route.params.goal
  return isTrialGoal(raw) ? raw : 'marketing'
})
const def = computed(() => goalDef(goal.value))

const SAMPLE_REPLY = SAMPLE_TICKET.suggestedReply

const marketing = ref<MarketingDraft>({ templateId: null, subject: '', body: '' })
const commerce = ref<CommerceDraft>({ heading: '', accentKey: 'blue' })
const service = ref<ServiceDraft>({ reply: '' })
const justSaved = ref(false)

function loadDrafts() {
  const d = run.value?.drafts
  if (!d) return
  marketing.value = { templateId: d.marketing.templateId, subject: d.marketing.subject, body: d.marketing.body }
  commerce.value = { heading: d.commerce.heading, accentKey: d.commerce.accentKey || 'blue' }
  service.value = { reply: d.service.reply || (d.service.savedAt ? '' : SAMPLE_REPLY) }
  justSaved.value = false
}

onMounted(() => {
  arrive('task')
  store.setGoal(variant.value, goal.value)
  loadDrafts()
})

watch(goal, () => {
  store.setGoal(variant.value, goal.value)
  loadDrafts()
})

const saved = computed(() => run.value?.drafts[goal.value].savedAt ?? null)

const canSave = computed(() => {
  const d = run.value?.drafts
  if (!d) return false
  switch (goal.value) {
    case 'marketing': {
      const m = marketing.value
      if (!m.templateId || !m.subject.trim()) return false
      return m.templateId !== d.marketing.templateId || m.subject !== d.marketing.subject || m.body !== d.marketing.body || !d.marketing.savedAt
    }
    case 'commerce': {
      const c = commerce.value
      return c.heading !== d.commerce.heading || c.accentKey !== d.commerce.accentKey || !d.commerce.savedAt
    }
    case 'service': {
      const s = service.value
      if (!s.reply.trim()) return false
      return s.reply !== d.service.reply || !d.service.savedAt
    }
  }
})

const hint = computed(() => {
  if (canSave.value || justSaved.value) return undefined
  if (goal.value === 'marketing' && !marketing.value.templateId) return 'Pick a template to start'
  if (goal.value === 'marketing' && !marketing.value.subject.trim()) return 'Add a subject line'
  if (goal.value === 'service' && !service.value.reply.trim()) return 'Write a reply'
  return saved.value ? `Saved ${formatAgo(saved.value)}` : undefined
})

function save() {
  switch (goal.value) {
    case 'marketing': store.saveDraft(variant.value, 'marketing', marketing.value); break
    case 'commerce': store.saveDraft(variant.value, 'commerce', commerce.value); break
    case 'service': store.saveDraft(variant.value, 'service', service.value); break
  }
  justSaved.value = true
  toast.success('Draft saved')
}
</script>

<template>
  <MpWizardShell
    standalone
    eyebrow="Sample task"
    :title="def.title"
    :subtitle="`${def.cloud} · sample data — nothing is sent or published`"
    measure="lg"
    :hint="hint"
    :back-to="{ name: 'TrialGoal', params: { variant } }"
  >
    <template #actions>
      <v-chip v-if="saved && !justSaved" size="small" variant="tonal" color="success" prepend-icon="circle-check">
        Saved {{ formatAgo(saved) }}
      </v-chip>
    </template>

    <div v-if="justSaved" class="tl-task-view__success">
      <MpEmptyState
        icon="circle-check"
        emphasis="prominent"
        title="Draft saved"
        :description="isVerified
          ? `Your sample ${def.artifact} is saved. Open your workspace to keep going in the real product, or try another Cloud first — your work stays put.`
          : `Your sample ${def.artifact} is saved. Verify your email to open your workspace, or try another Cloud first — your work stays put.`"
        :action-label="isVerified ? 'Open your workspace' : 'Verify email to open your workspace'"
        :action-icon="isVerified ? 'arrow-up-right' : 'shield-check'"
        :heading-level="2"
        @action="openWorkspace"
      />
      <div class="tl-task-view__success-actions">
        <v-btn variant="text" class="text-none" @click="justSaved = false">Keep editing</v-btn>
        <v-btn variant="outlined" class="text-none" prepend-icon="layout-grid" @click="goTo('goal')">Explore another Cloud</v-btn>
      </div>
    </div>

    <template v-else>
      <MarketingTask v-if="goal === 'marketing'" v-model="marketing" />
      <CommerceTask v-else-if="goal === 'commerce'" v-model="commerce" />
      <ServiceTask v-else v-model="service" />
    </template>

    <template #footerStart>
      <v-btn variant="text" class="text-none" prepend-icon="arrow-left" @click="goTo('goal')">Back to goals</v-btn>
    </template>
    <template #footer>
      <v-btn color="primary" variant="flat" class="text-none" prepend-icon="save" :disabled="!canSave || justSaved" @click="save">Save draft</v-btn>
    </template>
  </MpWizardShell>
</template>

<style scoped>
.tl-task-view__success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mp-space-16);
}

.tl-task-view__success-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--mp-space-8);
}
</style>
