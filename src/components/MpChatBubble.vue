<script setup lang="ts">
import { useSlots } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Which side the bubble sits on. Independent of tone — a thread may left-align both roles and distinguish by tint. */
    side?: 'start' | 'end'
    /** Fill: neutral = surface + hairline · accent = soft primary tint · solid = primary fill. */
    tone?: 'neutral' | 'accent' | 'solid'
    /** Sender name, rendered in the meta row above the bubble. */
    author?: string
    /** Timestamp label for the meta row (rendered in a `<time>` element). */
    time?: string
    /** Typing/pending state — renders a spinner plus the default slot (or "Thinking…"). */
    loading?: boolean
  }>(),
  { side: 'start', tone: 'neutral', loading: false }
)

const slots = useSlots()
</script>

<template>
  <article class="mp-chat-bubble" :class="[`mp-chat-bubble--${props.side}`, `mp-chat-bubble--${props.tone}`]">
    <div v-if="slots.avatar" class="mp-chat-bubble__avatar">
      <slot name="avatar" />
    </div>
    <div class="mp-chat-bubble__content">
      <div v-if="props.author || props.time" class="mp-chat-bubble__meta">
        <span v-if="props.author" class="mp-chat-bubble__author">{{ props.author }}</span>
        <time v-if="props.time" class="mp-chat-bubble__time">{{ props.time }}</time>
      </div>
      <div class="mp-chat-bubble__bubble">
        <div v-if="props.loading" class="mp-chat-bubble__loading">
          <v-progress-circular indeterminate size="14" width="2" />
          <span><slot>Thinking…</slot></span>
        </div>
        <div v-else class="mp-chat-bubble__body"><slot /></div>
        <div v-if="slots.footer" class="mp-chat-bubble__footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
/* One bubble geometry (component.bubble.*) for every transcript surface; the
   tail is the bottom corner on the author's side dropping to tailRadius. */
.mp-chat-bubble {
  display: flex;
  gap: var(--mp-space-12);
  min-width: 0;
}

.mp-chat-bubble--end {
  flex-direction: row-reverse;
}

.mp-chat-bubble__avatar {
  flex-shrink: 0;
}

.mp-chat-bubble__content {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-bubble-gap);
  min-width: 0;
  flex: 1 1 auto;
}

.mp-chat-bubble--end .mp-chat-bubble__content {
  align-items: flex-end;
}

.mp-chat-bubble__meta {
  display: flex;
  align-items: baseline;
  gap: var(--mp-space-8);
  width: 100%;
  font-size: var(--mp-fontSize-12);
}

.mp-chat-bubble__author {
  font-weight: var(--mp-fontWeight-bold);
  color: var(--text-primary);
}

.mp-chat-bubble__time {
  margin-left: auto;
  color: var(--text-muted);
}

/* Tone = internal custom properties: the documented re-skin seam for product
   surfaces (set them from a host class on the component tag — never :deep). */
.mp-chat-bubble--neutral {
  --mp-bubble-bg: var(--surface-primary);
  --mp-bubble-fg: var(--text-primary);
  --mp-bubble-border: var(--border-subtle);
}

.mp-chat-bubble--accent {
  --mp-bubble-bg: var(--accent-soft);
  --mp-bubble-fg: var(--text-primary);
  --mp-bubble-border: color-mix(in srgb, var(--accent-default) 22%, transparent);
}

.mp-chat-bubble--solid {
  --mp-bubble-bg: var(--accent-default);
  --mp-bubble-fg: var(--accent-on);
  --mp-bubble-border: transparent;
}

.mp-chat-bubble__bubble {
  max-width: var(--mp-component-bubble-maxWidth);
  padding: var(--mp-component-bubble-paddingBlock) var(--mp-component-bubble-paddingInline);
  border: 1px solid var(--mp-bubble-border);
  border-radius: var(--mp-component-bubble-radius);
  background: var(--mp-bubble-bg);
  color: var(--mp-bubble-fg);
  font-size: var(--mp-fontSize-14);
  line-height: 1.6;
}

.mp-chat-bubble--start .mp-chat-bubble__bubble {
  border-end-start-radius: var(--mp-component-bubble-tailRadius);
}

.mp-chat-bubble--end .mp-chat-bubble__bubble {
  border-end-end-radius: var(--mp-component-bubble-tailRadius);
}

.mp-chat-bubble__body {
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

.mp-chat-bubble__loading {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
}

.mp-chat-bubble__footer {
  margin-top: var(--mp-space-6);
  font-size: var(--mp-fontSize-12);
  color: var(--text-muted);
}

/* Solid bubbles state their own muted ink — never inherit the page's. */
.mp-chat-bubble--solid .mp-chat-bubble__footer {
  color: color-mix(in srgb, var(--mp-bubble-fg) 78%, transparent);
}
</style>
