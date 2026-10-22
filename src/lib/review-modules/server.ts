import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { reviewWindowActive } from './schedule'
import { supabaseAdmin } from '@/lib/supabase'
import type { AuthContext } from '@/lib/api-auth'
import type { ReviewManifest, ReviewState } from './state'

export const REVIEW_SLUGS = ['unit-1','unit-1-honors'] as const
export type ReviewAssignment = { slug: string; title: string; course_ids: string[]; owner_email: string; code_salt: string; code_hash: string; code_version: number; created_at: string; due_on: string | null; closes_at: string | null }
export type ReviewWork = { module_slug: string; user_id: string; state: ReviewState; status: 'draft' | 'submitted'; version: number; unlocked_version: number; submitted_at: string | null; updated_at: string }
export const privateHeaders = { 'Cache-Control':'private, no-store', 'X-Robots-Tag':'noindex, nofollow' }
export function hashReviewCode(code: string, salt = randomBytes(16).toString('hex')) { return { code_salt:salt, code_hash:scryptSync(code.trim().toUpperCase(),salt,32).toString('hex') } }
export function checkReviewCode(code: string, assignment: ReviewAssignment) {
 const hash = hashReviewCode(code,assignment.code_salt).code_hash
 return assignment.code_hash.length === hash.length && timingSafeEqual(Buffer.from(hash,'hex'),Buffer.from(assignment.code_hash,'hex'))
}
export async function reviewManifest(slug: string): Promise<ReviewManifest> {
 if (!(REVIEW_SLUGS as readonly string[]).includes(slug)) throw Error('Unknown review module')
 return JSON.parse(await readFile(path.join(process.cwd(),'resources/review-modules',slug+'.json'),'utf8'))
}
export async function reviewHtml(slug: string) { await reviewManifest(slug); return readFile(path.join(process.cwd(),'resources/review-modules',slug+'.html'),'utf8') }
export async function canAccessReview(ctx: AuthContext, assignment: ReviewAssignment) {
 if (ctx.role === 'admin') return true
 if (ctx.role === 'teacher') return ctx.scopeEmail.toLowerCase() === assignment.owner_email.toLowerCase()
 if (!reviewWindowActive(assignment)) return false
 const { data,error } = await supabaseAdmin.from('course_students').select('course_id').eq('student_id',ctx.userId).eq('enrollment_state','ACTIVE').in('course_id',assignment.course_ids).limit(1)
 if (error) throw error
 return !!data?.length
}
export async function getReview(ctx: AuthContext, slug: string) {
 if (!(REVIEW_SLUGS as readonly string[]).includes(slug)) return null
 const { data,error } = await supabaseAdmin.from('review_module_assignments').select('*').eq('slug',slug).maybeSingle()
 if(error)throw error
 if(!data || !await canAccessReview(ctx,data))return null
 const {data:work,error:workError}=await supabaseAdmin.from('review_module_work').select('*').eq('module_slug',slug).eq('user_id',ctx.userId).maybeSingle()
 if(workError)throw workError
 return {assignment:data as ReviewAssignment,work:work as ReviewWork|null,staff:ctx.role!=='student'}
}
