export type DaVinciOnboardingEventName =
  | 'onboarding_viewed'
  | 'onboarding_started'
  | 'onboarding_skipped'
  | 'input_mode_selected'
  | 'microphone_permission'
  | 'readiness_shown'
  | 'prerequisite_opened'
  | 'onboarding_resumed'
  | 'draft_created'
  | 'draft_opened'
  | 'brief_corrected'
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
