# Marobase — Figma variable map

Generated 2026-09-07 by `scripts/figma/build-variable-plan.mjs` from `src/design-tokens/tokens.json`. Figma variable → code syntax → source token. Re-run the script after editing tokens.json.

## Primitives — modes: Value — 31 variables (hidden from publishing)

| Figma variable | Code | Source / notes | Value |
|---|---|---|---|
| `blue/50` | `var(--mp-color-blue-50)` | tokens.json: color.blue.50 | #ebf8fe |
| `blue/100` | `var(--mp-color-blue-100)` | tokens.json: color.blue.100 | #d6eefb |
| `blue/200` | `var(--mp-color-blue-200)` | tokens.json: color.blue.200 | #a8ddf1 |
| `blue/300` | `var(--mp-color-blue-300)` | tokens.json: color.blue.300 | #72d2f2 |
| `blue/400` | `var(--mp-color-blue-400)` | tokens.json: color.blue.400 | #4ec8f2 |
| `blue/500` | `var(--mp-color-blue-500)` | tokens.json: color.blue.500 | #1ab7ea |
| `blue/600` | `var(--mp-color-blue-600)` | tokens.json: color.blue.600 | #0d8cb8 |
| `blue/700` | `var(--mp-color-blue-700)` | tokens.json: color.blue.700 | #0a4f6c |
| `blue/800` | `var(--mp-color-blue-800)` | tokens.json: color.blue.800 | #0b3558 |
| `blue/900` | `var(--mp-color-blue-900)` | tokens.json: color.blue.900 | #06212c |
| `blue/950` | `var(--mp-color-blue-950)` | tokens.json: color.blue.950 | #04141b |
| `neutral/0` | `var(--mp-color-neutral-0)` | tokens.json: color.neutral.0 | #ffffff |
| `neutral/50` | `var(--mp-color-neutral-50)` | tokens.json: color.neutral.50 | #f9f9f9 |
| `neutral/100` | `var(--mp-color-neutral-100)` | tokens.json: color.neutral.100 | #f0f0f0 |
| `neutral/200` | `var(--mp-color-neutral-200)` | tokens.json: color.neutral.200 | #e5e5e5 |
| `neutral/300` | `var(--mp-color-neutral-300)` | tokens.json: color.neutral.300 | #d4d4d4 |
| `neutral/400` | `var(--mp-color-neutral-400)` | tokens.json: color.neutral.400 | #a3a3a3 |
| `neutral/500` | `var(--mp-color-neutral-500)` | tokens.json: color.neutral.500 | #737373 |
| `neutral/600` | `var(--mp-color-neutral-600)` | tokens.json: color.neutral.600 | #525252 |
| `neutral/700` | `var(--mp-color-neutral-700)` | tokens.json: color.neutral.700 | #404040 |
| `neutral/800` | `var(--mp-color-neutral-800)` | tokens.json: color.neutral.800 | #262626 |
| `neutral/900` | `var(--mp-color-neutral-900)` | tokens.json: color.neutral.900 | #171717 |
| `graphite/950` | `var(--mp-color-dark-background)` | tokens.json: color.dark.background (graphite ramp derived from dark roles) | #17191c |
| `graphite/900` | `var(--mp-color-dark-surface)` | tokens.json: color.dark.surface (graphite ramp derived from dark roles) | #1f2226 |
| `graphite/850` | `var(--mp-color-dark-surfaceRaised)` | tokens.json: color.dark.surfaceRaised (graphite ramp derived from dark roles) | #24272c |
| `graphite/800` | `var(--mp-color-dark-surfaceVariant)` | tokens.json: color.dark.surfaceVariant (graphite ramp derived from dark roles) | #272b30 |
| `graphite/700` | `var(--mp-color-dark-surfaceBright)` | tokens.json: color.dark.surfaceBright (graphite ramp derived from dark roles) | #32373e |
| `graphite/650` | `var(--mp-color-dark-borderSubtle)` | tokens.json: color.dark.borderSubtle (graphite ramp derived from dark roles) | #33373d |
| `graphite/600` | `var(--mp-color-dark-border)` | tokens.json: color.dark.border (graphite ramp derived from dark roles) | #3d4249 |
| `graphite/400` | `var(--mp-color-dark-borderStrong)` | tokens.json: color.dark.borderStrong (graphite ramp derived from dark roles) | #7c848f |
| `graphite/300` | `var(--mp-color-dark-textDisabled)` | tokens.json: color.dark.textDisabled (graphite ramp derived from dark roles) | #8a9199 |

## Color — modes: Light / Dark — 138 variables

| Figma variable | Code | Source / notes | Light | Dark |
|---|---|---|---|---|
| `surface/canvas` | `var(--surface-canvas)` | tokens.json: color.light.background · color.dark.background — page background | #f4f6fa | → graphite/950 |
| `surface/primary` | `var(--surface-primary)` | tokens.json: color.light.surface · color.dark.surface — cards, sheets (= Vuetify surface) | → neutral/0 | → graphite/900 |
| `surface/secondary` | `var(--surface-secondary)` | tokens.json: color.light.surfaceVariant · color.dark.surfaceVariant — tinted wells, hover fills | #ececec | → graphite/800 |
| `surface/raised` | `var(--surface-raised)` | tokens.json: color.light.surfaceRaised · color.dark.surfaceRaised — = surfaceBright in light | → neutral/0 | → graphite/850 |
| `surface/overlay` | `var(--surface-overlay)` | tokens.json: color.light.surfaceOverlay · color.dark.surfaceOverlay — menus, dialogs, drawers | → neutral/0 | → graphite/700 |
| `surface/sunken` | `var(--surface-sunken)` | tokens.json: color.light.surfaceSunken · color.dark.surfaceSunken — = background in light | #f4f6fa | → graphite/950 |
| `surface/bright` | `var(--mp-color-light-surfaceBright)` | tokens.json: color.light.surfaceBright · color.dark.surfaceBright — Vuetify surface-bright / surface-light | → neutral/0 | → graphite/700 |
| `surface/tint` | `var(--mp-surface-tint)` | tokens.json: color.light.surfaceTint · color.dark.surfaceTint — selected-row tint | #eef0ff | #2cc4ff |
| `text/primary` | `var(--text-primary)` | tokens.json: color.light.textPrimary · color.dark.textPrimary — = on-surface, = Vuetify on-surface/on-background | #1a1814 | #ececec |
| `text/secondary` | `var(--text-secondary)` | tokens.json: color.light.textSecondary · color.dark.textSecondary — = Vuetify on-surface-variant | #5c6066 | #c2c7cd |
| `text/muted` | `var(--text-muted)` | tokens.json: color.light.textMuted · color.dark.textMuted — = on-surface-muted | #5a6573 | #9ba3ac |
| `text/disabled` | `var(--text-disabled)` | tokens.json: color.light.textDisabled · color.dark.textDisabled | → neutral/400 | → graphite/300 |
| `icon/primary` | `var(--icon-primary)` | tokens.json: color.light.iconPrimary · color.dark.iconPrimary | #1a1814 | #ececec |
| `icon/secondary` | `var(--icon-secondary)` | tokens.json: color.light.iconSecondary · color.dark.iconSecondary | #5a6573 | #9ba3ac |
| `icon/disabled` | `var(--icon-disabled)` | tokens.json: color.light.iconDisabled · color.dark.iconDisabled | → neutral/400 | → graphite/300 |
| `border/subtle` | `var(--border-subtle)` | tokens.json: color.light.borderSubtle · color.dark.borderSubtle — card and section hairlines | #e2e8f0 | → graphite/650 |
| `border/default` | `var(--border-default)` | tokens.json: color.light.border · color.dark.border — = Vuetify border / outline-variant | → neutral/200 | → graphite/600 |
| `border/strong` | `var(--border-strong)` | tokens.json: color.light.outline · color.dark.borderStrong — control boundaries (3:1); = Vuetify outline | #8a8a8a | → graphite/400 |
| `border/hover` | `var(--border-hover)` | tokens.json: color.light.border · color.dark.borderHover | → neutral/200 | → graphite/600 |
| `border/table-row` | `var(--mp-border-table-row)` | tokens.json: color.light.borderTableRow · color.dark.borderTableRow | #1a18140f | #ffffff14 |
| `border/table-header` | `var(--mp-border-table-header)` | tokens.json: color.light.borderTableHeader · color.dark.borderTableHeader | → neutral/200 | → graphite/600 |
| `border/table-footer` | `var(--mp-border-table-footer-divider)` | tokens.json: color.light.borderTableFooterDivider · color.dark.borderTableFooterDivider | #1a18140a | #ffffff1f |
| `border/divider-muted` | `var(--mp-color-light-borderDividerMuted)` | tokens.json: color.light.borderDividerMuted · color.dark.borderDividerMuted | #1a18140f | #ffffff1f |
| `accent/default` | `var(--accent-default)` | tokens.json: color.light.accent.cyan.default · color.dark.accent.cyan.default — = Vuetify primary / info | #0073ab | #2cc4ff |
| `accent/hover` | `var(--accent-hover)` | tokens.json: color.light.accent.cyan.hover · color.dark.accent.cyan.hover — = Vuetify primary-darken-1 | #005e8a | #59d1ff |
| `accent/active` | `var(--accent-active)` | tokens.json: color.light.accent.cyan.active · color.dark.accent.cyan.active — = --accent-ink | #004a6d | #00adf1 |
| `accent/container` | `var(--accent-container)` | tokens.json: color.light.accent.cyan.container · color.dark.accent.cyan.container — = Vuetify primary-container | #def3ff | #04324d |
| `accent/on-accent` | `var(--accent-on)` | tokens.json: color.light.accent.cyan.onAccent · color.dark.accent.cyan.onAccent — = Vuetify on-primary | → neutral/0 | → blue/900 |
| `accent/on-container` | `var(--accent-on-container)` | tokens.json: color.light.accent.cyan.onContainer · color.dark.accent.cyan.onContainer — = Vuetify on-primary-container | #04324d | #def3ff |
| `accent/selected-bg` | `var(--accent-selected-bg)` | tokens.json: color.light.accent.cyan.selectedBackground · color.dark.accent.cyan.selectedBackground — = --surface-interactive-selected | #def3ff | #213a47 |
| `accent/subtle-bg` | `var(--accent-subtle-bg)` | tokens.json: color.light.accent.cyan.subtleBackground · color.dark.accent.cyan.subtleBackground — = --accent-soft | #eff9ff | #202f37 |
| `accent/focus-ring` | `var(--focus-ring)` | tokens.json: color.light.accent.cyan.focusRing · color.dark.accent.cyan.focusRing — 2px ring, 2px offset — code pins this to cyan for every preset (bug) | #0073ab | #2cc4ff |
| `brand/secondary` | `var(--mp-color-light-secondary)` | tokens.json: color.light.secondary · color.dark.secondary — ink black; = Vuetify secondary | #1a1814 | #c2c7cd |
| `brand/on-secondary` | `var(--mp-color-light-onSecondary)` | tokens.json: color.light.onSecondary · color.dark.onSecondary | → neutral/0 | #1a1814 |
| `status/success/default` | `var(--pos)` | tokens.json: color.light.success · color.dark.success — = Vuetify success | #1a7f54 | #4cc28a |
| `status/success/container` | `var(--pos-soft)` | tokens.json: color.light.successContainer · color.dark.successContainer — = Vuetify success-container | #d6f0e2 | #0f3a28 |
| `status/success/on` | `var(--on-pos)` | tokens.json: color.light.onSuccess · color.dark.onSuccess — = Vuetify on-success | → neutral/0 | #0b2a1e |
| `status/success/on-container` | `var(--pos-ink)` | tokens.json: color.light.onSuccessContainer · color.dark.onSuccessContainer — = Vuetify on-success-container | #0c5238 | #bfe6d2 |
| `status/warning/default` | `var(--warn)` | tokens.json: color.light.warning · color.dark.warning — = Vuetify warning | #a8630f | #e1a04a |
| `status/warning/container` | `var(--warn-soft)` | tokens.json: color.light.warningContainer · color.dark.warningContainer — = Vuetify warning-container | #fbe7c8 | #4a3210 |
| `status/warning/on` | `var(--on-warn)` | tokens.json: color.light.onWarning · color.dark.onWarning — = Vuetify on-warning | → neutral/0 | #2f1d05 |
| `status/warning/on-container` | `var(--warn-ink)` | tokens.json: color.light.onWarningContainer · color.dark.onWarningContainer — = Vuetify on-warning-container | #7a4a08 | #f7dcb1 |
| `status/error/default` | `var(--neg)` | tokens.json: color.light.error · color.dark.error — = Vuetify error | #c0392b | #f18e84 |
| `status/error/container` | `var(--neg-soft)` | tokens.json: color.light.errorContainer · color.dark.errorContainer — = Vuetify error-container | #fbe1dc | #4a1f19 |
| `status/error/on` | `var(--on-neg)` | tokens.json: color.light.onError · color.dark.onError — = Vuetify on-error | → neutral/0 | #35100d |
| `status/error/on-container` | `var(--neg-ink)` | tokens.json: color.light.onErrorContainer · color.dark.onErrorContainer — = Vuetify on-error-container | #7a1f15 | #f7c8c1 |
| `status/error/hover` | `var(--mp-color-light-errorDarken)` | tokens.json: color.light.errorDarken · color.dark.errorDarken — hover of filled Danger buttons; = Vuetify error-darken-1 (added 2026-09-07 for the Button set) | #8f2e22 | #d96c61 |
| `status/info/default` | `var(--mp-color-light-info)` | tokens.json: color.light.info · color.dark.info — = Vuetify info (= accent in light) | #0073ab | #2cc4ff |
| `status/info/container` | `var(--mp-color-dark-infoContainer)` | tokens.json: color.light.primaryContainer · color.dark.infoContainer — light has no infoContainer token — uses primaryContainer as code does | #def3ff | #04324d |
| `status/info/on` | `var(--mp-color-dark-onInfo)` | tokens.json: color.light.onPrimary · color.dark.onInfo — light has no onInfo token — uses onPrimary | → neutral/0 | → blue/900 |
| `status/info/on-container` | `var(--mp-color-dark-onInfoContainer)` | tokens.json: color.light.onPrimaryContainer · color.dark.onInfoContainer — light has no onInfoContainer token — uses onPrimaryContainer | #04324d | #def3ff |
| `interactive/default` | `var(--surface-interactive)` | tokens.json: color.light.interactiveDefault · color.dark.interactiveDefault | → neutral/0 | → graphite/900 |
| `interactive/hover` | `var(--surface-interactive-hover)` | tokens.json: color.light.interactiveHover · color.dark.interactiveHover | #ececec | → graphite/800 |
| `interactive/active` | `var(--surface-interactive-active)` | tokens.json: color.light.interactiveActive · color.dark.interactiveActive | → neutral/0 | → graphite/700 |
| `interactive/disabled` | `var(--surface-interactive-disabled)` | tokens.json: color.light.interactiveDisabled · color.dark.interactiveDisabled | #ececec | → graphite/800 |
| `button/disabled` | `var(--button-disabled)` | tokens.json: color.light.buttonDisabled · color.dark.buttonDisabled | #ececec | → graphite/800 |
| `button/on-disabled` | `var(--on-button-disabled)` | tokens.json: color.light.onButtonDisabled · color.dark.onButtonDisabled | #828282 | → graphite/300 |
| `scrim` | `var(--scrim-overlay)` | tokens.json: color.light.scrim · color.dark.scrim | #1a181452 | #06080aa3 |
| `ink-panel/bg` | `var(--ink-panel-bg)` | tokens.json: color.light.inkPanel.bg · color.dark.inkPanel.bg — bulk bar, dark side cards | #1a1814 | #343a41 |
| `ink-panel/fg` | `var(--ink-panel-fg)` | tokens.json: color.light.inkPanel.fg · color.dark.inkPanel.fg | #f7f5f2 | #f7f5f2 |
| `ink-panel/muted-fg` | `var(--ink-panel-muted-fg)` | tokens.json: color.light.inkPanel.mutedFg · color.dark.inkPanel.mutedFg | #f7f5f2a3 | #f7f5f2a3 |
| `ink-panel/border` | `var(--ink-panel-border)` | tokens.json: color.light.inkPanel.border · color.dark.inkPanel.border | #f7f5f224 | → graphite/600 |
| `ink-panel/accent` | `var(--ink-panel-accent)` | tokens.json: color.light.inkPanel.accent · color.dark.inkPanel.accent | #2cc4ff | #2cc4ff |
| `ai/soft` | `var(--dv-accent-soft)` | tokens.json: color.light.aiAccent.soft · color.dark.aiAccent.soft | #ebf2fe | #1b2440 |
| `ai/muted` | `var(--dv-muted)` | tokens.json: color.light.aiAccent.muted · color.dark.aiAccent.muted | #f4f7fb | #181a23 |
| `ai/border` | `var(--dv-border)` | tokens.json: color.light.aiAccent.border · color.dark.aiAccent.border | #c7dcff | #5b73a8 |
| `ai/text-primary` | `var(--dv-text-primary)` | tokens.json: color.light.aiAccent.textPrimary · color.dark.aiAccent.textPrimary | #15326a | #dce9ff |
| `ai/text-secondary` | `var(--dv-text-secondary)` | tokens.json: color.light.aiAccent.textSecondary · color.dark.aiAccent.textSecondary | #3f5a89 | #a6bbe0 |
| `ai/on-accent` | `var(--dv-on-accent)` | tokens.json: color.light.aiAccent.onAccent · color.dark.aiAccent.onAccent | → neutral/0 | #0b1530 |
| `ai/gradient/from` | `var(--mp-color-light-dv-gradFrom)` | tokens.json: color.light.dv.gradFrom · color.dark.dv.gradFrom — stop of --dv-grad (135°: 0% / 52% / 100%) — identity gradient (orb, hero) | #7c3aed | #8b5cf6 |
| `ai/action-gradient/from` | `var(--mp-color-light-aiAccent-actionGradientFrom)` | tokens.json: color.light.aiAccent.actionGradientFrom · color.dark.aiAccent.actionGradientFrom — stop of --dv-action-gradient — AI action buttons | #7c3aed | #60a5fa |
| `ai/gradient/mid` | `var(--mp-color-light-dv-gradMid)` | tokens.json: color.light.dv.gradMid · color.dark.dv.gradMid — stop of --dv-grad (135°: 0% / 52% / 100%) — identity gradient (orb, hero) | #2563eb | #3b82f6 |
| `ai/action-gradient/mid` | `var(--mp-color-light-aiAccent-actionGradientMid)` | tokens.json: color.light.aiAccent.actionGradientMid · color.dark.aiAccent.actionGradientMid — stop of --dv-action-gradient — AI action buttons | #2563eb | #4388f7 |
| `ai/gradient/to` | `var(--mp-color-light-dv-gradTo)` | tokens.json: color.light.dv.gradTo · color.dark.dv.gradTo — stop of --dv-grad (135°: 0% / 52% / 100%) — identity gradient (orb, hero) | #0891b2 | #06b6d4 |
| `ai/action-gradient/to` | `var(--mp-color-light-aiAccent-actionGradientTo)` | tokens.json: color.light.aiAccent.actionGradientTo · color.dark.aiAccent.actionGradientTo — stop of --dv-action-gradient — AI action buttons | #0e7490 | #22d3ee |
| `ai/action-gradient/on` | `var(--dv-action-on-gradient)` | tokens.json: color.light.aiAccent.actionOnGradient · color.dark.aiAccent.actionOnGradient | → neutral/0 | #0b1530 |
| `ai/orb/1` | `var(--dv-orb-c1)` | tokens.json: color.light.dv.orbC1 · color.dark.dv.orbC1 — orb particle colour (WebGL uniform) | #0891b2 | #22d3ee |
| `ai/ring/1` | `var(--dv-ring-c1)` | tokens.json: color.light.dv.ringC1 · color.dark.dv.ringC1 | #2563eb | #3b82f6 |
| `ai/orb/2` | `var(--dv-orb-c2)` | tokens.json: color.light.dv.orbC2 · color.dark.dv.orbC2 — orb particle colour (WebGL uniform) | #3b82f6 | #60a5fa |
| `ai/ring/2` | `var(--dv-ring-c2)` | tokens.json: color.light.dv.ringC2 · color.dark.dv.ringC2 | #7c3aed | #8b5cf6 |
| `ai/orb/3` | `var(--dv-orb-c3)` | tokens.json: color.light.dv.orbC3 · color.dark.dv.orbC3 — orb particle colour (WebGL uniform) | #8b5cf6 | #a78bfa |
| `ai/ring/3` | `var(--dv-ring-c3)` | tokens.json: color.light.dv.ringC3 · color.dark.dv.ringC3 | #d946ef | #e879f9 |
| `hue/blue/accent` | `var(--mp-color-light-moduleTile-blue-accent)` | tokens.json: color.light.moduleTile.blue.accent · color.dark.moduleTile.blue.accent — category hue — no alias-layer name yet (flag --hue-* for code) | #2563eb | #60a5fa |
| `hue/blue/ink` | `var(--mp-color-light-moduleTile-blue-ink)` | tokens.json: color.light.moduleTile.blue.ink · color.dark.moduleTile.blue.ink | #1d4ed8 | #93c5fd |
| `hue/violet/accent` | `var(--mp-color-light-moduleTile-violet-accent)` | tokens.json: color.light.moduleTile.violet.accent · color.dark.moduleTile.violet.accent — category hue — no alias-layer name yet (flag --hue-* for code) | #7c3aed | #a78bfa |
| `hue/violet/ink` | `var(--mp-color-light-moduleTile-violet-ink)` | tokens.json: color.light.moduleTile.violet.ink · color.dark.moduleTile.violet.ink | #6d28d9 | #c4b5fd |
| `hue/rose/accent` | `var(--mp-color-light-moduleTile-rose-accent)` | tokens.json: color.light.moduleTile.rose.accent · color.dark.moduleTile.rose.accent — category hue — no alias-layer name yet (flag --hue-* for code) | #e11d48 | #fb7185 |
| `hue/rose/ink` | `var(--mp-color-light-moduleTile-rose-ink)` | tokens.json: color.light.moduleTile.rose.ink · color.dark.moduleTile.rose.ink | #be123c | #fda4af |
| `hue/green/accent` | `var(--mp-color-light-moduleTile-green-accent)` | tokens.json: color.light.moduleTile.green.accent · color.dark.moduleTile.green.accent — category hue — no alias-layer name yet (flag --hue-* for code) | #16a34a | #4ade80 |
| `hue/green/ink` | `var(--mp-color-light-moduleTile-green-ink)` | tokens.json: color.light.moduleTile.green.ink · color.dark.moduleTile.green.ink | #15803d | #86efac |
| `hue/amber/accent` | `var(--mp-color-light-moduleTile-amber-accent)` | tokens.json: color.light.moduleTile.amber.accent · color.dark.moduleTile.amber.accent — category hue — no alias-layer name yet (flag --hue-* for code) | #d97706 | #fbbf24 |
| `hue/amber/ink` | `var(--mp-color-light-moduleTile-amber-ink)` | tokens.json: color.light.moduleTile.amber.ink · color.dark.moduleTile.amber.ink | #b45309 | #fcd34d |
| `hue/cyan/accent` | `var(--mp-color-light-moduleTile-cyan-accent)` | tokens.json: color.light.moduleTile.cyan.accent · color.dark.moduleTile.cyan.accent — category hue — no alias-layer name yet (flag --hue-* for code) | #0891b2 | #22d3ee |
| `hue/cyan/ink` | `var(--mp-color-light-moduleTile-cyan-ink)` | tokens.json: color.light.moduleTile.cyan.ink · color.dark.moduleTile.cyan.ink | #0e7490 | #67e8f9 |
| `hue/indigo/accent` | `var(--mp-color-light-moduleTile-indigo-accent)` | tokens.json: color.light.moduleTile.indigo.accent · color.dark.moduleTile.indigo.accent — category hue — no alias-layer name yet (flag --hue-* for code) | #4f46e5 | #818cf8 |
| `hue/indigo/ink` | `var(--mp-color-light-moduleTile-indigo-ink)` | tokens.json: color.light.moduleTile.indigo.ink · color.dark.moduleTile.indigo.ink | #4338ca | #a5b4fc |
| `hue/teal/accent` | `var(--mp-color-light-moduleTile-teal-accent)` | tokens.json: color.light.moduleTile.teal.accent · color.dark.moduleTile.teal.accent — category hue — no alias-layer name yet (flag --hue-* for code) | #0d9488 | #2dd4bf |
| `hue/teal/ink` | `var(--mp-color-light-moduleTile-teal-ink)` | tokens.json: color.light.moduleTile.teal.ink · color.dark.moduleTile.teal.ink | #0f766e | #5eead4 |
| `cloud/commerce/accent` | `var(--cloud-commerce-accent)` | tokens.json: color.light.cloud.commerce.accent · color.dark.cloud.commerce.accent — source-cloud chip | #16a34a | #4ade80 |
| `cloud/commerce/text` | `var(--cloud-commerce-text)` | tokens.json: color.light.cloud.commerce.text · color.dark.cloud.commerce.text | #166534 | #86efac |
| `cloud/marketing/accent` | `var(--cloud-marketing-accent)` | tokens.json: color.light.cloud.marketing.accent · color.dark.cloud.marketing.accent — source-cloud chip | #7c3aed | #a78bfa |
| `cloud/marketing/text` | `var(--cloud-marketing-text)` | tokens.json: color.light.cloud.marketing.text · color.dark.cloud.marketing.text | #5b21b6 | #c4b5fd |
| `cloud/analytics/accent` | `var(--cloud-analytics-accent)` | tokens.json: color.light.cloud.analytics.accent · color.dark.cloud.analytics.accent — source-cloud chip | #2563eb | #60a5fa |
| `cloud/analytics/text` | `var(--cloud-analytics-text)` | tokens.json: color.light.cloud.analytics.text · color.dark.cloud.analytics.text | #1d4ed8 | #93c5fd |
| `cloud/contacts/accent` | `var(--cloud-contacts-accent)` | tokens.json: color.light.cloud.contacts.accent · color.dark.cloud.contacts.accent — source-cloud chip | #0891b2 | #22d3ee |
| `cloud/contacts/text` | `var(--cloud-contacts-text)` | tokens.json: color.light.cloud.contacts.text · color.dark.cloud.contacts.text | #155e75 | #67e8f9 |
| `cloud/service/accent` | `var(--cloud-service-accent)` | tokens.json: color.light.cloud.service.accent · color.dark.cloud.service.accent — source-cloud chip | #4f46e5 | #818cf8 |
| `cloud/service/text` | `var(--cloud-service-text)` | tokens.json: color.light.cloud.service.text · color.dark.cloud.service.text | #3730a3 | #a5b4fc |
| `cloud/retail/accent` | `var(--cloud-retail-accent)` | tokens.json: color.light.cloud.retail.accent · color.dark.cloud.retail.accent — source-cloud chip | #0d9488 | #2dd4bf |
| `cloud/retail/text` | `var(--cloud-retail-text)` | tokens.json: color.light.cloud.retail.text · color.dark.cloud.retail.text | #0f766e | #5eead4 |
| `flow-logic/primary` | `var(--mp-color-light-flowLogic-primary)` | tokens.json: color.light.flowLogic.primary · color.dark.flowLogic.primary — = Vuetify flow-logic | #6d28d9 | #a78bfa |
| `flow-logic/on-primary` | `var(--mp-color-light-flowLogic-onPrimary)` | tokens.json: color.light.flowLogic.onPrimary · color.dark.flowLogic.onPrimary | → neutral/0 | #1e1b4b |
| `flow-logic/container` | `var(--mp-color-light-flowLogic-container)` | tokens.json: color.light.flowLogic.container · color.dark.flowLogic.container | #ede9fe | #2e2352 |
| `chart/series/1` | `var(--mp-color-chart-light-grayBlue-series1)` | tokens.json: color.chart.light.grayBlue.series1 · color.chart.dark.grayBlue.series1 — grayBlue palette (app default) | #1e9be3 | #1e9be3 |
| `chart/series/2` | `var(--mp-color-chart-light-grayBlue-series2)` | tokens.json: color.chart.light.grayBlue.series2 · color.chart.dark.grayBlue.series2 — grayBlue palette (app default) | #d2d2d2 | #d2d2d2 |
| `chart/series/3` | `var(--mp-color-chart-light-grayBlue-series3)` | tokens.json: color.chart.light.grayBlue.series3 · color.chart.dark.grayBlue.series3 — grayBlue palette (app default) | #1f4e79 | #1f4e79 |
| `chart/series/4` | `var(--mp-color-chart-light-grayBlue-series4)` | tokens.json: color.chart.light.grayBlue.series4 · color.chart.dark.grayBlue.series4 — grayBlue palette (app default) | #8bb8de | #8bb8de |
| `chart/series/5` | `var(--mp-color-chart-light-grayBlue-series5)` | tokens.json: color.chart.light.grayBlue.series5 · color.chart.dark.grayBlue.series5 — grayBlue palette (app default) | #3e6e9e | #3e6e9e |
| `chart/series/6` | `var(--mp-color-chart-light-grayBlue-series6)` | tokens.json: color.chart.light.grayBlue.series6 · color.chart.dark.grayBlue.series6 — grayBlue palette (app default) | #c3d9ec | #c3d9ec |
| `chart/axis/1` | `var(--mp-color-chart-light-grayBlue-axis1)` | tokens.json: color.chart.light.grayBlue.axis1 · color.chart.dark.grayBlue.axis1 | #1f4e79 | #1f4e79 |
| `chart/axis/2` | `var(--mp-color-chart-light-grayBlue-axis2)` | tokens.json: color.chart.light.grayBlue.axis2 · color.chart.dark.grayBlue.axis2 | #3e6e9e | #3e6e9e |
| `chart/axis/3` | `var(--mp-color-chart-light-grayBlue-axis3)` | tokens.json: color.chart.light.grayBlue.axis3 · color.chart.dark.grayBlue.axis3 | #1e9be3 | #1e9be3 |
| `chart/axis/4` | `var(--mp-color-chart-light-grayBlue-axis4)` | tokens.json: color.chart.light.grayBlue.axis4 · color.chart.dark.grayBlue.axis4 | #8bb8de | #8bb8de |
| `chart/axis/5` | `var(--mp-color-chart-light-grayBlue-axis5)` | tokens.json: color.chart.light.grayBlue.axis5 · color.chart.dark.grayBlue.axis5 | #c3d9ec | #c3d9ec |
| `chart/comparison` | `var(--mp-color-chart-light-grayBlue-comparison)` | tokens.json: color.chart.light.grayBlue.comparison · color.chart.dark.grayBlue.comparison | #d2d2d2 | #d2d2d2 |
| `chart/positive` | `var(--mp-color-chart-light-grayBlue-positive)` | tokens.json: color.chart.light.grayBlue.positive · color.chart.dark.grayBlue.positive | #178a50 | #178a50 |
| `chart/negative` | `var(--mp-color-chart-light-grayBlue-negative)` | tokens.json: color.chart.light.grayBlue.negative · color.chart.dark.grayBlue.negative | #c6403d | #c6403d |
| `chart/warning` | `var(--mp-color-chart-light-grayBlue-warning)` | tokens.json: color.chart.light.grayBlue.warning · color.chart.dark.grayBlue.warning | #b27b00 | #b27b00 |
| `chart/neutral` | `var(--mp-color-chart-light-grayBlue-neutral)` | tokens.json: color.chart.light.grayBlue.neutral · color.chart.dark.grayBlue.neutral | #d2d2d2 | #d2d2d2 |
| `chart/axis-label` | `var(--mp-color-chart-light-axisLabel)` | tokens.json: color.chart.light.axisLabel · color.chart.dark.axisLabel | #1a1814a6 | #ececec99 |
| `chart/legend-label` | `var(--mp-color-chart-light-legendLabel)` | tokens.json: color.chart.light.legendLabel · color.chart.dark.legendLabel | #1a1814b8 | #ecececb8 |
| `chart/grid` | `var(--mp-color-chart-light-grid)` | tokens.json: color.chart.light.grid · color.chart.dark.grid | #1a18140f | #ffffff14 |
| `chart/tooltip/bg` | `var(--mp-color-chart-light-tooltipBackground)` | tokens.json: color.chart.light.tooltipBackground · color.chart.dark.tooltipBackground | → neutral/0 | → graphite/700 |
| `chart/tooltip/text` | `var(--mp-color-chart-light-tooltipText)` | tokens.json: color.chart.light.tooltipText · color.chart.dark.tooltipText | #1a1814 | #ececec |
| `chart/tooltip/border` | `var(--mp-color-chart-light-tooltipBorder)` | tokens.json: color.chart.light.tooltipBorder · color.chart.dark.tooltipBorder | #1a18141a | → graphite/600 |
| `shadow/sm` | `var(--mp-shadow-sm)` | tokens.json: shadow.sm · shadow.dark.sm — shadow tint only; geometry lives in the Effect Style | #0b35580a | #00000052 |
| `shadow/md` | `var(--mp-shadow-md)` | tokens.json: shadow.md · shadow.dark.md — shadow tint only; geometry lives in the Effect Style | #0b355814 | #0000008c |
| `shadow/lg` | `var(--mp-shadow-lg)` | tokens.json: shadow.lg · shadow.dark.lg — shadow tint only; geometry lives in the Effect Style | #0b35581a | #00000099 |

## Nav Skin — modes: Gray / White / Dark — 9 variables

| Figma variable | Code | Source / notes | Gray | White | Dark |
|---|---|---|---|---|---|
| `nav/surface` | `var(--sidebar-bg)` | sidebar-{gray,white,dark}.css --sidebar-bg — gray = navSurfaceGray, white = surface, dark = dark surface | #eaedf2 | → neutral/0 | → graphite/900 |
| `nav/border` | `var(--sidebar-border)` | sidebar-{gray,white,dark}.css --sidebar-border | #e2e8f0 | #e2e8f0 | → graphite/650 |
| `nav/divider` | `var(--sidebar-line)` | sidebar-{gray,white,dark}.css --sidebar-line — light: text-primary @ 6% | #1a18140f | #1a18140f | #ffffff1f |
| `nav/text` | `var(--sidebar-text)` | sidebar-{gray,white,dark}.css --sidebar-text | #1a1814 | #1a1814 | #ececec |
| `nav/text-muted` | `var(--sidebar-muted)` | sidebar-{gray,white,dark}.css --sidebar-muted | #5a6573 | #5a6573 | #9ba3ac |
| `nav/hover` | `var(--sidebar-hover-bg)` | sidebar-{gray,white,dark}.css --sidebar-hover-bg — light: text-primary @ 6% | #1a18140f | #1a18140f | → graphite/800 |
| `nav/active` | `var(--sidebar-active-bg)` | sidebar-{gray,white,dark}.css --sidebar-active-bg — light: text-primary @ 10% | #1a18141a | #1a18141a | #213a47 |
| `nav/active-text` | `var(--sidebar-active-text)` | sidebar-{gray,white,dark}.css --sidebar-active-text | #1a1814 | #1a1814 | #ececec |
| `nav/focus-ring` | `var(--sidebar-focus-ring)` | sidebar-{gray,white,dark}.css --sidebar-focus-ring — light: text-primary @ 55% | #1a18148c | #1a18148c | #2cc4ff |

## Dimensions — modes: Value — 88 variables

| Figma variable | Code | Source / notes | Value |
|---|---|---|---|
| `space/2` | `var(--mp-space-2)` | tokens.json: space.2 | 2 |
| `space/4` | `var(--mp-space-4)` | tokens.json: space.4 | 4 |
| `space/6` | `var(--mp-space-6)` | tokens.json: space.6 | 6 |
| `space/8` | `var(--mp-space-8)` | tokens.json: space.8 | 8 |
| `space/10` | `var(--mp-space-10)` | tokens.json: space.10 | 10 |
| `space/12` | `var(--mp-space-12)` | tokens.json: space.12 | 12 |
| `space/14` | `var(--mp-space-14)` | tokens.json: space.14 | 14 |
| `space/16` | `var(--mp-space-16)` | tokens.json: space.16 | 16 |
| `space/20` | `var(--mp-space-20)` | tokens.json: space.20 | 20 |
| `space/24` | `var(--mp-space-24)` | tokens.json: space.24 | 24 |
| `space/28` | `var(--mp-space-28)` | tokens.json: space.28 | 28 |
| `space/32` | `var(--mp-space-32)` | tokens.json: space.32 | 32 |
| `space/40` | `var(--mp-space-40)` | tokens.json: space.40 | 40 |
| `space/48` | `var(--mp-space-48)` | tokens.json: space.48 | 48 |
| `space/64` | `var(--mp-space-64)` | tokens.json: space.64 | 64 |
| `space/80` | `var(--mp-space-80)` | tokens.json: space.80 | 80 |
| `radius/4` | `var(--mp-radius-4)` | tokens.json: radius.4 | 4 |
| `radius/8` | `var(--mp-radius-8)` | tokens.json: radius.8 | 8 |
| `radius/10` | `var(--mp-radius-10)` | tokens.json: radius.10 | 10 |
| `radius/12` | `var(--mp-radius-12)` | tokens.json: radius.12 | 12 |
| `radius/16` | `var(--mp-radius-16)` | tokens.json: radius.16 | 16 |
| `radius/full` | `var(--mp-radius-full)` | tokens.json: radius.full — pills, buttons | 9999 |
| `radius/surface` | `var(--r-card)` | tokens.json: component.card.radius = component.dialog.radius = radius.16 — the one outer-surface radius (cards, sections, dialogs, drawers) | → radius/16 |
| `size/control/sm` | `var(--mp-component-field-height-sm)` | tokens.json: component.field.height.sm / segmented.height.sm — compact controls | 32 |
| `size/control/md` | `var(--mp-component-control-height)` | tokens.json: component.control.height — buttons, fields, list rows, table header share this baseline | 40 |
| `size/control/lg` | `var(--mp-component-field-height-lg)` | tokens.json: component.field.height.lg / table.rowMinHeight | 48 |
| `font-size/10` | `var(--mp-fontSize-10)` | tokens.json: fontSize.10 | 10 |
| `font-size/11` | `var(--mp-fontSize-11)` | tokens.json: fontSize.11 | 11 |
| `font-size/12` | `var(--mp-fontSize-12)` | tokens.json: fontSize.12 | 12 |
| `font-size/13` | `var(--mp-fontSize-13)` | tokens.json: fontSize.13 | 13 |
| `font-size/14` | `var(--mp-fontSize-14)` | tokens.json: fontSize.14 | 14 |
| `font-size/15` | `var(--mp-fontSize-15)` | tokens.json: fontSize.15 | 15 |
| `font-size/16` | `var(--mp-fontSize-16)` | tokens.json: fontSize.16 | 16 |
| `font-size/18` | `var(--mp-fontSize-18)` | tokens.json: fontSize.18 | 18 |
| `font-size/20` | `var(--mp-fontSize-20)` | tokens.json: fontSize.20 | 20 |
| `font-size/24` | `var(--mp-fontSize-24)` | tokens.json: fontSize.24 | 24 |
| `font-size/28` | `var(--mp-fontSize-28)` | tokens.json: fontSize.28 | 28 |
| `font-size/32` | `var(--mp-fontSize-32)` | tokens.json: fontSize.32 | 32 |
| `font-size/40` | `var(--mp-fontSize-40)` | tokens.json: fontSize.40 | 40 |
| `font-size/48` | `var(--mp-fontSize-48)` | tokens.json: fontSize.48 | 48 |
| `layout/sidebar` | `var(--mp-layout-sidebarWidth)` | tokens.json: layout.sidebarWidth | 248 |
| `layout/rail` | `var(--mp-layout-sidebarRailWidth)` | tokens.json: layout.sidebarRailWidth | 72 |
| `layout/appbar` | `var(--mp-layout-appbarHeight)` | tokens.json: layout.appbarHeight (token 60, rendered 56 — code ticket) | 56 |
| `layout/section-rail` | `var(--mp-layout-sectionRailWidth)` | tokens.json: layout.sectionRailWidth | 260 |
| `layout/content-max` | `var(--mp-layout-contentMaxWidth)` | tokens.json: layout.contentMaxWidth | 1280 |
| `layout/detail-sidebar` | `var(--mp-layout-detailSidebarWidth)` | tokens.json: layout.detailSidebarWidth | 340 |
| `layout/inbox-list` | `var(--mp-layout-inboxListWidth)` | tokens.json: layout.inboxListWidth | 380 |
| `layout/builder-left` | `var(--mp-component-builder-panelWidth)` | tokens.json: component.builder.panelWidth (token 380, rendered 220 — code ticket) | 220 |
| `layout/builder-right` | `var(--mp-component-builder-panelWidth)` | tokens.json: component.builder.panelWidth (token 380, rendered 300 — code ticket) | 300 |
| `button/padding-inline` | `var(--mp-component-button-paddingInline)` | tokens.json: component.button.paddingInline = {space.14} | → space/14 |
| `chip/radius` | `var(--mp-component-chip-radius)` | tokens.json: component.chip.radius = {radius.8} | → radius/8 |
| `chip/height-sm` | `var(--mp-component-chip-height-sm)` | tokens.json: component.chip.height.sm = {space.20} | → space/20 |
| `chip/height-md` | `var(--mp-component-chip-height-md)` | tokens.json: component.chip.height.md = {space.24} | → space/24 |
| `chip/height-lg` | `var(--mp-component-chip-height-lg)` | tokens.json: component.chip.height.lg = {space.32} | → space/32 |
| `input/radius` | `var(--mp-component-input-radius)` | tokens.json: component.input.radius = {radius.10} | → radius/10 |
| `menu/radius` | `var(--mp-component-menu-radius)` | tokens.json: component.menu.radius = {radius.12} | → radius/12 |
| `menu/min-width` | `var(--mp-component-menu-minWidth)` | tokens.json: component.menu.minWidth | 180 |
| `menu/item-height` | `var(--mp-component-menu-itemHeight)` | tokens.json: component.menu.itemHeight | 36 |
| `card/padding` | `var(--mp-component-card-padding)` | tokens.json: component.card.padding = {space.20} | → space/20 |
| `card/padding-compact` | `var(--mp-component-card-paddingCompact)` | tokens.json: component.card.paddingCompact = {space.12} | → space/12 |
| `card/padding-spacious` | `var(--mp-component-card-paddingSpacious)` | tokens.json: component.card.paddingSpacious = {space.32} | → space/32 |
| `card/gap` | `var(--mp-component-card-gap)` | tokens.json: component.card.gap = {space.16} | → space/16 |
| `card/gap-compact` | `var(--mp-component-card-gapCompact)` | tokens.json: component.card.gapCompact = {space.8} | → space/8 |
| `dialog/width-sm` | `var(--mp-component-dialog-width-sm)` | tokens.json: component.dialog.width.sm | 440 |
| `dialog/width-md` | `var(--mp-component-dialog-width-md)` | tokens.json: component.dialog.width.md | 640 |
| `dialog/width-lg` | `var(--mp-component-dialog-width-lg)` | tokens.json: component.dialog.width.lg | 880 |
| `dialog/header-min-height` | `var(--mp-component-dialog-headerMinHeight)` | tokens.json: component.dialog.headerMinHeight | 88 |
| `drawer/width-sm` | `var(--mp-component-drawer-width-sm)` | tokens.json: component.drawer.width.sm | 440 |
| `drawer/width-md` | `var(--mp-component-drawer-width-md)` | tokens.json: component.drawer.width.md | 480 |
| `drawer/width-lg` | `var(--mp-component-drawer-width-lg)` | tokens.json: component.drawer.width.lg | 640 |
| `list-item/padding-block` | `var(--mp-component-listItem-paddingBlock)` | tokens.json: component.listItem.paddingBlock = {space.8} | → space/8 |
| `list-item/padding-inline` | `var(--mp-component-listItem-paddingInline)` | tokens.json: component.listItem.paddingInline = {space.12} | → space/12 |
| `list-item/gap` | `var(--mp-component-listItem-gap)` | tokens.json: component.listItem.gap = {space.12} | → space/12 |
| `field/label-gap` | `var(--mp-component-field-labelGap)` | tokens.json: component.field.labelGap = {space.6} | → space/6 |
| `field/group-gap` | `var(--mp-component-field-groupGap)` | tokens.json: component.field.groupGap = {space.16} | → space/16 |
| `field/section-gap` | `var(--mp-component-field-sectionGap)` | tokens.json: component.field.sectionGap = {space.24} | → space/24 |
| `state/measure` | `var(--mp-component-state-measure)` | tokens.json: component.state.measure | 420 |
| `state/measure-wide` | `var(--mp-component-state-measureWide)` | tokens.json: component.state.measureWide | 480 |
| `table/row-min-height` | `var(--mp-component-table-rowMinHeight)` | tokens.json: component.table.rowMinHeight = {space.48} | → space/48 |
| `table/cell-padding-inline` | `var(--mp-component-table-cellPaddingInline)` | tokens.json: component.table.cellPaddingInline = {space.16} | → space/16 |
| `table/cell-padding-block` | `var(--mp-component-table-cellPaddingBlock)` | tokens.json: component.table.cellPaddingBlock = {space.14} | → space/14 |
| `toolbar/height` | `var(--mp-component-toolbar-minHeight)` | tokens.json: component.toolbar.minHeight = {space.64} | → space/64 |
| `nav/item-radius` | `var(--mp-component-nav-itemRadius)` | tokens.json: component.nav.itemRadius = {radius.8} | → radius/8 |
| `widget/action-size` | `var(--mp-component-widget-actionSize)` | tokens.json: component.widget.actionSize = {space.32} | → space/32 |
| `wizard/measure-sm` | `var(--mp-component-wizard-measure-sm)` | tokens.json: component.wizard.measure.sm | 780 |
| `wizard/measure-md` | `var(--mp-component-wizard-measure-md)` | tokens.json: component.wizard.measure.md | 920 |
| `wizard/measure-lg` | `var(--mp-component-wizard-measure-lg)` | tokens.json: component.wizard.measure.lg | 1040 |
| `banner/min-height` | `var(--mp-component-banner-minHeight)` | tokens.json: component.banner.minHeight | 44 |

## Typography — modes: Value — 2 variables

| Figma variable | Code | Source / notes | Value |
|---|---|---|---|
| `font-family/base` | `var(--mp-fontFamily-base)` | tokens.json: fontFamily.base — Inter | Inter |
| `font-family/mono` | `var(--mp-fontFamily-mono)` | tokens.json: fontFamily.mono — JetBrains Mono (Figma: Fira Code, the declared fallback) | Fira Code |

## Text styles

| Style | Font | Size | Line height | Tracking | Code weight | Source |
|---|---|---|---|---|---|---|
| Display/XL | Inter Extra Bold | 80 | 95% | -3.5% | 800 | display.xl |
| Display/LG | Inter Extra Bold | 60 | 100% | -3% | 800 | display.lg |
| Display/MD | Inter Bold | 44 | 105% | -2% | 700 | display.md |
| Display/SM | Inter Bold | 32 | 110% | -1% | 700 | display.sm |
| Heading/Page Title | Inter Bold | 28 | 115% | -2% | 750 | text.pageTitle |
| Heading/Page Subtitle | Inter Regular | 15 | 150% | 0% | 450 | text.pageSubtitle |
| Heading/Section Title | Inter Semi Bold | 16 | 130% | -1% | 650 | text.sectionTitle |
| Data/KPI Value | Inter Bold | 32 | 115% | -2.5% | 700 | text.kpiValue |
| Data/KPI Value Hero | Inter Extra Bold | 48 | 100% | -3% | 800 | text.kpiValueHero |
| Data/Meta Value | Inter Medium | 14 | 140% | 0% | 550 | text.metaValue |
| Body/Regular | Inter Regular | 14 | 157% | 0% | 400 | fontSize.14 (Vuetify text-body-2) |
| Body/Medium | Inter Medium | 14 | 157% | 0% | 500 | text.body |
| Body/Label | Inter Medium | 13 | 140% | 0% | 500 | text.label |
| Body/Caption | Inter Medium | 12 | 140% | 0% | 500 | text.caption |
| Body/Eyebrow | Inter Semi Bold | 11 | 140% | 6% | 600 | text.eyebrow (= text.metaLabel) |
| Component/Button | Inter Semi Bold | 14 | 100% | 0% | 600 | component.button.typography |
| Code/Mono | Fira Code Regular | 13 | 150% | 0% | 400 | fontFamily.mono |

## Effect styles

| Style | Geometry (x y blur spread) | Colour | Code |
|---|---|---|---|
| Elevation/Light/Raised | 0 1 2 0 | → shadow/sm (Light) | `--elevation-raised` |
| Elevation/Light/Overlay | 0 2 16 -8 | → shadow/md (Light) | `--elevation-overlay` |
| Elevation/Light/Modal | 0 8 32 -12 | → shadow/lg (Light) | `--elevation-modal` |
| Elevation/Dark/Raised | 0 1 2 0 | → shadow/sm (Dark) | `--elevation-raised` |
| Elevation/Dark/Overlay | 0 8 24 -6 | → shadow/md (Dark) | `--elevation-overlay` |
| Elevation/Dark/Modal | 0 18 48 -12 | → shadow/lg (Dark) | `--elevation-modal` |
| Elevation/Button Inset | 0 1 0 0 | #ffffff29 | `--mp-shadow-buttonInset` |
| Glow/Da Vinci Mic | 0 10 26 0 | #637df761 | `--dv-orbit-mic-shadow` |

## Paint styles

| Style | Angle | Stops | Code |
|---|---|---|---|
| Gradient/Da Vinci Brand | 135° | ai/gradient/from @ 0%, ai/gradient/mid @ 52%, ai/gradient/to @ 100% | `--dv-grad` |
| Gradient/Da Vinci Hero | 90° | ai/gradient/from @ 0%, ai/gradient/mid @ 50%, ai/gradient/to @ 100% | `--dv-hero-grad` |
| Gradient/Da Vinci Action | 135° | ai/action-gradient/from @ 0%, ai/action-gradient/mid @ 50%, ai/action-gradient/to @ 100% | `--dv-action-gradient` |

## Conflicts and notes recorded while generating

- radius.20 excluded (single use)
- layout/appbar: token layout.appbarHeight = 60 but the app renders 56 — Figma uses 56
- layout/builder-left: token component.builder.panelWidth = 380 but the app renders 220 — Figma uses 220
- layout/builder-right: token component.builder.panelWidth = 380 but the app renders 300 — Figma uses 300
- dv.gradFrom vs dv.heroGradFrom: light #7c3aed/#7c3aed, dark #8b5cf6/#a78bfa — Hero paint style reuses ai/gradient/* (light-identical); dark hero stops differ
- dv.gradMid vs dv.heroGradMid: light #2563eb/#2563eb, dark #3b82f6/#60a5fa — Hero paint style reuses ai/gradient/* (light-identical); dark hero stops differ
- dv.gradTo vs dv.heroGradTo: light #0891b2/#0891b2, dark #06b6d4/#22d3ee — Hero paint style reuses ai/gradient/* (light-identical); dark hero stops differ
