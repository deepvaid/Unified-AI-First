import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

/**
 * Tracks whether a scroll container is resting at its top and bottom edges.
 *
 * The overlay shells (P6-2) use this to cast a shadow from the header or footer
 * only while content is actually hidden beneath it. A divider alone cannot say
 * that — it looks identical whether the body is scrolled or not — so a long form
 * gave no signal that it continued past the fold.
 *
 * A ResizeObserver is part of the contract, not a nicety: a body whose content
 * grows (a validation message appearing, a section expanding) crosses the
 * scrollable threshold without ever firing a scroll event.
 */
export function useScrollEdges(el: Ref<HTMLElement | null>) {
  const atTop = ref(true)
  const atBottom = ref(true)

  // Sub-pixel layout means scrollTop rarely lands exactly on 0 or on the maximum.
  const EPSILON = 1

  function measure() {
    const node = el.value
    if (!node) {
      atTop.value = true
      atBottom.value = true
      return
    }
    const { scrollTop, scrollHeight, clientHeight } = node
    atTop.value = scrollTop <= EPSILON
    atBottom.value = scrollTop + clientHeight >= scrollHeight - EPSILON
  }

  let observer: ResizeObserver | null = null
  let observed: HTMLElement | null = null

  function detach() {
    observed?.removeEventListener('scroll', measure)
    observer?.disconnect()
    observer = null
    observed = null
  }

  // The element is behind a v-if in both shells, so it arrives and leaves with
  // the overlay rather than existing for the component's lifetime.
  watch(el, (node) => {
    detach()
    if (!node) {
      measure()
      return
    }
    observed = node
    node.addEventListener('scroll', measure, { passive: true })
    observer = new ResizeObserver(measure)
    observer.observe(node)
    for (const child of Array.from(node.children)) observer.observe(child)
    measure()
  }, { immediate: true, flush: 'post' })

  onBeforeUnmount(detach)

  return { atTop, atBottom, measure }
}
