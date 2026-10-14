<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import MpAlert from '@/components/MpAlert.vue'
import MpChatBubble from '@/components/MpChatBubble.vue'
import MpListRow from '@/components/MpListRow.vue'
import { GENERATION_STAGES, examplePrompts } from '@/composables/useThemeGenerator'
import type { TemplateType } from '@/stores/themeBuilderData'

/** One conversational turn. Da Vinci turns that generated sections carry the
 *  created ids/titles so the parent can render an Undo affordance. `template`
 *  scopes the turn to the template it ran on. */
export interface ThemeChatMessage {
  id: string
  role: 'user' | 'davinci'
  text: string
  /** When the turn happened (ISO). Shown as a time under the bubble. */
  at?: string
  template?: TemplateType
  addedIds?: string[]
  addedTitles?: string[]
}

/** A generation in flight: the prompt being worked on and which stage it is at. */
export interface ThemeGenerating {
  prompt: string
  /** Index into GENERATION_STAGES. */
  stage: number
}

const props = withDefaults(defineProps<{
  /** Conversation, owned by the parent (StoreThemeBuilder). Newest last. */
  messages?: ThemeChatMessage[]
  /** The parent's in-flight generation; null when idle. */
  generating?: ThemeGenerating | null
}>(), {
  messages: () => [],
  generating: null,
})

const emit = defineEmits<{
  /** Send a prompt (textarea submit). */
  generate: [prompt: string]
  /** Undo a generated turn — the exact section ids it created. */
  undo: [ids: string[]]
  /** Clear the conversation and start again. */
  clear: []
  /** Close the panel, return to the Sections/Styles tabs. */
  close: []
}>()

const hasMessages = computed(() => props.messages.length > 0)
const busy = computed(() => props.generating !== null)
const stage = computed(() => GENERATION_STAGES[props.generating?.stage ?? 0] ?? GENERATION_STAGES[0]!)
const completedStages = computed(() => GENERATION_STAGES.slice(0, props.generating?.stage ?? 0))

const draft = ref('')
const textarea = ref<{ focus: () => void } | null>(null)

function send() {
  const prompt = draft.value.trim()
  if (!prompt || busy.value) return
  emit('generate', prompt)
  draft.value = ''
}

// Enter sends; Shift+Enter inserts a newline (handled natively).
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

// An example fills the composer rather than sending — the merchant reads it,
// edits it if they like, then sends. That's how the live builder behaves.
function onExample(prompt: string) {
  draft.value = prompt
  void nextTick(() => textarea.value?.focus())
}

function timeOf(iso?: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

// Keep the newest turn (or the progress card) in view as the conversation grows.
const scrollEl = ref<HTMLElement | null>(null)
watch(
  [() => props.messages.length, () => props.generating?.stage],
  async () => {
    await nextTick()
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  },
)
</script>

<template>
  <div class="tdv d-flex flex-column">
    <!-- Header -->
    <div class="tdv__header d-flex align-center gap-2 px-3 border-b flex-shrink-0">
      <v-avatar color="primary" size="30" class="flex-shrink-0">
        <v-icon color="on-primary" size="16">sparkles</v-icon>
      </v-avatar>
      <div class="flex-grow-1" style="min-width:0;">
        <div class="text-body-2 font-weight-bold text-truncate">Da Vinci AI</div>
        <div class="tdv__eyebrow">AI Generator</div>
      </div>
      <v-btn
        icon="x"
        variant="text"
        size="small"
        aria-label="Close Da Vinci"
        @click="emit('close')"
      ></v-btn>
    </div>

    <!-- Scrollable body: welcome state or conversation -->
    <div ref="scrollEl" class="tdv__scroll flex-grow-1 overflow-y-auto pa-3">
      <!-- Welcome state: the intro sits in the upper half, the examples settle
           just above the composer so the eye lands on "try one of these". -->
      <template v-if="!hasMessages && !busy">
        <div class="tdv__welcome d-flex flex-column">
          <div class="tdv__intro d-flex flex-column align-center text-center ga-3">
            <v-avatar color="primary" size="64">
              <v-icon color="on-primary" size="28">sparkles</v-icon>
            </v-avatar>
            <div class="d-flex flex-column ga-1">
              <div class="text-body-1 font-weight-bold">Welcome to Da Vinci AI Generator</div>
              <p class="text-body-2 text-medium-emphasis">
                Describe a scenario and Da Vinci will start to build. Click an example and start your conversation.
              </p>
            </div>
          </div>

          <div class="tdv__examples d-flex flex-column ga-2">
            <MpListRow
              v-for="example in examplePrompts"
              :key="example.prompt"
              variant="boxed"
              density="compact"
              clickable
              :title="example.label"
              @click="onExample(example.prompt)"
            >
              <template #lead>
                <v-avatar color="primary" variant="tonal" size="24" rounded="sm">
                  <v-icon size="14">{{ example.icon }}</v-icon>
                </v-avatar>
              </template>
            </MpListRow>

            <MpAlert tone="info" icon="lightbulb" live="off" class="tdv__tip">
              <strong>Tip:</strong> Be specific about layout, content and styling preferences for better results.
            </MpAlert>
          </div>
        </div>
      </template>

      <!-- Conversation -->
      <div v-else class="d-flex flex-column gap-3">
        <div class="tdv__convo-head d-flex align-center ga-2">
          <span class="text-body-2 font-weight-bold flex-grow-1">Conversation</span>
          <v-chip size="x-small" variant="tonal" class="flex-shrink-0">
            {{ messages.length }} {{ messages.length === 1 ? 'message' : 'messages' }}
          </v-chip>
          <v-btn
            icon="eraser"
            variant="text"
            size="x-small"
            :disabled="busy"
            aria-label="Clear conversation and start new"
            @click="emit('clear')"
          ></v-btn>
        </div>

        <template v-for="msg in messages" :key="msg.id">
          <!-- User turn -->
          <MpChatBubble v-if="msg.role === 'user'" side="end" tone="solid" :time="timeOf(msg.at)">{{ msg.text }}</MpChatBubble>

          <!-- Da Vinci turn -->
          <div v-else class="tdv-bot d-flex gap-2">
            <v-avatar color="primary" size="26" class="flex-shrink-0 tdv-bot__avatar">
              <v-icon color="on-primary" size="16">sparkles</v-icon>
            </v-avatar>
            <div class="tdv-bot__body">
              <!-- Generated a set → compact result card with Undo -->
              <div v-if="msg.addedIds && msg.addedIds.length" class="tdv-result">
                <div class="d-flex align-center ga-2">
                  <v-icon size="16" color="success">circle-check</v-icon>
                  <span class="text-body-2 font-weight-bold">
                    {{ msg.addedIds.length === 1 ? 'Section generated' : 'Sections generated' }}
                  </span>
                </div>
                <p class="text-caption text-medium-emphasis">{{ msg.text }}</p>
                <div>
                  <v-btn
                    variant="outlined"
                    size="x-small"
                    class="text-none"
                    prepend-icon="undo-2"
                    @click="emit('undo', msg.addedIds)"
                  >
                    Undo
                  </v-btn>
                </div>
              </div>

              <!-- Reply text; unmatched turns (never a result) also re-show the examples -->
              <template v-else>
                <div class="text-body-2 tdv-bot__text">{{ msg.text }}</div>
                <div v-if="!msg.addedTitles" class="d-flex flex-column ga-2">
                  <MpListRow
                    v-for="example in examplePrompts"
                    :key="example.prompt"
                    variant="boxed"
                    density="compact"
                    clickable
                    :title="example.label"
                    @click="onExample(example.prompt)"
                  >
                    <template #lead>
                      <v-avatar color="primary" variant="tonal" size="24" rounded="sm">
                        <v-icon size="14">{{ example.icon }}</v-icon>
                      </v-avatar>
                    </template>
                  </MpListRow>
                </div>
              </template>
              <span v-if="msg.at" class="tdv__time">{{ timeOf(msg.at) }}</span>
            </div>
          </div>
        </template>

        <!-- Generation in flight: the current stage, what's already done, and the request -->
        <div v-if="generating" class="tdv-progress d-flex flex-column ga-4" role="status" aria-live="polite">
          <div class="d-flex flex-column align-center text-center ga-3 pt-4">
            <v-avatar color="primary" size="56" class="tdv-progress__disc">
              <v-icon color="on-primary" size="26">{{ stage.icon }}</v-icon>
            </v-avatar>
            <div class="d-flex flex-column ga-1">
              <div class="text-body-1 font-weight-bold">{{ stage.title }}</div>
              <p class="text-body-2 text-medium-emphasis">{{ stage.caption }}</p>
            </div>
            <div class="tdv-progress__dots" aria-hidden="true">
              <span v-for="(_, i) in GENERATION_STAGES" :key="i" :class="{ 'is-on': i === generating.stage }" />
            </div>
          </div>

          <div v-if="completedStages.length" class="d-flex flex-column ga-2">
            <div class="tdv__label">Completed</div>
            <MpListRow
              v-for="done in completedStages"
              :key="done.title"
              variant="boxed"
              density="compact"
              :title="done.title"
            >
              <template #lead>
                <v-avatar color="primary" variant="tonal" size="24" rounded="sm">
                  <v-icon size="14">{{ done.icon }}</v-icon>
                </v-avatar>
              </template>
              <template #trailing>
                <v-icon size="16" color="primary">check</v-icon>
              </template>
            </MpListRow>
          </div>

          <div class="tdv-request d-flex flex-column ga-1">
            <div class="tdv__label tdv__label--accent">Your request</div>
            <div class="text-body-2">{{ generating.prompt }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="tdv__input pa-3 border-t flex-shrink-0 d-flex flex-column ga-1">
      <!-- Chat composer, not a form field: it opens on one row and grows to four,
           so `rows` is the growth floor rather than a message height, and details
           are suppressed so the transcript can't jump as you type. -->
      <v-textarea
        ref="textarea"
        v-model="draft"
        :placeholder="hasMessages ? 'Continue the conversation…' : 'Ask me to change anything…'"
        rows="1"
        max-rows="4"
        auto-grow
        hide-details
        :disabled="busy"
        aria-label="Ask Da Vinci to build a section"
        @keydown="onKeydown"
      >
        <template #append-inner>
          <!-- The explicit style restates the two properties maropostDefaults.VBtn writes
               inline for TEXT buttons (min-height 40, padding-inline 14); Vuetify merges it
               after the default, so the x-small icon button stays a 32px circle instead of
               a 32×40 oval. The field's end inset drops to 4 (below) so the circle sits
               concentric in the 40px composer: 4 above, below and beside it. -->
          <v-btn
            icon="send-horizontal"
            size="x-small"
            color="primary"
            variant="flat"
            :style="{ minHeight: '0', paddingInline: '0' }"
            :disabled="!draft.trim() || busy"
            aria-label="Send"
            @click="send"
          ></v-btn>
        </template>
      </v-textarea>
      <span class="tdv__hint">Press Enter to send, Shift+Enter for new line</span>
    </div>
  </div>
</template>

<style scoped>
.tdv {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* One 12px inset (pa-3 / px-3) for header, transcript and composer — every left
   edge in the panel lands on the same line. */
.tdv__header { min-height: var(--mp-space-48); }
.tdv__eyebrow {
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-bold);
  letter-spacing: var(--mp-letterSpacing-eyebrow);
  text-transform: uppercase;
  color: var(--accent);
  line-height: var(--mp-lineHeight-tight);
}

.border-b { border-bottom: 1px solid var(--border-subtle); }
.border-t { border-top: 1px solid var(--border-subtle); }

/* Composer: the send circle (32) sits 4px in from the field's end, matching the
   4px above and below it in the 40px field; it stays on the last line as the
   field grows. */
.tdv__input :deep(.v-field) { padding-inline-end: var(--mp-space-4); }
.tdv__input :deep(.v-field__append-inner) {
  align-self: flex-end;
  padding-block: var(--mp-space-4);
  padding-inline-start: var(--mp-space-8);
}
.tdv__hint {
  font-size: var(--mp-fontSize-11);
  color: var(--text-secondary);
}

/* ── Welcome ─────────────────────────────────────────────────────────── */
/* The welcome fills the scroll area: the intro takes the top, the examples
   settle at the bottom, next to the composer they feed. */
.tdv__welcome { min-height: 100%; }
.tdv__intro {
  flex: 1 1 auto;
  justify-content: center;
  padding-block: var(--mp-space-24);
}
.tdv__intro p { margin: 0; }
.tdv__examples { flex: 0 0 auto; }
.tdv__tip { margin-top: var(--mp-space-4); }

/* ── Conversation ────────────────────────────────────────────────────── */
.tdv-bot__avatar { margin-top: var(--mp-space-2); }
/* The turn owns the space between its reply text and any follow-up rows. */
.tdv-bot__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
}
.tdv-bot__text {
  line-height: var(--mp-lineHeight-normal);
  color: var(--text-primary);
}
.tdv__time {
  font-size: var(--mp-fontSize-11);
  color: var(--text-secondary);
}

/* The result card owns the space between its heading, its note and its Undo. */
.tdv-result {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
  padding: var(--mp-space-12);
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-chip);
  background: var(--surface-primary);
}
.tdv-result p { margin: 0; }

/* ── Generating ──────────────────────────────────────────────────────── */
.tdv-progress p { margin: 0; }
.tdv-progress__disc { animation: tdv-pulse 1.6s ease-in-out infinite; }
.tdv-progress__dots {
  display: flex;
  gap: var(--mp-space-6);
}
.tdv-progress__dots span {
  width: var(--mp-space-8);
  height: var(--mp-space-8);
  border-radius: var(--r-pill);
  background: var(--accent-soft);
}
.tdv-progress__dots span.is-on { background: var(--accent); }

.tdv__label {
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-bold);
  letter-spacing: var(--mp-letterSpacing-eyebrow);
  text-transform: uppercase;
  color: var(--text-secondary);
}
.tdv__label--accent { color: var(--accent); }

.tdv-request {
  padding: var(--mp-space-10) var(--mp-space-12);
  border-radius: var(--r-chip);
  background: var(--accent-soft);
}

@keyframes tdv-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}
@media (prefers-reduced-motion: reduce) {
  .tdv-progress__disc { animation: none; }
}
</style>
