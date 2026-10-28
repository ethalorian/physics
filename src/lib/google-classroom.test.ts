import { afterEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { GoogleClassroomAPI } from './google-classroom'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })
const student = (id: string) => ({ userId: id, profile: { name: { fullName: `Student ${id}` } } })
function client(token = 'fictional-token') { const api = new GoogleClassroomAPI(); api.setAccessToken(token); return api }
function pages(values: unknown[]) {
 const urls: URL[] = []
 globalThis.fetch = async input => { urls.push(new URL(String(input))); const value = values.shift(); return value instanceof Response ? value : Response.json(value) }
 return urls
}

test('downloads every page, including a short page with a next token, and deduplicates IDs', async () => {
 const first = Array.from({ length: 30 }, (_, i) => student(String(i)))
 const urls = pages([{ students: first, nextPageToken: 'next / page' }, { students: [student('30')], nextPageToken: 'last' }, { students: [student('30'), student('31')] }])
 const result = await client().getStudents('course/id')
 assert.equal(result.length, 32)
 assert.equal(urls.length, 3)
 assert.equal(urls[0].pathname, '/v1/courses/course%2Fid/students')
 assert.match(urls[0].searchParams.get('fields')!, /nextPageToken/)
 assert.equal(urls[1].searchParams.get('pageToken'), 'next / page')
})

test('empty complete roster is valid', async () => { pages([{}]); assert.deepEqual(await client().getStudents('c'), []) })
test('later-page failure rejects the entire download', async () => {
 pages([{ students: [student('a')], nextPageToken: 'b' }, new Response('Unavailable', { status: 503 })])
 await assert.rejects(client().getStudents('c'), /503/)
})
test('repeating a page token fails safely', async () => {
 pages([{ nextPageToken: 'b' }, { nextPageToken: 'b' }]); await assert.rejects(client().getStudents('c'), /repeated/)
})
for (const invalid of [null, [], 'bad', { students: null }, { students: {} }, { nextPageToken: 2 }, { students: [student('')] }, { students: [{ userId: 'a' }] }]) {
 test(`malformed roster is rejected: ${JSON.stringify(invalid)}`, async () => { pages([invalid]); await assert.rejects(client().getStudents('c')) })
}
test('concurrent requests keep their own OAuth credentials on every page', async () => {
 const seen: string[] = []
 globalThis.fetch = async (input, init) => {
   const url = new URL(String(input)); const token = (init?.headers as Record<string,string>).Authorization
   seen.push(`${url.pathname}:${token}`)
   await new Promise(resolve => setTimeout(resolve, 1))
   return Response.json(url.searchParams.has('pageToken') ? {} : { nextPageToken: 'next' })
 }
 await Promise.all([client('one').getStudents('one'), client('two').getStudents('two')])
 assert.equal(seen.filter(x => x === '/v1/courses/one/students:Bearer one').length, 2)
 assert.equal(seen.filter(x => x === '/v1/courses/two/students:Bearer two').length, 2)
})
