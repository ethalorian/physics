import { UserRound } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import AvatarFigure from './AvatarFigure'
import type { MeBundle } from '@/app/api/avatar/me/route'
import { withDefaults } from '@/lib/avatar/types'
import styles from './avatar-character.module.css'

// Preview students use the same free parts, proportions and animation as saved avatars.
const SAMPLE_STUDENT: MeBundle = {
  alias: null, setup_completed: true, equipped: {}, equipped_items: [],
  traits: withDefaults({ skin: 'tan', hair_style: 'short', hair_color: 'brown', shirt_style: 'hoodie', shirt_color: 'navy' }),
}

/** Furniture is a scene layer; the saved student's face and equipped items stay intact. */
export function EmptyStudentDesk() {
  return <div className={styles.seat} data-avatar-pose="seated" aria-hidden="true">
    <Chair />
    <Desk />
  </div>
}
function Chair() {
  return <svg className={styles.chair} viewBox="0 0 220 230" aria-hidden="true">
    <g fill="#996538" stroke="#5b3c29" strokeWidth="3"><path d="M58 87h13v132H58zM142 87h13v132h-13z" /><rect x="48" y="65" width="117" height="45" rx="8" /><path d="M45 164h125v14H45z" /></g>
    <path d="M57 79h99M57 95h99" stroke="#c18f53" strokeWidth="3" />
  </svg>
}
function Desk() {
  return <svg className={styles.desk} viewBox="0 0 220 230" aria-hidden="true">
    <g fill="#a77543" stroke="#5b3c29" strokeWidth="3"><path d="M25 150h12v76H25zM185 150h12v76h-12z" /><path d="M23 145h176v36H23z" /><rect x="13" y="135" width="195" height="17" rx="4" fill="#cc9b60" /></g>
    <path d="M26 159h159M31 170h140" stroke="#bd8b53" strokeWidth="2" />
    <path d="M100 137 72 123 37 129 63 144zM100 137l35-11 36 8-39 13z" fill="#fff8df" stroke="#755e41" strokeWidth="2" />
    <path d="m111 134 21-5m-16 9 22-6m-79-1 15-3m-9 7 15-3" stroke="#bdba9d" strokeWidth="1.5" />
    <path d="m161 140 28-9" stroke="#e5b952" strokeWidth="4" />
  </svg>
}

function SeatedLegs() {
  return <svg className={styles.legs} viewBox="0 0 220 230" aria-hidden="true">
    <path d="M78 166h25l-3 47H80zM111 166h25l4 47h-20z" fill="#3b4650" stroke="#26343c" strokeWidth="3" />
    <path d="M80 207h21v12H68q-4-9 12-12ZM120 207h19q16 3 13 12h-31Z" fill="#eee6d4" stroke="#655f51" strokeWidth="2" />
    <path d="M70 220h31M122 220h29" stroke="#b0a690" strokeWidth="3" />
  </svg>
}

export default function AvatarCharacter({ portrait, sampleStudent, pose = 'seated' }: {
  portrait: MeBundle | null; sampleStudent: boolean; pose?: 'seated' | 'standing' | 'side' | 'walking' | 'running' | 'head'
}) {
  const student = sampleStudent ? SAMPLE_STUDENT : portrait
  const ready = Boolean(student?.setup_completed && student.traits)
  const character = ready && student ? <Avatar traits={student.traits} equipped={{ ...student.equipped, background: undefined }} items={student.equipped_items} size={124} crop={pose === 'head' ? 'head' : 'full'} className={styles.savedPortrait} comic decorative /> : <UserRound size={70} aria-hidden="true" />
  if (pose === 'seated') {
    return <div className={styles.seat} data-avatar-pose="seated"><Chair /><SeatedLegs /><div className={styles.seatedCharacter}>{character}</div><Desk /></div>
  }
  if (ready && student && pose !== 'head') return <AvatarFigure portrait={student} pose={pose === 'side' || pose === 'walking' || pose === 'running' ? pose : 'standing'} />
  return <span className={styles.actorSaved}>{character}</span>
}
