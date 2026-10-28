/* Multi-device, dual-language quality gate.
   Screenshots and machine-readable audit artifacts are evidence, not a claim of 100/100 UX. */
const {chromium}=require('playwright');
const AxeBuilder=require('@axe-core/playwright').default;
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const base=process.env.PWYW_BASE_URL||'http://127.0.0.1:8080';
 const layouts=[
  {label:'landing',path:'/'},
  {label:'signup',path:'/dashboard?signup=1'},
  {label:'arcade',path:'/play/luna-cafe?objective=return'},
  {label:'admin',path:'/admin'}
 ];
 const sizes=[{width:360,height:780},{width:390,height:844},{width:768,height:1024},{width:1365,height:900}];
 const report={generated_at:new Date().toISOString(),run:'cross-device-locale',pages:[],failures:[]};
 for(const entry of layouts){
  for(const language of ['fa','de']){
   for(const size of sizes){
    const u=new URL(entry.path,base);u.searchParams.set('lang',language);
    const context=await browser.newContext({viewport:size,isMobile:size.width<769,hasTouch:size.width<769});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    try{
     const result=await page.goto(u.href,{waitUntil:'domcontentloaded',timeout:20000});
     if(!result?.ok())throw Error('HTTP '+result?.status());
     if(entry.label==='arcade')await page.locator('#load-overlay').waitFor({state:'hidden',timeout:18000});
     if(entry.label==='signup')await page.locator('#auth-shell').waitFor({state:'visible',timeout:12000});
     await page.locator('body').waitFor({state:'visible'});
     await page.waitForTimeout(150);
     const metrics=await page.evaluate(()=>{
      const doc=document.documentElement;
      const within=el=>{const r=el.getBoundingClientRect();const st=getComputedStyle(el);return r.width>0&&r.height>0&&r.right>0&&r.bottom>0&&r.left<innerWidth&&r.top<innerHeight&&st.visibility!=='hidden'&&st.display!=='none'};
      const elements=[...document.querySelectorAll('a,button,input,select,textarea,summary')].filter(el=>within(el));
      const tiny=elements.filter(el=>{const r=el.getBoundingClientRect();return !el.matches('input[type=hidden]')&&(r.width<33||r.height<32);}).map(el=>({tag:el.tagName,label:(el.getAttribute('aria-label')||el.textContent||'').trim().slice(0,70),width:Math.round(el.getBoundingClientRect().width),height:Math.round(el.getBoundingClientRect().height)}));
      const noName=elements.filter(el=>el.matches('button,a')&&!((el.getAttribute('aria-label')||el.getAttribute('title')||el.textContent||'').trim())&&!el.querySelector('img[alt],svg[aria-label]')).map(el=>el.outerHTML.slice(0,120));
      const missingAlt=[...document.images].filter(img=>within(img)&&!img.hasAttribute('alt')).map(img=>img.getAttribute('src'));
      const brokenImages=[...document.images].filter(img=>within(img)&&img.complete&&img.naturalWidth===0).map(img=>img.getAttribute('src'));
      return {viewport:innerWidth,docWidth:doc.scrollWidth,overflow:Math.max(0,doc.scrollWidth-innerWidth),
       locale:doc.lang,dir:doc.dir,tinyControls:tiny,unnamedControls:noName,missingAlt,brokenImages,
       mainLandmarks:document.querySelectorAll('main').length,
       title:document.title,headings:[...document.querySelectorAll('h1')].map(el=>el.textContent.trim().slice(0,80))};
     });
     const ax=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
     const severe=ax.violations.filter(v=>v.impact==='serious'||v.impact==='critical').map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length,help:v.help}));
     const item={page:entry.label,locale:language,width:size.width,metrics,accessibility:severe,errors};
     report.pages.push(item);
     if(metrics.overflow>4)report.failures.push(entry.label+' '+language+' '+size.width+'px: horizontal overflow '+metrics.overflow+'px');
     if(errors.length)report.failures.push(entry.label+' '+language+' '+size.width+'px: runtime '+errors.slice(0,2).join(' | '));
     if(metrics.brokenImages.length)report.failures.push(entry.label+' '+language+' '+size.width+'px: broken '+metrics.brokenImages.join(','));
     if(metrics.locale!==language||metrics.dir!==(language==='fa'?'rtl':'ltr'))report.failures.push(entry.label+' '+size.width+'px: locale/dir mismatch');
     if(size.width===390){await page.screenshot({path:'/tmp/pwyw-quality-'+entry.label+'-'+language+'-mobile.png',fullPage:true});}
    }catch(err){report.failures.push(entry.label+' '+language+' '+size.width+': '+err.message);}
    finally{await context.close();}
   }
  }
 }
 fs.writeFileSync('/tmp/pwyw-experience-audit.json',JSON.stringify(report,null,2));
 const tally={pages:report.pages.length,failures:report.failures.length,seriousIssues:report.pages.reduce((a,p)=>a+p.accessibility.reduce((b,v)=>b+v.nodes,0),0),smallTargets:report.pages.reduce((a,p)=>a+p.metrics.tinyControls.length,0)};
 console.log('EXPERIENCE_AUDIT '+JSON.stringify(tally));
 if(report.failures.length){console.error('QUALITY FAILURES:\n'+report.failures.slice(0,25).join('\n'));process.exitCode=1;}
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
