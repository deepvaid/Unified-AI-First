import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createPinia, setActivePinia } from 'pinia'
import { expect, test } from 'playwright/test'
import {
  migrateDaVinciOnboardingSession,
  useDaVinciOnboardingStore,
  type CampaignContextBrief,
  type CampaignReadinessItem,
} from '../../src/stores/useDaVinciOnboarding'

const ACCOUNT_ID = '2000290'
const EXPERIENCE_URL = `/accounts/${ACCOUNT_ID}/da-vinci/experience?onboarding=campaign`
const SESSION_KEY = `mp.davinci.campaign-onboarding.v2:${ACCOUNT_ID}`

const checkedAt = '2026-07-31T09:00:00.000Z'
const readiness: CampaignReadinessItem[] = [
  {
    id: 'domain',
    label: 'Sending domain',
    description: 'Current state is unavailable.',
    status: 'unknown',
    routeName: 'SettingsDnsSetup',
    actionLabel: 'Check DNS setup',
    checkedAt,
  },
]
const contextBrief: CampaignContextBrief = {
  channel: 'Email',
  objective: 'Promote an offer',
  audience: 'VIP Customer Circle',
  readinessSummary: '1 setup item needs attention',
  nextSteps: ['Review sending domain', 'Complete the campaign in the builder'],
  createdAt: checkedAt,
}

test.describe('onboarding state model', () => {
  test('progresses through the guide-only states without a draft identifier', () => {
    setActivePinia(createPinia())
    const store = useDaVinciOnboardingStore()

    const session = store.begin(ACCOUNT_ID, { restart: true, freshAccount: true })
    expect(session.stage).toBe('choice')

    store.setStage('voice-consent')
    store.setInputMode('voice')
    store.setStage('objective')
    store.setObjective('Promote an offer')
    expect(store.activeSession?.stage).toBe('audience')

    store.setAudience({ kind: 'list', id: 3, name: 'VIP Customer Circle', count: 312 })
    store.setReadiness(readiness)
    expect(store.activeSession?.stage).toBe('readiness')

    store.setContextBrief(contextBrief)
    expect(store.activeSession?.stage).toBe('brief-ready')
    expect('draftId' in (store.activeSession ?? {})).toBe(false)

    store.markPrerequisiteHandoff('SettingsDnsSetup')
    expect(store.activeSession?.stage).toBe('prerequisite-handoff')
    store.markBuilderHandoff()
    expect(store.activeSession?.stage).toBe('builder-handoff')

    store.setPaused(true)
    expect(store.activeSession?.stage).toBe('paused')
    store.setPaused(false)
    expect(store.activeSession?.stage).toBe('builder-handoff')

    store.complete()
    expect(store.activeSession?.stage).toBe('complete')
  })

  test('migrates legacy draft sessions without retaining or acting on the draft id', () => {
    const migrated = migrateDaVinciOnboardingSession({
      accountId: ACCOUNT_ID,
      stage: 'draft',
      draftId: 42,
      brief: {
        objective: 'Share a newsletter',
        audience: null,
      },
      readiness: [{
        ...readiness[0],
        status: 'needs-setup',
      }],
    }, ACCOUNT_ID)

    expect(migrated.stage).toBe('brief-ready')
    expect(migrated.legacyDraftIgnored).toBe(true)
    expect(migrated.readiness[0]?.status).toBe('needs-attention')
    expect('draftId' in migrated).toBe(false)
  })

  test('keeps campaign mutation APIs out of the onboarding implementation', async () => {
    const implementation = await readFile(
      path.resolve(process.cwd(), 'src/composables/useDaVinciCampaignOnboarding.ts'),
      'utf8',
    )
    expect(implementation).not.toContain('useCampaignsStore')
    expect(implementation).not.toMatch(/\bcreateCampaign\s*\(/)
    expect(implementation).not.toMatch(/\bcreateDraft\s*\(/)
  })
})

test.describe('voice-first choice and guided browser flow', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (error) => {
      console.error(`[browser page error] ${error.message}`)
    })
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('davinci-onboarding-test-ready')) {
        localStorage.clear()
        sessionStorage.setItem('davinci-onboarding-test-ready', '1')
      }
      const micMode = new URL(window.location.href).searchParams.get('mic')
      if (new URL(window.location.href).searchParams.get('legacy') === '1') {
        localStorage.setItem(`mp.davinci.campaign-onboarding.v1:2000290`, JSON.stringify({
          accountId: '2000290',
          stage: 'draft',
          draftId: 77,
          inputMode: 'text',
          brief: { objective: 'Share a newsletter', audience: null },
          readiness: [],
          startedAt: '2026-07-01T00:00:00.000Z',
          updatedAt: '2026-07-01T00:00:00.000Z',
        }))
      }
      if (micMode !== 'unsupported') {
        Object.defineProperty(window, 'SpeechRecognition', {
          configurable: true,
          value: class {
            interimResults = false
            continuous = false
            maxAlternatives = 1
            lang = 'en-US'
            start() {}
            stop() {}
            abort() {}
          },
        })
      } else {
        Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: undefined })
        Object.defineProperty(window, 'webkitSpeechRecognition', { configurable: true, value: undefined })
      }
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: async () => {
            const state = window as typeof window & { __micRequests?: number }
            state.__micRequests = (state.__micRequests ?? 0) + 1
            if (micMode === 'deny') throw new DOMException('Permission denied for test', 'NotAllowedError')
            return { getTracks: () => [{ stop() {} }] }
          },
        },
      })
      ;(window as typeof window & { __micRequests?: number }).__micRequests = 0
    })
  })

  test('shows all three choices without requesting or playing voice', async ({ page }) => {
    await page.goto(EXPERIENCE_URL)

    await expect(page.getByRole('heading', { name: 'Shape your first campaign with Da Vinci.' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start with voice' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue by typing' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Explore Maropost' })).toBeVisible()
    await expect(page.getByText(/cannot create, edit, schedule, or send a campaign/i)).toBeVisible()
    await expect.poll(() => page.evaluate(() => (
      window as typeof window & { __micRequests?: number }
    ).__micRequests ?? 0)).toBe(0)

    await page.getByRole('button', { name: 'Start with voice' }).click()
    await expect(page.getByRole('button', { name: 'Allow microphone and start' })).toBeVisible()
    await expect(page.getByText(/Raw audio is not retained/i)).toBeVisible()
    await expect.poll(() => page.evaluate(() => (
      window as typeof window & { __micRequests?: number }
    ).__micRequests ?? 0)).toBe(0)
  })

  test('falls back to the same text journey when microphone permission is denied', async ({ page }) => {
    await page.goto(`${EXPERIENCE_URL}&mic=deny`)
    await page.getByRole('button', { name: 'Start with voice' }).click()
    await page.getByRole('button', { name: 'Allow microphone and start' }).click()

    await expect(page.locator('#main-content').getByText(/Microphone access is blocked/i)).toBeVisible()
    await expect(page.locator('#main-content').getByText('First, what should this campaign achieve?')).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Message Da Vinci' })).toBeFocused()
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), SESSION_KEY)
    expect(stored.inputMode).toBe('text')
    expect(stored.stage).toBe('objective')
  })

  test('disables voice when speech recognition is unavailable', async ({ page }) => {
    await page.goto(`${EXPERIENCE_URL}&mic=unsupported`)

    await expect(page.getByRole('button', { name: 'Start with voice' })).toBeDisabled()
    await expect(page.getByText(/Voice input is unavailable in this browser/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue by typing' })).toBeEnabled()
  })

  test('supports keyboard-only text entry on mobile with reduced motion', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(EXPERIENCE_URL)

    const textChoice = page.getByRole('button', { name: 'Continue by typing' })
    await textChoice.focus()
    await expect(textChoice).toBeFocused()
    await page.keyboard.press('Enter')

    const composer = page.getByRole('textbox', { name: 'Message Da Vinci' })
    await expect(composer).toBeFocused()
    await expect(page.locator('#main-content').getByText('First, what should this campaign achieve?')).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await expect.poll(() => page.locator('.dvx__turn').first().evaluate(
      (element) => getComputedStyle(element).animationName,
    )).toBe('none')
  })

  test('completes the same discovery through text and opens an empty builder', async ({ page }) => {
    await page.goto(EXPERIENCE_URL)
    await page.getByRole('button', { name: 'Continue by typing' }).click()

    await expect(page.locator('#main-content').getByText('First, what should this campaign achieve?')).toBeVisible()
    await page.getByRole('button', { name: 'Promote an offer' }).click()
    await page.getByRole('button', { name: 'VIP Customer Circle' }).click()

    await expect(page.locator('#main-content').getByText(/Checked just now/i).first()).toBeVisible()
    await page.getByRole('button', { name: 'Review campaign brief' }).click()

    await expect(page.locator('#main-content').getByText(/Nothing has been created, saved, scheduled, or sent/i)).toBeVisible()
    await page.getByRole('button', { name: 'Open campaign builder' }).click()

    await expect(page).toHaveURL(new RegExp(`/accounts/${ACCOUNT_ID}/campaigns/new\\?source=davinci$`))
    await expect(page.getByRole('heading', { name: 'New Email Campaign' })).toBeVisible()
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), SESSION_KEY)
    expect(stored.stage).toBe('builder-handoff')
    expect('draftId' in stored).toBe(false)
  })

  test('restores the conversation and campaign stage after refresh', async ({ page }) => {
    await page.goto(EXPERIENCE_URL)
    await page.getByRole('button', { name: 'Continue by typing' }).click()
    await page.getByRole('button', { name: 'Promote an offer' }).click()
    await expect(page.getByText(/Who should receive it/i)).toBeVisible()

    await page.reload()

    await expect(page.locator('#main-content .dvx__turn--user').getByText('Promote an offer', { exact: true })).toBeVisible()
    await expect(page.getByText(/Who should receive it/i)).toBeVisible()
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), SESSION_KEY)
    expect(stored.stage).toBe('audience')
  })

  test('explains unsupported campaign actions instead of claiming completion', async ({ page }) => {
    await page.goto(EXPERIENCE_URL)
    await page.getByRole('button', { name: 'Continue by typing' }).click()
    const composer = page.getByRole('textbox', { name: 'Message Da Vinci' })
    await composer.fill('Create and send the campaign for me')
    await composer.press('Enter')

    await expect(page.getByText('You stay in control of campaign actions')).toBeVisible()
    await expect(page.getByText(/I can’t create, schedule, or send it for you/i)).toBeVisible()
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), SESSION_KEY)
    expect(stored.stage).toBe('objective')
    expect('draftId' in stored).toBe(false)
  })

  test('pauses onboarding when the user explores and keeps Da Vinci available', async ({ page }) => {
    await page.goto(EXPERIENCE_URL)
    await page.getByRole('button', { name: 'Explore Maropost' }).click()

    await expect(page).toHaveURL(new RegExp(`/accounts/${ACCOUNT_ID}/dashboard$`))
    await expect(page.getByText('Da Vinci').first()).toBeVisible()
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), SESSION_KEY)
    expect(stored.stage).toBe('paused')
    expect(stored.resumeStage).toBe('choice')
  })

  test('migrates a browser-stored legacy draft session into a non-mutating brief', async ({ page }) => {
    await page.goto(`${EXPERIENCE_URL}&legacy=1`)
    await expect(page.locator('#main-content').getByText('Your campaign brief', { exact: true })).toBeVisible()
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), SESSION_KEY)
    expect(stored.stage).toBe('brief-ready')
    expect(stored.legacyDraftIgnored).toBe(true)
    expect('draftId' in stored).toBe(false)
  })
})
