import Image from 'next/image'
import { ILLUSTRATED_AVATAR_LOOKS, type IllustratedAvatarLook } from '@/lib/avatar/illustrated'

/** Shared full-body artwork for Home, readers, and scene renderers. */
export default function IllustratedAvatar({ look, className, decorative = false, priority = false, sizes = '240px' }: {
  look: IllustratedAvatarLook
  className?: string
  decorative?: boolean
  priority?: boolean
  sizes?: string
}) {
  const art = ILLUSTRATED_AVATAR_LOOKS[look]
  return <Image src={art.src} width={art.width} height={art.height} sizes={sizes} priority={priority}
    alt={decorative ? '' : `Illustrated avatar wearing ${art.name.toLowerCase()}`}
    aria-hidden={decorative || undefined} className={className} data-illustrated-look={look} />
}
