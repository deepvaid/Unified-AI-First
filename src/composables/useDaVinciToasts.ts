import { ref } from 'vue'

export interface DaVinciToastInput {
  title: string
  sub?: string
  action?: string
  onAction?: () => void
  durationMs?: number
}

export interface DaVinciToast extends Required<Pick<DaVinciToastInput, 'title' | 'durationMs'>> {
  id: string
  sub?: string
  action?: string
  onAction?: () => void
  leaving: boolean
}

const toasts = ref<DaVinciToast[]>([])
const DEFAULT_DURATION = 4200
const LEAVE_MS = 180

// Same elapsed/remaining-time bookkeeping as useToast.ts, so an actionable
// toast's timer can be paused on hover/focus and resumed on leave/blur
// (WCAG 2.2.1 Timing Adjustable — A11Y-009).
interface TimerState {
  timeoutId: ReturnType<typeof setTimeout> | null
  remaining: number
  startedAt: number
}
const timers = new Map<string, TimerState>()

function makeId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

function clearTimer(id: string) {
  const timer = timers.get(id)
  if (timer?.timeoutId) clearTimeout(timer.timeoutId)
}

function startTimer(id: string, duration: number) {
  clearTimer(id)
  timers.set(id, {
    timeoutId: setTimeout(() => dismissToast(id), duration),
    remaining: duration,
    startedAt: Date.now(),
  })
}

/** Pause the auto-dismiss timer — call on :hover / :focus-within. */
function pause(id: string) {
  const timer = timers.get(id)
  if (!timer || !timer.timeoutId) return
  clearTimeout(timer.timeoutId)
  timer.remaining = Math.max(0, timer.remaining - (Date.now() - timer.startedAt))
  timer.timeoutId = null
}

/** Resume a paused timer — call on leave/blur. */
function resume(id: string) {
  const timer = timers.get(id)
  if (!timer || timer.timeoutId) return
  timer.startedAt = Date.now()
  timer.timeoutId = setTimeout(() => dismissToast(id), timer.remaining)
}

function dismissToast(id: string) {
  const idx = toasts.value.findIndex((t) => t.id === id)
  if (idx === -1) return
  const existing = toasts.value[idx]
  if (!existing) return
  // Mark leaving for exit animation, then remove after LEAVE_MS
  const next = [...toasts.value]
  next[idx] = { ...existing, leaving: true }
  toasts.value = next
  clearTimer(id)
  timers.delete(id)
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, LEAVE_MS)
}

function pushToast(input: DaVinciToastInput): string {
  const id = makeId()
  const toast: DaVinciToast = {
    id,
    title: input.title,
    sub: input.sub,
    action: input.action,
    onAction: input.onAction,
    durationMs: input.durationMs ?? DEFAULT_DURATION,
    leaving: false,
  }
  toasts.value = [...toasts.value, toast]
  startTimer(id, toast.durationMs)
  return id
}

function triggerAction(id: string) {
  const toast = toasts.value.find((t) => t.id === id)
  if (!toast) return
  toast.onAction?.()
  dismissToast(id)
}

export function useDaVinciToasts() {
  return {
    toasts,
    pushToast,
    dismissToast,
    triggerAction,
    pause,
    resume,
  }
}
