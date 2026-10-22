import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { getReview, privateHeaders, REVIEW_SLUGS } from '@/lib/review-modules/server'

export const GET = withAuth(async (_request,ctx) => {
 const reviews = await Promise.all(REVIEW_SLUGS.map(slug=>getReview(ctx,slug)))
 return NextResponse.json({staff:ctx.role!=='student',assignments:reviews.filter(r=>!!r).map(r=>({slug:r.assignment.slug,title:r.assignment.title,created_at:r.assignment.created_at,due_on:r.assignment.due_on,closes_at:r.assignment.closes_at,status:r.work?.status??'not_started',unlocked:r.staff||r.work?.unlocked_version===r.assignment.code_version}))},{headers:privateHeaders})
})
