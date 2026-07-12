import { ref } from 'vue'

/**
 * Shared mobile navigation state — lets the AppBar's hamburger button open
 * the AppSidebar's temporary (overlay) drawer without needing App.vue to
 * wire a prop between the two. Singleton module state (mirrors useAppTheme).
 */
const mobileNavOpen = ref(false)

export function useMobileNav() {
  function open() {
    mobileNavOpen.value = true
  }
  function close() {
    mobileNavOpen.value = false
  }
  function toggle() {
    mobileNavOpen.value = !mobileNavOpen.value
  }
  return { mobileNavOpen, open, close, toggle }
}
