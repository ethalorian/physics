import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BOARD_HEIGHT, BOARD_WIDTH, BOARD_GRID, snapBoardPoint } from './math-board'
test('plotted origin and intercepts sit on the shared centered axes', () => {
  assert.deepEqual(snapBoardPoint(BOARD_WIDTH/2,BOARD_HEIGHT/2), {x:320,y:180})
  assert.deepEqual(snapBoardPoint(320+BOARD_GRID,180), {x:352,y:180})
  assert.deepEqual(snapBoardPoint(320,180-BOARD_GRID), {x:320,y:148})
  for (let x=20;x<620;x+=32) assert.equal(snapBoardPoint(x,180).y,180)
})
