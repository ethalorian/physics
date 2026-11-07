import Link from 'next/link'
import { MASTERY_WORK_XP, unitFloor, type MasteryXpReport } from '@/lib/assigned-mastery-xp'

export default function MasteryXpProgress({report,units,loading,failed}:{report?:MasteryXpReport;units:{id:string;name:string}[];loading:boolean;failed:boolean}) {
  const visible = units.filter(u => report?.items.some(i=>i.unitId===u.id) || report?.posted.some(p=>p.unitId===u.id))
  return <section id="mastery-xp" tabIndex={-1} className="space-y-3 rounded-xl border p-4">
    <h4 className="font-bold">My unit XP</h4>
    <p className="text-sm">Submit 4 out of every 5 assigned mastery activities to meet the floor. Each earns {MASTERY_WORK_XP} XP once, even if you revise. Quizzes, labs and transfer tasks have their own categories.</p>
    {loading || failed || !report ? <p role="status">{loading ? 'Loading assigned XP…' : 'Assigned XP is unavailable.'}</p> : report.enabled===false ? <p>Your teacher hasn’t enabled this floor for your class yet. No unit grade is counted.</p> : !visible.length ? <p>No eligible work assigned yet.</p> : visible.map(u=>{
      const items=report.items.filter(i=>i.unitId===u.id), posted=report.posted.find(p=>p.unitId===u.id)
      const count=posted?.completed ?? items.filter(i=>i.submitted).length,total=posted?.assigned ?? items.length
      const {needed,remaining,met}=unitFloor(count,total)
      return <div className="space-y-2 border-t pt-3" key={u.id}><div className="flex flex-wrap justify-between gap-2"><strong>{u.name}</strong><span>{posted ? 'Posted · ' : 'In progress · '}{met?'Floor met':posted?'Floor not met':remaining+' more to meet the floor'}</span></div>
        <p className="text-sm">{count} of {total} submitted · {count*MASTERY_WORK_XP} / {needed*MASTERY_WORK_XP} floor XP</p>
        <progress aria-label={u.name+' XP floor progress'} value={Math.min(count,needed)} max={Math.max(1,needed)} className="w-full accent-primary"/>
        {!!items.length && <details><summary className="cursor-pointer font-medium">See eligible assignments ({items.length})</summary><ul className="divide-y">{[...items].sort((a,b)=>Number(a.submitted)-Number(b.submitted)).map(i=><li key={i.key} className="flex flex-wrap justify-between gap-2 py-2 text-sm"><Link className="underline" href={i.href}>{i.title}</Link><span>{i.credited?'✓ 10 XP credited':i.submitted?'Submitted · credit pending':'To do · 10 XP'}</span></li>)}</ul></details>}
      </div>
    })}
  </section>
}
