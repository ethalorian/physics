'use client'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowLeft, BookOpen, Check, Glasses, Image as ImageIcon, Save, Scissors, Shirt, Smile, Sparkles, Trash2, Undo2, Users } from 'lucide-react'
import { announceAvatarChange } from '@/lib/avatar/portrait-store'
import Avatar from '@/components/avatar/Avatar'
import AvatarGallery from '@/components/avatar/AvatarGallery'
import AvatarStage from '@/components/avatar/AvatarStage'
import { KNOB_TRAITS, SLOT_LABELS, withDefaults, type AvatarTraits, type AvatarBundle, type CatalogEntry, type EquippedItems, type ItemSlot, type SavedLook } from '@/lib/avatar/types'
import { STARTER_LOOKS } from '@/lib/avatar/presets'
import { ItemDetail, ItemTile, StyleBrief, STYLE_BRIEFS, TraitPicker } from './StudioControls'
import styles from './avatar-studio.module.css'

const SECTIONS = [
  { id: 'face', name: 'Face', icon: Smile }, { id: 'hair', name: 'Hair', icon: Scissors },
  { id: 'outfit', name: 'Outfit', icon: Shirt }, { id: 'accessories', name: 'Extras', icon: Glasses },
  { id: 'scene', name: 'Scene', icon: ImageIcon },
] as const
type Section = typeof SECTIONS[number]['id'] | 'looks' | 'gallery'
type Collection = 'all' | 'everyday' | 'costume' | 'sport'
const ACCESSORIES: ItemSlot[] = ['head', 'eyewear', 'pin', 'facial_hair', 'ears', 'mouth']
const FACE_GROUPS: { name: string; traits: (keyof AvatarTraits)[] }[] = [
  { name: 'Identity', traits: ['skin', 'face'] },
  { name: 'Expression', traits: ['eyes', 'eye_color', 'brows', 'mouth'] },
  { name: 'Details', traits: ['nose', 'freckles', 'cheek_blush'] },
]
interface Draft { traits: AvatarTraits; equipped: EquippedItems; alias: string; saved_looks: SavedLook[] }
interface DraftHistory { present: Draft; past: Draft[] }
type DraftAction = { type: 'change'; update: (draft: Draft) => Draft } | { type: 'reset'; draft: Draft } | { type: 'undo' }
function draftReducer(state: DraftHistory, action: DraftAction): DraftHistory {
  if (action.type === 'reset') return { present: action.draft, past: [] }
  if (action.type === 'undo') return state.past.length ? { present: state.past[state.past.length - 1], past: state.past.slice(0, -1) } : state
  const next = action.update(state.present)
  return JSON.stringify(next) === JSON.stringify(state.present) ? state : { present: next, past: [...state.past.slice(-39), state.present] }
}
const fromBundle = (bundle: AvatarBundle): Draft => ({ traits: withDefaults(bundle.traits), equipped: bundle.equipped, alias: bundle.alias ?? '', saved_looks: bundle.saved_looks })
function collectionOf(item: CatalogEntry): Collection {
  return item.slug.startsWith('fhs-') ? 'sport' : /spooky-|vampire|dracula|night-bat|spiderman|batman|flash-|thor-/.test(item.slug) ? 'costume' : 'everyday'
}
async function getBundle(): Promise<AvatarBundle> {
  const response = await fetch('/api/avatar', { cache: 'no-store' }), data = await response.json()
  if (!response.ok || !Array.isArray(data.catalog) || !Array.isArray(data.owned) || !Number.isInteger(data.revision) || typeof data.user_id !== 'string') throw new Error(data.error ?? 'Could not load your avatar.')
  return data
}
export default function AvatarPage() {
  const { data: session, status } = useSession()
  const userId = status === 'authenticated' ? session?.user?.id : undefined
  if (!userId) return <p role="status">{status === 'unauthenticated' ? 'Sign in to customize your avatar.' : 'Loading your avatar…'}</p>
  return <AvatarAccount key={userId} userId={userId} />
}
function AvatarAccount({ userId }: { userId: string }) {
  const [initial, setInitial] = useState<AvatarBundle | null>(null), [error, setError] = useState('')
  const load = useCallback(async () => {
    setError('')
    try { const next = await getBundle(); if (next.user_id === userId) setInitial(next) }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not load your avatar.') }
  }, [userId])
  useEffect(() => { void load() }, [load])
  if (!initial || initial.user_id !== userId) return <main className={styles.studio}>{error ? <div role="alert">{error} <button type="button" className={styles.primary} onClick={load}>Retry</button></div> : <p role="status">Opening your dressing room…</p>}</main>
  return <AvatarEditor key={userId} initial={initial} />
}
function AvatarEditor({ initial }: { initial: AvatarBundle }) {
  const [bundle, setBundle] = useState(initial)
  const [history, dispatch] = useReducer(draftReducer, { present: fromBundle(initial), past: [] })
  const draft = history.present
  const [section, setSection] = useState<Section>(initial.setup_completed ? 'outfit' : 'face')
  const [closeUp, setCloseUp] = useState(!initial.setup_completed)
  const [faceGroup, setFaceGroup] = useState(0), [accessorySlot, setAccessorySlot] = useState<ItemSlot>('head')
  const [query, setQuery] = useState(''), [filter, setFilter] = useState<'all' | 'owned' | 'available'>('all')
  const [collection, setCollection] = useState<Collection>('all'), [brief, setBrief] = useState(0)
  const [tryOnSlug, setTryOnSlug] = useState<string | null>(null), [lookName, setLookName] = useState('')
  const [busy, setBusy] = useState(false), busyRef = useRef(false)
  const [message, setMessage] = useState(''), [error, setError] = useState(''), [conflict, setConflict] = useState(false)
  const dirty = JSON.stringify(draft) !== JSON.stringify(fromBundle(bundle))
  const slot: ItemSlot = section === 'scene' ? 'background' : section === 'accessories' ? accessorySlot : 'body'
  const isWardrobe = ['outfit', 'accessories', 'scene'].includes(section)
  const tryOn = bundle.catalog.find(item => item.slug === tryOnSlug)
  const selectedItem = tryOn ?? (isWardrobe ? bundle.catalog.find(item => item.slug === draft.equipped[slot]) : undefined)
  const previewEquipped = tryOn ? { ...draft.equipped, [tryOn.slot]: tryOn.slug } : draft.equipped
  const wardrobeItems = bundle.catalog.filter(item => item.slot === slot && item.name.toLowerCase().includes(query.trim().toLowerCase()) && (collection === 'all' || section !== 'outfit' || collectionOf(item) === collection) && (filter === 'all' || (filter === 'owned' ? item.state === 'owned' : ['affordable', 'unlock_available', 'staff_free'].includes(item.state))))
  const changeDraft = (update: (draft: Draft) => Draft) => { dispatch({ type: 'change', update }); setMessage('') }
  const edit = (key: keyof AvatarTraits, value: string) => changeDraft(draft => ({ ...draft, traits: { ...draft.traits, [key]: value } }))
  const remove = (slot: ItemSlot) => { changeDraft(draft => { const equipped = { ...draft.equipped }; delete equipped[slot]; return { ...draft, equipped } }); setTryOnSlug(null) }
  const chooseSection = (next: Section) => { setSection(next); setTryOnSlug(null); setCloseUp(next === 'face' || next === 'hair'); setQuery(''); setFilter('all'); setCollection('all') }
  const discard = () => { dispatch({ type: 'reset', draft: fromBundle(bundle) }); setTryOnSlug(null); setError(conflict ? 'Your saved avatar changed elsewhere. Reload it to continue.' : ''); setMessage('Back to your saved look.') }
  useEffect(() => {
    const prevent = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', prevent)
    return () => window.removeEventListener('beforeunload', prevent)
  }, [dirty])
  const reload = async () => {
    if (busyRef.current) return
    busyRef.current = true; setBusy(true); setError('')
    try {
      const next = await getBundle()
      if (next.user_id !== initial.user_id) throw new Error('Your signed-in account changed. Reload this page to continue.')
      setBundle(next); dispatch({ type: 'reset', draft: fromBundle(next) }); setConflict(false); setTryOnSlug(null); setMessage('Loaded your saved avatar.')
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not reload.') }
    finally { busyRef.current = false; setBusy(false) }
  }
  const save = async () => {
    if (busyRef.current || conflict || tryOn) return
    busyRef.current = true; setBusy(true); setError(''); setMessage('Saving…')
    try {
      const response = await fetch('/api/avatar', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...draft, revision: bundle.revision, complete: true }) })
      const data = await response.json()
      if (!response.ok) { if (data.conflict) setConflict(true); throw new Error(data.error ?? 'Could not save. Your draft is still here.') }
      const saved = { ...bundle, ...data, alias: draft.alias || null, traits: withDefaults(data.traits) }
      setBundle(saved); dispatch({ type: 'reset', draft: fromBundle(saved) }); setMessage('Saved. Ready for your next lesson.'); announceAvatarChange()
    } catch (error) { setMessage(''); setError(error instanceof Error ? error.message : 'Could not save. Your draft is still here.') }
    finally { busyRef.current = false; setBusy(false) }
  }
  const buy = async (item: CatalogEntry) => {
    if (busyRef.current) return
    busyRef.current = true; setBusy(true); setError(''); setMessage('')
    try {
      const response = await fetch('/api/avatar/purchase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: item.slug }) }), data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Could not get this item. Retry safely.')
      // Ownership is not draft history: Undo must never imply a refund.
      setBundle(bundle => ({ ...bundle, owned: [...new Set([...bundle.owned, item.slug])], balance: data.balance ?? bundle.balance, catalog: bundle.catalog.map(entry => entry.slug === item.slug ? { ...entry, state: 'owned' } : entry) }))
      changeDraft(draft => ({ ...draft, equipped: { ...draft.equipped, [item.slot]: item.slug } }))
      setTryOnSlug(null); setMessage(`${item.name} is yours. Save your look to wear it everywhere.`)
      const fresh = await getBundle()
      if (fresh.user_id !== initial.user_id) throw new Error('Your signed-in account changed. Reload this page to continue.')
      setBundle(bundle => ({ ...bundle, catalog: fresh.catalog, owned: fresh.owned, balance: fresh.balance }))
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not complete the purchase. Retry safely.') }
    finally { busyRef.current = false; setBusy(false) }
  }
  const saveLabel = busy ? 'Working…' : tryOn ? 'Finish try-on first' : bundle.setup_completed ? 'Save my look' : 'Finish & save avatar'
  const saveDisabled = busy || conflict || !!tryOn || (!dirty && bundle.setup_completed)
  const heading = { face: 'All the little details.', hair: 'Good hair. Every day.', outfit: 'Find your next favorite.', accessories: 'Make it unmistakably you.', scene: 'Set the scene.', looks: 'Your personal lookbook.', gallery: 'Meet the cast.' }[section]
  return <main className={styles.studio}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>THE TEACHER’S PHYSICS · AVATAR STUDIO</p><h1>The dressing room<span>.</span></h1><p>A new look for every chapter.</p></div>
      <div className={styles.headerActions}>
        <details className={styles.wallet}><summary><Sparkles size={16} />{bundle.isStaff ? 'Staff wardrobe' : `${bundle.balance.toLocaleString()} XP`}</summary><p>{bundle.isStaff ? 'Catalog items are free for staff.' : `${bundle.lifetimeEarned.toLocaleString()} lifetime XP earned. Spending XP keeps your rankings and goal progress intact.`}</p></details>
        <Link href="/home" onClick={event => { if (dirty) { event.preventDefault(); setError('Save or discard your changes before going home.') } }}><ArrowLeft size={15} />Home</Link>
      </div>
    </header>
    <div className={styles.layout}>
      <aside className={styles.preview}>
        <AvatarStage key={section === 'face' || section === 'hair' ? 'details' : 'figure'} traits={draft.traits} equipped={previewEquipped} items={bundle.catalog} name={draft.alias || bundle.name?.split(' ')[0] || 'Your avatar'} closeUp={closeUp} onCloseUp={setCloseUp} trying={tryOn?.name} />
        <div className={styles.saveBar}>
          <button type="button" className={styles.undo} disabled={busy || (!history.past.length && !tryOn)} onClick={() => { if (tryOn) setTryOnSlug(null); else dispatch({ type: 'undo' }); setMessage('Last change undone.') }}><Undo2 size={17} />Undo</button>
          <button type="button" className={styles.primary} onClick={save} disabled={saveDisabled}><Save size={16} />{saveLabel}</button>
        </div>
        <p className={styles.saveStatus} role="status" aria-live="polite">{message || (tryOn ? 'Try it freely. Choose Wear or Buy to keep it.' : dirty ? 'Your new look is a draft.' : 'Your look is saved.')}</p>
        <div className={styles.previewFoot}><span>Appearance changes are always free.</span>{dirty && <button type="button" disabled={busy} onClick={discard}>Discard draft</button>}</div>
      </aside>
      <div className={styles.editor}>
        <div className={styles.secondaryNav}><span>MAKE YOURSELF AT HOME</span><div><button type="button" disabled={busy} aria-pressed={section === 'looks'} onClick={() => chooseSection('looks')}><BookOpen size={16} />Lookbook <span>{draft.saved_looks.length}/6</span></button><button type="button" disabled={busy} aria-pressed={section === 'gallery'} onClick={() => chooseSection('gallery')}><Users size={16} />Class gallery</button></div></div>
        <nav aria-label="Avatar sections" className={styles.nav}>{SECTIONS.map(({ id, name, icon: Icon }) => <button type="button" key={id} disabled={busy} aria-pressed={section === id} onClick={() => chooseSection(id)}><Icon size={20} /><span>{name}</span></button>)}</nav>
        {error && <div role="alert" className={styles.error}>{error}{conflict && <button type="button" className={styles.textButton} disabled={busy} onClick={reload}>Discard draft & load saved avatar</button>}</div>}
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>{section === 'looks' ? 'THE LOOKBOOK' : section === 'gallery' ? 'YOUR CLASS' : 'YOUR STYLE, YOUR RULES'}</p><h2>{heading}</h2></div>{(section === 'face' || section === 'hair') && <span className={styles.freeBadge}>All free</span>}</div>
        {section === 'gallery' ? <AvatarGallery /> : <fieldset disabled={busy} className={styles.workspace}>
          {section === 'face' && <>
            <div className={styles.pills} role="group" aria-label="Face groups">{FACE_GROUPS.map((group, index) => <button key={group.name} type="button" aria-pressed={faceGroup === index} onClick={() => setFaceGroup(index)}>{group.name}</button>)}</div>
            {FACE_GROUPS[faceGroup].traits.map(key => <TraitPicker key={key} trait={key} traits={draft.traits} onChange={value => edit(key, value)} />)}
            <details className={styles.disclosure}><summary>Fine-tune your features</summary>{KNOB_TRAITS.map(key => <TraitPicker key={key} trait={key} traits={draft.traits} onChange={value => edit(key, value)} />)}</details>
            <details className={styles.disclosure}><summary>Start with a complete look</summary><p>Free appearance presets. Your wardrobe stays equipped.</p><div className={styles.presetGrid}>{STARTER_LOOKS.map(look => <button key={look.name} type="button" onClick={() => changeDraft(draft => ({ ...draft, traits: look.traits }))}><Avatar traits={look.traits} size={65} crop="head" decorative /><span>{look.name}</span></button>)}</div></details>
            <details className={styles.disclosure}><summary>Your name & sharing</summary><label htmlFor="avatar-name">Display name</label><input id="avatar-name" maxLength={32} value={draft.alias} placeholder={bundle.name?.split(' ')[0] || 'Your first name'} onChange={event => changeDraft(draft => ({ ...draft, alias: event.target.value }))} /><p>Leave blank to use your first name in the gallery and your roster name elsewhere.</p><p>Your class gallery shares your avatar and display name with classmates, their teachers, and school administrators. Appreciation totals are visible only to you.</p></details>
          </>}
          {section === 'hair' && <>
            {draft.equipped.head && <p className={styles.notice}>Your headwear may cover your hairstyle. <button type="button" onClick={() => remove('head')}>Remove headwear</button></p>}
            <TraitPicker trait={draft.traits.hair_style === 'hijab' ? 'fabric_color' : 'hair_color'} traits={draft.traits} onChange={value => edit(draft.traits.hair_style === 'hijab' ? 'fabric_color' : 'hair_color', value)} />
            <TraitPicker trait="hair_style" traits={draft.traits} onChange={value => edit('hair_style', value)} />
            {draft.equipped.facial_hair && <TraitPicker trait="facial_hair_color" traits={draft.traits} onChange={value => edit('facial_hair_color', value)} />}
          </>}
          {isWardrobe && <>
            {section === 'outfit' && <div className={styles.pills} role="group" aria-label="Outfit collection">{([['all', 'All outfits'], ['everyday', 'Everyday'], ['costume', 'Costume edit'], ['sport', 'School spirit']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={collection === value} onClick={() => { setCollection(value); setTryOnSlug(null) }}>{label}</button>)}</div>}
            {section === 'accessories' && <div className={styles.pills} role="group" aria-label="Accessory category">{ACCESSORIES.map(value => <button type="button" key={value} aria-pressed={slot === value} onClick={() => { setAccessorySlot(value); setTryOnSlug(null); setQuery('') }}>{SLOT_LABELS[value]}</button>)}</div>}
            <div className={styles.wardrobeTools}><label><span className={styles.srOnly}>Search {SLOT_LABELS[slot].toLowerCase()}</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={`Find ${SLOT_LABELS[slot].toLowerCase()}…`} /></label><div className={styles.pills} role="group" aria-label="Wardrobe filter">{([['all', 'All'], ['owned', 'Mine'], ['available', 'Get now']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div></div>
            {section === 'outfit' && <details className={styles.disclosure}><summary>Free essentials · shirts & colors</summary>{draft.equipped.body && <p className={styles.notice}>Your outfit covers your base shirt. <button type="button" onClick={() => remove('body')}>Wear my base shirt</button></p>}<TraitPicker trait="shirt_style" traits={draft.traits} onChange={value => edit('shirt_style', value)} /><TraitPicker trait="shirt_color" traits={draft.traits} onChange={value => edit('shirt_color', value)} /></details>}
            {slot === 'facial_hair' && <TraitPicker trait="facial_hair_color" traits={draft.traits} onChange={value => edit('facial_hair_color', value)} />}
            {selectedItem && <ItemDetail item={selectedItem} wearing={draft.equipped[selectedItem.slot] === selectedItem.slug} trying={!!tryOn} balance={bundle.balance} onEquip={() => { changeDraft(draft => ({ ...draft, equipped: { ...draft.equipped, [selectedItem.slot]: selectedItem.slug } })); setTryOnSlug(null) }} onBuy={() => buy(selectedItem)} onClose={() => setTryOnSlug(null)} onRemove={() => remove(selectedItem.slot)} />}
            <div className={styles.results}><span>{wardrobeItems.length} {wardrobeItems.length === 1 ? 'find' : 'finds'}</span><span>Tap a tile to try it on</span></div>
            {wardrobeItems.length ? <div className={styles.itemGrid} data-scenes={section === 'scene'}>{wardrobeItems.map(item => <ItemTile key={item.slug} item={item} traits={draft.traits} equipped={draft.equipped} items={bundle.catalog} selected={selectedItem?.slug === item.slug} wearing={draft.equipped[slot] === item.slug} onTry={() => { setTryOnSlug(item.slug); setMessage('') }} />)}</div> : <div className={styles.empty}><p>No matches in this part of your wardrobe.</p><button type="button" className={styles.textButton} onClick={() => { setQuery(''); setFilter('all'); setCollection('all') }}>Show all {SLOT_LABELS[slot].toLowerCase()}</button></div>}
            <StyleBrief index={brief} onNext={() => setBrief(index => (index + 1) % STYLE_BRIEFS.length)} onBrowse={() => { chooseSection('outfit'); setCollection(STYLE_BRIEFS[brief].collection) }} />
          </>}
          {section === 'looks' && <>
            <p className={styles.intro}>Keep up to six favorites. Try a look with one tap, then save it to wear it in your lessons.</p>
            <div className={styles.keepLook}><label htmlFor="look-name">Give this look a name</label><div><input id="look-name" value={lookName} onChange={event => setLookName(event.target.value)} maxLength={32} placeholder="Lab day, moon explorer, Friday…" /><button type="button" className={styles.primary} disabled={!lookName.trim() || draft.saved_looks.length >= 6} onClick={() => { changeDraft(draft => draft.saved_looks.length >= 6 ? draft : ({ ...draft, saved_looks: [...draft.saved_looks, { name: lookName.trim(), traits: draft.traits, equipped: draft.equipped }] })); setLookName(''); setMessage('Look added. Save your changes to keep it.') }}><Sparkles size={16} />Keep look</button></div>{draft.saved_looks.length >= 6 && <p>Your lookbook is full. Remove a look to make room for a new one.</p>}</div>
            <div className={styles.lookGrid}>{draft.saved_looks.map((look, index) => {
              const active = JSON.stringify(withDefaults(look.traits)) === JSON.stringify(draft.traits) && JSON.stringify(look.equipped) === JSON.stringify(draft.equipped)
              return <article key={index} className={styles.lookCard}><button type="button" aria-label={`Use look: ${look.name}`} aria-pressed={active} onClick={() => { changeDraft(draft => ({ ...draft, traits: withDefaults(look.traits), equipped: look.equipped })); setCloseUp(false) }}><span className={styles.lookNumber}>LOOK / {String(index + 1).padStart(2, '0')}</span><Avatar traits={look.traits} equipped={look.equipped} items={bundle.catalog} size={106} crop="figure" decorative /><strong>{look.name}</strong><span className={styles.lookUse}>{active ? <><Check size={12} />In your mirror</> : 'Try this look →'}</span></button><button type="button" className={styles.deleteLook} aria-label={`Delete ${look.name}`} onClick={() => changeDraft(draft => ({ ...draft, saved_looks: draft.saved_looks.filter((_, position) => position !== index) }))}><Trash2 size={14} /></button></article>
            })}{draft.saved_looks.length < 6 && <div className={styles.lookPlaceholder}><BookOpen size={27} /><p>Your next favorite<br />belongs here.</p></div>}</div>
          </>}
        </fieldset>}
      </div>
    </div>
    <div className={styles.mobileSave}><button type="button" className={styles.undo} disabled={busy || (!history.past.length && !tryOn)} onClick={() => { if (tryOn) setTryOnSlug(null); else dispatch({ type: 'undo' }); setMessage('Last change undone.') }}><Undo2 size={17} />Undo</button><button type="button" className={styles.primary} disabled={saveDisabled} onClick={save}><Save size={16} />{saveLabel}</button></div>
  </main>
}
