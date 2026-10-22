import React, { useId } from 'react'
import type { AvatarTraits } from '@/lib/avatar/types'
import { Sprite } from './MangaParts'

// Registration is in source-cell pixels. Each essential is painted as a
// complete body, so cuffs, hands and hems are never assembled across a seam.
const FIT = {
  tee: { center:197, top:31, foot:722,
    shirt:'M0 0H362V177L279 197L279 267L279 302Q196 326 115 302L116 246L121 197L60 177Z',
    skin:'M170 25H222L227 56Q197 82 163 57ZM60 177L121 197L114 262L111 309L114 339L114 363L106 380L90 383L74 368L69 335L73 278L70 243L77 194ZM279 197L334 175L325 246L320 310L322 350L312 373L291 383L280 373L281 351L287 326L284 307L284 263Z' },
  polo: { center:178, top:27, foot:722,
    shirt:'M0 0H362V177L261 194L260 260L263 302Q177 326 94 302L98 242L102 196L39 177Z',
    skin:'M150 20H205L211 57L177 91L146 56ZM39 177L102 196L95 260L91 311L95 338L94 361L87 379L70 381L55 366L50 334L54 278L51 242L58 192ZM261 194L316 174L305 245L301 311L303 350L292 373L271 382L260 371L261 348L267 325L264 306L265 260Z' },
  hoodie: { center:162, top:22, foot:722,
    shirt:'M0 0H362V327L278 321L251 320L211 333L201 338L190 319Q164 325 134 320L130 333L78 320L59 325L43 321L0 330Z',
    skin:'M137 15H188L192 51Q161 80 130 52ZM30 330Q43 320 66 325L72 349L75 369L67 382L49 378L37 365ZM260 327Q279 322 293 333L287 366L273 382L254 381L249 370L253 348Z' },
  striped: { center:198, top:17, foot:706,
    shirt:'M0 0H362V316L291 310L283 301Q198 309 112 301L104 311L0 316Z',
    skin:'M170 8H225L227 36Q199 61 169 36ZM72 313Q90 306 105 312L111 336L116 353L112 365L102 372L86 366L77 353ZM290 311Q307 307 323 318L317 351L306 368L292 372L281 361L281 347L287 330Z' },
  varsity: { center:179, top:9, foot:707,
    shirt:'M0 0H362V322L277 316L270 308L218 319L213 301Q184 306 154 304L150 319L90 307L84 318L0 322Z',
    skin:'M155 0H204L210 37Q180 59 150 38ZM49 321Q67 313 84 319L91 343L96 359L91 371L81 378L64 371L54 359ZM270 318Q289 313 307 325L301 357L290 374L274 379L261 368L261 353L268 336Z' },
} as const

export default function MangaBaseBody({ shirt, skinFilter, shirtFilter }: {
  shirt: AvatarTraits['shirt_style']; skinFilter: string; shirtFilter: string
}) {
  const id = `body-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const fit = FIT[shirt]
  const scale = 565 / (fit.foot - fit.top)
  const art = <Sprite name={`essential-${shirt}`} rect={[0,0,362,724]} />
  return <svg className="avatar-size-native" x={200-fit.center*scale} y={186-fit.top*scale} width={362*scale} height={724*scale} viewBox="0 0 362 724" overflow="visible" data-manga-part="continuous-base-body">
    <defs>
      <clipPath id={`${id}-shirt`}><path d={fit.shirt} /></clipPath>
      <clipPath id={`${id}-skin`}><path d={fit.skin} /></clipPath>
      <linearGradient id={`${id}-neck-blend`} x1="0" x2="0" y1={fit.top} y2={fit.top+16} gradientUnits="userSpaceOnUse"><stop stopColor="black"/><stop offset="1" stopColor="white"/></linearGradient>
      <mask id={`${id}-neck-edge`} maskUnits="userSpaceOnUse" x="0" y="0" width="362" height="724" style={{maskType:'luminance'}}><rect width="362" height="724" fill="white"/><rect x={fit.center-32} width="64" height={fit.top+16} fill={`url(#${id}-neck-blend)`}/></mask>
    </defs>
    <g mask={`url(#${id}-neck-edge)`}>
    {art}
    <g clipPath={`url(#${id}-shirt)`}><g filter={`url(#${shirtFilter})`}>{art}</g></g>
    <g clipPath={`url(#${id}-skin)`}><g filter={`url(#${skinFilter})`}>{art}</g></g>
    </g>
  </svg>
}
