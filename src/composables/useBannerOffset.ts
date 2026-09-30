import { onBeforeUnmount, watch, type Ref } from 'vue'

/** The custom property pages read to leave room for the banner: `calc(100dvh - … - var(--mp-banner-offset, 0px))`. */
export const BANNER_OFFSET_VAR = '--mp-banner-offset'

/**
 * Publishes an edge banner's rendered height on <html> while it is on screen. A page that fills "the viewport
 * under the app bar" (the full-page copilot) sits BELOW the banner in the flow, so without this it ends the
 * banner's height past the bottom of the screen and its composer is cut off. The property is removed when the
 * banner goes away (dismissed, trial upgraded, route left).
 */
export function useBannerOffset(target: Ref<HTMLElement | null | undefined>) {
  let observer: ResizeObserver | null = null

  function release() {
    observer?.disconnect()
    observer = null
    document.documentElement.style.removeProperty(BANNER_OFFSET_VAR)
  }

  watch(
    target,
    (el) => {
      release()
      if (!el || typeof ResizeObserver === 'undefined') return
      // The border box (padding + hairline included), not the content box `useElementSize` reports.
      const publish = () => document.documentElement.style.setProperty(BANNER_OFFSET_VAR, `${el.getBoundingClientRect().height}px`)
      observer = new ResizeObserver(publish)
      observer.observe(el)
      publish()
    },
    { immediate: true, flush: 'post' },
  )

  onBeforeUnmount(release)
}
