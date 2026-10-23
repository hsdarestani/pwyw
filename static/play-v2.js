/* PWYW original mini-games. No third-party art or sounds, no game downloads. */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const slug = decodeURIComponent(location.pathname.split("/").filter(Boolean).pop() || "luna-cafe");
  const icons = {
    cafe:["☕","🥐","🍪","🍰","🧁","🍩","🫖","🍫"],
    restaurant:["🍕","🍔","🍝","🥗","🍣","🍒","🍋","🥑"],
    salon:["✿","✦","✧","❀","♥","☼","◆","◕"],
    auto:["⚡","◆","★","◈","◉","✦","⬡","⬢"],
    hotel:["✦","☾","☀","◇","❖","◉","☕","✿"],
    health:["✿","☼","♡","❀","◇","✧","✺","☯"],
    other:["✦","✳","◈","◆","☼","✿","◇","♧"]
  };
  const gameLabels={memory:"Memory Match",merge:"Merge Lab 2048",rush:"Quick Tap",snake:"Snake Circuit",breaker:"Block Breaker",hop:"Sky Hop",orbit:"Orbit Catch",bloom:"Bloom Pop",lane:"Neon Lane",sequence:"Sequence"};
  const gameSymbols={memory:"▦",merge:"2048",rush:"✦",snake:"〰",breaker:"▤",hop:"➚",orbit:"✷",bloom:"❀",lane:"⟋⟍",sequence:"◉"};
  const gameHints={memory:"MATCH / 1–2 MIN",merge:"THINK / 90 SEC",rush:"REFLEX / 30 SEC",snake:"CLASSIC / 54 SEC",breaker:"ARCADE / 65 SEC",hop:"FLY / 52 SEC",orbit:"CATCH / 45 SEC",bloom:"POP / 40 SEC",lane:"ACTION / 48 SEC",sequence:"RECALL / 58 SEC"};
  const localized=(obj,key)=>(window.PWYWI18N?.locale()==='fa' && obj?.translations?.fa?.[key])||obj?.[key]||'';
  const tr = value => window.PWYWI18N?.t(value) || value;
  const goalNames={upsell:"Play to Upsell",return:"Play to Return",refer:"Play to Refer",learn:"Play to Learn"};
  const portalMode=!new URLSearchParams(location.search).has("objective");
  let portalRules=[],playRun=null;
  let objective="upsell",campaigns={},campaign=null,refCode=new URLSearchParams(location.search).get("ref")||"",rewardCode="",rewardIsDemo=false,claimStatus="idle",rewardRequestId=0,featuredGame="orbit";
  let brandArt={}; let brandedToken=null;
  async function fetchBrandArt(){
    try{brandArt=await request("/api/public/brands/"+encodeURIComponent(slug)+"/art");
      const samples={
        "luna-cafe":"luna","volt-garage":"volt",
        "little-forest":"forest","poppy-studio":"poppy"
      };
      const builtin=samples[slug];
      if(builtin){
        brandArt.scene=brandArt.scene||"/static/worlds/"+builtin+"-scene.svg";
        brandArt.token=brandArt.token||"/static/worlds/"+builtin+"-token.svg";
      }
      const intro=document.querySelector(".campaign-intro");
      if(brandArt.scene){
        // Keep merchant illustration behind legible UI text without overriding world layout.
        intro.style.setProperty("--merchant-scene",'url("'+brandArt.scene+'")');
        intro.classList.add("has-brand-scene");
      }
      if(brandArt.token){
        brandedToken=new Image();brandedToken.src=brandArt.token;
        brand.tokenUrl=brandArt.token;
      }
      if(brandArt.scene)brand.sceneUrl=brandArt.scene;
    }catch{}
  }

  let brand=null, game=null, score=0, seconds=0, timer=null, timeoutIds=[], running=false, sound=true, visitSent=false;
  const sid = (() => {
    let s=sessionStorage.getItem("pwyw_sid");
    if(!s || !/^[A-Za-z0-9_-]{12,80}$/.test(s)){
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      s=Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
      sessionStorage.setItem("pwyw_sid",s);
    } return s;
  })();
  const safe = (n) => Math.max(0,Math.trunc(Number(n)||0));
  const pad = n => String(Math.floor(n)).padStart(2,"0");
  const visibleDigits = value => window.PWYWI18N?.locale()==="fa" ? String(value).replace(/[0-9]/g,ch=>"۰۱۲۳۴۵۶۷۸۹"[Number(ch)]) : String(value);
  const random = max => Math.floor(Math.random()*max);
  const shuffle = a => {const b=[...a];for(let i=b.length-1;i>0;i--){const j=random(i+1);[b[i],b[j]]=[b[j],b[i]]}return b};
  async function request(path, options={}){
    const response=await fetch(path,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});
    if(!response.ok) throw new Error("Request failed");
    return response.json();
  }
  function event(kind,extra={}){
    if(!brand)return;
    return request("/api/public/brands/"+encodeURIComponent(brand.slug)+"/events",{
      method:"POST",body:JSON.stringify({kind,game:game||"",sid,...extra})
    }).catch(()=>null);
  }
  function brandView(b){
    brand=b;
    const available=["atelier","neon","garden","pop","noir","chrome","dream","heritage"];
    const theme=available.includes(b.theme)?b.theme:"atelier";
    document.body.className="player-v2 theme-"+theme+(!$("finish-modal").hidden?" is-result-open":"");
    if(/^#[0-9a-fA-F]{6}$/.test(b.accent)){
      document.body.style.setProperty("--brand-accent",b.accent);
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content",b.accent);
    }
    $("game-business").textContent=b.name.toUpperCase();
    $("game-tagline").textContent=(window.PWYWI18N?.locale()==='fa'&&b.tagline_fa)?b.tagline_fa:(b.tagline||"A little fun with a real purpose.");
    $("scene-emblem").textContent=({cafe:"☕",restaurant:"✳",salon:"❀",auto:"⚡",hotel:"♢",health:"✧",other:"✷"})[b.industry]||"✷";
    if(b.logo_path){
      $("game-logo").src="/brand-logo/"+encodeURIComponent(b.logo_path);
      $("game-logo").hidden=false;
      $("game-symbol").hidden=true;
    }
    document.title=b.name+" / PWYW";
    if(!visitSent){event("visit");visitSent=true}
  }
  async function track(kind,detail=""){
    if(portalMode||!campaign)return;
    try{
      await request("/api/public/brands/"+encodeURIComponent(slug)+"/campaigns/"+objective+"/track",{
        method:"POST",body:JSON.stringify({sid,game:game||"",event:kind,detail})});
    }catch{}
  }
  async function loadPortalRules(){
    try{portalRules=await request("/api/public/brands/"+encodeURIComponent(slug)+"/reward-rules")}
    catch{portalRules=[]}
    renderPortalRules();
  }
  function renderPortalRules(){
    const block=$("portal-offers"),list=$("portal-rule-list"),isFa=window.PWYWI18N?.locale()==="fa";
    block.hidden=!portalMode||!portalRules.length;list.replaceChildren();
    $("portal-offers-title").textContent=isFa?"جایزه‌ها و مسابقه‌ها":"Preise & Challenges";
    for(const rule of portalRules){
      const card=document.createElement("div");card.className="portal-rule";
      const icon=document.createElement("span");icon.className="portal-rule-icon";
      icon.textContent=rule.rule_type.startsWith("leaderboard")?"🏆":rule.rule_type==="repeat_days"?"↺":"✦";
      const title=document.createElement("strong");title.textContent=rule.title;
      const line=document.createElement("p");line.textContent=rule.reward_title+
        (rule.rule_type.startsWith("leaderboard")?(isFa?" · برندگان پس از پایان دوره تأیید می‌شن":" · Gewinner nach Prüfung"):"");
      card.append(icon,title,line);
      if(rule.rule_type.startsWith("leaderboard")){
        const open=document.createElement("button");open.type="button";open.className="portal-rank-button";
        open.textContent=isFa?"دیدن رتبه‌ها ↗":"Rangliste ansehen ↗";
        const rankings=document.createElement("div");rankings.className="portal-ranks";rankings.hidden=true;
        open.addEventListener("click",async()=>{
          if(!rankings.hidden){rankings.hidden=true;return}
          rankings.hidden=false;rankings.textContent=isFa?"در حال بارگذاری…":"Wird geladen…";
          try{
            const data=await request("/api/public/brands/"+encodeURIComponent(slug)+"/rule-leaderboard/"+rule.id);
            rankings.replaceChildren();
            const caption=document.createElement("small");
            caption.textContent=data.period_key+(isFa?" · امتیازها هنوز تأیید نهایی نیستن":" · Vorläufige Ergebnisse");
            rankings.append(caption);
            for(const row of data.ranking){
              const p=document.createElement("p");
              p.textContent=row.rank+". "+row.nickname+" — "+visibleDigits(row.score);
              rankings.append(p);
            }
            if(!data.ranking.length){
              const p=document.createElement("p");p.textContent=isFa?"هنوز امتیازی ثبت نشده.":"Noch keine Punkte.";
              rankings.append(p);
            }
          }catch{rankings.textContent=isFa?"امکان دریافت رتبه‌ها نبود.":"Rangliste derzeit nicht erreichbar."}
        });
        card.append(open,rankings);
      }
      list.append(card);
    }
    $("portal-offers").querySelector(".portal-disclaimer").textContent=isFa?
      "امتیازها از مرورگر ثبت می‌شن و جایزه رقابت بعد از تأیید کسب‌وکار صادر می‌شه.":
      "Spielpunkte sind browserbasiert; Wettbewerbspreise werden vom Geschäft bestätigt.";
  }
  function setPortalPlayNote(de,persian){
    const notice=$("portal-play-note");
    if(notice)notice.textContent=window.PWYWI18N?.locale()==="fa"?persian:de;
  }
  async function loadEarnedRewards(){
    if(!portalMode)return;
    const box=$("portal-prizes");box.replaceChildren();box.hidden=false;
    setPortalPlayNote("","");
    const isFa=window.PWYWI18N?.locale()==="fa";
    try{
      const rewards=await request("/api/public/brands/"+encodeURIComponent(slug)+"/rewards?sid="+encodeURIComponent(sid));
      if(!rewards.length){
        const p=document.createElement("p");p.textContent=isFa?
          "هنوز جایزه‌ای صادر نشده. بازی‌های مختلف رو امتحان کن!":
          "Noch kein Preis ausgestellt. Probiere ein weiteres Spiel!";
        box.append(p);return;
      }
      rewards.slice(0,5).forEach(reward=>{
        const card=document.createElement("div");card.className="portal-earned";
        const title=document.createElement("strong");title.textContent=reward.reward_title;
        const code=document.createElement("code");code.textContent=reward.code;
        const status=document.createElement("small");
        status.textContent=reward.redeemed_at?(isFa?"قبلاً استفاده شده":"Bereits eingelöst"):
          (isFa?"برای استفاده به کارکنان نشون بده":"Beim Team vorzeigen");
        card.append(title,code,status);
        if(reward.delivery==="qr"&&!reward.redeemed_at){
          const qr=document.createElement("img");qr.alt=isFa?"کد QR جایزه":"Prämien-QR";
          qr.src="/reward-qr/"+encodeURIComponent(reward.code)+".svg";
          qr.width=136;qr.height=136;qr.loading="lazy";card.append(qr);
        }
        box.append(card);
      });
    }catch{
      const p=document.createElement("p");p.textContent=isFa?"دریافت جایزه‌ها ممکن نشد. دوباره تلاش کن.":"Preise konnten nicht geladen werden. Bitte erneut versuchen.";
      box.append(p);
    }
  }
  async function loadCampaigns(){
    try{
      const rows=await request("/api/public/brands/"+encodeURIComponent(slug)+"/campaigns");
      campaigns=Object.fromEntries(rows.map(r=>[r.objective,r]));
    }catch{campaigns={}}
    const params=new URLSearchParams(location.search);
    const selected=params.get("objective");
    const active=Object.keys(campaigns);
    chooseObjective(active.includes(selected)?selected:(active[0]||"upsell"));
    const dial=$("purpose-dial");
    const offerNames={
      fa:{upsell:"پیشنهاد خرید",return:"مراجعه بعدی",refer:"دعوت از دوستان",learn:"نکات کاربردی"},
      de:{upsell:"Angebot",return:"Nächster Besuch",refer:"Freunde einladen",learn:"Infos"}
    };
    const language=window.PWYWI18N?.locale()==="fa"?"fa":"de";
    dial.hidden=Boolean(selected)||active.length<2;
    for(const button of dial.querySelectorAll("[data-objective]")){
      const goal=button.dataset.objective;
      button.hidden=!active.includes(goal);
      button.textContent=offerNames[language][goal];
    }
    dial.setAttribute("aria-label",language==="fa"?"بعد از بازی چه چیزی می‌خوای؟":"Was möchtest du nach dem Spiel?");

    if(portalMode){
      $("all-games").open=true;
      $("purpose-dial").hidden=true;
      $("game-heading").textContent=window.PWYWI18N?.locale()==="fa"?"هر بازی دوست داری انتخاب کن":"Such dir dein Lieblingsspiel aus";
      $("campaign-context").hidden=true;
      document.querySelector(".featured-game .featured-label").textContent=window.PWYWI18N?.locale()==="fa"?"پیشنهاد برای شروع":"Zum Einstieg";
      await loadPortalRules();
    }
    const direct=params.get("game");
    if(direct && gameLabels[direct])startGame(direct);
  }
  function chooseObjective(name){
    if(!goalNames[name])return;
    objective=name;campaign=campaigns[name]||null;
    document.querySelectorAll("[data-objective]").forEach(el=>{
      el.classList.toggle("selected",el.dataset.objective===objective);
      el.setAttribute("aria-pressed",String(el.dataset.objective===objective));
    });
    $("purpose-title").textContent=goalNames[name];
    $("purpose-overline").textContent="YOUR MOMENT / "+name.toUpperCase();
    $("purpose-summary").textContent=localized(campaign,'description')||"This experience has not been published by the business yet.";
    document.querySelector(".purpose-brief").hidden=!campaign;
    $("campaign-context").hidden=!campaign;
    $("game-heading").textContent=localized(campaign,'title')||"A LITTLE PLAY. A LOT MORE.";
    $("game-heading").style.overflowWrap="anywhere";
    document.querySelector(".purpose-brief").style.borderLeftColor=brand?.accent||"currentColor";
    const featured=campaign?.game && gameLabels[campaign.game]?campaign.game:"orbit";
    featuredGame=featured;
    $("featured-game-name").textContent=gameLabels[featured];
    $("featured-game-hint").textContent=gameHints[featured];
    $("featured-game-symbol").textContent=gameSymbols[featured];
    $("featured-game-art").src="/static/game-art/"+featured+".svg";
    document.querySelector(".featured-game").dataset.featuredGame=featured;
    if(!game)document.body.dataset.worldGame=featured;
    const picks=[...document.querySelectorAll("[data-game]")];
    picks.forEach(el=>el.style.order=el.dataset.game===featured?"-1":"0");
    track("view");
  }
  function buildGamePicks(){
    const area=$("game-choices");area.replaceChildren();
    for(const [id,label] of Object.entries(gameLabels)){
      const btn=document.createElement("button");btn.type="button";btn.className="game-pick";btn.dataset.game=id;
      const thumb=document.createElement("span");thumb.className="game-pick-poster";thumb.setAttribute("aria-hidden","true");
      const art=document.createElement("img");art.alt="";art.loading="lazy";art.decoding="async";
      art.src="/static/game-art/"+id+".svg";thumb.append(art);
      const copy=document.createElement("span");copy.className="game-pick-copy";
      const title=document.createElement("b");title.textContent=label;
      const hint=document.createElement("small");hint.textContent=gameHints[id];
      copy.append(title,hint);
      const arrow=document.createElement("span");arrow.className="game-pick-arrow";arrow.textContent="↗";arrow.setAttribute("aria-hidden","true");
      btn.append(thumb,copy,arrow);
      btn.addEventListener("click",()=>startGame(id));area.append(btn);
    }
  }
  function resetReward(){
    rewardCode="";rewardIsDemo=false;claimStatus="idle";
    $("reward-code").textContent="";$("reward-code").hidden=true;
    $("claim-reward").hidden=true;$("claim-reward").disabled=false;
    $("merchant-link").hidden=true;$("referral-share").hidden=true;
    $("share-link").disabled=true;$("copy-link").disabled=true;
    $("copy-link").textContent=tr("COPY LINK");
    $("reward-note").textContent=tr("The code is for tracking this offer, not an automatic discount.");
  }
  async function renderQuiz(){
    const slot=$("quiz-slot");slot.replaceChildren();slot.hidden=true;
    if(objective!=="learn"||!campaign)return;
    try{
      const data=await request("/api/public/brands/"+encodeURIComponent(slug)+"/campaigns/learn");
      if(!data.quiz)return;
      slot.hidden=false;
      const heading=document.createElement("h4");heading.textContent=tr(window.PWYWI18N?.locale()==='fa'&&data.translations?.fa?.quiz_question?data.translations.fa.quiz_question:data.quiz.question);
      slot.append(heading);
      const note=document.createElement("p");note.textContent=tr("Choose the best answer. The result helps you understand the service, not win a prize.");
      slot.append(note);
      const quizAnswers=(window.PWYWI18N?.locale()==='fa'&&data.translations?.fa?.quiz_options?.length===3)?data.translations.fa.quiz_options:data.quiz.options;
       quizAnswers.forEach((answer,i)=>{
        const btn=document.createElement("button");btn.type="button";
         const order=document.createElement("span");order.className="quiz-index";order.textContent=visibleDigits(String(i+1).padStart(2,"0"));
         const wording=document.createElement("span");wording.className="quiz-wording";wording.textContent=tr(answer);
         btn.append(order,wording);
        btn.className="quiz-answer";
        btn.addEventListener("click",async()=>{
          slot.querySelectorAll("button").forEach(x=>x.disabled=true);
          btn.classList.add("is-picked");
          try{
            const result=await request("/api/public/brands/"+encodeURIComponent(slug)+"/campaigns/learn/answer",{
              method:"POST",body:JSON.stringify({sid,selected_index:i})});
            const outcome=document.createElement("p");outcome.className="quiz-feedback";
            outcome.textContent=tr(result.correct?"Correct! You're prepared.":"Not quite. Ask the team for clarification before proceeding.");
            slot.append(outcome);
            $("reward-note").textContent="Knowledge check complete. A correct answer does not establish staff-time savings.";
          }catch(e){slot.querySelectorAll("button").forEach(x=>x.disabled=false);$("reward-note").textContent="Quiz couldn't be recorded. Please try again."}
        });
        slot.append(btn);
      });
    }catch{}
  }
  function showClaimState(){
    const code=$("reward-code"),retry=$("claim-reward");
    retry.hidden=true;retry.disabled=false;
    if(!campaign || objective==="learn"){
      code.hidden=true;$("referral-share").hidden=true;
      return;
    }
    const ready=claimStatus==="ready";
    code.hidden=false;
    code.setAttribute("aria-busy",String(claimStatus==="loading"));
    code.classList.toggle("is-pending",!ready);
    code.textContent=ready?(rewardIsDemo?tr("DEMO ONLY — NO VALID REWARD"):rewardCode):
      tr(claimStatus==="error"?"Could not create a code. Please try again.":"Preparing your code…");
    $("referral-share").hidden=objective!=="refer"||!ready;
    $("share-link").disabled=!ready;$("copy-link").disabled=!ready;
    if(claimStatus==="error"){
      retry.textContent=tr("Try again ↻");
      retry.hidden=false;
    }
    $("reward-note").textContent=tr(claimStatus==="error"?
      "Could not create a code. Please try again.":
      !ready?"Preparing your code…":
      rewardIsDemo?"Preview campaign only. No real reward, offer or discount is issued.":
      objective==="return"?"Keep this code and show it on your next visit. It is not an automatic discount.":
      objective==="upsell"?"Show this code when you order the suggested item. It is not an automatic discount.":
      "Share this game with your friends.");
  }
  function renderReward({retainClaim=false}={}){
    if(!retainClaim)resetReward();
    $("quiz-slot").hidden=true;
    $("reward-kicker").textContent=tr("AFTER THE GAME");
    $("reward-title").textContent=localized(campaign,'product_name')||tr("Your next move.");
    $("reward-copy").textContent=localized(campaign,'offer')||tr("Ask the team about your next step.");
    if(portalMode){
      $("reward-title").textContent=window.PWYWI18N?.locale()==="fa"?"جایزه‌های تو":"Deine Preise";
      $("reward-copy").textContent=window.PWYWI18N?.locale()==="fa"?
        "اگر قانون جایزه‌ای شامل حالت بشه، اینجا نمایش داده می‌شه.":
        "Wenn eine Preisregel erfüllt ist, erscheint sie hier.";
      $("claim-reward").hidden=true;$("reward-code").hidden=true;$("merchant-link").hidden=true;
      $("referral-share").hidden=true;$("reward-note").textContent="";
      loadEarnedRewards();
    }else if(!campaign){
      $("claim-reward").hidden=true;$("reward-code").hidden=true;
      $("reward-note").textContent=tr("No active campaign. Games remain free to play.");
    }else if(objective==="learn"){
      $("claim-reward").hidden=true;$("reward-code").hidden=true;
      $("reward-note").textContent=tr("Completion means this instruction was viewed. It does not prove fewer staff questions.");
      renderQuiz();
    }else{
      showClaimState();
    }
    if(campaign?.destination && /^https:\/\//.test(campaign.destination)){
      const link=$("merchant-link");link.href=campaign.destination;link.hidden=false;
    }
  }
  async function issueReward(){
    if(portalMode||!campaign||objective==="learn")return;
    const id=++rewardRequestId,chosenObjective=objective;
    claimStatus="loading";showClaimState();
    try{
      const data=await request("/api/public/brands/"+encodeURIComponent(slug)+"/campaigns/"+chosenObjective+"/claim",{
        method:"POST",body:JSON.stringify({sid,ref_code:refCode||""})});
      if(id!==rewardRequestId || $("finish-modal").hidden || objective!==chosenObjective)return;
      rewardCode=data.code;rewardIsDemo=Boolean(data.demo);
      claimStatus="ready";showClaimState();
    }catch(e){
      if(id!==rewardRequestId || $("finish-modal").hidden || objective!==chosenObjective)return;
      claimStatus="error";showClaimState();
    }
  }
  function brandedCard(card, symbol){
    if(symbol==="BRAND_ITEM" && brandArt.token){
      card.replaceChildren();const img=new Image();img.src=brandArt.token;img.alt="Branded matching object";
      img.style.cssText="max-width:78%;max-height:78%;object-fit:contain";
      card.append(img);
    }else{card.textContent=symbol==="BRAND_ITEM"?"✳":symbol}
  }
  function setText(){
    $("score").textContent=visibleDigits(String(score).padStart(3,"0"));
    $("timer").textContent=visibleDigits(pad(Math.floor(seconds/60))+":"+pad(seconds%60));
  }
  function third(label,value){
    $("third-label").textContent=label.toUpperCase();
    $("third-stat").textContent=visibleDigits(value);
  }
  function tOut(fn,delay){const id=setTimeout(fn,delay);timeoutIds.push(id);return id}
  function cleanup(){
    if(window.PWYWArcade)window.PWYWArcade.stop();
    if(timer){clearInterval(timer);timer=null}
    timeoutIds.forEach(clearTimeout);timeoutIds=[];
    document.removeEventListener("keydown",keyMove);
    $("game-board").ontouchstart=null;
    $("game-board").ontouchend=null;
    $("game-board").replaceChildren();
    running=false;
  }
  function startClock(limit=null){
    seconds=0;setText();
    timer=setInterval(()=>{
      seconds++;setText();
      if(limit && seconds>=limit) finishGame();
    },1000);
  }
  function showHome(){
    rewardRequestId++;
    cleanup();game=null;score=0;
    document.body.dataset.worldGame=featuredGame;
    $("game-home").hidden=false;$("game-active").hidden=true;$("finish-modal").hidden=true;document.body.classList.remove("is-result-open");
    $("touch-controls").replaceChildren();$("touch-controls").hidden=true;
    $("back-home").style.visibility="hidden";
    window.scrollTo({top:0,behavior:"instant"});
  }
  function mobileControls(id){
    const controls=$("touch-controls");controls.replaceChildren();
    const options={
      snake:[["↑","ArrowUp"],["←","ArrowLeft"],["↓","ArrowDown"],["→","ArrowRight"]],
      merge:[["↑","ArrowUp"],["←","ArrowLeft"],["↓","ArrowDown"],["→","ArrowRight"]],
      orbit:[["← MOVE LEFT","ArrowLeft"],["MOVE RIGHT →","ArrowRight"]],
      breaker:[["← LEFT","ArrowLeft"],["RIGHT →","ArrowRight"]],
      lane:[["← LANE","ArrowLeft"],["LANE →","ArrowRight"]],
      hop:[["TAP TO FLY"," "]],
      sequence:[["1","1"],["2","2"],["3","3"],["4","4"]]
    };
    const set=options[id]||[];
    controls.hidden=!set.length;
    for(const [label,key] of set){
      const btn=document.createElement("button");
      btn.type="button";btn.className="touch-key";btn.textContent=label;
      btn.setAttribute("aria-label",label+" game control");
      let repeat=null;
      const fire=()=>{
        // Dispatch directly to the game instance. Mobile browsers are allowed
        // to ignore synthetic KeyboardEvent handlers on touch targets.
        if(id==="merge")document.dispatchEvent(new KeyboardEvent("keydown",{key,bubbles:true}));
        else if(window.PWYWArcade?.key)window.PWYWArcade.key(key);
      };
      let lastPress=0;
      const press=e=>{
        if(e?.cancelable)e.preventDefault();
        const now=performance.now();
        if(now-lastPress<90)return; // pointerdown and touchstart can accompany the same physical touch
        lastPress=now;
        btn.classList.add("pressed");
        fire();
        if(["orbit","breaker"].includes(id)&&!repeat)repeat=setInterval(fire,115);
      };
      const end=()=>{
        btn.classList.remove("pressed");
        if(repeat)clearInterval(repeat);
        repeat=null;
      };
      // Explicit Touch Events fallback for older WebKit and webview implementations.
      btn.addEventListener("touchstart",press,{passive:false});
      btn.addEventListener("touchend",end,{passive:true});
      btn.addEventListener("touchcancel",end,{passive:true});
      btn.addEventListener("pointerdown",press);
      btn.addEventListener("pointerup",end);
      btn.addEventListener("pointercancel",end);
      btn.addEventListener("pointerleave",end);
      btn.addEventListener("click",e=>{
        if(performance.now()-lastPress>180)press(e);
        end();
      });
      controls.append(btn);
    }
  }
  function startGame(id){
    rewardRequestId++;
    cleanup();
    if(!gameLabels[id])return;
    game=id;score=0;seconds=0;running=true;setText();mobileControls(id);
    document.body.dataset.worldGame=id;
    $("game-home").hidden=true;$("game-active").hidden=false;$("finish-modal").hidden=true;document.body.classList.remove("is-result-open");
    $("back-home").style.visibility="visible";
    $("active-title").textContent=gameLabels[id];
    $("game-active").style.setProperty("--game-poster",'url("/static/game-art/'+id+'.svg")');
    const board=$("game-board");
    board.className="game-board "+(id==="memory"?"memory-board":id==="merge"?"merge-board":id==="rush"?"rush-board":"canvas-board");
    $("third-stat").textContent="00";
    event("start");track("play");
    playRun=portalMode?{
      id,promise:request("/api/public/brands/"+encodeURIComponent(slug)+"/play-attempts/start",{
        method:"POST",body:JSON.stringify({sid,game:id})
      }).catch(()=>null)
    }:null;
    if(id==="memory")memory();
    else if(id==="merge")merge();
    else if(id==="rush")rush();
    else{
      $("third-label").textContent="LEFT";
      const instructions={
        snake:"Swipe or use arrows to collect marks and avoid the walls.",
        breaker:"Move the paddle. Break every glowing block.",
        hop:"Tap to fly through the gates.",
        orbit:"Catch the bright objects and dodge the dark ones.",
        bloom:"Tap flowers before they fade away.",
        lane:"Switch between three lanes and dodge obstacles.",
        sequence:"Watch the pattern, then repeat it. Tap quadrants 1 to 4."
      };
      $("game-instructions").textContent=instructions[id];
      window.PWYWArcade.start(id,{board,brand,
        onScore(n){score=n;setText()},
        onSeconds(s,left){seconds=s;setText();third("LEFT",left+"s")},
        onFinish(reason){finishGame(reason)},
        tone});
    }
    window.scrollTo({top:0,behavior:"instant"});
  }
  function finishGame(message=""){
    if(!running)return;
    const finalGame=game;
    cleanup();
    $("finish-modal").hidden=false;document.body.classList.add("is-result-open");
    document.querySelector(".result-inside").style.setProperty("--game-poster",'url("/static/game-art/'+finalGame+'.svg")');
    $("finish-score").textContent=window.PWYWI18N?.locale()==="fa"?score.toLocaleString("fa-IR")+" امتیاز":score.toLocaleString("de-DE")+" PTS";
    $("finish-message").textContent=message || (finalGame==="rush"?"Lightning quick! Go again?":finalGame==="memory"?"Beautifully remembered. Fancy another?":"You've got a way with numbers.");
    $("nickname").value="";
    $("post-score").disabled=false;
    $("leaderboard").replaceChildren();
    $("scoreboard-details").open=false;
    $("scoreboard-details").dataset.loaded="";
    event("complete",{score});
    renderReward();track("finish");
    if(portalMode){
      const run=playRun;playRun=null;
      (async()=>{
        const pass=run&&run.id===finalGame?await run.promise:null;
        if(!pass?.ticket){await loadEarnedRewards();setPortalPlayNote("Die Teilnahme konnte nicht bestätigt werden.","امکان تأیید این دور بازی نبود.");return}
        try{
          const outcome=await request("/api/public/brands/"+encodeURIComponent(slug)+"/play-attempts/finish",{
            method:"POST",body:JSON.stringify({sid,game:finalGame,ticket:pass.ticket,score})
          });
          await loadEarnedRewards();
          if(!outcome.eligible)setPortalPlayNote("Heute sind 3 Versuche pro Spiel für die Wertung erlaubt.","برای رتبه‌بندی امروز هر بازی سه تلاش معتبر داری.");
        }catch{
          await loadEarnedRewards();
          setPortalPlayNote("Dieser Versuch zählt nicht für Preise oder Ranglisten.","این دور بازی برای جایزه یا لیدربورد حساب نمی‌شه.");
        }
      })();
    }else issueReward();
    (!portalMode && campaign && objective!=="learn"?$("reward-code"):$("play-again")).focus({preventScroll:true});
  }
  async function showLeaderboard(g){
    try{
      const items=await request("/api/public/brands/"+encodeURIComponent(brand.slug)+"/leaderboard/"+g);
      const box=$("leaderboard");box.replaceChildren();
      if(!items.length){
        const p=document.createElement("small");p.textContent="Your name could be here. Be the first!";box.append(p);return;
      }
      items.forEach((item,i)=>{
        const p=document.createElement("p");
        const name=document.createElement("span");
        const points=document.createElement("strong");
        name.textContent=(i+1)+". "+item.nickname;points.textContent=visibleDigits(item.score)+(window.PWYWI18N?.locale()==="fa"?" امتیاز":" pts");
        p.append(name,points);box.append(p);
      });
    }catch(e){}
  }
  $("post-score").addEventListener("click",async()=>{
    const name=$("nickname").value.trim().slice(0,20);
    if(!name)return $("nickname").focus();
    $("post-score").disabled=true;
    // A score submission is only a cosmetic local leaderboard claim, not prize proof.
    try{
      await request("/api/public/brands/"+encodeURIComponent(brand.slug)+"/events",{
        method:"POST",body:JSON.stringify({kind:"complete",game,sid,score,nickname:name})
      });
      await showLeaderboard(game);
    }catch(e){$("post-score").disabled=false}
  });
  $("play-again").addEventListener("click",()=>startGame(game||featuredGame));
  $("player-id-value").textContent=sid;
  $("copy-player-id").addEventListener("click",async()=>{
    try{await navigator.clipboard.writeText(sid);
      $("copy-player-id").textContent=window.PWYWI18N?.locale()==="fa"?"کپی شد ✓":"Kopiert ✓";
    }catch{$("player-id-value").focus()}
  });
  $("result-other-game").addEventListener("click",showHome);
  $("start-featured").addEventListener("click",()=>startGame(featuredGame));
  $("scoreboard-details").addEventListener("toggle",()=>{
    const panel=$("scoreboard-details");
    if(panel.open && panel.dataset.loaded!=="yes" && game){panel.dataset.loaded="yes";showLeaderboard(game)}
  });
  $("restart-game").addEventListener("click",()=>startGame(game));
  $("back-home").addEventListener("click",e=>{e.preventDefault();showHome()});
  $("sound-btn").addEventListener("click",()=>{
    sound=!sound;$("sound-btn").textContent=sound?"♪":"♪̸";
    $("sound-btn").setAttribute("aria-label",sound?"Sound enabled":"Sound muted");
  });
  function tone(freq=640,duration=.07){
    if(!sound)return;
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return;
      const ctx=new AC(),osc=ctx.createOscillator(),gain=ctx.createGain();
      osc.type="sine";osc.frequency.value=freq;
      gain.gain.value=.022;gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);
      osc.connect(gain).connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+duration);
      osc.onended=()=>ctx.close();
    }catch(e){}
  }
  /* Match pairs: 16 tiles. Every round is solvable; locking prevents rapid double selection. */
  function memory(){
    const symbols=[...(icons[brand.industry]||icons.other)];
    if(brandArt.token)symbols[0]="BRAND_ITEM";
    const values=shuffle([...symbols,...symbols]);
    const board=$("game-board");
    const cards=[];
    let revealed=[],matched=0,moves=0,locked=false;
    third("Moves",0);
    startClock();
    for(let i=0;i<values.length;i++){
      const card=document.createElement("button");
      card.type="button";card.className="memory-tile";card.textContent="✳";
      card.setAttribute("aria-label","Hidden card "+(i+1));
      card.addEventListener("click",()=>{
        if(!running||locked||revealed.includes(i)||card.classList.contains("matched"))return;
        card.classList.add("revealed");brandedCard(card,values[i]);
        card.setAttribute("aria-label","Card "+values[i]);
        tone(510,.06);
        revealed.push(i);
        if(revealed.length!==2)return;
        moves++;third("Moves",moves);
        if(values[revealed[0]]===values[revealed[1]]){
          score+=Math.max(35,120-moves*2);setText();
          for(const index of revealed){cards[index].classList.add("matched");cards[index].disabled=true}
          matched++;revealed=[];tone(870,.11);
          if(matched===8)tOut(()=>finishGame("All eight pairs! Your memory is glowing."),380);
        } else {
          locked=true;
          const a=[...revealed];
          tOut(()=>{
            if(!running)return;
            a.forEach(index=>{
              cards[index].classList.remove("revealed");
              cards[index].textContent="✳";
              cards[index].setAttribute("aria-label","Hidden card "+(index+1));
            });
            revealed=[];locked=false;
          },760);
        }
      });
      cards.push(card);board.append(card);
    }
    $("game-instructions").textContent="Find all 8 matching pairs. Fewer moves = bigger score.";
  }
  /* 2048 original implementation: full four-direction moves, swipe and keyboard. */
  let move2048=()=>{};
  function keyMove(e){
    const keys={ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right",w:"up",s:"down",a:"left",d:"right"};
    if(!running||game!=="merge"||!keys[e.key])return;
    e.preventDefault();move2048(keys[e.key]);
  }
  function merge(){
    let grid=Array(16).fill(0),moves=0,swipeX=0,swipeY=0;
    const board=$("game-board");
    const spawn=()=>{
      const empty=grid.map((x,i)=>x?null:i).filter(x=>x!==null);
      if(empty.length)grid[empty[random(empty.length)]]=Math.random()<.88?2:4;
    };
    const paint=()=>{
      board.replaceChildren();
      for(const n of grid){
        const tile=document.createElement("div");tile.className="merge-cell"+(!n?" empty":"");
        tile.textContent=n||"";if(n)tile.dataset.num=String(n);board.append(tile);
      }
      third("Moves",moves);setText();
    };
    const slide=row=>{
      const filtered=row.filter(Boolean);
      const out=[];
      for(let i=0;i<filtered.length;i++){
        if(filtered[i]===filtered[i+1]){
          const value=filtered[i]*2;out.push(value);score+=value*4;i++;tone(460+Math.min(value,200),.08);
        }else out.push(filtered[i]);
      }
      while(out.length<4)out.push(0);
      return out;
    };
    move2048=(dir)=>{
      if(!running)return;
      const previous=[...grid];
      for(let line=0;line<4;line++){
        let indices;
        if(dir==="left")indices=[0,1,2,3].map(col=>line*4+col);
        else if(dir==="right")indices=[3,2,1,0].map(col=>line*4+col);
        else if(dir==="up")indices=[0,1,2,3].map(row=>row*4+line);
        else indices=[3,2,1,0].map(row=>row*4+line);
        const compact=slide(indices.map(i=>grid[i]));
        indices.forEach((index,k)=>{grid[index]=compact[k]});
      }
      if(grid.some((n,i)=>n!==previous[i])){
        moves++;spawn();paint();
        if(grid.includes(2048))return finishGame("You reached 2048. Legendary!");
        if(!grid.includes(0)){
          let available=false;
          for(let row=0;row<4;row++)for(let col=0;col<4;col++){
            const i=row*4+col;
            if(col<3 && grid[i]===grid[i+1])available=true;
            if(row<3 && grid[i]===grid[i+4])available=true;
          }
          if(!available)tOut(()=>finishGame("No moves left. How about another round?"),400);
        }
      }
    };
    board.ontouchstart=e=>{
      swipeX=e.changedTouches[0].screenX;swipeY=e.changedTouches[0].screenY;
    };
    board.ontouchend=e=>{
      const dx=e.changedTouches[0].screenX-swipeX,dy=e.changedTouches[0].screenY-swipeY;
      if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;
      move2048(Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up"));
    };
    document.addEventListener("keydown",keyMove);
    spawn();spawn();paint();startClock(90);
    $("game-instructions").textContent="Swipe the board to merge equal numbers. Arrow keys work too. 90-second challenge.";
  }
  /* 30s reflex game, light animations; no endless loop in background. */
  function rush(){
    let target=-1,hits=0,misses=0;
    const board=$("game-board");
    const pads=[];
    third("Hits",0);
    const choose=()=>{
      if(!running)return;
      target=random(9);
      pads.forEach((pad,i)=>{
        pad.classList.toggle("active",i===target);pad.textContent=i===target?"✦":"·";
        pad.setAttribute("aria-label",i===target?"Tap the spark":"Empty tile");
      });
    };
    for(let i=0;i<9;i++){
      const pad=document.createElement("button");pad.type="button";pad.className="rush-pad";
      pad.textContent="·";pad.setAttribute("aria-label","Empty tile");
      pad.addEventListener("click",()=>{
        if(!running)return;
        if(i===target){
          hits++;score+=100+Math.min(100,hits*5);tone(650+Math.min(hits,10)*45,.06);
          pad.classList.add("hit");third("Hits",hits);setText();choose();
        }else{misses++;score=Math.max(0,score-25);setText();tone(220,.04)}
      });
      pads.push(pad);board.append(pad);
    }
    choose();startClock(30);
    $("game-instructions").textContent="Tap the glowing spark as fast as you can. 30 seconds. Wrong taps cost 25 points.";
  }
  document.querySelectorAll("[data-objective]").forEach(btn=>
    btn.addEventListener("click",()=>chooseObjective(btn.dataset.objective)));
  // Codes are issued automatically when play ends. The button is only a retry on failure.
  $("claim-reward").addEventListener("click",()=>{
    if(claimStatus==="error")issueReward();
  });
  function sharedUrl(){
    const url=new URL(location.origin+"/play/"+encodeURIComponent(slug));
    url.searchParams.set("objective","refer");
    url.searchParams.set("lang",window.PWYWI18N?.locale()||"de");
    if(rewardCode && rewardCode!=="DEMO-ONLY")url.searchParams.set("ref",rewardCode);
    return url.href;
  }
  $("share-link").addEventListener("click",async()=>{
    track("share");
    const url=sharedUrl();
    try{if(navigator.share)await navigator.share({title:"Play with me",url});
        else if(navigator.clipboard)await navigator.clipboard.writeText(url)}
    catch{}
  });
  $("copy-link").addEventListener("click",async()=>{
    track("share");
    try{await navigator.clipboard.writeText(sharedUrl());
       $("copy-link").textContent="COPIED ✓";}catch{$("copy-link").textContent="COPY NOT AVAILABLE"}
  });
  $("merchant-link").addEventListener("click",()=>track("cta","Offer link"));
  $("close-result")?.addEventListener("click",showHome);
  buildGamePicks();
  $("back-home").style.visibility="hidden";
  window.addEventListener("pagehide",cleanup);
  document.addEventListener('pwyw:language-changed',()=>{
    if(brand)brandView(brand);
    chooseObjective(objective);
    const active=Object.keys(campaigns),direct=new URLSearchParams(location.search).get("objective");
    const language=window.PWYWI18N?.locale()==="fa"?"fa":"de";
    const names=language==="fa"?{upsell:"پیشنهاد خرید",return:"مراجعه بعدی",refer:"دعوت از دوستان",learn:"نکات کاربردی"}:
      {upsell:"Angebot",return:"Nächster Besuch",refer:"Freunde einladen",learn:"Infos"};
    const dial=$("purpose-dial");dial.hidden=Boolean(direct)||active.length<2;
    dial.querySelectorAll("[data-objective]").forEach(b=>{b.textContent=names[b.dataset.objective]});
    if(portalMode){
      $("game-heading").textContent=window.PWYWI18N?.locale()==="fa"?"هر بازی دوست داری انتخاب کن":"Such dir dein Lieblingsspiel aus";
      document.querySelector(".featured-game .featured-label").textContent=window.PWYWI18N?.locale()==="fa"?"پیشنهاد برای شروع":"Zum Einstieg";
      renderPortalRules();
    }
    if(!$("finish-modal").hidden)renderReward({retainClaim:true});
  });
  // A shared link offers only published goals; direct goal links stay focused.
  const isDemo=location.pathname==="/demo";
  document.body.classList.toggle("is-demo-lounge",isDemo);
  $("purpose-dial").hidden=true;
  request("/api/public/brands/"+encodeURIComponent(slug)).then(async b=>{
    brandView(b);
    await Promise.all([fetchBrandArt(),loadCampaigns()]);
    $("load-overlay").hidden=true;
  }).catch(()=>{
    $("load-overlay").textContent="This game lounge is not available.";
    $("load-overlay").style.fontSize="1rem";
  });
})();
