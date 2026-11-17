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
 * is a link and a screenshot only, nothing is measured on it.
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
  stories: QaStory[]
}

const TEXT = ['font-size', 'font-weight', 'line-height', 'color']
const SURFACE = ['background-color', 'border-radius']

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
    liquidsky: ['AppPageTitle', 'AppBreadcrumb'],
    status: 'partial',
    reference: 'MpPageHeader',
    note: 'Marobase has no breadcrumb trail: a detail page shows one back link (`backTo`) above the title. AppBreadcrumb has no reference beyond that link.',
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
          { part: 'bulk action', selector: '.mp-floating-bulk-bar .v-btn--variant-text', props: ['height', 'color', 'font-size', 'font-weight'] },
        ],
      },
      { id: 'patterns-data-table--empty', label: 'Empty', parts: [] },
      { id: 'patterns-data-table--loading', label: 'Loading', parts: [] },
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
    status: 'partial',
    reference: 'MpDateRangeSelect',
    note: 'Marobase has a range selector (presets + custom range fields) but no calendar-grid date picker. The trigger and panel are covered; the calendar itself has no reference.',
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
    status: 'partial',
    reference: 'MpBanner (the full-width edge strip)',
    note: 'There is no onboarding-specific banner in Marobase. Only the strip geometry and tones carry over; the onboarding content needs a design.',
    stories: [
      {
        id: 'molecules-mpbanner--default',
        label: 'Banner',
        parts: [
          { part: 'strip', selector: '.mp-banner', props: ['min-height', 'padding', 'column-gap', 'border-bottom-color', 'color', ...SURFACE], tokens: { 'min-height': 'component.banner.minHeight' } },
        ],
      },
    ],
  },
  {
    key: 'onboarding-checklists',
    liquidsky: ['TheOnboardingScreenChecklists'],
    status: 'partial',
    reference: 'MpListRow, checklist rows',
    note: 'Only the row geometry has a reference. The onboarding screen layout around it needs a design.',
    stories: [
      {
        id: 'atoms-mplistrow--checklist',
        label: 'Checklist rows',
        parts: [
          { part: 'row', selector: '.mp-list-row', props: ['padding', 'column-gap'], tokens: { 'column-gap': 'component.listItem.gap' } },
          { part: 'row title', selector: '.mp-list-row__title', props: TEXT },
        ],
      },
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
    liquidsky: ['AppExpandableList', 'MpVExpansionPanels', 'MpVExpansionPanel'],
    status: 'no-reference',
    reference: 'None',
    note: 'Marobase has no expandable-list component. Needs a design decision before it can be reviewed.',
    stories: [],
  },
  {
    key: 'tree-dropdown',
    liquidsky: ['AppTreeDropdown'],
    status: 'no-reference',
    reference: 'None',
    note: 'Marobase has no tree dropdown. The closed field follows AppDropdown; the tree panel needs a design decision.',
    stories: [],
  },
  {
    key: 'grid-table',
    liquidsky: ['AppGridTable'],
    status: 'no-reference',
    reference: 'None',
    note: 'Marobase has no card-grid table. Needs a design decision before it can be reviewed.',
    stories: [],
  },
]

/** Where the reference Storybook and the exported reference live. */
export const QA_LINKS = {
  marobaseStorybook: 'https://ai-first-maropost.vercel.app/storybook/',
  reference: 'https://ai-first-maropost.vercel.app/qa-reference/',
}
