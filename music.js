const audio = document.getElementById('audio');
const trackNameEl = document.getElementById('current-track-name');
const queueList = document.getElementById('track-queue');
let trackQueue = [];
let currentTrackIndex = 0;
let repeat = false;
let shuffleMode = 0; // 0 = no shuffle, 1 = shuffle album, 2 = shuffle all

// Collect all tracks
document.querySelectorAll('.album-tracks li').forEach(li => {
  li.classList.add('clickable-track');
  li.addEventListener('click', () => {
    const songTitle = li.textContent.trim();
    const mp3Name = guessFilenameFromTitle(songTitle);
    playTrack(songTitle, mp3Name);
    addToQueue(songTitle, mp3Name);
  });
});

function guessFilenameFromTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    + '.mp3';
}

function playTrack(displayName, fileName) {
  audio.src = fileName;
  trackNameEl.textContent = displayName;
  audio.play();
}

function addToQueue(displayName, fileName) {
  trackQueue.push({ displayName, fileName });
  renderQueue();
}

function renderQueue() {
  queueList.innerHTML = '';
  trackQueue.forEach((track, index) => {
    const li = document.createElement('li');
    li.textContent = track.displayName;
    if (index === currentTrackIndex) li.style.color = 'red';
    queueList.appendChild(li);
  });
}

document.getElementById('play-pause').addEventListener('click', () => {
  if (audio.paused) audio.play();
  else audio.pause();
});

document.getElementById('next-track').addEventListener('click', () => {
  playNextTrack();
});

document.getElementById('prev-track').addEventListener('click', () => {
  if (currentTrackIndex > 0) {
    currentTrackIndex--;
    let track = trackQueue[currentTrackIndex];
    playTrack(track.displayName, track.fileName);
  }
});

document.getElementById('repeat-toggle').addEventListener('click', () => {
  repeat = !repeat;
  alert("Repeat " + (repeat ? "ON" : "OFF"));
});

document.getElementById('shuffle-toggle').addEventListener('click', () => {
  shuffleMode = (shuffleMode + 1) % 3;
  if (shuffleMode === 1) alert("Shuffle: Album Only");
  else if (shuffleMode === 2) alert("Shuffle: All Tracks");
  else alert("Shuffle: OFF");
});

audio.addEventListener('ended', () => {
  if (repeat) {
    audio.currentTime = 0;
    audio.play();
  } else {
    playNextTrack();
  }
});

document.getElementById('volume-control').addEventListener('input', (e) => {
  audio.volume = e.target.value;
});

function playNextTrack() {
  if (shuffleMode > 0) {
    currentTrackIndex = Math.floor(Math.random() * trackQueue.length);
  } else {
    currentTrackIndex = (currentTrackIndex + 1) % trackQueue.length;
  }
  const next = trackQueue[currentTrackIndex];
  playTrack(next.displayName, next.fileName);
}
