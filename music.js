const audio = document.getElementById('audio');
const player = document.getElementById('audio-player');
const toggleBtn = document.getElementById('toggle-player');
const trackNameEl = document.getElementById('current-track-name');
const queueList = document.getElementById('track-queue');

const volumeControl = document.getElementById('volume-control');
const prevBtn = document.getElementById('prev-track');
const playPauseBtn = document.getElementById('play-pause');
const nextBtn = document.getElementById('next-track');
const repeatBtn = document.getElementById('repeat-toggle');
const shuffleBtn = document.getElementById('shuffle-toggle');

let queue = [], idx = -1, repeat = false, shuffleMode = 0;

// Toggle minimize
toggleBtn.onclick = () => player.classList.toggle('collapsed');

// Controls
playPauseBtn.onclick = () => audio.paused ? audio.play() : audio.pause();
prevBtn.onclick = () => { if(idx>0) playAt(idx-1); };
nextBtn.onclick = () => next();
repeatBtn.onclick = () => repeat = !repeat;
shuffleBtn.onclick = () => shuffleMode = (shuffleMode + 1) % 3;
volumeControl.oninput = () => audio.volume = volumeControl.value;

audio.onended = () => repeat ? audio.play() : next();

// Clickable tracks & like/dislike
document.querySelectorAll('[data-filename]').forEach(el => {
  const fn = el.getAttribute('data-filename');
  const wrapper = document.createElement('div');
  wrapper.classList.add('track-wrapper');
  el.parentNode.insertBefore(wrapper, el);
  wrapper.appendChild(el);
  ['➕','👍','👎'].forEach(sym => {
    const b = document.createElement('button');
    b.textContent = sym;
    b.classList.add('small-btn');
    wrapper.appendChild(b);
    if(sym==='➕') b.onclick = () => enqueue(fn);
    if(sym==='👍') b.onclick = () => doReact(fn, 'like');
    if(sym==='👎') b.onclick = () => doReact(fn, 'dislike');
  });
  el.onclick = () => playAndEnqueue(fn);
});

function playAndEnqueue(fn){
  const pos = queue.indexOf(fn);
  if (pos === -1) queue.push(fn), idx = queue.length-1;
  else idx = pos;
  playAt(idx);
}

function enqueue(fn){
  if(!queue.includes(fn)){
    queue.push(fn);
    renderQueue();
  }
}

function playAt(i){
  idx = i;
  audio.src = queue[idx];
  trackNameEl.textContent = queue[idx];
  audio.play();
  renderQueue();
}

function next(){
  if(shuffleMode>0 && queue.length>1){
    idx = Math.floor(Math.random()*queue.length);
  } else {
    idx = (idx+1)%queue.length;
  }
  playAt(idx);
}

function renderQueue(){
  queueList.innerHTML = '';
  queue.forEach((fn,i)=> {
    const li = document.createElement('li');
    li.textContent = fn;
    if(i===idx) li.style.color='red';
    queueList.appendChild(li);
  });
}

// Placeholder: needs Firebase storage
function doReact(fn, type){
  if(!firebase.auth().currentUser){
    return alert("Login to " + type);
  }
  alert(type + "d: " + fn);
}
