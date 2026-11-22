// Small-talk phrase matching for Da Vinci's multi-turn flows. Pure: no Vue, no
// stores — unit-tested under `node --test` (tests/davinci/).

/** Splits "no thanks, cancel it" / "yes and open it" into single clauses. */
function clauses(text: string): string[] {
  return text
    .trim()
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[.!?]+$/, '')
    .split(/\s*[,;]\s*|\s+(?:and|so|then)\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

const EXIT_CLAUSE =
  /^(?:no|nope|nah|no thanks|no thank you|not now|not right now|(?:maybe )?later|never ?mind|forget (?:it|about it)|cancel(?: (?:it|this|that|the campaign|setup))?|stop(?: (?:it|this|that))?|exit|quit|pause)$/

/**
 * The message IS an exit ("never mind", "No thanks, cancel it") — every clause is
 * an exit phrase, so a real brief that merely contains one ("Stop the campaign from
 * sending", "No, I want to promote a sale") never ejects the user from a wizard.
 */
export function isFlowExit(text: string): boolean {
  const parts = clauses(text)
  return parts.length > 0 && parts.every((part) => EXIT_CLAUSE.test(part))
}

const DECLINE_REST =
  /^(?:(?:no )?thanks?|thank you|not now|not right now|(?:maybe )?later|never ?mind|forget (?:it|about it)|(?:cancel|stop|skip)(?: (?:it|that|this))?|don'?t(?: (?:open|do|start))?(?: (?:it|that|this|the (?:journey )?wizard))?)$/

/** A "no" to an offer Da Vinci just made ("No, don't open it", "nope", "not now"). */
export function isDecline(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/[’‘]/g, "'").replace(/[.!?]+$/, '')
  const lead = /^(?:no|nope|nah)\b[,.!]?\s*(.*)$/.exec(t)
  const rest = (lead ? lead[1]! : t).trim()
  if (lead && !rest) return true
  const parts = clauses(rest)
  return parts.length > 0 && parts.every((part) => DECLINE_REST.test(part))
}

// Dictation drops commas, so the small words around a goodbye are allowed inside one clause ("okay thanks that's all for now").
const SIGN_OFF_LEAD = '(?:(?:ok(?:ay)?|alright|all right|great|perfect|thanks?(?: you)?|thank you|cheers)\\s+)*'
const SIGN_OFF_TAIL = '(?:\\s+(?:thanks?(?: you)?|thank you|for now|for today|da ?vinci))*'
const THANKS = new RegExp(`^${SIGN_OFF_LEAD}(?:ok(?:ay)?|great|perfect|thanks?(?: you)?|thank you|cheers)(?:\\s+(?:a lot|so much|very much))?(?:\\s+da ?vinci)?$`)
const SIGN_OFF = new RegExp(
  `^${SIGN_OFF_LEAD}(?:(?:that'?s|that is|that will be|that'll be) (?:all|it|everything)|good ?bye|bye(?: bye)?|see you(?: later)?|talk (?:to you )?later|i'?m (?:done|finished)|we'?re (?:done|finished)|stop listening|end (?:the )?(?:conversation|session|call))${SIGN_OFF_TAIL}$`,
)

/**
 * The spoken close of a hands-free session ("Thanks, that's all", "Goodbye Da Vinci"). Every clause is a
 * thank-you or a goodbye and at least one is a goodbye — "thanks" alone keeps the mic open, and "that's all
 * the revenue?" is a question, not a goodbye.
 */
export function isSignOff(text: string): boolean {
  if (/\?\s*$/.test(text.trim())) return false
  const parts = clauses(text)
  return parts.some((part) => SIGN_OFF.test(part)) && parts.every((part) => SIGN_OFF.test(part) || THANKS.test(part))
}

const AFFIRM =
  /^(?:yes|yeah|yep|yup|sure|ok(?:ay)?|go(?: ahead)?|do it|let'?s go|sounds good|open(?: it| that| the (?:journey )?wizard)?(?: in the wizard)?)$/

/**
 * A "yes" to an offer ("yes please", "yes, open it", "Open the journey wizard").
 * "Please show revenue" and "sure, but show revenue first" are NOT a yes — the
 * old word-match opened the wizard for both.
 */
export function isAffirmation(text: string): boolean {
  const stripped = text
    .trim()
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\b(?:please|thanks|thank you|for me|now)\b/g, ' ')
  const parts = clauses(stripped)
  if (!parts.length) return /\bplease\b/i.test(text) // a bare "please" answers an offer
  return parts.every((part) => AFFIRM.test(part))
}
