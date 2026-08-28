<script setup lang="ts">
import { computed } from 'vue'
import DvOrbitOrb from './DvOrbitOrb.vue'
import DvOrbitStatusPill from './DvOrbitStatusPill.vue'
import DvOrbitWaveBars from './DvOrbitWaveBars.vue'
import DvOrbitMicBar from './DvOrbitMicBar.vue'
import DvWidgetDraftCard from '../DvWidgetDraftCard.vue'
import DvLandingHero from '../DvLandingHero.vue'
import type { OrbitState } from './orbit'
import type { DashboardFilterState, DashboardWidgetDraft } from '@/stores/dashboards/types'

// Orbit voice surface — the drawer's entire body + footer while in voice mode.
// Purely presentational: the host (MpDaVinciBot) owns the state machine.
const props = withDefaults(
  defineProps<{
    state: OrbitState
    /** Live interim transcript (listening) */
    transcript?: string
    /** Echo of the submitted request (thinking) */
    lastRequest?: string
    /** Assistant caption for the ambient strip (responding/added) */
    caption?: string
    /** True while TTS is actually speaking — drives the strip waveform */
    speaking?: boolean
    /** Four suggestion chips (ready hero) */
    suggestions?: string[]
    /** Follow-up ghost chips (responding) */
    chips?: string[]
    draft?: DashboardWidgetDraft | null
    accountId?: string
    dashboardId?: string
    filters?: DashboardFilterState
    /** Remount key for the draft card (bumped on Undo) */
    draftKey?: number
    /** Dashboard name shown in the success strip (added) */
    addedTo?: string
    errorMessage?: string
  }>(),
  {
    transcript: '',
    lastRequest: '',
    caption: '',
    speaking: false,
    suggestions: () => [],
    chips: () => ['Compare to YoY', 'Segment by region'],
    draft: null,
    accountId: '',
    dashboardId: '',
    filters: undefined,
    draftKey: 0,
    addedTo: '',
    errorMessage: 'It was a bit noisy. Try again, or type your request instead.',
  },
)

const emit = defineEmits<{
  mic: []
  cancel: []
  suggestion: [text: string]
  'try-again': []
  'type-instead': []
  undo: []
  'open-dashboard': []
  'add-another': []
  'widget-saved': [payload: { title: string; dashboardName: string; widgetId: string; dashboardId: string; accountId: string }]
  'widget-refined': []
}>()

// Footer mic bar per state
const micBar = computed(() => {
  switch (props.state) {
    case 'ready':
      return { micSize: 56 as const, ripple: true, muted: false, ghost: 'keyboard' as const }
    case 'listening':
      return { micSize: 56 as const, ripple: true, muted: false, ghost: 'cancel' as const }
    case 'thinking':
      return { micSize: 50 as const, ripple: false, muted: false, ghost: 'none' as const }
    case 'responding':
      return { micSize: 50 as const, ripple: true, muted: false, ghost: 'keyboard' as const }
    case 'added':
      return { micSize: 50 as const, ripple: false, muted: false, ghost: 'keyboard' as const }
    case 'error':
      return { micSize: 56 as const, ripple: false, muted: false, ghost: 'keyboard' as const }
    case 'paused':
      return { micSize: 56 as const, ripple: false, muted: true, ghost: 'keyboard' as const }
  }
})

const isHeroState = computed(() => ['ready', 'listening', 'error', 'paused'].includes(props.state))

function onGhost() {
  if (props.state === 'listening') emit('cancel')
  else emit('type-instead')
}
</script>

<template>
  <div class="dv-orbit">
    <Transition name="dv-orbit-state" mode="out-in">
      <!-- ── Centered hero states: ready / listening / error / paused ── -->
      <div v-if="isHeroState" :key="state" class="dv-orbit__hero">
        <DvOrbitOrb v-if="state === 'listening'" :size="118" :speed="2.4" />
        <DvOrbitOrb v-else-if="state === 'error'" :size="118" :speed="0.6" dim />
        <DvOrbitOrb v-else-if="state === 'paused'" :size="118" :speed="0.25" dim />

        <DvOrbitStatusPill
          v-if="state !== 'ready'"
          class="dv-orbit__pill"
          :state="state"
        />

        <DvLandingHero
          v-if="state === 'ready'"
          :suggestions="suggestions"
          @suggestion="emit('suggestion', $event)"
        />

        <template v-if="state === 'listening'">
          <div class="dv-orbit__transcript" aria-live="polite">
            &ldquo;{{ transcript || 'Listening' }}<span class="dv-orbit__caret dv-orbit__caret--lg" aria-hidden="true"></span>
          </div>
          <div class="dv-orbit__hint">Pause to send &nbsp;&middot;&nbsp; tap mic to stop</div>
        </template>

        <template v-else-if="state === 'error'">
          <div class="dv-orbit__message">{{ errorMessage }}</div>
          <div class="dv-orbit__chips">
            <button type="button" class="dv-orbit__chip" @click="emit('try-again')">Try again</button>
            <button type="button" class="dv-orbit__chip" @click="emit('type-instead')">Type instead</button>
          </div>
        </template>

        <template v-else-if="state === 'paused'">
          <div class="dv-orbit__message dv-orbit__message--muted">
            Da Vinci isn&rsquo;t listening. Tap the mic to resume.
          </div>
        </template>

      </div>

      <!-- ── Thinking: top-aligned orb + echo + skeleton card ── -->
      <div v-else-if="state === 'thinking'" key="thinking" class="dv-orbit__stack">
        <div class="dv-orbit__stack-hero">
          <DvOrbitOrb :size="96" :speed="1.6" arc />
          <DvOrbitStatusPill class="dv-orbit__pill dv-orbit__pill--think" state="thinking" />
          <div v-if="lastRequest" class="dv-orbit__echo">&ldquo;{{ lastRequest }}&rdquo;</div>
        </div>
        <div class="dv-orbit__skeleton">
          <div class="dv-orbit__shimmer" style="width: 150px; height: 13px"></div>
          <div class="dv-orbit__shimmer" style="width: 190px; height: 10px"></div>
          <div style="height: 8px"></div>
          <div class="dv-orbit__shimmer" style="width: 100%; height: 96px; border-radius: 10px"></div>
          <div class="dv-orbit__skeleton-pills">
            <div class="dv-orbit__shimmer" style="width: 96px; height: 26px; border-radius: 99px"></div>
            <div class="dv-orbit__shimmer" style="width: 60px; height: 26px; border-radius: 99px"></div>
          </div>
        </div>
        <div class="dv-orbit__spacer"></div>
      </div>

      <!-- ── Responding / added: strip + widget card + chips ──
           One transition key for both so the draft card (and its internal
           added state) survives the responding → added switch. -->
      <div v-else key="response" class="dv-orbit__stack">
        <div v-if="state === 'added'" class="dv-orbit__success">
          <span class="dv-orbit__success-check" aria-hidden="true">
            <v-icon size="13" class="dv-orbit__success-check-icon">check</v-icon>
          </span>
          <div class="dv-orbit__success-text">
            Added to your <strong>{{ addedTo }}</strong> dashboard.
          </div>
          <button type="button" class="dv-orbit__undo" @click="emit('undo')">Undo</button>
        </div>
        <div v-else class="dv-orbit__strip">
          <DvOrbitOrb :size="38" :speed="1.4" />
          <div class="dv-orbit__strip-caption">{{ caption }}</div>
          <DvOrbitWaveBars v-if="speaking" :count="4" :max-height="16" :bar-width="3" :gap="3" />
        </div>

        <div v-if="draft" class="dv-orbit__card">
          <DvWidgetDraftCard
            :key="draftKey"
            :account-id="accountId"
            :dashboard-id="dashboardId"
            :draft="draft"
            :filters="filters"
            @saved="emit('widget-saved', $event)"
            @refined="emit('widget-refined')"
          />
        </div>

        <div class="dv-orbit__chips dv-orbit__chips--row">
          <template v-if="state === 'added'">
            <button type="button" class="dv-orbit__chip" @click="emit('open-dashboard')">Open dashboard</button>
            <button type="button" class="dv-orbit__chip" @click="emit('add-another')">Add another widget</button>
          </template>
          <template v-else>
            <button
              v-for="text in chips"
              :key="text"
              type="button"
              class="dv-orbit__chip"
              @click="emit('suggestion', text)"
            >
              {{ text }}
            </button>
          </template>
        </div>
        <div class="dv-orbit__spacer"></div>
      </div>
    </Transition>

    <!-- ── Footer: mic bar ── -->
    <DvOrbitMicBar
      :mic-size="micBar.micSize"
      :ripple="micBar.ripple"
      :muted="micBar.muted"
      :ghost="micBar.ghost"
      @mic="emit('mic')"
      @ghost="onGhost"
    />
  </div>
</template>

<style scoped>
/* P4-9. Orb geometry below — the wave-bar widths and heights, the 2.5px stroke,
   the glyph baseline nudges and the plot measures — is canvas geometry, not
   Marobase spacing, and stays off the scale on the same grounds the chart
   canvases did (Phase 2/3 changelog). Layout insets, gaps and type are tokens. */
.dv-orbit {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: rgb(var(--v-theme-surface));
  color: var(--dv-orbit-ink);
}

/* ── Hero (centered) ── */
.dv-orbit__hero {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 var(--mp-space-40);
}

.dv-orbit__pill {
  margin-top: var(--mp-space-28);
}

.dv-orbit__pill--think {
  margin-top: var(--mp-space-20);
}

.dv-orbit__transcript {
  margin-top: var(--mp-space-28);
  font-size: var(--mp-fontSize-20);
  font-weight: var(--mp-fontWeight-medium);
  line-height: 1.45;
  letter-spacing: -0.2px;
  color: var(--dv-orbit-ink);
  text-align: center;
  text-wrap: pretty;
}

.dv-orbit__hint {
  margin-top: var(--mp-space-20);
  font-size: var(--mp-fontSize-12);
  color: var(--dv-orbit-mist);
}

.dv-orbit__message {
  margin-top: var(--mp-space-20);
  font-size: var(--mp-fontSize-14);
  line-height: 1.55;
  color: var(--dv-orbit-slate);
  text-align: center;
  max-width: 240px;
  text-wrap: pretty;
}

.dv-orbit__message--muted {
  color: var(--dv-orbit-mist);
  max-width: 230px;
}

.dv-orbit__caret {
  display: inline-block;
  width: 2.5px;
  border-radius: var(--mp-radius-4);
  background: var(--dv-orbit-blue);
  margin-left: var(--mp-space-6);
  vertical-align: -3px;
  animation: dv-orbit-blink 1.05s step-end infinite;
}

.dv-orbit__caret--lg {
  height: var(--mp-space-20);
}

.dv-orbit__caret--sm {
  height: 15px;
}

/* ── Chips ── */
.dv-orbit__chips {
  margin-top: var(--mp-space-24);
  display: flex;
  gap: var(--mp-space-8);
}

.dv-orbit__chips--row {
  margin-top: 0;
  padding: var(--mp-space-14) var(--mp-space-16) 0;
}

.dv-orbit__chip {
  padding: var(--mp-space-8) var(--mp-space-14);
  border: 1px solid var(--dv-orbit-line);
  border-radius: var(--mp-radius-full);
  background: none;
  font-size: var(--mp-fontSize-13);
  color: var(--dv-orbit-chip);
  cursor: pointer;
  transition: border-color 120ms ease, color 120ms ease;
}

.dv-orbit__chip:hover {
  border-color: var(--dv-orbit-blue);
  color: var(--dv-orbit-ink);
}

/* ── Thinking stack ── */
.dv-orbit__stack {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.dv-orbit__stack-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--mp-space-32) var(--mp-space-40) 0;
}

.dv-orbit__echo {
  margin-top: var(--mp-space-20);
  font-size: var(--mp-fontSize-13);
  color: var(--dv-orbit-mist);
  background: var(--dv-orbit-echo-bg);
  border-radius: var(--mp-radius-full);
  padding: var(--mp-space-8) var(--mp-space-14);
  max-width: 280px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dv-orbit__skeleton {
  margin: var(--mp-space-24) var(--mp-space-16) 0;
  border: 1px solid var(--dv-orbit-card-line);
  border-radius: var(--mp-component-card-radius);
  padding: var(--mp-space-16);
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-10);
  flex: none;
}

.dv-orbit__skeleton-pills {
  display: flex;
  gap: var(--mp-space-10);
  margin-top: var(--mp-space-4);
}

.dv-orbit__shimmer {
  border-radius: var(--mp-component-chip-radius);
  background: linear-gradient(
    90deg,
    var(--dv-orbit-muted-bg) 25%,
    var(--dv-orbit-hairline) 37%,
    var(--dv-orbit-muted-bg) 63%
  );
  background-size: 200% 100%;
  animation: dv-orbit-shimmer 1.4s linear infinite;
}

.dv-orbit__spacer {
  flex: 1;
}

/* ── Responding strip ── */
.dv-orbit__strip {
  margin: var(--mp-space-14) var(--mp-space-16) 0;
  display: flex;
  align-items: center;
  gap: var(--mp-space-12);
  padding: var(--mp-space-12) var(--mp-space-14);
  border-radius: var(--mp-radius-12);
  background: var(--dv-orbit-strip-grad);
  flex: none;
}

.dv-orbit__strip-caption {
  flex: 1;
  font-size: var(--mp-fontSize-13);
  line-height: 1.5;
  color: var(--dv-orbit-body);
  text-wrap: pretty;
}

/* ── Success strip (added) ── */
.dv-orbit__success {
  margin: var(--mp-space-14) var(--mp-space-16) 0;
  display: flex;
  align-items: center;
  gap: var(--mp-space-12);
  padding: var(--mp-space-12) var(--mp-space-14);
  border-radius: var(--mp-radius-12);
  background: var(--dv-orbit-success-bg);
  flex: none;
}

.dv-orbit__success-check {
  width: var(--mp-space-28);
  height: var(--mp-space-28);
  flex: none;
  border-radius: 50%;
  background: var(--dv-orbit-success);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dv-orbit__success-check-icon {
  color: var(--dv-orbit-on-fill);
}

.dv-orbit__success-text {
  flex: 1;
  font-size: var(--mp-fontSize-13);
  line-height: 1.5;
  color: var(--dv-orbit-success-text);
}

.dv-orbit__success-text strong {
  font-weight: var(--mp-fontWeight-semibold);
}

.dv-orbit__undo {
  border: none;
  background: none;
  padding: 0;
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--dv-orbit-success);
  cursor: pointer;
}

.dv-orbit__undo:hover {
  color: var(--dv-orbit-success-text);
}

/* ── Widget card host (Orbit chrome over DvWidgetDraftCard) ── */
.dv-orbit__card {
  margin: var(--mp-space-12) var(--mp-space-16) 0;
  flex: none;
}

.dv-orbit__card :deep(.dv-draft) {
  border: 1px solid var(--dv-orbit-card-line);
}

/* ── State transition: cross-fade + 8px upward drift ── */
.dv-orbit-state-enter-active,
.dv-orbit-state-leave-active {
  transition: opacity 240ms ease-out, transform 240ms ease-out;
}

.dv-orbit-state-enter-from {
  opacity: 0;
  transform: translateY(var(--mp-space-8));
}

.dv-orbit-state-leave-to {
  opacity: 0;
  transform: translateY(calc(var(--mp-space-8) * -1));
}

@media (prefers-reduced-motion: reduce) {
  .dv-orbit__shimmer,
  .dv-orbit__caret {
    animation: none;
  }

  .dv-orbit-state-enter-from,
  .dv-orbit-state-leave-to {
    transform: none;
  }
}
</style>
