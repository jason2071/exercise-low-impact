(function(){'use strict';
const el=id=>document.getElementById(id);
const todayNames=['วันอาทิตย์','วันจันทร์','วันอังคาร','วันพุธ','วันพฤหัสบดี','วันศุกร์','วันเสาร์'];
const activities=['พักฟื้น','เวททั้งตัว','เดินลู่เบา','เดินลู่ปานกลาง','เวททั้งตัว','เดินลู่เบา','เดินลู่ปานกลาง'];
const durations=['พัก','26–28 นาที','15–30 นาที','25–40 นาที','26–28 นาที','15–30 นาที','25–40 นาที'];
const daySections=['dumbbell','walk-light','cardio','dumbbell','walk-light','cardio','recovery'];
const sections=[...document.querySelectorAll('main > section')];
const rows=[...document.querySelectorAll('#weekly .week-row')];
const viewIds=new Set(sections.map(section=>section.id));
viewIds.delete('timer');
let currentView='home';
let focusMode=false;

function todayIndex(){return (new Date().getDay()+6)%7;}

function updateToday(){
 const day=new Date().getDay();
 el('today-label').textContent='วันนี้ · '+todayNames[day].replace('วัน','')+' — '+activities[day]+' · '+durations[day];
 el('today-action').hidden=false;
 rows.forEach((row,index)=>{
  const today=index===(day+6)%7;
  row.classList.toggle('is-today',today);
  row.querySelector('.today-badge').hidden=!today;
 });
}

function showView(view, workout=''){
 if(focusMode&&!el('kb-pause').disabled){
  window.alert('กรุณาหยุดจับเวลาหรือฝึกให้เสร็จก่อนออกจากโหมดฝึก');
  return;
 }
 currentView=view;
 const strengthDay=view==='dumbbell';
 focusMode=((strengthDay||view==='walk-light')&&workout===view)||(view==='cardio'&&(workout==='walk'||workout==='tabata'));
 try{
  const url=new URL(window.location.href);
  if(view==='home')url.searchParams.delete('view');else url.searchParams.set('view',view);
  if(focusMode)url.searchParams.set('mode','focus');else url.searchParams.delete('mode');
  if(focusMode&&view==='cardio')url.searchParams.set('activity',workout);else url.searchParams.delete('activity');
  window.history.replaceState(null,'',url.href);
 }catch(e){}
 const home=view==='home';
 const visibleView=home?'weekly':focusMode?'timer':view;
 sections.forEach(section=>{section.hidden=section.id!==visibleView;});
 document.body.classList.toggle('view-active',!home);
 document.body.classList.toggle('focus-active',focusMode);
 el('kb-focus-toggle').hidden=!strengthDay&&!focusMode;
 el('kb-focus-toggle').textContent=focusMode?'ดูรายละเอียดท่า':'เริ่มโหมดฝึก';
 if(focusMode)document.dispatchEvent(new CustomEvent('guide-workout',{detail:workout}));
 el('home-links').hidden=!home;
 el('day-controls').hidden=home;
 if(home)updateToday();
}

function openDay(index){showView(daySections[index]);window.scrollTo({top:0,behavior:'smooth'});}

el('today-button').addEventListener('click',()=>openDay(todayIndex()));
rows.forEach((link,index)=>link.addEventListener('click',event=>{event.preventDefault();openDay(index);}));
el('back-to-week').addEventListener('click',()=>showView('home'));
el('kb-focus-toggle').addEventListener('click',()=>showView(currentView,focusMode?'':currentView));
document.querySelectorAll('[data-workout]').forEach(button=>{
 button.addEventListener('click',()=>showView(button.dataset.workout==='walk-light'?'walk-light':'cardio',button.dataset.workout));
});
document.querySelectorAll('[data-info]').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.info)));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateToday();});

const params=new URLSearchParams(window.location.search);
const viewParam=params.get('view');
const savedView=viewParam==='kettlebell'?'dumbbell':viewParam;
const savedWorkout=savedView==='cardio'?params.get('activity'):savedView;
showView(viewIds.has(savedView)?savedView:'home',params.get('mode')==='focus'?savedWorkout:'');
})();
