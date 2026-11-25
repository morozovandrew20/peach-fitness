async page => {
  const base = 'http://127.0.0.1:4173/';
  const prefix = '/mnt/agents/peach-v3-local';
  const out = {base, checks:{}, consoleErrors:[], onlineRequestFailures:[]};
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  let offline = false;
  page.on('console', m => { if (m.type() === 'error') out.consoleErrors.push(m.text()); });
  page.on('pageerror', e => out.consoleErrors.push(e.message));
  page.on('requestfailed', r => {
    if (!offline && r.url().startsWith(base)) out.onlineRequestFailures.push(r.url()+': '+(r.failure()?.errorText||''));
  });
  await page.setViewportSize({width:360,height:800});
  await page.goto(base, {waitUntil:'networkidle'});
  await page.evaluate(async () => {
    localStorage.clear();
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
  });
  await page.reload({waitUntil:'networkidle'});
  out.checks.onboarding = await page.locator('h3').first().textContent();
  assert(out.checks.onboarding.trim() === 'Выбери уровень', 'wrong onboarding heading');
  out.checks.brandLogo = await page.locator('.brand-logo').evaluate(img => ({src:img.getAttribute('src'),loaded:img.complete&&img.naturalWidth>0}));
  assert(out.checks.brandLogo.src === 'peach-logo.svg' && out.checks.brandLogo.loaded, 'original brand logo not loaded');
  await page.locator('[data-lvpick="beg"]').click();
  await page.locator('#obgo').click();
  await page.locator('[data-firstset]').click();
  await page.locator('#setfocus:not([hidden])').waitFor();
  out.checks.focusFromFirstCta = await page.evaluate(() => ({
    title:document.querySelector('#sftitle').textContent,
    set:document.querySelector('#sfset').textContent,
    target:document.querySelector('#sftarget').textContent,
    previous:document.querySelector('#sfprevious').textContent,
    dialog:document.querySelector('.set-screen').getAttribute('role'),
    modal:document.querySelector('.set-screen').getAttribute('aria-modal'),
    width:innerWidth,
    scrollWidth:document.documentElement.scrollWidth
  }));
  assert(out.checks.focusFromFirstCta.title.length > 2 && out.checks.focusFromFirstCta.set.includes('Подход 1'), 'focus content missing');
  assert(out.checks.focusFromFirstCta.dialog === 'dialog' && out.checks.focusFromFirstCta.modal === 'true', 'focus dialog semantics missing');
  assert(out.checks.focusFromFirstCta.scrollWidth === 360, 'focus mobile horizontal overflow');
  out.checks.touchTargets = await page.locator('#setfocus button').evaluateAll(btns => btns.filter(b => b.getBoundingClientRect().width).map(b => ({id:b.id||b.getAttribute('aria-label'),w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height})));
  assert(out.checks.touchTargets.every(b => b.h >= 56), 'focus touch target below 56px: '+JSON.stringify(out.checks.touchTargets));
  out.checks.numericStyle = await page.locator('#sf-0').evaluate(el => getComputedStyle(el).fontVariantNumeric);
  assert(out.checks.numericStyle.includes('tabular-nums'), 'tabular numerals missing');
  await page.locator('#sfdone').focus();
  await page.keyboard.press('Tab');
  out.checks.focusTrap = await page.evaluate(() => document.activeElement.id);
  assert(out.checks.focusTrap === 'sfclose', 'Tab escaped focus dialog: '+out.checks.focusTrap);
  await page.waitForTimeout(400);
  await page.screenshot({path:prefix+'-focus-mobile.png',fullPage:true});
  await page.keyboard.press('Escape');
  assert(await page.locator('#setfocus').isHidden(), 'Escape did not close focus mode');

  await page.locator('[data-firstset]').click();
  await page.locator('#sf-0').fill('22.5');
  await page.locator('#sf-1').fill('9');
  await page.locator('#sfhow').click();
  await page.locator('#info:not([hidden]) .tech-visual').waitFor();
  out.checks.techniqueSvg = await page.locator('#info .tech-visual').count();
  await page.keyboard.press('Escape');
  await page.locator('#setfocus:not([hidden])').waitFor();
  out.checks.techniqueRoundTrip = await page.evaluate(() => ({kg:document.querySelector('#sf-0').value,reps:document.querySelector('#sf-1').value,set:document.querySelector('#sfset').textContent}));
  assert(out.checks.techniqueRoundTrip.kg === '22.5' && out.checks.techniqueRoundTrip.reps === '9', 'technique round-trip lost draft values');

  await page.locator('#sf-1').fill('0');
  await page.locator('#sfdone').click();
  out.checks.validation = await page.evaluate(() => ({error:document.querySelector('#sferror').textContent,invalid:document.querySelector('#sf-1').getAttribute('aria-invalid'),log:JSON.parse(localStorage.getItem('volny-v1')).log||{}}));
  assert(out.checks.validation.error.length > 10 && out.checks.validation.invalid === 'true', 'invalid input was not exposed');
  assert(Object.keys(out.checks.validation.log).length === 0 && await page.locator('#setfocus').isVisible(), 'invalid set was saved');

  await page.locator('#sf-0').fill('20');
  await page.locator('#sf-1').fill('8');
  await page.locator('#sfdone').click();
  await page.locator('#restfocus:not([hidden])').waitFor();
  out.checks.savedBeforeReload = await page.evaluate(() => JSON.parse(localStorage.getItem('volny-v1')).log['1-ht'][0].join(' × '));
  assert(out.checks.savedBeforeReload === '20 × 8', 'focus set was not saved through workout flow');
  out.checks.restStarted = await page.locator('#restfocus').isVisible();
  await page.screenshot({path:prefix+'-rest-mobile.png',fullPage:true});

  await page.evaluate(() => { window.__realDateNow = Date.now; Date.now = () => window.__realDateNow() + 240000; });
  await page.locator('#rfnext:not([hidden])').waitFor({timeout:5000});
  await page.locator('#rfnext').click();
  await page.locator('#setfocus:not([hidden])').waitFor();
  out.checks.afterRest = await page.locator('#sfset').textContent();
  assert(out.checks.afterRest.includes('Подход 2'), 'rest did not open next focus set');
  await page.evaluate(() => { if(window.__realDateNow) Date.now = window.__realDateNow; });
  await page.keyboard.press('Escape');
  if (await page.locator('#timer').isVisible()) { await page.locator('#texpand').click(); await page.locator('#rfstop').click(); }
  await page.reload({waitUntil:'networkidle'});
  if (await page.locator('#timer').isVisible()) { await page.locator('#texpand').click(); await page.locator('#rfstop').click(); }
  out.checks.savedAfterReload = await page.locator('[data-edit="0"]').first().locator('.val').textContent();
  assert(out.checks.savedAfterReload.includes('20') && out.checks.savedAfterReload.includes('8'), 'focus set did not survive reload');

  if (await page.locator('#ed-0').count() === 0) await page.locator('[data-edit="1"]').first().click();
  await page.locator('[data-setfocus]').click();
  out.checks.focusFromEditor = await page.locator('#sfset').textContent();
  assert(out.checks.focusFromEditor.includes('Подход 2'), 'editor did not open selected focus set');
  await page.locator('[data-sfstep="1"][data-f="1"]').click();
  out.checks.stepperWorks = await page.locator('#sf-1').inputValue();
  assert(Number(out.checks.stepperWorks) >= 1, 'repetition stepper failed');
  await page.keyboard.press('Escape');

  await page.locator('nav [data-tab="progress"]').click();
  out.checks.progress = await page.evaluate(() => ({hero:!!document.querySelector('.progress-hero'),weeks:document.querySelectorAll('.progress-weeks i').length,sets:document.querySelector('.progress-kpis div:nth-child(2) b')?.textContent,next:document.querySelector('.progress-main p b')?.textContent,width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert(out.checks.progress.hero && out.checks.progress.weeks === 12 && out.checks.progress.sets === '1', 'progress overview incorrect');
  assert(out.checks.progress.next.includes('неделя 1, день 1'), 'progress CTA points past unfinished workout');
  await page.locator('nav [data-tab="setup"]').click();
  await page.locator('[data-look="dark"]').click();
  out.checks.darkTheme = await page.evaluate(() => document.documentElement.dataset.look);
  assert(out.checks.darkTheme === 'dark', 'dark theme not applied');
  await page.locator('nav [data-tab="train"]').click();
  assert(await page.evaluate(() => document.documentElement.scrollWidth) === 360, 'dark mobile horizontal overflow');
  out.checks.unnamedControls = await page.evaluate(() => [...document.querySelectorAll('button,input,textarea,summary')].filter(el => {const r=el.getBoundingClientRect();if(!r.width||!r.height)return false;const label=el.getAttribute('aria-label')||el.getAttribute('title')||el.textContent.trim();const forLabel=el.id&&document.querySelector(`label[for="${CSS.escape(el.id)}"]`);return !label&&!forLabel;}).map(el => el.outerHTML.slice(0,160)));
  assert(out.checks.unnamedControls.length === 0, 'unnamed visible controls: '+out.checks.unnamedControls.join('; '));

  await page.evaluate(() => {
    const s=JSON.parse(localStorage.getItem('volny-v1'));
    for(const [id,n] of [['ht',3],['rdl',2],['bulg',2]]) s.log['1-'+id]=Array.from({length:n},()=>['20','8']);
    s.log['1-abd']=[['20','8'],['','']];
    localStorage.setItem('volny-v1',JSON.stringify(s));
  });
  await page.reload({waitUntil:'networkidle'});
  if (await page.locator('#ed-0').count() === 0) await page.locator('#ex-abd [data-edit="1"]').click();
  await page.locator('#ed-0').fill('20');
  await page.locator('#ed-1').fill('8');
  await page.locator('[data-done="1"]').click();
  await page.locator('#sheet:not([hidden])').waitFor();
  out.checks.completionSheet = await page.locator('#sh-h').textContent();
  assert(out.checks.completionSheet.includes('Тренировка'), 'completion sheet missing');
  await page.locator('#sheetok').click();
  out.checks.completionCard = await page.locator('.summary h3').textContent();
  await page.locator('nav [data-tab="progress"]').click();
  out.checks.completedNext = await page.locator('.progress-main p b').textContent();
  assert(out.checks.completedNext.includes('неделя 1, день 2'), 'completed workout does not point to day 2');
  await page.setViewportSize({width:1440,height:1000});
  out.checks.desktop = await page.evaluate(() => ({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,mainWidth:document.querySelector('main .wrap').getBoundingClientRect().width}));
  assert(out.checks.desktop.scrollWidth === 1440 && out.checks.desktop.mainWidth <= 760, 'desktop overflow or overwide');
  await page.emulateMedia({reducedMotion:'reduce'});
  out.checks.reducedMotion = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches && getComputedStyle(document.querySelector('.set-screen')).animationName === 'none');
  assert(out.checks.reducedMotion, 'reduced motion not applied to focus mode');

  await page.setViewportSize({width:360,height:800});
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  if (!await page.evaluate(() => !!navigator.serviceWorker.controller)) await page.reload({waitUntil:'networkidle'});
  out.checks.cacheNames = await page.evaluate(() => caches.keys());
  assert(out.checks.cacheNames.includes('peach-flagship-6'), 'flagship v3 offline cache missing');
  offline = true;
  await page.context().setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.brand').waitFor();
  out.checks.offlineReload = await page.locator('.brand').textContent();
  assert(out.checks.offlineReload.includes('PEACH'), 'offline reload failed');
  await page.context().setOffline(false);
  offline = false;
  assert(out.consoleErrors.length === 0, 'console errors: '+out.consoleErrors.join(' | '));
  assert(out.onlineRequestFailures.length === 0, 'online request failures: '+out.onlineRequestFailures.join(' | '));
  return out;
}
