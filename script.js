(function(){'use strict';
const A=['Shadow Boxing','Step Touch','Bodyweight Squat','Fast March'];
const B=['Low-impact Jack','Boxing Uppercut','Standing Hip Hinge','Fast Step Touch'];
const el=id=>document.getElementById(id);
let started=false,timerVisible=true,showFloating=false;
let running=false,timer=null,phase='prepare',remain=10,block=1,segment=0,program='A',target=3,completed=false;
const names=()=>program==='A'?A:B;
let audioContext=null,pauseReason='';
function enableAudio(){try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;if(!audioContext)audioContext=new Audio();if(audioContext.state==='suspended')audioContext.resume();}catch(e){}}
function beep(freq=720,duration=.15){try{if(!audioContext)return;const o=audioContext.createOscillator(),g=audioContext.createGain();o.frequency.value=freq;o.type='sine';o.connect(g);g.connect(audioContext.destination);g.gain.value=.08;o.start();o.stop(audioContext.currentTime+duration);}catch(e){}}
function fmt(s){return String(Math.max(0,s));}
function render(){let label='READY TO MOVE', name='พร้อมเริ่มฝึก',detail='บล็อก '+block+' / '+target+' · ช่วงที่ '+(segment+1)+' / 8';if(completed){label='WORKOUT COMPLETE';name='จบโปรแกรมแล้ว เยี่ยมเลย!';detail='ครบ '+target+' บล็อก';}else if(phase==='prepare'){label='GET READY · 10 SECONDS';name='เตรียม: '+names()[0];}else if(phase==='work'){label='WORK · 20 SECONDS';name=names()[segment%4];}else if(phase==='rest'){label='REST · 10 SECONDS';name=segment===7?(block<target?'ต่อไป: พักระหว่างบล็อก':'ต่อไป: จบโปรแกรม'):'เตรียม: '+names()[(segment+1)%4];}else if(phase==='break'){label='ROUND BREAK · 90 SECONDS';name='พักระหว่างบล็อก';detail='บล็อกถัดไป '+(block+1)+' / '+target;}updateFocus();el('floating-phase').textContent=running?label:completed?label:'หยุดชั่วคราว';el('floating-move').textContent=name;el('floating-count').textContent=completed?'✓':fmt(remain);el('floating-start').textContent=started?'▶ ทำต่อ':'▶ เริ่ม';el('floating-start').disabled=running||completed;el('floating-pause').disabled=!running;el('floating-timer').hidden=!showFloating||timerVisible;el('timer-status').textContent=pauseReason;el('timer-status').hidden=!pauseReason;el('phase-kicker').textContent=label;el('current-move').textContent=name;el('counter').textContent=completed?'✓':fmt(remain);el('timer-stage').textContent=detail;let total=phase==='work'?20:phase==='break'?90:10;el('timer-progress').style.width=(completed?100:100*(total-remain)/total)+'%';el('focus-progress-fill').style.width=(completed?100:100*(total-remain)/total)+'%';el('timer-start').disabled=running||completed;el('timer-pause').disabled=!running;el('workout-type').disabled=running;el('round-count').disabled=running;el('timer-start').textContent=!started?'▶ เริ่ม':'▶ ทำต่อ';}
function next(){if(phase==='prepare'){phase='work';remain=20;beep(880,.25);}else if(phase==='work'){phase='rest';remain=10;beep(520,.25);}else if(phase==='rest'){if(segment<7){segment++;phase='work';remain=20;beep(880,.25);}else if(block<target){phase='break';remain=90;beep(440,.35);}else{completed=true;stop();beep(1040,.5);}}else if(phase==='break'){block++;segment=0;phase='work';remain=20;beep(880,.25);}render()}
function stop(reason=''){running=false;pauseReason=started&&!completed?(typeof reason==='string'&&reason?reason:'หยุดชั่วคราว'):'';if(timer){clearInterval(timer);timer=null;}render()}
function reset(keepFloating=false){started=false;showFloating=keepFloating;stop();program=el('workout-type').value;target=Number(el('round-count').value);phase='prepare';remain=10;block=1;segment=0;completed=false;render();}
function start(){if(running||completed)return;enableAudio();started=true;showFloating=true;running=true;pauseReason='';render();let last=Date.now();timer=setInterval(()=>{const now=Date.now();const elapsed=Math.floor((now-last)/1000);if(elapsed<1)return;last+=elapsed*1000;for(let i=0;i<Math.min(elapsed,180)&&!completed;i++){remain--;if(remain<=0)next();else if((phase==='prepare'||phase==='work'||phase==='break'||(phase==='rest'&&segment<7))&&remain<=3)beep(700,.1);}render();},200)}
let selectedDay=null,focusMode=false,lastFocusKey='';
const sections=[...document.querySelectorAll('main > section')];
const daySections=['tabata-a','strength','treadmill','tabata-b','strength','treadmill','safety'];
function updateFocus(){
 if(!focusMode)return;
 const index=phase==='prepare'||phase==='break'?0:phase==='rest'&&segment<7?(segment+1)%4:segment%4;
 const key=program+':'+index;
 const source=el(program+'-'+(index+1));
 if(!source)return;
 if(key!==lastFocusKey){
  lastFocusKey=key;const image=source.querySelector('img').cloneNode(true);image.loading='eager';el('focus-image').replaceChildren(image);
  el('focus-name').textContent=source.querySelector('h3').textContent;
  el('focus-description').textContent=source.querySelector('.move-body p').textContent;
 }
 el('focus-label').textContent=completed?'เสร็จสิ้น':phase==='work'?'ท่าปัจจุบัน':'ท่าถัดไป';
}
function showView(view){
 try{const url=new URL(window.location.href);if(view==='home')url.searchParams.delete('view');else url.searchParams.set('view',view);if(focusMode)url.searchParams.set('mode','focus');else url.searchParams.delete('mode');window.history.replaceState(null,'',url.href);}catch(e){}
 const home=view==='home',tabata=view==='tabata-a'||view==='tabata-b';
 sections.forEach(section=>{section.hidden=home?section.id!=='weekly':section.id!==view&&!(tabata&&focusMode&&section.id==='timer');});
 document.body.classList.toggle('view-active',!home);el('home-links').hidden=!home;el('day-controls').hidden=home;if(home)updateToday();
 el('focus-toggle').hidden=!tabata;el('focus-toggle').textContent=focusMode?'ดูรายละเอียดท่า':'เริ่มโหมดฝึก';
 document.body.classList.toggle('focus-active',tabata&&focusMode);el('focus-exercise').hidden=!(tabata&&focusMode);
 if(tabata&&focusMode)el(view).hidden=true;
 updateFocus();
}
function openDay(index){
 const view=daySections[index],desired=view==='tabata-a'?'A':view==='tabata-b'?'B':null;
 if(desired&&desired!==program){
  if(started&&!completed&&!window.confirm('การเปลี่ยนโปรแกรมจะเริ่มจับเวลาใหม่ ต้องการดำเนินการหรือไม่?'))return;
  el('workout-type').value=desired;reset();
 }
 selectedDay=view;focusMode=false;lastFocusKey='';showView(view);window.scrollTo({top:0,behavior:'smooth'});
}
const todayNames=['วันอาทิตย์','วันจันทร์','วันอังคาร','วันพุธ','วันพฤหัสบดี','วันศุกร์','วันเสาร์'];
function updateToday(){const day=new Date().getDay();const activities=['พักฟื้น','Tabata A','Full-body','เดินลู่','Tabata B','Full-body','เดินลู่'];const durations=['พัก','20–25 นาที','35–45 นาที','25–35 นาที','20–25 นาที','35–45 นาที','30–40 นาที'];el('today-label').textContent='วันนี้ · '+todayNames[day].replace('วัน','')+' — '+activities[day]+' · '+durations[day];el('today-action').hidden=false;document.querySelectorAll('#weekly .week-row').forEach((row,index)=>{const today=index===(day+6)%7;row.classList.toggle('is-today',today);row.querySelector('.today-badge').hidden=!today;});}
el('today-button').addEventListener('click',()=>openDay((new Date().getDay()+6)%7));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateToday();});
updateToday();
document.querySelectorAll('#weekly .week-row').forEach((link,index)=>link.addEventListener('click',event=>{event.preventDefault();openDay(index);}));
function canLeaveFocus(){if(focusMode&&running){window.alert('กรุณาหยุดจับเวลาหรือฝึกให้เสร็จก่อนออกจากโหมดฝึก');return false;}return true;}
el('back-to-week').addEventListener('click',()=>{if(!canLeaveFocus())return;selectedDay=null;focusMode=false;showView('home');window.scrollTo({top:0,behavior:'smooth'});});
el('focus-toggle').addEventListener('click',()=>{if(focusMode&&!canLeaveFocus())return;focusMode=!focusMode;lastFocusKey='';showView(selectedDay);window.scrollTo({top:0,behavior:'smooth'});});
document.querySelectorAll('[data-info]').forEach(button=>button.addEventListener('click',()=>{selectedDay=button.dataset.info;focusMode=false;showView(selectedDay);window.scrollTo({top:0,behavior:'smooth'});}));
const params=new URLSearchParams(window.location.search);const savedView={view:params.get('view')||'home',focus:params.get('mode')==='focus'};
const allowedViews=['home','tabata-a','tabata-b','strength','treadmill','safety','progression'];
if(savedView&&allowedViews.includes(savedView.view)){selectedDay=savedView.view==='home'?null:savedView.view;focusMode=!!savedView.focus&&(selectedDay==='tabata-a'||selectedDay==='tabata-b');if(selectedDay==='tabata-b'){program='B';el('workout-type').value='B';}showView(savedView.view);}else showView('home');
document.addEventListener('click',event=>{if(focusMode&&running&&event.target.closest('a')){event.preventDefault();event.stopPropagation();canLeaveFocus();}},true);
window.addEventListener('beforeunload',event=>{if(focusMode&&running){event.preventDefault();event.returnValue='';}});
const observer=new IntersectionObserver(entries=>{timerVisible=entries[0].isIntersecting;render();},{threshold:0});observer.observe(el('counter'));
el('floating-start').addEventListener('click',start);el('floating-pause').addEventListener('click',stop);el('floating-reset').addEventListener('click',()=>reset(true));
el('timer-start').addEventListener('click',start);el('timer-pause').addEventListener('click',stop);el('timer-reset').addEventListener('click',()=>reset());function changeSettings(){if(!completed&&started&&!window.confirm('การเปลี่ยนตัวเลือกจะเริ่มจับเวลาใหม่ ต้องการดำเนินการหรือไม่?')){el('workout-type').value=program;el('round-count').value=String(target);return;}reset();}
el('round-count').addEventListener('change',changeSettings);document.addEventListener('visibilitychange',()=>{if(document.hidden&&running){stop('หยุดชั่วคราวเมื่อออกจากหน้าเว็บ · กดทำต่อเพื่อฝึกต่อ');}});reset();
})();
