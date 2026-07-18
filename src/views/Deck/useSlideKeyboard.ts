import { onBeforeUnmount, onMounted } from 'vue'

interface SlideKeyboardOptions {
  count: () => number
  get: () => number
  set: (index: number) => void
  /** Pre-hook — return true when the event was handled (skips default nav). */
  onKey?: (e: KeyboardEvent) => boolean
}

function isFormTarget(e: KeyboardEvent) {
  const el = e.target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

/**
 * Window-level keyboard navigation for slide-style surfaces (Deck + Reel).
 * ←/→, PageUp/PageDown (presentation clickers), Space, Home/End.
 */
export function useSlideKeyboard(opts: SlideKeyboardOptions) {
  function clamp(i: number) {
    return Math.min(Math.max(i, 0), Math.max(opts.count() - 1, 0))
  }

  function onKeydown(e: KeyboardEvent) {
    if (isFormTarget(e) || e.metaKey || e.ctrlKey || e.altKey) return
    if (opts.onKey?.(e)) {
      e.preventDefault()
      return
    }
    switch (e.key) {
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
        e.preventDefault()
        opts.set(clamp(opts.get() + 1))
        break
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault()
        opts.set(clamp(opts.get() - 1))
        break
      case 'Home':
        e.preventDefault()
        opts.set(0)
        break
      case 'End':
        e.preventDefault()
        opts.set(clamp(opts.count() - 1))
        break
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
}
