const audio = document.getElementById("audio-player");
const nowPlaying = document.getElementById("now-playing");
const playBtn = document.getElementById("toggle-play");
const volumeSlider = document.getElementById("volume");
const downloadBtn = document.getElementById("download-btn");

let isPlaying = false;
let currentTrack = "";

// Track play trigger
function playTrack(filename, element) {
  const path = filename;
  currentTrack = filename;

  audio.src = path;
  audio.play();
  nowPlaying.textContent = "Playing: " + filename.replace(".mp3", "");
  isPlaying = true;
  playBtn.textContent = "⏸️";
  downloadBtn.href = path;

  // Enable download if membership system later approves it
  const userHasMembership = false; // Update this when membership is implemented
  downloadBtn.style.display = userHasMembership ? "inline-block" : "none";
}

// Toggle play/pause
playBtn.addEventListener("click", () => {
  if (isPlaying) {
    audio.pause();
    playBtn.textContent = "▶️";
  } else {
    audio.play();
    playBtn.textContent = "⏸️";
  }
  isPlaying = !isPlaying;
});

// Volume control
volumeSlider.addEventListener("input", () => {
  audio.volume = volumeSlider.value;
});

// Make player draggable
const player = document.getElementById("simple-player");
const dragBar = document.getElementById("drag-bar");
let isDragging = false;
let offsetX, offsetY;

dragBar.addEventListener("mousedown", (e) => {
  isDragging = true;
  offsetX = e.clientX - player.offsetLeft;
  offsetY = e.clientY - player.offsetTop;
});

document.addEventListener("mousemove", (e) => {
  if (isDragging) {
    player.style.left = e.clientX - offsetX + "px";
    player.style.top = e.clientY - offsetY + "px";
  }
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});
