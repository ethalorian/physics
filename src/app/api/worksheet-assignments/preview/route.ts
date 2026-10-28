import {withRole} from '@/lib/api-auth'
import {quizJson} from '@/lib/quizzes/server'
import {worksheetQuizPreview} from '@/lib/worksheet-assignments-server'
import {worksheetLabels,type WorksheetTrack} from '@/lib/daily-worksheets'
export const GET=withRole(['teacher','admin'],async(req)=>{
 const p=new URL(req.url).searchParams,edition=p.get('edition')??'cpa'
 if(!Object.hasOwn(worksheetLabels,edition))return quizJson({error:'Choose a worksheet edition.'},400)
 try{return quizJson(await worksheetQuizPreview(p.get('unit')??'',Number(p.get('day')),edition as WorksheetTrack,'preview'))}catch(e){return quizJson({error:(e as Error).message},400)}
})
