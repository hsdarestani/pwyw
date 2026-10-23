/* Persistent merchant reward-rules console. The previous campaign builder remains optional. */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const fa=()=>window.PWYWI18N?.locale()==="fa";
const txt=(de,faText)=>fa()?faText:de;
const state={slug:"",templates:[],rules:[],recommended:[],editing:null,seq:0};
const games={all:"Alle Spiele",memory:"Memory",merge:"2048",rush:"Quick Tap",snake:"Snake",breaker:"Block Breaker",hop:"Sky Hop",orbit:"Orbit",bloom:"Bloom Pop",lane:"Neon Lane",sequence:"Sequence"};
const typeNames={
 first_play:["Erstes Spiel","اولین بازی"],repeat_days:["Mehrere Spieltage","چند روز بازی"],
 score_threshold:["Punktezahl, mit Kontrolle","امتیاز، با تأیید"],leaderboard_daily:["Tagesrangliste","لیدربورد روزانه"],
 leaderboard_weekly:["Wochenrangliste","لیدربورد هفتگی"],verified_visit:["Bestätigter Besuch","مراجعه تأییدشده"],
 verified_referral:["Echte Empfehlung","معرفی واقعی"]
};
function trType(type){const a=typeNames[type]||[type,type];return a[fa()?1:0]}
const euro=cents=>(Number(cents)/100).toLocaleString(fa()?"fa-IR":"de-DE",{style:"currency",currency:"EUR"});
async function api(path,method="GET",body){
 const r=await fetch(path,{method,credentials:"same-origin",headers:{"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)});
 let result={};try{result=await r.json()}catch{}
 if(!r.ok)throw Error(typeof result.detail==="string"?result.detail:"Request failed ("+r.status+")");
 return result;
}
function message(target,text,error=false){
 const node=$(target);node.textContent=text;node.classList.toggle("error",error);
}
function el(tag,klass,text){const n=document.createElement(tag);if(klass)n.className=klass;if(text!==undefined)n.textContent=text;return n}
function status(text,error=false){message("reward-action-status",text,error)}
function renderInsights(stats){
 const format=n=>Number(n||0).toLocaleString(fa()?"fa-IR":"de-DE");
 $("reward-stat-plays").textContent=format(stats.finished);
 $("reward-stat-rules").textContent=format(stats.live_rules);
 $("reward-stat-issued").textContent=format(stats.issued);
 $("reward-stat-liability").textContent=euro(stats.estimated_prize_liability_cents);
}
function updateRulePreview(){
 const info=formData(),format=fa();
 const when={
  first_play:["beim ersten Spiel","بعد از اولین بازی"],
  repeat_days:["nach "+info.target_count+" verschiedenen Spieltagen","بعد از "+info.target_count+" روز بازی"],
  score_threshold:["bei mindestens "+info.target_count+" geprüften Punkten","با حداقل "+info.target_count+" امتیاز تأییدشده"],
  leaderboard_daily:["für die besten Plätze des Tages","برای نفرات برتر روز"],
  leaderboard_weekly:["für die besten Plätze der Woche","برای نفرات برتر هفته"],
  verified_visit:["nach bestätigtem Besuch","بعد از مراجعه تأییدشده"],
  verified_referral:["nach bestätigter Empfehlung","بعد از معرفی تأییدشده"]
 }[info.rule_type]||["beim Spielen","هنگام بازی"];
 const qualifier=info.game==="all"?(format?"در همه بازی‌ها":"in allen Spielen"):
  (format?"در بازی ":"im Spiel ")+(games[info.game]||info.game);
 const text=format?qualifier+"، "+when[1]+"، جایزه «"+info.reward_title+"» ارائه می‌شه.":
  qualifier+" "+when[0]+": „"+info.reward_title+"“.";
 $("rule-preview-copy").textContent=text;
}

function formData(){
 const form=$("rule-form");
 const n=name=>form.elements.namedItem(name);
 const type=n("rule_type").value;
 const period=type==="leaderboard_daily"?"daily":type==="leaderboard_weekly"?"weekly":"lifetime";
 return {
  title:n("title").value.trim(),rule_type:type,game:n("game").value,period,
  target_count:Number(n("target_count").value)||1,reward_title:n("reward_title").value.trim(),
  delivery:n("delivery").value,
  reward_cost_cents:Math.round(Number(n("reward_cost").value)*100),
  budget_cents:Math.round(Number(n("budget").value)*100),
  max_awards:Number(n("max_awards").value)||1,
  is_active:n("is_active").checked
 };
}
function setForm(rule){
 const f=$("rule-form");state.editing=rule.id||null;
 for(const [key,value] of Object.entries(rule)){
  let name=key;
  if(key==="reward_cost_cents")name="reward_cost";
  if(key==="budget_cents")name="budget";
  const field=f.elements.namedItem(name);if(!field)continue;
  const final=(key==="reward_cost_cents"||key==="budget_cents")?(Number(value)/100).toFixed(2):value;
  if(field.type==="checkbox")field.checked=Boolean(final);else field.value=final;
 }
 $("rule-editor").open=true;
 $("rule-advanced").open=false;
 typeChanged();
 message("rule-form-status","");
 $("rule-editor").scrollIntoView({behavior:"smooth",block:"start"});
}
function typeChanged(){
 const f=$("rule-form"),type=f.elements.namedItem("rule_type").value;
 const isRanking=type.startsWith("leaderboard");
 const oneAction=["first_play","verified_visit","verified_referral"].includes(type);
 const n=f.elements.namedItem("target_count");
 if(oneAction){n.value=1;n.disabled=true}else n.disabled=false;
 $("rule-target-wrap").hidden=oneAction||isRanking;
 if(isRanking&&f.elements.namedItem("game").value==="all")f.elements.namedItem("game").value="breaker";
 f.elements.namedItem("game").querySelector('option[value="all"]').disabled=isRanking;
 // Daily/weekly winners use max_awards; the numerical threshold is not relevant.
 if(isRanking)n.value=1;
 updateRulePreview();
}
function templateCard(template){
 const button=el("button","reward-template");
 button.type="button";button.dataset.template=template.key;
 button.append(el("strong","",fa()?template.label_fa:template.label));
 button.append(el("span","",fa()?template.reason_fa:template.reason));
 if(state.recommended.includes(template.key))button.append(el("small","reward-best",txt("Empfohlen","پیشنهادی")));
 button.addEventListener("click",()=>setForm(template));
 return button;
}
function renderTemplates(){
 const box=$("rule-templates");box.replaceChildren();
 const sorted=[...state.templates].sort((a,b)=>Number(state.recommended.includes(b.key))-Number(state.recommended.includes(a.key)));
 for(const template of sorted)box.append(templateCard(template));
}
function ruleCard(rule){
 const box=el("div","reward-rule-item");
 const top=el("div","reward-rule-top");const title=el("strong","",rule.title);
 const status=el("span",rule.is_active?"reward-on":"reward-off",rule.is_active?txt("Aktiv","فعال"):txt("Pausiert","غیرفعال"));
 top.append(title,status);box.append(top);
 box.append(el("p","reward-rule-description",
  trType(rule.rule_type)+" · "+(rule.game==="all"?txt("Alle Spiele","همه بازی‌ها"):games[rule.game])+
  " · "+rule.reward_title));
 box.append(el("small","reward-rule-budget",txt("Budget: ","بودجه: ")+euro(rule.budget_cents)+
  " · "+txt("Ausgegeben: ","صادرشده: ")+rule.awards_issued+
  " · "+txt("Eingelöst: ","استفاده‌شده: ")+rule.awards_redeemed));
 const actions=el("div","reward-rule-actions");
 const edit=el("button","reward-secondary",txt("Bearbeiten","ویرایش"));edit.type="button";
 edit.addEventListener("click",()=>setForm(rule));actions.append(edit);
 const toggle=el("button","reward-secondary",rule.is_active?txt("Pausieren","توقف"):txt("Aktivieren","فعال‌سازی"));
 toggle.type="button";
 toggle.addEventListener("click",async()=>{
  toggle.disabled=true;
  try{const payload={...rule,is_active:!rule.is_active};
   // Remove computed fields and leave just schema properties.
   const keys=["title","rule_type","game","period","target_count","reward_title","delivery","reward_cost_cents","budget_cents","max_awards","is_active"];
   await api("/api/brands/"+encodeURIComponent(state.slug)+"/reward-rules/"+rule.id,"PUT",Object.fromEntries(keys.map(k=>[k,payload[k]])));
   await load();
  }catch(e){status(e.message,true)}finally{toggle.disabled=false}
 });actions.append(toggle);
 if(rule.is_active&&rule.rule_type.startsWith("leaderboard")){
  const settle=el("button","reward-secondary",txt("Letzten Zeitraum abrechnen","دوره قبلی را نهایی کن"));
  settle.type="button";
  settle.addEventListener("click",async()=>{
   if(!confirm(txt("Browser-Punkte sind nicht fälschungssicher. Hast du die Ergebnisse geprüft und möchtest die Preise ausgeben?",
     "امتیاز مرورگر ضدتقلب قطعی نیست. نتایج را بررسی کرده‌ای و می‌خواهی جایزه‌ها صادر شوند؟")))return;
   settle.disabled=true;
   try{const res=await api("/api/brands/"+encodeURIComponent(state.slug)+"/reward-rules/"+rule.id+"/settle","POST",{});
    status(txt("Gewinner: ","برندگان: ")+res.winners.length+" · "+res.period_key);
    await load();
   }catch(e){status(e.message,true)}finally{settle.disabled=false}
  });actions.append(settle);
 }
 box.append(actions);return box;
}
function renderRules(){
 const list=$("rule-list");list.replaceChildren();
 if(!state.rules.length)list.append(el("p","reward-empty",txt("Noch keine Regeln. Wähle einen Vorschlag.","هنوز قانونی نداری. یکی از پیشنهادها رو انتخاب کن.")));
 for(const r of state.rules)list.append(ruleCard(r));
 const select=$("rule-verify-select");select.replaceChildren();
 for(const r of state.rules.filter(x=>x.is_active&&["verified_visit","verified_referral","score_threshold"].includes(x.rule_type))){
  const opt=document.createElement("option");opt.value=r.id;opt.textContent=r.title;select.append(opt);
 }
 $("rule-verify-form").querySelector('button[type="submit"]').disabled=!select.options.length;
}
async function load(){
 const slug=state.slug;if(!slug)return;
 const n=++state.seq;
 const [rules,rec,stats]=await Promise.all([
  api("/api/brands/"+encodeURIComponent(slug)+"/reward-rules"),
  api("/api/brands/"+encodeURIComponent(slug)+"/reward-recommendations"),
  api("/api/brands/"+encodeURIComponent(slug)+"/reward-insights")
 ]);
 if(n!==state.seq||state.slug!==slug)return;
 state.rules=rules;state.recommended=rec.recommended||[];
 const phrase=fa()?"توصیه اولیه بر اساس نوع کسب‌وکاره؛ افزایش فروش هنوز اثبات نشده.":rec.reason;
 $("rule-recommendation").textContent=phrase;
 renderInsights(stats);renderTemplates();renderRules();
}
function chooseBrand(slug){
 state.slug=slug||"";state.editing=null;state.seq++;
 const section=$("reward-hub");section.hidden=!slug;
 if(!slug)return;
 $("reward-portal-link").href="/play/"+encodeURIComponent(slug);
 const qr="/qr/"+encodeURIComponent(slug)+".svg";
 $("reward-portal-qr").src=qr;$("reward-qr-download").href=qr;
 $("reward-portal-share").open=false;
 $("rule-editor").open=false;
 message("rule-form-status","");status("");
 load().catch(e=>status(e.message,true));
}
$("reward-copy-portal").addEventListener("click",async()=>{
 const link=new URL("/play/"+encodeURIComponent(state.slug),location.origin).href;
 try{await navigator.clipboard.writeText(link);
  message("reward-share-status",txt("Link kopiert ✓","لینک کپی شد ✓"));
 }catch{message("reward-share-status",link)}
});
$("rule-type").addEventListener("change",typeChanged);
$("rule-form").addEventListener("input",updateRulePreview);
$("rule-form").addEventListener("change",updateRulePreview);
$("rule-from-scratch").addEventListener("click",()=>{
 $("rule-form").reset();setForm({id:null,title:"Meine neue Regel",rule_type:"first_play",game:"all",period:"lifetime",
  target_count:1,reward_title:"Kleines Dankeschön",delivery:"code",
  reward_cost_cents:100,budget_cents:2000,max_awards:20,is_active:false});
});
$("rule-cancel").addEventListener("click",()=>{$("rule-editor").open=false;state.editing=null});
$("rule-form").addEventListener("submit",async e=>{
 e.preventDefault();const data=formData(),button=$("rule-save");button.disabled=true;
 if(data.rule_type.startsWith("leaderboard")&&data.game==="all"){
  message("rule-form-status",txt("Bitte ein Spiel auswählen.","لطفاً یک بازی مشخص انتخاب کن."),true);button.disabled=false;return;
 }
 try{
  if(state.editing)await api("/api/brands/"+encodeURIComponent(state.slug)+"/reward-rules/"+state.editing,"PUT",data);
  else await api("/api/brands/"+encodeURIComponent(state.slug)+"/reward-rules","POST",data);
  $("rule-editor").open=false;state.editing=null;await load();
  status(txt("Regel gespeichert. Du kannst das Portal direkt testen.","قانون ذخیره شد. حالا می‌تونی پورتال رو تست کنی."));
 }catch(err){message("rule-form-status",err.message,true);status(err.message,true)}finally{button.disabled=false}
});
$("rule-verify-form").addEventListener("submit",async e=>{
 e.preventDefault();const id=$("rule-verify-select").value;
 if(!id)return;
 try{const res=await api("/api/brands/"+encodeURIComponent(state.slug)+"/reward-rules/"+id+"/verify","POST",
   {sid:$("rule-verify-sid").value.trim()});
  message("rule-staff-status",txt("Belohnungscode: ","کد جایزه: ")+res.code);await load();status(txt("Aktion bestätigt.","مراجعه یا فعالیت تأیید شد."))
 }catch(err){message("rule-staff-status",err.message,true)}
});
$("rule-redeem-form").addEventListener("submit",async e=>{
 e.preventDefault();
 try{await api("/api/brands/"+encodeURIComponent(state.slug)+"/reward-rules/redeem","POST",
   {code:$("rule-redeem-code").value.trim()});
   message("rule-staff-status",txt("Code eingelöst ✓","کد استفاده شد ✓"));
   $("rule-redeem-code").value="";await load();
 }catch(err){message("rule-staff-status",err.message,true)}
});
document.addEventListener("pwyw:brand-selected",e=>chooseBrand(e.detail?.slug||""));
document.addEventListener("pwyw:language-changed",()=>{if(state.slug)load().catch(()=>{});else renderTemplates()});
api("/api/reward-rule-templates").then(templates=>{
 state.templates=templates;renderTemplates();
}).catch(e=>message("rule-recommendation",e.message,true));
})();
