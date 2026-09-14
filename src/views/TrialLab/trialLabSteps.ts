import type { VariantConfig } from '@/stores/trialLabData'
import type { TrialFamily } from './trialLabRoutes'

/**
 * Step labels shown above each onboarding card. Verification is a step only
 * when it blocks entry — in C/D the user can move on while the email is on
 * its way, and the steps row says so. The real journey (/signup) ends at the
 * goal and opens the workspace, so it has no "First task" step.
 */
export function stepLabelsFor(config: VariantConfig, family: TrialFamily = 'lab'): string[] {
  const steps = [config.signupForm === 'classic' ? 'Your details' : 'Create account']
  if (config.verifyBeforeEntry) steps.push('Verify email')
  if (config.askNamesEarly) steps.push('About you')
  steps.push('Choose a goal')
  if (family === 'lab') steps.push('First task')
  return steps
}

export function stepIndexFor(config: VariantConfig, step: 'signup' | 'verify' | 'names' | 'goal' | 'task', family: TrialFamily = 'lab'): number {
  const labels = stepLabelsFor(config, family)
  const map = { signup: config.signupForm === 'classic' ? 'Your details' : 'Create account', verify: 'Verify email', names: 'About you', goal: 'Choose a goal', task: 'First task' }
  const idx = labels.indexOf(map[step])
  return idx === -1 ? 1 : idx + 1
}
