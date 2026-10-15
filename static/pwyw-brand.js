/* PWYW brand motion: small, reduced-motion-aware and dependency-free */
(()=>{
"use strict";
const label=document.querySelector("#demo-goal");
const values=["MORE RETURNS","REAL REFERRALS","SMART UPSELLS","HAPPIER CUSTOMERS"];
let current=0;
if(label&&!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)){
  setInterval(()=>{current=(current+1)%values.length;label.animate([{opacity:1,transform:"translateY(0)"},{opacity:0,transform:"translateY(-8px)"},{opacity:1,transform:"translateY(0)"}],{duration:550,easing:"ease-in-out"});label.textContent=values[current]},3400);
}
const visual=document.querySelector(".hero-visual");
if(visual && window.matchMedia("(pointer:fine)").matches){
  visual.addEventListener("pointermove",e=>{
    const r=visual.getBoundingClientRect();
    const x=(e.clientX-r.left-r.width/2)/r.width,y=(e.clientY-r.top-r.height/2)/r.height;
    visual.style.setProperty("--floatX",(x*10).toFixed(1)+"px");
    visual.style.setProperty("--floatY",(y*10).toFixed(1)+"px");
  },{passive:true});
}
})();
