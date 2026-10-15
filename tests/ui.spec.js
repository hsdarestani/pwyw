const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('pageerror',e=>errors.push('PAGE '+(e.stack||e.message)));
  page.on('console',m=>{if(m.type()==='error' && !m.text().includes('401 (Unauthorized)'))errors.push('CONSOLE '+m.text())});
  const base='http://127.0.0.1:8080';
  await page.goto(base+'/',{waitUntil:'networkidle'});
  if(!await page.locator('.hero h1').count() || !(await page.locator('.hero h1').innerText()).trim())
    throw Error('Branded landing headline missing');
  await page.screenshot({path:'/tmp/pwyw-landing-mobile.png',fullPage:true});
  await page.goto(base+'/demo',{waitUntil:'networkidle'});
  await page.locator('#load-overlay').waitFor({state:'hidden',timeout:12000});
  if(await page.locator('[data-game]').count()!==10)throw Error('Expected 10 game launchers');
  await page.screenshot({path:'/tmp/pwyw-lounge-mobile.png',fullPage:true});
  for(const mode of ['memory','merge','rush','snake','breaker','hop','orbit','bloom','lane','sequence']){
    await page.locator('[data-game="'+mode+'"]').click();
    if(mode==='memory'){
      if(await page.locator('.memory-tile').count()!==16)throw Error('Memory board count wrong');
      await page.locator('.memory-tile').nth(0).click();
    }else if(mode==='merge'){
      if(await page.locator('.merge-cell').count()!==16)throw Error('2048 board count wrong');
      await page.locator('#touch-controls button').first().tap();
    }else if(mode==='rush'){
      if(await page.locator('.rush-pad').count()!==9)throw Error('Quick tap count wrong');
      await page.locator('.rush-pad.active').click();
    }else{
      await page.locator('#game-board canvas').waitFor({state:'visible'});
      const area=await page.locator('#game-board canvas').boundingBox();
      await page.touchscreen.tap(area.x+area.width*.48,area.y+area.height*.48);
      const touch=await page.evaluate(()=>window.PWYWArcade?.debugState?.());
      if(!touch||touch.mode!==mode||touch.pointerEvents<1)
        throw Error('Mobile Canvas game failed to register actual touch: '+mode);
      await page.waitForTimeout(180);
    }
    if(['snake','merge','orbit','breaker','hop','lane','sequence'].includes(mode)){
      const touchKeys=page.locator('#touch-controls .touch-key');
      if(await touchKeys.count()<1)throw Error(mode+' is missing mobile controls');
      await touchKeys.first().tap();
      await page.waitForTimeout(120);
      if(!['merge'].includes(mode)){
        const input=await page.evaluate(()=>window.PWYWArcade?.debugState?.());
        if(!input || input.keyboardEvents<1)throw Error(mode+' ignored on-screen control touch');
      }
    }
    if(mode==='orbit')await page.screenshot({path:'/tmp/pwyw-orbit-mobile.png'});
    if(mode==='lane')await page.screenshot({path:'/tmp/pwyw-lane-mobile.png'});
    await page.locator('#back-home').click();
    await page.locator('#game-home').waitFor({state:'visible'});
  }
  await page.locator('[data-objective="learn"]').click();
  await page.locator('[data-game="rush"]').click();
  await page.waitForTimeout(150);
  await page.locator('#back-home').click();
  // Phone widths below 390px must not shift the entire page horizontally.
  await page.setViewportSize({width:320,height:700});
  await page.goto(base+'/demo',{waitUntil:'networkidle'});
  await page.locator('#load-overlay').waitFor({state:'hidden'});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  if(overflow>4)throw Error('Mobile viewport has horizontal overflow: '+overflow);
  await page.setViewportSize({width:390,height:844});
  await page.goto(base+'/dashboard',{waitUntil:'networkidle'});
  await page.locator('#tab-signup').click();
  await page.locator('input[name=email]').fill('pwyw-e2e-'+Date.now()+'@example.org');
  await page.locator('input[name=password]').fill('StrongTestPassword123');
  await page.locator('#auth-submit').click();
  await page.locator('#app-shell').waitFor({state:'visible'});
  await page.locator('[data-objective="return"]').first().click();
  await page.locator('#brand-name').fill('Playwright Garage');
  await page.locator('#brand-slug').fill('playwright-garage');
  await page.locator('[data-theme=neon]').click();
  await page.screenshot({path:'/tmp/pwyw-studio-mobile.png',fullPage:true});
  await page.locator('#brand-save').click();
  await page.locator('#results-section').waitFor({state:'visible'});
  const url=await page.locator('#open-play').getAttribute('href');
  if(url!=='/play/playwright-garage')throw Error('New brand not saved');
  await page.locator('#campaign-title').fill('Your next visit starts here');
  await page.locator('#campaign-game').selectOption('bloom');
  await page.locator('#campaign-product').fill('Next visit');
  await page.locator('#campaign-offer').fill('Return with this staff-verified code');
  await page.locator('#campaign-save').click();
  await page.waitForFunction(()=>document.querySelector('#campaign-status')?.textContent.includes('Live.'),null,{timeout:8000});
  await page.goto(base+url+'?objective=return',{waitUntil:'networkidle'});
  await page.locator('#load-overlay').waitFor({state:'hidden'});
  if(!await page.locator('body.theme-neon').count())throw Error('Neon brand skin missing');
  if(!(await page.locator('#game-business').textContent()).includes('PLAYWRIGHT GARAGE'))throw Error('Brand identity missing');
  if(!(await page.locator('#purpose-title').textContent()).includes('Return'))throw Error('Outcome selection missing');
  // Test server-side claim issuance directly (games cannot be completed instantly).
  const issued=await page.evaluate(async()=>{const sid='pwuybrowserfaketest1';
    const r=await fetch('/api/public/brands/playwright-garage/campaigns/return/claim',{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({sid})});return {status:r.status,body:await r.json()}});
  if(issued.status!==200||!issued.body.code.startsWith('PW'))throw Error('Merchant claim issuance failed');
  if(errors.length)throw Error('Browser runtime errors: '+errors.join(' | ').slice(0,1600));
  console.log('PASS: branded landing, 10 playable game modes, 4 objective UI, business signup, branding, campaign publishing, merchant claim issuance.');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
