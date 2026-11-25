import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ASSISTANT_PROFILES, DEFAULT_ASSISTANT_PROFILE, assistantProfile } from '../../src/chatbot/assistantProfiles.ts'
import { assistantReply } from '../../src/chatbot/storeAssistant.ts'
import type { AssistantContext } from '../../src/chatbot/storeAssistant.ts'
import { VITAHEAL_CHATBOT, vitahealProducts } from '../../src/storefront/vitahealDemo.ts'

const ctx: AssistantContext = {
  email: null,
  orders: [],
  subscriptions: [],
  products: vitahealProducts().map((p) => ({ id: p.id, name: p.name, subtitle: p.detail!.subtitle, description: p.detail!.description, collections: p.collections })),
  entries: VITAHEAL_CHATBOT.knowledgeSources!.flatMap((s) => (s.entries ?? []).map((e) => ({ ...e, source: s.name }))),
  shoppingEnabled: true,
  trackingEnabled: true,
  demo: true,
}

test('a chatbot that names no profile answers as the wellness store it always was', () => {
  assert.equal(DEFAULT_ASSISTANT_PROFILE, 'wellness')
  assert.equal(assistantProfile().id, 'wellness')
  assert.equal(assistantProfile(null).id, 'wellness')
  assert.equal(assistantProfile('wellness'), ASSISTANT_PROFILES.wellness)
})

test('naming the wellness profile changes no answer', () => {
  const messages = ['Hi', 'I can’t sleep', 'What do you recommend?', 'Can I take this while pregnant?', 'any offers right now?', 'asdf qwerty', 'What is your return policy?']
  for (const message of messages) {
    assert.deepEqual(assistantReply(message, { ...ctx, profile: 'wellness' }), assistantReply(message, ctx), message)
  }
})

test('every profile there is has a need, a careful answer, and links within the store', () => {
  assert.deepEqual(Object.keys(ASSISTANT_PROFILES), ['wellness', 'apparel', 'auto-parts', 'home', 'supplements'])
  for (const [id, profile] of Object.entries(ASSISTANT_PROFILES)) {
    assert.equal(profile!.id, id)
    assert.ok(profile!.needs.length, id)
    assert.ok(profile!.caution.text, id)
    for (const link of [profile!.noPromotion.link, profile!.noSubscription.link]) assert.match(link.href, /^\/[a-z]/, id)
  }
})
