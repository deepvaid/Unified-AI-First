import { computed } from 'vue'
import {
  ALL_ONBOARDING_TASKS,
  MARKETING_TASK_IDS,
  useOnboardingStore,
  type OnboardingGoal,
  type OnboardingTask,
} from '@/stores/useOnboarding'
import {
  useDaVinciOnboardingStore,
  type BothGoalOrder,
  type DaVinciInputMode,
} from '@/stores/useDaVinciOnboarding'
import type { SetupOnboardingProps } from '@/stores/useCopilot'
import type { DvIntentKind, DvQuickReply } from '@/composables/useDaVinciIntents'
import { trackDaVinciOnboardingEvent } from '@/composables/useDaVinciOnboardingAnalytics'

export interface SetupOnboardingResponse {
  intent: DvIntentKind
  reply: string
  speech?: string
  quickReplies?: DvQuickReply[]
  onboardingCard?: SetupOnboardingProps
}

export const SETUP_GOAL_REPLIES: DvQuickReply[] = [
  { label: 'Launch email marketing', value: 'Launch email marketing', icon: 'mail' },
  { label: 'Build my online store', value: 'Build my online store', icon: 'store' },
  { label: 'Set up both', value: 'Set up both', icon: 'sparkles' },
]

const BOTH_ORDER_REPLIES: DvQuickReply[] = [
  { label: 'Marketing first', value: 'Launch marketing first', icon: 'mail' },
  { label: 'Store first', value: 'Launch my store first', icon: 'store' },
]

export function detectSetupGoal(text: string): OnboardingGoal | 'ambiguous' | null {
  const normalized = text.toLowerCase()
  const both = /\b(both|everything|marketing and (a |my )?store|store and (email |marketing))\b/.test(normalized)
  const marketing = /\b(email|campaign|newsletter|marketing|contacts?|audience)\b/.test(normalized)
  const store = /\b(store|shop|commerce|product|sell|checkout)\b/.test(normalized)
  if (both || (marketing && store)) return 'both'
  if (marketing) return 'marketing'
  if (store) return 'store'
  return null
}

export function detectBothOrder(text: string): BothGoalOrder | null {
  const normalized = text.toLowerCase()
  if (/\b(marketing|email|campaign)\b/.test(normalized)) return 'marketing-first'
  if (/\b(store|shop|commerce|product)\b/.test(normalized)) return 'store-first'
  return null
}

function asksForMutation(text: string) {
  return /\b(do|make|fill|save|connect|publish|send|create|add|configure|authenticate)\b.{0,32}\b(for me|automatically|yourself|on my behalf)\b/i.test(text)
    || /^(do|make|save|publish|send|create|add|connect) (it|this|that)( for me)?[.! ]*$/i.test(text)
}

function isPause(text: string) {
  return /^(pause|stop|exit|not now|later|explore|no thanks)[.! ]*$/i.test(text.trim())
}

function isOffTopicQuestion(text: string) {
  if (/\b(setup|task|step|domain|tracking|list|contacts?|email|campaign|store|product|payments?|shipping|tax|theme)\b/i.test(text)) return false
  return /\?$/.test(text.trim()) || /^(what|how|why|when|where|who|can|could|is|are|show|tell)\b/i.test(text.trim())
}

function goalLabel(goal: OnboardingGoal | null) {
  if (goal === 'marketing') return 'email marketing'
  if (goal === 'store') return 'your online store'
  return 'marketing and your store'
}

export function useDaVinciSetupOnboarding() {
  const onboarding = useDaVinciOnboardingStore()
  const setup = useOnboardingStore()
  const session = computed(() => onboarding.activeSession)
  const currentTask = computed(() => setup.taskById(session.value?.currentTaskId))

  function activate(accountId: string) {
    if (setup.activeAccountId !== accountId) setup.activateAccount(accountId)
    const active = onboarding.begin(accountId)
    onboarding.syncTaskStatuses(setup.taskStatuses)
    return active
  }

  function currentPlanTasks() {
    const ids = session.value?.orderedTaskIds ?? []
    return ids.flatMap((id) => {
      const definition = setup.taskById(id)
      return definition ? [definition] : []
    })
  }

  function firstUnresolvedTask(tasks = currentPlanTasks()) {
    return tasks.find(({ id }) => !setup.isResolved(id)) ?? null
  }

  function syncCurrentTask() {
    const active = session.value
    if (!active?.goal || !active.orderedTaskIds.length) return null
    onboarding.syncTaskStatuses(setup.taskStatuses)
    const unresolved = firstUnresolvedTask()
    if (unresolved && active.currentTaskId !== unresolved.id) onboarding.setCurrentTask(unresolved.id)
    if (!unresolved) onboarding.setCurrentTask(null, 'milestone-complete')
    return unresolved
  }

  function progressFor(task: OnboardingTask | null = currentTask.value) {
    const tasks = currentPlanTasks()
    const index = task ? tasks.findIndex(({ id }) => id === task.id) : tasks.length
    return { step: Math.max(1, index + 1), total: Math.max(1, tasks.length) }
  }

  function goalPrompt(prefix = 'What would you like to get live first?'): SetupOnboardingResponse {
    return {
      intent: 'fallback',
      reply: prefix,
      speech: prefix,
      quickReplies: SETUP_GOAL_REPLIES,
      onboardingCard: {
        kind: 'goal', title: 'Choose your first milestone',
        description: 'Da Vinci will guide one setup task at a time. You make every change.',
        step: 1, totalSteps: 1,
      },
    }
  }

  function bothOrderPrompt(): SetupOnboardingResponse {
    return {
      intent: 'fallback',
      reply: 'Great — which milestone should go live first?',
      speech: 'Which milestone should go live first?',
      quickReplies: BOTH_ORDER_REPLIES,
      onboardingCard: {
        kind: 'goal', title: 'Choose what goes live first',
        description: 'We will finish that path, celebrate the milestone, then continue with the other.',
        step: 1, totalSteps: 1,
      },
    }
  }

  function planResponse(): SetupOnboardingResponse {
    const active = session.value
    if (!active?.goal) return goalPrompt()
    const tasks = currentPlanTasks()
    const unresolved = firstUnresolvedTask(tasks)
    if (unresolved) onboarding.setCurrentTask(unresolved.id, 'plan-ready')
    trackDaVinciOnboardingEvent('plan_generated', active.accountId, {
      goal: active.goal,
      taskCount: tasks.length,
      firstTaskId: unresolved?.id ?? null,
    })
    return {
      intent: 'fallback',
      reply: `I’ve mapped a ${tasks.length}-task path for ${goalLabel(active.goal)}. We’ll take it one step at a time.`,
      speech: `Your setup path is ready. We will take it one step at a time.`,
      onboardingCard: {
        kind: 'plan', title: 'Your setup path',
        description: unresolved ? `First: ${unresolved.title}` : 'Every task in this path is already resolved.',
        step: 1, totalSteps: tasks.length,
        items: tasks.slice(0, 3).map((task) => ({
          id: task.id, label: task.title, status: setup.statusFor(task.id), minutes: task.minutes,
        })),
        primaryAction: unresolved
          ? { label: 'Start first task', action: 'start-current-task', icon: 'arrow-right' }
          : { label: 'View setup tasks', action: 'view-all-tasks', icon: 'list-checks' },
        secondaryAction: { label: 'Change goal', action: 'change-goal', icon: 'refresh-cw' },
      },
    }
  }

  function taskResponse(task = currentTask.value, prefix?: string): SetupOnboardingResponse {
    if (!task) return milestoneResponse()
    onboarding.setCurrentTask(task.id, 'task-intro')
    const { step, total } = progressFor(task)
    trackDaVinciOnboardingEvent('task_started', session.value!.accountId, { taskId: task.id, step, total })
    const blockedPrerequisites = task.prerequisites.filter((id) => !setup.isResolved(id))
    const blocked = blockedPrerequisites.length > 0
    if (blocked) setup.block(task.id)
    return {
      intent: 'fallback',
      reply: prefix ?? (blocked
        ? `Before ${task.title.toLowerCase()}, finish ${setup.taskById(blockedPrerequisites[0])?.title.toLowerCase() ?? 'the earlier setup step'}.`
        : `${task.title}. ${task.description}`),
      speech: blocked ? 'There is one earlier setup step to finish first.' : `${task.title}. I’ll guide you on the page.`,
      onboardingCard: {
        kind: 'task', title: task.title, description: task.why,
        taskId: task.id, status: setup.statusFor(task.id), step, totalSteps: total,
        primaryAction: blocked
          ? { label: 'Review earlier task', action: 'start-current-task', icon: 'arrow-right' }
          : { label: task.cta, action: `open-task:${task.id}`, icon: 'arrow-up-right' },
        secondaryAction: { label: 'Skip for now', action: 'skip-current-task', icon: 'redo-2' },
      },
    }
  }

  function verificationResponse(): SetupOnboardingResponse {
    const task = currentTask.value
    if (!task) return milestoneResponse()
    const status = setup.statusFor(task.id)
    const { step, total } = progressFor(task)
    if (status === 'verified' || status === 'user-confirmed') return advanceAfterResolution(task)
    onboarding.setStage('verifying')
    trackDaVinciOnboardingEvent('task_verification_result', session.value!.accountId, {
      taskId: task.id, result: status,
    })
    return {
      intent: 'fallback',
      reply: `I can’t verify ${task.title.toLowerCase()} from product state yet. If you finished it, you can confirm that manually.`,
      speech: 'I cannot verify that yet. You can confirm it manually if you finished it.',
      onboardingCard: {
        kind: 'verification', title: 'Could not verify this task',
        description: 'Manual confirmation is shown separately from product-verified completion.',
        taskId: task.id, status, step, totalSteps: total,
        primaryAction: { label: 'I completed this', action: 'confirm-current-task', icon: 'circle-check' },
        secondaryAction: { label: 'Return to task', action: `open-task:${task.id}`, icon: 'arrow-up-right' },
      },
    }
  }

  function isPathBoundary(completedTask: OnboardingTask, nextTask: OnboardingTask | null) {
    const active = session.value
    if (active?.goal !== 'both' || !nextTask) return false
    const completedInMarketing = (MARKETING_TASK_IDS as readonly string[]).includes(completedTask.id)
    const nextInMarketing = (MARKETING_TASK_IDS as readonly string[]).includes(nextTask.id)
    return completedInMarketing !== nextInMarketing
  }

  function advanceAfterResolution(completedTask = currentTask.value): SetupOnboardingResponse {
    if (!completedTask) return milestoneResponse()
    onboarding.syncTaskStatuses(setup.taskStatuses)
    const next = firstUnresolvedTask()
    const active = session.value!
    if (next) onboarding.setCurrentTask(next.id, isPathBoundary(completedTask, next) ? 'milestone-complete' : 'task-complete')
    else onboarding.setCurrentTask(null, 'milestone-complete')

    if (!next || isPathBoundary(completedTask, next)) {
      trackDaVinciOnboardingEvent('milestone_completed', active.accountId, {
        goal: (MARKETING_TASK_IDS as readonly string[]).includes(completedTask.id) ? 'marketing' : 'store',
        hasNextPath: !!next,
      })
      return milestoneResponse(next)
    }

    const { step, total } = progressFor(next)
    return {
      intent: 'fallback',
      reply: `${completedTask.title} is ${setup.statusFor(completedTask.id) === 'verified' ? 'verified' : 'confirmed'}. Next: ${next.title}.`,
      speech: `Done. Next is ${next.title}.`,
      onboardingCard: {
        kind: 'complete', title: 'Task complete', description: `Next: ${next.title}`,
        taskId: next.id, status: setup.statusFor(completedTask.id), step, totalSteps: total,
        primaryAction: { label: 'Continue', action: 'start-current-task', icon: 'arrow-right' },
        secondaryAction: { label: 'Pause setup', action: 'pause-setup', icon: 'pause' },
      },
    }
  }

  function milestoneResponse(next = currentTask.value): SetupOnboardingResponse {
    const active = session.value
    const hasNextPath = active?.goal === 'both' && !!next
    return {
      intent: 'fallback',
      reply: hasNextPath
        ? `Your first milestone is ready. Next, we can set up ${next.area === 'store' ? 'your store' : 'email marketing'}.`
        : `You’ve finished the guided path for ${goalLabel(active?.goal ?? null)}.`,
      speech: hasNextPath ? 'Your first milestone is ready. Shall we continue?' : 'Your guided setup path is complete.',
      onboardingCard: {
        kind: 'complete', title: hasNextPath ? 'First milestone complete' : 'Setup milestone complete',
        description: hasNextPath ? `Next: ${next!.title}` : 'Recommended next: set up your support inbox. Every remaining task is available in Get Started.',
        step: active?.orderedTaskIds.length ?? 1, totalSteps: active?.orderedTaskIds.length ?? 1,
        primaryAction: hasNextPath
          ? { label: 'Start the next path', action: 'start-next-path', icon: 'arrow-right' }
          : { label: 'Go to dashboard', action: 'explore-dashboard', icon: 'layout-dashboard' },
        secondaryAction: { label: 'View all setup tasks', action: 'view-all-tasks', icon: 'list-checks' },
      },
    }
  }

  function start(accountId: string, inputMode: DaVinciInputMode): SetupOnboardingResponse {
    const active = activate(accountId)
    onboarding.setInputMode(inputMode)
    if (active.legacyCampaignMigrated && active.goal) return resume()
    onboarding.setStage('goal-discovery')
    return goalPrompt('What do you want to get live first?')
  }

  function chooseGoal(goal: OnboardingGoal) {
    onboarding.setGoal(goal)
    trackDaVinciOnboardingEvent('goal_selected', session.value!.accountId, { goal })
    return goal === 'both' ? bothOrderPrompt() : planResponse()
  }

  function chooseBothOrder(order: BothGoalOrder) {
    onboarding.setBothOrder(order)
    trackDaVinciOnboardingEvent('goal_selected', session.value!.accountId, { goal: 'both', order })
    return planResponse()
  }

  function confirmCurrent(): SetupOnboardingResponse {
    const task = currentTask.value
    if (!task) return milestoneResponse()
    setup.confirm(task.id)
    onboarding.syncTaskStatuses(setup.taskStatuses)
    trackDaVinciOnboardingEvent('task_user_confirmed', session.value!.accountId, { taskId: task.id })
    return advanceAfterResolution(task)
  }

  function skipCurrent(): SetupOnboardingResponse {
    const task = currentTask.value
    if (!task) return milestoneResponse()
    setup.skip(task.id)
    onboarding.syncTaskStatuses(setup.taskStatuses)
    trackDaVinciOnboardingEvent('task_skipped', session.value!.accountId, { taskId: task.id })
    return advanceAfterResolution(task)
  }

  let pauseNotice: SetupOnboardingResponse | null = null

  function pause(): SetupOnboardingResponse {
    const active = session.value!
    onboarding.setPaused(true)
    trackDaVinciOnboardingEvent('onboarding_paused', active.accountId, { taskId: active.currentTaskId })
    return {
      intent: 'fallback', reply: 'Setup is paused. Your progress is saved for this account.',
      speech: 'Setup is paused. Your progress is saved.',
      quickReplies: [{ label: 'Continue setup', value: 'Continue setup', icon: 'play' }],
    }
  }

  function consumePauseNotice() {
    const notice = pauseNotice
    pauseNotice = null
    return notice
  }

  function resume(): SetupOnboardingResponse {
    const active = session.value
    if (!active) return goalPrompt()
    if (active.stage === 'paused') {
      onboarding.setPaused(false)
      trackDaVinciOnboardingEvent('onboarding_resumed', active.accountId, { taskId: active.currentTaskId })
    }
    onboarding.syncTaskStatuses(setup.taskStatuses)
    if (!active.goal) {
      onboarding.setStage('goal-discovery')
      return goalPrompt('Welcome back. What do you want to get live first?')
    }
    if (active.goal === 'both' && !active.bothFirst) return bothOrderPrompt()
    const task = syncCurrentTask()
    if (!task) return milestoneResponse()
    return taskResponse(task, `Welcome back. You’re on ${task.title.toLowerCase()}.`)
  }

  function handleText(text: string): SetupOnboardingResponse | null {
    const active = session.value
    const trimmed = text.trim()
    if (!active || active.stage === 'complete' || !trimmed) return null

    if (asksForMutation(trimmed)) {
      trackDaVinciOnboardingEvent('unsupported_action_requested', active.accountId, {
        stage: active.stage, taskId: active.currentTaskId,
      })
      return {
        intent: 'fallback',
        reply: 'I can guide you and verify progress, but I can’t enter, save, publish, or send anything. You stay in control on the product page.',
        speech: 'I can guide you, but I cannot make product changes for you.',
        onboardingCard: {
          kind: 'unsupported', title: 'Guidance only',
          description: 'Da Vinci can explain the page and point to the next step. Only you can make changes.',
          step: progressFor().step, totalSteps: progressFor().total,
          primaryAction: currentTask.value
            ? { label: currentTask.value.cta, action: `open-task:${currentTask.value.id}`, icon: 'arrow-up-right' }
            : { label: 'View setup tasks', action: 'view-all-tasks', icon: 'list-checks' },
        },
      }
    }

    if (isPause(trimmed)) return pause()
    if (active.stage === 'paused' && /\b(continue|resume)\b/i.test(trimmed)) return resume()

    if (/\b(change|switch|different)\b.*\b(goal|plan)|\bstart over\b/i.test(trimmed)) {
      onboarding.setStage('goal-discovery')
      return goalPrompt('What should we focus on instead?')
    }

    if (active.stage === 'goal-discovery' && active.goal === 'both' && !active.bothFirst) {
      const order = detectBothOrder(trimmed)
      return order ? chooseBothOrder(order) : bothOrderPrompt()
    }

    if (active.stage === 'welcome' || active.stage === 'voice-consent' || active.stage === 'goal-discovery') {
      const goal = detectSetupGoal(trimmed)
      return goal && goal !== 'ambiguous'
        ? chooseGoal(goal)
        : goalPrompt('I didn’t catch a single goal. Choose one, or describe what you want to launch.')
    }

    if (active.stage === 'plan-ready' && /\b(start|begin|continue|yes|ready|first task)\b/i.test(trimmed)) {
      return taskResponse(syncCurrentTask())
    }
    if (/\b(skip)\b/i.test(trimmed)) return skipCurrent()
    if (/\b(done|finished|complete|completed|recheck|check again|verify)\b/i.test(trimmed)) return verificationResponse()
    if (/\b(open|start|go to|take me)\b/i.test(trimmed) && currentTask.value) return taskResponse(currentTask.value)

    if (isOffTopicQuestion(trimmed)) {
      onboarding.setPaused(true)
      pauseNotice = {
        intent: 'fallback', reply: 'Setup is paused while we handle that. Say “continue setup” when you’re ready.',
        quickReplies: [{ label: 'Continue setup', value: 'Continue setup', icon: 'play' }],
      }
      return null
    }

    return taskResponse(currentTask.value, `For this step, ${currentTask.value?.description.toLowerCase() ?? 'choose a setup goal first.'}`)
  }

  function handleAction(action: string): SetupOnboardingResponse | null {
    if (action === 'goal-marketing') return chooseGoal('marketing')
    if (action === 'goal-store') return chooseGoal('store')
    if (action === 'goal-both') return chooseGoal('both')
    if (action === 'both-marketing-first') return chooseBothOrder('marketing-first')
    if (action === 'both-store-first') return chooseBothOrder('store-first')
    if (action === 'start-current-task' || action === 'start-next-path') return taskResponse(syncCurrentTask())
    if (action === 'verify-current-task') return verificationResponse()
    if (action === 'confirm-current-task') return confirmCurrent()
    if (action === 'skip-current-task') return skipCurrent()
    if (action === 'pause-setup') return pause()
    if (action === 'change-goal') {
      onboarding.setStage('goal-discovery')
      return goalPrompt('What should we focus on instead?')
    }
    return null
  }

  function routeForAction(action: string): string | null {
    if (action === 'view-all-tasks') return 'GetStarted'
    if (action === 'explore-dashboard') return 'Dashboard'
    const requestedId = action.startsWith('open-task:') ? action.slice('open-task:'.length) : null
    if (!requestedId) return null
    const definition = ALL_ONBOARDING_TASKS.find(({ id }) => id === requestedId)
    return definition?.routeName ?? null
  }

  function markHandoff(action: string) {
    const routeName = routeForAction(action)
    if (!routeName) return null
    onboarding.markTaskHandoff(routeName)
    trackDaVinciOnboardingEvent('task_handoff_opened', session.value!.accountId, {
      taskId: currentTask.value?.id ?? null, routeName,
    })
    return routeName
  }

  return {
    session, currentTask, currentPlanTasks, progressFor,
    start, resume, handleText, handleAction, consumePauseNotice,
    routeForAction, markHandoff, verificationResponse, syncCurrentTask,
  }
}
