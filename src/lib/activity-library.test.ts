import {test} from 'node:test'
import {strict as assert} from 'node:assert'
import {matchesLibrary,readingTagForSource,lessonLibraryFormat,activityLabels} from './activity-library'
import {reflectionLibraryTemplates} from './reflection-assignments'
const item={title:'Hewitt 4.2 · Acceleration',kind:'reading',format:'interactive-reading',unitIds:['unit-1'],targetIds:['t1'],description:'Use velocity graphs to explain changing motion.',book:'Hewitt',readingTag:readingTagForSource({}),chapter:4,availability:'Ready'}
const filters={query:'',kind:'',unit:'',target:''}
test('reflection templates are discoverable before any saved assignments exist',()=>{
  const templates=reflectionLibraryTemplates([{id:'motion',unit_id:'unit-1'},{id:'energy',unit_id:'unit-2'}])
  for(const kind of ['manga','story']){
    const template=templates.find(t=>t.kind===kind)!
    assert(matchesLibrary(template,{...filters,kind,unit:'unit-2',target:'energy',status:'Ready'}))
    assert(matchesLibrary(template,{...filters,query:activityLabels[kind]}))
    assert(!matchesLibrary(template,{...filters,status:'Needs setup'}))
    assert.equal(lessonLibraryFormat({reflection_kind:kind}),kind)
  }
  assert.equal(lessonLibraryFormat({reflection_kind:'graphic-novel'}),'graphic-novel')
  assert.equal(lessonLibraryFormat({video_sequence:1}),'video')
  assert.equal(lessonLibraryFormat({}),'lesson')
})
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
