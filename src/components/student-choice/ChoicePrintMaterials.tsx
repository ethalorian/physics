import { foundationBinderMaterials } from '@/lib/foundation-binder-materials'
import { choicePracticePrintPath, type BinderDay, type ChoiceEdition } from '@/lib/student-choice'
import s from '@/components/quizzes/Quiz.module.css'
import c from './StudentChoice.module.css'

export default function ChoicePrintMaterials({ packet, edition, teacher = false }: { packet: BinderDay; edition: ChoiceEdition; teacher?: boolean }) {
  const print = packet.printPackets?.[edition], notes = packet.notes[edition]
  const foundation = packet.unit === 'unit-1' ? foundationBinderMaterials(packet.day, edition) : null
  return <div className={`${s.stack} ${c.printMaterials}`}><h3>Print your lesson</h3><div className={s.actions}>
    <a className={s.button} href={print?.day.path ?? notes?.path} download>{print ? 'Download notes + reading (PDF)' : 'Download notebook page (PDF)'}</a>
    {print && <><a className={s.link} href={notes?.path} download>Download notes only</a><a className={s.link} href={print.unit.path} download>Download all 22 days · {edition.toUpperCase()}</a></>}
    {teacher && <a className={s.link} href={choicePracticePrintPath(packet, packet.options.map((_, i) => i + 1))} download>Download all {packet.options.length} practice options (PDF)</a>}
    {packet.reference && <a className={s.link} href={packet.reference.path} download>Download unit color code (PDF)</a>}
  </div>
  {foundation && <section className={s.stack} aria-label="Foundation lesson materials">
    <h4>Foundation lesson · Day {packet.day}</h4>
    <div className={s.actions}>
      {teacher && <a className={s.button} href={foundation.projector} target="_blank" rel="noreferrer">Project Foundation slides</a>}
      <a className={s.link} href={foundation.choiceSheet} download>Frayer + doodle choice sheet (2 pages)</a>
      <a className={s.link} href={foundation.seiPacket} download>SEI notes, reading + choice sheet (4 pages)</a>
    </div>
    <p className={s.muted}>Print the Foundation choice sheet double-sided. Section E goes on the back for the final meeting.</p>
  </section>}
  <p className={s.muted}>Open the downloaded PDF in your PDF reader to print. {print ? 'Notes + reading: Letter paper, 100% size, double-sided, flip on the long edge. The notes go on the front and the reading on the back, with opposite punch margins.' : 'Notebook: Letter paper, 100% size.'} Print practice pages one-sided.</p></div>
}
