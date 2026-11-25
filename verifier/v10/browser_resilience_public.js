async page => {
 const base='https://morozovandrew20.github.io/peach-fitness/',out={checks:{},metrics:{},errors:[],external:[]};
 const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Network.setBypassServiceWorker',{bypass:true});
 const assert=(v,m)=>{if(!v)throw new Error(m)};
 page.on('pageerror',e=>out.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')out.errors.push(m.text())});
 page.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'))out.external.push(r.url())});
 await page.setViewportSize({width:390,height:844});await page.goto(base+'?v=9',{waitUntil:'domcontentloaded',timeout:60000});await page.evaluate(()=>localStorage.clear());await page.reload({waitUntil:'domcontentloaded',timeout:60000});
 await page.locator('[data-lvpick="mid"]').click();await page.locator('[data-nw]').click();await page.locator('#obgo').click();
 await page.locator('#view [data-how="ht"]').first().click();await page.locator('[data-tech3d="ht"][data-ready="1"]').waitFor({timeout:60000});
 const t0=await page.evaluate(()=>__PEACH_TECH__.time);await page.waitForTimeout(350);const t1=await page.evaluate(()=>__PEACH_TECH__.time);assert(t1!==t0,'animation time does not advance');out.checks.realAnimation={before:t0,after:t1};
 await page.locator('[data-t3play]').click();await page.waitForTimeout(60);const paused=await page.evaluate(()=>({t:__PEACH_TECH__.time,f:__PEACH_TECH__.frames}));await page.waitForTimeout(250);const paused2=await page.evaluate(()=>({t:__PEACH_TECH__.time,f:__PEACH_TECH__.frames}));assert(paused.t===paused2.t&&paused.f===paused2.f,'pause did not stop rendering');out.checks.pause=true;
 await page.locator('[data-t3scrub]').fill('750');assert(await page.evaluate(()=>__PEACH_TECH__.time)===.75,'scrub failed');out.checks.scrub=true;
 const before=await page.locator('[data-t3canvas] canvas').screenshot();await page.locator('[data-t3view="front"]').click();await page.waitForTimeout(80);const after=await page.locator('[data-t3canvas] canvas').screenshot();assert(!before.equals(after),'view did not change pixels');out.checks.viewPixels=true;
 await page.locator('[data-t3canvas]').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Space');assert(!(await page.evaluate(()=>__PEACH_TECH__.paused)),'keyboard play failed');out.checks.keyboard=true;
 await page.locator('#infoclose').click();const closed=await page.evaluate(()=>__PEACH_TECH__.frames);await page.waitForTimeout(300);assert(await page.evaluate(()=>__PEACH_TECH__.frames)===closed,'hidden dialog kept rendering');out.checks.hiddenStops=true;
 // Offline cold reload with all 3D assets served by the existing Service Worker.
 await cdp.send('Network.setBypassServiceWorker',{bypass:false});await cdp.send('Network.setCacheDisabled',{cacheDisabled:false});
 await page.reload({waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:60000});await page.waitForFunction(()=>caches.keys().then(keys=>keys.includes('peach-flagship-13')));await page.waitForTimeout(250);
 await page.context().setOffline(true);await page.reload({waitUntil:'domcontentloaded',timeout:20000});await page.locator('#view [data-how="ht"]').first().click();await page.locator('[data-tech3d="ht"][data-ready="1"]').waitFor({timeout:60000});out.checks.offline3D=true;await page.locator('#infoclose').click();await page.context().setOffline(false);
 for(const width of [360,390,768,1440]){
   await page.setViewportSize({width,height:width<700?800:1000});await page.locator('[data-how="ht"]').first().click();await page.locator('[data-tech3d="ht"][data-ready="1"]').waitFor();
   const dims=await page.evaluate(()=>({vw:innerWidth,scroll:document.documentElement.scrollWidth,stage:document.querySelector('.tech3d-stage').getBoundingClientRect().width}));assert(dims.scroll<=dims.vw,'horizontal overflow '+width+' '+JSON.stringify(dims));out.metrics['width'+width]=dims;
   await page.screenshot({path:`verifier/v10/shots/responsive-public-${width}.png`});await page.locator('#infoclose').click();
 }
 assert(!out.external.length,'external runtime requests '+out.external.join(','));out.checks.localOnly=true;
 assert(!out.errors.length,'console '+out.errors.join(';'));out.checks.zeroErrors=true;
 return out;
}
