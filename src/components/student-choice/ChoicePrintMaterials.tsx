import type { BinderDay, ChoiceEdition } from '@/lib/student-choice'
import s from '@/components/quizzes/Quiz.module.css'
import c from './StudentChoice.module.css'

export default function ChoicePrintMaterials({ packet, edition, teacher = false }: { packet: BinderDay; edition: ChoiceEdition; teacher?: boolean }) {
  const print = packet.printPackets?.[edition], notes = packet.notes[edition]
  return <div className={`${s.stack} ${c.printMaterials}`}><h3>Print your lesson</h3><div className={s.actions}>
    <a className={s.button} href={print?.day.path ?? notes?.path} target="_blank" rel="noopener noreferrer">{print ? 'Print notes + reading' : 'Print notebook page'}</a>
    {print && <><a className={s.link} href={notes?.path} target="_blank" rel="noopener noreferrer">Notes only</a><a className={s.link} href={print.unit.path} target="_blank" rel="noopener noreferrer">All 22 days · {edition.toUpperCase()}</a></>}
    {teacher && packet.practicePrintBase && <a className={s.link} href={`${packet.practicePrintBase}/day-${String(packet.day).padStart(2, '0')}-practice-all.html`} target="_blank" rel="noopener noreferrer">Print all six practice options</a>}
  </div><p className={s.muted}>{print ? 'Notes + reading: Letter paper, 100% size, double-sided, flip on the long edge. The notes go on the front and the reading on the back, with opposite punch margins.' : 'Notebook: Letter paper, 100% size.'} Print practice pages one-sided.</p></div>
}
