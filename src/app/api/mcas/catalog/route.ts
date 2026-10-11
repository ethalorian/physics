import {withRole} from '@/lib/api-auth'
import {quizJson} from '@/lib/quizzes/server'
import {mcasPresets} from '@/lib/mcas/presets'
import {searchMcas} from '@/lib/mcas/bank'
export const GET=withRole(['admin','teacher'],async(req)=>{const params=new URL(req.url).searchParams;return quizJson(params.get('presets')==='1'?{presets:mcasPresets()}:searchMcas(params))})
