import {NextResponse} from 'next/server'
import {withAuth} from '@/lib/api-auth'
import {supabaseAdmin} from '@/lib/supabase'
import {accessibleAssignment,privateHeaders} from '@/lib/interactive-assignments/server'
import {assignmentBySlug} from '@/lib/interactive-assignments/catalog'
export const GET=withAuth<{id:string}>(async(_req,ctx)=>{
 const {id}=await ctx.params,a=await accessibleAssignment(ctx,id)
 if(ctx.role!=='student'||ctx.realRole!=='student'||!a||!assignmentBySlug(a.slug)?.foundation)return NextResponse.json({error:'Use your own assigned foundation.'},{status:403,headers:privateHeaders})
 const {data,error}=await supabaseAdmin.from('foundation_discussion_drafts').select('drafts,version').eq('assignment_id',id).eq('user_id',ctx.userId).maybeSingle()
 if(error)throw error
 return NextResponse.json(data??{drafts:{},version:0},{headers:privateHeaders})
})
export const POST=withAuth<{id:string}>(async(req,ctx)=>{
 const {id}=await ctx.params,a=await accessibleAssignment(ctx,id)
 if(ctx.role!=='student'||ctx.realRole!=='student'||!a||!assignmentBySlug(a.slug)?.foundation)return NextResponse.json({error:'Use your own assigned foundation.'},{status:403,headers:privateHeaders})
 let b;try{b=await req.json()}catch{return NextResponse.json({error:'Invalid draft.'},{status:422,headers:privateHeaders})}
 if(!Number.isInteger(b?.version)||b.version<0||!b.drafts||typeof b.drafts!=='object'||Array.isArray(b.drafts)||Object.keys(b.drafts).length>18||Object.entries(b.drafts).some(([k,v])=>!/^(group|independent):(evidence|model|questions)-(share|reply|reflect)$/.test(k)||typeof v!=='string'||v.length>4000))return NextResponse.json({error:'Choose a discussion field of at most 4,000 characters.'},{status:422,headers:privateHeaders})
 const {data,error}=await supabaseAdmin.rpc('foundation_save_discussion_drafts',{p_assignment:id,p_user:ctx.userId,p_version:b.version,p_drafts:b.drafts})
 if(error){if(error.code==='P0001')return NextResponse.json({error:error.message},{status:409,headers:privateHeaders});throw error}
 return NextResponse.json(data,{headers:privateHeaders})
})
