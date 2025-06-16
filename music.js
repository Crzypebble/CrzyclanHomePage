let audio = document.getElementById("audio");
let trackQueue = [];
let currentTrackIndex = -1;
let isPlaying = false;
let shuffleMode = "off"; // off, album, all
let visualizerEnabled = false;
let visualizer, canvasCtx;
let listenCounts = {}; // Store total listens
let userId = localStorage.getItem("userId") || crypto.randomUUID();
localStorage.setItem("userId", userId);

// Setup
const currentTrackName = document.getElementById("current-track-name");
const listenCountSpan = document.getElementById("listen-count");
const volumeControl = document.getElementById("volume-control");
const queueList = document.getElementById("track-queue");

// Basic Firebase listen logic (mocked without actual DB)
function updateListen(track) {
  if (!listenCounts[track]) {
    listenCounts[track] = { total: 0, users: new Set() };
  }
  if (!listenCounts[track].users.has(userId)) {
    listenCounts[track].users.add(userId);
    listenCounts[track].total++;
  }
  listenCountSpan.textContent = listenCounts[track].total;
}

// Toggle audio player sidebar
document.getElementById("toggle-player").onclick = () => {
  document.getElementById("audio-player").classList.toggle("collapsed");
};

// Prevent download by not including links

// Toggle shuffle mode
document.getElementById("shuffle-toggle").onclick = () => {
  shuffleMode = shuffleMode === "off" ? "album" : shuffleMode === "album" ? "all" : "off";
  document.getElementById("shuffle-mode-label").textContent =
    shuffleMode === "off" ? "Off" : shuffleMode === "album" ? "Album" : "All";
};

// Volume
volumeControl.oninput = () => {
  audio.volume = parseFloat(volumeControl.value);
};

// Stop all music
document.getElementById("stop-all").onclick = () => {
  audio.pause();
  audio.currentTime = 0;
  isPlaying = false;
  document.getElementById("play-pause").textContent = "▶️";
};

// Play/pause button
document.getElementById("play-pause").onclick = () => {
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    document.getElementById("play-pause").textContent = "▶️";
  } else {
    if (currentTrackIndex === -1 && trackQueue.length > 0) {
      currentTrackIndex = 0;
      playCurrentTrack();
    } else {
      audio.play();
      isPlaying = true;
      document.getElementById("play-pause").textContent = "⏸️";
    }
  }
};

// Next/Prev
document.getElementById("next-track").onclick = () => playNextTrack();
document.getElementById("prev-track").onclick = () => {
  if (currentTrackIndex > 0) {
    currentTrackIndex--;
    playCurrentTrack();
  }
};

// Clear queue
document.getElementById("clear-queue").onclick = () => {
  trackQueue = [];
  currentTrackIndex = -1;
  updateQueueUI();
};

// Toggle visualizer
document.getElementById("effects-toggle").onclick = () => {
  visualizerEnabled = !visualizerEnabled;
  const canvas = document.getElementById("audio-visualiser");
  canvas.classList.toggle("hidden", !visualizerEnabled);
  if (visualizerEnabled) setupVisualizer();
};

function setupVisualizer() {
  const canvas = document.getElementById("audio-visualiser");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvasCtx = canvas.getContext("2d");
  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaElementSource(audio);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);

  function draw() {
    if (!visualizerEnabled) return;
    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i];
      const r = barHeight + 25 * (i / bufferLength);
      const g = 250 * (i / bufferLength);
      const b = 50;
      canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
      canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  }
  draw();
}

// Play a track (called by HTML), does NOT autoplay
window.playTrack = function (fileName, element) {
  const albumInfo = element.closest(".album-info");
  const albumName = albumInfo ? albumInfo.querySelector("strong").textContent : "Unknown Album";
  const artistLine = albumInfo ? albumInfo.childNodes[2]?.textContent : "Unknown Artist";
  const artist = artistLine?.split(" - ")[1] || "Unknown Artist";

  trackQueue.push({ fileName, albumName, artist });
  updateQueueUI();
};

function playCurrentTrack() {
  if (currentTrackIndex >= 0 && currentTrackIndex < trackQueue.length) {
    const { fileName, albumName, artist } = trackQueue[currentTrackIndex];
    audio.src = fileName;
    currentTrackName.textContent = `${fileName} | ${albumName} | ${artist}`;
    audio.play();
    isPlaying = true;
    document.getElementById("play-pause").textContent = "⏸️";
    updateListen(fileName);
  }
}

function playNextTrack() {
  if (shuffleMode === "album") {
    const currentAlbum = trackQueue[currentTrackIndex]?.albumName;
    const sameAlbumTracks = trackQueue.filter(t => t.albumName === currentAlbum);
    const randomTrack = sameAlbumTracks[Math.floor(Math.random() * sameAlbumTracks.length)];
    currentTrackIndex = trackQueue.indexOf(randomTrack);
  } else if (shuffleMode === "all") {
    currentTrackIndex = Math.floor(Math.random() * trackQueue.length);
  } else {
    currentTrackIndex++;
    if (currentTrackIndex >= trackQueue.length) currentTrackIndex = 0;
  }
  playCurrentTrack();
}

// When track ends
audio.onended = () => {
  playNextTrack();
};

function updateQueueUI() {
  queueList.innerHTML = "";
  trackQueue.forEach((track, index) => {
    const li = document.createElement("li");
    li.textContent = `${track.fileName} (${track.albumName})`;
    li.onclick = () => {
      currentTrackIndex = index;
      playCurrentTrack();
    };
    queueList.appendChild(li);
  });
}
