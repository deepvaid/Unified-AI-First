import { test } from 'node:test'
import assert from 'node:assert/strict'
// The orb engine is plain JavaScript served from public/ (the landing pages load it too).
import { nextSpeakEnergy } from '../../public/dv-orb/dv-orb-engine.js'

/** Runs the orb for `frames` frames at 60 a second and returns each frame's speaking energy. */
function run(frames: number, speaking: boolean, frameAt: (i: number) => { speakEnergy: number } | null, from = 0) {
  const seen: number[] = []
  let energy = from
  for (let i = 0; i < frames; i++) {
    energy = nextSpeakEnergy(energy, speaking, frameAt(i), i / 60)
    seen.push(energy)
  }
  return seen
}

test('while Da Vinci speaks, the orb follows how loud the voice is', () => {
  // A word, a pause, a word: the ring must rise, fall and rise again — it used to hold one steady pulse.
  const loud = run(20, true, () => ({ speakEnergy: 0.9 }))
  assert.ok(loud.at(-1)! > 0.85, `a loud word lifts the ring (${loud.at(-1)})`)

  const pause = run(30, true, () => ({ speakEnergy: 0.02 }), loud.at(-1))
  assert.ok(pause.at(-1)! < 0.1, `a pause lets it settle (${pause.at(-1)})`)

  const again = run(20, true, () => ({ speakEnergy: 0.9 }), pause.at(-1))
  assert.ok(again.at(-1)! > 0.85, `the next word lifts it again (${again.at(-1)})`)
})

test('the orb rises on a word faster than it settles after one', () => {
  const up = run(3, true, () => ({ speakEnergy: 1 }))
  const down = run(3, true, () => ({ speakEnergy: 0 }), 1)
  assert.ok(up.at(-1)! > 1 - down.at(-1)!, 'three frames up cover more ground than three frames down')
})

test('a voice level outside 0–1 cannot throw the ring off the page', () => {
  assert.ok(run(60, true, () => ({ speakEnergy: 7 })).every((e) => e <= 1))
  assert.ok(run(60, true, () => ({ speakEnergy: -3 }), 0.5).every((e) => e >= 0))
})

test('with no audio to read, the orb keeps its steady made-up pulse', () => {
  // The landing and login pages have no voice: nothing there may change.
  const settled = run(240, true, () => null).slice(120)
  assert.ok(Math.min(...settled) > 0.15 && Math.max(...settled) < 0.6, 'stays inside the old pulse')
})

test('when Da Vinci stops speaking, the orb comes to rest whatever the audio says', () => {
  const resting = run(240, false, () => ({ speakEnergy: 0.9 }), 0.9)
  assert.ok(resting.at(-1)! < 0.01)
})
