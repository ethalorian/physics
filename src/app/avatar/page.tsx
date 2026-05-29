"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Lock, Sparkles } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import { TRAIT_LABELS, TRAIT_OPTIONS, DEFAULT_TRAITS, type AvatarTraits, type ItemSlot, type EquippedItems, type AvatarItem } from '@/lib/avatar/types'
import { SKIN, HAIR } from '@/lib/avatar/palette'
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
  use_custom_avatar: boolean
}

type Tab = 'face' | 'items'

const SLOT_LABEL: Record<ItemSlot, string> = {
  eyewear: 'Eyewear', head: 'Head & helmets', body: 'Body & coats', pin: 'Pins', background: 'Backgrounds', facial_hair: 'Facial hair',
}

export default function AvatarPage() {
  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [tab, setTab] = useState<Tab>('face')
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
          {!bundle.setup_completed && (
            <div className="rounded-xl px-4 py-3 mb-4 text-sm" style={{ background: 'color-mix(in oklch, var(--primary) 10%, transparent)', color: 'var(--primary)' }}>
              <strong>Build your face first.</strong> Pick any option below — your preview updates as you go.
            </div>
          )}

          <div className="flex items-center gap-2 mb-4">
            <TabButton active={tab === 'face'} onClick={() => setTab('face')}>Edit my face</TabButton>
            <TabButton active={tab === 'items'} onClick={() => setTab('items')} disabled={!bundle.setup_completed}>Items</TabButton>
          </div>

          {tab === 'face' && (
            <div className="flex flex-col gap-3">
              <AccountSection
                alias={bundle.alias}
                useCustomAvatar={bundle.use_custom_avatar}
                onSaved={load}
              />
              {(Object.keys(TRAIT_OPTIONS) as (keyof AvatarTraits)[]).map((key) => {
                const value = (previewTraits[key] as string) ?? TRAIT_OPTIONS[key][0]
                // Colour traits get a visible swatch row — picking "olive" vs
                // "teal" by reading the word is a poor experience.
                if (key === 'skin' || key === 'hair_color') {
                  return (
                    <SwatchRow
                      key={key}
                      label={TRAIT_LABELS[key]}
                      options={TRAIT_OPTIONS[key]}
                      value={value}
                      colorFor={(opt) => (key === 'skin' ? SKIN[opt as keyof typeof SKIN].color : HAIR[opt as keyof typeof HAIR].main)}
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

          {tab === 'items' && (
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

function AccountSection({ alias, useCustomAvatar, onSaved }: { alias: string | null; useCustomAvatar: boolean; onSaved: () => void }) {
  const [draft, setDraft] = useState<string>(alias ?? '')
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  // Re-sync the input when the server gives us a fresh alias (e.g. after first load
  // or after another tab updates it). Without this, the input stays empty even when
  // the server already has a saved alias.
  useEffect(() => { setDraft(alias ?? '') }, [alias])

  const saveAlias = async () => {
    const trimmed = draft.trim()
    // No change? skip the round-trip.
    if (trimmed === (alias ?? '')) return
    setSaving(true); setErr(null)
    const res = await fetch('/api/avatar/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias: trimmed === '' ? null : trimmed }),
    }).catch(() => null)
    setSaving(false)
    if (!res?.ok) {
      const body = await res?.json().catch(() => null) as { error?: string } | null
      setErr(body?.error ?? 'Could not save')
      return
    }
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1500)
    onSaved()
  }

  const togglePref = async () => {
    await fetch('/api/avatar/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ use_custom_avatar: !useCustomAvatar }),
    }).catch(() => {})
    onSaved()
  }

  return (
    <div
      className="rounded-xl border p-3 mb-1"
      style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
    >
      <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Account</div>

      {/* Alias */}
      <label className="block mb-2">
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Leaderboard name (shown to classmates only)</span>
        <input
          type="text"
          value={draft}
          maxLength={32}
          placeholder="Pick a fun name"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={saveAlias}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur() }}
          className="mt-1 w-full text-sm rounded-md px-2 py-1.5"
          style={{ background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px]" style={{ color: err ? 'var(--destructive)' : 'var(--muted-foreground)' }}>
            {err ?? `${draft.length}/32 — letters, digits, spaces, . _ -`}
          </span>
          {(saving || savedFlash) && (
            <span className="text-[11px]" style={{ color: savedFlash ? 'var(--success)' : 'var(--muted-foreground)' }}>
              {saving ? 'Saving…' : 'Saved'}
            </span>
          )}
        </div>
      </label>

      {/* Avatar preference */}
      <button
        type="button"
        onClick={togglePref}
        className="w-full flex items-center justify-between rounded-md px-2 py-1.5 mt-2"
        style={{ background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer' }}
      >
        <span className="text-xs text-left" style={{ color: 'var(--foreground)' }}>
          Show my Mii instead of my Google photo
        </span>
        <span
          className="text-[11px] font-semibold rounded-full px-2 py-0.5"
          style={{
            background: useCustomAvatar ? 'var(--success)' : 'var(--secondary)',
            color: useCustomAvatar ? 'var(--card)' : 'var(--muted-foreground)',
          }}
        >
          {useCustomAvatar ? 'ON' : 'OFF'}
        </span>
      </button>
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
