import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Avatar from '@/components/avatar/Avatar'
import { safeSvgLayer } from './svg'
import { DEFAULT_TRAITS, TRAIT_OPTIONS, validTraits, validEquipped, withDefaults, type AvatarItem } from './types'
import catalog from '@/data/avatar-catalog.json'
import { SKIN } from './palette'
import {MANGA_SPRITES,mangaItemSprite,mangaTintRamp,HAIR_RECTS,equippedMangaItems} from './manga-collection'
import {readFileSync,statSync} from 'node:fs'
import sharp from 'sharp'
import atlases from './manga-atlases.json'
import {PROFILE_HAIR,PROFILE_HAIR_RECTS} from './profile-hair'
const items = catalog as AvatarItem[]

test('untrusted or legacy traits never crash the composer', () => {
  for (const traits of [null, undefined, {}, { face: 'invalid', skin: null, hair_color: 'invalid' }, { face: { value: 'round' } }]) {
    assert.doesNotThrow(() => renderToStaticMarkup(<Avatar traits={traits as never} />))
  }
  assert.deepEqual(withDefaults({ face: 'invalid' } as never), DEFAULT_TRAITS)
  assert.equal(validTraits({ __proto__: null, skin: 'dark' }), true)
  assert.equal(validTraits(JSON.parse('{"__proto__":"bad"}')), false)
  assert.equal(validTraits({ face: null }), false)
  assert.equal(validEquipped({ head: 'test-mask' }), true)
  assert.equal(validEquipped({ bad: 'test-mask' }), false)
})
test('every trait option renders and normalizes without losing its identity', () => {
  for (const [key, options] of Object.entries(TRAIT_OPTIONS)) for (const value of options) {
    const traits = { ...DEFAULT_TRAITS, [key]: value }
    assert.equal(withDefaults(traits)[key as keyof typeof traits], value)
    assert.match(renderToStaticMarkup(<Avatar traits={traits} />), /<svg/)
    assert.doesNotMatch(renderToStaticMarkup(<Avatar traits={traits} comic />), /NaN|Infinity|undefined/)
  }
})
test('SVG allowlist accepts the whole versioned catalog and rejects active syntax', () => {
  for (const item of items) assert.ok(safeSvgLayer(item.svg_layer), item.slug)
  for (const attack of [
    '<script>alert(1)</script>', '<g onload="alert(1)"/>', '<foreignObject><div/></foreignObject>',
    '<image href="https://attacker.invalid/pixel"/>', '<use href="#x"/>', '<path fill="url(https://attacker.invalid)"/>',
    '<g style="background:url(x)"/>', '<g><animate attributeName="href"/></g>', '<!DOCTYPE svg><g/>',
    '<path fill="&#x23;fff"/>', '<g id="duplicate"/>', '<g/><script/>', '<path d="&quot; onload=&quot;x"/>',
    '<g fill="red"/>', '<g fill="#fff" fill="#000"/>', '<g></path>', '<g/><broken',
  ]) assert.equal(safeSvgLayer(attack), '', attack)
})
test('renderer ignores wrong-slot items and sanitizes catalog artwork', () => {
  const item = { ...items[0], slug: 'bad', slot: 'body', svg_layer: '<script>attack</script>' } as AvatarItem
  const output = renderToStaticMarkup(<Avatar traits={{}} items={[item]} equipped={{ head: 'bad' }} />)
  assert.doesNotMatch(output, /attack|script/)
  const right = renderToStaticMarkup(<Avatar traits={{}} items={[item]} equipped={{ body: 'bad' }} />)
  assert.doesNotMatch(right, /attack|script/)
})

test('every free appearance part has local illustrated art with valid registration', async () => {
  for (const key of [...TRAIT_OPTIONS.face, ...TRAIT_OPTIONS.shirt_style, ...TRAIT_OPTIONS.hair_style.filter(s=>s!=='bald'), 'left-arm', 'right-arm', 'legs']) assert.ok(MANGA_SPRITES[key], key)
  assert.equal(Object.keys(HAIR_RECTS).length, TRAIT_OPTIONS.hair_style.length-1)
  let totalBytes = 0
  for (const atlas of atlases) {
    assert.ok(atlas.entries.length <= atlas.cols * atlas.rows, atlas.name)
    const file = `public/avatar/${atlas.collection ?? 'manga-v1'}/${atlas.name}.webp`
    const metadata = await sharp(file).metadata(), stats = await sharp(file).stats()
    if (atlas.name === 'scenes') {
      assert.equal(stats.isOpaque,true,'Scene art must fill its rectangular canvas')
    } else {
      assert.equal(metadata.hasAlpha,true,atlas.name)
      assert.ok(stats.channels[3].min === 0 && stats.channels[3].max > 240, `${atlas.name}: cutouts require transparent margins and opaque artwork`)
    }
    totalBytes += statSync(file).size
  }
  // Entire catalog budget includes separate side paintings for five essentials
  // and thirty costumes. A single avatar loads only its referenced sheets.
  assert.ok(totalBytes < 11_250_000, `Collection transfer budget exceeded: ${totalBytes}`)
})

test('every owned catalog item renders through a trusted sprite or sanitized compatibility layer', () => {
  for (const item of items) {
    const equipped = {[item.slot]:item.slug}
    const output = renderToStaticMarkup(<Avatar traits={{}} items={items} equipped={equipped} crop="figure" />)
    assert.ok(output.includes(`="${item.slug}"`), item.slug)
    assert.doesNotMatch(output,/NaN|Infinity|undefined/)
    const missing = renderToStaticMarkup(<Avatar traits={{}} items={[]} equipped={equipped} />)
    assert.ok(!missing.includes(`="${item.slug}"`), `${item.slug}: must be in supplied catalog`)
    const retired = {...item,enabled:false}
    assert.equal(equippedMangaItems(equipped,[retired])[item.slot]?.slug,item.slug)
  }
  for (const slug of ['constructor','__proto__','toString']) assert.equal(mangaItemSprite({...items[0],slug}),undefined)
  const unknownSlot = {...items[0],slot:'__proto__',slug:'bad'} as unknown as AvatarItem
  const mapped = equippedMangaItems(JSON.parse('{"__proto__":"bad"}'),[unknownSlot])
  assert.equal(Object.getPrototypeOf(mapped),Object.prototype)
  assert.deepEqual(mapped,{})
})

test('covering headwear suppresses hair and pointed ears without changing saved identity', () => {
  const traits = {...DEFAULT_TRAITS,hair_style:'afro' as const}
  const bare = renderToStaticMarkup(<Avatar traits={traits} items={items} />)
  const mask = renderToStaticMarkup(<Avatar traits={traits} items={items} equipped={{head:'spiderman-mask',ears:'vampire-ears'}} />)
  assert.match(bare,/data-manga-sprite="hair:afro"/)
  assert.doesNotMatch(mask,/data-manga-sprite="hair:afro"|data-(?:avatar-custom-item|manga-sprite)="vampire-ears"/)
  assert.equal(traits.hair_style,'afro')
})

test('gallery filters and clips are unique, resolved, and quiet for decorative portraits', () => {
  const output = renderToStaticMarkup(<><Avatar traits={{}} decorative /><Avatar traits={{hair_style:'hijab'}} decorative /></>)
  const ids = [...output.matchAll(/ id="([^"]+)"/g)].map(m=>m[1])
  assert.ok(ids.length>10)
  assert.equal(new Set(ids).size,ids.length)
  for (const match of output.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.includes(match[1]),match[1])
  assert.doesNotMatch(output,/aria-label="Student avatar"/)
  assert.match(renderToStaticMarkup(<Avatar traits={{}} />),/role="img" aria-label="Student avatar"/)
  // Shared Button deliberately resizes icon SVGs unless their class contains size-.
  // Both the outer avatar and its atlas viewports must retain native dimensions.
  for (const tag of output.matchAll(/<svg\b[^>]*>/g)) assert.match(tag[0],/class="[^"]*avatar-size-native/)
})

test('skin and hair tinting preserves dark ink, ordered highlights and all seven skin tones', () => {
  const ramps = TRAIT_OPTIONS.skin.map(skin=>mangaTintRamp(SKIN[skin as keyof typeof SKIN].color))
  assert.equal(new Set(ramps.map(ramp=>JSON.stringify(ramp))).size,7)
  for (const ramp of ramps) for (const channel of ramp) {
    const values=channel.split(' ').map(Number)
    assert.ok(values.every((v,i)=>v>=0 && v<=1 && (i===0 || v>values[i-1])))
  }
})

test('face controls remain meaningful and fangs restore the saved expression when removed', () => {
  for (const key of ['eyes','eye_color','eye_spacing','eye_scale','eye_tilt','brows','brow_height','mouth','mouth_width','nose','freckles','cheek_blush'] as const) {
    const variants=TRAIT_OPTIONS[key].map(value=>renderToStaticMarkup(<Avatar traits={{...DEFAULT_TRAITS,[key]:value}} />))
    assert.equal(new Set(variants).size,variants.length,key)
  }
  const worn = renderToStaticMarkup(<Avatar traits={{mouth:'open'}} items={items} equipped={{mouth:'vampire-fangs'}} />)
  assert.match(worn,/data-manga-(?:sprite|mouth)="vampire-fangs"/)
  assert.doesNotMatch(worn,/data-manga-mouth="open"/)
  assert.match(renderToStaticMarkup(<Avatar traits={{mouth:'open'}} />),/data-manga-mouth="open"/)
})

test('portraits and animated figures preserve the same saved look without mutating it', () => {
  const traits={...DEFAULT_TRAITS,skin:'deep' as const,hair_style:'twists' as const}
  const equipped={body:'night-bat-hoodie',eyewear:'round-glasses'}
  const before=JSON.stringify({traits,equipped})
  for (const crop of ['head','portrait','full','medium','figure'] as const) {
    const output=renderToStaticMarkup(<Avatar traits={traits} equipped={equipped} items={items} crop={crop} pose="running" />)
    assert.match(output,/data-avatar-collection="manga-v2"/)
    assert.match(output,/data-manga-sprite="hair:twists"/)
    assert.match(output,/data-manga-sprite="night-bat-hoodie"/)
    assert.match(output,/data-manga-sprite="round-glasses"/)
    if(crop==='figure') assert.match(output,/data-avatar-view="profile"/)
  }
  assert.equal(JSON.stringify({traits,equipped}),before)
  assert.match(readFileSync('src/components/avatar/avatar-figure.module.css','utf8'),/prefers-reduced-motion:reduce/)
})


test('wardrobe coverage is explicit and all illustrated slugs retain their catalog slots', () => {
  const illustrated = items.filter(item=>mangaItemSprite(item))
  assert.equal(illustrated.length,88)
  assert.equal(illustrated.filter(item=>mangaItemSprite(item)?.collection==='manga-wardrobe-v1').length,57)
  assert.equal(illustrated.filter(item=>mangaItemSprite(item)?.collection==='manga-studio-v1').length,7)
  assert.deepEqual(items.filter(item=>!mangaItemSprite(item)).map(item=>item.slug).sort(), [
    'spiderman-suit','spiderman-mask','flash-mask','batman-cowl',
  ].sort())
  assert.equal(new Set(atlases.flatMap(a=>a.entries)).size,atlases.reduce((n,a)=>n+a.entries.length,0))
  for (const item of illustrated) {
    const wrong = {...item,slot:item.slot==='body'?'head':'body'} as AvatarItem
    assert.equal(mangaItemSprite(wrong),undefined,item.slug)
    const sprite=mangaItemSprite(item)!
    assert.ok(['manga-v1','manga-wardrobe-v1','manga-wardrobe-v2','manga-studio-v1'].includes(sprite.collection))
  }
})

test('walking figures keep every wardrobe layer and resolve their articulated clips', () => {
  for (const item of [null, ...items.filter(item => item.slot === 'body')]) {
    const output = renderToStaticMarkup(<Avatar traits={DEFAULT_TRAITS} equipped={item ? {body:item.slug} : {}} items={items} crop="figure" pose="walking" />)
    const ids = [...output.matchAll(/ id="([^"]+)"/g)].map(match => match[1])
    assert.equal(ids.length,new Set(ids).size,item?.slug)
    for (const match of output.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.includes(match[1]),`${item?.slug}: ${match[1]}`)
    if(item) assert.ok(output.includes(`="${item.slug}"`),item.slug)
    assert.doesNotMatch(output,/NaN|Infinity|undefined/)
    assert.match(output,/data-avatar-pose="walking"/)
  }
})


test('side-facing hair has dedicated transparent art for every free style', async()=>{
  let bytes=0
  for(const sheet of ['a','b','c','d']){
    const path=`public/avatar/manga-profile-v1/hair-${sheet}.webp`
    const meta=await sharp(path).metadata(),stats=await sharp(path).stats()
    assert.equal(meta.hasAlpha,true)
    assert.ok(stats.channels[3].min===0&&stats.channels[3].max>240)
    bytes+=statSync(path).size
  }
  assert.ok(bytes<2_000_000)
  for(const style of TRAIT_OPTIONS.hair_style){
    const output=renderToStaticMarkup(<Avatar traits={{...DEFAULT_TRAITS,hair_style:style as typeof DEFAULT_TRAITS.hair_style}} crop="figure" pose="walking" />)
    if(style==='bald'){assert.doesNotMatch(output,/data-manga-sprite="hair:/);continue}
    assert.ok(PROFILE_HAIR[style])
    assert.ok(PROFILE_HAIR_RECTS[style as keyof typeof PROFILE_HAIR_RECTS])
    assert.match(output,/\/avatar\/manga-profile-v1\/hair-/)
    assert.ok(output.includes(`data-manga-sprite="hair:${style}"`))
    assert.doesNotMatch(output,/NaN|Infinity|undefined/)
  }
})
