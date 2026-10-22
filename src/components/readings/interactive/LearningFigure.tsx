'use client'
import type {ReactNode} from 'react'
import styles from './connected-chapters.module.css'
export function Figure({id,title,caption,children}:{id:string;title:string;caption:string;children:ReactNode}){return <figure id={id} className={styles.figure}><p className={styles.kicker}>PREDICT · CHANGE · EXPLAIN</p><h3>{title}</h3>{children}<figcaption>{caption}</figcaption></figure>}
export function Slider({label,value,set,min=0,max,step=1,unit=''}:{label:string;value:number;set:(n:number)=>void;min?:number;max:number;step?:number|'any';unit?:string}){return <label className={styles.control}>{label}<strong>{Number(value.toFixed(3))} {unit}</strong><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e=>set(+e.target.value)}/></label>}
export function Choices({label,items,value,set}:{label:string;items:readonly string[];value:number;set:(n:number)=>void}){return <div className={styles.switches} role="group" aria-label={label}>{items.map((s,i)=><button key={s} type="button" aria-pressed={value===i} onClick={()=>set(i)}>{s}</button>)}</div>}
export function Result({children}:{children:ReactNode}){return <p className={styles.result} aria-live="polite">{children}</p>}
export {styles}
