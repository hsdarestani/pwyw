/* PWYW v2 / Outcome-first self-service brand studio. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const state={mode:'login',brands:[],brand:null,theme:'atelier',objective:'upsell',campaigns:{},logoPreview:null};
const objectives={
  upsell:{title:'Perfekte Ergänzung',description:'Spiele und entdecke danach ein passendes Extra.',cta:'Ergänzung anzeigen',offer:'Passendes Extra entdecken',product_name:'Empfohlenes Extra',game:'orbit'},
  return:{title:'Noch ein Besuch?',description:'Ein kleines Spiel jetzt, ein Extra beim nächsten Besuch.',cta:'Belohnung für nächsten Besuch merken',offer:'Überraschung beim nächsten Besuch',product_name:'Nächster Besuch',game:'bloom'},
  refer:{title:'Gemeinsam macht es mehr Spaß',description:'Lade Freunde zu einer Challenge ein.',cta:'Freund einladen',offer:'Ein schöner gemeinsamer Moment',product_name:'Freunde-Challenge',game:'lane'},
  learn:{title:'Gut vorbereitet',description:'Entdecke Wichtiges spielerisch und einfach.',cta:'Was muss ich wissen?',offer:'Wichtige Hinweise lesen',product_name:'Servicehinweise',game:'sequence'}
};
const themes=['atelier','neon','garden','pop','noir','chrome','dream','heritage'];
const nativeDefaults={
 upsell:{title:'یه پیشنهاد ویژه برات داریم',description:'یه دست بازی کن و بعد پیشنهاد مخصوص ما رو ببین.',cta:'دیدن پیشنهاد',offer:'این پیشنهاد رو به سفارشت اضافه کن.',product_name:'پیشنهاد ویژه'},
 return:{title:'دفعه بعد هم سر بزن!',description:'یه بازی کوتاه کن و پیشنهاد مخصوص مراجعه بعدی رو بگیر.',cta:'گرفتن پیشنهاد',offer:'این پیشنهاد برای مراجعه بعدی توئه.',product_name:'پیشنهاد مراجعه بعدی'},
 refer:{title:'با دوستات بازی کن!',description:'لینک بازی رو برای دوستت بفرست و با هم رقابت کنین.',cta:'دعوت از دوست',offer:'دوستت رو دعوت کن تا با هم بازی کنین.',product_name:'بازی با دوستان'},
 learn:{title:'قبل از مراجعه این نکات رو بدون',description:'با یه بازی کوتاه نکات مهم رو یاد بگیر.',cta:'دیدن نکات مهم',offer:'راهنمای مراجعه رو بخون.',product_name:'راهنمای مراجعه'}
};
const locale=()=>window.PWYWI18N?.locale()||((new URLSearchParams(location.search).get('lang')==='fa')?'fa':'de');
const formatCount=value=>Number(value||0).toLocaleString(locale()==='fa'?'fa-IR':'de-DE');
function setCampaignLocale(){
 const isFa=locale()==='fa';
 $('campaign-copy-primary').append(isFa?$('campaign-copy-fa'):$('campaign-copy-de'));
 $('campaign-copy-secondary').append(isFa?$('campaign-copy-de'):$('campaign-copy-fa'));
 $('campaign-alternate').open=false;
 for(const id of ['title','product','cta','offer','description'])$('campaign-fa-'+id).required=isFa;
 const alt=$('campaign-alternate').querySelector('summary>span');
 if(alt)alt.textContent=isFa?'EDIT GERMAN VERSION':'EDIT PERSIAN VERSION';
 for(const item of $('campaign-copy-de').querySelectorAll('input,textarea')){item.dir='ltr';item.lang='de'}
 for(const item of $('campaign-copy-fa').querySelectorAll('input,textarea')){item.dir='rtl';item.lang='fa'}
}

async function api(url,method='GET',body){
  const options={method,credentials:'same-origin'};
  if(body!==undefined){if(body instanceof FormData)options.body=body;
    else{options.headers={'Content-Type':'application/json'};options.body=JSON.stringify(body)}}
  const resp=await fetch(url,options);
  let data;try{data=await resp.json()}catch{data={}};
  if(!resp.ok)throw Error(typeof data.detail==='string'?data.detail:'Request failed.');
  return data;
}
function message(id,text,failed=false){const node=$(id);node.textContent=text;node.classList.toggle('error',failed)}
function mode(value){
 state.mode=value;
 $('tab-login').classList.toggle('active',value==='login');
 $('tab-signup').classList.toggle('active',value==='register');
 $('auth-title').textContent=value==='login'?'Welcome back.':'Your next idea starts here.';
 $('auth-submit').firstChild.textContent=value==='login'?'SIGN IN ':'CREATE ACCOUNT ';
 $('auth-form').elements.password.autocomplete=value==='login'?'current-password':'new-password';
 message('auth-error','');
}
$('tab-login').onclick=()=>mode('login');$('tab-signup').onclick=()=>mode('register');
$('auth-form').addEventListener('submit',async e=>{
 e.preventDefault();const btn=$('auth-submit');btn.disabled=true;
 try{const fd=new FormData(e.currentTarget);
   await api('/api/'+(state.mode==='login'?'login':'register'),'POST',
    {email:fd.get('email'),password:fd.get('password')});
   await boot();
 }catch(err){message('auth-error',err.message,true)}finally{btn.disabled=false}
});
$('logout').onclick=async()=>{await api('/api/logout','POST',{});
  $('auth-shell').hidden=false;$('app-shell').hidden=true;$('logout').hidden=true;
  $('user-email').textContent='';const link=$('platform-admin-link');if(link)link.hidden=true;state.brand=null};
async function boot(){
  try{const info=await api('/api/me');$('user-email').textContent=info.email;
    $('auth-shell').hidden=true;$('app-shell').hidden=false;$('logout').hidden=false;
    const link=$('platform-admin-link');if(link)link.hidden=info.role!=='admin';
    await fetchBrands();
  }catch{$('auth-shell').hidden=false;$('app-shell').hidden=true;$('logout').hidden=true}
}
async function fetchBrands(prefer=''){
 state.brands=await api('/api/brands');
 const previous=state.brand?.slug;
 const target=state.brands.find(b=>b.slug===(prefer||previous))||state.brands[0];
 if(target)await selectBrand(target);else newBrand();
}
function customerLink(){
 if(!state.brand)return '';
 const link=new URL('/play/'+encodeURIComponent(state.brand.slug),location.origin);
 link.searchParams.set('objective',state.objective);
 if(locale()==='fa')link.searchParams.set('lang','fa');
 return link.href;
}
function updateQuick(){
 const quick=$('studio-quick');
 quick.hidden=!state.brand;
 if(!state.brand)return;
 const f=locale()==='fa',live=Boolean(state.campaigns[state.objective]);
 const url=customerLink(), relative=url.replace(location.origin,'');
 $('quick-open').href=url;
 $('open-play').href=relative;
 $('campaign-share-link').href=relative;
 $('quick-verify').hidden=state.objective==='learn';
 $('quick-status').textContent=live?
   (f?'این پیشنهاد فعاله. می‌تونی بازیش رو ببینی یا لینکش رو برای مشتری بفرستی.':'Dieses Angebot ist online. Spiel ansehen oder Link teilen.'):
   (f?'پیشنهادت هنوز منتشر نشده. یکی از ایده‌های پایین رو تأیید کن.':'Noch nicht veröffentlicht. Wähle unten einen Vorschlag aus.');
 const img='/qr/'+encodeURIComponent(state.brand.slug)+'.svg?objective='+encodeURIComponent(state.objective)+(f?'&lang=fa':'');
 $('qr-image').src=img;$('qr-download').href=img;
 $('quick-copy-help').hidden=true;
}
function openTool(section,focusId){
 openStudioSettings('studio-tools');
 if(focusId)requestAnimationFrame(()=>{
  const el=$(focusId);if(!el||el.closest('[hidden]'))return;
  el.scrollIntoView({block:'nearest',behavior:'smooth'});
  if(el.matches('input,button'))el.focus({preventScroll:true});
 });
}
$('quick-qr').addEventListener('click',()=>openTool('studio-tools','qr-image'));
$('quick-verify').addEventListener('click',()=>openTool('studio-tools','redeem-code'));
$('quick-edit').addEventListener('click',()=>openStudioSettings('brand-settings'));
$('quick-copy').addEventListener('click',async()=>{
 const url=customerLink();if(!url)return;
 const button=$('quick-copy');
 try{
  if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
  await navigator.clipboard.writeText(url);
  button.textContent=locale()==='fa'?'لینک کپی شد ✓':'Link kopiert ✓';
  $('quick-copy-help').hidden=true;
 }catch{
  $('quick-copy-url').value=url;$('quick-copy-help').hidden=false;
  $('quick-copy-url').select();
  button.textContent=locale()==='fa'?'لینک رو از کادر کپی کن':'Link unten kopieren';
 }
});
function renderBrandList(){
 const node=$('brand-list');node.replaceChildren();
 for(const b of state.brands){
   const btn=document.createElement('button');btn.className='brand-nav'+(b.slug===state.brand?.slug?' active':'');btn.type='button';
   const dot=document.createElement('span');dot.className='brand-dot';dot.style.backgroundColor=b.accent;
   const name=document.createElement('span');name.textContent=b.name;btn.append(dot,name);
   btn.onclick=()=>selectBrand(b);node.append(btn);
 }
 if(!state.brands.length)node.textContent='Your brands appear here.';
}
function setTheme(t){
 if(!themes.includes(t))t='atelier';
 state.theme=t;
 document.querySelectorAll('.theme-tile').forEach(b=>b.classList.toggle('active',b.dataset.theme===t));
 $('editor-preview').className='phone-frame theme-'+t;
}
document.querySelectorAll('.theme-tile').forEach(b=>b.onclick=()=>{setTheme(b.dataset.theme);preview()});
function preview(){
 const name=$('brand-name').value.trim()||'YOUR BRAND.';
 $('preview-name').textContent=name;
 $('preview-tagline').textContent=(window.PWYWI18N?.locale()==='fa' && $('brand-tagline-fa').value.trim())?$('brand-tagline-fa').value.trim():$('brand-tagline').value.trim()||'A little fun while you wait.';
 $('editor-preview').style.borderColor=$('brand-accent').value;
 $('workspace-title').textContent=state.brand?name:'First, pick an outcome.';
}
['brand-name','brand-tagline','brand-tagline-fa','brand-accent','brand-industry'].forEach(id=>$(id).addEventListener('input',preview));
let pendingLogo=null;
$('brand-logo').addEventListener('change',e=>{
 const f=e.currentTarget.files[0];if(!f)return;
 if(f.size>1000000){message('save-status','Logo must be smaller than 1 MB.',true);e.currentTarget.value='';return}
 if(pendingLogo)URL.revokeObjectURL(pendingLogo);
 pendingLogo=URL.createObjectURL(f);
 const img=document.createElement('img');img.src=pendingLogo;img.alt='Brand logo';img.style.cssText='max-height:60px;max-width:115px;object-fit:contain';
 $('preview-logo').replaceChildren(img);
});
function objective(value){
 if(!objectives[value])return;
 state.objective=value;
 document.querySelectorAll('.purpose-option').forEach(b=>b.classList.toggle('active',b.dataset.objective===value));
 $('campaign-heading').textContent=(window.PWYWI18N?.locale()==='fa'?'بازی پیشنهادی برای ':'Spielvorschlag für ')+(window.PWYWI18N?.locale()==='fa'?({upsell:'افزایش مبلغ خرید',return:'مراجعه دوباره',refer:'معرفی به دوستان',learn:'آشنایی با خدمات'})[value]:({upsell:'Mehrverkauf',return:'Wiederbesuch',refer:'Weiterempfehlung',learn:'Service erklären'})[value]);
 const c=state.campaigns[value]||objectives[value];
 const fa=c.translations?.fa||{};
 for(const [key,id] of Object.entries({title:'title',description:'description',cta:'cta',offer:'offer',product_name:'product'})){
   // Translate only fixed defaults that we authored; never guess merchant-entered text.
   const safeDefault=c[key]===objectives[value][key]?nativeDefaults[value][key]:'';
   $('campaign-fa-'+id).value=fa[key]||safeDefault;
 }
 $('quiz-fa-question').value=fa.quiz_question||'';
 for(let i=0;i<3;i++)$('quiz-fa-option-'+i).value=fa.quiz_options?.[i]||'';
 $('campaign-title').value=c.title||'';
 $('campaign-description').value=c.description||'';
 $('campaign-cta').value=c.cta||'';
 $('campaign-offer').value=c.offer||'';
 $('campaign-product').value=c.product_name||'';
 $('campaign-game').value=c.game||'orbit';
 $('campaign-destination').value=c.destination||'';
 $('campaign-margin').value=Number(c.margin_per_sale||0);
 $('campaign-reward').value=Number(c.reward_cost||0);
 $('learning-builder').hidden=value!=='learn';
 $('quiz-question').value=c.quiz_question||'';
 const quizOpts=Array.isArray(c.quiz_options)?c.quiz_options:[];
 for(let i=0;i<3;i++)$('quiz-option-'+i).value=quizOpts[i]||'';
 $('quiz-correct').value=String(c.quiz_correct_index||0);
 if(state.brand){
   $('campaign-share-link').href='/play/'+encodeURIComponent(state.brand.slug)+'?objective='+value;
   $('redeem-section').hidden=value==='learn';
 }
 message('campaign-status','');
 updateQuick();
 document.dispatchEvent(new CustomEvent('pwyw:objective-selected',{detail:{slug:state.brand?.slug||'',objective:value}}));
}
document.querySelectorAll('.purpose-option').forEach(b=>b.onclick=()=>objective(b.dataset.objective));
function clearLogo(){
 if(pendingLogo)URL.revokeObjectURL(pendingLogo);pendingLogo=null;
 $('preview-logo').textContent='✳';
}
let modalReturnFocus=null;
function openStudioSettings(section=''){
 const overlay=$('studio-settings-overlay');
 if(!overlay.hidden)return;
 modalReturnFocus=document.activeElement;
 overlay.hidden=false;
 $('studio-extra-tools').open=true;
 document.body.classList.add('studio-modal-open');
 if(section){
   const target=$(section);
   if(target)target.open=true;
 }
 const focus=(section==='brand-settings')?$('brand-name'):$('close-studio-settings');
 focus?.focus({preventScroll:true});
}
function closeStudioSettings(){
 const overlay=$('studio-settings-overlay');
 if(overlay.hidden)return;
 overlay.hidden=true;
 document.body.classList.remove('studio-modal-open');
 $('studio-extra-tools').open=false;
 modalReturnFocus?.isConnected?modalReturnFocus.focus({preventScroll:true}):$('open-studio-settings').focus({preventScroll:true});
}
document.querySelectorAll('[data-settings-lang]').forEach(button=>{
 button.addEventListener('click',()=>{
   window.PWYWI18N?.setLocale(button.dataset.settingsLang);
   document.querySelectorAll('[data-settings-lang]').forEach(b=>{
     b.setAttribute('aria-pressed',String(b.dataset.settingsLang===window.PWYWI18N?.locale()));
   });
 });
});
document.addEventListener('pwyw:language-changed',()=>{
 document.querySelectorAll('[data-settings-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.settingsLang===window.PWYWI18N?.locale())));
});
$('open-studio-settings').addEventListener('click',()=>openStudioSettings());
$('close-studio-settings').addEventListener('click',closeStudioSettings);
document.querySelector('[data-close-studio-settings]').addEventListener('click',closeStudioSettings);
document.addEventListener('keydown',e=>{
 if($('studio-settings-overlay').hidden)return;
 if(e.key==='Escape'){e.preventDefault();closeStudioSettings();return;}
 if(e.key!=='Tab')return;
 const dlg=document.querySelector('.studio-settings-dialog');
 const nodes=Array.from(dlg.querySelectorAll('button,input,select,textarea,a[href],summary,[tabindex]'))
   .filter(el=>!el.disabled&&el.getClientRects().length>0&&el.tabIndex!==-1);
 if(!nodes.length)return;
 const first=nodes[0],last=nodes[nodes.length-1];
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
 else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
});
function newBrand(){
 state.brand=null;state.campaigns={};$('brand-form').reset();
 $('brand-settings').open=true;$('studio-tools').open=false;
 $('manual-campaign-settings').open=false;$('security-settings').open=false;$('brand-slug').disabled=false;
 $('brand-logo').value='';$('brand-scene').value='';$('brand-token').value='';$('brand-accent').value='#d8ff3e';
 $('editor-preview').style.backgroundImage='';$('art-status').textContent='Upload a background scene and game object to make a world your own.';
 setTheme('atelier');clearLogo();
 $('open-play').hidden=true;$('results-section').hidden=true;$('campaign-section').hidden=true;$('redeem-section').hidden=true;
 $('workspace-subtitle').textContent='Not the game. The action you want your customers to take.';
 renderBrandList();preview();objective(state.objective);updateQuick();message('save-status','');
 openStudioSettings('brand-settings');
}
$('new-brand').onclick=newBrand;
async function selectBrand(b){
 state.brand=b;
 $('brand-settings').open=false;$('studio-tools').open=false;
 $('security-settings').open=false;closeStudioSettings();
 $('manual-campaign-settings').open=false;
 $('brand-name').value=b.name;$('brand-industry').value=b.industry;
 $('brand-tagline').value=b.tagline;$('brand-tagline-fa').value=b.tagline_fa||'';$('brand-accent').value=b.accent;
 $('brand-slug').value=b.slug;$('brand-slug').disabled=true;
 $('brand-logo').value='';$('brand-scene').value='';$('brand-token').value='';
 setTheme(b.theme);clearLogo();
 api('/api/public/brands/'+encodeURIComponent(b.slug)+'/art').then(art=>{
   if(state.brand?.slug!==b.slug)return;
   const phone=$('editor-preview');
   if(art.scene){
     const dark=['neon','chrome','noir'].includes(b.theme);
     phone.style.backgroundImage=(dark?'linear-gradient(180deg,rgba(7,9,20,.45),rgba(7,9,20,.8)),':'linear-gradient(180deg,rgba(253,248,230,.48),rgba(253,248,230,.8)),')+'url("'+art.scene+'")';
     phone.style.backgroundSize='cover';phone.style.backgroundPosition='center';
   }else phone.style.backgroundImage='';
   $('art-status').textContent='SCENE: '+(art.scene?'ACTIVE':'GENERATED')+' · OBJECT: '+(art.token?'ACTIVE':'GENERATED');
 }).catch(()=>{});

 if(b.logo_path){
   const img=document.createElement('img');img.src='/brand-logo/'+encodeURIComponent(b.logo_path);
   img.alt='Brand logo';img.style.cssText='max-height:60px;max-width:115px;object-fit:contain';
   $('preview-logo').replaceChildren(img);
 }
 $('open-play').hidden=false;$('open-play').href='/play/'+encodeURIComponent(b.slug);
 $('workspace-subtitle').textContent=(window.PWYWI18N?.locale()==='fa'?'هدفت رو مشخص کن؛ ما بازی و پیام مناسب برای مشتری‌هات پیشنهاد می‌دیم.':'Wähle dein Ziel. Wir schlagen dir das Spiel und die passende Kundenansprache vor.');
 $('results-section').hidden=false;$('campaign-section').hidden=false;$('redeem-section').hidden=state.objective==='learn';
 $('qr-image').src='/qr/'+encodeURIComponent(b.slug)+'.svg';
 $('qr-download').href=$('qr-image').src;
 state.campaigns={};
 try{for(const c of await api('/api/brands/'+encodeURIComponent(b.slug)+'/campaigns'))state.campaigns[c.objective]=c}
 catch(e){message('save-status','Could not load campaigns: '+e.message,true)}
 objective(state.objective);preview();renderBrandList();await refreshStats();
}
$('brand-form').addEventListener('submit',async e=>{
 e.preventDefault();const btn=$('brand-save');btn.disabled=true;message('save-status','Saving...');
 const body={name:$('brand-name').value.trim(),slug:state.brand?.slug||$('brand-slug').value.trim(),
  industry:$('brand-industry').value,theme:state.theme,accent:$('brand-accent').value,tagline:$('brand-tagline').value.trim(),tagline_fa:$('brand-tagline-fa').value.trim()};
 try{const result=await api(state.brand?'/api/brands/'+encodeURIComponent(state.brand.slug):'/api/brands',
   state.brand?'PUT':'POST',body);
   if($('brand-logo').files.length){const form=new FormData();form.append('file',$('brand-logo').files[0]);
     await api('/api/brands/'+encodeURIComponent(result.slug)+'/logo','POST',form)}
   for(const slot of ['scene','token']){
     const picker=$('brand-'+slot);
     if(picker?.files.length){
       const form=new FormData();form.append('file',picker.files[0]);
       await api('/api/brands/'+encodeURIComponent(result.slug)+'/art/'+slot,'POST',form);
     }
   }
   state.brand=null;await fetchBrands(result.slug);message('save-status','Brand saved. Set up your first business objective below.');
 }catch(err){message('save-status',err.message,true)}finally{btn.disabled=false}
});
$('campaign-form').addEventListener('submit',async e=>{
 e.preventDefault();
 if(!state.brand){message('campaign-status','Save a brand first.',true);return}
 if(locale()==='fa'){
   const missing=['title','product','cta','offer','description'].map(x=>$('campaign-fa-'+x)).find(x=>!x.value.trim());
   if(missing){missing.setCustomValidity('برای انتشار نسخه فارسی، این قسمت رو هم پر کن.');missing.reportValidity();missing.focus();return}
 }
 const btn=$('campaign-save');btn.disabled=true;message('campaign-status','Publishing campaign...');
 const body={objective:state.objective,title:$('campaign-title').value.trim(),
   description:$('campaign-description').value.trim(),cta:$('campaign-cta').value.trim(),
   offer:$('campaign-offer').value.trim(),product_name:$('campaign-product').value.trim(),
   destination:$('campaign-destination').value.trim(),game:$('campaign-game').value,
   margin_per_sale:Number($('campaign-margin').value||0),reward_cost:Number($('campaign-reward').value||0),is_active:true,
   quiz_question:state.objective==='learn'?$('quiz-question').value.trim():'',
   quiz_options:state.objective==='learn'?[0,1,2].map(i=>$('quiz-option-'+i).value.trim()).filter(Boolean):[],
   quiz_correct_index:Number($('quiz-correct').value||0),
   translations:{fa:{title:$('campaign-fa-title').value.trim(),description:$('campaign-fa-description').value.trim(),cta:$('campaign-fa-cta').value.trim(),offer:$('campaign-fa-offer').value.trim(),product_name:$('campaign-fa-product').value.trim(),quiz_question:state.objective==='learn'?$('quiz-fa-question').value.trim():'',quiz_options:state.objective==='learn'?[0,1,2].map(i=>$('quiz-fa-option-'+i).value.trim()).filter(Boolean):[]}}};
 try{await api('/api/brands/'+encodeURIComponent(state.brand.slug)+'/campaigns/'+state.objective,'PUT',body);
   state.campaigns[state.objective]=body;updateQuick();message('campaign-status','Live. Your campaign is ready to share.');
   $('campaign-share-link').href='/play/'+encodeURIComponent(state.brand.slug)+'?objective='+state.objective;
   await refreshStats();
 }catch(err){message('campaign-status',err.message,true)}finally{btn.disabled=false}
});
async function refreshStats(){
 if(!state.brand)return;
 const slug=encodeURIComponent(state.brand.slug);
 try{const [stats,results]=await Promise.all([
   api('/api/brands/'+slug+'/stats'),api('/api/brands/'+slug+'/campaigns/outcomes')]);
   $('stat-visits').textContent=formatCount(stats.totals.visit);
   $('stat-starts').textContent=formatCount(stats.totals.start);
   $('stat-finishes').textContent=formatCount(stats.totals.complete);
   const list=$('outcome-list');list.replaceChildren();
   for(const c of results.campaigns){
     const card=document.createElement('div');card.className='outcome-item';
     const title=document.createElement('b');title.textContent=window.PWYWI18N?.t('PLAY TO '+c.objective.toUpperCase())||'PLAY TO '+c.objective.toUpperCase();
     const count=document.createElement('strong');count.textContent=formatCount(c.redeemed)+(locale()==='fa'?' استفاده‌شده':' eingelöst');
     const note=document.createElement('span');note.textContent=locale()==='fa'?
       formatCount(c.issued)+' کد صادرشده · '+formatCount(c.actions)+' کلیک روی پیشنهاد · '+Number(c.net_claimed_contribution).toLocaleString('fa-IR',{maximumFractionDigits:2})+' یورو مبلغ اعلام‌شده':
       formatCount(c.issued)+' Codes · '+formatCount(c.actions)+' Klicks · '+Number(c.net_claimed_contribution).toLocaleString('de-DE',{maximumFractionDigits:2})+' € gemeldeter Nettobetrag';
     card.append(title,count,note);list.append(card);
   }
   if(!results.campaigns.length)list.textContent='Publish a campaign to begin tracking real customer actions.';
   $('outcome-caveat').textContent=locale()==='fa'?'این آمار فقط فعالیت ثبت‌شدهٔ مشتری‌ها رو نشون می‌ده؛ افزایش واقعی فروش باید با اطلاعات فروش بررسی بشه.':'Diese Zahlen zeigen erfasste Interaktionen. Zusätzliche Umsätze müssen mit echten Verkaufsdaten überprüft werden.';
 }catch(err){message('save-status','Reporting unavailable: '+err.message,true)}
}
$('redeem-form').addEventListener('submit',async e=>{
 e.preventDefault();if(!state.brand)return;
 const btn=$('redeem-form').querySelector('button');btn.disabled=true;
 try{const result=await api('/api/brands/'+encodeURIComponent(state.brand.slug)+'/campaigns/'+state.objective+'/redeem','POST',
   {code:$('redeem-code').value.trim(),verified_value:Number($('redeem-value').value||0)});
   message('redeem-status',result.ok?'Marked as verified. This requires a real customer action.':'Not verified.');
   $('redeem-code').value='';await refreshStats();
 }catch(err){message('redeem-status',err.message,true)}finally{btn.disabled=false}
});
$('ai-suggest').onclick=async()=>{
 if(!state.brand){message('save-status','Save a brand to use the optional assistant.',true);return}
 const btn=$('ai-suggest');btn.disabled=true;
 try{const r=await api('/api/brands/'+encodeURIComponent(state.brand.slug)+'/ai-suggest','POST',
   {audience:$('brand-industry').value,mood:state.theme});
   $('brand-tagline').value=r.tagline;preview();
   message('save-status',r.ai?'Suggestion ready. Review it and save the brand.':'AI is not configured. Your experience still works without it.');
 }catch(e){message('save-status',e.message,true)}finally{btn.disabled=false}
};
$('password-change').addEventListener('submit',async e=>{
 e.preventDefault();
 const btn=e.currentTarget.querySelector('button[type=submit]');
 btn.disabled=true;message('password-status','Updating password...');
 try{
   const form=new FormData(e.currentTarget);
   await api('/api/account/change-password','POST',{old_password:form.get('old_password'),new_password:form.get('new_password')});
   e.currentTarget.reset();
   message('password-status','Password updated. Previous sessions have been revoked. Sign in again.');
   $('logout').click();
 }catch(err){message('password-status',err.message,true)}
 finally{btn.disabled=false}
});
// Show the active language as the main editor, with the other version optional.
setCampaignLocale();
document.addEventListener('DOMContentLoaded',setCampaignLocale);
for(const x of document.querySelectorAll('#campaign-copy-fa input,#campaign-copy-fa textarea')){
 x.addEventListener('input',()=>x.setCustomValidity(''));
}
window.PWYWStudio={
 getBrand:()=>state.brand,
 getObjective:()=>state.objective,
 afterApproval:campaign=>{
  state.campaigns[campaign.objective]=campaign;
  if(!state.brand)return;
  $('campaign-share-link').href='/play/'+encodeURIComponent(state.brand.slug)+'?objective='+campaign.objective;
  updateQuick();refreshStats();
 }
};
objective('upsell');boot();
function objectiveHeadingRefresh(){
 const value=state.objective;
 const names=window.PWYWI18N?.locale()==='fa'?
  {upsell:'افزایش مبلغ خرید',return:'مراجعه دوباره',refer:'معرفی به دوستان',learn:'آشنایی با خدمات'}:
  {upsell:'Mehrverkauf',return:'Wiederbesuch',refer:'Weiterempfehlung',learn:'Service erklären'};
 $('campaign-heading').textContent=(window.PWYWI18N?.locale()==='fa'?'بازی پیشنهادی برای ':'Spielvorschlag für ')+names[value];
}
document.addEventListener('pwyw:language-changed',()=>{
 setCampaignLocale();objectiveHeadingRefresh();preview();updateQuick();
 if(state.brand){
  $('workspace-subtitle').textContent=window.PWYWI18N?.locale()==='fa'?
   'هدفت رو مشخص کن؛ ما بازی و پیام مناسب برای مشتری‌هات پیشنهاد می‌دیم.':
   'Wähle dein Ziel. Wir schlagen dir das Spiel und die passende Kundenansprache vor.';
  refreshStats();
 }
});
})();