import 'server-only'
import { supabaseAdmin } from '@/lib/supabase'
import { processQuizSubmission } from '@/lib/quizzes/grading-server'
import { processVelocitySubmission } from '@/lib/interactive-assignments/grading-server'
import { processReviewScore, queueReviewScores } from '@/lib/review-modules/grading-server'
import { processSuggestion } from './suggestions-server'
import { SUGGESTION_SOURCES, type SuggestionSource } from './suggestions'
import { AUTOMATIC_BATCH_SIZE, type AutomaticJob } from './retry'

/** The queue contains only current, unreleased work in enabled teachers' active classes. */
export async function runAutomaticGrading() {
  if (!process.env.ANTHROPIC_API_KEY) throw Error('Claude is not configured.')
  const claimed = await supabaseAdmin.rpc('claim_automatic_grading', { p_limit: AUTOMATIC_BATCH_SIZE })
  if (claimed.error) throw claimed.error
  const jobs = (claimed.data ?? []) as AutomaticJob[]
  const outcomes = await Promise.allSettled(jobs.map(async job => {
    let error: string | null = null
    try {
      if (job.source === 'quiz') await processQuizSubmission(job.source_id, true)
      else if (job.source === 'interactive') await processVelocitySubmission(job.source_id, true)
      else if (job.source === 'review') {
        const slug = job.source_id.split(':')[0]
        await queueReviewScores([slug], [job.user_id], false, true)
        await processReviewScore([slug], [job.user_id])
        await processSuggestion('review', job.source_id, true)
      } else if ((SUGGESTION_SOURCES as readonly string[]).includes(job.source)) {
        await processSuggestion(job.source as SuggestionSource, job.source_id, true)
      } else throw Error('Unsupported assessment source.')
    } catch (cause) {
      error = cause instanceof Error ? cause.message.slice(0, 250) : 'Analysis could not finish.'
    }
    // SQL verifies the source result and current version; a fulfilled provider call alone is not success.
    const finished = await supabaseAdmin.rpc('finish_automatic_grading', {
      p_source: job.source, p_id: job.source_id, p_version: job.version, p_lock: job.lock_id, p_error: error,
    })
    if (finished.error) throw finished.error
    return finished.data as string
  }))
  const summary = { claimed: jobs.length, ready: outcomes.filter(r => r.status === 'fulfilled' && r.value === 'ready').length, retrying: outcomes.filter(r => r.status === 'fulfilled' && r.value === 'queued').length, attention: outcomes.filter(r => r.status === 'fulfilled' && r.value === 'attention').length, errors: outcomes.filter(r => r.status === 'rejected').length }
  console.info('[automatic-grading]', summary)
  return summary
}
