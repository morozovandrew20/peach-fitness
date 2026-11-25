async page => {
 const base='https://morozovandrew20.github.io/peach-fitness/',out={checks:{},errors:[]};
 const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Network.setBypassServiceWorker',{bypass:true});
 const assert=(v,m)=>{if(!v)throw new Error(m)};
 page.on('pageerror',e=>out.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')out.errors.push(m.text())});
 const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('volny-v1')));
 await page.setViewportSize({width:360,height:800});await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(()=>localStorage.clear());await page.reload({waitUntil:'networkidle'});
 await page.locator('[data-lvpick="mid"]').click();await page.locator('[data-nw]').click();await page.locator('#obgo').click();
 await page.locator('[data-quickset]').click();let s=await state();assert(s.sessions['1-1'].start>0&&!s.sessions['1-1'].end,'session not started');out.checks.start=true;
 await page.waitForTimeout(1100);const t1=await page.locator('[data-elapsed]').first().textContent();await page.reload({waitUntil:'networkidle'});await page.locator('[data-elapsed]').first().waitFor();const t2=await page.locator('[data-elapsed]').first().textContent();assert(t2>='00:01','elapsed not restored '+t1+' '+t2);out.checks.reload={before:t1,after:t2};
 await page.locator('[data-quickset]').click();await page.locator('#sf-0').fill('40');await page.locator('#sf-1').fill('10');await page.locator('#sfdone').click();await page.locator('#restfocus').waitFor({state:'visible'});
 await page.locator('#rfeffort [data-effort="hard"]').click();s=await state();assert(s.effort['1-ht']['0']==='hard','effort not persisted');assert((await page.locator('#rfnote').textContent()).includes('Тяжело'),'hard coaching absent');out.checks.effort=true;
 await page.locator('#rfeffort [data-effort="ok"]').click();await page.reload({waitUntil:'networkidle'});s=await state();assert(s.effort['1-ht']['0']==='ok','effort reload failed');out.checks.effortReload=true;
 await page.locator('[data-tab="setup"]').click();await page.locator('[data-voice]').click();s=await state();assert(s.voice===true,'voice opt-in failed');await page.locator('[data-voice]').click();out.checks.voice=true;
 // Technique: actual SMIL movement, pause and reduced-motion static fallback.
 await page.locator('[data-tab="train"]').click();await page.locator('[data-how="ht"]').first().click();await page.locator('[data-tech-svg] animate').first().waitFor({state:'attached'});await page.locator('[data-techmotion]').click();assert(await page.locator('[data-tech-svg]').evaluate(s=>s.animationsPaused()),'technique pause failed');out.checks.techniquePause=true;await page.locator('#infoclose').click();
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-how="ht"]').first().click();await page.waitForTimeout(100);assert(await page.locator('[data-tech-svg]').evaluate(s=>s.animationsPaused()),'reduced motion not static');out.checks.reducedMotion=true;await page.locator('#infoclose').click();await page.emulateMedia({reducedMotion:'no-preference'});
 // Four-week review based only on stored logs.
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('volny-v1'));for(let w=1;w<=4;w++){s.log[w+'-ht']=[[String(35+w),'10']];s.log[w+'-rdl']=[[String(45+w),'10']];s.log[w+'-sq']=[[String(55+w),'10']]}localStorage.setItem('volny-v1',JSON.stringify(s))});await page.reload({waitUntil:'networkidle'});await page.locator('[data-tab="progress"]').click();await page.locator('[data-four-week]').waitFor();const txt=await page.locator('[data-four-week]').textContent();assert(txt.includes('Что выросло')&&txt.includes('Где пауза')&&txt.includes('Что дальше'),'four week review incomplete');out.checks.fourWeek=true;
 assert(!out.errors.length,'browser errors '+out.errors.join(';'));out.checks.zeroErrors=true;return out;
}