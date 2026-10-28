/* Accessible, localized settings affordances. Does not replace existing brand forms or uploads. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const overlay=$('studio-settings-overlay'),dialog=overlay?.querySelector('.studio-settings-dialog');
if(!dialog)return;
const fa=()=>window.PWYWI18N?.locale?.()==='fa';
const t=(a,b)=>fa()?a:b;
const paths=[
 ['brand','اطلاعات','Geschäft','brand-settings'],
 ['theme','ظاهر','Design','brand-settings'],
 ['campaign','کمپین','Kampagne','manual-campaign-settings'],
 ['report','گزارش','Berichte','studio-tools'],
 ['security','امنیت','Sicherheit','security-settings']
];
const nav=document.createElement('nav');nav.className='ux-settings-tabs';nav.setAttribute('aria-label','بخش‌های تنظیمات');
for(const [key,f,de] of paths){const button=document.createElement('button');button.type='button';button.dataset.uxSettings=key;button.dataset.fa=f;button.dataset.de=de;button.textContent=t(f,de);button.setAttribute('aria-selected',String(key==='brand'));nav.append(button);}
dialog.querySelector('.studio-utilities')?.before(nav);
function select(key,scroll=true){
 const cfg=paths.find(x=>x[0]===key);if(!cfg)return;
 $('studio-extra-tools').open=true;
 for(const id of ['brand-settings','manual-campaign-settings','studio-tools','security-settings']){
  const details=$(id);if(details)details.open=id===cfg[3];
 }
 nav.querySelectorAll('button').forEach(button=>button.setAttribute('aria-selected',String(button.dataset.uxSettings===key)));
 if(scroll){
  const target=key==='theme'?$('theme-choices'):$(cfg[3]);
  if(target){target.scrollIntoView({block:key==='theme'?'center':'start',behavior:'instant'});}
 }
}
nav.addEventListener('click',e=>{const button=e.target.closest('[data-ux-settings]');if(button)select(button.dataset.uxSettings)});
const files=[
 ['brand-logo','انتخاب لوگو','Logo wählen'],
 ['brand-scene','انتخاب پس‌زمینه','Hintergrund wählen'],
 ['brand-token','انتخاب تصویر محصول یا نماد','Produktmotiv wählen']
];
const wrappers=new Map();
for(const [id,faLabel,deLabel] of files){
 const input=$(id);if(!input)return;
 const label=input.closest('label');if(!label)return;
 label.classList.add('ux-file-label');
 const container=document.createElement('span');container.className='ux-upload-control';container.setAttribute('aria-hidden','true');
 const name=document.createElement('span');name.className='ux-upload-name';
 const action=document.createElement('span');action.className='ux-upload-action';
 container.append(name,action);input.after(container);
 wrappers.set(id,{input,name,action,faLabel,deLabel});
 input.addEventListener('change',()=>updateFile(id));
}
function updateFile(id){
 const w=wrappers.get(id);if(!w)return;
 w.name.textContent=w.input.files?.[0]?.name||t('فایلی انتخاب نشده','Noch keine Datei ausgewählt');
 w.action.textContent=t(w.faLabel,w.deLabel);
}
const themeNames={
 atelier:['آتلیر','Atelier'],neon:['نئون','Neon'],garden:['طبیعت','Garden'],pop:['پاپ','Pop'],
 noir:['نوآر','Noir'],chrome:['کروم','Chrome'],dream:['رویا','Dream'],heritage:['کلاسیک','Heritage']
};
const themeDescriptions={atelier:['مینیمال','Minimal'],neon:['بازی و نور','Arcade'],garden:['طبیعی','Natur'],pop:['سرزنده','Lebendig'],noir:['لوکس','Luxus'],chrome:['مدرن','Modern'],dream:['ملایم','Sanft'],heritage:['اصیل','Klassisch']};
for(const tile of document.querySelectorAll('#theme-choices .theme-tile')){
 const key=tile.dataset.theme;const title=tile.querySelector('b'),sub=tile.querySelector('small');
 if(title&&themeNames[key]){title.dataset.uxTheme=key;}
 if(sub&&themeDescriptions[key]){sub.dataset.uxThemeDesc=key;}
}
function localize(){
 nav.querySelectorAll('button').forEach(b=>b.textContent=b.dataset[fa()?'fa':'de']);
 for(const id of wrappers.keys())updateFile(id);
 document.querySelectorAll('#theme-choices [data-ux-theme]').forEach(b=>{const n=themeNames[b.dataset.uxTheme];if(n)b.textContent=n[fa()?0:1]});
 document.querySelectorAll('#theme-choices [data-ux-theme-desc]').forEach(b=>{const n=themeDescriptions[b.dataset.uxThemeDesc];if(n)b.textContent=n[fa()?0:1]});
}
function onOpen(){
 if(overlay.hidden)return;
 // New merchants see identity first; established businesses keep all advanced tabs accessible.
 const brand=$('brand-settings');
 if(brand?.open)select('brand',false);
 else if($('manual-campaign-settings')?.open)select('campaign',false);
 else if($('security-settings')?.open)select('security',false);
 else if($('studio-tools')?.open)select('report',false);
 else select('brand',false);
 localize();
}
const obs=new MutationObserver(onOpen);obs.observe(overlay,{attributes:true,attributeFilter:['hidden']});
document.addEventListener('pwyw:language-changed',localize);
document.addEventListener('click',e=>{
 const target=e.target.closest('#open-studio-settings,#quick-edit');
 if(target)requestAnimationFrame(onOpen);
},true);
localize();
})();
