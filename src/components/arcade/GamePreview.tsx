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
        <div className={styles.unavailable}>
          <strong>{name}</strong>
          <span>Gameplay preview coming soon</span>
        </div>
      )}
    </div>
  )
}
