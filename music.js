const audio = new Audio();
const audioPlayer = document.getElementById("audio-player");
const nowPlaying = document.getElementById("now-playing");
const playPauseBtn = document.getElementById("play-pause-btn");
const volumeSlider = document.getElementById("volume-slider");

// Dummy audio URLs — replace these with your actual file URLs
const trackMap = {
  "Welcome To Hell": "audio/WelcomeToHell.mp3",
  "Smoke Bitches": "audio/SmokeBitches.mp3",
  "THE BOULDER:Rocks And Pebbles": "audio/TheBoulder.mp3",
  "Gas": "audio/Gas.mp3",
  "Collide": "audio/Collide.mp3",
  "Hurt Pebble": "audio/HurtPebble.mp3",
  "The Fading Light Of The Renaissance": "audio/FadingLight.mp3",
  "WHY": "audio/WHY.mp3",
  "Straight Ahead": "audio/StraightAhead.mp3",
  "Kiss Of Death(Memories)": "audio/KissOfDeath.mp3"
  // Add more mappings as needed
};

// Attach event listeners to each track
document.querySelectorAll(".album-tracks li, .track-list li").forEach(track => {
  track.addEventListener("click", () => {
    const title = track.textContent.trim().split(" - ")[1] || track.textContent.trim();
    if (trackMap[title]) {
      audio.src = trackMap[title];
      audio.play();
      nowPlaying.textContent = "Now Playing: " + title;
      audioPlayer.style.display = "flex";
    } else {
      alert("Audio file for this track is missing or not mapped.");
    }
  });
});

// Playback controls
playPauseBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    playPauseBtn.textContent = "⏸️";
  } else {
    audio.pause();
    playPauseBtn.textContent = "▶️";
  }
});

volumeSlider.addEventListener("input", () => {
  audio.volume = volumeSlider.value;
});
