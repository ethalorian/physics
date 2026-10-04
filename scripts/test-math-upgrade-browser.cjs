const assert=require('node:assert/strict'),path=require('node:path');
module.exports=async({page,base,out,scores,plays,fail})=>{
 const files=['algebra-inverse-blitz','numbersense-magnitude','proportion-scale-storm','quantities-powers-of-ten','graphs-slope-sniper','equivalence-fusion','logic-expression-crush','daily-mathle'];
 for(const [width,height] of [[1366,768],[1280,720],[1024,600],[390,844]]){
  await page.setViewportSize({width,height});
  for(const file of files){
   await page.goto(base+'/games/'+file+'.html');const practice=page.locator('#untimedPractice, #practiceMode');await practice.check();await page.locator('#startOv .bigbtn').nth(file==='proportion-scale-storm'?1:0).click();
   await page.waitForTimeout(100);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),file+' no horizontal scroll '+width);
   const controls=page.locator(file==='daily-mathle'?'.pkey':file==='logic-expression-crush'?'.tile':file==='equivalence-fusion'?'.studioDirections button':'.chip');
   for(const b of await controls.all()){const box=await b.boundingBox();assert(box&&box.width>=30&&box.height>=40,file+' target size '+width);}
   const brand=await page.locator('.studioBrand').boundingBox(),board=await page.locator('#board, #gridWrap').first().boundingBox();assert(board.y>=brand.y+brand.height-1,file+' header does not overlap board');
   if(file==='graphs-slope-sniper'){const card=await page.locator('#card').boundingBox();assert(card.y+card.height<=board.y+board.height,file+' graph fits the board at '+width);}
   if(width===1366){await page.screenshot({path:path.join(out,file+'-chromebook.png'),fullPage:true});
    if(!['equivalence-fusion','logic-expression-crush','daily-mathle'].includes(file)){
     for(let step=0;step<4;step++){const i=await page.evaluate(()=>window.__mathTest.state().cur.chips.findIndex(c=>c.ok));await page.keyboard.press(String(i+1));await page.waitForTimeout(250);if(await page.getByRole('button',{name:'Next problem',exact:true}).count())break;}
     if(file!=='graphs-slope-sniper')assert.equal(await page.locator('.studioModel').count(),1,file+' mathematical model');
     await page.waitForTimeout(550);await page.screenshot({path:path.join(out,file+'-worked.png'),fullPage:true});
    }
   }
  }
 }
 await page.setViewportSize({width:1366,height:768});
 await page.goto(base+'/arcade/magnitude');const frame=page.frameLocator('iframe');await frame.locator('#startOv .bigbtn').first().click();let game=page.frames().find(f=>f.url().endsWith('numbersense-magnitude.html'));await game.waitForFunction(()=>window.__mathTest.state().running);
 const wrong=await game.evaluate(()=>window.__mathTest.state().cur.chips.findIndex(c=>!c.ok));await page.keyboard.press(String(wrong+1));const y=await game.evaluate(()=>window.__mathTest.state().y);await page.waitForTimeout(1200);assert.equal(await game.evaluate(()=>window.__mathTest.state().y),y);assert(await frame.getByRole('button',{name:'Try again',exact:true}).isVisible());
 await frame.getByRole('button',{name:'Try again',exact:true}).click();const right=await game.evaluate(()=>window.__mathTest.state().cur.chips.findIndex(c=>c.ok));await page.keyboard.press(String(right+1));await page.waitForTimeout(400);
 const priorPlay=await game.evaluate(()=>window.__mathTest.bridge.playId),coinCount=plays();
 await page.reload();await frame.getByRole('button',{name:'Retry save',exact:true}).waitFor();game=page.frames().find(f=>f.url().endsWith('numbersense-magnitude.html'));await page.keyboard.press('Tab');assert.equal(await game.evaluate(()=>document.activeElement.textContent),'Retry save');fail();await page.keyboard.press('Enter');await frame.getByRole('button',{name:'Retry save',exact:true}).waitFor();assert.equal(plays(),coinCount);
 await frame.getByRole('button',{name:'Retry save',exact:true}).click();await game.waitForFunction(()=>window.__mathTest.bridge.playId===null);const final=scores.filter(s=>s.playId===priorPlay&&s.final);assert(final.length>=2);assert.equal(final[0].stats.wrong,1);assert.equal(final[0].stats.solved,1);assert.deepEqual(final[0],final.at(-1));assert.equal(plays(),coinCount);
 await page.reload();assert.equal(await frame.getByRole('button',{name:'Retry save',exact:true}).count(),0);
 // Actual keyboard interactions in reduced-motion practice.
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base+'/games/logic-expression-crush.html');await page.locator('#practiceMode').check();await page.locator('#startOv .bigbtn').first().click();await page.locator('.tile[tabindex="0"]').focus();await page.keyboard.press('Enter');await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');await page.waitForTimeout(1200);assert.equal(await page.locator('.tile[tabindex="0"]').count(),1);
 await page.emulateMedia({reducedMotion:'no-preference'});
 console.log('PASS all 8 cabinets at 4 viewport sizes; persistent feedback, reload recovery, failed recovery retry, single credit, keyboard swap, reduced motion');
};
