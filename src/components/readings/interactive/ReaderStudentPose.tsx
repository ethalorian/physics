import Image from 'next/image'
import { UserRound } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import IllustratedAvatar from '@/components/avatar/IllustratedAvatar'
import type { MeBundle } from '@/app/api/avatar/me/route'
import styles from './reader-story.module.css'

/** Furniture is a scene layer; the saved student's face and equipped items stay intact. */
export function EmptyStudentDesk() {
  return <div className={styles.legacySeat} aria-hidden="true">
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

export default function ReaderStudentPose({ portrait, sampleStudent, pose = 'seated' }: {
  portrait: MeBundle | null; sampleStudent: boolean; pose?: 'seated' | 'standing' | 'running' | 'head'
}) {
  const ready = Boolean(portrait?.setup_completed && portrait.traits)
  const character = ready && portrait ? <Avatar traits={portrait.traits} equipped={{ ...portrait.equipped, background: undefined }} items={portrait.equipped_items} size={124} crop={pose === 'head' ? 'head' : 'full'} decorative /> : <UserRound size={70} aria-hidden="true" />
  if (pose === 'seated') {
    if (sampleStudent) return <Image src="/avatar/illustrated/student-wooden-desk.webp" width={417} height={560} sizes="220px" alt="" aria-hidden="true" className={styles.seatedIllustration} />
    return <div className={styles.legacySeat}><Chair /><div className={styles.seatedCharacter}>{character}</div><Desk /></div>
  }
  if (sampleStudent && pose === 'running') return <span className={styles.runningSprite} aria-hidden="true" />
  if (sampleStudent) return <span className={pose === 'head' ? styles.actorHead : styles.actorStanding}><IllustratedAvatar look="everyday" decorative sizes="70px" /></span>
  return <span className={styles.actorSaved}>{character}</span>
}
