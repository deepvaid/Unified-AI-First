import { onMounted, ref } from 'vue'
import { useMaropayStore } from '@/stores/useMaropay'
import type { MaropayError } from '@/maropay/model'

/**
 * First load for the Maropay lists: useInitialLoad's simulated fetch plus a
 * failure path. The reviewer's "Next request times out" switch makes one load
 * fail, so the error state and its retry can be reviewed.
 */
export function useMaropayListLoad(delay = 450) {
  const maropay = useMaropayStore()
  const loading = ref(true)
  const error = ref<MaropayError | null>(null)

  function load(): void {
    loading.value = true
    error.value = null
    window.setTimeout(() => {
      error.value = maropay.loadRecords()
      loading.value = false
    }, delay)
  }

  onMounted(load)
  return { loading, error, retry: load }
}
