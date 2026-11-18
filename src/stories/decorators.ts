/**
 * Shared story decorators — the frames stories render inside.
 *
 * The one global decorator in `.storybook/preview.ts` owns the canvas: its
 * background, its `--mp-space-32` padding and its `--mp-layout-contentMaxWidth`
 * clamp. Nothing here replaces it. These presets sit *inside* it and supply the
 * one thing a story sometimes needs on top: a measure, or a frame that stands in
 * for the surface a component normally lives in.
 *
 * Before this file, 43 story files hard-coded inline `max-width` clamps at 30
 * distinct pixel values, and two widget frames used an off-scale
 * `border-radius: 18px` (DESIGN_AUDIT.md P5-5). Reach for a preset here rather
 * than writing another wrapper `<div style="…">`.
 *
 * Sibling modules: `storyTemplate.ts` (the Variants/Sizes/States grid renderer)
 * and `fixtures.ts` (shared realistic data).
 */
import { onUnmounted } from 'vue'
import type { Decorator } from '@storybook/vue3'

/**
 * Story canvas measures.
 *
 * These size a *story frame* to its content — the same distinction that licenses
 * `component.state.measure` and panel/popover widths as exempt from the spacing
 * rhythm (DESIGN_AUDIT.md, Phase 4 "Deliberate exemptions"). They are not steps
 * on the spacing scale, so they are named by role, not by pixel value.
 */
export const measure = {
  /** 320px — a chip, a toggle, a single form control. */
  narrow: '320px',
  /** 420px — `component.state.measure`: an empty state, a confirm dialog. */
  compact: 'var(--mp-component-state-measure)',
  /** 480px — `layout.drawerWidth`: a drawer body, a wide empty state. */
  drawer: 'var(--mp-layout-drawerWidth)',
  /** 640px — `component.dialog.width.md`: the default modal measure. */
  dialog: 'var(--mp-component-dialog-width-md)',
  /** 720px — a page section: headers, toolbars, list rows at reading width. */
  section: '720px',
  /** 880px — `component.dialog.width.lg`: the widest composed example. */
  wide: 'var(--mp-component-dialog-width-lg)',
} as const

export type Measure = keyof typeof measure

/** Clamps a story to one of the shared measures and centres it. */
export function constrain(size: Measure = 'section'): Decorator {
  return () => ({
    template: `<div style="max-width: ${measure[size]}; margin-inline: auto;"><story /></div>`,
  })
}

/**
 * A bordered surface frame — stands in for the card or panel a component
 * normally sits inside. Radius comes from `component.card.radius` (16), the one
 * outer-surface corner; the two widget stories that used to hard-code 18px are
 * now on the scale.
 */
export function surfaceFrame(options: { width?: string, height?: string } = {}): Decorator {
  const { width, height } = options
  return () => ({
    template: `
      <div style="
        ${width ? `width: ${width};` : ''}
        ${height ? `height: ${height};` : ''}
        overflow: hidden;
        border: 1px solid var(--border-subtle);
        border-radius: var(--mp-component-card-radius);
        background: var(--surface-primary);
        color: var(--on-surface);
      "><story /></div>
    `,
  })
}

/**
 * A rail-plus-content shell — the shape an in-content rail actually occupies.
 * The rail renders at its own `layout.sectionRailWidth`; the filler is the page
 * body it sits beside.
 */
export function railFrame(height = '560px'): Decorator {
  return () => ({
    template: `
      <div style="
        display: flex;
        height: ${height};
        overflow: hidden;
        border: 1px solid var(--border-subtle);
        border-radius: var(--mp-component-card-radius);
      ">
        <story />
        <div style="flex: 1; background: rgb(var(--v-theme-background)); color: rgb(var(--v-theme-on-background));" />
      </div>
    `,
  })
}

/**
 * Stamps the app shell's attributes on <html>, as App.vue does, so `AppBar` and `AppSidebar`
 * render with the chrome the running app has: `data-sidebar` (the skin in `sidebar-*.css`),
 * `data-shell` and `data-frame` (the shell variant in `shell-variants.css`).
 *
 * Reads `parameters.sidebarSkin` (default `gray`) and `parameters.shell` (default `studio`);
 * both are the app's own defaults. The frame follows the shell, as it does in the app.
 * Everything is restored on unmount, so a skin never leaks into the next story.
 *
 * The attributes are one per document: on a docs page every story shares them. Give a story
 * that shows a non-default skin or shell `parameters: overlayDocs()` so it gets its own frame.
 */
export const appShell: Decorator = (story, context) => ({
  components: { story },
  setup() {
    const root = document.documentElement
    const shell = String(context.parameters.shell ?? 'studio')
    const next = {
      sidebar: String(context.parameters.sidebarSkin ?? 'gray'),
      shell,
      frame: shell === 'studio' ? 'on' : 'off',
    }
    const previous = { sidebar: root.dataset.sidebar, shell: root.dataset.shell, frame: root.dataset.frame }
    Object.assign(root.dataset, next)

    onUnmounted(() => {
      for (const key of ['sidebar', 'shell', 'frame'] as const) {
        if (previous[key] === undefined) delete root.dataset[key]
        else root.dataset[key] = previous[key]
      }
    })

    return {}
  },
  template: '<story />',
})

/**
 * Story parameters for a story that opens an overlay on mount (dialog, drawer, menu, toast) or
 * that changes something page-wide. On a docs page it renders in its own frame of the given
 * height, so several open overlays cannot stack on one page and a play function that queries
 * `document` only finds its own story.
 *
 *   export const Open: Story = { parameters: overlayDocs(), ... }
 *   parameters: { docs: { description: { story: '…' }, ...overlayDocs('720px').docs } }
 */
export function overlayDocs(height = '640px') {
  return { docs: { story: { inline: false, height } } }
}

/**
 * Puts `localStorage` back the way it was when the story unmounts. Several stores persist there
 * (PLG, Maropay, Trial Lab, Da Vinci history), so a story that seeds one changed every story
 * opened after it. Storybook's own keys are left alone.
 */
export const isolateStorage: Decorator = (story) => ({
  components: { story },
  setup() {
    const own = (key: string) => !/^@?storybook|^sb-/i.test(key)
    const snapshot = Object.fromEntries(Object.entries(localStorage).filter(([key]) => own(key)))

    onUnmounted(() => {
      for (const key of Object.keys(localStorage).filter(own)) {
        if (!(key in snapshot)) localStorage.removeItem(key)
      }
      for (const [key, value] of Object.entries(snapshot)) localStorage.setItem(key, value)
    })

    return {}
  },
  template: '<story />',
})

/**
 * The register's own light surface. POS components are light-only by design
 * (`color.light.pos.*`), so the frame keeps them on it under the dark Theme
 * toggle too — and points the grid captions at the POS muted ink.
 */
export const posSurface: Decorator = () => ({
  template: `
    <div style="
      --text-muted: var(--mp-color-light-pos-muted);
      padding: var(--mp-space-24);
      border-radius: var(--mp-component-card-radius);
      background: var(--mp-color-light-pos-background);
      color: var(--mp-color-light-pos-ink);
    "><story /></div>
  `,
})

/**
 * A register screen: the positioned box a `PosSheet` rises inside. Use for
 * sheets and whole-panel patterns.
 */
export function posScreen(height = '640px'): Decorator {
  return () => ({
    template: `
      <div style="
        --text-muted: var(--mp-color-light-pos-muted);
        position: relative;
        height: ${height};
        overflow: hidden;
        border-radius: var(--mp-component-card-radius);
        background: var(--mp-color-light-pos-background);
        color: var(--mp-color-light-pos-ink);
      "><story /></div>
    `,
  })
}
