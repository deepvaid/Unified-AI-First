import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FLICK_SPEED, MOVE_SLOP, axisLock, sheetDragCloses, swipeOutcome } from '../../src/components/pos/posGestures.ts'

const WIDTH = 400 // a cart line
const ACTION = 88 // component.pos.swipeAction

test('a drag picks an axis only once it is clearly going somewhere', () => {
  assert.equal(axisLock(MOVE_SLOP - 1, 0), null, 'a drifting finger is still a press')
  assert.equal(axisLock(-20, 6), 'x')
  assert.equal(axisLock(-8, 14), 'y', 'mostly vertical scrolls the cart')
  assert.equal(axisLock(12, 12), 'y', 'a diagonal tie scrolls rather than swipes')
})

test('a slow swipe settles by distance', () => {
  assert.equal(swipeOutcome(30, WIDTH, 0, ACTION), 'closed', 'under half the action snaps back')
  assert.equal(swipeOutcome(50, WIDTH, 0, ACTION), 'revealed')
  assert.equal(swipeOutcome(180, WIDTH, 0, ACTION), 'revealed', 'short of half the row only reveals')
  assert.equal(swipeOutcome(WIDTH / 2 + 1, WIDTH, 0, ACTION), 'remove', 'past half the row removes')
})

test('a flick reveals first, then removes from past the action', () => {
  assert.equal(swipeOutcome(20, WIDTH, -FLICK_SPEED, ACTION), 'revealed', 'one flick never deletes outright')
  assert.equal(swipeOutcome(ACTION, WIDTH, -FLICK_SPEED, ACTION), 'remove')
  assert.equal(swipeOutcome(ACTION, WIDTH, FLICK_SPEED, ACTION), 'closed', 'a flick back closes')
})

test('a sheet closes past 30% of its height or on a downward flick', () => {
  assert.equal(sheetDragCloses(100, 500, 0), false)
  assert.equal(sheetDragCloses(151, 500, 0), true)
  assert.equal(sheetDragCloses(40, 500, FLICK_SPEED), true)
  assert.equal(sheetDragCloses(MOVE_SLOP, 500, 2), false, 'a twitch is not a flick')
})
