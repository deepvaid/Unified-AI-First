import { computed } from 'vue'
import {
  useOnboardingStore,
  type OnboardingTask,
  type SetupGoal,
} from '@/stores/useOnboarding'
import { useDaVinciSetupStore, type SetupEntry } from '@/stores/useDaVinciSetup'
import type { DaVinciInputMode } from '@/stores/useDaVinciOnboarding'
import type { SetupOnboardingProps } from '@/stores/useCopilot'
import { usePlgStore, PLAN_CATALOG, type PlgCloud, type PlanTier } from '@/stores/usePlg'
import { trackDaVinciOnboardingEvent } from '@/composables/useDaVinciOnboardingAnalytics'
import type { DvIntentKind, DvQuickReply } from '@/composables/useDaVinciIntents'

// Da Vinci guided setup — the post-signup / post-checkout onboarding
// conversation. Guide-only by design: Da Vinci explains, answers questions,
// and deep-links to product pages; it never creates, saves, publishes, or
// sends anything. Same stage-machine shape as useDaVinciCampaignOnboarding.

export interface SetupOnboardingResponse {
  intent: DvIntentKind
  reply: string
  speech?: string
  quickReplies?: DvQuickReply[]
  setupCard?: SetupOnboardingProps
  /** The host should leave the conversation and land the user on the dashboard. */
  exitToDashboard?: boolean
}

export const SETUP_GOAL_REPLIES: DvQuickReply[] = [
  { label: 'Launch email marketing', value: 'Launch email marketing', icon: 'mail' },
  { label: 'Set up my online store', value: 'Set up my online store', icon: 'store' },
  { label: 'Both', value: 'Set up both', icon: 'sparkles' },
  { label: 'Support customers', value: 'Support customers', icon: 'headset' },
  { label: 'Just explore', value: 'Just explore', icon: 'compass' },
]

const CONTINUE_REPLY: DvQuickReply = { label: 'Continue setup', value: 'Continue setup', icon: 'play' }

const CLOUD_PITCH: Record<PlgCloud, string> = {
  marketing: 'Marketing Cloud for email and automation',
  commerce: 'Commerce Cloud for your online store',
  retail: 'Retail Cloud for in-store selling',
  service: 'Service Cloud for customer support',
}

export function detectSetupGoal(text: string): SetupGoal | null {
  const normalized = text.toLowerCase()
  if (/\b(explore|look around|browse|skip|nothing|not sure|later)\b/.test(normalized)) return 'explore'
  const both = /\b(both|everything|marketing and (a |my )?store|store and (email |marketing))\b/.test(normalized)
  const marketing = /\b(email|campaign|newsletter|marketing|contacts?|audience)\b/.test(normalized)
  const store = /\b(store|shop|commerce|product|sell|checkout)\b/.test(normalized)
  const service = /\b(support|service|tickets?|help ?desk|customers? (service|support))\b/.test(normalized)
  if (both || (marketing && store)) return 'both'
  if (marketing) return 'marketing'
  if (store) return 'store'
  if (service) return 'service'
  return null
}

/** "Do it for me" asks — Da Vinci refuses these and offers the page instead. */
function asksForMutation(text: string) {
  return /\b(do|make|fill|save|connect|publish|send|create|add|configure|authenticate|set)\b.{0,32}\b(for me|automatically|yourself|on my behalf)\b/i.test(text)
    || /^(do|make|save|publish|send|create|add|connect) (it|this|that)( for me)?[.! ]*$/i.test(text)
}

function isPause(text: string) {
  return /^(pause|stop|exit|not now|no thanks|(maybe )?later)[.! ]*$/i.test(text.trim())
}

/** Questions about anything other than the setup itself pause the flow so the
 *  normal assistant (Gemini) can answer — same idiom as the campaign wizard. */
function isOffTopic(text: string) {
  if (/\b(setup|task|step|domain|tracking|list|contacts?|import|campaign|store|product|payments?|shipping|tax(es)?|theme|inbox|ticket)\b/i.test(text)) return false
  return /\?\s*$/.test(text.trim())
    || /^(what|how|why|when|where|who|which|can|could|is|are|show|tell)\b/i.test(text.trim())
}

function goalLabel(goal: SetupGoal | null) {
  if (goal === 'marketing') return 'email marketing'
  if (goal === 'store') return 'your online store'
  if (goal === 'service') return 'customer support'
  if (goal === 'both') return 'marketing and your store'
  return 'your account'
}

function cloudsLabel(clouds: Set<PlgCloud>) {
  if (clouds.size === 1) {
    const [cloud] = clouds
    if (cloud === 'marketing') return 'email marketing'
    if (cloud === 'commerce' || cloud === 'retail') return 'your online store'
    if (cloud === 'service') return 'customer support'
  }
  return 'your plan'
}

/** "a 6-task path" vs "an 8-task path" — counts whose spoken form starts with a vowel. */
function countArticle(n: number) {
  return n === 8 || n === 11 || n === 18 || (n >= 80 && n <= 89) ? 'an' : 'a'
}

function planTierName(cloud: PlgCloud, tier: PlanTier): string {
  const catalog = PLAN_CATALOG.find((c) => c.cloud === cloud)
  const plan = catalog?.plans.find((p) => p.tier === tier)
  return plan ? `${catalog!.name} ${plan.name}` : catalog?.name ?? cloud
}

function joinList(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? ''
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

/** Drawer follow-up spoken when Da Vinci lands with the user on a task page. */
export function setupHandoffFollowText(task: OnboardingTask | null): string {
  if (!task) return 'I’m with you. Tell me when you’re done here, or ask me anything about this page.'
  return `I’m with you — this page is where you ${task.description.charAt(0).toLowerCase()}${task.description.slice(1).replace(/\.$/, '')}. Tell me when you’re done, or ask me anything as you go.`
}

export function useDaVinciSetupOnboarding() {
  const setup = useDaVinciSetupStore()
  const guide = useOnboardingStore()
  const plg = usePlgStore()

  const session = computed(() => setup.activeSession)
  const currentTask = computed(() => guide.taskById(session.value?.currentTaskId))

  function firstUnresolvedTask(): OnboardingTask | null {
    return guide.planTasks.find((t) => !guide.isResolved(t.id)) ?? null
  }

  function syncCurrentTask(): OnboardingTask | null {
    const active = session.value
    if (!active) return null
    const unresolved = firstUnresolvedTask()
    if (unresolved && active.currentTaskId !== unresolved.id) setup.setCurrentTask(unresolved.id)
    return unresolved
  }

  function progressFor(task: OnboardingTask | null = currentTask.value) {
    const tasks = guide.planTasks
    const index = task ? tasks.findIndex(({ id }) => id === task.id) : tasks.length
    return { step: Math.max(1, index + 1), total: Math.max(1, tasks.length) }
  }

  // ── Overview + goal discovery ──────────────────────────────────────────────

  function trialOverviewText(): { reply: string; speech: string } {
    const clouds = [...guide.planClouds].map((cloud) => CLOUD_PITCH[cloud])
    const cloudLine = joinList(clouds)
    return {
      reply: `Here’s the lay of the land: your ${plg.daysLeft}-day trial includes ${cloudLine}. I’ll point you to the right pages and explain each step — you make every change; I never save, publish, or send anything. So — what do you want to get working first?`,
      speech: `You have ${plg.daysLeft} days of Marketing, Commerce, and Service Cloud. What do you want to get working first?`,
    }
  }

  function paidOverviewText(): { reply: string; speech: string } {
    const tiers = Object.entries(plg.active.tiers) as [PlgCloud, PlanTier][]
    const names = tiers.map(([cloud, tier]) => planTierName(cloud, tier))
    const planLine = names.length ? joinList(names) : 'your Maropost plan'
    return {
      reply: `Payment confirmed — your plan is live: ${planLine}. Let’s get it earning its keep. I’ve lined up the setup tasks for what you bought — I’ll guide each one and take you to the right page; you make every change.`,
      speech: 'Your plan is live. I’ve lined up your setup path — we’ll take it one step at a time.',
    }
  }

  function goalPrompt(prefix?: string): SetupOnboardingResponse {
    setup.setStage('goal-discovery')
    const overview = trialOverviewText()
    return {
      intent: 'fallback',
      reply: prefix ?? overview.reply,
      speech: prefix ?? overview.speech,
      quickReplies: SETUP_GOAL_REPLIES,
      setupCard: {
        kind: 'goal',
        title: 'Choose your first milestone',
        description: 'Da Vinci guides one setup task at a time. You make every change.',
        step: 1,
        totalSteps: 1,
      },
    }
  }

  function start(
    accountId: string,
    inputMode: DaVinciInputMode,
    options: { entry?: SetupEntry } = {},
  ): SetupOnboardingResponse {
    const active = setup.begin(accountId, options.entry ? { entry: options.entry } : {})
    setup.setInputMode(inputMode)

    // Re-purchases and finished accounts should not be re-onboarded.
    if (guide.allResolved && guide.totalCount > 0) {
      setup.complete()
      return {
        intent: 'fallback',
        reply: 'You’re already set up — every task in your setup path is done. From here it’s all growth. The Get Started guide in the sidebar keeps the full list.',
        speech: 'You’re already set up. From here it’s all growth.',
        setupCard: {
          kind: 'complete',
          title: 'Setup complete',
          step: guide.totalCount,
          totalSteps: guide.totalCount,
          primaryAction: { label: 'Go to dashboard', action: 'explore-dashboard', icon: 'layout-dashboard' },
          secondaryAction: { label: 'View all setup tasks', action: 'view-all-tasks', icon: 'list-checks' },
        },
      }
    }

    // Paid accounts (checkout entry, or any non-trial): plan derives from the
    // purchased clouds — no goal question.
    if (active.entry === 'checkout' || !plg.isTrial) {
      const overview = paidOverviewText()
      return planResponse(overview.reply, overview.speech)
    }

    // Mid-flight resume (user came back with a goal already chosen).
    if (guide.goal && guide.goal !== 'explore') return resume()

    return goalPrompt()
  }

  function chooseGoal(goal: SetupGoal): SetupOnboardingResponse {
    const active = session.value
    guide.setGoal(goal)
    if (active) trackDaVinciOnboardingEvent('goal_selected', active.accountId, { goal })
    if (goal === 'explore') {
      setup.complete()
      return {
        intent: 'fallback',
        reply: 'Enjoy the look around. Your Get Started guide lives in the sidebar with everything worth doing, and I’m in the top right whenever you want me.',
        speech: 'Enjoy the look around. I’m in the top right whenever you want me.',
        exitToDashboard: true,
      }
    }
    return planResponse()
  }

  // ── Plan + task loop ───────────────────────────────────────────────────────

  function planResponse(prefix?: string, prefixSpeech?: string): SetupOnboardingResponse {
    const active = session.value
    const tasks = guide.planTasks
    const unresolved = firstUnresolvedTask()
    if (unresolved) setup.setCurrentTask(unresolved.id, 'plan-ready')
    else setup.setStage('plan-ready')
    const minutes = tasks.filter((t) => !guide.isResolved(t.id)).reduce((sum, t) => sum + t.minutes, 0)
    if (active) {
      trackDaVinciOnboardingEvent('plan_generated', active.accountId, {
        goal: guide.goal, taskCount: tasks.length, firstTaskId: unresolved?.id ?? null,
      })
    }
    const planFor = plg.isTrial ? goalLabel(guide.goal) : cloudsLabel(guide.planClouds)
    const planLine = `I’ve mapped ${countArticle(tasks.length)} ${tasks.length}-task path for ${planFor} — about ${minutes} minutes all up. We’ll take it one at a time${unresolved ? `; first up: ${unresolved.title.toLowerCase()}` : ''}.`
    return {
      intent: 'fallback',
      reply: prefix ? `${prefix} ${planLine}` : planLine,
      speech: prefixSpeech ?? 'Your setup path is ready. We’ll take it one step at a time.',
      setupCard: {
        kind: 'plan',
        title: 'Your setup path',
        description: unresolved ? `First: ${unresolved.title}` : 'Every task in this path is already resolved.',
        step: 1,
        totalSteps: Math.max(1, tasks.length),
        items: tasks.slice(0, 3).map((task) => ({
          id: task.id, label: task.title, status: guide.statusFor(task.id), minutes: task.minutes,
        })),
        primaryAction: unresolved
          ? { label: 'Start first task', action: 'start-current-task', icon: 'arrow-right' }
          : { label: 'View setup tasks', action: 'view-all-tasks', icon: 'list-checks' },
        secondaryAction: plg.isTrial
          ? { label: 'Change goal', action: 'change-goal', icon: 'refresh-cw' }
          : { label: 'View all tasks', action: 'view-all-tasks', icon: 'list-checks' },
      },
    }
  }

  function taskResponse(task: OnboardingTask | null = currentTask.value, prefix?: string): SetupOnboardingResponse {
    if (!task) return completeResponse()
    setup.setCurrentTask(task.id, 'task-intro')
    const { step, total } = progressFor(task)
    const active = session.value
    if (active) trackDaVinciOnboardingEvent('task_started', active.accountId, { taskId: task.id, step, total })
    const blockedPrereq = (task.prerequisites ?? []).find((id) => !guide.isResolved(id))
    const prereqTask = guide.taskById(blockedPrereq)
    return {
      intent: 'fallback',
      reply: prefix ?? (prereqTask
        ? `Before ${task.title.toLowerCase()}, let’s finish ${prereqTask.title.toLowerCase()} — it only takes about ${prereqTask.minutes} minutes.`
        : `${task.title} — ${task.description} ${task.why} It takes about ${task.minutes} minutes.`),
      speech: prereqTask
        ? 'There’s one earlier step to finish first.'
        : `${task.title}. I’ll take you there and stay with you.`,
      setupCard: {
        kind: 'task',
        title: prereqTask ? prereqTask.title : task.title,
        description: prereqTask ? prereqTask.why : task.why,
        taskId: prereqTask ? prereqTask.id : task.id,
        status: guide.statusFor(prereqTask ? prereqTask.id : task.id),
        step,
        totalSteps: total,
        primaryAction: prereqTask
          ? { label: prereqTask.cta, action: `open-task:${prereqTask.id}`, icon: 'arrow-up-right' }
          : { label: task.cta, action: `open-task:${task.id}`, icon: 'arrow-up-right' },
        secondaryAction: { label: 'Skip for now', action: 'skip-current-task', icon: 'redo-2' },
      },
    }
  }

  function verificationResponse(): SetupOnboardingResponse {
    const task = currentTask.value
    if (!task) return completeResponse()
    if (guide.completed[task.id]) return advanceAfterResolution(task)
    setup.setStage('verifying')
    const { step, total } = progressFor(task)
    return {
      intent: 'fallback',
      reply: `I can’t verify ${task.title.toLowerCase()} from product state yet. If you’ve finished it, confirm below and we’ll move on.`,
      speech: 'I can’t verify that yet. If you finished it, confirm and we’ll move on.',
      setupCard: {
        kind: 'verification',
        title: 'Couldn’t verify this task',
        description: 'Manual confirmation is tracked separately from product-verified completion.',
        taskId: task.id,
        status: guide.statusFor(task.id),
        step,
        totalSteps: total,
        primaryAction: { label: 'I completed this', action: 'confirm-current-task', icon: 'circle-check' },
        secondaryAction: { label: 'Back to the task', action: `open-task:${task.id}`, icon: 'arrow-up-right' },
      },
    }
  }

  function confirmCurrent(): SetupOnboardingResponse {
    const task = currentTask.value
    if (!task) return completeResponse()
    guide.confirm(task.id)
    const active = session.value
    if (active) trackDaVinciOnboardingEvent('task_user_confirmed', active.accountId, { taskId: task.id })
    return advanceAfterResolution(task)
  }

  function skipCurrent(): SetupOnboardingResponse {
    const task = currentTask.value
    if (!task) return completeResponse()
    guide.skip(task.id)
    const active = session.value
    if (active) trackDaVinciOnboardingEvent('task_skipped', active.accountId, { taskId: task.id })
    return advanceAfterResolution(task)
  }

  function isCloudBoundary(completedTask: OnboardingTask, nextTask: OnboardingTask | null) {
    return guide.goal === 'both' && !!nextTask && completedTask.cloud !== nextTask.cloud
  }

  function advanceAfterResolution(completedTask: OnboardingTask): SetupOnboardingResponse {
    const next = firstUnresolvedTask()
    const active = session.value
    if (!next) {
      if (active) setup.setCurrentTask(null)
      return completeResponse()
    }
    if (isCloudBoundary(completedTask, next)) {
      setup.setCurrentTask(next.id, 'milestone-complete')
      if (active) {
        trackDaVinciOnboardingEvent('milestone_completed', active.accountId, {
          cloud: completedTask.cloud, hasNextPath: true,
        })
      }
      return milestoneResponse(completedTask, next)
    }
    setup.setCurrentTask(next.id, 'plan-ready')
    const { step, total } = progressFor(next)
    const verified = guide.statusFor(completedTask.id) === 'verified'
    const resolvedWord = guide.statusFor(completedTask.id) === 'skipped' ? 'skipped' : verified ? 'verified' : 'confirmed'
    return {
      intent: 'fallback',
      reply: `${completedTask.title} is ${resolvedWord}. Next up: ${next.title.toLowerCase()} — about ${next.minutes} minutes.`,
      speech: `Done. Next is ${next.title}.`,
      setupCard: {
        kind: 'complete',
        title: resolvedWord === 'skipped' ? 'Task skipped' : 'Task complete',
        description: `Next: ${next.title}`,
        taskId: next.id,
        status: guide.statusFor(completedTask.id),
        step,
        totalSteps: total,
        primaryAction: { label: 'Continue', action: 'start-current-task', icon: 'arrow-right' },
        secondaryAction: { label: 'Pause setup', action: 'pause-setup', icon: 'pause' },
      },
    }
  }

  function milestoneResponse(completedTask: OnboardingTask, next: OnboardingTask): SetupOnboardingResponse {
    const finishedPath = completedTask.cloud === 'marketing' ? 'Email marketing is ready to work' : 'Your store path is done'
    const nextPath = next.cloud === 'commerce' ? 'open your store' : next.cloud === 'marketing' ? 'get your email marketing live' : 'set up customer support'
    const { total } = progressFor(next)
    return {
      intent: 'fallback',
      reply: `That’s your first milestone — ${finishedPath.toLowerCase()}. Next we can ${nextPath}. Shall we keep going?`,
      speech: 'Your first milestone is done. Shall we keep going?',
      setupCard: {
        kind: 'complete',
        title: 'First milestone complete',
        description: `Next: ${next.title}`,
        taskId: next.id,
        step: progressFor(next).step,
        totalSteps: total,
        primaryAction: { label: 'Keep going', action: 'start-current-task', icon: 'arrow-right' },
        secondaryAction: { label: 'Pause setup', action: 'pause-setup', icon: 'pause' },
      },
    }
  }

  function completeResponse(): SetupOnboardingResponse {
    const active = session.value
    if (active && active.stage !== 'complete') {
      setup.complete()
      trackDaVinciOnboardingEvent('onboarding_completed', active.accountId, {
        done: guide.doneCount, skipped: guide.skippedCount,
      })
    }
    const skippedNote = guide.skippedCount
      ? ` ${guide.doneCount} done, ${guide.skippedCount} skipped — the skipped ones stay in Get Started whenever you want them.`
      : ''
    return {
      intent: 'fallback',
      reply: `That’s your whole setup path.${skippedNote} Anything else worth doing lives in Get Started in the sidebar. From here it’s all growth.`,
      speech: 'That’s your whole setup path. From here it’s all growth.',
      setupCard: {
        kind: 'complete',
        title: 'Setup complete',
        description: 'Your account is ready to work.',
        step: Math.max(1, guide.totalCount),
        totalSteps: Math.max(1, guide.totalCount),
        primaryAction: { label: 'Go to dashboard', action: 'explore-dashboard', icon: 'layout-dashboard' },
        secondaryAction: { label: 'View all setup tasks', action: 'view-all-tasks', icon: 'list-checks' },
      },
    }
  }

  // ── Pause / resume ─────────────────────────────────────────────────────────

  /** One-time notice for the host to show when the flow paused itself for an off-topic question. */
  let pauseNotice: SetupOnboardingResponse | null = null

  function consumePauseNotice(): SetupOnboardingResponse | null {
    const notice = pauseNotice
    pauseNotice = null
    return notice
  }

  function pause(): SetupOnboardingResponse {
    const active = session.value
    if (active && active.stage !== 'paused') {
      setup.setPaused(true)
      trackDaVinciOnboardingEvent('onboarding_paused', active.accountId, { taskId: active.currentTaskId })
    }
    return {
      intent: 'fallback',
      reply: 'No problem — setup is paused and your progress is saved. Say “continue setup” whenever you’re ready, or pick up any task from Get Started in the sidebar.',
      speech: 'Setup is paused. Your progress is saved.',
      quickReplies: [CONTINUE_REPLY],
    }
  }

  function resume(): SetupOnboardingResponse {
    const active = session.value
    if (!active) return goalPrompt()
    if (active.stage === 'paused') {
      setup.setPaused(false)
      trackDaVinciOnboardingEvent('onboarding_resumed', active.accountId, { taskId: active.currentTaskId })
    }
    if (plg.isTrial && (!guide.goal || guide.goal === 'explore')) {
      return goalPrompt('Welcome back. What do you want to get working first?')
    }
    const task = syncCurrentTask()
    if (!task) return completeResponse()
    if (session.value?.stage === 'plan-ready') return planResponse('Welcome back.')
    return taskResponse(task, `Welcome back — you’re on ${task.title.toLowerCase()}. ${task.why}`)
  }

  // ── Text + card action dispatch ────────────────────────────────────────────

  function unsupportedResponse(): SetupOnboardingResponse {
    const active = session.value
    if (active) {
      trackDaVinciOnboardingEvent('unsupported_action_requested', active.accountId, {
        stage: active.stage, taskId: active.currentTaskId,
      })
    }
    const { step, total } = progressFor()
    return {
      intent: 'fallback',
      reply: 'I can guide you and keep track of progress, but I can’t enter, save, publish, or send anything — you stay in control on the product page. I can take you straight there.',
      speech: 'I can guide you, but I can’t make changes for you. I can take you to the page.',
      setupCard: {
        kind: 'unsupported',
        title: 'Guidance only',
        description: 'Da Vinci explains each step and points to the right page. Only you make changes.',
        step,
        totalSteps: total,
        primaryAction: currentTask.value
          ? { label: currentTask.value.cta, action: `open-task:${currentTask.value.id}`, icon: 'arrow-up-right' }
          : { label: 'View setup tasks', action: 'view-all-tasks', icon: 'list-checks' },
      },
    }
  }

  function handleText(text: string): SetupOnboardingResponse | null {
    const active = session.value
    const trimmed = text.trim()
    if (!active || active.stage === 'complete' || !trimmed) return null

    if (asksForMutation(trimmed)) return unsupportedResponse()

    // Paused: only an explicit continue re-enters; everything else falls
    // through to the normal assistant.
    if (active.stage === 'paused') {
      if (/\b(continue|resume)\b/i.test(trimmed)) return resume()
      return null
    }

    if (isPause(trimmed)) return pause()

    if (/\b(change|switch|different)\b.*\b(goal|plan|focus)|\bstart over\b/i.test(trimmed)) {
      if (plg.isTrial) return goalPrompt('What should we focus on instead?')
      return planResponse()
    }

    if (active.stage === 'welcome' || active.stage === 'goal-discovery') {
      if (!plg.isTrial) return planResponse()
      const goal = detectSetupGoal(trimmed)
      return goal
        ? chooseGoal(goal)
        : goalPrompt('I didn’t catch a single goal there — pick one below, or tell me what you want to launch.')
    }

    // Command checks are anchored to the start of the message so question
    // phrasing ("what is a good email open percentage?") never trips them.
    if (/^skip\b/i.test(trimmed)) return skipCurrent()
    if (/^(i'?m )?(done|finished|completed?|all set)\b|^(recheck|check again|verify)\b/i.test(trimmed)) {
      return verificationResponse()
    }

    if (active.stage === 'plan-ready' && /\b(start|begin|continue|yes|ready|first task)\b|^go\b/i.test(trimmed)) {
      return taskResponse(syncCurrentTask())
    }
    if (active.stage === 'milestone-complete' && /\b(continue|keep going|yes|next)\b|^go\b/i.test(trimmed)) {
      return taskResponse(syncCurrentTask())
    }
    if (/^(open|take me|go to|show me)\b/i.test(trimmed) && currentTask.value) {
      return taskResponse(currentTask.value)
    }

    // Questions and other-topic asks pause the flow; the host's normal
    // assistant answers them (host shows the pause notice once).
    if (isOffTopic(trimmed)) {
      setup.setPaused(true)
      pauseNotice = {
        intent: 'fallback',
        reply: 'Setup is paused while we handle that — say “continue setup” whenever you’re ready.',
        quickReplies: [CONTINUE_REPLY],
      }
      return null
    }

    const task = currentTask.value
    return task
      ? taskResponse(task, `For this step: ${task.description} ${task.why}`)
      : planResponse()
  }

  function handleAction(action: string): SetupOnboardingResponse | null {
    if (action === 'start-current-task') return taskResponse(syncCurrentTask())
    if (action === 'confirm-current-task') return confirmCurrent()
    if (action === 'skip-current-task') return skipCurrent()
    if (action === 'pause-setup') return pause()
    if (action === 'change-goal') {
      return plg.isTrial ? goalPrompt('What should we focus on instead?') : planResponse()
    }
    return null
  }

  /** Deep-link targets for card actions — the host performs the navigation. */
  function routeForAction(action: string): string | null {
    if (action === 'view-all-tasks') return 'GetStarted'
    if (action === 'explore-dashboard') return 'Dashboard'
    const taskId = action.startsWith('open-task:') ? action.slice('open-task:'.length) : null
    if (!taskId) return null
    return guide.taskById(taskId)?.routeName ?? null
  }

  /** Records the handoff + analytics; returns the route name for the host to push. */
  function markHandoff(action: string): string | null {
    const routeName = routeForAction(action)
    if (!routeName) return null
    const active = session.value
    if (active && action.startsWith('open-task:')) {
      const taskId = action.slice('open-task:'.length)
      if (taskId !== active.currentTaskId) setup.setCurrentTask(taskId)
      setup.markTaskHandoff(routeName)
      trackDaVinciOnboardingEvent('task_handoff_opened', active.accountId, { taskId, routeName })
    }
    return routeName
  }

  /** Called by host watchers when a product hook verifies the current task. */
  function onTaskAutoCompleted(taskId: string): SetupOnboardingResponse | null {
    const active = session.value
    if (!active || active.stage === 'complete' || active.stage === 'paused') return null
    if (active.currentTaskId !== taskId) return null
    const task = guide.taskById(taskId)
    if (!task) return null
    trackDaVinciOnboardingEvent('task_completed', active.accountId, { taskId, verified: true })
    const response = advanceAfterResolution(task)
    return {
      ...response,
      reply: `Nice work — ${task.title.toLowerCase()} is verified. ${response.reply}`,
      speech: `That’s done. ${response.speech ?? ''}`.trim(),
    }
  }

  return {
    session,
    currentTask,
    progressFor,
    start,
    chooseGoal,
    planResponse,
    taskResponse,
    verificationResponse,
    confirmCurrent,
    skipCurrent,
    pause,
    resume,
    handleText,
    handleAction,
    consumePauseNotice,
    routeForAction,
    markHandoff,
    onTaskAutoCompleted,
  }
}
