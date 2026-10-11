import test from 'node:test'
import assert from 'node:assert/strict'
import { deckForDay, resolveDeckSrc, withLessonPresentationDeck } from './lesson-decks'
import type { BlockDocument, DeckBlock } from './content-blocks'

test('all 22 days resolve to distinct teaching decks, including shared legacy days', () => {
  const paths = Array.from({length:22}, (_, i) => deckForDay('unit-1', i+1)?.src)
  assert.equal(new Set(paths).size, 22)
  assert.ok(paths.every(src => src?.startsWith('/api/teacher/worksheets/unit-1/')))
  for (const day of [11,12,21,22]) {
    const slug = `u1-d${day}`
    const document: BlockDocument = {schemaVersion:1,blocks:[
      {type:'deck',id:`deck-${slug}`,title:'Old combined file',src:day<20?'/decks/unit-1/Day 11-12 - Derive F=ma.dc.html':'/decks/unit-1/Day 21-22 - Transfer Task.dc.html',navigation:'mapped',slideMap:[{slide:4,section:2}]},
      {type:'prose',id:'student-evidence-context',markdown:'Keep the existing lesson content.'},
    ]}
    const result = withLessonPresentationDeck(document, {unit_id:'unit-1',slug,lesson_number:day})
    const deck = result.blocks[0] as DeckBlock
    assert.equal(deck.src, paths[day-1])
    assert.equal(deck.navigation, 'manual')
    assert.equal(deck.slideMap, undefined)
    assert.equal(result.blocks[1], document.blocks[1])
    assert.ok((document.blocks[0] as DeckBlock).slideMap, 'stored document was not mutated')
  }
})

test('single-day aliases retain query/hash; unrelated and ambiguous files retain their identity', () => {
  assert.equal(resolveDeckSrc('/decks/unit-1/Day%203%20-%20Graphs%20as%20Claims.dc.html?mode=present#4'), '/decks/unit-1-teaching/day-03.html?mode=present#4')
  assert.equal(resolveDeckSrc('/decks/classroom/U1 Day 13 - F=ma Fluency.dc.html'), '/decks/unit-1-teaching/day-13.html')
  assert.equal(resolveDeckSrc('/decks/unit-1/Day 11-12 - Derive F=ma.dc.html'), '/decks/unit-1/Day 11-12 - Derive F=ma.dc.html')
  assert.equal(resolveDeckSrc('/decks/custom.html'), '/decks/custom.html')
  assert.ok(deckForDay('unit-2', 3)?.src.startsWith('/api/teacher/worksheets/unit-2/'))
})

test('canonical lesson identity is required; teacher-created and other-course decks are preserved', () => {
  const doc: BlockDocument = {schemaVersion:1,blocks:[{type:'deck',id:'deck-u1-d01',src:'/decks/example.html',title:'Example'}]}
  for (const identity of [{unit_id:'trades-unit-1',slug:'u1-d01',lesson_number:1},{unit_id:'unit-1',slug:'custom-lesson',lesson_number:1},{unit_id:'unit-1',slug:'u1-d01',lesson_number:2}]) {
    assert.equal(withLessonPresentationDeck(doc,identity),doc)
  }
})

test('every CPA day has a separate deck; class track changes only the canonical presentation', () => {
  for(let day=1;day<=22;day++) {
    const slug=`u1-d${String(day).padStart(2,'0')}`
    const evidence={type:'prose' as const,id:'student-evidence',markdown:'Assigned work remains unchanged.'}
    const doc:BlockDocument={schemaVersion:1,blocks:[{type:'deck',id:`deck-${slug}`,src:'/decks/old.html',title:'Old',slideMap:[{slide:3,section:2}]},evidence]}
    const cpa=withLessonPresentationDeck(doc,{unit_id:'unit-1',slug,lesson_number:day},'cpa')
    const honors=withLessonPresentationDeck(doc,{unit_id:'unit-1',slug,lesson_number:day},'honors')
    assert.equal((cpa.blocks[0] as DeckBlock).src,`/api/teacher/worksheets/unit-1/${day}/presentation?track=cpa`)
    assert.equal((honors.blocks[0] as DeckBlock).src,deckForDay('unit-1',day)?.src)
    assert.equal((cpa.blocks[0] as DeckBlock).slideMap,undefined)
    assert.equal(cpa.blocks[1],evidence)
    assert.equal(honors.blocks[1],evidence)
    assert.equal((doc.blocks[0] as DeckBlock).src,'/decks/old.html')
    assert.equal(resolveDeckSrc((cpa.blocks[0] as DeckBlock).src),(cpa.blocks[0] as DeckBlock).src)
  }
  assert.equal(deckForDay('unit-1',23,'cpa'),null)
  assert.notEqual(deckForDay('unit-2',3,'cpa')?.src,deckForDay('unit-2',3,'honors')?.src)
})

test('all 137 course-plan days have the correct practice or assessment presentation',()=>{
 const counts=[22,17,15,23,13,19,19,9];
 for(const [i,count] of counts.entries()) for(let day=1;day<=count;day++) for(const track of ['cpa','honors']){
 const deck=deckForDay('unit-'+(i+1),day,track);
 const assessment=(i>=1&&i<=6&&day>=count-1)||(i===7&&day===9);
 assert.equal(deck?.src,assessment?`/decks/course-assessments/unit-${i+1}-day-${day}.html`:`/api/teacher/worksheets/unit-${i+1}/${day}/presentation?track=${track}`);
 assert.equal(deckForDay('unit-'+(i+1),day,track+'-sei')?.src,deck?.src);
 }
});
