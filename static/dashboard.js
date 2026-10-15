/* PWYW Studio — deliberately tiny client, no trackers or build tools. */
const $ = (id) => document.getElementById(id);
const state = { mode:"login", brands:[], current:null, theme:"atelier", email:"" };
const industries = {cafe:"Café",restaurant:"Restaurant",salon:"Salon",auto:"Automotive",hotel:"Hotel",health:"Wellness",other:"Business"};

async function api(path, options={}){
  const r = await fetch(path, {credentials:"same-origin", ...options,
    headers:options.body instanceof FormData ? options.headers||{} :
      {"Content-Type":"application/json",...(options.headers||{})}});
  let data; try {data=await r.json()} catch { data={} }
  if (!r.ok) throw new Error(data.detail || "Something went wrong");
  return data;
}
function notice(id, message, bad=false){
  const node=$(id); node.textContent=message; node.classList.toggle("error",bad);
  node.hidden=!message;
}
function authMode(mode){
  state.mode=mode;
  $("tab-login").classList.toggle("active",mode==="login");
  $("tab-signup").classList.toggle("active",mode==="register");
  $("auth-title").textContent=mode==="login"?"Welcome back.":"Let's start playing.";
  $("auth-submit").firstChild.textContent=mode==="login"?"Sign in ":"Create my account ";
  $("auth-form").elements.password.autocomplete=mode==="login"?"current-password":"new-password";
  notice("auth-error","");
}
$("tab-login").addEventListener("click",()=>authMode("login"));
$("tab-signup").addEventListener("click",()=>authMode("register"));
$("auth-form").addEventListener("submit",async(e)=>{
  e.preventDefault();
  notice("auth-error","");
  const btn=$("auth-submit");btn.disabled=true;
  try {
    const data=new FormData(e.currentTarget);
    await api("/api/"+(state.mode==="login"?"login":"register"),{method:"POST",
      body:JSON.stringify({email:data.get("email"),password:data.get("password")})});
    await bootstrap();
  } catch(err){ notice("auth-error",err.message,true); }
  finally{btn.disabled=false}
});
$("logout").addEventListener("click",async()=>{
  await api("/api/logout",{method:"POST",body:"{}"});
  $("auth-shell").hidden=false;$("app-shell").hidden=true;$("logout").hidden=true;
  $("user-email").textContent="";
});
async function bootstrap(){
  try{
    const user=await api("/api/me");
    state.email=user.email;
    $("user-email").textContent=user.email;
    $("logout").hidden=false;$("auth-shell").hidden=true;$("app-shell").hidden=false;
    await loadBrands();
  }catch(e){
    $("auth-shell").hidden=false;$("app-shell").hidden=true;$("logout").hidden=true;
  }
}
async function loadBrands(prefer=""){
  state.brands=await api("/api/brands");
  renderBrandList();
  let target=state.brands.find(b=>b.slug===prefer);
  if(!target && state.current) target=state.brands.find(b=>b.slug===state.current.slug);
  if(!target && state.brands.length) target=state.brands[0];
  if(target) selectBrand(target);
  else newBrand();
}
function renderBrandList(){
  const list=$("brand-list"); list.replaceChildren();
  for(const b of state.brands){
    const item=document.createElement("button"); item.type="button";item.className="brand-nav";
    item.classList.toggle("active",state.current?.slug===b.slug);
    const dot=document.createElement("span");dot.className="brand-dot";dot.style.background=b.accent;
    const label=document.createElement("span");label.textContent=b.name;
    item.append(dot,label);item.addEventListener("click",()=>selectBrand(b));list.append(item);
  }
  if(!state.brands.length){const p=document.createElement("p");p.className="helper";p.style.padding="0 12px";p.textContent="Your lounges will appear here.";list.append(p)}
}
function setTheme(theme){
  state.theme=theme;
  document.querySelectorAll(".theme-choice").forEach(x=>x.classList.toggle("selected",x.dataset.theme===theme));
  $("editor-preview").className="editor-phone theme-"+theme;
}
function preview(){
  const name=$("brand-name").value.trim()||"Your brand.";
  const tagline=$("brand-tagline").value.trim()||"A little fun while you wait.";
  $("preview-name").textContent=name;
  $("preview-tagline").textContent=tagline;
  $("editor-preview").style.setProperty("--chosen-accent",$("brand-accent").value);
  $("workspace-title").textContent=state.current?name:"Your new game lounge.";
}
document.querySelectorAll(".theme-choice").forEach(btn=>btn.addEventListener("click",()=>{
  setTheme(btn.dataset.theme);preview();
}));
["brand-name","brand-tagline","brand-accent","brand-industry"].forEach(id=>$(id).addEventListener("input",preview));
$("brand-logo").addEventListener("change",()=>{
  const file=$("brand-logo").files[0];
  if(!file)return;
  if(file.size>1000000){notice("save-status","Logo must be under 1 MB",true);return}
  const reader=new FileReader();
  reader.onload=()=>{
    const logo=$("preview-logo");logo.replaceChildren();
    const img=document.createElement("img");img.src=reader.result;img.alt="Your logo";
    logo.append(img);
  };
  reader.readAsDataURL(file);
});
function newBrand(){
  state.current=null;
  $("brand-form").reset();
  $("brand-slug").disabled=false;
  $("brand-logo").value="";
  setTheme("atelier");
  $("brand-accent").value="#CBA66C";
  $("preview-logo").textContent="✳";
  $("brand-actions").hidden=true;
  $("results-section").hidden=true;
  $("workspace-subtitle").textContent="Make every waiting minute feel a little lighter.";
  renderBrandList();preview();
  notice("save-status","");
}
$("new-brand").addEventListener("click",newBrand);
function selectBrand(brand){
  state.current=brand;
  $("brand-name").value=brand.name;
  $("brand-tagline").value=brand.tagline;
  $("brand-industry").value=brand.industry;
  $("brand-accent").value=brand.accent;
  $("brand-slug").value=brand.slug;
  $("brand-slug").disabled=true;
  $("brand-logo").value="";
  setTheme(brand.theme);
  const logo=$("preview-logo");logo.replaceChildren();
  if(brand.logo_path){
    const img=document.createElement("img");img.alt=brand.name+" logo";img.src="/brand-logo/"+encodeURIComponent(brand.logo_path);logo.append(img);
  }else logo.textContent="✳";
  $("brand-actions").hidden=false;
  $("open-play").href="/play/"+encodeURIComponent(brand.slug);
  $("results-section").hidden=false;
  $("qr-image").src="/qr/"+encodeURIComponent(brand.slug)+".svg";
  $("qr-download").href=$("qr-image").src;
  $("workspace-subtitle").textContent="Your space is live. Make it feel even more like you.";
  renderBrandList();preview();
  loadStats(brand.slug);
  notice("save-status","");
}
$("brand-form").addEventListener("submit",async(e)=>{
  e.preventDefault();notice("save-status","Saving your lounge...");
  const btn=$("brand-save");btn.disabled=true;
  const payload={
    name:$("brand-name").value.trim(),
    tagline:$("brand-tagline").value.trim(),
    industry:$("brand-industry").value,
    theme:state.theme,
    accent:$("brand-accent").value,
    slug:state.current?.slug || $("brand-slug").value.trim()
  };
  try {
    const result=await api(state.current?"/api/brands/"+encodeURIComponent(state.current.slug):"/api/brands",
      {method:state.current?"PUT":"POST",body:JSON.stringify(payload)});
    if($("brand-logo").files[0]){
      const form=new FormData();form.append("file",$("brand-logo").files[0]);
      await api("/api/brands/"+encodeURIComponent(result.slug)+"/logo",{method:"POST",body:form});
    }
    state.current=null;
    await loadBrands(result.slug);
    notice("save-status","Saved. Your game lounge is ready to share.");
  }catch(e){notice("save-status",e.message,true)}
  finally{btn.disabled=false}
});
async function loadStats(slug){
  try{
    const data=await api("/api/brands/"+encodeURIComponent(slug)+"/stats");
    if(state.current?.slug!==slug)return;
    $("stat-visits").textContent=(data.totals.visit||0).toLocaleString();
    $("stat-starts").textContent=(data.totals.start||0).toLocaleString();
    $("stat-finishes").textContent=(data.totals.complete||0).toLocaleString();
    const chart=$("bars");chart.replaceChildren();
    const days=data.days.slice(-14);
    const max=Math.max(1,...days.map(d=>d.visits||0));
    for(const d of days){
      const bar=document.createElement("span");bar.style.height=(Math.max(4,((d.visits||0)/max)*100))+"%";
      bar.title=d.day+": "+d.visits+" opens";chart.append(bar);
    }
    if(!days.length){const p=document.createElement("p");p.className="helper";p.textContent="Play sessions will appear here.";chart.append(p)}
  }catch(e){console.error("Stats could not load",e)}
}
$("ai-suggest").addEventListener("click",async()=>{
  const btn=$("ai-suggest");btn.disabled=true;
  if(!state.current){notice("save-status","Save the brand first to use optional AI.",true);btn.disabled=false;return}
  try{
    const result=await api("/api/brands/"+encodeURIComponent(state.current.slug)+"/ai-suggest",
      {method:"POST",body:JSON.stringify({mood:state.theme,audience:industries[$("brand-industry").value]})});
    $("brand-tagline").value=result.tagline;preview();
    notice("save-status",result.ai?"AI suggestion ready. Review and save if you like.":"AI is optional and not configured. Your current copy is ready.");
  }catch(e){notice("save-status",e.message,true)}
  finally{btn.disabled=false}
});
bootstrap();
