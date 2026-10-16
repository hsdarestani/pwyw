/* PWYW Campaign Assistant / only two decisions: approve or try another.
   No API secrets, unpublished draft persistence or generation happens in the browser. */
(()=>{"use strict";
const $=id=>document.getElementById(id);
let current=null, requestSeq=0, busy=false;
const studio=()=>window.PWYWStudio;
const fa=()=>window.PWYWI18N?.locale()==='fa';
const label=(persian,german)=>fa()?persian:german;
const gameNames={orbit:"Orbit Catch",memory:"Memory Match",merge:"Merge Lab 2048",
lane:"Neon Lane",bloom:"Bloom Pop",breaker:"Block Breaker",snake:"Snake Circuit",
hop:"Sky Hop",rush:"Quick Tap",sequence:"Sequence"};
const gameIcons={orbit:"✷",memory:"▦",merge:"2048",lane:"⟋⟍",bloom:"❀",breaker:"▤",snake:"〰",hop:"➚",rush:"✦",sequence:"◉"};
function showError(msg){const x=$("proposal-error");x.textContent=msg;x.hidden=false}
function clearError(){$("proposal-error").textContent="";$("proposal-error").hidden=true}
function getPreviewPayload(){
 if(!current)return null;
 const p=current.campaign;
 return fa()?(p.translations?.fa||{}):p;
}
let previewStep=2;
const stageNames={
 fa:["مشتری وارد صفحه بازی می‌شه","مشتری یک بازی کوتاه انجام می‌ده","بعد از بازی این پیام رو می‌بینه"],
 de:["Kundschaft öffnet die Spielseite","Kundschaft spielt eine kurze Runde","Danach erscheint diese Nachricht"]
};
function setStage(index){
 previewStep=Math.max(0,Math.min(2,Number(index)));
 ["start","game","result"].forEach((name,i)=>{
   $("customer-stage-"+name).hidden=i!==previewStep;
 });
 document.querySelectorAll("[data-customer-stage]").forEach(btn=>{
   btn.setAttribute("aria-pressed",String(Number(btn.dataset.customerStage)===previewStep));
 });
 $("customer-preview-caption").textContent=stageNames[fa()?"fa":"de"][previewStep];
}
document.querySelectorAll("[data-customer-stage]").forEach(button=>{
 button.addEventListener("click",()=>setStage(button.dataset.customerStage));
});
function render(){
 const p=current?.campaign;
 const data=getPreviewPayload();
 const brand=studio()?.getBrand();
 // These messages also update after a language switch, even on the published screen.
 $("proposal-published").querySelector("strong").textContent=label("بازی مشتری‌هات منتشر شد!","Das Kundenspiel ist online!");
 $("proposal-published").querySelector("p").textContent=label("لینک یا کد QR بازی رو برای مشتری‌ها بفرست تا وارد بازی بشن.","Teile den Link oder QR Code, damit deine Kundschaft spielen kann.");
 $("proposal-open").textContent=label("بازی منتشرشده رو ببین ↗","Veröffentlichtes Spiel ansehen ↗");
 $("proposal-new").textContent=label("یه پیشنهاد دیگه بساز","Einen weiteren Vorschlag erstellen");
 if(!p||!data)return;
 $("proposal-title").textContent=data.title||p.title;
 $("proposal-description").textContent=data.description||p.description;
 const industry=p.owner_explanation?.[fa()?"fa":"de"];
 $("proposal-owner-note-label").textContent=label("این پیشنهاد چه کمکی به کسب‌وکار می‌کنه؟","Warum kann dieser Vorschlag sinnvoll sein?");
 $("proposal-owner-note").textContent=industry||label(
  "این ایده برای هدف انتخابی شما آماده شده. قبل از انتشار، از درست‌بودن اطلاعات و قابل‌ارائه‌بودن پیشنهاد مطمئن شو.",
  "Der Vorschlag passt zum ausgewählten Ziel. Prüfe vor dem Veröffentlichen alle Angaben.");

 $("customer-welcome-title").textContent=data.title||p.title;
 $("customer-welcome-desc").textContent=data.description||p.description;
 $("customer-screen-brand").textContent=brand?.name||label("کسب‌وکار شما","Dein Unternehmen");
 $("proposal-product").textContent=data.product_name||p.product_name;
 $("proposal-offer").textContent=data.offer||p.offer;
 $("proposal-game-icon").textContent=gameIcons[p.game]||"✳";
 $("proposal-game-name").textContent=window.PWYWI18N?.t(gameNames[p.game]||p.game)||p.game;
 $("customer-game-description").textContent=label(
  "مشتری بازی رو روی گوشی انجام می‌ده. بعد از پایان بازی، پیام زیر نمایش داده می‌شه.",
  "Das Mini Game läuft auf dem Smartphone. Danach erscheint die folgende Nachricht.");
 $("customer-screen-logo").textContent=gameIcons[p.game]||"✳";
 const isLearn=p.objective==="learn";
 $("customer-quiz-preview").hidden=!isLearn;
 $("proposal-cta").hidden=isLearn;
 if(isLearn){
   $("proposal-quiz").textContent=data.quiz_question||p.quiz_question||"";
   const options=fa()?(p.translations?.fa?.quiz_options||p.quiz_options):p.quiz_options;
   $("customer-quiz-options").replaceChildren();
   for(const option of (Array.isArray(options)?options:[])){
     const text=document.createElement("div");
     text.className="customer-quiz-option";
     text.textContent=option;
     $("customer-quiz-options").append(text);
   }
 }else{
   // Match the actual customer game's button behavior: this issues a code or shares a challenge.
   $("proposal-cta").textContent=p.objective==="refer"?
     label("دعوت از دوستان ↗","Freunde herausfordern ↗"):
     label("دریافت کد پیشنهاد ↗","Angebotscode erhalten ↗");
 }
 $("customer-stage-start").querySelector(".customer-screen-overline").textContent=label("به بازی خوش اومدی","Willkommen beim Spiel");
 $("customer-stage-start").querySelector(".customer-preview-button").textContent=label("شروع بازی ↗","Spiel starten ↗");
 $("customer-stage-game").querySelector(".customer-screen-overline").textContent=label("بازی روی گوشی","Ein Spiel fürs Smartphone");
 $("customer-stage-game").querySelector(".customer-preview-button").textContent=label("بازی کوتاه","Kurzes Spiel");
 $("customer-stage-result").querySelector(".customer-screen-overline").textContent=label("بعد از بازی","Nach dem Spiel");
 $("proposal-approve").textContent=label("تأیید و انتشار بازی","Spiel bestätigen und veröffentlichen");
 $("proposal-reject").textContent=label("این رو نمی‌پسندم؛ یه پیشنهاد دیگه","Andere Idee vorschlagen");
 $("proposal-card").querySelector(".proposal-eyebrow").textContent=label("این تجربه رو مشتری‌های شما می‌بینن","So erleben deine Kunden das Spiel");
 $("proposal-card").querySelector(".proposal-trust").textContent=label(
   "پیشنهاد رو بررسی کن. فقط با تأیید شما برای مشتری‌ها منتشر می‌شه.",
   "Prüfe den Vorschlag. Erst nach deiner Zustimmung wird er veröffentlicht.");
 document.querySelector(".customer-preview-heading span:last-child").textContent=label("نمایش نمونه · هنوز منتشر نشده","Beispielansicht · noch nicht veröffentlicht");
 document.querySelector(".customer-preview-note").textContent=label(
   "این تصویر نمونه‌ای از مسیر مشتریه، نه خود بازی. متن‌های صفحه و پیام پایانی از همین پیشنهاد گرفته شدن.",
   "Die Ansicht zeigt den Ablauf, nicht das echte Spiel. Die Texte entsprechen diesem Vorschlag.");
 document.querySelector(".customer-journey-intro").textContent=label(
   "مشتری لینک یا کد QR رو باز می‌کنه، یه بازی کوتاه انجام می‌ده و در پایان پیام شما رو می‌بینه. روی هر مرحله بزن تا ببینی چه اتفاقی می‌افته.",
   "Deine Kunden öffnen den Link oder QR Code, spielen eine kurze Runde und sehen danach deine Nachricht. Tippe auf einen Schritt, um ihn anzusehen.");
 const names=fa()?["ورود مشتری","انجام بازی","پیام بعد از بازی"]:["Spiel öffnen","Spielen","Nach dem Spiel"];
 document.querySelectorAll("[data-customer-stage]").forEach((button,i)=>{
   button.querySelector("strong").textContent=names[i];
 });
 setStage(previewStep);
}
function setBusy(value){
 busy=value;
 $("proposal-approve").disabled=value;
 $("proposal-reject").disabled=value;
 $("proposal-new").disabled=value;
}
async function call(path,body){
 const r=await fetch(path,{method:"POST",credentials:"same-origin",
   headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
 let data={};try{data=await r.json()}catch{}
 if(!r.ok)throw Error(typeof data.detail==='string'?data.detail:"Request failed");
 return data;
}
async function propose(reject=false){
 const ctx=studio();
 const b=ctx?.getBrand();const objective=ctx?.getObjective();
 if(!b||!objective)return;
 const seq=++requestSeq;
 const previous=reject&&current?.campaign.objective===objective&&current?.brand===b.slug?current.proposal_id:"";
 setBusy(true);clearError();
 $("proposal-published").hidden=true;$("proposal-card").hidden=true;$("proposal-loading").hidden=false;
 $("proposal-loading").textContent=label("دارم یک پیشنهاد تازه آماده می‌کنم…","Ich erstelle einen neuen Vorschlag…");
 try{
   const answer=await call("/api/brands/"+encodeURIComponent(b.slug)+"/campaigns/propose",{objective,reject_id:previous||""});
   if(seq!==requestSeq||ctx.getBrand()?.slug!==b.slug||ctx.getObjective()!==objective)return;
   current={...answer,brand:b.slug};
   previewStep=2;
   $("proposal-card").hidden=false;render();
 }catch(error){
   if(seq===requestSeq)showError(label("پیشنهاد آماده نشد. دوباره تلاش کن.","Der Vorschlag konnte nicht erstellt werden. Versuche es erneut."));
 }finally{if(seq===requestSeq){$("proposal-loading").hidden=true;setBusy(false)}}
}
async function approve(){
 const p=current,ctx=studio();if(!p||busy)return;
 if(!ctx?.getBrand()||ctx.getBrand().slug!==p.brand||ctx.getObjective()!==p.campaign.objective)return;
 setBusy(true);clearError();
 try{
   const result=await call("/api/brands/"+encodeURIComponent(p.brand)+"/campaigns/approve",{proposal_id:p.proposal_id});
   if(current!==p)return;
   $("proposal-card").hidden=true;
   $("proposal-published").hidden=false;
   const link="/play/"+encodeURIComponent(p.brand)+"?objective="+encodeURIComponent(p.campaign.objective)+(fa()?"&lang=fa":"");
   $("proposal-open").href=link;
   ctx.afterApproval(result.campaign);
   render();
 }catch(error){showError(label("انتشار انجام نشد؛ دوباره تلاش کن.","Veröffentlichung fehlgeschlagen. Bitte erneut versuchen."))}
 finally{setBusy(false)}
}
$("proposal-approve").addEventListener("click",approve);
$("proposal-reject").addEventListener("click",()=>propose(true));
$("proposal-new").addEventListener("click",()=>{current=null;propose(false)});
document.addEventListener("pwyw:objective-selected",()=>{current=null;propose(false)});
document.addEventListener("pwyw:language-changed",()=>{
 if(!$("proposal-published").hidden){
  const b=studio()?.getBrand(),o=studio()?.getObjective();
  if(b&&o)$("proposal-open").href="/play/"+encodeURIComponent(b.slug)+"?objective="+encodeURIComponent(o)+(fa()?"&lang=fa":"");
 }
 render()
});
})();
