"use client"

import { useEffect, useRef, useState } from 'react'
import { Mic, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Recognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }

export default function ObservationFeedback({ value, disabled, onChange, onActiveChange }: {
  value: string; disabled: boolean; onChange: (value: string) => void; onActiveChange: (active: boolean) => void
}) {
  const [supported, setSupported] = useState(false)
  const [active, setActive] = useState(false)
  const [status, setStatus] = useState('')
  const [interim, setInterim] = useState('')
  const recognition = useRef<Recognition | null>(null)

  useEffect(() => {
    const browser = window as SpeechWindow
    setSupported(Boolean(browser.SpeechRecognition || browser.webkitSpeechRecognition))
    return () => {
      const current = recognition.current
      if (current) {
        current.onresult = null
        current.onerror = null
        current.onend = null
        current.abort()
      }
      onActiveChange(false)
    }
  }, [onActiveChange])

  function dictate() {
    if (recognition.current || disabled) return
    const browser = window as SpeechWindow
    const Constructor = browser.SpeechRecognition || browser.webkitSpeechRecognition
    if (!Constructor) return
    const current = new Constructor()
    recognition.current = current
    current.lang = navigator.language || 'en-US'
    current.continuous = true
    current.interimResults = true
    let text = value
    const finalized = new Set<number>()
    setStatus('Listening...')
    setActive(true)
    onActiveChange(true)
    current.onresult = (event) => {
      let pending = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal && !finalized.has(i)) {
          finalized.add(i)
          text = `${text}${text && !/\s$/.test(text) ? ' ' : ''}${result[0].transcript.trim()}`
          onChange(text.slice(0, 2000))
        } else if (!result.isFinal) pending += result[0].transcript
      }
      setInterim(pending)
      if (text.length >= 2000) {
        setStatus('Feedback has reached 2,000 characters. Review before saving.')
        current.stop()
      }
    }
    current.onerror = ({ error }) => {
      setStatus(error === 'not-allowed' || error === 'service-not-allowed'
        ? 'Microphone access was denied. Allow it in browser settings, or use keyboard dictation.'
        : error === 'no-speech' ? 'No speech heard. Tap the microphone to try again.'
        : 'Dictation is unavailable. Your text is kept; use keyboard dictation or type.')
    }
    current.onend = () => {
      recognition.current = null
      setActive(false)
      onActiveChange(false)
      setInterim('')
      setStatus((old) => old === 'Listening...' ? 'Dictation stopped. Review your feedback before saving.' : old)
    }
    try { current.start() }
    catch {
      current.onend()
      setStatus('Dictation could not start. Use keyboard dictation or type.')
    }
  }

  return <div className="space-y-2">
    <div className="flex items-center justify-between gap-3">
      <label htmlFor="observation-feedback" className="text-caption">Written feedback</label>
      {supported && <Button type="button" variant={active ? 'destructive' : 'outline'} className="min-h-12 gap-2" disabled={disabled || (!active && value.length >= 2000)} aria-pressed={active} onClick={() => active ? recognition.current?.stop() : dictate()}>
        {active ? <Square aria-hidden size={18} /> : <Mic aria-hidden size={20} />}{active ? 'Stop dictation' : 'Dictate feedback'}
      </Button>}
    </div>
    <Textarea id="observation-feedback" className="min-h-40 text-base md:min-h-32" maxLength={2000} disabled={disabled} readOnly={active} placeholder="Name a strength or one concrete next step..." value={value} onChange={(event) => onChange(event.target.value)} />
    {interim && <p className="text-sm text-muted-foreground" aria-live="off">{interim}</p>}
    <p role="status" className="text-sm text-muted-foreground">{status || (!supported ? 'For iPad dictation, tap this field and use the microphone on the keyboard.' : '')}</p>
    <p className="text-caption text-muted-foreground">{value.length}/2000</p>
  </div>
}
