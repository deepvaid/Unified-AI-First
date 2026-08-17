// Shared auto-dismiss timer bookkeeping for the two toast stacks (useToast.ts and
// useDaVinciToasts.ts). Both need the same elapsed/remaining-time arithmetic so an
// actionable toast's timer pauses on hover/focus and resumes on leave/blur
// (WCAG 2.2.1 Timing Adjustable — A11Y-009). Keeping one implementation means that
// behaviour is maintained once rather than twice.
//
// The stacks stay separate: they hold different data models and render different
// components. Only the timers are shared.

interface TimerState {
  timeoutId: ReturnType<typeof setTimeout> | null
  remaining: number
  startedAt: number
}

export interface ToastStackTimers {
  /** Start (or restart) the auto-dismiss countdown for `id`. */
  start: (id: string, duration: number) => void
  /** Pause the countdown — call on :hover / :focus-within. No-op for untimed toasts. */
  pause: (id: string) => void
  /** Resume a paused countdown — call on leave/blur. */
  resume: (id: string) => void
  /** Cancel and forget the countdown for `id`. Call when the toast is dismissed. */
  clear: (id: string) => void
}

/**
 * Creates an isolated set of pause/resume-able timers.
 *
 * @param onExpire invoked with the toast id when its countdown reaches zero.
 */
export function useToastStackTimers(onExpire: (id: string) => void): ToastStackTimers {
  const timers = new Map<string, TimerState>()

  function cancel(id: string) {
    const timer = timers.get(id)
    if (timer?.timeoutId) clearTimeout(timer.timeoutId)
  }

  function start(id: string, duration: number) {
    cancel(id)
    timers.set(id, {
      timeoutId: setTimeout(() => onExpire(id), duration),
      remaining: duration,
      startedAt: Date.now(),
    })
  }

  function pause(id: string) {
    const timer = timers.get(id)
    if (!timer || !timer.timeoutId) return
    clearTimeout(timer.timeoutId)
    timer.remaining = Math.max(0, timer.remaining - (Date.now() - timer.startedAt))
    timer.timeoutId = null
  }

  function resume(id: string) {
    const timer = timers.get(id)
    if (!timer || timer.timeoutId) return
    timer.startedAt = Date.now()
    timer.timeoutId = setTimeout(() => onExpire(id), timer.remaining)
  }

  function clear(id: string) {
    cancel(id)
    timers.delete(id)
  }

  return { start, pause, resume, clear }
}
