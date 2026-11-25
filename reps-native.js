(()=>{"use strict";
if(window.repsNative)return;window.repsNative=true;
const root=document.documentElement, vv=window.visualViewport;
function viewport(){if(vv&&Math.abs(vv.scale-1)<.05){root.style.setProperty('--reps-visible-height',vv.height+'px');root.style.setProperty('--reps-visible-top',vv.offsetTop+'px')}else{root.style.removeProperty('--reps-visible-height');root.style.removeProperty('--reps-visible-top')}}
viewport();vv?.addEventListener('resize',viewport);vv?.addEventListener('scroll',viewport);window.addEventListener('resize',viewport);
const topLevel=window===window.top;
if(topLevel){
 const nav=performance.getEntriesByType('navigation')[0];
 function save(){try{history.replaceState({...history.state,repsView:{y:scrollY,panels:['review-toggle','bonus-toggle'].filter(id=>document.getElementById(id)?.getAttribute('aria-expanded')==='true'),tab:document.querySelector('.tab-btn.active')?.id}},'')}catch(_){}}
 function restore(e){if(e?.persisted)return;if(nav?.type!=='back_forward')return;const s=history.state?.repsView;if(!s)return;for(const id of s.panels||[]){const btn=document.getElementById(id),panel=document.getElementById(btn?.getAttribute('aria-controls'));if(btn&&panel){btn.setAttribute('aria-expanded','true');panel.hidden=false;panel.inert=false}}if(s.tab==='tab-flash'&&typeof window.switchTab==='function')window.switchTab('flash');requestAnimationFrame(()=>requestAnimationFrame(()=>scrollTo(0,s.y||0)))}
 window.addEventListener('pagehide',save);document.addEventListener('click',e=>{if(e.target.closest?.('a[href]'))save()},true);window.addEventListener('pageshow',restore);
}
document.addEventListener('focusin',e=>{const field=e.target;if(!field.matches?.('textarea,input:not([type=checkbox],[type=radio],[type=button],[type=submit])'))return;setTimeout(()=>{if(document.activeElement!==field)return;const r=field.getBoundingClientRect(),bottom=(vv?.offsetTop||0)+(vv?.height||innerHeight);if(r.bottom>bottom-20||r.top<(vv?.offsetTop||0)+12)field.scrollIntoView({block:'center',behavior:'instant'})},350)});
})();