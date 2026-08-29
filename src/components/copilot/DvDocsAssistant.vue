<script setup lang="ts">
// Da Vinci · Design System — a self-contained docs Q&A surface for the
// design-system documentation page. Deliberately NOT MpDaVinciBot: it keeps
// its own local thread (the copilot store is a global singleton) and skips the
// e-commerce intent classifier, calling /api/gemini directly in
// 'design-system' mode with retrieved doc excerpts as grounding. With no
// GEMINI_API_KEY it degrades to the best-matching written FAQ answer.
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { askGemini, type GeminiTurn } from '@/services/geminiClient'
import { useDesignSystemKnowledge } from '@/composables/useDesignSystemKnowledge'

interface DocsMessage {
  id: number
  role: 'user' | 'assistant'
  text: string
  fromFaq?: boolean
}

const { retrieve, bestFaqMatch, starterChips } = useDesignSystemKnowledge()

const messages = ref<DocsMessage[]>([])
const draft = ref('')
const loading = ref(false)
const transcriptEl = ref<HTMLElement | null>(null)
let nextId = 1
let abort: AbortController | null = null

const NO_MATCH_REPLY =
  'That one isn’t covered in my docs yet — the FAQ and operating model tabs on the left are the full source, and the feedback page is the right place to raise it so it gets a written answer.'

async function scrollToEnd() {
  await nextTick()
  transcriptEl.value?.scrollTo({ top: transcriptEl.value.scrollHeight, behavior: 'smooth' })
}

watch(() => messages.value.length, scrollToEnd)

async function send(text: string) {
  const clean = text.trim()
  if (!clean || loading.value) return
  draft.value = ''
  messages.value.push({ id: nextId++, role: 'user', text: clean })
  loading.value = true
  abort = new AbortController()

  const history: GeminiTurn[] = messages.value
    .slice(0, -1)
    .slice(-6)
    .map((m) => ({ role: m.role, text: m.text }))

  try {
    const reply = await askGemini(clean, history, {
      context: retrieve(clean),
      mode: 'design-system',
      signal: abort.signal,
    })
    if (reply) {
      messages.value.push({ id: nextId++, role: 'assistant', text: reply.reply })
    } else {
      const faq = bestFaqMatch(clean)
      messages.value.push(
        faq
          ? { id: nextId++, role: 'assistant', text: faq.answer, fromFaq: true }
          : { id: nextId++, role: 'assistant', text: NO_MATCH_REPLY },
      )
    }
  } catch {
    // Aborted (unmount) — leave the thread as-is.
  } finally {
    loading.value = false
    abort = null
  }
}

onBeforeUnmount(() => abort?.abort())
</script>

<template>
  <v-card flat border rounded="lg" class="dv-docs d-flex flex-column">
    <div class="dv-docs__header d-flex align-center ga-3 pa-4">
      <span class="dv-docs__orb d-flex align-center justify-center">
        <v-icon size="18" class="dv-docs__orb-icon">sparkles</v-icon>
      </span>
      <div>
        <div class="text-subtitle-2 font-weight-bold">Da Vinci · Design System</div>
        <div class="text-caption text-medium-emphasis">Answers grounded in the design-system docs</div>
      </div>
    </div>
    <v-divider />

    <div ref="transcriptEl" class="dv-docs__transcript flex-grow-1 pa-4">
      <div v-if="!messages.length" class="dv-docs__empty d-flex flex-column ga-4">
        <p class="text-body-2 text-medium-emphasis">
          Ask me anything about the design system, the sandbox, or the plan — I answer from the FAQ,
          operating model, audit, inventory, and handover docs.
        </p>
        <div class="d-flex flex-wrap ga-2">
          <button
            v-for="chip in starterChips"
            :key="chip"
            type="button"
            class="dv-docs__chip"
            @click="send(chip)"
          >
            {{ chip }}
          </button>
        </div>
      </div>

      <div
        v-for="message in messages"
        :key="message.id"
        class="dv-docs__row"
        :class="message.role === 'user' ? 'dv-docs__row--user' : ''"
      >
        <div class="dv-docs__bubble" :class="`dv-docs__bubble--${message.role}`">
          <div v-if="message.fromFaq" class="dv-docs__faq-tag">From the FAQ</div>
          {{ message.text }}
        </div>
      </div>

      <div v-if="loading" class="dv-docs__row">
        <div class="dv-docs__bubble dv-docs__bubble--assistant dv-docs__bubble--thinking">
          <v-progress-circular indeterminate size="14" width="2" class="mr-2" />
          Reading the docs…
        </div>
      </div>
    </div>

    <v-divider />
    <form class="pa-3" @submit.prevent="send(draft)">
      <!-- Chat composer, not a form field: a floating label has nowhere to go in a
           single-line composer, so the placeholder is the affordance and the name
           is on aria-label. Detail-free so the transcript can't jump as you type. -->
      <v-text-field
        v-model="draft"
        hide-details
        placeholder="Ask about the design system…"
        aria-label="Ask about the design system"
        :disabled="loading"
        autocomplete="off"
      >
        <template #append-inner>
          <v-btn
            icon="arrow-up"
            size="x-small"
            color="primary"
            variant="flat"
            type="submit"
            :disabled="!draft.trim() || loading"
            aria-label="Send question"
          />
        </template>
      </v-text-field>
    </form>
  </v-card>
</template>

<style scoped>
.dv-docs {
  min-height: 0;
}

.dv-docs__orb {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  /* --dv-hero-grad is always set globally (dv-tokens.css, app-styles.ts manifest) —
     no fallback needed. */
  background: var(--dv-hero-grad);
  flex: none;
}

/* P5.5: the orb paints the Da Vinci gradient, so its glyph names the gradient's
   paired ink rather than a literal `color="white"` — which stayed white on the
   dark theme's lighter gradient stops. */
.dv-docs__orb-icon {
  color: var(--dv-on-accent);
}

.dv-docs__transcript {
  overflow-y: auto;
  min-height: 220px;
}

.dv-docs__chip {
  border: 1px solid var(--dv-border);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.8125rem;
  color: rgb(var(--v-theme-on-surface));
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.dv-docs__chip:hover,
.dv-docs__chip:focus-visible {
  border-color: var(--dv-accent);
  background: var(--dv-accent-soft);
}

.dv-docs__row {
  display: flex;
  margin-bottom: 10px;
}

.dv-docs__row--user {
  justify-content: flex-end;
}

.dv-docs__bubble {
  max-width: 88%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-wrap;
}

.dv-docs__bubble--user {
  background: var(--dv-accent-soft);
  border: 1px solid var(--dv-border);
  border-bottom-right-radius: 4px;
}

.dv-docs__bubble--assistant {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-outline-variant, var(--v-border-color)));
  border-bottom-left-radius: 4px;
}

.dv-docs__bubble--thinking {
  display: flex;
  align-items: center;
  color: rgb(var(--v-theme-on-surface-variant));
}

.dv-docs__faq-tag {
  display: inline-block;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--dv-accent);
  margin-bottom: 4px;
}
</style>
