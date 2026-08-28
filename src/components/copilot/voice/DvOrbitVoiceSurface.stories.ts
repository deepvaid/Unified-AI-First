import type { Meta, StoryObj } from '@storybook/vue3'
import DvOrbitVoiceSurface from './DvOrbitVoiceSurface.vue'
import { useDashboardsStore } from '@/stores/useDashboards'
import type { DashboardWidgetDraft } from '@/stores/dashboards/types'
// Global orbit keyframes (ripple, bars, dots, blink, shimmer) — imported by
// src/main.ts in the app; pulled in here for the Storybook preview bundle.
import '@/styles/dv-orbit.css'

const ACCOUNT_ID = '2000290'
const DASHBOARD_ID = '2000290-home'

const SUGGESTIONS = [
  'Show open rate trend for last 30 days',
  'Create a revenue by channel widget',
  'Add a recent orders table',
  'Show ticket volume over time',
]

const BAR_DRAFT: DashboardWidgetDraft = {
  dashboardId: DASHBOARD_ID,
  type: 'bar',
  title: 'Revenue by Channel',
  dataSource: 'commerce',
  metricId: 'commerce_revenue_by_channel',
  dimension: 'channel',
  drilldown: { routeName: 'SalesSummary', label: 'Open sales summary' },
  aiProvenance: {
    prompt: 'create a revenue by channel widget',
    summary: 'Da Vinci mapped your prompt to Revenue by Channel as a bar widget.',
  },
}

const meta = {
  title: 'Product/Da Vinci/Voice/DvOrbitVoiceSurface',
  component: DvOrbitVoiceSurface,
  tags: ['autodocs'],
  args: {
    state: 'ready',
    suggestions: SUGGESTIONS,
    accountId: ACCOUNT_ID,
    dashboardId: DASHBOARD_ID,
  },
  argTypes: {
    accountId: { control: 'text', description: 'Account the inline draft card would add its widget to.' },
    dashboardId: { control: 'text', description: 'Target dashboard for the inline draft cards add action.' },
    filters: { control: 'object', description: '`DashboardFilterState` passed to the inline draft preview, so it renders under the filters it would actually run under.' },
    draftKey: { control: 'number', description: 'Remount key for the draft card. Bump it to force a fresh render \u2014 what Undo does.' },
    state: {
      control: 'select',
      options: ['ready', 'listening', 'thinking', 'responding', 'added', 'error', 'paused'],
      description: '`OrbitState` — the one prop that drives the whole surface. Each state selects which region renders (hero + suggestion chips, live transcript, thinking echo, response strip, draft card, error).',
    },
    transcript: {
      control: 'text',
      description: 'Live interim transcript, shown while `state` is listening. Expected to update on every recognition tick.',
    },
    lastRequest: {
      control: 'text',
      description: 'Echo of the submitted request, shown while thinking, so the user can see what was heard after the transcript clears.',
    },
    caption: {
      control: 'text',
      description: 'Assistant caption for the ambient strip in the responding and added states.',
    },
    speaking: {
      control: 'boolean',
      description: 'True only while TTS is actually producing audio. Drives the strip waveform — it is not the same as `state === \'responding\'`, which stays true after speech ends.',
    },
    suggestions: {
      control: 'object',
      description: 'Up to four suggestion chips shown on the ready hero. More than four will overflow the row.',
    },
    chips: {
      control: 'object',
      description: 'Follow-up ghost chips offered after a response, distinct from `suggestions` (which are the cold-start prompts).',
    },
    draft: {
      control: 'object',
      description: '`DashboardWidgetDraft` to render inline via `DvWidgetDraftCard`, or `null` for none.',
    },
    addedTo: {
      control: 'text',
      description: 'Dashboard name shown in the success strip once a draft has been added.',
    },
    errorMessage: {
      control: 'text',
      description: 'Message shown in the error state. Set it together with the matching `state`; on its own it renders nothing.',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
DvOrbitVoiceSurface is the Da Vinci drawer's entire body + footer while in voice
mode — a purely presentational 7-state machine (\`OrbitState\`): ready · listening ·
thinking · responding · added · error · paused. The host (MpDaVinciBot) owns the
state; everything here is driven by props, with the mic bar mapped per state.
Stories render inside a 420×640 drawer-shaped frame; the responding/added states
host a live \`DvWidgetDraftCard\` (dashboards store seeded with account 2000290).
`,
      },
    },
  },
  render: (args) => ({
    components: { DvOrbitVoiceSurface },
    setup() {
      // Seed the dashboards store so the hosted DvWidgetDraftCard can commit.
      useDashboardsStore().ensureAccountDashboards(ACCOUNT_ID)
      return { args }
    },
    template: `
      <div style="width: 420px; height: 640px; display: flex; flex-direction: column; border: 1px solid rgb(var(--v-theme-outline-variant)); border-radius: 16px; overflow: hidden; background: rgb(var(--v-theme-surface));">
        <DvOrbitVoiceSurface v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof DvOrbitVoiceSurface>

export default meta
type Story = StoryObj<typeof meta>

/** Ready — DvLandingHero greeting + suggestion chips, ripple mic. */
export const Ready: Story = {}

/** Listening — fast orb, live interim transcript with caret, cancel ghost. */
export const Listening: Story = {
  args: {
    state: 'listening',
    transcript: 'Show revenue by channel for the last 30 days',
  },
}

/** Thinking — arc orb, request echo, shimmering skeleton card. */
export const Thinking: Story = {
  args: {
    state: 'thinking',
    lastRequest: 'Create a revenue by channel widget',
  },
}

/** Responding — ambient strip (speaking waveform) + live widget draft card + follow-up chips. */
export const Responding: Story = {
  args: {
    state: 'responding',
    caption: 'Here’s a bar chart of revenue by channel for the last 30 days. Want me to add it?',
    speaking: true,
    draft: BAR_DRAFT,
  },
}

/** Added — success strip with Undo, plus Open dashboard / Add another chips. */
export const Added: Story = {
  args: {
    state: 'added',
    addedTo: 'Overview',
    draft: BAR_DRAFT,
  },
}

/** Error — dimmed orb, "Didn't catch that" pill, Try again / Type instead chips. */
export const ErrorState: Story = {
  args: { state: 'error' },
}

/** Permission denied — specific recovery copy with the persistent Type instead path. */
export const PermissionDenied: Story = {
  args: {
    state: 'error',
    errorMessage: 'Microphone access is blocked. Allow it in browser settings, or continue by typing.',
  },
}

/** Paused — dim slow orb, muted mic with slash. */
export const Paused: Story = {
  args: { state: 'paused' },
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** One structure — the voice surface — in each of the orb's conversational modes. The modes are states rather than structures; see `States`. */
export const Variants: Story = {
  render: (args) => ({
    components: { DvOrbitVoiceSurface },
    setup: () => ({ args }),
    template: `<DvOrbitVoiceSurface v-bind="args" />`,
  }),
}

/** There is no `size` prop — the surface fills the copilot panel. Its layout insets, gaps and type are tokens; the **orb geometry itself** (wave-bar widths, the 2.5px stroke, the glyph baseline nudges) is canvas geometry and stays deliberately off the spacing scale, the same exemption the chart canvases carry. */
export const Sizes: Story = {
  render: (args) => ({
    components: { DvOrbitVoiceSurface },
    setup: () => ({ args }),
    template: `<DvOrbitVoiceSurface v-bind="args" />`,
  }),
}

/** The full conversational cycle — ready, listening, thinking, responding — plus the two failure states (error, permission denied) and paused. */
export const States: Story = {
  render: (args) => ({
    components: { DvOrbitVoiceSurface },
    setup: () => ({ args }),
    template: `<DvOrbitVoiceSurface v-bind="args" />`,
  }),
}
