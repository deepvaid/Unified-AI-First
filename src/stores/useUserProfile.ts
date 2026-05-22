import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const DEFAULT_AVATAR_URL = 'https://maropost.com/hubfs/Maropost%20website/leadership/ross.png'

export const useUserProfile = defineStore('userProfile', () => {
  const avatarUrl = ref<string>(DEFAULT_AVATAR_URL)
  const hasAvatar = computed(() => avatarUrl.value.length > 0)
  const objectUrl = ref<string | null>(null)

  function setAvatar(url: string) {
    if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
    objectUrl.value = url.startsWith('blob:') ? url : null
    avatarUrl.value = url
  }

  function clearAvatar() {
    if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
    objectUrl.value = null
    avatarUrl.value = ''
  }

  return { avatarUrl, hasAvatar, setAvatar, clearAvatar }
})
