const playlistContainer = document.getElementById("playlistContainer");
const newPlaylistBtn = document.getElementById("newPlaylistBtn");
const searchInput = document.getElementById("playlistSearch");
const popup = document.getElementById("popup");

function showPopup(message, color = "#ff2965") {
  popup.textContent = message;
  popup.style.background = color;
  popup.classList.add("show");
  setTimeout(() => popup.classList.remove("show"), 2000);
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
    <main id="playlistView">
      <button onclick="location.reload()">⬅️ Back</button>
      <div class="playlist-options">
        <button onclick="renamePlaylist(${index})">✏️ Rename</button>
        <button onclick="deletePlaylist(${index})">🗑️ Delete</button>
        <button onclick="addSong(${index})">🎵 Add Song</button>
      </div>
      <h3>Songs</h3>
      <div id="playlistSongs">
        ${
          pl.songs && pl.songs.length
            ? pl.songs
                .map(
                  (s, si) => `
          <div class="song-item">
            <span>${s.title} - ${s.artist}</span>
            <button onclick="removeSong(${index}, ${si})">Remove</button>
          </div>`
                )
                .join("")
            : "<p>No songs yet.</p>"
        }
      </div>
    </main>`;
}

function removeSong(pIndex, sIndex) {
  const playlists = JSON.parse(localStorage.getItem("playlists") || "[]");
  playlists[pIndex].songs.splice(sIndex, 1);
  localStorage.setItem("playlists", JSON.stringify(playlists));
  showPopup("Song removed", "#00ffbf");
  openPlaylist(pIndex);
}

function renamePlaylist(index) {
  const playlists = JSON.parse(localStorage.getItem("playlists") || "[]");
  const newName = prompt("Enter new name:", playlists[index].name);
  if (!newName) return showPopup("Rename cancelled", "#ccc");
  playlists[index].name = newName;
  localStorage.setItem("playlists", JSON.stringify(playlists));
  showPopup("Playlist renamed", "#00ffbf");
  openPlaylist(index);
}

function deletePlaylist(index) {
  const playlists = JSON.parse(localStorage.getItem("playlists") || "[]");
  playlists.splice(index, 1);
  localStorage.setItem("playlists", JSON.stringify(playlists));
  showPopup("Playlist deleted", "red");
  location.reload();
}

function addSong(index) {
  const playlists = JSON.parse(localStorage.getItem("playlists") || "[]");
  const title = prompt("Song title:");
  const artist = prompt("Artist name:");
  if (!title || !artist) return showPopup("Invalid song info", "red");

  playlists[index].songs.push({ title, artist });
  localStorage.setItem("playlists", JSON.stringify(playlists));
  showPopup("Song added!", "#00ffbf");
  openPlaylist(index);
}

newPlaylistBtn.addEventListener("click", () => {
  const name = prompt("Enter playlist name:");
  if (!name) return showPopup("Playlist name required", "red");

  const playlists = JSON.parse(localStorage.getItem("playlists") || "[]");
  playlists.push({ name, cover: null, songs: [] });
  localStorage.setItem("playlists", JSON.stringify(playlists));
  showPopup("Playlist created!", "#00ffbf");
  loadPlaylists();
});

searchInput.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase();
  const cards = document.querySelectorAll(".playlist-card");
  cards.forEach(card => {
    const title = card.querySelector("h4").textContent.toLowerCase();
    card.style.display = title.includes(term) ? "flex" : "none";
  });
});

loadPlaylists();
