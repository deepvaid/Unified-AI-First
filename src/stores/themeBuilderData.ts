// Store theme builder data: the theme style defaults pulled from design tokens.
// Everything pure (the section and block catalogues, the section factories, the
// theme types and the storefront's CSS variables) lives in
// src/storefront/themeSections.ts and is re-exported from here, so existing imports
// keep working. Mirrors the journeyFlowData + schema-driven-config architecture.

import {
  mp_radius_12,
  mp_color_blue_500,
  mp_color_light_error,
  mp_color_light_primary,
  mp_color_light_surface,
  mp_color_light_textPrimary,
} from '@/design-tokens/generated/tokens'
import type { ThemeStyles } from '@/storefront/themeSections'

export * from '@/storefront/themeSections'

/** Default global theme styles, sourced from design tokens. */
export function defaultThemeStyles(): ThemeStyles {
  return {
    brandColor: mp_color_light_primary,
    accentColor: mp_color_blue_500,
    background: mp_color_light_surface,
    textColor: mp_color_light_textPrimary,
    headingFont: 'Inter',
    bodyFont: 'Inter',
    cornerRadius: Number.parseInt(mp_radius_12, 10),
    buttonStyle: 'solid',
    saleBadgeColor: mp_color_light_error,
    customBadgeColor: mp_color_blue_500,
    // The sold-out tag's colour before badges were a theme setting.
    soldOutBadgeColor: '#121011',
  }
}
