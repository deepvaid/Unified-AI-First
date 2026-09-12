<script setup lang="ts">
import MpChatBubble from '@/components/MpChatBubble.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import { SAMPLE_TICKET } from '@/stores/trialLabData'

/**
 * Service sample task — read a sample ticket, refine the suggested reply and
 * see it in the thread before saving. The reply bubble mirrors the textarea
 * live so "preview" is the conversation itself.
 */
export interface ServiceDraft { reply: string }

const draft = defineModel<ServiceDraft>({ required: true })
</script>

<template>
  <div class="tl-task">
    <div class="tl-task__editor">
      <div class="tl-service__ticket">
        <span class="tl-service__eyebrow">Sample ticket {{ SAMPLE_TICKET.id }}</span>
        <div class="tl-service__subject">{{ SAMPLE_TICKET.subject }}</div>
        <div class="tl-service__meta">{{ SAMPLE_TICKET.customer }} · received {{ SAMPLE_TICKET.receivedAgo }}</div>
      </div>

      <MpFormGrid :cols="1">
        <v-textarea
          :model-value="draft.reply"
          label="Your reply"
          rows="8"
          hint="We drafted a suggestion — edit it until it sounds like you."
          @update:model-value="draft = { ...draft, reply: $event }"
        />
      </MpFormGrid>
    </div>

    <div class="tl-task__preview" aria-label="Conversation preview">
      <div class="tl-task__preview-bar">
        <span class="tl-task__preview-label">Conversation</span>
        <v-chip size="x-small" variant="tonal" label>Sample</v-chip>
      </div>
      <div class="tl-service__thread">
        <MpChatBubble side="start" tone="neutral" :author="SAMPLE_TICKET.customer" :time="SAMPLE_TICKET.receivedAgo">
          {{ SAMPLE_TICKET.message }}
        </MpChatBubble>
        <MpChatBubble side="end" tone="accent" author="You" time="Draft">
          {{ draft.reply.trim() || 'Your reply will appear here.' }}
        </MpChatBubble>
      </div>
    </div>
  </div>
</template>

<style scoped src="./trialTask.css"></style>
<style scoped>
.tl-service__ticket {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-4);
  padding: var(--mp-component-card-paddingCompact) var(--mp-space-16);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-12);
  background: var(--surface-primary);
  color: var(--on-surface);
}

.tl-service__eyebrow {
  font-size: var(--mp-fontSize-11);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.tl-service__subject {
  font-weight: 600;
  color: var(--text-primary);
}

.tl-service__meta {
  font-size: var(--mp-fontSize-12);
  color: var(--text-secondary);
}

.tl-service__thread {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-16);
  padding: var(--mp-component-card-padding);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-12);
  background: var(--surface-primary);
}
</style>
