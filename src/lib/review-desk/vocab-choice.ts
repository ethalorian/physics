type Item = {word?:{id?:string;term?:string;definition?:string};options?:{id:string;label:string}[]}
export function vocabChoiceEvidence(items:Item[],result:{term_id:string;response:string;correct?:boolean}){
 const item=items.find(i=>i.word?.id===result.term_id)
 if(!item?.options?.length)return null
 const label=item.options.find(o=>o.id===result.response)?.label
 return {prompt:item.word?.definition??'Choose the matching term.',response:label??'Saved choice unavailable',guide:label?`Vocabulary recognition: the student selected a term; no written explanation was requested. Expected term: ${item.word?.term??'unavailable'}. Recorded result: ${result.correct===true?'correct':result.correct===false?'incorrect':'not scored'}.`:'The recorded choice could not be resolved. Do not infer a response.'}
}
