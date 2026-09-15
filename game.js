'use strict';
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const $ = id => document.getElementById(id);
const W = 480, H = 640, ground = 575;
let best = 0;
try { best = Number(localStorage.getItem('floffy-best')) || 0; } catch {}
$('best').textContent = String(best).padStart(2, '0');
let state = 'ready', bird, pipes, score, elapsed, spawn, last = 0, scenery = 0;
let sound = false, audio;
const birdColors = {
  yellow: {name:'노랑',body:'#f1c65b',belly:'#ffe197',wing:'#deac43',tail:'#d7a943'},
  pink: {name:'분홍',body:'#ec91b1',belly:'#ffd0e1',wing:'#cf6e94',tail:'#bf5e85'},
  blue: {name:'하늘',body:'#78b7ec',belly:'#c6e6ff',wing:'#5092cf',tail:'#447fb8'},
  purple: {name:'보라',body:'#b29ae3',belly:'#e2d5ff',wing:'#9173c5',tail:'#8062b3'},
  mint: {name:'민트',body:'#70c9ab',belly:'#bef0dc',wing:'#47a98b',tail:'#388e75'}
};
let birdColor = 'yellow';
try {
  const saved = localStorage.getItem('floffy-color');
  if(Object.hasOwn(birdColors, saved)) birdColor = saved;
} catch {}
function selectBirdColor(color) {
  if(!Object.hasOwn(birdColors,color)) return;
  birdColor = color;
  $('color-name').textContent = birdColors[color].name;
  document.querySelectorAll('[data-color]').forEach(button=>{
    const selected = button.dataset.color === color;
    button.setAttribute('aria-pressed',String(selected));
    button.textContent = selected ? '✓' : '';
  });
  try { localStorage.setItem('floffy-color',color); } catch {}
}
document.querySelectorAll('[data-color]').forEach(button=>{
  button.addEventListener('click',()=>{
    if(state === 'playing') pause();
    selectBirdColor(button.dataset.color);
  });
});
selectBirdColor(birdColor);
function tone(freq, duration = .08) {
  if (!sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    const osc = audio.createOscillator(), gain = audio.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(freq, audio.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * .6, audio.currentTime + duration);
    gain.gain.setValueAtTime(.055, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
    osc.connect(gain); gain.connect(audio.destination); osc.start(); osc.stop(audio.currentTime + duration);
  } catch {}
}
function reset() { bird = {x:126,y:250,v:0}; pipes=[]; score=0; elapsed=0; spawn=1.5; $('score').textContent='00'; }
function flap() {
  if(state === 'paused') return;
  if(state !== 'playing') { reset(); state='playing'; $('overlay').classList.add('hidden'); }
  bird.v = -335; tone(660);
}
function pause() {
  if(state === 'playing') {
    state='paused'; show('TAKE A BREATHER', '잠깐 쉬어가기', '준비되면 다시 날아볼까요?', '계속하기');
  } else if(state === 'paused') { state='playing'; $('overlay').classList.add('hidden'); }
  $('pause').textContent=state==='paused'?'▶':'Ⅱ';
  $('pause').setAttribute('aria-label',state==='paused'?'계속하기':'일시정지');
}
function show(badge,title,message,button) {
  $('badge').textContent=badge; $('title').textContent=title; $('message').textContent=message;
  $('play').innerHTML=button+' <span>↗</span>'; $('overlay').classList.remove('hidden');
  $('hint').textContent=state==='paused'?'P 키 또는 계속하기 버튼':'스페이스바 또는 화면을 눌러 다시 시작';
}
function die() {
  state='over'; tone(140,.25);
  const record = score>best;
  if(record) {best=score; try{localStorage.setItem('floffy-best',String(best));}catch{} }
  $('best').textContent=String(best).padStart(2,'0');
  show(record?'NEW PERSONAL BEST!':'ONE MORE FLIGHT?',record?'최고 기록 달성!':'잘 날았어요!',`이번 비행 ${score}점 · 최고 기록 ${best}점`,'다시 도전하기');
}
function update(dt) {
  if(state!=='paused') scenery+=dt;
  if(state!=='playing') return;
  elapsed+=dt; spawn-=dt; bird.v+=960*dt; bird.y+=bird.v*dt;
  const speed = 155 + Math.min(score*3,65);
  if(spawn<=0) {
    const gap=174-Math.min(score*1.3,26), top=105+Math.random()*(ground-gap-190);
    pipes.push({x:W+10,top,bottom:top+gap,passed:false}); spawn=1.65;
  }
  for(const p of pipes) {
    p.x-=speed*dt;
    const nearX=Math.max(p.x-5,Math.min(bird.x,p.x+69));
    for(const [y1,y2] of [[0,p.top],[p.bottom,ground]]) {
      const nearY=Math.max(y1,Math.min(bird.y,y2));
      if((bird.x-nearX)**2+(bird.y-nearY)**2<14**2) {die();return;}
    }
    if(!p.passed && p.x+69<bird.x-14) {p.passed=true;score++;$('score').textContent=String(score).padStart(2,'0');tone(940,.13);}
  }
  pipes=pipes.filter(p=>p.x>-90);
  if(bird.y+14>=ground || bird.y-14<=0) die();
}
function ellipse(x,y,rx,ry,color) {ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function cloud(x,y,s) {ellipse(x,y,31*s,12*s,'#f5faeaaa');ellipse(x-17*s,y+2*s,22*s,10*s,'#f5faeaaa');ellipse(x+11*s,y-7*s,19*s,16*s,'#f5faeaaa');}
function draw() {
  const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#c5e8df');sky.addColorStop(1,'#f0f2c7');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  ellipse(371,131,40,40,'#fbf6bf');ellipse(371,131,52,52,'#fbf6bf22');
  for(let i=0;i<5;i++) cloud(((i*139-scenery*(7+i%2*4))%680+680)%680-80,106+(i%3)*87,.7+(i%2)*.35);
  ctx.fillStyle='#c1dba8';ctx.beginPath();ctx.moveTo(0,ground);ctx.bezierCurveTo(60,400,140,475,215,520);ctx.bezierCurveTo(310,388,424,460,480,500);ctx.lineTo(480,ground);ctx.fill();
  ctx.fillStyle='#adc99b';ctx.beginPath();ctx.moveTo(0,ground);ctx.bezierCurveTo(95,489,169,520,255,545);ctx.bezierCurveTo(347,470,410,497,480,548);ctx.lineTo(480,ground);ctx.fill();
  for(const p of pipes) {
    for(const [y,h] of [[-10,p.top+10],[p.bottom,ground-p.bottom]]) {
      ctx.fillStyle='#779b65';ctx.fillRect(p.x,y,64,h);ctx.fillStyle='#9cbd7b';ctx.fillRect(p.x+4,y,12,h);ctx.fillStyle='#658857';ctx.fillRect(p.x+55,y,9,h);
      const cap=y===-10?p.top-23:p.bottom;ctx.fillStyle='#52764a';ctx.fillRect(p.x-5,cap,74,24);ctx.fillStyle='#9ab976';ctx.fillRect(p.x-3,cap+2,70,17);ctx.fillStyle='#b5cd8e';ctx.fillRect(p.x,cap+3,64,4);
    }
  }
  ctx.fillStyle='#90af6d';ctx.fillRect(0,ground,W,6);ctx.fillStyle='#dce1b2';ctx.fillRect(0,ground+6,W,59);ctx.fillStyle='#c2cd94';
  for(let i=0;i<26;i++)ctx.fillRect((i*24-scenery*35%24),ground+7,12,3);
  ctx.fillStyle='#83946d';ctx.font='9px sans-serif';ctx.textAlign='center';ctx.fillText('F L O F F Y  B U D D Y',240,615);
  const idle=state==='ready', by=idle?220+Math.sin(scenery*3)*7:bird.y;
  ctx.save();ctx.translate(bird.x,by);ctx.rotate(state==='playing'?Math.max(-.35,Math.min(1.1,bird.v/650)):0);
  ellipse(-3,4,22,20,'#b6a44b33');
  const colors = birdColors[birdColor];
  ctx.fillStyle=colors.tail;ctx.beginPath();ctx.moveTo(-17,-2);ctx.lineTo(-30,-12);ctx.lineTo(-26,7);ctx.closePath();ctx.fill();
  ellipse(0,0,22,19,colors.body);ellipse(5,5,15,12,colors.belly);
  ellipse(-10,5+Math.sin(scenery*20)*3,11,7,colors.wing);
  ellipse(10,-6,7,8,'#fffbed');ellipse(12,-6,3,4,'#274834');ellipse(13,-7,1,1,'white');
  ctx.fillStyle='#e5894b';ctx.beginPath();ctx.moveTo(20,-1);ctx.lineTo(31,3);ctx.lineTo(20,7);ctx.closePath();ctx.fill();
  ellipse(12,6,4,2.5,'#efab65');ctx.restore();
}
function loop(now) {
  let remaining=Math.min((now-last)/1000 || 0,.05);last=now;
  while(remaining>0){const dt=Math.min(remaining,1/120);update(dt);remaining-=dt;}
  draw();requestAnimationFrame(loop);
}
canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.focus();flap();});
$('overlay').addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;if(state!=='paused')flap();});
$('play').addEventListener('click',()=>{if(state==='paused')pause();else flap();canvas.focus();});
$('pause').addEventListener('click',pause);
$('sound').addEventListener('click',()=>{sound=!sound;$('sound').textContent=sound?'소리 ON':'소리 OFF';$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'소리 끄기':'소리 켜기');tone(700);});
document.addEventListener('keydown',e=>{
  if(e.target.closest('button,a'))return;
  if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();if(!e.repeat)flap();}
  if(e.code==='KeyP'&&!e.repeat)pause();
  if(e.code==='KeyR'&&!e.repeat){reset();state='ready';$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','일시정지');flap();}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pause();});
window.addEventListener('blur',()=>{if(state==='playing')pause();});
reset();requestAnimationFrame(loop);
