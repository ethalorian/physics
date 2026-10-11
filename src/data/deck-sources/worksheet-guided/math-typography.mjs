// Build-time typography for the two HTML deck families. Only visible text is
// transformed: geometry, animation hooks, notes and response identities stay intact.
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decode=s=>s.replace(/&(amp|lt|gt|quot|apos|#39|nbsp);/g,(_,x)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",'#39':"'",nbsp:'\u00a0'}[x]));
const subchars='₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓᵧɢ';
const subvalues='0123456789+-=()aehijklmnoprstuvxyg';
const subs=Object.fromEntries([...subchars].map((c,i)=>[c,subvalues[i]]));
const supchars='⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻';
const supers=Object.fromEntries([...supchars].map((c,i)=>[c,'0123456789+-'[i]]));
const suffixes='initial|final|average|perpendicular|translation|mechanical|projectile|reflected|incident|electrical|circular|resultant|surface|rotation|absorbed|parallel|predicted|measured|thermal|arrival|driver|driven|flight|escape|spring|before|after|total|sound|water|useful|losses|input|wheel|target|series|start|range|echo|cold|hot|peak|next|now|inward|right|left|atrest|avg|net|drive|pull|out|top|max|obs|eq|in|by|up|[xyzifgschrokedAB0123456789]';
const underscore=new RegExp('([A-Za-zΑ-ω])_('+suffixes+')(?![a-z_])','g');
const flat=new Map();
for(const [base,tails] of Object.entries({
  v:['i','f','x','y','e','r','B','avg','max','sound','escape','circular'],
  x:['i','f','A','B','initial','final','now','next'],y:['i','f','resultant'],a:['x','y','A','B','avg','c'],
  F:['g','f','s','i','x','y','A','B','net','avg','average','parallel','spring','drive','pull','peak','left','right','inward'],
  R:['x','y','eq','total','parallel','series'],A:['x','y'],B:['x','y','i','f','net'],
  E:['i','f','initial','final','in','out','input','electrical','thermal','mechanical','useful','losses'],
  K:['i','f','initial','final','avg','before','after','translation','rotation','total'],U:['i','f','g','s','initial','final'],
  W:['by','in','out','net','max'],Q:['h','c','hot','cold','absorbed'],T:['i','f','h','c','A','B','hot','cold'],
  I:['total'],V:['total'],P:['avg','input','useful'],N:['driver','driven','up','atrest'],
  p:['f','x','y','total','projectile'],d:['i','o','echo','range'],t:['arrival','flight','start','top'],
  M:['target'],rpm:['in','out','wheel'],emf:['avg'],ε:['avg'],
}))for(const tail of tails)flat.set(base+tail,base+'_{'+tail+'}');

export function normalizeNotation(value){
 return String(value)
  .replace(/aᶜ/g,'a_{c}')
  .replace(new RegExp('['+subchars+']+','g'),s=>'_{'+[...s].map(c=>subs[c]).join('')+'}')
  .replace(new RegExp('['+supchars+']+','g'),s=>'^{'+[...s].map(c=>supers[c]).join('')+'}')
  .replace(/\^\(([−-]?\d+(?:\/\d+)?)\)/g,'^{$1}')
  .replace(/([A-Za-zΑ-ω])\^([−-]?\d+)/g,'$1^{$2}')
  .replace(/(\d)\^([−-]?\d+)/g,'$1^{$2}')
  .replace(/([)\]])\^([−-]?\d+)/g,'$1^{$2}')
  .replace(underscore,(_,base,tail)=>base+'_{'+tail+'}')
  .replace(/[\p{L}]+/gu,word=>flat.get(word)??(word.match(/^([ΔδΣ])(.+)$/)&&flat.has(word.slice(1))?word[0]+flat.get(word.slice(1)):word))
  // Indexed velocities in momentum equations: the object number and state
  // belong to the same subscript, including sources that mixed Unicode and text.
  .replace(/([vm])_\{([12])\}([if])/g,'$1_{$2$3}')
  .replace(/([vm])([12])([if])?(?![\p{L}\d])/gu,(_,v,n,state)=>v+'_{'+n+(state||'')+'}')
  .replace(/(?<![\p{L}\d{])([RVIFqmvxy])([0-9])(?![\p{L}\d])/gu,'$1_{$2}')
  .replace(/([vaxyp])_\{([xy])\}([0-9if])/g,'$1_{$2$3}');
}

const words=new Set(('sin cos tan asin acos atan atan2 sqrt ln log abs exp min max π Δ δ Σ θ λ μ η τ ω α β γ ε Φ ρ Ω ∝ ∞ emf rpm COP KE PE GM IR VI BA Pt qE qV mv ma mg mgh kx mc kWh kg cm mm km nm pm ns ms μs min h Hz kHz MHz GHz N kN J kJ MJ W kW MW C μC nC V mV kV A mA Ω kΩ MΩ Pa kPa MPa K °C rad rev mL mol eV MeV').split(' '));
const single=/^[A-Za-zΑ-ω]$/;
const product=/^(?:[ΔδΣ]?[A-Za-zΑ-ω]){2,6}$/;
const products=new Set('mv ma mg mgh kx mc qE qV GM Gm GMm IR VI IV BA Pt Fd Fr Fv gt gh dt at vt vxt vyt mcv mcΔT mgΔh mΔT cΔt gΔh gΔt tδv qΔV aΔt aΔx vΔt fλ ωt ρV μN μkN μsN qvB qB BIL BLv BvL nRT PV kT hf hc AU dB ohm'.split(' '));
const tokenPattern=/[_^]\{[^{}]+\}|[\p{L}]+(?:[_^]\{[^{}]+\})*(?:\d+(?:[_^]\{[^{}]+\})*)?|(?:\d+(?:\.\d+)?|\.\d+)(?:[_^]\{[^{}]+\})*|[½¼¾√∞πΩθλμΔδΣεΦηρτ]|[^\p{L}\d½¼¾√∞_^{}]+|[_^{}]+/gu;
function isMath(token,index,tokens,svg){
 if(/[_^]\{/.test(token)||/^\d|^\.\d|^[½¼¾√∞]$/.test(token))return true;
 if(single.test(token)){
  if(!/[AaI]/.test(token))return true;
  const before=tokens.slice(0,index).join(''),after=tokens.slice(index+1).join('');
  // Leave articles and the pronoun I in prose. They are variables only in an
  // expression, an explicit quantity label, or an isolated diagram label.
  const label=token==='a'?/\b(?:acceleration|constant|solve for|solving for)\s*$/:token==='I'?/\b(?:current|Current)\s*$/:/\b(?:vector|vectors|amplitude|area|find|Find|choose|Choose|magnitude of)\s*$/;
  return /^[\s]*(?:[=+−×÷/<>≈²³_^]|\([−+\d])/.test(after)||/[=+−×÷/<>≈]\s*$/.test(before)||/\d\s*$/.test(before)||label.test(before)||svg&&tokens.length===1;
 }
 if(token==='at')return /[=+−×*/(\d]\s*$/.test(tokens.slice(0,index).join(''))||/^\s*[=+−×*/]/.test(tokens.slice(index+1).join(''));
 if(words.has(token)||products.has(token))return true;
 if(/^(?:[Fmvgr]{0,2})(?:sin|cos|tan)[θφω]$/.test(token))return true;
 if(product.test(token)&&(/^[ΔδΣ]/.test(token)||products.has(token)))return true;
 return false;
}
function notation(token,svg){
 return token.split(/([_^]\{[^{}]+\})/).filter(Boolean).map(part=>{
  const script=part.match(/^([_^])\{(.*)\}$/);
  if(script){const kind=script[1]==='_'?'sub':'sup';return svg?`<tspan baseline-shift="${kind==='sub'?'sub':'super'}" font-size="70%">${escape(script[2])}</tspan>`:`<${kind}>${escape(script[2])}</${kind}>`;}
  return escape(part);
 }).join('');
}
export function mathText(value,{svg=false}={}){
 const tokens=normalizeNotation(value).match(tokenPattern)||[];
 const math=tokens.map((t,i)=>isMath(t,i,tokens,svg));
 // Punctuation and operators inside a mathematical run use the same face;
 // prose words terminate the run, keeping explanations visually distinct.
 for(let i=0;i<tokens.length;i++)if(!math[i]&&/^[\s=+−\-×·÷/<>≈≠≤≥±^*()[\],|°%:;→√]+$/.test(tokens[i])&&math[i-1]&&math[i+1])math[i]=true;
 let result='',run='';const tag=svg?'tspan':'span';
 const flush=()=>{if(run){result+=`<${tag} class="math-quantity">${run}</${tag}>`;run='';}};
 tokens.forEach((t,i)=>{if(math[i])run+=notation(t,svg);else{flush();result+=escape(t);}});flush();return result;
}

export function formatDeckMath(html){
 // Builders supply trusted authored markup; preserve it byte-for-byte except
 // text typography. Existing semantic scripts join their adjacent math symbol.
 const prepared=html.replace(/<(sub|sup|super)>([^<>]*)<\/(?:sub|sup|super)>/g,(_,kind,s)=>(kind==='sub'?'_':'^')+'{'+decode(s)+'}');
 let svg=false,skip=0;
 return prepared.split(/(<[^>]*>)/g).map(part=>{
  if(part.startsWith('<')){
   if(/^<svg\b/.test(part))svg=true;if(/^<\/svg>/.test(part))svg=false;
   if(/^<(?:title|desc|script|style|header|footer|h[1-6])\b/.test(part))skip++;
   if(/^<\/(?:title|desc|script|style|header|footer|h[1-6])>/.test(part))skip--;
   return part;
  }
  return skip?part:mathText(decode(part),{svg});
 }).join('');
}
