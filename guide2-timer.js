(function(){
'use strict';

const el=id=>document.getElementById(id);
const controls={start:el('kb-start'),pause:el('kb-pause'),reset:el('kb-reset'),rounds:el('guide-rounds')};
const strength={
 kettlebell:[['kb-1',2],['kb-2',2],['kb-3',2,true],['kb-4',2,true]],
 dumbbell:[['db-1',3],['db-2',3,true],['db-3',2],['db-4',2],['db-5',2]]
};
let workout='',stages=[],index=0,remaining=0,running=false,completed=false;
let deadline=0,interval=null,audio=null,lastSecond=null,pauseReason='',displayedCard=null;

function buildStages(){
 if(workout==='walk')return [
  {label:'วอร์มอัป',duration:300,name:'เดินลู่ · 2.5–3.0 km/h'},
  {label:'เดินช่วงหลัก',duration:1200,name:'เดินลู่ · เริ่มที่ 3.5 km/h'},
  {label:'คูลดาวน์',duration:300,name:'เดินลู่ · 2.5–3.0 km/h'}
 ];
 if(workout==='tabata'){
  const queue=[{label:'เตรียมตัว',duration:10,card:'cardio-1'}];
  const rounds=Number(controls.rounds.value);
  for(let round=1;round<=rounds;round++){
   for(let step=0;step<8;step++){
    const detail='รอบ '+round+'/'+rounds+' · ช่วง '+(step+1)+'/8';
    queue.push({label:'กำลังฝึก',duration:20,card:'cardio-'+(step%4+1),detail,work:true});
    if(step<7)queue.push({label:'พักระหว่างท่า',duration:10,card:'cardio-'+((step+1)%4+1),detail});
   }
   if(round<rounds)queue.push({label:'พักระหว่างรอบ',duration:90,card:'cardio-1',detail:'รอบถัดไป '+(round+1)+'/'+rounds});
  }
  return queue;
 }
 const exercises=strength[workout];
 const queue=[{label:'เตรียมตัว',duration:10,card:exercises[0][0]}];
 exercises.forEach(([card,sets,twoSides],position)=>{
  for(let set=1;set<=sets;set++){
   const detail='เซต '+set+'/'+sets;
   queue.push({label:'กำลังฝึก',duration:40,card,detail,side:twoSides?'ขวา':'',work:true});
   if(twoSides){
    queue.push({label:'เตรียมเปลี่ยนข้าง',duration:10,card,detail,side:'ซ้าย'});
    queue.push({label:'กำลังฝึก',duration:40,card,detail,side:'ซ้าย',work:true});
   }
   if(set<sets||position<exercises.length-1){
    const nextCard=set<sets?card:exercises[position+1][0];
    queue.push({label:'พักก่อนเซตถัดไป',duration:60,card:nextCard});
   }
  }
 });
 return queue;
}

function render(){
 const stage=stages[index];
 const card=stage.card?el(stage.card):null;
 const name=card?card.querySelector('h3').textContent:stage.name;
 const exercisePanel=el('kb-image').parentElement;
 exercisePanel.hidden=!card||completed;
 if(card&&card!==displayedCard){
  displayedCard=card;
  const image=card.querySelector('img').cloneNode(true);
  image.loading='eager';
  image.style.display='';
  el('kb-image').replaceChildren(image);
  el('kb-image-name').textContent=name;
  el('kb-instructions').replaceChildren(card.querySelector('.steps').cloneNode(true));
 }
 el('kb-image-label').textContent=stage.work?'ท่าปัจจุบัน':'ท่าถัดไป';
 el('kb-phase').textContent=completed?'ฝึกครบแล้ว':stage.label;
 el('kb-move').textContent=completed?'จบโปรแกรมแล้ว':name+(stage.side?' · '+stage.side:'');
 const seconds=Math.ceil(remaining);
 const minutes=Math.floor(seconds/60);
 el('kb-time').textContent=completed?'✓':minutes?minutes+':'+String(seconds%60).padStart(2,'0'):String(seconds);
 el('kb-stage').textContent=completed
  ?workout==='walk'?'เดินครบตามโปรแกรม':'คูลดาวน์ '+(workout==='tabata'?'5':'3–5')+' นาที'
  :stage.detail||(index===0&&workout!=='walk'?'วอร์มอัป 5 นาทีก่อนกดเริ่ม':'');
 el('kb-status').textContent=pauseReason;
 el('kb-status').hidden=!pauseReason;
 el('kb-progress').style.width=(completed?100:100*(1-remaining/stage.duration))+'%';
 controls.start.disabled=running||completed;
 controls.pause.disabled=!running;
 controls.rounds.disabled=running;
 controls.start.textContent=index||remaining<stages[0].duration?'▶ ทำต่อ':'▶ เริ่ม';
}

function beep(frequency,duration){
 if(!audio)return;
 try{
  const oscillator=audio.createOscillator(),gain=audio.createGain();
  oscillator.frequency.value=frequency;
  gain.gain.value=.06;
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime+duration);
 }catch(e){}
}

function tick(){
 const now=performance.now();
 const previous=index;
 while(now>=deadline){
  if(index===stages.length-1){
   completed=true;
   remaining=0;
   running=false;
   clearInterval(interval);
   interval=null;
   beep(1040,.5);
   render();
   return;
  }
  index++;
  deadline+=stages[index].duration*1000;
 }
 remaining=(deadline-now)/1000;
 const second=Math.ceil(remaining);
 if(index!==previous)beep(stages[index].work||workout==='walk'?880:520,.25);
 else if(second<=3&&second!==lastSecond)beep(700,.1);
 lastSecond=second;
 render();
}

function start(){
 if(running||completed)return;
 try{
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(Audio){
   audio=audio||new Audio();
   if(audio.state==='suspended')audio.resume().catch(()=>{});
  }
 }catch(e){}
 running=true;
 pauseReason='';
 lastSecond=Math.ceil(remaining);
 deadline=performance.now()+remaining*1000;
 interval=setInterval(tick,100);
 render();
}

function pause(reason){
 if(!running)return;
 remaining=Math.max(0,(deadline-performance.now())/1000);
 running=false;
 pauseReason=reason;
 clearInterval(interval);
 interval=null;
 render();
}

function reset(){
 clearInterval(interval);
 interval=null;
 stages=buildStages();
 index=0;
 remaining=stages[0].duration;
 running=false;
 completed=false;
 pauseReason='';
 render();
}

document.addEventListener('guide-workout',event=>{
 if(workout===event.detail)return;
 workout=event.detail;
 el('guide-round-options').hidden=workout!=='tabata';
 reset();
});
controls.start.addEventListener('click',start);
controls.pause.addEventListener('click',()=>pause('หยุดชั่วคราว'));
controls.reset.addEventListener('click',reset);
controls.rounds.addEventListener('change',()=>{
 if(!completed&&(index||remaining<stages[0].duration)&&!window.confirm('เปลี่ยนจำนวนรอบและเริ่มจับเวลาใหม่หรือไม่?')){
  controls.rounds.value=stages.filter(stage=>stage.label==='พักระหว่างรอบ').length+1;
  return;
 }
 reset();
});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden)pause('หยุดชั่วคราวเมื่อสลับหน้า · กดทำต่อเพื่อฝึกต่อ');
});
window.addEventListener('beforeunload',event=>{
 if(running){event.preventDefault();event.returnValue='';}
});
})();
