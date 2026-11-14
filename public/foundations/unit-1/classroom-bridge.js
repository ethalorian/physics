/* The Foundation projector speaks the same deck-stage API as the classroom tool. */
if (new URLSearchParams(location.search).get('classroom') === '1') {
  window.foundationClassroom = (() => {
    let stage, scenes=[], apply, index=0, lastLesson='opening';
    function goTo(value) {
      const next=Number.isInteger(value)&&value>=0&&value<scenes.length?value:0;
      if (stage.dataset.ready && next===index) return;
      index=next;
      if(scenes[index].section!==-2)lastLesson=scenes[index].id;
      stage.dataset.ready='true';
      apply(scenes[index]);
      history.replaceState(null,'','#'+(index+1));
      stage.dispatchEvent(new CustomEvent('slidechange',{detail:{index,total:scenes.length},bubbles:true,composed:true}));
    }
    function select(id) {
      const next=scenes.findIndex(s=>s.id===id);
      if(next<0||next===index)return;
      if(stage.hasAttribute('data-session-controlled')) {
        stage.dispatchEvent(new CustomEvent('classroomnavigate',{detail:{index:next},bubbles:true,composed:true}));
      } else goTo(next);
    }
    return {
      select,
      backToLesson:()=>select(lastLesson),
      connect(day,track,render) {
        apply=render;scenes=window.foundationClassroomScenes[day+'-'+track];
        stage=document.createElement('deck-stage');stage.hidden=true;
        for(const scene of scenes){const section=document.createElement('section');section.dataset.label=scene.label;section.dataset.speakerNotes=scene.notes;section.dataset.next=scene.next;section.dataset.prev=scene.prev;stage.append(section)}
        Object.defineProperties(stage,{index:{get:()=>index},length:{get:()=>scenes.length}});
        stage.goTo=goTo;stage.next=()=>goTo(scenes[index].next);stage.prev=()=>goTo(scenes[index].prev);
        document.body.append(stage);
        document.documentElement.classList.add('classroom-foundation');
        const initial=Number(location.hash.slice(1))-1;goTo(initial);
        function key(event){
          if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.composedPath().some(el=>el.matches?.('input,select,textarea,[contenteditable="true"]')))return;
          if(event.key===' '&&event.composedPath().some(el=>el.matches?.('button')))return;
          const next=['ArrowRight','PageDown',' '].includes(event.key)?scenes[index].next:['ArrowLeft','PageUp'].includes(event.key)?scenes[index].prev:event.key==='Home'?0:null;
          if(next===null)return;
          event.preventDefault();event.stopImmediatePropagation();select(scenes[next].id);
        }
        window.addEventListener('keydown',key);
        return ()=>{stage.remove();window.removeEventListener('keydown',key)};
      },
    };
  })();
}
