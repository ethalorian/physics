import {withRole} from '@/lib/api-auth'
import {supabaseAdmin} from '@/lib/supabase'
import {ownerEmailsFor} from '@/lib/identity-aliases'
export const GET=withRole(['teacher','admin'],async(_request,ctx)=>{
 const {data,error}=await supabaseAdmin.rpc('automatic_grading_status',{p_owner_emails:ownerEmailsFor(ctx.scopeEmail)})
 if(error)throw error
 return Response.json(data,{headers:{'Cache-Control':'private, no-store'}})
})
