(function (root) {
  'use strict';
  // Thirty-seconds are integers, including the midpoint of a sixteenth.
  const UNIT = 32;
  const benches = { length:'Center a length', face:'Center a face', marks:'Between two marks' };
  const raw = [
    ['l1','length','A rail in two equal parts','Carpentry','Pine rail',18,3,0,18],
    ['l2','length','The halfway cut','Plumbing','Copper tube',15,1,0,15],
    ['l3','length','Split the conduit length','Electrical','Metal conduit',9.5,1,0,9.5],
    ['l4','length','Halve a mixed number','Carpentry','Hardwood strip',13.75,2,0,13.75],
    ['f1','face','A centered mounting hole','Electrical','Rectangular mounting plate',12,8,0,12],
    ['f2','face','The center of a panel','Carpentry','Plywood panel',9.5,5.5,0,9.5],
    ['f3','face','Locate the pipe opening','Plumbing','Rectangular layout template',7.25,4.75,0,7.25],
    ['f4','face','A precise center punch','Electrical','Metal plate',5.125,3.375,0,5.125],
    ['m1','marks','Center between layout lines','Carpentry','Marked board',24,3,3,19],
    ['m2','marks','Halfway between tube marks','Plumbing','Marked copper tube',20,1,2.5,16],
    ['m3','marks','Between conduit marks','Electrical','Marked conduit',24,1,3.25,18.5],
    ['m4','marks','The thirty-second challenge','Carpentry','Marked hardwood strip',18,2,1.1875,12.875],
  ];
  const jobs = raw.map(([id,bench,title,trade,material,w,h,a,b]) => ({id,bench,title,trade,material,w:w*UNIT,h:h*UNIT,a:a*UNIT,b:b*UNIT}));
  function format(ticks) {
    const sign=ticks<0?'−':'';
    ticks=Math.abs(ticks);
    const whole=Math.floor(ticks/UNIT);
    let n=ticks%UNIT,d=UNIT;
    if(!n)return sign+whole;
    while(n%2===0){n/=2;d/=2;}
    return sign+(whole?whole+' ':'')+n+'/'+d;
  }
  function parse(value) {
    const s=String(value).trim();
    let inches;
    const f=s.match(/^(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)$/);
    if(f){if(+f[3]===0)return {error:'A fraction needs a nonzero denominator.'};inches=+(f[1]||0)+ +f[2]/+f[3];}
    else if(/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(s))inches=Number(s);
    else return {error:'Use inches, such as 4, 4 3/8, or 4.375.'};
    if(!Number.isFinite(inches)||inches<0||inches>96)return {error:'Enter a distance from 0 to 96 inches.'};
    const ticks=inches*UNIT;
    if(Math.abs(ticks-Math.round(ticks))>1e-7)return {error:'Use an exact multiple of 1/32 in. Your entry has not been rounded.'};
    return {ticks:Math.round(ticks)};
  }
  const target=j=>({x:(j.a+j.b)/2,y:j.bench==='face'?j.h/2:null});
  function inspect(j,mark) {
    if(!mark||!Number.isInteger(mark.x)||mark.x<j.a||mark.x>j.b||
      (j.bench==='face'&&(!Number.isInteger(mark.y)||mark.y<0||mark.y>j.h)))return {error:'Place your mark inside the dimensioned work area.'};
    const t=target(j),dx=mark.x-t.x,dy=j.bench==='face'?mark.y-t.y:0;
    return {centered:dx===0&&dy===0,dx,dy,left:mark.x-j.a,right:j.b-mark.x,top:j.bench==='face'?mark.y:null,bottom:j.bench==='face'?j.h-mark.y:null};
  }
  function equation(j) {
    const t=target(j);
    if(j.bench==='marks')return `${format(j.a)} + (${format(j.b)} − ${format(j.a)}) ÷ 2 = ${format(t.x)} in from the left end`;
    if(j.bench==='face')return `X: ${format(j.w)} ÷ 2 = ${format(t.x)} in. Y: ${format(j.h)} ÷ 2 = ${format(t.y)} in.`;
    return `${format(j.w)} ÷ 2 = ${format(t.x)} in from either end`;
  }
  function makeSet(bench='all',variation=0) {
    const shift=(Math.abs(Math.trunc(variation))%5)*8;
    return jobs.filter(j=>bench==='all'||j.bench===bench).map(j=>({...j,w:j.w+shift,h:j.h+(j.bench==='face'?shift:0),b:j.b+shift}));
  }
  const api={UNIT,benches,jobs,format,parse,target,inspect,equation,makeSet};
  if(typeof module!=='undefined')module.exports=api;
  root.CenterMath=api;
})(typeof window==='undefined'?globalThis:window);
