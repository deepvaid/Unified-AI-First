import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { assistantReply } from '../../src/chatbot/storeAssistant.ts'
import { fingerprint, runCorpus } from './wellnessCorpus.ts'

// The Vitaheal assistant answers exactly as it did before the apparel profile
// existed (commit 7d9f70f3): every turn of the corpus, in every context, has the
// same replies, links, cards and state. The fixture keeps a fingerprint of each
// turn, and the words of the guest turns and the chats so a change reads plainly.
// If a wellness answer is meant to change, regenerate the fixture from the new
// code on purpose and say so in the commit.

const fixture = JSON.parse(readFileSync(new URL('./fixtures/wellness-replies.json', import.meta.url), 'utf8')) as Record<string, { says?: string[]; sha: string }>

test('the wellness store answers every question exactly as before', () => {
  const now = runCorpus(assistantReply)
  assert.deepEqual(Object.keys(now), Object.keys(fixture), 'the corpus itself changed')
  for (const [key, turn] of Object.entries(now)) {
    const was = fixture[key]!
    const is = fingerprint(turn)
    if (was.says) assert.deepEqual(is.says, was.says, key)
    assert.equal(is.sha, was.sha, `${key}: ${is.says.join(' | ')}`)
  }
})

test('the corpus asks the wellness store a clothing store’s questions too', () => {
  const now = runCorpus(assistantReply)
  // No size, fabric or allergy answer reaches a wellness store: an allergy gets its doctor answer.
  assert.match(now['guest · I’m allergic to wool']!.replies[0]!.text, /doctor or pharmacist/)
  assert.equal(now['guest · between M and L']!.state.productId, undefined)
})
