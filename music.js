// Setup audio player and UI controls
const audio = document.getElementById('audio');
const player = document.getElementById('audio-player');
const toggleBtn = document.getElementById('toggle-player');
const currentTrackName = document.getElementById('current-track-name');

const prevBtn = document.getElementById('prev-track');
const playPauseBtn = document.getElementById('play-pause');
const nextBtn = document.getElementById('next-track');
const repeatBtn = document.getElementById('repeat-toggle');
const shuffleBtn = document.getElementById('shuffle-toggle');
const volumeCtrl = document.getElementById('volume-control');

const trackQueueEl = document.getElementById('track-queue');
let trackQueue = [];
let currentIndex = -1;
let repeat = false, shuffleMode = 0;

// Minimize/maximize behavior
toggleBtn.addEventListener('click', () => {
  player.classList.toggle('collapsed');
  toggleBtn.textContent = player.classList.contains('collapsed') ? '🔼' : '🔽';
});

// Generic playback controls
playPauseBtn.addEventListener('click', () => audio.paused ? audio.play() : audio.pause());
prevBtn.addEventListener('click', () => currentIndex > 0 && playTrackAt(currentIndex - 1));
nextBtn.addEventListener('click', () => playNext());
repeatBtn.addEventListener('click', () => repeat = !repeat);
shuffleBtn.addEventListener('click', () => shuffleMode = (shuffleMode + 1) % 3);

// Volume
volumeCtrl.addEventListener('input', () => audio.volume = volumeCtrl.value);

// Auto-play next or repeat
audio.addEventListener('ended', () => {
  repeat ? (audio.currentTime = 0, audio.play()) : playNext();
});

// Clickable tracks in HTML
document.querySelectorAll('.album-tracks li, .track-card, .track-list li')
  .forEach(el => {
    wrapTrackElement(el);
});

// Set up like/dislike buttons in the player only
document.getElementById('like-track').addEventListener('click', () => {
  if (!firebase.auth().currentUser) return alert('Please log in');
  alert('Liked ' + audio.src);
});

document.getElementById('dislike-track').addEventListener('click', () => {
  if (!firebase.auth().currentUser) return alert('Please log in');
  alert('Disliked ' + audio.src);
});

// Setup for queue button only in track bars
function wrapTrackElement(el) {
  const filename = el.getAttribute('onclick')?.match(/'(.+\.mp3)'/)?.[1];
  if (!filename) return;

  const container = document.createElement('div');
  container.classList.add('track-wrapper');
  el.replaceWith(container);
  container.appendChild(el);

  const queueBtn = document.createElement('button');
  queueBtn.textContent = '➕';
  queueBtn.classList.add('queue-btn');
  container.appendChild(queueBtn);

  el.addEventListener('click', () => enqueueAndPlay(filename));
  queueBtn.addEventListener('click', () => enqueueTrack(filename));
}

// Core logic
function enqueueAndPlay(fn) {
  enqueueTrack(fn, true);
}

function enqueueTrack(fn, play = false) {
  if (!trackQueue.includes(fn)) trackQueue.push(fn);
  if (play) playTrackAt(trackQueue.length - 1);
}

function playTrackAt(idx) {
  currentIndex = idx;
  const fn = trackQueue[idx];
  audio.src = fn;
  currentTrackName.textContent = fn;
  audio.play();
}

function playNext() {
  if (shuffleMode) {
    currentIndex = Math.floor(Math.random() * trackQueue.length);
  } else {
    currentIndex = (currentIndex + 1) % trackQueue.length;
  }
  playTrackAt(currentIndex);
}
