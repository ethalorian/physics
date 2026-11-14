/* Reuse the live opening-state diagrams; never print the teacher's update. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createRequire} = require('node:module');
const repo = path.resolve(__dirname, '../..');
const out = path.resolve(process.argv[2]);
const bundled = process.env.CODEX_NODE_MODULES;
const {chromium} = require(bundled ? path.join(bundled, 'playwright') : 'playwright');
const local = createRequire(path.join(repo, 'package.json'));
const React = local('react');
const {renderToStaticMarkup} = local('react-dom/server');
fs.mkdirSync(out, {recursive:true});
const projector = fs.readFileSync(path.join(repo,'public/foundations/unit-1/projector.html'),'utf8');
function literal(source, token) {
  const start=source.indexOf(token)+token.length;
  if(start<token.length) throw Error('Missing source token '+token);
  let depth=0, quote=null, escaped=false;
  for(let i=start;i<source.length;i++) {
    const c=source[i];
    if(quote) { if(escaped)escaped=false; else if(c==='\\')escaped=true; else if(c===quote)quote=null; }
    else if(['"',"'",'`'].includes(c))quote=c;
    else if(c==='['||c==='{')depth++;
    else if(c===']'||c==='}') { if(--depth===0)return vm.runInNewContext('('+source.slice(start,i+1)+')'); }
  }
  throw Error('Unclosed data '+token);
}
const source = fs.readFileSync(path.join(repo,'public/foundations/unit-1/transfer-projector.js'),'utf8');
const assignments=literal(projector,'Wf='), titles=literal(source,'const titles = ');
const challenges=literal(source,'const challenges = ');
if(assignments.length!==22||titles.length!==22)throw Error('Daily coverage changed');
fs.writeFileSync(path.join(out,'source.json'),JSON.stringify({assignments,titles,challenges},null,2));
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(repo,'public/foundations/unit-1/transfer-visuals.js'),'utf8'),sandbox);
const Visual=sandbox.window.createFoundationTransferVisual(React);
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  const page=await browser.newPage(); const checks=[];
  for(let day=1;day<=22;day++) {
    const raw=renderToStaticMarkup(React.createElement(Visual,{day,phase:0,choice:null}));
    fs.writeFileSync(path.join(out,`day-${day}-source.svg`),raw);
    // Print palette is semantic outline art; only color/fill and redundant
    // heading/footer change. All geometry and data labels stay from the slides.
    const html=`<style>@font-face{font-family:Diagram;src:url('file://${repo}/public/fonts/dejavu/DejaVuSans.ttf')}@page{size:800px 313px;margin:0}html,body{margin:0;width:800px;height:313px}svg{display:block;width:800px;height:313px;font-family:Diagram}text{font-family:Diagram}</style>${raw}`;
    const file=path.join(out,`day-${day}.html`);fs.writeFileSync(file,html);
    await page.goto('file://'+file);await page.evaluate(()=>document.fonts.ready);
    const result=await page.evaluate((day)=>{
      const svg=document.querySelector('svg');svg.setAttribute('viewBox','0 35 800 313');
      for(const el of svg.querySelectorAll('*')) {
        for(const attr of ['fill','stroke']) {
          const v=el.getAttribute(attr);if(!v||v==='none'||v==='transparent')continue;
          if(v.startsWith('url')) { if(attr==='fill')el.setAttribute(attr,'none');continue; }
          const area=['rect','circle','ellipse','path'].includes(el.tagName)&&attr==='fill'&&!el.closest('defs');
          const smallDot=el.tagName==='circle'&&+el.getAttribute('r')<=10;
          el.setAttribute(attr,area&&!smallDot?'#ffffff':v==='#48405c'?'#bcbcbc':'#333333');
          if(area&&!smallDot&&!el.hasAttribute('stroke')&&+el.getAttribute('width')!==800){el.setAttribute('stroke','#777777');el.setAttribute('stroke-width','1.2');}
        }
        if(el.hasAttribute('opacity'))el.removeAttribute('opacity');
        if(el.tagName==='text'&&[38,365].includes(+el.getAttribute('y')))el.remove();
      }
      // Print-only label clearances (FL-3); no physics geometry changes.
      for(const el of svg.querySelectorAll('text')) {
        const value=el.textContent;
        if(value==='time (s)'){el.setAttribute('x','790');el.setAttribute('text-anchor','end');}
        if(day===3&&value==='+12 km'){el.setAttribute('x','140');el.setAttribute('y','135');el.setAttribute('text-anchor','start');}
        if(day===6&&value==='3 km toward Earth')el.setAttribute('x','365');
        if(day===15&&value==='Earth on XJ'){el.setAttribute('x','240');el.setAttribute('y','150');}
        if(day===16&&value==='full force'){el.setAttribute('x','280');el.setAttribute('y','235');}
      }
      const labels=[...svg.querySelectorAll('text')].map(el=>{const b=el.getBBox();return {text:el.textContent,x:b.x,y:b.y,w:b.width,h:b.height}});
      return {svg:svg.outerHTML,labels};
    },day);
    const bad=result.labels.filter(b=>b.text.trim()&&(b.x<0||b.x+b.w>800||b.y<35||b.y+b.h>348));
    if(bad.length)throw Error(JSON.stringify({day,bad}));
    fs.writeFileSync(path.join(out,`day-${day}-print.svg`),result.svg);
    await page.pdf({path:path.join(out,`day-${day}-graphic.pdf`),width:'800px',height:'313px',printBackground:true,preferCSSPageSize:true});
    checks.push({day,labels:result.labels.length,boundsIssues:bad});
  }
  fs.writeFileSync(path.join(out,'graphic-checks.json'),JSON.stringify(checks,null,2));
  await browser.close();console.log('Exported 22 matching opening-state graphics.');
})().catch(e=>{console.error(e);process.exit(1)});
