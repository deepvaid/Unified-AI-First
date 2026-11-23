// A browser and its system, named the way a person would say them — for the voice page's debug box
// (`?debug=1`), so a screenshot answers "which machine and browser?". Pure — unit-tested under
// `node --test` (tests/davinci/browserName.test.ts).

const OS: Array<[RegExp, string]> = [
  [/iPhone|iPad|iPod/, 'iOS'],
  [/Android/, 'Android'],
  [/Windows/, 'Windows'],
  [/CrOS/, 'ChromeOS'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/Linux/, 'Linux'],
]

// Order matters: Edge and Opera also say "Chrome", and every Chromium browser also says "Safari".
const BROWSERS: Array<[RegExp, string]> = [
  [/Edg(?:e|A|iOS)?\/(\d+)/, 'Edge'],
  [/OPR\/(\d+)/, 'Opera'],
  [/(?:Firefox|FxiOS)\/(\d+)/, 'Firefox'],
  [/(?:Chrome|CriOS)\/(\d+)/, 'Chrome'],
  [/Version\/(\d+)[\d.]*.*Safari/, 'Safari'],
]

/** "Chrome 158 · macOS", "Safari 18 · iOS", "Edge 131 · Windows · inside Teams". */
export function describeBrowser(userAgent: string): string {
  const os = OS.find(([pattern]) => pattern.test(userAgent))?.[1] ?? 'unknown system'
  let browser = 'unknown browser'
  for (const [pattern, name] of BROWSERS) {
    const match = pattern.exec(userAgent)
    if (match) {
      browser = `${name} ${match[1]}`
      break
    }
  }
  // A link opened inside a desktop app's own window (Teams, Slack…) is not the person's real browser:
  // sound and microphone rules differ there, which is worth knowing first.
  const host = /\bTeams\b|TeamsMobile/i.test(userAgent) ? 'inside Teams' : /Electron\//.test(userAgent) ? 'inside a desktop app' : null
  return [browser, os, host].filter(Boolean).join(' · ')
}
