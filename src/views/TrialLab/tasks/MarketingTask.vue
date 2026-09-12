<script setup lang="ts">
import { computed } from 'vue'
import MpFormField from '@/components/MpFormField.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import { EMAIL_TEMPLATES } from '@/stores/trialLabData'

/**
 * Marketing sample task — pick a welcome-email template, edit subject and
 * body, watch the preview update. Prop-driven; the parent owns the draft and
 * the Save action.
 */
export interface MarketingDraft { templateId: string | null; subject: string; body: string }

const draft = defineModel<MarketingDraft>({ required: true })

const template = computed(() => EMAIL_TEMPLATES.find(t => t.id === draft.value.templateId) ?? null)

function pick(id: string) {
  const t = EMAIL_TEMPLATES.find(x => x.id === id)
  if (!t) return
  const untouched = !draft.value.templateId || (template.value && draft.value.subject === template.value.subject && draft.value.body === template.value.body)
  draft.value = {
    templateId: id,
    subject: untouched ? t.subject : draft.value.subject,
    body: untouched ? t.body : draft.value.body,
  }
}

const previewSubject = computed(() => draft.value.subject.replace(/\{\{store_name\}\}/g, 'Northwind').replace(/\{\{first_name\}\}/g, 'Alex') || 'Your subject line')
const previewBody = computed(() => draft.value.body.replace(/\{\{store_name\}\}/g, 'Northwind').replace(/\{\{first_name\}\}/g, 'Alex') || 'Your message will appear here.')
</script>

<template>
  <div class="tl-task">
    <div class="tl-task__editor">
      <MpFormField label="Template" hint="Pick a starting point — you can edit everything below.">
        <div class="tl-task__templates" role="group">
          <MpOptionCard
            v-for="t in EMAIL_TEMPLATES"
            :key="t.id"
            :selected="draft.templateId === t.id"
            :title="t.name"
            :description="t.description"
            @click="pick(t.id)"
          />
        </div>
      </MpFormField>

      <MpFormGrid :cols="1">
        <v-text-field
          :model-value="draft.subject"
          label="Subject"
          placeholder="Welcome to {{store_name}}"
          :disabled="!draft.templateId"
          @update:model-value="draft = { ...draft, subject: $event }"
        />
        <v-textarea
          :model-value="draft.body"
          label="Body"
          rows="7"
          :disabled="!draft.templateId"
          hint="{{first_name}} and {{store_name}} are filled in when the email sends."
          @update:model-value="draft = { ...draft, body: $event }"
        />
      </MpFormGrid>
    </div>

    <div class="tl-task__preview" aria-label="Email preview">
      <div class="tl-task__preview-bar">
        <span class="tl-task__preview-label">Preview</span>
        <v-chip size="x-small" variant="tonal" label>Sample</v-chip>
      </div>
      <div class="tl-email">
        <div class="tl-email__meta">
          <div class="tl-email__from"><strong>Northwind</strong> <span>hello@northwind.example</span></div>
          <div class="tl-email__to">To: Alex Rivera</div>
        </div>
        <div class="tl-email__brand" />
        <h2 class="tl-email__subject">{{ previewSubject }}</h2>
        <p class="tl-email__body">{{ previewBody }}</p>
        <div class="tl-email__footer">Northwind · 12 Harbour St · Unsubscribe</div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./trialTask.css"></style>
<style scoped>
.tl-task__templates {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--mp-space-8);
}

.tl-email {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-12);
  padding: var(--mp-component-card-padding);
  background: var(--surface-primary);
  color: var(--on-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-12);
}

.tl-email__meta {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-2);
  font-size: var(--mp-fontSize-12);
  color: var(--text-secondary);
}

.tl-email__from strong {
  color: var(--text-primary);
  margin-inline-end: var(--mp-space-6);
}

.tl-email__brand {
  height: var(--mp-space-6);
  border-radius: var(--mp-radius-full);
  background: rgb(var(--v-theme-primary));
}

.tl-email__subject {
  margin: 0;
  font-size: var(--mp-fontSize-18);
  font-weight: 600;
  line-height: 1.3;
  color: var(--text-primary);
  overflow-wrap: anywhere;
}

.tl-email__body {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.6;
  color: var(--text-primary);
  overflow-wrap: anywhere;
}

.tl-email__footer {
  padding-top: var(--mp-space-12);
  border-top: 1px solid var(--border-subtle);
  font-size: var(--mp-fontSize-11);
  color: var(--text-muted);
}
</style>
