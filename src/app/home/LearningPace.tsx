'use client'
import { AlertTriangle, CalendarCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ENGAGEMENT_TARGET, type LearningPace as Pace } from '@/lib/learning-week'
import s from './LearningWeek.module.css'

function dateRange(dates: string[]) {
 const label = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric' })
 return dates.length ? `${label(dates[0])} – ${label(dates.at(-1)!)}` : 'No completed school days yet'
}

export default function LearningPace({ data, loading, error, onRetry, onToday }: { data: Pace | null; loading: boolean; error: boolean; onRetry: () => void; onToday: () => void }) {
 const low = !!data?.ready && data.engagement !== null && data.engagement < ENGAGEMENT_TARGET
 const history = data?.historical
 return <section className={s.pace} aria-labelledby="learning-pace-heading">
  <header className={s.heading}><div><p className={s.eyebrow}>Build a steady rhythm</p><h2 id="learning-pace-heading">Your learning pace</h2></div><p className={s.muted}>Your recent rhythm and longer-term consistency</p></header>
  {error ? <div role="alert"><p>Your learning pace couldn’t load. No low-engagement warning is calculated while data is unavailable.</p><Button variant="outline" onClick={onRetry}>Retry learning pace</Button></div> : <div className={s.paceGrid} aria-busy={loading}>
   <div className={s.paceMetric} role="group" aria-labelledby="learning-xp-heading">
    <h3 id="learning-xp-heading"><Sparkles size={17} aria-hidden="true" />Learning XP rate</h3>
    <div className={s.ratePeriod} role="group" aria-label="Recent learning XP rate">
     <p className={s.periodLabel}>Recent · last 5 school days</p>
     <p className={s.rate}>{loading || data?.xpRate == null ? '—' : data.xpRate}<span> XP / school day</span></p>
     <p className={s.muted}>{data?.dates.length ? `${data.learningXp} learning XP ÷ ${data.dates.length} school days` : 'Building your learning history'}</p>
     <p className={s.periodDates}>{loading ? 'Checking dates…' : dateRange(data?.dates ?? [])}</p>
    </div>
    <div className={s.historicalRate} role="group" aria-label="Historical learning XP rate">
     <p className={s.periodLabel}>Historical · this school year</p>
     <p className={s.rate}>{loading || history?.xpRate == null ? '—' : history.xpRate}<span> XP / school day</span></p>
     <p className={s.muted}>{history?.dates.length ? `${history.learningXp} learning XP ÷ ${history.dates.length} school days` : 'Building your learning history'}</p>
     <p className={s.periodDates}>{loading ? 'Checking dates…' : dateRange(history?.dates ?? [])}</p>
    </div>
    <span className={s.tag}>Target being calibrated</span>
   </div>
   <div className={s.paceMetric} role="group" aria-labelledby="engagement-heading">
    <h3 id="engagement-heading"><CalendarCheck size={17} aria-hidden="true" />Engagement</h3>
    <div className={s.ratePeriod} role="group" aria-label="Recent engagement rate">
     <p className={s.periodLabel}>Recent · last 5 school days</p>
     <p className={s.rate}>{loading || data?.engagement == null ? '—' : `${data.engagement}%`}<span> / 80% target</span></p>
     <p className={s.muted}>{data?.dates.length ? `${data.activeDays} of ${data.dates.length} school days with learning activity` : 'Building your learning history'}</p>
     <p className={s.periodDates}>{loading ? 'Checking dates…' : dateRange(data?.dates ?? [])}</p>
     <progress max={100} value={data?.engagement ?? 0} aria-label="Recent engagement percentage" />
    <span className={s.tag}>{loading ? 'Checking…' : !data?.calendarReady ? 'School calendar unavailable' : !data.ready ? 'Building history' : low ? 'Recent rate below 80%' : 'On track'}</span>
    </div>
    <div className={s.historicalRate} role="group" aria-label="Historical engagement rate">
     <p className={s.periodLabel}>Historical · this school year</p>
     <p className={s.rate}>{loading || history?.engagement == null ? '—' : `${history.engagement}%`}<span> / 80% target</span></p>
     <p className={s.muted}>{history?.dates.length ? `${history.activeDays} of ${history.dates.length} school days with learning activity` : 'Building your learning history'}</p>
     <p className={s.periodDates}>{loading ? 'Checking dates…' : dateRange(history?.dates ?? [])}</p>
     <progress max={100} value={history?.engagement ?? 0} aria-label="Historical engagement percentage" />
    </div>
   </div>
   <div className={low ? s.warning : s.paceNote}>{low ? <><h3><AlertTriangle size={19} aria-hidden="true" />5% term-grade credit at risk</h3><p>Your recent engagement is {data!.engagement}%. If your engagement stays below 80%, you will not earn the 5% engagement credit on your term grade.</p></> : <><h3>{data?.ready ? 'Keep your learning moving' : 'Every learning day counts'}</h3><p>{data?.ready ? 'Your recent engagement is on track. Keep making meaningful progress on school days.' : 'We use five completed school days before showing an engagement warning.'}</p></>}<button type="button" onClick={onToday}>Open today’s learning →</button></div>
  </div>}
  <details className={s.definition}><summary>How are these rates calculated?</summary><p>Engagement is school days with meaningful learning activity ÷ school days. Submitting work, saving a lesson response, completing a vocabulary check, or answering vocabulary practice counts. Simply visiting a page, opening an activity, and spinning for rewards do not count.</p><p>Recent rates use the last five completed school days. Historical rates use all completed school days since enrollment in the current school calendar, starting at the later of enrollment or the calendar’s start date. Both exclude weekends, school-calendar holidays, and today, which is still in progress. Days without learning activity remain in the denominator. Historical rates use the full totals, not an average of weekly percentages.</p><p>Learning XP includes lesson, math, vocabulary, and review earnings on those dates; game payouts, spins, and discretionary bonuses are excluded. The XP target is being calibrated; no XP-rate warning is applied.</p><p>The engagement message uses the recent rate as an early warning about the term-grade requirement, not a final term-grade calculation. Teacher observations in My growth show your understanding separately.</p></details>
 </section>
}
