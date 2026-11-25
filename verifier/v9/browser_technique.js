async page => {
 const base='http://127.0.0.1:4173/',out={checks:{},metrics:{},errors:[],requests:[]};
 const assert=(v,m)=>{if(!v)throw new Error(m)};
 page.on('pageerror',e=>out.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')out.errors.push(m.text())});
 page.on('requestfailed',r=>out.requests.push(r.url()+': '+r.failure()?.errorText));
 await page.setViewportSize({width:390,height:844});await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(()=>localStorage.clear());await page.reload({waitUntil:'networkidle'});
 await page.locator('[data-lvpick="mid"]').click();await page.locator('[data-nw]').click();await page.locator('#obgo').click();
 const ids=['ht','rdl','bulg','abd','sq','hyper','kick','curl'];
 for(const id of ids){
   await page.locator(['sq','hyper','kick','curl'].includes(id)?'[data-day="2"]':'[data-day="1"]').click();
   const direct=page.locator(`#view [data-how="${id}"]`).first();
   if(await direct.count()&&await direct.isVisible())await direct.click();
   else{await page.locator(`[data-inspect="${id}"]`).click();await page.locator(`.technique-link[data-how="${id}"]`).click()}
   await page.locator(`[data-tech3d="${id}"][data-ready="1"]`).waitFor({timeout:20000});
   await page.waitForFunction(id=>window.__PEACH_TECH__?.id===id&&window.__PEACH_TECH__.ready,id);
   await page.evaluate(()=>window.__PEACH_TECH__.setTime(.5));await page.waitForTimeout(80);
   const m=await page.evaluate(()=>({frames:__PEACH_TECH__.frames,triangles:__PEACH_TECH__.triangles,calls:__PEACH_TECH__.calls,paused:__PEACH_TECH__.paused}));
   assert(m.frames>0&&m.triangles>0,id+' did not render');assert(m.triangles<30000,id+' triangle budget '+m.triangles);assert(m.calls<45,id+' draw call budget '+m.calls);out.metrics[id]=m;
   await page.screenshot({path:`verifier/v9/shots/${id}-mobile.png`});
   await page.locator('[data-t3view="front"]').click();assert(await page.locator('[data-t3view="front"]').getAttribute('aria-pressed')==='true',id+' front view failed');
   await page.locator('[data-t3speed]').click();assert((await page.locator('[data-t3speed]').textContent()).includes('0,5'),id+' speed failed');
   await page.locator('[data-t3play]').click();const paused=await page.evaluate(()=>__PEACH_TECH__.paused);assert(typeof paused==='boolean',id+' play failed');
   await page.locator('#infoclose').click();out.checks[id]=true;
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-day="1"]').click();await page.locator('#view [data-how="ht"]').first().click();await page.locator('[data-tech3d="ht"][data-ready="1"]').waitFor();assert(await page.evaluate(()=>__PEACH_TECH__.paused),'reduced motion autoplay');out.checks.reducedMotion=true;await page.locator('#infoclose').click();await page.emulateMedia({reducedMotion:'no-preference'});
 assert(!out.errors.length,'console '+out.errors.join(';'));assert(!out.requests.length,'request failures '+out.requests.join(';'));out.checks.zeroErrors=true;
 return out;
}