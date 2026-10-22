import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { COMIC_BOOKS, comicProgressKey, parseComicPage, readComicProgress } from './comics'

test('published chapters contain exactly their own pages and all artwork exists', () => {
  for (const book of COMIC_BOOKS) {
    const seen = new Set<number>()
    assert.equal(book.pages[0].day, 0)
    for (const chapter of book.chapters) {
      assert.ok(chapter.start > 0 && chapter.end < book.pages.length)
      for (let index = chapter.start; index <= chapter.end; index++) {
        assert.ok(!seen.has(index), 'No overlapping installments')
        assert.equal(book.pages[index].day, chapter.day)
        seen.add(index)
      }
    }
    assert.equal(seen.size, book.pages.length - 1)
    for (const page of book.pages) assert.ok(fs.existsSync(path.join(process.cwd(), 'public', page.src)), page.src)
  }
})

test('deep links reject malformed and out-of-range page positions', () => {
  for (const input of [null, undefined, '', ' ', '-1', '1.2', 'NaN', 'Infinity', 9, 1.2, {}, [], true]) assert.equal(parseComicPage(input, 9), null)
  for (let page = 0; page < 9; page++) assert.equal(parseComicPage(String(page), 9), page)
})

test('reading position is isolated by account and handles unavailable or corrupt storage', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  try {
    const data = new Map<string,string>()
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => data.get(key) ?? null } })
    const a = comicProgressKey('student-a', 'book-one'), b = comicProgressKey('student-b', 'book-one')
    data.set(a, JSON.stringify({ page: 6 }))
    assert.equal(readComicProgress(a, 9), 6)
    assert.equal(readComicProgress(b, 9), 0)
    data.set(a, '{broken')
    assert.equal(readComicProgress(a, 9), 0)
    data.set(a, JSON.stringify({ page: 800 }))
    assert.equal(readComicProgress(a, 9), 0)
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw new Error('Unavailable') } })
    assert.equal(readComicProgress(a, 9), 0)
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original)
    else Reflect.deleteProperty(globalThis, 'localStorage')
  }
})
