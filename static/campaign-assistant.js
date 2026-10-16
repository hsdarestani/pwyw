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
function render(){
 const data=getPreviewPayload();
 const showDraft=Boolean(data&&current&&!$("proposal-published").hidden===false);
 // Explicit views are controlled by generation/approval, never by locale mutation.
 if(!data || $("proposal-card").hidden)return;
 const p=current.campaign;
 $("proposal-title").textContent=data.title||p.title;
 $("proposal-description").textContent=data.description||p.description;
 $("proposal-product").textContent=data.product_name||p.product_name;
 $("proposal-offer").textContent=data.offer||p.offer;
 $("proposal-cta").textContent=data.cta||p.cta;
 $("proposal-game-icon").textContent=gameIcons[p.game]||"✳";
 $("proposal-game-name").textContent=window.PWYWI18N?.t(gameNames[p.game]||p.game)||p.game;
 $("proposal-quiz").hidden=p.objective!=="learn";
 if(p.objective==="learn")$("proposal-quiz").textContent=data.quiz_question||p.quiz_question;
 $("proposal-approve").textContent=label("تأیید و انتشار کمپین","Vorschlag bestätigen und veröffentlichen");
 $("proposal-reject").textContent=label("این رو نمی‌خوام؛ یکی دیگه پیشنهاد بده","Nein, bitte eine neue Idee");
 $("proposal-card").querySelector(".proposal-eyebrow").textContent=label("پیشنهاد آماده‌ست","Dein neuer Kampagnenvorschlag");
 $("proposal-card").querySelector(".proposal-offer>span").textContent=label("بعد از بازی","Nach dem Spiel");
 $("proposal-card").querySelector(".proposal-trust").textContent=label("تا وقتی تأیید نکنی، چیزی منتشر نمی‌شه.","Nichts geht ohne deine Bestätigung online.");
 $("proposal-published").querySelector("strong").textContent=label("کمپینت منتشر شد!","Deine Kampagne ist online!");
 $("proposal-published").querySelector("p").textContent=label("لینک بازی رو برای مشتری‌ها بفرست.","Teile den Spiellink mit deinen Kundinnen und Kunden.");
 $("proposal-open").textContent=label("دیدن کمپین ↗","Kampagne öffnen ↗");
 $("proposal-new").textContent=label("ساخت پیشنهاد جدید","Neue Idee erhalten");
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
 if(busy)return;
 const seq=++requestSeq;
 const previous=reject&&current?.campaign.objective===objective&&current?.brand===b.slug?current.proposal_id:"";
 setBusy(true);clearError();
 $("proposal-published").hidden=true;$("proposal-card").hidden=true;$("proposal-loading").hidden=false;
 $("proposal-loading").textContent=label("دارم یک پیشنهاد تازه آماده می‌کنم…","Ich erstelle einen neuen Vorschlag…");
 try{
   const answer=await call("/api/brands/"+encodeURIComponent(b.slug)+"/campaigns/propose",{objective,reject_id:previous||""});
   if(seq!==requestSeq||ctx.getBrand()?.slug!==b.slug||ctx.getObjective()!==objective)return;
   current={...answer,brand:b.slug};
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
