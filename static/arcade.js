/* PWYW ARCADE / Seven original canvas game adaptations built from open game mechanics.
 * Proprietary graphics are generated at runtime; no third-party assets or music.
 * Reusable under the PWYW OSS policy; see OPEN_SOURCE.md.
 */
(() => {
  "use strict";
  const TAU=Math.PI*2,W=380,H=442;
  const colors={
    atelier:["#e7ddc7","#423427","#ce6b51","#779f8a","#ffc16a"],
    neon:["#090d21","#d4ff4e","#ff47ad","#12d2d9","#f5a623"],
    garden:["#dce7be","#264331","#f19266","#8ba97e","#eaca78"],
    pop:["#ff95a6","#55224e","#fbdc46","#8ee7e5","#fff8e5"],
    noir:["#13121b","#e0c8a0","#ec764d","#b1a3c9","#e8e0d0"],
    chrome:["#091d27","#e2f7ff","#64dbf3","#f9be79","#7ef7c1"],
    dream:["#e3d9fa","#513c7a","#ffaac8","#a19aff","#fff7cb"],
    heritage:["#f5e4c0","#652f2a","#c26543","#929d62","#d8a54d"]
  };
  const rand=(a,b)=>a+Math.random()*(b-a),random=n=>Math.floor(Math.random()*n),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  let active=null;
  function stop(){
    if(!active)return;
    cancelAnimationFrame(active.raf);
    active.listeners.forEach(([target,name,fn,opts])=>target.removeEventListener(name,fn,opts));
    active=null;
  }
  function start(mode,host){
    stop();
    const canvas=document.createElement("canvas");
    canvas.width=W*2;canvas.height=H*2;canvas.style.width="100%";canvas.style.height="auto";
    canvas.style.display="block";canvas.style.touchAction="none";canvas.setAttribute("role","img");
    canvas.setAttribute("aria-label","Interactive "+mode+" game. Use touch or keyboard controls.");
    host.board.replaceChildren(canvas);
    host.board.classList.add("canvas-board");
    const ctx=canvas.getContext("2d");ctx.scale(2,2);
    const brand=host.brand||{};
    const palette=colors[brand.theme]||colors.atelier;
    const s={ctx,canvas,mode,brand,palette,host,raf:0,listeners:[],time:0,score:0,ended:false,
      input:{x:W/2,y:H/2,pressed:false},inputEvents:0,keyboardEvents:0,started:false,particles:[],items:[],state:{},stamp:performance.now(),last:performance.now()};
    active=s;
    for(const [field,url] of [["sceneImg",brand.sceneUrl],["tokenImg",brand.tokenUrl]]){
      if(url && (url.startsWith("/brand-art/")||url.startsWith("/static/worlds/"))){
        const img=new Image();img.onload=()=>{};img.src=url;s[field]=img;
      }
    }
    const on=(node,name,fn,opts)=>{node.addEventListener(name,fn,opts);s.listeners.push([node,name,fn,opts])};
    const xy=e=>{
      const r=canvas.getBoundingClientRect();
      return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};
    };
    // One coordinate system for iOS Safari, Android Chrome and mouse.
    // Pointer Events prevent native swipe-to-scroll from stealing game gestures.
    const begin=e=>{
      if(e.cancelable)e.preventDefault();
      const v=xy(e);
      if(!s.started){s.started=true;s.last=performance.now();}
      s.input.x=v.x;s.input.y=v.y;s.input.pressed=true;s.inputEvents++;
      s.input.startX=v.x;s.input.startY=v.y;
      try{canvas.setPointerCapture(e.pointerId)}catch{}
      if(s.state.tap)s.state.tap(v);
    };
    on(canvas,"pointerdown",begin,{passive:false});
    on(canvas,"pointermove",e=>{
      if(!s.input.pressed)return;
      if(e.cancelable)e.preventDefault();
      const v=xy(e);s.input.x=v.x;s.input.y=v.y;
      if(s.state.move)s.state.move(v);
    },{passive:false});
    const end=e=>{
      if(!s.input.pressed)return;
      const v=xy(e);
      if(s.state.swipe)s.state.swipe({
        dx:v.x-(s.input.startX||v.x),
        dy:v.y-(s.input.startY||v.y),
        x:v.x,y:v.y
      });
      s.input.pressed=false;
      try{canvas.releasePointerCapture(e.pointerId)}catch{}
    };
    on(canvas,"pointerup",end,{passive:false});
    on(canvas,"pointercancel",()=>{s.input.pressed=false});
    on(window,"keydown",e=>{if(!active||active!==s)return;
      if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"," "].includes(e.key))e.preventDefault();
      if(s.state.key){
        if(!s.started){s.started=true;s.last=performance.now();}
        s.keyboardEvents++;s.state.key(e.key);
      }});
    s.addPoints=(n)=>{s.score=Math.max(0,s.score+n);host.onScore(Math.round(s.score))};
    s.finish=(reason)=>{if(s.ended||active!==s)return;s.ended=true;host.onFinish(reason||"Nicely played!")};
    s.emit=(x,y,n=12)=>{for(let i=0;i<n;i++)s.particles.push({x,y,vx:rand(-140,140),vy:rand(-150,100),
      life:rand(.3,.9),max:1,size:rand(2,7),color:palette[2+random(3)]})};
    s.state = {...s.state, ...(modes[mode] ? modes[mode](s) : modes.orbit(s))};
    function frame(now){
      if(active!==s)return;
      const dt=clamp((now-s.last)/1000,0,.034);s.last=now;
      if(s.started)s.time+=dt;
      backdrop(s,now/1000);
      if(!s.ended && s.started){
        s.state.update(dt);
        const max=s.state.duration||50;
        host.onSeconds(Math.floor(s.time),Math.max(0,Math.ceil(max-s.time)));
        if(s.time>=max)s.finish("Time's up. Beautiful run!");
      }
      s.state.draw(ctx);
      drawParticles(s,s.started?dt:0);
      if(!s.started&&!s.ended){
        ctx.save();
        ctx.fillStyle="rgba(9,13,25,.67)";
        rect(ctx,40,157,W-80,128,23);ctx.fill();
        ctx.fillStyle="#ffffff";ctx.textAlign="center";
        ctx.font="800 27px system-ui";ctx.fillText("TAP TO START",W/2,213);
        ctx.fillStyle="#dfdeff";ctx.font="600 13px system-ui";
        ctx.fillText("Your time starts with your first move.",W/2,244);
        ctx.restore();
      }
      s.raf=requestAnimationFrame(frame);
    }
    s.raf=requestAnimationFrame(frame);
  }
  const rect=(c,x,y,w,h,r=0)=>{c.beginPath();c.roundRect(x,y,w,h,r)};
  const circle=(c,x,y,r)=>{c.beginPath();c.arc(x,y,r,0,TAU)};
  function backdrop(s,t){
    const c=s.ctx,p=s.palette,theme=s.brand.theme||"atelier";
    const bg=c.createLinearGradient(0,0,W,H);
    if(["neon","chrome","noir"].includes(theme)){bg.addColorStop(0,p[0]);bg.addColorStop(.65,p[0]);bg.addColorStop(1,"#304053")}
    else {bg.addColorStop(0,p[0]);bg.addColorStop(1,theme==="dream"?"#fce8df":p[0])}
    c.fillStyle=bg;c.fillRect(0,0,W,H);
    if(s.sceneImg && s.sceneImg.complete && s.sceneImg.naturalWidth){
      const pic=s.sceneImg,ratio=Math.max(W/pic.width,H/pic.height);
      c.save();c.globalAlpha=.38;c.drawImage(pic,(W-pic.width*ratio)/2,(H-pic.height*ratio)/2,pic.width*ratio,pic.height*ratio);c.restore();
    }
    c.save();c.globalAlpha=.13;c.strokeStyle=p[1];
    if(theme==="neon"||theme==="chrome"){c.lineWidth=1;
      for(let x=0;x<W;x+=25){c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke()}
      for(let y=0;y<H;y+=25){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke()}
    }else if(theme==="pop"){
      for(let i=0;i<18;i++){circle(c,(i*67)%W,(i*127)%H,6+(i%4)*4);c.fillStyle=p[1];c.fill()}
    }else if(theme==="garden"||theme==="heritage"){
      for(let i=0;i<11;i++){let x=(i*97)%W,y=(i*67)%H; c.save();c.translate(x,y);c.rotate(i*1.4+t*.04);
        for(let k=0;k<5;k++){c.rotate(TAU/5);c.beginPath();c.ellipse(0,14,5,15,0,0,TAU);c.stroke()}c.restore()}
    }else{
      for(let i=0;i<6;i++){circle(c,190,220,65+i*62+Math.sin(t*.4)*5);c.stroke()}
    }
    c.restore();
    c.save();c.globalAlpha=.22;c.font=theme==="neon"?"900 110px system-ui":"italic 115px Georgia";
    c.textAlign="center";c.fillStyle=p[1];c.fillText((s.brand.name||"PWYW").split(" ")[0].slice(0,5),W/2,H-36);c.restore();
    // Brand crest / industry motif in the playing world's permanent art layer.
    c.save();c.translate(W-45,42);c.globalAlpha=.5; emblem(c,s.brand.industry||"cafe",p[3]);c.restore();
  }
  function emblem(c,industry,col){
    c.strokeStyle=col;c.fillStyle=col;c.lineWidth=3;
    if(["cafe","restaurant"].includes(industry)){
      rect(c,-19,-12,26,22,5);c.stroke();c.beginPath();c.arc(10,-2,8,-Math.PI/2,Math.PI/2);c.stroke();
      c.beginPath();c.moveTo(-13,-18);c.lineTo(-9,-24);c.moveTo(0,-18);c.lineTo(4,-25);c.stroke();
    }else if(industry==="auto"){
      rect(c,-25,-6,49,18,5);c.stroke();rect(c,-12,-17,24,12,4);c.stroke();
      [-14,14].forEach(x=>{circle(c,x,15,6);c.fill()});
    }else if(industry==="salon"){
      for(let i=0;i<6;i++){c.save();c.rotate(TAU*i/6);c.beginPath();c.ellipse(0,12,7,15,0,0,TAU);c.stroke();c.restore()}
      circle(c,0,0,6);c.fill();
    }else{
      c.beginPath();for(let i=0;i<10;i++){const r=i%2?11:25,a=TAU*i/10-Math.PI/2;
        i===0?c.moveTo(Math.cos(a)*r,Math.sin(a)*r):c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}
      c.closePath();c.stroke();
    }
  }
  function drawParticles(s,dt){
    const c=s.ctx;
    for(const p of s.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=290*dt;p.life-=dt;
      c.save();c.globalAlpha=clamp(p.life/.8,0,1);c.fillStyle=p.color;circle(c,p.x,p.y,p.size);c.fill();c.restore()}
    s.particles=s.particles.filter(p=>p.life>0).slice(-220);
  }
  function glowing(c,x,y,r,col){
    c.save();const g=c.createRadialGradient(x,y,2,x,y,r);
    g.addColorStop(0,col);g.addColorStop(.46,col+"aa");g.addColorStop(1,"transparent");
    c.fillStyle=g;circle(c,x,y,r);c.fill();c.restore();
  }
  function token(c,s,x,y,r){
    const img=s.tokenImg;
    if(!img||!img.complete||!img.naturalWidth)return false;
    c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();
    c.fillStyle="#ffffffdd";c.fill();
    const scale=Math.min((r*1.8)/img.width,(r*1.8)/img.height);
    c.drawImage(img,x-img.width*scale/2,y-img.height*scale/2,img.width*scale,img.height*scale);
    c.restore();return true;
  }
  function badge(c,text,x,y,col,scale=1){
    c.save();c.translate(x,y);c.scale(scale,scale);c.shadowColor=col;c.shadowBlur=20;
    c.fillStyle=col;circle(c,0,0,15);c.fill();c.shadowBlur=0;
    c.textAlign="center";c.textBaseline="middle";c.font="900 14px system-ui";c.fillStyle="#122127";c.fillText(text,0,1);
    c.restore();
  }
  function headline(c,title,sub,s){
    c.fillStyle=s.palette[1];c.font="900 12px system-ui";c.textAlign="left";
    c.fillText(title.toUpperCase(),20,28);
    c.globalAlpha=.65;c.font="12px system-ui";c.fillText(sub,20,48);c.globalAlpha=1;
  }
  function wave(c,points,col){
    c.lineWidth=3;c.lineCap="round";c.strokeStyle=col;c.beginPath();
    points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
  }
  const modes={
    snake(s){
      const size=19,cols=19,rows=19;
      let body=[{x:9,y:9},{x:8,y:9},{x:7,y:9}],dir={x:1,y:0},next=dir,food={x:13,y:10},acc=0;
      const eat=()=>{do{food={x:random(cols),y:random(rows)}}while(body.some(v=>v.x===food.x&&v.y===food.y))};
      const change=(x,y)=>{if(x!==-dir.x||y!==-dir.y)next={x,y}};
      let x0=0,y0=0;

      s.state.key=k=>({ArrowUp:()=>change(0,-1),ArrowDown:()=>change(0,1),ArrowLeft:()=>change(-1,0),ArrowRight:()=>change(1,0)})[k]?.();
      // The unified pointer gesture uses board coordinates consistently.
      s.state.tap=({x,y})=>{x0=x;y0=y};
      s.state.move=({x,y})=>{if(!s.input.pressed)return;let dx=x-x0,dy=y-y0;
        if(Math.max(Math.abs(dx),Math.abs(dy))<30)return;
        Math.abs(dx)>Math.abs(dy)?change(dx>0?1:-1,0):change(0,dy>0?1:-1);x0=x;y0=y;};
      s.state.swipe=({dx,dy})=>{
        if(Math.max(Math.abs(dx),Math.abs(dy))>22)
          Math.abs(dx)>Math.abs(dy)?change(dx>0?1:-1,0):change(0,dy>0?1:-1);
      };
      const off=9,g=19;
      return {duration:54,update(dt){acc+=dt;if(acc<.115)return;acc=0;dir=next;
        const h={x:body[0].x+dir.x,y:body[0].y+dir.y};
        const willEat=h.x===food.x&&h.y===food.y;
        const obstacles=willEat?body:body.slice(0,-1);
        if(h.x<0||h.y<0||h.x>=cols||h.y>=rows||obstacles.some(b=>b.x===h.x&&b.y===h.y)){
          s.finish("Snake says that's a wrap!");return}
        body.unshift(h);
        if(willEat){s.addPoints(125);s.emit(off+h.x*g,72+h.y*g,14);s.host.tone(680,.08);eat()}
        else body.pop();
      },draw(c){headline(c,"SNAKE CIRCUIT","Swipe to steer · Collect the glowing marks",s);
        rect(c,5,62,370,370,13);c.fillStyle=s.palette[0]+"aa";c.fill();
        for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){c.fillStyle=(x+y)%2?s.palette[3]+"1d":s.palette[1]+"10";rect(c,off+x*g,67+y*g,g-2,g-2,4);c.fill()}
        glowing(c,off+food.x*g+8,67+food.y*g+8,23,s.palette[2]);if(!token(c,s,off+food.x*g+8,67+food.y*g+8,12))badge(c,"✦",off+food.x*g+8,67+food.y*g+8,s.palette[4],.8);
        body.forEach((v,i)=>{c.fillStyle=i===0?s.palette[2]:s.palette[i%2?3:4];rect(c,off+v.x*g,67+v.y*g,g-1,g-1,i?5:7);c.fill()});
      }};
    },
    breaker(s){
      let x=W/2,ball={x:190,y:330,vx:rand(-120,120),vy:-250,r:8},lives=3,blocks=[];
      for(let row=0;row<5;row++)for(let col=0;col<7;col++)blocks.push({x:17+col*50,y:92+row*27,w:46,h:21,hp:1});
      s.state.move=v=>{x=clamp(v.x,46,334)};s.state.tap=v=>{x=clamp(v.x,46,334)};
      s.state.key=k=>{if(k==="ArrowLeft")x=clamp(x-34,46,334);if(k==="ArrowRight")x=clamp(x+34,46,334)};
      return{duration:65,update(dt){
        ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
        if(ball.x<12||ball.x>W-12)ball.vx*=-1;
        if(ball.y<65)ball.vy=Math.abs(ball.vy);
        if(ball.vy>0&&ball.y>370&&ball.y<389&&Math.abs(ball.x-x)<49){
          ball.vy=-Math.abs(ball.vy)*1.02;ball.vx=(ball.x-x)*5; s.host.tone(480,.055);}
        if(ball.y>H){lives--;ball={x:190,y:330,vx:rand(-130,130),vy:-255,r:8};
          if(!lives)s.finish("Every great run starts again.")}
        for(const b of [...blocks]){
          if(ball.x>b.x-8&&ball.x<b.x+b.w+8&&ball.y>b.y-8&&ball.y<b.y+b.h+8){
            blocks.splice(blocks.indexOf(b),1);ball.vy*=-1;s.addPoints(120);s.emit(b.x+24,b.y+10,9);
            s.host.tone(790,.045);break;
          }
        }
        if(!blocks.length)s.finish("You cleared the wall. Brilliant!");
      },draw(c){headline(c,"BLOCK BREAKER","Move paddle with your finger or arrow keys",s);
        blocks.forEach((b,i)=>{c.save();c.shadowBlur=8;c.shadowColor=s.palette[2+i%3];
          c.fillStyle=s.palette[2+(Math.floor(b.y/27)%3)];rect(c,b.x,b.y,b.w,b.h,6);c.fill();c.restore()});
        glowing(c,ball.x,ball.y,34,s.palette[4]);c.fillStyle=s.palette[1];circle(c,ball.x,ball.y,8);c.fill();
        c.fillStyle=s.palette[1];rect(c,x-51,383,102,13,7);c.fill();
        c.fillStyle=s.palette[2];rect(c,x-34,384,68,10,6);c.fill();
        c.font="800 12px system-ui";c.fillStyle=s.palette[1];c.fillText("●".repeat(lives),18,426);
      }};
    },
    hop(s){
      let y=H/2,vy=0,obstacles=[],distance=0,spawn=1.6,started=false;
      const jump=()=>{vy=-280;started=true;s.host.tone(650,.045)};
      s.state.tap=jump;s.state.key=k=>{if(k===" "||k==="ArrowUp")jump()};
      return{duration:52,update(dt){
        vy+=680*dt;y+=vy*dt;
        if(y<52)y=52;
        if(y>410){s.finish("A soft landing. Ready to fly again?");return}
        if(!started)return;
        distance+=dt*145;spawn-=dt;
        if(spawn<=0){obstacles.push({x:400,gap:rand(160,310),passed:false});spawn=1.7}
        for(const o of obstacles){o.x-=140*dt;
          if(!o.passed&&o.x<83){o.passed=true;s.addPoints(150);s.host.tone(930,.06)}
          if(o.x<101&&o.x+48>55&&(y<o.gap-65||y>o.gap+65)){s.finish("So close! One more flight?");return}
        }
        obstacles=obstacles.filter(x=>x.x>-60);
      },draw(c){headline(c,"SKY HOP","Tap anywhere to fly through the openings",s);
        for(let i=0;i<6;i++){c.fillStyle=s.palette[3]+"44";circle(c,((i*115-s.time*33)%490+490)%490,105+i*55,18+i%3*12);c.fill()}
        for(const o of obstacles){const upper=o.gap-66,lower=o.gap+66;
          c.fillStyle=s.palette[2];rect(c,o.x,60,48,upper-60,9);c.fill();
          c.fillStyle=s.palette[3];rect(c,o.x,lower,48,H-lower,9);c.fill()}
        glowing(c,79,y,38,s.palette[2]);c.fillStyle=s.palette[4];circle(c,79,y,18);c.fill();
        c.fillStyle=s.palette[1];c.beginPath();c.moveTo(75,y+3);c.lineTo(100,y-2);c.lineTo(75,y+15);c.closePath();c.fill();
        if(!started){c.textAlign="center";c.font="900 18px system-ui";c.fillStyle=s.palette[1];c.fillText("TAP TO LIFT OFF",W/2,360);c.textAlign="left";}
      }};
    },
    orbit(s){
      let collector=W/2,objects=[],spawn=0,combo=0;
      s.state.move=({x})=>collector=clamp(x,35,W-35);
      s.state.tap=({x})=>collector=clamp(x,35,W-35);
      s.state.key=k=>{if(k==="ArrowLeft")collector=clamp(collector-33,35,W-35);if(k==="ArrowRight")collector=clamp(collector+33,35,W-35)};
      return{duration:45,update(dt){
        spawn-=dt;
        if(spawn<=0){objects.push({x:rand(25,W-25),y:55,vy:rand(165,265),r:rand(11,18),bad:Math.random()<.25,rot:0});spawn=.33}
        for(const o of objects){o.y+=o.vy*dt;o.rot+=dt*3;
          if(o.y>375&&o.y<415&&Math.abs(o.x-collector)<42){
            if(o.bad){combo=0;s.addPoints(-80);s.host.tone(180,.07)}
            else {combo++;s.addPoints(70+Math.min(combo,8)*12);s.host.tone(650,.05)}
            s.emit(o.x,o.y,9);o.y=H+40;
          }
        }
        objects=objects.filter(x=>x.y<H+20);
      },draw(c){headline(c,"ORBIT CATCH","Move to collect sparks · Avoid dark crystals",s);
        objects.forEach(o=>{glowing(c,o.x,o.y,o.r*2,o.bad?s.palette[1]:s.palette[2]);
          if(!o.bad && token(c,s,o.x,o.y,o.r)){return}
          c.save();c.translate(o.x,o.y);c.rotate(o.rot);c.fillStyle=o.bad?s.palette[1]:s.palette[4];
          c.beginPath();for(let i=0;i<8;i++){let a=i*Math.PI/4,r=i%2?o.r*.52:o.r;
            i?c.lineTo(Math.cos(a)*r,Math.sin(a)*r):c.moveTo(Math.cos(a)*r,Math.sin(a)*r)}
          c.closePath();c.fill();c.restore()});
        c.save();c.shadowBlur=20;c.shadowColor=s.palette[2];c.strokeStyle=s.palette[4];c.lineWidth=9;
        c.beginPath();c.arc(collector,392,31,.12,Math.PI-.12,true);c.stroke();c.restore();
        c.fillStyle=s.palette[1];c.font="900 13px system-ui";c.fillText("COMBO ×"+(combo+1),20,430);
      }};
    },
    bloom(s){
      let flowers=[],spawn=.2,misses=0;
      const tap=({x,y})=>{
        for(let i=flowers.length-1;i>=0;i--){const f=flowers[i],d=Math.hypot(f.x-x,f.y-y);
          if(d<f.r+14){flowers.splice(i,1);s.emit(f.x,f.y,20);s.addPoints(Math.round(f.r*5));s.host.tone(450+f.r*8,.055);return}}
        misses++;s.addPoints(-12);
      };
      s.state.tap=tap;s.state.key=k=>{if(k===" ")tap({x:s.input.x,y:s.input.y})};
      return{duration:40,update(dt){
        spawn-=dt;if(spawn<=0){flowers.push({x:rand(40,340),y:rand(105,370),r:rand(18,35),age:0,life:rand(1.4,2.4),phase:rand(0,6)});
          spawn=rand(.22,.44)}
        flowers.forEach(f=>f.age+=dt);flowers=flowers.filter(f=>f.age<f.life);
      },draw(c){headline(c,"BLOOM POP","Pop glowing petals before they vanish",s);
        flowers.forEach((f,i)=>{const alpha=clamp((f.life-f.age)/.4,0,1);c.save();c.globalAlpha=alpha;
          c.translate(f.x,f.y);c.rotate(f.age*.2+f.phase);
          glowing(c,0,0,f.r*2.3,s.palette[2]);
          for(let k=0;k<7;k++){c.rotate(TAU/7);c.fillStyle=s.palette[2+(i+k)%3];c.beginPath();c.ellipse(0,f.r*.62,f.r*.39,f.r*.65,0,0,TAU);c.fill()}
          c.fillStyle=s.palette[4];circle(c,0,0,f.r*.4);c.fill();c.restore();
          token(c,s,f.x,f.y,f.r*.45)});
        c.fillStyle=s.palette[1];c.font="800 12px system-ui";c.fillText("MISSES "+misses,20,425);
      }};
    },
    lane(s){
      let lane=1,blocks=[],spawn=0,dist=0;
      const centers=[82,190,298];
      s.state.tap=({x})=>lane=x<127?0:x<253?1:2;
      s.state.move=({x})=>{if(s.input.pressed)lane=x<127?0:x<253?1:2};
      s.state.key=k=>{if(k==="ArrowLeft")lane=Math.max(0,lane-1);if(k==="ArrowRight")lane=Math.min(2,lane+1)};
      return{duration:48,update(dt){
        dist+=dt*180;spawn-=dt;
        if(spawn<=0){blocks.push({lane:random(3),y:52,bad:Math.random()<.52});spawn=rand(.46,.68)}
        for(const o of blocks){o.y+=dt*240;
          if(o.y>352&&o.y<410&&o.lane===lane){
            if(o.bad){s.finish("A little detour. Go for a new record?");return}
            s.addPoints(175);s.emit(centers[lane],380,17);s.host.tone(960,.07);o.y=H+50;
          }
        }
        blocks=blocks.filter(o=>o.y<H+30);
      },draw(c){headline(c,"NEON LANE","Swipe between lanes · Collect the good stuff",s);
        for(let i=0;i<3;i++){rect(c,centers[i]-48,61,96,370,19);c.fillStyle=i===lane?s.palette[3]+"55":s.palette[3]+"25";c.fill();
          for(let j=0;j<9;j++){c.fillStyle=s.palette[1]+"44";rect(c,centers[i]-2,((j*67+dist)%375)+60,4,18,2);c.fill()}}
        blocks.forEach(o=>{c.fillStyle=o.bad?s.palette[2]:s.palette[4];c.save();c.shadowBlur=20;c.shadowColor=c.fillStyle;
          rect(c,centers[o.lane]-27,o.y-14,54,28,o.bad?5:14);c.fill();c.restore();
          c.fillStyle=s.palette[0];c.font="900 17px system-ui";c.textAlign="center";
          c.fillText(o.bad?"×":"✦",centers[o.lane],o.y+6);c.textAlign="left"});
        glowing(c,centers[lane],380,54,s.palette[2]);c.save();c.translate(centers[lane],375);c.fillStyle=s.palette[1];
        c.beginPath();c.moveTo(0,-26);c.lineTo(22,20);c.lineTo(0,12);c.lineTo(-22,20);c.closePath();c.fill();c.restore();
      }};
    },
    sequence(s){
      const pos=[[93,148],[283,148],[93,320],[283,320]],seq=[],padColors=[];
      let stage="show",round=0,showAt=0,showTime=0,step=0,light=-1;
      const add=()=>{seq.push(random(4));round++;stage="show";showAt=0;showTime=.6;step=0};
      const tap=({x,y})=>{
        if(stage!=="input")return;const col=x<W/2?0:1,row=y<235?0:1;const n=row*2+col;
        light=n;s.host.tone(400+n*90,.09);s.emit(pos[n][0],pos[n][1],7);
        if(n!==seq[step]){s.finish("A near miss. Can you remember one more?");return}
        step++;if(step===seq.length){s.addPoints(round*160);stage="wait";showTime=.7;s.host.tone(950,.12)}
      };
      s.state.tap=tap;s.state.key=k=>{const map={"1":0,"2":1,"3":2,"4":3};if(map[k]!==undefined)tap({x:pos[map[k]][0],y:pos[map[k]][1]})};
      add();
      return{duration:58,update(dt){
        if(stage==="show"){showTime-=dt;
          if(showTime<=0){showTime=.54;light=showAt%2===0?seq[Math.floor(showAt/2)]:-1;showAt++;
            if(showAt>seq.length*2){stage="input";light=-1;showAt=0}}}
        else if(stage==="wait"){showTime-=dt;if(showTime<=0){if(round>=10)s.finish("A perfect ten. Phenomenal!");else add()}}
        else if(light>=0){light=-1}
      },draw(c){headline(c,"SEQUENCE","Watch the lights. Repeat the pattern.",s);
        const info=stage==="input"?"YOUR TURN":"WATCH CLOSELY";
        c.textAlign="center";c.font="900 20px system-ui";c.fillStyle=s.palette[1];c.fillText(info,190,88);
        c.font="800 12px system-ui";c.fillText("ROUND "+round+" · "+step+"/"+seq.length,190,412);
        for(let i=0;i<4;i++){const [x,y]=pos[i],on=light===i;
          c.save();c.shadowBlur=on?55:0;c.shadowColor=s.palette[2+i%3];c.fillStyle=s.palette[2+i%3];
          c.globalAlpha=on?1:.5;circle(c,x,y,76);c.fill();c.globalAlpha=1;
          c.lineWidth=on?9:4;c.strokeStyle=s.palette[1];circle(c,x,y,76);c.stroke();c.restore();
          c.fillStyle=s.palette[0];c.font="900 32px system-ui";c.fillText(["✳","◆","◈","✦"][i],x,y+12);}
        c.textAlign="left";
      }};
    }
  };
  window.PWYWArcade={start,stop,modes:Object.keys(modes),palette:colors,
  key:(value)=>{
    if(!active||active.ended||!active.state.key)return false;
    if(!active.started){active.started=true;active.last=performance.now();}
    active.keyboardEvents++;
    active.state.key(value);
    return true;
  },
  debugState:()=>active?{mode:active.mode,score:active.score,started:active.started,pointerEvents:active.inputEvents,
  keyboardEvents:active.keyboardEvents,position:{x:active.input.x,y:active.input.y},
  running:!active.ended,time:active.time}:null};
})();
