// Text-only teaching copy. Source locations preserve runtime, controls, layout and art.
const p5=require('parse5');
const changes=require('./slide-language.json');
const {emphasizeMarkup,directionRuns}=require('../../src/lib/assignment-emphasis.cjs');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
module.exports=html=>{
 const edits=[];
 function walk(node,inSlide=false,skip=false,bold=false,underlined=false,inSvg=false){
  inSlide ||= node.tagName==='section';
  if(node.tagName==='section'){
   const title=node.attrs.find(a=>a.name==='data-label');const loc=node.sourceCodeLocation?.attrs?.['data-label'];
   if(title&&loc&&changes[title.value])edits.push([loc.startOffset,loc.endOffset,'data-label="'+escape(changes[title.value]).replaceAll('"','&quot;')+'"']);
  }
  if(inSlide)for(const name of ['alt','aria-label']){const a=node.attrs?.find(a=>a.name===name),loc=node.sourceCodeLocation?.attrs?.[name];if(a&&loc&&changes[a.value])edits.push([loc.startOffset,loc.endOffset,name+'="'+escape(changes[a.value]).replaceAll('"','&quot;')+'"']);}
  inSvg ||= node.tagName==='svg';
  skip ||= ['script','style','button','code','pre','math','sub','sup'].includes(node.tagName);
  bold ||= ['b','strong'].includes(node.tagName);underlined ||= node.tagName==='u';
  if(inSlide&&!skip&&(!inSvg||node.parentNode?.tagName==='title')&&node.nodeName==='#text'&&!/\{\{|\$|\\\(|\\\[/.test(node.value)){
   const old=node.value,trim=old.replace(/\s+/g,' ').trim(),loc=node.sourceCodeLocation;
   if(trim&&loc){
    const replacement=changes[trim];let text=replacement?old.replace(old.trim(),replacement):old;
    text=escape(text);
    // Existing emphasis remains effective; do not stack redundant <b> or <u>.
    const formatted=(underlined||inSvg)?text:bold?directionRuns(text).map(r=>r.direction?`<i><u>${r.text}</u></i>`:r.text).join(''):emphasizeMarkup(text);
    if(formatted!==html.slice(loc.startOffset,loc.endOffset))edits.push([loc.startOffset,loc.endOffset,formatted]);
   }
  }
  for(const child of node.childNodes||[])walk(child,inSlide,skip,bold,underlined,inSvg);
 }
 walk(p5.parse(html,{sourceCodeLocationInfo:true}));
 for(const [a,b,text]of edits.sort((a,b)=>b[0]-a[0]))html=html.slice(0,a)+text+html.slice(b);
 return html;
};
// The accessible companion keeps paragraphs and emphasis, and never exposes reveals.
module.exports.companion=node=>{
 function text(n){
  if(n.nodeName==='#text')return n.value.replace(/\{\{[^}]+\}\}/g,'').replace(/\s+/g,' ');
  if(['button','script','style','image','footer'].includes(n.tagName))return '';
  if(n.tagName==='sc-if'&&n.attrs.some(a=>/q\dOpen/.test(a.value)))return '';
  if(n.tagName==='img')return n.attrs.find(a=>a.name==='alt')?.value||'';
  const style=n.attrs?.find(a=>a.name==='style')?.value||'';
  // Separate visual cards/labels in the linear companion, including adjacent spans.
  const separator=/display\s*:\s*flex/.test(style)?(/flex-direction\s*:\s*column/.test(style)?'\n\n':' '):'';
  const content=(n.childNodes||[]).map(text).join(separator);
  if(['b','strong'].includes(n.tagName))return content.trim()?`**${content.trim()}**`:content;
  if(['p','div','li','h1','h2','h3','section','svg'].includes(n.tagName))return '\n\n'+content.trim()+'\n\n';
  return content;
 }
 return text(node).replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();
};
