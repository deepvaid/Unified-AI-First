/**
 * Where to find each reference story's counterpart in the LiquidSky Storybook.
 *
 * `liquidskyMap.ts` says what a component should measure. This file says which LiquidSky story
 * shows the same thing and which selector there is the same part, so `scripts/qa-compare.mjs`
 * can measure the build and list the differences.
 *
 * Keyed by the reference story id. A part with no selector here is not compared; a story with no
 * entry is shown without a build screenshot. Only like-for-like parts are listed: where the two
 * libraries build a thing differently (hover overlays, a count merged into a label), the part is
 * left to the eye rather than reported as a difference.
 *
 * Pure data, no imports — Node loads this file directly with type stripping.
 */

export interface QaPair {
  /** Story id in the LiquidSky Storybook. */
  id: string
  /** Clicked first, when the story opens its surface from a trigger. */
  open?: string
  /** Hovered first, when the surface only shows on hover. */
  hover?: string
  /** Part name (from liquidskyMap.ts) → selector in the LiquidSky story. */
  parts: Record<string, string>
}

const dialogParts = (block: string): Record<string, string> => ({
  card: `.${block}__card`,
  header: `.${block}__header`,
  title: `.${block}__title`,
  body: `.${block}__body`,
  footer: `.${block}__actions`,
  'secondary button': `.${block}__actions .v-btn:first-of-type`,
  'primary button': `.${block}__actions .v-btn:last-of-type`,
})

const snackbar: QaPair = {
  id: 'components-appsnackbar--interactive',
  open: 'button:has-text("Show Snackbar")',
  parts: {
    toast: '.v-snackbar__wrapper',
    message: '.v-snackbar__content',
  },
}

export const QA_PAIRS: Record<string, QaPair> = {
  'patterns-app-shell-appsidebar--expanded': {
    id: 'components-theunifiednavigation--default',
    parts: {
      rail: 'nav.the-app-sidebar',
      item: '.the-app-sidebar__row',
      'item label': '.the-app-sidebar__title',
    },
  },
  'patterns-app-shell-appsidebar--collapsed-rail': {
    id: 'components-theunifiednavigation--collapsed-rail',
    parts: { rail: 'nav.the-app-sidebar' },
  },
  'patterns-app-shell-appbar--default': {
    id: 'components-theheader--default',
    parts: {
      bar: '.the-header--marobase header.v-toolbar',
      'icon button': '.the-header--marobase .v-toolbar-items .v-btn--icon',
    },
  },
  'molecules-mppageheader--default': {
    id: 'components-apppagetitle--default',
    parts: {
      title: '.app-page-title__heading',
      subtitle: '.app-page-title__subtitle',
    },
  },
  'molecules-mppageheader--with-back-link': {
    id: 'components-appbreadcrumb--with-basic-breadcrumbs',
    parts: {},
  },
  'foundations-tooltips--placements': {
    id: 'components-apptooltip--default',
    hover: 'button:has-text("Hover me")',
    parts: { tooltip: '.v-tooltip > .v-overlay__content' },
  },
  'patterns-data-table--default': {
    id: 'components-appdatatable--marobase',
    parts: {
      card: '.app-data-table-layout--marobase',
      'toolbar row': '.app-data-table-layout__toolbar',
      'search field': '.app-data-table-layout__search .v-field',
      'header cell': '.v-table thead th:not(.v-data-table-column--no-padding)',
      'body cell': '.v-table tbody td:not(.v-data-table-column--no-padding)',
      footer: '.v-data-table-footer',
    },
  },
  'patterns-data-table--with-selection': {
    id: 'components-genericindexwrapper--bulk-actions-functionality',
    parts: {
      'bulk bar': '.app-data-table-bulk-actions',
      'bulk action': '.app-data-table-bulk-actions .v-btn--variant-text',
    },
  },
  'molecules-mprowactionsmenu--open-menu': {
    id: 'components-apptableactionmenu--default',
    open: 'button:has(.app-table-action-menu-icon__glyph)',
    parts: {
      trigger: 'button:has(.app-table-action-menu-icon__glyph)',
      panel: '.v-menu .v-list',
      item: '.v-menu .v-list-item',
      'item label': '.v-menu .v-list-item-title',
    },
  },
  'molecules-mpdatatabletoolbar--with-single-filter': {
    id: 'components-appfilterbutton--with-preselected-filters',
    parts: {
      'filter button': '.app-filter .v-btn--variant-outlined',
    },
  },
  'molecules-mpdialog--default': {
    id: 'components-appdialogwrapper--marobase-new-reservation',
    open: 'button:has-text("New reservation")',
    parts: dialogParts('app-dialog-wrapper'),
  },
  'molecules-mpconfirmdialog--default': {
    id: 'components-appconfirmationdialog--with-trigger-button',
    open: 'button:has-text("Open Confirmation Dialog")',
    // Their example is a delete and ours is neutral, so the primary button is left to the eye.
    parts: { ...dialogParts('app-confirmation-dialog'), 'primary button': '', message: '.app-confirmation-dialog__body' },
  },
  'molecules-mpformdrawer--filter-drawer': {
    id: 'components-appdrawerwrapper--default',
    open: 'button:has-text("Open Drawer")',
    parts: {
      drawer: 'nav.app-drawer-wrapper',
      header: '.app-drawer-wrapper__header',
      title: '.app-drawer-wrapper__title',
      subtitle: '.app-drawer-wrapper__subtitle',
      body: '.app-drawer-wrapper__body',
      footer: '.app-drawer-wrapper__footer',
      'primary button': '.app-drawer-wrapper__footer .v-btn:last-of-type',
      scrim: '.v-navigation-drawer__scrim',
    },
  },
  'molecules-mpconfirmdialog--danger': {
    id: 'components-alertmodal--default',
    parts: {},
  },
  'molecules-mptoaststack--success': snackbar,
  'atoms-mpwizardsteps--four-steps-mid-progress': {
    id: 'components-appstepper--with-completed-steps',
    parts: {
      'active step': '.v-stepper-item--selected .v-stepper-item__title',
      'active marker': '.v-stepper-item--selected .v-stepper-item__avatar',
      'upcoming step': '.v-stepper-item:not(.v-stepper-item--selected):not(.v-stepper-item--complete) .v-stepper-item__title',
      'upcoming marker': '.v-stepper-item:not(.v-stepper-item--selected):not(.v-stepper-item--complete) .v-stepper-item__avatar',
      'done step': '.v-stepper-item--complete .v-stepper-item__title',
      'done marker': '.v-stepper-item--complete .v-stepper-item__avatar',
    },
  },
  'molecules-mpdaterangeselect--menu-open': {
    id: 'components-appdatepicker--default',
    parts: {},
  },
  'patterns-form-fields--selected-with-checkmark': {
    id: 'components-appdropdown--interactive-single',
    open: '.app-dropdown .v-field',
    parts: {
      field: '.app-dropdown .v-field',
      label: '.app-dropdown .v-field-label--floating',
      'menu panel': '.app-dropdown-auto-complete > .v-sheet',
      option: '.app-dropdown-auto-complete .v-list-item:not(.v-list-item--active)',
      'selected option': '.app-dropdown-auto-complete .v-list-item--active',
    },
  },
  'molecules-mpbanner--default': {
    id: 'components-theonboardingbanner--default',
    parts: {},
  },
  'atoms-mplistrow--checklist': {
    id: 'components-theonboardingscreenchecklists--mixed-status',
    parts: {},
  },
}

/** Components with no reference: the LiquidSky story shown on its own, so the gap is visible. */
export const QA_BUILD_ONLY: Record<string, string> = {
  'expandable-list': 'components-appexpandablelist--default',
  'tree-dropdown': 'components-apptreedropdown--single-select',
  'grid-table': 'components-appgridtable--basic',
}
