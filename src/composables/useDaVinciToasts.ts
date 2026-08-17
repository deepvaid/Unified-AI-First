import { ref } from 'vue'
import { useToastStackTimers } from './useToastStackTimers'

/** Payload accepted by `pushToast()`. */
export interface DaVinciToastInput {
  /** Bold first line — the required part of every Da Vinci toast. */
  title: string
  /** Optional supporting line under the title. */
  sub?: string
  /** Optional action label; rendered as a plain button at the end of the pill. */
  action?: string
  /** Invoked when the action button is pressed. */
  onAction?: () => void
  /** Auto-dismiss delay in ms. Defaults to 4200. */
  durationMs?: number
}

/** A live Da Vinci toast, as rendered by `DvToastStack`. */
export interface DaVinciToast extends Required<Pick<DaVinciToastInput, 'title' | 'durationMs'>> {
  /** Stable id used for dismissal and timer bookkeeping. */
  id: string
  /** Optional supporting line under the title. */
  sub?: string
  /** Optional action label. */
  action?: string
  /** Invoked when the action button is pressed. */
  onAction?: () => void
  /** True during the exit animation window, so the host can play the leave transition. */
  leaving: boolean
}

const toasts = ref<DaVinciToast[]>([])
const DEFAULT_DURATION = 4200
const LEAVE_MS = 180

const timers = useToastStackTimers((id) => dismissToast(id))

function makeId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
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
  timers.clear(id)
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
  timers.start(id, toast.durationMs)
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
    pause: timers.pause,
    resume: timers.resume,
  }
}
