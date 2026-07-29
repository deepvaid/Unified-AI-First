/** Shared Storybook globals — pin stories to production theme/accent paths. */
export const darkModeGlobals = { theme: 'dark' as const }

export const lightModeGlobals = { theme: 'light' as const }

export function accentGlobals(accent: 'blue' | 'gray' | 'purple', theme: 'light' | 'dark' = 'dark') {
  return { theme, accent }
}
