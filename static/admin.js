/* PWYW administrator: overview first, details on demand. */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const fa=()=>document.documentElement.lang==='fa';
const wording=(de,faText)=>fa()?faText:de;
async function api(path,options={}){
 const resp=await fetch(path,{credentials:"same-origin",headers:{"Content-Type":"application/json"},...options});
 let data={};try{data=await resp.json()}catch{}
 if(!resp.ok)throw Error(data.detail||wording("Die Anfrage ist fehlgeschlagen.","درخواست انجام نشد."));
 return data;
}
function table(target,headers,rows){
 const root=$(target);root.replaceChildren();
 if(!rows.length){
  const note=document.createElement("p");
  note.textContent=wording("Noch keine Einträge.","هنوز موردی ثبت نشده.");
  root.append(note);return;
 }
 const table=document.createElement("table"),head=document.createElement("thead"),hr=document.createElement("tr");
 headers.forEach(h=>{const th=document.createElement("th");th.textContent=wording(h.de,h.fa);hr.append(th)});
 head.append(hr);table.append(head);
 const body=document.createElement("tbody");
 rows.forEach(row=>{
  const tr=document.createElement("tr");
  headers.forEach(h=>{const td=document.createElement("td");td.textContent=String(row[h.key]??"—");tr.append(td)});
  body.append(tr);
 });
 table.append(body);root.append(table);
}
function filterRows(inputId,target){
 const term=$(inputId).value.trim().toLocaleLowerCase();
 document.querySelectorAll('#'+target+' tbody tr').forEach(tr=>{
  tr.hidden=term!==''&&!tr.textContent.toLocaleLowerCase().includes(term);
 });
}
for(const [field,target] of [["cr-brand-search","cr-brands"],["cr-user-search","cr-users"]]){
 $(field).addEventListener("input",()=>filterRows(field,target));
}
function renderStats(overview){
 const main=$("cr-stats"),more=$("cr-more-stats-content");
 main.replaceChildren();more.replaceChildren();
 const primary=[
  [wording("Geschäfte","کسب‌وکارها"),overview.brands],
  [wording("Aktive Angebote","پیشنهادهای فعال"),overview.active_campaigns],
  [wording("Bestätigte Codes","کدهای تأییدشده"),overview.claims.redeemed]
 ];
 const secondary=[
  [wording("Benutzerkonten","حساب‌های کاربری"),overview.users],
  [wording("Spielstarts in 30 Tagen","شروع بازی در ۳۰ روز"),overview.events_30d.starts],
  [wording("Ausgegebene Codes","کدهای صادرشده"),overview.claims.total]
 ];
 for(const [node,rows] of [[main,primary],[more,secondary]]){
  for(const [label,value] of rows){
   const cell=document.createElement("div");
   const title=document.createElement("span"),number=document.createElement("strong");
   title.textContent=label;number.textContent=Number(value||0).toLocaleString(fa()?"fa-IR":"de-DE");
   cell.append(title,number);node.append(cell);
  }
 }
}
async function load(){
 const me=await api("/api/me");
 if(me.role!=="admin")throw Error(wording("Dieses Konto ist kein Administrator.","این حساب دسترسی مدیریت نداره."));
 const [overview,users,brands]=await Promise.all([
  api("/api/admin/overview"),api("/api/admin/users"),api("/api/admin/brands")
 ]);
 $("admin-user").textContent=me.email;
 $("cr-login").hidden=true;$("cr-app").hidden=false;
 const skip=document.querySelector('.pw4-skip');if(skip)skip.href='#cr-app';
 renderStats(overview);
 table("cr-brands",[
  {de:"Geschäft",fa:"کسب‌وکار",key:"name"},
  {de:"Inhaber",fa:"صاحب",key:"owner"},
  {de:"Spielstarts",fa:"شروع بازی",key:"game_starts"},
  {de:"Verifiziert",fa:"تأییدشده",key:"redemptions"}
 ],brands);
 table("cr-users",[
  {de:"E Mail",fa:"ایمیل",key:"email"},
  {de:"Rolle",fa:"نقش",key:"role"},
  {de:"Geschäfte",fa:"کسب‌وکارها",key:"brands"}
 ],users);
 filterRows("cr-brand-search","cr-brands");filterRows("cr-user-search","cr-users");
}
$("admin-login").addEventListener("submit",async event=>{
 event.preventDefault();
 const btn=event.currentTarget.querySelector('button[type="submit"]');
 const data=new FormData(event.currentTarget);
 btn.disabled=true;$("admin-error").textContent=wording("Anmeldung läuft…","در حال ورود…");
 try{
  await api("/api/login",{method:"POST",body:JSON.stringify({email:data.get("email"),password:data.get("password")})});
  await load();$("admin-error").textContent="";
 }catch(error){$("admin-error").textContent=error.message}
 finally{btn.disabled=false}
});
$("refresh-admin").addEventListener("click",async()=>{
 const btn=$("refresh-admin");btn.disabled=true;
 try{await load()}catch(e){$("admin-error").textContent=e.message}finally{btn.disabled=false}
});
$("admin-logout").onclick=async()=>{
 await api("/api/logout",{method:"POST",body:"{}"});
 $("cr-login").hidden=false;$("cr-app").hidden=true;
 const skip=document.querySelector('.pw4-skip');if(skip)skip.href='#cr-login';$("admin-login").reset();
};
$("change-password").addEventListener("submit",async event=>{
 event.preventDefault();
 const btn=event.currentTarget.querySelector('button[type="submit"]'),data=new FormData(event.currentTarget);
 btn.disabled=true;
 try{
  await api("/api/account/change-password",{method:"POST",body:JSON.stringify(Object.fromEntries(data))});
  $("change-status").textContent=wording("Passwort geändert. Bitte erneut anmelden.","رمز تغییر کرد. دوباره وارد شو.");
  await api("/api/logout",{method:"POST",body:"{}"});
  $("cr-login").hidden=false;$("cr-app").hidden=true;
 const skip=document.querySelector('.pw4-skip');if(skip)skip.href='#cr-login';$("change-password").reset();
 }catch(error){$("change-status").textContent=error.message}
 finally{btn.disabled=false}
});
document.addEventListener("pwyw:language-changed",()=>{
 if(!$("cr-app").hidden)load().catch(()=>{});
});
load().catch(()=>{});
})();