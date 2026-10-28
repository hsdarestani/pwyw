/* Keep featured game discoverable without duplicating its oversized tile in the game library. */
(()=>{'use strict';
const featured=document.querySelector('.featured-game');
const grid=document.getElementById('game-choices');
if(!featured||!grid)return;
function sync(){
 const current=featured.dataset.featuredGame;
 for(const card of grid.querySelectorAll('.game-pick[data-game]')){
  card.classList.toggle('is-featured-duplicate',Boolean(current&&card.dataset.game===current));
 }
}
const obs=new MutationObserver(sync);
obs.observe(grid,{childList:true});
obs.observe(featured,{attributes:true,attributeFilter:['data-featured-game']});
sync();
})();
