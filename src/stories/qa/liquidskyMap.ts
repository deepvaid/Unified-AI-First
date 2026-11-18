/**
 * LiquidSky ↔ Marobase component map, and the spec contract for each pair.
 *
 * LiquidSky (`@maropost-ui/liquidsky-ui`, `App*` names) implements this design system for
 * production. There is no Figma file, so this file is the reference: which `Mp*` story stands for
 * each LiquidSky component, and which parts and CSS properties are checked.
 *
 * `scripts/qa-export.mjs` reads it, measures every part in the built Storybook and writes
 * `public/qa-reference/`. `scripts/qa-compare.mjs` then measures the LiquidSky build against
 * those values. `QaReference.stories.ts` renders the same data.
 *
 * It is also the name bridge for LiquidSky developers: the "For LiquidSky developers" page
 * (`src/stories/LiquidSky.mdx`) lists every entry, and `liquidskyDocs()` in `storyTemplate.ts`
 * prints the LiquidSky names on each reference component's docs page. A story with `parts: []`
 * is a link and a screenshot only, nothing is measured on it. An entry with `liquidsky: []` is a
 * reference that no LiquidSky component uses yet.
 *
 * Pure data, no imports — Node loads this file directly with type stripping.
 */

export type QaStatus = 'matched' | 'partial' | 'no-reference'

export interface QaPart {
  /** Part name — the key liquidskyPairs.ts maps to the same part in the LiquidSky build. */
  part: string
  /** Playwright selector inside the reference story; the first match is measured. */
  selector: string
  /** Pointer state applied before measuring. */
  state?: 'hover' | 'focus'
  /** Element that receives the state when it is not the measured one (Vuetify paints hover on an overlay child). */
  stateTarget?: string
  /** Computed CSS properties that make up the contract for this part. */
  props: string[]
  /** CSS property → design token (dotted path in tokens.json) that owns the value. */
  tokens?: Record<string, string>
}

export interface QaStory {
  /** Storybook story id in this repo. */
  id: string
  label: string
  parts: QaPart[]
}

export interface QaComponent {
  /** File name of the exported spec. */
  key: string
  /** LiquidSky component names covered by this entry. */
  liquidsky: string[]
  status: QaStatus
  /** The Marobase reference, in words. */
  reference: string
  /** Why the status is not `matched`, or anything a reviewer must know. */
  note?: string
  /**
   * Parts of the reference that LiquidSky is not asked to build in this phase, each with what is
   * fine in its place. Scope agreed with the LiquidSky team, so a design review does not raise them.
   */
  notRequired?: string[]
  stories: QaStory[]
}

const TEXT = ['font-size', 'font-weight', 'line-height', 'color']
const SURFACE = ['background-color', 'border-radius']

/** `notRequired` line shared by the field entries. */
const LABEL_ABOVE_FIELD = 'The label above the field. A floating label inside the field is fine.'
/** `reference` of an interim entry: nothing is designed for it, its stories are the parts to build from. */
const NO_DEDICATED_DESIGN = 'No dedicated design yet. Build from these parts'

const dialogShell = (root: string): QaPart[] => [
  { part: 'card', selector: `${root} .v-card`, props: ['width', ...SURFACE], tokens: { 'border-radius': 'component.dialog.radius' } },
  { part: 'header', selector: '.mp-dialog__header', props: ['padding', 'min-height'], tokens: { padding: 'component.dialog.padding', 'min-height': 'component.dialog.headerMinHeight' } },
  { part: 'title', selector: '.mp-dialog__title', props: TEXT },
  { part: 'body', selector: '.mp-dialog__body', props: ['padding', 'row-gap', 'color', 'font-size'], tokens: { 'row-gap': 'component.dialog.gap' } },
  { part: 'footer', selector: '.mp-dialog__footer', props: ['padding', 'column-gap'], tokens: { padding: 'component.dialog.padding', 'column-gap': 'component.dialog.footerGap' } },
  { part: 'secondary button', selector: '.mp-dialog__footer .v-btn--variant-text', props: ['height', 'border-radius', 'color', 'font-size', 'font-weight'], tokens: { height: 'component.control.height' } },
  { part: 'primary button', selector: '.mp-dialog__footer .v-btn--variant-flat', props: ['height', 'border-radius', 'background-color', 'color', 'font-size', 'font-weight'], tokens: { height: 'component.control.height' } },
  { part: 'close button', selector: '.mp-dialog__header-actions .v-btn', props: ['width', 'height', 'color'] },
]

const toastParts: QaPart[] = [
  { part: 'toast', selector: '.mp-toast .v-card', props: ['padding', 'min-height', 'border-top-color', 'box-shadow', ...SURFACE] },
  { part: 'icon', selector: '.mp-toast__icon', props: ['width', 'height', 'color'] },
  { part: 'message', selector: '.mp-toast__message', props: TEXT },
]

export const QA_COMPONENTS: QaComponent[] = [
  {
    key: 'unified-navigation',
    liquidsky: ['TheUnifiedNavigation', 'TheAppSidebar', 'MarobaseSidebar'],
    status: 'matched',
    reference: 'AppSidebar (Patterns › App Shell)',
    stories: [
      {
        id: 'patterns-app-shell-appsidebar--expanded',
        label: 'Expanded',
        parts: [
          { part: 'rail', selector: 'nav.mp-sidebar', props: ['width', 'background-color'], tokens: { width: 'layout.sidebarWidth' } },
          { part: 'item', selector: '.mp-sidebar .v-list-item:not(.v-list-item--active)', props: ['min-height', 'padding', 'border-radius', 'color'], tokens: { 'min-height': 'component.listItem.minHeight', 'border-radius': 'component.nav.itemRadius' } },
          { part: 'item label', selector: '.mp-sidebar .v-list-item:not(.v-list-item--active) .v-list-item-title', props: TEXT },
          { part: 'item (hover)', selector: '.mp-sidebar .v-list-item:not(.v-list-item--active)', state: 'hover', props: ['background-color', 'color'] },
          { part: 'active item', selector: '.mp-sidebar .v-list-item--active', props: ['background-color', 'color', 'border-radius'] },
          { part: 'active item label', selector: '.mp-sidebar .v-list-item--active .v-list-item-title', props: TEXT },
        ],
      },
      {
        id: 'patterns-app-shell-appsidebar--collapsed-rail',
        label: 'Collapsed rail',
        parts: [
          { part: 'rail', selector: 'nav.mp-sidebar', props: ['width', 'background-color'], tokens: { width: 'layout.sidebarRailWidth' } },
        ],
      },
    ],
  },
  {
    key: 'header',
    liquidsky: ['TheHeader', 'TheUserDropdown'],
    status: 'matched',
    reference: 'AppBar (Patterns › App Shell), MpNotificationsMenu',
    note: 'The bar and its controls are covered. The profile and create menus open from a click, so they are checked by eye in the AppBar stories.',
    stories: [
      {
        id: 'patterns-app-shell-appbar--default',
        label: 'Default',
        parts: [
          { part: 'bar', selector: 'header.v-toolbar', props: ['height', 'background-color'] },
          { part: 'search field', selector: '.mp-appbar-shell .v-field', props: ['height', 'border-radius', 'background-color'] },
          { part: 'icon button', selector: '.mp-appbar-shell .v-btn--icon', props: ['width', 'height', 'border-radius', 'color'] },
          { part: 'icon button (hover)', selector: '.mp-appbar-shell .v-btn--icon', state: 'hover', props: ['background-color', 'color'] },
        ],
      },
    ],
  },
  {
    key: 'page-title',
    liquidsky: ['AppPageTitle'],
    status: 'matched',
    reference: 'MpPageHeader',
    stories: [
      {
        id: 'molecules-mppageheader--default',
        label: 'Title + subtitle',
        parts: [
          { part: 'title', selector: '.mp-page-header__title', props: [...TEXT, 'letter-spacing'] },
          { part: 'subtitle', selector: '.mp-page-header__subtitle', props: [...TEXT, 'margin-top'] },
        ],
      },
      {
        id: 'molecules-mppageheader--with-back-link',
        label: 'Detail page with back link',
        parts: [
          { part: 'back link', selector: '.mp-page-header__back', props: [...TEXT, 'column-gap'] },
          { part: 'title', selector: '.mp-page-header__title', props: TEXT },
        ],
      },
    ],
  },
  {
    key: 'breadcrumb',
    liquidsky: ['AppBreadcrumb'],
    status: 'matched',
    reference: 'The `eyebrow` of MpPageHeader',
    note: 'The trail is one line of text above the title: the levels joined by a middle dot, uppercase and muted. It is text, not links; a detail page has the back link (`backTo`) for going up a level.',
    stories: [
      {
        id: 'molecules-mppageheader--with-eyebrow',
        label: 'Eyebrow above the title',
        parts: [
          { part: 'eyebrow', selector: '.mp-page-header__eyebrow', props: [...TEXT, 'letter-spacing', 'text-transform', 'margin-bottom'], tokens: { 'font-size': 'text.metaLabel.fontSize', 'font-weight': 'text.metaLabel.fontWeight', 'margin-bottom': 'space.4' } },
        ],
      },
    ],
  },
  {
    key: 'tooltip',
    liquidsky: ['AppTooltip', 'MpVTooltip'],
    status: 'matched',
    reference: 'v-tooltip on the global baseline (Foundations › Tooltips)',
    stories: [
      {
        id: 'foundations-tooltips--placements',
        label: 'Placements',
        parts: [
          { part: 'tooltip', selector: '.v-tooltip > .v-overlay__content', props: ['padding', 'max-width', ...SURFACE, ...TEXT] },
        ],
      },
    ],
  },
  {
    key: 'data-table',
    liquidsky: ['AppDataTable', 'MpVDataTable', 'MpVDataTableServer', 'MpVDataTableVirtual', 'MpVPagination'],
    status: 'matched',
    reference: 'Data Table pattern: MpFilterTabs + MpDataTableToolbar + v-data-table + MpFloatingBulkBar',
    note: 'Cell content (chips, switches) follows its own component; this contract covers the table frame only.',
    notRequired: [
      'Skeleton loading. A loading indicator is fine.',
      'The empty state with an icon, a title and an action. A one-line empty message is fine.',
    ],
    stories: [
      {
        id: 'patterns-data-table--default',
        label: 'Default',
        parts: [
          { part: 'card', selector: '.mp-story-canvas .v-card', props: ['border-radius', 'border-top-color', 'border-top-width', 'box-shadow', 'background-color'], tokens: { 'border-radius': 'component.card.radius' } },
          { part: 'toolbar row', selector: '.mp-toolbar-row', props: ['min-height', 'padding', 'column-gap'], tokens: { 'min-height': 'component.toolbar.minHeight' } },
          { part: 'search field', selector: '.mp-toolbar-search .v-field', props: ['height', 'border-radius'], tokens: { height: 'component.control.height' } },
          { part: 'header cell', selector: '.v-table thead th:not(.v-data-table-column--no-padding)', props: ['padding-top', 'padding-left', 'background-color', ...TEXT], tokens: { 'padding-top': 'component.table.headerPaddingBlock', 'padding-left': 'component.table.cellPaddingInline' } },
          { part: 'body cell', selector: '.v-table tbody td:not(.v-data-table-column--no-padding)', props: ['padding-top', 'padding-left', 'border-bottom-color', ...TEXT], tokens: { 'padding-top': 'component.table.cellPaddingBlock', 'padding-left': 'component.table.cellPaddingInline' } },
          { part: 'body cell (row hover)', selector: '.v-table tbody td:not(.v-data-table-column--no-padding)', state: 'hover', props: ['background-color'] },
          { part: 'footer', selector: '.v-data-table-footer', props: ['padding', ...TEXT] },
        ],
      },
      {
        id: 'patterns-data-table--with-selection',
        label: 'Rows selected (bulk bar)',
        parts: [
          { part: 'bulk bar', selector: '.mp-floating-bulk-bar', props: ['min-height', 'padding', 'column-gap', 'box-shadow', 'color', ...SURFACE] },
          { part: 'bulk count', selector: '.mp-fbb__count', props: TEXT },
          { part: 'bulk action', selector: '.mp-floating-bulk-bar .v-btn--variant-text:not(.mp-fbb__muted-btn)', props: ['height', 'color', 'font-size', 'font-weight'] },
        ],
      },
      { id: 'patterns-data-table--empty', label: 'Empty', parts: [] },
      { id: 'patterns-data-table--loading', label: 'Loading', parts: [] },
      {
        id: 'patterns-data-table--with-folders',
        label: 'With folders',
        parts: [
          { part: 'folder select', selector: '.mp-folder-select__activator', props: ['height', 'border-radius', 'font-size', 'font-weight', 'color'], tokens: { height: 'component.control.height' } },
        ],
      },
    ],
  },
  {
    key: 'table-actions',
    liquidsky: ['AppTableActionMenu', 'AppFilterButton', 'MpVMenu', 'MpVList', 'MpVListItem'],
    status: 'matched',
    reference: 'MpRowActionsMenu + MpMenuItem; the Filter button of MpDataTableToolbar',
    stories: [
      {
        id: 'molecules-mprowactionsmenu--open-menu',
        label: 'Row actions menu open',
        parts: [
          { part: 'trigger', selector: '.mp-story-canvas .v-btn--icon', props: ['width', 'height', 'border-radius', 'color'] },
          { part: 'panel', selector: '.mp-row-actions__list', props: ['min-width', 'padding', 'box-shadow', ...SURFACE], tokens: { 'min-width': 'component.menu.minWidth', 'border-radius': 'component.menu.radius' } },
          { part: 'item', selector: '.mp-row-actions__list .v-list-item', props: ['min-height', 'padding', 'border-radius', 'color'], tokens: { 'min-height': 'component.menu.itemHeight' } },
          { part: 'item label', selector: '.mp-row-actions__list .v-list-item-title', props: TEXT },
        ],
      },
      {
        id: 'molecules-mpdatatabletoolbar--with-single-filter',
        label: 'Toolbar with Filter button',
        parts: [
          { part: 'filter button', selector: '.mp-toolbar-controls .v-btn--variant-outlined', props: ['height', 'padding', 'border-radius', 'border-top-color', 'color', 'font-size', 'font-weight'], tokens: { height: 'component.control.height' } },
          { part: 'filter button (hover)', selector: '.mp-toolbar-controls .v-btn--variant-outlined', state: 'hover', props: ['background-color', 'border-top-color'] },
        ],
      },
    ],
  },
  {
    key: 'overflow-cell',
    liquidsky: ['AppExpandableList'],
    status: 'matched',
    reference: 'The overflow cell of the Data Table pattern: the first value, then "+N more" that shows the rest',
    stories: [
      {
        id: 'patterns-data-table--overflow-cell',
        label: 'Overflow cell',
        parts: [
          { part: 'first value', selector: '.v-table tbody .v-chip.v-chip--variant-tonal.v-chip--size-x-small', props: ['height', 'border-radius', 'padding-left', ...TEXT] },
          { part: '+N more trigger', selector: '.v-table tbody .v-chip.v-chip--variant-text.v-chip--size-x-small', props: ['height', ...TEXT] },
        ],
      },
      { id: 'patterns-data-table--overflow-cell-open', label: 'Overflow cell, list shown', parts: [] },
    ],
  },
  {
    key: 'dialogs',
    liquidsky: ['AppDialogWrapper', 'AppConfirmationDialog', 'AppDrawerWrapper', 'MpVDialog', 'MpVNavigationDrawer'],
    status: 'matched',
    reference: 'MpDialog, MpConfirmDialog, MpFormDrawer',
    stories: [
      { id: 'molecules-mpdialog--default', label: 'Dialog', parts: dialogShell('.mp-dialog') },
      {
        id: 'molecules-mpconfirmdialog--default',
        label: 'Confirm dialog',
        parts: [
          ...dialogShell('.mp-dialog'),
          { part: 'message', selector: '.mp-confirm__message', props: TEXT },
        ],
      },
      {
        id: 'molecules-mpformdrawer--filter-drawer',
        label: 'Drawer',
        parts: [
          { part: 'drawer', selector: 'nav.v-navigation-drawer', props: ['width', 'background-color'], tokens: { width: 'component.drawer.width.md' } },
          { part: 'header', selector: '.mp-form-drawer__header', props: ['padding', 'min-height'], tokens: { padding: 'component.dialog.padding' } },
          { part: 'title', selector: '.mp-form-drawer__title', props: TEXT },
          { part: 'subtitle', selector: '.mp-form-drawer__subtitle', props: TEXT },
          { part: 'body', selector: '.mp-form-drawer__body', props: ['padding', 'row-gap'], tokens: { 'row-gap': 'component.dialog.gap' } },
          { part: 'footer', selector: '.mp-form-drawer__footer', props: ['padding', 'column-gap', 'border-top-color'], tokens: { padding: 'component.dialog.padding' } },
          { part: 'primary button', selector: '.mp-form-drawer__footer .v-btn--variant-flat', props: ['height', 'border-radius', 'background-color', 'color'], tokens: { height: 'component.control.height' } },
          { part: 'scrim', selector: '.v-navigation-drawer__scrim', props: ['background-color', 'opacity'] },
        ],
      },
    ],
  },
  {
    key: 'alert-modal',
    liquidsky: ['AlertModal'],
    status: 'partial',
    reference: 'MpConfirmDialog with `danger` (shell only)',
    note: 'AlertModal is a corner notice with a call to action, not a confirm prompt. Marobase has no such surface; only the card, type and button styling of the dialog shell carry over.',
    stories: [
      {
        id: 'molecules-mpconfirmdialog--danger',
        label: 'Destructive confirm',
        parts: [
          ...dialogShell('.mp-dialog'),
          { part: 'lead icon', selector: '.mp-dialog__lead', props: ['width', 'height', 'color', ...SURFACE] },
          { part: 'message', selector: '.mp-confirm__message', props: TEXT },
        ],
      },
      { id: 'molecules-mpconfirmdialog--with-consequences', label: 'With consequences list', parts: [] },
    ],
  },
  {
    key: 'snackbar',
    liquidsky: ['AppSnackbar', 'MpVSnackbar'],
    status: 'matched',
    reference: 'MpToastStack (driven by useToast)',
    stories: [
      { id: 'molecules-mptoaststack--success', label: 'Success', parts: toastParts },
      { id: 'molecules-mptoaststack--persistent-error', label: 'Error', parts: toastParts },
      { id: 'molecules-mptoaststack--warning', label: 'Warning', parts: toastParts },
      { id: 'molecules-mptoaststack--info', label: 'Info', parts: toastParts },
      { id: 'molecules-mptoaststack--with-action', label: 'With action', parts: [] },
    ],
  },
  {
    key: 'stepper',
    liquidsky: ['AppStepper', 'MpVStepper'],
    status: 'matched',
    reference: 'MpWizardSteps',
    stories: [
      {
        id: 'atoms-mpwizardsteps--four-steps-mid-progress',
        label: 'Four steps, mid progress',
        parts: [
          { part: 'done step', selector: '.mp-wizard-step--done', props: ['column-gap', ...TEXT] },
          { part: 'done marker', selector: '.mp-wizard-step--done .mp-wizard-step__num', props: ['width', 'height', 'color', ...SURFACE] },
          { part: 'active step', selector: '.mp-wizard-step--active', props: TEXT },
          { part: 'active marker', selector: '.mp-wizard-step--active .mp-wizard-step__num', props: ['width', 'height', 'color', ...SURFACE] },
          { part: 'upcoming step', selector: '.mp-wizard-step:not(.mp-wizard-step--done):not(.mp-wizard-step--active)', props: TEXT },
          { part: 'upcoming marker', selector: '.mp-wizard-step:not(.mp-wizard-step--done):not(.mp-wizard-step--active) .mp-wizard-step__num', props: ['width', 'height', 'color', ...SURFACE] },
          { part: 'connector', selector: '.mp-wizard-step__rail', props: ['width', 'height', 'background-color'] },
        ],
      },
    ],
  },
  {
    key: 'date-picker',
    liquidsky: ['AppDatePicker', 'MpVDatePicker'],
    status: 'matched',
    reference: 'The single-date field (Patterns › Form Fields): a field that opens a calendar and takes one date',
    stories: [
      {
        id: 'patterns-form-fields--date-field',
        label: 'Date field',
        parts: [
          { part: 'field', selector: '.mp-story-canvas .v-field', props: ['height', 'border-radius', 'background-color'], tokens: { height: 'component.field.height.md', 'border-radius': 'component.input.radius' } },
          { part: 'label', selector: '.mp-story-canvas .v-field-label--floating', props: TEXT },
          { part: 'value', selector: '.mp-story-canvas .v-field__input', props: TEXT },
          { part: 'calendar icon', selector: '.mp-story-canvas .v-field__append-inner .v-icon', props: ['width', 'height', 'color'] },
        ],
      },
      {
        id: 'patterns-form-fields--date-field-open',
        label: 'Calendar open',
        parts: [
          { part: 'calendar panel', selector: '.v-menu > .v-overlay__content > .v-date-picker', props: ['border-radius', 'background-color', 'box-shadow'] },
          { part: 'weekday', selector: '.v-date-picker-month__weekday', props: TEXT },
          { part: 'day', selector: '.v-date-picker-month__day-btn', props: ['width', 'height', ...TEXT] },
          { part: 'selected day', selector: '.v-date-picker-month__day--selected .v-date-picker-month__day-btn', props: ['background-color', 'color', 'border-radius'] },
        ],
      },
    ],
  },
  {
    key: 'date-range',
    liquidsky: [],
    status: 'matched',
    reference: 'MpDateRangeSelect',
    note: 'Not a LiquidSky component today. This is the design for picking a date range (presets and custom range fields), as used on reports and dashboards. One date is the date-picker entry.',
    stories: [
      {
        id: 'molecules-mpdaterangeselect--menu-open',
        label: 'Preset menu open',
        parts: [
          { part: 'trigger', selector: '.mp-range-trigger', props: ['height', 'padding', 'border-radius', 'border-top-color', 'background-color', ...TEXT], tokens: { height: 'component.control.height' } },
          { part: 'panel', selector: '.v-menu > .v-overlay__content .v-card', props: ['min-width', 'padding', 'box-shadow', ...SURFACE] },
          { part: 'option', selector: '.v-menu .v-list-item:not(.v-list-item--active)', props: ['min-height', 'padding', 'border-radius', 'color'] },
          { part: 'active option', selector: '.v-menu .v-list-item--active', props: ['background-color', 'color'] },
        ],
      },
      { id: 'molecules-mpdaterangeselect--custom-panel-open', label: 'Custom range open', parts: [] },
    ],
  },
  {
    key: 'dropdown',
    liquidsky: ['AppDropdown', 'MpVSelect', 'MpVAutocomplete', 'MpVCombobox'],
    status: 'matched',
    reference: 'v-select / v-autocomplete on the form-field baseline (Patterns › Form Fields)',
    notRequired: [LABEL_ABOVE_FIELD],
    stories: [
      {
        id: 'patterns-form-fields--selected-with-checkmark',
        label: 'Select, menu open',
        parts: [
          { part: 'field', selector: '.mp-story-canvas .v-field', props: ['height', 'border-radius', 'background-color'], tokens: { height: 'component.field.height.md', 'border-radius': 'component.input.radius' } },
          { part: 'label', selector: '.mp-story-canvas .v-field-label--floating', props: TEXT },
          { part: 'menu panel', selector: '.v-select__content > .v-sheet', props: ['border-radius', 'box-shadow', 'background-color'], tokens: { 'border-radius': 'component.menu.radius' } },
          { part: 'option', selector: '.v-menu .v-list-item:not(.v-list-item--active)', props: ['min-height', 'padding', 'border-radius', 'color'], tokens: { 'min-height': 'component.menu.itemHeight' } },
          { part: 'option label', selector: '.v-menu .v-list-item:not(.v-list-item--active) .v-list-item-title', props: TEXT },
          { part: 'selected option', selector: '.v-menu .v-list-item--active', props: ['background-color', 'color'] },
        ],
      },
      { id: 'patterns-form-fields--all-states', label: 'Field states', parts: [] },
    ],
  },
  {
    key: 'onboarding-banner',
    liquidsky: ['TheOnboardingBanner'],
    status: 'matched',
    reference: 'OnboardingProgressBanner (Product › Onboarding)',
    note: 'The progress card that opens Get started. On a task page it takes the task as its title, puts the count on its own line and ends in a link back to the list.',
    stories: [
      {
        id: 'product-onboarding-onboardingprogressbanner--default',
        label: 'On Get started',
        parts: [
          { part: 'card', selector: '.onboarding-banner', props: ['padding', 'column-gap', 'border-top-color', 'border-top-width', ...SURFACE], tokens: { padding: 'component.card.padding', 'column-gap': 'space.20', 'border-radius': 'component.card.radius' } },
          { part: 'ring', selector: '.onboarding-banner__ring', props: ['width', 'height', 'color'] },
          { part: 'title', selector: '.onboarding-banner__title', props: TEXT },
          { part: 'caption', selector: '.onboarding-banner__caption', props: TEXT },
          { part: 'bar', selector: '.onboarding-banner__bar', props: ['height', 'border-radius', 'color'] },
        ],
      },
      {
        id: 'product-onboarding-onboardingprogressbanner--on-task-page',
        label: 'On a task page',
        parts: [
          { part: 'count', selector: '.onboarding-banner__count', props: TEXT },
          { part: 'action', selector: '.onboarding-banner__action', props: [...TEXT, 'column-gap'] },
        ],
      },
    ],
  },
  {
    key: 'onboarding-checklists',
    liquidsky: ['TheOnboardingScreenChecklists'],
    status: 'matched',
    reference: 'The Get started page (Product › Onboarding)',
    note: 'The card at the top of the page is the onboarding-banner entry.',
    stories: [
      {
        id: 'product-onboarding-get-started--default',
        label: 'Get started',
        parts: [
          { part: 'group title', selector: '.gs-phase-title', props: TEXT },
          { part: 'task group card', selector: '.gs-page section .v-card', props: ['border-radius', 'border-top-color', 'border-top-width', 'box-shadow', 'background-color'], tokens: { 'border-radius': 'component.card.radius' } },
          { part: 'task row', selector: '.gs-step__row', props: ['padding', 'column-gap'] },
          { part: 'task row divider', selector: '.gs-step', props: ['border-bottom-color'] },
          { part: 'done check', selector: '.gs-step--done .gs-step__check .v-icon', props: ['width', 'height', 'color'] },
          { part: 'done title', selector: '.gs-step--done .gs-step__title', props: TEXT },
          { part: 'to-do check', selector: '.gs-step--todo .gs-step__check .v-icon', props: ['width', 'height', 'color'] },
          { part: 'to-do title', selector: '.gs-step--todo .gs-step__title', props: TEXT },
          { part: 'time chip', selector: '.gs-step--todo .v-chip', props: ['height', 'padding', 'border-radius', ...TEXT] },
        ],
      },
      { id: 'product-onboarding-get-started--task-open', label: 'A task open', parts: [] },
    ],
  },
  {
    key: 'buttons',
    liquidsky: ['AppButton', 'MpVBtn'],
    status: 'matched',
    reference: 'v-btn on the global baseline (Foundations › Buttons)',
    stories: [
      { id: 'foundations-buttons--variants', label: 'Variants', parts: [] },
      { id: 'foundations-buttons--sizes', label: 'Sizes', parts: [] },
      { id: 'foundations-buttons--interaction-states', label: 'Interaction states', parts: [] },
    ],
  },
  {
    key: 'segmented-control',
    liquidsky: ['MpVBtnToggle'],
    status: 'matched',
    reference: 'MpSegmentedControl',
    stories: [
      { id: 'atoms-mpsegmentedcontrol--default', label: 'Default', parts: [] },
      { id: 'atoms-mpsegmentedcontrol--sizes', label: 'Sizes', parts: [] },
    ],
  },
  {
    key: 'text-fields',
    liquidsky: ['MpVTextField', 'MpVTextarea', 'MpVMaskInput', 'MpVFileInput', 'MpVDateInput', 'AppNumberInput', 'MpVForm'],
    status: 'matched',
    reference: 'Vuetify fields on the form-field baseline (Patterns › Form Fields)',
    note: 'One label style (static top label), one size ramp (32 / 40 / 48 from the density prop). A number input is a text field with a suffix.',
    notRequired: [LABEL_ABOVE_FIELD],
    stories: [
      { id: 'patterns-form-fields--all-states', label: 'Field states', parts: [] },
      { id: 'patterns-form-fields--sizes', label: 'Sizes', parts: [] },
      { id: 'patterns-form-fields--prefix-suffix', label: 'Prefix and suffix', parts: [] },
      { id: 'patterns-form-fields--form-layout', label: 'Form layout', parts: [] },
    ],
  },
  {
    key: 'selection-controls',
    liquidsky: ['MpVCheckbox', 'MpVCheckboxBtn', 'MpVRadio', 'MpVRadioGroup', 'MpVSwitch'],
    status: 'partial',
    reference: 'Vuetify selection controls on the theme defaults; MpFormField labels a group',
    note: 'There is no dedicated story for checkbox, radio or switch yet. A radio group with its label is shown in MpFormField.',
    stories: [
      { id: 'molecules-mpformfield--default', label: 'Radio group with label', parts: [] },
    ],
  },
  {
    key: 'tabs',
    liquidsky: ['MpVTabs', 'MpVTab'],
    status: 'matched',
    reference: 'MpFilterTabs',
    stories: [
      { id: 'atoms-mpfiltertabs--default', label: 'Default', parts: [] },
      { id: 'atoms-mpfiltertabs--states', label: 'States', parts: [] },
    ],
  },
  {
    key: 'status-chip',
    liquidsky: ['MpVStatusChip', 'MpVChip'],
    status: 'matched',
    reference: 'MpStatusChip',
    stories: [
      { id: 'atoms-mpstatuschip--variants', label: 'Variants', parts: [] },
      { id: 'atoms-mpstatuschip--sizes', label: 'Sizes', parts: [] },
      { id: 'atoms-mpstatuschip--all-types', label: 'All status types', parts: [] },
    ],
  },
  {
    key: 'alert',
    liquidsky: ['MpVAlert'],
    status: 'matched',
    reference: 'MpAlert',
    stories: [
      { id: 'molecules-mpalert--variants', label: 'Tones', parts: [] },
      { id: 'molecules-mpalert--states', label: 'States', parts: [] },
    ],
  },
  {
    key: 'search-bar',
    liquidsky: ['TheSearchBar'],
    status: 'partial',
    reference: 'The search in AppBar (Patterns › App Shell)',
    note: 'In Marobase the search field opens a command palette with grouped results. The field in the bar is covered by the header entry.',
    stories: [
      { id: 'patterns-app-shell-appbar--search-open', label: 'Search open', parts: [] },
      { id: 'patterns-app-shell-appbar--search-open-with-type-tabs', label: 'Search with type tabs', parts: [] },
    ],
  },
  {
    key: 'user-menu',
    liquidsky: ['TheAccountDropdown', 'TheThemeSwitcher'],
    status: 'matched',
    reference: 'The profile menu in AppBar (Patterns › App Shell)',
    note: 'As in LiquidSky, switching account and the light / dark theme both live in the profile menu.',
    stories: [
      { id: 'patterns-app-shell-appbar--profile-menu-open', label: 'Profile menu open', parts: [] },
    ],
  },
  {
    key: 'notifications',
    liquidsky: ['MpNotificationsMenu', 'TheNotificationIcon', 'TheNotificationDrawer'],
    status: 'partial',
    reference: 'MpNotificationsMenu',
    note: 'The bell opens a menu panel in Marobase, not a side drawer. The bell, badge and rows carry over to TheNotificationDrawer; the drawer frame follows MpFormDrawer.',
    stories: [
      { id: 'molecules-mpnotificationsmenu--open-panel', label: 'Panel open', parts: [] },
      { id: 'molecules-mpnotificationsmenu--empty', label: 'Nothing new', parts: [] },
    ],
  },
  {
    key: 'section-rail',
    liquidsky: ['MpSectionRail', 'StoreSectionRail', 'TheSecondaryNavigation'],
    status: 'matched',
    reference: 'MpSectionRail',
    stories: [
      { id: 'molecules-mpsectionrail--settings-flavor', label: 'Settings', parts: [] },
      { id: 'molecules-mpsectionrail--store-editor', label: 'Store editor', parts: [] },
    ],
  },
  {
    key: 'app-shell',
    liquidsky: ['TheAppShell', 'TheNavigation'],
    status: 'matched',
    reference: 'AppBar + AppSidebar together (Patterns › App Shell)',
    stories: [
      { id: 'patterns-app-shell-appsidebar--in-context-app-shell', label: 'Sidebar in the shell', parts: [] },
      { id: 'patterns-app-shell-appbar--in-context-app-shell', label: 'App bar in the shell', parts: [] },
    ],
  },
  {
    key: 'index-page',
    liquidsky: ['GenericIndexWrapper', 'GenericIndexPage'],
    status: 'matched',
    reference: 'Data Table pattern + MpFolderSelect, MpManageFoldersDrawer, MpMoveToFolderDialog',
    note: 'The page frame is MpPageHeader above the Data Table pattern. Folders are a menu in the toolbar, managed in a drawer.',
    stories: [
      { id: 'patterns-data-table--default', label: 'List page', parts: [] },
      { id: 'molecules-mpfolderselect--open-menu', label: 'Folder menu', parts: [] },
      { id: 'molecules-mpmanagefoldersdrawer--campaigns', label: 'Manage folders', parts: [] },
      { id: 'molecules-mpmovetofolderdialog--default', label: 'Move to folder', parts: [] },
    ],
  },
  {
    key: 'apps-dropdown',
    liquidsky: ['TheAppsDropdown'],
    status: 'no-reference',
    reference: 'None',
    note: 'Marobase has no product switcher in the bar; the clouds are sections of one sidebar. Needs a design decision if LiquidSky keeps it.',
    stories: [],
  },
  {
    key: 'timezone',
    liquidsky: ['TheTimezone'],
    status: 'no-reference',
    reference: 'None',
    note: 'Marobase shows no live clock in the bar. Needs a design decision if LiquidSky keeps it.',
    stories: [],
  },
  {
    key: 'split-button',
    liquidsky: ['AppSplitButton'],
    status: 'no-reference',
    reference: 'None',
    note: 'No split button in Marobase. The button follows Foundations › Buttons and the menu follows MpRowActionsMenu; the joined shape needs a design decision.',
    stories: [],
  },
  {
    key: 'folder-tree',
    liquidsky: ['ClassicFolderTree', 'SlVueTreeNext'],
    status: 'no-reference',
    reference: 'None',
    note: 'Marobase files items through a folder menu (MpFolderSelect), not a tree. These stay Classic-only unless a tree is designed.',
    stories: [],
  },
  {
    key: 'value-display',
    liquidsky: ['AppNumber', 'AppPriceDisplay', 'AppMultiCellValue', 'AppClipboard'],
    status: 'no-reference',
    reference: 'None',
    note: 'Formatting helpers with no design of their own: text follows the body or table-cell type around them.',
    stories: [],
  },
  {
    key: 'expandable-list',
    liquidsky: ['MpVExpansionPanels', 'MpVExpansionPanel'],
    status: 'no-reference',
    reference: 'None',
    note: 'Marobase has no expansion-panel component. Needs a design decision before it can be reviewed.',
    stories: [],
  },
  {
    key: 'tree-dropdown',
    liquidsky: ['AppTreeDropdown'],
    status: 'partial',
    reference: NO_DEDICATED_DESIGN,
    note: 'The closed field and the menu panel are the dropdown in Patterns › Form Fields. A tree row is a menu row at the menu density (`component.menu.itemHeight`, `component.menu.itemPaddingBlock`) with a checkbox from the selection controls. The expand arrow, the indent of a child level and the child count have no design yet.',
    stories: [
      { id: 'patterns-form-fields--selected-with-checkmark', label: 'Field and menu panel', parts: [] },
      { id: 'molecules-mpformfield--default', label: 'Selection control with its label', parts: [] },
      { id: 'molecules-mprowactionsmenu--open-menu', label: 'Menu row density', parts: [] },
    ],
  },
  {
    key: 'grid-table',
    liquidsky: ['AppGridTable'],
    status: 'partial',
    reference: NO_DEDICATED_DESIGN,
    note: 'The header and cell rhythm are the Data Table pattern (`component.table.*`). An editor inside a cell is a compact field (`component.field.height.sm`) with no visible label; name it with `aria-label`. Grid lines between columns and a pinned first column have no design yet.',
    stories: [
      { id: 'patterns-data-table--default', label: 'Header and cell rhythm', parts: [] },
      { id: 'patterns-form-fields--sizes', label: 'Compact field for a cell editor', parts: [] },
    ],
  },
]

/** Where the reference Storybook and the exported reference live. */
export const QA_LINKS = {
  marobaseStorybook: 'https://ai-first-maropost.vercel.app/storybook/',
  reference: 'https://ai-first-maropost.vercel.app/qa-reference/',
}
