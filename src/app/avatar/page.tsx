"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Lock, Sparkles } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import { TRAIT_LABELS, TRAIT_OPTIONS, type AvatarTraits, type ItemSlot, type EquippedItems, type AvatarItem } from '@/lib/avatar/types'
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
        // Open Items tab by default once setup is done — Face is for first-timers.
        setTab(d.setup_completed ? 'items' : 'face')
      })
      .catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])

  // Local traits buffer so the preview reacts instantly even before the server
  // round-trip. Falls back to whatever the server says.
  const [localTraits, setLocalTraits] = useState<Partial<AvatarTraits>>({})
  const previewTraits: Partial<AvatarTraits> = useMemo(() => ({ ...(bundle?.traits ?? {}), ...localTraits }), [bundle?.traits, localTraits])

  const saveTrait = async (key: keyof AvatarTraits, value: string) => {
    setLocalTraits((p) => ({ ...p, [key]: value as never }))
    await fetch('/api/avatar/traits', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ traits: { [key]: value } }),
    }).catch(() => {})
    load()
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
            <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Your XP</div>
            <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--reward-foreground)' }}>{bundle.balance.toLocaleString()}</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>spendable</div>
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
            <div className="flex flex-col gap-4">
              {(Object.keys(TRAIT_OPTIONS) as (keyof AvatarTraits)[]).map((key) => (
                <div key={key}>
                  <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>{TRAIT_LABELS[key]}</div>
                  <div className="flex flex-wrap gap-2">
                    {TRAIT_OPTIONS[key].map((opt) => {
                      const isOn = previewTraits[key] === opt
                      return (
                        <button
                          key={opt}
                          onClick={() => saveTrait(key, opt)}
                          className="text-sm font-medium rounded-lg px-3 py-1.5 capitalize"
                          style={{
                            background: isOn ? 'var(--primary)' : 'var(--card)',
                            color: isOn ? 'var(--primary-foreground)' : 'var(--foreground)',
                            border: '1px solid ' + (isOn ? 'var(--primary)' : 'var(--border)'),
                            cursor: 'pointer',
                          }}
                        >
                          {opt.replace('_', ' ')}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
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
  }
  const badge = stateBadge[item.state]

  // Render the item as a tiny preview by stuffing it through a placeholder Avatar
  // would be overkill — just show the SVG layer alone inside a small viewBox.
  return (
    <div className="rounded-xl border p-2 flex flex-col items-center" style={{ borderColor: equipped ? 'var(--primary)' : 'var(--border)', background: 'var(--card)' }}>
      <svg width="84" height="84" viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g dangerouslySetInnerHTML={{ __html: item.svg_layer }} />
      </svg>
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
      </div>
    </div>
  )
}
