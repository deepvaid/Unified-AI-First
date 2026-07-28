import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const DEFAULT_AVATAR_URL = 'https://maropost.com/hubfs/Maropost%20website/leadership/ross.png'

export const useUserProfile = defineStore('userProfile', () => {
  const avatarUrl = ref<string>(DEFAULT_AVATAR_URL)
  const hasAvatar = computed(() => avatarUrl.value.length > 0)
  const objectUrl = ref<string | null>(null)

  // Signed-in user's display name (mock). Used for personalized greetings (e.g. Da Vinci).
  const name = ref<string>('Ross Andrew Paquette')
  const firstName = computed(() => name.value.trim().split(/\s+/)[0] || name.value)

  function setAvatar(url: string) {
    if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
    objectUrl.value = url.startsWith('blob:') ? url : null
    avatarUrl.value = url
  }

  function setName(nextName: string) {
    const normalized = nextName.trim()
    if (normalized) name.value = normalized
  }

  function clearAvatar() {
    if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
    objectUrl.value = null
    avatarUrl.value = ''
  }

  return { avatarUrl, hasAvatar, name, firstName, setName, setAvatar, clearAvatar }
})
