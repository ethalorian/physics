import {withRole} from '@/lib/api-auth'
import {readingJson} from '@/lib/textbook-assignments-server'
import {vocabularyTeachingChoices} from '@/lib/vocab-teaching-source-server'
export const GET=withRole(['teacher','admin'],async(_req,ctx)=>readingJson({sources:await vocabularyTeachingChoices(ctx)}))
