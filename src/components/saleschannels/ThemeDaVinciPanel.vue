<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { examplePrompts } from '@/composables/useThemeGenerator'
import type { TemplateType } from '@/stores/themeBuilderData'

/** One conversational turn. Da Vinci turns that generated sections carry the
 *  created ids/titles so the parent can render an Undo affordance. `template`
 *  scopes the turn to the template it ran on. */
export interface ThemeChatMessage {
  id: string
  role: 'user' | 'davinci'
  text: string
  template?: TemplateType
  addedIds?: string[]
  addedTitles?: string[]
}

const props = withDefaults(defineProps<{
  /** Conversation, owned by the parent (StoreThemeBuilder). Newest last. */
  messages?: ThemeChatMessage[]
}>(), {
  messages: () => [],
})

const emit = defineEmits<{
  /** Send a prompt (chip click or textarea submit). */
  generate: [prompt: string]
  /** Undo a generated turn — the exact section ids it created. */
  undo: [ids: string[]]
  /** Close the panel, return to the Sections/Styles tabs. */
  close: []
}>()

const hasMessages = computed(() => props.messages.length > 0)

const draft = ref('')

function send() {
  const prompt = draft.value.trim()
  if (!prompt) return
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

function onChip(prompt: string) {
  emit('generate', prompt)
}

// Keep the newest turn in view as the conversation grows.
const scrollEl = ref<HTMLElement | null>(null)
watch(
  () => props.messages.length,
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
      <v-btn
        icon="arrow-left"
        variant="text"
        size="small"
        aria-label="Back to sections"
        @click="emit('close')"
      ></v-btn>
      <v-avatar color="primary" size="30" rounded="lg" class="flex-shrink-0">
        <v-icon color="white" size="16">sparkles</v-icon>
      </v-avatar>
      <div style="min-width:0;">
        <div class="text-body-2 font-weight-bold text-truncate">Da Vinci</div>
        <div class="tdv__eyebrow">AI Generator</div>
      </div>
    </div>

    <!-- Scrollable body: welcome state or conversation -->
    <div ref="scrollEl" class="tdv__scroll flex-grow-1 overflow-y-auto pa-3">
      <!-- Welcome state -->
      <template v-if="!hasMessages">
        <div class="tdv__welcome">
          <v-avatar color="primary" variant="tonal" size="48" rounded="lg" class="mb-3">
            <v-icon size="24">sparkles</v-icon>
          </v-avatar>
          <div class="text-body-1 font-weight-bold mb-1">Build sections with AI</div>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Describe what you want and Da Vinci builds it — review before it sticks.
          </p>

          <div class="tdv__chips d-flex flex-column gap-2 mb-4">
            <v-chip
              v-for="chip in examplePrompts"
              :key="chip.prompt"
              :prepend-icon="chip.icon"
              variant="outlined"
              size="small"
              class="text-none justify-start"
              @click="onChip(chip.prompt)"
            >
              {{ chip.label }}
            </v-chip>
          </div>

          <div class="tdv__tip d-flex align-start gap-2">
            <v-icon size="14" class="flex-shrink-0 mt-1">lightbulb</v-icon>
            <span class="text-caption text-medium-emphasis">
              Tip: add a headline in quotes, like <em>add a hero “Winter Sale”</em>.
            </span>
          </div>
        </div>
      </template>

      <!-- Conversation -->
      <div v-else class="d-flex flex-column gap-3">
        <template v-for="msg in messages" :key="msg.id">
          <!-- User turn -->
          <div v-if="msg.role === 'user'" class="tdv-user">
            <div class="tdv-user__bubble">{{ msg.text }}</div>
          </div>

          <!-- Da Vinci turn -->
          <div v-else class="tdv-bot d-flex gap-2">
            <v-avatar color="primary" size="26" rounded="lg" class="flex-shrink-0 tdv-bot__avatar">
              <v-icon color="white" size="14">sparkles</v-icon>
            </v-avatar>
            <div class="tdv-bot__body">
              <!-- Generated a set → compact result card with Undo -->
              <div v-if="msg.addedIds && msg.addedIds.length" class="tdv-result">
                <div class="d-flex align-center gap-2 mb-1">
                  <v-icon size="15" color="success">circle-check</v-icon>
                  <span class="text-body-2 font-weight-bold">
                    Added {{ msg.addedTitles?.join(', ') }}
                  </span>
                </div>
                <p class="text-caption text-medium-emphasis mb-2">{{ msg.text }}</p>
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

              <!-- Reply text; unmatched turns (never a result) also re-show chips -->
              <template v-else>
                <div class="text-body-2 tdv-bot__text">{{ msg.text }}</div>
                <div v-if="!msg.addedTitles" class="tdv__chips d-flex flex-column gap-2 mt-2">
                  <v-chip
                    v-for="chip in examplePrompts"
                    :key="chip.prompt"
                    :prepend-icon="chip.icon"
                    variant="outlined"
                    size="small"
                    class="text-none justify-start"
                    @click="onChip(chip.prompt)"
                  >
                    {{ chip.label }}
                  </v-chip>
                </div>
              </template>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Input -->
    <div class="tdv__input pa-3 border-t flex-shrink-0">
      <v-textarea
        v-model="draft"
        placeholder="Ask Da Vinci…"
        variant="outlined"
        density="compact"
        rows="1"
        max-rows="4"
        auto-grow
        hide-details
        aria-label="Ask Da Vinci to build a section"
        @keydown="onKeydown"
      >
        <template #append-inner>
          <v-btn
            icon="arrow-up"
            size="x-small"
            color="primary"
            variant="flat"
            :disabled="!draft.trim()"
            aria-label="Send"
            @click="send"
          ></v-btn>
        </template>
      </v-textarea>
    </div>
  </div>
</template>

<style scoped>
.tdv {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.tdv__header { height: 48px; }
.tdv__eyebrow {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-primary));
  line-height: 1;
}

.border-b { border-bottom: 1px solid var(--border-subtle); }
.border-t { border-top: 1px solid var(--border-subtle); }

/* ── Welcome ─────────────────────────────────────────────────────── */
.tdv__welcome { padding: 4px 4px 0; }
.tdv__tip {
  padding: 10px 12px;
  border-radius: var(--r-chip);
  background: var(--accent-soft);
}
.tdv__tip em { font-style: italic; }

/* ── Conversation ────────────────────────────────────────────────── */
.tdv-user { display: flex; justify-content: flex-end; }
.tdv-user__bubble {
  max-width: 88%;
  padding: 8px 12px;
  border-radius: 14px 14px 4px 14px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}

.tdv-bot__avatar { margin-top: 2px; }
.tdv-bot__body { flex: 1; min-width: 0; }
.tdv-bot__text {
  line-height: 1.5;
  color: var(--text-primary);
}

.tdv-result {
  padding: 12px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-chip);
  background: var(--surface-primary);
}
</style>
