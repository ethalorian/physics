'use client'

import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { Check, X } from 'lucide-react'
import StudentCheckIn from './StudentCheckIn'
import IllustratedAvatar from '@/components/avatar/IllustratedAvatar'
import { ILLUSTRATED_AVATAR_LOOKS, isIllustratedAvatarLook, type IllustratedAvatarLook } from '@/lib/avatar/illustrated'
import styles from './StudentHomeIdentity.module.css'

/** An explicit preview on the real Home page. No inventory, XP, or avatar writes. */
export default function StudentHomeIdentity(props: ComponentProps<typeof StudentCheckIn>) {
  const [preview, setPreview] = useState(false)
  const [look, setLook] = useState<IllustratedAvatarLook>('everyday')
  const [draft, setDraft] = useState<IllustratedAvatarLook>('everyday')
  const [open, setOpen] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const changeButton = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setPreview(params.get('avatar-preview') === 'illustrated')
    const candidate = params.get('look')
    if (isIllustratedAvatarLook(candidate)) setLook(candidate)
  }, [])

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) element.showModal()
    if (!open && element.open) element.close()
  }, [open])

  function chooseLook() {
    setDraft(look)
    setOpen(true)
  }

  function closeDrawer() {
    setOpen(false)
    changeButton.current?.focus()
  }

  function exitPreview() {
    const url = new URL(window.location.href)
    url.searchParams.delete('avatar-preview')
    url.searchParams.delete('look')
    window.history.replaceState(window.history.state, '', url)
    setPreview(false)
  }

  if (!preview) return <StudentCheckIn {...props} />

  return <div className={styles.preview} lang="en" translate="yes">
    <aside className={styles.previewBar} aria-label="Avatar preview">
      <p><strong>New avatar preview</strong><span>Two sample outfits. Try a look on your Home page.</span></p>
      <button type="button" onClick={exitPreview}>Exit preview<X size={15} aria-hidden="true" /></button>
    </aside>
    <StudentCheckIn {...props} illustratedLook={look} onChangeLook={chooseLook} changeLookRef={changeButton} />
    <dialog ref={dialog} className={styles.drawer} aria-labelledby="home-look-heading" aria-describedby="home-look-note"
      onCancel={closeDrawer} onClose={closeDrawer}>
      <header className={styles.drawerHeader}><div><p className={styles.eyebrow}>YOUR NEXT LOOK</p><h2 id="home-look-heading">Make an entrance.</h2></div><button type="button" onClick={closeDrawer} aria-label="Close outfit preview"><X size={21} aria-hidden="true" /></button></header>
      <p id="home-look-note" className={styles.note}>These sample outfits change this preview. Your saved avatar and XP stay yours.</p>
      <fieldset className={styles.looks}><legend>Choose an outfit</legend>
        {(Object.entries(ILLUSTRATED_AVATAR_LOOKS) as [IllustratedAvatarLook, (typeof ILLUSTRATED_AVATAR_LOOKS)[IllustratedAvatarLook]][]).map(([id, art]) =>
          <label key={id} className={styles.look} data-selected={draft === id}>
            <input type="radio" name="home-preview-look" value={id} checked={draft === id} onChange={() => setDraft(id)} />
            <div className={styles.lookStage}><IllustratedAvatar look={id} decorative sizes="150px" className={styles.lookImage} /></div>
            <span className={styles.lookTitle}>{art.name}{draft === id && <Check size={16} aria-hidden="true" />}</span>
            <span className={styles.description}>{art.description}</span>
          </label>)}
      </fieldset>
      <footer className={styles.drawerFooter}><button type="button" onClick={() => { setLook(draft); closeDrawer() }}>Wear this look</button><p>Preview collection · mix-and-match pieces are the next art step.</p></footer>
    </dialog>
  </div>
}
