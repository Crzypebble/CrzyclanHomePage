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
prevBtn.onclick = () => { if (idx > 0) playAt(idx - 1); };
nextBtn.onclick = () => next();
repeatBtn.onclick = () => repeat = !repeat;
shuffleBtn.onclick = () => shuffleMode = (shuffleMode + 1) % 3;
volumeControl.oninput = () => audio.volume = volumeControl.value;

audio.onended = () => repeat ? audio.play() : next();

// Setup tracks and buttons
document.querySelectorAll('[data-filename]').forEach(el => {
  const fn = el.getAttribute('data-filename');

  // Skip if already processed
  if (el.classList.contains('has-controls')) return;
  el.classList.add('has-controls');

  // Create action buttons
  const controls = document.createElement('div');
  controls.className = 'track-actions';

  const queueBtn = document.createElement('button');
  queueBtn.textContent = '➕';
  queueBtn.onclick = (e) => {
    e.stopPropagation();
    enqueue(fn);
  };

  const likeBtn = document.createElement('button');
  likeBtn.textContent = '👍';
  likeBtn.onclick = (e) => {
    e.stopPropagation();
    doReact(fn, 'like');
  };

  const dislikeBtn = document.createElement('button');
  dislikeBtn.textContent = '👎';
  dislikeBtn.onclick = (e) => {
    e.stopPropagation();
    doReact(fn, 'dislike');
  };

  controls.appendChild(queueBtn);
  controls.appendChild(likeBtn);
  controls.appendChild(dislikeBtn);
  el.appendChild(controls);

  el.onclick = () => playAndEnqueue(fn);
});

// Play and enqueue logic
function playAndEnqueue(fn) {
  const pos = queue.indexOf(fn);
  if (pos === -1) {
    queue.push(fn);
    idx = queue.length - 1;
  } else {
    idx = pos;
  }
  playAt(idx);
}

// Add to queue
function enqueue(fn) {
  if (!queue.includes(fn)) {
    queue.push(fn);
    renderQueue();
  }
}

// Play track at index
function playAt(i) {
  idx = i;
  audio.src = queue[idx]; // Ensure the path is correct if in subfolder, e.g., `audio.src = 'music/' + queue[idx];`
  trackNameEl.textContent = queue[idx].replace(/^.*[\\/]/, '').replace('.mp3', '');
  audio.play();
  renderQueue();
}

// Play next track
function next() {
  if (shuffleMode > 0 && queue.length > 1) {
    let newIdx;
    do {
      newIdx = Math.floor(Math.random() * queue.length);
    } while (newIdx === idx);
    idx = newIdx;
  } else {
    idx = (idx + 1) % queue.length;
  }
  playAt(idx);
}

// Render the queue UI
function renderQueue() {
  queueList.innerHTML = '';
  queue.forEach((fn, i) => {
    const li = document.createElement('li');
    li.textContent = fn.replace(/^.*[\\/]/, '').replace('.mp3', '');
    if (i === idx) li.style.color = 'red';
    queueList.appendChild(li);
  });
}

// React with like/dislike (requires Firebase)
function doReact(fn, type) {
  if (!firebase.auth().currentUser) {
    return alert("Login to " + type);
  }
  alert(type + "d: " + fn);
}
