// Run against the disposable browser fixture only (never the school site).
const assert=require('node:assert/strict'),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright')
const port=Number(process.env.FOUNDATION_GROUPS_PORT||4334),origin='http://127.0.0.1:'+port
;(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-background-networking']})
 try{
  const ctx=await browser.newContext({viewport:{width:870,height:820}}),page=await ctx.newPage(),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  const partnerURL=page.waitForResponse(r=>r.request().method()==='GET'&&r.url().includes('/partner?')).then(r=>new URL(r.url()).pathname)
  await page.goto(origin+'/?student=0');await page.getByRole('button',{name:'Work',exact:true}).click()
  const path=await partnerURL
  const api=async(user,body)=>{const url=origin+path+'?fixtureStudent='+user;const res=body?await ctx.request.post(url,{data:body}):await ctx.request.get(url);assert(res.ok(),await res.text());return res.json()}
  await page.getByRole('button',{name:'Create a group code'}).click()
  const code=page.locator('#foundation-group span[class*=code]'),source=(await code.innerText()).trim()
  await api(1,{action:'join',text:source});await page.getByRole('button',{name:/Check group updates/}).click();await page.getByRole('button',{name:/Start with 2/}).click()
  await api(2,{action:'create',text:''});const dest=(await api(2)).pair.code
  await api(3,{action:'join',text:dest});await api(2,{action:'start',text:''})
  const part=page.locator('#assignment-part-1 details[data-foundation-part]').first();if(!await part.getAttribute('open'))await part.locator('summary').click()
  const stop=page.locator('#foundation-stop-1'),idea='My starting observation names the position and time.'
  await stop.locator('#evidence-share').fill(idea);await stop.getByRole('button',{name:'Share my idea'}).click();await stop.getByText(idea,{exact:true}).waitFor()
  await page.getByText('Wrong table? Ask to switch',{exact:true}).click();await page.getByLabel('New table code').fill(dest)
  await page.getByRole('button',{name:'Ask my teacher to switch tables'}).click();await page.getByText(/Waiting for your teacher. Keep working at this table/).waitFor()
  const teacher=await ctx.newPage();teacher.on('pageerror',e=>errors.push(e.message));await teacher.goto(origin+'/?student=teacher')
  await teacher.getByRole('button',{name:'Approve table switch'}).click()
  await page.getByRole('button',{name:/Check group updates/}).click();await page.getByText(/A seat is held for you/).waitFor()
  await api(1,{action:'share',text:'My partner measured the cart position twice.',checkpoint:'evidence',code:source})
  await page.getByRole('button',{name:/Check group updates/}).click()
  await stop.getByRole('button',{name:/Compare with Jordan/}).click()
  await stop.locator('#evidence-reply').fill('I compared both readings at the original table.');await stop.getByRole('button',{name:'Save my response'}).click()
  const reflection='I kept the observation separate from my prediction.'
  await stop.locator('#evidence-reflect').fill(reflection);await stop.getByRole('button',{name:'Save my reflection'}).click()
  await page.getByText(/You switched tables. Your saved work is here/).waitFor()
  assert.equal((await code.innerText()).trim(),dest);await stop.getByText(reflection,{exact:true}).waitFor()
  await page.reload();await page.getByRole('button',{name:'Work',exact:true}).click()
  await page.locator('#foundation-group').getByText(/You switched tables/).waitFor()
  assert.equal((await api(0)).pair.checkpoints[1].available,true)
  assert(!JSON.stringify(await api(2)).includes(idea));assert(!JSON.stringify(await api(1)).includes(reflection));assert.deepEqual(errors,[])
  console.log('PASS Browser: student requests; teacher approves in the assignment roster; original reflection saves; correct table and next stop survive reload.')
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1})
