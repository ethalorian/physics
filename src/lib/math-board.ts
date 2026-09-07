export const BOARD_WIDTH = 640
export const BOARD_HEIGHT = 360
export const BOARD_GRID = 32
export function snapBoardPoint(x: number, y: number): { x: number; y: number } {
  return { x: BOARD_WIDTH / 2 + Math.round((x - BOARD_WIDTH / 2) / BOARD_GRID) * BOARD_GRID,
    y: BOARD_HEIGHT / 2 + Math.round((y - BOARD_HEIGHT / 2) / BOARD_GRID) * BOARD_GRID }
}
