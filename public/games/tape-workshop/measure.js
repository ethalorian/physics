(function(root){
  'use strict';
  const gcd=(a,b)=>b?gcd(b,a%b):a;
  const fraction=(n,d)=>{const g=gcd(n,d);return n===0?'0':`${n/g}/${d/g}`;};
  const mixed=(ticks,d)=>{const w=Math.floor(ticks/d),n=ticks%d;return n?(w?`${w} `:'')+fraction(n,d):String(w);};
  function parse(value){
    const s=value.trim();
    let m=s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if(m)return +m[3]===0?NaN:+m[1]+(+m[2]/+m[3]);
    m=s.match(/^(\d+)\/(\d+)$/);
    if(m)return +m[2]===0?NaN:+m[1]/+m[2];
    return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)?Number(s):NaN;
  }
  function question(d,round,random=Math.random){
    // Begin with the important reducible half-inch example, then vary lengths.
    const n=round===0?d/2:1+Math.floor(random()*(d-1));
    const whole=round===0?3:1+Math.floor(random()*5);
    return {d,n,whole,ticks:whole*d+n,value:whole+n/d};
  }
  const api={gcd,fraction,mixed,parse,question};
  if(typeof module!=='undefined')module.exports=api;
  root.TapeMath=api;
})(typeof window==='undefined'?globalThis:window);
