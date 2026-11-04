/**
 * The register's gesture rules, kept apart from the components so the
 * thresholds are tested (tests/pos/gestures.test.ts) and shared: a swipe on a
 * cart line, a long press on a product tile, a drag on a sheet.
 *
 * Every gesture has a tap or keyboard twin; these only make the common case
 * faster.
 */

/** Hold this long, without moving, and a press becomes a long press. */
export const LONG_PRESS_MS = 450
/** A finger drifts; past this it is a drag, not a press. */
export const MOVE_SLOP = 10
/** px/ms. A release faster than this counts as a flick. */
export const FLICK_SPEED = 0.5

/**
 * Which way a drag is going, once it is clearly going somewhere. A cart line
 * only swipes on 'x', so a vertical drag still scrolls the cart.
 */
export function axisLock(dx: number, dy: number): 'x' | 'y' | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < MOVE_SLOP) return null
  return Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
}

export type SwipeOutcome = 'closed' | 'revealed' | 'remove'

/**
 * Where a swiped line settles. `travel` is how far left it sits (px, ≥ 0);
 * `velocity` is px/ms, negative while moving left.
 *
 * Past half the row removes it. A flick only removes from past the action,
 * so one quick flick reveals Remove rather than deleting outright.
 */
export function swipeOutcome(travel: number, width: number, velocity: number, actionWidth: number): SwipeOutcome {
  if (travel > width / 2) return 'remove'
  if (velocity <= -FLICK_SPEED) return travel >= actionWidth ? 'remove' : 'revealed'
  if (velocity >= FLICK_SPEED) return 'closed'
  return travel > actionWidth / 2 ? 'revealed' : 'closed'
}

/** A sheet dragged down closes past 30% of its height, or on a downward flick. */
export function sheetDragCloses(dy: number, height: number, velocity: number): boolean {
  return dy > height * 0.3 || (dy > MOVE_SLOP && velocity >= FLICK_SPEED)
}

/** A short tick. Android tablets only — iPad Safari has no vibration API. */
export function posHaptic() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10)
}
