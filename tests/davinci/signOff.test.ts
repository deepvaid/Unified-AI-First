import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isSignOff } from '../../src/davinci/phrases.ts'

test('a spoken goodbye ends the hands-free session; anything with a request in it does not', () => {
  const table: Array<[string, boolean]> = [
    ["Thanks, that's all", true],
    ["thanks that's all", true], // dictation drops the comma
    ["Okay thanks, that's it for now", true],
    ["That's everything for today, thank you", true],
    ['Goodbye', true],
    ['Bye Da Vinci', true],
    ['Thank you Da Vinci, goodbye.', true],
    ["I'm done", true],
    ['Stop listening', true],
    ['End the conversation', true],
    // A thank-you alone keeps the mic open — the merchant may have more to ask.
    ['Thanks', false],
    ['Thank you so much', false],
    // Requests and questions that merely contain a goodbye word.
    ["That's all the revenue?", false],
    ["Is that all?", false],
    ["I'm done with the campaign, now show revenue", false],
    ['Stop listening to my competitors', false],
    ['Say goodbye to lapsed customers with a win-back journey', false],
    ["How's revenue this week?", false],
  ]
  for (const [text, expected] of table) assert.equal(isSignOff(text), expected, text)
})
