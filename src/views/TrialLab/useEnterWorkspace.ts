import { useRouter } from 'vue-router'
import { useAccountsStore } from '@/stores/useAccounts'
import { useOnboardingStore, type SetupGoal } from '@/stores/useOnboarding'
import { usePlgStore } from '@/stores/usePlg'
import { useUserProfile } from '@/stores/useUserProfile'
import { useTrialLabStore } from '@/stores/useTrialLab'
import type { TrialGoal, TrialVariant } from '@/stores/trialLabData'

/**
 * The bridge from the lab into the real app. Creates a genuine trial account
 * with the same handoff the PLG signup uses (SignupView.enterMaropost), then
 * lands on Get started with the real AppBar and sidebar.
 *
 * Order matters: `useOnboarding` seeds "lived-in" statuses for any unknown
 * account the moment it becomes active, so `reset()` must run AFTER `switchTo`.
 * Idempotent — a run that already entered just switches back to its account.
 */
const GOAL_MAP: Record<TrialGoal, SetupGoal> = { marketing: 'marketing', commerce: 'store', service: 'service' }

export function useEnterWorkspace() {
  const router = useRouter()
  const store = useTrialLabStore()
  const accounts = useAccountsStore()
  const plg = usePlgStore()
  const onboarding = useOnboardingStore()
  const profile = useUserProfile()

  async function enterWorkspace(variant: TrialVariant): Promise<boolean> {
    const run = store.run(variant)
    if (!run?.account.verifiedAt) return false

    let id = run.accountId
    if (!id || !accounts.accounts.some(a => a.id === id)) {
      id = plg.createTrialAccount({
        firstName: '',
        lastName: '',
        email: run.account.email ?? '',
        companyName: store.workspaceLabel(store.activeWorkspace(variant)),
        ownerName: run.account.personName,
      })
      accounts.switchTo(id)
      onboarding.reset()
      if (run.goal) onboarding.setGoal(GOAL_MAP[run.goal])
    } else {
      accounts.switchTo(id)
    }

    // Da Vinci greets by first name; a user who gave none is "there", never a guess from the email.
    profile.setName(run.account.personName ?? 'there')
    store.linkAccount(variant, id)
    store.recordEvent(variant, 'workspace_entered', { variant })
    await router.push({ name: 'GetStarted', params: { accountId: id } })
    return true
  }

  return { enterWorkspace }
}
