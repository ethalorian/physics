"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useViewAs } from '@/lib/use-view-as'
import { ArrowLeft, Smile, Users, Lock, Sparkles } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import { DEFAULT_TRAITS, type ItemSlot } from '@/lib/avatar/types'
import type { CatalogRow } from '@/app/api/admin/avatar/catalog/route'

// Admin-only catalog browser. Lets Craig see every avatar item with its art
// preview, slot, price/unlock metadata, and how many students own it. Future
// surface for add/edit; today it's a viewer + sanity check.

const SLOT_LABEL: Record<ItemSlot, string> = {
  eyewear: 'Eyewear', head: 'Head & helmets', body: 'Body & coats', pin: 'Pins', background: 'Backgrounds', facial_hair: 'Facial hair',
}

export default function AdminAvatarCatalogPage() {
  const { role } = useViewAs()
  const router = useRouter()
  const [items, setItems] = useState<CatalogRow[] | null>(null)

  useEffect(() => {
    if (role && role !== 'admin') router.replace('/admin/home')
  }, [role, router])

  useEffect(() => {
    if (role !== 'admin') return
    fetch('/api/admin/avatar/catalog')
      .then((r) => r.json())
      .then((d: { catalog?: CatalogRow[] }) => setItems(d.catalog ?? []))
      .catch(() => setItems([]))
  }, [role])

  if (role && role !== 'admin') {
    return <div className="max-w-3xl mx-auto p-5 text-sm" style={{ color: 'var(--muted-foreground)' }}>Redirecting…</div>
  }

  // Group by slot for readable scanning.
  const bySlot: Record<string, CatalogRow[]> = {}
  for (const item of items ?? []) {
    const arr = bySlot[item.slot] ?? []
    arr.push(item)
    bySlot[item.slot] = arr
  }

  return (
    <div className="max-w-6xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <Link href="/admin/home" className="inline-flex items-center gap-1.5 text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
        <ArrowLeft size={15} /> Command center
      </Link>

      <div className="flex items-center gap-2 mb-1">
        <Smile size={16} style={{ color: 'var(--primary)' }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Avatar system</span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Catalog</h1>
      <p className="text-sm mt-1 mb-6" style={{ color: 'var(--muted-foreground)' }}>
        Every item that can be earned or purchased, previewed against a default Mii so you can see how it sits on a character. Owner count shows how many students have redeemed each item.
      </p>

      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <Link
          href="/avatar"
          className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg px-3 py-1.5"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none' }}
        >
          <Sparkles size={14} /> Build my own avatar
        </Link>
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Items are free for you — you&rsquo;re staff.
        </span>
      </div>

      {items === null && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading the catalog…</p>}
      {items?.length === 0 && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No items yet.</p>}

      {Object.entries(bySlot).map(([slot, slotItems]) => (
        <section key={slot} className="mb-7">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>{SLOT_LABEL[slot as ItemSlot] ?? slot}</div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {slotItems.map((item) => (
              <CatalogCard key={item.slug} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function CatalogCard({ item }: { item: CatalogRow }) {
  // Show the item layered onto a default Mii so the admin sees real context,
  // not the item in isolation. Equipped slot is the item's own slot.
  const equipped = { [item.slot]: item.slug }
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: 'var(--border)', background: 'var(--card)', opacity: item.enabled ? 1 : 0.55 }}
    >
      <div className="flex items-center justify-center mb-3" style={{ background: 'color-mix(in oklch, var(--secondary) 50%, transparent)', borderRadius: 12, padding: '8px 0' }}>
        <Avatar traits={DEFAULT_TRAITS} equipped={equipped} items={[item]} size={120} />
      </div>
      <div className="font-semibold text-sm">{item.name}</div>
      <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{item.slug}</div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {item.cost_xp != null && (
          <span className="inline-flex items-center gap-1 rounded-md px-2 py-1"
            style={{ background: 'color-mix(in oklch, var(--reward) 18%, transparent)', color: 'var(--reward-foreground)' }}>
            {item.cost_xp} XP
          </span>
        )}
        {item.unlock_target_id && (
          <span className="inline-flex items-center gap-1 rounded-md px-2 py-1"
            style={{ background: 'color-mix(in oklch, var(--success) 16%, transparent)', color: 'var(--success)' }}>
            <Lock size={11} /> Mastery {item.unlock_min_level ?? 2.5}+
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-md px-2 py-1"
          style={{ background: 'var(--secondary)', color: 'var(--foreground)' }}>
          <Users size={11} /> {item.owner_count} owner{item.owner_count === 1 ? '' : 's'}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md px-2 py-1"
          style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
          z {item.z_order}
        </span>
        {!item.enabled && (
          <span className="inline-flex items-center gap-1 rounded-md px-2 py-1"
            style={{ background: 'color-mix(in oklch, var(--destructive) 14%, transparent)', color: 'var(--destructive)' }}>
            disabled
          </span>
        )}
      </div>
      {item.target_statement && (
        <div className="mt-3 pt-3 text-xs" style={{ color: 'var(--muted-foreground)', borderTop: '1px solid var(--border)' }}>
          Unlocks when a student masters: <span className="italic">{item.target_statement}</span>
        </div>
      )}
    </div>
  )
}
