/* Worksheet practice inside the Foundation projector. */
window.createFoundationWorksheetBoard = function (React) {
  const h = React.createElement;
  const views = [
    ['split', 'Question + grid'], ['question', 'Question only'], ['grid', 'Grid only'],
  ];
  const papers = [
    ['squares', 'Square grid'], ['axes', 'Coordinate axes'], ['dots', 'Dot grid'], ['plain', 'Blank paper'],
  ];
  const ink = {Pencil: '#22233a', Orange: '#bd5122', Purple: '#66469b', Blue: '#245fa3', Green: '#287053', Red: '#b74050'};

  function picker(label, value, choices, change) {
    return h('label', {className: 'ws-field'}, label,
      h('select', {'aria-label':label, value, onChange: e => change(e.target.value)},
        choices.map(([id, name]) => h('option', {key: id, value: id}, name))));
  }

  function Paper({paper, color, lines, onStroke, onUndo}) {
    const active = React.useRef(null);
    const [draft, setDraft] = React.useState(null);
    const gridId = React.useId().replace(/[^a-zA-Z0-9_-]/g, '') + '-ws-paper';
    function position(event) {
      const matrix = event.currentTarget.getScreenCTM();
      if (!matrix) return null;
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
      return [Math.round(Math.max(0, Math.min(640, point.x))), Math.round(Math.max(0, Math.min(400, point.y)))];
    }
    function addPoint(event) {
      const stroke = active.current;
      const point = position(event);
      if (!stroke || !point) return;
      const last = stroke.points[stroke.points.length - 1];
      if (last[0] !== point[0] || last[1] !== point[1]) stroke.points.push(point);
    }
    function begin(event) {
      if (event.button !== 0 || active.current) return;
      const point = position(event);
      if (!point) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      active.current = {id: event.pointerId, color, points: [point]};
      setDraft({...active.current});
    }
    function move(event) {
      if (active.current?.id !== event.pointerId) return;
      addPoint(event);
      setDraft({...active.current});
    }
    function end(event) {
      if (active.current?.id !== event.pointerId) return;
      if (event.type === 'pointerup') addPoint(event);
      const {color: strokeColor, points} = active.current;
      active.current = null;
      setDraft(null);
      onStroke({color: strokeColor, points});
    }
    function line(stroke, key) {
      const points = stroke.points;
      return points.length === 1
        ? h('circle', {key, cx: points[0][0], cy: points[0][1], r: 2, fill: stroke.color})
        : h('polyline', {key, points: points.map(point => point.join(',')).join(' '), fill: 'none',
            stroke: stroke.color, strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round'});
    }
    const grid = paper === 'dots'
      ? h('circle', {cx: 10, cy: 10, r: 1.1, fill: '#9fa8bf'})
      : h('path', {d:'M 20 0 H 0 V 20',fill:'none',stroke:'#b8c1d5',strokeWidth:1.25});
    return h('svg', {
      className:'ws-paper', viewBox:'0 0 640 400', role:'img', 'aria-label':'Drawing paper',
      onPointerDown: begin, onPointerMove: move, onPointerUp: end, onPointerCancel: end, onLostPointerCapture: end,
      onKeyDown: e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); onUndo(); } },
      tabIndex:0,
    },
      h('defs', null, h('pattern',{id:gridId,width:20,height:20,patternUnits:'userSpaceOnUse'},grid)),
      h('rect',{width:640,height:400,fill:'white'}),
      paper !== 'plain' && h('rect',{width:640,height:400,fill:'url(#'+gridId+')'}),
      paper === 'axes' && h('g', {className:'ws-axes'},
        h('path',{d:'M12 200H629 M621 195l8 5-8 5 M320 389V11 M315 19l5-8 5 8',fill:'none',stroke:'#596680',strokeWidth:1.9}),
        h('text',{x:620,y:221},'x'),h('text',{x:332,y:21},'y'),h('text',{x:306,y:218},'0')),
      h('g', {className:'ws-ink'}, lines.map(line), draft && line(draft,'in-progress')));
  }

  return function WorksheetBoard({day, track, questionNumber, onQuestion}) {
    const questions = window.foundationWorksheetQuestions[day][track];
    const initial = questions.find(q => q.number === Number(questionNumber)) || questions[0];
    const [number,setNumber] = React.useState(initial.number);
    React.useEffect(()=>{if(questions.some(q=>q.number===Number(questionNumber)))setNumber(Number(questionNumber));},[questionNumber,questions]);
    const [view,setView] = React.useState('split');
    const [paper,setPaper] = React.useState('squares');
    const [color,setColor] = React.useState('Pencil');
    const [work,setWork] = React.useState({});
    const question = questions.find(q => q.number === number);
    const lines = work[number] || [];
    function updateLines(change) {
      setWork(old => ({...old, [number]: change(old[number] || [])}));
    }
    const undo = () => updateLines(previous => previous.slice(0,-1));
    const pdfUrl = 'https://www.antocciphysics.com/worksheets/unit-1/'+track+'/day-'+String(day).padStart(2,'0')+'.pdf';
    return h('section',{className:'worksheet-board', 'aria-label':'Worksheet workspace'},
      h('div',{className:'ws-topline'},h('h1',null,'Worksheet board'),
        h('a',{href:pdfUrl,target:'_blank',rel:'noreferrer'},'Open printed worksheet ↗')),
      h('div',{className:'ws-toolbar'},
        picker('Worksheet question',number,questions.map(q=>[q.number,'#'+q.number+' · '+q.title]),value=>onQuestion?onQuestion(Number(value)):setNumber(Number(value))),
        picker('View',view,views,setView),
        view !== 'question' && picker('Paper',paper,papers,setPaper)),
      h('div',{className:'ws-content','data-view':view},
        view !== 'grid' && h('article',{className:'ws-question'},
          h('h2',null,question.title),
          h('p',{className:'ws-prompt',dangerouslySetInnerHTML:{__html:question.prompt}}),
          question.figure && h('figure',null,
            h('div',{className:'ws-model',dangerouslySetInnerHTML:{__html:question.figure}}),
            question.caption && h('figcaption',{dangerouslySetInnerHTML:{__html:question.caption}}))),
        view !== 'question' && h('div',{className:'ws-drawing'},
          h(Paper,{key:number, paper,color:ink[color],lines,onStroke:stroke=>updateLines(previous=>[...previous,stroke]),onUndo:undo}),
          h('div',{className:'ws-tools'},picker('Pen',color,Object.keys(ink).map(name=>[name,name]),setColor),
            h('button',{type:'button',disabled:!lines.length,onClick:undo},'Undo stroke')))));
  };
};
