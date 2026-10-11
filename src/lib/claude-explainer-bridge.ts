import type { ClaudeSnapshot, ClaudeValue } from './claude-explainer'

interface Logic { state:Record<string,ClaudeValue>; props:Record<string,unknown>; setState:(state:Record<string,ClaudeValue>)=>void; renderVals:()=>Record<string,unknown>; playAlg?:()=>void; stopAlg?:()=>void; _di?:number }
interface ClaudeWindow extends Window { __dcRootName?:()=>string; __dcRegistry?:Record<string,{Logic:{new(props:Record<string,unknown>):Logic;prototype:Logic};subs:Set<()=>void>}> }
interface Position {frame:number;claude?:ClaudeSnapshot}
/** Adapter for the pinned, unchanged dc-runtime. No source template, CSS, or author logic is rewritten. */
export function connectClaudeFrame(frame:HTMLIFrameElement,options:{read:()=>Position;writable:()=>boolean;emit:(value:Position)=>Promise<boolean|void>;ready:()=>void;applied:()=>void;link:(href:string)=>void}) {
 const win=frame.contentWindow as ClaudeWindow|null,doc=frame.contentDocument
 if(!win||!doc)return ()=>{}
 let logic:Logic|undefined,defaults:Record<string,ClaudeValue>|undefined,restore:(()=>void)|undefined
 let applied='',lastValues='',emitted='',driver=false,lastSend=0,wasVisible=true,ignoreScrollUntil=0,disposed=false
 let inputVersion=0,localInput=false,sending=false
 const stable=(value:unknown)=>JSON.stringify(value,(_key,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v)
 const sent=new Set<string>(),clone=<T,>(x:T):T=>JSON.parse(JSON.stringify(x))
 const sections=()=>Array.from(doc.querySelectorAll<HTMLElement>('[data-screen-label]'))
 const position=():Position=>{
  const all=sections(),y=win.scrollY+Math.max(50,doc.querySelector('nav')?.getBoundingClientRect().height??0)+4
  let index=0;all.forEach((el,i)=>{if(el.offsetTop<=y)index=i})
  const el=all[index],offset=el?Math.max(0,Math.min(1,(y-el.offsetTop)/Math.max(1,el.offsetHeight))):0
  return {frame:index,claude:{values:clone(logic!.state),offset}}
 }
 const apply=(next:Position,changeValues:boolean)=>{
  if(!logic||!defaults)return
  const values=clone(next.claude?.values??defaults)
  if(changeValues){
  if(values.algPlaying&&!logic.state.algPlaying)logic.playAlg?.()
  if(!values.algPlaying&&logic.state.algPlaying)logic.stopAlg?.()
  if(values.dPlaying&&!logic.state.dPlaying){const play=logic.renderVals().playDossier;if(typeof play==='function')play()}
  if(!values.dPlaying&&logic.state.dPlaying)win.clearInterval(logic._di)
  logic.setState(values)
  }
  const all=sections(),el=all[Math.max(0,Math.min(all.length-1,next.frame))]
  if(el){const nav=doc.querySelector('nav')?.getBoundingClientRect().height??0;ignoreScrollUntil=Date.now()+300;win.scrollTo({top:Math.max(0,el.offsetTop+(next.claude?.offset??0)*el.offsetHeight-nav-4),behavior:'instant'})}
  if(changeValues)emitted=stable(position())
 }
 // Keep a fresh click until its command is accepted; a late animation sample from
 // the other screen must not undo it. Background samples never retry after handoff.
 const takeControl=(e:Event)=>{if(e.isTrusted&&options.writable()){driver=true;localInput=true;inputVersion++;lastSend=0}}
 const anchor=(e:MouseEvent)=>{const el=(e.target as Element)?.closest('a');if(!el)return;const href=el.getAttribute('href');if(!href)return;if(!href.startsWith('#')){e.preventDefault();options.link(new URL(href,win.location.href).pathname)}else if(options.writable())driver=true}
 for(const name of ['pointerdown','keydown','wheel','touchstart','input','change'])doc.addEventListener(name,takeControl,{capture:true,passive:true})
 doc.addEventListener('click',anchor,true)
 const tick=()=>{
  if(disposed)return
  if(!restore){const entry=win.__dcRegistry?.[win.__dcRootName?.()??''];if(!entry?.Logic)return
   const proto=entry.Logic.prototype,original=proto.renderVals
   const capture=(value:Logic)=>{logic=value}
   proto.renderVals=function(){capture(this);return original.call(this)}
   restore=()=>{proto.renderVals=original}
   entry.subs.forEach(notify=>notify())
   return
  }
  if(!logic)return
  if(!defaults){const entry=win.__dcRegistry![win.__dcRootName!()];defaults=clone(new entry.Logic(logic.props).state);options.ready()}
  const visible=frame.getClientRects().length>0
  if(visible&&!wasVisible)applied=''
  if(!visible||!options.writable()){driver=false;localInput=false}
  wasVisible=visible
  const next=options.read(),key=stable(next)
  if(key!==applied&&(!localInput||sent.has(key))){const valuesKey=stable(next.claude?.values??null),changeValues=valuesKey!==lastValues;applied=key;lastValues=valuesKey;if(sent.has(key))sent.delete(key);else{if(changeValues)driver=false;apply(next,changeValues)}options.applied()}
  if(!visible||!options.writable()||!driver||sending||Date.now()<ignoreScrollUntil)return
  const value=position(),valueKey=stable(value)
  if((localInput||valueKey!==emitted)&&Date.now()-lastSend>=650){
   const version=inputVersion;sending=true;lastSend=Date.now();sent.add(valueKey);if(sent.size>30)sent.delete(sent.values().next().value!)
   void options.emit(value).then(ok=>{if(disposed)return;if(ok===false){sent.delete(valueKey)}else{emitted=valueKey;if(version===inputVersion)localInput=false}}).catch(()=>{sent.delete(valueKey)}).finally(()=>{sending=false})
  }
 }
 const timer=window.setInterval(tick,100)
 return ()=>{disposed=true;window.clearInterval(timer);restore?.();for(const name of ['pointerdown','keydown','wheel','touchstart','input','change'])doc.removeEventListener(name,takeControl,true);doc.removeEventListener('click',anchor,true)}
}
