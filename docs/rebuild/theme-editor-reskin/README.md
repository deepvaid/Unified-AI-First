# Theme editor re-skin — the current store-builder screens on the design system

**Branch:** `feature/store-builder-reskin` · **Built:** 2026-09-30 · **Status:** prototype for stakeholder review

## Why

Stakeholders asked one question: *"What would the current product look like if we simply upgraded
its existing components to the new design system?"* — no new flows, no AI-first rethink. That
broader redesign already exists in this repo (`StoreThemeBuilder.vue` / `StoreThemeCode.vue`, the
AI-first target) and diverges from the shipped admin. This slice is the other thing: the UAT
theme builder and theme code editor rebuilt **1:1** — same layout, content, interactions and
workflows — with every control swapped for a design-system component and every value on a token.

## Where to look

Sales channels → Neelam-Store → **Themes** → row menu (⋮) → *Customize* / *Edit code*. Or directly:

| Screen | Route | UAT source |
|---|---|---|
| Theme builder | `/accounts/2000290/sales_channels/neelam-store/themes/theme-neelam-lumos/builder?template-type=home&template-id=default` | `…/stores/9/themes/<id>/builder` |
| Theme settings (rail → palette) | `…/themes/theme-neelam-lumos/theme-settings` | `…/themes/<id>/theme-settings` |
| Theme code editor | `…/themes/theme-neelam-lumos/code` | `…/stores/9/themes/<id>/code` |

The AI-first pages stay where they were (`…/theme`, `…/theme/code`; the pencil on the Themes row),
so both can be compared side by side.

## Locked decisions (2026-09-30)

1. **Full page, UAT's own frame.** The screens keep their 64→56px top bar (back · store switcher ·
   theme switcher · Theme actions kebab · Preview / Save / Publish) and the dark activity rail
   (Home, Theme Settings). Route meta `fullPage`; the global sidebar and app bar are not on screen.
   `MpBuilderShell` was *not* used — that would change the layout, which is the one thing this
   prototype must not do.
2. **CodeMirror 6 behind `MpCodeEditor`.** UAT's code pane is Monaco; a textarea would have read
   as a downgrade. `MpCodeEditor` (`src/components/MpCodeEditor.vue`) is the design system's code
   surface: geometry on `component.editor.*`, syntax colours on the seven `--code-*` aliases
   (`color.light.code.*` / `color.dark.code.*`, each a declared contrast pair). Go-template HTML
   parses as Liquid-over-HTML so `{{ }}` tags highlight as tags.
3. **Live preview via `StorefrontPreview`.** The canvas is the repo's interactive storefront mock
   (device widths, hover/select outlines, section labels) fed from the builder model through
   `toPreviewSections`. UAT iframes the real storefront; screenshots were rejected as static.
4. **Parallel routes.** New `ThemeEditorBuilder` / `ThemeEditorSettings` / `ThemeEditorCode` routes
   mirror UAT's URL shape under the store; nothing AI-first was touched.
5. **Da Vinci stays exactly as the product ships it:** the "Edit with Da Vinci" button and the
   "Generate with AI" tile are present and locked with the same "Upgrade to use" tooltip. They are
   not new AI experiences — they are what the current screen shows.

## What is mocked

- **Data:** `src/stores/themeEditorData.ts` (builder model, catalog, Lumos seeds) and
  `src/stores/themeEditorLumosFiles.ts` (the ~440-file Lumos tree as crawled; file *contents* are
  plausible stand-ins). Stores: `useThemeEditor` (builder), `useThemeEditorCode` (code).
- **Preview projection:** hero-banner → `hero`; categories/brands/featured-collections →
  `collection-grid` (+ collection blocks); featured-recommendations → `featured-products`;
  multi-column/benefits → `testimonials` (three cards); everything else → `rich-text`. The
  storefront chrome (announcement bar, header, footer) is fixed around the template — in UAT it
  lives in the Header/Footer templates and is reached from the preview's "Edit header" overlay,
  which here switches the template picker to Header/Footer.
- **Not built (not on the two screens):** undo/redo (UAT has no buttons for it on this screen),
  preview entity pickers ("Select product…"), the Themes page's Upload/Duplicate/Rename menu.

## Crawl spec (UAT, store #9 neelam-store, theme Lumos, 2026-09-30)

### Shared chrome
- Top bar 64px white: back chevron · store switcher (borderless select, "#9" in primary, options
  #3 demo-store30-sep, #4 testing sales channel, #6 Sales channel testing, #7 gayfywdew, #8 Test- SC,
  #9 neelam-store) · theme switcher ("Theme: Lumos"; Aurora carries a "Live Store" chip) · kebab
  "Theme actions" (tooltip "Settings and More") → *Edit Code*, *View Live store*. Builder right side:
  PREVIEW (text) · SAVE (outlined, disabled until dirty) · PUBLISH (filled). Code page: *Save* (text).
- Activity rail 56px `rgb(30,37,51)`: *Home* (layers icon → builder), *Theme Settings* (palette).
  UAT is itself Vuetify 3 (`v-theme--findifyTheme`, Roboto) — the re-skin is the same structure
  on our theme and `Mp*` components.

### Code editor
- Rail 56 · icon bar 47 (Explorer / Search) · Explorer 299px `rgb(247,247,247)` · tab strip 35px ·
  Monaco (14px, 21px lines, line numbers, Go-template colouring).
- Explorer: "EXPLORER" + "…" menu (check items *Open Editors*, *Folders*) · "OPEN EDITORS" group ·
  "LUMOS" group with hover actions *New File…* (inline "New file name" box) and *Collapse all
  folders in explorer* · tree rows 30px, per-file kebab → *Rename*, *Delete* · dirty dot on the file
  and its folder. Folders: layouts, templates (25 × `<name>/default.json`), sections, sections_wip,
  blocks, snippets, config, assets (css/ images/ js/), locales.
- Tabs: file-type icon + name; active = white + 2px primary bottom; × on hover; dirty = ●.
  Editor opens on `404/default.html` (`{{ define "content" }}` / `{{ end }}`). Cmd/Ctrl+S saves.

### Builder
- Layers 240px: "Layers" heading · "+ ADD SECTION" outlined block button · tinted section rows
  (chevron, icon, name; hover → grip + trash) · expanded → block rows (cube icon; hover → grip +
  pencil + trash), nested blocks (Trust Stats Bar → Stat: Happy Homes / Furniture Pieces /
  Customer Rating) · "+ ADD BLOCK". Home: Hero Banner (Heading Tag, Heading, CTA Buttons, Trust
  Stats Bar), Categories, Brand, Featured Recommendations, Why Choose Us.
- Canvas bar: template select (search + 22 templates: Home, Product, Search, Collection, Blog Post,
  Page, Policy, Cart, Wishlist, Order Confirmation, Orders, Order, Addresses, Profile, Edit
  Profile, Signup, Login, Forgot Password, Reset Password, 404 Not Found, 500 Server Error, Sign
  Out) · variant select "Default" · device toggle Mobile (375) / Tablet (768) / Desktop (1100).
  The design system's preview stops are 390 / 768 / 1100 (`component.preview.viewport.*`).
- Preview: selected section outlined with a label tag ("Hero Banner"); selected block outlined
  ("Heading"); header hover shows "EDIT HEADER".
- Inspector 300px (hidden until a selection): section — "Section Name", "Edit with Da Vinci"
  (locked), "Content Alignment", "Background Image" (preview, Clear, IMAGE, Focal point ▾),
  "Opacity" slider + number, "Style" (Select color / text / button schema). Block "Heading" —
  rich text (H1 ▾ | B I U | </>) + alignment toggle.
- Add Section dialog (two panes): Da Vinci tile (locked) · Search · "Sections": *All (6)*
  [Multicolumn, Home, Content, General, Products, Marketing], *Featured In Focus (2)* [Featured
  Collections → Grid / Slider, Featured Product Recommendations], *Text & Image (1)* [Image Banner].
- Theme Settings: list "General" → Logo, Social Media, Theme Colors, Buttons, Product Card,
  Typography, Furniture surfaces. Logo: Image, Logo link, Store name, Store description, Language
  code. Theme Colors / Typography: Default scheme card (chip, pencil, trash), "+ NEW SCHEME",
  "Current Themes" (Dark, Modern / Compact 14, Editorial 18, Elegant 16, Technical 15).

## Component map (UAT → design system)

| UAT | Re-skin |
|---|---|
| Top bar `v-toolbar`, borderless selects, uppercase buttons | `ThemeEditorFrame`: `v-select` toolbar controls, `MpRowActionsMenu` + `MpMenuItem`, sentence-case pill buttons |
| Dark rail `v-navigation-drawer` | `.mp-ink-panel` rail with `router-link` items and tooltips |
| Explorer tree, per-file "Actions" | `ThemeCodeExplorer` on `MpListRow` (compact), `MpRowActionsMenu` |
| Monaco | `MpCodeEditor` (CodeMirror 6) |
| Layers rows, ADD SECTION / ADD BLOCK | `ThemeLayersPanel` on boxed `MpListRow`s, outlined `v-btn`, `v-menu` of `MpMenuItem`s |
| Device icon group (elevated) | `MpSegmentedControl size="sm"` |
| Inspector drawer, floating-label fields | `ThemeInspectorPanel` + `ThemeFieldControl` (static-label fields, `MpFormField` for composites, `MpFormSection` "Style") |
| Add Section dialog | `ThemeAddSectionDialog` on `MpDialog` (flush, two panes), `MpOptionCard` variants |
| Theme Settings list + scheme cards | `ThemeSettingsList`, `ThemeSettingsInspector`, `ThemeSchemeCard` |
| Browser `confirm()` / none | `MpConfirmDialog` for remove, publish and unsaved-changes |

## Tokens added

`component.editor.*` (topBarHeight 56, railWidth 56, toolWidth 48, explorerWidth 300,
layersWidth 260, inspectorWidth 320, codeFontSize 13, codeLineHeight 1.6),
`component.preview.viewport.tablet` 768 / `desktop` 1100, `color.light.code.*` and
`color.dark.code.*` (seven syntax roles, aliased as `--code-*` in `mp-theme-aliases.css`; all
pass `npm run contrast:check` at text level).

## Polish pass (2026-09-30)

A principal-design audit of the re-skin, measured in the browser at 1440 / 1024 / 768, found that most of
the rough edges came from the design system itself, so the fixes landed there first (each its own commit):

| Finding | Evidence | Fix |
|---|---|---|
| Layers rows uneven, row actions overflowing | Sections 50px vs blocks 28px; 40px action buttons in a 28px row, their gradient mask cutting the selected outline | `MpIconButton` (square 24/32/40 ramp) — the VBtn default's inline min-height made every x-small icon button a 32×40 capsule |
| Explorer too loose | File rows 48px vs folder rows 26px — half the files per screen UAT shows | `MpTreeRow` — one 32px tree row for both trees |
| Rows were buttons holding buttons | Toggle / edit / remove `<button>`s inside a clickable-row `<button>`; `role="tree"` on 294 items with no arrow keys | `MpTreeRow` stretches one main button over the row; honest disclosure-list semantics |
| No hierarchy under a section | Blocks at the same x as sections; bold centred 40px "Add block" | One indent per level + hairline guides; "Add block" is a quiet accent command row |
| Drag-only reorder | No keyboard path (WCAG 2.1.1 / 2.5.7) | Alt + ↑ / ↓ moves a row, keeps focus, announces the position |
| Four heavy boxes across two toolbars | Store, theme, template, variant pickers with the 3:1 form outline | `mp-field-quiet` opt-in class: value + chevron, no resting border, full focus border |
| Device toggle hard to read | Phone and tablet glyphs ~2px apart; selected thumb 1.18:1 on its track with an 8% blur; md track measured 42 vs its 40 token | Landscape tablet glyph, md size; `shadow.thumb`; inset track hairline so 32/40 are real |
| Publish clipped at 768px | Canvas 382px at 1024 and 126px at 768 with the inspector open | `layout.breakpointWide` 1200: the inspector overlays the canvas below it |

Deliberately not done (logged in DESIGN_AUDIT.md): the app-wide icon-button reset, which would change
table-row heights across the whole product (Orders 69 → 61px) and wants its own reviewed pass.
