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
  const gameLabels={memory:"Memory match",merge:"Merge 2048",rush:"Quick tap"};
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
    const theme=["atelier","neon","garden","pop"].includes(b.theme)?b.theme:"atelier";
    document.body.className="player theme-"+theme;
    if(/^#[0-9a-fA-F]{6}$/.test(b.accent)){
      document.body.style.setProperty("--brand-accent",b.accent);
      // Subtle brand integration in all game themes without making text illegible.
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content",b.accent);
    }
    $("game-business").textContent=b.name.toUpperCase();
    $("game-tagline").textContent=b.tagline||"A little fun while you wait.";
    if(b.logo_path){
      $("game-logo").src="/brand-logo/"+encodeURIComponent(b.logo_path);
      $("game-logo").hidden=false;
      $("game-symbol").hidden=true;
    }
    document.title=b.name+" · PWYW games";
    document.querySelectorAll(".gc-icon").forEach((el,i)=>{
      if(theme==="neon"){el.textContent=["⟁","▣","✦"][i]}
      if(theme==="garden"){el.textContent=["❀","✿","☀"][i]}
      if(theme==="pop"){el.textContent=["◕","◈","★"][i]}
    });
    $("load-overlay").hidden=true;
    if(!visitSent){event("visit");visitSent=true}
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
    $("game-home").hidden=false;$("game-active").hidden=true;$("finish-modal").hidden=true;
    $("back-home").style.visibility="hidden";
    window.scrollTo({top:0,behavior:"instant"});
  }
  function startGame(id){
    cleanup();
    if(!["memory","merge","rush"].includes(id))return;
    game=id;score=0;running=true;
    $("score").textContent="000";
    $("timer").textContent="00:00";
    $("game-home").hidden=true;$("game-active").hidden=false;$("finish-modal").hidden=true;
    $("back-home").style.visibility="visible";
    $("active-title").textContent=gameLabels[id];
    const board=$("game-board");
    board.className="game-board "+(id==="memory"?"memory-board":id==="merge"?"merge-board":"rush-board");
    event("start");
    if(id==="memory")memory();
    else if(id==="merge")merge();
    else rush();
    window.scrollTo({top:0,behavior:"instant"});
  }
  function finishGame(message=""){
    if(!running)return;
    const finalGame=game;
    cleanup();
    $("finish-modal").hidden=false;
    $("finish-score").textContent=score.toLocaleString()+" PTS";
    $("finish-message").textContent=message || (finalGame==="rush"?"Lightning quick! Go again?":finalGame==="memory"?"Beautifully remembered. Fancy another?":"You've got a way with numbers.");
    $("nickname").value="";
    $("post-score").disabled=false;
    $("leaderboard").replaceChildren();
    event("complete",{score});
    showLeaderboard(finalGame);
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
    const symbols=icons[brand.industry]||icons.other;
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
        card.classList.add("revealed");card.textContent=values[i];
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
  document.querySelectorAll("[data-game]").forEach(btn=>btn.addEventListener("click",()=>startGame(btn.dataset.game)));
  window.addEventListener("pagehide",cleanup);
  request("/api/public/brands/"+encodeURIComponent(slug)).then(brandView)
    .catch(()=>{
      $("load-overlay").textContent="This game lounge is not available.";
      $("load-overlay").style.fontSize="1rem";
    });
})();
