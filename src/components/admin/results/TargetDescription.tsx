'use client'
import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import s from './ResultsGradebook.module.css'

export default function TargetDescription({ code, statement }: { code: string; statement: string }) {
  const [open,setOpen] = useState(false)
  return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger asChild><button className={s.targetDescription} title={statement} aria-label={`${code}: ${statement}. Open full description.`}><strong>{code} ⓘ</strong><span>{statement}</span><span role="tooltip" className={s.targetTooltip}>{statement}</span></button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className={s.scrim}/><Dialog.Content className={s.descriptionPanel}><Dialog.Title>{code}</Dialog.Title><Dialog.Description>{statement}</Dialog.Description><Dialog.Close>Close</Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>
}
