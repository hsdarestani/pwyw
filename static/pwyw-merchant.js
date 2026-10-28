/* PWYW Merchant Command Center. Presentation + one safe quick-create path, no fake revenue attribution. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const root=$('reward-hub'),shell=$('mc-shell');
 if(!root||!shell)return;
 const views=['home','rewards','report','share'];
 // Respect chosen locale before the DOMContentLoaded i18n render.
 const fa=()=>window.PWYWI18N?.locale?.()==='fa'||(!window.PWYWI18N&&document.documentElement.lang==='fa');
 const tr=(f,d)=>fa()?f:d;
 const norm=value=>String(value||'').replace(/[۰-۹]/g,c=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c));
 const count=id=>Number(norm($(id)?.textContent).replace(/[^0-9]/g,''))||0;
 const readable=n=>Number(n||0).toLocaleString(fa()?'fa-IR':'de-DE');
 const scope=(id)=>$(id);
 let active='home',slug='',selectedTemplate=null,templates=null,busy=false;
 const relocate=(id,slot)=>{const node=$(id),parent=$(slot);if(node&&parent)parent.append(node)};
 function mount(){
  if(root.classList.contains('mc-ready'))return;
  relocate('reward-overview','mc-metrics-slot');
  // The original node is a CLASS, not an ID: move the entire legacy block.
  const legacyMain=root.querySelector('.reward-hub-main');
  if(legacyMain){
   const panels=[...legacyMain.querySelectorAll(':scope > .reward-panel')];
   if(panels.length===2){
    const [templatesPanel,livePanel]=panels;
    const disclosure=document.createElement('details');
    disclosure.id='mc-template-panel';disclosure.className='mc-template-panel';
    const label=document.createElement('summary');
    label.dataset.fa='دیدن پیشنهادهای آماده';
    label.dataset.de='Belohnungsvorlagen ansehen';
    label.textContent='دیدن پیشنهادهای آماده';
    disclosure.append(label,templatesPanel);
    legacyMain.replaceChildren(livePanel,disclosure);
   }
   $('mc-rewards-slot').append(legacyMain);
  }
  relocate('reward-action-status','mc-rewards-slot');
  relocate('rule-editor','mc-rewards-slot');
  const staff=root.querySelector('.reward-staff-tools');
  if(staff)scope('mc-rewards-slot').append(staff);
  const note=root.querySelector('.reward-footnote');
  if(note)scope('mc-rewards-slot').append(note);
  relocate('reward-trends','mc-report-slot');
  relocate('reward-portal-share','mc-share-slot');
  // Quick activation is a focused dialog, accessible from any tab.
  const backdrop=document.createElement('div');
  backdrop.id='mc-wizard-backdrop';backdrop.className='mc-wizard-backdrop';backdrop.hidden=true;
  backdrop.setAttribute('aria-hidden','true');
  const wizard=$('mc-quick-create');
  wizard.setAttribute('role','dialog');wizard.setAttribute('aria-modal','true');
  wizard.setAttribute('tabindex','-1');
  wizard.setAttribute('aria-label','ساخت جایزه');
  root.append(backdrop,wizard);
  backdrop.addEventListener('click',closeWizard);
  document.addEventListener('keydown',e=>{
    if(wizard.hidden)return;
    if(e.key==='Escape'){e.preventDefault();closeWizard();return}
    if(e.key!=='Tab')return;
    const controls=Array.from(wizard.querySelectorAll('button,input,select,textarea'))
      .filter(el=>!el.disabled&&el.getClientRects().length>0);
    if(!controls.length)return;
    const first=controls[0],last=controls.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  });
  const actions=document.createElement('div');actions.className='mc-head-actions';
  const settings=$('open-studio-settings');
  shell.querySelector('.mc-headrow')?.append(actions);
  actions.append($('mc-portal-link'));
  root.classList.add('mc-ready');
  shell.hidden=false;
  bind();
  // Sharing belongs to the QR tab; don't duplicate it as another home card.
  shell.querySelector('.mc-shortcuts [data-mc-go="share"]')?.remove();
  setView('home',false);
  updateBrand();
  updateStatus();
  applyLocale();
  document.addEventListener('DOMContentLoaded',applyLocale,{once:true});
  const metrics=['reward-stat-plays','reward-stat-rules','reward-stat-issued','reward-stat-liability'].map($).filter(Boolean);
  const observer=new MutationObserver(()=>{updateStatus()});
  for(const el of metrics)observer.observe(el,{childList:true,characterData:true,subtree:true});
 }
 function setView(next,scroll=true){
  if(!views.includes(next))return;
  active=next;
  for(const name of views)scope('mc-view-'+name).hidden=name!==next;
  root.dataset.mcView=next;
  shell.querySelectorAll('[data-mc-view]').forEach(button=>{
   const on=button.dataset.mcView===next;
   button.setAttribute('aria-pressed',String(on));
   button.classList.toggle('is-current',on);
  });
  if(next==='share'){const share=$('reward-portal-share');if(share)share.open=true}
  if(next==='report'){const trends=$('reward-trends');if(trends)trends.open=true}
  updateHeader();
  if(scroll)scrollToTop();
 }
 function updateHeader(){
  const brand=window.PWYWStudio?.getBrand?.();
  const label=brand?.name||'PWYW';
  const titles={
   home:tr(label,label),
   rewards:tr('جایزه‌ها','Belohnungen'),
   report:tr('گزارش عملکرد','Auswertung'),
   share:tr('لینک و QR','Link & QR')
  };
  const subtitles={
   home:tr('مدیریت روزانه '+label,'Deine Geschäftsübersicht · '+label),
   rewards:tr('برای '+label,'Für '+label),
   report:tr(label+' · نتایج ثبت‌شده',label+' · erfasste Ergebnisse'),
   share:tr('پورتال مشتریان '+label,'Kundenportal '+label)
  };
  $('mc-heading').textContent=titles[active];
  $('mc-brand-name').textContent=subtitles[active];
 }
 function closeWizard(){
  $('mc-quick-create').hidden=true;
  $('mc-wizard-backdrop').hidden=true;
  document.body.classList.remove('mc-dialog-open');
  selectedTemplate=null;
  const previous=window.__mcFocusReturn;
  if(previous?.isConnected)previous.focus({preventScroll:true});
 }
 function scrollToTop(){const y=shell.getBoundingClientRect().top+window.scrollY-12;window.scrollTo({top:Math.max(0,y),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
 function updateBrand(){
  const brand=window.PWYWStudio?.getBrand?.();
  slug=brand?.slug||'';
  document.body.classList.toggle('mc-active',Boolean(slug));
  const settings=$('open-studio-settings');
  const container=shell.querySelector('.mc-head-actions');
  if(settings&&container){
   if(slug){
    if(settings.parentElement!==container)container.append(settings);
    settings.textContent=tr('تنظیمات','Einstellungen');
    settings.setAttribute('aria-label',tr('تنظیمات کسب‌وکار','Geschäftseinstellungen'));
   }
   else if(!slug){const original=document.querySelector('.studio-intro .studio-top-actions');if(original&&settings.parentElement!==original)original.append(settings)}
  }
  updateHeader();
  const path=slug?'/play/'+encodeURIComponent(slug):'/demo';
  const url=new URL(path,location.origin);
  if(fa())url.searchParams.set('lang','fa');
  $('mc-portal-link').href=url.pathname+url.search;
  if(!slug){scope('mc-status-title').textContent=tr('اول کسب‌وکارت رو بساز','Erstelle zuerst dein Geschäft');}
 }
 function updateStatus(){
  if(!scope('reward-stat-rules'))return;
  const live=count('reward-stat-rules'),plays=count('reward-stat-plays'),issued=count('reward-stat-issued');
  const title=$('mc-status-title'),desc=$('mc-status-description'),btn=$('mc-main-cta');
  if(live===0){
   title.textContent=tr('بازی‌هات آماده‌ان؛ حالا جایزه فعال کن','Deine Spiele sind bereit. Aktiviere eine Belohnung.');
   desc.textContent=plays?tr(readable(plays)+' بازی ثبت شده، ولی هنوز جایزه فعالی نداری. یک هدیه کوچک تعریف کن.','Es gab '+readable(plays)+' Spiele, aber noch keine aktive Belohnung.'):
     tr('با یک جایزه ساده شروع کن تا مشتری‌ها دلیل خوبی برای بازی داشته باشن.','Starte mit einer kleinen Belohnung, die Gäste zum Spielen motiviert.');
   btn.textContent=tr('ساخت اولین جایزه','Erste Belohnung erstellen');
  }else{
   title.textContent=tr(readable(live)+' قانون جایزه فعاله',''+readable(live)+' Belohnungsregeln sind aktiv');
   desc.textContent=tr(readable(issued)+' جایزه در ۳۰ روز گذشته صادر شده. می‌تونی قوانین رو تغییر بدی یا متوقف کنی.',
     readable(issued)+' Belohnungen wurden in den letzten 30 Tagen ausgegeben. Du kannst Regeln bearbeiten oder pausieren.');
   btn.textContent=tr('مدیریت جایزه‌ها','Belohnungen verwalten');
  }
  const cards=[
   [tr('بازی تکمیل‌شده','Abgeschlossene Spiele'),$('reward-stat-plays')?.textContent||'۰'],
   [tr('جایزه صادرشده','Ausgegebene Preise'),$('reward-stat-issued')?.textContent||'۰'],
   [tr('قانون فعال','Aktive Regeln'),$('reward-stat-rules')?.textContent||'۰'],
   [tr('هزینه تخمینی جایزه','Geschätzte Prämienkosten'),$('reward-stat-liability')?.textContent||'۰']
  ];
  const insight=$('mc-report-insight'),copy=$('mc-report-insight-copy');
  if(insight&&copy){
   insight.hidden=live>0&&issued>0;
   copy.textContent=live===0?tr(
    readable(plays)+' بازی ثبت شده اما هنوز جایزه فعالی وجود نداره. برای سنجش بازگشت مشتری، اول یک جایزه مشخص کن.',
    readable(plays)+' Spiele registriert, aber noch keine aktive Belohnung. Starte mit einer Belohnung, um Rückkehr messbar zu machen.'):
    tr('قانون فعال داری؛ وقتی اولین جایزه صادر بشه، استفاده از جایزه هم قابل بررسی می‌شه.',
    'Du hast aktive Regeln. Sobald die erste Prämie ausgegeben wurde, wird die Einlösung messbar.');
  }
  const redeem=shell.querySelector('.mc-shortcuts [data-mc-go="redeem"]');
  if(redeem)redeem.hidden=live===0;
  const summary=$('mc-report-numbers');
  if(summary){
   summary.replaceChildren();
   for(const [label,value] of cards){
    const item=document.createElement('div');
    const small=document.createElement('span');small.textContent=label;
    const strong=document.createElement('strong');strong.textContent=value;
    item.append(small,strong);summary.append(item);
   }
  }
 }
 function applyLocale(){
  root.querySelectorAll('[data-fa][data-de]').forEach(el=>{
   const value=el.dataset[fa()?'fa':'de'];
   if(el.textContent!==value)el.textContent=value;
  });
  updateBrand();updateStatus();
  if(selectedTemplate)renderWizardTitle();
  renderEstimate();
 }
 function renderWizardTitle(){
  const t=selectedTemplate;if(!t)return;
  $('mc-wizard-title').textContent=fa()?(t.title_fa||t.title):t.title;
 }
 async function getTemplates(){
  if(templates)return templates;
  const r=await fetch('/api/reward-rule-templates',{credentials:'same-origin'});
  if(!r.ok)throw Error(tr('پیشنهادها بارگذاری نشدن. دوباره امتحان کن.','Vorlagen konnten nicht geladen werden.'));
  templates=await r.json();return templates;
 }
 async function openTemplate(key){
  if(busy)return;
  const cards=shell.querySelectorAll('[data-mc-template]');
  cards.forEach(b=>b.disabled=true);
  try{
   const list=await getTemplates(),found=list.find(x=>x.key===key);
   if(!found)throw Error(tr('این پیشنهاد پیدا نشد.','Diese Vorlage ist nicht verfügbar.'));
   selectedTemplate=found;
   const form=$('mc-wizard-form');
   form.elements.prize.value=fa()?(found.reward_title_fa||found.reward_title):found.reward_title;
   form.elements.cost.value=found.reward_cost_cents;
   form.elements.budget.value=found.budget_cents;
   $('mc-wizard-error').textContent='';
   window.__mcFocusReturn=document.activeElement;
   $('mc-wizard-backdrop').hidden=false;
   $('mc-quick-create').hidden=false;
   document.body.classList.add('mc-dialog-open');
   renderWizardTitle();renderEstimate();
   form.elements.prize.focus({preventScroll:true});
  }catch(err){$('mc-status-description').textContent=err.message}
  finally{cards.forEach(b=>b.disabled=false)}
 }
 function renderEstimate(){
  const form=$('mc-wizard-form'),cost=Number(form.elements.cost.value||0),budget=Number(form.elements.budget.value||0);
  const n=cost>0?Math.min(100,Math.floor(budget/cost)):20;
  $('mc-prize-estimate').textContent=budget>0&&n>0?
   tr('با این بودجه حداکثر '+readable(n)+' جایزه قابل صدوره؛ تأیید و استفاده از جایزه جداگانه ثبت می‌شه.',
     'Bis zu '+readable(n)+' Prämien sind mit diesem Budget möglich. Einlösungen werden separat erfasst.'):
   tr('بودجه باید حداقل برابر هزینه یک جایزه باشه.','Das Budget muss mindestens einen Preis abdecken.');
 }
 async function saveQuick(e){
  e.preventDefault();if(busy||!selectedTemplate||!slug)return;
  const form=e.currentTarget,prize=form.elements.prize.value.trim(),cost=Number(form.elements.cost.value),budget=Number(form.elements.budget.value);
  const error=$('mc-wizard-error'),button=$('mc-wizard-save');
  if(!prize||!Number.isSafeInteger(cost)||!Number.isSafeInteger(budget)||cost<0||budget<=0||(cost>budget)){
   error.textContent=tr('نام جایزه و بودجه رو درست وارد کن؛ بودجه نباید از هزینه یک جایزه کمتر باشه.','Prüfe Prämie und Budget.');
   return;
  }
  busy=true;button.disabled=true;error.textContent='';
  const t=selectedTemplate;
  const cap=cost?Math.floor(budget/cost):20;
  const body={title:fa()?(t.title_fa||t.title):t.title,rule_type:t.rule_type,
   game:t.game,period:t.period,target_count:t.target_count,reward_title:prize,
   delivery:t.delivery,reward_cost_cents:cost,budget_cents:budget,
   max_awards:Math.max(1,Math.min(100,t.max_awards||20,cap)),is_active:true,currency:'IRT'};
  try{
   const r=await fetch('/api/brands/'+encodeURIComponent(slug)+'/reward-rules',{
    method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   const data=await r.json().catch(()=>({}));
   if(!r.ok)throw Error(typeof data.detail==='string'?data.detail:tr('ذخیره انجام نشد.','Speichern fehlgeschlagen.'));
   closeWizard();form.reset();
   const status=$('mc-action-status');
   if(status)status.textContent=tr('جایزه فعال شد. کد QR رو برای مشتری‌هات به اشتراک بذار.','Belohnung aktiviert. Teile jetzt deinen QR-Code.');
   await window.PWYWRewardStudio?.refresh?.();
   setView('rewards');
  }catch(err){error.textContent=err.message}
  finally{busy=false;button.disabled=false}
 }
 function openAdvanced(){
  setView('rewards');
  const disclosure=$('mc-template-panel');if(disclosure)disclosure.open=true;
  const btn=$('rule-templates')?.querySelector('[data-template="'+(selectedTemplate?.key||'welcome')+'"]');
  if(btn)btn.click();
  else $('rule-from-scratch')?.click();
  $('rule-editor')?.scrollIntoView({behavior:'smooth',block:'start'});
 }
 function openLegacy(){
  const legacy=$('legacy-campaigns');if(!legacy)return;
  legacy.classList.add('mc-unlocked');legacy.open=true;
  legacy.scrollIntoView({behavior:'smooth',block:'start'});
 }
 function copyLink(){
  const url=$('mc-portal-link').href;
  if(navigator.clipboard?.writeText){
    navigator.clipboard.writeText(url).then(()=>{const node=$('reward-share-status');if(node)node.textContent=tr('لینک کپی شد','Link kopiert')}).catch(()=>setView('share'));
  }else setView('share');
 }
 function bind(){
  shell.querySelectorAll('[data-mc-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.mcView)));
  shell.querySelectorAll('[data-mc-go]').forEach(button=>button.addEventListener('click',()=>{
   const to=button.dataset.mcGo;
   if(to==='redeem'){
    setView('rewards');const el=root.querySelector('.reward-staff-tools');
    if(el){el.open=true;el.scrollIntoView({behavior:'smooth',block:'start'})}
   }else setView(to);
  }));
  shell.querySelectorAll('[data-mc-template]').forEach(button=>button.addEventListener('click',()=>openTemplate(button.dataset.mcTemplate)));
  $('mc-main-cta').addEventListener('click',()=>count('reward-stat-rules')>0?setView('rewards'):openTemplate('welcome'));
  $('mc-wizard-form').addEventListener('submit',saveQuick);
  $('mc-wizard-form').addEventListener('input',renderEstimate);
  $('mc-wizard-close').addEventListener('click',closeWizard);
  $('mc-wizard-advanced').addEventListener('click',openAdvanced);
  $('mc-new-rule').addEventListener('click',()=>openTemplate('welcome'));
  $('mc-report-insight-cta').addEventListener('click',()=>openTemplate('welcome'));
  $('mc-advanced-campaigns').addEventListener('click',openLegacy);
  document.addEventListener('pwyw:brand-selected',e=>{
   slug=e.detail?.slug||'';templates=null;selectedTemplate=null;
   closeWizard();setView('home',false);updateBrand();updateStatus();
  });
  document.addEventListener('pwyw:language-changed',applyLocale);
  document.addEventListener('pwyw:reward-saved',()=>{updateStatus();setView('home')});
 }
 mount();
})();