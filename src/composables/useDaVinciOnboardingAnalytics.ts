export type DaVinciOnboardingEventName =
  | 'onboarding_viewed'
  | 'choice_screen_viewed'
  | 'onboarding_started'
  | 'entry_mode_selected'
  | 'goal_selected'
  | 'plan_generated'
  | 'task_started'
  | 'task_handoff_opened'
  | 'task_verification_result'
  | 'task_user_confirmed'
  | 'task_skipped'
  | 'milestone_completed'
  | 'onboarding_skipped'
  | 'onboarding_paused'
  | 'input_mode_selected'
  | 'microphone_permission'
  | 'voice_to_text_fallback'
  | 'objective_completed'
  | 'audience_completed'
  | 'readiness_shown'
  | 'prerequisite_opened'
  | 'onboarding_resumed'
  | 'brief_ready'
  | 'builder_opened'
  | 'brief_corrected'
  | 'audience_corrected'
  | 'unsupported_action_requested'
  | 'transcript_corrected'
  | 'wrong_route_reported'
  | 'voice_recovery'
  | 'onboarding_completed'

export interface DaVinciOnboardingEvent {
  name: DaVinciOnboardingEventName
  accountId: string
  occurredAt: string
  properties: Record<string, string | number | boolean | null>
}

const STORAGE_KEY = 'mp.davinci.onboarding-events.v1'
const MAX_STORED_EVENTS = 100

export function trackDaVinciOnboardingEvent(
  name: DaVinciOnboardingEventName,
  accountId: string,
  properties: DaVinciOnboardingEvent['properties'] = {},
) {
  if (typeof window === 'undefined') return
  const event: DaVinciOnboardingEvent = {
    name,
    accountId,
    occurredAt: new Date().toISOString(),
    properties,
  }
  window.dispatchEvent(new CustomEvent('mp:product-event', { detail: event }))
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as DaVinciOnboardingEvent[]
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...stored, event].slice(-MAX_STORED_EVENTS)),
    )
  } catch {
    /* Analytics must never interrupt onboarding. */
  }
}
