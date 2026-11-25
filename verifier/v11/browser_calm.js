async page => {
  const base = 'http://127.0.0.1:4173/';
  const prefix = '/mnt/agents/output/peach-fitness/verifier/v11/shots/local-calm';
  const out = {base,checks:{},consoleErrors:[],onlineRequestFailures:[]};
  const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
  page.on('console',m=>{if(m.type()==='error')out.consoleErrors.push(m.text())});
  page.on('pageerror',e=>out.consoleErrors.push(e.message));
  page.on('requestfailed',r=>{if(r.url().startsWith(base)){const f=r.failure()?.errorText||'';if(f.includes('ERR_ABORTED')&&/\.(woff2?|ttf|otf)(\?|$)/.test(r.url()))return;out.onlineRequestFailures.push(r.url()+': '+f)}});
  const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('volny-v1')));
  const noOverflow=async label=>{const v=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert(v.scroll===v.width,label+' horizontal overflow '+JSON.stringify(v))};
  const navGeometry=async label=>{
    const g=await page.evaluate(()=>{
      const nav=document.querySelector('nav'),nr=nav.getBoundingClientRect();
      const btns=[...nav.querySelectorAll('button')].map(b=>{const r=b.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}});
      return{nav:{x:nr.x,y:nr.y,w:nr.width,h:nr.height},btns,vw:innerWidth,vh:innerHeight};
    });
    assert(g.nav.x>=-1&&g.nav.x+g.nav.w<=g.vw+1,label+' nav off viewport '+JSON.stringify(g.nav));
    for(const b of g.btns)assert(b.x>=g.nav.x-1&&b.x+b.w<=g.nav.x+g.nav.w+1&&b.w>60,label+' nav button misplaced '+JSON.stringify(b));
    return g;
  };

  // Welcome: no promo strip, one clear CTA path, calm hero.
  await page.setViewportSize({width:390,height:844});
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
  await page.evaluate(()=>localStorage.clear());
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});
  assert(await page.locator('.release-strip').count()===0,'release strip still visible');
  assert(await page.locator('.onboarding-intro').count()===0,'onboarding intro still visible');
  out.checks.welcomeHero=(await page.locator('.welcome-hero').textContent()).replace(/\s+/g,' ').trim();
  assert(/12недель/.test(out.checks.welcomeHero.replace(/\s+/g,'')),'hero lost plan');
  out.checks.welcomeNoPromo=true;
  await navGeometry('welcome');
  await page.screenshot({path:prefix+'-welcome.png',fullPage:false});

  await page.locator('[data-lvpick="beg"]').click();
  await page.locator('#obgo').click();
  await page.locator('[data-firstset]').waitFor();
  out.checks.trainStart=true;
  await page.waitForTimeout(400);

  // Train: merged help disclosure, no three separate helper rows.
  const helps=await page.locator('.ex-help').count();
  assert(helps>=1,'merged help disclosure missing');
  out.checks.mergedHelp=helps;
  await page.screenshot({path:prefix+'-train.png',fullPage:false});

  // Rest: ring text contained at 320/360/390, controls and nav stable.
  await page.locator('[data-firstset]').click();
  await page.locator('#setfocus:not([hidden])').waitFor();
  await page.locator('#sf-0').fill('20');await page.locator('#sf-1').fill('8');
  await page.locator('#sfdone').click();
  await page.locator('#restfocus:not([hidden])').waitFor();
  for(const w of [320,360,390]){
    await page.setViewportSize({width:w,height:800});
    await page.waitForTimeout(250);
    const fit=await page.evaluate(()=>{
      const ring=document.querySelector('.rest-ring').getBoundingClientRect();
      const els=['rfstate','rfclock','rfsub'].map(id=>{const e=document.getElementById(id),r=e.getBoundingClientRect();return{id,x:r.x,w:r.width,right:r.right,ringL:ring.left,ringR:ring.right,text:e.textContent}});
      return{ring:{l:ring.left,r:ring.right,w:ring.width},els};
    });
    for(const e of fit.els)assert(e.x>=fit.ring.l+6&&e.right<=fit.ring.r-6,`rest text ${e.id} escapes ring at ${w}: `+JSON.stringify(e)+' ring '+JSON.stringify(fit.ring));
    await noOverflow('rest '+w);
  }
  out.checks.restTextContained=true;
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(250);
  await page.screenshot({path:prefix+'-rest.png',fullPage:false});

  await page.locator('#rfstop').click();
  await page.locator('#restfocus[hidden]').waitFor({state:'attached'});
  // Nav stability across tabs and viewports.
  for(const w of [320,360,390,768,1440]){
    await page.setViewportSize({width:w,height:844});
    await page.waitForTimeout(150);
    for(const tab of ['progress','setup','train']){
      await page.locator(`nav [data-tab="${tab}"]`).click();
      await page.waitForTimeout(200);
      await navGeometry(`${tab}@${w}`);
      await noOverflow(`${tab}@${w}`);
    }
  }
  out.checks.navStable=true;

  // Progress folds exist and open.
  await page.setViewportSize({width:390,height:844});
  await page.locator('nav [data-tab="progress"]').click();
  const folds=await page.locator('details.card.fold').count();
  assert(folds>=2,'progress folds missing');
  await page.locator('details.card.fold summary').first().click();
  out.checks.progressFolds=folds;
  await page.screenshot({path:prefix+'-progress.png',fullPage:false});

  // Setup: compact about card with the same five links, at the bottom.
  await page.locator('nav [data-tab="setup"]').click();
  await page.locator('#release-info').waitFor();
  const links=await page.locator('#release-info a').evaluateAll(as=>as.map(a=>a.getAttribute('href')));
  assert(links.length===5,'about card links '+JSON.stringify(links));
  const aboutText=(await page.locator('#release-info').textContent()).replace(/\s+/g,' ');
  assert(/О приложении/.test(aboutText)&&/1\.1\.0/.test(aboutText),'about card content '+aboutText);
  out.checks.aboutCard=links;
  for(const l of links){if(l.startsWith('http'))continue;const r=await page.request.get(base+l);assert(r.status()===200,l+' '+r.status())}
  out.checks.docPages200=true;
  await page.screenshot({path:prefix+'-setup.png',fullPage:false});

  // Install flow still works.
  await page.locator('#install').scrollIntoViewIfNeeded();
  await page.locator('[data-install]').click();
  await page.locator('#info:not([hidden])').waitFor();
  await page.keyboard.press('Escape');
  out.checks.installFlow=true;

  // 3D technique unchanged integration.
  await page.locator('nav [data-tab="train"]').click();
  await page.locator('[data-quickset]').click();
  await page.locator('#setfocus:not([hidden])').waitFor();
  await page.locator('#sfhow').click();
  await page.locator('#info:not([hidden]) .tech-visual').waitFor();
  await page.waitForFunction(()=>window.__PEACH_TECH__&&window.__PEACH_TECH__.ready,null,{timeout:60000});
  const t3=await page.evaluate(async()=>{const h=window.__PEACH_TECH__;const f0=h.frames,t0=h.time;await new Promise(r=>setTimeout(r,1400));return{ready:h.ready,framesDelta:h.frames-f0,timeDelta:+(h.time-t0).toFixed(3),triangles:h.triangles,calls:h.calls}});
  assert(t3.ready&&t3.framesDelta>=3&&t3.timeDelta>0.015,'3D not rendering '+JSON.stringify(t3));
  out.checks.technique3D=t3;
  await page.keyboard.press('Escape');await page.locator('#sfclose').click();

  await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:60000});
  const cacheName=await page.evaluate(async()=>{const ks=await caches.keys();return ks.find(k=>k.includes('peach-flagship'))});
  assert(cacheName==='peach-flagship-14','cache '+cacheName);
  out.checks.cacheName=cacheName;
  const st=await state();assert(st&&st.level==='beg','state lost');
  assert(out.consoleErrors.length===0,'console errors: '+out.consoleErrors.join(' | '));
  assert(out.onlineRequestFailures.length===0,'request failures: '+out.onlineRequestFailures.join(' | '));
  out.checks.zeroErrors=true;
  return out;
}
