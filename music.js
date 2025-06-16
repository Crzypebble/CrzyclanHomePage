const audio = document.getElementById('audio');
const playPauseBtn = document.getElementById('play-pause');
const stopBtn = document.getElementById('stop-all');
const prevBtn = document.getElementById('prev-track');
const nextBtn = document.getElementById('next-track');
const volumeControl = document.getElementById('volume-control');
const shuffleToggle = document.getElementById('shuffle-toggle');
const shuffleLabel = document.getElementById('shuffle-mode-label');
const clearQueueBtn = document.getElementById('clear-queue');
const queueList = document.getElementById('track-queue');
const currentTrackName = document.getElementById('current-track-name');
const currentTrackInfo = document.getElementById('current-track-info');

let queue = [];
let currentIndex = -1;
let shuffleMode = 'off'; // can be 'off', 'album', 'all'

// Play a track and add to queue if not already in it
function playTrack(file, element) {
  const trackTitle = element.textContent;

  const track = {
    file,
    title: trackTitle
  };

  const existingIndex = queue.findIndex(t => t.file === file);
  if (existingIndex === -1) {
    queue.push(track);
    updateQueueUI();
    currentIndex = queue.length - 1;
  } else {
    currentIndex = existingIndex;
  }

  playCurrent();
}

function playCurrent() {
  if (currentIndex < 0 || currentIndex >= queue.length) return;

  const track = queue[currentIndex];
  audio.src = track.file;
  audio.play();

  currentTrackName.textContent = track.title;
  currentTrackInfo.textContent = track.file;

  playPauseBtn.textContent = '⏸️';
}

playPauseBtn.addEventListener('click', () => {
  if (!audio.src) return;

  if (audio.paused) {
    audio.play();
    playPauseBtn.textContent = '⏸️';
  } else {
    audio.pause();
    playPauseBtn.textContent = '▶️';
  }
});

stopBtn.addEventListener('click', () => {
  audio.pause();
  audio.currentTime = 0;
  playPauseBtn.textContent = '▶️';
});

volumeControl.addEventListener('input', () => {
  audio.volume = volumeControl.value;
});

nextBtn.addEventListener('click', () => {
  if (shuffleMode !== 'off') {
    currentIndex = Math.floor(Math.random() * queue.length);
  } else {
    currentIndex = (currentIndex + 1) % queue.length;
  }
  playCurrent();
});

prevBtn.addEventListener('click', () => {
  if (shuffleMode !== 'off') {
    currentIndex = Math.floor(Math.random() * queue.length);
  } else {
    currentIndex = (currentIndex - 1 + queue.length) % queue.length;
  }
  playCurrent();
});

shuffleToggle.addEventListener('click', () => {
  if (shuffleMode === 'off') {
    shuffleMode = 'all';
    shuffleLabel.textContent = 'Shuffle: All';
  } else {
    shuffleMode = 'off';
    shuffleLabel.textContent = 'Off';
  }
});

clearQueueBtn.addEventListener('click', () => {
  queue = [];
  currentIndex = -1;
  audio.pause();
  audio.currentTime = 0;
  currentTrackName.textContent = 'None';
  currentTrackInfo.textContent = '—';
  playPauseBtn.textContent = '▶️';
  updateQueueUI();
});

function updateQueueUI() {
  queueList.innerHTML = '';
  queue.forEach((track, i) => {
    const li = document.createElement('li');
    li.textContent = track.title;
    li.classList.toggle('active-track', i === currentIndex);
    li.addEventListener('click', () => {
      currentIndex = i;
      playCurrent();
    });
    queueList.appendChild(li);
  });
}

// Optional: Autoplay next track when current one ends
audio.addEventListener('ended', () => {
  if (queue.length > 0) {
    if (shuffleMode === 'off') {
      currentIndex = (currentIndex + 1) % queue.length;
    } else {
      currentIndex = Math.floor(Math.random() * queue.length);
    }
    playCurrent();
  }
});
