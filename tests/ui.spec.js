const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const merchantContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await merchantContext.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push('PAGE '+(e.stack||e.message)));
  page.on('console',m=>{if(m.type()==='error' && !m.text().includes('401 (Unauthorized)'))errors.push('CONSOLE '+m.text())});
  const base='http://127.0.0.1:8080';
  await page.goto(base+'/',{waitUntil:'networkidle'});
  if(await page.locator('html').getAttribute('lang')!=='fa')throw Error('New visitors should see Persian by default');
  await page.locator('#pwyw-language-switch [data-lang=de]').click();
  if(!await page.locator('.hero h1').count() || !(await page.locator('.hero h1').innerText()).trim())
    throw Error('Branded landing headline missing');
  const valuePromise=await page.locator('.hero h1').innerText();
  if(!valuePromise.includes('Mehr Gäste.')||!valuePromise.includes('Spielen, die zu deinem Geschäft passen.'))
    throw Error('Landing fails to explain new budget/expert positioning: '+valuePromise);
  const paths=await page.locator('.operating-card .mode-action').all();
  if(paths.length!==2||!(await paths[0].getAttribute('href')).includes('mode=managed')||!(await paths[1].getAttribute('href')).includes('mode=expert'))
    throw Error('Merchant must be able to choose between the simple and professional path');
  const example=await page.locator('.journey-item').allInnerTexts();
  if(example.length!==3||!example.some(x=>x.includes('Wiederkommen')))
    throw Error('Concrete customer return journey missing: '+JSON.stringify(example));
  const commercialBenefits=await page.locator('.simple-goal-card h3').allInnerTexts();
  if(!commercialBenefits.some(x=>x.includes('Gäste kommen gern wieder'))||!commercialBenefits.some(x=>x.includes('Freunde empfehlen')))
    throw Error('Landing does not explain why a merchant benefits: '+JSON.stringify(commercialBenefits));
  const landing=await page.evaluate(()=>({
    steps:document.querySelectorAll('.simple-step').length,
    goals:document.querySelectorAll('.simple-goal-card').length,
    width:document.documentElement.scrollWidth,
    viewport:document.documentElement.clientWidth,
    actualDemo:document.querySelector('.hero-showcase a')?.getAttribute('href'),
    styles:[...document.styleSheets].some(x=>x.href?.includes('pwyw-sms-landing.css'))
  }));
  if(landing.steps!==3||landing.goals!==3||!landing.actualDemo?.startsWith('/play/')||!landing.styles)
    throw Error('Simplified landing structure missing: '+JSON.stringify(landing));
  if(landing.width>landing.viewport+4)throw Error('Landing overflows mobile: '+JSON.stringify(landing));
  const illustration=await page.locator('.showcase-art').evaluate(img=>({loaded:img.complete&&img.naturalWidth>0}));
  if(!illustration.loaded)throw Error('Landing mini-game illustration did not load');
  await page.locator('[data-preview=memory]').click();
  if(!(await page.locator('.showcase-art').getAttribute('src')).endsWith('/memory.svg'))throw Error('Interactive preview does not change artwork');
  if(await page.locator('[data-preview=memory]').getAttribute('aria-pressed')!=='true')throw Error('Preview selection not announced');
  const signupUrl=await page.locator('.hero-actions .button').getAttribute('href');
  if(!signupUrl?.includes('signup=1'))throw Error('Landing does not lead directly to registration');
  await page.goto(base+signupUrl,{waitUntil:'networkidle'});
  if(!await page.locator('#tab-signup').evaluate(el=>el.classList.contains('active')))
    throw Error('SMS traffic lands on sign-in instead of sign-up');
  // User-visible validation is not optional: failed authentication must show a real alert.
  await page.locator('#tab-login').click();
  await page.locator('#auth-form [name=email]').fill('pwyw-nonexistent-'+Date.now()+'@example.org');
  await page.locator('#auth-form [name=password]').fill('WrongPassword123!');
  await page.locator('#auth-submit').click();
  await page.locator('#auth-error').waitFor({state:'visible',timeout:12000});
  if(!(await page.locator('#auth-error').textContent()).trim())throw Error('Failed login alert is blank');
  await page.locator('#tab-signup').click();
  if(!await page.locator('.pw4-password-toggle').isVisible())throw Error('Password visibility control is missing');
  await page.locator('.pw4-password-toggle').click();
  if(await page.locator('#auth-form input[name=password]').getAttribute('type')!=='text')
    throw Error('Show-password action does not work');
  await page.locator('.pw4-password-toggle').click();
  if(await page.locator('#auth-form input[name=password]').getAttribute('type')!=='password')
    throw Error('Password must be hideable again');
  await page.goto(base+'/',{waitUntil:'networkidle'});
  await page.screenshot({path:'/tmp/pwyw-landing-mobile.png',fullPage:true});
  await page.locator('#pwyw-language-switch [data-lang=fa]').click();
  if(await page.locator('html').getAttribute('dir')!=='rtl')throw Error('Persian landing RTL missing');
  if(!/[\u0600-\u06FF]/.test(await page.locator('#how-heading').textContent()))
    throw Error('Three-step onboarding was not localized into Persian');
  if(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)>4)
    throw Error('Persian landing overflows the mobile viewport');
  if(!/[\u0600-\u06FF]/.test(await page.locator('.hero h1').textContent()))throw Error('Landing headline did not localize');

  const nativeHome=await page.locator('.hero h1').innerText();
  if(!nativeHome.includes('مشتری‌های بیشتر.')||!nativeHome.includes('با بازی‌هایی که به کسب‌وکارت می‌خورن.'))
    throw Error('Native Persian landing headline is missing: '+nativeHome);
  if(await page.title()!=='PWYW — پورتال بازی کسب‌وکار تو')
    throw Error('Browser title not localized in Persian');
  await page.screenshot({path:'/tmp/pwyw-landing-fa-mobile.png',fullPage:true});
  await page.locator('#pwyw-language-switch [data-lang=de]').click();
  await page.goto(base+'/demo',{waitUntil:'networkidle'});
  await page.locator('#pwyw-language-switch [data-lang=fa]').click();
  if(await page.locator('html').getAttribute('dir')!=='rtl')throw Error('Persian RTL mode missing');
  if(!/[\u0600-\u06FF]/.test(await page.locator('#game-heading').textContent()))throw Error('Persian game heading missing');
  // Regression: a requested Upsell mission must never silently become Learn.
  await page.goto(base+'/play/luna-cafe?objective=upsell&lang=fa',{waitUntil:'networkidle'});
  await page.locator('#load-overlay').waitFor({state:'hidden'});
  if(await page.locator('[data-objective=upsell]').getAttribute('aria-pressed')!=='true')
    throw Error('Upsell deep link incorrectly switched to another business objective');
  if(await page.locator('[data-objective=learn]').getAttribute('aria-pressed')==='true')
    throw Error('Upsell deep link displayed the learning quiz mission');
  // Arcade identity: featured image, theme, and mobile layout are real assets.
  const artwork=await page.locator('#featured-game-art').evaluate(img=>({
    src:img.getAttribute('src'),complete:img.complete,width:img.naturalWidth
  }));
  if(!artwork.src?.startsWith('/static/game-art/')||!artwork.complete||!artwork.width)
    throw Error('Featured illustration is missing: '+JSON.stringify(artwork));
  const mobileGeometry=await page.evaluate(()=>({
    viewport:document.documentElement.clientWidth,
    width:document.documentElement.scrollWidth,
    featured:document.querySelector('.featured-game').getBoundingClientRect().width
  }));
  if(mobileGeometry.width>mobileGeometry.viewport+3)
    throw Error('New arcade world overflows phone screen: '+JSON.stringify(mobileGeometry));
  if(mobileGeometry.featured<250)
    throw Error('Arcade game showcase is too narrow on mobile');
  // Premium calm redesign: the game, not decoration, is the visual focal point.
  const clearStart=await page.evaluate(()=>{
    const intro=document.querySelector('.campaign-intro'),featured=document.querySelector('.featured-game');
    const poster=document.querySelector('.featured-poster'),cta=document.getElementById('start-featured');
    const context=document.getElementById('campaign-context');
    return {
      title:document.getElementById('game-heading').textContent,
      layout:getComputedStyle(featured).display,
      introBackground:getComputedStyle(intro).backgroundColor,
      posterWidth:poster.getBoundingClientRect().width,
      callToAction:cta.getBoundingClientRect().height,
      contextCollapsed:!context.open,
      ornaments:getComputedStyle(document.body,'::before').display,
      posterShine:document.querySelector('.poster-shine')!==null,
    };
  });
  if(clearStart.posterWidth<250||clearStart.callToAction<50||!clearStart.contextCollapsed)
    throw Error('Simple primary-game journey is not focused: '+JSON.stringify(clearStart));
  if(clearStart.posterShine||clearStart.ornaments!=='none')
    throw Error('Decorative arcade clutter still visible: '+JSON.stringify(clearStart));
  await page.screenshot({path:'/tmp/pwyw-premium-calm-mobile.png',fullPage:true});
    // A curated default question and its unprefixed answers must be localized.
  const demoOption=await page.evaluate(()=>window.PWYWI18N?.t('Bring the requested documents'));
  if(demoOption!=='مدارک لازم رو همراهت بیار')
    throw Error('Demo quiz answers are not localized before numbering');
  await page.evaluate(()=>document.getElementById('finish-modal').hidden=false);
  const resultBg=await page.locator('.result-inside').evaluate(el=>getComputedStyle(el).backgroundColor);
  if(resultBg==='rgb(216, 255, 62)')throw Error('Unbranded neon result overlay still appears for Luna Coffee');
  if(await page.locator('#scoreboard-details').evaluate(e=>e.open))throw Error('Optional leaderboard must be collapsed by default');
  if(await page.locator('#nickname').isVisible())throw Error('Nickname entry should not appear without consent');
  await page.locator('#scoreboard-details summary').click();
  if(!await page.locator('#nickname').isVisible())throw Error('Optional leaderboard cannot be revealed');
  await page.locator('#scoreboard-details summary').click();
  await page.evaluate(()=>document.getElementById('finish-modal').hidden=true);
  const canvasCopy=await page.evaluate(()=>window.PWYWArcade?.uiText?.('TAP TO START'));
  if(canvasCopy!=='برای شروع روی صفحه بزن')throw Error('Canvas game UI did not localize to Persian: '+canvasCopy);

  const localizedGoal=await page.locator('[data-objective=refer]').innerText();
  if(!localizedGoal.includes('دعوت از دوستان'))throw Error('Customer-facing goal still reads as a literal business translation: '+localizedGoal);
  if(await page.locator('#all-games').evaluate(e=>e.open))throw Error('Full game library must be collapsed by default');
  if(!await page.locator('#start-featured').isVisible())throw Error('Featured-game primary CTA is missing');
  if(await page.locator('#game-choices [data-game=memory]').isVisible())throw Error('Other games should not compete with the featured game at first glance');
  await page.locator('#all-games summary').click();
  if(!await page.locator('#game-choices [data-game=memory]').isVisible())throw Error('Expanded game library is inaccessible');
  const thumbs=await page.locator('#game-choices .game-pick-poster img').evaluateAll(async images=>{
    // Lazy thumbnails below the fold should be tested after explicit image decoding.
    for(const img of images){img.loading='eager';await img.decode().catch(()=>{});}
    return images.map(img=>({src:img.getAttribute('src'),loaded:img.complete&&img.naturalWidth>0}));
  });
  if(thumbs.length!==10||thumbs.some(image=>!image.loaded)||new Set(thumbs.map(x=>x.src)).size!==10)
    throw Error('Games do not have ten unique working illustrations: '+JSON.stringify(thumbs));
  const desktop=await browser.newPage({viewport:{width:1440,height:900}});
  await desktop.goto(base+'/play/luna-cafe?objective=upsell&lang=de',{waitUntil:'networkidle'});
  await desktop.locator('#load-overlay').waitFor({state:'hidden'});
  const desktopWidth=await desktop.locator('.play-area').evaluate(node=>node.getBoundingClientRect().width);
  if(desktopWidth<900)throw Error('Desktop arcade still uses the old narrow phone column: '+desktopWidth);
  const desktopDisplay=await desktop.locator('.featured-game').evaluate(el=>getComputedStyle(el).display);
  if(desktopDisplay!=='grid')throw Error('Premium desktop primary game must use balanced media/editorial columns: '+desktopDisplay);
  if(await desktop.locator('#campaign-context').evaluate(el=>el.open))
    throw Error('Additional campaign explanation must stay collapsed by default');
  await desktop.screenshot({path:'/tmp/pwyw-lounge-desktop.png',fullPage:true});
  await desktop.close();
  const nativePicks=await page.locator('#game-choices').innerText();
  if(!nativePicks.includes('پیدا کردن جفت‌ها')||!nativePicks.includes('ستاره‌گیر')||!nativePicks.includes('حافظه تصویری'))
    throw Error('Game labels are not natural Persian: '+nativePicks);
  // Switching language must not re-expose business setup choices or close the list.
  await page.locator('#pwyw-language-switch [data-lang=de]').click();
  await page.locator('#load-overlay').waitFor({state:'hidden',timeout:12000});
  if(await page.locator('[data-game]').count()!==10)throw Error('Expected 10 game launchers');
  await page.screenshot({path:'/tmp/pwyw-lounge-mobile.png',fullPage:true});
  for(const mode of ['memory','merge','rush','snake','breaker','hop','orbit','bloom','lane','sequence']){
    await page.locator('[data-game="'+mode+'"]').click();
    if(await page.locator('body').getAttribute('data-world-game')!==mode)
      throw Error('Game world skin does not follow selected game: '+mode);
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
        if(!input || input.keyboardEvents<1){
          const info=await page.evaluate(()=>({
            body:document.body.className,
            active:window.PWYWArcade?.debugState?.(),
            buttons:[...document.querySelectorAll('#touch-controls button')].map(x=>({name:x.textContent,display:getComputedStyle(x).display})),
            board:document.querySelector('#game-board')?.innerText?.slice(0,100),
            gameVisible:!document.querySelector('#game-active')?.hidden,
            modalVisible:!document.querySelector('#finish-modal')?.hidden
          }));
          throw Error(mode+' ignored on-screen control touch: '+JSON.stringify(info));
        }
      }
    }
    if(mode==='orbit')await page.screenshot({path:'/tmp/pwyw-orbit-mobile.png'});
    if(mode==='lane')await page.screenshot({path:'/tmp/pwyw-lane-mobile.png'});
    await page.locator('#back-home').click();
    await page.locator('#game-home').waitFor({state:'visible'});
  }
  // Every campaign outcome is available on the first results screen, without a claim click.
  for(const objective of ['upsell','return','refer','learn']){
    await page.goto(base+'/play/luna-cafe?objective='+objective+'&lang=fa',{waitUntil:'networkidle'});
    await page.locator('#load-overlay').waitFor({state:'hidden'});
    await page.evaluate(()=>{
      const start=window.PWYWArcade.start;
      window.PWYWArcade.start=(mode,host)=>{start(mode,host);host.onFinish('Finished');};
    });
    await page.locator('#start-featured').click();
    await page.locator('#finish-modal').waitFor({state:'visible'});
    if(await page.locator('#claim-reward').isVisible())
      throw Error('Campaign '+objective+' requires a second click to claim an offer');
    if(objective==='learn'){
      await page.locator('#quiz-slot .quiz-answer').first().waitFor({state:'visible'});
      if(await page.locator('#reward-code').isVisible())
        throw Error('Learning experience should not issue a claim code');
    }else{
      await page.waitForFunction(()=>{
        const code=document.querySelector('#reward-code');
        return code && !code.hidden && code.getAttribute('aria-busy')==='false' && code.textContent.trim();
      });
      if(!await page.locator('#reward-code').isVisible())
        throw Error('Campaign '+objective+' did not reveal its code automatically');
      const sharingVisible=await page.locator('#referral-share').isVisible();
      if(sharingVisible !== (objective==='refer')){
        const debug=await page.evaluate(()=>({
          code:document.getElementById('reward-code').textContent,
          codePending:document.getElementById('reward-code').classList.contains('is-pending'),
          note:document.getElementById('reward-note').textContent,
          shareHidden:document.getElementById('referral-share').hidden,
          computed: getComputedStyle(document.getElementById('referral-share')).display,
          objective:document.querySelector('[data-objective][aria-pressed=true]')?.dataset.objective
        }));
        throw Error('Incorrect sharing controls for '+objective+': '+JSON.stringify(debug));
      }
    }
  }
  // Customers switch campaign by a direct objective link; owner-only objective tabs stay hidden.
  await page.goto(base+'/play/luna-cafe?objective=learn',{waitUntil:'networkidle'});
  await page.locator('#load-overlay').waitFor({state:'hidden'});
  if(await page.locator('#purpose-dial').isVisible())throw Error('Business configuration controls leaked into customer view');
  await page.locator('#all-games summary').click();
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
  await page.goto(base+'/admin',{waitUntil:'networkidle'});
  await page.locator('#pwyw-language-switch [data-lang=fa]').click();
  if(await page.locator('html').getAttribute('dir')!=='rtl')throw Error('Persian admin RTL missing');
  if(!await page.locator('link[href*="pwyw-unified.css"]').count())throw Error('Administrator does not share visual system');
  await page.locator('#pwyw-language-switch [data-lang=de]').click();
  // Admin information architecture is tested with isolated read-only API fixtures.
  const adminFixtures=[
    ['**/api/me',{role:'admin',email:'admin@example.org'}],
    ['**/api/admin/overview',{users:2,brands:2,active_campaigns:1,events_30d:{starts:12},claims:{total:5,redeemed:2}}],
    ['**/api/admin/users',[{email:'alpha@example.org',role:'merchant',brands:1},{email:'beta@example.org',role:'merchant',brands:1}]],
    ['**/api/admin/brands',[{name:'Luna Coffee',owner:'alpha@example.org',game_starts:4,redemptions:1},{name:'Garage',owner:'beta@example.org',game_starts:8,redemptions:1}]]
  ];
  for(const [pattern,payload] of adminFixtures){
    await page.route(pattern,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)}));
  }
  await page.reload({waitUntil:'networkidle'});
  await page.locator('#cr-app').waitFor({state:'visible'});
  if(!await page.locator('#cr-brands-panel').evaluate(e=>e.open))throw Error('Admin business overview is not available by default');
  if(await page.locator('#cr-users-panel').evaluate(e=>e.open))throw Error('Admin account directory is too prominent');
  if(await page.locator('#cr-stats>div').count()!==3)throw Error('Admin needs three clear top level KPIs');
  const adminCardRadius=await page.locator('#cr-stats>div').first().evaluate(el=>getComputedStyle(el).borderRadius);
  if(adminCardRadius==='0px')throw Error('Admin still renders legacy flat KPI tiles');
  await page.screenshot({path:'/tmp/pwyw-admin-mobile.png',fullPage:true});
  await page.locator('#cr-brand-search').fill('Garage');
  if(await page.locator('#cr-brands tbody tr:visible').count()!==1)throw Error('Admin business search not working');
  await page.locator('#cr-more-stats summary').click();
  if(!await page.locator('#cr-more-stats-content>div').first().isVisible())throw Error('Admin advanced metrics unavailable');
  for(const [pattern] of adminFixtures)await page.unroute(pattern);
  await page.goto(base+'/dashboard',{waitUntil:'networkidle'});
  await page.locator('#pwyw-language-switch [data-lang=fa]').click();
  if(await page.locator('html').getAttribute('lang')!=='fa')throw Error('Persian studio locale missing');
  const initialFaHeading=await page.locator('#merchant-goal-title').textContent();
  if(!initialFaHeading.includes('چه نتیجه‌ای')||/[A-Za-z]/.test(initialFaHeading))
    throw Error('Persian goal heading contains untranslated German copy: '+initialFaHeading);

  const studioCss=await page.evaluate(()=>[...document.styleSheets].some(x=>x.href?.includes('pwyw-unified.css')));
  if(!studioCss)throw Error('Merchant login not using shared site design');
  const faStudioHero=(await page.locator('.studio-auth-art h1').innerText()).replace(/\\s+/g,' ');
  if(!faStudioHero.includes('بودجه تو.') || !faStudioHero.includes('انتخاب تو.'))
    throw Error('Persian studio headline is grammatically broken: '+faStudioHero);
  await page.locator('#pwyw-language-switch [data-lang=de]').click();
  if((await page.locator('#merchant-goal-title').textContent())!=='Was möchtest du erreichen?')
    throw Error('German goal heading does not return after locale switch');
  await page.locator('#tab-signup').click();
  await page.locator('input[name=email]').fill('pwyw-e2e-'+Date.now()+'@example.org');
  await page.locator('input[name=password]').fill('StrongTestPassword123');
  await page.locator('#auth-submit').click();
  await page.locator('#app-shell').waitFor({state:'visible'});
  await page.locator('#studio-settings-overlay').waitFor({state:'visible'});
  await page.locator('#close-studio-settings').click();
  if(await page.locator('#legacy-campaigns').evaluate(x=>x.open))
    throw Error('Legacy campaign editor should not obscure reward rules');
  await page.locator('#legacy-campaigns > summary').click();
  // Native form language is the primary editor. Secondary copy remains editable, but hidden.
  await page.locator('#pwyw-language-switch [data-lang=fa]').click();
  if((await page.locator('#merchant-goal-title').textContent())!=='می‌خوای چه نتیجه‌ای بگیری؟')
    throw Error('Goal heading switched back to German in merchant view');
  await page.locator('[data-objective="return"]').first().click();
  if(await page.locator('#campaign-copy-primary #campaign-copy-fa').count()!==1)
    throw Error('Persian editor is not the primary campaign form');
  if(await page.locator('#campaign-copy-secondary #campaign-copy-de').count()!==1)
    throw Error('German content is not preserved in secondary editor');
  if(await page.locator('#campaign-alternate').evaluate(x=>x.open))
    throw Error('Secondary-language inputs should start collapsed');
  const faDefault=await page.locator('#campaign-fa-title').inputValue();
  if(!faDefault.includes('دفعه بعد'))throw Error('Persian campaign still displays German default instead of native text: '+faDefault);
  if(!await page.locator('#campaign-title').inputValue())throw Error('German campaign data was lost');
  // On a new account the campaign step stays hidden until the brand has been saved.
  // Check that rearranging its inputs does not erase a draft before that step opens.
  await page.locator('#campaign-fa-title').evaluate(el=>{
    el.value='پیشنهاد بازگشت مخصوص ما';
    el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.locator('#pwyw-language-switch [data-lang=de]').click();
  if(await page.locator('#campaign-copy-primary #campaign-copy-de').count()!==1)
    throw Error('German editor was not restored');
  await page.locator('#pwyw-language-switch [data-lang=fa]').click();
  if(await page.locator('#campaign-fa-title').inputValue()!=='پیشنهاد بازگشت مخصوص ما')
    throw Error('Language switching erased unsaved Persian edits');
  await page.locator('#pwyw-language-switch [data-lang=de]').click();
  await page.locator('#open-studio-settings').click();
  if(await page.locator('.ux-settings-tabs button').count()!==5)throw Error('Settings workspace must have five usable sections');
  if(!await page.locator('#brand-logo').evaluate(el=>el.closest('label')?.querySelector('.ux-upload-control')?.getClientRects().length>0))
    throw Error('Native English file input should have a localized upload control');
  await page.locator('#brand-name').fill('Playwright Garage');
  await page.locator('#brand-slug').fill('playwright-garage');
  await page.locator('[data-theme=neon]').click();
  await page.screenshot({path:'/tmp/pwyw-studio-mobile.png',fullPage:true});
  await page.locator('#brand-save').click();
  await page.locator('#reward-hub').waitFor({state:'visible',timeout:16000});
  await page.locator('#mc-view-home').waitFor({state:'visible'});
  await page.locator('#mc-autopilot').waitFor({state:'visible'});
  if(await page.locator('#mc-mode-managed').getAttribute('aria-pressed')!=='true')
    throw Error('Novice merchant should start with budget-first mode');
  if(!await page.locator('#mc-budget-range').isVisible())throw Error('No-skill budget gauge is missing');
  await page.locator('[data-mc-budget="1000000"]').click();
  await page.waitForFunction(()=>{
    const v=document.querySelector('#mc-est-awards')?.textContent||'';
    const ascii=v.replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[^0-9]/g,'');
    return Number(ascii)===40;
  },null,{timeout:10000});
  if(!await page.locator('#mc-est-assumptions-note').textContent().then(x=>x.includes('Beispiel')||x.includes('تخمین')))
    throw Error('Forecast is missing its non-guarantee notice');
  if(await page.locator('#mc-auto-activate').isEnabled())throw Error('Plan must require explicit estimate acknowledgement');
  await page.screenshot({path:'/tmp/pwyw-budget-autopilot-mobile.png',fullPage:true});
  // The authenticated merchant must be equally usable on desktop, not only a 390px phone.
  const merchantDesktop=await page.context().newPage();
  await merchantDesktop.setViewportSize({width:1365,height:900});
  await merchantDesktop.goto(base+'/dashboard?lang=de',{waitUntil:'networkidle'});
  await merchantDesktop.locator('#mc-autopilot').waitFor({state:'visible'});
  if(await merchantDesktop.evaluate(()=>document.documentElement.scrollWidth-innerWidth)>4)
    throw Error('Desktop merchant dashboard has horizontal overflow');
  if(!await merchantDesktop.locator('#mc-budget-range').isVisible())
    throw Error('Desktop merchant cannot access budget pilot');
  await merchantDesktop.locator('#mc-mode-expert').click();
  if(!await merchantDesktop.locator('#reward-overview').isVisible())
    throw Error('Desktop expert view hides the underlying business metrics');
  await merchantDesktop.screenshot({path:'/tmp/pwyw-merchant-desktop.png',fullPage:true});
  await merchantDesktop.close();
  await page.locator('#mc-mode-expert').click();
  if(!await page.locator('#reward-overview').isVisible())throw Error('Expert cannot access original real metrics');
  if(await page.locator('#mc-view-home .reward-hub-main').count())
    throw Error('Legacy reward template panels leaked into merchant home');
  if(await page.locator('#mc-rewards-slot .reward-hub-main').count()!==1)
    throw Error('Reward management panels were not relocated into rewards tab');
  if(!await page.locator('#reward-overview').isVisible())throw Error('Real 30-day metrics should be visible on merchant home');
  if(await page.locator('.mc-goals button').count()!==3)throw Error('Merchant home needs three practical reward goals');
  if(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)>4)throw Error('New merchant home overflows mobile');
  await page.locator('[data-mc-template="return"]').click();
  await page.locator('#mc-quick-create').waitFor({state:'visible'});
  if(await page.locator('#mc-quick-create').getAttribute('role')!=='dialog'||!await page.locator('#mc-wizard-backdrop').isVisible())
    throw Error('Quick reward editor must be a focused dialog with backdrop');
  if(await page.locator('#mc-wizard-form input').count()!==3)throw Error('Quick reward flow is not a three-field form');
  if(await page.locator('#mc-wizard-form input[name="budget"]').inputValue()!=='600000')
    throw Error('Quick reward budget is not whole toman');
  await page.locator('#mc-wizard-close').click();
  if(await page.locator('#mc-wizard-backdrop').isVisible())throw Error('Reward dialog backdrop did not close');
  await page.locator('#mc-bottom-nav [data-mc-view="rewards"]').click();
  if(await page.locator('#mc-heading').textContent()!=='Belohnungen')throw Error('Rewards tab heading is not contextual');
  await page.locator('#mc-new-rule').click();
  await page.locator('#mc-quick-create').waitFor({state:'visible'});
  await page.keyboard.press('Escape');
  if(await page.locator('#mc-quick-create').isVisible())throw Error('Escape must close quick reward dialog');
  if(await page.locator('#mc-template-panel').evaluate(el=>el.open))
    throw Error('Six reward templates must not all be expanded by default');
  await page.locator('#mc-template-panel summary').click();
  await page.locator('#rule-templates .reward-template').first().waitFor({state:'visible'});
  if(await page.locator('#rule-templates .reward-template').count()<5)throw Error('Reward templates missing');
  if(!await page.locator('#mc-portal-link').getAttribute('href').then(x=>x.includes('/play/playwright-garage')))
    throw Error('New merchant cannot open the customer portal');
  await page.locator('#rule-templates [data-template="welcome"]').click();
  if(await page.locator('#rule-advanced').evaluate(x=>x.open))throw Error('Advanced controls should start collapsed');
  if(!(await page.locator('#rule-preview-copy').textContent()).includes('Überraschung'))
    throw Error('Selected reward template preview is not meaningful');
  if(await page.locator('#rule-form input[name=reward_cost]').inputValue()!=='25000')
    throw Error('Reward cost should be whole toman');
  if(await page.locator('#rule-form input[name=budget]').inputValue()!=='500000')
    throw Error('Reward budget should be whole toman');
  await page.locator('#pwyw-language-switch [data-lang=fa]').click();
  await page.locator('#mc-bottom-nav [data-mc-view="home"]').click();
  const faHome=(await page.locator('#mc-shell').innerText());
  if(/Geschäftszentrale|Dein Geschäft heute|Dein nächster Schritt|Letzte 30 Tage|Details anzeigen|Wähle einen Einstieg|Mehr Gäste zum Spielen bringen|Spielportal ansehen/.test(faHome))
    throw Error('Persian merchant view still contains untranslated German interface: '+faHome.slice(0,500));
  await page.screenshot({path:'/tmp/pwyw-command-home-fa-mobile.png',fullPage:true});
  await page.locator('#mc-bottom-nav [data-mc-view="rewards"]').click();
  if((await page.locator('#mc-bottom-nav [data-mc-view="home"] span').innerText())!=='خانه')
    throw Error('Merchant navigation not localized into Persian');
  if(!(await page.locator('#rule-preview-copy').textContent()).includes('هدیه'))
    throw Error('Reward preview lacks Persian prize name');
  await page.locator('#pwyw-language-switch [data-lang=de]').click();
  await page.locator('#rule-form input[name=is_active]').check();
  await page.locator('#rule-save').click();
  await page.waitForFunction(()=>document.querySelector('#rule-list .reward-on')?.textContent.includes('Aktiv'));
  await page.waitForFunction(()=>document.querySelector('#reward-stat-rules')?.textContent?.trim()==='1');
  await page.locator('#mc-view-home').waitFor({state:'visible'});
  await page.locator('#mc-bottom-nav [data-mc-view="report"]').click();
  await page.locator('#reward-trends').waitFor({state:'visible'});
  if(await page.locator('#mc-heading').textContent()!=='Auswertung')throw Error('Report heading is duplicated instead of contextual');
  if(!await page.locator('#mc-report-insight').isVisible())throw Error('Empty rewards report lacks actionable next step');
  if(await page.locator('#reward-trend-bars .reward-trend-day').count()!==14)
    throw Error('Merchant activity report must show 14 days');
  await page.locator('#mc-bottom-nav [data-mc-view="home"]').click();
  await page.locator('[data-mc-template="return"]').click();
  await page.locator('#mc-quick-create').waitFor({state:'visible'});
  await page.locator('#mc-wizard-save').click();
  await page.waitForFunction(()=>document.querySelector('#reward-stat-rules')?.textContent?.trim()==='2');
  const publishedRules=await page.evaluate(async()=>{
    const r=await fetch('/api/public/brands/playwright-garage/reward-rules');return await r.json();
  });
  if(publishedRules.length!==2||!publishedRules.some(r=>r.rule_type==='first_play')||!publishedRules.some(r=>r.rule_type==='repeat_days'))
    throw Error('Both advanced and quick reward creation must persist');
  await page.locator('#mc-bottom-nav [data-mc-view="rewards"]').click();
  await page.locator('#mc-advanced-campaigns').click();
  await page.locator('#proposal-card').waitFor({state:'visible',timeout:18000});
  if(await page.locator('.purpose-option small').first().isHidden())
    throw Error('Merchant goal explanations are hidden again');
  // A simple result preview is shown by default; the full journey stays available on demand.
  if(await page.locator('#preview-steps').evaluate(x=>x.open))
    throw Error('Full journey should be collapsed for a first-time merchant');
  if(await page.locator('#studio-quick').isVisible())throw Error('Unpublished campaign must not show sharing actions');
  if(!await page.locator('#proposal-simple-offer').isVisible())throw Error('The concise offer is missing');
  if(!await page.locator('#try-real-game').isVisible())throw Error('Merchant cannot try a real sample game before publishing');
  if(!await page.locator('#try-real-game').getAttribute('href').then(x=>x.includes('/play/luna-cafe?objective=return')))
    throw Error('Game preview is not relevant to the selected goal');
  if(await page.locator('[data-objective="return"]').first().getAttribute('aria-pressed')!=='true')
    throw Error('Business goal was not selected');
  await page.screenshot({path:'/tmp/pwyw-merchant-compact-mobile.png',fullPage:true});
  if(await page.locator('#proposal-details').evaluate(x=>x.open))throw Error('Details must start collapsed');
  if(await page.locator('#customer-preview').isVisible().catch(()=>false))throw Error('Nested preview should be hidden by default');
  const qrLink=await page.locator('#qr-image').getAttribute('src');
  if(!qrLink.startsWith('/qr/playwright-garage.svg'))throw Error('Missing saved business QR');
  if(!await page.locator('#proposal-approve').isVisible())throw Error('Publish action must be immediately visible');
  if(!await page.locator('#proposal-reject').isVisible())throw Error('Alternative idea action must be visible');
  if(await page.locator('[data-customer-stage]').count()!==3)
    throw Error('Customer walkthrough needs exactly three steps');
  if(await page.locator('[data-customer-stage="2"]').getAttribute('aria-pressed')!=='true')
    throw Error('Postgame customer message must be previewed by default');
  const ownerReason=await page.locator('#proposal-owner-note').textContent();
  if(ownerReason.includes('قبل از انتشار باید مطمئن')||ownerReason.includes('solche Option')){
    throw Error('Merchant still receives an unhelpful stock warning');
  }
  if(await page.locator('#proposal-cta').textContent()==='دریافت کد پیشنهاد'){
    throw Error('Generic postgame CTA was not improved');
  }

  if(ownerReason.trim().length<35)
    throw Error('Merchant cannot understand the business goal behind this campaign');
  const previewResult=await page.locator('#proposal-product').textContent();
  if(!previewResult.trim())throw Error('Postgame offer preview has no content');
  await page.locator('#proposal-details > summary').click();
  if(!await page.locator('#customer-preview-caption').isVisible())throw Error('Expandable customer explanation did not open');
  await page.locator('#preview-steps summary').click();
  await page.locator('[data-customer-stage="0"]').click();
  if(!await page.locator('#customer-stage-start').isVisible())
    throw Error('Owner cannot see customer first-screen preview');
  if((await page.locator('#customer-welcome-title').textContent())!==(await page.locator('#proposal-title').textContent()))
    throw Error('Customer opening is not based on proposed campaign copy');
  await page.locator('[data-customer-stage="1"]').click();
  if(!await page.locator('#customer-stage-game').isVisible())
    throw Error('Owner cannot inspect game stage');
  await page.locator('[data-customer-stage="2"]').click();
  if(!await page.locator('#customer-stage-result').isVisible()||await page.locator('#customer-stage-start').isVisible())
    throw Error('Customer aftergame stage switching is broken');

  if(await page.locator('#studio-extra-tools').evaluate(x=>x.open))
    throw Error('Secondary settings must stay collapsed in the campaign flow');
  if(await page.locator('#manual-campaign-settings').evaluate(x=>x.open))
    throw Error('Campaign manual form must stay collapsed');
  if(await page.locator('#brand-settings').evaluate(x=>x.open))
    throw Error('Existing brand editor must stay collapsed');
  if(await page.locator('#studio-tools').evaluate(x=>x.open))
    throw Error('Analytics must stay collapsed');
  if(await page.locator('#campaign-section input:visible').count())
    throw Error('Campaign settings leaked into one-click assistant');
  // Rejecting a suggestion must generate a different draft without publishing it.
  const firstIdea=await page.locator('#proposal-title').textContent();
  await page.locator('#proposal-reject').click();
  await page.locator('#proposal-card').waitFor({state:'visible',timeout:18000});
  const secondIdea=await page.locator('#proposal-title').textContent();
  if(firstIdea===secondIdea)throw Error('Rejected suggestion was repeated');
  const beforeApprove=await page.evaluate(async()=>{
    const x=await fetch('/api/brands/playwright-garage/campaigns');return await x.json();
  });
  if(beforeApprove.length)throw Error('Draft campaign was published without confirmation');
  await page.locator('#proposal-approve').click();
  await page.locator('#proposal-published').waitFor({state:'visible',timeout:14000});
  const currentQuick=await page.locator('#quick-open').getAttribute('href');
  if(!currentQuick.includes('objective=return'))throw Error('Quick play link points to wrong campaign');
  if(!await page.locator('#mc-portal-link').isVisible())throw Error('New always-visible portal link is missing');
  await page.locator('#mc-bottom-nav [data-mc-view="share"]').click();
  if(!await page.locator('#reward-portal-share').isVisible())throw Error('QR sharing view is inaccessible');
  if(await page.locator('#reward-portal-share>summary').isVisible())throw Error('QR tab repeats an unnecessary disclosure header');
  if(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)>4)throw Error('Merchant QR view overflows mobile');
  await page.locator('#mc-bottom-nav [data-mc-view="rewards"]').click();
  if(!await page.locator('#proposal-open').getAttribute('href'))
    throw Error('Approved campaign has no share link');
  // The same business may select and publish another goal without losing the first.
  await page.locator('.purpose-option[data-objective=refer]').click();
  if(await page.locator('.purpose-option[data-objective=return]').getAttribute('aria-pressed')!=='true')
    throw Error('Selecting second goal deselected the first');
  if(await page.locator('.purpose-option[data-objective=refer]').getAttribute('aria-pressed')!=='true')
    throw Error('The second goal was not selected');
  await page.locator('#proposal-card').waitFor({state:'visible',timeout:18000});
  if(!await page.locator('#selected-goal-tabs').isVisible())
    throw Error('Multiple selected campaigns are not reviewable');
  if(!await page.locator('#try-real-game').getAttribute('href').then(h=>h.includes('objective=refer')))
    throw Error('Wrong game sample shown for the second goal');
  await page.locator('#proposal-approve').click();
  await page.locator('#proposal-published').waitFor({state:'visible',timeout:14000});
  const sharedGame=await page.locator('#quick-open').getAttribute('href');
  if(sharedGame.includes('objective='))throw Error('Multi-goal link must let customers choose from live goals');
  const twoPublished=await page.evaluate(async()=>{
    const r=await fetch('/api/brands/playwright-garage/campaigns');return await r.json()
  });
  if(!twoPublished.some(c=>c.objective==='return')||!twoPublished.some(c=>c.objective==='refer'))
    throw Error('Publishing a second goal removed the existing offer');
  await page.goto(new URL(sharedGame,base).href,{waitUntil:'networkidle'});
  await page.locator('#load-overlay').waitFor({state:'hidden'});
  if(await page.locator('#purpose-dial').isVisible())
    throw Error('The customer portal should not force marketing-goal selection');
  if(!await page.locator('#all-games').evaluate(x=>x.open))
    throw Error('All ten games should be immediately visible in portal mode');
  if(await page.locator('#game-choices .game-pick').count()!==10)
    throw Error('Portal is missing games');
  const featuredChoice=page.locator('#game-choices .game-pick.is-featured-duplicate');
  if(await featuredChoice.count()!==1||!await featuredChoice.isVisible())
    throw Error('All ten game choices must remain accessible, including the recommended game');
  const tileHeight=await page.locator('#game-choices .game-pick').first().evaluate(el=>el.getBoundingClientRect().height);
  if(tileHeight>215)throw Error('Game list still wastes mobile space: '+tileHeight);
  if(!await page.locator('#portal-offers').isVisible())
    throw Error('Published rewards are not visible in portal');
  await page.locator('#game-choices [data-game="rush"]').click();
  await page.locator('#back-home').click();
  if(!await page.locator('#all-games').evaluate(x=>x.open))
    throw Error('Player lost access to games after returning home');
  await page.goto(base+'/dashboard?lang=fa',{waitUntil:'networkidle'});
  await page.locator('#app-shell').waitFor({state:'visible'});

  await page.locator('#open-studio-settings').click();
  await page.locator('#security-settings>summary').click();
  if(!await page.locator('#password-change input').first().isVisible())
    throw Error('Account security is missing from expanded optional tools');
  await page.locator('#studio-tools>summary').click();
  await page.locator('#results-section').waitFor({state:'visible'});
  await page.locator('#manual-campaign-settings>summary').click();
  // Once a brand is saved, the editor must really work on a 390px touchscreen.
  await page.locator('[data-settings-lang=fa]').click();
  await page.locator('#campaign-copy-primary #campaign-fa-title').fill('باز هم به ما سر بزن');
  if(await page.locator('#campaign-copy-secondary #campaign-title').isVisible())
    throw Error('German inputs should be behind a disclosure in Persian mode');
  await page.locator('#campaign-alternate summary').click();
  if(!await page.locator('#campaign-title').isVisible())throw Error('Cannot edit German variant');
  await page.locator('#campaign-alternate summary').click();
  await page.locator('#campaign-advanced summary').click();
  if(!await page.locator('#campaign-margin').isVisible())throw Error('Advanced fields not accessible');
  await page.locator('#campaign-advanced summary').click();
  const horizontalOverflow=await page.evaluate(()=>document.querySelector('.studio-settings-dialog').scrollWidth-document.querySelector('.studio-settings-dialog').clientWidth);
  if(horizontalOverflow>4)throw Error('Studio overflows a phone screen by '+horizontalOverflow+'px');
  await page.locator('[data-settings-lang=de]').click();

  // Phone screen layout: security fields must be separate, QR must fit on screen.
  const security=await page.locator('#password-change input').evaluateAll(xs=>xs.map(x=>{const r=x.getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:r.width}}));
  if(security.length!==2||security[0].bottom>security[1].top-5)
    throw Error('Security password inputs overlap on mobile');
  const qr=await page.locator('#qr-image').evaluate(el=>{const r=el.getBoundingClientRect();return {w:r.width,left:r.left,right:r.right}});
  if(qr.w<110||qr.right>page.viewportSize().width+2||qr.left<0)throw Error('Mobile QR sizing is broken: '+JSON.stringify(qr));

  if(await page.locator('#studio-settings-overlay').isVisible())await page.locator('#close-studio-settings').click();
  await page.locator('#mc-bottom-nav [data-mc-view="home"]').click();
  await page.locator('[data-mc-go="redeem"]').click();
  if(!await page.locator('.reward-staff-tools').evaluate(el=>el.open))throw Error('Redemption shortcut must open the verification tool');
  if(!await page.locator('#rule-redeem-code').isVisible())throw Error('Redemption must be usable on mobile');
  await page.locator('#pwyw-language-switch [data-lang=fa]').click();
  if((await page.locator('#mc-bottom-nav [data-mc-view="home"] span').innerText())!=='خانه')throw Error('Navigation not localized');
  await page.locator('#pwyw-language-switch [data-lang=de]').click();
  if((await page.locator('#mc-bottom-nav [data-mc-view="home"] span').innerText())!=='Start')throw Error('German navigation not restored');
  const logoutColors=await page.locator('#logout').evaluate(el=>({ink:getComputedStyle(el).color,paper:getComputedStyle(el).backgroundColor}));
  if(logoutColors.ink===logoutColors.paper)throw Error('Logout text invisible');
  const url=await page.locator('#open-play').getAttribute('href');
  if(new URL(url,base).pathname!=='/play/playwright-garage')throw Error('New brand not saved');
  // Existing customer campaign now comes from the owner-approved suggestion.
  const campaignLive=await page.evaluate(async()=>{const r=await fetch('/api/brands/playwright-garage/campaigns');return await r.json()});
  if(!campaignLive.some(c=>c.objective==='return'&&c.title))throw Error('Approval did not persist actual campaign');
  if(!['bloom','merge','hop'].includes(campaignLive.find(c=>c.objective==='return').game))throw Error('Unexpected suggested game');
  await page.locator('#mc-bottom-nav [data-mc-view="home"]').click();
  await page.locator('#mc-mode-managed').click();
  await page.locator('[data-mc-budget="500000"]').click();
  await page.waitForFunction(()=>document.querySelector('#mc-est-revenue')?.textContent!=='—');
  await page.locator('#mc-auto-confirm').check();
  await page.locator('#mc-auto-replace').check();
  if(!await page.locator('#mc-auto-activate').isEnabled())throw Error('Explicitly approved beginner plan cannot activate');
  await page.locator('#mc-auto-activate').click();
  await page.waitForFunction(()=>!document.querySelector('#mc-auto-live').hidden,{timeout:15000});
  const managed=await page.evaluate(async()=>await (await fetch('/api/brands/playwright-garage/managed-program')).json());
  if(managed.program?.effective_status!=='active'||managed.program.budget_toman!==500000)
    throw Error('Managed 30-day budget plan was not saved');
  await page.locator('#mc-auto-pause').click();
  await page.waitForFunction(()=>document.querySelector('#mc-auto-pause').hidden,{timeout:15000});
  if(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)>4)
    throw Error('Budget gauge causes horizontal scrolling');
  const campaignUrl=new URL(url,base);campaignUrl.searchParams.set('objective','return');
  await page.goto(campaignUrl.href,{waitUntil:'networkidle'});
  await page.locator('#load-overlay').waitFor({state:'hidden'});
  if(!await page.locator('body.theme-neon').count())throw Error('Neon brand skin missing');
  if(!(await page.locator('#game-business').textContent()).includes('PLAYWRIGHT GARAGE'))throw Error('Brand identity missing');
  if(!/Return|Wiederkommen|بازگشت/.test(await page.locator('#purpose-title').textContent()))throw Error('Outcome selection missing');
  // Test server-side claim issuance directly (games cannot be completed instantly).
  const issued=await page.evaluate(async()=>{const sid='pwuybrowserfaketest1';
    const r=await fetch('/api/public/brands/playwright-garage/campaigns/return/claim',{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({sid})});return {status:r.status,body:await r.json()}});
  if(issued.status!==200||!issued.body.code.startsWith('PW'))throw Error('Merchant claim issuance failed');
  if(errors.length)throw Error('Browser runtime errors: '+errors.join(' | ').slice(0,1600));
  console.log('PASS: branded landing, 10 playable game modes, 4 objective UI, business signup, branding, campaign publishing, merchant claim issuance.');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
