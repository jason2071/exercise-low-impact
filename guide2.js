(function(){'use strict';
const el=id=>document.getElementById(id);
const todayNames=['วันอาทิตย์','วันจันทร์','วันอังคาร','วันพุธ','วันพฤหัสบดี','วันศุกร์','วันเสาร์'];
const activities=['พักฟื้น','Kettlebell','Dumbbell','Cardio','Kettlebell','Dumbbell','Cardio'];
const durations=['พัก','25–30 นาที','30–40 นาที','20–35 นาที','25–30 นาที','30–40 นาที','20–35 นาที'];
const daySections=['kettlebell','dumbbell','cardio','kettlebell','dumbbell','cardio','safety'];
const sections=[...document.querySelectorAll('main > section')];
const rows=[...document.querySelectorAll('#weekly .week-row')];
const viewIds=new Set(sections.map(section=>section.id));

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

function showView(view){
 try{
  const url=new URL(window.location.href);
  if(view==='home')url.searchParams.delete('view');else url.searchParams.set('view',view);
  window.history.replaceState(null,'',url.href);
 }catch(e){}
 const home=view==='home';
 sections.forEach(section=>{section.hidden=home?section.id!=='weekly':section.id!==view;});
 document.body.classList.toggle('view-active',!home);
 el('home-links').hidden=!home;
 el('day-controls').hidden=home;
 if(home)updateToday();
}

function openDay(index){showView(daySections[index]);window.scrollTo({top:0,behavior:'smooth'});}

el('today-button').addEventListener('click',()=>openDay(todayIndex()));
rows.forEach((link,index)=>link.addEventListener('click',event=>{event.preventDefault();openDay(index);}));
el('back-to-week').addEventListener('click',()=>showView('home'));
document.querySelectorAll('[data-info]').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.info)));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateToday();});

const savedView=new URLSearchParams(window.location.search).get('view')||'home';
showView(viewIds.has(savedView)?savedView:'home');
})();
