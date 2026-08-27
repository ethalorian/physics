"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Lock, Sparkles, Heart, Star, Trophy } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import { TRAIT_LABELS, TRAIT_OPTIONS, DEFAULT_TRAITS, KNOB_TRAITS, type AvatarTraits, type ItemSlot, type EquippedItems, type AvatarItem } from '@/lib/avatar/types'
import { SKIN, HAIR, EYE, SHIRT } from '@/lib/avatar/palette'
import type { CatalogState } from '@/app/api/avatar/route'

type CatalogEntry = AvatarItem & { state: CatalogState; unlock_progress?: number }

interface Bundle {
  traits: AvatarTraits | null
  setup_completed: boolean
  equipped: EquippedItems
  owned: string[]
  catalog: CatalogEntry[]
  balance: number
  lifetimeEarned: number
  isStaff?: boolean
  alias: string | null
  name: string | null
}

type Tab = 'face' | 'fine' | 'items' | 'gallery'

const SLOT_LABEL: Record<ItemSlot, string> = {
  eyewear: 'Eyewear', head: 'Head & helmets', body: 'Body & coats', pin: 'Pins', background: 'Backgrounds', facial_hair: 'Facial hair',
}

// The guided builder walks these traits one at a time, in this order. The
// geometry knobs (KNOB_TRAITS) are deliberately excluded — they live in the
// Fine-tune tab so onboarding stays short and ends on identity, not sliders.
const WIZARD_ORDER = (Object.keys(TRAIT_OPTIONS) as (keyof AvatarTraits)[]).filter((k) => !KNOB_TRAITS.includes(k))

interface GalleryAvatar {
  user_id: string; name: string; traits: Record<string, string>; equipped: Record<string, string>
  likes: number; liked_by_me: boolean; is_me: boolean
}

export default function AvatarPage() {
  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [tab, setTab] = useState<Tab>('face')
  // wizard → finish → quick. 'finish' is the identity capstone: see your Mii
  // the way classmates will, confirm your leaderboard name, save, leave.
  const [mode, setMode] = useState<'wizard' | 'finish' | 'quick'>('quick')
  const [wizardStart, setWizardStart] = useState(0)
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch('/api/avatar')
      .then((r) => r.json())
      .then((d: Bundle) => {
        setBundle(d)
        // Tell the chrome AccountMenu (and any other listener) to refresh its
        // cached MeBundle — alias, traits, or equipped items may have changed.
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('avatar-updated'))
      })
      .catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])

  // Pick the starting tab ONCE per visit — re-fetches after equip/purchase
  // must not yank the student off the tab they're working on.
  const [initialTabSet, setInitialTabSet] = useState(false)
  useEffect(() => {
    if (bundle && !initialTabSet) {
      setTab(bundle.setup_completed ? 'items' : 'face')
      setMode(bundle.setup_completed ? 'quick' : 'wizard')
      setInitialTabSet(true)
    }
  }, [bundle, initialTabSet])

  // Local traits buffer so the preview reacts instantly even before the server
  // round-trip. Falls back to whatever the server says.
  const [localTraits, setLocalTraits] = useState<Partial<AvatarTraits>>({})
  const previewTraits: Partial<AvatarTraits> = useMemo(() => ({ ...(bundle?.traits ?? {}), ...localTraits }), [bundle?.traits, localTraits])

  const saveTrait = async (key: keyof AvatarTraits, value: string) => {
    setLocalTraits((p) => ({ ...p, [key]: value as never }))
    // Optimistically mark setup_completed in the bundle so the Items tab
    // unlocks immediately after the first carousel change, without refetching
    // the whole bundle (which would jitter the catalog list).
    setBundle((b) => (b && !b.setup_completed ? { ...b, setup_completed: true } : b))
    await fetch('/api/avatar/traits', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ traits: { [key]: value } }),
    }).catch(() => {})
    // No load() here — traits don't change catalog state, and reloading was
    // what caused the tab to snap away mid-edit. Still nudge the chrome to
    // refresh its cached Mii so the dropdown avatar tracks the carousel.
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('avatar-updated'))
  }

  // Leaderboard name. Returns an error string or null. Sending the roster
  // name (or blank) clears the alias server-side so roster edits propagate.
  const saveAlias = async (value: string): Promise<string | null> => {
    const trimmed = value.trim()
    if (trimmed === (bundle?.alias ?? '')) return null
    const res = await fetch('/api/avatar/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias: trimmed === '' ? null : trimmed }),
    }).catch(() => null)
    if (!res?.ok) {
      const body = await res?.json().catch(() => null) as { error?: string } | null
      return body?.error ?? 'Could not save'
    }
    load()
    return null
  }

  const equip = async (slot: ItemSlot, slug: string | null) => {
    setBusy(slug ?? `unequip-${slot}`)
    await fetch('/api/avatar/equip', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot, slug }),
    }).catch(() => {})
    setBusy(null)
    load()
  }

  const purchase = async (slug: string, label: string) => {
    setBusy(slug)
    const res = await fetch('/api/avatar/purchase', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    }).catch(() => null)
    setBusy(null)
    if (res?.ok) {
      setFlash(`${label} is yours.`)
      setTimeout(() => setFlash(null), 2200)
    }
    load()
  }

  if (!bundle) {
    return <div className="max-w-3xl mx-auto p-5 text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading your avatar…</div>
  }

  // Group catalog by slot for the items tab.
  const bySlot: Record<string, CatalogEntry[]> = {}
  for (const item of bundle.catalog) {
    const arr = bySlot[item.slot] ?? []
    arr.push(item)
    bySlot[item.slot] = arr
  }

  return (
    <div className="max-w-5xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <Link href="/home" className="inline-flex items-center gap-1.5 text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
        <ArrowLeft size={15} /> Home
      </Link>

      <div className="grid gap-6" style={{ gridTemplateColumns: 'minmax(240px, 280px) 1fr' }}>
        {/* Left: live preview */}
        <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="flex justify-center">
            <Avatar traits={previewTraits} equipped={bundle.equipped} items={bundle.catalog} size={220} />
          </div>
          {mode === 'quick' && bundle.setup_completed && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <NameField alias={bundle.alias} rosterName={bundle.name} onSave={saveAlias} compact />
            </div>
          )}
          <div className="mt-4 pt-4 text-center" style={{ borderTop: '1px solid var(--border)' }}>
            {bundle.isStaff ? (
              <>
                <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Staff account</div>
                <div className="text-sm mt-1" style={{ color: 'var(--foreground)' }}>Every item is yours to wear</div>
              </>
            ) : (
              <>
                <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Your XP</div>
                <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--reward-foreground)' }}>{bundle.balance.toLocaleString()}</div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>spendable</div>
              </>
            )}
          </div>
          {flash && (
            <div className="mt-3 rounded-lg px-3 py-2 text-xs" style={{ background: 'color-mix(in oklch, var(--success) 18%, transparent)', color: 'var(--success)' }}>
              <Sparkles size={12} className="inline mr-1" /> {flash}
            </div>
          )}
        </div>

        {/* Right: tabs */}
        <div>
          {mode === 'wizard' && (
            <div className="rounded-xl px-4 py-3 mb-4 text-sm" style={{ background: 'color-mix(in oklch, var(--primary) 10%, transparent)', color: 'var(--primary)' }}>
              <strong>Let&apos;s build your Mii.</strong> Pick one feature at a time — tap a face to try it on, then hit Next.
            </div>
          )}

          {/* The guided builder and its finish step are a focused flow — no
              tab bar until the student has saved and (usually) left. */}
          {mode === 'quick' && (
            <div className="flex items-center gap-2 mb-4">
              <TabButton active={tab === 'face'} onClick={() => setTab('face')}>Edit my face</TabButton>
              <TabButton active={tab === 'fine'} onClick={() => setTab('fine')}>Fine-tune</TabButton>
              <TabButton active={tab === 'items'} onClick={() => setTab('items')}>Items</TabButton>
              <TabButton active={tab === 'gallery'} onClick={() => setTab('gallery')}>Gallery</TabButton>
            </div>
          )}

          {mode === 'wizard' && (
            <WizardPanel
              previewTraits={previewTraits}
              equipped={bundle.equipped}
              catalog={bundle.catalog}
              onChoose={saveTrait}
              onFinish={() => setMode('finish')}
              initialStep={wizardStart}
            />
          )}

          {mode === 'finish' && (
            <FinishPanel
              previewTraits={previewTraits}
              equipped={bundle.equipped}
              catalog={bundle.catalog}
              alias={bundle.alias}
              rosterName={bundle.name}
              xp={bundle.balance}
              onSave={saveAlias}
              onBack={() => { setWizardStart(WIZARD_ORDER.length - 1); setMode('wizard') }}
              onDone={() => router.push('/home')}
            />
          )}

          {mode === 'quick' && tab === 'face' && (
            <div className="flex flex-col gap-3">
              <div className="flex justify-end">
                <button onClick={() => { setWizardStart(0); setMode('wizard'); setTab('face') }} className="inline-flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5" style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--primary)', cursor: 'pointer' }}>
                  <Sparkles size={13} /> Guided builder
                </button>
              </div>
              {(Object.keys(TRAIT_OPTIONS) as (keyof AvatarTraits)[]).filter((k) => !KNOB_TRAITS.includes(k)).map((key) => {
                const value = (previewTraits[key] as string) ?? DEFAULT_TRAITS[key]
                if (key === 'skin' || key === 'hair_color' || key === 'eye_color' || key === 'shirt_color') {
                  return (
                    <SwatchRow
                      key={key}
                      label={TRAIT_LABELS[key]}
                      options={TRAIT_OPTIONS[key]}
                      value={value}
                      colorFor={(opt) => (key === 'skin' ? SKIN[opt as keyof typeof SKIN].color : key === 'hair_color' ? HAIR[opt as keyof typeof HAIR].main : key === 'shirt_color' ? SHIRT[opt as keyof typeof SHIRT] : EYE[opt as keyof typeof EYE])}
                      onChange={(v) => saveTrait(key, v)}
                    />
                  )
                }
                return (
                  <TraitCarousel
                    key={key}
                    label={TRAIT_LABELS[key]}
                    options={TRAIT_OPTIONS[key]}
                    value={value}
                    onChange={(v) => saveTrait(key, v)}
                  />
                )
              })}
            </div>
          )}

          {mode === 'quick' && tab === 'fine' && (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'color-mix(in oklch, var(--primary) 10%, transparent)', color: 'var(--primary)' }}>
                <strong>Make it yours.</strong> Small adjustments, big difference — nudge each one and watch the preview.
              </div>
              {KNOB_TRAITS.map((key) => (
                <TraitCarousel
                  key={key}
                  label={TRAIT_LABELS[key]}
                  options={TRAIT_OPTIONS[key]}
                  value={(previewTraits[key] as string) ?? DEFAULT_TRAITS[key]}
                  onChange={(v) => saveTrait(key, v)}
                />
              ))}
            </div>
          )}

          {mode === 'quick' && tab === 'gallery' && <GalleryPanel />}

          {mode === 'quick' && tab === 'items' && (
            <div className="flex flex-col gap-5">
              {Object.entries(bySlot).map(([slot, items]) => (
                <div key={slot}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>{SLOT_LABEL[slot as ItemSlot] ?? slot}</div>
                    {bundle.equipped[slot as ItemSlot] && (
                      <button onClick={() => equip(slot as ItemSlot, null)} className="text-xs rounded-md px-2 py-1" style={{ color: 'var(--muted-foreground)', background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer' }}>
                        Unequip
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                    {items.map((item) => (
                      <ItemCard
                        key={item.slug}
                        item={item}
                        equipped={bundle.equipped[item.slot] === item.slug}
                        busy={busy === item.slug}
                        onEquip={() => equip(item.slot, item.slug)}
                        onBuy={() => purchase(item.slug, item.name)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Guided one-trait-at-a-time builder. Each option is a LIVE mini-Mii showing
// the change, so students "try it on" before committing, then advance.
function WizardPanel({ previewTraits, equipped, catalog, onChoose, onFinish, initialStep = 0 }: {
  previewTraits: Partial<AvatarTraits>
  equipped: EquippedItems
  catalog: CatalogEntry[]
  onChoose: (key: keyof AvatarTraits, value: string) => void
  onFinish: () => void
  initialStep?: number
}) {
  const [step, setStep] = useState(initialStep)
  const key = WIZARD_ORDER[step]
  const options = TRAIT_OPTIONS[key]
  const current = (previewTraits[key] as string) ?? options[0]
  const isLast = step === WIZARD_ORDER.length - 1
  return (
    <div>
      {/* progress rail */}
      <div className="flex items-center gap-1 mb-3">
        {WIZARD_ORDER.map((k, i) => (
          <span key={k} style={{ height: 6, flex: 1, borderRadius: 3, background: i <= step ? 'var(--primary)' : 'var(--secondary)', transition: 'background 0.2s' }} />
        ))}
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Step {step + 1} of {WIZARD_ORDER.length}</span>
        <span className="text-sm font-semibold">{TRAIT_LABELS[key]}</span>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>Tap a face to try it on.</p>

      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))' }}>
        {options.map((o) => {
          const selected = current === o
          const tileTraits = { ...previewTraits, [key]: o }
          return (
            <button key={o} onClick={() => onChoose(key, o)} aria-pressed={selected}
              className="rounded-xl border p-1.5 flex flex-col items-center transition-transform hover:-translate-y-0.5"
              style={{ borderColor: selected ? 'var(--primary)' : 'var(--border)', background: selected ? 'color-mix(in oklch, var(--primary) 12%, var(--card))' : 'var(--card)', cursor: 'pointer' }}>
              <div className="relative">
                {/* The shirt sits below the head crop, so its step previews head + shoulders. */}
                <Avatar traits={tileTraits} equipped={equipped} items={catalog} size={70} crop={key === 'shirt_color' ? 'medium' : 'head'} />
                {selected && <span className="absolute -top-1 -right-1 grid place-items-center rounded-full" style={{ width: 18, height: 18, background: 'var(--primary)', color: 'var(--primary-foreground)' }}><Check size={11} /></span>}
              </div>
              <span className="text-[11px] mt-1 capitalize" style={{ color: selected ? 'var(--primary)' : 'var(--foreground)' }}>{o.replace('_', ' ')}</span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between mt-4">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
          className="inline-flex items-center gap-1 text-sm rounded-lg px-3 py-2 disabled:opacity-40"
          style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', cursor: step === 0 ? 'not-allowed' : 'pointer' }}>
          <ChevronLeft size={15} /> Back
        </button>
        {isLast ? (
          <button onClick={onFinish} className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg px-4 py-2" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', cursor: 'pointer' }}>
            <Sparkles size={15} /> Finish my Mii
          </button>
        ) : (
          <button onClick={() => setStep((s) => s + 1)} className="inline-flex items-center gap-1 text-sm font-semibold rounded-lg px-4 py-2" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', cursor: 'pointer' }}>
            Next <ChevronRight size={15} />
          </button>
        )}
      </div>
    </div>
  )
}

// Whole-school avatar wall: featured (most-liked) row + everyone, with likes.
function GalleryPanel() {
  const [data, setData] = useState<{ items: AvatarItem[]; avatars: GalleryAvatar[]; featured: GalleryAvatar[] } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  useEffect(() => {
    fetch('/api/avatar/gallery').then((r) => r.json()).then(setData).catch(() => setData({ items: [], avatars: [], featured: [] }))
  }, [])
  const like = async (a: GalleryAvatar) => {
    setBusy(a.user_id)
    const res = await fetch('/api/avatar/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_user_id: a.user_id }) }).then((r) => (r.ok ? r.json() : null)).catch(() => null)
    setBusy(null)
    if (res) {
      const patch = (x: GalleryAvatar) => (x.user_id === a.user_id ? { ...x, likes: res.count, liked_by_me: res.liked } : x)
      setData((d) => (d ? { ...d, avatars: d.avatars.map(patch), featured: d.featured.map(patch) } : d))
    }
  }
  if (!data) return <div className="text-sm py-6 text-center" style={{ color: 'var(--muted-foreground)' }}>Loading the gallery…</div>
  if (data.avatars.length === 0) return (
    <div className="rounded-2xl border p-8 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
      No avatars yet — turn on “Show my Mii” and be the first on the wall.
    </div>
  )
  return (
    <div className="flex flex-col gap-5">
      {data.featured.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest mb-2 inline-flex items-center gap-1" style={{ color: 'var(--reward-foreground)' }}><Star size={13} /> Featured</div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
            {data.featured.map((a) => <AvatarCard key={a.user_id} a={a} items={data.items} onLike={() => like(a)} busy={busy === a.user_id} />)}
          </div>
        </div>
      )}
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Everyone</div>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
          {data.avatars.map((a) => <AvatarCard key={a.user_id} a={a} items={data.items} onLike={() => like(a)} busy={busy === a.user_id} />)}
        </div>
      </div>
    </div>
  )
}

function AvatarCard({ a, items, onLike, busy }: { a: GalleryAvatar; items: AvatarItem[]; onLike: () => void; busy: boolean }) {
  return (
    <div className="rounded-xl border p-2 flex flex-col items-center" style={{ borderColor: a.is_me ? 'var(--primary)' : 'var(--border)', background: 'var(--card)' }}>
      <Avatar traits={a.traits} equipped={a.equipped} items={items} size={104} crop="medium" />
      <div className="text-xs font-semibold mt-1 text-center w-full truncate">{a.name}{a.is_me ? ' (you)' : ''}</div>
      <button onClick={onLike} disabled={a.is_me || busy}
        className="mt-1 inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-1"
        style={{ border: '1px solid var(--border)', background: a.liked_by_me ? 'color-mix(in oklch, var(--destructive) 14%, var(--card))' : 'var(--card)', color: a.liked_by_me ? 'var(--destructive)' : 'var(--muted-foreground)', cursor: a.is_me ? 'default' : 'pointer', opacity: a.is_me ? 0.55 : 1 }}>
        <Heart size={12} style={{ fill: a.liked_by_me ? 'currentColor' : 'none' }} /> {a.likes}
      </button>
    </div>
  )
}

// One field, two homes: compact under the preview for returning students
// (saves on blur), and full-size inside the finish step (the parent owns the
// draft via onDraftChange and saves it from its button). Blank or roster-name
// → alias cleared.
function NameField({ alias, rosterName, onSave, compact, onDraftChange }: {
  alias: string | null
  rosterName: string | null
  onSave: (v: string) => Promise<string | null>
  compact?: boolean
  onDraftChange?: (v: string) => void
}) {
  const [draft, setDraft] = useState<string>(alias ?? rosterName ?? '')
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  useEffect(() => { setDraft(alias ?? rosterName ?? '') }, [alias, rosterName])
  useEffect(() => { onDraftChange?.(draft) }, [draft, onDraftChange])

  const commit = async () => {
    if (!compact) return
    setSaving(true); setErr(null)
    const e = await onSave(draft)
    setSaving(false)
    if (e) { setErr(e); return }
    setSaved(true); setTimeout(() => setSaved(false), 1500)
  }
  const usingRoster = draft.trim() === '' || draft.trim().toLowerCase() === (rosterName ?? '').trim().toLowerCase()

  return (
    <label className="block">
      <span className={compact ? 'text-[11px] uppercase tracking-widest font-semibold' : 'text-sm font-semibold'} style={{ color: compact ? 'var(--muted-foreground)' : 'var(--foreground)' }}>
        {compact ? 'Leaderboard name' : 'Your name on the leaderboard'}
      </span>
      <input
        type="text"
        value={draft}
        maxLength={32}
        placeholder={rosterName ?? 'Your name'}
        onChange={(e) => { setDraft(e.target.value); setErr(null) }}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur() }}
        className={`mt-1 w-full rounded-md px-3 ${compact ? 'text-sm py-1.5' : 'text-base py-2.5 font-semibold'}`}
        style={{ background: 'var(--card)', color: 'var(--foreground)', border: '1px solid ' + (err ? 'var(--destructive)' : 'var(--border)') }}
      />
      <div className="flex items-center justify-between mt-1 gap-2">
        <span className="text-[11px]" style={{ color: err ? 'var(--destructive)' : 'var(--muted-foreground)' }}>
          {err ?? (usingRoster ? 'Using your school name. Type something else to pick a nickname.' : `${draft.trim().length}/32 — letters, digits, spaces, . _ -`)}
        </span>
        {compact && (saving || saved) && (
          <span className="text-[11px] shrink-0" style={{ color: saved ? 'var(--success)' : 'var(--muted-foreground)' }}>{saving ? 'Saving…' : 'Saved'}</span>
        )}
      </div>
    </label>
  )
}

// Step 13 — the identity capstone. Shows the Mii exactly where classmates will
// meet it (nav bubble, leaderboard row), confirms the name, then one button
// saves and leaves. Ends on identity, not sliders.
function FinishPanel({ previewTraits, equipped, catalog, alias, rosterName, xp, onSave, onBack, onDone }: {
  previewTraits: Partial<AvatarTraits>
  equipped: EquippedItems
  catalog: CatalogEntry[]
  alias: string | null
  rosterName: string | null
  xp: number
  onSave: (v: string) => Promise<string | null>
  onBack: () => void
  onDone: () => void
}) {
  const [draft, setDraft] = useState<string>(alias ?? rosterName ?? '')
  const onDraftChange = useCallback((v: string) => setDraft(v), [])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  // The mock leaderboard row tracks the field as they type.
  const liveName = draft.trim() || rosterName || 'You'

  const finish = async () => {
    setSaving(true); setErr(null)
    const e = await onSave(draft)
    setSaving(false)
    if (e) { setErr(e); return }
    onDone()
  }

  return (
    <div>
      <div className="flex items-center gap-1 mb-3">
        {WIZARD_ORDER.map((k) => <span key={k} style={{ height: 6, flex: 1, borderRadius: 3, background: 'var(--primary)' }} />)}
        <span style={{ height: 6, flex: 1, borderRadius: 3, background: 'var(--primary)' }} />
      </div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Last step</span>
        <span className="text-sm font-semibold">This is you</span>
      </div>

      <div className="rounded-xl px-4 py-3 mb-4 text-sm" style={{ background: 'color-mix(in oklch, var(--primary) 10%, transparent)', color: 'var(--primary)' }}>
        <strong>Your Mii is your face on the whole site.</strong> Here&apos;s how classmates will see you — in the corner of every page, and on the leaderboard.
      </div>

      {/* Nav bubble + leaderboard row, rendered with the real Avatar component at real sizes */}
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: 'auto 1fr' }}>
        <div className="rounded-xl border p-3 flex flex-col items-center gap-2" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="rounded-full overflow-hidden" style={{ width: 40, height: 40, background: 'var(--secondary)' }}>
            <Avatar traits={previewTraits} equipped={equipped} items={catalog} size={40} crop="head" />
          </div>
          <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Every page</span>
        </div>
        <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="text-[10px] uppercase tracking-widest mb-2 inline-flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}><Trophy size={11} /> Leaderboard</div>
          <div className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ background: 'color-mix(in oklch, var(--primary) 6%, var(--card))', border: '1px solid color-mix(in oklch, var(--primary) 25%, var(--border))' }}>
            <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--muted-foreground)', minWidth: 22 }}>#?</span>
            <div className="rounded-full overflow-hidden shrink-0" style={{ width: 40, height: 40, background: 'var(--secondary)' }}>
              <Avatar traits={previewTraits} equipped={equipped} items={catalog} size={40} crop="head" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate" style={{ color: 'var(--primary)' }}>{liveName}</div>
              <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>0 games · 0 lessons</div>
            </div>
            <div className="text-sm font-bold tabular-nums" style={{ color: 'var(--reward-foreground)' }}>{xp.toLocaleString()} XP</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border p-4 mb-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <NameField alias={alias} rosterName={rosterName} onSave={onSave} onDraftChange={onDraftChange} />
      </div>

      <p className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>
        You can come back any time to fine-tune your face. Hats, glasses and coats unlock as you earn XP.
      </p>

      {err && <div className="text-xs mb-3" style={{ color: 'var(--destructive)' }}>{err}</div>}

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-1 text-sm rounded-lg px-3 py-2" style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer' }}>
          <ChevronLeft size={15} /> Back
        </button>
        <button onClick={finish} disabled={saving} className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg px-5 py-2.5 disabled:opacity-60" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', cursor: 'pointer' }}>
          <Check size={15} /> {saving ? 'Saving…' : 'Save and go home'}
        </button>
      </div>
    </div>
  )
}

function TraitCarousel({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  // Mii-channel single-value picker with prev/next chevrons. Wraps at the
  // ends and shows position so the student knows how many variants exist.
  const idx = Math.max(0, options.indexOf(value))
  const prev = () => onChange(options[(idx - 1 + options.length) % options.length])
  const next = () => onChange(options[(idx + 1) % options.length])
  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-3 py-2"
      style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
    >
      <div className="text-xs font-semibold uppercase tracking-widest" style={{ minWidth: 90, color: 'var(--muted-foreground)' }}>
        {label}
      </div>
      <button
        onClick={prev}
        aria-label={`Previous ${label}`}
        className="grid place-items-center rounded-lg transition-colors"
        style={{ width: 32, height: 32, background: 'transparent', color: 'var(--primary)', border: '1px solid var(--border)', cursor: 'pointer' }}
      >
        <ChevronLeft size={16} />
      </button>
      <div className="flex-1 text-center text-sm font-medium capitalize" style={{ color: 'var(--foreground)' }}>
        {value.replace('_', ' ')}
      </div>
      <button
        onClick={next}
        aria-label={`Next ${label}`}
        className="grid place-items-center rounded-lg transition-colors"
        style={{ width: 32, height: 32, background: 'transparent', color: 'var(--primary)', border: '1px solid var(--border)', cursor: 'pointer' }}
      >
        <ChevronRight size={16} />
      </button>
      <div className="text-[11px] tabular-nums" style={{ minWidth: 36, textAlign: 'right', color: 'var(--muted-foreground)' }}>
        {idx + 1} / {options.length}
      </div>
    </div>
  )
}

function SwatchRow({ label, options, value, colorFor, onChange }: { label: string; options: string[]; value: string; colorFor: (opt: string) => string; onChange: (v: string) => void }) {
  // Colour picker: a row of tappable swatches. The selected swatch gets a ring
  // and a check; the name of the current colour is shown for accessibility.
  return (
    <div className="rounded-xl border px-3 py-2" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
        <div className="text-[11px] capitalize" style={{ color: 'var(--muted-foreground)' }}>{value}</div>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = opt === value
          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              aria-label={`${label}: ${opt}`}
              aria-pressed={selected}
              title={opt}
              className="grid place-items-center rounded-full transition-transform"
              style={{
                width: 28,
                height: 28,
                background: colorFor(opt),
                cursor: 'pointer',
                border: '2px solid ' + (selected ? 'var(--primary)' : 'var(--border)'),
                boxShadow: selected ? '0 0 0 2px var(--card), 0 0 0 4px var(--primary)' : 'none',
              }}
            >
              {selected && <Check size={13} style={{ color: '#FFFFFF', filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.6))' }} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, disabled, children }: { active: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-sm font-semibold rounded-lg px-3 py-1.5 disabled:opacity-40"
      style={{
        background: active ? 'var(--primary)' : 'transparent',
        color: active ? 'var(--primary-foreground)' : 'var(--foreground)',
        border: '1px solid ' + (active ? 'var(--primary)' : 'var(--border)'),
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function ItemCard({ item, equipped, busy, onEquip, onBuy }: { item: CatalogEntry; equipped: boolean; busy: boolean; onEquip: () => void; onBuy: () => void }) {
  const stateBadge: Record<CatalogState, { label: string; color: string }> = {
    owned: { label: 'Owned', color: 'var(--success)' },
    affordable: { label: `${item.cost_xp ?? 0} XP`, color: 'var(--reward-foreground)' },
    too_expensive: { label: `${item.cost_xp ?? 0} XP`, color: 'var(--muted-foreground)' },
    unlock_available: { label: 'Claim!', color: 'var(--success)' },
    locked_until_mastery: { label: 'Locked', color: 'var(--muted-foreground)' },
    staff_free: { label: 'Free for staff', color: 'var(--primary)' },
  }
  const badge = stateBadge[item.state]

  // Preview the item the way the student will actually see it: on a default Mii
  // wearing just this item. Items are authored in face/body coordinates (pins at
  // y≈92, coats at y=78–112, backgrounds full-canvas), so rendering the raw
  // svg_layer alone in a small centered box hid most of them. 'medium' crop keeps
  // both the head (hats/glasses/facial hair) and the shoulders (coats/pins) in frame.
  return (
    <div className="rounded-xl border p-2 flex flex-col items-center" style={{ borderColor: equipped ? 'var(--primary)' : 'var(--border)', background: 'var(--card)' }}>
      <Avatar
        traits={DEFAULT_TRAITS}
        equipped={{ [item.slot]: item.slug }}
        items={[item]}
        size={84}
        crop="medium"
      />
      <div className="text-xs font-semibold mt-1 text-center">{item.name}</div>
      <div className="text-[10px] mt-0.5" style={{ color: badge.color }}>{badge.label}</div>
      <div className="mt-2 w-full">
        {item.state === 'owned' && (
          <button onClick={onEquip} disabled={busy || equipped}
            className="w-full text-xs font-semibold rounded-md py-1.5 disabled:opacity-50"
            style={{ background: equipped ? 'transparent' : 'var(--primary)', color: equipped ? 'var(--primary)' : 'var(--primary-foreground)', border: '1px solid var(--primary)', cursor: equipped ? 'default' : 'pointer' }}>
            {equipped ? <span><Check size={11} className="inline mr-1" /> Equipped</span> : 'Equip'}
          </button>
        )}
        {item.state === 'affordable' && (
          <button onClick={onBuy} disabled={busy} className="w-full text-xs font-semibold rounded-md py-1.5 disabled:opacity-50"
            style={{ background: 'var(--reward)', color: 'var(--reward-foreground)', border: 'none', cursor: 'pointer' }}>
            Buy
          </button>
        )}
        {item.state === 'too_expensive' && (
          <div className="w-full text-xs text-center py-1.5" style={{ color: 'var(--muted-foreground)' }}>Need more XP</div>
        )}
        {item.state === 'unlock_available' && (
          <button onClick={onBuy} disabled={busy} className="w-full text-xs font-semibold rounded-md py-1.5 disabled:opacity-50"
            style={{ background: 'var(--success)', color: 'var(--card)', border: 'none', cursor: 'pointer' }}>
            Claim
          </button>
        )}
        {item.state === 'locked_until_mastery' && (
          <div className="w-full text-xs text-center py-1.5 flex items-center justify-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
            <Lock size={10} /> Master a skill to unlock
          </div>
        )}
        {item.state === 'staff_free' && (
          <button onClick={onBuy} disabled={busy} className="w-full text-xs font-semibold rounded-md py-1.5 disabled:opacity-50"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}>
            Add
          </button>
        )}
      </div>
    </div>
  )
}
