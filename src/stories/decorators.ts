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
 * Stamps `data-sidebar` on <html> so the shell skins in `sidebar-*.css` resolve.
 * Reads `parameters.sidebarSkin`, defaulting to `gray` — the app's own default.
 *
 * P5.5: the attribute is now restored on unmount. It previously only ever got
 * set, so navigating away from a `dark`-skin story left the dark chrome stamped
 * on <html> for every story after it — dark nav surfaces under light-theme ink.
 */
export const sidebarSkin: Decorator = (story, context) => ({
  components: { story },
  setup() {
    const skin = String(context.parameters.sidebarSkin ?? 'gray')
    const previous = document.documentElement.dataset.sidebar
    document.documentElement.dataset.sidebar = skin

    onUnmounted(() => {
      if (previous === undefined) {
        delete document.documentElement.dataset.sidebar
      } else {
        document.documentElement.dataset.sidebar = previous
      }
    })

    return {}
  },
  template: '<story />',
})
