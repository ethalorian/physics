(() => {
'use strict';
const $=id=>document.getElementById(id), M=window.TapeMath;
const items=[['Pine offcut','wood'],['Copper pipe','copper'],['Steel flat bar','steel'],['Door trim','trim'],['Threaded rod','rod'],['Plywood strip','wood'],['Conduit','steel'],['Oak flooring sample','wood']];
let round=0,score=0,firstRead=0,firstMatch=0,q,stage='read',readMiss=0,matchMiss=0,readType='fraction';
const X=v=>70+v*110;
function feedback(text,good=false){$('feedback').textContent=text;$('feedback').className=good?'good':'';}
function extend(value){$('extension').value=value;$('clipWidth').style.width=`${value*110}px`;$('case').setAttribute('transform',`translate(${X(value)} 153)`);$('zoom').hidden=Number(value)<q.value;}
function tickHeight(i,d){if(i%d===0)return 51;if(d===10)return i%5===0?35:21;if(i%(d/2)===0)return 38;if(d>=4&&i%(d/4)===0)return 29;if(d>=8&&i%(d/8)===0)return 21;return 13;}
function renderTape(){
 let ticks='';for(let i=0;i<=7*q.d;i++){const x=X(i/q.d);ticks+=`<path d="M${x} 167v${tickHeight(i,q.d)}" stroke="#3b3522" stroke-width="${i%q.d===0?2:1}"/>`;if(i%q.d===0)ticks+=`<text x="${x+5}" y="240" fill="#302d22" font-size="19" font-weight="700">${i/q.d}</text>`;}
 $('ticks').innerHTML=ticks;
 const width=q.value*110,kind=items[round][1];let shape='';
 if(kind==='wood')shape=`<rect x="70" y="89" width="${width}" height="62" fill="url(#wood)" stroke="#d5a879"/><path d="M70 143h${width}" stroke="#68472f" stroke-width="5"/>`;
 if(kind==='copper')shape=`<rect x="70" y="100" width="${width}" height="40" rx="2" fill="#bd7851"/><path d="M70 110h${width}" stroke="#f0b286" stroke-width="8"/><ellipse cx="${X(q.value)}" cy="120" rx="5" ry="20" fill="#784b35"/>`;
 if(kind==='steel'||kind==='rod')shape=`<rect x="70" y="100" width="${width}" height="40" fill="url(#metal)" stroke="#acbec7"/>`+(kind==='rod'?Array.from({length:Math.floor(width/9)},(_,i)=>`<path d="M${74+i*9} 101l-4 38" stroke="#516d7a"/>`).join(''):'');
 if(kind==='trim')shape=`<rect x="70" y="89" width="${width}" height="62" fill="#d9ddd3"/><path d="M70 99h${width}M70 141h${width}" stroke="#8d9a95" stroke-width="5"/>`;
 $('object').innerHTML=shape;$('edge').setAttribute('d',`M${X(q.value)} 78V259`);
 let detail=`<rect x="20" y="15" width="600" height="85" rx="5" fill="#f9d46c"/>`;
 for(let i=0;i<=q.d;i++){const x=40+i*560/q.d;detail+=`<path d="M${x} 15v${tickHeight(i,q.d)}" stroke="#3b3522" stroke-width="2"/>`;if(i===0||i===q.d)detail+=`<text x="${x}" y="89" text-anchor="middle" fill="#302d22" font-size="18">${q.whole+i/q.d}</text>`;}
 detail+=`<path d="M${40+q.n*560/q.d} 0v70" stroke="#af442e" stroke-width="3"/><path d="M${34+q.n*560/q.d} 1h12l-6 10z" fill="#af442e"/>`;
 $('detail').innerHTML=detail;
}
function load(){
 q=M.question(Number($('precision').value),round);stage='read';readMiss=0;matchMiss=0;
 const format=$('format').value;readType=format==='mixed'?(round%2?'decimal':'fraction'):format;
 $('round').textContent=`OBJECT ${round+1} / 8`;$('progress').style.width=`${round/8*100}%`;$('score').textContent=`${score} pts`;
 $('objectName').textContent=items[round][0];$('divisionLabel').textContent=`${q.d===10?'0.1':`1/${q.d}`} INCH DIVISIONS`;
 $('stepLabel').textContent='01 / READ THE TAPE';$('prompt').textContent=`How long is the ${items[round][0].toLowerCase()}?`;
 $('answerHint').textContent=`Give your reading as ${readType==='decimal'?'a decimal':'a fraction or mixed number'}. Each inch has ${q.d} equal spaces.`;
 $('answer').placeholder=readType==='decimal'?'e.g. 3.5':'e.g. 3 1/2';$('answer').value='';$('answerForm').hidden=false;$('choices').innerHTML='';$('explanation').hidden=true;$('next').hidden=true;feedback('');renderTape();extend(0);
 $('extension').disabled=false;$('extend').disabled=false;$('retract').disabled=false;
}
function reset(){round=score=firstRead=firstMatch=0;load();}
function bar(n,d){return `<div class="fraction-row"><span>${n}/${d}</span><div class="bar" aria-label="${n} of ${d} equal parts shaded">${Array.from({length:d},(_,i)=>`<i class="${i<n?'filled':''}"></i>`).join('')}</div></div>`;}
function explain(){
 const g=M.gcd(q.n,q.d),sn=q.n/g,sd=q.d/g;
 $('explanation').innerHTML=`<div class="equation">${q.n}/${q.d} = ${M.fraction(q.n,q.d)} = ${q.n/q.d}</div><p>These bars each show <strong>one inch</strong>. The shaded length is the same, even when we group the pieces differently.</p>${bar(q.n,q.d)}${g>1?bar(sn,sd):bar(q.n*2,q.d*2)}<p>${g>1?`Divide both the numerator and denominator by ${g}: ${q.n} ÷ ${g} = ${sn}, and ${q.d} ÷ ${g} = ${sd}.`:`Split every piece in two: ${q.n}/${q.d} = ${q.n*2}/${q.d*2}. The length does not change.`} To write a decimal, divide ${q.n} by ${q.d}.</p><strong>Whole measurement: ${q.whole} + ${M.fraction(q.n,q.d)} = ${M.mixed(q.ticks,q.d)} in = ${q.value} in.</strong>`;
 $('explanation').hidden=false;
}
function match(){
 stage='match';$('answerForm').hidden=true;$('stepLabel').textContent='02 / SAME LENGTH, DIFFERENT NAME';
 // Alternate equivalent fractions and decimals to practice both representations.
 const fractionMatch=round%2===0;
 const target=fractionMatch?M.fraction(q.n,q.d):String(q.n/q.d);
 $('prompt').textContent=`The extra part is ${q.n}/${q.d} of an inch. What is equal to it?`;
 $('answerHint').textContent=fractionMatch?'Choose the fraction in simplest form. The whole inches stay the same.':'Choose the decimal for just the part after the whole inches.';
 const options=new Set([target]);
 if(fractionMatch){for(const v of [M.fraction(q.n+1,q.d),M.fraction(q.n,q.d+2),M.fraction(q.n+2,q.d)]){if(options.size<3)options.add(v);}}
 else for(const v of [String((q.n+1)/q.d),String(q.n/(q.d*2)),String((q.n+2)/q.d)]){if(options.size<3)options.add(v);}
 const shuffled=[...options];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
 $('choices').innerHTML='';for(const value of shuffled){const b=document.createElement('button');b.textContent=value;b.addEventListener('click',()=>{
   if(stage!=='match'||b.disabled)return;
   if(value!==target){matchMiss++;b.disabled=true;feedback('Try again. Equivalent numbers name the same length. Divide the top and bottom by the same number, or divide the top by the bottom for a decimal.');return;}
   stage='review';if(matchMiss===0){score+=5;firstMatch++;}$('score').textContent=`${score} pts`;
   [...$('choices').children].forEach(c=>c.disabled=true);feedback('Yes — same length, different ways to write it.',true);explain();$('next').textContent=round===7?'See workshop results →':'Next object →';$('next').hidden=false;
 });$('choices').appendChild(b);}
}
$('answerForm').addEventListener('submit',event=>{
 event.preventDefault();if(stage!=='read')return;
 if(Number($('extension').value)<q.value){feedback('Extend the tape past the object first so you can read its far edge.');return;}
 const raw=$('answer').value.trim(),value=M.parse(raw);
 if(!Number.isFinite(value)){feedback('Enter a number like 3.5, 3 1/2, or 7/2. A fraction needs a nonzero denominator.');return;}
 if(readType==='decimal'&&raw.includes('/')){feedback('That is fraction notation. For this round, divide to write the reading as a decimal.');return;}
 if(readType==='fraction'&&!raw.includes('/')){feedback('For this round, write a fraction or mixed number using /, such as 3 1/2.');return;}
 if(Math.abs(value-q.value)>0.000001){readMiss++;feedback(readMiss>1?`Start at ${q.whole} whole inches, then count ${q.n} spaces of 1/${q.d} inch. Add that fraction to the whole inches.`:'Not quite. Find the last whole inch before the edge, then count the small spaces. Use the magnified inch below the tape.');return;}
 if(readMiss===0){score+=10;firstRead++;}$('score').textContent=`${score} pts`;feedback(`Correct: ${M.mixed(q.ticks,q.d)} inches = ${q.value} inches.`,true);match();
});
$('next').addEventListener('click',()=>{
 if(stage!=='review')return;
 if(round<7){round++;load();$('extend').focus();return;}
 stage='done';$('progress').style.width='100%';$('stepLabel').textContent='SET COMPLETE';$('prompt').textContent='Ready for the next cut.';
 $('answerHint').textContent=`${score} / 120 points · ${firstRead}/8 readings and ${firstMatch}/8 matches correct on the first try.`;
 $('choices').innerHTML='';$('explanation').hidden=true;$('next').hidden=true;feedback('You measured eight objects. Choose New set to practice another tape precision.',true);
});
$('extension').addEventListener('input',e=>extend(e.target.value));$('extend').addEventListener('click',()=>extend(7));$('retract').addEventListener('click',()=>extend(0));
// Drag the case directly with a mouse, pen, or touch; the range is the keyboard alternative.
let dragging=false,dragOffset=0;
$('case').style.cursor='ew-resize';$('case').style.touchAction='none';
function sceneX(event){const bounds=$('scene').getBoundingClientRect();return (event.clientX-bounds.left)*960/bounds.width;}
$('case').addEventListener('pointerdown',event=>{dragging=true;dragOffset=sceneX(event)-X(Number($('extension').value));$('case').setPointerCapture(event.pointerId);});
$('case').addEventListener('pointermove',event=>{if(dragging)extend(Math.max(0,Math.min(7,(sceneX(event)-dragOffset-70)/110)));});
for(const name of ['pointerup','pointercancel','lostpointercapture'])$('case').addEventListener(name,()=>{dragging=false;});
$('precision').addEventListener('change',reset);$('format').addEventListener('change',reset);$('restart').addEventListener('click',reset);reset();
})();
