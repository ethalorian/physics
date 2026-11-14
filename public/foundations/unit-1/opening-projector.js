/* Uses the same React instance and drawing surface as the A–E projector. */
window.createFoundationOpening = function (React, BinderFigure) {
  const h = React.createElement;
  const modes = [
    { id: 'draw', label: 'Draw along', symbol: 'draw' },
    { id: 'demo', label: 'Show what happens', symbol: 'demo' },
    { id: 'claim', label: 'Test a claim', symbol: 'claim' },
  ];
  const iconPaths = {
    draw: ['M5 26l2-8L23 2l6 6-16 16Z', 'M8 18l5 6M20 6l6 6'],
    demo: ['M3 24h26M5 18h4v6H5zM14 13h4v11h-4zM23 6h4v18h-4z'],
    claim: ['M4 4h24v17H13l-8 7v-7H4Z', 'M9 10h14M9 15h8'],
  };
  function icon(name) {
    return h('svg', {viewBox:'0 0 32 32', 'aria-hidden':true, focusable:false},
      ...iconPaths[name].map(d => h('path',{key:d,d,fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinejoin:'round'})));
  }
  function button(label, action, attrs = {}) {
    return h('button', {type:'button', onClick:action, ...attrs}, label);
  }
  function tag(text) { return h('div', {className:'opening-tag'}, text); }
  function result(text) { return h('p', {className:'opening-result',role:'status'}, text); }

  function CartRelease({step}) {
    const right = step === 0;
    const arrow = (x,y,length,color,label) => h('g',null,
      h('path',{d:'M'+x+' '+y+'h'+length, stroke:color,strokeWidth:5}),
      h('path',{d:'M'+(x+length)+' '+y+'l'+(-Math.sign(length)*9)+' -6v12z',fill:color}),
      h('text',{x:x+length/2,y:y-11,textAnchor:'middle',fill:color,fontSize:14},label));
    return h('svg',{className:'cart-release',viewBox:'0 0 420 132',role:'img','aria-label':right?'Cart rolling right with equal opposing horizontal forces':'Cart still rolling right with friction to the left'},
      h('path',{d:'M20 106h380',stroke:'#8e899e',strokeWidth:2}),
      h('rect',{x:174,y:67,width:72,height:25,rx:4,fill:'#dcd9f3',stroke:'#28273e',strokeWidth:2}),
      ...[188,231].map(x=>h('circle',{key:x,cx:x,cy:98,r:7,fill:'#28273e'})),
      arrow(171,80,-67,'#ad4c20','friction'), right && arrow(249,80,67,'#ad4c20','pull'),
      arrow(181,40,step===2?40:72,'#594394','velocity'));
  }

  function Draw({binder, prompt}) {
    const [mark,setMark]=React.useState(0);
    const [strokes,setStrokes]=React.useState([]);
    const [pen,setPen]=React.useState('orange');
    const cues=binder.markCues || binder.Ckeys;
    const pens={orange:'#d96829',purple:'#7944b2',blue:'#4065a0',green:'#278454',yellow:'#e6ac20',red:'#bf3549',pencil:'#344250'};
    return h(React.Fragment,null,
      h('p',{className:'opening-ask'},prompt),
      h('div',{className:'opening-plate paper'},h(BinderFigure,{d:binder,shown:mark,strokes,setStrokes,color:pens[pen]})),
      h('div',{className:'opening-tools'},
        h('label',null,'Pen ',h('select',{value:pen,onChange:e=>setPen(e.target.value)},Object.keys(pens).map(p=>h('option',{key:p,value:p},p)))),
        button('Undo ink',()=>setStrokes(strokes.slice(0,-1)),{disabled:!strokes.length}),
        button('Previous mark',()=>setMark(mark-1),{disabled:mark===0}),
        button(binder.figure?'Reveal next mark':'Next drawing cue',()=>setMark(mark+1),{disabled:mark===cues.length})),
      h('p',{className:'opening-cue','aria-live':'polite'},mark<cues.length?cues[mark]:'Point to the last mark you made. What does it tell us?'));
  }
  function Demo({entry,day}) {
    const [step,setStep]=React.useState(0);
    return h(React.Fragment,null,
      h('p',{className:'opening-ask'},entry.ask),
      day===9 && h(CartRelease,{step}),
      h('ol',{className:'opening-evidence','aria-label':'Demonstration observations','aria-live':'polite'},
        entry.observations.map((text,i)=>h('li',{key:i,className:i>step?'pending':''},
          h('small',null,'0'+(i+1)),i<=step?text:'Predict what comes next'))),
      h('div',{className:'opening-tools'},
        button('Back one observation',()=>setStep(step-1),{disabled:step===0}),
        button('Reveal next observation',()=>setStep(step+1),{disabled:step===2})),
      step===2 && result(entry.explain));
  }
  function Claim({entry}) {
    const [shown,setShown]=React.useState(false);
    return h(React.Fragment,null,
      h('blockquote',{className:'opening-quote'},entry.quote),
      h('p',{className:'opening-ask'},entry.ask),
      button(shown?'Hide the explanation':'Show my explanation',()=>setShown(!shown),{'aria-expanded':shown}),
      shown && result(entry.explain));
  }

  return function Opening({day,track,binder,continueLesson,teacher}) {
    const lesson=window.foundationOpeningLessons[day];
    const [mode,setMode]=React.useState(null);
    const [checking,setChecking]=React.useState(false);
    const [answer,setAnswer]=React.useState(false);
    const heading=React.useRef(null);
    const controlsUsed=React.useRef(false);
    React.useEffect(()=>{
      if(controlsUsed.current) heading.current?.focus({preventScroll:true});
    },[mode,checking]);
    function choose(next) {
      controlsUsed.current=true;
      setMode(next); setChecking(false); setAnswer(false);
    }
    function check(next) {
      controlsUsed.current=true;
      setChecking(next); setAnswer(false);
    }
    React.useEffect(()=>{
      function key(e) {
        if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||e.target?.matches('input,select,textarea')||!mode)return;
        if(e.key==='ArrowRight'){e.preventDefault();if(checking)continueLesson();else check(true);}
        if(e.key==='ArrowLeft'){e.preventDefault();if(checking)check(false);else choose(null);}
      }
      window.addEventListener('keydown',key);
      return ()=>window.removeEventListener('keydown',key);
    },[mode,checking,continueLesson]);
    const entry=mode && lesson[mode];
    const title=checking?'Your turn':entry?entry.title:'Choose your opening';
    const focusWord=binder.words.find(word=>word.term===binder.focus);
    return h('section',{className:'foundation-opening','aria-label':'Lesson opening'},
      tag(checking?'Individual check · 2 minutes':entry?modes.find(item=>item.id===mode).label+' · teacher model':'Direct instruction · about 10 minutes'),
      h('h1',{ref:heading,tabIndex:-1},title),
      !entry && h(React.Fragment,null,
        h('p',{className:'opening-target'},lesson.target[track]),
        h('p',{className:'opening-criteria'},h('strong',null,'Success today  '),lesson.criteria),
        h('div',{className:'opening-choices'},modes.map(item=>
          button(h(React.Fragment,null,icon(item.symbol),h('small',null,item.label),h('strong',null,lesson[item.id].title)),
            ()=>choose(item.id),{key:item.id,'data-opening':item.id}))),
        h('p',{className:'opening-binder'},'Open your notes and reading. We’ll use one of these openings together.')),
      entry && h('div',{hidden:checking},
        mode==='draw'?h(Draw,{binder,prompt:lesson.draw.ask}):mode==='demo'?h(Demo,{entry,day}):h(Claim,{entry}),
        h('div',{className:'opening-actions'},button('Choose another opening',()=>choose(null)),button('Individual check →',()=>check(true),{className:'primary'}))),
      checking && h(React.Fragment,null,
        h('p',{className:'opening-ask'},lesson.check[track].ask),
        h('p',{className:'opening-binder'},'Use the drawing space on your doodle page. Add the mark or calculation and explain it in your own words.'),
        button(answer?'Hide the reasoning':'Reveal after students respond',()=>setAnswer(!answer),{'aria-expanded':answer}),
        answer && result(lesson.check[track].answer),
        h('div',{className:'opening-actions'},button('Back to my opening',()=>check(false)),button('Continue to Section B →',continueLesson,{className:'primary'}))),
      teacher && h('aside',{className:'teacher opening-notes'},
        h('b',null,'Teaching notes'),
        h('p',null,'Read the target aloud. Introduce '+binder.focus+(focusWord?' — '+focusWord.definition:'.')+' Model one opening, then give everyone a minute to answer the individual check before revealing the reasoning.'),
        h('p',null,'Use Section B for the doodle, C for the figure and D for a worked example. Open Section A during practice for any of the four printed Frayer models. Save Section E for the final meeting.'),
        h('p',null,track==='honors'?'Honors: ask students to justify a sign, assumption or piece of evidence. You can assign one selected Frayer response for homework.':'CPA / MVP: rehearse an explanation aloud, then record one sentence in class. Revisit one Frayer box if the check shows a word needs work.')));
  };
};
