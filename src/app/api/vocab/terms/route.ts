import { NextResponse } from 'next/server'
import { withContentEditor } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { UUID } from '@/lib/vocab-learning'
export const PATCH=withContentEditor('vocabulary',async(req)=>{
 const b=await req.json() as {id:string;icon:string;example:string;definition_es:string;translations:Record<string,{term?:string;definition?:string}>;tier:number|null}
 if(!UUID.test(b.id)||![null,1,2,3].includes(b.tier)||[b.icon,b.example,b.definition_es].some(v=>typeof v!=='string'||v.length>2000)||!b.translations||typeof b.translations!=='object'||Array.isArray(b.translations)||Object.entries(b.translations).some(([lang,t])=>!/^[a-z]{2,3}$/.test(lang)||!t||typeof t!=='object'||Object.entries(t).some(([k,v])=>!['term','definition'].includes(k)||typeof v!=='string'||v.length>2000)))return NextResponse.json({error:'Check the word supports and language codes.'},{status:400})
 const {data,error}=await supabaseAdmin.from('vocabulary_terms').update({icon:b.icon,example:b.example,definition_es:b.definition_es,translations:b.translations,tier:b.tier,updated_at:new Date().toISOString()}).eq('id',b.id).eq('archived',false).select('id').maybeSingle();if(error)throw error
 if(!data)return NextResponse.json({error:'Word no longer available'},{status:404})
 return NextResponse.json({ok:true})
})
