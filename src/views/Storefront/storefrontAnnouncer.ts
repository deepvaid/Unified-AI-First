// One polite live region for the storefront: what changed on the page that a
// screen reader would not otherwise say ("12 styles", "Added to your cart ·
// Size M · Black"). It is made the first time something is said, once per
// document, visually hidden.
//
// While a modal <dialog> is open (StorefrontDrawer) the rest of the page is
// inert, and a live region in inert content is never read. So a message said
// then goes to a region inside that dialog, made the same way the first time.

/** Keeps a region out of sight but in the accessibility tree. */
const HIDDEN = [
  'position:absolute', 'width:1px', 'height:1px', 'margin:-1px', 'padding:0', 'border:0',
  'overflow:hidden', 'clip-path:inset(50%)', 'white-space:nowrap',
].join(';')

const regions = new WeakMap<Element, HTMLElement>()
const timers = new WeakMap<HTMLElement, number>()

/** The open modal dialog on top, if any: the only part of the page a screen reader can reach. */
function topModal(): HTMLDialogElement | null {
  const open = [...document.querySelectorAll<HTMLDialogElement>('dialog[open]')].filter((dialog) => {
    try {
      return dialog.matches(':modal')
    } catch {
      return true
    }
  })
  return open[open.length - 1] ?? null
}

function regionIn(host: Element): HTMLElement {
  const existing = regions.get(host)
  if (existing?.isConnected) return existing
  const region = document.createElement('div')
  region.setAttribute('role', 'status')
  region.setAttribute('aria-live', 'polite')
  region.setAttribute('aria-atomic', 'true')
  region.dataset.storefrontAnnouncer = ''
  region.style.cssText = HIDDEN
  host.append(region)
  regions.set(host, region)
  return region
}

/**
 * Says `text` to screen readers, politely (after what they are reading now).
 * Saying the same text twice says it twice. Does nothing outside a browser.
 */
export function announce(text: string): void {
  if (typeof document === 'undefined' || !document.body) return
  const region = regionIn(topModal() ?? document.body)
  const pending = timers.get(region)
  if (pending !== undefined) window.clearTimeout(pending)
  // Emptied first, then filled after a beat, so a repeat of the last message is a change too.
  region.textContent = ''
  timers.set(region, window.setTimeout(() => {
    region.textContent = text.trim()
    timers.delete(region)
  }, 60))
}
