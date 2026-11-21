/* Reps web push: optional, device-based subscription; Google sign-in NOT required. */
(function(){
  'use strict';
  const cfg=window.REPS_PUSH_CONFIG||{};
  const $=id=>document.getElementById(id);
  const supported=()=>('serviceWorker' in navigator)&&('PushManager' in window)&&('Notification' in window)&&window.isSecureContext;
  const installed=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const ios=()=>/iPad|iPhone|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const enabled=()=>!!(cfg.enabled && cfg.vapidPublicKey && cfg.manageEndpoint);
  function bytes(base64url){
    const base64=base64url.replace(/-/g,'+').replace(/_/g,'/');
    const raw=atob(base64.padEnd(Math.ceil(base64.length/4)*4,'='));
    return Uint8Array.from(raw,c=>c.charCodeAt(0));
  }
  async function status(){
    if(!enabled())return {kind:'setup',message:'알림 서비스 설정 중이에요. 조금 뒤에 다시 확인해 주세요.'};
    if(ios()&&!installed())return {kind:'install',message:'iPhone에서는 Safari의 공유 버튼 → 홈 화면에 추가로 Reps를 설치한 뒤, 앱에서 알림을 켤 수 있어요.'};
    if(!supported())return {kind:'unsupported',message:'이 브라우저에서는 푸시 알림을 지원하지 않아요. Reps 앱 또는 최신 Chrome을 사용해 주세요.'};
    if(Notification.permission==='denied')return {kind:'denied',message:'휴대폰 설정에서 Reps 알림 권한을 허용해 주세요.'};
    try{
      const registration=await navigator.serviceWorker.register('./sw.js');
      const subscription=await registration.pushManager.getSubscription();
      return subscription?{kind:'on',message:'이 기기에서 복습 자료 알림을 받고 있어요! 🔔',subscription}:{kind:'off',message:'오늘의 복습 자료가 모두 올라오면 알림을 보내드릴게요.'};
    }catch(err){return {kind:'error',message:'알림 설정을 확인할 수 없어요. 다시 시도해 주세요.'}}
  }
  async function manage(action,subscription){
    const response=await fetch(cfg.manageEndpoint,{
      method:'POST',mode:'cors',credentials:'omit',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action,subscription:subscription.toJSON()})
    });
    if(!response.ok)throw new Error('알림 서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.');
    return response.json();
  }
  async function enable(){
    if(!enabled())throw new Error('아직 알림 서비스를 설정하고 있어요.');
    if(ios()&&!installed())throw new Error('iPhone에서는 Reps를 홈 화면에 설치한 뒤 앱에서 알림을 켜 주세요.');
    if(!supported())throw new Error('이 기기에서는 웹 푸시 알림을 지원하지 않아요.');
    // Must be called directly from a tap: no await before the native permission dialog.
    const permission=await Notification.requestPermission();
    if(permission!=='granted')throw new Error('알림 권한이 허용되지 않았어요. 기기 설정에서 다시 변경할 수 있어요.');
    const registration=await navigator.serviceWorker.register('./sw.js');
    let subscription=await registration.pushManager.getSubscription();
    let created=false;
    if(!subscription){
      subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes(cfg.vapidPublicKey)});
      created=true;
    }
    try{await manage('subscribe',subscription)}
    catch(err){if(created)await subscription.unsubscribe().catch(()=>{});throw err}
    return true;
  }
  async function disable(){
    if(!enabled())throw new Error('알림 설정이 아직 준비되지 않았어요.');
    const registration=await navigator.serviceWorker.register('./sw.js');
    const subscription=await registration.pushManager.getSubscription();
    if(!subscription)return true;
    await manage('unsubscribe',subscription);
    await subscription.unsubscribe();
    return true;
  }
  function setupSettings(){
    if(!$('push-settings'))return;
    const on=$('push-enable'),off=$('push-disable'),note=$('push-status');
    const render=async()=>{
      const state=await status();
      note.textContent=state.message;
      on.hidden=state.kind!=='off';
      off.hidden=state.kind!=='on';
    };
    on.addEventListener('click',async()=>{
      on.disabled=true;note.textContent='알림을 설정하고 있어요…';
      try{await enable()}catch(e){note.textContent=e.message;on.disabled=false;return}
      on.disabled=false;await render();
    });
    off.addEventListener('click',async()=>{
      off.disabled=true;note.textContent='알림을 해제하고 있어요…';
      try{await disable()}catch(e){note.textContent=e.message;off.disabled=false;return}
      off.disabled=false;await render();
    });
    render();
  }
  async function maybeShowFirstRun(){
    if(!installed()||!enabled()||!supported()||localStorage.getItem('reps-notification-onboarding-v1'))return;
    const state=await status();
    if(state.kind!=='off')return;
    const overlay=document.createElement('div');
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','Review notifications');
    overlay.style.cssText='position:fixed;inset:0;background:rgba(2,6,23,.78);z-index:100000;display:grid;place-items:center;padding:20px';
    const card=document.createElement('div');
    card.style.cssText='width:100%;max-width:400px;background:#1e293b;color:#f8fafc;border:1px solid #475569;border-radius:20px;padding:25px;font:16px/1.55 system-ui;box-shadow:0 20px 65px #0009';
    const heading=document.createElement('h2');
    heading.style.cssText='margin:0 0 10px;font-size:1.3rem';
    heading.textContent='🔔 복습 자료가 올라오면 알려드릴까요?';
    const desc=document.createElement('p');
    desc.textContent='오늘의 수업 복습 자료가 모두 준비되면 알림을 보내드려요. 하루에 한 번만 보내고, 언제든 끌 수 있어요!';
    const ok=document.createElement('button');
    ok.textContent='🔔 알림 받기';ok.style.cssText='display:block;width:100%;padding:13px;border:0;border-radius:11px;background:#14b8a6;color:#052e2b;font-weight:800;font-size:16px';
    const later=document.createElement('button');
    later.textContent='나중에 할게요';later.style.cssText='display:block;width:100%;margin-top:9px;padding:12px;border:1px solid #64748b;border-radius:11px;background:#334155;color:white;font-size:15px';
    const error=document.createElement('p');error.style.cssText='color:#fca5a5;font-size:13px;min-height:18px';
    card.append(heading,desc,ok,later,error);overlay.append(card);
    document.body.append(overlay);ok.focus();
    const close=()=>{localStorage.setItem('reps-notification-onboarding-v1','1');overlay.remove()};
    later.onclick=close;
    ok.onclick=async()=>{ok.disabled=true;try{await enable();close()}catch(e){error.textContent=e.message;ok.disabled=false}};
  }
  window.RepsPush={status,enable,disable,enabled,installed};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setupSettings);else setupSettings();
  if(document.body&&document.getElementById('english-corner-embed')){
    window.addEventListener('load',()=>{setTimeout(()=>maybeShowFirstRun().catch(()=>{}),500)});
  }
})();
