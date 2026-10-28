/* PWYW budget-first merchant journey. No simulated numbers are presented as observed sales. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const panel=$('mc-autopilot');if(!panel)return;
 const fa=()=>window.PWYWI18N?.locale?.()==='fa';
 const t=(faText,de)=>fa()?faText:de;
 const money=n=>Math.round(Number(n)||0).toLocaleString(fa()?'fa-IR':'de-DE');
 const goalNames={welcome:['اولین بازی','Erstes Spiel'],return:['بازگشت مشتری','Wiederkehr'],refer:['معرفی دوست','Empfehlung']};
 const defaults={monthly_reach:500,average_basket_toman:250000,gross_margin_percent:35,participation_percent:28,qualification_percent:24,redemption_percent:55,incremental_purchase_percent:35};
 let slug='',mode='managed',goal='welcome',budget=500000,preview=null,program=null,requestSeq=0,previewTimer=0,busy=false,ready=false;
 function setText(id,text){const el=$(id);if(el&&el.textContent!==text)el.textContent=text}
 function localized(){
  panel.querySelectorAll('[data-aria-fa][data-aria-de]').forEach(el=>el.setAttribute('aria-label',el.dataset[fa()?'ariaFa':'ariaDe']));
  panel.querySelectorAll('[data-fa][data-de]').forEach(el=>{
   const val=el.dataset[fa()?'fa':'de'];
   if(el.textContent!==val)el.textContent=val;
  });
  $('mc-mode-switch').querySelectorAll('[data-fa][data-de]').forEach(el=>{
   const val=el.dataset[fa()?'fa':'de'];if(el.textContent!==val)el.textContent=val;
  });
  renderPreview();
  renderProgram();
 }
 function modeSet(next){
  if(next!=='managed'&&next!=='expert')return;
  mode=next;
  document.body.classList.toggle('mc-managed-on',next==='managed');
  $('mc-mode-managed').setAttribute('aria-pressed',String(next==='managed'));
  $('mc-mode-expert').setAttribute('aria-pressed',String(next==='expert'));
  panel.hidden=next!=='managed';
  if(slug)try{localStorage.setItem('pwyw.merchant.mode.'+slug,next)}catch{}
 }
 function normalized(n){return Math.round(Math.min(100000000,Math.max(50000,Number(n)||50000)))}
 function setBudget(n){
  budget=normalized(n);
  const slider=$('mc-budget-range');
  slider.value=String(Math.min(Number(slider.max),budget));
  $('mc-budget-exact').value=String(budget);
  setText('mc-gauge-amount',money(budget));
  const ratio=Math.min(1,Math.max(0,(budget-50000)/(5000000-50000)));
  const circumference=408.4;
  $('mc-gauge-fill').setAttribute('stroke-dasharray',(ratio*circumference).toFixed(1)+' '+circumference);
  panel.querySelectorAll('[data-mc-budget]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.mcBudget)===budget)));
  requestPreview();
 }
 function setGoal(next){
  if(!goalNames[next])return;
  goal=next;
  panel.querySelectorAll('[data-mc-auto-goal]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mcAutoGoal===goal)));
  requestPreview();
 }
 function getArgs(){
  const data={goal,budget_toman:budget};
  for(const input of panel.querySelectorAll('[data-mc-assumption]')){
   data[input.dataset.mcAssumption]=Number(input.value);
  }
  return data;
 }
 function validInputs(){
  const inputs=[...panel.querySelectorAll('[data-mc-assumption]')];
  return inputs.every(n=>n.checkValidity())&&$('mc-budget-exact').checkValidity();
 }
 function message(s,error=false){
  const el=$('mc-auto-message');el.textContent=s;el.classList.toggle('error',error);
 }
 async function fetchApi(url,method='GET',data){
  const response=await fetch(url,{method,credentials:'same-origin',headers:{'Content-Type':'application/json'},
   body:data===undefined?undefined:JSON.stringify(data)});
  let result;try{result=await response.json()}catch{result={}}
  if(!response.ok)throw Object.assign(new Error(typeof result.detail==='string'?result.detail:t('سرور درخواست رو قبول نکرد.','Request not accepted.')),{status:response.status});
  return result;
 }
 function requestPreview(){
  const seq=++requestSeq;
  preview=null;
  renderPreview(); // Never show a forecast for an older slider value.
  $('mc-auto-activate').disabled=true;
  if(!slug||!validInputs())return;
  clearTimeout(previewTimer);
  previewTimer=setTimeout(async()=>{
   try{
    const res=await fetchApi('/api/brands/'+encodeURIComponent(slug)+'/managed-program/preview','POST',getArgs());
    if(seq!==requestSeq)return;
    preview=res;renderPreview();updateActivate();
    message('');
   }catch(e){if(seq===requestSeq){message(t('محاسبه انجام نشد: ','Simulation fehlgeschlagen: ')+e.message,true);renderPreview()}}
  },180);
 }
 function renderPreview(){
  const show=preview?.scenario_data;
  if(!show){
   for(const id of ['mc-est-revenue','mc-est-low','mc-est-high','mc-est-awards','mc-est-purchases'])setText(id,'—');
   return;
  }
  const fmt=n=>money(n);
  setText('mc-est-revenue',fmt(show.base.illustrative_revenue_toman));
  setText('mc-est-low',fmt(show.conservative.illustrative_revenue_toman));
  setText('mc-est-high',fmt(show.optimistic.illustrative_revenue_toman));
  setText('mc-est-awards',fmt(preview.award_cap));
  setText('mc-est-purchases',fmt(show.base.additional_purchases));
  const label=$('mc-gauge-amount');if(label)label.textContent=money(budget);
 }
 function updateActivate(){
  const can=!!preview&&!!slug&&!busy&&$('mc-auto-confirm').checked&&validInputs()&&
    (!$('mc-auto-replace-row').hidden?$('mc-auto-replace').checked:true);
  $('mc-auto-activate').disabled=!can;
 }
 function renderProgram(){
  const live=$('mc-auto-live');
  const isActive=program?.effective_status==='active';
  live.hidden=!program;
  if(program){
   const status={active:t('فعال','Aktiv'),expired:t('پایان‌یافته','Abgelaufen'),paused:t('متوقف','Pausiert')};
   setText('mc-auto-live-desc',
    t('وضعیت: ','Status: ')+(status[program.effective_status]||program.effective_status)+
    ' · '+t('بودجه: ','Budget: ')+money(program.budget_toman)+' '+t('تومان','Toman')+
    ' · '+t('جایزه صادرشده: ','Ausgegebene Prämien: ')+money(program.issued));
  }
  $('mc-auto-pause').hidden=!isActive;
  $('mc-auto-activate').textContent=program?
    t('جایگزینی با پلن جدید','Neuen Plan aktivieren'):
    t('سپردن پلن به PWYW و فعال‌سازی','PWYW-Plan aktivieren');
 }
 async function loadProgram(){
  if(!slug)return;
  const current=slug;
  try{
   const res=await fetchApi('/api/brands/'+encodeURIComponent(slug)+'/managed-program');
   if(slug!==current)return;
   program=res.program;
   if(program){
    goal=program.goal;
    for(const [key,value] of Object.entries(program.assumptions||{})){
     const inp=panel.querySelector('[data-mc-assumption="'+key+'"]');if(inp)inp.value=String(value);
    }
    setGoal(goal);setBudget(program.budget_toman);
   }
   renderProgram();
   requestPreview();
  }catch(e){message(e.message,true)}
 }
 function updateConflict(){
  const raw=$('reward-stat-rules')?.textContent||'';
  const number=Number(raw.replace(/[۰-۹]/g,c=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).replace(/[^\d]/g,''))||0;
  $('mc-auto-replace-row').hidden=number===0;
  updateActivate();
 }
 async function activate(){
  if(busy||!preview)return;
  busy=true;updateActivate();message(t('در حال ثبت پلن…','Aktiviere den Plan…'));
  const payload={...getArgs(),replace_active_rules:$('mc-auto-replace').checked,confirm_estimate:$('mc-auto-confirm').checked};
  try{
   const res=await fetchApi('/api/brands/'+encodeURIComponent(slug)+'/managed-program/activate','POST',payload);
   message(t('پلن آزمایشی فعال شد. QR بازی رو با مشتری‌ها به اشتراک بذار.','Pilot aktiviert. Teile den QR-Code.'));
   $('mc-auto-confirm').checked=false;
   await window.PWYWRewardStudio?.refresh?.();
   await loadProgram();
   document.dispatchEvent(new CustomEvent('pwyw:managed-activated',{detail:{slug,rule_id:res.rule_id}}));
   updateConflict();
  }catch(err){
   if(err.status===409){$('mc-auto-replace-row').hidden=false}
   message(err.message,true);
  }finally{busy=false;updateActivate()}
 }
 async function pause(){
  if(busy||!program)return;
  busy=true;$('mc-auto-pause').disabled=true;
  try{
   await fetchApi('/api/brands/'+encodeURIComponent(slug)+'/managed-program/pause','POST',{});
   await window.PWYWRewardStudio?.refresh?.();
   await loadProgram();
   message(t('صدور جایزه جدید از این پلن متوقف شد. کدهای قبلی همچنان قابل بررسی‌اند.','Neue Prämien pausiert. Bereits ausgegebene Codes bleiben gültig.'));
  }catch(e){message(e.message,true)}
  finally{busy=false;$('mc-auto-pause').disabled=false;updateActivate()}
 }
 function moveGlobalControls(){
  const actions=document.querySelector('.studio-menu');
  if(!actions||!slug)return;
  const switcher=$('pwyw-language-switch');
  if(switcher&&switcher.parentElement!==actions)actions.append(switcher);
  const logout=$('logout');
  if(logout&&logout.parentElement!==actions)actions.append(logout);
  if(logout){logout.textContent=t('خروج','Abmelden');logout.setAttribute('aria-label',t('خروج از حساب','Abmelden'))}
  const admin=$('platform-admin-link');
  if(admin&&admin.parentElement!==actions)actions.append(admin);
  document.body.classList.add('mc-streamlined');
 }
 function brandChange(e){
  slug=e.detail?.slug||window.PWYWStudio?.getBrand?.()?.slug||'';
  if(!slug)return;
  // A selected onboarding track takes precedence only for a newly seen business.
  const requested=new URLSearchParams(location.search).get('mode');
  const initial=(requested==='expert'||requested==='managed')?requested:'managed';
  try{mode=localStorage.getItem('pwyw.merchant.mode.'+slug)||initial}catch{mode=initial}
  if(mode!=='expert')mode='managed';
  modeSet(mode);
  program=null;preview=null;$('mc-auto-confirm').checked=false;$('mc-auto-replace').checked=false;
  moveGlobalControls();
  loadProgram();
  updateConflict();
 }
 function bind(){
  $('mc-mode-managed').addEventListener('click',()=>modeSet('managed'));
  $('mc-mode-expert').addEventListener('click',()=>modeSet('expert'));
  $('mc-budget-range').addEventListener('input',e=>setBudget(e.target.value));
  $('mc-budget-exact').addEventListener('change',e=>setBudget(e.target.value));
  panel.querySelectorAll('[data-mc-budget]').forEach(el=>el.addEventListener('click',()=>setBudget(el.dataset.mcBudget)));
  panel.querySelectorAll('[data-mc-auto-goal]').forEach(el=>el.addEventListener('click',()=>setGoal(el.dataset.mcAutoGoal)));
  panel.querySelectorAll('[data-mc-assumption]').forEach(el=>el.addEventListener('input',requestPreview));
  $('mc-auto-confirm').addEventListener('change',updateActivate);
  $('mc-auto-replace').addEventListener('change',updateActivate);
  $('mc-auto-activate').addEventListener('click',activate);
  $('mc-auto-pause').addEventListener('click',pause);
  $('mc-auto-view-qr').addEventListener('click',()=>document.querySelector('#mc-bottom-nav [data-mc-view="share"]')?.click());
  document.addEventListener('pwyw:brand-selected',brandChange);
  document.addEventListener('pwyw:language-changed',()=>{localized();moveGlobalControls()});
  document.addEventListener('pwyw:reward-saved',updateConflict);
  const metric=$('reward-stat-rules');
  if(metric)new MutationObserver(updateConflict).observe(metric,{subtree:true,characterData:true,childList:true});
  if(window.PWYWStudio?.getBrand?.())brandChange({detail:{slug:window.PWYWStudio.getBrand().slug}});
 }
 bind();
 setBudget(budget);
 localized();
})();
