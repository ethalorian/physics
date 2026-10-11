import Image from 'next/image'

interface BrandLogoProps {
  size?: number
  className?: string
  decorative?: boolean
  priority?: boolean
}

/** The supplied Antocci Physics artwork, shared by every app brand surface. */
export default function BrandLogo({ size = 32, className, decorative = false, priority = false }: BrandLogoProps) {
  return (
    <Image
      src="/brand/antocci-physics.png"
      alt={decorative ? '' : 'Antocci Physics logo'}
      width={size}
      height={size}
      sizes={`${size}px`}
      priority={priority}
      className={className}
      style={{ display: 'block', width: size, height: size, flexShrink: 0, objectFit: 'contain', borderRadius: 'var(--radius-sm, 8px)' }}
    />
  )
}
