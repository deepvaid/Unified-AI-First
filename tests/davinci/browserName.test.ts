import { test } from 'node:test'
import assert from 'node:assert/strict'
import { describeBrowser } from '../../src/davinci/browserName.ts'

test('a user agent reads as the browser and system a person would name', () => {
  const table: Array<[string, string]> = [
    [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36',
      'Chrome 158 · macOS',
    ],
    [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
      'Safari 18 · macOS',
    ],
    // Edge says "Chrome" and "Safari" too — it must still read as Edge.
    [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
      'Edge 131 · Windows',
    ],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0', 'Firefox 133 · Windows'],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
      'Safari 18 · iOS',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1',
      'Chrome 131 · iOS',
    ],
    [
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
      'Chrome 131 · Android',
    ],
    // A link opened inside Teams' own window is not the person's browser.
    [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0 Teams/24295.605.3225.8804/49',
      'Edge 128 · Windows · inside Teams',
    ],
    [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) MyApp/1.0 Chrome/130.0.0.0 Electron/33.0.0 Safari/537.36',
      'Chrome 130 · macOS · inside a desktop app',
    ],
    ['', 'unknown browser · unknown system'],
  ]
  for (const [userAgent, expected] of table) assert.equal(describeBrowser(userAgent), expected, userAgent)
})
