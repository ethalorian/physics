// Synchronous slide importers share this implementation with the ESM renderer.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const rules = require('./assignment-emphasis-rules.json');

// Consume the boundary on browsers without regexp lookbehind, but never bold it.
const boundaries=[
 [String.raw`(?<![\w.Α-ω])`,String.raw`(^|[^\w.Α-ω])`],
 [String.raw`(?:^|(?<=[.!?;:]\s)|(?<=\n)|(?<=\) )|(?<=and )|(?<=then )|(?<=to ))`,String.raw`(^|[.!?;:]\s|\n|\) |and |then |to )`],
 ['(?<=then )','(then )'],
];
const patterns=rules.patterns.map(({source,flags})=>{
 const boundary=boundaries.find(([prefix])=>source.startsWith(prefix));
 return {regex:new RegExp(boundary?boundary[1]+source.slice(boundary[0].length):source,flags),prefix:!!boundary};
});
const protectedMarkup=new RegExp(rules.protectedMarkup,'gi');
const directionPattern=new RegExp(rules.directionPattern,'gi');
const directionProtectedMarkup=new RegExp(rules.directionProtectedMarkup,'gi');

/** Compass words in prose, including compound directions; unit symbols are excluded.
 * @param {string} text
 * @returns {{text:string,direction:boolean}[]}
 */
function directionRuns(text){
 const result=[];let at=0;directionPattern.lastIndex=0;
 for(const m of text.matchAll(directionPattern)){
  if(m.index>at)result.push({text:text.slice(at,m.index),direction:false});
  result.push({text:m[0],direction:true});at=m.index+m[0].length;
 }
 if(at<text.length)result.push({text:text.slice(at),direction:false});
 return result;
}

function decorateDirections(text){
 const decorate=s=>directionRuns(s).map(r=>r.direction?`<i><u>${r.text}</u></i>`:r.text).join('');
 let at=0,out='';directionProtectedMarkup.lastIndex=0;
 for(const m of text.matchAll(directionProtectedMarkup)){out+=decorate(text.slice(at,m.index))+m[0];at=m.index+m[0].length;}
 return out+decorate(text.slice(at));
}

/** Shared print/deck/online convention. Returns original text with presentation spans only.
 * @param {string} text
 * @returns {{text:string,bold:boolean}[]}
 */
function emphasisRuns(text){
 const ranges=[];
 for(const {regex,prefix} of patterns){
  regex.lastIndex=0;
  for(const match of text.matchAll(regex)){
   const start=match.index+(prefix?match[1].length:0),end=match.index+match[0].length;
   // Ordered-list labels are navigation, not quantities in the problem.
   if(/^\d+$/.test(text.slice(start,end))&&/(?:^|\n)\s*$/.test(text.slice(0,start))&&/^[.)]\s/.test(text.slice(end)))continue;
   ranges.push([start,end]);
  }
 }
 ranges.sort((a,b)=>a[0]-b[0]||b[1]-a[1]);
 const merged=[];
 for(const range of ranges){const last=merged[merged.length-1];if(last&&range[0]<=last[1])last[1]=Math.max(last[1],range[1]);else merged.push([...range]);}
 const runs=[];let at=0;
 for(const[start,end]of merged){if(start>at)runs.push({text:text.slice(at,start),bold:false});runs.push({text:text.slice(start,end),bold:true});at=end;}
 if(at<text.length)runs.push({text:text.slice(at),bold:false});
 return runs;
}

/** For trusted, already-authored print/deck prose; protect math, links and existing emphasis.
 * @param {string} text
 */
function emphasizeMarkup(text){
 let at=0,out='';protectedMarkup.lastIndex=0;
 const decorate=s=>emphasisRuns(s).map(r=>r.bold?`<b>${r.text}</b>`:r.text).join('');
 for(const m of text.matchAll(protectedMarkup)){out+=decorate(text.slice(at,m.index))+m[0];at=m.index+m[0].length;}
 return decorateDirections(out+decorate(text.slice(at)));
}

module.exports={directionRuns,emphasisRuns,emphasizeMarkup};
