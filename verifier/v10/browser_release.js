async page => {
  const base = 'http://127.0.0.1:4173/';
  const prefix = '/mnt/agents/output/peach-fitness/verifier/v10/shots/local-release';
  const out = {base,checks:{},consoleErrors:[],onlineRequestFailures:[]};
  const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
  let offline=false;
  page.on('console',m=>{if(m.type()==='error')out.consoleErrors.push(m.text())});
  page.on('pageerror',e=>out.consoleErrors.push(e.message));
  page.on('requestfailed',r=>{if(!offline&&r.url().startsWith(base)){const f=r.failure()?.errorText||'';if(f.includes('ERR_ABORTED')&&/\.(woff2?|ttf|otf)(\?|$)/.test(r.url()))return;out.onlineRequestFailures.push(r.url()+': '+f)}});
  const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('volny-v1')));
  const noOverflow=async label=>{const v=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert(v.scroll===v.width,label+' horizontal overflow '+JSON.stringify(v))};

  await page.setViewportSize({width:390,height:844});
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
  await page.evaluate(()=>{localStorage.clear()});
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});

  // Welcome release strip.
  await page.locator('.release-strip').waitFor();
  const strip=(await page.locator('.release-strip').textContent()).replace(/\s+/g,' ');
  assert(/Релиз 1\.0/.test(strip)&&/3D-техника/.test(strip)&&/Офлайн/.test(strip)&&/Без аккаунта/.test(strip),'welcome strip incomplete: '+strip);
  out.checks.welcomeStrip=strip.trim();
  out.checks.brandnote=await page.locator('.brandnote').textContent();
  assert(/Релиз 1\.0/.test(out.checks.brandnote),'brandnote missing release');
  out.checks.title=await page.title();
  assert(/PEACH/.test(out.checks.title),'title missing PEACH');
  out.checks.metaDesc=(await page.locator('meta[name="description"]').getAttribute('content'))||'';
  assert(out.checks.metaDesc.length>40,'meta description weak');
  out.checks.canonical=await page.locator('link[rel="canonical"]').getAttribute('href');
  out.checks.ogImage=await page.locator('meta[property="og:image"]').getAttribute('content');
  assert(out.checks.ogImage.includes('screenshot-mobile.png'),'og:image wrong');
  await page.screenshot({path:prefix+'-welcome.png',fullPage:false});

  // Onboard minimally to reach setup screen with release card.
  await page.locator('[data-lvpick="beg"]').click();
  await page.locator('#obgo').click();
  await page.locator('[data-firstset]').waitFor();

  // Release card + links (on the settings tab).
  await page.locator('[data-tab="setup"]').click();
  await page.locator('#release-info').scrollIntoViewIfNeeded();
  await page.locator('#release-info').waitFor();
  out.checks.releaseCard=(await page.locator('#release-info').textContent()).replace(/\s+/g,' ').trim();
  assert(/1\.0\.0/.test(out.checks.releaseCard),'release version absent');
  const links=await page.locator('#release-info a').evaluateAll(as=>as.map(a=>({href:a.getAttribute('href'),text:a.textContent.trim()})));
  assert(links.length===5,'expected 5 release links, got '+JSON.stringify(links));
  out.checks.releaseLinks=links;
  for(const l of links){
    if(l.href.startsWith('http'))continue;
    const resp=await page.request.get(base+l.href);
    assert(resp.status()===200,l.href+' status '+resp.status());
    const body=await resp.text();
    assert(body.includes('PEACH'),l.href+' missing PEACH');
  }
  out.checks.docPages200=true;
  await page.screenshot({path:prefix+'-release-card.png',fullPage:false});

  // Manifests.
  for(const name of ['manifest.webmanifest','manifest-dark.webmanifest']){
    const resp=await page.request.get(base+name);
    assert(resp.status()===200,name+' '+resp.status());
    const m=JSON.parse(await resp.text());
    assert(m.name&&m.name.includes('PEACH'),name+' name');
    assert(Array.isArray(m.screenshots)&&m.screenshots.length>=2,name+' screenshots');
    assert(Array.isArray(m.categories)&&m.categories.length>=2,name+' categories');
    for(const icon of m.icons){
      const ir=await page.request.get(base+icon.src);
      assert(ir.status()===200,name+' icon '+icon.src+' '+ir.status());
    }
    for(const shot of m.screenshots){
      const sr=await page.request.get(base+shot.src);
      assert(sr.status()===200,name+' screenshot '+shot.src+' '+sr.status());
    }
    out.checks['manifest_'+name]={name:m.name,screenshots:m.screenshots.length,categories:m.categories};
  }
  const favResp=await page.request.get(base+'favicon.ico');
  assert(favResp.status()===200,'favicon.ico '+favResp.status());
  out.checks.faviconBytes=(await favResp.body()).length;

  // Install: button exists, without prompt shows instructions dialog; with synthetic prompt uses it.
  await page.locator('#install').scrollIntoViewIfNeeded();
  await page.locator('[data-install]').click();
  await page.locator('#info:not([hidden])').waitFor();
  out.checks.installInstructions=(await page.locator('#infobody').textContent()).replace(/\s+/g,' ').trim();
  assert(/главн|экран/i.test(out.checks.installInstructions),'install instructions missing');
  await page.keyboard.press('Escape');
  await page.evaluate(()=>{const ev=new Event('beforeinstallprompt');ev.prompt=async()=>{};ev.userChoice=Promise.resolve({outcome:'accepted'});window.dispatchEvent(ev)});
  await page.locator('[data-install]').click();
  await page.waitForTimeout(300);
  out.checks.installPromptAccepted=(await page.locator('#installmsg').textContent()).trim();
  assert(/появился|браузера/.test(out.checks.installPromptAccepted),'install prompt feedback missing: '+out.checks.installPromptAccepted);
  out.checks.installFlow=true;

  // 3D integration proof: one technique scene renders real frames.
  await page.locator('[data-tab="train"]').click();
  await page.locator('[data-firstset]').click();
  await page.locator('#setfocus:not([hidden])').waitFor();
  await page.locator('#sfhow').click();
  await page.locator('#info:not([hidden]) .tech-visual').waitFor();
  await page.waitForFunction(()=>window.__PEACH_TECH__&&window.__PEACH_TECH__.ready,null,{timeout:60000});
  const t3=await page.evaluate(async()=>{
    const c=document.querySelector('#info canvas');
    if(!c)return{canvas:false};
    const h=window.__PEACH_TECH__;
    const f0=h?h.frames:-1,t0=h?h.time:-1;
    await new Promise(r=>setTimeout(r,1400));
    return{canvas:true,size:[c.width,c.height],ready:h?h.ready:false,
      framesDelta:h?h.frames-f0:0,timeDelta:h?+(h.time-t0).toFixed(3):0,
      triangles:h?h.triangles:0,calls:h?h.calls:0};
  });
  assert(t3.canvas&&t3.ready&&t3.framesDelta>=3&&t3.timeDelta>0.015,'3D scene did not render changing frames: '+JSON.stringify(t3));
  out.checks.technique3D=t3;
  await page.screenshot({path:prefix+'-technique-3d.png'});
  await page.keyboard.press('Escape');
  await page.locator('#sfclose').click();
  const st=await state();
  assert(st&&st.level==='beg'&&st.cur&&st.cur.w===1,'state intact: '+JSON.stringify(st&&st.cur));

  // Service worker cache v13 active.
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:60000});
  const cacheName=await page.evaluate(async()=>{const ks=await caches.keys();return ks.find(k=>k.includes('peach-flagship'))});
  assert(cacheName==='peach-flagship-13','wrong active cache '+cacheName);
  out.checks.cacheName=cacheName;
  const coreOk=await page.evaluate(async()=>{
    const c=await caches.open('peach-flagship-13');
    const reqs=['release.html','privacy.html','terms.html','credits.html','favicon.ico','assets/release/screenshot-mobile.png','manifest.webmanifest'];
    const out={};
    for(const r of reqs)out[r]=!!(await c.match(r))||!!(await c.match('./'+r));
    return out;
  });
  for(const [k,v] of Object.entries(coreOk))assert(v,'not cached offline: '+k);
  out.checks.offlineCore=coreOk;

  // Responsive + themes.
  for(const w of [360,768,1440]){
    await page.setViewportSize({width:w,height:800});
    await page.waitForTimeout(200);
    await noOverflow('width '+w);
  }
  out.checks.noOverflow=true;
  const themes=await page.evaluate(()=>[document.documentElement.classList.contains('theme-light'),document.documentElement.classList.contains('theme-dark')]);
  await page.locator('#theme').scrollIntoViewIfNeeded().catch(()=>{});
  out.checks.themes=themes;
  await page.setViewportSize({width:390,height:844});

  assert(out.consoleErrors.length===0,'console errors: '+out.consoleErrors.join(' | '));
  assert(out.onlineRequestFailures.length===0,'request failures: '+out.onlineRequestFailures.join(' | '));
  out.checks.zeroErrors=true;
  return out;
}
