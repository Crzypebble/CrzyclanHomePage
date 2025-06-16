const audio = document.getElementById('audio');
const playPauseBtn = document.getElementById('play-pause');
const nextTrackBtn = document.getElementById('next-track');
const prevTrackBtn = document.getElementById('prev-track');
const stopAllBtn = document.getElementById('stop-all');
const volumeControl = document.getElementById('volume-control');
const queueList = document.getElementById('track-queue');
const clearQueueBtn = document.getElementById('clear-queue');
const shuffleToggle = document.getElementById('shuffle-toggle');
const shuffleModeLabel = document.getElementById('shuffle-mode-label');
const trackNameDisplay = document.getElementById('current-track-name');
const visualizerToggle = document.getElementById('toggle-visualizer');
const visualizer = document.getElementById('visualizer');
const listenCountDisplay = document.getElementById('listen-count');

let trackQueue = [];
let currentTrackIndex = 0;
let shuffleMode = 'off'; // 'off', 'album', 'all'
let visualizerActive = false;
let listenData = {}; // { filename: { count: total, users: Set([...]) } }

const currentUser = getCurrentUser(); // Assumes Firebase Auth setup

function getCurrentUser() {
  return firebase.auth().currentUser?.uid || null;
}

function updateListenCountDisplay(track) {
  const data = listenData[track] || { count: 0 };
  listenCountDisplay.textContent = `Listens: ${data.count}`;
}

function incrementListen(track) {
  if (!currentUser) return;

  listenData[track] = listenData[track] || { count: 0, users: new Set() };

  if (!listenData[track].users.has(currentUser)) {
    listenData[track].users.add(currentUser);
    listenData[track].count += 1;
    updateListenCountDisplay(track);
  }
}

function playTrack(fileName) {
  const path = fileName.trim();
  const existingIndex = trackQueue.indexOf(path);
  if (existingIndex === -1) {
    trackQueue.push(path);
    renderQueue();
  }
  currentTrackIndex = trackQueue.indexOf(path);
  loadAndPlay(path);
}

function loadAndPlay(path) {
  audio.src = path;
  audio.play();
  trackNameDisplay.textContent = path;
  updateListenCountDisplay(path);
}

function renderQueue() {
  queueList.innerHTML = '';
  trackQueue.forEach((track, index) => {
    const li = document.createElement('li');
    li.textContent = track;
    if (index === currentTrackIndex) li.classList.add('current');
    li.onclick = () => {
      currentTrackIndex = index;
      loadAndPlay(trackQueue[currentTrackIndex]);
    };
    queueList.appendChild(li);
  });
}

playPauseBtn.addEventListener('click', () => {
  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
});

nextTrackBtn.addEventListener('click', () => {
  nextTrack();
});

prevTrackBtn.addEventListener('click', () => {
  currentTrackIndex = Math.max(currentTrackIndex - 1, 0);
  loadAndPlay(trackQueue[currentTrackIndex]);
});

volumeControl.addEventListener('input', () => {
  audio.volume = volumeControl.value;
});

clearQueueBtn.addEventListener('click', () => {
  trackQueue = [];
  currentTrackIndex = 0;
  renderQueue();
  audio.pause();
  audio.src = '';
  trackNameDisplay.textContent = 'No Track';
  updateListenCountDisplay('');
});

stopAllBtn.addEventListener('click', () => {
  audio.pause();
  audio.currentTime = 0;
});

shuffleToggle.addEventListener('click', () => {
  if (shuffleMode === 'off') shuffleMode = 'album';
  else if (shuffleMode === 'album') shuffleMode = 'all';
  else shuffleMode = 'off';
  shuffleModeLabel.textContent = `Shuffle: ${shuffleMode}`;
});

visualizerToggle.addEventListener('click', () => {
  visualizerActive = !visualizerActive;
  visualizer.style.display = visualizerActive ? 'block' : 'none';
});

audio.addEventListener('ended', () => {
  nextTrack();
});

audio.addEventListener('play', () => {
  incrementListen(audio.src.split('/').pop());
  if (visualizerActive) {
    startVisualizer();
  }
});

function nextTrack() {
  if (shuffleMode === 'album' || shuffleMode === 'all') {
    const available = [...trackQueue];
    const next = available[Math.floor(Math.random() * available.length)];
    currentTrackIndex = trackQueue.indexOf(next);
    loadAndPlay(next);
  } else {
    currentTrackIndex++;
    if (currentTrackIndex >= trackQueue.length) {
      currentTrackIndex = 0;
    }
    loadAndPlay(trackQueue[currentTrackIndex]);
  }
}

function startVisualizer() {
  const canvas = document.createElement('canvas');
  canvas.width = visualizer.offsetWidth;
  canvas.height = visualizer.offsetHeight;
  visualizer.innerHTML = '';
  visualizer.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const src = audioCtx.createMediaElementSource(audio);
  const analyser = audioCtx.createAnalyser();
  src.connect(analyser);
  analyser.connect(audioCtx.destination);
  analyser.fftSize = 256;

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    if (!visualizerActive) return;
    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i];
      const hue = (i * 360) / bufferLength;
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  }

  draw();
}
