(()=>{"use strict";
const base=new URL(".",document.currentScript.src), params=new URLSearchParams(location.search);
const day=()=>new Date(Date.now()+9*3600000).toISOString().slice(0,10);
const norm=s=>String(s).normalize("NFKC").replace(/[’‘]/g,"'").trim().replace(/\s+/g," ").toLowerCase();
let pool=[],dialog,last=-1;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
function button(label,fn,cls){const b=el("button",label,cls);b.type="button";b.onclick=fn;return b}
function decorate(n,key){if(window.repsChalkIcon)n.prepend(window.repsChalkIcon(key),document.createTextNode(" "));return n}
function scramble(q){const original=[...q.words], forbidden=new Set([norm(original.join(" ")),norm([...original].reverse().join(" ")),...q.answers.flatMap(a=>[norm(a),norm(a.split(" ").reverse().join(" "))])]);let words=[...original];for(let attempt=0;attempt<40;attempt++){for(let j=words.length-1;j>0;j--){const k=Math.floor(Math.random()*(j+1));[words[j],words[k]]=[words[k],words[j]]}if(!forbidden.has(norm(words.join(" "))))return words}return words}
function show(){if(!pool.length||dialog?.open)return;
if(!dialog){dialog=el("dialog",undefined,"reps-quiz-dialog");document.body.append(dialog)}
let i=Math.floor(Math.random()*pool.length);last=i;const q=pool[i];dialog.replaceChildren();
const close=()=>dialog.close();const head=el("div",undefined,"rq-head");head.append(decorate(el("strong","QUICK REPS"),"bolt"),button("×",close,"rq-close"));dialog.append(head,el("p",q.type.replaceAll("_"," ").toUpperCase(),"rq-label"),el("h2",q.prompt.replace(/\s*—\s*(?:Choose the matching expression|Type the lesson expression|Put the words in order)\.?\s*$/i,"")));
const area=el("div"),feedback=el("div");dialog.append(area,feedback);
const skip=button("Skip for now",close,"rq-quiet");dialog.append(skip);
let answered=false;
function answer(value){if(answered)return;answered=true;area.querySelectorAll("button,input").forEach(n=>n.disabled=true);skip.remove();const correct=q.answers.some(a=>norm(a)===norm(value));feedback.append(decorate(el("h3",correct?"Nicely done!":"Not quite!",correct?"rq-correct":"rq-wrong"),correct?"check":"wrong"));window.repsFeedback?.play(correct?"correct":"wrong");feedback.classList.add(correct?"rq-feedback-correct":"rq-feedback-wrong");if(!correct)feedback.append(el("p","Answer: "+q.answers[0]));feedback.append(decorate(el("p",q.explanation),"bulb"),decorate(button("Another rep",()=>{dialog.close();show()},"rq-primary"),"refresh"),button("That's enough for now",close,"rq-quiet"))}
if(q.type==="typing"){const input=el("input");input.placeholder="Type your answer";input.setAttribute("aria-label","Your answer");area.append(input,button("Check answer",()=>{if(input.value.trim())answer(input.value)},"rq-primary"));input.onkeydown=e=>{if(e.key==="Enter"&&input.value.trim())answer(input.value)}}
else if(q.type==="unscramble"){let chosen=[];const line=el("p","","rq-assembled"),chips=el("div",undefined,"rq-chips");area.append(line,chips);scramble(q).forEach(w=>{const b=button(w,()=>{chosen.push(w);window.repsFeedback?.play('tap');b.disabled=true;line.textContent=chosen.join(" ")});chips.append(b)});area.append(button("Start over",()=>{chosen=[];line.textContent="";chips.querySelectorAll("button").forEach(b=>b.disabled=false)},"rq-quiet"),button("Check answer",()=>{if(chosen.length===q.words.length)answer(chosen.join(" "))},"rq-primary"))}
else{const opts=[...q.options];for(let j=opts.length-1;j>0;j--){const k=Math.floor(Math.random()*(j+1));[opts[j],opts[k]]=[opts[k],opts[j]]}opts.forEach(o=>area.append(button(o,()=>answer(o))))}
dialog.showModal();dialog.querySelector(".rq-close").focus();
}
async function load(){try{const month=day().slice(0,7),res=await fetch(new URL("quick-reps/"+month+".json",base),{cache:"no-cache"});if(!res.ok)return;const data=await res.json();if(!data.enabled&&!params.has("reps-preview"))return;pool=data.weeks.filter(w=>Date.parse(w.releaseAt)<=Date.now()).flatMap(w=>w.questions).filter(q=>q.prompt&&q.answers?.length&&q.explanation);if(!pool.length)return;const nav=performance.getEntriesByType("navigation")[0];if(nav?.type!=="back_forward"&&!document.referrer.startsWith(base.href))show();else if(params.has("reps-preview"))show();document.addEventListener("visibilitychange",()=>{if(document.hidden){lastHidden=Date.now()}else if(lastHidden&&Date.now()-lastHidden>3000){lastHidden=0;show()}})}catch(e){console.warn("Quick Reps unavailable",e)}}
let lastHidden=0;load();
})();