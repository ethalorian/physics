import test from 'node:test'
import assert from 'node:assert/strict'
import { referencedLessonTargets } from './lesson-target-references'
import { linkedTeachingPlans } from './lesson-workspace'
import { filterDocumentForViewer } from './track-visibility'
import { rehearsalState } from './teaching-rehearsal'
import { validateBlockDocument } from '@/data/block-registry'
import { editLessonDocument } from './lesson-editing'
import type { BlockDocument } from '@/data/content-blocks'
const document:BlockDocument={schemaVersion:1,presentation:'physics-path',learningPath:{version:1,kind:'lesson',focus:'Motion',targetSlugs:['position']},blocks:[{id:'p',type:'prose',markdown:'Motion',targetId:'position'},{id:'h',type:'prose',markdown:'Honors',targetId:'honors',visibilityTrack:'honors'}]}
const targets=[{id:'force-id',slug:'force'},{id:'honors-id',slug:'honors'},{id:'position-id',slug:'position'}]
test('CPA preview removes unit-wide and Honors-only targets and preserves document order',()=>assert.deepEqual(referencedLessonTargets(filterDocumentForViewer(document,{role:'student',track:'cpa'}),targets),[targets[2]]))
test('Honors preview follows the same ordered references as the reader',()=>assert.deepEqual(referencedLessonTargets(filterDocumentForViewer(document,{role:'student',track:'honors'}),targets),[targets[2],targets[1]]))
test('ID and slug references resolve once',()=>assert.equal(referencedLessonTargets({blocks:[{targetId:'position-id'},{targetId:'position'}]},targets).length,1))
test('Concept lesson 102 never guesses teaching day 102',()=>assert.deepEqual(linkedTeachingPlans({unit_id:'unit-1',lesson_number:102},document),[]))
test('Historical daily lesson resolves only an existing plan',()=>{assert.equal(linkedTeachingPlans({unit_id:'unit-1',lesson_number:1}).length,1);assert.equal(linkedTeachingPlans({unit_id:'unit-1',lesson_number:999}).length,0)})
test('Many-to-many plan references are explicit, deduplicated, and survive a content edit',()=>{const doc={...document,teachingPlans:[{unitId:'unit-1',day:1},{unitId:'unit-1',day:2},{unitId:'unit-1',day:1}]};assert.equal(linkedTeachingPlans({},doc).length,2);assert.deepEqual(editLessonDocument(doc,{blocks:doc.blocks}).teachingPlans,doc.teachingPlans)})
test('Explicit empty references remove an old default',()=>assert.deepEqual(linkedTeachingPlans({unit_id:'unit-1',lesson_number:1},{...document,teachingPlans:[]}),[]))
test('Invalid plan metadata cannot be saved',()=>assert.ok(validateBlockDocument({...document,teachingPlans:[{unitId:'unit-1',day:'102'}]}).some(i=>i.message.includes('teacher plan'))))
test('Rehearsals are independent local state without a real session ID',()=>{const a=rehearsalState('one','class'),b=rehearsalState('two','class');a.session.current_slide=3;assert.equal(b.session.current_slide,0);assert.equal(a.session.id,'rehearsal');assert.deepEqual(a.tally,{})})
