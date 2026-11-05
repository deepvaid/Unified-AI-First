<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpRichTextArea from '@/components/MpRichTextArea.vue'
import { useToast } from '@/composables/useToast'
import { useServiceSettingsStore } from '@/stores/useServiceSettings'
import { TEMPLATE_TAG_GROUPS, fillTags, verifiedEmails, type Inbox } from '@/service/model'

const props = defineProps<{ inbox: Inbox }>()
const emit = defineEmits<{ dirty: [dirty: boolean] }>()

const route = useRoute()
const settings = useServiceSettingsStore()
const toast = useToast()
const accountId = computed(() => route.params.accountId as string)

const saved = () => ({
  ackEnabled: props.inbox.acknowledgement.enabled,
  ackFrom: props.inbox.acknowledgement.fromEmailId,
  ackTemplate: props.inbox.acknowledgement.templateId,
  signature: props.inbox.signature,
})
const draft = reactive(saved())
const isDirty = computed(() => JSON.stringify(draft) !== JSON.stringify(saved()))
watch(isDirty, value => emit('dirty', value), { immediate: true })

// Only a verified address can send; templates are the reply kind, scoped to all inboxes or this one.
const fromOptions = computed(() =>
  verifiedEmails(settings.emailsFor(props.inbox.id)).map(e => ({ title: `${e.name} <${e.address}>`, value: e.id })),
)
const templateOptions = computed(() =>
  settings.replyTemplates
    .filter(t => t.kind === 'reply' && (t.inboxId === null || t.inboxId === props.inbox.id))
    .map(t => ({ title: t.name, value: t.id })),
)

const ackError = computed(() => {
  if (!draft.ackEnabled) return { from: '', template: '' }
  return {
    from: draft.ackFrom ? '' : 'Choose who the acknowledgement comes from.',
    template: draft.ackTemplate ? '' : 'Choose the template to send.',
  }
})
const valid = computed(() => !ackError.value.from && !ackError.value.template)

// Previews fill tags with a realistic ticket, so the agent sees what customers get.
const SAMPLE = {
  CONTACT_FIRST_NAME: 'Sofia',
  CONTACT_NAME: 'Sofia Thompson',
  CONTACT_EMAIL: 'sofia.thompson@email.com',
  TICKET_NUMBER: '#1512',
  TICKET_SUBJECT: 'Exchange for a different size',
  TICKET_STATUS: 'New',
}
const previewAgent = computed(() => settings.agents[0])
const ackPreview = computed(() => {
  const tpl = draft.ackTemplate ? settings.findTemplate(draft.ackTemplate) : undefined
  return tpl ? fillTags(tpl.body, SAMPLE) : ''
})
const signaturePreview = computed(() =>
  fillTags(draft.signature, {
    AGENT_NAME: previewAgent.value?.name ?? 'Agent name',
    AGENT_JOB_TITLE: previewAgent.value?.jobTitle ?? 'Job title',
  }),
)
const signatureTags = TEMPLATE_TAG_GROUPS.filter(group => group.title === 'Agent')

const emailsRoute = computed(() => ({ query: { ...route.query, tab: 'emails' } }))
const templatesRoute = computed(() => ({ name: 'SettingsServiceReplyTemplates', params: { accountId: accountId.value } }))

function discard() {
  Object.assign(draft, saved())
}
function save() {
  if (!valid.value) return
  settings.updateInbox(props.inbox.id, {
    acknowledgement: { enabled: draft.ackEnabled, fromEmailId: draft.ackFrom, templateId: draft.ackTemplate },
    signature: draft.signature,
  })
  Object.assign(draft, saved())
  toast.success('Reply settings saved')
}
</script>

<template>
  <v-card flat border rounded="lg" class="mp-card-inset">
    <MpFormSection
      title="Acknowledgement"
      description="Sent automatically when someone emails this inbox or opens a ticket from the chatbot, so they know it arrived."
    />
    <MpFormGrid :cols="2">
      <v-switch
        v-model="draft.ackEnabled"
        label="Send an acknowledgement for new tickets"
        :disabled="!fromOptions.length && !draft.ackEnabled"
        inset
        class="mp-form-grid__full"
      ></v-switch>
      <template v-if="draft.ackEnabled || fromOptions.length">
        <v-select
          v-model="draft.ackFrom"
          :items="fromOptions"
          label="Send from *"
          :disabled="!draft.ackEnabled"
          :error-messages="ackError.from"
        ></v-select>
        <v-select
          v-model="draft.ackTemplate"
          :items="templateOptions"
          label="Template *"
          :disabled="!draft.ackEnabled"
          :error-messages="ackError.template"
        ></v-select>
      </template>
      <p v-if="!fromOptions.length" class="mp-form-grid__full text-body-2 text-medium-emphasis">
        An acknowledgement needs a verified sender.
        <router-link :to="emailsRoute" class="mp-link">Verify a support email</router-link> first.
      </p>
      <MpFormField v-if="draft.ackEnabled && ackPreview" label="Preview" class="mp-form-grid__full">
        <!-- Seeded/agent-authored template HTML (Tiptap schema output), filled with sample values. -->
        <div class="reply-preview text-body-2" v-html="ackPreview"></div>
      </MpFormField>
      <p class="mp-form-grid__full text-caption text-medium-emphasis">
        Edit the wording in <router-link :to="templatesRoute" class="mp-link">Reply templates</router-link>.
      </p>
    </MpFormGrid>

    <MpFormSection
      title="Signature"
      description="Added below every reply sent from this inbox. Agent tags fill in with whoever sends the reply."
    />
    <MpFormGrid :cols="2">
      <MpRichTextArea
        v-model="draft.signature"
        label="Signature"
        :rows="3"
        :tag-groups="signatureTags"
        hint="Name and job title come from each agent’s profile in Agents."
      />
      <MpFormField :label="`Preview as ${previewAgent?.name ?? 'an agent'}`">
        <div class="reply-preview text-body-2" v-html="signaturePreview"></div>
      </MpFormField>
    </MpFormGrid>

    <div class="inbox-tab__actions d-flex justify-end ga-2">
      <v-btn variant="text" class="text-none" :disabled="!isDirty" @click="discard">Discard</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" :disabled="!isDirty || !valid" @click="save">Save changes</v-btn>
    </div>
  </v-card>
</template>

<style scoped>
.inbox-tab__actions {
  margin-top: var(--mp-component-field-sectionGap);
}

/* A read-only rendering of what the customer receives. */
.reply-preview {
  padding: var(--mp-space-12) var(--mp-space-16);
  border-radius: var(--mp-component-input-radius);
  background: var(--surface-secondary);
  color: var(--on-surface);
}
.reply-preview :deep(p) { margin: 0; }
.reply-preview :deep(p + p) { margin-top: var(--mp-space-8); }
</style>
