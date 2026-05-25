"use client"

import { useEffect, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { isMuted, setMuted } from '@/lib/arcade-sound'

// Small speaker toggle for the arcade games; remembers the choice per device.
export default function SoundToggle() {
  const [muted, setM] = useState(false)
  useEffect(() => { setM(isMuted()) }, [])
  const toggle = () => { const v = !muted; setMuted(v); setM(v) }
  return (
    <button onClick={toggle} aria-label={muted ? 'Unmute' : 'Mute'} title={muted ? 'Sound off' : 'Sound on'}
      className="grid place-items-center rounded-lg border" style={{ width: 30, height: 30, borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
      {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
    </button>
  )
}
