/** Bound stalled requests; callers retain draft text and reuse idempotent save IDs. */
export async function foundationRequest(input:RequestInfo|URL,init:RequestInit={},timeoutMs=20000){
 const controller=new AbortController(),abort=()=>controller.abort()
 if(init.signal?.aborted)controller.abort();else init.signal?.addEventListener('abort',abort,{once:true})
 const timer=setTimeout(abort,timeoutMs)
 try{const response=await fetch(input,{...init,signal:controller.signal});const body=await response.text();return new Response(response.status===204?null:body,{status:response.status,statusText:response.statusText,headers:response.headers})}
 catch(e){if(controller.signal.aborted)throw Error('The connection took too long. Your text is still on this page. Try saving again.');throw e}
 finally{clearTimeout(timer);init.signal?.removeEventListener('abort',abort)}
}
