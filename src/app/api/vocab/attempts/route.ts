import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { UUID } from '@/lib/vocab-learning'
interface Attempt {event_id?:string;term_id:string;correct:boolean;ms?:number;occurred_at?:string;l1_shown?:boolean;support_level?:string}
export const POST=withAuth(async(req,ctx)=>{
 const b=await req.json() as {owner_id?:string;game:string;l1_shown?:boolean;support_level?:string;attempts:Attempt[]}
 if(b.owner_id && b.owner_id!==ctx.userId)return NextResponse.json({error:'Practice belongs to another signed-in user'},{status:403})
 if(ctx.realRole!=='student')return NextResponse.json({recorded:0,skipped:'staff'})
 const games=['matching','crossword','quiz-bowl','word-shoot','hangman','letter-catch','concentration','duel','balderdash']
 if(!games.includes(b.game)||!Array.isArray(b.attempts)||b.attempts.length>200||b.attempts.some(a=>!a||!UUID.test(a.term_id)||typeof a.correct!=='boolean'||a.event_id!==undefined&&(typeof a.event_id!=='string'||a.event_id.length>200)))return NextResponse.json({error:'Invalid practice events'},{status:400})
 if(!b.attempts.length)return NextResponse.json({recorded:0})
 const {data:terms,error:t}=await supabaseAdmin.from('vocabulary_terms').select('id,vocabulary_set_id').in('id',b.attempts.map(a=>a.term_id));if(t)throw t
 if(b.attempts.some(a=>!terms?.some(t=>t.id===a.term_id)))return NextResponse.json({error:'Word unavailable. Reload the game.'},{status:409})
 const rows=b.attempts.map(a=>{const level=a.support_level??b.support_level;return {user_id:ctx.userId,event_id:a.event_id??randomUUID(),term_id:a.term_id,vocabulary_set_id:terms!.find(t=>t.id===a.term_id)!.vocabulary_set_id,game:b.game,correct:a.correct,l1_shown:a.l1_shown??Boolean(b.l1_shown),support_level:['full','partial','bare'].includes(level??'')?level:'bare',response_ms:typeof a.ms==='number'&&Number.isFinite(a.ms)?Math.min(2147483647,Math.max(0,Math.round(a.ms))):null,occurred_at:a.occurred_at&&Number.isFinite(Date.parse(a.occurred_at))?a.occurred_at:new Date().toISOString()}})
 const {error}=await supabaseAdmin.from('vocab_attempts').upsert(rows,{onConflict:'user_id,event_id',ignoreDuplicates:true});if(error)throw error
 return NextResponse.json({recorded:rows.length})
})
