import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCopilotStore = defineStore('copilot', () => {
  const isOpen = ref(false)
  const isExpanded = ref(false)
  /** Prompt queued by a feature surface; the bot consumes it on open so the panel never starts blank. */
  const pendingPrompt = ref<string | null>(null)

  function open() {
    isOpen.value = true
  }

  function openWithPrompt(prompt: string) {
    pendingPrompt.value = prompt
    isOpen.value = true
  }

  function consumePendingPrompt(): string | null {
    const prompt = pendingPrompt.value
    pendingPrompt.value = null
    return prompt
  }

  function close() {
    isOpen.value = false
  }

  function toggle() {
    isOpen.value = !isOpen.value
  }

  function toggleExpanded() {
    isExpanded.value = !isExpanded.value
  }

  return {
    isOpen,
    isExpanded,
    pendingPrompt,
    open,
    openWithPrompt,
    consumePendingPrompt,
    close,
    toggle,
    toggleExpanded,
  }
})
