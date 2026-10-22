(function () {
  'use strict';
  // Add other explicitly trusted ServiceNow hosts here if needed.
  const ALLOWED_PARENT_ORIGINS = ['https://demoalectriallwfaeu159122.service-now.com'];
  const SOURCE = 'vicc-cv';
  const DASHBOARD_SOURCE = 'vicc-dashboard';
  const CAMERA_ID = 'CAM-07';
  const colors = {low:'#8ee4ac', medium:'#ffc05d', high:'#ffc05d', critical:'#ff6076'};
  const tracks = [
    { trackingId:'TRK-5001', label:'Person · PPE Compliant', category:'person', severity:'low', confidence:.96, x:22.2, y:43, w:8.2, h:37, drift:1.0 },
    { trackingId:'TRK-5002', label:'Person · No Helmet', category:'helmet', severity:'critical', confidence:.93, x:38.0, y:37, w:9.0, h:41, drift:.7 },
    { trackingId:'TRK-5003', label:'Person · PPE Compliant', category:'person', severity:'low', confidence:.97, x:55.0, y:43, w:8.0, h:35, drift:.7 },
    { trackingId:'TRK-5004', label:'Forklift', category:'forklift', severity:'high', confidence:.94, x:70.0, y:60, w:21, h:25, drift:1.7 }
  ];
  const $ = id => document.getElementById(id);
  const boxes = $('boxes');
  const mode = $('mode');
  const detail = $('detail');
  const video = $('footage');
  const illustration = $('illustration');
  let running = true;
  let currentSelected = null;
  const nodes = new Map();
  const phase = new Map();
  const sourceOrigin = (() => { try { return document.referrer ? new URL(document.referrer).origin : null; } catch (_) { return null; } })();
  function trustedOrigin(origin) { return ALLOWED_PARENT_ORIGINS.includes(origin); }
  function targetOrigin() { return sourceOrigin && trustedOrigin(sourceOrigin) ? sourceOrigin : ALLOWED_PARENT_ORIGINS[0]; }
  function send(type, payload) {
    if (window.parent !== window) window.parent.postMessage({source:SOURCE,type,payload},targetOrigin());
  }
  function serialize(t) { return { trackingId:t.trackingId, label:t.label, category:t.category, severity:t.severity, confidence:t.confidence }; }
  function openDetail(t, notify) {
    currentSelected=t.trackingId;
    $('detailTitle').textContent=t.label;
    $('detailId').textContent=t.trackingId;
    $('detailCategory').textContent=t.category;
    $('detailConfidence').textContent=Math.round(t.confidence*100)+'%';
    $('detailSeverity').textContent=t.severity.toUpperCase();
    $('detailSeverity').style.color=colors[t.severity];
    detail.hidden=false;
    if(notify) send('detectionSelected',serialize(t));
  }
  $('closeDetail').addEventListener('click',()=>{detail.hidden=true;currentSelected=null;});
  function createBox(t) {
    const el=document.createElement('button'); el.type='button';
    el.className='track '+t.severity;
    el.style.left=t.x+'%';el.style.top=t.y+'%';el.style.width=t.w+'%';el.style.height=t.h+'%';
    el.style.borderColor=colors[t.severity];el.style.color=colors[t.severity];
    el.setAttribute('aria-label',t.label+', confidence '+Math.round(t.confidence*100)+'%');
    const tag=document.createElement('span');tag.className='tag';tag.textContent=t.label+' · '+Math.round(t.confidence*100)+'%';el.appendChild(tag);
    for(const corner of ['tl','tr','bl','br']){const s=document.createElement('span');s.className='corner '+corner;el.appendChild(s);}
    const id=document.createElement('span');id.className='id';id.textContent=t.trackingId;el.appendChild(id);
    el.addEventListener('click',()=>openDetail(t,true));boxes.appendChild(el);nodes.set(t.trackingId,el);
  }
  tracks.forEach((t,i)=>{createBox(t);phase.set(t.trackingId,i*1.8);});
  $('count').textContent=String(tracks.length).padStart(2,'0');
  $('alerts').textContent=String(tracks.filter(t=>['high','critical'].includes(t.severity)).length).padStart(2,'0');
  $('avg').textContent=Math.round(tracks.reduce((sum,t)=>sum+t.confidence,0)*100/tracks.length)+'%';
  const animate=ts=>{
    if(running) tracks.forEach(t=>{
      const a=ts/1900+phase.get(t.trackingId);
      nodes.get(t.trackingId).style.transform=`translate(${Math.sin(a)*t.drift}%,${Math.cos(a*.9)*t.drift*.45}%)`;
    });
    requestAnimationFrame(animate);
  };requestAnimationFrame(animate);
  const clock=()=>{$('clock').textContent=new Date().toLocaleTimeString('en-GB',{hour12:false});}; clock();setInterval(clock,1000);
  function publishDetections(){if(running)send('detections',{cameraId:CAMERA_ID,tracks:tracks.map(serialize),at:Date.now()});}
  setInterval(publishDetections,4000);
  window.addEventListener('message',event=>{
    if(event.source!==window.parent||!trustedOrigin(event.origin))return;
    const message=event.data;
    if(!message||message.source!==DASHBOARD_SOURCE||typeof message.type!=='string')return;
    switch(message.type){
      case 'pause':running=false;if(!video.paused)video.pause();break;
      case 'resume':running=true;video.play().catch(()=>{});break;
      case 'selectTrack':{
        const t=tracks.find(t=>t.trackingId===message.payload?.trackingId);
        if(t)openDetail(t,false);break;
      }
      case 'setMode':{
        const live=Boolean(message.payload?.live);
        // A dashboard "live" flag does not establish real inference; retain simulation disclosure.
        mode.textContent=live?'● LIVE SIMULATION':'● SIMULATION';
        mode.classList.toggle('live',live);break;
      }
    }
  });
  video.addEventListener('playing',()=>{illustration.style.display='none';});
  video.addEventListener('error',()=>{video.style.display='none';illustration.style.display='block';});
  video.play().catch(()=>{video.style.display='none';illustration.style.display='block';});
  // Emit readiness immediately once the listener/UI are mounted: dashboard fallback starts at ~6s.
  send('ready',{tracks:tracks.length});
  publishDetections();
  // Also works as an unembedded standalone preview; message contract remains unchanged.
})();
