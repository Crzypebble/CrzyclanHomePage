const playlistContainer = document.getElementById("playlistContainer");
const newPlaylistBtn = document.getElementById("newPlaylistBtn");
const searchInput = document.getElementById("playlistSearch");
const popup = document.getElementById("popup");

// Combined song list (auto sources from Crzyclan, community, uploads)
const allSongs = [
  { title: "Why Do I Try?", artist: "Crzypebble", source: "Official" },
  { title: "Thick And The Bad", artist: "Crzypebble", source: "Official" },
  { title: "Gas", artist: "Crzypebble", source: "Official" },
  { title: "Collide", artist: "Crzypebble", source: "Official" },
  { title: "Waves", artist: "DJ Moon", source: "Community" },
  { title: "Shadow Pulse", artist: "Nebula", source: "Community" },
  { title: "Untitled Track 01", artist: "User Upload", source: "Uploads" },
  { title: "Trigger Run", artist: "Days Before Death", source: "Official" },
  { title: "Cart Was Full", artist: "AI Gen", source: "AI Generated" },
];

function showPopup(message, color = "#1db954") {
  popup.textContent = message;
  popup.style.background = color;
  popup.classList.add("show");
  setTimeout(() => popup.classList.remove("show"), 1800);
}

function loadPlaylists() {
  const playlists = JSON.parse(localStorage.getItem("playlists") || "[]");
  playlistContainer.innerHTML = "";

  playlists.forEach((pl, i) => {
    const card = document.createElement("div");
    card.classList.add("playlist-card");
    card.innerHTML = `
      <img src="${pl.cover || 'https://github.com/Crzypebble/CrzyclanHomePage/blob/main/default-cover.jpg?raw=true'}" class="playlist-cover">
      <h4>${pl.name}</h4>
      <small>${pl.songs?.length || 0} songs</small>
    `;
    card.addEventListener("click", () => openPlaylist(i));
    playlistContainer.appendChild(card);
  });
}

function openPlaylist(index) {
  const playlists = JSON.parse(localStorage.getItem("playlists") || "[]");
  const pl = playlists[index];
  if (!pl) return;

  document.body.innerHTML = `
  <header><h1>${pl.name}</h1></header>
  <nav class="music-subnav">
    <a href="music.html">🎧 CRZYCLAN Library</a>
    <a href="community-music.html">🎵 Community Music</a>
    <a href="music-projects.html">🎚️ Music Projects</a>
    <a href="upload.html">⬆️ Upload Track</a>
    <a href="personal-library.html" class="active">🎤 Personal Library</a>
  </nav>

  <main id="playlistView">
    <div class="playlist-toolbar">
      <button onclick="location.reload()">⬅️ Back</button>
      <button onclick="renamePlaylist(${index})">✏️ Rename</button>
      <button onclick="deletePlaylist(${index})">🗑️ Delete</button>
    </div>

    <div class="song-search-area">
      <input type="text" id="songSearch" placeholder="Search all site songs...">
      <div id="songResults"></div>
    </div>

    <h3>Playlist Songs</h3>
    <div id="playlistSongs">
      ${
        pl.songs?.length
          ? pl.songs.map((s, si) => `
            <div class="song-item">
              <span><b>${s.title}</b> - ${s.artist} (${s.source})</span>
              <button onclick="removeSong(${index}, ${si})">Remove</button>
            </div>`).join("")
          : "<p>No songs yet.</p>"
      }
    </div>
  </main>
  <div id="popup" class="popup"></div>
  `;

  const searchBar = document.getElementById("songSearch");
  const resultsDiv = document.getElementById("songResults");

  searchBar.addEventListener("input", () => {
    const term = searchBar.value.toLowerCase();
    resultsDiv.innerHTML = "";
    if (!term) return;

    const matches = allSongs.filter(
      (s) =>
        s.title.toLowerCase().includes(term) ||
        s.artist.toLowerCase().includes(term)
    );

    if (!matches.length) {
      resultsDiv.innerHTML = `<p>No results found.</p>`;
      return;
    }

    matches.forEach((song) => {
      const item = document.createElement("div");
      item.classList.add("song-result");
      item.innerHTML = `
        <span><b>${song.title}</b> - ${song.artist} <small>(${song.source})</small></span>
        <button>Add</button>
      `;
      item.querySelector("button").addEventListener("click", () => {
        addSongToPlaylist(index, song);
      });
      resultsDiv.appendChild(item);
    });
  });
}

function addSongToPlaylist(index, song) {
  const playlists = JSON.parse(localStorage.getItem("playlists") || "[]");
  playlists[index].songs.push(song);
  localStorage.setItem("playlists", JSON.stringify(playlists));
  showPopup("✅ Song added!");
  openPlaylist(index);
}

function removeSong(pIndex, sIndex) {
  const playlists = JSON.parse(localStorage.getItem("playlists") || "[]");
  playlists[pIndex].songs.splice(sIndex, 1);
  localStorage.setItem("playlists", JSON.stringify(playlists));
  showPopup("🗑️ Song removed");
  openPlaylist(pIndex);
}

function renamePlaylist(index) {
  const playlists = JSON.parse(localStorage.getItem("playlists") || "[]");
  const newName = prompt("Enter new name:", playlists[index].name);
  if (!newName) return showPopup("Rename cancelled", "#ccc");
  playlists[index].name = newName;
  localStorage.setItem("playlists", JSON.stringify(playlists));
  showPopup("✏️ Playlist renamed");
  openPlaylist(index);
}

function deletePlaylist(index) {
  const playlists = JSON.parse(localStorage.getItem("playlists") || "[]");
  playlists.splice(index, 1);
  localStorage.setItem("playlists", JSON.stringify(playlists));
  showPopup("❌ Playlist deleted", "red");
  location.reload();
}

newPlaylistBtn.addEventListener("click", () => {
  const name = prompt("Enter playlist name:");
  if (!name) return showPopup("Playlist name required", "red");

  const playlists = JSON.parse(localStorage.getItem("playlists") || "[]");
  playlists.push({ name, cover: null, songs: [] });
  localStorage.setItem("playlists", JSON.stringify(playlists));
  showPopup("🎶 Playlist created!");
  loadPlaylists();
});

searchInput.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase();
  const cards = document.querySelectorAll(".playlist-card");
  cards.forEach((card) => {
    const title = card.querySelector("h4").textContent.toLowerCase();
    card.style.display = title.includes(term) ? "flex" : "none";
  });
});

loadPlaylists();
