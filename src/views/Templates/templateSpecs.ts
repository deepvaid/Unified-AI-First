// The spec data behind /templates — one entry per page archetype.
//
// Everything the spec panel and the index render comes from here, so the rail,
// the gallery cards and the "where each archetype is used" table can never drift
// apart. The `usedBy` lists are curated by hand on purpose: deriving them at
// runtime would mean shipping a repo crawl to the browser, and a hand-picked
// half-dozen exemplars is more useful than eighty paths.

export type TemplateSlug =
  | 'list'
  | 'detail'
  | 'form-drawer'
  | 'landing'
  | 'wizard'
  | 'builder'
  | 'states'

/** One node of the component tree, rendered as a nested list in the spec panel. */
export interface SpecTreeNode {
  name: string
  note?: string
  children?: SpecTreeNode[]
}

/** "This token owns that gap" — the spacing callouts. */
export interface SpecSpacing {
  token: string
  owns: string
}

export interface SpecRule {
  kind: 'do' | 'dont'
  text: string
}

export interface SpecUsedBy {
  path: string
  note?: string
}

export interface TemplateSpec {
  slug: TemplateSlug
  routeName: string
  title: string
  summary: string
  /** Lucide icon name (kebab-case). */
  icon: string
  /** Path of the template file itself. */
  file: string
  /** The real page(s) this template was lifted from. */
  canonical: string[]
  usedBy: SpecUsedBy[]
  /** Total number of product views following this archetype, when usedBy is a sample. */
  usedByCount?: number
  tree: SpecTreeNode[]
  spacing: SpecSpacing[]
  rules: SpecRule[]
  /** Differences between the template and a real product route. */
  productNotes?: string[]
  /**
   * The template cannot be squeezed: its own fixed panes leave nothing to give,
   * so the spec aside hides itself below layout.specPanelYieldWidth instead.
   */
  needsRoom?: boolean
}

export const TEMPLATE_SPECS: TemplateSpec[] = [
  {
    slug: 'list',
    routeName: 'TemplateList',
    title: 'List page',
    summary: 'Filterable data table with search, quick filter, selection and every state.',
    icon: 'table',
    file: 'src/views/Templates/TemplateListPage.vue',
    canonical: ['src/views/Commerce/SalesOrders.vue', 'src/views/Settings/Users.vue'],
    usedByCount: 80,
    usedBy: [
      { path: 'src/views/Commerce/SalesOrders.vue', note: 'the full recipe — quick filter, expand, bulk' },
      { path: 'src/views/Contacts/AllContacts.vue' },
      { path: 'src/views/Marketing/EmailCampaigns.vue' },
      { path: 'src/views/Products/ProductsList.vue' },
      { path: 'src/views/Settings/Users.vue', note: 'the minimal case — search only, no filter drawer' },
      { path: 'src/views/Service/ChatbotList.vue' },
    ],
    tree: [
      {
        name: 'div.h-100.d-flex.flex-column.gap-5',
        note: 'the root every list page uses — never a pa-* utility, the shell already pads',
        children: [
          {
            name: 'MpPageHeader',
            children: [
              { name: '#actions', note: 'outlined secondary, then exactly one flat primary' },
              { name: '#tabs → MpFilterTabs', note: 'renders as a sibling of the header, not a child' },
            ],
          },
          {
            name: 'v-card (flat border rounded="lg")',
            note: 'flex-grow-1 d-flex flex-column overflow-hidden — the card is the scroll container',
            children: [
              {
                name: 'MpDataTableToolbar',
                note: 'v-model:search · v-model:hidden-columns · v-model:quick-filter-value',
                children: [{ name: '#filter-content → MpFormGrid', note: 'the Filter button only exists when this slot is filled' }],
              },
              { name: 'MpTableSkeleton', note: 'v-if loading, from useInitialLoad()' },
              {
                name: 'v-data-table',
                note: 'v-else · :headers from useResponsiveTableHeaders · show-select · fixed-header',
                children: [
                  { name: '#item.status → MpStatusChip', note: 'size="sm" inside a table, always' },
                  { name: '#item.actions → MpRowActionsMenu + MpMenuItem', note: 'wrapped in a div @click.stop' },
                  { name: '#no-data → MpEmptyState', note: 'two branches: filtered vs genuinely empty' },
                ],
              },
            ],
          },
          { name: 'MpFloatingBulkBar', note: 'always rendered — visibility is CSS, driven by :count' },
          { name: 'MpConfirmDialog', note: 'destructive row and bulk actions' },
        ],
      },
    ],
    spacing: [
      { token: 'gap-5 → --mp-space-20', owns: 'header ↔ tabs ↔ table card' },
      { token: '--mp-layout-shellInsetBlock / Inline (32 / 36)', owns: 'page padding — owned by the app shell, not the page' },
      { token: '--mp-component-control-height (40)', owns: 'every control in the toolbar row' },
      { token: '--mp-component-table-rowMinHeight (48)', owns: 'table row floor — a row with a control grows past it' },
      { token: '--mp-component-state-padding (32)', owns: 'the empty state inside #no-data' },
    ],
    rules: [
      { kind: 'do', text: 'Give every table all three states: skeleton, empty (search-aware), error.' },
      { kind: 'do', text: 'Key the table on the active tab so pagination and selection reset.' },
      { kind: 'do', text: 'Pass the full header list to the toolbar and the responsive subset to the table.' },
      { kind: 'dont', text: 'Put a pa-* utility on the card root — card insets come from component.card.*.' },
      { kind: 'dont', text: 'Hand-roll a kebab menu; MpRowActionsMenu owns the hit area and the roles.' },
    ],
    productNotes: [
      'MpFloatingBulkBar is position: fixed — it floats over the viewport, not inside the card, so a scrolled table never hides it.',
    ],
  },
  {
    slug: 'detail',
    routeName: 'TemplateDetail',
    title: 'Detail page',
    summary: 'One record: identity sidebar, tabbed body, edit drawer, not-found branch.',
    icon: 'file-text',
    file: 'src/views/Templates/TemplateDetailPage.vue',
    canonical: ['src/views/Contacts/ContactDetail.vue', 'src/views/Commerce/OrderDetail.vue'],
    usedBy: [
      { path: 'src/views/Commerce/OrderDetail.vue' },
      { path: 'src/views/Contacts/ContactDetail.vue' },
      { path: 'src/views/Service/TicketDetail.vue' },
      { path: 'src/views/Marketing/CampaignReportDetail.vue' },
      { path: 'src/views/Settings/pages/RoleDetailPage.vue' },
      { path: 'src/views/SalesChannels/SalesChannelLocationDetail.vue' },
    ],
    tree: [
      {
        name: 'div.h-100.d-flex.flex-column.gap-5 (v-if record)',
        children: [
          {
            name: 'MpPageHeader',
            note: 'backTo is what makes this a detail page — the back link, not a breadcrumb bar',
            children: [{ name: '#actions', note: 'one flat primary (Edit) + MpRowActionsMenu for the rest' }],
          },
          {
            name: 'div.content-area.d-flex.gap-5',
            children: [
              {
                name: 'aside (identity column)',
                note: 'flex-basis var(--mp-layout-detailSidebarWidth); wraps to its own row when the body cannot fit',
                children: [
                  { name: 'v-card → avatar + MpStatusChip + dl.mp-label-value' },
                  { name: 'v-card → MpSectionHeader + tonal chips' },
                ],
              },
              {
                name: 'div (body column)',
                note: 'flex-grow 999 so it takes every spare pixel while both panes fit',
                children: [
                  { name: 'v-tabs (density compact) + v-window' },
                  { name: 'Overview → v-row of MpKpiCard + card of MpListRow' },
                  { name: 'Related → compact v-data-table' },
                  { name: 'Activity → MpListRow feed' },
                ],
              },
            ],
          },
          { name: 'MpFormDrawer', note: 'edit — copy the record into local refs, then flip the boolean' },
          { name: 'MpConfirmDialog (danger + consequences)' },
        ],
      },
      { name: 'div.pa-10 → MpErrorState', note: 'v-else — the not-found branch every detail route needs' },
    ],
    spacing: [
      { token: 'gap-5 → --mp-space-20', owns: 'header ↔ body, and sidebar ↔ body columns' },
      { token: '--mp-layout-detailSidebarWidth (340)', owns: 'the identity column width' },
      { token: '--mp-component-card-padding (20)', owns: 'the inset of every card on the page' },
      { token: '--mp-layout-formMaxWidth (760)', owns: "the body column's flex basis — below it the split wraps to one column" },
    ],
    rules: [
      { kind: 'do', text: 'Ship the not-found branch: a bad id must land on MpErrorState, not a blank page.' },
      { kind: 'do', text: 'Stack the split on the viewport ($mp-layout-breakpointSplit) in the product; this template wraps on its own width because it shares the column with the spec panel.' },
      { kind: 'do', text: 'Use a dl.mp-label-value for label/value pairs so the grid stays consistent.' },
      { kind: 'dont', text: 'Write a calc(100vh - Npx) anywhere — the shell owns the height.' },
      { kind: 'dont', text: 'Open the edit form in a v-dialog; a create/edit form is MpFormDrawer.' },
    ],
  },
  {
    slug: 'form-drawer',
    routeName: 'TemplateFormDrawer',
    title: 'Form drawer',
    summary: 'Create and edit in one guarded drawer: sections, two-column grid, discard guard.',
    icon: 'panel-right',
    file: 'src/views/Templates/TemplateFormDrawerPage.vue',
    canonical: ['src/views/Settings/Users.vue', 'src/views/Contacts/ContactTags.vue'],
    usedByCount: 41,
    usedBy: [
      { path: 'src/views/Settings/Users.vue' },
      { path: 'src/views/Contacts/AllContacts.vue' },
      { path: 'src/views/Contacts/ContactTags.vue' },
      { path: 'src/views/Products/Inventory.vue' },
      { path: 'src/views/Products/TaxCategories.vue' },
      { path: 'src/views/Retail/Staff.vue' },
    ],
    tree: [
      {
        name: 'div.h-100.d-flex.flex-column.gap-5',
        children: [
          { name: 'MpPageHeader', note: '#actions → the flat primary that opens the drawer in create mode' },
          { name: 'v-card → MpDataTableToolbar + v-data-table', note: 'the host list; row menu opens the drawer in edit mode' },
          {
            name: 'MpFormDrawer (guarded)',
            note: 'title switches on mode; guarded routes Esc / X / scrim to @close',
            children: [
              { name: 'MpFormSection "General" (required)' },
              {
                name: 'MpFormGrid :cols="2"',
                note: 'the grid gap IS the field rhythm — a field never sets its own margin',
                children: [
                  { name: '.mp-form-grid__full', note: 'a field spanning both columns' },
                  { name: '.mp-form-grid__trailing', note: 'field + its trailing icon button, right edges aligned' },
                ],
              },
              { name: 'MpFormSection "Options"' },
              { name: 'MpFormField → v-chip-group', note: 'composite controls only — never wrap a Vuetify input' },
              { name: '#footerStart → Clear all' },
              { name: '#footer → text Cancel, then flat primary Save' },
            ],
          },
          { name: 'MpConfirmDialog', note: 'discard prompt when the guarded drawer closes dirty' },
        ],
      },
    ],
    spacing: [
      { token: '--mp-component-drawer-width-md (480)', owns: 'the drawer width (sm 440 / md 480 / lg 640)' },
      { token: '--mp-component-dialog-padding (20)', owns: 'header, body and footer bands — shared with MpDialog' },
      { token: '--mp-component-field-groupGap (16)', owns: 'the gap between fields, via MpFormGrid' },
      { token: '--mp-component-field-sectionGap (24)', owns: 'the air MpFormSection puts around a heading' },
      { token: '--mp-component-field-labelGap (6)', owns: 'static top label ↔ input box' },
    ],
    rules: [
      { kind: 'do', text: 'Copy the record into local refs on open, then flip the boolean — never key the drawer on the record.' },
      { kind: 'do', text: 'Name every input with the label prop; it renders as the static top label.' },
      { kind: 'do', text: 'Wire @close when using guarded, or the drawer cannot be dismissed.' },
      { kind: 'dont', text: 'Add mb-4 to a field — it stacks on top of the grid gap and renders 32.' },
      { kind: 'dont', text: 'Restate variant="outlined", density or color; they are theme defaults.' },
    ],
  },
  {
    slug: 'landing',
    routeName: 'TemplateLanding',
    title: 'Module landing',
    summary: 'The front door of a module: prop-driven, no layout code of your own.',
    icon: 'layout-grid',
    file: 'src/views/Templates/TemplateLandingPage.vue',
    canonical: ['src/views/Marketing/MarketingLanding.vue'],
    usedBy: [
      { path: 'src/views/Marketing/MarketingLanding.vue' },
      { path: 'src/views/Marketing/ContentLanding.vue' },
    ],
    tree: [
      {
        name: 'ModuleLandingPage',
        note: 'fully prop-driven — no slots, no emits, no wrapper markup',
        children: [
          { name: 'primaryActions', note: 'first is flat primary, the rest outlined' },
          { name: 'quickActions', note: '{ icon, label, description, to, color }' },
          { name: 'childPages (required)', note: '{ icon, title, description, to, count?, status?, color? }' },
          { name: 'recentActivity', note: 'rendered as MpListRow — the shared row geometry' },
          { name: 'setupCard', note: 'checklist with complete flags' },
          { name: 'daVinciCard', note: 'ink panel when inkDaVinciCard is set' },
        ],
      },
    ],
    spacing: [
      { token: 'ModuleLandingPage owns all of it', owns: 'the whole grid — a consumer supplies data, never spacing' },
      { token: '--mp-component-card-radius (16)', owns: 'the outer cards in the section grid' },
      { token: '--mp-component-card-gap (16)', owns: 'stacked cards in the side column' },
    ],
    rules: [
      { kind: 'do', text: 'Build every array as a computed and let the component lay it out.' },
      { kind: 'do', text: 'Pick colours from the accent vocabulary: blue, violet, rose, green, amber, cyan, indigo, teal.' },
      { kind: 'dont', text: 'Wrap it in your own grid or add a second page header.' },
    ],
  },
  {
    slug: 'wizard',
    routeName: 'TemplateWizard',
    title: 'Wizard',
    summary: 'Multi-step create flow with forward gating, step cards and a leave guard.',
    icon: 'list-checks',
    file: 'src/views/Templates/TemplateWizardPage.vue',
    canonical: ['src/views/Marketing/CreateCampaign.vue'],
    usedByCount: 15,
    usedBy: [
      { path: 'src/views/Marketing/CreateCampaign.vue' },
      { path: 'src/views/Marketing/CreateSmsCampaign.vue' },
      { path: 'src/views/Products/ProductWizard.vue' },
      { path: 'src/views/Analytics/CreateCustomReportWizard.vue' },
      { path: 'src/views/SalesChannels/CreateSalesChannel.vue' },
    ],
    tree: [
      {
        name: 'MpWizardShell',
        note: 'owns the head band, the step indicator, the reading measure and the footer',
        children: [
          { name: '#actions', note: 'Save & exit — quiet, text only' },
          { name: 'MpWizardStepCard (one per step, v-if not v-show)' },
          { name: '  → MpFormGrid / MpFormField + MpOptionCard / dl.mp-label-value' },
          { name: '#footer', note: 'Continue is disabled until the step validates' },
        ],
      },
      { name: 'MpConfirmDialog', note: 'the leave guard, a sibling of the shell' },
    ],
    spacing: [
      { token: '--mp-component-wizard-measure-sm (780)', owns: 'the reading measure of the body (md and lg exist too)' },
      { token: '--mp-space-24 / 32 / 16', owns: 'the head band, body and footer padding inside the shell' },
      { token: '--mp-component-field-groupGap (16)', owns: 'fields inside each step card' },
    ],
    rules: [
      { kind: 'do', text: 'Drive steps with useWizardSteps and gate forward moves with canAdvance.' },
      { kind: 'do', text: 'Explain a disabled Continue with the hint prop instead of a silent dead button.' },
      { kind: 'do', text: 'Own the leave guard in the page with useDirtyLeaveGuard; the shell deliberately does not.' },
      { kind: 'dont', text: 'Bind :max-step to the current step — forward jumps die the moment the user steps back.' },
    ],
    productNotes: [
      'This template passes standalone because it is hosted inside the templates layout. A real wizard route drops standalone and sets meta.builderShell, and the shell then uses .mp-frame-fill to reach the frame edges.',
    ],
  },
  {
    slug: 'builder',
    routeName: 'TemplateBuilder',
    title: 'Builder shell',
    summary: 'Full-frame editor: toolbar with dirty state, palette, canvas, inspector.',
    icon: 'layout-panel-left',
    file: 'src/views/Templates/TemplateBuilderPage.vue',
    canonical: ['src/views/Marketing/EmailContentEditor.vue'],
    usedBy: [
      { path: 'src/views/Marketing/EmailContentEditor.vue', note: 'the smallest consumer — start here' },
      { path: 'src/views/Marketing/FormBuilder.vue' },
      { path: 'src/views/Marketing/JourneyBuilder.vue' },
      { path: 'src/views/Marketing/LandingPageEditor.vue', note: 'the one autosave builder' },
      { path: 'src/views/SalesChannels/StoreThemeBuilder.vue' },
      { path: 'src/views/Service/ChatbotBuilder.vue' },
    ],
    tree: [
      {
        name: 'MpBuilderShell',
        note: 'toolbar 56 + optional steps row 52 + a three-pane body',
        children: [
          { name: '#actions', note: 'Preview (text) · Save (outlined) · Save & close (flat primary)' },
          { name: '#left → palette', note: 'the aside renders only when the slot is filled' },
          { name: 'default → canvas', note: 'the only scrolling pane; MpEmptyState when nothing is placed' },
          { name: '#right → inspector', note: 'MpFormSection + MpFormGrid + MpFormField' },
        ],
      },
      { name: 'MpConfirmDialog', note: 'leave guard — required for explicit and live persistence' },
    ],
    spacing: [
      { token: 'leftWidth (220) / rightWidth (300) props', owns: 'the two asides — pass numbers, not CSS' },
      { token: '--mp-layout-formMaxWidth (760)', owns: 'the centred document measure on the canvas' },
      { token: '--mp-space-24', owns: 'the canvas inset around the document' },
      { token: '--mp-component-field-groupGap (16)', owns: 'inspector fields' },
    ],
    rules: [
      { kind: 'do', text: 'Let the dirty prop drive the status chip; do not render your own saved/unsaved label.' },
      { kind: 'do', text: 'Call allowNextLeave() before pushing a route after a successful save.' },
      { kind: 'dont', text: 'Wire a leave guard on an autosave builder — there is nothing to lose.' },
      { kind: 'dont', text: 'Give the canvas its own page header; the toolbar is the header.' },
    ],
    productNotes: [
      'standalone is set here for the same reason as the wizard. A product builder route sets meta.builderShell instead and fills the frame.',
    ],
    needsRoom: true,
  },
  {
    slug: 'states',
    routeName: 'TemplateStates',
    title: 'Surface states',
    summary: 'Loading, empty, error, coming soon and confirm — side by side.',
    icon: 'circle-dashed',
    file: 'src/views/Templates/TemplateStatesPage.vue',
    canonical: ['src/components/MpEmptyState.vue', 'src/components/MpErrorState.vue'],
    usedBy: [
      { path: 'src/views/Retail/Hardware.vue', note: 'coming soon' },
      { path: 'src/views/Retail/RetailSettings.vue', note: 'coming soon' },
      { path: 'src/views/Commerce/OrderDetail.vue', note: 'error — record not found' },
      { path: 'src/views/Marketing/AcquisitionForms.vue', note: 'error — load failed' },
    ],
    tree: [
      {
        name: 'div.h-100.d-flex.flex-column.gap-5',
        children: [
          { name: 'MpPageHeader → #tabs → MpFilterTabs', note: 'one tab per state' },
          {
            name: 'v-card',
            children: [
              { name: 'Loading → MpTableSkeleton', note: 'under a real toolbar, so the skeleton is measured against the chrome it replaces; a product page drives it from useInitialLoad()' },
              { name: 'Empty → MpEmptyState', note: 'stack (in a card) beside launcher + prominent (a whole surface)' },
              { name: 'Error → MpErrorState', note: 'role="alert" and the error tone are baked in' },
              { name: 'Coming soon → MpComingSoonTiles', note: 'the surface does not exist yet — not an empty state' },
              { name: 'Confirm → MpConfirmDialog', note: 'neutral, and danger with consequences' },
            ],
          },
        ],
      },
    ],
    spacing: [
      { token: '--mp-component-state-padding (32)', owns: 'the default state block; prominent uses 48' },
      { token: '--mp-component-state-measure (420)', owns: 'the description measure; wide is 480' },
      { token: '--mp-component-state-minHeight (240)', owns: 'the block floor; prominent is 320' },
      { token: '--mp-component-dialog-width-sm (440)', owns: 'the confirm dialog' },
    ],
    rules: [
      { kind: 'do', text: 'Say which state you mean: empty is nothing to show, error is something failed, coming soon is not built yet.' },
      { kind: 'do', text: 'Make the empty state search-aware — "no matches" and "nothing here yet" are different messages.' },
      { kind: 'dont', text: 'Announce an empty list to screen readers; only the error state gets role="alert".' },
      { kind: 'dont', text: 'Close a confirm dialog in your handler — MpConfirmDialog closes itself.' },
    ],
    productNotes: [
      'Coverage across the app is lopsided: 127 views ship an empty state and 44 a skeleton, but only 13 ship an error state. Reachable failures need one.',
    ],
  },
]

export function specForRoute(name: unknown): TemplateSpec | undefined {
  return typeof name === 'string' ? TEMPLATE_SPECS.find((s) => s.routeName === name) : undefined
}
