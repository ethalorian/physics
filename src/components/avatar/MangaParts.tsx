import React, { useId } from 'react'
import type { AvatarItem } from '@/lib/avatar/types'
import { safeSvgLayer } from '@/lib/avatar/svg'
import { MANGA_SPRITES, SPRITE_INSETS, mangaItemSprite, mangaTintRamp, type MangaSprite, type SpriteRect } from '@/lib/avatar/manga-collection'

export function Tint({ id, color }: { id: string; color: string }) {
  const [r, g, b] = mangaTintRamp(color)
  return <filter id={id} colorInterpolationFilters="sRGB" x="-2%" y="-2%" width="104%" height="104%"><feColorMatrix type="saturate" values="0" /><feComponentTransfer><feFuncR type="table" tableValues={r} /><feFuncG type="table" tableValues={g} /><feFuncB type="table" tableValues={b} /></feComponentTransfer></filter>
}

export function Sprite({ name, sprite = name ? MANGA_SPRITES[name] : undefined, rect, sourceWindow, filter, insets, label = name }: { name?: string; sprite?: MangaSprite; rect: SpriteRect; sourceWindow?: SpriteRect; filter?: string; insets?: readonly [number,number,number,number]; label?: string }) {
  const clipId = `tile-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  if (!sprite) return null
  const [x, y, width, height] = rect
  const [left, right, top, bottom] = insets ?? SPRITE_INSETS[name ?? label ?? ''] ?? (sprite.collection === 'manga-wardrobe-v2' && sprite.atlas.startsWith('headwear-') ? [12,12,0,0] : [0,0,0,0])
  const rowOffset = sprite.atlas === 'outfits-2' && sprite.index >= 4 ? 50 : sprite.atlas === 'outfits-3' && sprite.index >= 4 ? 60 : 0
  const scene = sprite.atlas === 'scenes'
  const [windowX,windowY,windowWidth,windowHeight] = sourceWindow ?? (scene ? [left,top,1000-left-right,1000-top-bottom] : sprite.atlas === 'headwear-4' && sprite.index >= 2 ? [0,-120,1000,1120] : [0,0,1000,1000])
  const sx = sprite.index % sprite.cols * 1000 + windowX, sy = Math.floor(sprite.index / sprite.cols) * 1000 - rowOffset + windowY
  return <svg className="avatar-size-native" x={x} y={y} width={width} height={height} viewBox={`${sx} ${sy} ${windowWidth} ${windowHeight}`} preserveAspectRatio="none" overflow="hidden" data-manga-sprite={label}>
    <defs><clipPath id={clipId}>{sprite.atlas === 'backgrounds'
      ? <ellipse cx={sx+windowWidth/2} cy={sy+windowHeight/2} rx={windowWidth*.47} ry={windowHeight*.47} />
      : scene ? <rect x={sx} y={sy} width={windowWidth} height={windowHeight} />
      : <rect x={sx+left} y={sy+top} width={windowWidth-left-right} height={windowHeight-top-bottom} />}</clipPath></defs>
    <g clipPath={`url(#${clipId})`}><image filter={filter ? `url(#${filter})` : undefined} href={`/avatar/${sprite.collection}/${sprite.atlas}.webp`} width={sprite.cols * 1000} height={sprite.rows * 1000} preserveAspectRatio="none" /></g>
  </svg>
}

export function Item({ item, rect, filter, legacyTransform = 'translate(200 120) scale(1.1 1.3)' }: { item: AvatarItem; rect: SpriteRect; filter?: string; legacyTransform?: string }) {
  const sprite = mangaItemSprite(item)
  return sprite ? <Sprite sprite={sprite} rect={rect} filter={filter} label={item.slug} /> : <LegacyItem item={item} transform={legacyTransform} filter={filter} />
}
/** Environment art fills the figure's frame and shares its ground plane. */
export function Backdrop({ item, rect }: { item: AvatarItem; rect: SpriteRect }) {
  return <svg className="avatar-size-native" x={rect[0]} y={rect[1]} width={rect[2]} height={rect[3]} viewBox="0 0 400 500" preserveAspectRatio="xMidYMax slice" overflow="hidden">
    <Item item={item} rect={[0,0,400,500]} />
  </svg>
}
export function LegacyItem({ item, transform, filter }: { item: AvatarItem; transform: string; filter?: string }) {
  return <g transform={transform} filter={filter ? `url(#${filter})` : undefined} data-avatar-custom-item={item.slug} dangerouslySetInnerHTML={{__html: safeSvgLayer(item.svg_layer)}} />
}

