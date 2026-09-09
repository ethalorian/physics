'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, Save, Sparkles, RotateCcw } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import AvatarGallery from '@/components/avatar/AvatarGallery'
import { Button } from '@/components/ui/button'
import { TRAIT_OPTIONS, TRAIT_LABELS, ITEM_SLOTS, SLOT_LABELS, withDefaults, type AvatarTraits, type AvatarBundle, type CatalogEntry, type EquippedItems, type ItemSlot, type SavedLook } from '@/lib/avatar/types'
import { STARTER_LOOKS } from '@/lib/avatar/presets'
import { SKIN, HAIR, SHIRT, EYE } from '@/lib/avatar/palette'

const GROUPS: { name: string; keys: (keyof AvatarTraits)[] }[] = [
  { name: 'Identity', keys: ['skin', 'face'] },
  { name: 'Hair', keys: ['hair_style', 'hair_color', 'fabric_color', 'facial_hair_color'] },
  { name: 'Face', keys: ['eyes', 'eye_color', 'brows', 'mouth', 'nose', 'freckles', 'cheek_blush'] },
  { name: 'Style', keys: ['shirt_style', 'shirt_color'] },
  { name: 'Fine-tune', keys: ['eye_spacing', 'eye_scale', 'eye_tilt', 'brow_height', 'mouth_width'] },
]
type Tab = 'identity' | 'items' | 'looks' | 'gallery'
interface Draft { traits: AvatarTraits; equipped: EquippedItems; alias: string; gallery_visible: boolean; saved_looks: SavedLook[] }
const fromBundle = (b: AvatarBundle): Draft => ({ traits: withDefaults(b.traits), equipped: b.equipped, alias: b.alias ?? '', gallery_visible: b.gallery_visible, saved_looks: b.saved_looks })
const nice = (s: string) => s.replaceAll('_', ' ')
async function getBundle(): Promise<AvatarBundle> {
  const r = await fetch('/api/avatar', { cache: 'no-store' }); const d = await r.json()
  if (!r.ok || !Array.isArray(d.catalog) || !Array.isArray(d.owned) || !Number.isInteger(d.revision) || typeof d.user_id !== 'string') throw new Error(d.error ?? 'Could not load your avatar.')
  return d
}
export default function AvatarPage() {
  const [initial, setInitial] = useState<AvatarBundle | null>(null)
  const [error, setError] = useState('')
  const load = useCallback(async () => { setError(''); try { setInitial(await getBundle()) } catch (e) { setError(e instanceof Error ? e.message : 'Could not load your avatar.') } }, [])
  useEffect(() => { void load() }, [load])
  if (!initial) return <main className="mx-auto max-w-5xl p-5">{error ? <div role="alert">{error} <Button onClick={load}>Retry</Button></div> : <p role="status">Loading your avatar…</p>}</main>
  return <AvatarEditor initial={initial} />
}
function AvatarEditor({ initial }: { initial: AvatarBundle }) {
  const [bundle, setBundle] = useState(initial)
  const [draft, setDraft] = useState<Draft>(() => fromBundle(initial))
  const [tab, setTab] = useState<Tab>('identity')
  const [group, setGroup] = useState(0)
  const [slot, setSlot] = useState<ItemSlot>('body')
  const [tryOn, setTryOn] = useState<CatalogEntry | null>(null)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  const [lookName, setLookName] = useState('')
  const dirty = JSON.stringify(draft) !== JSON.stringify(fromBundle(bundle))
  const previewEquipped = tryOn ? { ...draft.equipped, [tryOn.slot]: tryOn.slug } : draft.equipped
  const edit = (key: keyof AvatarTraits, value: string) => { setDraft(p => ({ ...p, traits: { ...p.traits, [key]: value } })); setMessage('') }
  useEffect(() => {
    const prevent = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', prevent)
    return () => window.removeEventListener('beforeunload', prevent)
  }, [dirty])
  const reload = async () => {
    if (busyRef.current) return
    busyRef.current = true; setBusy(true); setError('')
    try { const b = await getBundle(); setBundle(b); setDraft(fromBundle(b)); setConflict(false); setTryOn(null); setMessage('Loaded your saved avatar.') }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not reload.') }
    finally { busyRef.current = false; setBusy(false) }
  }
  const save = async () => {
    if (busyRef.current || conflict) return
    busyRef.current = true; setBusy(true); setError(''); setMessage('Saving…')
    try {
      const r = await fetch('/api/avatar', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...draft, revision: bundle.revision, complete: true }) })
      const d = await r.json()
      if (!r.ok) { if (d.conflict) setConflict(true); throw new Error(d.error ?? 'Could not save. Your draft is still here.') }
      const saved = { ...bundle, ...d, alias: draft.alias || null, traits: withDefaults(d.traits) }
      setBundle(saved); setDraft(fromBundle(saved)); setMessage('Saved.'); window.dispatchEvent(new Event('avatar-updated'))
    } catch (e) { setMessage(''); setError(e instanceof Error ? e.message : 'Could not save. Your draft is still here.') }
    finally { busyRef.current = false; setBusy(false) }
  }
  const buy = async (item: CatalogEntry) => {
    if (busyRef.current) return
    busyRef.current = true; setBusy(true); setError(''); setMessage('')
    try {
      const r = await fetch('/api/avatar/purchase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: item.slug }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Could not get this item. Retry safely.')
      // Update ownership immediately so a failed refresh cannot hide delivery.
      setBundle(b => ({ ...b, owned: [...new Set([...b.owned, item.slug])], balance: d.balance ?? b.balance, catalog: b.catalog.map(i => i.slug === item.slug ? { ...i, state: 'owned' } : i) }))
      setDraft(p => ({ ...p, equipped: { ...p.equipped, [item.slot]: item.slug } }))
      setTryOn(null); setMessage(`${item.name} is yours. Save changes to wear it everywhere.`)
      const fresh = await getBundle()
      setBundle(b => ({ ...b, catalog: fresh.catalog, owned: fresh.owned, balance: fresh.balance }))
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not complete the purchase. Retry safely.') }
    finally { busyRef.current = false; setBusy(false) }
  }
  return <main className="mx-auto max-w-6xl space-y-5 p-4 pb-24 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold">My avatar</h1><p className="text-sm text-muted-foreground">Make it yours. Identity options are always free.</p></div>
      <Link href="/home" onClick={e => { if (dirty) { e.preventDefault(); setError('Save or discard your changes before going home.') } }} className="inline-flex min-h-11 items-center text-sm underline">Home</Link>
    </div>
    <div className="grid grid-cols-1 gap-5 md:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="self-start rounded-2xl border bg-card p-4 md:sticky md:top-4">
        <div className="flex items-center justify-center gap-3 md:flex-col">
          <Avatar traits={draft.traits} equipped={previewEquipped} items={bundle.catalog} size={190} />
          <div className="flex flex-col items-center gap-2"><div className="h-10 w-10 overflow-hidden rounded-full bg-secondary"><Avatar traits={draft.traits} equipped={previewEquipped} items={bundle.catalog} size={40} crop="head" decorative /></div><span className="text-xs text-muted-foreground">Menu preview</span></div>
        </div>
        {tryOn && <div className="my-3 rounded-lg border p-2 text-sm">Trying {tryOn.name}.<Button variant="ghost" onClick={() => setTryOn(null)}>End try-on</Button></div>}
        {!bundle.isStaff && <p className="text-center text-sm text-muted-foreground">{bundle.lifetimeEarned.toLocaleString()} lifetime XP earned · Purchases keep your rankings and goal progress intact.</p>}
        <p className="mt-3 text-center font-semibold">{bundle.isStaff ? 'All catalog items are free for staff' : `${bundle.balance.toLocaleString()} XP to spend`}</p>
        <div className="mt-4 space-y-2 border-t pt-4">
          <Button className="min-h-11 w-full" onClick={save} disabled={busy || conflict || (!dirty && bundle.setup_completed)}><Save size={16} />{busy ? 'Working…' : bundle.setup_completed ? 'Save changes' : 'Finish & save avatar'}</Button>
          {dirty && <Button variant="ghost" className="min-h-11 w-full" disabled={busy} onClick={() => { setDraft(fromBundle(bundle)); setTryOn(null); setError(''); setMessage('Draft discarded.') }}><RotateCcw size={15} />Discard changes</Button>}
          <p role="status" aria-live="polite" className="text-center text-sm text-muted-foreground">{message || (dirty ? 'Unsaved changes' : 'Your saved avatar')}</p>
        </div>
      </aside>
      <div className="min-w-0 space-y-4">
        {error && <div role="alert" className="rounded-xl border border-destructive p-3 text-sm">{error}{conflict && <Button variant="outline" className="mt-2" disabled={busy} onClick={reload}>Discard draft & load saved avatar</Button>}</div>}
        <nav aria-label="Avatar sections" className="flex flex-wrap gap-2">
          {(['identity', 'items', 'looks', 'gallery'] as Tab[]).map(t => <Button key={t} variant={tab === t ? 'default' : 'outline'} aria-pressed={tab === t} className="min-h-11" onClick={() => { setTab(t); setTryOn(null) }}>{({ identity: 'Appearance', items: 'Wardrobe', looks: 'Saved looks', gallery: 'Class gallery' })[t]}</Button>)}
        </nav>
        {tab === 'gallery' ? <AvatarGallery /> : <fieldset disabled={busy} className="min-w-0 space-y-5">
          {tab === 'identity' && <>
            {!bundle.setup_completed && <p className="rounded-xl bg-secondary p-4 text-sm">Start with a look or choose your own features. You can keep the defaults. Finish & save when you are ready.</p>}
            <details className="rounded-xl border p-3"><summary className="cursor-pointer py-2 font-semibold">Starting looks</summary><p className="py-2 text-xs text-muted-foreground">Applies free appearance traits. All details remain editable.</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{STARTER_LOOKS.map(p => <Button key={p.name} variant="outline" className="h-auto flex-col py-3" onClick={() => setDraft(d => ({ ...d, traits: p.traits }))}><Avatar traits={p.traits} size={60} crop="head" decorative />{p.name}</Button>)}</div></details>
            <div className="flex flex-wrap gap-2" aria-label="Appearance groups">{GROUPS.map((g, i) => <Button key={g.name} variant={group === i ? 'secondary' : 'ghost'} aria-pressed={group === i} onClick={() => setGroup(i)} className="min-h-11">{g.name}</Button>)}</div>
            {GROUPS[group].keys.filter(k => (k !== 'fabric_color' || draft.traits.hair_style === 'hijab') && (k !== 'facial_hair_color' || !!draft.equipped.facial_hair)).map(k => <TraitPicker key={k} trait={k} traits={draft.traits} onChange={v => edit(k, v)} />)}
            <div className="flex justify-between"><Button variant="outline" disabled={group === 0} onClick={() => setGroup(g => g - 1)}>Previous group</Button><Button variant="outline" disabled={group === GROUPS.length - 1} onClick={() => setGroup(g => g + 1)}>Next group</Button></div>
            <section className="space-y-3 rounded-xl border p-4" aria-label="Display name and sharing">
              <label className="block text-sm font-semibold" htmlFor="avatar-name">Display name</label>
              <input id="avatar-name" maxLength={32} value={draft.alias} placeholder={bundle.name?.split(' ')[0] || 'Your first name'} onChange={e => setDraft(p => ({ ...p, alias: e.target.value }))} className="min-h-11 w-full rounded-lg border bg-background px-3" />
              <p className="text-xs text-muted-foreground">Used in the gallery and leaderboard. Leave blank for your first name in the gallery and your roster name elsewhere.</p>
              <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={draft.gallery_visible} onChange={e => setDraft(p => ({ ...p, gallery_visible: e.target.checked }))} className="h-5 w-5" />Share in my class gallery</label>
              <p className="text-xs text-muted-foreground">Your classmates and their teachers can see your shared avatar and display name. School administrators can also see it. Appreciation totals are visible only to you. Your avatar still appears beside your classroom work when gallery sharing is off.</p>
            </section>
          </>}
          {tab === 'items' && <>
            <div className="flex flex-wrap gap-2">{ITEM_SLOTS.map(s => <Button key={s} variant={s === slot ? 'secondary' : 'ghost'} aria-pressed={s === slot} onClick={() => { setSlot(s); setTryOn(null) }} className="min-h-11">{SLOT_LABELS[s]}</Button>)}</div>
            {draft.equipped[slot] && <Button variant="outline" onClick={() => { setDraft(p => { const equipped = { ...p.equipped }; delete equipped[slot]; return { ...p, equipped } }); setTryOn(null) }}>Remove {SLOT_LABELS[slot].toLowerCase()}</Button>}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {bundle.catalog.filter(i => i.slot === slot).map(i => <ItemCard key={i.slug} item={i} traits={draft.traits} equipped={draft.equipped} items={bundle.catalog} selected={draft.equipped[slot] === i.slug} balance={bundle.balance} onTry={() => setTryOn(i)} onEquip={() => { setDraft(p => ({ ...p, equipped: { ...p.equipped, [i.slot]: i.slug } })); setTryOn(null) }} onBuy={() => buy(i)} />)}
            </div>
          </>}
          {tab === 'looks' && <section className="space-y-4">
            <p className="text-sm text-muted-foreground">Save up to six looks with your appearance and owned items. Switching looks creates a draft; Save changes applies it everywhere.</p>
            <label htmlFor="look-name" className="block text-sm font-semibold">Name this look</label>
            <div className="flex flex-wrap gap-2"><input id="look-name" value={lookName} onChange={e => setLookName(e.target.value)} maxLength={32} placeholder="e.g. Lab day" className="min-h-11 min-w-0 flex-1 rounded-lg border bg-background px-3" /><Button disabled={!lookName.trim() || draft.saved_looks.length >= 6} onClick={() => { setDraft(p => ({ ...p, saved_looks: [...p.saved_looks, { name: lookName.trim(), traits: p.traits, equipped: p.equipped }] })); setLookName(''); setMessage('Look added to your draft. Save changes to keep it.') }}><Sparkles size={16} />Keep this look</Button></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{draft.saved_looks.map((look, index) => <div key={index} className="flex flex-col items-center gap-2 rounded-xl border p-3"><Avatar traits={look.traits} equipped={look.equipped} items={bundle.catalog} size={100} decorative /><p className="max-w-full truncate text-sm font-semibold">{look.name}</p><Button variant="outline" onClick={() => setDraft(p => ({ ...p, traits: withDefaults(look.traits), equipped: look.equipped }))}>Use look</Button><Button variant="ghost" aria-label={`Delete ${look.name}`} onClick={() => setDraft(p => ({ ...p, saved_looks: p.saved_looks.filter((_, i) => i !== index) }))}>Delete</Button></div>)}</div>
          </section>}
        </fieldset>}
      </div>
    </div>
    {dirty && <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t bg-card p-3 md:hidden"><span className="text-sm">Unsaved changes</span><Button className="min-h-11" disabled={busy || conflict} onClick={save}>Save avatar changes</Button></div>}
  </main>
}
function swatch(trait: keyof AvatarTraits, value: string): string | null {
  if (trait === 'skin') return SKIN[value as keyof typeof SKIN]?.color
  if (trait === 'hair_color' || trait === 'facial_hair_color') return HAIR[value as keyof typeof HAIR]?.main ?? null
  if (trait === 'shirt_color' || trait === 'fabric_color') return SHIRT[value as keyof typeof SHIRT]
  if (trait === 'eye_color') return EYE[value as keyof typeof EYE]
  return null
}
function TraitPicker({ trait, traits, onChange }: { trait: keyof AvatarTraits; traits: AvatarTraits; onChange: (v: string) => void }) {
  return <section className="space-y-3 rounded-xl border bg-card p-3" aria-label={TRAIT_LABELS[trait]}>
    <h2 className="text-sm font-semibold">{TRAIT_LABELS[trait]} <span className="font-normal capitalize text-muted-foreground">· {nice(traits[trait])}</span></h2>
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">{TRAIT_OPTIONS[trait].map(value => {
      const color = swatch(trait, value); const selected = traits[trait] === value
      return <button type="button" key={value} aria-pressed={selected} aria-label={`${TRAIT_LABELS[trait]}: ${nice(value)}`} className={`relative flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-xs capitalize focus-visible:outline-2 focus-visible:outline-primary ${selected ? 'border-primary bg-secondary' : 'border-border'}`} onClick={() => onChange(value)}>
        {color ? <span className="h-7 w-7 rounded-full border border-border" style={{ background: color }} /> : <Avatar traits={{ ...traits, [trait]: value }} size={50} crop={trait === 'shirt_style' ? 'medium' : 'head'} decorative />}
        {nice(value)}{selected && <Check size={13} className="absolute right-1 top-1" />}
      </button>
    })}</div>
  </section>
}
function ItemCard({ item, traits, equipped, items, selected, balance, onTry, onEquip, onBuy }: { item: CatalogEntry; traits: AvatarTraits; equipped: EquippedItems; items: CatalogEntry[]; selected: boolean; balance: number; onTry: () => void; onEquip: () => void; onBuy: () => void }) {
  const owned = item.state === 'owned'; const locked = item.state === 'locked_until_mastery'
  const canBuy = !owned && !locked && (item.state !== 'too_expensive' || balance >= (item.cost_xp ?? Infinity))
  return <article className={`flex min-w-0 flex-col items-center rounded-xl border bg-card p-3 ${selected ? 'border-primary' : ''}`}>
    <Avatar traits={traits} equipped={{ ...equipped, [item.slot]: item.slug }} items={items} size={100} crop="medium" decorative />
    <h3 className="text-center text-sm font-semibold">{item.name}</h3>
    <p className="my-1 text-center text-xs text-muted-foreground">{owned ? (item.enabled === false ? 'Owned · retired from shop' : 'Owned') : item.state === 'staff_free' ? 'Free for staff' : item.unlock_target_id ? 'Earned through mastery' : `${item.cost_xp ?? '—'} XP`}</p>
    {item.unlock_target_id && !owned && <p className="my-2 text-center text-xs text-muted-foreground">{item.target_statement}<br />Level {(item.unlock_progress ?? 0).toFixed(1)} / {Number(item.unlock_min_level ?? 2.5).toFixed(1)}</p>}
    <div className="mt-auto flex w-full flex-col gap-2 pt-2">
      <Button variant="outline" className="min-h-11" onClick={onTry}>Try on</Button>
      {owned ? <Button className="min-h-11" disabled={selected} onClick={onEquip}>{selected ? 'Selected' : 'Wear'}</Button> : <Button className="min-h-11" disabled={!canBuy} onClick={onBuy}>{item.state === 'staff_free' ? 'Add & wear' : item.state === 'unlock_available' ? 'Claim & wear' : locked ? 'Keep learning' : `Buy · ${item.cost_xp} XP`}</Button>}
      {!owned && !locked && !canBuy && <p className="text-center text-xs text-muted-foreground">Need {Math.max(0, (item.cost_xp ?? 0) - balance)} more XP</p>}
    </div>
  </article>
}
