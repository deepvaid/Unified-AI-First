import { computed, ref } from 'vue'
import { useTheme } from 'vuetify'
import {
  mp_color_dark_accent_blue_active,
  mp_color_dark_accent_blue_container,
  mp_color_dark_accent_blue_default,
  mp_color_dark_accent_blue_focusRing,
  mp_color_dark_accent_blue_hover,
  mp_color_dark_accent_blue_onAccent,
  mp_color_dark_accent_blue_onContainer,
  mp_color_dark_accent_blue_selectedBackground,
  mp_color_dark_accent_blue_subtleBackground,
  mp_color_dark_accent_cyan_active,
  mp_color_dark_accent_cyan_container,
  mp_color_dark_accent_cyan_default,
  mp_color_dark_accent_cyan_focusRing,
  mp_color_dark_accent_cyan_hover,
  mp_color_dark_accent_cyan_onAccent,
  mp_color_dark_accent_cyan_onContainer,
  mp_color_dark_accent_cyan_selectedBackground,
  mp_color_dark_accent_cyan_subtleBackground,
  mp_color_dark_accent_gray_active,
  mp_color_dark_accent_gray_container,
  mp_color_dark_accent_gray_default,
  mp_color_dark_accent_gray_focusRing,
  mp_color_dark_accent_gray_hover,
  mp_color_dark_accent_gray_onAccent,
  mp_color_dark_accent_gray_onContainer,
  mp_color_dark_accent_gray_selectedBackground,
  mp_color_dark_accent_gray_subtleBackground,
  mp_color_dark_accent_purple_active,
  mp_color_dark_accent_purple_container,
  mp_color_dark_accent_purple_default,
  mp_color_dark_accent_purple_focusRing,
  mp_color_dark_accent_purple_hover,
  mp_color_dark_accent_purple_onAccent,
  mp_color_dark_accent_purple_onContainer,
  mp_color_dark_accent_purple_selectedBackground,
  mp_color_dark_accent_purple_subtleBackground,
  mp_color_light_accent_blue_active,
  mp_color_light_accent_blue_container,
  mp_color_light_accent_blue_default,
  mp_color_light_accent_blue_focusRing,
  mp_color_light_accent_blue_hover,
  mp_color_light_accent_blue_onAccent,
  mp_color_light_accent_blue_onContainer,
  mp_color_light_accent_blue_selectedBackground,
  mp_color_light_accent_blue_subtleBackground,
  mp_color_light_accent_cyan_active,
  mp_color_light_accent_cyan_container,
  mp_color_light_accent_cyan_default,
  mp_color_light_accent_cyan_focusRing,
  mp_color_light_accent_cyan_hover,
  mp_color_light_accent_cyan_onAccent,
  mp_color_light_accent_cyan_onContainer,
  mp_color_light_accent_cyan_selectedBackground,
  mp_color_light_accent_cyan_subtleBackground,
  mp_color_light_accent_gray_active,
  mp_color_light_accent_gray_container,
  mp_color_light_accent_gray_default,
  mp_color_light_accent_gray_focusRing,
  mp_color_light_accent_gray_hover,
  mp_color_light_accent_gray_onAccent,
  mp_color_light_accent_gray_onContainer,
  mp_color_light_accent_gray_selectedBackground,
  mp_color_light_accent_gray_subtleBackground,
  mp_color_light_accent_purple_active,
  mp_color_light_accent_purple_container,
  mp_color_light_accent_purple_default,
  mp_color_light_accent_purple_focusRing,
  mp_color_light_accent_purple_hover,
  mp_color_light_accent_purple_onAccent,
  mp_color_light_accent_purple_onContainer,
  mp_color_light_accent_purple_selectedBackground,
  mp_color_light_accent_purple_subtleBackground,
} from '@/design-tokens/generated/tokens'

export type AccentKey = 'cyan' | 'blue' | 'gray' | 'purple'
export type ThemeMode = 'light' | 'dark'
export type SidebarTheme = 'white' | 'gray' | 'dark'
export type ShellVariant = 'classic' | 'studio' | 'rail'
export type FramePref = 'auto' | 'on' | 'off'

const LS_ACCENT = 'app-accent'
const LS_MODE = 'app-theme-mode'
const LS_LEGACY_MODE = 'mp-theme-mode'
const LS_SHELL = 'app-shell'
const LS_FRAME = 'app-frame'

// ─── Accent color definitions ─────────────────────────────────────────────────
interface AccentModeDef {
  default: string
  hover: string
  active: string
  selectedBackground: string
  subtleBackground: string
  focusRing: string
  onAccent: string
  container: string
  onContainer: string
}

type AccentDef = Record<ThemeMode, AccentModeDef>

const ACCENT_DEFS: Record<AccentKey, AccentDef> = {
  cyan: {
    light: {
      default: mp_color_light_accent_cyan_default,
      hover: mp_color_light_accent_cyan_hover,
      active: mp_color_light_accent_cyan_active,
      selectedBackground: mp_color_light_accent_cyan_selectedBackground,
      subtleBackground: mp_color_light_accent_cyan_subtleBackground,
      focusRing: mp_color_light_accent_cyan_focusRing,
      onAccent: mp_color_light_accent_cyan_onAccent,
      container: mp_color_light_accent_cyan_container,
      onContainer: mp_color_light_accent_cyan_onContainer,
    },
    dark: {
      default: mp_color_dark_accent_cyan_default,
      hover: mp_color_dark_accent_cyan_hover,
      active: mp_color_dark_accent_cyan_active,
      selectedBackground: mp_color_dark_accent_cyan_selectedBackground,
      subtleBackground: mp_color_dark_accent_cyan_subtleBackground,
      focusRing: mp_color_dark_accent_cyan_focusRing,
      onAccent: mp_color_dark_accent_cyan_onAccent,
      container: mp_color_dark_accent_cyan_container,
      onContainer: mp_color_dark_accent_cyan_onContainer,
    },
  },
  blue: {
    light: {
      default: mp_color_light_accent_blue_default,
      hover: mp_color_light_accent_blue_hover,
      active: mp_color_light_accent_blue_active,
      selectedBackground: mp_color_light_accent_blue_selectedBackground,
      subtleBackground: mp_color_light_accent_blue_subtleBackground,
      focusRing: mp_color_light_accent_blue_focusRing,
      onAccent: mp_color_light_accent_blue_onAccent,
      container: mp_color_light_accent_blue_container,
      onContainer: mp_color_light_accent_blue_onContainer,
    },
    dark: {
      default: mp_color_dark_accent_blue_default,
      hover: mp_color_dark_accent_blue_hover,
      active: mp_color_dark_accent_blue_active,
      selectedBackground: mp_color_dark_accent_blue_selectedBackground,
      subtleBackground: mp_color_dark_accent_blue_subtleBackground,
      focusRing: mp_color_dark_accent_blue_focusRing,
      onAccent: mp_color_dark_accent_blue_onAccent,
      container: mp_color_dark_accent_blue_container,
      onContainer: mp_color_dark_accent_blue_onContainer,
    },
  },
  gray: {
    light: {
      default: mp_color_light_accent_gray_default,
      hover: mp_color_light_accent_gray_hover,
      active: mp_color_light_accent_gray_active,
      selectedBackground: mp_color_light_accent_gray_selectedBackground,
      subtleBackground: mp_color_light_accent_gray_subtleBackground,
      focusRing: mp_color_light_accent_gray_focusRing,
      onAccent: mp_color_light_accent_gray_onAccent,
      container: mp_color_light_accent_gray_container,
      onContainer: mp_color_light_accent_gray_onContainer,
    },
    dark: {
      default: mp_color_dark_accent_gray_default,
      hover: mp_color_dark_accent_gray_hover,
      active: mp_color_dark_accent_gray_active,
      selectedBackground: mp_color_dark_accent_gray_selectedBackground,
      subtleBackground: mp_color_dark_accent_gray_subtleBackground,
      focusRing: mp_color_dark_accent_gray_focusRing,
      onAccent: mp_color_dark_accent_gray_onAccent,
      container: mp_color_dark_accent_gray_container,
      onContainer: mp_color_dark_accent_gray_onContainer,
    },
  },
  purple: {
    light: {
      default: mp_color_light_accent_purple_default,
      hover: mp_color_light_accent_purple_hover,
      active: mp_color_light_accent_purple_active,
      selectedBackground: mp_color_light_accent_purple_selectedBackground,
      subtleBackground: mp_color_light_accent_purple_subtleBackground,
      focusRing: mp_color_light_accent_purple_focusRing,
      onAccent: mp_color_light_accent_purple_onAccent,
      container: mp_color_light_accent_purple_container,
      onContainer: mp_color_light_accent_purple_onContainer,
    },
    dark: {
      default: mp_color_dark_accent_purple_default,
      hover: mp_color_dark_accent_purple_hover,
      active: mp_color_dark_accent_purple_active,
      selectedBackground: mp_color_dark_accent_purple_selectedBackground,
      subtleBackground: mp_color_dark_accent_purple_subtleBackground,
      focusRing: mp_color_dark_accent_purple_focusRing,
      onAccent: mp_color_dark_accent_purple_onAccent,
      container: mp_color_dark_accent_purple_container,
      onContainer: mp_color_dark_accent_purple_onContainer,
    },
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
const accentHex = computed(() => ACCENT_DEFS[accent.value][mode.value].default)

function applyAccent(key: AccentKey) {
  if (key === 'cyan') {
    delete document.documentElement.dataset.accent
  } else {
    document.documentElement.dataset.accent = key
  }
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
  }

  function setMode(m: ThemeMode) {
    mode.value = m
    applyMode(m)
    vuetifyTheme.global.name.value = m === 'dark' ? 'maropostDark' : 'maropostLight'
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
  applySidebarTheme('gray')
  localStorage.removeItem('app-dark-sidebar')
}
