import type { CatalogFieldKey, CatalogGenErrorCode } from './useCatalogGenerator'
import type { CatalogCtaAction, CatalogGateReason, CatalogMode, CatalogPackType } from './catalogCopilotConfig'

// Catalog Co-Pilot instrumentation — the PRD's Amplitude taxonomy, fired to the
// prototype's local product-event bus (the same `mp:product-event` window event and
// localStorage log the Da Vinci onboarding tracker uses). The property types are
// closed on purpose: ids, enums, counts and timings only. Prompt text, product
// titles and generated copy cannot be sent — the compiler refuses them.

export type CatalogEventName =
  | 'MCC - Da Vinci Catalog - CTA Viewed'
  | 'MCC - Da Vinci Catalog - CTA Clicked'
  | 'MCC - Da Vinci Catalog - Drawer Opened'
  | 'MCC - Da Vinci Catalog - Prompt Submitted'
  | 'MCC - Da Vinci Catalog - Draft Returned'
  | 'MCC - Da Vinci Catalog - Draft Failed'
  | 'MCC - Da Vinci Catalog - Apply Clicked'
  | 'MCC - Da Vinci Catalog - Apply Completed'
  | 'MCC - Da Vinci Catalog - Discarded'
  | 'MCC - Da Vinci Catalog - Gate Viewed'
  | 'MCC - Da Vinci Catalog - Upgrade Clicked'
  | 'MCC - Da Vinci Catalog - Credit Consumed'
  | 'MCC - Da Vinci Catalog - Product Saved After Apply'
  // Existing Commerce events, extended rather than forked (PRD).
  | 'Product Created'
  | 'Product Published'

export type CatalogEntitlement = 'none' | 'trial' | 'copilot_pack'
export type PromptLengthBucket = '1-20' | '21-60' | '61-120' | '121+'

export interface CatalogEventProperties {
  surface?: 'index' | 'create' | 'edit' | 'field'
  action?: CatalogCtaAction
  mode?: CatalogMode
  product_id?: number | null
  entitlement?: CatalogEntitlement
  is_trial?: boolean
  route_name?: string
  is_preset?: boolean
  prompt_length_bucket?: PromptLengthBucket
  conversation_id?: string | null
  latency_ms?: number
  field_count?: number
  has_variants?: boolean
  error_code?: CatalogGenErrorCode
  fields_applied_count?: number
  fields_applied?: CatalogFieldKey[]
  had_draft?: boolean
  gate_reason?: CatalogGateReason
  target?: 'plans' | 'billing' | 'sales'
  credits?: number
  pack_type?: CatalogPackType
  created_via?: 'davinci' | 'manual'
  davinci_applied?: boolean
  published_via?: 'davinci_assisted' | 'manual'
  time_since_apply_ms?: number | null
}

/** PRD user / account properties, attached to every event. */
export interface CatalogUserProperties {
  mcc_plan: 'build' | 'trial' | 'essentials' | 'professional' | 'enterprise' | 'none'
  davinci_entitlement: CatalogEntitlement
  davinci_copilot_pack: 'none' | Exclude<CatalogPackType, 'trial'>
  davinci_catalog_flag: 'on' | 'off'
  trial_catalog_actions_remaining: number | null
  user_role: 'admin' | 'catalog' | 'view' | 'other'
}

export interface CatalogEvent {
  name: CatalogEventName
  accountId: string
  occurredAt: string
  properties: CatalogEventProperties
  userProperties?: CatalogUserProperties
}

const STORAGE_KEY = 'mp.davinci.catalog-events.v1'
const MAX_STORED_EVENTS = 100

export function trackCatalogEvent(
  name: CatalogEventName,
  accountId: string,
  properties: CatalogEventProperties = {},
  userProperties?: CatalogUserProperties,
) {
  if (typeof window === 'undefined') return
  const event: CatalogEvent = { name, accountId, occurredAt: new Date().toISOString(), properties, userProperties }
  window.dispatchEvent(new CustomEvent('mp:product-event', { detail: event }))
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as CatalogEvent[]
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...stored, event].slice(-MAX_STORED_EVENTS)))
  } catch {
    /* Analytics must never interrupt the product flow. */
  }
}

export function promptLengthBucket(text: string): PromptLengthBucket {
  const n = text.trim().length
  if (n <= 20) return '1-20'
  if (n <= 60) return '21-60'
  if (n <= 120) return '61-120'
  return '121+'
}
