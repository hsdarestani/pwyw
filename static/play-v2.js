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
  let objective="upsell",campaigns={},campaign=null,refCode=new URLSearchParams(location.search).get("ref")||"",rewardCode="";
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
        const dark=["noir","neon","chrome"].includes(brand?.theme);
        const overlay=dark?"rgba(8,11,22,.75)":"rgba(248,241,222,.8)";
        intro.style.backgroundImage="linear-gradient("+overlay+","+overlay+"),url('"+brandArt.scene+"')";
        intro.style.backgroundSize="cover";intro.style.backgroundPosition="center";
        intro.style.border="2px solid currentColor";intro.style.padding="20px";
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
  const random = max => Math.floor(Math.random()*max);
  const shuffle = a => {const b=[...a];for(let i=b.length-1;i>0;i--){const j=random(i+1);[b[i],b[j]]=[b[j],b[i]]}return b};
  async function request(path, options={}){
    const response=await fetch(path,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});
    if(!response.ok) throw new Error("Request failed");
    return response.json();
  }
  function event(kind,extra={}){
    if(!brand)return;
    request("/api/public/brands/"+encodeURIComponent(brand.slug)+"/events",{
      method:"POST",body:JSON.stringify({kind,game:game||"",sid,...extra})
    }).catch(()=>{});
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
    $("load-overlay").hidden=true;
    if(!visitSent){event("visit");visitSent=true}
  }
  async function track(kind,detail=""){
    if(!campaign)return;
    try{
      await request("/api/public/brands/"+encodeURIComponent(slug)+"/campaigns/"+objective+"/track",{
        method:"POST",body:JSON.stringify({sid,game:game||"",event:kind,detail})});
    }catch{}
  }
  async function loadCampaigns(){
    try{
      const rows=await request("/api/public/brands/"+encodeURIComponent(slug)+"/campaigns");
      campaigns=Object.fromEntries(rows.map(r=>[r.objective,r]));
    }catch{campaigns={}}
    const params=new URLSearchParams(location.search);
    const selected=params.get("objective");
    chooseObjective(goalNames[selected]?selected:(Object.keys(campaigns)[0]||"upsell"));
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
    $("game-heading").textContent=localized(campaign,'title')||"A LITTLE PLAY. A LOT MORE.";
    $("game-heading").style.overflowWrap="anywhere";
    document.querySelector(".purpose-brief").style.borderLeftColor=brand?.accent||"currentColor";
    const featured=campaign?.game||"orbit";
    const picks=[...document.querySelectorAll("[data-game]")];
    picks.forEach(el=>el.style.order=el.dataset.game===featured?"-1":"0");
    track("view");
  }
  function buildGamePicks(){
    const area=$("game-choices");area.replaceChildren();
    for(const [id,label] of Object.entries(gameLabels)){
      const btn=document.createElement("button");btn.type="button";btn.className="game-pick";btn.dataset.game=id;
      const symbol=document.createElement("span");symbol.className="pick-icon";symbol.textContent=gameSymbols[id];
      const title=document.createElement("b");title.textContent=label;
      const hint=document.createElement("small");hint.textContent=gameHints[id];
      btn.append(symbol,title,hint);btn.addEventListener("click",()=>startGame(id));area.append(btn);
    }
  }
  function resetReward(){
    rewardCode="";
    $("reward-code").textContent="";$("reward-code").hidden=true;
    $("claim-reward").hidden=false;$("claim-reward").disabled=false;
    $("merchant-link").hidden=true;$("referral-share").hidden=true;
    $("reward-note").textContent="Codes must be verified by the business. No prize is awarded for a game score.";
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
         const order=document.createElement("span");order.className="quiz-index";order.textContent=String(i+1).padStart(2,"0");
         const wording=document.createElement("span");wording.className="quiz-wording";wording.textContent=tr(answer);
         btn.append(order,wording);
        btn.className="quiz-answer";
        btn.addEventListener("click",async()=>{
          slot.querySelectorAll("button").forEach(x=>x.disabled=true);
          try{
            const result=await request("/api/public/brands/"+encodeURIComponent(slug)+"/campaigns/learn/answer",{
              method:"POST",body:JSON.stringify({sid,selected_index:i})});
            const outcome=document.createElement("p");outcome.className="quiz-feedback";
            outcome.textContent=result.correct?"Correct! You're prepared.":"Not quite. Ask the team for clarification before proceeding.";
            slot.append(outcome);
            $("reward-note").textContent="Knowledge check complete. A correct answer does not establish staff-time savings.";
          }catch(e){slot.querySelectorAll("button").forEach(x=>x.disabled=false);$("reward-note").textContent="Quiz couldn't be recorded. Please try again."}
        });
        slot.append(btn);
      });
    }catch{}
  }
  function renderReward(){
    resetReward();
    $("quiz-slot").hidden=true;
    if(objective==="learn"){ $("claim-reward").hidden=true;renderQuiz(); }
    $("reward-kicker").textContent="PLAY TO "+objective.toUpperCase()+" / YOUR NEXT MOVE";
    $("reward-title").textContent=localized(campaign,'product_name')||"Your next move.";
    $("reward-copy").textContent=localized(campaign,'offer')||"Ask the team about your next step.";
    $("claim-reward").textContent=objective==="learn"?"I UNDERSTAND ✓":
      objective==="refer"?"CREATE MY CHALLENGE ↗":"GET MY CODE ↗";
    if(!campaign){
      $("claim-reward").hidden=true;
      $("reward-note").textContent="No active campaign. Games remain free to play.";
    }
    if(objective==="learn"){
      $("reward-note").textContent="Completion means this instruction was viewed. It does not prove fewer staff questions.";
    }
    if(campaign?.destination && /^https:\/\//.test(campaign.destination)){
      const link=$("merchant-link");link.href=campaign.destination;link.hidden=false;
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
    $("score").textContent=String(score).padStart(3,"0");
    $("timer").textContent=pad(Math.floor(seconds/60))+":"+pad(seconds%60);
  }
  function third(label,value){
    $("third-label").textContent=label.toUpperCase();
    $("third-stat").textContent=value;
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
    cleanup();game=null;score=0;
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
    cleanup();
    if(!gameLabels[id])return;
    game=id;score=0;seconds=0;running=true;setText();mobileControls(id);
    $("game-home").hidden=true;$("game-active").hidden=false;$("finish-modal").hidden=true;document.body.classList.remove("is-result-open");
    $("back-home").style.visibility="visible";
    $("active-title").textContent=gameLabels[id];
    const board=$("game-board");
    board.className="game-board "+(id==="memory"?"memory-board":id==="merge"?"merge-board":id==="rush"?"rush-board":"canvas-board");
    $("third-stat").textContent="00";
    event("start");track("play");
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
    $("finish-score").textContent=score.toLocaleString()+" PTS";
    $("finish-message").textContent=message || (finalGame==="rush"?"Lightning quick! Go again?":finalGame==="memory"?"Beautifully remembered. Fancy another?":"You've got a way with numbers.");
    $("nickname").value="";
    $("post-score").disabled=false;
    $("leaderboard").replaceChildren();
    event("complete",{score});
    showLeaderboard(finalGame);
    renderReward();track("finish");
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
        name.textContent=(i+1)+". "+item.nickname;points.textContent=item.score+" pts";
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
  $("play-again").addEventListener("click",showHome);
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
  $("claim-reward").addEventListener("click",async()=>{
    if(!campaign)return;
    const btn=$("claim-reward");btn.disabled=true;track("cta");
    if(objective==="learn"){
      track("learn_answer","Guest confirmed reading instructions");
      $("reward-code").hidden=false;$("reward-code").textContent="THANK YOU FOR READING";
      btn.hidden=true;return;
    }
    try{
      const data=await request("/api/public/brands/"+encodeURIComponent(slug)+"/campaigns/"+objective+"/claim",{
        method:"POST",body:JSON.stringify({sid,ref_code:refCode||""})});
      rewardCode=data.code;$("reward-code").textContent=data.demo?
        "DEMO ONLY — NO VALID REWARD":data.code;
      $("reward-code").hidden=false;btn.hidden=true;
      $("reward-note").textContent=data.demo?
        "Preview campaign only. No real reward, offer or discount is issued.":
        "Show this code to the business. Staff must verify a real action before counting it.";
      if(objective==="refer"){
        $("referral-share").hidden=false;
      }
    }catch(e){
      $("reward-note").textContent="Could not create a code. Please try again.";
      btn.disabled=false;
    }
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
  $("close-result").addEventListener("click",showHome);
  buildGamePicks();
  window.addEventListener("pagehide",cleanup);
  document.addEventListener('pwyw:language-changed',()=>{if(brand)brandView(brand);chooseObjective(objective);if(!$("finish-modal").hidden)renderReward()});
  request("/api/public/brands/"+encodeURIComponent(slug)).then(async b=>{
    brandView(b);await fetchBrandArt();await loadCampaigns();
  }).catch(()=>{
    $("load-overlay").textContent="This game lounge is not available.";
    $("load-overlay").style.fontSize="1rem";
  });
})();
