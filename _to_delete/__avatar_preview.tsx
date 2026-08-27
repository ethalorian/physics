import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Avatar from './src/components/avatar/Avatar'
import { TRAIT_OPTIONS } from './src/lib/avatar/types'
const styles = TRAIT_OPTIONS.hair_style
const colors = TRAIT_OPTIONS.hair_color
const shirts = TRAIT_OPTIONS.shirt_color
const faces = ['round','egg','square','heart']
let html = '<html><body style="background:#f4f2fb;font-family:sans-serif;padding:16px">'
html += '<h3>Hair styles × face shapes (brown hair, tan skin)</h3><div style="display:flex;flex-wrap:wrap;gap:6px">'
for (const hs of styles) for (const f of faces) {
  html += `<div style="text-align:center;font-size:10px;background:#fff;border-radius:8px;padding:4px">${renderToStaticMarkup(<Avatar traits={{hair_style: hs as any, face: f as any, hair_color:'brown'}} size={84} crop="medium" />)}<br/>${hs}/${f}</div>`
}
html += '</div><h3>Thumbnail test: 40px head crop, all styles</h3><div style="display:flex;flex-wrap:wrap;gap:4px">'
for (const hs of styles) html += `<div style="text-align:center;font-size:9px">${renderToStaticMarkup(<Avatar traits={{hair_style: hs as any, hair_color:'black', skin:'light'}} size={40} crop="head" />)}<br/>${hs}</div>`
html += '</div><h3>Hair colours (long) + shirt colours</h3><div style="display:flex;flex-wrap:wrap;gap:4px">'
for (const hc of colors) html += `<div style="text-align:center;font-size:9px">${renderToStaticMarkup(<Avatar traits={{hair_style:'long', hair_color: hc as any}} size={60} crop="head" />)}<br/>${hc}</div>`
html += '</div><div style="display:flex;flex-wrap:wrap;gap:4px">'
for (const sc of shirts) html += `<div style="text-align:center;font-size:9px">${renderToStaticMarkup(<Avatar traits={{shirt_color: sc as any}} size={60} crop="medium" />)}<br/>${sc}</div>`
html += '</div></body></html>'
process.stdout.write(html)
