import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Avatar from '@/components/avatar/Avatar'
import { safeSvgLayer } from './svg'
import { DEFAULT_TRAITS, TRAIT_OPTIONS, validTraits, validEquipped, withDefaults, type AvatarItem } from './types'
import catalog from '@/data/avatar-catalog.json'
import { SKIN } from './palette'
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
test('covering headwear suppresses large hair without mutating the trait', () => {
  const traits = { ...DEFAULT_TRAITS, hair_style: 'afro' as const }
  const mask = renderToStaticMarkup(<Avatar traits={traits} items={items} equipped={{ head: 'spiderman-mask' }} />)
  const bare = renderToStaticMarkup(<Avatar traits={traits} items={items} />)
  assert.doesNotMatch(mask, /M -46,28/)
  assert.match(bare, /M -46,28/)
  assert.equal(traits.hair_style, 'afro')
})
test('clip IDs are unique within one gallery and decorative images stay quiet', () => {
  const output = renderToStaticMarkup(<><Avatar traits={{}} decorative /><Avatar traits={{}} decorative /></>)
  const ids = [...output.matchAll(/clipPath id="([^"]+)"/g)].map(m => m[1])
  assert.equal(new Set(ids).size, 2)
  assert.doesNotMatch(output, /aria-label="Student avatar"/)
})

test('vampire accessories coexist, follow face controls, and restore the base mouth when removed', () => {
  const equipped = { ears: 'vampire-ears', mouth: 'vampire-fangs', body: 'midnight-vampire-dress', eyewear: 'round-glasses' }
  assert.ok(validEquipped(equipped))
  for (const face of TRAIT_OPTIONS.face) for (const mouth_width of TRAIT_OPTIONS.mouth_width) {
    const traits = { face, mouth_width, mouth: 'open' } as const
    const output = renderToStaticMarkup(<Avatar traits={traits as never} items={items} equipped={equipped} />)
    for (const slug of ['vampire-fangs', 'midnight-vampire-dress', 'round-glasses']) {
      assert.ok(output.includes(safeSvgLayer(items.find(i => i.slug === slug)!.svg_layer)), `${face}/${mouth_width}/${slug}`)
    }
    assert.doesNotMatch(output, /<ellipse cx="0" cy="25"/)
    if (mouth_width === 'wide') assert.match(output, /scale\(1\.25, 1\)/)
    if (mouth_width === 'narrow') assert.match(output, /scale\(0\.8, 1\)/)
    const unequipped = renderToStaticMarkup(<Avatar traits={traits as never} items={items} equipped={{ ears: equipped.ears }} />)
    assert.match(unequipped, /<ellipse cx="0" cy="25"/)
  }
})

test('pointed ears use every skin tone, fit all faces, and stay underneath covering masks', () => {
  const ears = items.find(i => i.slug === 'vampire-ears')!
  for (const skin of TRAIT_OPTIONS.skin) for (const face of TRAIT_OPTIONS.face) {
    const traits = { skin, face, hair_style: 'bald' } as const
    const output = renderToStaticMarkup(<Avatar traits={traits as never} items={items} equipped={{ ears: ears.slug }} />)
    const artwork = ears.svg_layer.replaceAll('#E7B58B', SKIN[skin as keyof typeof SKIN].color)
    assert.ok(output.includes(safeSvgLayer(artwork)), `${skin}/${face}`)
    assert.doesNotMatch(output, /rx="5" ry="9"/)
    if (face === 'heart') assert.match(output, /translate\(0, -6\) scale\(0\.913/)
    if (face === 'square') assert.match(output, /scale\(1\.043/)
    const masked = renderToStaticMarkup(<Avatar traits={traits as never} items={items} equipped={{ ears: ears.slug, head: 'spiderman-mask' }} />)
    assert.ok(!masked.includes(safeSvgLayer(artwork)))
  }
})
