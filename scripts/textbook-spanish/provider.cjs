const fs=require('node:fs');
module.exports=async function translateJson(system,prompt,schema,image){
 const content=[];
 if(image)content.push({type:'input_image',image_url:'data:image/jpeg;base64,'+fs.readFileSync(image).toString('base64'),detail:'high'});
 content.push({type:'input_text',text:prompt});
 const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',signal:AbortSignal.timeout(240000),headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'content-type':'application/json'},body:JSON.stringify({model:process.env.TEXTBOOK_TRANSLATION_MODEL||'gpt-4.1-mini',instructions:system,input:[{role:'user',content}],max_output_tokens:8192,temperature:0,store:false,text:{format:{type:'json_schema',name:'textbook_translation',strict:true,schema}}})});
 const data=await response.json();
 if(!response.ok){const error=new Error(`HTTP ${response.status}: ${data.error?.message||'Translation provider error'}`);error.fatal=response.status===401||data.error?.code==='insufficient_quota';throw error;}
 if(data.status!=='completed')throw new Error(`Incomplete output: ${data.status}`);
 const raw=data.output.filter(x=>x.type==='message').flatMap(x=>x.content).filter(x=>x.type==='output_text').map(x=>x.text).join('');
 return {blocks:JSON.parse(raw),model:data.model,usage:data.usage};
};
