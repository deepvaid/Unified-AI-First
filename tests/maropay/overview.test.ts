import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildScenario } from '../../src/maropay/scenarios.ts'
import { deriveBalances, moneyNow, storeNag } from '../../src/maropay/readiness.ts'
import { ATLAS, BETA, NOW, channelFacts, context } from './fixtures.ts'

test('where the money is: three buckets that add up to the balance, each saying what it is doing', () => {
  const state = buildScenario('m10', context())
  const balance = deriveBalances(state, NOW).find((b) => b.currency === 'USD')!
  const buckets = moneyNow(state, balance, NOW)
  assert.deepEqual(buckets.map((b) => b.key), ['settling', 'available', 'on_its_way'])
  assert.deepEqual(buckets.map((b) => b.amount), [balance.pending, balance.available, balance.inTransit])
  const settling = buckets[0]!
  if (balance.pending.amount > 0) assert.match(settling.caption, /^\d+ payments? · clears in 1–2 days$/)
  else assert.equal(settling.caption, 'Nothing settling')
  assert.equal(buckets[1]!.caption, balance.available.amount > 0 ? 'Goes out with the next payout' : 'Nothing to send')
  const disputed = buildScenario('m11', context())
  const disputedBalance = deriveBalances(disputed, NOW).find((b) => b.currency === 'USD')!
  if (disputedBalance.available.amount < 0) assert.equal(moneyNow(disputed, disputedBalance, NOW)[1]!.caption, 'Recovered from upcoming payments', 'a dispute can pull the balance below zero')
  const paused = buildScenario('m08', context())
  const pausedBalance = deriveBalances(paused, NOW).find((b) => b.currency === 'USD')!
  assert.equal(moneyNow(paused, pausedBalance, NOW)[1]!.caption, 'Held until payouts are fixed', 'payouts paused: available money waits')
})

test('the store still to move: named once another store is live, with its progress and gateway', () => {
  const two = buildScenario('m07', context())
  const nag = storeNag(two, NOW, channelFacts)!
  assert.equal(nag.channelId, BETA)
  assert.equal(nag.total, 7)
  assert.ok(nag.done < nag.total)
  assert.equal(storeNag(buildScenario('m10', context()), NOW, channelFacts), null, 'one store, live: nothing to nag about')
  assert.equal(storeNag(buildScenario('m15', context()), NOW, channelFacts), null, 'nothing live yet: the overview’s instruction covers it')
  assert.equal(storeNag(buildScenario('m05', context()), NOW, channelFacts), null)
  assert.ok(buildScenario('m07', context()).bindings.find((b) => b.channelId === ATLAS)?.activation === 'live')
})
