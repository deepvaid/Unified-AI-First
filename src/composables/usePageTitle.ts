/**
 * Document title (WCAG 2.4.2 Page Titled): `<page> · Maropost`.
 *
 * The router sets a fallback from the route name on every navigation; a level-1
 * `MpPageHeader` then replaces it with the heading the page actually shows.
 */
const SUFFIX = 'Maropost'

export function setPageTitle(title?: string) {
  document.title = title ? `${title} · ${SUFFIX}` : SUFFIX
}

/** `SalesOrders` → `Sales orders`, `CDPHome` → `CDP home`. */
export function titleFromRouteName(name: string): string {
  const words = name.split(/(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/)
  return words
    .map((w, i) => (w === w.toUpperCase() ? w : i === 0 ? w : w.toLowerCase()))
    .join(' ')
}
