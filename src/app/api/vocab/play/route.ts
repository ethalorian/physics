import {withAuth} from '@/lib/api-auth'
import {accessVocabTask} from '@/lib/vocab-access'
import {vocabularyFor} from '@/lib/vocab-scope-server'
import {readingJson} from '@/lib/textbook-assignments-server'
export const GET=withAuth(async(req,ctx)=>{
 const sp=req.nextUrl.searchParams, taskId=sp.get('task_id')
 if(taskId){
  const task=await accessVocabTask(taskId,ctx)
  if(!task||!task.active||task.task_kind==='quiz')return readingJson({error:'Assignment unavailable'},403)
  return readingJson({label:task.title,scoreSetId:task.words[0]?.vocabulary_set_id??null,terms:task.words.map(t=>({...t,definitionEs:t.definition_es}))})
 }
 const setId=sp.get('set_id'),lessonId=sp.get('lesson_id'),unitId=sp.get('unit_id'),tier=sp.get('tier')
 if(!setId&&!lessonId&&!unitId)return readingJson({error:'Choose a lesson, unit, or assigned word set.'},400)
 const available=await vocabularyFor(ctx,{courseId:sp.get('class')})
 const sets=available.sets.filter(s=>setId?s.id===setId:lessonId?s.lesson_id===lessonId:s.unit_id===unitId)
 if(!sets.length)return readingJson({terms:[],scoreSetId:null,label:'Vocabulary is not open for your class.'})
 const ids=new Set(sets.flatMap(s=>s.term_ids)),terms=available.words.filter(w=>ids.has(w.id)&&(!tier||tier==='all'||w.tier===Number(tier)))
 return readingJson({lessonSlug:sets.length===1?sets[0].lesson_slug:null,terms:terms.map(t=>({...t,definitionEs:t.definition_es})),scoreSetId:sets[0].id,label:setId?sets[0].label:lessonId?sets[0].lesson_title:available.units.find(u=>u.id===unitId)?.name??'Class vocabulary'})
})
