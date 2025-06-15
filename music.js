const audioPlayer = document.getElementById('audioPlayer');
const audioManager = document.getElementById('audio-manager');
const currentTrackName = document.getElementById('currentTrackName');
const volumeSlider = document.getElementById('volumeSlider');

let currentTrack = '';
let queue = [];
let currentIndex = -1;

function playTrack(filename) {
  currentTrack = filename;
  currentIndex = queue.indexOf(filename);
  if (currentIndex === -1) {
    queue.push(filename);
    currentIndex = queue.length - 1;
  }
  audioPlayer.src = filename;
  audioPlayer.play();
  audioManager.classList.remove('hidden');
  currentTrackName.textContent = `Playing: ${filename}`;
}

function togglePlay() {
  if (audioPlayer.paused) {
    audioPlayer.play();
  } else {
    audioPlayer.pause();
  }
}

function nextTrack() {
  if (currentIndex < queue.length - 1) {
    currentIndex++;
    playTrack(queue[currentIndex]);
  }
}

function prevTrack() {
  if (currentIndex > 0) {
    currentIndex--;
    playTrack(queue[currentIndex]);
  }
}

volumeSlider.addEventListener('input', () => {
  audioPlayer.volume = volumeSlider.value;
});
