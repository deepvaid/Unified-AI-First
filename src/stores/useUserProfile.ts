import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * Languages the backoffice can be shown in. `label` is the language's own name, which is how a
 * speaker looks for it; `english` is shown beside it. No flags: a flag is a country, not a language.
 */
export const LANGUAGES = [
  { code: 'en-US', label: 'English (US)', english: 'English' },
  { code: 'fr', label: 'Français', english: 'French' },
  { code: 'de', label: 'Deutsch', english: 'German' },
  { code: 'es', label: 'Español', english: 'Spanish' },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']

const DEFAULT_AVATAR_URL = 'https://maropost.com/hubfs/Maropost%20website/leadership/ross.png'

export const useUserProfile = defineStore('userProfile', () => {
  const avatarUrl = ref<string>(DEFAULT_AVATAR_URL)
  const hasAvatar = computed(() => avatarUrl.value.length > 0)
  const objectUrl = ref<string | null>(null)

  // Signed-in user's display name (mock). Used for personalized greetings (e.g. Da Vinci).
  const name = ref<string>('Ross Andrew Paquette')
  const firstName = computed(() => name.value.trim().split(/\s+/)[0] || name.value)

  // The signed-in user's own language (mock). One value behind the user-menu switch and the
  // profile setting, so the two cannot disagree. The prototype stores the choice; it does not
  // translate its copy.
  const language = ref<LanguageCode>('en-US')
  const currentLanguage = computed(() => LANGUAGES.find((entry) => entry.code === language.value) ?? LANGUAGES[0])

  function setLanguage(code: LanguageCode) {
    language.value = code
  }

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

  return { avatarUrl, hasAvatar, name, firstName, language, currentLanguage, setLanguage, setName, setAvatar, clearAvatar }
})
