import {withAuth} from '@/lib/api-auth'
import {accessVocabTask} from '@/lib/vocab-access'
import {vocabularyFor} from '@/lib/vocab-scope-server'
import {readingJson} from '@/lib/textbook-assignments-server'

export const GET=withAuth(async(req,ctx)=>{
 const sp=req.nextUrl.searchParams,taskId=sp.get('task_id'),fullUnit=sp.get('practice')==='unit'
 const task=taskId?await accessVocabTask(taskId,ctx):null
 if(taskId&&(!task||!task.active||task.task_kind==='quiz'))return readingJson({error:'Practice assignment unavailable'},403)
 if(task&&!fullUnit)return readingJson({label:task.title,scoreSetId:task.words[0]?.vocabulary_set_id??null,terms:task.words.map(t=>({...t,definitionEs:t.definition_es}))})
 const setId=sp.get('set_id'),lessonId=sp.get('lesson_id'),requestedUnit=sp.get('unit_id'),tier=sp.get('tier')
 if(!task&&!setId&&!lessonId&&!requestedUnit)return readingJson({error:'Choose a unit for vocabulary practice.'},400)
 const available=await vocabularyFor(ctx,{courseId:task?.course_id??sp.get('class'),unitPractice:true})
 const source=available.sets.find(s=>task?s.term_ids.some(id=>task.term_ids.includes(id)):setId?s.id===setId:lessonId?s.lesson_id===lessonId:s.unit_id===requestedUnit)
 const unitId=requestedUnit??(fullUnit?source?.unit_id:null)
 const sets=available.sets.filter(s=>unitId?s.unit_id===unitId:setId?s.id===setId:lessonId?s.lesson_id===lessonId:false)
 if(!sets.length)return readingJson({terms:[],scoreSetId:null,unitId:null,label:'No published vocabulary for this unit.'})
 const ids=new Set(sets.flatMap(s=>s.term_ids)),terms=available.words.filter(w=>ids.has(w.id)&&(fullUnit||!tier||tier==='all'||w.tier===Number(tier)))
 return readingJson({unitId:unitId??source?.unit_id??null,lessonSlug:sets.length===1?sets[0].lesson_slug:null,terms:terms.map(t=>({...t,definitionEs:t.definition_es})),scoreSetId:sets[0].id,label:unitId?available.units.find(u=>u.id===unitId)?.name??'Unit vocabulary':setId?sets[0].label:sets[0].lesson_title})
})
