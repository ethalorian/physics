/* Section E: a shared visual, a team decision, then a teacher-revealed update. */
window.createFoundationTransfer = function (React) {
  const h = React.createElement;
  const Visual = window.createFoundationTransferVisual(React);
  const titles = ['One more exposure','Send the rover home','Is it really slowing down?','Where does the camera finish?','How wide should we search?','Send the whole movement','Choose the speed alert','Catch the next shot','One camera. Which window?','Who is doing the pushing?','Same push. Different mass.','Which run changes more?','Moving left. Pushed right.','Two pulls. Two receivers.','Build the force overlay','One pull, two components','Cut from the table to space','Stopped or coasting?','Stop the faulty graphic','Can we release a forecast?','Two reports. One sighting.','Would you air this headline?'];
  const challenges = ['Which dot did we measure, and which did we predict?','Does that number tell the driver how far to travel or where to finish?','Where is the evidence that the speed changed?','Did you count the return trip with the right sign?','Does a wider band tell us the chance of impact?','Does your arrow show both parts of the movement?','Which arrow shows the larger speed?','What does your shaded area measure?','What has to stay the same for our camera choice to work?','Who causes each force you kept?','Which things stayed the same in the two tests?','Do those arrows show net force or just motor pull?','Can motion and acceleration point in opposite directions?','Which object receives each force?','Does every arrow act on the object inside your boundary?','Are you counting one pull twice?','Which surfaces are touching?','Does zero net force mean zero speed?','Did the calculation include both forces?','What can we calculate, and what is still missing?','Are the two stations using the same zero?','What do the bands actually tell us?'];
  function icon(kind) {
    return h('svg',{viewBox:'0 0 32 32','aria-hidden':true},h('path',{d:kind===0?'M5 25L25 5M4 19l9 9M18 4l10 10M6 4h8v8H6zM20 20h8v8h-8z':'M12 5a4 4 0 018 0v10a4 4 0 01-8 0ZM8 13v2a8 8 0 0016 0v-2M16 23v6M10 29h12',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'}));
  }
  // Keep authored values prominent without interpreting student writing.
  function prose(value) {
    return String(value).split(/([+−–-]?\d+(?:\.\d+)?(?:–\d+)?(?:\s?(?:km\/s²|km\/s|m\/s²|m\/s|km|kg|min|N|s))?)/g).map((part,i)=>/^[-+−–]?\d/.test(part)?h('strong',{key:i},part):part);
  }
  return function Transfer({day,track,binder,assignment,honorsCopy}) {
    const [phase,setPhase]=React.useState(0), [job,setJob]=React.useState(0), [windowChoice,setWindowChoice]=React.useState(null);
    const special=day===9&&track==='honors';
    const jobs=[assignment[1],assignment[3]];
    const task=special?(job===0?honorsCopy.engineer:honorsCopy.broadcaster):assignment[job===0?2:4];
    const update=special?honorsCopy.report+' '+honorsCopy.update:assignment[5];
    const discussion=assignment[6];
    const phases=['Plan your call','New evidence','Compare & explain'];
    return h('section',{className:'transfer-studio','data-phase':phase,'aria-label':'Section E team transfer'},
      h('div',{className:'transfer-heading'},h('div',null,h('div',{className:'transfer-kicker'},'2026-XJ / TEAM BRIEFING '+String(day).padStart(2,'0')),h('h2',null,titles[day-1])),h('span',{className:'transfer-pair-tag'},'2 people · 1 shared call')),
      h('p',{className:'transfer-case'},prose(assignment[0])),
      h('div',{className:'transfer-layout'},
        h('div',{className:'transfer-evidence'},
          h('div',{className:'transfer-feed'},h('span',null,phase===0?'OBSERVATION DESK':phase===1?'INCOMING UPDATE':'DISCUSSION OVERLAY'),h('span',null,phase===0?'Inspect → decide':phase===1?'Notice → revise':'Point → explain')),
          h(Visual,{day,phase,choice:windowChoice}),
          day===9&&phase===0&&h('div',{className:'transfer-camera-vote','aria-label':'Team camera choice'},h('span',null,'Mark a team’s call:'),['A · +4 km','B · +6 km','C · +8 km'].map((label,i)=>h('button',{type:'button',key:label,'aria-pressed':windowChoice===i,onClick:()=>setWindowChoice(i)},label))),
          h('div',{className:'transfer-visual-caption'},phase===0?'Use your Section E drawing space. Mark the part of this graphic that supports your call.':phase===1?'Keep your first drawing. Add the new information in a second color.':'Compare your drawing with this one. Explain any change you made.')),
        h('div',{className:'transfer-brief'},
          h('div',{className:'transfer-jobs','aria-label':'Choose a team job'},jobs.map((label,i)=>h('button',{type:'button',key:label,'aria-pressed':job===i,onClick:()=>setJob(i)},icon(i),h('span',null,label)))),
          h('div',{className:'transfer-task','aria-live':'polite'},
            h('div',{className:'transfer-kicker'},phase===0?'YOUR ASSIGNMENT':phase===1?'THE DESK NEEDS AN UPDATE':'WHAT A SOUND CALL INCLUDES'),
            h('p',null,prose(phase===0?task:phase===1?update:discussion)),
            phase===1&&special&&h('p',{className:'transfer-honors'},honorsCopy.model)),
          phase<2?h('div',{className:'transfer-talk'},h('b',null,phase===0?'Before you go on air':'Switch who speaks'),h('p',null,phase===0?'Each partner points to one clue. Compare your ideas, then agree on the drawing and the call.':'The new speaker gives the correction. The other partner points to the detail that changed it.'),h('blockquote',null,phase===0?challenges[day-1]:'“What changed in our answer—and what stayed the same?”')):
            h('div',{className:'transfer-talk'},h('b',null,'Hear from both partners'),h('p',null,'One person explains the original call. The other explains the correction. Point to your drawing as you speak.')))),
      h('div',{className:'transfer-controls'},h('nav',{'aria-label':'Transfer stages'},phases.map((label,i)=>h('button',{key:label,type:'button','aria-current':phase===i?'step':undefined,onClick:()=>setPhase(i)},h('span',null,'0'+(i+1)),label))),
        phase<2?h('button',{type:'button',className:'primary',onClick:()=>setPhase(phase+1)},phase===0?'Teams have called · reveal update →':'Teams have revised · compare →'):h('button',{type:'button',onClick:()=>{setPhase(0);setWindowChoice(null)}},'Reset this briefing')),
      h('details',{className:'transfer-source'},h('summary',null,'Section E reading'+(binder.brief?' + connected Transfer Brief':'')),h('p',null,binder.E),special&&h('p',null,h('b',null,'Honors discussion: '),honorsCopy.listen),track==='honors'&&binder.honors&&h('p',null,binder.honors),binder.brief&&h('p',null,h('b',null,binder.brief[0]+' · '+binder.brief[1]),' ',binder.brief[2],' ',binder.brief[3]&&h('a',{href:'https://www.antocciphysics.com/interactive-assignments/'+binder.brief[3],target:'_blank',rel:'noreferrer'},'Open Transfer Brief ↗'))));
  };
};
