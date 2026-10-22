import type {ReactNode} from 'react'
import s from './scenes.module.css'

export const ink={cyan:'#6de6e0',amber:'#ffc777',rose:'#ff8d9e',blue:'#80b8ff',white:'#eaf5fa',dim:'#6e94aa'}
export function SceneDefs({id}:{id:string}){return <defs>
 <linearGradient id={`${id}-space`} x2=".8" y2="1"><stop stopColor="#060c1d"/><stop offset=".6" stopColor="#102940"/><stop offset="1" stopColor="#19485a"/></linearGradient>
 <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor="#102a43"/><stop offset="1" stopColor="#437887"/></linearGradient>
 <linearGradient id={`${id}-metal`} x2=".9" y2="1"><stop stopColor="#f3fbff"/><stop offset=".45" stopColor="#b5d1df"/><stop offset="1" stopColor="#527b93"/></linearGradient>
 <linearGradient id={`${id}-visor`} x2=".8" y2="1"><stop stopColor="#f7db9f"/><stop offset=".3" stopColor="#b7843d"/><stop offset=".55" stopColor="#594430"/><stop offset="1" stopColor="#18293c"/></linearGradient>
 <linearGradient id={`${id}-water`} x2="0" y2="1"><stop stopColor="#153e60"/><stop offset=".5" stopColor="#21647c"/><stop offset="1" stopColor="#16415a"/></linearGradient>
 <linearGradient id={`${id}-glass`}><stop stopColor="#86d7ee" stopOpacity=".22"/><stop offset=".25" stopColor="#bdefff" stopOpacity=".03"/><stop offset=".8" stopColor="#bdefff" stopOpacity=".05"/><stop offset="1" stopColor="#86d7ee" stopOpacity=".2"/></linearGradient>
 <radialGradient id={`${id}-planet`} cx=".3" cy=".2"><stop stopColor="#5fb7cc"/><stop offset=".45" stopColor="#215d85"/><stop offset="1" stopColor="#06182e"/></radialGradient>
 <radialGradient id={`${id}-ball`} cx=".3" cy=".25"><stop stopColor="#ddfff8"/><stop offset=".3" stopColor={ink.cyan}/><stop offset="1" stopColor="#17758b"/></radialGradient>
 <radialGradient id={`${id}-rock`} cx=".25" cy=".2"><stop stopColor="#b9a58c"/><stop offset=".6" stopColor="#796e65"/><stop offset="1" stopColor="#2b3545"/></radialGradient>
 <linearGradient id={`${id}-flame`}><stop stopColor="#7dc4ff" stopOpacity="0"/><stop offset=".55" stopColor="#7dc4ff" stopOpacity=".8"/><stop offset="1" stopColor="#fff6c7"/></linearGradient>
 <pattern id={`${id}-grid`} width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#87b7ce" strokeOpacity=".09"/></pattern>
 <pattern id={`${id}-rough`} width="12" height="8" patternUnits="userSpaceOnUse"><path d="M0 8L5 3L9 7L12 4" fill="none" stroke="#bc9c72" strokeOpacity=".45"/></pattern>
 {Object.entries(ink).map(([name,color])=><marker key={name} id={`${id}-${name}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill={color}/></marker>)}
</defs>}

export function Arrow({id,x,y,dx,dy=0,color='cyan',label,dashed=false}:{id:string;x:number;y:number;dx:number;dy?:number;color?:keyof typeof ink;label?:string;dashed?:boolean}){
 if(Math.hypot(dx,dy)<.5)return null
 const end=x+dx,endY=y+dy
 return <g><line x1={x} y1={y} x2={end} y2={endY} stroke={ink[color]} strokeWidth="3" strokeLinecap="round" strokeDasharray={dashed?'5 5':undefined} markerEnd={`url(#${id}-${color})`}/>{label&&<text x={(x+end)/2} y={Math.min(y,endY)-10} textAnchor="middle" className={s.label} style={{fill:ink[color]}}>{label}</text>}</g>
}
export function Badge({x,y,children,tone='cyan',width=142}:{x:number;y:number;children:ReactNode;tone?:keyof typeof ink;width?:number}){return <g transform={`translate(${x},${y})`}><rect width={width} height="28" rx="14" fill="#071725" stroke={ink[tone]} strokeOpacity=".35"/><circle cx="13" cy="14" r="3" fill={ink[tone]}/><text x="24" y="18" className={s.small} style={{fill:ink[tone]}}>{children}</text></g>}
export function Stars(){return <g>{Array.from({length:64},(_,i)=><circle key={i} cx={(i*167+31)%760} cy={(i*i*37+23)%330} r={i%11===0?1.7:.7} fill="#d5ecff" opacity={.15+(i%5)*.1}/>)}<path d="M632 94h12m-6-6v12M86 143h8m-4-4v8" stroke="#addef2" opacity=".6"/></g>}
export function Space({id,earth=false}:{id:string;earth?:boolean}){return <g><rect width="760" height="420" fill={`url(#${id}-space)`}/><Stars/>{earth&&<g opacity=".65"><ellipse cx="470" cy="730" rx="630" ry="391" fill={`url(#${id}-planet)`} stroke="#84dce9" strokeWidth="2"/><path d="M12 420Q300 302 750 391" fill="none" stroke="#83c8d3" strokeWidth="14" opacity=".1"/><path d="M272 365Q340 350 391 368T520 367" fill="none" stroke="#b9e8d6" strokeWidth="8" opacity=".15"/></g>}</g>}
export function Landscape({id,ground=304}:{id:string;ground?:number}){return <g><rect width="760" height="420" fill={`url(#${id}-sky)`}/><circle cx="626" cy="100" r="30" fill="#e5e6bb" opacity=".17"/><path d={`M0 ${ground-30}L90 ${ground-85}L178 ${ground-38}L280 ${ground-110}L390 ${ground-42}L470 ${ground-70}L610 ${ground-28}L760 ${ground-84}V420H0Z`} fill="#23485b"/><path d={`M0 ${ground-12}Q140 ${ground-67} 280 ${ground-16}T560 ${ground-21}T760 ${ground-32}V420H0Z`} fill="#244c56"/><path d={`M0 ${ground}Q150 ${ground-11} 310 ${ground}T760 ${ground}V420H0Z`} fill="#183943"/><path d={`M0 ${ground}H760`} stroke="#6c9a92" strokeWidth="2"/></g>}

export function Astronaut({id,thrust=0}:{id:string;thrust?:number}){return <g>
 {Math.abs(thrust)>.001&&<g transform={thrust<0?'scale(-1 1)':undefined} data-visual="thruster-exhaust"><path d={`M-38 -7Q-${60+Math.abs(thrust)} -30 -${74+Math.abs(thrust)} -5Q-${58+Math.abs(thrust)} 17 -38 9Z`} fill={`url(#${id}-flame)`}/><path d="M-38 -4L-74 -1L-38 5Z" fill="#f3f5cc" opacity=".85"/></g>}
 <rect x="-32" y="-43" width="59" height="66" rx="11" fill="#47677e" stroke="#9ac1d4" strokeWidth="2"/>
 <path d="M-32 -30h-9v38h9M27 -30h9v38h-9" fill="#7999ab" stroke="#244257" strokeWidth="3"/>
 <path d="M-15 13L-21 47L-32 64M12 14L20 43L31 56" stroke="#29495e" strokeWidth="20" strokeLinecap="round" fill="none"/>
 <path d="M-15 13L-21 47L-32 64M12 14L20 43L31 56" stroke={`url(#${id}-metal)`} strokeWidth="15" strokeLinecap="round" fill="none"/>
 <path d="M-22 40l11 4M12 38l11-5" stroke="#6197b3" strokeWidth="4"/>
 <path d="M-37 64l14 4M26 57l14 2" stroke="#66869a" strokeWidth="13" strokeLinecap="round"/>
 <path d="M-17 -35L-32 -19L-43 -32M17 -34L32 -14L45 -19" fill="none" stroke="#34566b" strokeWidth="19" strokeLinecap="round"/>
 <path d="M-17 -35L-32 -19L-43 -32M17 -34L32 -14L45 -19" fill="none" stroke={`url(#${id}-metal)`} strokeWidth="13" strokeLinecap="round"/>
 <path d="M-44 -32l-5-7M45 -19l7-3" stroke="#d0e0e5" strokeWidth="12" strokeLinecap="round"/>
 <path d="M-21 -42Q0 -49 21 -42L23 14Q0 25 -23 14Z" fill={`url(#${id}-metal)`} stroke="#b5d4e2" strokeWidth="1.5"/>
 <path d="M-21 7H22" stroke="#577f95" strokeWidth="7"/><rect x="-8" y="3" width="15" height="8" rx="2" fill="#c7dce5"/>
 <rect x="-14" y="-30" width="28" height="25" rx="4" fill="#203e55" stroke="#668ea4"/>
 <rect x="-9" y="-24" width="17" height="7" rx="1" fill="#70c8d1"/><circle cx="-7" cy="-10" r="2" fill="#ffb95c"/><circle cx="1" cy="-10" r="2" fill="#72e1d3"/>
 <path d="M-18 -7C-41 -2 -34 22 -22 23" stroke="#c3a56b" strokeWidth="3" fill="none"/>
 <ellipse cy="-50" rx="21" ry="8" fill="#5f8397"/><ellipse cy="-66" rx="25" ry="27" fill={`url(#${id}-metal)`} stroke="#d5e5eb" strokeWidth="2"/>
 <path d="M-20 -72Q0 -88 20 -72L18 -55Q0 -42 -18 -55Z" fill={`url(#${id}-visor)`} stroke="#395167" strokeWidth="2"/>
 <path d="M-14 -72Q-4 -79 4 -77" fill="none" stroke="#fff5d4" strokeWidth="3" strokeLinecap="round" opacity=".8"/>
 <rect x="-28" y="-70" width="6" height="15" rx="3" fill="#738e9e"/><rect x="22" y="-70" width="6" height="15" rx="3" fill="#738e9e"/>
 </g>}
export function Cart({id,color=ink.cyan,mass,car=false}:{id:string;color?:string;mass?:number;car?:boolean}){return <g>
 <ellipse cy="5" rx="38" ry="6" fill="#020d17" opacity=".45"/>
 {car?<><path d="M-38 -14L-32 -28L-12 -32L-3 -48H19L31 -29L43 -23V-9H-38Z" fill={color} stroke="#0a293d" strokeWidth="2"/><path d="M2 -44H16L24 -30H-7Z" fill="#12354c"/><path d="M4 -43v12" stroke="#a4e5e4"/><rect x="-34" y="-22" width="10" height="4" rx="2" fill="#ecfdff"/><rect x="34" y="-20" width="6" height="5" rx="2" fill="#ffdb92"/></>:<><rect x="-35" y="-28" width="70" height="22" rx="5" fill={color} stroke="#0c344a" strokeWidth="2"/><path d="M-31 -25H31" stroke="#fff" opacity=".5"/><rect x="-28" y="-9" width="56" height="5" rx="2" fill="#4e758a"/>{mass&&<><rect x="-22" y="-45" width="44" height="18" rx="3" fill={`url(#${id}-metal)`}/><text y="-32" textAnchor="middle" fontSize="10" fontWeight="700" fill="#173548">{mass} kg</text></>}</>}
 {[-23,23].map(x=><g key={x} transform={`translate(${x},-5)`}><circle r="10" fill="#081622" stroke="#618292" strokeWidth="2"/><circle r="5" fill={`url(#${id}-metal)`}/><circle r="2" fill="#274356"/></g>)}
 </g>}
export function Crate({mass}:{mass?:number}){return <g><rect x="-29" y="-57" width="58" height="57" rx="3" fill="#ac7b4f" stroke="#ebba7c" strokeWidth="2"/><path d="M-23 -50H23V-7H-23ZM-22 -48L22 -9M22 -48L-22 -9" stroke="#624736" strokeWidth="5" fill="none"/><path d="M-23 -50H23M-23 -7H23M-22 -48L22 -9" stroke="#dcaa6c" strokeWidth="2"/>{[-23,23].flatMap(x=>[-50,-7].map(y=><circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill="#403e3b"/>))}{mass&&<><rect x="-18" y="-35" width="36" height="17" rx="2" fill="#f0d8ad"/><text y="-23" textAnchor="middle" fill="#4b3829" fontSize="11" fontWeight="600">{mass} kg</text></>}</g>}
export function Walker({phase=0,moving=false}:{phase?:number;moving?:boolean}){const stride=moving?Math.sin(phase)*12:3;return <g>
 <ellipse cy="3" rx="18" ry="4" fill="#041521" opacity=".4"/>
 <path d={`M-4 -31L${-5-stride} -16L${-4-stride} -2M5 -31L${6+stride} -16L${7+stride} -2`} stroke="#193044" strokeWidth="9" fill="none" strokeLinecap="round"/><path d={`M${-5-stride} -1h-9M${7+stride} -1h9`} stroke="#e0eaf0" strokeWidth="6" strokeLinecap="round"/>
 <path d={`M-9 -52L${-17+stride*.4} -35M10 -52L${18-stride*.4} -35`} stroke="#edbe94" strokeWidth="7" strokeLinecap="round"/>
 <path d="M-10 -58Q0 -64 10 -58L13 -31H-12Z" fill="#f3ad67"/><path d="M-11 -54l-4 12M10 -54l4 12" stroke="#df9653" strokeWidth="9"/>
 <rect x="-3" y="-65" width="7" height="9" fill="#c89773"/><ellipse cy="-73" rx="10" ry="12" fill="#edbe94"/><path d="M-10 -75Q-12 -87 1 -87Q11 -87 10 -73L3 -78L-7 -77Z" fill="#273849"/><rect x="-15" y="-55" width="8" height="24" rx="4" fill="#49778b"/>
 </g>}
export function Boat({id}:{id:string}){return <g><path d="M0 -38Q28 -7 19 29Q0 43 -19 29Q-28 -7 0 -38Z" fill="#081e31" opacity=".35" transform="translate(4 5)"/><path d="M0 -38Q28 -7 19 29Q0 43 -19 29Q-28 -7 0 -38Z" fill="#e7f2ed" stroke="#a5c9cd" strokeWidth="2"/><path d="M0 -30Q18 -8 13 23Q0 33 -13 23Q-18 -8 0 -30Z" fill="#b89768"/><path d="M-12 1H12M-11 14H11" stroke="#765f49" strokeWidth="2"/><rect x="-10" y="-17" width="20" height="23" rx="5" fill={`url(#${id}-metal)`}/><path d="M-8 -14H8V-5H-8Z" fill="#173d54"/><rect x="-6" y="28" width="12" height="12" rx="3" fill="#1d3446"/><path d="M-4 36H4" stroke={ink.cyan} strokeWidth="2"/></g>}
export function Earth({id}:{id:string}){return <g><circle r="28" fill="#4cbcd5" opacity=".1"/><circle r="23" fill={`url(#${id}-planet)`} stroke="#86dbec" strokeWidth=".8"/><path d="M-15 -15L-8 -18L-3 -10L-8 -4L-4 2L-10 8L-10 15L-16 9L-17 -1L-21 -5ZM1 -14L14 -12L19 -6L10 -2L5 5L-1 -2Z" fill="#79a999" opacity=".7"/><path d="M-20 -10Q-2 -20 14 -9M-9 13Q5 19 17 6" fill="none" stroke="#d1f5f1" strokeWidth="3" opacity=".35"/></g>}
export function Asteroid({id}:{id:string}){return <g><path d="M-20 -6L-13 -21L5 -26L20 -13L25 4L14 21L-6 25L-22 10Z" fill={`url(#${id}-rock)`} stroke="#a3a49d" strokeWidth="1"/><ellipse cx="-7" cy="-8" rx="7" ry="5" fill="#4b4d50"/><path d="M-13 -10Q-6 -16 1 -9" stroke="#c4b9a1" fill="none" opacity=".6"/><circle cx="10" cy="7" r="5" fill="#444951"/><path d="M-13 6L-4 9L-1 19M8 -18L14 -10" stroke="#665f58" fill="none" strokeWidth="2"/></g>}
