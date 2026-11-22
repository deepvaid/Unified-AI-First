// Which catalogue product a request names. Pure — unit-tested under `node --test`
// (tests/davinci/productMatch.test.ts).
//
// "Write a product description for the Nike Air Max 270" must find "Nike Air Max 270 - Black/White" in the
// catalogue: people say the product's name, not its variant suffix.

const words = (text: string): string[] => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean)

/** "Nike Air Max 270 - Black/White" → "Nike Air Max 270": the name without its variant suffix. */
export const displayName = (name: string): string => name.split(/\s+[-–|]\s+/)[0]?.trim() || name

/** How many of the name's leading words appear in the request, in order and together. */
function leadingRun(nameWords: string[], requestWords: string[]): number {
  let best = 0
  for (let start = 0; start < requestWords.length; start++) {
    let run = 0
    while (run < nameWords.length && requestWords[start + run] === nameWords[run]) run++
    best = Math.max(best, run)
  }
  return best
}

/**
 * The catalogue name the request means, or null. A product is named when its whole display name is said,
 * or at least its first two words ("the Hydro Flask") — one shared word ("Sony") names a brand, not a product.
 * The longest match wins; a tie names nothing.
 */
export function matchProductName(text: string, names: string[]): string | null {
  const requestWords = words(text)
  let best: { name: string; run: number } | null = null
  let tied = false
  for (const name of names) {
    const nameWords = words(displayName(name))
    const run = leadingRun(nameWords, requestWords)
    if (run < Math.min(2, nameWords.length)) continue
    if (!best || run > best.run) {
      best = { name, run }
      tied = false
    } else if (run === best.run) {
      tied = true
    }
  }
  return best && !tied ? best.name : null
}
