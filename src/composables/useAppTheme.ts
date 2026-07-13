import { computed, ref } from 'vue'
import { useTheme } from 'vuetify'

export type AccentKey = 'cyan' | 'blue' | 'gray' | 'purple'
export type ThemeMode = 'light' | 'dark'
export type SidebarTheme = 'light' | 'gray' | 'dark'
export type ShellVariant = 'classic' | 'studio' | 'rail'
export type FramePref = 'auto' | 'on' | 'off'

const LS_ACCENT = 'app-accent'
const LS_MODE = 'app-theme-mode'
const LS_LEGACY_MODE = 'mp-theme-mode'
const LS_SHELL = 'app-shell'
const LS_FRAME = 'app-frame'

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
    hex: '#0073AB',               // Picton Blue, AA-darkened (5.2:1 on white) — matches theme primary token
    rgb: '0, 115, 171',
    onPrimary: '255, 255, 255',
    container: '222, 243, 255',   // #DEF3FF
    onContainer: '4, 50, 77',     // #04324D
  },
  blue: {
    hex: '#2D63E8',
    rgb: '45, 99, 232',
    onPrimary: '255, 255, 255',
    container: '235, 240, 255',
    onContainer: '30, 68, 155',
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

/** Read the stored accent, falling back to 'cyan' if it isn't a known key (e.g. a removed preset). */
function readStoredAccent(): AccentKey {
  const stored = localStorage.getItem(LS_ACCENT)
  return stored && stored in ACCENT_DEFS ? (stored as AccentKey) : 'cyan'
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
const accent = ref<AccentKey>(readStoredAccent())
const mode = ref<ThemeMode>(normalizeMode(localStorage.getItem(LS_MODE)))

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

/** Sidebar theme is derived from the active account (see App.vue), not persisted. */
export function applySidebarTheme(theme: SidebarTheme) {
  document.documentElement.dataset.sidebar = theme
}

// ─── Shell variant + content frame ────────────────────────────────────────────
// Three shells (classic / studio / rail) plus an independent "framed content"
// preference. `auto` follows the shell's default (frame on only for studio).
// ?shell= / ?frame= query params (App.vue) set tab-session overrides that win
// over the stored preference without persisting — for stakeholder share links.

function readStoredShell(): ShellVariant {
  const stored = localStorage.getItem(LS_SHELL)
  return stored === 'classic' || stored === 'rail' ? stored : 'studio'
}

function readStoredFrame(): FramePref {
  const stored = localStorage.getItem(LS_FRAME)
  return stored === 'on' || stored === 'off' ? stored : 'auto'
}

const shell = ref<ShellVariant>(readStoredShell())
const frame = ref<FramePref>(readStoredFrame())
const shellOverride = ref<ShellVariant | null>(null)
const frameOverride = ref<FramePref | null>(null)

/** The shell actually in effect (override ?? stored). */
export const resolvedShell = computed<ShellVariant>(() => shellOverride.value ?? shell.value)

/** Whether the rounded content frame is in effect (override ?? stored; auto → studio only). */
export const resolvedFrame = computed<boolean>(() => {
  const pref = frameOverride.value ?? frame.value
  return pref === 'auto' ? resolvedShell.value === 'studio' : pref === 'on'
})

function applyShellAttrs() {
  document.documentElement.dataset.shell = resolvedShell.value
  document.documentElement.dataset.frame = resolvedFrame.value ? 'on' : 'off'
}

export function setShell(v: ShellVariant) {
  shell.value = v
  // A deliberate choice beats a share-link override for the rest of the tab.
  shellOverride.value = null
  localStorage.setItem(LS_SHELL, v)
  applyShellAttrs()
}

export function setFrame(v: FramePref) {
  frame.value = v
  frameOverride.value = null
  localStorage.setItem(LS_FRAME, v)
  applyShellAttrs()
}

/** Tab-session demo overrides (?shell= / ?frame=) — never persisted. */
export function setShellOverride(v: ShellVariant) {
  shellOverride.value = v
  applyShellAttrs()
}

export function setFrameOverride(v: FramePref) {
  frameOverride.value = v
  applyShellAttrs()
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

  return {
    accent, accentHex, mode, setAccent, setMode, ACCENT_DEFS,
    shell, frame, resolvedShell, resolvedFrame, setShell, setFrame,
  }
}

/**
 * Call once from main.ts before app.mount() to apply stored preferences
 * before the first paint. Does NOT require Vuetify context.
 */
export function initAppTheme() {
  migrateLegacyThemeMode()
  const storedAccent = readStoredAccent()
  const storedMode = normalizeMode(localStorage.getItem(LS_MODE))
  applyAccent(storedAccent)
  applyMode(storedMode)
  applyShellAttrs()
  // Pre-mount default; App.vue applies the active account's sidebar theme before first paint.
  applySidebarTheme('light')
  localStorage.removeItem('app-dark-sidebar')
}
