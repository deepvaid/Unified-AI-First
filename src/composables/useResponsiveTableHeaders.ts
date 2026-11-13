import { computed, getCurrentInstance, inject, onMounted, ref, unref, type InjectionKey, type MaybeRef } from 'vue'
import { useDisplay } from 'vuetify'
import {
  mp_layout_tableColumnsLg,
  mp_layout_tableColumnsMd,
  mp_layout_tableColumnsSm,
} from '@/design-tokens/generated/tokens'
import { useElementSize } from '@/composables/useElementSize'

/**
 * Breakpoint below which a column is hidden.
 * - `'sm'` → hidden on xs (< 600px)
 * - `'md'` → hidden on xs + sm (< 960px, i.e. phones/small tablets)
 * - `'lg'` → hidden on xs + sm + md (< 1280px, i.e. everything below desktop)
 *
 * Inside a shell that provides `TABLE_FITS_CONTAINER` the same three priorities are measured
 * against the table's own width (`layout.tableColumns{Sm,Md,Lg}`) instead of the window's.
 */
export type HideBelow = 'sm' | 'md' | 'lg'

export interface ResponsiveHeader {
  key: string
  /** Priority marker: the column is dropped on viewports narrower than this breakpoint. */
  hideBelow?: HideBelow
  [prop: string]: unknown
}

/**
 * A shell whose content column is much narrower than the window (a rail shell such as Settings)
 * provides `true`. Its tables then choose columns by the width they actually have: at a 1440px
 * window a Settings table is about 800px wide, and window breakpoints kept every column.
 */
export const TABLE_FITS_CONTAINER: InjectionKey<boolean> = Symbol('tableFitsContainer')

const STOPS = {
  sm: parseFloat(mp_layout_tableColumnsSm),
  md: parseFloat(mp_layout_tableColumnsMd),
  lg: parseFloat(mp_layout_tableColumnsLg),
}

/** Width of the component that called the composable — the page or tab that holds the table. */
function useOwnWidth() {
  const instance = getCurrentInstance()
  const element = ref<HTMLElement | null>(null)
  onMounted(() => {
    const root = instance?.proxy?.$el
    element.value = root instanceof HTMLElement ? root : null
  })
  const { size } = useElementSize(element)
  return computed(() => size.value.width)
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
  const ownWidth = inject(TABLE_FITS_CONTAINER, false) ? useOwnWidth() : null

  // Until the table has been measured (first render) the window decides.
  const below = computed(() => {
    const width = ownWidth?.value ?? 0
    if (width > 0) return { sm: width < STOPS.sm, md: width < STOPS.md, lg: width < STOPS.lg }
    return { sm: xs.value, md: smAndDown.value, lg: mdAndDown.value }
  })

  const visibleHeaders = computed(() => {
    const manualHidden = unref(hiddenColumns) ?? []
    return unref(headers).filter((header) => {
      if (manualHidden.includes(header.key)) return false
      return !(header.hideBelow && below.value[header.hideBelow])
    })
  })

  /** True while the column with this key is on screen — for folding its content into another cell. */
  const isVisible = (key: string) => visibleHeaders.value.some((header) => header.key === key)

  return { visibleHeaders, isVisible }
}
