import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

// Who is signed in on a storefront, one shopper per store. Like the cart it lives
// for the browser tab (sessionStorage). Sign-in is mocked: the account page asks
// for an email and a code and accepts any six digits; a checkout signs its shopper in.

const KEY = 'mp.storefront.shopper.v1'

function read(): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? '{}')
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {}
  } catch {
    return {}
  }
}

export const useStorefrontShopperStore = defineStore('storefrontShopper', () => {
  const emails = ref<Record<string, string>>(read())

  watch(emails, (value) => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(value))
    } catch {
      // Storage blocked: the shopper stays signed in for this page view.
    }
  }, { deep: true })

  /** The signed-in shopper's email on a store, or null. */
  function emailFor(channelId: string): string | null {
    return emails.value[channelId] ?? null
  }

  function signIn(channelId: string, email: string): void {
    emails.value[channelId] = email.trim().toLowerCase()
  }

  function signOut(channelId: string): void {
    delete emails.value[channelId]
  }

  return { emailFor, signIn, signOut }
})
