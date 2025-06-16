const audio = document.getElementById("audio-player");
const nowPlaying = document.getElementById("now-playing");
const playBtn = document.getElementById("toggle-play");
const volumeSlider = document.getElementById("volume");
const downloadBtn = document.getElementById("download-btn");
const player = document.getElementById("simple-player");
const dragBar = document.getElementById("drag-bar");

let isPlaying = false;
let currentTrack = "";

// ===========================
// ✅ Membership via Secret Code
// ===========================

const VALID_CODE = "CRZYMEMBER2025"; // set your secret code here
let userHasMembership = false;

// Prompt for membership code
function promptMembershipCode() {
  const code = prompt("Enter your membership code:");
  if (code === VALID_CODE) {
    localStorage.setItem("crzyclan_membership", "true");
    userHasMembership = true;
    alert("Membership activated! You can now download music.");
    updateDownloadVisibility();
  } else {
    alert("Invalid code.");
  }
}

// Check local storage on load
if (localStorage.getItem("crzyclan_membership") === "true") {
  userHasMembership = true;
}

// ===========================
// ✅ Player Controls
// ===========================

function playTrack(filename) {
  currentTrack = filename;
  audio.src = filename;
  audio.play();
  nowPlaying.textContent = "Playing: " + filename.replace(".mp3", "");
  playBtn.textContent = "⏸️";
  downloadBtn.href = filename;
  isPlaying = true;
  updateDownloadVisibility();
}

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

volumeSlider.addEventListener("input", () => {
  audio.volume = volumeSlider.value;
});

// ===========================
// ✅ Draggable Player
// ===========================

let isDragging = false;
let dragOffsetX, dragOffsetY;

dragBar.addEventListener("mousedown", function (e) {
  isDragging = true;
  dragOffsetX = e.clientX - player.offsetLeft;
  dragOffsetY = e.clientY - player.offsetTop;
  document.body.style.userSelect = "none";
});

document.addEventListener("mousemove", function (e) {
  if (isDragging) {
    player.style.left = e.clientX - dragOffsetX + "px";
    player.style.top = e.clientY - dragOffsetY + "px";
  }
});

document.addEventListener("mouseup", function () {
  isDragging = false;
  document.body.style.userSelect = "";
});

// ===========================
// ✅ Update Download Visibility
// ===========================

function updateDownloadVisibility() {
  downloadBtn.style.display = userHasMembership ? "inline-block" : "none";
}

// ===========================
// ✅ Hook Up Clickable Tracks
// ===========================

document.querySelectorAll(".track").forEach(track => {
  track.addEventListener("click", () => {
    const file = track.dataset.file;
    if (file) {
      playTrack(file);
    }
  });
});

// ===========================
// ✅ Optional: Button to Enter Membership Code
// ===========================

// You can call this when needed, e.g.:
// Add a button somewhere in music.html like:
// <button onclick="promptMembershipCode()">Enter Membership Code</button>

window.promptMembershipCode = promptMembershipCode;
