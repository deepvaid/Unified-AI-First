import { createApp } from 'vue'
import App from './App.vue'
import { registerPlugins } from './plugins'
import router from './router'
import './styles/app-styles'
import { initAppTheme } from './composables/useAppTheme'
import { useToast } from './composables/useToast'

const app = createApp(App)

app.config.errorHandler = (err, _instance, info) => {
  console.error('[Vue Error]', err, info)
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.message?.includes('ResizeObserver loop')) return
    console.error('[Window Error]', event.error ?? event.message)
  })
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Promise Rejection]', event.reason)
  })
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()
    recoverFromChunkFailure()
  })
}

// ── Stale-chunk recovery ─────────────────────────────────────────────────────
// After a deploy, a tab that still holds the previous index.html asks for route
// chunks whose hashed files no longer exist, and the routed view renders blank.
// One reload picks up the new manifest. It must be ONE: if the chunk is missing
// for any other reason, an unconditional reload becomes an endless refresh
// (that happened on 2026-09-16). The marker is per URL and expires, so a later
// genuine deploy still gets its single reload.
const CHUNK_RELOAD_KEY = 'mp.chunk-reload'
const CHUNK_RELOAD_WINDOW_MS = 60_000
const CHUNK_ERROR_RE = /Failed to fetch dynamically imported module|Importing a module script failed|Couldn't resolve component|error loading dynamically imported module|preload/i

function recoverFromChunkFailure() {
  if (typeof window === 'undefined') return
  const href = window.location.href
  let last: { href: string; at: number } | null = null
  try {
    last = JSON.parse(window.sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? 'null')
  } catch {
    last = null
  }
  const recentlyReloaded = !!last && last.href === href && Date.now() - last.at < CHUNK_RELOAD_WINDOW_MS
  if (recentlyReloaded) {
    // Already tried once for this URL — the file is genuinely missing. Say so instead of looping.
    useToast().error('This page couldn’t load. Refresh to try again, or go back.', { title: 'Something went wrong' })
    return
  }
  try {
    window.sessionStorage.setItem(CHUNK_RELOAD_KEY, JSON.stringify({ href, at: Date.now() }))
  } catch {
    /* private mode: fall through to a single reload anyway */
  }
  window.location.reload()
}

router.onError((err) => {
  if (CHUNK_ERROR_RE.test(String((err as Error)?.message ?? err))) recoverFromChunkFailure()
  else console.error('[Router Error]', err)
})

// A navigation that rendered clears the marker, so the next real deploy can reload once again.
router.afterEach(() => {
  try {
    const raw = window.sessionStorage.getItem(CHUNK_RELOAD_KEY)
    if (raw && JSON.parse(raw)?.href !== window.location.href) window.sessionStorage.removeItem(CHUNK_RELOAD_KEY)
  } catch {
    /* ignore */
  }
})

registerPlugins(app)

initAppTheme()
app.mount('#app')
