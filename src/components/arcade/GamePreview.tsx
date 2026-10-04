'use client'

import { useState } from 'react'
import Image from 'next/image'
import previews from './game-previews.json'
import styles from './game-preview.module.css'

/** Real practice-game captures, keyed by the cabinet's source file, not its category. */
export default function GamePreview({ srcPath, name }: { srcPath: string; name: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const source = (previews as Record<string, string>)[srcPath]

  return (
    <div className={styles.preview}>
      {source && failedSource !== source ? (
        <Image
          src={source}
          alt={`${name} gameplay preview`}
          fill
          sizes="(max-width: 380px) 90vw, (max-width: 620px) 44vw, (max-width: 800px) 30vw, (max-width: 1150px) 34vw, 320px"
          className={styles.image}
          onError={() => setFailedSource(source)}
        />
      ) : (
        <svg className={styles.fallback} viewBox="0 0 640 360" role="img" aria-label={`${name} illustrated arcade cabinet`}>
          <path d="M0 0H640V360H0Z" fill="#102c38" />
          <path d="M0 280H640M80 0V360M560 0V360" stroke="#54808a" opacity=".25" />
          <circle cx="320" cy="180" r="145" fill="none" stroke="#84c8bb" opacity=".18" />
          <path d="M220 54H420L440 275H200Z" fill="#315f61" stroke="#a8ddc9" strokeWidth="3" />
          <rect x="237" y="76" width="166" height="112" rx="8" fill="#081b29" />
          <path d="M252 165L286 135L318 147L361 105L386 119" fill="none" stroke="#baf3d5" strokeWidth="5" />
          <circle cx="361" cy="105" r="7" fill="#f5d392" />
          <path d="M257 236V207" stroke="#e8c886" strokeWidth="7" /><circle cx="257" cy="205" r="12" fill="#e8c886" />
          <circle cx="355" cy="230" r="10" fill="#eea598" /><circle cx="390" cy="219" r="10" fill="#abd4b8" />
          <text x="320" y="319" textAnchor="middle" fill="#ddf2ef" fontSize="20" fontFamily="Arial,sans-serif">{name}</text>
        </svg>
      )}
    </div>
  )
}
