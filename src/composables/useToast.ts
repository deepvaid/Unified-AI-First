import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastOptions {
  title?: string
  type?: ToastType
  action?: ToastAction
  /** Explicit override. If omitted: success/info auto-dismiss after 4500ms, error persists. */
  durationMs?: number
}

export interface Toast {
  id: string
  message: string
  title?: string
  type: ToastType
  action?: ToastAction
  /** null = persists until manually dismissed (default for error). */
  durationMs: number | null
  leaving: boolean
}

/** Must match the host component's exit-animation duration (MpToastStack.vue). */
const LEAVE_MS = 200
const DEFAULT_DURATION_MS = 4500

// Module-level state: every useToast() call shares one stack.
const toasts = ref<Toast[]>([])

interface TimerState {
  timeoutId: ReturnType<typeof setTimeout> | null
  remaining: number
  startedAt: number
}

const timers = new Map<string, TimerState>()

let idCounter = 0
function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  idCounter += 1
  return `toast-${Date.now()}-${idCounter}`
}

function clearTimer(id: string) {
  const timer = timers.get(id)
  if (timer?.timeoutId) clearTimeout(timer.timeoutId)
}

function startTimer(id: string, duration: number) {
  clearTimer(id)
  timers.set(id, {
    timeoutId: setTimeout(() => dismiss(id), duration),
    remaining: duration,
    startedAt: Date.now(),
  })
}

/** Pause the auto-dismiss timer — call on :hover / :focus-within. No-op for persistent toasts. */
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
  timer.timeoutId = setTimeout(() => dismiss(id), timer.remaining)
}

function dismiss(id: string) {
  const index = toasts.value.findIndex((t) => t.id === id)
  if (index === -1) return
  clearTimer(id)
  timers.delete(id)
  const next = [...toasts.value]
  const current = next[index]
  if (!current) return
  next[index] = { ...current, leaving: true }
  toasts.value = next
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, LEAVE_MS)
}

function show(message: string, opts: ToastOptions = {}): string {
  const id = makeId()
  const type = opts.type ?? 'info'
  const durationMs = opts.durationMs !== undefined
    ? opts.durationMs
    : type === 'error' ? null : DEFAULT_DURATION_MS

  toasts.value = [
    ...toasts.value,
    {
      id,
      message,
      title: opts.title,
      type,
      action: opts.action,
      durationMs,
      leaving: false,
    },
  ]

  if (durationMs != null) startTimer(id, durationMs)
  return id
}

function success(message: string, opts?: Omit<ToastOptions, 'type'>): string {
  return show(message, { ...opts, type: 'success' })
}

function error(message: string, opts?: Omit<ToastOptions, 'type'>): string {
  return show(message, { ...opts, type: 'error' })
}

function info(message: string, opts?: Omit<ToastOptions, 'type'>): string {
  return show(message, { ...opts, type: 'info' })
}

/**
 * Shared toast API (WP-C1, D2 exception to the "no new wrapper components" rule).
 * Singleton, module-level state — every component calling useToast() shares one stack,
 * rendered by the single `MpToastStack` mounted in App.vue.
 */
export function useToast() {
  return {
    toasts,
    show,
    success,
    error,
    info,
    dismiss,
    pause,
    resume,
  }
}
