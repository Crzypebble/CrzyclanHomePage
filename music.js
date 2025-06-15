const audio = new Audio();
let currentTrack = null;

const nowPlaying = document.getElementById("now-playing");
const playPauseBtn = document.getElementById("play-pause-btn");
const volumeSlider = document.getElementById("volume-slider");

const trackItems = document.querySelectorAll(".track-item");

trackItems.forEach(item => {
  item.addEventListener("click", () => {
    const src = item.getAttribute("data-src");

    if (audio.src.includes(src)) {
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    } else {
      playTrack(src, item.textContent, item);
    }

    highlightCurrentTrack(item);
  });
});

function playTrack(src, title, clickedItem) {
  audio.src = src;
  audio.play();
  nowPlaying.textContent = "Now Playing: " + title;

  trackItems.forEach(item => item.classList.remove("playing"));
  clickedItem.classList.add("playing");
}

function highlightCurrentTrack(activeItem) {
  trackItems.forEach(item => item.classList.remove("playing"));
  activeItem.classList.add("playing");
}

playPauseBtn.addEventListener("click", () => {
  if (audio.src) {
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }
});

audio.addEventListener("play", () => {
  playPauseBtn.textContent = "⏸️";
});

audio.addEventListener("pause", () => {
  playPauseBtn.textContent = "▶️";
});

volumeSlider.addEventListener("input", () => {
  audio.volume = volumeSlider.value;
});
