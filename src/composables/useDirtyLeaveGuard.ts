import { ref, type Ref, type ComputedRef } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'

/**
 * Shared unsaved-changes leave guard for full-page builders.
 * Blocks vue-router navigation while dirty; optionally warns on tab close.
 */
export function useDirtyLeaveGuard(
  isDirty: Ref<boolean> | ComputedRef<boolean>,
  options?: {
    title?: string
    message?: string
    confirmLabel?: string
    /** Also register window beforeunload when dirty (code editors, etc.). */
    beforeUnload?: boolean
  },
) {
  const confirmLeave = ref(false)
  const allowLeave = ref(false)
  const pendingTo = ref<string | null>(null)
  const router = useRouter()

  const leaveTitle = options?.title ?? 'Discard unsaved changes?'
  const leaveMessage =
    options?.message ?? 'You have unsaved changes. Leaving now will discard them.'
  const leaveConfirmLabel = options?.confirmLabel ?? 'Discard changes'

  onBeforeRouteLeave((to) => {
    if (allowLeave.value || !isDirty.value) return true
    pendingTo.value = to.fullPath
    confirmLeave.value = true
    return false
  })

  if (options?.beforeUnload) {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (allowLeave.value || !isDirty.value) return
      e.preventDefault()
      e.returnValue = ''
    }
    onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
    onUnmounted(() => window.removeEventListener('beforeunload', onBeforeUnload))
  }

  function allowNextLeave() {
    allowLeave.value = true
  }

  function discardAndLeave() {
    allowLeave.value = true
    confirmLeave.value = false
    const target = pendingTo.value
    pendingTo.value = null
    if (target) router.push(target)
  }

  return {
    confirmLeave,
    allowNextLeave,
    discardAndLeave,
    leaveTitle,
    leaveMessage,
    leaveConfirmLabel,
  }
}
