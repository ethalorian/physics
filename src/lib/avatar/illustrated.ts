/** The first art proof. These complete outfits are preview assets, not owned inventory. */
export const ILLUSTRATED_AVATAR_LOOKS = {
  everyday: { name: 'Everyday', description: 'Soft layers. Ready for anything.', src: '/avatar/illustrated/studio-everyday.webp', width: 175, height: 430 },
  mummy: { name: 'Mummy wraps', description: 'A little ancient. A little adventurous.', src: '/avatar/illustrated/studio-mummy.webp', width: 237, height: 431 },
} as const

export type IllustratedAvatarLook = keyof typeof ILLUSTRATED_AVATAR_LOOKS

export function isIllustratedAvatarLook(value: unknown): value is IllustratedAvatarLook {
  return typeof value === 'string' && Object.hasOwn(ILLUSTRATED_AVATAR_LOOKS, value)
}
