import {test} from 'node:test'
import {strict as assert} from 'node:assert'
import {matchesLibrary,readingTagForSource} from './activity-library'
const item={title:'Hewitt 4.2 · Acceleration',kind:'reading',format:'interactive-reading',unitIds:['unit-1'],targetIds:['t1'],description:'Use velocity graphs to explain changing motion.',book:'Hewitt',readingTag:readingTagForSource({}),chapter:4,availability:'Ready'}
const filters={query:'',kind:'',unit:'',target:''}
test('all assignments are visible by default and interactive readings have an exact filter',()=>{assert(matchesLibrary(item,filters));assert(matchesLibrary(item,{...filters,kind:'interactive-reading'}));assert(!matchesLibrary(item,{...filters,kind:'interactive'}));assert(!matchesLibrary(item,{...filters,kind:'reading'}))})
test('search combines terms across titles, chapters, descriptions and learning targets',()=>{assert(matchesLibrary(item,{...filters,query:'chapter 4 velocity'}));assert(matchesLibrary(item,{...filters,query:'model motion'},[{id:'t1',statement:'Build a model of motion'}]));assert(!matchesLibrary(item,{...filters,query:'velocity optics'}))})
test('unit, mastery target and setup status combine without losing unrelated choices',()=>{assert(matchesLibrary(item,{...filters,unit:'unit-1',target:'t1',status:'Ready'}));assert(!matchesLibrary(item,{...filters,unit:'unit-2'}));assert(!matchesLibrary(item,{...filters,target:'t2'}));assert(matchesLibrary({...item,unitIds:[]},{...filters,unit:'unmapped'}))})

test('section numbers match exactly instead of including other chapters',()=>{assert(matchesLibrary({...item,title:'Hewitt 4.4 · Velocity'},{...filters,query:'hewitt 4.4'}));assert(!matchesLibrary({...item,title:'Hewitt 14.4 · Energy'},{...filters,query:'hewitt 4.4'}))})

test('reading tags come from the reading source, including generic assignment titles',()=>{
  assert.equal(readingTagForSource({honors_reading:null}),'CPA')
  assert.equal(readingTagForSource({honors_reading:{sections:['3.1']}}),'OpenStax')
  const openstax={...item,title:'Motion reading',book:'OpenStax',readingTag:readingTagForSource({honors_reading:{sections:['3.1']}})}
  assert(matchesLibrary(openstax,{...filters,readingTag:'OpenStax',kind:'interactive-reading',unit:'unit-1'}))
  assert(!matchesLibrary(openstax,{...filters,readingTag:'CPA'}))
  assert(matchesLibrary(item,{...filters,readingTag:'CPA',query:'cpa velocity'}))
  assert(!matchesLibrary(item,{...filters,readingTag:'OpenStax'}))
  assert(!matchesLibrary({title:'CPA lab',kind:'interactive'}, {...filters,readingTag:'CPA'}))
  assert(matchesLibrary(openstax,{...filters,query:'openstax motion'}))
})
