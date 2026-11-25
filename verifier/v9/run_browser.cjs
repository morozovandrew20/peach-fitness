const { chromium } = require('playwright');
const fs = require('fs');
(async()=>{
 const script=process.argv[2];if(!script)throw new Error('script path required');
 const browser=await chromium.launch({headless:false,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox','--hide-scrollbars']});
 const context=await browser.newContext({serviceWorkers:'allow'});const page=await context.newPage();
 if(process.env.DEBUG_BROWSER)page.on('console',m=>console.error('BROWSER',m.type(),m.text()));
 try{const fn=eval('('+fs.readFileSync(script,'utf8')+')');const result=await fn(page);console.log(JSON.stringify(result,null,2));await browser.close();}
 catch(error){console.error(error.stack||error);try{await page.screenshot({path:'verifier/v9/shots/error.png'})}catch{}await browser.close();process.exit(1)}
})();
