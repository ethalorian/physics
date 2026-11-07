'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from 'react'

export type CalendarPointer = { clientX: number; clientY: number }

/** Pointer coordinates are transient: only a changed drop target needs React state. */
export function useCalendarDragPreview(onFrame: (point: CalendarPointer) => void, container?: RefObject<HTMLElement | null>, offset = 14) {
  const point = useRef<CalendarPointer>({ clientX: 0, clientY: 0 })
  const node = useRef<HTMLDivElement | null>(null), frame = useRef<number | null>(null)
  const callback = useRef(onFrame)
  useLayoutEffect(() => { callback.current = onFrame })
  const position = useCallback((element: HTMLDivElement | null) => {
    node.current = element
    if (!element) return
    // Read once per animation frame, including after scroll or a layout change.
    const rect = container?.current?.getBoundingClientRect()
    element.style.left = `${point.current.clientX - (rect?.left ?? 0) + offset}px`
    element.style.top = `${point.current.clientY - (rect?.top ?? 0) + offset}px`
  }, [container, offset])
  const move = useCallback((next: CalendarPointer) => {
    point.current = { clientX: next.clientX, clientY: next.clientY }
    if (frame.current !== null) return
    frame.current = requestAnimationFrame(() => {
      frame.current = null
      position(node.current)
      callback.current(point.current)
    })
  }, [position])
  const cancel = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = null
  }, [])
  useEffect(() => cancel, [cancel])
  return { ref: position, move, cancel }
}
