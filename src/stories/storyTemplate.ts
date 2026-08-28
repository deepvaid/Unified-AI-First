/**
 * Shared render helpers for the standard story template.
 *
 * Every component's stories follow the same shape (CLAUDE.md → Marobase working rules):
 *
 *   Default · Variants (one grid) · Sizes (one grid) · States (one grid)
 *
 * The three grid stories are structurally identical across ~30 components, so the
 * wrapper lives here once instead of being pasted into every file. Specimens are
 * labelled so a reviewer can read the grid without opening the controls panel.
 */

export interface Specimen {
  /** Caption shown above the specimen. */
  label: string
  /** Props merged over the story's base args. */
  args: Record<string, unknown>
  /** Optional inner markup for components driven by slots. */
  slot?: string
}

interface GridOptions {
  /** Grid column width; `1fr` stacks one specimen per row. Default: auto-fit at 260px. */
  columns?: string
  /** Extra markup placed inside each specimen wrapper, after the component. */
  itemClass?: string
}

/**
 * Builds a Storybook `render` function that lays specimens out in a labelled grid.
 *
 * @param component  the component under test, keyed by the tag used in `template`
 * @param specimens  one entry per variant / size / state
 */
export function grid(
  component: Record<string, unknown>,
  specimens: Specimen[],
  options: GridOptions = {},
) {
  const columns = options.columns ?? 'repeat(auto-fit, minmax(260px, 1fr))'
  const name = Object.keys(component)[0]

  return (args: Record<string, unknown>) => ({
    components: component,
    setup: () => ({ args, specimens }),
    template: `
      <div class="sb-grid" style="display: grid; grid-template-columns: ${columns}; gap: var(--mp-space-24);">
        <div v-for="s in specimens" :key="s.label" class="sb-grid__item" style="min-width: 0;">
          <div class="sb-grid__label" style="
            margin-bottom: var(--mp-space-8);
            font-size: var(--mp-fontSize-11);
            font-weight: var(--mp-fontWeight-semibold);
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--text-muted);
          ">{{ s.label }}</div>
          <${name} v-bind="{ ...args, ...s.args }" ${options.itemClass ? `class="${options.itemClass}"` : ''}>
            <template v-if="s.slot" #default><span v-html="s.slot" /></template>
          </${name}>
        </div>
      </div>
    `,
  })
}

/**
 * Single-column variant of `grid` — for components that need the full content
 * width to be legible (page headers, toolbars, empty states, list rows).
 */
export function stack(component: Record<string, unknown>, specimens: Specimen[]) {
  return grid(component, specimens, { columns: '1fr' })
}
