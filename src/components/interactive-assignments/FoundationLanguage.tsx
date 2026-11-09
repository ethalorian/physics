'use client'

import supportLanguages from '@/data/foundations/cpa-support-languages.json'
import {CPA_LANGUAGE} from '@/lib/interactive-assignments/foundations/cpa-language'
import {createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode} from 'react'
import type {FoundationKey} from '@/lib/interactive-assignments/foundations/checkpoints'
import index from '@/data/foundations/language-index.json'
import {FOUNDATION_CHROME, type FoundationLocale} from '@/lib/interactive-assignments/foundations/language'
import s from './Foundation.module.css'

type Dictionary = Record<string,string>
type LanguageContext = {foundation?:true; foundationKey?:FoundationKey; edition?:'cpa'|'honors';locale:FoundationLocale; map:Dictionary; t:(text:string)=>string}
const empty:Dictionary={}
const identity=(text:string)=>text
const Context=createContext<LanguageContext>({locale:'en',map:empty,t:identity})
const cache=new Map<string,Dictionary>() // Authored text only; never stores responses.
const preference='physics.foundation-language.v1'
export const useFoundationLanguage=()=>useContext(Context)

export default function FoundationLanguage({foundation,edition,cpa=false,children}:{foundation?:FoundationKey;edition?:'cpa'|'honors';cpa?:boolean;children:ReactNode}){
 return foundation?<LessonLanguage foundation={foundation} edition={edition ?? (cpa ? 'cpa' : 'honors')} cpa={cpa}>{children}</LessonLanguage>:<>{children}</>
}
function LessonLanguage({foundation,edition,cpa,children}:{foundation:FoundationKey;edition:'cpa'|'honors';cpa:boolean;children:ReactNode}){
 const [selected,setSelected]=useState<FoundationLocale>('en')
 const [loaded,setLoaded]=useState<{key:string;map:Dictionary}|null>(null)
 const [error,setError]=useState(false),[retry,setRetry]=useState(0)
 const version=index[foundation].version,key=`${foundation}:${selected}:${version}`
 const map=selected==='en'?empty:cache.get(key)??(loaded?.key===key?loaded.map:empty)
 const ready=selected==='en'||map!==empty,locale=ready?selected:'en'
 useEffect(()=>{try{const saved=localStorage.getItem(preference);if(saved==='es'||saved==='pt-BR')setSelected(saved)}catch{/* Language still works without browser storage. */}},[])
 useEffect(()=>{
  setError(false)
  if(selected==='en'||cache.has(key))return
  const controller=new AbortController(),timeout=window.setTimeout(()=>controller.abort(),20000)
  let current=true
  void fetch(`/foundations/languages/${foundation}.${selected}.json?v=${version}`,{signal:controller.signal})
   .then(async response=>{if(!response.ok)throw Error('Language file unavailable');return response.json()})
   .then(data=>{
    if(!data||data.version!==version||data.locale!==selected||!data.map||Array.isArray(data.map)||Object.keys(data.map).length!==index[foundation].count||Object.entries(data.map).some(([source,value])=>!source||typeof value!=='string'||!value.trim()||value.length>30000))throw Error('Language file needs an update')
    if(current){cache.set(key,data.map);setLoaded({key,map:data.map})}
   }).catch(()=>{if(current)setError(true)}).finally(()=>window.clearTimeout(timeout))
  return()=>{current=false;window.clearTimeout(timeout);controller.abort()}
 },[foundation,key,selected,version,retry])
 const t=useCallback((text:string)=>locale==='en'?text:(cpa?(supportLanguages[locale] as Dictionary)[text]:undefined)??CPA_LANGUAGE[locale][text]??FOUNDATION_CHROME[locale][text]??map[text]??text,[locale,map,cpa])
 const value=useMemo(()=>({foundation:true as const,foundationKey:foundation,edition,locale,map,t}),[foundation,edition,locale,map,t])
 function choose(next:FoundationLocale){setSelected(next);try{localStorage.setItem(preference,next)}catch{/* Optional preference only. */}}
 const notice=selected==='es'?{loading:'Cargando español… Tu trabajo sigue aquí.',error:'No se pudo cargar español. El texto sigue en inglés. Tu trabajo sigue aquí.',retry:'Intentar de nuevo'}:selected==='pt-BR'?{loading:'Carregando português… Seu trabalho continua aqui.',error:'Não foi possível carregar português. O texto continua em inglês. Seu trabalho continua aqui.',retry:'Tentar novamente'}:{loading:'Loading language… Your work stays here.',error:'The language could not load. English is still available. Your work stays here.',retry:'Try again'}
 return <Context.Provider value={value}><div lang={locale} className={s.languageScope}>
  <div className={s.languageBar}>
   <label htmlFor="foundation-language">Language / Idioma<select id="foundation-language" aria-label="Language / Idioma" value={selected} onChange={event=>choose(event.target.value as FoundationLocale)} translate="no"><option value="en">English</option><option value="es" lang="es">Español</option><option value="pt-BR" lang="pt-BR">Português (Brasil)</option></select></label>
   <p>{t('Choose a language for the slides and questions. Your answers stay as you wrote them.')}</p>
   {locale!=='en'&&<p>{locale==='es'?'Usa un punto para los decimales (0.5). Las comas separan miles (8,500).':'Use ponto nos decimais (0.5). As vírgulas separam milhares (8,500).'}</p>}
   {!ready&&<p role={error?'alert':'status'} lang={selected}>{error?notice.error:notice.loading} {error&&<button type="button" onClick={()=>setRetry(n=>n+1)}>{notice.retry}</button>}</p>}
  </div>{children}
 </div></Context.Provider>
}
