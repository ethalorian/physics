import {withAuth} from '@/lib/api-auth'
import {quizJson} from '@/lib/quizzes/server'
import {publicMcasItem} from '@/lib/mcas/bank'
// Released source content only: answer keys and teacher guides never leave this endpoint.
export const GET=withAuth(async(req)=>{
  const id=new URL(req.url).pathname.split('/').pop()??'',item=publicMcasItem(id)
  return item?quizJson({item}):quizJson({error:'This MCAS question was not found.'},404)
})
