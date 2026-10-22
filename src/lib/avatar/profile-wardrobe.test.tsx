import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { statSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import sharp from 'sharp'
import Avatar from '@/components/avatar/Avatar'
import { ProfileEyes, ProfileMouth } from '@/components/avatar/ProfileExpression'
import { PROFILE_WARDROBE_ATLASES, PROFILE_HEAD_RECTS, profileItemSprite } from './profile-wardrobe'
import { DEFAULT_TRAITS, TRAIT_OPTIONS, type AvatarItem, type NoseStyle } from './types'
import catalog from '@/data/avatar-catalog.json'

const items = catalog as AvatarItem[]
const visual = (html: string) => html.replace(/ data-[\w-]+="[^"]*"/g, '')

test('side expressions change visible geometry, not just metadata', () => {
  for (const key of ['eyes', 'eye_color', 'eye_spacing', 'eye_scale', 'eye_tilt', 'brows', 'brow_height'] as const) {
    const variants = TRAIT_OPTIONS[key].map(value => visual(renderToStaticMarkup(<svg><ProfileEyes traits={{ ...DEFAULT_TRAITS, [key]: value }} id="test-face" /></svg>)))
    assert.equal(new Set(variants).size, variants.length, key)
  }
  for (const key of ['mouth', 'mouth_width'] as const) {
    const variants = TRAIT_OPTIONS[key].map(value => visual(renderToStaticMarkup(<svg><ProfileMouth traits={{ ...DEFAULT_TRAITS, [key]: value }} /></svg>)))
    assert.equal(new Set(variants).size, variants.length, key)
  }
})

test('profile artwork is local, transparent, bounded and only mapped to its canonical slot', async () => {
  let bytes = 0
  for (const atlas of PROFILE_WARDROBE_ATLASES) {
    const file = `public/avatar/${atlas.collection}/${atlas.name}.webp`
    const metadata = await sharp(file).metadata(), stats = await sharp(file).stats()
    assert.equal(metadata.hasAlpha, true)
    assert.equal(stats.channels[3].min, 0)
    assert.ok(stats.channels[3].max > 240)
    bytes += statSync(file).size
    for (const slug of atlas.entries) {
      const item = items.find(item => item.slug === slug)!
      assert.ok(item, slug)
      assert.equal(profileItemSprite(item)?.atlas, atlas.name)
      assert.equal(profileItemSprite({ ...item, slot: 'body' }), undefined)
      if (item.slot === 'head') assert.ok(PROFILE_HEAD_RECTS[slug].every(Number.isFinite), slug)
    }
  }
  assert.ok(bytes < 2_000_000, `Profile accessories exceed transfer budget: ${bytes}`)
  for (const slug of ['__proto__', 'constructor', 'toString']) assert.equal(profileItemSprite({ ...items[0], slug }), undefined)
})

test('portrait and walking select the correct artwork without losing equipped identity', () => {
  for (const item of items.filter(item => profileItemSprite(item))) {
    const props = { traits: DEFAULT_TRAITS, equipped: { [item.slot]: item.slug }, items, crop: 'figure' as const }
    const front = renderToStaticMarkup(<Avatar {...props} />)
    const side = renderToStaticMarkup(<Avatar {...props} pose="walking" />)
    const sprite = profileItemSprite(item)!
    assert.doesNotMatch(front, /manga-profile-wardrobe-v1/)
    assert.ok(side.includes('/avatar/' + sprite.collection + '/' + sprite.atlas + '.webp'), item.slug)
    if (sprite.collection === 'manga-wardrobe-v2') {
      assert.equal(sprite.index, 1, 'walking uses the separate right-hand view')
      assert.match(side, new RegExp('viewBox="1000 0 1000 1000"[^>]+data-manga-sprite="' + item.slug + '"'))
      assert.match(front, new RegExp('viewBox="0 0 1000 1000"[^>]+data-manga-sprite="' + item.slug + '"'))
    }
    assert.ok(side.includes(`data-manga-sprite="${item.slug}"`), item.slug)
    const ids = [...side.matchAll(/ id="([^"]+)"/g)].map(match => match[1])
    assert.equal(new Set(ids).size, ids.length)
    for (const match of side.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.includes(match[1]), `${item.slug}: ${match[1]}`)
  }
})

test('covering masks clip the underlying side head and fangs preserve the saved mouth control', () => {
  const traits = { ...DEFAULT_TRAITS, hair_style: 'afro' as const, mouth: 'smirk' as const, mouth_width: 'wide' as const }
  const covered = renderToStaticMarkup(<Avatar traits={traits} crop="figure" pose="side" items={items} equipped={{ head: 'spooky-mummy-mask', ears: 'vampire-ears' }} />)
  assert.doesNotMatch(covered, /data-manga-sprite="(?:hair:afro|vampire-ears)"/)
  assert.match(covered, /data-manga-face="round" clip-path="url\(#[^)]+-head-opening\)"/)
  const fangs = renderToStaticMarkup(<Avatar traits={traits} crop="figure" pose="side" items={items} equipped={{ mouth: 'vampire-fangs' }} />)
  assert.doesNotMatch(fangs, /data-manga-mouth="smirk"/)
  const restored = renderToStaticMarkup(<Avatar traits={traits} crop="figure" pose="side" />)
  assert.match(restored, /data-manga-mouth="smirk"/)
  assert.match(restored, /scale\(1.2 1\)/)
  assert.equal(traits.mouth, 'smirk')
})

test('pointed profile ears replace the natural ear rather than layering a front ear over it', () => {
  for (const nose of TRAIT_OPTIONS.nose as NoseStyle[]) {
    const props = { traits: { ...DEFAULT_TRAITS, nose }, items, crop: 'figure' as const }
    const bare = renderToStaticMarkup(<Avatar {...props} pose="side" />)
    const pointed = renderToStaticMarkup(<Avatar {...props} pose="side" equipped={{ ears: 'vampire-ears' }} />)
    const covered = renderToStaticMarkup(<Avatar {...props} pose="side" equipped={{ ears: 'vampire-ears', head: 'spooky-mummy-mask' }} />)
    assert.match(bare, /profile-heads-neck-fit\.webp/)
    assert.doesNotMatch(bare, /profile-heads-pointed-neck-fit\.webp/)
    assert.match(pointed, /profile-heads-pointed-neck-fit\.webp/)
    assert.doesNotMatch(pointed, /profile-heads-neck-fit\.webp|face-accessories\.webp/)
    assert.equal([...pointed.matchAll(/data-manga-sprite="vampire-ears"/g)].length, 1)
    assert.doesNotMatch(covered, /profile-heads-pointed-neck-fit\.webp/)
    const front = renderToStaticMarkup(<Avatar {...props} equipped={{ ears: 'vampire-ears' }} />)
    assert.match(front, /face-accessories\.webp/)
    assert.doesNotMatch(front, /profile-heads-pointed-neck-fit\.webp/)
  }
})

test('every side outfit preserves its identity, resolves its layers, and stays within a per-avatar transfer budget', () => {
  for (const body of [undefined, ...items.filter(item => item.slot === 'body')]) {
    const output = renderToStaticMarkup(<Avatar traits={DEFAULT_TRAITS} items={items} equipped={body ? {body:body.slug} : {}} crop="figure" pose="walking" />)
    if (body) assert.ok(output.includes(`="${body.slug}"`), body.slug)
    assert.doesNotMatch(output, /NaN|Infinity|undefined/)
    const ids = [...output.matchAll(/ id="([^"]+)"/g)].map(match => match[1])
    assert.equal(new Set(ids).size, ids.length, body?.slug)
    for (const match of output.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.includes(match[1]), `${body?.slug}: unresolved ${match[1]}`)
    const urls = new Set([...output.matchAll(/href="(\/avatar\/[^"]+)"/g)].map(match => match[1]))
    const bytes = [...urls].reduce((total,url) => total + statSync(`public${url}`).size, 0)
    assert.ok(bytes < 1_500_000, `${body?.slug ?? 'essential'}: character sheets total ${bytes} bytes`)
  }
})
