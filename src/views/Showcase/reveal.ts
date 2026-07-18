import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * True once `target` first enters the viewport. Resolves to `true`
 * immediately when IntersectionObserver is unavailable or the user
 * prefers reduced motion — content must never stay hidden.
 */
export function useRevealOnce(target: Ref<HTMLElement | null>, threshold = 0.18) {
  const revealed = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    const el = target.value
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!el || reduced || typeof IntersectionObserver === 'undefined') {
      revealed.value = true
      return
    }
    observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          revealed.value = true
          observer?.disconnect()
          observer = null
        }
      },
      { threshold },
    )
    observer.observe(el)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return revealed
}

/**
 * rAF count-up toward `to`. Call `start(delayMs)` when the number scrolls
 * into view; renders the final value instantly under reduced motion.
 * Also consumed by the /reel stat-punch card.
 */
export function useCountUp(to: number, duration = 900) {
  const value = ref(0)
  let raf = 0
  let timer = 0
  let started = false

  function start(delay = 0) {
    if (started) return
    started = true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      value.value = to
      return
    }
    const begin = () => {
      const t0 = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - t0) / duration, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        value.value = Math.round(to * eased)
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
    if (delay > 0) {
      timer = window.setTimeout(begin, delay)
    } else {
      begin()
    }
  }

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf)
    window.clearTimeout(timer)
  })

  return { value, start }
}
