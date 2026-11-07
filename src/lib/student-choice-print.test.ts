import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import catalog from '@/data/student-choice-binder.json'
import { renderChoicePracticePrint } from './student-choice-print'
import { GET } from '@/app/student-choice-print/route'

test('all 63 subsets of every pinned edition contain only exact original sections in option order', () => {
  for (const packet of catalog) {
    const originals = packet.options.map(o => fs.readFileSync('public' + o.path, 'utf8').match(/<section\b[\s\S]*?<\/section>/)![0])
    for (let mask = 1; mask < 64; mask++) {
      const selected = originals.flatMap((_, i) => mask & (1 << i) ? [i + 1] : [])
      const html = renderChoicePracticePrint(packet.key, packet.version, [...selected].reverse())!
      assert.deepEqual(html.match(/<section\b[\s\S]*?<\/section>/g), selected.map(n => originals[n - 1]))
      assert.match(html, /<base href="\/student-choice-pages\//)
    }
  }
})
test('public print route validates subsets and pinned editions without accessing student records', async () => {
  const p = catalog[0], url = `http://fixture/student-choice-print?packet=${p.key}&edition=${p.version}&options=`
  for (const options of ['1', '2,5', '1,2,3,4,5,6']) {
    const response = GET(new Request(url + options))
    assert.equal(response.status, 200)
    assert.equal((await response.text()).match(/<section\b/g)?.length, options.split(',').length)
  }
  for (const options of ['', '0', '7', '1,1', '1.5', '1,2,3,4,5,6,1', '<script>']) assert.equal(GET(new Request(url + options)).status, 400)
  assert.equal(GET(new Request('http://fixture/student-choice-print?packet=__proto__&edition=x&options=1')).status, 404)
})
