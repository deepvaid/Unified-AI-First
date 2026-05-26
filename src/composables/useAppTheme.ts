import { ref } from 'vue'
import { useTheme } from 'vuetify'

export type AccentKey = 'cyan' | 'blue' | 'amber' | 'gray' | 'purple'
export type ThemeMode = 'light' | 'dark'

const LS_ACCENT = 'app-accent'
const LS_MODE = 'app-theme-mode'
const LS_LEGACY_MODE = 'mp-theme-mode'
const LS_DARK_SIDEBAR = 'app-dark-sidebar'

// ─── Accent color definitions ─────────────────────────────────────────────────
interface AccentDef {
  hex: string
  rgb: string          // "r, g, b" for Vuetify --v-theme-primary
  onPrimary: string
  container: string
  onContainer: string
}

const ACCENT_DEFS: Record<AccentKey, AccentDef> = {
  cyan: {
    hex: '#00B7F4',
    rgb: '0, 183, 244',
    onPrimary: '255, 255, 255',
    container: '204, 240, 253',   // #ccf0fd
    onContainer: '0, 72, 105',    // #004869
  },
  blue: {
    hex: '#2D63E8',
    rgb: '45, 99, 232',
    onPrimary: '255, 255, 255',
    container: '235, 240, 255',
    onContainer: '30, 68, 155',
  },
  amber: {
    hex: '#B45309',
    rgb: '180, 83, 9',
    onPrimary: '255, 255, 255',
    container: '254, 243, 199',
    onContainer: '120, 53, 5',
  },
  gray: {
    hex: '#4B5563',
    rgb: '75, 85, 99',
    onPrimary: '255, 255, 255',
    container: '229, 231, 235',
    onContainer: '31, 41, 55',
  },
  purple: {
    hex: '#8B5CF6',
    rgb: '139, 92, 246',
    onPrimary: '255, 255, 255',
    container: '237, 233, 254',
    onContainer: '76, 29, 149',
  },
}

function normalizeMode(stored: string | null): ThemeMode {
  return stored === 'dark' ? 'dark' : 'light'
}

function migrateLegacyThemeMode() {
  if (typeof window === 'undefined') return

  const current = window.localStorage.getItem(LS_MODE)
  const legacy = window.localStorage.getItem(LS_LEGACY_MODE)

  if (!current && legacy) {
    window.localStorage.setItem(LS_MODE, normalizeMode(legacy))
  }

  if (legacy) {
    window.localStorage.removeItem(LS_LEGACY_MODE)
  }

  const stored = window.localStorage.getItem(LS_MODE)
  if (stored && stored !== 'light' && stored !== 'dark') {
    window.localStorage.setItem(LS_MODE, 'light')
  }
}

// ─── Reactive state ───────────────────────────────────────────────────────────
const accent = ref<AccentKey>((localStorage.getItem(LS_ACCENT) as AccentKey) || 'cyan')
const mode = ref<ThemeMode>(normalizeMode(localStorage.getItem(LS_MODE)))
const darkSidebar = ref<boolean>(localStorage.getItem(LS_DARK_SIDEBAR) !== 'false')

/** Current accent hex color — reactive, for use in charts and dynamic JS. */
const accentHex = ref<string>(ACCENT_DEFS[accent.value].hex)

function applyAccent(key: AccentKey) {
  if (key === 'cyan') {
    delete document.documentElement.dataset.accent
  } else {
    document.documentElement.dataset.accent = key
  }
  accentHex.value = ACCENT_DEFS[key].hex
  localStorage.setItem(LS_ACCENT, key)
}

function applyMode(m: ThemeMode) {
  document.documentElement.dataset.theme = m === 'dark' ? 'dark' : 'light'
  localStorage.setItem(LS_MODE, m)
}

function applyDarkSidebar(val: boolean) {
  if (val) {
    document.documentElement.dataset.sidebar = 'dark'
  } else {
    delete document.documentElement.dataset.sidebar
  }
  localStorage.setItem(LS_DARK_SIDEBAR, String(val))
}

export function useAppTheme() {
  const vuetifyTheme = useTheme()

  function setAccent(key: AccentKey) {
    accent.value = key
    applyAccent(key)

    // Programmatically update Vuetify theme colors so every component reacts
    const def = ACCENT_DEFS[key]
    const currentThemeName = vuetifyTheme.global.name.value
    const theme = vuetifyTheme.global.current.value
    const bucket = vuetifyTheme.themes.value[currentThemeName]
    if (theme?.colors && bucket?.colors) {
      bucket.colors.primary = def.hex
      bucket.colors.info = def.hex
      bucket.colors['primary-container'] = `rgb(${def.container})`
      bucket.colors['on-primary-container'] = `rgb(${def.onContainer})`
    }
  }

  function setMode(m: ThemeMode) {
    mode.value = m
    applyMode(m)
    vuetifyTheme.global.name.value = m === 'dark' ? 'maropostDark' : 'maropostLight'

    // Re-apply accent to the new theme
    const def = ACCENT_DEFS[accent.value]
    const currentThemeName = vuetifyTheme.global.name.value
    const bucket = vuetifyTheme.themes.value[currentThemeName]
    if (bucket?.colors) {
      bucket.colors.primary = def.hex
      bucket.colors.info = def.hex
    }
  }

  function setDarkSidebar(val: boolean) {
    darkSidebar.value = val
    applyDarkSidebar(val)
  }

  return { accent, accentHex, mode, darkSidebar, setAccent, setMode, setDarkSidebar, ACCENT_DEFS }
}

/**
 * Call once from main.ts before app.mount() to apply stored preferences
 * before the first paint. Does NOT require Vuetify context.
 */
export function initAppTheme() {
  migrateLegacyThemeMode()
  const storedAccent = (localStorage.getItem(LS_ACCENT) as AccentKey) || 'cyan'
  const storedMode = normalizeMode(localStorage.getItem(LS_MODE))
  applyAccent(storedAccent)
  applyMode(storedMode)
  // Dark sidebar is always on (no user-facing toggle).
  applyDarkSidebar(true)
}
