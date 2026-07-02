import { onMounted, ref } from 'vue'

/**
 * Simulated first-load flag for mock-data list views.
 *
 * Returns `loading` = `true`, flipping to `false` once `delay` ms after mount.
 * The app has no backend, so this mimics an initial fetch — matching the
 * existing simulated-async convention (e.g. `Analytics/LiveView`) — so the
 * `MpTableSkeleton` is actually seen on first paint. Only fires on mount;
 * client-side filtering/search reuse the loaded data (no re-load).
 *
 * When a real API is wired, replace the body with the fetch and drive
 * `loading` off its pending state.
 */
export function useInitialLoad(delay = 450) {
  const loading = ref(true)
  onMounted(() => {
    setTimeout(() => {
      loading.value = false
    }, delay)
  })
  return { loading }
}
