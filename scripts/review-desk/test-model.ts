import {test} from 'node:test'
import assert from 'node:assert/strict'
import {applyAllSuggestions} from '../../src/lib/review-desk/apply-suggestions'
import type {EvidenceSuggestions} from '../../src/lib/review-desk/suggestions'
import {addRemainingSuggestedScores,initialReviewDecision,targetMasterySummary,emptyDecision,reviewPercent,reviewScoreIssues,validateDecision,appendFeedback,type ReviewDocument} from '../../src/lib/review-desk/types'
const doc:ReviewDocument={activity:{key:'quiz:one',kind:'quiz',title:'Motion',sourceId:'one',unitIds:['unit-1']},userId:'student',studentName:'Fictional student',version:'attempt1',submissionId:'attempt1',submittedAt:null,attempt:1,state:'submitted',evidence:[{id:'answer',prompt:'Explain',response:'',targetIds:['target']}],targets:[{id:'target',statement:'Explain motion',allowSkip:true}],scoreItems:[{id:'auto',label:'Choice',possible:2,step:1,automatic:2},{id:'answer',label:'Explain',possible:4,step:.5}],gradeMode:'points',draft:null,revision:null,canReturn:true,canRelease:true,sourceHref:'/'}
test('quiz percentages use authored points, never mastery or completion',()=>{const d={...emptyDecision(),scores:{answer:2.5},ratings:{target:1 as const},evidenceRatings:{answer:3 as const}};assert.equal(reviewPercent(doc,d),75);assert.equal(reviewPercent({...doc,scoreItems:[],gradeMode:'mastery'},d),null)})
test('four dimensions use the lowest-dimension syllabus table',()=>{const lab={...doc,gradeMode:'dimensions' as const,scoreItems:['s','r','c','t'].map(id=>({id,label:id,possible:4,step:1}))};assert.equal(reviewPercent(lab,{...emptyDecision(),scores:{s:4,r:4,c:2,t:3}}),85);assert.equal(reviewPercent(lab,{...emptyDecision(),scores:{s:4,r:4,c:4,t:4}}),96)})
test('ready requires every score and explicit target decision; null remains deliberate',()=>{assert.throws(()=>validateDecision(doc,emptyDecision(),true),/Score every/);assert.throws(()=>validateDecision(doc,{...emptyDecision(),scores:{answer:3}},true),/every learning target/);assert.doesNotThrow(()=>validateDecision(doc,{...emptyDecision(),scores:{answer:3},ratings:{target:null}},true))})
test('rejects invented items, point bounds, automatic-score edits and stale work',()=>{for(const scores of [{answer:5},{answer:2.3},{unknown:1},{auto:0,answer:4}])assert.throws(()=>validateDecision(doc,{...emptyDecision(),scores}));assert.throws(()=>validateDecision({...doc,state:'returned'},{...emptyDecision(),scores:{answer:4},ratings:{target:3}},true),/current submitted/);assert.throws(()=>validateDecision(doc,{...emptyDecision(),ratings:{invented:2}}))})
test('a suggestion appends without deleting teacher feedback or duplicating itself',()=>{assert.equal(appendFeedback('Teacher note','Suggestion'),'Teacher note\n\nSuggestion');assert.equal(appendFeedback('Teacher note\n\nSuggestion','Suggestion'),'Teacher note\n\nSuggestion')})
test('already released mastery cannot be overwritten while finishing other targets',()=>{assert.throws(()=>validateDecision({...doc,targets:[{...doc.targets[0],released:2}]},{...emptyDecision(),ratings:{target:3}}),/mastery decisions/);assert.equal(validateDecision({...doc,targets:[{...doc.targets[0],released:2}]},{...emptyDecision(),scores:{answer:4}},true).ratings.target,undefined)})
test('completion and empty work never acquire a fabricated percentage',()=>{assert.equal(reviewPercent({...doc,gradeMode:'completion',scoreItems:[]},emptyDecision()),null);assert.equal(reviewPercent(doc,emptyDecision()),null)})
test('missing points are identified even when all evidence ratings are selected',()=>{
 const quiz={...doc,scoreItems:[{id:'one',label:'Question 1',possible:2,step:.5},{id:'two',label:'Question 2',possible:2,step:.5},{id:'three',label:'Question 3',possible:2,step:.5},{id:'answer',label:'Question 4',possible:4,step:.5}]}
 const decision={...emptyDecision(),scores:{one:0,two:1.5,answer:3.5},evidenceRatings:{answer:2 as const},ratings:{target:2 as const}}
 assert.deepEqual(reviewScoreIssues(quiz,decision).map(i=>[i.item.label,i.reason]),[['Question 3','missing']])
 assert.throws(()=>validateDecision(quiz,decision,true),/Point scores still needed: Question 3/)
 assert.doesNotThrow(()=>validateDecision(quiz,{...decision,scores:{...decision.scores,three:1.5}},true))
})
test('use remaining suggestions preserves teacher scores, zero, feedback and mastery',()=>{
 const quiz={...doc,scoreItems:[...doc.scoreItems,{id:'zero',label:'Question 2',possible:2,step:.5,suggested:2},{id:'empty',label:'Question 3',possible:2,step:.5,suggested:1.5},{id:'bad',label:'Question 4',possible:2,step:.5,suggested:2.3},{id:'none',label:'Question 5',possible:2,step:.5}]}
 const decision={...emptyDecision(),scores:{answer:3.5,zero:0},ratings:{target:3 as const},note:'Teacher feedback'}
 const filled=addRemainingSuggestedScores(quiz,decision)
 assert.deepEqual(filled.scores,{answer:3.5,zero:0,empty:1.5})
 assert.equal(filled.note,decision.note);assert.deepEqual(filled.ratings,decision.ratings);assert.deepEqual(decision.scores,{answer:3.5,zero:0})
 assert.deepEqual(reviewScoreIssues(quiz,filled).map(i=>i.item.id),['bad','none'])
})
test('invalid score feedback names the question and its allowed point increments',()=>{
 const decision={...emptyDecision(),scores:{answer:2.3}}
 assert.deepEqual(reviewScoreIssues(doc,decision).map(i=>i.reason),['invalid'])
 assert.throws(()=>validateDecision(doc,decision),/Check Explain: enter 0–4 points in steps of 0.5/)
})
test('new reviews prefill valid suggested points; saved reviews keep their exact decisions',()=>{
 const quiz={...doc,scoreItems:doc.scoreItems.map(item=>item.id==='answer'?{...item,suggested:3.5}:item)}
 assert.equal(initialReviewDecision(quiz).scores.answer,3.5)
 assert.equal(reviewPercent(quiz,initialReviewDecision(quiz)),100*5.5/6)
 assert.deepEqual(initialReviewDecision(quiz).ratings,{})
 const saved={...emptyDecision(),scores:{answer:0},note:'Keep my note'}
 assert.deepEqual(initialReviewDecision({...quiz,initialDecision:saved}),saved)
 assert.deepEqual(initialReviewDecision({...quiz,draft:{id:'draft',version:1,state:'draft',payload:emptyDecision(),request_id:'request'}}).scores,{})
})
test('combined mastery uses only explicitly reviewed evidence for that target and waits for all items',()=>{
 const multi={...doc,evidence:[...doc.evidence,{...doc.evidence[0],id:'second'},{...doc.evidence[0],id:'skip'},{...doc.evidence[0],id:'other',targetIds:['other-target']}]}
 const decision={...emptyDecision(),scores:{answer:4},ratings:{target:1 as const},evidenceRatings:{answer:3 as const,second:2 as const,other:1 as const}}
 assert.equal(targetMasterySummary(multi,decision,'target').suggested,null)
 const reviewed={...decision,evidenceRatings:{...decision.evidenceRatings,skip:null}}
 assert.deepEqual(targetMasterySummary(multi,reviewed,'target'),{total:3,reviewed:3,rated:2,average:2.5,suggested:3})
 assert.equal(reviewed.ratings.target,1)
 assert.equal(targetMasterySummary(multi,reviewed,'unrelated').suggested,null)
 assert.equal(targetMasterySummary(doc,{...emptyDecision(),evidenceRatings:{answer:null}},'target').suggested,null)
})
const bulkDoc:ReviewDocument={...doc,evidence:[...doc.evidence,{...doc.evidence[0],id:'second'}],scoreItems:doc.scoreItems.map(i=>i.id==='answer'?{...i,suggested:3.5}:i)}
const bulkSuggestions:EvidenceSuggestions={evidence:[{id:'answer',level:2,rationale:'Partial',feedback:'Explain the start and finish.'},{id:'second',level:3,rationale:'Accurate',feedback:'Clear direction explanation.'}],targets:[{id:'target',level:1,rationale:'Independent suggestion',feedback:'Review motion.'}],feedback:'Compare distance and displacement.'}
test('apply all fills private fields and prefers combined mastery without changing the source decision',()=>{
 const original=emptyDecision(),before=structuredClone(original),filled=applyAllSuggestions(bulkDoc,original,bulkSuggestions)
 assert.equal(filled.count,7);assert.deepEqual(original,before)
 assert.deepEqual(filled.decision.scores,{answer:3.5});assert.deepEqual(filled.decision.evidenceRatings,{answer:2,second:3});assert.deepEqual(filled.decision.ratings,{target:3})
 assert.equal(filled.decision.feedback.answer,bulkSuggestions.evidence[0].feedback);assert.equal(filled.decision.note,bulkSuggestions.feedback)
 assert.doesNotThrow(()=>validateDecision(bulkDoc,filled.decision,true))
 assert.equal(applyAllSuggestions(bulkDoc,filled.decision,bulkSuggestions).count,0)
})
test('apply all preserves zero, explicit no-new-rating, entered feedback, final mastery and grade format',()=>{
 const original={...emptyDecision(),scores:{answer:0},evidenceRatings:{answer:null},ratings:{target:null},feedback:{answer:' My response feedback. '},note:' My overall feedback. ',gradeValue:'B'}
 const before=structuredClone(original),filled=applyAllSuggestions(bulkDoc,original,bulkSuggestions)
 assert.equal(filled.count,2);assert.deepEqual(original,before)
 assert.equal(filled.decision.scores.answer,0);assert.equal(filled.decision.evidenceRatings.answer,null);assert.equal(filled.decision.ratings.target,null)
 assert.equal(filled.decision.feedback.answer,original.feedback.answer);assert.equal(filled.decision.note,original.note);assert.equal(filled.decision.gradeValue,'B')
 assert.equal(filled.decision.evidenceRatings.second,3);assert.equal(filled.decision.feedback.second,bulkSuggestions.evidence[1].feedback)
})
test('apply all respects released mastery, target skip rules, authored IDs and feedback limits',()=>{
 const limited={...bulkDoc,targets:[{...doc.targets[0],released:2 as const},{id:'required',statement:'Required',allowSkip:false}],scoreItems:[...bulkDoc.scoreItems,{id:'bad',label:'Invalid suggestion',possible:2,step:.5,suggested:1.3}]}
 const suggestions={...bulkSuggestions,evidence:[...bulkSuggestions.evidence,{id:'unknown',level:3 as const,rationale:'Unknown',feedback:'Ignore'}],targets:[...bulkSuggestions.targets,{id:'required',level:null,rationale:'Insufficient',feedback:'Try again'}],feedback:'x'.repeat(1601)}
 const filled=applyAllSuggestions(limited,emptyDecision(),suggestions).decision
 assert.deepEqual(filled.ratings,{});assert.equal(filled.evidenceRatings.unknown,undefined);assert.equal(filled.feedback.unknown,undefined);assert.equal(filled.scores.bad,undefined);assert.equal(filled.note,'')
 assert.doesNotThrow(()=>validateDecision(limited,filled))
})
test('native rubric feedback and later evidence suggestions fill remaining blanks only',()=>{
 const lab={...bulkDoc,scoreItems:[{id:'dimension',label:'Reasoning',possible:4,step:1,suggested:3,feedback:'Connect the evidence to the claim.'}],gradeMode:'dimensions' as const,suggestedFeedback:'Native overall suggestion'}
 const first=applyAllSuggestions(lab,emptyDecision(),null)
 assert.equal(first.count,3);assert.equal(first.decision.scores.dimension,3);assert.equal(first.decision.feedback.dimension,lab.scoreItems[0].feedback);assert.equal(first.decision.note,lab.suggestedFeedback)
 const second=applyAllSuggestions(lab,first.decision,bulkSuggestions)
 assert.equal(second.decision.note,lab.suggestedFeedback);assert.equal(second.decision.scores.dimension,3);assert.equal(second.decision.ratings.target,3)
 assert.doesNotThrow(()=>validateDecision(lab,second.decision,true))
})
