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
