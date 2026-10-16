/* PWYW v2 / Outcome-first self-service brand studio. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const state={mode:'login',brands:[],brand:null,theme:'atelier',objective:'upsell',campaigns:{},logoPreview:null};
const objectives={
  upsell:{title:'Perfect pairing',description:'Play, then find the extra that makes the moment better.',cta:'Show me the pairing',offer:'Discover a complementary extra',product_name:'Signature pairing',game:'orbit'},
  return:{title:'One more visit?',description:'A little challenge now. Something lovely on your next visit.',cta:'Save my return treat',offer:'A surprise on your next visit',product_name:'Next visit',game:'bloom'},
  refer:{title:'More fun together',description:'Send a challenge to a friend and make a new shared memory.',cta:'Invite a friend',offer:'A special shared moment',product_name:'Friend challenge',game:'lane'},
  learn:{title:'Know before you go',description:'Discover the essentials in a friendly, playable moment.',cta:'What should I know?',offer:'Read the important preparation steps',product_name:'Service guide',game:'sequence'}
};
const themes=['atelier','neon','garden','pop','noir','chrome','dream','heritage'];
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
 $('campaign-heading').textContent='BUILD PLAY TO '+value.toUpperCase();
 const c=state.campaigns[value]||objectives[value];
 const fa=c.translations?.fa||{};
 for(const [key,id] of Object.entries({title:'title',description:'description',cta:'cta',offer:'offer',product_name:'product'}))$('campaign-fa-'+id).value=fa[key]||'';
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
}
document.querySelectorAll('.purpose-option').forEach(b=>b.onclick=()=>objective(b.dataset.objective));
function clearLogo(){
 if(pendingLogo)URL.revokeObjectURL(pendingLogo);pendingLogo=null;
 $('preview-logo').textContent='✳';
}
function newBrand(){
 state.brand=null;state.campaigns={};$('brand-form').reset();$('brand-slug').disabled=false;
 $('brand-logo').value='';$('brand-scene').value='';$('brand-token').value='';$('brand-accent').value='#d8ff3e';
 $('editor-preview').style.backgroundImage='';$('art-status').textContent='Upload a background scene and game object to make a world your own.';
 setTheme('atelier');clearLogo();
 $('open-play').hidden=true;$('results-section').hidden=true;$('campaign-section').hidden=true;$('redeem-section').hidden=true;
 $('workspace-subtitle').textContent='Not the game. The action you want your customers to take.';
 renderBrandList();preview();objective(state.objective);message('save-status','');
}
$('new-brand').onclick=newBrand;
async function selectBrand(b){
 state.brand=b;
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
 $('workspace-subtitle').textContent='Build an action-first campaign and share a world that feels like you.';
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
   state.campaigns[state.objective]=body;message('campaign-status','Live. Your campaign is ready to share.');
   $('campaign-share-link').href='/play/'+encodeURIComponent(state.brand.slug)+'?objective='+state.objective;
   await refreshStats();
 }catch(err){message('campaign-status',err.message,true)}finally{btn.disabled=false}
});
async function refreshStats(){
 if(!state.brand)return;
 const slug=encodeURIComponent(state.brand.slug);
 try{const [stats,results]=await Promise.all([
   api('/api/brands/'+slug+'/stats'),api('/api/brands/'+slug+'/campaigns/outcomes')]);
   $('stat-visits').textContent=Number(stats.totals.visit||0).toLocaleString('de-DE');
   $('stat-starts').textContent=Number(stats.totals.start||0).toLocaleString('de-DE');
   $('stat-finishes').textContent=Number(stats.totals.complete||0).toLocaleString('de-DE');
   const list=$('outcome-list');list.replaceChildren();
   for(const c of results.campaigns){
     const card=document.createElement('div');card.className='outcome-item';
     const title=document.createElement('b');title.textContent='PLAY TO '+c.objective.toUpperCase();
     const count=document.createElement('strong');count.textContent=c.redeemed+' redeemed';
     const note=document.createElement('span');note.textContent=c.issued+' issued · '+c.actions+' CTA clicks · '+Number(c.net_claimed_contribution).toFixed(2)+' € declared net contribution';
     card.append(title,count,note);list.append(card);
   }
   if(!results.campaigns.length)list.textContent='Publish a campaign to begin tracking real customer actions.';
   $('outcome-caveat').textContent=results.disclaimer;
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
objective('upsell');boot();
document.addEventListener('pwyw:language-changed',preview);
})();