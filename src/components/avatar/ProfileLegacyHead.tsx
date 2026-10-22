import React from 'react'

/** The three compatibility masks are native SVG. Give them an actual side
 * silhouette instead of narrowing their front artwork onto a profile face. */
export default function ProfileLegacyHead({slug,skin}: {slug: string;skin:string}) {
  const bat=slug==='batman-cowl', spider=slug==='spiderman-mask'
  const color=bat?'#26313f':'#bb253f', dark=bat?'#141e29':'#801c30'
  return <g data-avatar-custom-item={slug} data-manga-part="profile-mask" stroke="#292733" strokeWidth="1.8" strokeLinejoin="round">
    <path d={`M150 158Q134 129 143 94${bat?'L146 46L164 73L182 67L199 42L205 70':'Q160 55 196 64'}Q226 64 238 84Q246 100 242 113L248 126L260 138L248 145L249 156Q252 173 234 184L211 187L214 211L183 210L187 181Z`} fill={color}/>
    <path d="M150 94Q161 130 179 156L190 181L187 210L202 211L203 179L178 140L170 84Z" fill={dark} stroke="none"/>
    {spider ? <><path d="M218 112L245 107L242 131Q227 143 218 112Z" fill="#f1f3ec" strokeWidth="2.8"/>
      <g fill="none" stroke="#451e2c" strokeWidth="1"><path d="M199 67L209 105L216 144L225 184M159 79L193 109L218 112M144 111L190 122L218 112M146 144L197 144L218 112M174 175L204 156L218 112M187 198L217 173M178 74Q176 117 163 158M199 71Q191 120 187 174M154 95Q187 87 228 88M145 124Q178 111 216 112M154 153Q181 131 211 134M184 179Q197 157 220 157"/></g></> :
      <><path d="M220 112L245 108L243 124L229 128Z" fill="#f7f1dd" strokeWidth="2"/>
        <path d="M236 146L249 145L249 156Q250 171 235 179L216 176L216 153Z" fill={skin}/>
        <path d="M235 158L247 157M234 168L241 170" fill="none" stroke="#694839" strokeWidth="1.2"/>
        {!bat&&<path d="M169 111L160 132L170 128L165 150L184 120L173 124L181 108Z" fill="#e8bd57" stroke="#805b25"/>}
      </>}
  </g>
}
