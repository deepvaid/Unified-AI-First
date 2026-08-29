// One modal focus trap (GAPS §4, closed 2026-08-30).
//
// MpFormDrawer and DvHistoryDrawer each carried a verbatim copy of the same three
// behaviours: move focus into the panel on open, restore it to the trigger on
// close, and cycle Tab/Shift-Tab across the panel's visible focusables with
// Escape routed to the host's close path. This composable owns all three; the
// host binds the returned `onKeydown` to its panel-bearing element.
//
// `enabled` exists for dual-mode surfaces (DvHistoryDrawer's rail mode is a
// persistent sidebar, not a dialog — the trap must stay inert there).
import { nextTick, watch, type Ref } from 'vue'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(
  panel: Ref<HTMLElement | null>,
  isOpen: () => boolean,
  options: {
    /** Escape routes here — the host decides between closing and a guarded confirm. */
    onEscape: () => void
    /** Trap only while this is true (default: always). */
    enabled?: () => boolean
  },
) {
  const enabled = options.enabled ?? (() => true)
  let lastFocused: HTMLElement | null = null

  // Move focus into the panel on open, restore it to the trigger on close.
  watch(isOpen, async (open) => {
    if (!enabled()) return
    if (open) {
      lastFocused = document.activeElement as HTMLElement | null
      await nextTick()
      panel.value?.focus()
    } else if (lastFocused) {
      lastFocused.focus?.()
      lastFocused = null
    }
  })

  function onKeydown(e: KeyboardEvent) {
    if (!enabled()) return
    if (e.key === 'Escape') {
      options.onEscape()
      return
    }
    if (e.key !== 'Tab' || !panel.value) return
    const focusable = Array.from(
      panel.value.querySelectorAll<HTMLElement>(FOCUSABLE),
      // Skip elements hidden inside collapsed sections (display:none ancestors etc.).
    ).filter(el => el.offsetParent !== null)
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (!first || !last) return
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return { onKeydown }
}
