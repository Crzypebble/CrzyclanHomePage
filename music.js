const audio = document.getElementById("audio");
const currentTrackName = document.getElementById("current-track-name");
const trackQueue = document.getElementById("track-queue");
const playPauseBtn = document.getElementById("play-pause");
const prevBtn = document.getElementById("prev-track");
const nextBtn = document.getElementById("next-track");
const repeatBtn = document.getElementById("repeat-toggle");
const shuffleBtn = document.getElementById("shuffle-toggle");
const volumeControl = document.getElementById("volume-control");
const togglePlayerBtn = document.getElementById("toggle-player");

let queue = [];
let currentIndex = 0;
let isPlaying = false;
let isRepeat = false;
let isShuffle = false;

function playTrack(src, element = null) {
  const title = element?.dataset?.title || src;
  queue.push({ src, title });
  if (!isPlaying) {
    currentIndex = queue.length - 1;
    loadTrack(currentIndex);
    audio.play();
  }
  updateQueueUI();
}

function loadTrack(index) {
  const track = queue[index];
  if (!track) return;
  audio.src = track.src;
  currentTrackName.textContent = track.title || track.src;
  isPlaying = true;
  audio.play();
}

audio.addEventListener("ended", () => {
  if (isRepeat) {
    loadTrack(currentIndex);
  } else {
    nextTrack();
  }
});

function nextTrack() {
  if (isShuffle) {
    currentIndex = Math.floor(Math.random() * queue.length);
  } else {
    currentIndex = (currentIndex + 1) % queue.length;
  }
  loadTrack(currentIndex);
}

function prevTrack() {
  currentIndex = currentIndex > 0 ? currentIndex - 1 : 0;
  loadTrack(currentIndex);
}

function updateQueueUI() {
  trackQueue.innerHTML = "";
  queue.forEach((track, idx) => {
    const li = document.createElement("li");
    li.textContent = track.title;
    li.onclick = () => {
      currentIndex = idx;
      loadTrack(idx);
    };
    trackQueue.appendChild(li);
  });
}

playPauseBtn.onclick = () => {
  if (audio.paused) {
    audio.play();
    playPauseBtn.textContent = "⏸️";
  } else {
    audio.pause();
    playPauseBtn.textContent = "▶️";
  }
};

nextBtn.onclick = nextTrack;
prevBtn.onclick = prevTrack;

repeatBtn.onclick = () => {
  isRepeat = !isRepeat;
  repeatBtn.style.color = isRepeat ? "red" : "";
};

shuffleBtn.onclick = () => {
  isShuffle = !isShuffle;
  shuffleBtn.style.color = isShuffle ? "red" : "";
};

volumeControl.oninput = () => {
  audio.volume = volumeControl.value;
};

togglePlayerBtn.onclick = () => {
  const player = document.getElementById("audio-player");
  player.classList.toggle("minimized");
  togglePlayerBtn.textContent = player.classList.contains("minimized") ? "🔼" : "🔽";
};

// Optional: Detect signed-in user from Firebase to enable likes/dislikes
