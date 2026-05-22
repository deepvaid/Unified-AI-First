/**
 * Shared composable for data-table pages.
 *
 * Provides a consistent pattern for:
 * - text search (reactive)
 * - row selection (reactive)
 * - typed filter bag with active-filter-entries for MpDataTableToolbar
 * - helpers: removeFilter, clearAllFilters
 *
 * Usage:
 *   const { search, selected, filters, activeFilterEntries, removeFilter, clearAllFilters }
 *     = useTableFilters<{ status: string | null; priority: string | null }>({
 *         status: null,
 *         priority: null,
 *       })
 */
import { ref, computed } from 'vue'

export interface FilterEntry {
  key: string
  label: string
}

export function useTableFilters<
  TFilters extends Record<string, string | null>,
  TId = string | number,
>(
  initialFilters: TFilters,
  filterLabels: Partial<Record<keyof TFilters, string>> = {},
) {
  const search = ref('')
  const selected = ref<TId[]>([])
  const filters = ref<TFilters>({ ...initialFilters } as TFilters)

  const activeFilterEntries = computed<FilterEntry[]>(() =>
    (Object.entries(filters.value) as [string, string | null][])
      .filter(([, v]) => v !== null)
      .map(([key, value]) => ({
        key,
        label: filterLabels[key as keyof TFilters]
          ? `${filterLabels[key as keyof TFilters]}: ${value}`
          : String(value),
      })),
  )

  const hasActiveFilters = computed(() => activeFilterEntries.value.length > 0 || search.value.trim() !== '')

  function removeFilter(key: string) {
    ;(filters.value as Record<string, string | null>)[key] = null
  }

  function clearAllFilters() {
    filters.value = { ...initialFilters } as TFilters
    search.value = ''
  }

  function clearSelection() {
    selected.value = []
  }

  return {
    search,
    selected,
    filters,
    activeFilterEntries,
    hasActiveFilters,
    removeFilter,
    clearAllFilters,
    clearSelection,
  }
}
