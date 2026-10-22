import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import sharp from 'sharp'
import MangaBaseBody from '@/components/avatar/MangaBaseBody'
import { Tint } from '@/components/avatar/MangaParts'
import { TRAIT_OPTIONS, type AvatarTraits } from './types'

// Render production tint masks and artwork together. Checking old independent
// shirt/trouser bounds missed the disconnected cuffs and colored waistband.
test('essentials have continuous waists and wrists, with color confined to clothing', async () => {
  const dataUrl = 'data:image/png;base64,' + (await sharp('public/avatar/manga-studio-v1/essential-bodies.webp').png().toBuffer()).toString('base64')
  async function render(shirt: AvatarTraits['shirt_style'], color: string) {
    let svg = renderToStaticMarkup(React.createElement('svg', {xmlns:'http://www.w3.org/2000/svg',width:400,height:800,viewBox:'0 0 400 800'},
      React.createElement('defs', null, React.createElement(Tint,{id:'skin',color:'#b08059'}),React.createElement(Tint,{id:'shirt',color})),
      React.createElement(MangaBaseBody,{shirt,skinFilter:'skin',shirtFilter:'shirt'})))
    svg=svg.replaceAll('/avatar/manga-studio-v1/essential-bodies.webp',dataUrl)
    return (await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({resolveWithObject:true})).data
  }
  const wrists: Record<AvatarTraits['shirt_style'], readonly [number,number,number]> = {
    tee:[112,285,425],polo:[111,286,425],hoodie:[110,289,438],striped:[115,285,435],varsity:[110,291,443],
  }
  for (const shirt of TRAIT_OPTIONS.shirt_style as AvatarTraits['shirt_style'][]) {
    const purple = await render(shirt,'#7b69c5'), red = await render(shirt,'#ce453c')
    for(let x=160;x<=240;x+=4) for(let y=392;y<=445;y+=2) {
      assert.ok(purple[(y*400+x)*4+3]>220,`${shirt}: transparent waist at ${x},${y}`)
    }
    const [left,right,top] = wrists[shirt]
    for(const x of [left,right]) for(let y=top;y<top+14;y++) {
      assert.ok(purple[(y*400+x)*4+3]>220,`${shirt}: disconnected wrist at ${x},${y}`)
    }
    for(const [x,y] of [[180,475],[225,550],[125,725]]) {
      const i=(y*400+x)*4
      assert.deepEqual(purple.subarray(i,i+4),red.subarray(i,i+4),`${shirt}: shirt tint leaks into trousers or shoes`)
    }
    const chest=(300*400+200)*4
    assert.notDeepEqual(purple.subarray(chest,chest+3),red.subarray(chest,chest+3),`${shirt}: shirt color must remain customizable`)
  }
})
