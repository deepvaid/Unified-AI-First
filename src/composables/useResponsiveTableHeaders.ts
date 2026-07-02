import { computed, unref, type MaybeRef } from 'vue'
import { useDisplay } from 'vuetify'

/**
 * Breakpoint below which a column is hidden.
 * - `'sm'` → hidden on xs (< 600px)
 * - `'md'` → hidden on xs + sm (< 960px, i.e. phones/small tablets)
 * - `'lg'` → hidden on xs + sm + md (< 1280px, i.e. everything below desktop)
 */
export type HideBelow = 'sm' | 'md' | 'lg'

export interface ResponsiveHeader {
  key: string
  /** Priority marker: the column is dropped on viewports narrower than this breakpoint. */
  hideBelow?: HideBelow
  [prop: string]: unknown
}

/**
 * Column-priority responsive strategy for `v-data-table`.
 *
 * Hidden columns simply aren't rendered, so existing `#item.<key>` cell
 * templates keep working untouched. Optionally merges a manual column-hide
 * selection (e.g. from `MpDataTableToolbar`'s column menu).
 */
export function useResponsiveTableHeaders<T extends ResponsiveHeader>(
  headers: MaybeRef<T[]>,
  hiddenColumns?: MaybeRef<string[]>,
) {
  const { xs, smAndDown, mdAndDown } = useDisplay()

  const visibleHeaders = computed(() => {
    const manualHidden = unref(hiddenColumns) ?? []
    return unref(headers).filter((header) => {
      if (manualHidden.includes(header.key)) return false
      if (header.hideBelow === 'sm' && xs.value) return false
      if (header.hideBelow === 'md' && smAndDown.value) return false
      if (header.hideBelow === 'lg' && mdAndDown.value) return false
      return true
    })
  })

  return { visibleHeaders }
}
