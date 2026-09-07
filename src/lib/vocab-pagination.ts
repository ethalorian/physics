/** Avoid Supabase's default row cap silently truncating class evidence. */
export async function vocabRows<T>(page:(from:number,to:number)=>PromiseLike<{data:T[]|null;error:unknown}>):Promise<T[]>{
 const rows:T[]=[]
 for(let from=0;from<100000;from+=500){const {data,error}=await page(from,from+499);if(error)throw error;rows.push(...(data??[]));if(!data||data.length<500)return rows}
 throw new Error('Too much vocabulary evidence; narrow the report')
}
