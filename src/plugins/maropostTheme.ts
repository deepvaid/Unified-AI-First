import {
  mp_color_light_background,
  mp_color_light_surface,
  mp_color_light_surfaceVariant,
  mp_color_light_surfaceTint,
  mp_color_light_onSurfaceVariant,
  mp_color_light_primary,
  mp_color_light_primaryDarken,
  mp_color_light_secondary,
  mp_color_light_secondaryDarken,
  mp_color_light_success,
  mp_color_light_successDarken,
  mp_color_light_warning,
  mp_color_light_warningDarken,
  mp_color_light_error,
  mp_color_light_errorDarken,
  mp_color_light_info,
  mp_color_light_onPrimary,
  mp_color_light_onSecondary,
  mp_color_light_onSuccess,
  mp_color_light_onError,
  mp_color_light_onWarning,
  mp_color_light_primaryContainer,
  mp_color_light_onPrimaryContainer,
  mp_color_light_successContainer,
  mp_color_light_onSuccessContainer,
  mp_color_light_warningContainer,
  mp_color_light_onWarningContainer,
  mp_color_light_errorContainer,
  mp_color_light_onErrorContainer,
  mp_color_light_surfaceBright,
  mp_color_light_outline,
  mp_color_light_outlineVariant,
  mp_color_light_border,
  mp_color_light_textPrimary,
  mp_color_light_flowLogic_primary,
  mp_color_light_flowLogic_onPrimary,
  mp_color_light_flowLogic_container,
  mp_color_blue_50,
  mp_color_blue_100,
  mp_color_blue_200,
  mp_color_blue_700,
  mp_color_blue_900,
  mp_color_neutral_100,
  mp_color_neutral_200,
  mp_color_dark_background,
  mp_color_dark_surface,
  mp_color_dark_surfaceVariant,
  mp_color_dark_surfaceTint,
  mp_color_dark_onSurfaceVariant,
  mp_color_dark_primary,
  mp_color_dark_primaryDarken,
  mp_color_dark_secondary,
  mp_color_dark_secondaryDarken,
  mp_color_dark_success,
  mp_color_dark_successDarken,
  mp_color_dark_warning,
  mp_color_dark_warningDarken,
  mp_color_dark_error,
  mp_color_dark_errorDarken,
  mp_color_dark_info,
  mp_color_dark_onPrimary,
  mp_color_dark_onSecondary,
  mp_color_dark_onSuccess,
  mp_color_dark_onError,
  mp_color_dark_onWarning,
  mp_color_dark_onInfo,
  mp_color_dark_primaryContainer,
  mp_color_dark_onPrimaryContainer,
  mp_color_dark_successContainer,
  mp_color_dark_onSuccessContainer,
  mp_color_dark_warningContainer,
  mp_color_dark_onWarningContainer,
  mp_color_dark_errorContainer,
  mp_color_dark_onErrorContainer,
  mp_color_dark_surfaceBright,
  mp_color_dark_surfaceLight,
  mp_color_dark_outline,
  mp_color_dark_outlineVariant,
  mp_color_dark_border,
  mp_color_dark_textPrimary,
  mp_color_dark_blue_50,
  mp_color_dark_blue_100,
  mp_color_dark_blue_200,
  mp_color_dark_blue_700,
  mp_color_dark_blue_900,
  mp_color_dark_neutral_100,
  mp_color_dark_neutral_200,
  mp_color_dark_flowLogic_primary,
  mp_color_dark_flowLogic_onPrimary,
  mp_color_dark_flowLogic_container,
  mp_fontFamily_base,
  mp_component_button_typography_fontSize,
  mp_component_button_typography_fontWeight,
  mp_component_button_typography_letterSpacing,
  mp_component_button_radius,
  mp_component_button_paddingInline,
  mp_component_control_height,
} from '@/design-tokens/generated/tokens'

export const maropostLight = {
  dark: false,
  colors: {
    // Accessibility note:
    // Prefer blue-700 (#0A7AB5) or darker for text on light surfaces.
    // blue-500 / blue-600 are accent tones and may fail AA for body-size text.
    background: mp_color_light_background,
    surface: mp_color_light_surface,
    'surface-variant': mp_color_light_surfaceVariant,
    'surface-tint': mp_color_light_surfaceTint,
    'on-surface-variant': mp_color_light_onSurfaceVariant,
    primary: mp_color_light_primary,
    'primary-darken-1': mp_color_light_primaryDarken,
    secondary: mp_color_light_secondary,
    'secondary-darken-1': mp_color_light_secondaryDarken,
    success: mp_color_light_success,
    'success-darken-1': mp_color_light_successDarken,
    warning: mp_color_light_warning,
    'warning-darken-1': mp_color_light_warningDarken,
    error: mp_color_light_error,
    'error-darken-1': mp_color_light_errorDarken,
    info: mp_color_light_info,
    border: mp_color_light_border,
    'on-primary': mp_color_light_onPrimary,
    'on-secondary': mp_color_light_onSecondary,
    'on-success': mp_color_light_onSuccess,
    'on-error': mp_color_light_onError,
    'on-warning': mp_color_light_onWarning,
    'on-surface': mp_color_light_textPrimary,
    'on-background': mp_color_light_textPrimary,
    'blue-50': mp_color_blue_50,
    'blue-100': mp_color_blue_100,
    'blue-200': mp_color_blue_200,
    'blue-700': mp_color_blue_700,
    'blue-900': mp_color_blue_900,
    'primary-container': mp_color_light_primaryContainer,
    'on-primary-container': mp_color_light_onPrimaryContainer,
    'success-container': mp_color_light_successContainer,
    'on-success-container': mp_color_light_onSuccessContainer,
    'warning-container': mp_color_light_warningContainer,
    'on-warning-container': mp_color_light_onWarningContainer,
    'error-container': mp_color_light_errorContainer,
    'on-error-container': mp_color_light_onErrorContainer,
    'surface-bright': mp_color_light_surfaceBright,
    'surface-light': mp_color_light_surfaceBright,
    outline: mp_color_light_outline,
    'outline-variant': mp_color_light_outlineVariant,
    'neutral-100': mp_color_neutral_100,
    'neutral-200': mp_color_neutral_200,
    'flow-logic': mp_color_light_flowLogic_primary,
    'on-flow-logic': mp_color_light_flowLogic_onPrimary,
    'flow-logic-container': mp_color_light_flowLogic_container,
  },
}

export const maropostDark = {
  dark: true,
  colors: {
    background: mp_color_dark_background,
    surface: mp_color_dark_surface,
    'surface-variant': mp_color_dark_surfaceVariant,
    'surface-tint': mp_color_dark_surfaceTint,
    'on-surface-variant': mp_color_dark_onSurfaceVariant,
    primary: mp_color_dark_primary,
    'primary-darken-1': mp_color_dark_primaryDarken,
    secondary: mp_color_dark_secondary,
    'secondary-darken-1': mp_color_dark_secondaryDarken,
    success: mp_color_dark_success,
    'success-darken-1': mp_color_dark_successDarken,
    warning: mp_color_dark_warning,
    'warning-darken-1': mp_color_dark_warningDarken,
    error: mp_color_dark_error,
    'error-darken-1': mp_color_dark_errorDarken,
    info: mp_color_dark_info,
    border: mp_color_dark_border,
    'on-primary': mp_color_dark_onPrimary,
    'on-secondary': mp_color_dark_onSecondary,
    'on-success': mp_color_dark_onSuccess,
    'on-error': mp_color_dark_onError,
    'on-warning': mp_color_dark_onWarning,
    'on-info': mp_color_dark_onInfo,
    'on-surface': mp_color_dark_textPrimary,
    'on-background': mp_color_dark_textPrimary,
    'blue-50': mp_color_dark_blue_50,
    'blue-100': mp_color_dark_blue_100,
    'blue-200': mp_color_dark_blue_200,
    'blue-700': mp_color_dark_blue_700,
    'blue-900': mp_color_dark_blue_900,
    'primary-container': mp_color_dark_primaryContainer,
    'on-primary-container': mp_color_dark_onPrimaryContainer,
    'success-container': mp_color_dark_successContainer,
    'on-success-container': mp_color_dark_onSuccessContainer,
    'warning-container': mp_color_dark_warningContainer,
    'on-warning-container': mp_color_dark_onWarningContainer,
    'error-container': mp_color_dark_errorContainer,
    'on-error-container': mp_color_dark_onErrorContainer,
    'surface-bright': mp_color_dark_surfaceBright,
    'surface-light': mp_color_dark_surfaceLight,
    outline: mp_color_dark_outline,
    'outline-variant': mp_color_dark_outlineVariant,
    'neutral-100': mp_color_dark_neutral_100,
    'neutral-200': mp_color_dark_neutral_200,
    'flow-logic': mp_color_dark_flowLogic_primary,
    'on-flow-logic': mp_color_dark_flowLogic_onPrimary,
    'flow-logic-container': mp_color_dark_flowLogic_container,
  },
}

export const maropostDefaults = {
  VBtn: {
    variant: 'flat',
    style: `
      letter-spacing: ${mp_component_button_typography_letterSpacing};
      font-weight: ${mp_component_button_typography_fontWeight};
      text-transform: none;
      font-family: ${mp_fontFamily_base};
      font-size: ${mp_component_button_typography_fontSize};
      border-radius: ${mp_component_button_radius};
      min-height: ${mp_component_control_height};
      padding-inline: ${mp_component_button_paddingInline};
    `,
  },
  VCard: {
    variant: 'flat',
    rounded: 'lg',
  },
  // Field chrome (borders, radius, states) is owned by settings-form.scss —
  // keep these defaults behavioral only. The one deliberate exception is
  // `persistentPlaceholder: true`: it selects the label MECHANISM, not the look.
  // It locks Vuetify's label into the permanently-floated state, which is what
  // lets settings-form.scss reposition it as a static top label (the float
  // animation never runs because the active state never transitions). It must
  // be set per component name — VSelect/VAutocomplete/VCombobox/VNumberInput
  // resolve the prop themselves and pass the boolean explicitly to their inner
  // VTextField, so a default on VTextField alone would be overridden.
  VTextField: {
    variant: 'outlined',
    density: 'comfortable',
    hideDetails: 'auto',
    color: 'primary',
    persistentPlaceholder: true,
  },
  VSelect: {
    variant: 'outlined',
    density: 'comfortable',
    hideDetails: 'auto',
    color: 'primary',
    persistentPlaceholder: true,
  },
  VAutocomplete: {
    variant: 'outlined',
    density: 'comfortable',
    hideDetails: 'auto',
    color: 'primary',
    persistentPlaceholder: true,
  },
  VCombobox: {
    variant: 'outlined',
    density: 'comfortable',
    hideDetails: 'auto',
    color: 'primary',
    persistentPlaceholder: true,
  },
  VTextarea: {
    variant: 'outlined',
    density: 'comfortable',
    hideDetails: 'auto',
    color: 'primary',
    persistentPlaceholder: true,
  },
  // VFileInput has no persistentPlaceholder prop — it renders VField directly.
  // `active: true` pulls the same lever (permanent v-field--active).
  VFileInput: {
    variant: 'outlined',
    density: 'comfortable',
    hideDetails: 'auto',
    color: 'primary',
    active: true,
  },
  // Selection controls (P6-14). These had no defaults at all, so they fell through
  // to raw Vuetify — `hideDetails: false`, `density: 'default'` — which is why a
  // checkbox group and the text fields above it sat on different rhythms and why
  // 417 call sites had each written `hide-details` by hand. Same contract as the
  // fields above: behaviour only, chrome stays with settings-form.scss.
  VCheckbox: {
    density: 'comfortable',
    hideDetails: 'auto',
    color: 'primary',
  },
  VRadioGroup: {
    density: 'comfortable',
    hideDetails: 'auto',
    color: 'primary',
  },
  VRadio: {
    density: 'comfortable',
    color: 'primary',
  },
  VSwitch: {
    density: 'comfortable',
    hideDetails: 'auto',
    color: 'primary',
  },
  VSlider: {
    density: 'comfortable',
    hideDetails: 'auto',
    color: 'primary',
  },
  VNumberInput: {
    variant: 'outlined',
    density: 'comfortable',
    hideDetails: 'auto',
    color: 'primary',
    persistentPlaceholder: true,
  },
  // One toggle-group convention (P6-14). Three were in use — comfortable/outlined/
  // divided, compact/rounded-lg, and compact/rounded-lg/border — so a segmented
  // control's height depended on which view you were looking at.
  VBtnToggle: {
    density: 'comfortable',
    variant: 'outlined',
    divided: true,
    color: 'primary',
  },
  VChipGroup: {
    color: 'primary',
    variant: 'outlined',
    selectedClass: 'v-chip--selected',
  },
  VAlert: {
    variant: 'tonal',
    rounded: 'md',
  },
  VChip: {
    rounded: 'pill',
    size: 'small',
  },
  VDataTable: {
    fixedHeader: true,
    hover: true,
    density: 'comfortable',
    itemsPerPage: 15,
  },
  VNavigationDrawer: {
    elevation: 0,
  },
  VAppBar: {
    elevation: 0,
  },
  VDivider: {
    opacity: 0.72,
  },
  VList: {
    elevation: 0,
    border: true,
    rounded: 'lg',
  },
  // WP-F3: VDialog rounded default intentionally omitted. Vuetify's
  // rounded="xl" computes to 24px (.rounded-xl in Vuetify's own main.css),
  // but component.dialog.radius.default is 16px and global.scss already
  // forces that radius with !important on the dialog card — adding
  // rounded="xl" here would not match and would change nothing visually
  // (the !important rule always wins), so it is left out rather than
  // documenting a default that isn't true.
  VMenu: {
    offset: 4,
  },
  VTooltip: {
    location: 'top',
    openDelay: 150,
    closeDelay: 0,
  },
  VSnackbar: {
    timeout: 2500,
    location: 'bottom center',
  },
}
