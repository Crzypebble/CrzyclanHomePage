// main.js
document.addEventListener("DOMContentLoaded", () => {
  showTab('home');
});

function toggleAlbum(albumId) {
  const element = document.getElementById(`${albumId}-tracks`);
  element.style.display = element.style.display === 'none' ? 'block' : 'none';
}

function playTrack(trackId) {
  const trackMap = {
    track1: { title: "Signal Collapse", src: "https://example.com/signal-collapse.mp3" },
    track2: { title: "Digital Ghosts", src: "https://example.com/digital-ghosts.mp3" },
    track3: { title: "Flesh and Signal", src: "https://example.com/flesh-and-signal.mp3" },
    track4: { title: "Mind in Red", src: "https://example.com/mind-in-red.mp3" },
    track5: { title: "Zed Hunt OST - Main Menu", src: "https://example.com/zed-menu.mp3" },
    track6: { title: "Rust & Dreams", src: "https://example.com/rust-and-dreams.mp3" }
    // Add more tracks here
  };

  const track = trackMap[trackId];
  if (!track) return;

  document.getElementById('track-title').innerText = track.title;
  document.getElementById('audio-source').src = track.src;
  document.getElementById('audio-player').load();
  document.getElementById('music-player').style.display = 'block';
}
