import assert from 'node:assert/strict'
import test from 'node:test'
import { assignmentScope, visibleQuestionSection } from './assignment-scope'
import { interactiveChapterForAssignment } from './registry'
import type { ReadingAssignment } from '@/lib/textbook-assignments'
const base: ReadingAssignment = { id:'fixture',course_id:'course',chapter:2,title:'Reading',reading:'',section_ids:[],instructions:'',questions:[],due_at:null,status:'published',version:1,created_at:'' }
for (const book of ['hewitt','openstax'] as const) {
  const make = (sections: string[]) => book === 'hewitt' ? {...base,section_ids:sections} : {...base,honors_reading:{sections,from:1,to:20,focus:''}}
  test(book + ': single, contiguous and disjoint assignments have exact boundaries', () => {
    for (const sections of [['2.2'],['2.2','2.3'],['2.1','2.3']]) {
      const assignment=make(sections), definition=interactiveChapterForAssignment(assignment)!
      assert.ok(definition)
      const scope=assignmentScope(definition,assignment)
      assert.deepEqual(scope.sections.map(s=>s.number),sections)
      assert.equal(scope.first?.number,sections[0]);assert.equal(scope.last?.number,sections.at(-1))
      assert.equal(scope.label,(sections.length===1?'Section ':'Sections ')+sections.join(', '))
      const visible=new Set(scope.sections.map(s=>s.id))
      for(const section of definition.sections){
        const question={id:'q',reference:'Section '+section.number,prompt:'Explain',target_id:'target'}
        const mapped=definition.questionSection(question)
        assert.equal(visibleQuestionSection(definition,question,visible),mapped&&visible.has(mapped)?mapped:null)
      }
      assert.equal(visibleQuestionSection(definition,{id:'unmatched',reference:'Teacher extension',prompt:'Explain',target_id:'target'},visible),null)
    }
  })
}
test('empty Hewitt selection is the entire chapter; no assignment has no required scope',()=>{
 const definition=interactiveChapterForAssignment(base)!
 assert.deepEqual(assignmentScope(definition,base).sections,definition.sections)
 assert.equal(assignmentScope(definition).sections.length,0)
})
test('even an invalid section mapping leaves the response in the turn-in area',()=>{
 const definition=interactiveChapterForAssignment(base)!
 assert.equal(visibleQuestionSection({...definition,questionSection:()=> 'missing'}, {id:'q',reference:'',prompt:'',target_id:'t'}, new Set(definition.sections.map(s=>s.id))),null)
})
