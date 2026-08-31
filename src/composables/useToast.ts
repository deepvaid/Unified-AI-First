import { ref } from 'vue'
import { useToastStackTimers } from './useToastStackTimers'

/**
 * Drives the toast's icon and ARIA role — `error` renders `role="alert"`, others
 * `role="status"` (a11y audit §3: reserve alert/assertive for interrupting errors;
 * a warning toast auto-dismisses, so it announces politely).
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info'

/** Optional single action button rendered at the end of the toast. */
export interface ToastAction {
  /** Button label. Keep it a short verb phrase ("Undo", "View order"). */
  label: string
  /** Invoked on click; the toast is dismissed immediately afterward. */
  onClick: () => void
}

/** Options accepted by `push(message, options)`. */
export interface ToastOptions {
  /** Optional bold line above the message. */
  title?: string
  /** Severity. Defaults to `info`. */
  type?: ToastType
  /** Optional action button. */
  action?: ToastAction
  /** Explicit override. If omitted: success/info auto-dismiss after 4500ms, warning after 7000ms, error persists. */
  durationMs?: number
}

/** A live toast in the shared stack, as rendered by `MpToastStack`. */
export interface Toast {
  /** Stable id used for dismissal and timer bookkeeping. */
  id: string
  /** Body copy — the required part of every toast. */
  message: string
  /** Optional bold line above the message. */
  title?: string
  /** Severity; drives icon and ARIA role. */
  type: ToastType
  /** Optional action button; clicking it dismisses the toast. */
  action?: ToastAction
  /** null = persists until manually dismissed (default for error). */
  durationMs: number | null
  /** True during the exit animation window, so the host can play the leave transition. */
  leaving: boolean
}

/** Must match the host component's exit-animation duration (MpToastStack.vue). */
const LEAVE_MS = 200
const DEFAULT_DURATION_MS = 4500
/** Warnings carry more weight than confirmations but still auto-dismiss — longer read time. */
const WARNING_DURATION_MS = 7000

// Module-level state: every useToast() call shares one stack.
const toasts = ref<Toast[]>([])

const timers = useToastStackTimers((id) => dismiss(id))

let idCounter = 0
function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  idCounter += 1
  return `toast-${Date.now()}-${idCounter}`
}

function dismiss(id: string) {
  const index = toasts.value.findIndex((t) => t.id === id)
  if (index === -1) return
  timers.clear(id)
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
    : type === 'error' ? null
    : type === 'warning' ? WARNING_DURATION_MS
    : DEFAULT_DURATION_MS

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

  if (durationMs != null) timers.start(id, durationMs)
  return id
}

function success(message: string, opts?: Omit<ToastOptions, 'type'>): string {
  return show(message, { ...opts, type: 'success' })
}

function error(message: string, opts?: Omit<ToastOptions, 'type'>): string {
  return show(message, { ...opts, type: 'error' })
}

function warning(message: string, opts?: Omit<ToastOptions, 'type'>): string {
  return show(message, { ...opts, type: 'warning' })
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
    warning,
    info,
    dismiss,
    pause: timers.pause,
    resume: timers.resume,
  }
}
