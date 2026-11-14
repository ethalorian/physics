(()=>{'use strict';
const $=(s,e=document)=>e.querySelector(s),$$=(s,e=document)=>[...e.querySelectorAll(s)];
const slides=$$('.slide'),stage=$('deck-stage'),shell=$('.stage-shell');if(!stage||!slides.length)return;
let current=-1;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const controlled=()=>stage.hasAttribute('data-session-controlled');
function notes(){const s=slides[current];$('#guideText').innerHTML=`<p>PROBLEM ${s.dataset.question||'OVERVIEW'} · STEP ${current+1} OF ${slides.length}</p><h2>${escape(s.dataset.title)}</h2><pre>${escape(s.dataset.speakerNotes||'')}</pre>`;}
function resize(){document.body.classList.toggle('session-controlled',controlled());if(controlled()){$('#teacherGuide').close();}stage.style.transform=`scale(${Math.min(shell.clientWidth/1600,shell.clientHeight/900)})`;}
function show(n){const target=Math.max(0,Math.min(slides.length-1,n));if(target===current)return;current=target;slides.forEach((s,i)=>{s.classList.toggle('active',i===current);s.setAttribute('aria-hidden',i===current?'false':'true')});const s=slides[current];$('#count').textContent=`${current+1} / ${slides.length}`;$('#prev').disabled=current===0;$('#next').disabled=current===slides.length-1;const option=$$('#problem option').find(o=>s.dataset.question&&slides[+o.value]?.dataset.question===s.dataset.question);$('#problem').value=option?.value||'0';$('#reveal').disabled=!s.dataset.question||s.dataset.solution==='true';$('#returnPrompt').disabled=!s.dataset.question||current===+s.dataset.promptSlide;$('#next').textContent=slides[current+1]?.dataset.solution==='true'&&s.dataset.solution!=='true'?'Reveal reasoning →':'Next step →';history.replaceState(null,'','#'+(current+1));notes();stage.dispatchEvent(new CustomEvent('slidechange',{bubbles:true,composed:true,detail:{index:current,total:slides.length}}));}
function navigate(n){if(!Number.isInteger(n))return;const index=Math.max(0,Math.min(slides.length-1,n));if(controlled())stage.dispatchEvent(new CustomEvent('classroomnavigate',{bubbles:true,detail:{index}}));else show(index);}
Object.defineProperties(stage,{index:{get:()=>current},length:{get:()=>slides.length}});stage.goTo=n=>{if(Number.isInteger(n)&&n>=0&&n<slides.length)show(n)};stage.next=()=>navigate(current+1);stage.prev=()=>navigate(current-1);
$('#prev').onclick=()=>navigate(current-1);$('#next').onclick=()=>navigate(current+1);$('#reset').onclick=()=>navigate(0);$('#problem').onchange=e=>navigate(+e.target.value);$('#nextProblem').onclick=()=>navigate($$('#problem option').map(o=>+o.value).find(n=>n>current)??slides.length-1);$('#reveal').onclick=()=>navigate(+slides[current].dataset.solutionSlide);$('#returnPrompt').onclick=()=>navigate(+slides[current].dataset.promptSlide);$('#notes').onclick=()=>{notes();$('.more').open=false;$('#teacherGuide').showModal()};$('#closeNotes').onclick=()=>$('#teacherGuide').close();
// Keep the countdown available while navigating between worksheet problems.
const oldTimer = $('#timer');
const clockControl = document.createElement('classroom-timer');
const timerScript = document.createElement('script');
timerScript.src = '/decks/classroom/classroom-timer.js';
timerScript.onload = () => {
  oldTimer.closest('details').before(clockControl);
  oldTimer.remove();
};
document.head.append(timerScript);
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen?.();}catch{/* Full-screen permission is optional. */}};
document.addEventListener('keydown',e=>{if(controlled()||$('#teacherGuide').open||['INPUT','SELECT','TEXTAREA','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();navigate(current+1)}if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();navigate(current-1)}if(e.key==='Home'){e.preventDefault();navigate(0)}if(e.key==='End'){e.preventDefault();navigate(slides.length-1)}});
new MutationObserver(resize).observe(stage,{attributes:true,attributeFilter:['data-session-controlled']});window.addEventListener('resize',resize);window.addEventListener('hashchange',()=>{if(!controlled())show((parseInt(location.hash.slice(1))||1)-1)});
window.deckAPI={show,get current(){return current},count:slides.length};resize();show((parseInt(location.hash.slice(1))||1)-1);
})();
