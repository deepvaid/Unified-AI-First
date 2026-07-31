import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createPinia, setActivePinia } from 'pinia'
import { expect, test } from 'playwright/test'
import {
  migrateLegacyCampaignSession,
  orderedTasksForGoal,
  useDaVinciOnboardingStore,
} from '../../src/stores/useDaVinciOnboarding'
import {
  MARKETING_TASK_IDS,
  STORE_TASK_IDS,
  migrateLegacyOnboardingState,
} from '../../src/stores/useOnboarding'
import { detectBothOrder, detectSetupGoal } from '../../src/composables/useDaVinciSetupOnboarding'

const ACCOUNT_ID = '2000290'
const EXPERIENCE_URL = `/accounts/${ACCOUNT_ID}/da-vinci/experience?onboarding=setup`
const SESSION_KEY = `mp.davinci.setup-onboarding.v1:${ACCOUNT_ID}`

test.describe('product onboarding state model', () => {
  test('uses deterministic setup stages and account-scoped sessions', () => {
    setActivePinia(createPinia())
    const store = useDaVinciOnboardingStore()
    const session = store.begin(ACCOUNT_ID, { restart: true })
    expect(session.stage).toBe('welcome')
    expect(session.accountId).toBe(ACCOUNT_ID)

    store.setStage('voice-consent')
    store.setInputMode('voice')
    store.setStage('goal-discovery')
    store.setGoal('marketing')
    expect(store.activeSession?.stage).toBe('plan-ready')
    expect(store.activeSession?.orderedTaskIds).toEqual([...MARKETING_TASK_IDS])

    store.setCurrentTask('sending-domain')
    store.markTaskHandoff('SettingsDnsSetup')
    expect(store.activeSession?.stage).toBe('task-handoff')

    store.setPaused(true)
    expect(store.activeSession?.stage).toBe('paused')
    store.setPaused(false)
    expect(store.activeSession?.stage).toBe('task-handoff')
  })

  test('orders Marketing, Store, and Both without model-generated routes', () => {
    expect(orderedTasksForGoal('marketing')).toEqual([...MARKETING_TASK_IDS])
    expect(orderedTasksForGoal('store')).toEqual([...STORE_TASK_IDS])
    expect(orderedTasksForGoal('both', 'store-first')).toEqual([...STORE_TASK_IDS, ...MARKETING_TASK_IDS])
    expect(detectSetupGoal('I want to launch a newsletter')).toBe('marketing')
    expect(detectSetupGoal('Help me build my shop')).toBe('store')
    expect(detectSetupGoal('I need marketing and a store')).toBe('both')
    expect(detectBothOrder('Let’s launch email first')).toBe('marketing-first')
  })

  test('migrates both legacy stores without carrying draft context', () => {
    const migrated = migrateLegacyCampaignSession({
      accountId: ACCOUNT_ID,
      stage: 'draft',
      draftId: 42,
      brief: { objective: 'Share a newsletter' },
      contextBrief: { audience: 'VIPs' },
      inputMode: 'text',
    }, ACCOUNT_ID)
    expect(migrated.goal).toBe('marketing')
    expect(migrated.currentTaskId).toBe('sending-domain')
    expect(migrated.legacyCampaignMigrated).toBe(true)
    expect('draftId' in migrated).toBe(false)
    expect('brief' in migrated).toBe(false)

    expect(migrateLegacyOnboardingState({
      completed: { 'first-product': true },
      skipped: { shipping: true },
    })).toMatchObject({ 'first-product': 'verified', shipping: 'skipped' })
  })

  test('keeps mutation stores and arbitrary router calls out of the setup guide', async () => {
    const implementation = await readFile(
      path.resolve(process.cwd(), 'src/composables/useDaVinciSetupOnboarding.ts'),
      'utf8',
    )
    expect(implementation).not.toContain('useCampaignsStore')
    expect(implementation).not.toContain('useCommerceStore')
    expect(implementation).not.toMatch(/\b(create|save|send|publish)Campaign\s*\(/)
    expect(implementation).not.toContain('router.push')
  })
})

test.describe('voice-first setup experience', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear()
      const micMode = new URL(window.location.href).searchParams.get('mic')
      if (new URL(window.location.href).searchParams.get('legacy') === '1') {
        localStorage.setItem('mp.davinci.campaign-onboarding.v2:2000290', JSON.stringify({
          accountId: '2000290', stage: 'draft', draftId: 77, inputMode: 'text',
          brief: { objective: 'Share a newsletter' },
          startedAt: '2026-07-01T00:00:00.000Z', updatedAt: '2026-07-01T00:00:00.000Z',
        }))
      }
      if (micMode !== 'unsupported') {
        Object.defineProperty(window, 'SpeechRecognition', {
          configurable: true,
          value: class {
            interimResults = false; continuous = false; maxAlternatives = 1; lang = 'en-US'
            start() {}; stop() {}; abort() {}
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
            if (micMode === 'deny') throw new DOMException('Permission denied', 'NotAllowedError')
            return { getTracks: () => [{ stop() {} }] }
          },
        },
      })
      ;(window as typeof window & { __micRequests?: number }).__micRequests = 0
    })
  })

  test('shows Voice, Type, and Explore without autoplay or permission', async ({ page }) => {
    await page.goto(EXPERIENCE_URL)
    await expect(page.getByRole('heading', { name: /Meet Da Vinci/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start with voice' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Type instead' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Explore Maropost' }).last()).toBeVisible()
    await expect(page.getByText(/Microphone off until you choose voice/i)).toBeVisible()
    await expect.poll(() => page.evaluate(() => (window as typeof window & { __micRequests?: number }).__micRequests ?? 0)).toBe(0)

    await page.getByRole('button', { name: 'Start with voice' }).click()
    await expect(page.getByRole('heading', { name: 'Use voice with Da Vinci' })).toBeVisible()
    await expect(page.getByText(/Raw audio is not retained/i)).toBeVisible()
    await expect.poll(() => page.evaluate(() => (window as typeof window & { __micRequests?: number }).__micRequests ?? 0)).toBe(0)
  })

  test('falls back to the same goal screen when microphone permission is denied', async ({ page }) => {
    await page.goto(`${EXPERIENCE_URL}&mic=deny`)
    await page.getByRole('button', { name: 'Start with voice' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('heading', { name: 'What do you want to launch?' })).toBeVisible()
    await expect(page.getByText(/permission was denied/i)).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Message Da Vinci' })).toBeVisible()
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), SESSION_KEY)
    expect(stored.inputMode).toBe('text')
    expect(stored.stage).toBe('goal-discovery')
  })

  test('disables voice and leaves typing available when recognition is unsupported', async ({ page }) => {
    await page.goto(`${EXPERIENCE_URL}&mic=unsupported`)
    await expect(page.getByRole('button', { name: 'Start with voice' })).toBeDisabled()
    await expect(page.getByText(/Voice input is unavailable/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Type instead' })).toBeEnabled()
  })

  test('builds a Marketing plan and opens the allowlisted first task', async ({ page }) => {
    await page.goto(EXPERIENCE_URL)
    await page.getByRole('button', { name: 'Type instead' }).click()
    await page.getByRole('button', { name: 'Launch email marketing' }).click()
    await expect(page.getByRole('heading', { name: 'Your setup path' })).toBeVisible()
    await page.getByRole('button', { name: 'Start first task' }).click()
    await expect(page.getByRole('heading', { name: 'Authenticate your sending domain' })).toBeVisible()
    await page.getByRole('button', { name: 'Set up DNS' }).click()
    await expect(page).toHaveURL(new RegExp(`/accounts/${ACCOUNT_ID}/settings/dns-setup[?]source=davinci-setup$`))
    await expect(page.getByText('Authenticate your sending domain').first()).toBeVisible()
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), SESSION_KEY)
    expect(stored.stage).toBe('task-handoff')
    expect(stored.currentTaskId).toBe('sending-domain')
  })

  test('supports Both ordering and preserves a clean mobile canvas', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(EXPERIENCE_URL)
    await page.getByRole('button', { name: 'Type instead' }).click()
    await page.getByRole('button', { name: 'Set up both' }).click()
    await page.getByRole('button', { name: 'Store first' }).click()
    await expect(page.getByText(/14-task path/i)).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), SESSION_KEY)
    expect(stored.goal).toBe('both')
    expect(stored.bothFirst).toBe('store-first')
    expect(stored.orderedTaskIds[0]).toBe('store-branding')
  })

  test('migrates a legacy campaign session to the first unresolved Marketing task', async ({ page }) => {
    await page.goto(`${EXPERIENCE_URL}&legacy=1`)
    await expect(page.getByRole('heading', { name: 'Authenticate your sending domain' })).toBeVisible()
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), SESSION_KEY)
    expect(stored.goal).toBe('marketing')
    expect(stored.currentTaskId).toBe('sending-domain')
    expect(stored.legacyCampaignMigrated).toBe(true)
    expect('draftId' in stored).toBe(false)
  })
})
