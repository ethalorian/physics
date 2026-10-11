const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = process.env.DECK_BASE_URL || 'http://127.0.0.1:4178';
const output = process.env.DECK_QA_DIR || '/private/tmp/unit1-visual-qa';
fs.mkdirSync(output,{recursive:true});
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    const errors=[],requests=[],report=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)requests.push(r.url()+':'+r.status());});
    for(let day=1;day<=22;day++){
      await page.goto(`${base}/decks/unit-1-teaching/day-${String(day).padStart(2,'0')}.html`);await page.evaluate(()=>document.fonts.ready);
      const count=await page.locator('.slide').count(),visuals=await page.locator('.visual-slide').count();assert.ok(visuals>=3,`Day ${day} has meaningful visual coverage`);
      for(let index=0;index<count;index++){
        const result=await page.evaluate(index=>{
          document.querySelector('deck-stage').goTo(index);
          const slide=document.querySelector('.slide.active'),bounds=slide.getBoundingClientRect(),footer=slide.querySelector('.footer').getBoundingClientRect(),content=slide.querySelector('.content').getBoundingClientRect();
          const scale=bounds.width/1280;
          const overflow=[];
          for(const el of slide.querySelectorAll('h1,h2,.content p,.content li,.content table,.equation,.lesson-visual,.visual-controls')){
            const b=el.getBoundingClientRect();if(b.bottom>footer.top-8*scale||b.right>bounds.right-35*scale||b.left<bounds.left)overflow.push({text:el.textContent.slice(0,85),bottom:Math.round((b.bottom-bounds.top)/scale),right:Math.round((b.right-bounds.left)/scale)});
          }
          const collisions=[];
          for(const svg of slide.querySelectorAll('svg')){const texts=[...svg.querySelectorAll('text')];for(let a=0;a<texts.length;a++)for(let b=a+1;b<texts.length;b++){const r=texts[a].getBoundingClientRect(),s=texts[b].getBoundingClientRect();if(Math.min(r.right,s.right)-Math.max(r.left,s.left)>3*scale&&Math.min(r.bottom,s.bottom)-Math.max(r.top,s.top)>3*scale)collisions.push([texts[a].textContent,texts[b].textContent]);}}
          return {day:Number(document.body.dataset.day),slide:index+1,title:slide.dataset.title,visual:slide.classList.contains('visual-slide'),overflow,collisions,contentBottom:Math.round((content.bottom-bounds.top)/scale)};
        },index);
        report.push(result);
        if(index===0||result.visual||(day===1&&index===4))await page.screenshot({path:path.join(output,`day-${String(day).padStart(2,'0')}-${String(index+1).padStart(2,'0')}.png`)});
      }
    }
    fs.writeFileSync(path.join(output,'layout.json'),JSON.stringify(report,null,2));
    const overflow=report.filter(r=>r.overflow.length),collisions=report.filter(r=>r.collisions.length);
    console.log(JSON.stringify({slides:report.length,visualSlides:report.filter(r=>r.visual).length,overflow,collisions,errors,requests},null,2));
    assert.equal(errors.length,0,'No runtime errors');assert.equal(requests.length,0,'No missing assets');assert.equal(overflow.length,0,'Every slide fits its stage');assert.equal(collisions.length,0,'Scientific labels do not overlap');
    // Reduced motion retains the complete diagram and its controls.
    await page.goto(`${base}/decks/unit-1-teaching/day-01.html#14`);await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.locator('.slide.active .visual-state').textContent(),'100%');
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.locator('.slide.active [data-visual-reset]').click();await page.locator('.slide.active [data-visual-play]').click();
    await page.waitForTimeout(700);await page.locator('.slide.active [data-visual-play]').click();
    const paused=await page.locator('.slide.active input[type=range]').inputValue();assert.ok(+paused>5&&+paused<100,'Animation advances');
    await page.waitForTimeout(250);assert.equal(await page.locator('.slide.active input[type=range]').inputValue(),paused,'Pause freezes progress');
    await page.locator('.slide.active input[type=range]').fill('100');assert.equal(await page.locator('.slide.active .visual-state').textContent(),'100%');
    const cart=await page.locator('.slide.active .v-cart').getAttribute('x');assert.ok(Number.isFinite(+cart),'Cart has a numeric position');
    await page.locator('.slide.active [data-visual-reset]').click();await page.locator('.slide.active [data-visual-play]').click();
    await page.evaluate(()=>document.querySelector('deck-stage').goTo(14));
    const hiddenValue=await page.locator('#slide-14 input[type=range]').inputValue();await page.waitForTimeout(200);assert.equal(await page.locator('#slide-14 input[type=range]').inputValue(),hiddenValue,'Hidden slides stop running');
    // Stage navigation must remain acknowledged by the classroom session.
    await page.evaluate(()=>{const stage=document.querySelector('deck-stage');stage.setAttribute('data-session-controlled','');window.requested=null;stage.addEventListener('classroomnavigate',e=>window.requested=e.detail.index);stage.next();});
    assert.equal(await page.evaluate(()=>document.querySelector('deck-stage').index),14);assert.equal(await page.evaluate(()=>window.requested),15);
    assert.equal(await page.locator('.toolbar').evaluate(el=>getComputedStyle(el).display),'none');
    await page.evaluate(()=>document.querySelector('deck-stage').goTo(window.requested));assert.equal(await page.locator('.slide.active').getAttribute('id'),'slide-16');
    for(const size of [{width:820,height:1180},{width:1180,height:820},{width:568,height:820}]){await page.setViewportSize(size);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No viewport overflow');}
    await page.setViewportSize({width:1440,height:900});
    await page.goto(`${base}/decks/unit-1-teaching/day-07.html`);
    await page.evaluate(()=>{const slides=[...document.querySelectorAll('.slide')];document.querySelector('deck-stage').goTo(slides.findIndex(s=>s.dataset.title==='One clock, linked representations'));});
    await page.locator('.slide.active .simulation input[type=range]').fill('2');
    assert.match(await page.locator('.slide.active .simulation output').textContent(),/x = -4.00 m\s+v = 0.00 m\/s/);
    assert.match(await page.locator('.slide.active .cart-track svg').getAttribute('aria-label'),/Cart position -4.00/);
    await page.screenshot({path:path.join(output,'linked-cart.png')});
    await page.locator('.slide.active .simulation input[type=range]').fill('4');
    assert.match(await page.locator('.slide.active .simulation output').textContent(),/x = 0.00 m\s+v = 4.00 m\/s/);
    console.log('PASS: 421-slide layout, labels, asset requests, animation pause/reset/scrub, reduced motion, hidden-slide stop, and classroom navigation.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
