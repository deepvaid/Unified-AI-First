import { afterEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { GeminiError, generateReply, parseModelOutput } from '../../src/server/gemini.ts'

test('JSON as asked is parsed', () => {
  const out = parseModelOutput('{"reply":"Focus on Dyson.","speech":"Dyson.","card":{"headline":"H","description":"D"}}')
  assert.equal(out?.reply, 'Focus on Dyson.')
  assert.equal(out?.card?.headline, 'H')
})

test('a bare JSON string is the reply', () => {
  assert.equal(parseModelOutput('"Sure thing."')?.reply, 'Sure thing.')
})

test('prose (the model ignored the MIME type) is the reply', () => {
  assert.equal(parseModelOutput('Try a win-back journey.')?.reply, 'Try a win-back journey.')
})

test('truncated JSON is salvaged only when a whole reply string is recoverable', () => {
  assert.equal(parseModelOutput('{"reply":"Two things: restock \\"Aurora\\" and","speech":"Restock')?.reply, 'Two things: restock "Aurora" and')
  // The reply itself was cut off — nothing safe to show.
  assert.equal(parseModelOutput('{"reply":"Focus on your top sel'), null)
  assert.equal(parseModelOutput('{"speech":"Just speech"'), null)
})

test('non-object JSON is rejected', () => {
  assert.equal(parseModelOutput('[1,2,3]'), null)
  assert.equal(parseModelOutput('null'), null)
})

// ── generateReply against a fake upstream ──────────────────────────────────────
const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})

const upstream = (status: number, body: unknown) => async () =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), { status })
const modelText = (text: string) => ({ candidates: [{ content: { parts: [{ text }] } }] })

async function failure(promise: Promise<unknown>): Promise<GeminiError> {
  try {
    await promise
  } catch (err) {
    assert.ok(err instanceof GeminiError, String(err))
    return err
  }
  assert.fail('expected a GeminiError')
}

test('a rate-limited or overloaded provider reads as "busy" (429), not "offline"', async () => {
  for (const status of [429, 503]) {
    globalThis.fetch = upstream(status, { error: 'quota' }) as never
    assert.equal((await failure(generateReply('hi', { apiKey: 'k' }))).status, 429)
  }
  globalThis.fetch = upstream(500, { error: 'boom' }) as never
  assert.equal((await failure(generateReply('hi', { apiKey: 'k' }))).status, 502)
})

test('an upstream that never answers becomes a 504 instead of hanging the function', async () => {
  globalThis.fetch = (async () => {
    throw Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' })
  }) as never
  assert.equal((await failure(generateReply('hi', { apiKey: 'k' }))).status, 504)
})

test('the upstream call is bounded by a timeout signal', async () => {
  let signal: AbortSignal | null | undefined
  globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
    signal = init?.signal
    return new Response(JSON.stringify(modelText('{"reply":"ok"}')), { status: 200 })
  }) as never
  await generateReply('hi', { apiKey: 'k' })
  assert.ok(signal, 'fetch must be given a signal')
})

test('raw or truncated model output is never handed to the merchant', async () => {
  globalThis.fetch = upstream(200, modelText('{"reply":"Focus on your top sel')) as never
  assert.equal((await failure(generateReply('hi', { apiKey: 'k' }))).status, 502)

  globalThis.fetch = upstream(200, modelText('{"card":{"headline":"only a card","description":"x"}}')) as never
  assert.equal((await failure(generateReply('hi', { apiKey: 'k' }))).status, 502)

  globalThis.fetch = upstream(200, modelText('{"reply":"Restock the Aurora jacket.","speech":"Restock the jacket."}')) as never
  const ok = await generateReply('hi', { apiKey: 'k' })
  assert.equal(ok.reply, 'Restock the Aurora jacket.')
  assert.equal(ok.speech, 'Restock the jacket.')
})

// ── The browser client ───────────────────────────────────────────────────────
import { askGeminiResult } from '../../src/services/geminiClient.ts'

const okBody = { reply: 'Restock the jacket.', speech: 'Restock.', card: { headline: 'H', description: 'D' }, action: { label: 'Open products', routeName: 'Products' } }
const hangUntilAborted = (_url: unknown, init?: RequestInit) =>
  new Promise<Response>((_, reject) => {
    init?.signal?.addEventListener('abort', () => reject(init.signal?.reason ?? new DOMException('Aborted', 'AbortError')))
  })

test('client: a good reply comes back with its action', async () => {
  globalThis.fetch = (async () => new Response(JSON.stringify(okBody), { status: 200 })) as never
  const result = await askGeminiResult('hi')
  assert.ok(result.ok)
  assert.equal(result.ok && result.reply.action?.routeName, 'Products')
})

test('client: 429 and 504 are "busy"; other failures are "offline"', async () => {
  for (const [status, expected] of [[429, 'busy'], [504, 'busy'], [502, 'offline'], [503, 'offline']] as const) {
    globalThis.fetch = (async () => new Response('{}', { status })) as never
    const result = await askGeminiResult('hi')
    assert.deepEqual(result.ok ? null : result.failure, expected, String(status))
  }
  globalThis.fetch = (async () => { throw new TypeError('network down') }) as never
  const result = await askGeminiResult('hi')
  assert.deepEqual(result.ok ? null : result.failure, 'offline')
})

test('client: a request that never answers resolves as "busy" — the composer cannot hang', async () => {
  globalThis.fetch = hangUntilAborted as never
  const result = await askGeminiResult('hi', [], { timeoutMs: 30 })
  assert.deepEqual(result.ok ? null : result.failure, 'busy')
})

test('client: Stop is rethrown as an abort — it is not a timeout and not a failure card', async () => {
  globalThis.fetch = hangUntilAborted as never
  const stop = new AbortController()
  const pending = askGeminiResult('hi', [], { signal: stop.signal, timeoutMs: 5_000 })
  setTimeout(() => stop.abort(), 20)
  await assert.rejects(pending, (err: unknown) => err instanceof DOMException && err.name === 'AbortError')
})
