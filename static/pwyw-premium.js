/* Progressive enhancement only: no business or reward rules live here. */
(()=>{'use strict';
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const nav=document.querySelector('.workspace-nav');
 const localize=()=>{const fa=document.documentElement.lang==='fa';nav?.querySelectorAll('a').forEach(a=>{const next=fa?a.dataset.fa:a.dataset.de;if(a.textContent!==next)a.textContent=next})};
 if(nav){document.addEventListener('pwyw:language-changed',localize);localize();nav.addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;const target=document.querySelector(a.getAttribute('href'));if(!target)return;e.preventDefault();let parent=target;while(parent){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement}target.scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'});target.setAttribute('tabindex','-1');target.focus({preventScroll:true});nav.querySelectorAll('a').forEach(link=>{if(link===a)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')})})}
 const picker=document.querySelector('.showcase-picker');
 const localizePreview=()=>{const fa=document.documentElement.lang==='fa';picker?.querySelectorAll('button').forEach(button=>{button.textContent=fa?button.dataset.fa:button.dataset.de});picker?.setAttribute('aria-label',fa?'پیش‌نمایش بازی':'Spielvorschau')};
 if(picker){localizePreview();document.addEventListener('pwyw:language-changed',localizePreview)}
 picker?.addEventListener('click',e=>{
  const button=e.target.closest('button[data-preview]');if(!button)return;
  picker.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  const art=document.querySelector('.showcase-art');art.src='/static/game-art/'+button.dataset.preview+'.svg';art.alt=button.textContent;
 });
 const password=document.querySelector('#auth-form input[name=password]');
 if(password){
  const meter=document.createElement('div');meter.className='password-meter';meter.setAttribute('aria-hidden','true');
  for(let i=0;i<4;i++)meter.append(document.createElement('span'));password.parentElement.after(meter);
  const update=()=>{const value=password.value;const n=Math.min(4,Math.floor(value.length/3));meter.hidden=!document.querySelector('#tab-signup')?.classList.contains('active');[...meter.children].forEach((s,i)=>s.classList.toggle('filled',i<n))};
  password.addEventListener('input',update);document.querySelector('.mode-toggle')?.addEventListener('click',()=>queueMicrotask(update));update();
 }
 // Animate an actual score change, without changing or announcing the value twice.
 const score=document.getElementById('score');let previous=score?.textContent;
 if(score)new MutationObserver(()=>{const next=score.textContent;if(next!==previous&&!reduced())score.animate([{transform:'scale(1)'},{transform:'scale(1.16)'},{transform:'scale(1)'}],{duration:260});previous=next}).observe(score,{childList:true,characterData:true,subtree:true});
 const result=document.getElementById('finish-modal');let confetti;
 function clear(){confetti?.remove();confetti=null}
 if(result)new MutationObserver(()=>{
  clear();if(result.hidden||reduced())return;
  confetti=document.createElement('div');confetti.className='pw-confetti';confetti.setAttribute('aria-hidden','true');
  for(let i=0;i<32;i++){const p=document.createElement('i');p.style.cssText=`--x:${Math.random()*100}%;--d:${Math.random()*.25}s;--drift:${Math.random()*160-80}px;--c:${['#d9fa79','#ad8bed','#f5ae8d'][i%3]}`;confetti.append(p)}
  document.body.append(confetti);setTimeout(clear,2400);
 }).observe(result,{attributes:true,attributeFilter:['hidden']});
})();
