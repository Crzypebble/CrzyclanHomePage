let currentTrack = null;
let isPlaying = false;
let isMember = false;

const audioPlayer = document.getElementById("audio-player");
const playButton = document.getElementById("toggle-play");
const volumeSlider = document.getElementById("volume");
const downloadBtn = document.getElementById("download-btn");
const nowPlaying = document.getElementById("now-playing");

// Allow members to unlock download feature
function verifyMembershipCode() {
  const code = document.getElementById("membershipCode").value.trim();
  const status = document.getElementById("membership-status");

  if (code === "CRZYMEMBER2025") {
    isMember = true;
    status.textContent = "✅ Membership verified. Downloads unlocked!";
    status.style.color = "lime";
  } else {
    isMember = false;
    status.textContent = "❌ Invalid code. Try again or contact CRZYCLAN.";
    status.style.color = "red";
  }
}

// Play selected track
function playTrack(filename, element) {
  const trackTitle = element.textContent.trim();
  currentTrack = filename;
  audioPlayer.src = filename;
  audioPlayer.play();
  isPlaying = true;

  nowPlaying.textContent = "Now Playing: " + trackTitle;
  playButton.textContent = "⏸️";

  // Enable download if membership verified
  if (isMember) {
    downloadBtn.href = filename;
    downloadBtn.style.display = "inline-block";
  } else {
    downloadBtn.style.display = "none";
  }
}

// Toggle play/pause
playButton.addEventListener("click", () => {
  if (!currentTrack) return;

  if (isPlaying) {
    audioPlayer.pause();
    playButton.textContent = "▶️";
    isPlaying = false;
  } else {
    audioPlayer.play();
    playButton.textContent = "⏸️";
    isPlaying = true;
  }
});

// Volume control
volumeSlider.addEventListener("input", () => {
  audioPlayer.volume = volumeSlider.value;
});

// Reset play button when song ends
audioPlayer.addEventListener("ended", () => {
  playButton.textContent = "▶️";
  isPlaying = false;
});

// DRAGGABLE MUSIC PLAYER
const player = document.getElementById("simple-player");
const dragBar = document.getElementById("drag-bar");

let isDragging = false;
let offsetX, offsetY;

dragBar.addEventListener("mousedown", (e) => {
  isDragging = true;
  offsetX = e.clientX - player.offsetLeft;
  offsetY = e.clientY - player.offsetTop;
  document.body.style.userSelect = "none"; // Prevent text selection
});

document.addEventListener("mousemove", (e) => {
  if (isDragging) {
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    player.style.left = `${x}px`;
    player.style.top = `${y}px`;
  }
});

document.addEventListener("mouseup", () => {
  isDragging = false;
  document.body.style.userSelect = ""; // Restore selection
});
