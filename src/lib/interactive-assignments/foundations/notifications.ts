'use client'
import {createClient} from '@supabase/supabase-js'

/** Notifications carry no student data. Fetch through the authorized API after a hint.
 * Coalesce bursts, suspend background work, and fall back to a one-minute check only
 * when disconnected. Never reload the lesson, slideshow, or unsaved text. */
export function watchFoundation(realtime:{url:string;key:string;topic:string}|null|undefined,refresh:()=>Promise<boolean>){
 let stopped=false,connected=false,pending=false,queued=false,last=0
 let timer:ReturnType<typeof setTimeout>|undefined
 const run=async()=>{
  if(stopped||document.visibilityState==='hidden')return
  if(pending){queued=true;return}
  const delay=2000-(Date.now()-last)
  if(delay>0){clearTimeout(timer);timer=setTimeout(()=>void run(),delay);return}
  pending=true;last=Date.now()
  try{await refresh()}finally{pending=false;if(queued){queued=false;void run()}}
 }
 const client=realtime?createClient(realtime.url,realtime.key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null
 if(client&&realtime)client.channel(realtime.topic).on('broadcast',{event:'change'},()=>void run()).subscribe(status=>{
  connected=status==='SUBSCRIBED'
  if(connected)void run()
 })
 const fallback=setInterval(()=>{if(!connected)void run()},60000)
 const returned=()=>{if(document.visibilityState!=='hidden')void run()}
 document.addEventListener('visibilitychange',returned);window.addEventListener('focus',returned);window.addEventListener('online',returned)
 return()=>{stopped=true;clearTimeout(timer);clearInterval(fallback);document.removeEventListener('visibilitychange',returned);window.removeEventListener('focus',returned);window.removeEventListener('online',returned);void client?.removeAllChannels()}
}
