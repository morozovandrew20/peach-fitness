async page => {
 const out={checks:{},expectedWebGLErrors:[]};
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl'||type==='webgl2'||type==='experimental-webgl')return null;return original.call(this,type,...args)}});
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});await page.evaluate(()=>localStorage.clear());await page.reload({waitUntil:'networkidle'});
 await page.locator('[data-lvpick="mid"]').click();await page.locator('[data-nw]').click();await page.locator('#obgo').click();await page.locator('[data-how="ht"]').first().click();
 await page.locator('.tech3d-fallback:not([hidden]) [data-tech-svg]').waitFor();if(!await page.locator('[data-tech3d="ht"]').isHidden())throw new Error('failed 3D shell still visible');
 await page.locator('.tech3d-fallback:not([hidden]) [data-techmotion]').click();if(!await page.locator('.tech3d-fallback:not([hidden]) [data-tech-svg]').evaluate(s=>s.animationsPaused()))throw new Error('fallback pause failed');
 out.checks.webglFallback=true;out.checks.fallbackControls=true;out.checks.instructions=await page.locator('#infobody .hw').isVisible();return out;
}