const playlistList = document.getElementById("playlistList");
const trackList = document.getElementById("trackList");
const playlistNameInput = document.getElementById("playlistName");
const createBtn = document.getElementById("createPlaylist");
const playlistTitle = document.getElementById("playlistTitle");
const backButton = document.getElementById("backButton");
const searchInput = document.getElementById("searchInput");
const playlistCover = document.getElementById("playlistCover");
let selectedPlaylist = null;

function loadPlaylists() {
  const playlists = JSON.parse(localStorage.getItem("playlists") || "[]");
  playlistList.innerHTML = "";

  playlists.forEach((playlist, index) => {
    const div = document.createElement("div");
    div.className = "playlist-card";
    div.onclick = () => openPlaylist(index);
    div.innerHTML = `
      <img src="${playlist.cover || 'https://github.com/Crzypebble/CrzyclanHomePage/blob/main/default-cover.jpg?raw=true'}" alt="cover">
      <h3>${playlist.name}</h3>
    `;
    playlistList.appendChild(div);
  });
}

createBtn.onclick = () => {
  const name = playlistNameInput.value.trim();
  if (!name) return;
  const playlists = JSON.parse(localStorage.getItem("playlists") || "[]");
  playlists.push({ name, cover: "", tracks: [] });
  localStorage.setItem("playlists", JSON.stringify(playlists));
  playlistNameInput.value = "";
  loadPlaylists();
};

function openPlaylist(index) {
  selectedPlaylist = index;
  const playlists = JSON.parse(localStorage.getItem("playlists"));
  const playlist = playlists[index];
  document.getElementById("playlistSection").style.display = "none";
  document.getElementById("tracksSection").style.display = "block";
  playlistTitle.textContent = playlist.name;
  renderTracks(playlist.tracks);
  playlistCover.value = "";
}

backButton.onclick = () => {
  document.getElementById("tracksSection").style.display = "none";
  document.getElementById("playlistSection").style.display = "block";
  loadPlaylists();
};

function renderTracks(tracks) {
  trackList.innerHTML = "";
  if (!tracks || tracks.length === 0) {
    trackList.innerHTML = `<p>No tracks in this playlist. Search above to add songs.</p>`;
    return;
  }

  tracks.forEach((t, i) => {
    const div = document.createElement("div");
    div.className = "track-card";
    div.innerHTML = `
      <img src="${t.cover}" alt="cover">
      <div><strong>${t.title}</strong><br>${t.artist}</div>
      <audio controls src="${t.audio}"></audio>
      <button onclick="removeTrack(${i})">Remove</button>
    `;
    trackList.appendChild(div);
  });
}

function removeTrack(i) {
  const playlists = JSON.parse(localStorage.getItem("playlists"));
  playlists[selectedPlaylist].tracks.splice(i, 1);
  localStorage.setItem("playlists", JSON.stringify(playlists));
  renderTracks(playlists[selectedPlaylist].tracks);
}

searchInput.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase();
  if (selectedPlaylist === null) return;

  const uploads = JSON.parse(localStorage.getItem("uploadedTracks") || "[]");
  const community = JSON.parse(localStorage.getItem("communityTracks") || "[]");
  const official = JSON.parse(localStorage.getItem("officialTracks") || "[]");

  const results = [...uploads, ...community, ...official].filter(
    t => t.title.toLowerCase().includes(term) || t.artist.toLowerCase().includes(term)
  );

  if (results.length === 0) return;

  trackList.innerHTML = "";
  results.forEach((t) => {
    const div = document.createElement("div");
    div.className = "track-card";
    div.innerHTML = `
      <img src="${t.cover}" alt="cover">
      <div><strong>${t.title}</strong><br>${t.artist}</div>
      <audio controls src="${t.audio}"></audio>
      <button onclick='addTrack(${JSON.stringify(t)})'>Add</button>
    `;
    trackList.appendChild(div);
  });
});

function addTrack(track) {
  const playlists = JSON.parse(localStorage.getItem("playlists"));
  playlists[selectedPlaylist].tracks.push(track);
  localStorage.setItem("playlists", JSON.stringify(playlists));
  renderTracks(playlists[selectedPlaylist].tracks);
}

playlistCover.addEventListener("change", function() {
  const file = this.files[0];
  if (!file || selectedPlaylist === null) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const playlists = JSON.parse(localStorage.getItem("playlists"));
    playlists[selectedPlaylist].cover = e.target.result;
    localStorage.setItem("playlists", JSON.stringify(playlists));
    loadPlaylists();
  };
  reader.readAsDataURL(file);
});

loadPlaylists();
