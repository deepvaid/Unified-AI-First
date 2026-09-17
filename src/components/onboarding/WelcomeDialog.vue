<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MpDialog from '@/components/MpDialog.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import { TRIAL_WORKSPACE_FALLBACK, useAccountsStore, type Account } from '@/stores/useAccounts'
import { useUserProfile } from '@/stores/useUserProfile'

/**
 * WelcomeDialog — the first thing a self-created trial account sees inside the
 * real app. Two optional fields: the person's name and a workspace label,
 * the latter suggested from the business email's domain. Saving acts on the
 * real account (AppBar identity, switcher, Da Vinci greeting), and both
 * Continue and Skip mark the account as welcomed so it never asks again.
 */
const props = defineProps<{ account: Account }>()

const accounts = useAccountsStore()
const profile = useUserProfile()

const owner = computed(() => props.account.owner ?? null)
const open = computed(() => !!owner.value && !owner.value.welcomedAt)

/** `maya@harbour-lights.example` → "Harbour Lights". Free-mail domains never reach here — signup rejects them. */
function workspaceFromEmail(email: string): string {
  const domain = email.split('@')[1] ?? ''
  const label = domain.split('.')[0] ?? ''
  return label
    .split(/[-_.]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const name = ref('')
const workspace = ref('')

watch(open, (isOpen) => {
  if (!isOpen || !owner.value) return
  name.value = owner.value.name ?? ''
  const current = props.account.name
  workspace.value = current && current !== TRIAL_WORKSPACE_FALLBACK ? current : workspaceFromEmail(owner.value.email)
}, { immediate: true })

function initialsOf(label: string): string {
  return label.trim().split(/\s+/).filter(Boolean).map(w => w[0]!.toUpperCase()).slice(0, 2).join('') || 'MP'
}

function finish(save: boolean) {
  if (!owner.value) return
  const welcomedAt = new Date().toISOString()
  if (!save) {
    accounts.updateAccount(props.account.id, { owner: { ...owner.value, welcomedAt } })
    return
  }
  const personName = name.value.trim() || null
  const workspaceName = workspace.value.trim()
  accounts.updateAccount(props.account.id, {
    owner: { ...owner.value, name: personName, welcomedAt },
    ...(workspaceName ? { name: workspaceName, initials: initialsOf(workspaceName) } : {}),
  })
  if (personName) profile.setName(personName)
}
</script>

<template>
  <MpDialog
    :model-value="open"
    size="sm"
    persistent
    title="Welcome to Maropost"
    subtitle="Two quick things so this workspace feels like yours."
    icon="sparkles"
    @update:model-value="(v: boolean) => { if (!v) finish(false) }"
  >
    <form novalidate @submit.prevent="finish(true)">
      <MpFormGrid :cols="1">
        <v-text-field
          v-model="name"
          label="Your name"
          placeholder="What should we call you?"
          autocomplete="name"
          hint="Shown in your profile and greetings. One word is fine."
          autofocus
        />
        <v-text-field
          v-model="workspace"
          label="Workspace name"
          autocomplete="organization"
          hint="Suggested from your email — change it to anything you like."
        />
      </MpFormGrid>
    </form>

    <template #footerStart>
      <v-btn variant="text" class="text-none" @click="finish(false)">Skip for now</v-btn>
    </template>
    <template #footer>
      <v-btn color="primary" variant="flat" class="text-none" append-icon="arrow-right" @click="finish(true)">Continue</v-btn>
    </template>
  </MpDialog>
</template>
